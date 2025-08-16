import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Building2, Search } from "lucide-react";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useCache } from "../CacheContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict, translatePropertyType, translateConstructionStatus } from "../lib/utils";
import { Input } from "../components/ui/input";

function AgentProperties() {
  const { forceRefreshPropertiesList } = useCache();
  const { language } = useLanguage();
  const t = translations[language];

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [agentsMap, setAgentsMap] = useState({}); // { userId: userData }

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const safeDisplay = useCallback((value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }, []);

  const fetchComplexName = useCallback(async (complexId) => {
    try {
      const complexDoc = await getDoc(doc(db, "complexes", complexId));
      if (complexDoc.exists()) {
        return complexDoc.data().name;
      }
      return null;
    } catch (err) {
      console.error(t.propertiesGallery?.complexLoadError || "Complex load error", err);
      return null;
    }
  }, [t.propertiesGallery?.complexLoadError]);

  useEffect(() => {
    async function load() {
      try {
        const data = await forceRefreshPropertiesList();
        const onlyAgent = data.filter((p) => p.addedByAgent === true && !!p.createdBy);
        const withComplexNames = await Promise.all(
          onlyAgent.map(async (property) => {
            if (property.complexId) {
              try {
                const complexName = await fetchComplexName(property.complexId);
                return { ...property, complexName };
              } catch (_) {
                return property;
              }
            }
            return property;
          })
        );
        withComplexNames.sort((a, b) => {
          const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setProperties(withComplexNames);
      } catch (e) {
        console.error("Failed to load agent properties", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [forceRefreshPropertiesList, fetchComplexName]);

  // Загружаем данные по агентам (users/{createdBy}) для всех карточек
  useEffect(() => {
    async function loadAgents() {
      try {
        const uniqueIds = Array.from(new Set(properties.map(p => p.createdBy).filter(Boolean)));
        const currentMap = { ...agentsMap };
        const toFetch = uniqueIds.filter(id => !currentMap[id]);
        if (toFetch.length === 0) return;
        const results = await Promise.all(toFetch.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            return [uid, snap.exists() ? snap.data() : null];
          } catch (e) {
            console.error('Load agent error', uid, e);
            return [uid, null];
          }
        }));
        const updates = {};
        results.forEach(([uid, data]) => { updates[uid] = data; });
        setAgentsMap(prev => ({ ...prev, ...updates }));
      } catch (e) {
        console.error('Failed to load agents map', e);
      }
    }
    if (properties.length) {
      loadAgents();
    }
  }, [properties, agentsMap]);

  const filtered = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return properties.filter((p) => {
      if (!search) return true;
      const statusTranslated = p.status
        ? translateConstructionStatus(String(p.status), language).toLowerCase()
        : "";
      return (
        (p.complexName && p.complexName.toLowerCase().includes(search)) ||
        (p.complex && p.complex.toLowerCase().includes(search)) ||
        (p.district && p.district.toLowerCase().includes(search)) ||
        (p.developer && p.developer.toLowerCase().includes(search)) ||
        (p.type && p.type.toLowerCase().includes(search)) ||
        (p.status && String(p.status).toLowerCase().includes(search)) ||
        (statusTranslated && statusTranslated.includes(search)) ||
        (p.price !== undefined && p.price !== null && String(p.price).toLowerCase().includes(search)) ||
        (p.area !== undefined && p.area !== null && String(p.area).toLowerCase().includes(search)) ||
        (p.bedrooms !== undefined && p.bedrooms !== null && String(p.bedrooms).toLowerCase().includes(search))
      );
    });
  }, [properties, searchQuery, language]);

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className={`mx-auto space-y-4 p-4 ${isMobile ? 'max-w-full' : 'max-w-4xl'}`}>
        <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          {translations[language]?.navigation?.agentProperties || 'Agent Properties'}
        </h1>

        <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder={t.propertiesGallery.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          {t.propertiesGallery.searchResultsText.replace('{count}', filtered.length)}
        </div>
      </div>

      <div className={`divide-y ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {t.propertiesGallery.emptyStateNoMatches}
          </div>
        ) : (
          filtered.map((p) => (
            <Link
              key={p.id}
              to={`/property/${p.id}`}
              className={`flex items-stretch cursor-pointer hover:bg-gray-50 transition-colors ${
                isMobile ? 'flex-col gap-3 p-3' : 'gap-4 p-4'
              }`}
            >
              <div className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                isMobile ? 'w-full h-40' : 'w-48 h-32 min-w-48'
              }`}>
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
                
                {/* Бейдж "На модерации" */}
                {p.moderation === true && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      {translations[language]?.moderation?.onModeration || 'На модерации'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col text-gray-900 space-y-0.5 flex-1">
                {(p.complexName || p.complex || p.propertyName) && (
                  <span className={`font-semibold leading-none text-black ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>
                    {safeDisplay(p.complexName || p.complex || p.propertyName)}
                  </span>
                )}

                <span className={`font-semibold leading-none ${isMobile ? 'text-base' : 'text-lg'}`}>
                  {formatPrice(p.price)}
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
                {p.bedrooms !== undefined && p.bedrooms !== null && p.bedrooms !== "" && (
                  <span className="text-sm">
                    <span className="text-gray-600">{t.propertiesGallery.bedroomsLabel}:</span>
                    <span className="ml-2">{p.bedrooms === 0 ? t.propertiesGallery.studio : safeDisplay(p.bedrooms)}</span>
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

              {/* Информация об агенте справа */}
              <div
                className={`flex-shrink-0 ${isMobile ? 'mt-2' : 'ml-auto'} text-sm text-gray-800`}
                onClick={(e) => e.preventDefault()}
              >
                {(() => {
                  const agent = agentsMap[p.createdBy];
                  const title = translations[language]?.agentInfo?.title || 'Agent';
                  const nameLabel = translations[language]?.agentInfo?.name || 'Name';
                  const emailLabel = translations[language]?.agentInfo?.email || 'Email';
                  const roleLabel = translations[language]?.agentInfo?.role || 'Role';
                  const langLabel = translations[language]?.agentInfo?.language || 'Language';
                  const tgLabel = translations[language]?.agentInfo?.telegram || 'Telegram';
                  const uidLabel = translations[language]?.agentInfo?.userId || 'User ID';
                  const createdAtLabel = translations[language]?.agentInfo?.createdAt || 'Created at';

                  const createdAtVal = agent?.createdAt instanceof Timestamp
                    ? agent.createdAt.toDate().toLocaleDateString('ru-RU')
                    : (agent?.createdAt?.toDate ? agent.createdAt.toDate().toLocaleDateString('ru-RU') : null);

                  return (
                    <div className={`border ${isMobile ? 'mt-2' : 'ml-4'} border-gray-200 bg-gray-50 rounded-md p-3 w-72 max-w-xs`}>
                      <div className="font-semibold text-gray-900 mb-1">{title}</div>
                      {agent ? (
                        <ul className="space-y-0.5">
                          <li><span className="text-gray-600">{nameLabel}:</span> <span className="ml-1">{agent.name || agent.displayName || '—'}</span></li>
                          <li><span className="text-gray-600">{emailLabel}:</span> <span className="ml-1 break-all">{agent.email || '—'}</span></li>
                          <li><span className="text-gray-600">{roleLabel}:</span> <span className="ml-1">{agent.role || '—'}</span></li>
                          {agent.language && (
                            <li><span className="text-gray-600">{langLabel}:</span> <span className="ml-1">{agent.language}</span></li>
                          )}
                          {agent.telegramChatId && (
                            <li><span className="text-gray-600">{tgLabel}:</span> <span className="ml-1">{agent.telegramChatId}</span></li>
                          )}
                          <li><span className="text-gray-600">{uidLabel}:</span> <span className="ml-1 break-all">{p.createdBy}</span></li>
                          {createdAtVal && (
                            <li><span className="text-gray-600">{createdAtLabel}:</span> <span className="ml-1">{createdAtVal}</span></li>
                          )}
                        </ul>
                      ) : (
                        <div className="text-gray-500">{translations[language]?.agentInfo?.notFound || 'Agent info not found'}</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default AgentProperties;


