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
  setIsExpanded
}) => {
  const filterFields = [
    { key: 'price', label: 'Цена', placeholder: 'Введите цену...' },
    { key: 'type', label: 'Тип', placeholder: 'Тип недвижимости...' },
    { key: 'coordinates', label: 'Координаты', placeholder: 'Координаты...' },
    { key: 'status', label: 'Статус', placeholder: 'Статус...' },
    { key: 'district', label: 'Район', placeholder: 'Район...' },
    { key: 'buildingType', label: 'Тип постройки', placeholder: 'Тип постройки...' },
    { key: 'bedrooms', label: 'Спальни', placeholder: 'Количество спален...' },
    { key: 'ownershipForm', label: 'Форма собств.', placeholder: 'Форма собственности...' },
    { key: 'landStatus', label: 'Статус земли', placeholder: 'Статус земли...' },
    { key: 'pool', label: 'Бассейн', placeholder: 'Наличие бассейна...' },
    { key: 'description', label: 'Описание', placeholder: 'Описание...' },
    { key: 'developer', label: 'Застройщик', placeholder: 'Застройщик...' },
    { key: 'complex', label: 'Комплекс', placeholder: 'Комплекс...' },
    { key: 'area', label: 'Площадь', placeholder: 'Площадь...' },
    { key: 'province', label: 'Провинция', placeholder: 'Провинция...' },
    { key: 'city', label: 'Город', placeholder: 'Город...' },
    { key: 'rdtr', label: 'RDTR', placeholder: 'RDTR...' },
    { key: 'managementCompany', label: 'Упр. компания', placeholder: 'Управляющая компания...' },
    { key: 'completionDate', label: 'Дата заверш.', placeholder: 'Дата завершения...' },
    { key: 'leaseYears', label: 'Лет', placeholder: 'Срок аренды...' },
    { key: 'shgb', label: 'SHGB', placeholder: 'SHGB...' },
    { key: 'pbg', label: 'PBG', placeholder: 'PBG...' },
    { key: 'slf', label: 'SLF', placeholder: 'SLF...' },
    { key: 'legalCompanyName', label: 'Юр. название', placeholder: 'Юридическое название...' },
    { key: 'commission', label: 'Вознаграждение', placeholder: 'Вознаграждение...' }
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
              <CardTitle className="text-lg">Фильтр объектов</CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          
          <div className="flex gap-3 pt-4 border-t">
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
  filteredCount
}) => {
  const editFields = [
    { key: 'price', label: 'Цена', placeholder: 'Новая цена...' },
    { key: 'type', label: 'Тип', placeholder: 'Новый тип...' },
    { key: 'coordinates', label: 'Координаты', placeholder: 'Новые координаты...' },
    { key: 'status', label: 'Статус', placeholder: 'Новый статус...' },
    { key: 'district', label: 'Район', placeholder: 'Новый район...' },
    { key: 'buildingType', label: 'Тип постройки', placeholder: 'Новый тип постройки...' },
    { key: 'bedrooms', label: 'Спальни', placeholder: 'Количество спален...' },
    { key: 'ownershipForm', label: 'Форма собств.', placeholder: 'Новая форма собственности...' },
    { key: 'landStatus', label: 'Статус земли', placeholder: 'Новый статус земли...' },
    { key: 'pool', label: 'Бассейн', placeholder: 'Наличие бассейна...' },
    { key: 'description', label: 'Описание', placeholder: 'Новое описание...' },
    { key: 'developer', label: 'Застройщик', placeholder: 'Новый застройщик...' },
    { key: 'complex', label: 'Комплекс', placeholder: 'Новый комплекс...' },
    { key: 'area', label: 'Площадь', placeholder: 'Новая площадь...' },
    { key: 'province', label: 'Провинция', placeholder: 'Новая провинция...' },
    { key: 'city', label: 'Город', placeholder: 'Новый город...' },
    { key: 'rdtr', label: 'RDTR', placeholder: 'Новый RDTR...' },
    { key: 'managementCompany', label: 'Упр. компания', placeholder: 'Новая управляющая компания...' },
    { key: 'completionDate', label: 'Дата заверш.', placeholder: 'Новая дата завершения...' },
    { key: 'leaseYears', label: 'Лет', placeholder: 'Новый срок аренды...' },
    { key: 'shgb', label: 'SHGB', placeholder: 'Новый SHGB...' },
    { key: 'pbg', label: 'PBG', placeholder: 'Новый PBG...' },
    { key: 'slf', label: 'SLF', placeholder: 'Новый SLF...' },
    { key: 'legalCompanyName', label: 'Юр. название', placeholder: 'Новое юридическое название...' },
    { key: 'commission', label: 'Вознаграждение', placeholder: 'Новое вознаграждение...' }
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
              <CardTitle className="text-lg">Массовое редактирование</CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          
          <div className="flex gap-3 pt-4 border-t">
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
              Очистить поля
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Компонент карточки объекта
const PropertyCard = ({ property, onDuplicate }) => {
  const priceValue = parseFloat(property.price) || 0;
  const formattedPrice = priceValue.toLocaleString("ru-RU");

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {property.images && property.images.length > 0 && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={property.images[0]}
            alt="Property Photo"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-600">
              {property.status || 'Активен'}
            </Badge>
          </div>
        </div>
      )}
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xl font-bold text-gray-900">
              {formattedPrice} $
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              <span className="font-medium">Тип:</span> {property.type || 'Не указан'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              <span className="font-medium">Район:</span> {property.district || 'Не указан'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              <span className="font-medium">Застройщик:</span> {property.developer || 'Не указан'}
            </span>
          </div>

          {property.complex && (
            <div className="text-gray-700">
              <span className="font-medium">Комплекс:</span> {property.complex}
            </div>
          )}

          {property.bedrooms && (
            <div className="text-gray-700">
              <span className="font-medium">Спальни:</span> {property.bedrooms}
            </div>
          )}

          {property.area && (
            <div className="text-gray-700">
              <span className="font-medium">Площадь:</span> {property.area} м²
            </div>
          )}

          {property.commission !== undefined && (
            <div className="text-gray-700">
              <span className="font-medium">Вознаграждение:</span> {property.commission}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t">
          <Button
            asChild
            size="sm"
            className="flex-1"
          >
            <Link to={`/property/edit/${property.id}`} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Редактировать
            </Link>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(property.id)}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Дублировать
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

function ListProperties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для фильтров и массового редактирования
  const [filters, setFilters] = useState({});
  const [massEdit, setMassEdit] = useState({});
  
  // Состояния для раскрытия секций
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [massEditExpanded, setMassEditExpanded] = useState(false);

  // --- Загрузка данных из Firestore ---
  const fetchProperties = async () => {
    try {
      const colRef = collection(db, "properties");
      const snapshot = await getDocs(colRef);
      let data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Сортируем по createdAt (Timestamp) от новых к старым
      data.sort((a, b) => {
        const timeA =
          a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const timeB =
          b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error("Ошибка загрузки объектов:", error);
      showError("Ошибка загрузки объектов");
    } finally {
      setLoading(false);
    }
  };

  // При монтировании
  useEffect(() => {
    fetchProperties();
  }, []);

  // --- Функция «Дублировать» ---
  const handleDuplicate = async (docId) => {
    try {
      const ref = doc(db, "properties", docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        showError("Документ не найден.");
        return;
      }
      const data = snap.data();

      // Копируем данные, исключая createdAt
      const { createdAt, ...rest } = data;
      
      // Если в объекте есть фотографии, для каждого фото выполняем загрузку заново в Firebase Storage,
      // чтобы получить новый URL (уникальную копию)
      let newImages = [];
      if (Array.isArray(rest.images)) {
        newImages = await Promise.all(
          rest.images.map(async (imgUrl) => {
            try {
              const response = await fetch(imgUrl);
              if (response.ok) {
                const blob = await response.blob();
                const newUrl = await uploadToFirebaseStorageInFolder(blob, "property");
                return newUrl;
              } else {
                console.error(`Ошибка загрузки изображения ${imgUrl}: ${response.statusText}`);
                return imgUrl;
              }
            } catch (error) {
              console.error("Ошибка при обработке изображения:", error);
              return imgUrl;
            }
          })
        );
      }

      const newData = {
        ...rest,
        images: newImages,
        createdAt: new Date()
      };

      await addDoc(collection(db, "properties"), newData);
      showSuccess("Дубликат создан!");
      fetchProperties();
    } catch (error) {
      console.error("Ошибка при дублировании объекта:", error);
      showError("Ошибка при дублировании объекта");
    }
  };

  // --- Фильтрация по всем полям ---
  const handleFilter = () => {
    let result = [...properties];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        result = result.filter((p) => {
          const fieldValue = p[key];
          if (key === 'price' || key === 'area' || key === 'commission') {
            return String(fieldValue ?? "").includes(value.trim());
          }
          return String(fieldValue ?? "").toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredProperties(result);
  };

  // --- Массовое редактирование ---
  const handleMassEdit = async () => {
    if (
      !window.confirm(
        `Вы действительно хотите массово изменить ${filteredProperties.length} отфильтрованных объектов?`
      )
    ) {
      return;
    }

    try {
      for (let item of filteredProperties) {
        const ref = doc(db, "properties", item.id);
        const newData = {};

        Object.entries(massEdit).forEach(([key, value]) => {
          if (value && value.trim() !== "") {
            if (key === 'price' || key === 'area' || key === 'commission') {
              newData[key] = parseFloat(value) || 0;
            } else {
              newData[key] = value;
            }
          }
        });

        if (Object.keys(newData).length > 0) {
          await updateDoc(ref, newData);
        }
      }

      showSuccess("Массовое редактирование выполнено!");
      fetchProperties();
    } catch (err) {
      console.error("Ошибка массового редактирования:", err);
      showError("Ошибка: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Загрузка объектов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Home className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Список Объектов</h1>
          <p className="text-gray-600 mt-1">
            Найдено объектов: <span className="font-semibold">{filteredProperties.length}</span> из <span className="font-semibold">{properties.length}</span>
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <FilterSection
        filters={filters}
        setFilters={setFilters}
        onApplyFilter={handleFilter}
        isExpanded={filterExpanded}
        setIsExpanded={setFilterExpanded}
      />

      {/* Массовое редактирование */}
      <MassEditSection
        massEdit={massEdit}
        setMassEdit={setMassEdit}
        onMassEdit={handleMassEdit}
        isExpanded={massEditExpanded}
        setIsExpanded={setMassEditExpanded}
        filteredCount={filteredProperties.length}
      />

      {/* Список объектов */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Объекты не найдены</h3>
            <p className="text-gray-600">
              Попробуйте изменить критерии фильтрации или сбросить фильтры
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ListProperties; 