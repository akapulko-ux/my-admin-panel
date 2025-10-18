import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Timestamp, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthContext";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict, translatePropertyType, translateConstructionStatus } from "../lib/utils";
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
import { deleteFileFromFirebaseStorage } from "../utils/firebaseStorage";
import imageCompression from "browser-image-compression";
import { getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [profile, setProfile] = useState({ name: '', email: '', telegram: '', phone: '', phoneCode: '+62', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  // Переиспользуем модалку авторизации из публичной галереи (не используется)
  const silentTriedRef = useRef(false);
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const formatPrice = (price) => {
    if (!price) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
              phoneCode: d.phoneCode || '+62',
              logoUrl: d.logoUrl || ''
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
        const leadsData = leadsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => (l.propertyId && myPropIds.has(l.propertyId)) || l.agentId === currentUser.uid);
        
        // Загружаем данные объектов для заявок
        const leadsWithProperties = await Promise.all(
          leadsData.map(async (lead) => {
            if (!lead.propertyId) return { ...lead, property: null };
            try {
              const propDoc = await getDoc(doc(db, 'properties', lead.propertyId));
              return {
                ...lead,
                property: propDoc.exists() ? { id: propDoc.id, ...propDoc.data() } : null
              };
            } catch (e) {
              console.error('Error loading property for lead:', e);
              return { ...lead, property: null };
            }
          })
        );
        setMyLeads(leadsWithProperties);
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
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">{t.accountPage.logout}</Button>
          </div>
        </div>

        {/* Профиль */}
        <details className="border rounded-md bg-white" open>
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="text-xl font-semibold">{t.accountPage.profileTitle}</span>
            <span className="flex items-center gap-2">
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
              <span className="text-gray-500">▼</span>
            </span>
          </summary>
          <div className="px-4 pb-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm text-gray-600">{t.accountPage.profile?.photo}</label>
              <div className="flex items-center gap-3">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border">
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">—</div>
                    )}
                  </div>
                  {profile.logoUrl && (
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border shadow flex items-center justify-center text-gray-600 hover:text-red-600"
                      title={t.common?.delete || 'Удалить'}
                      disabled={uploadingAvatar}
                      onClick={async () => {
                        if (!profile.logoUrl) return;
                        setUploadingAvatar(true);
                        try {
                          await deleteFileFromFirebaseStorage(profile.logoUrl);
                          setProfile(p => ({ ...p, logoUrl: '' }));
                          if (currentUser) {
                            const userRef = doc(db, 'users', currentUser.uid);
                            await updateDoc(userRef, { logoUrl: null });
                          }
                        } catch (err) {
                          console.error('delete avatar error', err);
                          toast.error(t.common?.photoDeleteError || 'Ошибка удаления фото');
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      setUploadingAvatar(true);
                      try {
                        // Сжатие и конвертация в JPEG
                        const compressionOptions = {
                          maxSizeMB: 2,
                          maxWidthOrHeight: 1280,
                          useWebWorker: false,
                          fileType: 'image/jpeg',
                          initialQuality: 0.8
                        };
                        let jpegBlob = null;
                        try {
                          const compressionPromise = imageCompression(file, compressionOptions);
                          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('compression_timeout')), 5000));
                          jpegBlob = await Promise.race([compressionPromise, timeoutPromise]);
                        } catch (err) {
                          console.warn('imageCompression timed out/failed, fallback to canvas JPEG', err);
                          try {
                            jpegBlob = await new Promise((resolve, reject) => {
                              const img = new Image();
                              const url = URL.createObjectURL(file);
                              img.onload = () => {
                                const maxSide = 1280;
                                let { width, height } = img;
                                const scale = Math.min(1, maxSide / Math.max(width, height));
                                width = Math.max(1, Math.round(width * scale));
                                height = Math.max(1, Math.round(height * scale));
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, width, height);
                                canvas.toBlob((blob) => {
                                  URL.revokeObjectURL(url);
                                  if (blob) resolve(blob); else reject(new Error('toBlob returned null'));
                                }, 'image/jpeg', 0.8);
                              };
                              img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load error')); };
                              img.src = url;
                            });
                          } catch (e2) {
                            console.warn('canvas conversion failed, using original file', e2);
                            jpegBlob = file;
                          }
                        }
                        const finalFile = new File([jpegBlob], `${currentUser.uid}.jpg`, { type: 'image/jpeg' });

                        // Загрузка в Storage по фиксированному пути /profile_images/{uid}.jpg
                        const appInst = getApp();
                        const storage = getStorage(appInst, "gs://bali-estate-1130f.firebasestorage.app");
                        const fileRef = ref(storage, `profile_images/${currentUser.uid}.jpg`);
                        const snapshot = await uploadBytes(fileRef, finalFile, { contentType: 'image/jpeg' });
                        const url = await getDownloadURL(snapshot.ref);

                        setProfile(p => ({ ...p, logoUrl: url }));
                        if (currentUser) {
                          try {
                            const userRef = doc(db, 'users', currentUser.uid);
                            await updateDoc(userRef, { logoUrl: url });
                          } catch (err) {
                            console.error('save logoUrl to Firestore error', err);
                          }
                        }
                      } catch (error) {
                        console.error('avatar upload error', error);
                        toast.error(t.common?.fileUploadError || 'Ошибка загрузки файла');
                      } finally {
                        setUploadingAvatar(false);
                        if (avatarInputRef.current) avatarInputRef.current.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (t.common?.uploading || 'Загрузка...') : (t.accountPage.profile?.uploadPhoto)}
                  </Button>
                  {/* Кнопка очистки заменена на крестик на миниатюре */}
                </div>
              </div>
            </div>
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
              <input
                className="border rounded px-2 py-1 w-full"
                value={profile.telegram}
                placeholder="@user_telegram"
                pattern="^@[a-z0-9_]+$"
                onChange={(e) => {
                  const raw = e.target.value || '';
                  const trimmed = raw.trim();
                  if (trimmed === '') {
                    setProfile(p => ({ ...p, telegram: '' }));
                    return;
                  }
                  const startsWithAt = trimmed.startsWith('@');
                  const text = startsWithAt ? trimmed.slice(1) : trimmed;
                  const sanitized = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  if (startsWithAt) {
                    // Разрешаем промежуточное состояние с одиночным '@'
                    if (trimmed === '@' || sanitized === '') {
                      setProfile(p => ({ ...p, telegram: '@' }));
                    } else {
                      setProfile(p => ({ ...p, telegram: '@' + sanitized }));
                    }
                  } else {
                    if (sanitized === '') {
                      setProfile(p => ({ ...p, telegram: '' }));
                    } else {
                      setProfile(p => ({ ...p, telegram: '@' + sanitized }));
                    }
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">{t.accountPage.profile.phone} / Whatsapp</label>
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
                  phoneCode: profile.phoneCode || '+62',
                  logoUrl: profile.logoUrl || null
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
          {/* Интеграция с Telegram размещена внутри Профиля */}
          <div className="px-4 pb-4 pt-0 sm:col-span-2">
            <div className="border-t pt-4 mt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">{ts.telegram.title}</span>
              </div>
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

        {/* Секция Интеграции с Telegram удалена, так как перенесена в Профиль */}

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
                  <div className={`${isMobile ? 'flex items-center' : 'flex items-center gap-2'}`}>
                    {!isMobile && (
                      <>
                        <label className="text-sm text-gray-700 whitespace-nowrap">{t.accountPage.premiumLinkLabel}:</label>
                        <input value={shareLink} readOnly className="flex-1 border rounded px-2 py-1 text-gray-900 bg-gray-50" />
                      </>
                    )}
                    <Button onClick={handleCopy} className={`${isMobile ? 'w-full' : ''}`}>{t.accountPage.copyButton}</Button>
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
          <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw]' : 'max-w-2xl'}`}>
            <DialogHeader>
              <DialogTitle>{t.subscriptionModal?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {paymentUrl ? (
                <iframe title="Premium Payment" src={paymentUrl} className={`w-full ${isMobile ? 'h-[400px]' : 'h-[540px]'} border rounded`} allow="payment *;" />
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
                <Link
                  key={p.id}
                  to={`/public/property/${p.id}`}
                  className={`flex items-stretch transition-colors ${
                    isMobile ? 'flex-col gap-3 p-3' : 'gap-4 p-4'
                  } hover:bg-gray-50`}
                >
                  <div
                    className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                      isMobile ? 'w-full h-40' : 'w-48 h-32 min-w-48'
                    }`}
                  >
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
                  <div className="flex flex-col text-gray-900 space-y-0.5 flex-1">
                    {p.isHidden && (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-red-600 text-white w-fit">
                        {t.propertyDetail.removedFromListing || 'Убран из листинга'}
                      </span>
                    )}

                    {(p.complexName || p.complex || p.propertyName) && (
                      <span className={`font-semibold leading-none text-black ${isMobile ? 'text-base' : 'text-lg'}`}>
                        {safeDisplay(p.complexName || p.complex || p.propertyName)}
                      </span>
                    )}

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

                    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                      <span className="text-sm text-gray-600">{t.propertiesGallery.priceLabel}:</span>
                      <span className={`font-semibold leading-none ${isMobile ? 'text-base' : 'text-lg'}`}>
                        {formatPrice(p.price)}
                      </span>
                    </div>

                    {p.type && (
                      <span className="text-sm">
                        <span className="text-gray-600">{t.propertiesGallery.typeLabel}:</span>
                        <span className="ml-2">{translatePropertyType(safeDisplay(p.type), language)}</span>
                      </span>
                    )}
                    {p.area && (
                      <span className="text-sm">
                        <span className="text-gray-600">{t.propertiesGallery.areaLabel}:</span>
                        <span className="ml-2">{safeDisplay(p.area)} {t.propertiesGallery.areaText}</span>
                      </span>
                    )}
                    {p.bedrooms !== undefined && p.bedrooms !== null && p.bedrooms !== "" && (
                      <span className="text-sm">
                        <span className="text-gray-600">{t.propertiesGallery.bedroomsLabel}:</span>
                        <span className="ml-2">{p.bedrooms === 0 ? t.propertiesGallery.studio : safeDisplay(p.bedrooms)}</span>
                      </span>
                    )}
                    {p.unitsCount !== undefined && p.unitsCount !== null && p.unitsCount !== "" && (
                      <span className="text-sm">
                        <span className="text-gray-600">{t.propertiesGallery.unitsCountText}:</span>
                        <span className="ml-2">{safeDisplay(p.unitsCount)}</span>
                      </span>
                    )}
                    {p.status && (
                      <span className="text-sm">
                        <span className="text-gray-600">{t.propertiesGallery.statusLabel}:</span>
                        <span className="ml-2">{translateConstructionStatus(safeDisplay(p.status), language)}</span>
                      </span>
                    )}
                    {p.district && (
                      <span className="text-sm">
                        <span className="text-gray-600">{t.propertiesGallery.districtLabel}:</span>
                        <span className="ml-2">{translateDistrict(safeDisplay(p.district), language)}</span>
                      </span>
                    )}
                    {role !== 'застройщик' && p.developer && (
                      <span className="text-sm text-gray-600">
                        {t.propertiesGallery.developerText} {safeDisplay(p.developer)}
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex-shrink-0 ${isMobile ? 'mt-2' : 'ml-auto'} text-sm text-red-600`}
                    onClick={(e) => e.preventDefault()}
                  >
                    {(() => {
                      const isEmpty = (val) => val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val));

                      const characteristics = [];
                      const documents = [];

                      // Основные поля (Характеристики)
                      if (isEmpty(p.bedrooms)) characteristics.push(t.propertyDetail.bedrooms);
                      if (isEmpty(p.area)) characteristics.push(t.propertyDetail.area);
                      {
                        const typeStr = String(p.type || '').trim().toLowerCase();
                        const noLandAreaTypes = ['апартаменты', 'апарт-вилла', 'дюплекс', 'таунхаус', 'пентхаус'];
                        if (isEmpty(p.landArea) && !noLandAreaTypes.includes(typeStr)) {
                          characteristics.push(t.propertyDetail.landArea);
                        }
                      }
                      if (isEmpty(p.bathrooms)) characteristics.push(t.propertyDetail.bathrooms);
                      if (isEmpty(p.floors)) characteristics.push(t.propertyDetail.floors);
                      if (isEmpty(p.status)) characteristics.push(t.propertyDetail.constructionStatus);
                      if (isEmpty(p.pool) || p.pool === 'none') characteristics.push(t.propertyDetail.pool);
                      if (isEmpty(p.expectedCost) && (p.status === 'Проект' || p.status === 'Строится')) characteristics.push(t.propertyDetail.expectedCost);

                      // Собственность + годы для лизхолда
                      if (isEmpty(p.ownershipForm)) {
                        characteristics.push(t.propertyDetail.ownership);
                      } else {
                        const leaseholdVariants = ['Leashold', 'Leasehold'];
                        if (leaseholdVariants.includes(String(p.ownershipForm))) {
                          if (isEmpty(p.leaseYears)) {
                            characteristics.push(`${t.propertyDetail.ownership} (${t.propertyDetail.years})`);
                          }
                        }
                      }

                      if (isEmpty(p.completionDate)) characteristics.push(t.propertyDetail.completionDate);
                      if (isEmpty(p.managementCompany)) characteristics.push(t.propertyDetail.managementCompany);

                      // Документы
                      if (isEmpty(p.legalCompanyName)) documents.push(t.propertyDetail.legalCompanyName);
                      const npwpVal = p.npwp ?? p.taxNumber;
                      if (isEmpty(npwpVal)) documents.push(t.propertyDetail.taxNumber);
                      const pkkprVal = p.pkkprFile ?? p.pkkpr;
                      if (isEmpty(pkkprVal)) documents.push(t.propertyDetail.landUsePermit);
                      if (isEmpty(p.dueDiligenceFileURL)) documents.push(t.propertyDetail.dueDiligence);
                      if (isEmpty(p.pkkprFileURL)) documents.push(t.propertyDetail.pkkprFile);
                      if (isEmpty(p.shgb)) documents.push(t.propertyDetail.landRightsCertificate);
                      const hasPbg = !isEmpty(p.pbg);
                      const hasSlf = !isEmpty(p.slf);
                      const hasImb = !isEmpty(p.imb);
                      if (!hasPbg && !hasSlf && !hasImb) {
                        documents.push(`${t.propertyDetail.buildingPermit} / ${t.propertyDetail.buildingReadinessCertificate} / ${t.propertyDetail.buildingPermitIMB}`);
                      }

                      // Планировка
                      const hasLayout = !isEmpty(p.layoutFileURL) || !isEmpty(p.layout);
                      if (!hasLayout) documents.push(t.propertyDetail.layout);

                      // Ожидаемый ROI: добавляем, если не заполнен manualRoi
                      if (isEmpty(p.manualRoi)) characteristics.push(t.propertyDetail.expectedRoi);

                      if (characteristics.length === 0 && documents.length === 0) return null;
                      return (
                        <div className={`border ${isMobile ? 'mt-2' : 'ml-4'} border-red-200 bg-red-50 rounded-md p-2 max-w-xs`}>
                          <div className="font-semibold text-red-700 mb-1">{t.propertiesGallery.missingFieldsTitle}:</div>
                          {characteristics.length > 0 && (
                            <div className="mb-1">
                              <div className="text-red-700 font-medium">{t.propertyDetail.characteristicsSection}</div>
                              <ul className="list-disc list-inside space-y-0.5">
                                {characteristics.map((label) => (
                                  <li key={`c-${label}`} className="text-red-700">{label}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {documents.length > 0 && (
                            <div>
                              <div className="text-red-700 font-medium">{t.propertyDetail.documentsSection}</div>
                              <ul className="list-disc list-inside space-y-0.5">
                                {documents.map((label) => (
                                  <li key={`d-${label}`} className="text-red-700">{label}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="text-xs text-red-700 mt-2">{t.propertiesGallery.missingFieldsHint}</div>
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
                <div key={l.id} className={`p-4 ${isMobile ? 'space-y-2' : 'flex gap-4'}`}>
                  <div className={`${isMobile ? 'space-y-2' : 'w-1/2 space-y-2'}`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">{t.propertyDetail.requestDate}</span>
                      <span className="text-sm text-gray-900">{l.createdAt instanceof Timestamp ? l.createdAt.toDate().toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">{t.propertyDetail.clientName}</span>
                      <span className="text-sm font-medium text-gray-900">{safeDisplay(l.name)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">{t.propertyDetail.clientPhone}</span>
                      <span className="text-sm text-gray-900">
                        {l.phoneCode ? `${l.phoneCode} ${safeDisplay(l.phone)}` : safeDisplay(l.phone)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">{t.propertyDetail.clientMessenger}</span>
                      <span className="text-sm text-gray-900">{safeDisplay(l.messenger)}</span>
                    </div>
                  </div>
                  {l.property && (
                    <Link to={`/public/property/${l.propertyId}`} className={`block ${isMobile ? 'mt-3' : 'w-1/2'}`}>
                      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full">
                        <div className="flex gap-3">
                          <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200">
                            {l.property.images?.length ? (
                              <img src={l.property.images[0]} alt={safeDisplay(l.property.type)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <Building2 className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 py-2 pr-2">
                            {(l.property.complexName || l.property.complex || l.property.propertyName) && (
                              <div className="font-semibold text-sm text-gray-900 line-clamp-1">
                                {safeDisplay(l.property.complexName || l.property.complex || l.property.propertyName)}
                              </div>
                            )}
                            <div className="text-sm text-gray-900 mt-1">
                              {formatPrice(l.property.price)}
                            </div>
                            {l.property.area && (
                              <div className="text-xs text-gray-600 mt-1">
                                {safeDisplay(l.property.area)} {t.propertiesGallery.areaText}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
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


