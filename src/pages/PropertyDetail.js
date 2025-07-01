import React, { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { useCache } from "../CacheContext";
import {
  Bed,
  Ruler,
  Home,
  Star,
  Building2,
  MapPin,
  Hammer,
  FileText,
  Calendar,
  Droplet,
  Map as MapIcon,
  Layers,
  Bath,
  Calculator,
  BarChart3,
} from "lucide-react";
import { showError } from '../utils/notifications';
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from '../utils/firebaseStorage';
import PropertyRoiCalculator from "../components/PropertyRoiCalculator";

function PropertyDetail() {
  console.log('PropertyDetail: Component mounted');
  const { id } = useParams();
  console.log('PropertyDetail: Got id from params:', id);
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { currentUser, role } = useAuth();
  const { getPropertyDetails, propertiesCache } = useCache();
  
  // Новые состояния для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Состояния для загрузки файлов
  const [uploading, setUploading] = useState({});

  // Добавляем состояние для модального окна
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);

  // Функция для проверки, может ли пользователь редактировать объект
  const canEdit = () => {
    console.log('canEdit check:', {
      role,
      isAdmin: role === 'admin',
      isDeveloper: role === 'застройщик',
      propertyDeveloper: property?.developer,
      userDeveloperName: property?.userDeveloperName
    });
    
    if (role === 'admin') return true;
    if (role === 'застройщик') return true; // Временно разрешим всем застройщикам для проверки
    return false;
  };

  // Функция для обработки изменений значений
  const handleValueChange = (field, value) => {
    let processedValue = value;
    if (field === 'price') {
      // Убираем все нечисловые символы, кроме цифр
      processedValue = value.replace(/[^\d]/g, '');
      processedValue = processedValue ? parseInt(processedValue) : 0;
    }
    
    setEditedValues(prev => {
      const newValues = { ...prev, [field]: processedValue };
      setHasChanges(JSON.stringify(newValues) !== JSON.stringify({}));
      return newValues;
    });
  };

  // Функция для сохранения изменений
  const handleSave = async () => {
    try {
      const propertyRef = doc(db, "properties", id);
      await updateDoc(propertyRef, editedValues);
      setProperty(prev => ({ ...prev, ...editedValues }));
      setEditedValues({});
      setHasChanges(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Ошибка при сохранении изменений:", error);
      showError("Произошла ошибка при сохранении изменений");
    }
  };

  // Функция для отмены редактирования
  const handleCancel = () => {
    setEditedValues({});
    setHasChanges(false);
    setIsEditing(false);
  };

  // Функция для загрузки нового файла
  const handleFileUpload = (fieldName) => {
    if (!canEdit()) {
      showError("У вас нет прав для редактирования объекта");
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setUploading(prev => ({ ...prev, [fieldName]: true }));
      
      try {
        // Определяем подпапку в зависимости от типа файла
        let folder;
        if (fieldName === 'layoutFileURL') {
          folder = 'documents/layout';
        } else if (fieldName === 'pkkprFileURL') {
          folder = 'documents/pkkpr';
        } else if (fieldName === 'roiFileURL') {
          folder = 'documents/roi';
        } else {
          folder = 'documents';
        }
        
        const url = await uploadToFirebaseStorageInFolder(file, folder);
        
        // Обновляем объект в базе данных
        const propertyRef = doc(db, "properties", id);
        await updateDoc(propertyRef, { [fieldName]: url });
        
        // Обновляем локальное состояние
        setProperty(prev => ({ ...prev, [fieldName]: url }));
        
        console.log(`Файл ${fieldName} успешно загружен в ${folder}:`, url);
      } catch (error) {
        console.error(`Ошибка загрузки файла ${fieldName}:`, error);
        showError("Произошла ошибка при загрузке файла");
      } finally {
        setUploading(prev => ({ ...prev, [fieldName]: false }));
      }
    };
    input.click();
  };

  // Функция для обновления существующего файла
  const handleFileUpdate = (fieldName) => {
    if (!canEdit()) {
      showError("У вас нет прав для редактирования объекта");
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setUploading(prev => ({ ...prev, [fieldName]: true }));
      
      try {
        // Удаляем старый файл
        if (property[fieldName]) {
          try {
            await deleteFileFromFirebaseStorage(property[fieldName]);
          } catch (deleteError) {
            console.warn(`Не удалось удалить старый файл ${fieldName}:`, deleteError);
          }
        }
        
        // Определяем подпапку в зависимости от типа файла
        let folder;
        if (fieldName === 'layoutFileURL') {
          folder = 'documents/layout';
        } else if (fieldName === 'pkkprFileURL') {
          folder = 'documents/pkkpr';
        } else if (fieldName === 'roiFileURL') {
          folder = 'documents/roi';
        } else {
          folder = 'documents';
        }
        
        // Загружаем новый файл
        const url = await uploadToFirebaseStorageInFolder(file, folder);
        
        // Обновляем объект в базе данных
        const propertyRef = doc(db, "properties", id);
        await updateDoc(propertyRef, { [fieldName]: url });
        
        // Обновляем локальное состояние
        setProperty(prev => ({ ...prev, [fieldName]: url }));
        
        console.log(`Файл ${fieldName} успешно обновлен в ${folder}:`, url);
      } catch (error) {
        console.error(`Ошибка обновления файла ${fieldName}:`, error);
        showError("Произошла ошибка при обновлении файла");
      } finally {
        setUploading(prev => ({ ...prev, [fieldName]: false }));
      }
    };
    input.click();
  };

  // Список неизменяемых полей
  const nonEditableFields = ['district', 'landStatus', 'developer', 'complex'];

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "—";
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

  // Добавляем списки значений для выпадающих списков
  const typeOptions = [
    "Вилла",
    "Апартаменты",
    "Дом",
    "Коммерческая недвижимость",
    "Апарт-вилла",
    "Таунхаус",
    "Земельный участок"
  ];

  const bedroomsOptions = [
    "Студия",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10"
  ];

  const bathroomsOptions = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ];

  const buildingTypeOptions = [
    "Новый комплекс",
    "Реновация",
    "ИЖС"
  ];

  const statusOptions = [
    "Проект",
    "Строится",
    "Готовый",
    "От собственника"
  ];

  const poolOptions = [
    "Нет",
    "Частный",
    "Общий"
  ];

  // Добавляем список значений для формы собственности
  const ownershipFormOptions = [
    "Leashold",
    "Freehold"
  ];

  // Обновляем функцию рендеринга значения
  const renderEditableValue = (field, value, type, options) => {
    if (isEditing && !nonEditableFields.includes(field)) {
      // Получаем исходное значение из объекта property, а не отформатированное value
      const originalValue = property[field];
      
      if (field === 'ownershipForm') {
        return (
          <div className="space-y-2">
            <select
              value={editedValues[field] || originalValue || ''}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">(не выбрано)</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {(editedValues[field] || originalValue) === 'Leashold' && (
              <input
                type="text"
                value={editedValues.leaseYears || property.leaseYears || ''}
                onChange={(e) => handleValueChange('leaseYears', e.target.value)}
                placeholder="Например: 30, 30+20"
                className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
              />
            )}
          </div>
        );
      } else if (options) {
        return (
          <select
            value={editedValues[field] || originalValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
          >
            <option value="">(не выбрано)</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      } else {
        return (
          <input
            type={type || "text"}
            value={editedValues[field] || originalValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
          />
        );
      }
    }
    return (
      <div className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line">
        {value}
      </div>
    );
  };

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('PropertyDetail: Starting to fetch data for id:', id);
        console.log('PropertyDetail: Current role:', role);
        
        // Если пользователь - застройщик, получаем его developerId
        let userDeveloperName = null;
        if (role === 'застройщик' && currentUser) {
          console.log('PropertyDetail: Fetching developer info for user:', currentUser.uid);
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().developerId) {
            userDeveloperName = await fetchDeveloperName(userDoc.data().developerId);
            console.log('PropertyDetail: Found developer name:', userDeveloperName);
          }
        }

        // Сначала проверяем кеш
        let propertyData;
        const cachedDetails = propertiesCache.details[id];
        if (cachedDetails?.data && Date.now() - cachedDetails.timestamp < 5 * 60 * 1000) {
          propertyData = cachedDetails.data;
        } else {
          propertyData = await getPropertyDetails(id);
        }
        
        if (propertyData) {
          console.log('PropertyDetail: Property data:', propertyData);
          
          // Добавляем информацию о застройщике пользователя в данные объекта
          propertyData.userDeveloperName = userDeveloperName;
          
          // Загружаем имя застройщика если есть developerId
          if (propertyData.developerId) {
            try {
              const developerName = await fetchDeveloperName(propertyData.developerId);
              propertyData.developerName = developerName;
            } catch (err) {
              console.error("Ошибка при загрузке имени застройщика:", err);
            }
          }
          
          // Загружаем название комплекса если есть complexId
          if (propertyData.complexId) {
            try {
              const complexName = await fetchComplexName(propertyData.complexId);
              propertyData.complexName = complexName;
            } catch (err) {
              console.error("Ошибка при загрузке названия комплекса:", err);
            }
          }
          
          // Проверяем права доступа для застройщика
          if (role === 'застройщик') {
            console.log('PropertyDetail: Checking access for developer');
            console.log('PropertyDetail: Property developer:', propertyData.developer);
            console.log('PropertyDetail: User developer name:', userDeveloperName);
            if (propertyData.developer !== userDeveloperName) {
              console.log('PropertyDetail: Access denied');
              setAccessDenied(true);
              return;
            }
          }
          
          setProperty(propertyData);
        } else {
          console.log('PropertyDetail: Property not found');
        }
      } catch (err) {
        console.error('PropertyDetail: Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, currentUser, role, getPropertyDetails, propertiesCache]);

  const getLatLng = () => {
    if (!property) return null;
    let lat = null;
    let lng = null;
    if (property.latitude && property.longitude) {
      lat = property.latitude;
      lng = property.longitude;
    } else if (property.coordinates) {
      const parts = String(property.coordinates).split(/[;,\s]+/).filter(Boolean);
      if (parts.length >= 2) {
        lat = parts[0];
        lng = parts[1];
      }
    }
    return lat && lng ? [lat, lng] : null;
  };

  const handleOpenMap = () => {
    const ll = getLatLng();
    if (!ll) return;
    const [lat, lng] = ll;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  // Если доступ запрещен, перенаправляем на галерею
  if (accessDenied) {
    return <Navigate to="/property/gallery" />;
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Объект не найден
      </div>
    );
  }

  const attributes = [
    {
      label: property.bedrooms === 0 ? "Студия" : "Спален",
      value: property.bedrooms === 0 ? "Студия" : safeDisplay(property.bedrooms),
      field: "bedrooms",
      icon: Bed,
      type: "select",
      options: bedroomsOptions
    },
    {
      label: "Площадь",
      value: property.area ? `${safeDisplay(property.area)} м²` : "—",
      field: "area",
      icon: Ruler,
      type: "number"
    },
    {
      label: "Застройщик",
      value: safeDisplay(property.developerName || property.developer),
      field: "developer",
      icon: Building2,
    },
    {
      label: "Комплекс",
      value: safeDisplay(property.complexName || property.complex),
      field: "complex",
      icon: Home,
    },
    {
      label: "Санузлы",
      value: safeDisplay(property.bathrooms),
      field: "bathrooms",
      icon: Bath,
      type: "select",
      options: bathroomsOptions
    },
    {
      label: "Этажность",
      value: property.floors ? `${safeDisplay(property.floors)} этаж${property.floors === 1 ? '' : property.floors < 5 ? 'а' : 'ей'}` : "—",
      field: "floors",
      icon: Layers,
      type: "number"
    },

    {
      label: "Район",
      value: safeDisplay(property.district),
      field: "district",
      icon: MapPin,
    },
    {
      label: "Тип постройки",
      value: safeDisplay(property.buildingType),
      field: "buildingType",
      icon: Hammer,
      type: "select",
      options: buildingTypeOptions
    },
    {
      label: "Статус строительства",
      value: safeDisplay(property.status),
      field: "status",
      icon: Hammer,
      type: "select",
      options: statusOptions
    },
    {
      label: "Статус земли",
      value: safeDisplay(property.landStatus),
      field: "landStatus",
      icon: MapPin,
    },
    {
      label: "Бассейн",
      value: safeDisplay(property.pool),
      field: "pool",
      icon: Droplet,
      type: "select",
      options: poolOptions
    },
    {
      label: "Собственность",
      value: property.ownershipForm ? `${property.ownershipForm}${property.leaseYears ? ` ${property.leaseYears} лет` : ""}` : "—",
      field: "ownershipForm",
      icon: FileText,
      type: "select",
      options: ownershipFormOptions
    },
    {
      label: "Дата завершения",
      value: safeDisplay(property.completionDate),
      field: "completionDate",
      icon: Calendar,
      type: "date"
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Мобильная горизонтальная галерея */}
      {property.images?.length ? (
        <div className="md:hidden overflow-x-auto flex pb-4 -mx-4 px-4 mb-4 snap-x snap-mandatory">
          {property.images.map((url, idx) => (
            <div
              key={idx}
              className="flex-none w-full h-56 rounded-xl overflow-hidden bg-gray-200 snap-center mr-4 last:mr-0"
              style={{ scrollSnapAlign: "center" }}
            >
              <img onClick={() => { setCurrentImg(idx); setLightbox(true); }} src={url} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover cursor-pointer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="md:hidden w-full h-56 rounded-xl overflow-hidden mb-4 bg-gray-200 flex items-center justify-center text-gray-400">
          <Building2 className="w-12 h-12" />
        </div>
      )}

      {/* Десктопный слайдер */}
      {property.images?.length ? (
        <div className="hidden md:block relative mb-4 group">
          <div className="w-full h-72 rounded-xl overflow-hidden bg-gray-200">
            <img
              src={property.images[currentImg]}
              alt={`Фото ${currentImg + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightbox(true)}
            />
          </div>
          {/* Prev */}
          {currentImg > 0 && (
            <button
              onClick={() => setCurrentImg((i) => i - 1)}
              className="hidden md:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition"
            >
              ◀
            </button>
          )}
          {/* Next */}
          {currentImg < property.images.length - 1 && (
            <button
              onClick={() => setCurrentImg((i) => i + 1)}
              className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition"
            >
              ▶
            </button>
          )}
        </div>
      ) : (
        <div className="hidden md:flex w-full h-72 rounded-xl overflow-hidden mb-4 bg-gray-200 items-center justify-center text-gray-400">
          <Building2 className="w-12 h-12" />
        </div>
      )}

      {/* Цена и кнопка "на карте" в одной строке */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl font-semibold text-gray-600">
          {isEditing ? (
            <input
              type="number"
              value={editedValues.price || property.price || ''}
              onChange={(e) => handleValueChange('price', e.target.value)}
              className="w-48 px-2 py-1 border border-gray-300 rounded text-4xl"
            />
          ) : (
            formatPrice(property.price)
          )}
        </div>

        {getLatLng() && (
          <button
            onClick={handleOpenMap}
            className="flex flex-col items-center text-blue-600 hover:underline"
          >
            <MapIcon className="w-6 h-6 mb-1 fill-blue-600 text-blue-600" />
            <span className="text-xs">на карте</span>
          </button>
        )}
      </div>

      {/* Тип */}
      <div className="text-2xl font-bold mb-4 text-gray-800">
        {isEditing ? (
          <select
            value={editedValues.type || property.type || ''}
            onChange={(e) => handleValueChange('type', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-2xl"
          >
            <option value="">(не выбрано)</option>
            {typeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          safeDisplay(property.type)
        )}
      </div>

      {property.description && (
        <p className="text-gray-600 mb-6 whitespace-pre-line">{property.description}</p>
      )}

      {/* Сетка характеристик */}
      <div className="grid grid-cols-2 gap-4">
        {attributes.map(({ label, value, icon: Icon, field, type, options }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 leading-none mb-1">{label}</div>
              {renderEditableValue(field, value, type, options)}
            </div>
          </div>
        ))}
      </div>

      {/* Добавляем кнопки "Расчет ROI" и "Прогресс строительства" после характеристик объекта */}
      {['admin', 'модератор', 'premium agent', 'agent', 'застройщик'].includes(role) && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Характеристики объекта</h2>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setShowRoiCalculator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Расчет ROI
            </button>
            <button
              onClick={() => navigate(`/building-progress/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Прогресс строительства
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно с калькулятором ROI */}
      {showRoiCalculator && ['admin', 'модератор', 'premium agent', 'agent', 'застройщик'].includes(role) && (
        <PropertyRoiCalculator
          propertyId={id}
          propertyData={property}
          onClose={() => setShowRoiCalculator(false)}
        />
      )}

      {/* Секция Документы */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Документы</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Юридическое название компании:</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('legalCompanyName', safeDisplay(property.legalCompanyName), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Налоговый номер (NPWP):</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('npwp', safeDisplay(property.npwp), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Разрешение на использование земли (PKKPR):</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('pkkpr', safeDisplay(property.pkkpr), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Сертификат права на землю (SHGB):</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('shgb', safeDisplay(property.shgb), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Разрешение на строительство (PBG):</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('pbg', safeDisplay(property.pbg), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Сертификат готовности здания (SLF):</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('slf', safeDisplay(property.slf), 'text')}
            </div>
          </div>
          
          {/* Файловые поля */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Планировка:</span>
            <div className="flex gap-2">
              {property.layoutFileURL ? (
                <>
                  <button 
                    onClick={() => window.open(property.layoutFileURL, '_blank')}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Просмотреть
                  </button>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpdate('layoutFileURL')}
                      disabled={uploading.layoutFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.layoutFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white`}
                    >
                      {uploading.layoutFileURL ? 'Загрузка...' : 'Обновить'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-500">Файл не загружен</span>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpload('layoutFileURL')}
                      disabled={uploading.layoutFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.layoutFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {uploading.layoutFileURL ? 'Загрузка...' : 'Загрузить'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Файл PKKPR:</span>
            <div className="flex gap-2">
              {property.pkkprFileURL ? (
                <>
                  <button 
                    onClick={() => window.open(property.pkkprFileURL, '_blank')}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Просмотреть
                  </button>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpdate('pkkprFileURL')}
                      disabled={uploading.pkkprFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.pkkprFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white`}
                    >
                      {uploading.pkkprFileURL ? 'Загрузка...' : 'Обновить'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-500">Файл не загружен</span>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpload('pkkprFileURL')}
                      disabled={uploading.pkkprFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.pkkprFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {uploading.pkkprFileURL ? 'Загрузка...' : 'Загрузить'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">ROI файл:</span>
            <div className="flex gap-2">
              {property.roiFileURL ? (
                <>
                  <button 
                    onClick={() => window.open(property.roiFileURL, '_blank')}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Просмотреть
                  </button>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpdate('roiFileURL')}
                      disabled={uploading.roiFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.roiFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white`}
                    >
                      {uploading.roiFileURL ? 'Загрузка...' : 'Обновить'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-500">Файл не загружен</span>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpload('roiFileURL')}
                      disabled={uploading.roiFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.roiFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {uploading.roiFileURL ? 'Загрузка...' : 'Загрузить'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки редактирования */}
      {canEdit() && (
        <div className="mt-8 flex justify-end gap-4">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Отменить
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-4 py-2 rounded-lg text-white ${
                  hasChanges
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Сохранить
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Редактировать
            </button>
          )}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            <img
              src={property.images[currentImg]}
              alt={`Фото ${currentImg + 1}`}
              className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
              onClick={() => setLightbox(false)}
            />
            {/* Кнопка закрытия */}
            <button
              className="absolute top-4 right-4 text-white text-4xl"
              onClick={() => setLightbox(false)}
            >
              ×
            </button>
            {/* Стрелка влево */}
            {currentImg > 0 && (
              <button
                onClick={() => setCurrentImg(prev => prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                ←
              </button>
            )}
            {/* Стрелка вправо */}
            {currentImg < property.images.length - 1 && (
              <button
                onClick={() => setCurrentImg(prev => prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                →
              </button>
            )}
            {/* Счетчик фотографий */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {currentImg + 1} / {property.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetail; 