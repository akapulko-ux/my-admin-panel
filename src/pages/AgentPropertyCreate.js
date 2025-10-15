import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { db } from "../firebaseConfig";
import { doc, Timestamp, setDoc, collection } from "firebase/firestore";
import { useAuth } from "../AuthContext";

import {
  Bed,
  Ruler,
  Star,
  Building2,
  MapPin,
  Hammer,
  FileText,
  Calendar,
  Droplet,
  Layers,
  Bath,
  Camera,
  X,
} from "lucide-react";
import { showError, showSuccess } from '../utils/notifications';
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from '../utils/firebaseStorage';

// Импорт для сжатия изображений и конвертации PDF
import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { AdaptiveTooltip } from "../components/ui/tooltip";
import { 
  translateDistrict, 
  translateAreaUnit, 
  translateBuildingType, 
  translateConstructionStatus, 
  translatePoolStatus, 
  translateOwnership,
  formatArea,
  validateArea 
} from "../lib/utils";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";


function PropertyCreate() {
  console.log('PropertyCreate: Component mounted');
  const { currentUser, role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const location = useLocation();
  

  
  // Состояния для создания объекта
  const [property, setProperty] = useState({
    propertyName: '',
    developer: '',
    type: 'Вилла',
    price: '',
    area: '',
    bedrooms: '1',
    bathrooms: '1',
    floors: '1',
    district: 'Семиньяк',
    buildingType: 'Новый комплекс',
    status: 'От собственника',
    pool: 'Нет',
    ownershipForm: 'Freehold',
    leaseYears: '',
    completionDate: '',
    totalArea: '',
    managementCompany: '',
    agentCommission: '1',
    description: '',
    smartHome: false,
    jacuzzi: false,
    terrace: false,
    rooftop: false,
    balcony: false,
    bbq: false,
    furniture: false,
    washingMachine: false,
    distanceToBeach: '',
    distanceToCenter: '',
    coordinates: '',
    manualRoi: '',
    landArea: '',
    expectedCost: '',
    legalCompanyName: '',
    npwp: '',
    pkkpr: '',
    shgb: '',
    pbg: '',
    imb: '',
    slf: '',
    landLeaseEndDate: '',
    images: [],
    layoutFileURL: '',
    dueDiligenceFileURL: '',
    unbrandedPresentationFileURL: '',
    pkkprFileURL: '',
    roiFileURL: ''
  });
  
  // Состояния для загрузки файлов
  const [uploading, setUploading] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Состояние для валидации документов
  const [documentValidationErrors, setDocumentValidationErrors] = useState({});

  // Состояние для ошибок валидации обязательных полей
  const [requiredFieldErrors, setRequiredFieldErrors] = useState({});

  // Мобильное обнаружение
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Состояние для галереи фотографий
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Функция для проверки, может ли пользователь создавать объект
  const canCreate = useCallback(() => {
    console.log('canCreate check:', {
      role,
      isAdmin: role === 'admin',
      isDeveloper: role === 'застройщик',
      isAgent: ['agent', 'premium agent'].includes(role)
    });
    
    if (role === 'admin' || role === 'moderator') return true;
    if (['застройщик', 'премиум застройщик'].includes(role)) return true;
    if (['agent', 'premium agent'].includes(role)) return true;
    return false;
  }, [role]);





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
    // Валидация для полей propertyName и developer: только A-Z, 0-9, пробел и дефис; приводим к ВЕРХНЕМУ РЕГИСТРУ
    else if (field === 'propertyName' || field === 'developer') {
      const upper = String(value || '').toUpperCase();
      // Разрешены латинские прописные, цифры, пробел и дефис
      processedValue = upper.replace(/[^A-Z0-9 -]/g, '');
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
    // Специальная обработка для поля ROI
    else if (field === 'manualRoi') {
      // Разрешаем цифры, точки и пустые значения
      processedValue = value.replace(/[^\d.]/g, '');
      // Убираем множественные точки
      processedValue = processedValue.replace(/\.+/g, '.');
      // Убираем точки в начале
      processedValue = processedValue.replace(/^\./, '');
      // Разрешаем пустые значения для возможности полного удаления
      if (processedValue !== '' && processedValue !== '.') {
        const numValue = parseFloat(processedValue);
        // Ограничиваем ROI от 0 до 100%
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
          processedValue = numValue;
        } else if (!isNaN(numValue) && numValue > 100) {
          processedValue = 100;
        } else {
          processedValue = '';
        }
      }
    }
    // Специальная обработка для поля площади земли
    else if (field === 'landArea') {
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
    // Специальная обработка для поля ожидаемой стоимости
    else if (field === 'expectedCost') {
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
    // Специальная обработка для поля leaseYears (годы аренды)
    else if (field === 'leaseYears') {
      // Разрешаем цифры, знак + и пустые значения
      processedValue = value.replace(/[^\d+]/g, '');
      // Разрешаем пустые значения для возможности полного удаления
      processedValue = processedValue === '' ? '' : processedValue;
    }
    // Обработка других числовых полей
    else if (['price', 'bedrooms', 'bathrooms', 'unitsCount'].includes(field)) {
      // Убираем все нечисловые символы, кроме цифр
      processedValue = value.replace(/[^\d.]/g, '');
      // Разрешаем пустые значения для возможности полного удаления
      processedValue = processedValue === '' ? '' : parseInt(processedValue);
    }
    
    setProperty(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    // Очищаем ошибку валидации для этого поля, если оно заполнено
    if (['price', 'area', 'coordinates', 'completionDate'].includes(field) && processedValue && processedValue !== '') {
      setRequiredFieldErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Функция проверки заполнения обязательных полей
  const areRequiredFieldsFilled = () => {
    return property.price && property.price !== '' &&
           property.area && property.area !== '' &&
           property.coordinates && property.coordinates !== '' &&
           property.completionDate && property.completionDate !== '';
  };

  // Функция валидации обязательных полей
  const validateRequiredFields = () => {
    const errors = {};
    
    // Проверяем обязательные поля
    if (!property.price || property.price === '') {
      errors.price = 'Цена обязательна для заполнения';
    }
    
    if (!property.area || property.area === '') {
              errors.area = t.propertyDetail.areaPlaceholder.replace(' *', '') + ' обязательна для заполнения';
    }
    
    if (!property.coordinates || property.coordinates === '') {
      errors.coordinates = 'Координаты обязательны для заполнения';
    }
    
    if (!property.completionDate || property.completionDate === '') {
      errors.completionDate = 'Дата завершения обязательна для заполнения';
    }
    
    setRequiredFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Функция для создания объекта
  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      
      // Проверяем обязательные поля
      if (!validateRequiredFields()) {
        showError('Пожалуйста, заполните все обязательные поля');
        setIsSubmitting(false);
        return;
      }
      
      // Обрабатываем пустые строки для числовых полей
      const processedValues = { ...property };
      
      // Специальная валидация для поля area
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
      
      // Для других числовых полей: если пустая строка, сохраняем как null
      const numericFields = ['price', 'bedrooms', 'bathrooms', 'leaseYears', 'unitsCount'];
      numericFields.forEach(field => {
        if (processedValues[field] === '') {
          processedValues[field] = null;
        }
      });
      
      // Для agentCommission: всегда сохранять с %
      if (processedValues.agentCommission) {
        let val = String(processedValues.agentCommission).replace(/[%\s]/g, '');
        processedValues.agentCommission = val ? val + '%' : '';
      }

      // Добавляем метаданные
      processedValues.createdAt = Timestamp.now();
      processedValues.updatedAt = Timestamp.now();
      processedValues.createdBy = currentUser.uid;
      processedValues.addedByAgent = true;
      processedValues.moderation = true;
      processedValues.isHidden = false;

      // Создаем новый документ в коллекции properties
      const newPropertyRef = doc(collection(db, "properties"));
      await setDoc(newPropertyRef, processedValues);
      
      showSuccess('Объект успешно создан');
      // Перенаправляем на публичную страницу объектов (теперь по корню)
      window.location.href = '/';
    } catch (error) {
      console.error("Ошибка при создании объекта:", error);
      showError('Ошибка при создании объекта');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Функция для принудительной конвертации в JPEG
  const convertToJpeg = async (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        const maxDimension = 1280;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const baseName = (file && typeof file.name === 'string' && file.name) ? file.name : `image-${Date.now()}.jpg`;
          const newName = baseName.includes('.') ? baseName.replace(/\.[^/.]+$/, '.jpg') : `${baseName}.jpg`;
          const jpegFile = new File([blob], newName, {
            type: 'image/jpeg'
          });
          resolve(jpegFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Функция для загрузки новых фотографий (с сжатием и поддержкой PDF)
  const handleImageUpload = async () => {
    if (!canCreate()) {
      showError('Нет прав на создание объекта');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.onchange = async (event) => {
      const files = Array.from(event.target.files);
      if (!files.length) return;

      // Проверяем ограничение на количество фото (максимум 10)
      const currentImageCount = property.images?.length || 0;
      const maxImages = 10;
      
      if (currentImageCount >= maxImages) {
        showError(`Максимальное количество фотографий: ${maxImages}`);
        return;
      }

      setUploadingImages(true);
      
      try {
        const compressionOptions = {
          maxSizeMB: 10,
          useWebWorker: true,
          fileType: 'image/jpeg',
          maxWidthOrHeight: 1280,
          initialQuality: 0.8
        };

        const processedFiles = [];
        
        for (let file of files) {
          if (file.type === "application/pdf") {
            // PDF -> конвертация в изображения
            const pageBlobs = await convertPdfToImages(file);
            for (let blob of pageBlobs) {
              // Принудительно конвертируем в JPEG
              const jpegFile = await convertToJpeg(blob);
              const compressedFile = await imageCompression(jpegFile, compressionOptions);
              processedFiles.push(compressedFile);
            }
          } else {
            // Обычное изображение - принудительно конвертируем в JPEG
            const jpegFile = await convertToJpeg(file);
            const compressedFile = await imageCompression(jpegFile, compressionOptions);
            processedFiles.push(compressedFile);
          }
        }

        const uploadPromises = processedFiles.map(file => 
          uploadToFirebaseStorageInFolder(file, 'properties/images')
        );

        const urls = await Promise.all(uploadPromises);
        
        // Проверяем, не превысим ли лимит после добавления новых фото
        const newImageCount = (property.images?.length || 0) + urls.length;
        if (newImageCount > maxImages) {
          showError(`Максимальное количество фотографий: ${maxImages}. Загружено: ${newImageCount}`);
          return;
        }
        
        // Обновляем локальное состояние
        setProperty(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls]
        }));
        
        showSuccess('Фотографии успешно загружены');
      } catch (error) {
        console.error("Ошибка загрузки фотографий:", error);
        showError('Ошибка загрузки фотографий');
      } finally {
        setUploadingImages(false);
      }
    };
    input.click();
  };

  // Функция для удаления фотографии
  const handleImageDelete = async (index) => {
    if (!canCreate()) {
      showError('Нет прав на создание объекта');
      return;
    }

    if (!property.images?.[index]) {
      showError("Фотография не найдена");
      return;
    }

    try {
      const imageUrl = property.images[index];
      
      // Удаляем файл из хранилища
      await deleteFileFromFirebaseStorage(imageUrl);
      
                // Обновляем локальное состояние
          const newImages = [...property.images];
          newImages.splice(index, 1);
          
          setProperty(prev => ({
            ...prev,
            images: newImages
          }));
          
          // Сбрасываем индекс фото если нужно
          if (newImages.length === 0) {
            setCurrentImageIndex(0);
          } else if (currentImageIndex >= newImages.length) {
            setCurrentImageIndex(newImages.length - 1);
          }
          
      showSuccess('Фотография удалена');
    } catch (error) {
      console.error("Ошибка при удалении фотографии:", error);
      showError('Ошибка при удалении фотографии');
    }
  };

  // Функция для загрузки нового файла
  const handleFileUpload = (fieldName) => {
    if (!canCreate()) {
      showError('Нет прав на создание объекта');
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
        } else if (fieldName === 'unbrandedPresentationFileURL') {
          folder = 'documents/unbranded-presentation';
        } else if (fieldName === 'roiFileURL') {
          folder = 'documents/roi';
        } else {
          folder = 'documents';
        }
        
        const url = await uploadToFirebaseStorageInFolder(file, folder);
        
        // Обновляем локальное состояние
        setProperty(prev => ({ ...prev, [fieldName]: url }));
        
        console.log(`Файл ${fieldName} успешно загружен в ${folder}:`, url);
      } catch (error) {
        console.error(`Ошибка загрузки файла ${fieldName}:`, error);
        showError('Ошибка загрузки файла');
      } finally {
        setUploading(prev => ({ ...prev, [fieldName]: false }));
      }
    };
    input.click();
  };

  // Функция для обновления существующего файла
  const handleFileUpdate = (fieldName) => {
    if (!canCreate()) {
      showError('Нет прав на создание объекта');
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
        } else if (fieldName === 'layoutFileURL') {
          folder = 'documents/layout';
        } else if (fieldName === 'dueDiligenceFileURL') {
          folder = 'documents/due-diligence';
        } else if (fieldName === 'pkkprFileURL') {
          folder = 'documents/pkkpr';
        } else if (fieldName === 'unbrandedPresentationFileURL') {
          folder = 'documents/unbranded-presentation';
        } else if (fieldName === 'roiFileURL') {
          folder = 'documents/roi';
        } else {
          folder = 'documents';
        }
        
        // Загружаем новый файл
        const url = await uploadToFirebaseStorageInFolder(file, folder);
        
        // Обновляем локальное состояние
        setProperty(prev => ({ ...prev, [fieldName]: url }));
        
        console.log(`Файл ${fieldName} успешно обновлен в ${folder}:`, url);
      } catch (error) {
        console.error(`Ошибка обновления файла ${fieldName}:`, error);
        showError('Ошибка обновления файла');
      } finally {
        setUploading(prev => ({ ...prev, [fieldName]: false }));
      }
    };
    input.click();
  };



  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "—";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };



  // Загрузка списка чатов по объекту (из iOS) для агента, создавшего объект






  // Добавляем списки значений для выпадающих списков
  const typeOptions = [
    { value: "Вилла", label: t.propertyDetail.typeOptions.villa },
    { value: "Апартаменты", label: t.propertyDetail.typeOptions.apartment },
    { value: "Дом", label: t.propertyDetail.typeOptions.house },
    { value: "Дюплекс", label: t.propertyDetail.typeOptions.duplex },
    { value: "Коммерческая недвижимость", label: t.propertyDetail.typeOptions.commercial },
    { value: "Апарт-вилла", label: t.propertyDetail.typeOptions.apartVilla },
    { value: "Таунхаус", label: t.propertyDetail.typeOptions.townhouse },
    { value: "Пентхаус", label: t.propertyDetail.typeOptions.penthouse },
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

  const floorsOptions = [
    "1",
    "2",
    "3"
  ];

  const districtOptions = [
    { value: "Амед", label: "Амед" },
    { value: "Берава", label: "Берава" },
    { value: "Будук", label: "Будук" },
    { value: "Джимбаран", label: "Джимбаран" },
    { value: "Кинтамани", label: "Кинтамани" },
    { value: "Кута", label: "Кута" },
    { value: "Кутух", label: "Кутух" },
    { value: "Ловина", label: "Ловина" },
    { value: "Нуану", label: "Нуану" },
    { value: "Нуса Дуа", label: "Нуса Дуа" },
    { value: "Пандава", label: "Пандава" },
    { value: "Переренан", label: "Переренан" },
    { value: "Санур", label: "Санур" },
    { value: "Семиньяк", label: "Семиньяк" },
    { value: "Убуд", label: "Убуд" },
    { value: "Улувату", label: "Улувату" },
    { value: "Умалас", label: "Умалас" },
    { value: "Унгасан", label: "Унгасан" },
    { value: "Чандидаса", label: "Чандидаса" },
    { value: "Чангу", label: "Чангу" },
    { value: "Чемаги", label: "Чемаги" },
    { value: "Гили Траванган", label: "Гили Траванган" },
    { value: "Ломбок", label: "Ломбок" }
  ];

  const buildingTypeOptions = [
    { value: "Новый комплекс", label: t.propertyDetail.buildingTypeOptions.newComplex },
    { value: "Реновация", label: t.propertyDetail.buildingTypeOptions.renovation },
    { value: "ИЖС", label: t.propertyDetail.buildingTypeOptions.individual },
    { value: "Отель", label: t.propertyDetail.buildingTypeOptions.hotel },
    { value: "Резорт", label: t.propertyDetail.buildingTypeOptions.resort }
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
    const commissionRaw = property.agentCommission;
    const price = property.price;
    const commission = parseCommission(commissionRaw);
    const commissionDisplay = commissionRaw ? String(commissionRaw).replace(/[%\s]/g, '') : '';
    if (!commission || isNaN(Number(commission)) || !price || isNaN(Number(price))) {
      return commissionDisplay ? commissionDisplay + '%' : '';
    }
    const sum = Math.round(Number(price) * Number(commission) / 100);
    return `${commissionDisplay}% ($${sum.toLocaleString()})`;
  };

  // Обновляем функцию рендеринга значения
  const renderEditableValue = (field, value, type, options) => {
    // Получаем значение из объекта property
    const fieldValue = property[field];
    
    // Определяем, есть ли ошибка валидации для поля
    const hasError = requiredFieldErrors[field];
    
    if (field === 'status') {
      return (
        <select
          value={fieldValue || ''}
          onChange={(e) => handleValueChange(field, e.target.value)}
          className={`text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border rounded px-2 py-1 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        >
          {options.map(opt => (
            <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
        </select>
      );
    } else if (field === 'ownershipForm') {
        return (
          <div className="space-y-2">
            <select
            value={fieldValue || ''}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className={`text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border rounded px-2 py-1 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            >
              {options.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
              ))}
            </select>
          {fieldValue === 'Leashold' && (
              <input
                type="text"
              value={property.leaseYears || ''}
                onChange={(e) => handleValueChange('leaseYears', e.target.value)}
                placeholder="Например: 30, 30+20"
                className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
              />
            )}
          </div>
        );
      } else if (options) {
        // Список полей, для которых не нужно добавлять опцию "Не выбрано"
        const fieldsWithoutNotSelected = ['bedrooms', 'bathrooms', 'floors', 'district', 'buildingType', 'pool', 'ownershipForm'];
        
        return (
          <select
          value={fieldValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className={`text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border rounded px-2 py-1 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
          >
            {!fieldsWithoutNotSelected.includes(field) && (
              <option value="">{t.propertyDetail.notSelected}</option>
            )}
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
            value={fieldValue || ''}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className={`text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border rounded px-2 py-1 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={t.propertyDetail.areaPlaceholder}
            />
          );
        }
        // Специальная обработка для поля ROI
        if (field === 'manualRoi') {
          return (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={fieldValue || ''}
                onChange={(e) => handleValueChange(field, e.target.value)}
                className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line flex-1 border border-gray-300 rounded px-2 py-1"
                placeholder={t.propertyDetail.expectedRoiPlaceholder}
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          );
        }
        // Специальная обработка для поля площади земли
        if (field === 'landArea') {
          return (
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={fieldValue || ''}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
              placeholder={t.propertyDetail.landAreaPlaceholder}
            />
          );
        }
        // Специальная обработка для поля ожидаемой стоимости
        if (field === 'expectedCost') {
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
            <div className="flex flex-col space-y-1">
              <input
                type="number"
                step="1"
                min="0"
                value={fieldValue || ''}
                onChange={(e) => handleValueChange(field, e.target.value)}
                className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
                placeholder={t.propertyDetail.expectedCostPlaceholder}
              />
              {fieldValue && (
                <span className="text-xs text-gray-500">
                  {formatPrice(fieldValue)}
                </span>
              )}
            </div>
          );
        }
        if (field === 'agentCommission') {
        const commissionRaw = fieldValue;
        const price = property.price;
          const commission = parseCommission(commissionRaw);
          const commissionDisplay = commissionRaw ? String(commissionRaw).replace(/[%\s]/g, '') : '';
          let sum = '';
          if (commission && !isNaN(Number(commission)) && price && !isNaN(Number(price))) {
            sum = `$${Math.round(Number(price) * Number(commission) / 100).toLocaleString()}`;
          }
        const options = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
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
      // Специальная обработка для поля координат
      if (field === 'coordinates') {
        return (
          <input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className={`text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border rounded px-2 py-1 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="-8.487721438, 115.260992703"
          />
        );
      }
      
      // Специальная обработка для поля планировки
      if (field === 'layoutFileURL') {
        return (
          <div className="flex gap-2">
            {fieldValue ? (
              <>
                <button 
                  onClick={() => window.open(fieldValue, '_blank')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {t.propertyDetail.viewButton}
                </button>
                {canCreate() && (
                  <button 
                    onClick={() => handleFileUpdate('layoutFileURL')}
                    disabled={uploading.layoutFileURL}
                    className={`px-3 py-1 text-xs rounded ${
                      uploading.layoutFileURL 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    } text-white`}
                  >
                    {uploading.layoutFileURL ? t.propertyDetail.uploading : t.propertyDetail.updateButton}
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="text-xs text-gray-500">{t.propertyDetail.fileNotUploaded}</span>
                {canCreate() && (
                  <button 
                    onClick={() => handleFileUpload('layoutFileURL')}
                    disabled={uploading.layoutFileURL}
                    className={`px-3 py-1 text-xs rounded ${
                      uploading.layoutFileURL 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {uploading.layoutFileURL ? t.propertyDetail.uploading : t.propertyDetail.uploadButton}
                  </button>
                )}
              </>
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
              value={fieldValue || ''}
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
        
        // Специальная обработка для поля количества юнитов
        if (field === 'unitsCount') {
          return (
            <input
              type="number"
              min="1"
            value={fieldValue || ''}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Введите количество юнитов"
            />
          );
        }
        
        // Специальная обработка для поля даты окончания аренды земли
        if (field === 'landLeaseEndDate') {
          return (
            <input
              type="date"
            value={fieldValue || ''}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            />
          );
        }
        
        return (
          <input
            type={type || "text"}
          value={fieldValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
          />
        );
      }
  };

  // Проверяем права доступа при монтировании компонента
  useEffect(() => {
    if (!currentUser) {
      // Перенаправляем на главную публичную страницу, если не авторизован
      window.location.href = '/';
              return;
    }
    
    if (!canCreate()) {
      // Перенаправляем на главную публичную страницу, если нет прав
      window.location.href = '/';
    }
  }, [currentUser, canCreate]);

  // Проверяем права доступа
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Перенаправление на страницу авторизации...
      </div>
    );
  }

  if (!canCreate()) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Нет прав на создание объекта
      </div>
    );
  }

  // Определяем, показывать ли поле "Количество юнитов" вместо "Спальни"
  const shouldShowUnitsCount = property.buildingType === "Отель" || property.buildingType === "Резорт";
  
  const attributesBase = [
    {
      label: t.propertyDetail.propertyName,
      value: safeDisplay(property.propertyName),
      field: "propertyName",
      icon: FileText,
      type: "text"
    },
    {
      label: t.propertyDetail.developer,
      value: safeDisplay(property.developer),
      field: "developer",
      icon: Building2,
      type: "text"
    },
    {
      label: t.propertyDetail.area,
      value: property.area ? translateAreaUnit(formatArea(property.area), language) : "—",
      field: "area",
      icon: Ruler,
      type: "number"
    },
    {
              label: shouldShowUnitsCount ? t.propertyDetail.unitsCount : (property.bedrooms === 0 ? t.propertyDetail.studio : t.propertyDetail.bedroomsLabel),
      value: shouldShowUnitsCount ? safeDisplay(property.unitsCount) : (property.bedrooms === 0 ? t.propertyDetail.studio : safeDisplay(property.bedrooms)),
      field: shouldShowUnitsCount ? "unitsCount" : "bedrooms",
      icon: Bed,
      type: shouldShowUnitsCount ? "number" : "select",
      options: shouldShowUnitsCount ? undefined : bedroomsOptions
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
      value: safeDisplay(property.floors),
      field: "floors",
      icon: Layers,
      type: "select",
      options: floorsOptions
    },
    {
      label: t.complexDetail?.coordinatesLabel || 'Координаты',
      value: safeDisplay(property.coordinates),
      field: "coordinates",
      icon: MapPin,
      type: "text"
    },

    {
      label: t.propertyDetail.district,
      value: translateDistrict(safeDisplay(property.district), language),
      field: "district",
      icon: MapPin,
      type: "select",
      options: districtOptions
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
              label: t.propertyDetail.statusLabel,
      value: translateConstructionStatus(safeDisplay(property.status), language),
      field: "status",
      icon: Hammer,
      type: "select",
      options: statusOptions
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
              label: t.propertyDetail.ownershipFormLabel,
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
    {
      label: t.propertyDetail.totalArea || 'Общая площадь',
      value: property.totalArea ? translateAreaUnit(formatArea(property.totalArea), language) : "—",
      field: "totalArea",
      icon: Ruler,
      type: "number"
    },
    {
      label: t.propertyDetail.landArea,
      value: property.landArea ? translateAreaUnit(formatArea(property.landArea), language) : "—",
      field: "landArea",
      icon: Ruler,
      type: "number"
    },
    {
      label: t.propertyDetail.expectedCost,
      value: property.expectedCost ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property.expectedCost) : "—",
      field: "expectedCost",
      icon: Star,
      type: "number"
    },
    {
      label: t.propertyDetail.managementCompany,
      value: safeDisplay(property.managementCompany),
      field: "managementCompany",
      icon: Building2,
      type: "text"
    },
    {
      label: t.propertyDetail.agentCommission,
      value: getAgentCommissionDisplay(),
      field: "agentCommission",
      icon: Star,
      type: "text"
    },
  ];

  const attributes = [
    ...attributesBase,
    // Expected ROI field (editable)
    {
      label: t.propertyDetail.expectedRoi,
      value: property.manualRoi ? `${Number(property.manualRoi).toFixed(2)}%` : "—",
      field: "manualRoi",
      icon: Star,
      type: "number"
    },
    // Layout file (last in characteristics)
    {
      label: t.propertyDetail.layout,
      value: property.layoutFileURL ? 'Загружено' : 'Не загружено',
      field: "layoutFileURL",
      icon: FileText,
      type: "file"
    },
  ];



  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Кнопка "Назад" */}
      <div className="mb-4">
        <button
          onClick={() => {
            const from = location.state && location.state.from;
            if (from && typeof from === 'string' && from.startsWith('/public/property/')) {
              navigate(from);
              return;
            }
            const qs = location.search || '';
            const match = qs.match(/(?:[?&])propertyId=([^&]+)/);
            if (match && match[1]) {
              try {
                const pid = decodeURIComponent(match[1]);
                navigate(`/public/property/${pid}`);
                return;
              } catch (_) {}
            }
            navigate('/');
          }}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.propertyDetail?.backButton || 'Назад'}
        </button>
      </div>
      {/* Кнопка добавления фотографий */}
      {canCreate() && (
        <div className={`mb-4 ${isMobile ? 'flex flex-col-reverse gap-2' : 'flex items-center justify-between gap-2'}`}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
            <button
              onClick={handleImageUpload}
              className={`flex items-center gap-2 px-4 py-2 md:py-0 md:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 ${isMobile ? 'w-full h-12 justify-center' : ''}`}
              disabled={uploadingImages || (property.images?.length || 0) >= 10}
            >
              {uploadingImages ? (
                t.propertyDetail.uploading
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  {t.propertyDetail.addPhotoButtonSimple}
                </>
              )}
            </button>
            <div className="text-sm text-gray-600 md:ml-2 md:whitespace-nowrap md:leading-none">
              {t.propertyDetail.photoCounter
                .replace('{current}', (property.images?.length || 0))
                .replace('{total}', '10')}
            </div>
          </div>
            <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'}`}>
              <button
              onClick={handleCreate}
              disabled={isSubmitting || !areRequiredFieldsFilled()}
              className={`px-4 py-2 md:py-0 md:h-12 rounded-lg transition-colors ${isMobile ? 'w-full h-12' : ''} ${
                isSubmitting || !areRequiredFieldsFilled()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? t.propertyDetail.creatingText : t.propertyDetail.createObjectButton}
              </button>
            </div>
        </div>
      )}

      {/* Управление порядком фотографий (DnD) */}
      {property.images?.length > 1 && (
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">{t.propertyDetail?.reorderPhotosHint || 'Перетащите фото, чтобы изменить порядок'}</div>
          <DndProvider backend={HTML5Backend}>
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'} gap-3`}>
              {property.images.map((url, idx) => (
                <DraggablePreviewItem
                  key={`${url}-${idx}`}
                  id={`${idx}`}
                  index={idx}
                  url={url}
                  onRemove={() => handleImageDelete(idx)}
                  moveImage={(dragIndex, hoverIndex) => {
                    if (dragIndex === hoverIndex) return;
                    setProperty(prev => {
                      const newImages = [...(prev?.images || [])];
                      const [moved] = newImages.splice(dragIndex, 1);
                      newImages.splice(hoverIndex, 0, moved);
                      return { ...prev, images: newImages };
                    });
                  }}
                />
              ))}
            </div>
          </DndProvider>
          <div className="mt-3 text-xs text-gray-500">{t.propertyDetail?.reorderPhotosSaveHint || 'Порядок сохранится при создании объекта.'}</div>
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
              <img src={url} alt={`${t.propertyDetail.photo} ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageDelete(idx);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                >
                  <X className="h-4 w-4" />
                </button>
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
              src={property.images[currentImageIndex]}
              alt={`Фото ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Кнопка удаления */}
            <button
              onClick={() => handleImageDelete(currentImageIndex)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Навигация по фото */}
            {property.images.length > 1 && (
              <>
                {/* Стрелка влево */}
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
                  >
                    ←
                  </button>
                )}
                
                {/* Стрелка вправо */}
                {currentImageIndex < property.images.length - 1 && (
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
                  >
                    →
                  </button>
                )}
                
                {/* Счетчик фото */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
                  {currentImageIndex + 1} / {property.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex w-full h-72 rounded-xl overflow-hidden mb-4 bg-gray-200 items-center justify-center text-gray-400">
          <Building2 className="w-12 h-12" />
        </div>
      )}

      {/* Цена */}
      <div className="mb-4">
        <div className="text-4xl font-semibold text-gray-600">
            <input
              type="number"
            value={property.price || ''}
              onChange={(e) => handleValueChange('price', e.target.value)}
              className={`w-48 px-2 py-1 border rounded text-4xl ${requiredFieldErrors.price ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={t.propertyDetail.pricePlaceholder}
            />
        </div>
        {requiredFieldErrors.price && (
          <div className="text-red-500 text-sm mt-1">{requiredFieldErrors.price}</div>
        )}
      </div>

      {/* Тип */}
      <div className="text-2xl font-bold mb-4 text-gray-800">
          <select
          value={property.type || ''}
            onChange={(e) => handleValueChange('type', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-2xl"
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
      </div>





      {/* Сетка характеристик */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {attributes.map(({ label, value, icon: Icon, field, type, options }) => (
            <div key={field} className={`flex items-center gap-3 ${isMobile ? 'w-full' : 'w-full'}`}>
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className={`${isMobile ? 'w-full' : 'w-full'}`}>
              <div className="text-xs text-gray-500 leading-none mb-1 flex items-center gap-1">
                {label}
                {field === 'area' && (
                  <AdaptiveTooltip content={t.propertyDetail.areaTooltip}>
                    <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
                  </AdaptiveTooltip>
                )}
                {field === 'totalArea' && (
                  <AdaptiveTooltip content={t.propertyDetail.totalAreaTooltip}>
                    <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
                  </AdaptiveTooltip>
                )}
                {field === 'landArea' && (
                  <AdaptiveTooltip content={t.propertyDetail.landAreaTooltip}>
                    <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
                  </AdaptiveTooltip>
                )}
                {field === 'expectedCost' && (
                  <AdaptiveTooltip content={t.propertyDetail.expectedCostTooltip}>
                    <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
                  </AdaptiveTooltip>
                )}
                {field === 'manualRoi' && (
                  <AdaptiveTooltip content={t.propertyDetail.expectedRoiTooltip}>
                    <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
                  </AdaptiveTooltip>
                )}
                {['price', 'area', 'coordinates', 'completionDate'].includes(field) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </div>
              {renderEditableValue(field, value, type, options)}
              {requiredFieldErrors[field] && (
                <div className="text-red-500 text-xs mt-1">{requiredFieldErrors[field]}</div>
              )}
            </div>
          </div>
          )
        )}
      </div>

      {/* Дополнительные опции */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.additionalOptions}</h3>
          
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smartHome"
              checked={property.smartHome}
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
              checked={property.jacuzzi}
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
              checked={property.terrace}
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
              checked={property.rooftop}
                onChange={(e) => handleValueChange('rooftop', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="rooftop" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.rooftop}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="balcony"
              checked={property.balcony}
                onChange={(e) => handleValueChange('balcony', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="balcony" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.balcony}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bbq"
              checked={property.bbq}
                onChange={(e) => handleValueChange('bbq', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="bbq" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.bbq}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="furniture"
              checked={property.furniture}
                onChange={(e) => handleValueChange('furniture', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="furniture" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.furniture}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="washingMachine"
              checked={property.washingMachine}
                onChange={(e) => handleValueChange('washingMachine', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="washingMachine" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.washingMachine}
              </label>
            </div>

            {/* Distance to beach (km) */}
            <div className={`${isMobile ? 'flex-col' : 'flex-row'} flex items-start space-x-2 ${isMobile ? 'space-y-2' : ''}`}>
              <label htmlFor="distanceToBeach" className={`text-sm font-medium text-gray-700 ${isMobile ? 'w-full' : 'w-40'}`}>
                {t.propertyDetail.distanceToBeach}
              </label>
              <div className={`${isMobile ? 'w-full' : 'flex-1'} flex items-center space-x-2`}>
              <input
                type="number"
                step="0.1"
                id="distanceToBeach"
                  value={property.distanceToBeach || ''}
                onChange={(e) => handleValueChange('distanceToBeach', e.target.value)}
                  className={`${isMobile ? 'w-full' : 'flex-1'} text-sm font-medium text-gray-900 leading-none whitespace-pre-line border border-gray-300 rounded px-2 py-1`}
                placeholder={`0 ${t.propertyDetail.kmUnit}`}
              />
              <span className="text-sm text-gray-600">{t.propertyDetail.kmUnit}</span>
              </div>
            </div>

            {/* Distance to center (km) */}
            <div className={`${isMobile ? 'flex-col' : 'flex-row'} flex items-start space-x-2 ${isMobile ? 'space-y-2' : ''}`}>
              <label htmlFor="distanceToCenter" className={`text-sm font-medium text-gray-700 ${isMobile ? 'w-full' : 'w-40'}`}>
                {t.propertyDetail.distanceToCenter}
              </label>
              <div className={`${isMobile ? 'w-full' : 'flex-1'} flex items-center space-x-2`}>
              <input
                type="number"
                step="0.1"
                id="distanceToCenter"
                  value={property.distanceToCenter || ''}
                onChange={(e) => handleValueChange('distanceToCenter', e.target.value)}
                  className={`${isMobile ? 'w-full' : 'flex-1'} text-sm font-medium text-gray-900 leading-none whitespace-pre-line border border-gray-300 rounded px-2 py-1`}
                placeholder={`0 ${t.propertyDetail.kmUnit}`}
              />
              <span className="text-sm text-gray-600">{t.propertyDetail.kmUnit}</span>
            </div>
          </div>

        </div>
                </div>

        {/* Описание объекта */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.description || 'Описание объекта'}</h3>
          <textarea
            value={property.description || ''}
            onChange={(e) => handleValueChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 resize-none"
            rows="4"
                          placeholder={t.propertyDetail.descriptionPlaceholder}
          />
          </div>
          
    </div>
  );
}

export default PropertyCreate; 