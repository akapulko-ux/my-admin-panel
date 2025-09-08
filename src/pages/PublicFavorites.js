import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Timestamp, doc, getDoc, getDocs, collection, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translatePropertyType } from "../lib/utils";
import { Building2 } from "lucide-react";

function PublicFavorites() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

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
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-2xl text-gray-900">{t.publicMenu?.favorites || 'Избранное'}</h1>
          <button
            className="text-blue-600 hover:underline"
            onClick={() => navigate('/')}
          >
            {t.propertyDetail?.backButton || 'Назад'}
          </button>
        </div>

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
                    className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${isFavorite(p.id) ? 'bg-white/90' : 'bg-white/80 hover:bg-white'}`}
                    aria-label="favorite"
                    onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite(p.id) ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="2" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
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


