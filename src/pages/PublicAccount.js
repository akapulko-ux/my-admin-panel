import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Timestamp, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthContext";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translatePropertyType } from "../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { countryDialCodes } from "../lib/countryDialCodes";
import { Building2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

function PublicAccount() {
  const { currentUser, logout, role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [myProperties, setMyProperties] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [shareLink, setShareLink] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [profile, setProfile] = useState({ name: '', email: '', telegram: '', phone: '', phoneCode: '+62' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    async function ensurePremiumLink() {
      try {
        if (!currentUser) return;
        const normalizedRole = String(role || '').toLowerCase();
        const isPremiumAgent = normalizedRole === 'premium agent' || normalizedRole === 'премиум агент' || normalizedRole === 'premium_agent' || normalizedRole === 'премиум-агент';
        const isPremiumDeveloper = normalizedRole === 'премиум застройщик' || normalizedRole === 'premium developer' || normalizedRole === 'premium_developer' || normalizedRole === 'премиум-застройщик';
        if (!isPremiumAgent && !isPremiumDeveloper) {
          setShareLink("");
          return;
        }
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        const existing = snap.exists() ? (snap.data()?.premiumPublicLinkToken || "") : "";
        let token = existing;
        if (!token) {
          token = `${currentUser.uid}-${Math.random().toString(36).slice(2, 10)}`;
          try {
            await updateDoc(userRef, { premiumPublicLinkToken: token });
            // Публичная мапа токена → метаданные (для анонимного доступа)
            const u = snap.exists() ? (snap.data() || {}) : {};
            await setDoc(doc(db, 'publicSharedLinks', token), {
              ownerId: currentUser.uid,
              ownerName: u.displayName || u.name || u.email || '',
              role: isPremiumAgent ? 'premium agent' : 'premium developer',
              phone: u.phone || null,
              phoneCode: u.phoneCode || null,
              enabled: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            }, { merge: true });
          } catch (e) {
            console.error('Failed to save premiumPublicLinkToken', e);
          }
        } else {
          // Обеспечим наличие/актуальность публичной мапы для уже существующего токена
          try {
            const u = snap.exists() ? (snap.data() || {}) : {};
            await setDoc(doc(db, 'publicSharedLinks', token), {
              ownerId: currentUser.uid,
              ownerName: u.displayName || u.name || u.email || '',
              role: isPremiumAgent ? 'premium agent' : 'premium developer',
              phone: u.phone || null,
              phoneCode: u.phoneCode || null,
              enabled: true,
              updatedAt: Timestamp.now()
            }, { merge: true });
          } catch (e) {
            console.error('Ensure publicSharedLinks mapping failed', e);
          }
        }
        const base = window.location.origin;
        setShareLink(`${base}/public/shared/${encodeURIComponent(token)}`);
      } catch (e) {
        console.error('ensurePremiumLink error', e);
      }
    }
    ensurePremiumLink();
  }, [currentUser, role]);

  const handleCopy = useCallback(async () => {
    try {
      if (!shareLink) return;
      await navigator.clipboard.writeText(shareLink);
      setCopyMsg(t.accountPage.copiedMessage);
      setTimeout(() => setCopyMsg(""), 1500);
    } catch (e) {
      console.error('copy error', e);
    }
  }, [shareLink, t.accountPage.copiedMessage]);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  useEffect(() => {
    async function loadData() {
      try {
        if (!currentUser) return;
        // Профиль пользователя
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const d = userSnap.data();
            setProfile({
              name: d.displayName || '',
              email: d.email || '',
              telegram: d.telegram || '',
              phone: d.phone || '',
              phoneCode: d.phoneCode || '+62'
            });
          }
        } catch (e) { console.error('load profile error', e); }
        // Мои объекты
        let myProps = [];
        try {
          const normalizedRole = String(role || '').toLowerCase();
          const isPremiumDeveloper = normalizedRole === 'премиум застройщик' || normalizedRole === 'premium developer' || normalizedRole === 'premium_developer' || normalizedRole === 'премиум-застройщик';

          if (isPremiumDeveloper) {
            // Определяем застройщика по developerId пользователя (приоритет),
            // а также используем имя застройщика как резервный вариант
            let developerName = null;
            let devId = null;
            try {
              const userDocRef = doc(db, 'users', currentUser.uid);
              const userDocSnap = await getDoc(userDocRef);
              devId = userDocSnap.exists() ? (userDocSnap.data()?.developerId || null) : null;
              if (devId) {
                const devSnap = await getDoc(doc(db, 'developers', String(devId)));
                if (devSnap.exists()) {
                  developerName = devSnap.data()?.name || null;
                }
              }
            } catch (e) {
              console.error('resolve developerName error', e);
            }

            const byIdAndName = new Map();
            try {
              if (devId) {
                const qById = query(collection(db, 'properties'), where('developerId', '==', String(devId)));
                const snapById = await getDocs(qById);
                snapById.docs.forEach(d => byIdAndName.set(d.id, { id: d.id, ...d.data() }));
              }
            } catch (e) {
              console.error('load properties by developerId error', e);
            }
            try {
              if (developerName) {
                const qByName = query(collection(db, 'properties'), where('developer', '==', developerName));
                const snapByName = await getDocs(qByName);
                snapByName.docs.forEach(d => byIdAndName.set(d.id, { id: d.id, ...d.data() }));
              }
            } catch (e) {
              console.error('load properties by developer name error', e);
            }

            myProps = Array.from(byIdAndName.values());
          } else {
            const propsSnap = await getDocs(collection(db, 'properties'));
            myProps = propsSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.createdBy === currentUser.uid);
          }
        } catch (e) {
          console.error('load my properties error', e);
          myProps = [];
        }
        setMyProperties(myProps);

        // Мои заявки (таблица clientLeads, где propertyId в моих объектах) и заявки, привязанные к моему agentId из общей ссылки
        const leadsSnap = await getDocs(collection(db, 'clientLeads'));
        const myPropIds = new Set(myProps.map(p => p.id));
        const leads = leadsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => (l.propertyId && myPropIds.has(l.propertyId)) || l.agentId === currentUser.uid);
        setMyLeads(leads);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser, role]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout error', e);
    }
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="mb-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.propertyDetail?.backButton || 'Назад'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{t.accountPage.title}</h1>
            {(() => {
              const normalizedRole = String(role || '').toLowerCase();
              const isPremiumAgent = normalizedRole === 'premium agent' || normalizedRole === 'премиум агент';
              const isPremiumDeveloper = normalizedRole === 'премиум застройщик' || normalizedRole === 'premium developer' || normalizedRole === 'premium_developer';
              if (!isPremiumAgent && !isPremiumDeveloper) return null;
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  {isPremiumDeveloper ? t.accountPage.premiumDeveloperBadge : t.accountPage.premiumBadge}
                </span>
              );
            })()}
          </div>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">{t.accountPage.logout}</Button>
        </div>

        {/* Персональная ссылка — секция видна всем; управление доступностью внутри */}
        <details className="border rounded-md bg-white">
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="text-xl font-semibold">{t.accountPage.premiumLinkTitle}</span>
            <span className="text-gray-500">▼</span>
          </summary>
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 mb-3">{t.accountPage.premiumLinkDescription}</p>
            {(() => {
            const normalizedRole = String(role || '').toLowerCase();
            const isPremiumAgent = normalizedRole === 'premium agent' || normalizedRole === 'премиум агент' || normalizedRole === 'premium_agent' || normalizedRole === 'премиум-агент';
            const isPremiumDeveloper = normalizedRole === 'премиум застройщик' || normalizedRole === 'premium developer' || normalizedRole === 'premium_developer' || normalizedRole === 'премиум-застройщик';
            if (isPremiumAgent || isPremiumDeveloper) {
              return (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 whitespace-nowrap">{t.accountPage.premiumLinkLabel}:</label>
                    <input value={shareLink} readOnly className="flex-1 border rounded px-2 py-1 text-gray-900 bg-gray-50" />
                    <Button onClick={handleCopy}>{t.accountPage.copyButton}</Button>
                  </div>
                  {copyMsg && <div className="text-green-600 text-sm mt-2">{copyMsg}</div>}
                </>
              );
            }
            return (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700">{t.accountPage.premiumOnlyMessage}</div>
                <Button onClick={() => setIsSubscriptionOpen(true)}>{t.accountPage.subscribeButton}</Button>
              </div>
            );
            })()}
          </div>
        </details>

        {/* Профиль */}
        <details className="border rounded-md bg-white">
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="text-xl font-semibold">{t.accountPage.profileTitle}</span>
            <span className="text-gray-500">▼</span>
          </summary>
          <div className="px-4 pb-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">{t.accountPage.profile.name}</label>
              <input className="border rounded px-2 py-1 w-full" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">{t.accountPage.profile.email}</label>
              <input className="border rounded px-2 py-1 bg-gray-50 text-gray-700 w-full" value={profile.email} readOnly />
            </div>
            {/* Язык не отображаем по требованию */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">{t.accountPage.profile.telegram}</label>
              <input className="border rounded px-2 py-1 w-full" value={profile.telegram} onChange={(e) => setProfile(p => ({ ...p, telegram: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Телефон / Whatsapp</label>
              <div className="flex gap-2">
                <Select value={profile.phoneCode || '+62'} onValueChange={(v) => setProfile(p => ({ ...p, phoneCode: v }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-auto">
                    {countryDialCodes.map(({ code, label }) => (
                      <SelectItem key={code} value={code}>{code} {label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  className="border rounded px-2 py-1 flex-1 w-full"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value.replace(/[^\d\s-]/g, '') }))}
                  placeholder={language === 'ru' ? 'номер телефона' : language === 'id' ? 'nomor telepon' : 'phone number'}
                />
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 mt-1 flex items-center gap-3 sm:col-span-2">
            <Button disabled={saving} onClick={async () => {
              if (!currentUser) return;
              try {
                setSaving(true);
                const userRef = doc(db, 'users', currentUser.uid);
                // Простая валидация телефона: должны быть цифры, длина >= 5
                const digits = String(profile.phone || '').replace(/\D/g, '');
                if (digits.length < 5) {
                  setSaveMsg(t.accountPage.profile.saveError);
                  setSaving(false);
                  return;
                }
                await updateDoc(userRef, {
                  displayName: profile.name,
                  name: profile.name,
                  email: profile.email,
                  telegram: profile.telegram,
                  phone: profile.phone,
                  phoneCode: profile.phoneCode || '+62'
                });
                setSaveMsg(t.accountPage.profile.saved);
                setTimeout(() => setSaveMsg(''), 1500);
              } catch (e) {
                console.error('save profile error', e);
                setSaveMsg(t.accountPage.profile.saveError);
                setTimeout(() => setSaveMsg(''), 2000);
              } finally {
                setSaving(false);
              }
            }}>{t.accountPage.profile.save}</Button>
            {saveMsg && <div className="text-sm text-gray-600">{saveMsg}</div>}
          </div>
        </details>

        {/* Модальное окно подписки как в публичной галерее */}
        <Dialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.subscriptionModal?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{t.subscriptionModal?.description}</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {(t.subscriptionModal?.features || []).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <Button className="w-full" onClick={async () => {
                try {
                  if (!currentUser) { return; }
                  setPaymentUrl('https://premium.it-agent.pro/product-page/it-agent-premium');
                  setIsPaymentModalOpen(true);
                } catch (e) {
                  console.error('open premium subscription link error', e);
                } finally {
                  setIsSubscriptionOpen(false);
                }
              }}>
                {t.subscriptionModal?.subscribeButton}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Модальное окно оплаты (iframe) */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.subscriptionModal?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {paymentUrl ? (
                <iframe title="Premium Payment" src={paymentUrl} className="w-full h-[540px] border rounded" allow="payment *;" />
              ) : (
                <div className="text-sm text-gray-500">Initializing…</div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <details className="border rounded-md bg-white">
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="text-xl font-semibold">{t.accountPage.myProperties}</span>
            <span className="text-gray-500">▼</span>
          </summary>
          {myProperties.length === 0 ? (
            <div className="text-gray-500">{t.accountPage.noProperties}</div>
          ) : (
            <div className="divide-y">
              {myProperties.map((p) => (
                <Link key={p.id} to={`/public/property/${p.id}`} className="flex items-stretch gap-4 p-4 hover:bg-gray-50">
                  <div className="relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 w-48 h-32 min-w-48">
                    {p.images?.length ? (
                      <img src={p.images[0]} alt={safeDisplay(p.type)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col text-gray-900 space-y-1">
                    <span className="text-lg font-semibold">{safeDisplay(p.propertyName || p.complex || p.type)}</span>
                    <span className="text-sm"><span className="text-gray-600">Тип:</span><span className="ml-2">{translatePropertyType(safeDisplay(p.type), language)}</span></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </details>

        <details className="border rounded-md bg-white">
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="text-xl font-semibold">{t.accountPage.myLeads}</span>
            <span className="text-gray-500">▼</span>
          </summary>
          {myLeads.length === 0 ? (
            <div className="text-gray-500">{t.accountPage.noLeads}</div>
          ) : (
            <div className="divide-y">
              {myLeads.map((l) => (
                <div key={l.id} className="p-4">
                  <div className="text-sm text-gray-600">{l.createdAt instanceof Timestamp ? l.createdAt.toDate().toLocaleString() : ''}</div>
                  <div className="font-medium text-gray-900">{safeDisplay(l.name)} — {safeDisplay(l.phone)} ({safeDisplay(l.messenger)})</div>
                  {l.propertyId && (
                    <Link to={`/public/property/${l.propertyId}`} className="text-blue-600 hover:underline text-sm">{t.accountPage.goToProperty}</Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </details>
      </div>
    </div>
  );
}

export default PublicAccount;


