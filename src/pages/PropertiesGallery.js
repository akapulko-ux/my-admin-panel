import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Building2, Search, X, Filter, ChevronDown, Edit2, Check, X as XIcon } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useCache } from "../CacheContext";
import { showSuccess, showError } from "../utils/notifications";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict, translatePropertyType, translateConstructionStatus } from "../lib/utils";

// Импорт компонентов shadcn
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

function PropertiesGallery() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [developerName, setDeveloperName] = useState(null);
  const { currentUser, role } = useAuth();
  const { forceRefreshPropertiesList } = useCache();
  const { language } = useLanguage();
  const t = translations[language];
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [roiAvailability, setRoiAvailability] = useState({});

  // Проверка размера экрана
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Состояния для поиска и фильтрации
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    priceMin: "",
    priceMax: "",
    areaMin: "",
    areaMax: "",
    bedrooms: "all",
    district: "all",
    type: "all",
  });

  // Получаем уникальные значения для фильтров из данных
  const filterOptions = useMemo(() => {
    const options = {
      districts: [...new Set(properties.map(p => p.district).filter(v => v !== undefined && v !== null && v !== ''))],
      types: [...new Set(properties.map(p => p.type).filter(v => v !== undefined && v !== null && v !== ''))],
      bedrooms: [...new Set(properties.map(p => p.bedrooms).filter(n => n !== undefined && n !== null && n !== ''))],
    };
    
    // Сортируем опции
    options.districts.sort();
    options.types.sort();
    options.bedrooms.sort((a, b) => a - b);
    
    return options;
  }, [properties]);

  // Проверка доступа к редактированию
  const hasEditAccess = useMemo(() => {
    // Разрешаем редактирование только админам, модераторам и застройщикам
    return ['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role);
  }, [role]);

  // Безопасное отображение любых типов значений
  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Получение имени застройщика по ID
  const fetchDeveloperName = useCallback(async (developerId) => {
    try {
      const developerDoc = await getDoc(doc(db, "developers", developerId));
      if (developerDoc.exists()) {
        return developerDoc.data().name;
      }
      return null;
    } catch (err) {
      console.error(t.propertiesGallery.developerLoadError, err);
      return null;
    }
  }, [t.propertiesGallery.developerLoadError]);

  // Получение названия комплекса по ID
  const fetchComplexName = useCallback(async (complexId) => {
    try {
      const complexDoc = await getDoc(doc(db, "complexes", complexId));
      if (complexDoc.exists()) {
        return complexDoc.data().name;
      }
      return null;
    } catch (err) {
      console.error(t.propertiesGallery.complexLoadError, err);
      return null;
    }
  }, [t.propertiesGallery.complexLoadError]);

  // Загрузка данных из кеша или Firestore
  const fetchProperties = useCallback(async () => {
    try {
      // Если пользователь - застройщик, получаем его developerId из Firestore
      let developerNameToFilter = null;
      if (['застройщик', 'премиум застройщик'].includes(role) && currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().developerId) {
          developerNameToFilter = await fetchDeveloperName(userDoc.data().developerId);
          setDeveloperName(developerNameToFilter);
        }
      }

      // Принудительно обновляем данные при каждом переходе на страницу
      const data = await forceRefreshPropertiesList();

      // Фильтруем объекты для застройщика
      let filteredData = data;
      if (['застройщик', 'премиум застройщик'].includes(role) && developerNameToFilter) {
        filteredData = data.filter(property => property.developer === developerNameToFilter);
      }

      // Загружаем названия комплексов для объектов
      const propertiesWithComplexNames = await Promise.all(
        filteredData.map(async (property) => {
          if (property.complexId) {
            try {
              const complexName = await fetchComplexName(property.complexId);
              return { ...property, complexName };
            } catch (err) {
              console.error(t.propertiesGallery.complexLoadError, err);
              return property;
            }
          }
          return property;
        })
      );

      // Сортировка - новые сверху
      propertiesWithComplexNames.sort((a, b) => {
        const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setProperties(propertiesWithComplexNames);
    } catch (err) {
      console.error(t.propertiesGallery.dataLoadError || "Ошибка загрузки объектов:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, role, fetchDeveloperName, fetchComplexName, forceRefreshPropertiesList, t.propertiesGallery.complexLoadError, t.propertiesGallery.dataLoadError]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Для точной проверки ROI: по каждому объекту проверяем существование документа properties/{id}/calculations/roi
  useEffect(() => {
    async function checkRoiForProperties(ids) {
      const updates = {};
      await Promise.all(ids.map(async (pid) => {
        try {
          const roiDocRef = doc(db, 'properties', pid, 'calculations', 'roi');
          const roiSnap = await getDoc(roiDocRef);
          updates[pid] = roiSnap.exists();
        } catch (e) {
          console.error('ROI check error for property', pid, e);
        }
      }));
      setRoiAvailability(prev => ({ ...prev, ...updates }));
    }
    // Проверяем только для тех, кого ещё нет в карте
    const missingIds = properties
      .map(p => p.id)
      .filter(Boolean)
      .filter(pid => roiAvailability[pid] === undefined);
    if (missingIds.length) {
      checkRoiForProperties(missingIds);
    }
  }, [properties, roiAvailability]);

  // Обработчики для обновления данных при возврате к странице
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProperties();
      }
    };

    const handleFocus = () => {
      fetchProperties();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchProperties]);

  // Форматирование цены в USD без копеек
  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Фильтрация объектов
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Текстовый поиск
      const searchText = searchQuery.toLowerCase();
      const statusTranslated = property.status
        ? translateConstructionStatus(String(property.status), language).toLowerCase()
        : '';
      const matchesSearch = 
        !searchQuery ||
        (property.complexName && property.complexName.toLowerCase().includes(searchText)) ||
        (property.complex && property.complex.toLowerCase().includes(searchText)) ||
        (property.district && property.district.toLowerCase().includes(searchText)) ||
        (property.developer && property.developer.toLowerCase().includes(searchText)) ||
        (property.type && property.type.toLowerCase().includes(searchText)) ||
        // Статус (оригинал и перевод)
        (property.status && String(property.status).toLowerCase().includes(searchText)) ||
        (statusTranslated && statusTranslated.includes(searchText)) ||
        // Поиск по числовым полям
        (property.price !== undefined && property.price !== null && String(property.price).toLowerCase().includes(searchText)) ||
        (property.area !== undefined && property.area !== null && String(property.area).toLowerCase().includes(searchText)) ||
        (property.bedrooms !== undefined && property.bedrooms !== null && String(property.bedrooms).toLowerCase().includes(searchText)) ||
        (property.unitsCount !== undefined && property.unitsCount !== null && String(property.unitsCount).toLowerCase().includes(searchText));

      // Фильтры
      const matchesPrice = 
        (!filters.priceMin || property.price >= Number(filters.priceMin)) &&
        (!filters.priceMax || property.price <= Number(filters.priceMax));

      const matchesArea = 
        (!filters.areaMin || property.area >= Number(filters.areaMin)) &&
        (!filters.areaMax || property.area <= Number(filters.areaMax));

      const matchesBedrooms = 
        filters.bedrooms === "all" || 
        property.bedrooms === Number(filters.bedrooms);

      const matchesDistrict = 
        filters.district === "all" || 
        property.district === filters.district;

      const matchesType = 
        filters.type === "all" || 
        property.type === filters.type;

      return matchesSearch && matchesPrice && matchesArea && matchesBedrooms && matchesDistrict && matchesType;
    });
  }, [properties, searchQuery, filters, language]);

  // Сброс фильтров
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
    });
  };

  // Функция для подсчета активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.priceMin) count++;
    if (filters.priceMax) count++;
    if (filters.areaMin) count++;
    if (filters.areaMax) count++;
    if (filters.bedrooms !== "all") count++;
    if (filters.district !== "all") count++;
    if (filters.type !== "all") count++;
    return count;
  }, [filters]);

  // Функция для обновления цены объекта
  const handlePriceUpdate = async (propertyId, newPriceValue) => {
    // Дополнительная проверка доступа
    if (!hasEditAccess) {
      showError(t.propertiesGallery.editPermissionError);
      return;
    }

    try {
      const price = parseFloat(newPriceValue);
      if (isNaN(price) || price < 0) {
        showError(t.propertiesGallery.priceValidationError);
        return;
      }

      await updateDoc(doc(db, "properties", propertyId), {
        price: price
      });

      // Обновляем локальное состояние
      setProperties(prevProperties =>
        prevProperties.map(p =>
          p.id === propertyId ? { ...p, price: price } : p
        )
      );

      setEditingPrice(null);
      setNewPrice("");
      showSuccess(t.propertiesGallery.priceUpdateSuccess);
    } catch (error) {
      console.error("Ошибка при обновлении цены:", error);
      showError(t.propertiesGallery.priceUpdateError);
    }
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
      {/* Заголовок и поиск */}
      <div className={`mx-auto space-y-4 p-4 ${isMobile ? 'max-w-full' : 'max-w-4xl'}`}>
        {['застройщик', 'премиум застройщик'].includes(role) && developerName ? (
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {t.propertiesGallery.developerPropertiesTitle}: {developerName}
          </h1>
        ) : (
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {t.propertiesGallery.title}
          </h1>
        )}

        {/* Поиск и кнопка фильтров */}
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
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                {t.propertiesGallery.filtersTitle}
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 bg-primary text-primary-foreground"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isFiltersOpen ? 'transform rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Панель фильтров */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent>
            <Card className="p-4 mt-2">
              <div className="space-y-4">
                {/* Фильтры */}
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {/* Цена */}
                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.priceLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderFrom}
                        value={filters.priceMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderTo}
                        value={filters.priceMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Площадь */}
                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.areaLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderFrom}
                        value={filters.areaMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, areaMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderTo}
                        value={filters.areaMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, areaMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Спальни */}
                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.bedroomsLabel}</Label>
                    <CustomSelect
                      value={filters.bedrooms}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, bedrooms: value }))}
                      options={[
                        { label: t.propertiesGallery.allBedrooms, value: "all" },
                        { label: t.propertiesGallery.studio, value: "0" },
                        ...filterOptions.bedrooms
                          .filter(num => num !== '' && num !== null && num !== undefined)
                          .map(num => ({ label: String(num), value: String(num) }))
                      ]}
                    />
                  </div>

                  {/* Район */}
                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.districtLabel}</Label>
                    <CustomSelect
                      value={filters.district}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, district: value }))}
                      options={[
                        { label: t.propertiesGallery.allDistricts, value: "all" },
                        ...filterOptions.districts
                          .filter(d => d !== '' && d !== null && d !== undefined)
                          .map(district => ({ label: translateDistrict(district, language), value: String(district) }))
                      ]}
                    />
                  </div>

                  {/* Тип */}
                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.typeLabel}</Label>
                    <CustomSelect
                      value={filters.type}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                      options={[
                        { label: t.propertiesGallery.allTypes, value: "all" },
                        ...filterOptions.types
                          .filter(t => t !== '' && t !== null && t !== undefined)
                          .map(type => ({ label: translatePropertyType(type, language), value: String(type) }))
                      ]}
                    />
                  </div>

                  {/* Кнопка сброса */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t.propertiesGallery.resetFiltersButton}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Результаты поиска */}
        <div className="text-sm text-gray-500 mb-4">
          {t.propertiesGallery.searchResultsText.replace('{count}', filteredProperties.length)}
        </div>
      </div>

      {/* Список карточек */}
      <div className={`divide-y ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
        {filteredProperties.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {properties.length === 0 
              ? (['застройщик', 'премиум застройщик'].includes(role) 
                  ? t.propertiesGallery.emptyStateNoDeveloperProperties
                  : t.propertiesGallery.emptyStateNoProperties)
              : t.propertiesGallery.emptyStateNoMatches}
          </div>
        ) : (
          filteredProperties.map((p) => (
            <Link
              key={p.id}
              to={`/property/${p.id}`}
              className={`flex items-stretch cursor-pointer hover:bg-gray-50 transition-colors ${
                isMobile 
                  ? 'flex-col gap-3 p-3' 
                  : 'gap-4 p-4'
              }`}
            >
              {/* Изображение */}
              <div className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                isMobile 
                  ? 'w-full h-40' 
                  : 'w-48 h-32 min-w-48'
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
              </div>

              {/* Текстовая информация */}
              <div className="flex flex-col text-gray-900 space-y-0.5 flex-1">
                {(p.complexName || p.complex || p.propertyName) && (
                  <span className={`font-semibold leading-none text-black ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>
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
                      {Array.from({ length: rating }).map((_, idx) => (
                        <span key={idx} className="text-yellow-400 text-2xl leading-none">★</span>
                      ))}
                    </div>
                  );
                })()}

                {/* Цена с возможностью редактирования + лейбл */}
                <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                  <span className="text-sm text-gray-600">{t.propertiesGallery.priceLabel}:</span>
                  {editingPrice === p.id && hasEditAccess ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-32 h-8"
                        placeholder={t.propertiesGallery.newPricePlaceholder}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handlePriceUpdate(p.id, newPrice)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingPrice(null);
                          setNewPrice("");
                        }}
                      >
                        <XIcon className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className={`font-semibold leading-none ${
                        isMobile ? 'text-base' : 'text-lg'
                      }`}>
                        {formatPrice(p.price)}
                      </span>
                      {hasEditAccess && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingPrice(p.id);
                            setNewPrice(p.price?.toString() || "");
                          }}
                        >
                          <Edit2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </>
                  )}
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
                {/* Показываем застройщика только для не-застройщиков */}
                {role !== 'застройщик' && p.developer && (
                  <span className="text-sm text-gray-600">
                    {t.propertiesGallery.developerText} {safeDisplay(p.developer)}
                  </span>
                )}
              </div>

              {/* Блок незаполненных полей справа */}
              <div className={`flex-shrink-0 ${isMobile ? 'mt-2' : 'ml-auto'} text-sm text-red-600`}
                   onClick={(e) => e.preventDefault()}>
                {(() => {
                  const isEmpty = (val) => val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val));

                  const characteristics = [];
                  const documents = [];

                  // Основные поля (Характеристики)
                  if (isEmpty(p.bedrooms)) characteristics.push(t.propertyDetail.bedrooms);
                  if (isEmpty(p.area)) characteristics.push(t.propertyDetail.area);
                  if (isEmpty(p.landArea) && String(p.type || '').trim().toLowerCase() !== 'апартаменты') characteristics.push(t.propertyDetail.landArea);
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

export default PropertiesGallery; 