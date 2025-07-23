// src/pages/ListProperties.js

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Filter, 
  Edit, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Home, 
  DollarSign, 
  MapPin, 
  Building,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { uploadToFirebaseStorageInFolder } from "../utils/firebaseStorage";
import { showError, showSuccess } from '../utils/notifications';

// Компонент фильтров
const FilterSection = ({ 
  filters, 
  setFilters, 
  onApplyFilter,
  isExpanded,
  setIsExpanded,
  isMobile
}) => {
  const filterFields = [
    { key: 'price', label: 'Цена', placeholder: 'Введите цену...' },
    { key: 'type', label: 'Тип', placeholder: 'Тип недвижимости...' },
    { key: 'propertyName', label: 'Название объекта', placeholder: 'Название объекта...' },
    { key: 'district', label: 'Район', placeholder: 'Район...' },
    { key: 'buildingType', label: 'Тип постройки', placeholder: 'Тип постройки...' },
    { key: 'bedrooms', label: 'Спальни', placeholder: 'Количество спален...' },
    { key: 'developer', label: 'Застройщик', placeholder: 'Застройщик...' },
    { key: 'complex', label: 'Комплекс', placeholder: 'Комплекс...' },
    { key: 'area', label: 'Площадь', placeholder: 'Площадь...' },
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                Фильтр объектов
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Настройте критерии поиска</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {filterFields.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <Input
                  placeholder={placeholder}
                  value={filters[key] || ''}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
          
          <div className={`flex gap-3 pt-4 border-t ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <Button onClick={onApplyFilter} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Применить фильтр
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({});
                onApplyFilter();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Сбросить
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Компонент массового редактирования
const MassEditSection = ({
  massEdit,
  setMassEdit,
  onMassEdit,
  isExpanded,
  setIsExpanded,
  filteredCount,
  isMobile
}) => {
  const editFields = [
    { key: 'price', label: 'Цена', placeholder: 'Новая цена...' },
    { key: 'type', label: 'Тип', placeholder: 'Новый тип...' },
    { key: 'propertyName', label: 'Название объекта', placeholder: 'Новое название...' },
    { key: 'district', label: 'Район', placeholder: 'Новый район...' },
    { key: 'developer', label: 'Застройщик', placeholder: 'Новый застройщик...' },
    { key: 'complex', label: 'Комплекс', placeholder: 'Новый комплекс...' },
    { key: 'area', label: 'Площадь', placeholder: 'Новая площадь...' },
    { key: 'agentCommission', label: 'Агентское вознаграждение', placeholder: 'Например: 5%...' },
  ];

  const handleMassEditChange = (key, value) => {
    setMassEdit(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="w-6 h-6 text-orange-600" />
            <div>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                Массовое редактирование
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Изменить {filteredCount} отфильтрованных объектов
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {editFields.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <Input
                  placeholder={placeholder}
                  value={massEdit[key] || ''}
                  onChange={(e) => handleMassEditChange(key, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
          
          <div className={`flex gap-3 pt-4 border-t ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <Button 
              onClick={onMassEdit}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Массово изменить ({filteredCount})
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setMassEdit({})}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Очистить
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Компонент карточки объекта
const PropertyCard = ({ property, onDuplicate, isMobile }) => {
  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const formatPrice = (price) => {
    if (!price) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Изображение объекта */}
      {property.images && property.images.length > 0 && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={property.images[0]}
            alt={safeDisplay(property.type)}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} line-clamp-2`}>
            {safeDisplay(property.type) || "Объект недвижимости"}
          </CardTitle>
          {property.price && (
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              {formatPrice(property.price)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {property.complex && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="w-4 h-4" />
              <span>{safeDisplay(property.complex)}</span>
            </div>
          )}

          {property.district && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{safeDisplay(property.district)}</span>
            </div>
          )}

          {property.area && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="w-4 h-4" />
              <span>{safeDisplay(property.area)} м²</span>
            </div>
          )}
          
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <div className="text-sm text-gray-600">
              Спален: {safeDisplay(property.bedrooms)}
            </div>
          )}

          {property.developer && (
            <div className="text-sm text-gray-600">
              Застройщик: {safeDisplay(property.developer)}
            </div>
          )}

          {property.propertyName && (
            <div className="text-sm text-gray-600">
              Название: {safeDisplay(property.propertyName)}
            </div>
          )}
        </div>

        <div className={`flex gap-2 mt-4 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(property.id)}
            className={`flex items-center gap-2 ${isMobile ? 'w-full' : 'flex-1'}`}
          >
            <Copy className="w-4 h-4" />
            Дублировать
          </Button>
          <Link to={`/property/edit/${property.id}`} className={isMobile ? 'w-full' : 'flex-1'}>
            <Button 
              variant="default" 
              size="sm"
              className={`flex items-center gap-2 ${isMobile ? 'w-full' : 'w-full'}`}
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

function ListProperties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [massEditExpanded, setMassEditExpanded] = useState(false);
  const [filters, setFilters] = useState({});
  const [massEdit, setMassEdit] = useState({});
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

  // Загрузка объектов
  const fetchProperties = async () => {
    try {
      const colRef = collection(db, "properties");
      const snapshot = await getDocs(colRef);
      let data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Сортировка по дате создания (новые сверху)
      data.sort((a, b) => {
        const timestampA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const timestampB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return timestampB - timestampA;
      });

      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error("Ошибка загрузки объектов:", error);
      showError("Ошибка при загрузке объектов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Дублирование объекта
  const handleDuplicate = async (docId) => {
    try {
      const original = properties.find(p => p.id === docId);
      if (!original) {
        showError("Объект не найден");
        return;
      }

      const { id, createdAt, ...dataWithoutId } = original;
      
      const newProperty = {
        ...dataWithoutId,
        createdAt: Timestamp.now(),
      };
      
      // Дублируем изображения если есть
      if (original.images && original.images.length > 0) {
        const duplicatedImages = [];
        for (const imageUrl of original.images) {
            try {
            const response = await fetch(imageUrl);
                const blob = await response.blob();
            const file = new File([blob], `duplicated_${Date.now()}.jpg`, { type: blob.type });
            const uploadedUrl = await uploadToFirebaseStorageInFolder(file, "properties");
            duplicatedImages.push(uploadedUrl);
          } catch (imgError) {
            console.error("Ошибка дублирования изображения:", imgError);
            }
        }
        newProperty.images = duplicatedImages;
      }

      await addDoc(collection(db, "properties"), newProperty);
      showSuccess("Объект успешно дублирован");
      await fetchProperties(); // Перезагружаем список
    } catch (error) {
      console.error("Ошибка дублирования:", error);
      showError("Ошибка при дублировании объекта");
    }
  };

  // Применение фильтров
  const handleFilter = () => {
    let result = [...properties];

    Object.keys(filters).forEach(key => {
      const filterValue = filters[key];
      if (filterValue && filterValue.trim() !== "") {
        result = result.filter(property => {
          const propertyValue = property[key];
          if (propertyValue === null || propertyValue === undefined) return false;
          return String(propertyValue).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    setFilteredProperties(result);
  };

  // Массовое редактирование
  const handleMassEdit = async () => {
    const hasChanges = Object.values(massEdit).some(value => value && value.trim() !== "");
    
    if (!hasChanges) {
      showError("Заполните хотя бы одно поле для редактирования");
      return;
    }

    try {
      const updateData = {};
      Object.keys(massEdit).forEach(key => {
        const value = massEdit[key];
        if (value && value.trim() !== "") {
          // Специальная обработка для числовых полей
          if (key === 'area' || key === 'price' || key === 'commission') {
            const numValue = parseFloat(value.trim());
            updateData[key] = !isNaN(numValue) ? numValue : 0;
          } else if (key === 'agentCommission') {
            // Для agentCommission: убираем %, пробелы, запятые и добавляем % обратно
            let val = String(value).replace(/[%\s,]/g, '');
            updateData[key] = val ? val + '%' : '';
          } else {
            updateData[key] = value.trim();
          }
        }
      });

      const promises = filteredProperties.map(property => 
        updateDoc(doc(db, "properties", property.id), updateData)
      );

      await Promise.all(promises);
      showSuccess(`Успешно обновлено ${filteredProperties.length} объектов`);
      setMassEdit({});
      await fetchProperties();
    } catch (error) {
      console.error("Ошибка массового редактирования:", error);
      showError("Ошибка при массовом редактировании");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-8 ${isMobile ? 'px-2' : 'px-4'}`}>
      <div className={`flex items-center mb-6 ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
        <h1 className={`font-bold ${isMobile ? 'text-xl text-center' : 'text-3xl'}`}>
          Список Объектов
        </h1>
        <Link to="/property/new">
          <Button className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Добавить объект
          </Button>
        </Link>
      </div>

      {/* Фильтры */}
      <FilterSection
        filters={filters}
        setFilters={setFilters}
        onApplyFilter={handleFilter}
        isExpanded={filterExpanded}
        setIsExpanded={setFilterExpanded}
        isMobile={isMobile}
      />

      {/* Массовое редактирование */}
      <MassEditSection
        massEdit={massEdit}
        setMassEdit={setMassEdit}
        onMassEdit={handleMassEdit}
        isExpanded={massEditExpanded}
        setIsExpanded={setMassEditExpanded}
        filteredCount={filteredProperties.length}
        isMobile={isMobile}
      />

      {/* Результаты */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Найдено объектов: {filteredProperties.length} из {properties.length}
        </p>
      </div>

      {/* Список объектов */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {filteredProperties.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Объекты не найдены</p>
        </div>
      ) : (
          filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDuplicate={handleDuplicate}
              isMobile={isMobile}
            />
          ))
        )}
        </div>
    </div>
  );
}

export default ListProperties;