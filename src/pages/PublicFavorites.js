import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Timestamp, doc, getDoc, getDocs, collection, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translatePropertyType } from "../lib/utils";
import { Building2, Heart } from "lucide-react";
import { showSuccess, showError } from "../utils/notifications";
import { downloadFavoritesPdf } from "../utils/favoritesPdf";

function PublicFavorites() {
  const { currentUser, role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfLangDialog, setShowPdfLangDialog] = useState(false);
  const [pdfWithTitle, setPdfWithTitle] = useState(true);
  const [profile, setProfile] = useState(null);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
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

  // Load favorite IDs
  useEffect(() => {
    async function loadIds() {
      try {
        if (currentUser) {
          const snap = await getDocs(collection(db, 'users', currentUser.uid, 'favorites'));
          const ids = new Set();
          snap.forEach(d => ids.add(d.id));
          setFavoriteIds(ids);
        } else {
          const raw = sessionStorage.getItem('favoritesPropertyIds');
          const arr = raw ? JSON.parse(raw) : [];
          setFavoriteIds(new Set(Array.isArray(arr) ? arr : []));
        }
      } finally {
        setLoading(false);
      }
    }
    loadIds();
  }, [currentUser]);

  // Load property docs
  // Load current user profile for PDF footer
  useEffect(() => {
    async function loadProfile() {
      try {
        if (!currentUser) { setProfile(null); return; }
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) {
          const d = snap.data() || {};
          setProfile({
            name: d.displayName || d.name || '',
            email: d.email || currentUser.email || '',
            phone: d.phone || '',
            phoneCode: d.phoneCode || '',
            telegram: d.telegram || '',
            avatarUrl: d.logoUrl || ''
          });
        } else {
          setProfile(null);
        }
      } catch (_) {
        setProfile(null);
      }
    }
    loadProfile();
  }, [currentUser]);
  useEffect(() => {
    async function loadProps() {
      try {
        const ids = Array.from(favoriteIds);
        if (!ids.length) { setProperties([]); return; }
        const docs = await Promise.all(ids.map(async (pid) => {
          try {
            const snap = await getDoc(doc(db, 'properties', pid));
            if (snap.exists()) {
              return { id: pid, ...snap.data() };
            }
          } catch {}
          return null;
        }));
        setProperties(docs.filter(Boolean));
      } catch (e) {
        console.error('Ошибка загрузки избранных объектов:', e);
      }
    }
    loadProps();
  }, [favoriteIds]);

  const isFavorite = useCallback((propertyId) => favoriteIds.has(propertyId), [favoriteIds]);

  const toggleFavorite = useCallback(async (propertyId) => {
    try {
      if (!propertyId) return;
      if (currentUser) {
        const favRef = doc(db, 'users', currentUser.uid, 'favorites', propertyId);
        if (favoriteIds.has(propertyId)) {
          await deleteDoc(favRef);
          setFavoriteIds(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
        } else {
          await setDoc(favRef, { createdAt: Timestamp.now() });
          setFavoriteIds(prev => new Set(prev).add(propertyId));
        }
      } else {
        setFavoriteIds(prev => {
          const next = new Set(prev);
          if (next.has(propertyId)) next.delete(propertyId); else next.add(propertyId);
          sessionStorage.setItem('favoritesPropertyIds', JSON.stringify(Array.from(next)));
          return next;
        });
      }
    } catch (e) {
      console.error('Ошибка переключения избранного:', e);
    }
  }, [currentUser, favoriteIds]);

  const generateFavoritesShareLink = useCallback(async () => {
    try {
      if (!currentUser) {
        showError('Необходимо войти в систему');
        return;
      }
      const normalizedRole = String(role || '').toLowerCase();
      const isPremiumAgent = (
        normalizedRole === 'premium agent' ||
        normalizedRole === 'премиум агент' ||
        normalizedRole === 'premium_agent' ||
        normalizedRole === 'премиум-агент' ||
        normalizedRole === 'premium'
      );
      if (!isPremiumAgent) {
        showError('Функция доступна только премиум агентам');
        return;
      }
      const ids = Array.from(favoriteIds);
      if (!ids.length) {
        showError('Список избранного пуст');
        return;
      }

      // Получим данные пользователя для карты токена
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const u = userSnap.exists() ? (userSnap.data() || {}) : {};

      const token = `${currentUser.uid}-fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      await setDoc(doc(db, 'publicSharedLinks', token), {
        ownerId: currentUser.uid,
        ownerName: u.displayName || u.name || u.email || '',
        role: 'premium agent',
        enabled: true,
        type: 'favorites',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });

      const base = window.location.origin;
      const link = `${base}/public/shared/${encodeURIComponent(token)}?selection=${encodeURIComponent(ids.join(','))}`;
      await navigator.clipboard.writeText(link);

      const successMsg = (translations[language]?.technicalSupervision?.publicLinkCopied)
        || (translations[language]?.navigation?.publicLinkCopied)
        || 'Публичная ссылка скопирована!';
      showSuccess(successMsg);
    } catch (e) {
      console.error('generateFavoritesShareLink error', e);
      showError('Не удалось сформировать ссылку');
    }
  }, [currentUser, role, favoriteIds, language]);

  const exportFavoritesPdf = useCallback(async (lang) => {
    try {
      if (!properties.length) {
        showError('Список избранного пуст');
        return;
      }
      setIsGeneratingPdf(true);
      await downloadFavoritesPdf(properties.map(p => ({
        ...p,
        __omitTitle: !pdfWithTitle
      })), lang || language, profile);
      showSuccess(t?.favorites?.pdfCreated || 'PDF создан');
    } catch (e) {
      console.error('exportFavoritesPdf error', e);
      showError('Ошибка генерации PDF');
    } finally {
      setIsGeneratingPdf(false);
      setShowPdfLangDialog(false);
    }
  }, [properties, language, pdfWithTitle, t, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className={`mx-auto space-y-4 p-4 max-w-4xl`}>
        <div className="mb-2">
          <button
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            onClick={() => navigate('/')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.propertyDetail?.backButton || 'Назад'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl text-gray-900">{t.publicMenu?.favorites || 'Избранное'}</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (() => {
              const normalizedRole = String(role || '').toLowerCase();
              const isPremiumAgent = (
                normalizedRole === 'premium agent' ||
                normalizedRole === 'премиум агент' ||
                normalizedRole === 'premium_agent' ||
                normalizedRole === 'премиум-агент' ||
                normalizedRole === 'premium'
              );
              return isPremiumAgent && favoriteIds.size > 0;
            })() && (
              <>
                <button
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={generateFavoritesShareLink}
                >
                  {t.publicFavorites?.generateLink || 'Генерация публичной ссылки'}
                </button>
                <button
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  onClick={() => setShowPdfLangDialog(prev => !prev)}
                  disabled={isGeneratingPdf}
                >
                  {t?.favorites?.createPDF || 'Создать PDF'}
                </button>
              </>
            )}
          </div>
        </div>
        {showPdfLangDialog && (
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <span>{t?.favorites?.selectLanguagePDF || 'Выберите язык для PDF'}:</span>
            <button className="px-2 py-1 border rounded" onClick={() => exportFavoritesPdf('ru')} disabled={isGeneratingPdf}>RU</button>
            <button className="px-2 py-1 border rounded" onClick={() => exportFavoritesPdf('en')} disabled={isGeneratingPdf}>EN</button>
            <button className="px-2 py-1 border rounded" onClick={() => exportFavoritesPdf('id')} disabled={isGeneratingPdf}>ID</button>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={pdfWithTitle} onChange={(e) => setPdfWithTitle(e.target.checked)} />
              <span>{t?.favorites?.withTitle || 'с названием'}</span>
            </label>
          </div>
        )}
        {isGeneratingPdf && (
          <div className="text-sm text-gray-500">{t?.favorites?.generatingPDF || 'Создание PDF...'}</div>
        )}
        {properties.length === 0 ? (
          <div className="p-4 text-center text-gray-500">—</div>
        ) : (
          <div className={`divide-y`}>
            {properties.map((p) => (
              <Link key={p.id} to={`/public/property/${p.id}`} className="flex items-stretch gap-4 p-4 hover:bg-gray-50">
                <div className="relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 w-48 h-32 min-w-48">
                  {p.images?.length ? (
                    <img src={p.images[0]} alt={safeDisplay(p.type)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  <button
                    className={`absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${isFavorite(p.id) ? 'bg-white/90' : 'bg-white/80 hover:bg-white'}`}
                    aria-label="favorite"
                    onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }}
                  >
                    <Heart className="w-5 h-5 text-red-500" fill={isFavorite(p.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="flex flex-col text-gray-900 space-y-1">
                  {(() => {
                    const ratingRaw = p.reliabilityRating;
                    const rating = Number.isFinite(Number(ratingRaw)) ? Math.max(0, Math.min(5, parseInt(ratingRaw))) : null;
                    if (!rating) return null;
                    return (
                      <div className="flex items-center gap-1" aria-label={`${t.propertyDetail.reliabilityRating}: ${rating}`}>
                        {Array.from({ length: rating }).map((_, idx) => (
                          <span key={idx} className="text-yellow-400 text-2xl leading-none">★</span>
                        ))}
                      </div>
                    );
                  })()}
                  <span className="text-lg"><span className="text-gray-600">{t.propertiesGallery.priceLabel}:</span><span className="ml-2 font-semibold">{formatPrice(p.price)}</span></span>
                  {p.type && (<span className="text-sm"><span className="text-gray-600">{t.propertiesGallery.typeLabel}:</span><span className="ml-2">{translatePropertyType(safeDisplay(p.type), language)}</span></span>)}
                  {p.area && (<span className="text-sm"><span className="text-gray-600">{t.propertiesGallery.areaLabel}:</span><span className="ml-2">{safeDisplay(p.area)} {t.propertiesGallery.areaText}</span></span>)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicFavorites;


