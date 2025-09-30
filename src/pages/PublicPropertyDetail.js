import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, addDoc, collection, serverTimestamp, getDocs, where, query, updateDoc, onSnapshot } from "firebase/firestore";
import { Building2, Map as MapIcon, Home, Droplet, Star, Square, Flame, Sofa, Waves, Bed, Ruler, MapPin, Hammer, Layers, Bath, FileText, Calendar, DollarSign, Settings } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { useAuth } from "../AuthContext";
import PropertyPlacementModal from "../components/PropertyPlacementModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Card } from "../components/ui/card";
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
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [entitlementActive, setEntitlementActive] = useState(false);
  const [usdRate, setUsdRate] = useState(null);
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMessenger, setLeadMessenger] = useState('whatsapp');
  const [leadSending, setLeadSending] = useState(false);
  const [sharedOwnerUid, setSharedOwnerUid] = useState("");
  const [sharedOwnerPhoneCode, setSharedOwnerPhoneCode] = useState("");
  const [sharedOwnerPhone, setSharedOwnerPhone] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  // Автоскролл при раскрытии секции документов
  const docsDetailsRef = useRef(null);
  const docsContentRef = useRef(null);
  
  // Состояние для свайпов
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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

  // Подписка на доступ к документам (entitlement) конкретного объекта
  useEffect(() => {
    if (isSharedView || !effectiveCurrentUser || !id) return;
    const entId = `${effectiveCurrentUser.uid}_${id}`;
    const ref = doc(db, 'entitlements', entId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      const active = !!data && data.status === 'active';
      setEntitlementActive(active);
      if (active) {
        setIsAccessModalOpen(false);
        setIsPaymentModalOpen(false);
      }
    });
    return () => unsub();
  }, [effectiveCurrentUser, id, isSharedView]);

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
            const usersRef = collection(db, 'users');
            const qUsers = query(usersRef, where('premiumPublicLinkToken', '==', token));
            const snap = await getDocs(qUsers);
            if (!snap.empty) {
              const docSnap = snap.docs[0];
              const userData = docSnap.data();
              const roleStr = String(userData?.role || '').toLowerCase();
              const isPremiumAgent = roleStr === 'premium agent' || roleStr === 'премиум агент';
              setSharedAllowed(isPremiumAgent);
              if (isPremiumAgent) {
                setSharedOwnerUid(docSnap.id);
                setSharedOwnerPhoneCode(userData?.phoneCode || '');
                setSharedOwnerPhone(userData?.phone || '');
              }
            } else {
              setSharedAllowed(false);
            }
          } catch (e) {
            console.error('Resolve shared owner by token failed', e);
            setSharedAllowed(false);
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
            if (isSharedView && token) {
              navigate(`/public/shared/${encodeURIComponent(token)}`);
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
            className="w-full h-72 rounded-xl overflow-hidden bg-gray-200"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={property.images[currentImg]}
              alt={`Фото ${currentImg + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightbox(true)}
            />
          </div>
          {/* Prev */}
          {currentImg > 0 && (
            <button
              onClick={() => setCurrentImg((i) => i - 1)}
              className="hidden md:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white"
            >
              ◀
            </button>
          )}
          {/* Next */}
          {currentImg < property.images.length - 1 && (
            <button
              onClick={() => setCurrentImg((i) => i + 1)}
              className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white"
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
            onTouchEnd={onTouchEnd}
          >
            <img
              src={property.images[currentImg]}
              alt={`${t.propertyDetail.photo} ${currentImg + 1}`}
              className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
              onClick={() => setLightbox(false)}
            />
            {/* Кнопка закрытия */}
            <button className="absolute top-4 right-4 text-white text-4xl" onClick={() => setLightbox(false)}>
              ×
            </button>
            {/* Стрелка влево */}
            {currentImg > 0 && (
              <button
                onClick={() => setCurrentImg((prev) => prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                ←
              </button>
            )}
            {/* Стрелка вправо */}
            {currentImg < property.images.length - 1 && (
              <button
                onClick={() => setCurrentImg((prev) => prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
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
                const phoneDigits = String(sharedOwnerPhone || '').replace(/\D/g, '');
                const codeDigits = String(sharedOwnerPhoneCode || '').replace(/\D/g, '');
                const intl = codeDigits ? `${codeDigits}${phoneDigits}` : phoneDigits;
                const target = intl || '6282147824968';
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
                        setIsAccessModalOpen(true);
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

      {/* Модалка с выбором доступа для авторизованных */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.publicDocs?.modal?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <Card className="p-4 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-2">{t.publicDocs?.modal?.colOneTitle}</h3>
              <p className="text-sm text-gray-600 mb-2">{t.publicDocs?.modal?.colOneDesc}</p>
              <div className="mt-auto space-y-3">
                {t.publicDocs?.modal?.colOnePrice && (
                  <div className="text-base font-medium text-gray-900">{t.publicDocs.modal.colOnePrice}</div>
                )}
                {usdPrice && (
                  <div className="text-xs text-gray-600">≈ USD ${usdPrice.toFixed(2)} (оплата в RUB {ONE_TIME_PRICE_RUB})</div>
                )}
              <Button className="w-full" disabled={entitlementActive} onClick={async () => {
                try {
                  if (!currentUser) { setIsAuthModalOpen(true); return; }
                  const token = await currentUser.getIdToken();
                  const resp = await fetch('/api/payments/robokassa/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ propertyId: id, isTest: false })
                  });
                  const json = await resp.json();
                  if (resp.ok && json?.url) {
                    setPaymentUrl(json.url);
                    setIsPaymentModalOpen(true);
                  } else {
                    showError(json?.error || 'Failed to initialize payment');
                  }
                } catch (e) {
                  console.error('create payment error', e);
                  showError('Payment initialization error');
                }
              }}>
                {t.publicDocs?.modal?.colOneButton}
              </Button>
              </div>
            </Card>
            <Card className="p-4 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-2">{t.publicDocs?.modal?.colTwoTitle}</h3>
              <p className="text-sm text-gray-600 mb-2">{t.publicDocs?.modal?.colTwoDesc}</p>
              <div className="mt-auto space-y-3">
                {t.publicDocs?.modal?.colTwoPrice && (
                  <div className="text-base font-medium text-gray-900">{t.publicDocs.modal.colTwoPrice}</div>
                )}
              <Button className="w-full" variant="secondary" onClick={() => { /* заглушка */ }}>
                {t.publicDocs?.modal?.colTwoButton}
              </Button>
              </div>
            </Card>
          </div>
          <div className="pt-2">
            <Button variant="ghost" className="w-full" onClick={() => setIsAccessModalOpen(false)}>
              {t.publicDocs?.modal?.close}
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
            <div className="text-xs text-gray-500">Payments are processed by Robokassa.</div>
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


