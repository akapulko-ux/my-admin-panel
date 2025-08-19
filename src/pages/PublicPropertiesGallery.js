import React, { useEffect, useMemo, useState, useCallback } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, getDocs, where, query, collection } from "firebase/firestore";
import { Building2, Search, Filter, ChevronDown, X as XIcon, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCache } from "../CacheContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict, translatePropertyType, translateConstructionStatus } from "../lib/utils";
import { landingTranslations } from "../lib/landingTranslations";
import { useAuth } from "../AuthContext";
import { initPageTracking } from "../utils/pageAnalytics";

import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { CustomSelect } from "../components/ui/custom-select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { Badge } from "../components/ui/badge";
import LanguageSwitcher from "../components/LanguageSwitcher";
import PropertyPlacementModal from "../components/PropertyPlacementModal";

function PublicPropertiesGallery() {
  const { forceRefreshPropertiesList } = useCache();
  const { language } = useLanguage();
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const t = translations[language];
  const lt = landingTranslations[language];
  
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUserProperties, setHasUserProperties] = useState(false);
  const [filters, setFilters] = useState({
    priceMin: "",
    priceMax: "",
    areaMin: "",
    areaMax: "",
    bedrooms: "all",
    district: "all",
    type: "all",
    status: "all",
    addedByMe: false,
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Инициализация отслеживания страницы для аналитики
  useEffect(() => {
    const cleanup = initPageTracking('/public');
    return cleanup;
  }, []);

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

  const handlePlaceProperty = () => {
    if (currentUser && ['admin', 'moderator', 'agent', 'premium agent'].includes(role)) {
      // Авторизованный пользователь с нужной ролью - переходим на страницу создания
      navigate('/agent-property/create');
    } else {
      // Неавторизованный или без нужной роли - открываем модальное окно
      setIsPlacementModalOpen(true);
    }
  };

  

  const fetchProperties = useCallback(async () => {
    try {
      const data = await forceRefreshPropertiesList();

      // Загружаем все комплексы и строим быстрые мапы: id -> number, name(normalized) -> number/id
      const complexesSnap = await getDocs(collection(db, "complexes"));
      const complexNumberById = {};
      const complexNumberByName = {};
      const complexIdByName = {};
      complexesSnap.forEach((docSnap) => {
        const c = docSnap.data();
        let num = c?.number;
        if (typeof num === 'string') {
          const parsed = parseInt(num, 10);
          num = Number.isNaN(parsed) ? null : parsed;
        }
        if (typeof num !== 'number') num = null;
        complexNumberById[docSnap.id] = num;
        if (c?.name) {
          const key = String(c.name).trim().toLowerCase();
          complexNumberByName[key] = num;
          complexIdByName[key] = docSnap.id;
        }
      });

      const withComplexInfo = await Promise.all(
        data.map(async (property) => {
          const augmented = { ...property };

          // Номер и id комплекса по id или по имени (нормализуем имя)
          if (property.complexId && Object.prototype.hasOwnProperty.call(complexNumberById, property.complexId)) {
            augmented.complexNumber = complexNumberById[property.complexId];
            augmented.complexResolvedId = property.complexId;
          } else if (property.complex) {
            const key = String(property.complex).trim().toLowerCase();
            augmented.complexNumber = Object.prototype.hasOwnProperty.call(complexNumberByName, key)
              ? complexNumberByName[key]
              : null;
            augmented.complexResolvedId = Object.prototype.hasOwnProperty.call(complexIdByName, key)
              ? complexIdByName[key]
              : null;
          } else {
            augmented.complexNumber = null;
            augmented.complexResolvedId = null;
          }

          // Статус проверки застройщика
          try {
            if (property.developerId) {
              const devDoc = await getDoc(doc(db, "developers", property.developerId));
              augmented.isDeveloperApproved = devDoc.exists() && devDoc.data().approved === true;
            } else if (property.developer) {
              const q = query(collection(db, "developers"), where("name", "==", property.developer));
              const snap = await getDocs(q);
              augmented.isDeveloperApproved = !snap.empty && !!snap.docs[0].data().approved;
            } else {
              augmented.isDeveloperApproved = false;
            }
          } catch {
            augmented.isDeveloperApproved = false;
          }

          return augmented;
        })
      );

      // Сортировка по номеру комплекса (возрастание), без номера в конец; при равенстве — новые сверху
      withComplexInfo.sort((a, b) => {
        const aNum = typeof a.complexNumber === 'number' ? a.complexNumber : Number.POSITIVE_INFINITY;
        const bNum = typeof b.complexNumber === 'number' ? b.complexNumber : Number.POSITIVE_INFINITY;
        if (aNum !== bNum) return aNum - bNum;
        const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      // Фильтруем объекты: скрытые не показываем никому
      const notHiddenProperties = withComplexInfo.filter((p) => !p?.isHidden);
      
      // Разделяем объекты на обычные и на модерации
      const normalProperties = notHiddenProperties.filter((p) => p?.moderation !== true);
      const moderationProperties = notHiddenProperties.filter((p) => p?.moderation === true);
      
      // Объекты на модерации показываем только их создателям в начале списка
      const creatorModerationProperties = moderationProperties.filter((p) => 
        currentUser && p?.createdBy === currentUser.uid
      );
      
      // Объединяем: сначала объекты на модерации от создателя, потом обычные
      const visibleProperties = [...creatorModerationProperties, ...normalProperties];
      
      setProperties(visibleProperties);
      
      // Проверяем, есть ли у текущего пользователя объекты
      if (currentUser) {
        const userHasProperties = visibleProperties.some(p => p.createdBy === currentUser.uid);
        setHasUserProperties(userHasProperties);
      } else {
        setHasUserProperties(false);
      }
    } catch (err) {
      console.error(t.propertiesGallery.dataLoadError || "Ошибка загрузки объектов:", err);
    } finally {
      setLoading(false);
    }
  }, [forceRefreshPropertiesList, t.propertiesGallery.dataLoadError, currentUser]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filterOptions = useMemo(() => {
    const options = {
      districts: [...new Set(properties.map((p) => p.district).filter(Boolean))],
      types: [...new Set(properties.map((p) => p.type).filter(Boolean))],
      bedrooms: [
        ...new Set(
          properties
            .map((p) => p.bedrooms)
            .filter((n) => n !== undefined && n !== null && n !== "")
        ),
      ],
    };
    options.districts.sort();
    options.types.sort();
    options.bedrooms.sort((a, b) => a - b);
    return options;
  }, [properties]);

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const searchText = searchQuery.toLowerCase();
      const statusTranslated = property.status
        ? translateConstructionStatus(String(property.status), language).toLowerCase()
        : '';
      const matchesSearch =
        !searchQuery ||
        (property.district && property.district.toLowerCase().includes(searchText)) ||
        (property.type && property.type.toLowerCase().includes(searchText)) ||
        // Поиск по статусу (как по исходному значению, так и по переводу)
        (property.status && String(property.status).toLowerCase().includes(searchText)) ||
        (statusTranslated && statusTranslated.includes(searchText)) ||
        // Поиск по числовым полям
        (property.price !== undefined && property.price !== null && String(property.price).toLowerCase().includes(searchText)) ||
        (property.area !== undefined && property.area !== null && String(property.area).toLowerCase().includes(searchText)) ||
        (property.bedrooms !== undefined && property.bedrooms !== null && String(property.bedrooms).toLowerCase().includes(searchText)) ||
        (property.unitsCount !== undefined && property.unitsCount !== null && String(property.unitsCount).toLowerCase().includes(searchText));

      const matchesPrice =
        (!filters.priceMin || property.price >= Number(filters.priceMin)) &&
        (!filters.priceMax || property.price <= Number(filters.priceMax));

      const matchesArea =
        (!filters.areaMin || property.area >= Number(filters.areaMin)) &&
        (!filters.areaMax || property.area <= Number(filters.areaMax));

      const matchesBedrooms = filters.bedrooms === "all" || property.bedrooms === Number(filters.bedrooms);
      const matchesDistrict = filters.district === "all" || property.district === filters.district;
      const matchesType = filters.type === "all" || property.type === filters.type;
      const matchesStatus = filters.status === "all" || property.status === filters.status;
      const matchesAddedByMe = !filters.addedByMe || (currentUser && property.createdBy === currentUser.uid);

      return matchesSearch && matchesPrice && matchesArea && matchesBedrooms && matchesDistrict && matchesType && matchesStatus && matchesAddedByMe;
    });
  }, [properties, searchQuery, filters, language, currentUser]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilters({
      priceMin: "",
      priceMax: "",
      areaMin: "",
      areaMax: "",
      bedrooms: "all",
      district: "all",
      type: "all",
      status: "all",
      addedByMe: false,
    });
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
      <div className={`mx-auto space-y-4 p-4 ${isMobile ? "max-w-full" : "max-w-4xl"}`}>
        {/* Заголовок, кнопка размещения объекта и переключатель языка в одной строке */}
        <div className="flex items-center justify-between gap-3">
          <h1 className={`font-bold text-gray-900 ${isMobile ? "text-xl" : "text-2xl"}`}>
            {t.navigation?.publicInvestorTitle || 'IT AGENT BALI'}
          </h1>
          <div className="flex items-center gap-3">
                            {!isMobile && (
                  <Button
                    onClick={handlePlaceProperty}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {lt.placePropertyTitle}
                  </Button>
                )}
            <LanguageSwitcher />
          </div>
        </div>
        
        {/* Кнопка размещения объекта на отдельной строке для мобильных устройств */}
                    {isMobile && (
              <Button
                onClick={handlePlaceProperty}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {lt.placePropertyTitle}
              </Button>
            )}

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
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                {t.propertiesGallery.filtersTitle}
                <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                  {[
                    filters.priceMin,
                    filters.priceMax,
                    filters.areaMin,
                    filters.areaMax,
                    filters.bedrooms !== "all" ? 1 : 0,
                    filters.district !== "all" ? 1 : 0,
                    filters.type !== "all" ? 1 : 0,
                    filters.status !== "all" ? 1 : 0,
                    filters.addedByMe ? 1 : 0,
                  ].filter(Boolean).length}
                </Badge>
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isFiltersOpen ? "transform rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent>
            <Card className="p-4 mt-2">
              <div className="space-y-4">
                <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.priceLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderFrom}
                        value={filters.priceMin}
                        onChange={(e) => setFilters((prev) => ({ ...prev, priceMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderTo}
                        value={filters.priceMax}
                        onChange={(e) => setFilters((prev) => ({ ...prev, priceMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.areaLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderFrom}
                        value={filters.areaMin}
                        onChange={(e) => setFilters((prev) => ({ ...prev, areaMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderTo}
                        value={filters.areaMax}
                        onChange={(e) => setFilters((prev) => ({ ...prev, areaMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.bedroomsLabel}</Label>
                    <CustomSelect
                      value={filters.bedrooms}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, bedrooms: value }))}
                      options={[
                        { label: t.propertiesGallery.allBedrooms, value: "all" },
                        { label: t.propertiesGallery.studio, value: "0" },
                        ...filterOptions.bedrooms
                          .filter((num) => num !== "" && num !== null && num !== undefined)
                          .map((num) => ({
                            label: String(num),
                            value: String(num),
                          })),
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.districtLabel}</Label>
                    <CustomSelect
                      value={filters.district}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, district: value }))}
                      options={[
                        { label: t.propertiesGallery.allDistricts, value: "all" },
                        ...filterOptions.districts
                          .filter((d) => d !== "" && d !== null && d !== undefined)
                          .map((district) => ({
                            label: translateDistrict(district, language),
                            value: String(district),
                          })),
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.typeLabel}</Label>
                    <CustomSelect
                      value={filters.type}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                      options={[
                        { label: t.propertiesGallery.allTypes, value: "all" },
                        ...filterOptions.types
                          .filter((t) => t !== "" && t !== null && t !== undefined)
                          .map((type) => ({
                            label: translatePropertyType(type, language),
                            value: String(type),
                          })),
                      ]}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                      <XIcon className="h-4 w-4 mr-2" />
                      {t.propertiesGallery.resetFiltersButton}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Кнопки-фильтры по статусу */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.status === "all" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "all", addedByMe: false }))}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            {t.propertiesGallery.allStatuses || 'Все статусы'}
          </Button>
          <Button
            variant={filters.status === "Проект" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "Проект", addedByMe: false }))}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            {t.propertiesGallery.statusProject || 'Проект'}
          </Button>
          <Button
            variant={filters.status === "Строится" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "Строится", addedByMe: false }))}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            {t.propertiesGallery.statusUnderConstruction || 'Строится'}
          </Button>
          <Button
            variant={filters.status === "Готовый" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "Готовый", addedByMe: false }))}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            {t.propertiesGallery.statusReady || 'Готовый'}
          </Button>
          <Button
            variant={filters.status === "От собственника" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "От собственника", addedByMe: false }))}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            {t.propertiesGallery.statusFromOwner || 'От собственника'}
          </Button>
          
          {/* Кнопка "Добавлено мной" для авторизованных пользователей с объектами */}
          {hasUserProperties && (
            <Button
              variant={filters.addedByMe ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, addedByMe: !prev.addedByMe, status: "all" }))}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              {t.propertiesGallery.addedByMe || 'Добавлено мной'}
            </Button>
          )}
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
            const isOnModeration = p.moderation === true;
            const isCreator = currentUser && p.createdBy === currentUser.uid;
            
            // Если объект на модерации и пользователь не его создатель - не показываем
            if (isOnModeration && !isCreator) {
              return null;
            }
            
            // Определяем, активен ли объект (можно ли перейти на страницу)
            const isActive = !isOnModeration;
            
            const cardContent = (
              <div
                className={`flex items-stretch transition-colors ${
                  isMobile ? "flex-col gap-3 p-3" : "gap-4 p-4"
                } ${
                  isActive 
                    ? "hover:bg-gray-50 cursor-pointer" 
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                    isMobile ? "w-full h-40" : "w-48 h-32 min-w-48"
                  }`}
                >
                  {/* Бейдж "Добавлено мной" сверху фотографии */}
                  {isCreator && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="border bg-blue-100 text-blue-800 border-blue-200 text-xs">
                        {t.propertiesGallery?.addedByMe || 'Добавлено мной'}
                      </Badge>
                    </div>
                  )}
                  
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
                  {/* ВНИМАНИЕ: умышленно НЕ показываем Название объекта, Комплекс и Застройщика */}

                  {p.isDeveloperApproved === true && (
                    <div className="mb-1">
                      <Badge className="border bg-green-100 text-green-800 border-green-200">
                        {t.propertyDetail?.serviceVerified || 'Проверено сервисом'}
                      </Badge>
                    </div>
                  )}

                  {/* Бейдж "На модерации" для объектов на модерации */}
                  {isOnModeration && (
                    <div className="mb-1">
                      <Badge className="border bg-yellow-100 text-yellow-800 border-yellow-200">
                        {t.moderation?.onModeration || 'На модерации'}
                      </Badge>
                    </div>
                  )}



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
                  {p.bedrooms !== undefined && p.bedrooms !== null && p.bedrooms !== "" && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery.bedroomsLabel}:</span>
                      <span className="ml-2">
                        {p.bedrooms === 0 ? t.propertiesGallery.studio : safeDisplay(p.bedrooms)}
                      </span>
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
                </div>
              </div>
            );
            
            // Оборачиваем в Link только если объект активен
            if (isActive) {
              return (
                <Link key={p.id} to={`/public/property/${p.id}`}>
                  {cardContent}
                </Link>
              );
            } else {
              return (
                <div key={p.id}>
                  {cardContent}
                </div>
              );
            }
          })
        )}
      </div>
      
      {/* Модальное окно размещения объекта */}
      <PropertyPlacementModal 
        isOpen={isPlacementModalOpen}
        onClose={() => setIsPlacementModalOpen(false)}
      />
    </div>
  );
}

export default PublicPropertiesGallery;


