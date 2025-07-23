import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
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
  Camera,
  X,
} from "lucide-react";
import { showError, showSuccess } from '../utils/notifications';
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from '../utils/firebaseStorage';
import PropertyRoiCalculator from "../components/PropertyRoiCalculator";
import { Badge } from "../components/ui/badge";
import { AdaptiveTooltip } from "../components/ui/tooltip";
// Импорт для сжатия изображений и конвертации PDF
import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { 
  translateDistrict, 
  translatePropertyType, 
  translateAreaUnit, 
  translateBuildingType, 
  translateConstructionStatus, 
  translateLandStatus, 
  translatePoolStatus, 
  translateOwnership,
  formatArea,
  validateArea 
} from "../lib/utils";

function PropertyDetail() {
  console.log('PropertyDetail: Component mounted');
  const { id } = useParams();
  console.log('PropertyDetail: Got id from params:', id);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { currentUser, role } = useAuth();
  const { getPropertyDetails, propertiesCache } = useCache();
  const { language } = useLanguage();
  const t = translations[language];
  
  // Новые состояния для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Состояния для загрузки файлов
  const [uploading, setUploading] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Состояние для валидации документов
  const [documentValidationErrors, setDocumentValidationErrors] = useState({});

  // Добавляем состояние для модального окна
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);

  // Мобильное обнаружение
  const [isMobile, setIsMobile] = useState(false);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
    if (['застройщик', 'премиум застройщик'].includes(role)) return true;
    return false;
  };

  // Функция для определения статуса бейджа "Проверено сервисом"
  const getServiceVerificationStatus = () => {
    if (role === 'премиум застройщик') {
      return {
        isActive: true,
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✓',
        tooltip: null
      };
    } else if (role === 'застройщик') {
      return {
        isActive: false,
        color: 'bg-gray-500 text-white border-gray-600',
        icon: '○',
        tooltip: t.propertyDetail.premiumOnlyTooltip
      };
    }
    return null;
  };

  // Функция для обработки изменений значений
  // Функция валидации для документов
  const validateDocumentField = (value) => {
    // Разрешаем только цифры, запятые, точки, тире
    const allowedChars = /^[\d,.-]*$/;
    return allowedChars.test(value);
  };

  const handleValueChange = (field, value) => {
    let processedValue = value;
    
    // Валидация для полей документов
    if (['npwp', 'shgb', 'pbg', 'imb', 'slf'].includes(field)) {
      // Проверяем валидацию
      const isValid = validateDocumentField(value);
      
      // Обновляем состояние ошибок валидации
      setDocumentValidationErrors(prev => ({
        ...prev,
        [field]: !isValid && value !== ''
      }));
      
      // Если невалидное значение и не пустое, не обновляем
      if (!isValid && value !== '') {
        return;
      }
      
      processedValue = value;
    }
    // Специальная обработка для поля площади
    else if (field === 'area') {
      // Разрешаем цифры, точки и пустые значения
      processedValue = value.replace(/[^\d.]/g, '');
      // Убираем множественные точки
      processedValue = processedValue.replace(/\.+/g, '.');
      // Убираем точки в начале
      processedValue = processedValue.replace(/^\./, '');
      // Разрешаем пустые значения для возможности полного удаления
      if (processedValue !== '' && processedValue !== '.') {
        const numValue = parseFloat(processedValue);
        processedValue = !isNaN(numValue) ? numValue : '';
      }
    }
    // Обработка других числовых полей
    else if (['price', 'bedrooms', 'bathrooms', 'leaseYears'].includes(field)) {
      // Убираем все нечисловые символы, кроме цифр
      processedValue = value.replace(/[^\d]/g, '');
      // Разрешаем пустые значения для возможности полного удаления
      processedValue = processedValue === '' ? '' : parseInt(processedValue);
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
      // Обрабатываем пустые строки для числовых полей
      const processedValues = { ...editedValues };
      
      // Специальная валидация для поля area
      if (processedValues.hasOwnProperty('area')) {
        if (processedValues.area === '' || processedValues.area === null) {
          processedValues.area = null;
        } else {
          const validation = validateArea(processedValues.area);
          if (!validation.isValid) {
            showError(validation.error);
            return;
          }
          processedValues.area = validation.value;
        }
      }
      
      // Для других числовых полей: если пустая строка, сохраняем как null
      const numericFields = ['price', 'bedrooms', 'bathrooms', 'leaseYears'];
      numericFields.forEach(field => {
        if (processedValues.hasOwnProperty(field) && processedValues[field] === '') {
          processedValues[field] = null;
        }
      });
      
      // Для agentCommission: всегда сохранять с %
      if (processedValues.hasOwnProperty('agentCommission') && processedValues.agentCommission) {
        let val = String(processedValues.agentCommission).replace(/[%\s]/g, '');
        processedValues.agentCommission = val ? val + '%' : '';
      }

      await updateDoc(propertyRef, processedValues);
      setProperty(prev => ({ ...prev, ...processedValues }));
      setEditedValues({});
      setHasChanges(false);
      setIsEditing(false);
      setDocumentValidationErrors({});
      showSuccess(t.propertyDetail.changesSaved);
    } catch (error) {
      console.error("Ошибка при сохранении изменений:", error);
      showError(t.propertyDetail.saveError);
    }
  };

  // Функция для отмены редактирования
  const handleCancel = () => {
    setEditedValues({});
    setHasChanges(false);
    setIsEditing(false);
    setDocumentValidationErrors({});
  };

  // Функция для загрузки новых фотографий (с сжатием и поддержкой PDF)
  const handleImageUpload = async () => {
    if (!canEdit()) {
      showError(t.propertyDetail.editPermissionError);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.onchange = async (event) => {
      const files = Array.from(event.target.files);
      if (!files.length) return;

      setUploadingImages(true);
      
      try {
        const compressionOptions = {
          maxSizeMB: 10,
          useWebWorker: true
        };

        const processedFiles = [];
        
        for (let file of files) {
          if (file.type === "application/pdf") {
            // PDF -> конвертация в изображения
            const pageBlobs = await convertPdfToImages(file);
            for (let blob of pageBlobs) {
              const compressedFile = await imageCompression(blob, compressionOptions);
              processedFiles.push(compressedFile);
            }
          } else {
            // Обычное изображение
            const compressedFile = await imageCompression(file, compressionOptions);
            processedFiles.push(compressedFile);
          }
        }

        const uploadPromises = processedFiles.map(file => 
          uploadToFirebaseStorageInFolder(file, 'properties/images')
        );

        const urls = await Promise.all(uploadPromises);
        
        // Обновляем объект в базе данных
        const propertyRef = doc(db, "properties", id);
        const currentImages = property.images || [];
        await updateDoc(propertyRef, { 
          images: [...currentImages, ...urls],
          updatedAt: Timestamp.now()
        });
        
        // Обновляем локальное состояние
        setProperty(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls]
        }));
        
        showSuccess(t.propertyDetail.photoUploaded);
      } catch (error) {
        console.error("Ошибка загрузки фотографий:", error);
        showError(t.propertyDetail.photoUploadError);
      } finally {
        setUploadingImages(false);
      }
    };
    input.click();
  };

  // Функция для удаления фотографии
  const handleImageDelete = async (index) => {
    console.log("=== НАЧАЛО УДАЛЕНИЯ ФОТО ===");
    console.log("Индекс для удаления:", index);
    console.log("Текущий объект:", property);
    console.log("Массив изображений:", property?.images);
    
    if (!canEdit()) {
      console.log("Нет прав на редактирование");
      showError(t.propertyDetail.editPermissionError);
      return;
    }

    if (!property.images?.[index]) {
      console.log("Фотография не найдена по индексу:", index);
      showError("Фотография не найдена");
      return;
    }

    try {
      const imageUrl = property.images[index];
      console.log("URL фотографии для удаления:", imageUrl);
      
      // Сначала пытаемся удалить файл из хранилища
      console.log("Вызываем deleteFileFromFirebaseStorage...");
      await deleteFileFromFirebaseStorage(imageUrl);
      console.log("Файл успешно удален из хранилища");

      // После успешного удаления файла обновляем базу данных
      const newImages = [...property.images];
      newImages.splice(index, 1);
      console.log("Новый массив изображений:", newImages);
      
      const propertyRef = doc(db, "properties", id);
      console.log("Обновляем базу данных...");
      await updateDoc(propertyRef, { 
        images: newImages,
        updatedAt: Timestamp.now()
      });
      console.log("База данных успешно обновлена");
      
      // Обновляем локальное состояние
      setProperty(prev => ({
        ...prev,
        images: newImages
      }));
      
      // Если удалили текущую фотографию, переключаемся на предыдущую
      if (currentImg >= newImages.length) {
        setCurrentImg(Math.max(0, newImages.length - 1));
      }

      console.log("=== УДАЛЕНИЕ УСПЕШНО ЗАВЕРШЕНО ===");
      showSuccess(t.propertyDetail.photoDeleted);
    } catch (error) {
      console.error("=== ОШИБКА ПРИ УДАЛЕНИИ ===");
      console.error("Тип ошибки:", error.constructor.name);
      console.error("Сообщение ошибки:", error.message);
      console.error("Код ошибки:", error.code);
      console.error("Стек ошибки:", error.stack);
      
      if (error.message && (error.message.includes("storage/object-not-found") || error.message.includes("storage/unauthorized"))) {
        console.log("Файл не найден в storage или нет прав доступа, удаляем только ссылку из БД");
        // Если файл не найден в storage или нет прав доступа, все равно удаляем ссылку из базы данных
        try {
          const newImages = [...property.images];
          newImages.splice(index, 1);
          
          const propertyRef = doc(db, "properties", id);
          await updateDoc(propertyRef, { 
            images: newImages,
            updatedAt: Timestamp.now()
          });
          
          setProperty(prev => ({
            ...prev,
            images: newImages
          }));
          
          if (currentImg >= newImages.length) {
            setCurrentImg(Math.max(0, newImages.length - 1));
          }
          
          showSuccess(t.propertyDetail.photoLinkDeleted);
        } catch (dbError) {
          console.error("Ошибка обновления базы данных:", dbError);
          showError(t.propertyDetail.databaseUpdateError);
        }
      } else {
        console.log("Показываем общую ошибку удаления");
        showError(t.propertyDetail.photoDeleteError);
      }
      
      // Перезагружаем данные объекта в случае ошибки
      try {
        const propertyRef = doc(db, "properties", id);
        const propertySnap = await getDoc(propertyRef);
        if (propertySnap.exists()) {
          setProperty(prev => ({
            ...prev,
            ...propertySnap.data()
          }));
        }
      } catch (reloadError) {
        console.error("Ошибка перезагрузки данных:", reloadError);
      }
    }
  };

  // Функция для загрузки нового файла
  const handleFileUpload = (fieldName) => {
    if (!canEdit()) {
      showError(t.propertyDetail.editPermissionError);
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
        } else if (fieldName === 'dueDiligenceFileURL') {
          folder = 'documents/due-diligence';
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
        showError(t.propertyDetail.fileUploadError);
      } finally {
        setUploading(prev => ({ ...prev, [fieldName]: false }));
      }
    };
    input.click();
  };

  // Функция для обновления существующего файла
  const handleFileUpdate = (fieldName) => {
    if (!canEdit()) {
      showError(t.propertyDetail.editPermissionError);
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
        } else if (fieldName === 'dueDiligenceFileURL') {
          folder = 'documents/due-diligence';
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
        showError(t.propertyDetail.fileUploadError);
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



  // Добавляем списки значений для выпадающих списков
  const typeOptions = [
    { value: "Вилла", label: t.propertyDetail.typeOptions.villa },
    { value: "Апартаменты", label: t.propertyDetail.typeOptions.apartment },
    { value: "Дом", label: t.propertyDetail.typeOptions.house },
    { value: "Коммерческая недвижимость", label: t.propertyDetail.typeOptions.commercial },
    { value: "Апарт-вилла", label: t.propertyDetail.typeOptions.apartVilla },
    { value: "Таунхаус", label: t.propertyDetail.typeOptions.townhouse },
    { value: "Земельный участок", label: t.propertyDetail.typeOptions.land }
  ];

  const bedroomsOptions = [
    { value: "Студия", label: t.propertyDetail.studio },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
    { value: "10", label: "10" }
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
    { value: "Новый комплекс", label: t.propertyDetail.buildingTypeOptions.newComplex },
    { value: "Реновация", label: t.propertyDetail.buildingTypeOptions.renovation },
    { value: "ИЖС", label: t.propertyDetail.buildingTypeOptions.individual }
  ];

  const statusOptions = [
    { value: "Проект", label: t.propertyDetail.statusOptions.project },
    { value: "Строится", label: t.propertyDetail.statusOptions.underConstruction },
    { value: "Готовый", label: t.propertyDetail.statusOptions.ready },
    { value: "От собственника", label: t.propertyDetail.statusOptions.fromOwner }
  ];

  const poolOptions = [
    { value: "Нет", label: t.propertyDetail.poolOptions.no },
    { value: "Частный", label: t.propertyDetail.poolOptions.private },
    { value: "Общий", label: t.propertyDetail.poolOptions.shared }
  ];

  // Добавляем список значений для формы собственности
  const ownershipFormOptions = [
    { value: "Leashold", label: t.propertyDetail.ownershipOptions.leasehold },
    { value: "Freehold", label: t.propertyDetail.ownershipOptions.freehold }
  ];

  // Функция для форматирования суммы комиссии
  const parseCommission = (val) => {
    if (!val) return '';
    // Убираем %, пробелы, запятые
    return parseFloat(String(val).replace(/[%\s,]/g, '').replace(',', '.'));
  };
  const getAgentCommissionDisplay = () => {
    const commissionRaw = isEditing
      ? (editedValues.agentCommission !== undefined ? editedValues.agentCommission : property.agentCommission)
      : property.agentCommission;
    const price = isEditing
      ? (editedValues.price !== undefined ? editedValues.price : property.price)
      : property.price;
    const commission = parseCommission(commissionRaw);
    const commissionDisplay = commissionRaw ? String(commissionRaw).replace(/[%\s]/g, '') : '';
    if (!commission || isNaN(Number(commission)) || !price || isNaN(Number(price))) {
      return commissionDisplay ? commissionDisplay + '%' : '';
    }
    const sum = Math.round(Number(price) * Number(commission) / 100);
    return `${commissionDisplay}% (${sum.toLocaleString()})`;
  };

  // Обновляем функцию рендеринга значения
  const renderEditableValue = (field, value, type, options) => {
    if (isEditing && !nonEditableFields.includes(field)) {
      // Получаем исходное значение из объекта property, а не отформатированное value
      const originalValue = property[field];
      
      if (field === 'ownershipForm') {
        return (
          <div className="space-y-2">
            <select
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">{t.propertyDetail.notSelected}</option>
              {options.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
              ))}
            </select>
            {(editedValues.hasOwnProperty(field) ? editedValues[field] : originalValue) === 'Leashold' && (
              <input
                type="text"
                value={editedValues.hasOwnProperty('leaseYears') ? editedValues.leaseYears : (property.leaseYears || '')}
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
            value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
          >
                          <option value="">{t.propertyDetail.notSelected}</option>
              {options.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
              ))}
            </select>
        );
      } else {
        // Специальная обработка для поля площади
        if (field === 'area') {
          return (
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Введите площадь"
            />
          );
        }
        if (field === 'agentCommission') {
          const commissionRaw = editedValues.agentCommission !== undefined ? editedValues.agentCommission : property.agentCommission;
          const price = editedValues.price !== undefined ? editedValues.price : property.price;
          const commission = parseCommission(commissionRaw);
          const commissionDisplay = commissionRaw ? String(commissionRaw).replace(/[%\s]/g, '') : '';
          let sum = '';
          if (commission && !isNaN(Number(commission)) && price && !isNaN(Number(price))) {
            sum = `${Math.round(Number(price) * Number(commission) / 100).toLocaleString()}`;
          }
          const options = ['4', '5', '6', '7', '8', '9', '10'];
          return (
            <div>
              <select
                value={commissionDisplay}
                onChange={e => handleValueChange('agentCommission', e.target.value)}
                className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
              >
                {options.map(opt => (
                  <option key={opt} value={opt}>{opt}%</option>
                ))}
              </select>
              {sum && (
                <div className="text-xs text-gray-500 mt-1">{commissionDisplay}% ({sum})</div>
              )}
            </div>
          );
        }
        // Специальная обработка для полей документов с валидацией
        if (['npwp', 'shgb', 'pbg', 'imb', 'slf'].includes(field)) {
          const hasError = documentValidationErrors[field];
          return (
            <div className="w-full">
              <input
                type={type || "text"}
                value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
                onChange={(e) => handleValueChange(field, e.target.value)}
                className={`text-sm font-medium leading-none whitespace-pre-line w-full border rounded px-2 py-1 ${
                  hasError 
                    ? 'border-red-500 text-red-600 bg-red-50' 
                    : 'border-gray-300 text-gray-900'
                }`}
                placeholder={t.propertyDetail.documentValidationPlaceholder}
              />
              {hasError && (
                <div className="text-xs text-red-500 mt-1">
                  {t.propertyDetail.documentValidationError}
                </div>
              )}
            </div>
          );
        }
        
        return (
          <input
            type={type || "text"}
            value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
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
    // Получение имени застройщика по ID
    const fetchDeveloperName = async (developerId) => {
      try {
        const developerDoc = await getDoc(doc(db, "developers", developerId));
        if (developerDoc.exists()) {
          return developerDoc.data().name;
        }
        return null;
      } catch (err) {
        console.error(t.propertyDetail.developerLoadError || "Ошибка загрузки застройщика:", err);
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
        console.error(t.propertyDetail.complexLoadError || "Ошибка загрузки комплекса:", err);
        return null;
      }
    };

    async function fetchData() {
      try {
        console.log('PropertyDetail: Starting to fetch data for id:', id);
        console.log('PropertyDetail: Current role:', role);
        
        // Если пользователь - застройщик, получаем его developerId
        let userDeveloperName = null;
        if (['застройщик', 'премиум застройщик'].includes(role) && currentUser) {
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
              console.error(t.propertyDetail.developerLoadError || "Ошибка при загрузке имени застройщика:", err);
            }
          }
          
          // Загружаем название комплекса если есть complexId
          if (propertyData.complexId) {
            try {
              const complexName = await fetchComplexName(propertyData.complexId);
              propertyData.complexName = complexName;
            } catch (err) {
              console.error(t.propertyDetail.complexLoadError || "Ошибка при загрузке названия комплекса:", err);
            }
          }
          
          // Проверяем права доступа для застройщика
          if (['застройщик', 'премиум застройщик'].includes(role)) {
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
  }, [id, currentUser, role, getPropertyDetails, propertiesCache, t.propertyDetail.developerLoadError, t.propertyDetail.complexLoadError]);

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
        {t.propertyDetail.notFound}
      </div>
    );
  }

  const attributesBase = [
    {
      label: property.bedrooms === 0 ? t.propertyDetail.studio : t.propertyDetail.bedrooms,
      value: property.bedrooms === 0 ? t.propertyDetail.studio : safeDisplay(property.bedrooms),
      field: "bedrooms",
      icon: Bed,
      type: "select",
      options: bedroomsOptions
    },
    {
      label: t.propertyDetail.area,
      value: property.area ? translateAreaUnit(formatArea(property.area), language) : "—",
      field: "area",
      icon: Ruler,
      type: "number"
    },
    {
      label: t.propertyDetail.developer,
      value: safeDisplay(property.developerName || property.developer),
      field: "developer",
      icon: Building2,
    },
    {
      label: t.propertyDetail.complex,
      value: safeDisplay(property.complexName || property.complex),
      field: "complex",
      icon: Home,
    },
    {
      label: t.propertyDetail.bathrooms,
      value: safeDisplay(property.bathrooms),
      field: "bathrooms",
      icon: Bath,
      type: "select",
      options: bathroomsOptions
    },
    {
      label: t.propertyDetail.floors,
      value: property.floors ? `${safeDisplay(property.floors)} ${property.floors === 1 ? t.propertyDetail.floorText : t.propertyDetail.floorsText}` : "—",
      field: "floors",
      icon: Layers,
      type: "number"
    },

    {
      label: t.propertyDetail.district,
      value: translateDistrict(safeDisplay(property.district), language),
      field: "district",
      icon: MapPin,
    },
    {
      label: t.propertyDetail.buildingType,
      value: translateBuildingType(safeDisplay(property.buildingType), language),
      field: "buildingType",
      icon: Hammer,
      type: "select",
      options: buildingTypeOptions
    },
    {
      label: t.propertyDetail.constructionStatus,
      value: translateConstructionStatus(safeDisplay(property.status), language),
      field: "status",
      icon: Hammer,
      type: "select",
      options: statusOptions
    },
    {
      label: t.propertyDetail.landStatus,
      value: translateLandStatus(safeDisplay(property.landStatus), language),
      field: "landStatus",
      icon: MapPin,
    },
    {
      label: t.propertyDetail.pool,
      value: translatePoolStatus(safeDisplay(property.pool), language),
      field: "pool",
      icon: Droplet,
      type: "select",
      options: poolOptions
    },
    {
      label: t.propertyDetail.ownership,
      value: property.ownershipForm ? `${translateOwnership(property.ownershipForm, language)}${property.leaseYears ? ` ${property.leaseYears} ${t.propertyDetail.years}` : ""}` : "—",
      field: "ownershipForm",
      icon: FileText,
      type: "select",
      options: ownershipFormOptions
    },
    {
      label: t.propertyDetail.completionDate,
      value: safeDisplay(property.completionDate),
      field: "completionDate",
      icon: Calendar,
      type: "date"
    },
  ];

  const showTotalArea = isEditing || (!!property.totalArea && property.totalArea !== '');
  const showManagementCompany = isEditing || (!!property.managementCompany && property.managementCompany !== '');
  const attributes = [
    ...attributesBase,
    ...(showTotalArea ? [{
      label: t.propertyDetail.totalArea,
      value: safeDisplay(property.totalArea),
      field: "totalArea",
      icon: Ruler,
      type: "number"
    }] : []),
    ...(showManagementCompany ? [{
      label: t.propertyDetail.managementCompany,
      value: safeDisplay(property.managementCompany),
      field: "managementCompany",
      icon: Building2,
      type: "text"
    }] : []),
    {
      label: t.propertyDetail.agentCommission,
      value: getAgentCommissionDisplay(),
      field: "agentCommission",
      icon: Star,
      type: "text"
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Кнопка добавления фотографий */}
      {canEdit() && (
        <div className="mb-4">
          <button
            onClick={handleImageUpload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              t.propertyDetail.uploading
            ) : (
              <>
                <Camera className="h-4 w-4" />
                {t.propertyDetail.addPhotoButton}
              </>
            )}
          </button>
        </div>
      )}

      {/* Мобильная горизонтальная галерея */}
      {property.images?.length ? (
        <div className="md:hidden overflow-x-auto flex pb-4 -mx-4 px-4 mb-4 snap-x snap-mandatory">
          {property.images.map((url, idx) => (
            <div
              key={idx}
              className="relative flex-none w-full h-56 rounded-xl overflow-hidden bg-gray-200 snap-center mr-4 last:mr-0"
              style={{ scrollSnapAlign: "center" }}
            >
              <img onClick={() => { setCurrentImg(idx); setLightbox(true); }} src={url} alt={`${t.propertyDetail.photo} ${idx + 1}`} className="w-full h-full object-cover cursor-pointer" />
              {isEditing && canEdit() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageDelete(idx);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
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
            {isEditing && canEdit() && (
              <button
                onClick={() => handleImageDelete(currentImg)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
              value={editedValues.hasOwnProperty('price') ? editedValues.price : (property.price || '')}
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
            <span className="text-xs">{t.propertyDetail.onMap}</span>
          </button>
        )}
      </div>

      {/* Тип */}
      <div className="text-2xl font-bold mb-4 text-gray-800">
        {isEditing ? (
          <select
            value={editedValues.hasOwnProperty('type') ? editedValues.type : (property.type || '')}
            onChange={(e) => handleValueChange('type', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-2xl"
          >
            <option value="">{t.propertyDetail.notSelected}</option>
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          translatePropertyType(safeDisplay(property.type), language)
        )}
      </div>

                  {/* Бейдж "Проверено сервисом" */}
            {getServiceVerificationStatus() && (
              <div className="mb-4">
                {getServiceVerificationStatus().tooltip ? (
                  <AdaptiveTooltip content={getServiceVerificationStatus().tooltip}>
                    <Badge className={`${getServiceVerificationStatus().color} border flex items-center gap-1 w-fit`}>
                      <span className="text-sm font-medium">{getServiceVerificationStatus().icon}</span>
                      <span className="text-sm">{t.propertyDetail.serviceVerified}</span>
                    </Badge>
                  </AdaptiveTooltip>
                ) : (
                  <Badge className={`${getServiceVerificationStatus().color} border flex items-center gap-1 w-fit`}>
                    <span className="text-sm font-medium">{getServiceVerificationStatus().icon}</span>
                    <span className="text-sm">{t.propertyDetail.serviceVerified}</span>
                  </Badge>
                )}
              </div>
            )}

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

      {/* Дополнительные опции */}
      {isEditing ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.additionalOptions}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smartHome"
                checked={editedValues.smartHome !== undefined ? editedValues.smartHome : property.smartHome}
                onChange={(e) => handleValueChange('smartHome', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="smartHome" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.smartHome}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="jacuzzi"
                checked={editedValues.jacuzzi !== undefined ? editedValues.jacuzzi : property.jacuzzi}
                onChange={(e) => handleValueChange('jacuzzi', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="jacuzzi" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.jacuzzi}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terrace"
                checked={editedValues.terrace !== undefined ? editedValues.terrace : property.terrace}
                onChange={(e) => handleValueChange('terrace', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="terrace" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.terrace}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rooftop"
                checked={editedValues.rooftop !== undefined ? editedValues.rooftop : property.rooftop}
                onChange={(e) => handleValueChange('rooftop', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="rooftop" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.rooftop}
              </label>
            </div>
          </div>
        </div>
      ) : (
        (property.smartHome || property.jacuzzi || property.terrace || property.rooftop) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.additionalOptions}</h3>
            <div className="grid grid-cols-2 gap-3">
              {property.smartHome && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Home className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.smartHome}</span>
                </div>
              )}
              {property.jacuzzi && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Droplet className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.jacuzzi}</span>
                </div>
              )}
              {property.terrace && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Star className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.terrace}</span>
                </div>
              )}
              {property.rooftop && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.rooftop}</span>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Добавляем кнопки "Расчет ROI" после характеристик объекта */}
      {['admin', 'модератор', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
        <div className="mt-8">
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setShowRoiCalculator(true)}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isMobile ? 'w-full h-12 justify-center' : ''}`}
            >
              <Calculator className="w-5 h-5" />
              {t.propertyDetail.roiCalculatorButton}
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно с калькулятором ROI */}
      {showRoiCalculator && ['admin', 'модератор', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
        <PropertyRoiCalculator
          propertyId={id}
          propertyData={property}
          onClose={() => setShowRoiCalculator(false)}
        />
      )}

      {/* Секция Документы */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{t.propertyDetail.documentsSection}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.legalCompanyName}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('legalCompanyName', safeDisplay(property.legalCompanyName), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.taxNumber}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('npwp', safeDisplay(property.npwp), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.landUsePermit}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('pkkpr', safeDisplay(property.pkkpr), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.landRightsCertificate}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('shgb', safeDisplay(property.shgb), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.buildingPermit}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('pbg', safeDisplay(property.pbg), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.buildingPermitIMB}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('imb', safeDisplay(property.imb), 'text')}
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.buildingReadinessCertificate}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('slf', safeDisplay(property.slf), 'text')}
            </div>
          </div>
          
          {/* Файловые поля */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.layout}</span>
            <div className="flex gap-2">
              {property.layoutFileURL ? (
                <>
                  <button 
                    onClick={() => window.open(property.layoutFileURL, '_blank')}
                    className={`px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ${isMobile ? 'min-h-[40px]' : ''}`}
                  >
                    {t.propertyDetail.viewButton}
                  </button>
                  {canEdit() && (
                                          <button 
                        onClick={() => handleFileUpdate('layoutFileURL')}
                        disabled={uploading.layoutFileURL}
                        className={`px-3 py-1 text-xs rounded ${
                          uploading.layoutFileURL 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                      >
                        {uploading.layoutFileURL ? t.propertyDetail.uploading : t.propertyDetail.updateButton}
                      </button>
                  )}
                </>
                              ) : (
                  <>
                    <span className="text-xs text-gray-500">{t.propertyDetail.fileNotUploaded}</span>
                    {canEdit() && (
                      <button 
                        onClick={() => handleFileUpload('layoutFileURL')}
                        disabled={uploading.layoutFileURL}
                        className={`px-3 py-1 text-xs rounded ${
                          uploading.layoutFileURL 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                      >
                        {uploading.layoutFileURL ? t.propertyDetail.uploading : t.propertyDetail.uploadButton}
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.dueDiligence}</span>
            <div className="flex gap-2">
              {property.dueDiligenceFileURL ? (
                <>
                  <button 
                    onClick={() => window.open(property.dueDiligenceFileURL, '_blank')}
                    className={`px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ${isMobile ? 'min-h-[40px]' : ''}`}
                  >
                    {t.propertyDetail.viewButton}
                  </button>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpdate('dueDiligenceFileURL')}
                      disabled={uploading.dueDiligenceFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.dueDiligenceFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                    >
                                              {uploading.dueDiligenceFileURL ? t.propertyDetail.uploading : t.propertyDetail.updateButton}
                    </button>
                  )}
                </>
                              ) : (
                  <>
                    <span className="text-xs text-gray-500">{t.propertyDetail.fileNotUploaded}</span>
                    {canEdit() && (
                      <button 
                        onClick={() => handleFileUpload('dueDiligenceFileURL')}
                      disabled={uploading.dueDiligenceFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.dueDiligenceFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                    >
                                              {uploading.dueDiligenceFileURL ? t.propertyDetail.uploading : t.propertyDetail.uploadButton}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t.propertyDetail.pkkprFile}</span>
            <div className="flex gap-2">
              {property.pkkprFileURL ? (
                <>
                  <button 
                    onClick={() => window.open(property.pkkprFileURL, '_blank')}
                    className={`px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ${isMobile ? 'min-h-[40px]' : ''}`}
                  >
                    {t.propertyDetail.viewButton}
                  </button>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpdate('pkkprFileURL')}
                      disabled={uploading.pkkprFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.pkkprFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                    >
                                              {uploading.pkkprFileURL ? t.propertyDetail.uploading : t.propertyDetail.updateButton}
                    </button>
                  )}
                </>
                              ) : (
                  <>
                    <span className="text-xs text-gray-500">{t.propertyDetail.fileNotUploaded}</span>
                    {canEdit() && (
                      <button 
                        onClick={() => handleFileUpload('pkkprFileURL')}
                      disabled={uploading.pkkprFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.pkkprFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                    >
                                              {uploading.pkkprFileURL ? t.propertyDetail.uploading : t.propertyDetail.uploadButton}
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
        <div className={`mt-8 ${isMobile ? 'flex flex-col gap-4' : 'flex justify-end gap-4'}`}>
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className={`px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ${isMobile ? 'w-full h-12' : ''}`}
              >
                {t.propertyDetail.cancelButton}
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-4 py-2 rounded-lg text-white ${
                  hasChanges
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                } ${isMobile ? 'w-full h-12' : ''}`}
              >
                {t.propertyDetail.saveButton}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${isMobile ? 'w-full h-12' : ''}`}
            >
              {t.propertyDetail.editButton}
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
              alt={`${t.propertyDetail.photo} ${currentImg + 1}`}
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
              {t.propertyDetail.photoCounter.replace('{current}', currentImg + 1).replace('{total}', property.images.length)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetail; 