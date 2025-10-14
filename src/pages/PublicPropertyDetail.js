import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, addDoc, collection, serverTimestamp, getDocs, where, query, updateDoc, limit } from "firebase/firestore";
import { Building2, Map as MapIcon, Home, Droplet, Star, Square, Flame, Sofa, Waves, Bed, Ruler, MapPin, Hammer, Layers, Bath, FileText, Calendar, DollarSign, Settings } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { useAuth } from "../AuthContext";
import PropertyPlacementModal from "../components/PropertyPlacementModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { AdaptiveTooltip } from "../components/ui/tooltip";
import {
  translateDistrict,
  translatePropertyType,
  translateAreaUnit,
  translateBuildingType,
  translateConstructionStatus,
  translateLandStatus,
  translatePoolStatus,
  translateOwnership,
  formatArea,
} from "../lib/utils";
import { showError, showSuccess } from "../utils/notifications";
import { Badge } from "../components/ui/badge";
import { translateWithCache } from "../utils/aiTranslation";
import { trackPropertyVisit } from "../utils/pageAnalytics";
import FullScreenImageView from "../components/FullScreenImageView";

function PublicPropertyDetail() {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [roiPercent, setRoiPercent] = useState(null);
  const { language } = useLanguage();
  const t = translations[language];
  const { currentUser, role } = useAuth();
  const isSharedView = location.pathname.startsWith('/public/shared/');
  const effectiveCurrentUser = isSharedView ? null : currentUser;
  const effectiveRole = isSharedView ? null : role;
  const [sharedAllowed, setSharedAllowed] = useState(!isSharedView);
  const [sharedCheckLoading, setSharedCheckLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  // const [entitlementActive, setEntitlementActive] = useState(false);
  const [usdRate, setUsdRate] = useState(null);
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMessenger, setLeadMessenger] = useState('whatsapp');
  const [leadSending, setLeadSending] = useState(false);
  const [sharedOwnerUid, setSharedOwnerUid] = useState("");
  const [sharedOwnerPhoneCode, setSharedOwnerPhoneCode] = useState("");
  const [sharedOwnerPhone, setSharedOwnerPhone] = useState("");
  const [premiumDevPhoneCode, setPremiumDevPhoneCode] = useState("");
  const [premiumDevPhone, setPremiumDevPhone] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  // Кэш предзагруженных изображений для галереи
  const preloadedImagesRef = useRef(new Set());
  // Двойной буфер для плавной смены изображений
  const [displayedImgUrl, setDisplayedImgUrl] = useState(null);
  const [overlayImgUrl, setOverlayImgUrl] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const fadeTimerRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Двойной буфер для полноэкранного режима
  const [lbDisplayedUrl, setLbDisplayedUrl] = useState(null);
  const [lbOverlayUrl, setLbOverlayUrl] = useState(null);
  const [isLbFading, setIsLbFading] = useState(false);
  const lbFadeTimerRef = useRef(null);
  const [isLightboxTransitioning, setIsLightboxTransitioning] = useState(false);
  // Автоскролл при раскрытии секции документов
  const docsDetailsRef = useRef(null);
  const docsContentRef = useRef(null);
  
  // Состояние для свайпов
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Утилита: попытаться вернуть оптимизированный по ширине URL для популярных CDN.
  const getOptimizedImageUrl = useCallback((url, targetWidth) => {
    try {
      if (!url || !targetWidth) return url;
      const w = Math.max(1, Math.floor(targetWidth));
      // Cloudinary
      if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
      }
      // Unsplash
      if (url.includes('images.unsplash.com')) {
        const joiner = url.includes('?') ? '&' : '?';
        return `${url}${joiner}auto=format&w=${w}`;
      }
      // Shopify CDN
      if (url.includes('cdn.shopify.com')) {
        const joiner = url.includes('?') ? '&' : '?';
        return `${url}${joiner}width=${w}`;
      }
      // imgix-style
      if (url.includes('imgix.net')) {
        const joiner = url.includes('?') ? '&' : '?';
        return `${url}${joiner}auto=format&fit=max&w=${w}`;
      }
      // Если провайдер не поддерживается — возвращаем исходный URL
      return url;
    } catch {
      return url;
    }
  }, []);

  const buildSrcSet = useCallback((url) => {
    if (!url) return undefined;
    const widths = [480, 768, 1024, 1366, 1920, 2560];
    return widths.map((w) => `${getOptimizedImageUrl(url, w)} ${w}w`).join(', ');
  }, [getOptimizedImageUrl]);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "—";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Функция для сохранения перевода в БД
  const saveTranslationToDB = async (propertyId, language, translatedText) => {
    try {
      const propertyRef = doc(db, "properties", propertyId);
      
      // Получаем текущие данные объекта
      const propertySnap = await getDoc(propertyRef);
      if (!propertySnap.exists()) {
        console.error('Property not found');
        return;
      }

      const currentData = propertySnap.data();
      const descriptions = currentData.descriptions || {};
      
      // Добавляем новый перевод
      descriptions[language] = translatedText;
      
      // Обновляем документ
      await updateDoc(propertyRef, {
        descriptions: descriptions
      });
      
      console.log(`✅ Translation saved to DB: ${language}`);
    } catch (error) {
      console.error('Error saving translation to DB:', error);
    }
  };

  // Функция для работы с переводами описания
  const handleDescriptionTranslation = useCallback(async (propertyData, targetLanguage) => {
    if (!propertyData?.description || !targetLanguage) {
      setTranslatedDescription(propertyData?.description || '');
      return;
    }

    try {
      // Проверяем, есть ли уже сохраненный перевод на нужном языке
      const descriptions = propertyData.descriptions || {};
      
      if (descriptions[targetLanguage]) {
        // Если перевод уже есть в БД, используем его
        console.log(`📋 Using cached translation from DB for ${targetLanguage}`);
        setTranslatedDescription(descriptions[targetLanguage]);
        return;
      }

      // Если перевода нет, выполняем перевод
      setIsTranslating(true);
      console.log(`🔄 Translating description to ${targetLanguage}`);
      
      const translated = await translateWithCache(propertyData.description, targetLanguage);
      
      // Сохраняем перевод в БД
      if (translated && translated !== propertyData.description) {
        await saveTranslationToDB(propertyData.id, targetLanguage, translated);
        console.log(`💾 Translation saved to DB for ${targetLanguage}`);
      }
      
      setTranslatedDescription(translated);
    } catch (error) {
      console.error('Error handling description translation:', error);
      setTranslatedDescription(propertyData.description);
    } finally {
      setIsTranslating(false);
    }
  }, [setTranslatedDescription, setIsTranslating]);

  // Функция для перехода к управлению объектом
  const handleManageProperty = () => {
    navigate(`/property/${id}/standalone`);
  };

  // Функции для обработки свайпов
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (isTransitioning) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImg < property.images.length - 1) {
      setCurrentImg(prev => prev + 1);
    }
    if (isRightSwipe && currentImg > 0) {
      setCurrentImg(prev => prev - 1);
    }
  };

  // Lookahead-прелоад соседних изображений (next/prev)
  useEffect(() => {
    const urls = property?.images || [];
    if (!urls.length) return;
    const preload = (idx) => {
      if (idx < 0 || idx >= urls.length) return;
      const url = urls[idx];
      if (!url || preloadedImagesRef.current.has(url)) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { preloadedImagesRef.current.add(url); };
      img.onerror = () => {};
      img.src = url;
    };
    preload(currentImg + 1);
    preload(currentImg - 1);
  }, [property, currentImg]);

  // Последовательная предзагрузка всех изображений в фоне после полной загрузки страницы
  useEffect(() => {
    if (!property?.images?.length) return;
    let cancelled = false;
    const urls = property.images.slice();

    const preloadSequentially = async () => {
      for (const url of urls) {
        if (cancelled) break;
        if (!url || preloadedImagesRef.current.has(url)) continue;
        try {
          await new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
              // decode() подтверждает, что изображение декодировано и готово к отрисовке
              if (typeof img.decode === 'function') {
                img.decode().then(resolve).catch(resolve);
              } else {
                resolve();
              }
            };
            img.onerror = () => resolve();
            img.src = url;
          });
          preloadedImagesRef.current.add(url);
        } catch {}
      }
    };

    const start = () => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => { preloadSequentially(); }, { timeout: 2000 });
      } else {
        setTimeout(preloadSequentially, 0);
      }
    };

    if (document.readyState === 'complete') {
      start();
    } else {
      const onLoad = () => start();
      window.addEventListener('load', onLoad, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener('load', onLoad);
      };
    }

    return () => { cancelled = true; };
  }, [property]);

  // Инициализируем видимое изображение при загрузке объекта
  useEffect(() => {
    if (property?.images?.length) {
      if (!displayedImgUrl) {
        setDisplayedImgUrl(property.images[currentImg] || property.images[0]);
      }
    }
  }, [property, currentImg, displayedImgUrl]);

  // Плавная смена изображений: ждать загрузки/декодирования следующего кадра, затем фейд
  useEffect(() => {
    const urls = property?.images || [];
    if (!urls.length) return;
    const targetUrl = urls[currentImg];
    if (!targetUrl || targetUrl === displayedImgUrl) return;

    let cancelled = false;
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    const prefetchAndFade = async () => {
      try {
        setIsTransitioning(true);
        await new Promise((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            if (typeof img.decode === 'function') {
              img.decode().then(resolve).catch(resolve);
            } else {
              resolve();
            }
          };
          img.onerror = () => resolve();
          img.src = targetUrl;
        });
        if (cancelled) return;
        setOverlayImgUrl(targetUrl);
        setIsFading(true);
        fadeTimerRef.current = setTimeout(() => {
          if (cancelled) return;
          setDisplayedImgUrl(targetUrl);
          setOverlayImgUrl(null);
          setIsFading(false);
          setIsTransitioning(false);
        }, 220);
      } catch {}
    };

    prefetchAndFade();
    return () => {
      cancelled = true;
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setIsTransitioning(false);
    };
  }, [currentImg, property, displayedImgUrl]);

  // Инициализация изображения лайтбокса
  useEffect(() => {
    if (!lightbox) return;
    if (property?.images?.length) {
      if (!lbDisplayedUrl) {
        setLbDisplayedUrl(property.images[currentImg] || property.images[0]);
      }
    }
  }, [lightbox, property, currentImg, lbDisplayedUrl]);

  // Плавная смена для лайтбокса с блокировкой навигации
  useEffect(() => {
    if (!lightbox) return;
    const urls = property?.images || [];
    if (!urls.length) return;
    const targetUrl = urls[currentImg];
    if (!targetUrl || targetUrl === lbDisplayedUrl) return;

    let cancelled = false;
    if (lbFadeTimerRef.current) {
      clearTimeout(lbFadeTimerRef.current);
      lbFadeTimerRef.current = null;
    }

    const prefetchAndFade = async () => {
      try {
        setIsLightboxTransitioning(true);
        await new Promise((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            if (typeof img.decode === 'function') {
              img.decode().then(resolve).catch(resolve);
            } else {
              resolve();
            }
          };
          img.onerror = () => resolve();
          img.src = targetUrl;
        });
        if (cancelled) return;
        setLbOverlayUrl(targetUrl);
        setIsLbFading(true);
        lbFadeTimerRef.current = setTimeout(() => {
          if (cancelled) return;
          setLbDisplayedUrl(targetUrl);
          setLbOverlayUrl(null);
          setIsLbFading(false);
          setIsLightboxTransitioning(false);
        }, 220);
      } catch {}
    };

    prefetchAndFade();
    return () => {
      cancelled = true;
      if (lbFadeTimerRef.current) {
        clearTimeout(lbFadeTimerRef.current);
        lbFadeTimerRef.current = null;
      }
      setIsLightboxTransitioning(false);
    };
  }, [lightbox, currentImg, property, lbDisplayedUrl]);

  // Подписка на доступ к документам (entitlement) конкретного объекта
  // useEffect(() => {
  //   if (isSharedView || !effectiveCurrentUser || !id) return;
  //   const entId = `${effectiveCurrentUser.uid}_${id}`;
  //   const ref = doc(db, 'entitlements', entId);
  //   const unsub = onSnapshot(ref, (snap) => {
  //     const data = snap.data();
  //     const active = !!data && data.status === 'active';
  //     setEntitlementActive(active);
  //     if (active) {
  //       setIsSubscriptionOpen(false);
  //       setIsPaymentModalOpen(false);
  //     }
  //   });
  //   return () => unsub();
  // }, [effectiveCurrentUser, id, isSharedView]);

  // Курс RUB→USD для отображения суммы в $ (оплата в RUB)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('https://api.exchangerate.host/latest?base=RUB&symbols=USD');
        if (!resp.ok) return;
        const json = await resp.json();
        const rate = Number(json?.rates?.USD);
        if (!cancelled && rate && isFinite(rate)) setUsdRate(rate);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const ONE_TIME_PRICE_RUB = 4000;
  const usdPrice = usdRate ? (ONE_TIME_PRICE_RUB * usdRate) : null;

  // useEffect для автоматического перевода описания
  useEffect(() => {
    if (!property) return;
    if (isSharedView) {
      setTranslatedDescription(property.description || '');
      return;
    }
    // Обрабатываем перевод описания с кэшированием в БД (только не в shared view)
    handleDescriptionTranslation(property, language);
  }, [property, language, handleDescriptionTranslation, isSharedView]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Если открыто через общую ссылку — находим владельца токена (премиум-агента) и проверяем роль
        if (isSharedView && token) {
          setSharedCheckLoading(true);
          try {
            const mapSnap = await getDoc(doc(db, 'publicSharedLinks', token));
            if (mapSnap.exists()) {
              const map = mapSnap.data() || {};
              const roleStr = String(map.role || '').toLowerCase();
              const isPremiumAgent = (
                roleStr === 'premium agent' ||
                roleStr === 'премиум агент' ||
                roleStr === 'premium_agent' ||
                roleStr === 'премиум-агент'
              );
              const isPremiumDeveloper = (
                roleStr === 'premium developer' ||
                roleStr === 'премиум застройщик' ||
                roleStr === 'premium_developer' ||
                roleStr === 'премиум-застройщик'
              );
              const enabled = map.enabled !== false;
              setSharedAllowed(enabled && (isPremiumAgent || isPremiumDeveloper));
              if (enabled && (isPremiumAgent || isPremiumDeveloper)) {
                setSharedOwnerUid(map.ownerId || '');
                setSharedOwnerPhoneCode(map.phoneCode || '');
                setSharedOwnerPhone(map.phone || '');
              }
            } else {
              setSharedAllowed(false);
            }
          } catch (e) {
            console.error('Resolve shared owner by token failed', e);
            // При ошибке (например, из-за правил) не блокируем просмотр — оставим доступ
            setSharedAllowed(true);
          } finally {
            setSharedCheckLoading(false);
          }
        }
        const ref = doc(db, "properties", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          // Подтягиваем имя комплекса, если нужно
          if (data.complexId) {
            try {
              const complexSnap = await getDoc(doc(db, "complexes", data.complexId));
              if (complexSnap.exists()) {
                data.complexName = complexSnap.data().name;
              }
            } catch {}
          }
          // Подтягиваем ROI, если сохранен
          try {
            const roiSnap = await getDoc(doc(db, "properties", id, "calculations", "roi"));
            if (roiSnap.exists()) {
              const r = roiSnap.data();
              const savedRoi = r?.results?.roi;
              if (typeof savedRoi === 'number' && !isNaN(savedRoi)) {
                setRoiPercent(savedRoi);
              }
            }
          } catch {}

          // Подтягиваем статус проверки застройщика (для публичного бейджа)
          try {
            if (data.developerId) {
              const devDoc = await getDoc(doc(db, "developers", data.developerId));
              data.isDeveloperApproved = devDoc.exists() && devDoc.data().approved === true;
            } else if (data.developer) {
              const devQuery = query(collection(db, "developers"), where("name", "==", data.developer));
              const devSnap = await getDocs(devQuery);
              if (!devSnap.empty) {
                data.isDeveloperApproved = !!devSnap.docs[0].data().approved;
              } else {
                data.isDeveloperApproved = false;
              }
            } else {
              data.isDeveloperApproved = false;
            }
          } catch {}

          // Определяем телефон премиум-застройщика для кнопки WhatsApp (только для обычной ссылки без токена)
          try {
            if (isSharedView) {
              setPremiumDevPhone('');
              setPremiumDevPhoneCode('');
            } else {
              let developerId = data.developerId || null;
              if (!developerId && data.developer) {
                const byName = await getDocs(query(collection(db, 'developers'), where('name', '==', data.developer)));
                if (!byName.empty) {
                  developerId = byName.docs[0].id;
                }
              }
              if (developerId) {
                // Ищем пользователей с этим developerId и проверяем роль на премиум-застройщика
                const candidates = new Map();
                try {
                  const usersByStr = await getDocs(query(collection(db, 'users'), where('developerId', '==', String(developerId)), limit(10)));
                  usersByStr.docs.forEach(d => candidates.set(d.id, d));
                } catch {}
                try {
                  const devNum = Number(developerId);
                  if (Number.isFinite(devNum)) {
                    const usersByNum = await getDocs(query(collection(db, 'users'), where('developerId', '==', devNum), limit(10)));
                    usersByNum.docs.forEach(d => candidates.set(d.id, d));
                  }
                } catch {}
                const premiumVariants = new Set(['premium developer','премиум застройщик','premium_developer','премиум-застройщик']);
                let found = null;
                Array.from(candidates.values()).forEach(u => {
                  if (found) return;
                  const ud = u.data() || {};
                  const r = String(ud.role || '').toLowerCase().trim();
                  const phone = String(ud.phone || '').trim();
                  const phoneCode = String(ud.phoneCode || '').trim();
                  if (premiumVariants.has(r) && phone) {
                    found = { phone, phoneCode };
                  }
                });
                if (found) {
                  setPremiumDevPhone(found.phone || '');
                  setPremiumDevPhoneCode(found.phoneCode || '');
                } else {
                  // Fallback: ищем открыто опубликованные телефоны в publicSharedLinks по developerId
                  try {
                    const premiumOnly = new Set(['premium developer']);
                    let linkDoc = null;
                    // По строковому developerId
                    try {
                      const snap = await getDocs(query(collection(db, 'publicSharedLinks'), where('developerId', '==', String(developerId)), where('role', 'in', Array.from(premiumOnly)), limit(1)));
                      if (!snap.empty) linkDoc = snap.docs[0];
                    } catch {}
                    // По числовому developerId
                    if (!linkDoc) {
                      const devNum = Number(developerId);
                      if (Number.isFinite(devNum)) {
                        try {
                          const snap2 = await getDocs(query(collection(db, 'publicSharedLinks'), where('developerId', '==', devNum), where('role', 'in', Array.from(premiumOnly)), limit(1)));
                          if (!snap2.empty) linkDoc = snap2.docs[0];
                        } catch {}
                      }
                    }
                    if (!linkDoc && data.developer) {
                      // По имени застройщика
                      try {
                        const snap3 = await getDocs(query(collection(db, 'publicSharedLinks'), where('developerName', '==', data.developer), where('role', 'in', Array.from(premiumOnly)), limit(1)));
                        if (!snap3.empty) linkDoc = snap3.docs[0];
                      } catch {}
                    }
                    if (linkDoc) {
                      const ld = linkDoc.data() || {};
                      setPremiumDevPhone(ld.phone || '');
                      setPremiumDevPhoneCode(ld.phoneCode || '');
                    } else {
                      setPremiumDevPhone('');
                      setPremiumDevPhoneCode('');
                    }
                  } catch {
                    setPremiumDevPhone('');
                    setPremiumDevPhoneCode('');
                  }
                }
              } else {
                setPremiumDevPhone('');
                setPremiumDevPhoneCode('');
              }
            }
          } catch (e) {
            console.error('resolve premium developer phone failed', e);
            setPremiumDevPhone('');
            setPremiumDevPhoneCode('');
          }
          
          // Добавляем ID объекта в данные для использования в функциях
          data.id = id;
          setProperty(data);
          
          // Отслеживаем переход на объект для аналитики
          try {
            await trackPropertyVisit(
              id, 
              data.title || data.name || `Объект ${id}`,
              {
                propertyType: data.type,
                propertyStatus: data.status,
                propertyDistrict: data.district,
                propertyPrice: data.price
              }
            );
          } catch (error) {
            console.log('Ошибка при отслеживании перехода на объект:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, isSharedView, token]);

  const getLatLng = () => {
    if (!property) return null;
    let lat = null;
    let lng = null;
    if (property.latitude && property.longitude) {
      lat = property.latitude;
      lng = property.longitude;
    } else if (property.coordinates) {
      const parts = String(property.coordinates).split(/[;,.\s]+/).filter(Boolean);
      if (parts.length >= 2) {
        lat = parts[0];
        lng = parts[1];
      }
    }
    return lat && lng ? [lat, lng] : null;
  };

  const handleOpenMap = () => {
    const ll = getLatLng();
    if (!ll) return;
    const [lat, lng] = ll;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  // Ограничение доступа для общей ссылки, если владелец токена не премиум-агент
  if (isSharedView && (sharedCheckLoading || !sharedAllowed)) {
    if (sharedCheckLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">{t.sharedGalleryPage?.premiumRequiredTitle}</h1>
          <p className="text-gray-600">{t.sharedGalleryPage?.premiumRequiredMessage}</p>
          <Link to="/public" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            {t.sharedGalleryPage?.goToMain}
          </Link>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t.propertyDetail.notFound}
      </div>
    );
  }

  const shouldShowUnitsCount = property.buildingType === "Отель" || property.buildingType === "Резорт";

  const renderAttribute = (label, value, IconComp) => (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-gray-500 leading-none mb-1">{label}</div>
        <div className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line">{value}</div>
      </div>
    </div>
  );

  const renderAttributeWithTooltip = (label, value, IconComp, tooltip) => (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-gray-500 leading-none mb-1 flex items-center gap-1">
          {label}
          <AdaptiveTooltip content={tooltip}>
            <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
          </AdaptiveTooltip>
        </div>
        <div className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line">{value}</div>
      </div>
    </div>
  );

  const isPrivileged = (() => {
    if (isSharedView) return false;
    const normalizedRole = String(effectiveRole || '').toLowerCase();
    return ['admin', 'moderator', 'premium agent', 'премиум агент'].includes(normalizedRole);
  })();

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Кнопка "Назад" */}
      <div className="mb-4">
        <button
          onClick={() => {
            const from = location.state && location.state.from;
            if (from) {
              navigate(from);
              return;
            }
            if (isSharedView && token) {
              // Сохраняем исходный query, если он был в URL
              const qs = location.search || '';
              navigate(`/public/shared/${encodeURIComponent(token)}${qs}`);
            } else {
              navigate('/');
            }
          }}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.propertyDetail.backButton || 'Назад'}
        </button>
      </div>

      {/* Галерея изображений */}
      {property.images?.length ? (
        <div className="relative mb-4">
          <div 
            className="w-full h-72 rounded-xl overflow-hidden bg-gray-200 relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={() => setLightbox(true)}
          >
            {/* Базовый слой */}
            <img
              src={getOptimizedImageUrl(displayedImgUrl || property.images[currentImg], 1366)}
              srcSet={buildSrcSet(displayedImgUrl || property.images[currentImg])}
              sizes="(max-width: 768px) 100vw, 1366px"
              alt={`Фото ${currentImg + 1}`}
              className="w-full h-full object-cover"
              decoding="async"
              loading="eager"
              fetchpriority="high"
            />
            {/* Оверлей для плавного перехода */}
            {overlayImgUrl && (
              <img
                src={getOptimizedImageUrl(overlayImgUrl, 1366)}
                srcSet={buildSrcSet(overlayImgUrl)}
                sizes="(max-width: 768px) 100vw, 1366px"
                alt=""
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isFading ? 'opacity-100' : 'opacity-0'}`}
                decoding="async"
                loading="eager"
                fetchpriority="high"
              />
            )}
          </div>
          {/* Prev */}
          {currentImg > 0 && (
            <button
              onClick={() => { if (isTransitioning) return; setCurrentImg((i) => i - 1); }}
              className="hidden md:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white"
              disabled={isTransitioning}
            >
              ◀
            </button>
          )}
          {/* Next */}
          {currentImg < property.images.length - 1 && (
            <button
              onClick={() => { if (isTransitioning) return; setCurrentImg((i) => i + 1); }}
              className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white"
              disabled={isTransitioning}
            >
              ▶
            </button>
          )}
          
          {/* Индикатор свайпов для мобильных устройств */}
          {property.images?.length > 1 && (
            <div className="md:hidden text-center mt-2">
              <div className="text-sm text-gray-500">
                {t.propertyDetail.swipeHint}
              </div>
              <div className="flex justify-center gap-1 mt-1">
                {property.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImg ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-72 rounded-xl overflow-hidden mb-4 bg-gray-200 flex items-center justify-center text-gray-400">
          <Building2 className="w-12 h-12" />
        </div>
      )}

      

      {/* Lead modal */}
      {isLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLeadOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-2">{t.leadForm.leaveRequestToAgent}</h3>
            <p className="text-sm text-gray-600 mb-4">{t.leadForm.agentContactInfo}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.leadForm.name}</label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.leadForm.phone}</label>
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.leadForm.messengerLabel}</label>
                <select
                  value={leadMessenger}
                  onChange={(e) => setLeadMessenger(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="whatsapp">{t.leadForm.whatsapp}</option>
                  <option value="telegram">{t.leadForm.telegram}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsLeadOpen(false)} className="px-4 py-2 border rounded">
                  {t.leadForm.cancel}
                </button>
                <button
                  disabled={leadSending}
                  onClick={async () => {
                    if (!leadName || !leadPhone) {
                      showError(t.leadForm.sentError);
                      return;
                    }
                    try {
                      setLeadSending(true);
                      await addDoc(collection(db, 'clientLeads'), {
                        name: leadName,
                        phone: leadPhone,
                        messenger: leadMessenger,
                        propertyId: id || null,
                        createdAt: serverTimestamp(),
                        agentId: isSharedView && sharedOwnerUid ? sharedOwnerUid : null,
                        sharedLinkToken: isSharedView ? token || null : null,
                        source: isSharedView ? 'shared-link' : 'public-property',
                      });
                      showSuccess(t.leadForm.sentSuccess);
                      setIsLeadOpen(false);
                      setLeadName('');
                      setLeadPhone('');
                      setLeadMessenger('whatsapp');
                    } catch (e) {
                      console.error('Lead save failed', e);
                      let errorMsg = t.leadForm.sentError;
                      if (e.code === 'permission-denied') {
                        errorMsg = t.leadForm.accessError;
                      } else if (e.code === 'unavailable') {
                        errorMsg = t.leadForm.serviceUnavailable;
                      } else if (e.message) {
                        errorMsg = `${t.leadForm.errorPrefix}${e.message}`;
                      }
                      showError(errorMsg);
                    } finally {
                      setLeadSending(false);
                    }
                  }}
                  className={`px-4 py-2 rounded text-white ${leadSending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {t.leadForm.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Цена и кнопка "на карте" */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl font-semibold text-gray-600 flex items-center gap-3">
          {formatPrice(property.price)}
          {(() => {
            const ratingRaw = property.reliabilityRating;
            const rating = Number.isFinite(Number(ratingRaw)) ? Math.max(0, Math.min(5, parseInt(ratingRaw))) : null;
            if (!rating) return null;
            return (
              <AdaptiveTooltip content={t.propertyDetail.reliabilityRatingTooltip}>
                <div className="flex items-center gap-1 cursor-help" aria-label={`${t.propertyDetail.reliabilityRating}: ${rating}`}>
                  {Array.from({ length: rating }).map((_, idx) => (
                    <span key={idx} className="text-yellow-400 text-2xl leading-none">★</span>
                  ))}
                </div>
              </AdaptiveTooltip>
            );
          })()}
        </div>
        {/* Кнопка "на карте" на карточке убрана по требованию */}
      </div>

      {/* Тип */}
      <div className="text-2xl font-bold mb-2 text-gray-800">
        {translatePropertyType(safeDisplay(property.type), language)}
      </div>
      {property.isDeveloperApproved === true && (
        <div className="mb-4">
          <div className="inline-block group relative">
            <Badge className="border bg-green-100 text-green-800 border-green-200">
              {t.propertyDetail.serviceVerified}
            </Badge>
            <div className="pointer-events-none hidden group-hover:block absolute z-50 w-72 p-3 bg-white border rounded-lg shadow-lg text-xs sm:text-sm whitespace-pre-line top-full mt-1 left-0">
              {t.propertyDetail.serviceVerifiedTooltip}
            </div>
          </div>
        </div>
      )}



      {/* Характеристики (только просмотр) */}
      <div className="grid grid-cols-2 gap-4">
        {isPrivileged && (property.complexName || property.complex) && (
          renderAttribute(
            t.propertyDetail.complex,
            safeDisplay(property.complexName || property.complex),
            Building2
          )
        )}
        {isPrivileged && property.developer && (
          renderAttribute(
            t.propertyDetail.developer,
            safeDisplay(property.developer),
            Hammer
          )
        )}
        {renderAttribute(
          shouldShowUnitsCount ? t.propertyDetail.unitsCount : ((property.bedrooms === 0 || property.bedrooms === "Студия") ? t.propertyDetail.studio : t.propertyDetail.bedrooms),
          shouldShowUnitsCount ? safeDisplay(property.unitsCount) : ((property.bedrooms === 0 || property.bedrooms === "Студия") ? t.propertyDetail.studio : safeDisplay(property.bedrooms)),
          Bed
        )}

        {renderAttributeWithTooltip(
          t.propertyDetail.area,
          property.area ? translateAreaUnit(formatArea(property.area), language) : "—",
          Ruler,
          t.propertyDetail.areaTooltip
        )}

        {renderAttribute(
          t.propertyDetail.district,
          translateDistrict(safeDisplay(property.district), language),
          MapPin
        )}

        {renderAttribute(
          t.propertyDetail.buildingType,
          translateBuildingType(safeDisplay(property.buildingType), language),
          Hammer
        )}

        {renderAttribute(
          t.propertiesGallery.statusLabel,
          translateConstructionStatus(safeDisplay(property.status), language),
          Hammer
        )}

        {renderAttribute(
          t.propertyDetail.landStatus,
          translateLandStatus(safeDisplay(property.landStatus), language),
          MapPin
        )}

        {renderAttribute(
          t.propertyDetail.pool,
          translatePoolStatus(safeDisplay(property.pool), language),
          Droplet
        )}

        {property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms !== '' && (
          renderAttribute(t.propertyDetail.bathrooms, safeDisplay(property.bathrooms), Bath)
        )}

        {property.floors !== undefined && property.floors !== null && property.floors !== '' && (
          renderAttribute(
            t.propertyDetail.floors,
            `${safeDisplay(property.floors)} ${Number(property.floors) === 1 ? t.propertyDetail.floorText : t.propertyDetail.floorsText}`,
            Layers
          )
        )}

        {property.totalArea !== undefined && property.totalArea !== null && property.totalArea !== '' && (
          renderAttributeWithTooltip(t.propertyDetail.totalArea, safeDisplay(property.totalArea), Ruler, t.propertyDetail.totalAreaTooltip)
        )}

        {property.landArea !== undefined && property.landArea !== null && property.landArea !== '' && (
          renderAttributeWithTooltip(t.propertyDetail.landArea, `${safeDisplay(property.landArea)} м²`, Ruler, t.propertyDetail.landAreaTooltip)
        )}

        {property.expectedCost !== undefined && 
         property.expectedCost !== null && 
         property.expectedCost !== '' && 
         (property.status === 'Проект' || property.status === 'Строится') && (
          renderAttributeWithTooltip(
            t.propertyDetail.expectedCost, 
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(property.expectedCost), 
            Star,
            t.propertyDetail.expectedCostTooltip
          )
        )}

        {property.managementCompany && (
          renderAttribute(t.propertyDetail.managementCompany, safeDisplay(property.managementCompany), Building2)
        )}

        {renderAttribute(
          t.propertyDetail.ownership,
          property.ownershipForm
            ? `${translateOwnership(property.ownershipForm, language)}${property.leaseYears ? ` ${property.leaseYears} ${t.propertyDetail.years}` : ""}`
            : "—",
          FileText
        )}

        {renderAttribute(
          t.propertyDetail.completionDate,
          safeDisplay(property.completionDate),
          Calendar
        )}

        {/* Цена за м² после даты завершения */}
        {renderAttribute(
          t.propertyDetail.pricePerSqm,
          property.price && property.area
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Math.round(Number(property.price) / Number(property.area)))
            : "—",
          DollarSign
        )}

        {/* Рейтинг надежности перенесен рядом с ценой */}

        {/* Expected ROI (если указан) - приоритет над рассчетным */}
        {property.manualRoi ? (
          renderAttributeWithTooltip(
            t.propertyDetail.expectedRoi,
            `${Number(property.manualRoi).toFixed(2)}%`,
            Star,
            t.propertyDetail.expectedRoiTooltip
          )
        ) : (
          /* Calculated ROI (если нет ожидаемого ROI и есть рассчетный) */
          roiPercent !== null && (
            renderAttribute(
              t.roiShort,
              `${Number(roiPercent).toFixed(2)}%`,
              Star
            )
          )
        )}

        {/* Планировка (если загружены один или несколько файлов) */}
        {(property.layoutFileURL || property.layoutFileURL2 || property.layoutFileURL3) && (
          renderAttribute(
            t.propertyDetail.layout,
            (
              <div className="flex gap-2">
                {property.layoutFileURL && (
                  <button
                    onClick={() => { setViewerImages([property.layoutFileURL]); setViewerIndex(0); setViewerOpen(true); }}
                    className="text-blue-600 hover:underline"
                  >
                    {t.propertyDetail.viewButton}
                  </button>
                )}
                {property.layoutFileURL2 && (
                  <button
                    onClick={() => { setViewerImages([property.layoutFileURL2]); setViewerIndex(0); setViewerOpen(true); }}
                    className="text-blue-600 hover:underline"
                  >
                    {t.propertyDetail.viewButton}
                  </button>
                )}
                {property.layoutFileURL3 && (
                  <button
                    onClick={() => { setViewerImages([property.layoutFileURL3]); setViewerIndex(0); setViewerOpen(true); }}
                    className="text-blue-600 hover:underline"
                  >
                    {t.propertyDetail.viewButton}
                  </button>
                )}
              </div>
            ),
            FileText
          )
        )}
      </div>

      {/* Дополнительные опции (бейджи) */}
      {(property.smartHome || property.jacuzzi || property.terrace || property.rooftop || property.balcony || property.bbq || property.furniture || property.washingMachine) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.additionalOptions}</h3>
          <div className="grid grid-cols-2 gap-3">
            {property.smartHome && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Home className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.smartHome}</span>
              </div>
            )}
            {property.jacuzzi && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Droplet className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.jacuzzi}</span>
              </div>
            )}
            {property.terrace && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Star className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.terrace}</span>
              </div>
            )}
            {property.rooftop && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Building2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.rooftop}</span>
              </div>
            )}
            {property.balcony && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Square className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.balcony}</span>
              </div>
            )}
            {property.bbq && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Flame className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.bbq}</span>
              </div>
            )}
            {property.furniture && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Sofa className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.furniture}</span>
              </div>
            )}
            {property.washingMachine && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Waves className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.washingMachine}</span>
              </div>
            )}
            {property.distanceToBeach && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t.propertyDetail.distanceToBeach} {String(property.distanceToBeach)} {t.propertyDetail.kmUnit}
                </span>
              </div>
            )}
            {property.distanceToCenter && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t.propertyDetail.distanceToCenter} {String(property.distanceToCenter)} {t.propertyDetail.kmUnit}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Поле "Описание" */}
      {property.description && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {t.propertyDetail.description}
            {isTranslating && (
              <span className="ml-2 text-sm text-gray-500">
                ({t.propertyDetail.translating})
              </span>
            )}
          </h3>
          <p className="text-gray-600 whitespace-pre-line">
            {translatedDescription || property.description}
          </p>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div 
            className="relative w-full h-full"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={(e) => { if (isLightboxTransitioning) return; onTouchEnd(e); }}
          >
            {/* Базовый слой */}
            <img
              src={getOptimizedImageUrl(lbDisplayedUrl || property.images[currentImg], 1920)}
              srcSet={buildSrcSet(lbDisplayedUrl || property.images[currentImg])}
              sizes="100vw"
              alt={`${t.propertyDetail.photo} ${currentImg + 1}`}
              className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
              onClick={() => setLightbox(false)}
              decoding="async"
              loading="eager"
              fetchpriority="high"
            />
            {/* Оверлей */}
            {lbOverlayUrl && (
              <img
                src={getOptimizedImageUrl(lbOverlayUrl, 1920)}
                srcSet={buildSrcSet(lbOverlayUrl)}
                sizes="100vw"
                alt=""
                className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-opacity duration-200 ${isLbFading ? 'opacity-100' : 'opacity-0'}`}
                decoding="async"
                loading="eager"
                fetchpriority="high"
              />
            )}
            {/* Кнопка закрытия */}
            <button className="absolute top-4 right-4 text-white text-4xl" onClick={() => setLightbox(false)}>
              ×
            </button>
            {/* Стрелка влево */}
            {currentImg > 0 && (
              <button
                onClick={() => { if (isLightboxTransitioning) return; setCurrentImg((prev) => prev - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
                disabled={isLightboxTransitioning}
              >
                ←
              </button>
            )}
            {/* Стрелка вправо */}
            {currentImg < property.images.length - 1 && (
              <button
                onClick={() => { if (isLightboxTransitioning) return; setCurrentImg((prev) => prev + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
                disabled={isLightboxTransitioning}
              >
                →
              </button>
            )}
            {/* Счетчик фотографий */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {t.propertyDetail.photoCounter.replace('{current}', currentImg + 1).replace('{total}', property.images.length)}
            </div>
          </div>
        </div>
      )}

      {/* CTA: Кнопка управления объектом для создателя или "Написать агенту" для остальных */}
      <div className="mt-8">
        {!isSharedView && effectiveCurrentUser && property?.createdBy === effectiveCurrentUser.uid ? (
          <button
            onClick={handleManageProperty}
            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t.leadForm.manageProperty}
          </button>
        ) : (
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={() => setIsLeadOpen(true)}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.leadForm.writeToAgent}
            </button>
            <a
              href={`${(() => {
                // Приоритет: общая премиум-ссылка владельца → премиум-застройщик объекта → дефолтный номер админа
                let code = '';
                let phone = '';
                if (isSharedView && (sharedOwnerPhone || sharedOwnerPhoneCode)) {
                  code = String(sharedOwnerPhoneCode || '');
                  phone = String(sharedOwnerPhone || '');
                } else if (premiumDevPhone || premiumDevPhoneCode) {
                  code = String(premiumDevPhoneCode || '');
                  phone = String(premiumDevPhone || '');
                }
                const phoneDigits = phone.replace(/\D/g, '');
                const codeDigits = code.replace(/\D/g, '');
                const hasValidPhone = phoneDigits.length >= 5;
                const intl = hasValidPhone ? (codeDigits ? `${codeDigits}${phoneDigits}` : phoneDigits) : '';
                const target = hasValidPhone ? intl : '6282147824968';
                const text = `Здравствуйте! Хочу узнать подробности по объекту ${
                  property?.propertyName || property?.name || property?.title || property?.complexName || ''
                }${property?.id ? ` (ID: ${property.id})` : ''}. Источник: PublicPropertyDetail ${window.location.href}`;
                return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
              })()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
            >
              {t.leadForm.writeInWhatsapp || 'Написать в WhatsApp'}
            </a>
          </div>
        )}
      </div>

      {/* Секция: Просмотр детальной информации и документов */}
      <div className="mt-6">
        {isSharedView ? null : (
        <details 
          ref={docsDetailsRef}
          className="group border rounded-lg"
          onToggle={() => {
            try {
              if (docsDetailsRef.current && docsDetailsRef.current.open && docsContentRef.current) {
                // Даём браузеру перестроить layout, затем скроллим к началу контента
                requestAnimationFrame(() => {
                  docsContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              }
            } catch {}
          }}
        >
          <summary className="list-none cursor-pointer select-none flex items-center justify-between p-4">
            <span className="font-medium text-gray-800">{t.publicDocs?.title}</span>
            <span className="transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div ref={docsContentRef} className="px-4 pb-4">
            {(() => {
              const normalizedRole = String(role || '').toLowerCase();
              const allowed = ['admin','moderator','premium agent','премиум агент'].includes(normalizedRole);
              if (allowed) {
                const has = (v) => v !== undefined && v !== null && v !== '';
                const npwpVal = property.npwp ?? property.taxNumber;
                const preRows = [];
                const docRows = [];
                // Пре-данные: Комплекс / Застройщик / На карте (должны быть ПЕРЕД заголовком Документы)
                if (has(property.complexName) || has(property.complex)) {
                  preRows.push(
                    <div key="complex" className="grid grid-cols-[auto,1fr] items-start gap-2">
                      <span className="text-gray-600">{`${t.propertyDetail.complex}:`}</span>
                      <span className="whitespace-pre-wrap break-words">{safeDisplay(property.complexName || property.complex)}</span>
                    </div>
                  );
                }
                if (has(property.developer)) {
                  preRows.push(
                    <div key="developer" className="grid grid-cols-[auto,1fr] items-start gap-2">
                      <span className="text-gray-600">{`${t.propertyDetail.developer}:`}</span>
                      <span className="whitespace-pre-wrap break-words">{safeDisplay(property.developer)}</span>
                    </div>
                  );
                }
                if (getLatLng()) {
                  preRows.push(
                    <div key="onmap" className="flex items-center">
                      <button onClick={handleOpenMap} className="flex items-center gap-2 text-blue-600 hover:underline">
                        <MapIcon className="w-4 h-4" />
                        <span>{t.propertyDetail.onMap}</span>
                      </button>
                    </div>
                  );
                }
                if (has(property.legalCompanyName)) docRows.push(
                  <div key="legalCompanyName" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.legalCompanyName}</span>
                    <span className="ml-4">{safeDisplay(property.legalCompanyName)}</span>
                  </div>
                );
                if (has(npwpVal)) docRows.push(
                  <div key="npwp" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.taxNumber}</span>
                    <span className="ml-4">{safeDisplay(npwpVal)}</span>
                  </div>
                );
                if (has(property.pkkpr) || has(property.pkkprFileURL)) docRows.push(
                  <div key="pkkpr" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.landUsePermit}</span>
                    <span className="ml-4 flex flex-wrap items-center gap-2">
                      <span className="whitespace-pre-wrap break-words">{safeDisplay(property.pkkpr)}</span>
                      {property.pkkprFileURL && (
                        <span className="basis-full sm:basis-auto">
                          <button onClick={() => { setViewerImages([property.pkkprFileURL]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                        </span>
                      )}
                    </span>
                  </div>
                );
                if (has(property.shgb) || has(property.shgbFileURL) || has(property.shgbFileURL2) || has(property.shgbFileURL3)) docRows.push(
                  <div key="shgb" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.landRightsCertificate}</span>
                    <span className="ml-4 flex flex-wrap items-center gap-2">
                      <span className="whitespace-pre-wrap break-words">{safeDisplay(property.shgb)}</span>
                      <span className="flex gap-2 basis-full sm:basis-auto">
                        {property.shgbFileURL && (
                          <button onClick={() => { setViewerImages([property.shgbFileURL]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                        )}
                        {property.shgbFileURL2 && (
                          <button onClick={() => { setViewerImages([property.shgbFileURL2]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                        )}
                        {property.shgbFileURL3 && (
                          <button onClick={() => { setViewerImages([property.shgbFileURL3]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                        )}
                      </span>
                    </span>
                  </div>
                );
                if (has(property.landLeaseEndDate)) docRows.push(
                  <div key="landLeaseEndDate" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.landLeaseEndDate}</span>
                    <span className="ml-4">{safeDisplay(property.landLeaseEndDate)}</span>
                  </div>
                );
                if (has(property.pbg) || has(property.pbgFileURL)) docRows.push(
                  <div key="pbg" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.buildingPermit}</span>
                    <span className="ml-4 flex flex-wrap items-center gap-2">
                      <span className="whitespace-pre-wrap break-words">{safeDisplay(property.pbg)}</span>
                      {property.pbgFileURL && (
                        <span className="basis-full sm:basis-auto">
                          <button onClick={() => { setViewerImages([property.pbgFileURL]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                        </span>
                      )}
                    </span>
                  </div>
                );
                if (has(property.imb)) docRows.push(
                  <div key="imb" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.buildingPermitIMB}</span>
                    <span className="ml-4">{safeDisplay(property.imb)}</span>
                  </div>
                );
                if (has(property.slf) || has(property.slfFileURL)) docRows.push(
                  <div key="slf" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.buildingReadinessCertificate}</span>
                    <span className="ml-4 flex flex-wrap items-center gap-2">
                      <span className="whitespace-pre-wrap break-words">{safeDisplay(property.slf)}</span>
                      {property.slfFileURL && (
                        <span className="basis-full sm:basis-auto">
                          <button onClick={() => { setViewerImages([property.slfFileURL]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                        </span>
                      )}
                    </span>
                  </div>
                );
                if (has(property.dueDiligenceFileURL)) docRows.push(
                  <div key="dd" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.dueDiligence}</span>
                    <span className="ml-4">
                      <button onClick={() => { setViewerImages([property.dueDiligenceFileURL]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                    </span>
                  </div>
                );
                if (has(property.unbrandedPresentationFileURL)) docRows.push(
                  <div key="unbranded" className="flex justify-between">
                    <span className="text-gray-600">{t.propertyDetail.unbrandedPresentation}</span>
                    <span className="ml-4">
                      <button onClick={() => { setViewerImages([property.unbrandedPresentationFileURL]); setViewerIndex(0); setViewerOpen(true); }} className="text-blue-600 hover:underline">{t.propertyDetail.viewButton}</button>
                    </span>
                  </div>
                );

                if (preRows.length === 0 && docRows.length === 0) {
                  return <div className="text-sm text-gray-500">{t.propertyDetail.noDocuments || 'Документы отсутствуют'}</div>;
                }

                return (
                  <div className="space-y-3">
                    {preRows.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {preRows}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.propertyDetail.documentsSection}</h3>
                    {docRows.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {docRows}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div className="py-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      if (!currentUser) {
                        setIsAuthModalOpen(true);
                      } else {
                        setIsSubscriptionOpen(true);
                      }
                    }}
                  >
                    {t.publicDocs?.openAccess}
                  </button>
                </div>
              );
            })()}
          </div>
        </details>
        )}
      </div>
      {/* Модалка авторизации/регистрации как в публичной галерее */}
      <PropertyPlacementModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Модалка "Премиум-подписка" как в публичной галерее */}
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
                if (!currentUser) { setIsAuthModalOpen(true); return; }
                setPaymentUrl('https://premium.it-agent.pro/product-page/it-agent-premium');
                setIsPaymentModalOpen(true);
              } catch (e) {
                console.error('open premium subscription link error', e);
                showError('Не удалось открыть страницу подписки');
              } finally {
                setIsSubscriptionOpen(false);
              }
            }}>
              {t.subscriptionModal?.subscribeButton}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Embedded Robokassa payment modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {usdPrice && (
              <div className="text-sm text-gray-700">Amount: USD ${usdPrice.toFixed(2)} (charged in RUB {ONE_TIME_PRICE_RUB})</div>
            )}
            {paymentUrl ? (
              <iframe title="Robokassa Payment" src={paymentUrl} className="w-full h-[540px] border rounded" allow="payment *;" />
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

      <FullScreenImageView
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={viewerImages}
        currentIndex={viewerIndex}
        onIndexChange={setViewerIndex}
      />
    </div>
  );
}

export default PublicPropertyDetail;


