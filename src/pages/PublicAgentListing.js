import React, { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, getDocs, where, query, collection } from "firebase/firestore";
import { Building2, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useCache } from "../CacheContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict, translatePropertyType, translateConstructionStatus } from "../lib/utils";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Input } from "../components/ui/input";

function PublicAgentListing() {
  const { agentId } = useParams();
  const { forceRefreshPropertiesList } = useCache();
  const { language } = useLanguage();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentValid, setAgentValid] = useState(null); // null unknown, true ok, false blocked

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Validate agent role is premium agent
  useEffect(() => {
    async function checkAgent() {
      try {
        const uref = doc(db, "users", agentId);
        const snap = await getDoc(uref);
        if (!snap.exists()) {
          setAgentValid(false);
          return;
        }
        const role = String(snap.data()?.role || '').toLowerCase().trim();
        if (role === 'premium agent' || role === 'премиум агент' || role === 'premium_agent' || role === 'премиум-агент') {
          setAgentValid(true);
        } else {
          setAgentValid(false);
        }
      } catch {
        setAgentValid(false);
      }
    }
    if (agentId) checkAgent();
  }, [agentId]);

  const searchPlaceholder = useMemo(() => {
    const base = t.propertiesGallery.searchPlaceholder || "";
    return language === "ru" ? base.replace("названию", "цене") : base;
  }, [t.propertiesGallery.searchPlaceholder, language]);

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

  const fetchProperties = useCallback(async () => {
    try {
      const data = await forceRefreshPropertiesList();

      // Enrich with complex info similar to public gallery (slimmed)
      const complexesSnap = await getDocs(collection(db, "complexes"));
      const complexNumberById = {};
      const complexNameById = {};
      complexesSnap.forEach((docSnap) => {
        const c = docSnap.data();
        let num = c?.number;
        if (typeof num === 'string') {
          const parsed = parseInt(num, 10);
          num = Number.isNaN(parsed) ? null : parsed;
        }
        if (typeof num !== 'number') num = null;
        complexNumberById[docSnap.id] = num;
        complexNameById[docSnap.id] = c?.name || null;
      });

      const withComplexInfo = data.map((property) => {
        const augmented = { ...property };
        if (property.complexId && Object.prototype.hasOwnProperty.call(complexNumberById, property.complexId)) {
          augmented.complexNumber = complexNumberById[property.complexId];
          augmented.complexResolvedName = complexNameById[property.complexId] || null;
        }
        return augmented;
      });

      const notHidden = withComplexInfo.filter((p) => !p?.isHidden);
      const normal = notHidden.filter((p) => p?.moderation !== true);

      // Sort similar to public gallery
      normal.sort((a, b) => {
        const aNum = typeof a.complexNumber === 'number' ? a.complexNumber : Number.POSITIVE_INFINITY;
        const bNum = typeof b.complexNumber === 'number' ? b.complexNumber : Number.POSITIVE_INFINITY;
        if (aNum !== bNum) return aNum - bNum;
        const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setProperties(normal);
    } finally {
      setLoading(false);
    }
  }, [forceRefreshPropertiesList]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const searchText = searchQuery.toLowerCase();
      const langs = ['ru', 'en', 'id'];
      const statusTranslatedAll = property.status
        ? langs.map(l => translateConstructionStatus(String(property.status), l).toLowerCase())
        : [];
      const districtTranslatedAll = property.district
        ? langs.map(l => translateDistrict(String(property.district), l).toLowerCase())
        : [];
      const typeTranslatedAll = property.type
        ? langs.map(l => translatePropertyType(String(property.type), l).toLowerCase())
        : [];
      const matchesSearch =
        !searchQuery ||
        (property.district && property.district.toLowerCase().includes(searchText)) ||
        (districtTranslatedAll.some(s => s.includes(searchText))) ||
        (property.type && property.type.toLowerCase().includes(searchText)) ||
        (typeTranslatedAll.some(s => s.includes(searchText))) ||
        (property.status && String(property.status).toLowerCase().includes(searchText)) ||
        (statusTranslatedAll.some(s => s.includes(searchText))) ||
        (property.price !== undefined && property.price !== null && String(property.price).toLowerCase().includes(searchText)) ||
        (property.area !== undefined && property.area !== null && String(property.area).toLowerCase().includes(searchText));

      return matchesSearch;
    });
  }, [properties, searchQuery]);

  if (agentValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white text-center">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">{t.agentPublicListing?.premiumRequiredTitle || 'Требуется премиум‑подписка'}</h1>
          <p className="text-gray-600">{t.agentPublicListing?.premiumRequiredText || 'Для использования этой страницы необходимо оформить премиум подписку.'}</p>
        </div>
      </div>
    );
  }

  if (loading || agentValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className={`mx-auto space-y-4 p-4 ${isMobile ? "max-w-full" : "max-w-4xl"}`}>
        {/* Заголовок и переключатель языка (без меню и авторизации) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className={`font-bold text-gray-900 ${isMobile ? "text-xl" : "text-2xl"}`}>
              {t.navigation?.publicInvestorTitle || 'IT AGENT BALI'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Поиск */}
        <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          {t.propertiesGallery.searchResultsText.replace("{count}", filteredProperties.length)}
        </div>
      </div>

      <div className={`divide-y ${isMobile ? "max-w-full" : "max-w-4xl mx-auto"}`}>
        {filteredProperties.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {t.propertiesGallery.emptyStateNoMatches}
          </div>
        ) : (
          filteredProperties.map((p) => {
            const cardContent = (
              <div
                className={`flex items-stretch transition-colors ${
                  isMobile ? "flex-col gap-3 p-3" : "gap-4 p-4"
                } hover:bg-gray-50 cursor-pointer`}
              >
                <div
                  className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                    isMobile ? "w-full h-40" : "w-48 h-32 min-w-48"
                  }`}
                >
                  {p.images?.length ? (
                    <img
                      src={p.images[0]}
                      alt={safeDisplay(p.type) || t.propertiesGallery.propertyAltText}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col text-gray-900 space-y-1">
                  <span className={isMobile ? "text-base" : "text-lg"}>
                    <span className="text-gray-600">{t.propertiesGallery.priceLabel}:</span>
                    <span className="ml-2 font-semibold">{formatPrice(p.price)}</span>
                  </span>

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
                </div>
              </div>
            );

            return (
              <Link key={p.id} to={`/public/agent/property/${p.id}/${agentId}`}>
                {cardContent}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PublicAgentListing;










