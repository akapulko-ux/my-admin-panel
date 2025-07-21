import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useCache } from "../CacheContext";
import { db } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { Building2, Search, X, Filter, ChevronDown } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { CustomSelect } from "../components/ui/custom-select";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict } from "../lib/utils";

function ComplexesGallery() {
  const [complexes, setComplexes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [developerName, setDeveloperName] = useState(null);
  const { currentUser, role } = useAuth();
  const { forceRefreshPropertiesList } = useCache();
  const { language } = useLanguage();
  const t = translations[language];
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    developer: "all",
    district: "all",
    province: "all",
    landStatus: "all",
    ownershipForm: "all",
  });

  // Получаем уникальные значения для фильтров из данных
  const filterOptions = useMemo(() => {
    const options = {
      developers: [...new Set(complexes.map(c => c.developer).filter(Boolean))],
      districts: [...new Set(complexes.map(c => c.district).filter(Boolean))],
      provinces: [...new Set(complexes.map(c => c.province).filter(Boolean))],
      landStatuses: [...new Set(complexes.map(c => c.landStatus).filter(Boolean))],
      ownershipForms: [...new Set(complexes.map(c => c.ownershipForm).filter(Boolean))],
    };
    
    // Сортируем опции
    Object.keys(options).forEach(key => {
      options[key].sort();
    });
    
    return options;
  }, [complexes]);

  // Безопасное отображение любых типов значений
  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Получение имени застройщика по ID
  const fetchDeveloperName = async (developerId) => {
    try {
      const developerDoc = await getDoc(doc(db, "developers", developerId));
      if (developerDoc.exists()) {
        return developerDoc.data().name;
      }
      return null;
    } catch (err) {
      console.error("Ошибка загрузки застройщика:", err);
      return null;
    }
  };

  // Функция для поиска минимальной цены объектов комплекса
  const getMinPriceForComplex = (complexName) => {
    if (!complexName || !properties.length) return null;
    
    // Ищем все объекты, привязанные к этому комплексу
    const relatedProperties = properties.filter(property => {
      const propertyComplexName = property.complexName || property.complex;
      return propertyComplexName && propertyComplexName.toLowerCase() === complexName.toLowerCase();
    });
    
    // Находим минимальную цену среди найденных объектов
    if (relatedProperties.length === 0) return null;
    
    const prices = relatedProperties
      .map(property => property.price)
      .filter(price => price && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  // Загрузка данных из Firestore
  const fetchData = useCallback(async () => {
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

      // Загружаем комплексы
      const colRef = collection(db, "complexes");
      const snapshot = await getDocs(colRef);
      let complexesData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Фильтруем комплексы для застройщика
      if (['застройщик', 'премиум застройщик'].includes(role) && developerNameToFilter) {
        complexesData = complexesData.filter(complex => complex.developer === developerNameToFilter);
      }

      // Сортировка только по номеру комплекса
      complexesData.sort((a, b) => {
        const numA = parseInt(a.number, 10) || 0;
        const numB = parseInt(b.number, 10) || 0;
        return numA - numB;
      });

      setComplexes(complexesData);

      // Принудительно обновляем объекты для расчета цен
      const propertiesData = await forceRefreshPropertiesList();

      // Загружаем названия комплексов для объектов (как в PropertiesGallery)
      const propertiesWithComplexNames = await Promise.all(
        propertiesData.map(async (property) => {
          if (property.complexId) {
            try {
              const complexDoc = await getDoc(doc(db, "complexes", property.complexId));
              if (complexDoc.exists()) {
                return { ...property, complexName: complexDoc.data().name };
              }
            } catch (err) {
              console.error("Ошибка при загрузке названия комплекса:", err);
            }
          }
          return property;
        })
      );

      setProperties(propertiesWithComplexNames);
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, role, forceRefreshPropertiesList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Обработчики для обновления данных при возврате к странице
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    const handleFocus = () => {
      fetchData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

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

  // Фильтрация комплексов
  const filteredComplexes = useMemo(() => {
    return complexes.filter(complex => {
      // Текстовый поиск
      const searchText = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        (complex.name && complex.name.toLowerCase().includes(searchText)) ||
        (complex.district && complex.district.toLowerCase().includes(searchText)) ||
        (complex.developer && complex.developer.toLowerCase().includes(searchText)) ||
        (complex.city && complex.city.toLowerCase().includes(searchText)) ||
        (complex.province && complex.province.toLowerCase().includes(searchText)) ||
        (complex.description && complex.description.toLowerCase().includes(searchText));

      // Фильтры
      const matchesPrice = 
        (!filters.priceMin || complex.priceFrom >= Number(filters.priceMin)) &&
        (!filters.priceMax || complex.priceFrom <= Number(filters.priceMax));

      const matchesDeveloper = 
        filters.developer === "all" || 
        complex.developer === filters.developer;

      const matchesDistrict = 
        filters.district === "all" || 
        complex.district === filters.district;

      const matchesProvince = 
        filters.province === "all" || 
        complex.province === filters.province;

      const matchesLandStatus = 
        filters.landStatus === "all" || 
        complex.landStatus === filters.landStatus;

      const matchesOwnershipForm = 
        filters.ownershipForm === "all" || 
        complex.ownershipForm === filters.ownershipForm;

      return matchesSearch && matchesPrice && matchesDeveloper && matchesDistrict && matchesProvince && matchesLandStatus && matchesOwnershipForm;
    });
  }, [complexes, searchQuery, filters]);

  // Сброс фильтров
  const resetFilters = () => {
    setSearchQuery("");
    setFilters({
      priceMin: "",
      priceMax: "",
      developer: "all",
      district: "all",
      province: "all",
      landStatus: "all",
      ownershipForm: "all",
    });
  };

  // Функция для подсчета активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.priceMin) count++;
    if (filters.priceMax) count++;
    if (filters.developer !== "all") count++;
    if (filters.district !== "all") count++;
    if (filters.province !== "all") count++;
    if (filters.landStatus !== "all") count++;
    if (filters.ownershipForm !== "all") count++;
    return count;
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t.complexesGallery.loadingText}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          {t.complexesGallery.title}
          {developerName && ` - ${developerName}`}
        </h1>
      </div>

      {/* Поиск и фильтры */}
      <div className="space-y-4">
        {/* Строка поиска */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.complexesGallery.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Блок фильтров */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {t.complexesGallery.filtersTitle}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                {t.complexesGallery.resetAllFilters}
              </Button>
            )}
          </div>

          <CollapsibleContent className="space-y-4 mt-4">
            <Card className="p-4">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {/* Цена */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.complexesGallery.priceLabel}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.complexesGallery.pricePlaceholderFrom}
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                      className="text-sm"
                    />
                    <Input
                      placeholder={t.complexesGallery.pricePlaceholderTo}
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Застройщик */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.complexesGallery.developerLabel}</Label>
                  <CustomSelect
                    value={filters.developer}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, developer: value }))}
                    options={[
                      { value: "all", label: t.complexesGallery.allDevelopers },
                      ...filterOptions.developers.map(dev => ({ value: dev, label: dev }))
                    ]}
                  />
                </div>

                {/* Район */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.complexesGallery.districtLabel}</Label>
                  <CustomSelect
                    value={filters.district}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, district: value }))}
                    options={[
                      { value: "all", label: t.complexesGallery.allDistricts },
                      ...filterOptions.districts.map(district => ({ value: district, label: translateDistrict(district, language) }))
                    ]}
                  />
                </div>

                {/* Провинция */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.complexesGallery.provinceLabel}</Label>
                  <CustomSelect
                    value={filters.province}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, province: value }))}
                    options={[
                      { value: "all", label: t.complexesGallery.allProvinces },
                      ...filterOptions.provinces.map(province => ({ value: province, label: province }))
                    ]}
                  />
                </div>

                {/* Статус земли */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.complexesGallery.landStatusLabel}</Label>
                  <CustomSelect
                    value={filters.landStatus}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, landStatus: value }))}
                    options={[
                      { value: "all", label: t.complexesGallery.allStatuses },
                      ...filterOptions.landStatuses.map(status => ({ value: status, label: status }))
                    ]}
                  />
                </div>

                {/* Форма собственности */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.complexesGallery.ownershipFormLabel}</Label>
                  <CustomSelect
                    value={filters.ownershipForm}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, ownershipForm: value }))}
                    options={[
                      { value: "all", label: t.complexesGallery.allForms },
                      ...filterOptions.ownershipForms.map(form => ({ value: form, label: form }))
                    ]}
                  />
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Результаты */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t.complexesGallery.resultsText.replace('{found}', filteredComplexes.length).replace('{total}', complexes.length)}
        </div>
      </div>

      {/* Список карточек */}
      <div className={`divide-y ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
        {filteredComplexes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {complexes.length === 0 
              ? (['застройщик', 'премиум застройщик'].includes(role) 
                  ? t.complexesGallery.emptyStateNoDeveloperComplexes
                  : t.complexesGallery.emptyStateNoComplexes)
              : t.complexesGallery.emptyStateNoMatches}
          </div>
        ) : (
          filteredComplexes.map((complex) => (
            <Link
              key={complex.id}
              to={`/complex/${complex.id}`}
              className={`flex items-stretch cursor-pointer hover:bg-gray-50 transition-colors ${
                isMobile 
                  ? 'flex-col gap-3 p-3' 
                  : 'gap-4 p-4'
              }`}
            >
              {/* Изображение комплекса */}
              <div className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                isMobile 
                  ? 'w-full h-40' 
                  : 'w-48 h-32 min-w-48'
              }`}>
                {complex.images?.length ? (
                  <img
                    src={complex.images[0]}
                    alt={complex.name || t.complexesGallery.complexAltText}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Текстовая информация */}
              <div className="flex flex-col text-gray-900 space-y-0.5">
                <span className={`font-semibold leading-none text-black ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>
                  {complex.name || t.complexesGallery.noNameText}
                </span>

                {complex.number && (
                  <span className="text-sm text-gray-600">
                    {t.complexesGallery.complexNumberPrefix}{complex.number}
                  </span>
                )}

                {/* Цена */}
                {(() => {
                  const minPrice = getMinPriceForComplex(complex.name);
                  return minPrice ? (
                    <span className={`font-semibold leading-none ${
                      isMobile ? 'text-base' : 'text-lg'
                    }`}>
                      {t.complexesGallery.priceFromPrefix} {formatPrice(minPrice)}
                    </span>
                  ) : complex.priceFrom ? (
                    <span className={`font-semibold leading-none ${
                      isMobile ? 'text-base' : 'text-lg'
                    }`}>
                      {t.complexesGallery.priceFromPrefix} {formatPrice(complex.priceFrom)}
                    </span>
                  ) : null;
                })()}

                {complex.developer && (
                  <span className="text-sm">{t.complexesGallery.developerPrefix} {safeDisplay(complex.developer)}</span>
                )}
                {complex.district && (
                  <span className="text-sm">{t.complexesGallery.districtPrefix} {translateDistrict(safeDisplay(complex.district), language)}</span>
                )}
                {complex.completionDate && (
                  <span className="text-sm">{t.complexesGallery.completionPrefix} {safeDisplay(complex.completionDate)}</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default ComplexesGallery; 