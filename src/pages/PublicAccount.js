import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { Building2, Bot, Check, X, ExternalLink } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import toast from 'react-hot-toast';
import { signInWithCustomToken, setPersistence, browserLocalPersistence } from "firebase/auth";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { auth } from "../firebaseConfig";

function PublicAccount() {
  const { currentUser, logout, role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const ts = translations[language].settings;
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
  // Переиспользуем модалку авторизации из публичной галереи (не используется)
  const silentTriedRef = useRef(false);

  // Telegram integration state (same as Settings)
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const BOT_USERNAME = 'it_agent_admin_bot';

  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const openConnectDialog = () => {
    const code = generateVerificationCode();
    setVerificationCode(code);
    setShowConnectDialog(true);
  };

  const checkConnectionStatus = () => {
    const checkInterval = setInterval(async () => {
      try {
        if (!currentUser) { clearInterval(checkInterval); return; }
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        if (userData && userData.telegramConnected && userData.telegramChatId) {
          setTelegramChatId(userData.telegramChatId);
          setIsConnected(true);
          setShowConnectDialog(false);
          clearInterval(checkInterval);
          toast.success('Телеграм успешно подключен!');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('check telegram connection error', error);
      }
    }, 1000);
    // Автоостановка через 60 секунд
    setTimeout(() => { try { clearInterval(checkInterval); } catch {} }, 60000);
  };

  const connectTelegramAutomatically = async () => {
    setIsLoading(true);
    try {
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        telegramVerificationCode: verificationCode,
        telegramConnectingAt: new Date(),
        telegramConnected: false
      });

      const telegramLink = `https://t.me/${BOT_USERNAME}?start=${verificationCode}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        try {
          window.location.href = telegramLink;
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              const tempLink = document.createElement('a');
              tempLink.href = telegramLink;
              tempLink.target = '_blank';
              tempLink.rel = 'noopener noreferrer';
              document.body.appendChild(tempLink);
              tempLink.click();
              document.body.removeChild(tempLink);
            }
          }, 1000);
        } catch (error) {
          console.error('Ошибка при переходе в Telegram:', error);
          toast.error('Не удалось открыть Telegram. Скопируйте ссылку вручную.');
        }
      } else {
        window.open(telegramLink, '_blank');
      }

      checkConnectionStatus();
      toast.success('Перейдите в телеграм и нажмите "Start" для завершения подключения');
    } finally {
      setIsLoading(false);
    }
  };

  // copyTelegramLink был удалён, так как кнопка копирования не используется

  const disconnectTelegram = async () => {
    setIsLoading(true);
    try {
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        telegramChatId: null,
        telegramConnected: null,
        telegramConnectedAt: null,
        telegramConnectingAt: null,
        telegramVerificationCode: null
      });
      setTelegramChatId('');
      setIsConnected(false);
      toast.success('Телеграм отключен');
    } finally {
      setIsLoading(false);
    }
  };

  // Ранее здесь был редирект неавторизованных на главную. Убрано по требованию.

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

  // Убираем принудительное открытие модалки авторизации. Страница ждёт токен.

  // Fallback: если WebView не успел вызвать window.itAgentSilentLogin,
  // пробуем тихий вход прямо на странице при наличии window.__FIREBASE_CUSTOM_TOKEN
  useEffect(() => {
    let timer = null;
    let attempts = 0;
    const maxAttempts = 80; // ~20 секунд
    async function trySilentLogin() {
      try {
        if (currentUser) { if (timer) clearInterval(timer); return; }
        const token = typeof window !== 'undefined' ? window.__FIREBASE_CUSTOM_TOKEN : null;
        if (token && typeof token === 'string') {
          if (silentTriedRef.current) { if (timer) clearInterval(timer); return; }
          silentTriedRef.current = true;
          try { await setPersistence(auth, browserLocalPersistence); } catch (_) {}
          await signInWithCustomToken(auth, token);
          if (timer) clearInterval(timer);
        } else {
          attempts++;
          if (attempts >= maxAttempts && timer) clearInterval(timer);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('[PublicAccount] silent signInWithCustomToken error', e);
        if (timer) clearInterval(timer);
      }
    }
    timer = setInterval(trySilentLogin, 250);
    // также одноразовый вызов сразу
    trySilentLogin();
    return () => { if (timer) clearInterval(timer); };
  }, [currentUser]);

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
            if (d.telegramChatId) {
              setTelegramChatId(d.telegramChatId);
              setIsConnected(true);
            } else {
              setTelegramChatId('');
              setIsConnected(false);
            }
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

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  // Если пользователь не авторизован — больше не открываем модалку; но до этого условия мы уже вернули спиннер

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
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">{t.accountPage.logout}</Button>
          </div>
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

        {/* Премиум подписка */}
        <details className="border rounded-md bg-white">
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="text-xl font-semibold">{t.subscriptionModal?.title}</span>
            <span className="text-gray-500">▼</span>
          </summary>
          <div className="px-4 pb-4 space-y-3">
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

        {/* Интеграция с Telegram (как в настройках) */}
        <details className="border rounded-md bg-white">
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="text-xl font-semibold">{ts.telegram.title}</span>
            <span className="text-gray-500">▼</span>
          </summary>
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 mb-3">{ts.telegram.description}</p>

            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    {ts.telegram.connected}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {ts.telegram.chatId}: {telegramChatId}
                  </span>
                </div>
                <Button variant="outline" onClick={disconnectTelegram} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  {ts.telegram.disconnect}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    <X className="h-3 w-3 mr-1" />
                    {ts.telegram.notConnected}
                  </Badge>
                </div>
                <Button onClick={openConnectDialog}>
                  <Bot className="h-4 w-4 mr-2" />
                  {ts.telegram.connect}
                </Button>
              </div>
            )}
          </div>
        </details>

        {/* Диалог подключения телеграм */}
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{ts.telegram.dialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md mb-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-lg">@{BOT_USERNAME}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">{ts.telegram.autoConnectInstructions}</p>
                <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                  <p className="text-sm font-medium text-yellow-800">
                    🔑 {ts.telegram.codeLabel} <code className="bg-yellow-200 px-2 py-1 rounded">{verificationCode}</code>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">{ts.telegram.codeInstructions}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2">
              <Button onClick={connectTelegramAutomatically} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {ts.telegram.waitingConnection}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {ts.telegram.connectViaTelegram}
                  </div>
                )}
              </Button>
            </DialogFooter>
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
            <div className="pt-2 border-t mt-2">
              <p className="text-xs text-gray-600">
                {t.paymentModal?.supportText}
              </p>
              <a
                href={`https://wa.me/6282147824968?text=${encodeURIComponent('Здравствуйте! Нужна помощь с оплатой/подключением премиум подписки.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center mt-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                {t.paymentModal?.supportButton}
              </a>
            </div>
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
                    {/* Бейдж "На модерации" поверх фото */}
                    {p.moderation === true && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          {t.moderation?.onModeration || 'На модерации'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col text-gray-900 space-y-1">
                    <span className="text-lg font-semibold">{safeDisplay(p.propertyName || p.complex || p.type)}</span>
                    <span className="text-sm"><span className="text-gray-600">Тип:</span><span className="ml-2">{translatePropertyType(safeDisplay(p.type), language)}</span></span>
                    {(() => {
                      const ratingRaw = p.reliabilityRating;
                      const rating = Number.isFinite(Number(ratingRaw)) ? Math.max(0, Math.min(5, parseInt(ratingRaw))) : null;
                      if (!rating) return null;
                      return (
                        <div className="flex items-center gap-2" aria-label={`${t.propertyDetail.reliabilityRating}: ${rating}`}>
                          <span className="text-xs text-gray-600">{t.propertyDetail.reliabilityRating}</span>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`${idx < rating ? 'text-yellow-400' : 'text-gray-300'} text-2xl leading-none`}
                            >
                              {idx < rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
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


