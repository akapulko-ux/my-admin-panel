import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { translateDistrict, translatePropertyType, translateConstructionStatus } from '../lib/utils';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, BarChart3, Map as MapIcon, Sparkles, Utensils, Dumbbell, Baby, ShoppingBag, Film, Monitor, Music, Car, Waves } from 'lucide-react';
import { useCache } from '../CacheContext';

function PublicComplexDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { forceRefreshPropertiesList } = useCache();
  const { language } = useLanguage();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [complex, setComplex] = useState(null);
  const [properties, setProperties] = useState([]);
  const [chessboardPublicId, setChessboardPublicId] = useState(null);
  const filteredComplexProperties = useMemo(() => {
    if (!properties?.length || !complex) return [];
    const list = properties.filter((p) =>
      p.complexId === complex.id ||
      (p.complex && complex.name && String(p.complex).toLowerCase().trim() === String(complex.name).toLowerCase().trim())
    );
    return list
      .slice()
      .sort((a, b) => {
        const ap = typeof a.price === 'number' ? a.price : (Number(a.price) || Number.POSITIVE_INFINITY);
        const bp = typeof b.price === 'number' ? b.price : (Number(b.price) || Number.POSITIVE_INFINITY);
        return ap - bp;
      });
  }, [properties, complex]);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // Агрессивный прелоад соседних изображений (prev/next)
  useEffect(() => {
    if (!complex?.images?.length) return;
    const urls = complex.images;
    const preload = (idx) => {
      if (idx >= 0 && idx < urls.length) {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = urls[idx];
      }
    };
    preload(currentImg + 1);
    preload(currentImg - 1);
  }, [complex, currentImg]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString('ru-RU');
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
    const prices = related.map((p) => p.price).filter((v) => v && v > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [properties]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, 'complexes', id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setComplex(data);
          // Пытаемся определить публичный id шахматки: поле в комплексе или по связанной шахматке
          if (data.chessboardPublicId) {
            setChessboardPublicId(data.chessboardPublicId);
          } else {
            try {
              const q = query(collection(db, 'chessboards'), where('complexId', '==', snap.id));
              const res = await getDocs(q);
              const first = res.docs.find(d => !!d.data().publicUrl) || res.docs[0];
              const pub = first?.data()?.publicUrl || first?.id || null;
              if (pub) setChessboardPublicId(pub);
            } catch {}
          }
        }
        const propsData = await forceRefreshPropertiesList();
        setProperties(propsData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, forceRefreshPropertiesList]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  if (!complex) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t.propertyDetail?.notFound || 'Не найдено'}
      </div>
    );
  }

  const minPrice = getMinPriceForComplex(complex.name);
  const displayPrice = minPrice || complex.priceFrom;

  const handleOpenMap = () => {
    const coords = complex.coordinates;
    if (!coords) return;
    const parts = String(coords).split(/[;,\s]+/).filter(Boolean);
    if (parts.length < 2) return;
    const lat = parts[0];
    const lng = parts[1];
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen">
      <div className={`mx-auto space-y-6 p-4 ${isMobile ? 'max-w-full' : 'max-w-5xl'}`}>
        {/* Галерея изображений с переключением */}
        <div className="relative w-full rounded-xl overflow-hidden bg-gray-200 h-[320px]">
          {complex.images?.length ? (
            <img
              src={complex.images[currentImg]}
              alt={complex.name || 'Complex'}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightbox(true)}
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Building2 className="w-10 h-10" />
            </div>
          )}
          {complex.images?.length > 1 && (
            <>
              {currentImg > 0 && (
                <button
                  onClick={() => setCurrentImg((i) => i - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50"
                  aria-label="Prev"
                >
                  ◀
                </button>
              )}
              {currentImg < complex.images.length - 1 && (
                <button
                  onClick={() => setCurrentImg((i) => i + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50"
                  aria-label="Next"
                >
                  ▶
                </button>
              )}
            </>
          )}
        </div>

        {/* Lightbox */}
        {lightbox && complex.images?.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
            <div className="relative w-full h-full">
              <img
                src={complex.images[currentImg]}
                alt={complex.name || 'Complex'}
                className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
              />
              {/* Close */}
              <button className="absolute top-4 right-4 text-white text-4xl" onClick={() => setLightbox(false)}>×</button>
              {/* Prev */}
              {currentImg > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImg((i) => i - 1); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70"
                >
                  ←
                </button>
              )}
              {/* Next */}
              {currentImg < complex.images.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImg((i) => i + 1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}

        <Card className="p-6">
          <div className="space-y-6">
            {/* Название и цена */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>{complex.name || t.complexesGallery?.noNameText || 'Без названия'}</h1>
              {displayPrice ? (
                <div className="text-2xl font-bold text-green-600">
                  {t.complexesGallery?.priceFromPrefix} {formatPrice(displayPrice)}
                </div>
              ) : null}
            </div>

            {/* Ключевые поля */}
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-4 gap-4'}`}>
              <div>
                <div className="text-sm text-gray-600">{t.complexDetail?.developerLabel}</div>
                <div className="text-sm">{safeDisplay(complex.developer)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t.complexDetail?.districtLabel}</div>
                <div className="text-sm">{translateDistrict(safeDisplay(complex.district), language)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t.complexDetail?.completionDateLabel}</div>
                <div className="text-sm">{safeDisplay(complex.completionDate)}</div>
              </div>
              <div className="flex items-end">
                {complex.coordinates && (
                  <Button onClick={handleOpenMap} className={`w-full ${isMobile ? 'h-10' : ''}`} variant="outline">
                    <MapIcon className="h-4 w-4 mr-2" /> {t.propertyDetail?.onMap || 'на карте'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Описание со сворачиванием */
        }
        {complex.description && (
          <Card className="p-6">
            <PublicComplexDescription text={complex.description} />
          </Card>
        )}

        {/* На территории комплекса (бейджи) */}
        {(complex.spaSalon || complex.restaurant || complex.fitnessGym || complex.playground || complex.shop || complex.cinema || complex.coworking || complex.concertHall || complex.parking || complex.artificialWave || complex.conferenceHall) && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t.complexDetail?.onComplexTerritory}</h3>
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-3`}>
                {complex.spaSalon && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Sparkles className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.spaSalon}</span></div>
                )}
                {complex.restaurant && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Utensils className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.restaurant}</span></div>
                )}
                {complex.fitnessGym && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Dumbbell className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.fitnessGym}</span></div>
                )}
                {complex.playground && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Baby className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.playground}</span></div>
                )}
                {complex.shop && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><ShoppingBag className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.shop}</span></div>
                )}
                {complex.cinema && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Film className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.cinema}</span></div>
                )}
                {complex.coworking && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Monitor className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.coworking}</span></div>
                )}
                {complex.concertHall && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Music className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.concertHall}</span></div>
                )}
                {complex.parking && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Car className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.parking}</span></div>
                )}
                {complex.artificialWave && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Waves className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.artificialWave}</span></div>
                )}
                {complex.conferenceHall && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"><Building2 className="w-4 h-4 text-gray-600" /><span className="text-sm font-medium">{t.complexDetail?.conferenceHall}</span></div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Ссылки (без заголовка) */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Видео */}
            <div>
              {complex.videoLink && (
                <Button asChild variant="outline" className={`w-full ${isMobile ? 'h-12' : ''}`}>
                  <a href={complex.videoLink} target="_blank" rel="noopener noreferrer">
                    {t.complexDetail?.watchVideoButton}
                  </a>
                </Button>
              )}
            </div>
            {/* 3D тур */}
            <div>
              {complex.threeDTour && (
                <Button asChild variant="outline" className={`w-full ${isMobile ? 'h-12' : ''}`}>
                  <a href={complex.threeDTour} target="_blank" rel="noopener noreferrer">
                    {t.complexDetail?.view3DTourButton}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Ссылки: Шахматка + Публичный прогресс */}
        <div className="space-y-3">
          {/* Шахматка объектов (если есть привязка) */}
          {chessboardPublicId && (
            <Button
              onClick={() => navigate(`/public-chessboard/${chessboardPublicId}`)}
              className={`w-full bg-orange-500 hover:bg-orange-600 text-white ${isMobile ? 'h-12' : ''}`}
            >
              {t.complexDetail?.openChessboardButton || 'Шахматка объектов'}
            </Button>
          )}
          <Button onClick={() => navigate(`/public-building-progress/complex/${id}`)} className={`w-full bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'h-12' : ''}`}>
            <BarChart3 className="h-4 w-4 mr-2" /> {t.complexDetail?.buildingProgressButton}
          </Button>
        </div>

        {/* Список объектов комплекса (как в публичной галерее) */}
        <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{t.publicPage?.propertiesListTitle || 'Список объектов'}</h2>
        <div className={`divide-y ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
          {filteredComplexProperties.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {t.propertiesGallery?.emptyStateNoMatches || 'Объекты не найдены'}
            </div>
          ) : (
            filteredComplexProperties.map((p) => (
              <Link
                key={p.id}
                to={`/public/complex-property/${p.id}`}
                className={`flex items-stretch hover:bg-gray-50 transition-colors ${
                  isMobile ? 'flex-col gap-3 p-3' : 'gap-4 p-4'
                }`}
              >
                <div
                  className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                    isMobile ? 'w-full h-40' : 'w-48 h-32 min-w-48'
                  }`}
                >
                  {p.images?.length ? (
                    <img
                      src={p.images[0]}
                      alt={translatePropertyType(String(p.type || ''), language)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col text-gray-900 space-y-1">
                  <span className={isMobile ? 'text-base' : 'text-lg'}>
                    <span className="text-gray-600">{t.propertiesGallery?.priceLabel || 'Цена'}:</span>
                    <span className="ml-2 font-semibold">{formatPrice(p.price)}</span>
                  </span>

                  {p.type && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery?.typeLabel}:</span>
                      <span className="ml-2">{translatePropertyType(String(p.type), language)}</span>
                    </span>
                  )}
                  {p.area && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery?.areaLabel}:</span>
                      <span className="ml-2">{String(p.area)} {t.propertiesGallery?.areaText}</span>
                    </span>
                  )}
                  {p.floors !== undefined && p.floors !== null && p.floors !== '' && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertyDetail?.floors}:</span>
                      <span className="ml-2">{String(p.floors)}</span>
                    </span>
                  )}
                  {p.bedrooms !== undefined && p.bedrooms !== null && p.bedrooms !== '' && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery?.bedroomsLabel}:</span>
                      <span className="ml-2">{p.bedrooms === 0 ? t.propertiesGallery?.studio : String(p.bedrooms)}</span>
                    </span>
                  )}
                  {p.status && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery?.statusLabel}:</span>
                      <span className="ml-2">{translateConstructionStatus(String(p.status), language)}</span>
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicComplexDetail;

function PublicComplexDescription({ text }) {
  const { language } = useLanguage();
  const t = translations[language];
  const [expanded, setExpanded] = useState(false);
  const paragraphs = (text || '')
    .split(/\n{2,}|\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const visible = expanded ? paragraphs : paragraphs.slice(0, 2);
  return (
    <div>
      {visible.map((p, idx) => (
        <p key={idx} className="text-gray-700 leading-relaxed mb-3">{p}</p>
      ))}
      {paragraphs.length > 2 && (
        <button
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (t.publicPage?.collapse || 'Свернуть') : (t.publicPage?.expand || 'Развернуть')}
        </button>
      )}
    </div>
  );
}


