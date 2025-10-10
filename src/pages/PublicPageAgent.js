import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Building2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, Timestamp, query, where, onSnapshot, limit } from 'firebase/firestore';
import { useCache } from '../CacheContext';
import { translateDistrict } from '../lib/utils';
import LanguageSwitcher from '../components/LanguageSwitcher';

function PublicPageAgent() {
  const { language } = useLanguage();
  const t = translations[language];
  const { currentUser } = useAuth();
  const { developerId: routeDeveloperId } = useParams();
  // useLocation не используется на публичной версии
  const { forceRefreshPropertiesList } = useCache();

  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [developer, setDeveloper] = useState(null);
  const [complexes, setComplexes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [effectiveDeveloperId, setEffectiveDeveloperId] = useState(null);
  const [hasPremiumDeveloper, setHasPremiumDeveloper] = useState(null);
  const descriptionParagraphs = useMemo(() => {
    const text = developer?.description || '';
    if (!text) return [];
    return text
      .split(/\n{2,}|\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [developer?.description]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString('ru-RU');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMinPriceForComplex = useCallback((complexName) => {
    if (!complexName || !properties.length) return null;
    const related = properties.filter((p) => {
      const name = p.complexName || p.complex;
      return name && name.toLowerCase() === String(complexName).toLowerCase();
    });
    if (!related.length) return null;
    const prices = related.map((p) => p.price).filter((v) => v && v > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [properties]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // приоритет: параметр в URL; если нет — берем из профиля
      let developerId = routeDeveloperId || null;
      if (!developerId && currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) developerId = userDoc.data().developerId || null;
      }

      let developerData = null;
      if (developerId) {
        const devDoc = await getDoc(doc(db, 'developers', developerId));
        if (devDoc.exists()) {
          developerData = { id: devDoc.id, ...devDoc.data() };
        }
      }
      setDeveloper(developerData);
      setEffectiveDeveloperId(developerId || null);

      let complexesData = [];
      const snapAll = await getDocs(collection(db, 'complexes'));
      snapAll.forEach((docSnap) => {
        const c = { id: docSnap.id, ...docSnap.data() };
        const matchesById = developerId && c.developerId === developerId;
        const matchesByName = developerData?.name && c.developer === developerData.name;
        if (matchesById || matchesByName) complexesData.push(c);
      });
      complexesData.sort((a, b) => {
        const aNum = parseInt(a.number, 10) || 0;
        const bNum = parseInt(b.number, 10) || 0;
        return aNum - bNum;
      });
      setComplexes(complexesData);

      const propsData = await forceRefreshPropertiesList();
      setProperties(propsData);
    } catch (e) {
      console.error('PublicPageAgent: load error', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, forceRefreshPropertiesList, routeDeveloperId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live-проверка наличия пользователя с ролью "премиум застройщик" у выбранного застройщика
  useEffect(() => {
    if (!effectiveDeveloperId) {
      setHasPremiumDeveloper(null);
      return;
    }
    // 1) Пытаемся подписаться на users (для авторизованных это ок). Для анонимных это может быть запрещено правилами.
    let unsubscribe = () => {};
    try {
      const qUsers = query(
        collection(db, 'users'),
        where('developerId', '==', effectiveDeveloperId),
        where('role', '==', 'премиум застройщик')
      );
      unsubscribe = onSnapshot(qUsers, (snap) => {
        setHasPremiumDeveloper(!snap.empty);
      }, (err) => {
        console.warn('PublicPageAgent: users onSnapshot blocked, fallback to publicSharedLinks', err);
        // Не меняем на false — попробуем публичный fallback ниже
      });
    } catch (e) {
      console.warn('PublicPageAgent: users subscription failed, fallback to publicSharedLinks', e);
    }

    // 2) Публичный fallback: ищем активную запись премиум-разработчика в publicSharedLinks по developerId или имени
    (async () => {
      try {
        // Ищем по developerId (строкой и числом)
        const premiumRoles = ['premium developer'];
        let found = false;
        try {
          const snap1 = await getDocs(query(collection(db, 'publicSharedLinks'), where('developerId', '==', String(effectiveDeveloperId)), where('role', 'in', premiumRoles), where('enabled', '==', true), limit(1)));
          found = !snap1.empty;
        } catch {}
        if (!found) {
          const asNum = Number(effectiveDeveloperId);
          if (Number.isFinite(asNum)) {
            try {
              const snap2 = await getDocs(query(collection(db, 'publicSharedLinks'), where('developerId', '==', asNum), where('role', 'in', premiumRoles), where('enabled', '==', true), limit(1)));
              found = !snap2.empty;
            } catch {}
          }
        }
        if (!found && developer?.name) {
          try {
            const snap3 = await getDocs(query(collection(db, 'publicSharedLinks'), where('developerName', '==', developer.name), where('role', 'in', premiumRoles), where('enabled', '==', true), limit(1)));
            found = !snap3.empty;
          } catch {}
        }
        // Устанавливаем значение только если ранее не было получено true из users
        setHasPremiumDeveloper(prev => (prev === true ? true : (found ? true : prev)));
      } catch (e) {
        console.warn('PublicPageAgent: public fallback premium check failed', e);
      }
    })();

    return () => {
      try { unsubscribe(); } catch {}
    };
  }, [effectiveDeveloperId, developer?.name]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  // Закрываем доступ только если точно знаем, что премиума нет (false). При ошибках/недостатке прав оставляем страницу доступной.
  if (effectiveDeveloperId && hasPremiumDeveloper === false) {
    return <Navigate to="/access-closed" />;
  }

  // Страница доступна без авторизации

  return (
    <div className="bg-white min-h-screen">
      <div className={`mx-auto space-y-6 p-4 ${isMobile ? 'max-w-full' : 'max-w-5xl'}`}>
        <div className="flex items-center justify-end">
          <LanguageSwitcher />
        </div>
        {/* Логотип+название без загрузки обложки */}
        <div className="flex flex-col gap-4">
          {developer?.coverUrl && (
            <div className="w-full">
              <img src={developer.coverUrl} alt="cover" className="w-full max-h-[360px] object-cover rounded-xl" />
            </div>
          )}

          <div className="flex items-center gap-6">
            {developer?.logo ? (
              <img src={developer.logo} alt={developer.name} className="w-48 h-48 object-contain rounded-xl" />
            ) : (
              <div className="w-48 h-48 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
            )}
            <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>{developer?.name || t.navigation.publicPage}</h1>
          </div>

          {descriptionParagraphs.length > 0 && (
            <div className="mt-3">
              {(showFullDescription ? descriptionParagraphs : descriptionParagraphs.slice(0, 3)).map((p, idx) => (
                <p key={idx} className="text-gray-600 mb-3">
                  {p}
                </p>
              ))}
              {descriptionParagraphs.length > 3 && (
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
                  onClick={() => setShowFullDescription((v) => !v)}
                >
                  {showFullDescription ? (t.publicPage?.collapse || 'Свернуть') : (t.publicPage?.expand || 'Развернуть')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Список комплексов */}
        <div className="space-y-3">
          <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{t.publicPage?.complexesListTitle || 'Список комплексов'}</h2>
          <div className="divide-y">
            {complexes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">{t.complexesGallery?.emptyStateNoComplexes || 'Комплексы не найдены'}</div>
            ) : (
              complexes.map((complex) => (
                <Link key={complex.id} to={`/public/complex/${complex.id}`} className={`flex items-stretch hover:bg-gray-50 transition-colors ${isMobile ? 'flex-col gap-3 p-3' : 'gap-4 p-4'}`}>
                  {/* Изображение */}
                  <div className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${isMobile ? 'w-full h-40' : 'w-48 h-32 min-w-48'}`}>
                    {complex.images?.length ? (
                      <img src={complex.images[0]} alt={complex.name || 'Complex'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Текст */}
                  <div className="flex flex-col text-gray-900 space-y-0.5 flex-1">
                    <span className={`font-semibold leading-none text-black ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {complex.name || t.complexesGallery?.noNameText || 'Без названия'}
                    </span>
                    {complex.completionDate && (
                      <span className="text-sm">
                        {(t.publicPage?.rentingLabel || 'Сдается') + ': '} {safeDisplay(complex.completionDate)}
                      </span>
                    )}
                    {complex.district && (
                      <span className="text-sm">
                        {t.complexesGallery?.districtPrefix} {translateDistrict(safeDisplay(complex.district), language)}
                      </span>
                    )}
                    {(() => {
                      const minPrice = getMinPriceForComplex(complex.name);
                      return minPrice ? (
                        <span className={`font-semibold leading-none ${isMobile ? 'text-base' : 'text-lg'}`}>
                          {t.complexesGallery?.priceFromPrefix} {formatPrice(minPrice)}
                        </span>
                      ) : complex.priceFrom ? (
                        <span className={`font-semibold leading-none ${isMobile ? 'text-base' : 'text-lg'}`}>
                          {t.complexesGallery?.priceFromPrefix} {formatPrice(complex.priceFrom)}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicPageAgent;


