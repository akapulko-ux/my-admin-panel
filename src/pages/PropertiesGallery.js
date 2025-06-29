import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Building2, Search, X, Filter, ChevronDown } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useCache } from "../CacheContext";

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
  const { getPropertiesList, propertiesCache } = useCache();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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
      districts: [...new Set(properties.map(p => p.district).filter(Boolean))],
      types: [...new Set(properties.map(p => p.type).filter(Boolean))],
      bedrooms: [...new Set(properties.map(p => p.bedrooms).filter(n => n !== undefined && n !== null))],
    };
    
    // Сортируем опции
    options.districts.sort();
    options.types.sort();
    options.bedrooms.sort((a, b) => a - b);
    
    return options;
  }, [properties]);

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

  // Получение названия комплекса по ID
  const fetchComplexName = async (complexId) => {
    try {
      const complexDoc = await getDoc(doc(db, "complexes", complexId));
      if (complexDoc.exists()) {
        return complexDoc.data().name;
      }
      return null;
    } catch (err) {
      console.error("Ошибка загрузки комплекса:", err);
      return null;
    }
  };

  // Загрузка данных из кеша или Firestore
  const fetchProperties = useCallback(async () => {
    try {
      // Если пользователь - застройщик, получаем его developerId из Firestore
      let developerNameToFilter = null;
      if (role === 'застройщик' && currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().developerId) {
          developerNameToFilter = await fetchDeveloperName(userDoc.data().developerId);
          setDeveloperName(developerNameToFilter);
        }
      }

      // Сначала проверяем кеш
      let data;
      if (propertiesCache.list?.data && Date.now() - propertiesCache.list.timestamp < 5 * 60 * 1000) {
        data = propertiesCache.list.data;
      } else {
        data = await getPropertiesList();
      }

      // Фильтруем объекты для застройщика
      let filteredData = data;
      if (role === 'застройщик' && developerNameToFilter) {
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
              console.error("Ошибка при загрузке названия комплекса:", err);
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
      console.error("Ошибка загрузки объектов:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, role, getPropertiesList, propertiesCache]);

  useEffect(() => {
    fetchProperties();
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
      const matchesSearch = 
        !searchQuery ||
        (property.complexName && property.complexName.toLowerCase().includes(searchText)) ||
        (property.complex && property.complex.toLowerCase().includes(searchText)) ||
        (property.district && property.district.toLowerCase().includes(searchText)) ||
        (property.developer && property.developer.toLowerCase().includes(searchText)) ||
        (property.type && property.type.toLowerCase().includes(searchText));

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
  }, [properties, searchQuery, filters]);

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
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {role === 'застройщик' && developerName ? (
          <h1 className="text-2xl font-bold text-gray-900">
            Объекты застройщика: {developerName}
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-gray-900">
            Галерея объектов
          </h1>
        )}

        {/* Поиск и кнопка фильтров */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Поиск по названию, району или типу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Фильтры
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Цена */}
                  <div className="space-y-2">
                    <Label>Цена (USD)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="От"
                        value={filters.priceMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="До"
                        value={filters.priceMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Площадь */}
                  <div className="space-y-2">
                    <Label>Площадь (м²)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="От"
                        value={filters.areaMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, areaMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="До"
                        value={filters.areaMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, areaMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Спальни */}
                  <div className="space-y-2">
                    <Label>Спальни</Label>
                    <CustomSelect
                      value={filters.bedrooms}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, bedrooms: value }))}
                      options={[
                        { label: "Все", value: "all" },
                        { label: "Студия", value: "0" },
                        ...filterOptions.bedrooms.map(num => ({
                          label: String(num),
                          value: String(num)
                        }))
                      ]}
                    />
                  </div>

                  {/* Район */}
                  <div className="space-y-2">
                    <Label>Район</Label>
                    <CustomSelect
                      value={filters.district}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, district: value }))}
                      options={[
                        { label: "Все районы", value: "all" },
                        ...filterOptions.districts.map(district => ({
                          label: district,
                          value: district
                        }))
                      ]}
                    />
                  </div>

                  {/* Тип */}
                  <div className="space-y-2">
                    <Label>Тип</Label>
                    <CustomSelect
                      value={filters.type}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                      options={[
                        { label: "Все типы", value: "all" },
                        ...filterOptions.types.map(type => ({
                          label: type,
                          value: type
                        }))
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
                      Сбросить фильтры
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Результаты поиска */}
        <div className="text-sm text-gray-500 mb-4">
          Найдено объектов: {filteredProperties.length}
        </div>
      </div>

      {/* Список компактных карточек */}
      <div className="divide-y max-w-4xl mx-auto">
        {filteredProperties.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {properties.length === 0 
              ? (role === 'застройщик' 
                  ? "У вас пока нет объектов в системе"
                  : "Объекты не найдены")
              : "Нет объектов, соответствующих заданным критериям"}
          </div>
        ) : (
          filteredProperties.map((p) => (
            <Link
              key={p.id}
              to={`/property/${p.id}`}
              className="flex items-stretch gap-4 p-4 cursor-pointer hover:bg-gray-50"
            >
              {/* Изображение */}
              <div className="relative w-48 h-32 min-w-48 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                {p.images?.length ? (
                  <img
                    src={p.images[0]}
                    alt={safeDisplay(p.type)}
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
                {(p.complexName || p.complex) && (
                  <span className="text-lg font-semibold leading-none text-black">
                    {safeDisplay(p.complexName || p.complex)}
                  </span>
                )}
                <span className="text-lg font-semibold leading-none">
                  {formatPrice(p.price)}
                </span>
                {p.type && <span className="text-sm">{safeDisplay(p.type)}</span>}
                {p.area && <span className="text-sm">{safeDisplay(p.area)} м²</span>}
                {p.bedrooms !== undefined && p.bedrooms !== null && (
                  <span className="text-sm">
                    {p.bedrooms === 0 ? "Студия" : `Спален: ${safeDisplay(p.bedrooms)}`}
                  </span>
                )}
                {p.district && <span className="text-sm">{safeDisplay(p.district)}</span>}
                {/* Показываем застройщика только для не-застройщиков */}
                {role !== 'застройщик' && p.developer && (
                  <span className="text-sm text-gray-600">
                    Застройщик: {safeDisplay(p.developer)}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default PropertiesGallery; 