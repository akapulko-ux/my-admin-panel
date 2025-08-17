import React, { useEffect, useState, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc, collection, where, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
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
  Square,
  Flame,
  Sofa,
  Waves,
} from "lucide-react";
import { showError, showSuccess } from '../utils/notifications';
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from '../utils/firebaseStorage';
import PropertyRoiCalculator from "../components/PropertyRoiCalculator";
import { Badge } from "../components/ui/badge";
import { AdaptiveTooltip } from "../components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
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
import toast from 'react-hot-toast';

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
  
  // Функция для локализации названия чата
  const localizeChatName = (chatName) => {
    if (!chatName) return 'Чат';
    
    // Заменяем "Написать агенту от" на локализованный текст
    let localized = chatName.replace('Написать агенту от', t.propertyDetail.applicationFromAgent);
    
    // Локализуем типы недвижимости (передаем русские названия)
    const propertyTypes = {
      'Вилла': translatePropertyType('Вилла', language),
      'Апартаменты': translatePropertyType('Апартаменты', language),
      'Дом': translatePropertyType('Дом', language),
      'Дюплекс': translatePropertyType('Дюплекс', language),
      'Коммерческая недвижимость': translatePropertyType('Коммерческая недвижимость', language),
      'Апарт-вилла': translatePropertyType('Апарт-вилла', language),
      'Таунхаус': translatePropertyType('Таунхаус', language),
      'Земельный участок': translatePropertyType('Земельный участок', language)
    };
    
    // Заменяем русские названия типов на локализованные
    Object.entries(propertyTypes).forEach(([russian, localizedType]) => {
      localized = localized.replace(new RegExp(russian, 'g'), localizedType);
    });
    
    return localized;
  };
  
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
  const [roiPercent, setRoiPercent] = useState(null);

  // Чаты по объекту (созданные в iOS)
  const [agentChats, setAgentChats] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatCache, setChatCache] = useState({}); // Кеш для сообщений чатов
  const [clientLeadsCache, setClientLeadsCache] = useState(null); // Кеш для заявок клиентов
  const messagesEndRef = useRef(null); // Ref для автоматической прокрутки к последнему сообщению
  const [isClientLeadsExpanded, setIsClientLeadsExpanded] = useState(false); // Состояние свернутости секции заявок клиентов
  const [isAgentChatsExpanded, setIsAgentChatsExpanded] = useState(false); // Состояние свернутости секции чатов

  // Заявки клиентов по объекту
  const [clientLeads, setClientLeads] = useState([]);
  const [clientLeadsLoading, setClientLeadsLoading] = useState(false);

  // Список застройщиков для выбора
  const [developersList, setDevelopersList] = useState([]);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Загрузка списка застройщиков
  useEffect(() => {
    async function loadDevelopers() {
      try {
        const snap = await getDocs(collection(db, 'developers'));
        const names = snap.docs
          .map(d => (d.data()?.name || '').trim())
          .filter(Boolean);
        const unique = Array.from(new Set(names)).sort();
        setDevelopersList(unique);
      } catch (e) {
        console.error('Ошибка загрузки списка застройщиков:', e);
      }
    }
    loadDevelopers();
  }, []);

  // Очистка кеша чатов и заявок клиентов при смене объекта
  useEffect(() => {
    setChatCache({});
    setClientLeadsCache(null);
    setChatMessages([]);
    setClientLeads([]);
    setSelectedChat(null);
    setIsChatOpen(false);
    setIsClientLeadsExpanded(false);
    setIsAgentChatsExpanded(false);
  }, [id]);

  // Функция для автоматической прокрутки к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Автоматическая прокрутка при изменении сообщений
  useEffect(() => {
    if (chatMessages.length > 0 && isChatOpen) {
      // Небольшая задержка для гарантии рендеринга DOM
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, isChatOpen]);

  // Функция для проверки, может ли пользователь редактировать объект
  const canEdit = () => {
    console.log('canEdit check:', {
      role,
      isAdmin: role === 'admin',
      isDeveloper: role === 'застройщик',
      propertyDeveloper: property?.developer,
      userDeveloperName: property?.userDeveloperName,
      isCreator: currentUser && property?.createdBy === currentUser.uid
    });
    
    if (role === 'admin' || role === 'moderator') return true;
    if (['застройщик', 'премиум застройщик'].includes(role)) return true;
    // Создатель объекта может редактировать свой объект
    if (currentUser && property?.createdBy === currentUser.uid) return true;
    return false;
  };

  // Функция для определения статуса бейджа "Проверено сервисом"
  const getServiceVerificationStatus = () => {
    if (role === 'премиум застройщик') {
      // Для премиум застройщиков проверяем статус approved из коллекции developers
      return {
        isActive: property?.isDeveloperApproved === true,
        color: property?.isDeveloperApproved === true 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-gray-500 text-white border-gray-600',
        icon: property?.isDeveloperApproved === true ? '✓' : '○',
        tooltip: property?.isDeveloperApproved === true ? null : 'Застройщик не прошел проверку сервиса'
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

  // Функция для переключения статуса листинга
  const toggleListingStatus = async () => {
    try {
      const newStatus = !property.isHidden;
      await updateDoc(doc(db, "properties", id), {
        isHidden: newStatus,
        updatedAt: Timestamp.now()
      });

      // Обновляем локальное состояние
      setProperty(prev => ({
        ...prev,
        isHidden: newStatus
      }));

      toast.success(newStatus ? 'Объект убран из листинга' : 'Объект возвращен в листинг');
    } catch (error) {
      console.error('Ошибка при изменении статуса листинга:', error);
      toast.error('Ошибка при изменении статуса листинга');
    }
  };

  // Функция для изменения статуса модерации
  const toggleModerationStatus = async () => {
    try {
      const newModerationStatus = !property.moderation;
      await updateDoc(doc(db, "properties", id), {
        moderation: newModerationStatus,
        updatedAt: Timestamp.now()
      });

      // Обновляем локальное состояние
      setProperty(prev => ({
        ...prev,
        moderation: newModerationStatus
      }));

      toast.success(newModerationStatus ? 'Объект возвращен на модерацию' : 'Объект одобрен');
    } catch (error) {
      console.error('Ошибка при изменении статуса модерации:', error);
      toast.error('Ошибка при изменении статуса модерации');
    }
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
    
    // Специальная валидация для поля "Статус строительства" для создателей объектов
    if (field === 'status' && 
        currentUser && property?.createdBy === currentUser.uid && 
        role !== 'admin' && role !== 'moderator') {
      // Для создателей объектов не разрешаем пустое значение
      if (!value || value === '') {
        processedValue = 'От собственника';
      }
    }
    
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
      processedValue = value.replace(/[^\d]/g, '');
      // Разрешаем пустые значения для возможности полного удаления
      processedValue = processedValue === '' ? '' : parseInt(processedValue);
    }
    
    setEditedValues(prev => {
      const newValues = { ...prev, [field]: processedValue };
      
      // Для создателей объектов автоматически устанавливаем статус "От собственника"
      if (field === 'status' && 
          currentUser && property?.createdBy === currentUser.uid && 
          role !== 'admin' && role !== 'moderator' && 
          !prev.hasOwnProperty('status')) {
        newValues.status = 'От собственника';
      }
      
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
      const numericFields = ['price', 'bedrooms', 'bathrooms', 'leaseYears', 'unitsCount'];
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
      
      // Для создателей объектов автоматически устанавливаем статус "От собственника"
      if (currentUser && property?.createdBy === currentUser.uid && 
          role !== 'admin' && role !== 'moderator') {
        // Если статус не был изменен или пустой, устанавливаем "От собственника"
        if (!processedValues.hasOwnProperty('status') || 
            !processedValues.status || 
            processedValues.status === '') {
          processedValues.status = 'От собственника';
        }
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
    // Для создателей объектов автоматически устанавливаем статус "От собственника" при отмене
    if (currentUser && property?.createdBy === currentUser.uid && 
        role !== 'admin' && role !== 'moderator') {
      setEditedValues({ status: 'От собственника' });
      setHasChanges(true); // Устанавливаем флаг изменений, так как статус изменился
    } else {
      setEditedValues({});
      setHasChanges(false);
    }
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

  // Функция для принудительной конвертации в JPEG (аналогично AgentPropertyCreate.js)
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
          const jpegFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg'
          });
          resolve(jpegFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
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
        } else if (fieldName === 'unbrandedPresentationFileURL') {
          folder = 'documents/unbranded-presentation';
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
        } else if (fieldName === 'unbrandedPresentationFileURL') {
          folder = 'documents/unbranded-presentation';
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
  const nonEditableFields = ['pricePerSqm', 'roi'];

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

  // Загрузка списка чатов по объекту (из iOS) для агента, создавшего объект
  useEffect(() => {
    async function loadAgentChats() {
      try {
        if (!property?.addedByAgent || !property?.createdBy || !id) return;
        const chatsCol = collection(db, 'agents', property.createdBy, 'chats');
        const q = query(chatsCol, where('propertyId', '==', id));
        const snap = await getDocs(q);
        const chats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Сортировка: по timestamp убыв.
        chats.sort((a, b) => {
          const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
          const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
          return tB - tA;
        });
        setAgentChats(chats);
      } catch (e) {
        console.error('Failed to load agent chats', e);
      }
    }
    loadAgentChats();
  }, [property, id]);

  // Загрузка заявок клиентов по объекту
  useEffect(() => {
    async function loadClientLeads() {
      try {
        if (!property?.addedByAgent || !id) return;
        
        // Проверяем кеш
        if (clientLeadsCache) {
          setClientLeads(clientLeadsCache);
          setClientLeadsLoading(false);
          return;
        }
        
        setClientLeadsLoading(true);
        
        // Загружаем заявки из коллекции clientLeads
        const leadsQuery = query(
          collection(db, 'clientLeads'),
          where('propertyId', '==', id),
          orderBy('createdAt', 'desc')
        );
        
        const leadsSnap = await getDocs(leadsQuery);
        const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Сохраняем в кеш и устанавливаем заявки
        setClientLeadsCache(leads);
        setClientLeads(leads);
      } catch (e) {
        console.error('Failed to load client leads', e);
      } finally {
        setClientLeadsLoading(false);
      }
    }
    loadClientLeads();
  }, [property, id, clientLeadsCache]);

  const openChatViewer = async (chat) => {
    try {
      setSelectedChat(chat);
      setIsChatOpen(true);
      setNewMessage(''); // Очищаем поле ввода при открытии чата
      
      // Проверяем кеш
      const cacheKey = `${chat.id}`;
      if (chatCache[cacheKey]) {
        setChatMessages(chatCache[cacheKey]);
        setIsChatLoading(false);
        return;
      }
      
      // Если в кеше нет, загружаем сообщения
      setIsChatLoading(true);
      const agentMsgsQ = query(collection(db, 'agents', property.createdBy, 'chats', chat.id, 'messages'), orderBy('timestamp', 'asc'));
      const agentMsgsSnap = await getDocs(agentMsgsQ);
      const agentMsgs = agentMsgsSnap.docs.map(d => ({ id: `a:${d.id}`, source: 'agent', ...d.data() }));
      let allMsgs = agentMsgs;
      if (chat.clientUserId) {
        try {
          const clientMsgsQ = query(collection(db, 'agents', chat.clientUserId, 'chats', chat.id, 'messages'), orderBy('timestamp', 'asc'));
          const clientMsgsSnap = await getDocs(clientMsgsQ);
          const clientMsgs = clientMsgsSnap.docs.map(d => ({ id: `c:${d.id}`, source: 'client', ...d.data() }));
          allMsgs = [...agentMsgs, ...clientMsgs];
        } catch (e) {
          console.warn('Failed to load client side messages', e);
        }
      }
      // Дедупликация одинаковых сообщений, дублированных в коллекциях агента и клиента
      const toSecond = (ts) => {
        try {
          return ts?.toDate ? Math.floor(ts.toDate().getTime() / 1000) : 0;
        } catch { return 0; }
      };
      const buildKey = (m) => {
        const senderId = m.sender_id || m.senderId || '';
        const role = m.sender_role || '';
        const text = m.text || '';
        const prop = m.propertyId || '';
        const sec = toSecond(m.timestamp);
        return `${senderId}__${role}__${text}__${prop}__${sec}`;
      };
      const uniqueMap = new Map();
      for (const m of allMsgs) {
        const key = buildKey(m);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, m);
        } else {
          const existing = uniqueMap.get(key);
          // Предпочитаем копию из коллекции агента
          const isExistingAgent = existing?.source === 'agent' || String(existing?.id || '').startsWith('a:');
          const isCurrentAgent = m?.source === 'agent' || String(m?.id || '').startsWith('a:');
          if (!isExistingAgent && isCurrentAgent) {
            uniqueMap.set(key, m);
          }
        }
      }
      allMsgs = Array.from(uniqueMap.values());
      allMsgs.sort((m1, m2) => {
        const t1 = m1.timestamp?.toDate ? m1.timestamp.toDate().getTime() : 0;
        const t2 = m2.timestamp?.toDate ? m2.timestamp.toDate().getTime() : 0;
        return t1 - t2;
      });
      
      // Сохраняем в кеш и устанавливаем сообщения
      setChatCache(prev => ({
        ...prev,
        [cacheKey]: allMsgs
      }));
      setChatMessages(allMsgs);
    } catch (e) {
      console.error('Failed to load chat messages', e);
      setChatMessages([]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Функция для отправки нового сообщения в чат
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !property?.createdBy) return;
    
    try {
      setIsSendingMessage(true);
      
      const messageData = {
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        sender_id: currentUser?.uid || 'admin',
        sender_role: role || 'admin',
        sender_name: currentUser?.displayName || currentUser?.email || 'Admin',
        propertyId: id
      };

      // Сохраняем сообщение в коллекцию агента
      const agentChatRef = doc(db, 'agents', property.createdBy, 'chats', selectedChat.id);
      const agentMessagesRef = collection(agentChatRef, 'messages');
      await addDoc(agentMessagesRef, messageData);

      // Если есть clientUserId, сохраняем сообщение и в коллекцию клиента
      if (selectedChat.clientUserId) {
        try {
          const clientChatRef = doc(db, 'agents', selectedChat.clientUserId, 'chats', selectedChat.id);
          const clientMessagesRef = collection(clientChatRef, 'messages');
          await addDoc(clientMessagesRef, messageData);
        } catch (e) {
          console.warn('Failed to save message to client collection', e);
        }
      }

      // Очищаем поле ввода
      setNewMessage('');
      
      // Создаем новое сообщение для добавления в кеш
      const newMessageData = {
        id: `temp_${Date.now()}`,
        text: messageData.text,
        timestamp: messageData.timestamp,
        sender_id: messageData.sender_id,
        sender_role: messageData.sender_role,
        sender_name: messageData.sender_name,
        propertyId: messageData.propertyId,
        source: 'agent'
      };
      
      // Обновляем кеш и локальное состояние
      const cacheKey = `${selectedChat.id}`;
      const updatedMessages = [...chatMessages, newMessageData];
      
      setChatCache(prev => ({
        ...prev,
        [cacheKey]: updatedMessages
      }));
      setChatMessages(updatedMessages);
      
      toast.success('Сообщение отправлено');
    } catch (e) {
      console.error('Failed to send message', e);
      toast.error('Ошибка при отправке сообщения');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Функция для принудительного обновления кеша чата
  const refreshChatCache = async (chatId) => {
    if (!chatId || !property?.createdBy) return;
    
    try {
      const agentMsgsQ = query(collection(db, 'agents', property.createdBy, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
      const agentMsgsSnap = await getDocs(agentMsgsQ);
      const agentMsgs = agentMsgsSnap.docs.map(d => ({ id: `a:${d.id}`, source: 'agent', ...d.data() }));
      
      // Получаем информацию о чате для проверки clientUserId
      const chatDoc = await getDoc(doc(db, 'agents', property.createdBy, 'chats', chatId));
      const chatData = chatDoc.data();
      
      let allMsgs = agentMsgs;
      if (chatData?.clientUserId) {
        try {
          const clientMsgsQ = query(collection(db, 'agents', chatData.clientUserId, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
          const clientMsgsSnap = await getDocs(clientMsgsQ);
          const clientMsgs = clientMsgsSnap.docs.map(d => ({ id: `c:${d.id}`, source: 'client', ...d.data() }));
          allMsgs = [...agentMsgs, ...clientMsgs];
        } catch (e) {
          console.warn('Failed to load client side messages', e);
        }
      }
      
      // Дедупликация и сортировка
      const toSecond = (ts) => {
        try {
          return ts?.toDate ? Math.floor(ts.toDate().getTime() / 1000) : 0;
        } catch { return 0; }
      };
      const buildKey = (m) => {
        const senderId = m.sender_id || m.senderId || '';
        const role = m.sender_role || '';
        const text = m.text || '';
        const prop = m.propertyId || '';
        const sec = toSecond(m.timestamp);
        return `${senderId}__${role}__${text}__${prop}__${sec}`;
      };
      const uniqueMap = new Map();
      for (const m of allMsgs) {
        const key = buildKey(m);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, m);
        } else {
          const existing = uniqueMap.get(key);
          const isExistingAgent = existing?.source === 'agent' || String(existing?.id || '').startsWith('a:');
          const isCurrentAgent = m?.source === 'agent' || String(m?.id || '').startsWith('a:');
          if (!isExistingAgent && isCurrentAgent) {
            uniqueMap.set(key, m);
          }
        }
      }
      allMsgs = Array.from(uniqueMap.values());
      allMsgs.sort((m1, m2) => {
        const t1 = m1.timestamp?.toDate ? m1.timestamp.toDate().getTime() : 0;
        const t2 = m2.timestamp?.toDate ? m2.timestamp.toDate().getTime() : 0;
        return t1 - t2;
      });
      
      // Обновляем кеш
      const cacheKey = `${chatId}`;
      setChatCache(prev => ({
        ...prev,
        [cacheKey]: allMsgs
      }));
      
      // Если чат открыт, обновляем и локальное состояние
      if (selectedChat?.id === chatId) {
        setChatMessages(allMsgs);
      }
    } catch (e) {
      console.error('Failed to refresh chat cache', e);
    }
  };

  // Функция для принудительного обновления кеша заявок клиентов
  const refreshClientLeadsCache = async () => {
    if (!property?.addedByAgent || !id) return;
    
    try {
      setClientLeadsLoading(true);
      
      const leadsQuery = query(
        collection(db, 'clientLeads'),
        where('propertyId', '==', id),
        orderBy('createdAt', 'desc')
      );
      
      const leadsSnap = await getDocs(leadsQuery);
      const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Обновляем кеш и локальное состояние
      setClientLeadsCache(leads);
      setClientLeads(leads);
      
      toast.success('Заявки клиентов обновлены');
    } catch (e) {
      console.error('Failed to refresh client leads cache', e);
      toast.error('Ошибка при обновлении заявок клиентов');
    } finally {
      setClientLeadsLoading(false);
    }
  };

  // Добавляем списки значений для выпадающих списков
  const typeOptions = [
    { value: "Вилла", label: t.propertyDetail.typeOptions.villa },
    { value: "Апартаменты", label: t.propertyDetail.typeOptions.apartment },
    { value: "Дом", label: t.propertyDetail.typeOptions.house },
    { value: "Дюплекс", label: t.propertyDetail.typeOptions.duplex },
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
    { value: "ИЖС", label: t.propertyDetail.buildingTypeOptions.individual },
    { value: "Отель", label: t.propertyDetail.buildingTypeOptions.hotel },
    { value: "Резорт", label: t.propertyDetail.buildingTypeOptions.resort }
  ];

  // Создаем условный список значений для статуса строительства
  const statusOptions = (() => {
    // Если пользователь админ или модератор - показываем все варианты
    if (role === 'admin' || role === 'moderator') {
      return [
        { value: "Проект", label: t.propertyDetail.statusOptions.project },
        { value: "Строится", label: t.propertyDetail.statusOptions.underConstruction },
        { value: "Готовый", label: t.propertyDetail.statusOptions.ready },
        { value: "От собственника", label: t.propertyDetail.statusOptions.fromOwner }
      ];
    }
    
    // Если пользователь создатель объекта - показываем только "От собственника"
    if (currentUser && property?.createdBy === currentUser.uid) {
      return [
        { value: "От собственника", label: t.propertyDetail.statusOptions.fromOwner }
      ];
    }
    
    // Для остальных пользователей - показываем все варианты
    return [
      { value: "Проект", label: t.propertyDetail.statusOptions.project },
      { value: "Строится", label: t.propertyDetail.statusOptions.underConstruction },
      { value: "Готовый", label: t.propertyDetail.statusOptions.ready },
      { value: "От собственника", label: t.propertyDetail.statusOptions.fromOwner }
    ];
  })();

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
    return `${commissionDisplay}% ($${sum.toLocaleString()})`;
  };

  // Обновляем функцию рендеринга значения
  const renderEditableValue = (field, value, type, options) => {
    if (isEditing && !nonEditableFields.includes(field)) {
      // Проверяем права доступа для полей "Застройщик" и "Статус земли"
      if ((field === 'developer' || field === 'landStatus') && 
          currentUser && property?.createdBy === currentUser.uid && 
          role !== 'admin' && role !== 'moderator') {
        return null; // Не показываем эти поля для создателей объектов (не админов/модераторов)
      }
      
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
        // Специальная обработка для поля "Статус строительства" для создателей объектов
        if (field === 'status' && 
            currentUser && property?.createdBy === currentUser.uid && 
            role !== 'admin' && role !== 'moderator') {
          return (
            <select
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || 'От собственника')}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            >
              {options.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
              ))}
            </select>
          );
        }
        
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
            sum = `$${Math.round(Number(price) * Number(commission) / 100).toLocaleString()}`;
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
                <div className="text-xs text-red-500 mt-1">{commissionDisplay}% ({sum})</div>
              )}
            </div>
          );
        }

        // Специальная обработка для поля "Застройщик"
        if (field === 'developer') {
          return (
            <select
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">{t.propertyDetail.notSelected}</option>
              {developersList.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          );
        }

        // Специальная обработка для поля "Район"
        if (field === 'district') {
          const districtOptions = [
            "Амед", "Берава", "Будук", "Джимбаран", "Кута", "Кутух", "Кинтамани", "Ловина", "Нуану",
            "Нуса Дуа", "Пандава", "Переренан", "Санур", "Семиньяк", "Убуд",
            "Улувату", "Умалас", "Унгасан", "Чангу", "Чемаги",
            "Гили Траванган", "Ломбок"
          ];
          return (
            <select
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">{t.propertyDetail.notSelected}</option>
              {districtOptions.map((item) => (
                <option key={item} value={item}>
                  {t.districts[item] || item}
                </option>
              ))}
            </select>
          );
        }

        // Специальная обработка для поля "Статус земли"
        if (field === 'landStatus') {
          const landStatusOptions = [
            "Туристическая зона (W)",
            "Торговая зона (K)",
            "Смешанная зона (C)",
            "Жилая зона (R)",
            "Сельхоз зона (P)",
            "Заповедная зона (RTH)"
          ];
          return (
            <select
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">{t.propertyDetail.notSelected}</option>
              {landStatusOptions.map((item) => (
                <option key={item} value={item}>
                  {t.landStatus?.[item] || item}
                </option>
              ))}
            </select>
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
        
        // Специальная обработка для поля количества юнитов
        if (field === 'unitsCount') {
          return (
            <input
              type="number"
              min="1"
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
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
              value={editedValues.hasOwnProperty(field) ? editedValues[field] : (originalValue || '')}
              onChange={(e) => handleValueChange(field, e.target.value)}
              className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
            />
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
              
              // Загружаем статус проверки застройщика
              const developerDoc = await getDoc(doc(db, "developers", propertyData.developerId));
              if (developerDoc.exists()) {
                propertyData.isDeveloperApproved = developerDoc.data().approved || false;
              } else {
                propertyData.isDeveloperApproved = false;
              }
            } catch (err) {
              console.error(t.propertyDetail.developerLoadError || "Ошибка при загрузке имени застройщика:", err);
              propertyData.isDeveloperApproved = false;
            }
          } else if (propertyData.developer) {
            // Если нет developerId, но есть поле developer (название), ищем по имени
            try {
              const developersQuery = query(
                collection(db, "developers"),
                where("name", "==", propertyData.developer)
              );
              const developerSnapshot = await getDocs(developersQuery);
              
              if (!developerSnapshot.empty) {
                const developerDoc = developerSnapshot.docs[0];
                propertyData.isDeveloperApproved = developerDoc.data().approved || false;
                propertyData.developerName = developerDoc.data().name;
                console.log('Found developer by name:', propertyData.developer, 'approved:', propertyData.isDeveloperApproved);
              } else {
                propertyData.isDeveloperApproved = false;
                console.log('Developer not found by name:', propertyData.developer);
              }
            } catch (err) {
              console.error('Ошибка при поиске застройщика по имени:', err);
              propertyData.isDeveloperApproved = false;
            }
          } else {
            // Если нет ни developerId, ни developer, то статус проверки false
            propertyData.isDeveloperApproved = false;
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
          // Загружаем сохраненный ROI, если есть
          try {
            const roiSnap = await getDoc(doc(db, "properties", id, "calculations", "roi"));
            if (roiSnap.exists()) {
              const r = roiSnap.data();
              const savedRoi = r?.results?.roi;
              if (typeof savedRoi === 'number' && !isNaN(savedRoi)) {
                setRoiPercent(savedRoi);
              }
            }
          } catch (e) {
            console.warn('ROI not found or error:', e);
          }
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

  // Определяем, показывать ли поле "Количество юнитов" вместо "Спальни"
  const shouldShowUnitsCount = property.buildingType === "Отель" || property.buildingType === "Резорт";
  
  const attributesBase = [
    {
      label: shouldShowUnitsCount ? t.propertyDetail.unitsCount : (property.bedrooms === 0 ? t.propertyDetail.studio : t.propertyDetail.bedrooms),
      value: shouldShowUnitsCount ? safeDisplay(property.unitsCount) : (property.bedrooms === 0 ? t.propertyDetail.studio : safeDisplay(property.bedrooms)),
      field: shouldShowUnitsCount ? "unitsCount" : "bedrooms",
      icon: Bed,
      type: shouldShowUnitsCount ? "number" : "select",
      options: shouldShowUnitsCount ? undefined : bedroomsOptions
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
      label: (property.complexName || property.complex) ? t.propertyDetail.complex : t.propertyDetail.propertyName,
      value: safeDisplay(property.complexName || property.complex || property.propertyName),
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
  
  // Фильтруем атрибуты для создателей объектов (не админов/модераторов)
  const filteredAttributesBase = attributesBase.filter(attr => {
    // Если пользователь админ или модератор - показываем все поля
    if (role === 'admin' || role === 'moderator') return true;
    
    // Если пользователь создатель объекта - скрываем поля "Застройщик" и "Статус земли"
    if (currentUser && property?.createdBy === currentUser.uid) {
      if (attr.field === 'developer' || attr.field === 'landStatus') return false;
    }
    
    return true;
  });
  
  const attributes = [
    ...filteredAttributesBase,
    {
      label: t.propertyDetail.pricePerSqm,
      value: property.price && property.area
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
            Math.round(Number(property.price) / Number(property.area))
          )
        : "—",
      field: "pricePerSqm",
      icon: Ruler,
      type: "text"
    },
    ...(roiPercent !== null ? [{
      label: t.roiShort,
      value: `${Number(roiPercent).toFixed(2)}%`,
      field: "roi",
      icon: Star,
      type: "text"
    }] : []),
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
        <div className={`mb-4 ${isMobile ? 'flex flex-col gap-2' : 'flex items-center justify-between gap-2'}`}>
          <button
            onClick={handleImageUpload}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 ${isMobile ? 'w-full h-12 justify-center' : ''}`}
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
          {isEditing ? (
            <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'}`}>
              <button
                onClick={toggleListingStatus}
                className={`px-4 py-2 rounded-lg text-white ${
                  property.isHidden
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                } ${isMobile ? 'w-full h-12' : ''}`}
              >
                {property.isHidden ? t.propertyDetail.returnToListing : t.propertyDetail.removeFromListing}
              </button>
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
                  hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                } ${isMobile ? 'w-full h-12' : ''}`}
              >
                {t.propertyDetail.saveButton}
              </button>
            </div>
          ) : (
            <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'}`}>
              <button
                onClick={() => {
                  // Для создателей объектов автоматически устанавливаем статус "От собственника"
                  if (currentUser && property?.createdBy === currentUser.uid && 
                      role !== 'admin' && role !== 'moderator') {
                    setEditedValues(prev => ({
                      ...prev,
                      status: 'От собственника'
                    }));
                  }
                  setIsEditing(true);
                }}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${isMobile ? 'w-full h-12' : ''}`}
              >
                {t.propertyDetail.editButton}
              </button>
              {/* Кнопка модерации - только для админов и модераторов */}
              {(role === 'admin' || role === 'moderator') && (
                <button
                  onClick={toggleModerationStatus}
                  className={`px-4 py-2 rounded-lg text-white ${
                    property.moderation
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  } ${isMobile ? 'w-full h-12' : ''}`}
                >
                  {property.moderation ? 'Одобрить' : 'Вернуть на модерацию'}
                </button>
              )}
            </div>
          )}
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
                  <AdaptiveTooltip content={t.propertyDetail.serviceVerifiedTooltip}>
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

            {/* Бейдж "Убран из листинга" */}
            {property.isHidden && (
              <div className="mb-4">
                <Badge className="bg-red-600 text-white border-red-600 border flex items-center gap-1 w-fit">
                  <span className="text-sm font-medium">⚠</span>
                  <span className="text-sm">{t.propertyDetail.removedFromListing}</span>
                </Badge>
              </div>
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="balcony"
                checked={editedValues.balcony !== undefined ? editedValues.balcony : property.balcony}
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
                checked={editedValues.bbq !== undefined ? editedValues.bbq : property.bbq}
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
                checked={editedValues.furniture !== undefined ? editedValues.furniture : property.furniture}
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
                checked={editedValues.washingMachine !== undefined ? editedValues.washingMachine : property.washingMachine}
                onChange={(e) => handleValueChange('washingMachine', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="washingMachine" className="text-sm font-medium text-gray-700">
                {t.propertyDetail.washingMachine}
              </label>
            </div>

            {/* Distance to beach (km) */}
            <div className="flex items-center space-x-2">
              <label htmlFor="distanceToBeach" className="text-sm font-medium text-gray-700 w-40">
                {t.propertyDetail.distanceToBeach}
              </label>
              <input
                type="number"
                step="0.1"
                id="distanceToBeach"
                value={editedValues.hasOwnProperty('distanceToBeach') ? editedValues.distanceToBeach : (property.distanceToBeach || '')}
                onChange={(e) => handleValueChange('distanceToBeach', e.target.value)}
                className="flex-1 text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
                placeholder={`0 ${t.propertyDetail.kmUnit}`}
              />
              <span className="text-sm text-gray-600">{t.propertyDetail.kmUnit}</span>
            </div>

            {/* Distance to center (km) */}
            <div className="flex items-center space-x-2">
              <label htmlFor="distanceToCenter" className="text-sm font-medium text-gray-700 w-40">
                {t.propertyDetail.distanceToCenter}
              </label>
              <input
                type="number"
                step="0.1"
                id="distanceToCenter"
                value={editedValues.hasOwnProperty('distanceToCenter') ? editedValues.distanceToCenter : (property.distanceToCenter || '')}
                onChange={(e) => handleValueChange('distanceToCenter', e.target.value)}
                className="flex-1 text-sm font-medium text-gray-900 leading-none whitespace-pre-line w-full border border-gray-300 rounded px-2 py-1"
                placeholder={`0 ${t.propertyDetail.kmUnit}`}
              />
              <span className="text-sm text-gray-600">{t.propertyDetail.kmUnit}</span>
            </div>
          </div>
        </div>
      ) : (
        (property.smartHome || property.jacuzzi || property.terrace || property.rooftop || property.balcony || property.bbq || property.furniture || property.washingMachine || property.distanceToBeach || property.distanceToCenter) && (
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
              {property.balcony && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Square className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.balcony}</span>
                </div>
              )}
              {property.bbq && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Flame className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.bbq}</span>
                </div>
              )}
              {property.furniture && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Sofa className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.furniture}</span>
                </div>
              )}
              {property.washingMachine && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Waves className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{t.propertyDetail.washingMachine}</span>
                </div>
              )}

              {property.distanceToBeach && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {t.propertyDetail.distanceToBeach} {String(property.distanceToBeach)} {t.propertyDetail.kmUnit}
                  </span>
                </div>
              )}
              {property.distanceToCenter && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {t.propertyDetail.distanceToCenter} {String(property.distanceToCenter)} {t.propertyDetail.kmUnit}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Поле "Описание" */}
      {property.description && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.description}</h3>
          <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
        </div>
      )}

      {/* Добавляем кнопки "Расчет ROI" после характеристик объекта */}
              {['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
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
              {showRoiCalculator && ['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
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
            <span className="text-sm text-gray-600">{t.propertyDetail.landLeaseEndDate}</span>
            <div className="flex-1 ml-4">
              {renderEditableValue('landLeaseEndDate', safeDisplay(property.landLeaseEndDate), 'date')}
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
            <span className="text-sm text-gray-600">{t.propertyDetail.unbrandedPresentation}</span>
            <div className="flex gap-2">
              {property.unbrandedPresentationFileURL ? (
                <>
                  <button 
                    onClick={() => window.open(property.unbrandedPresentationFileURL, '_blank')}
                    className={`px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ${isMobile ? 'min-h-[40px]' : ''}`}
                  >
                    {t.propertyDetail.viewButton}
                  </button>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpdate('unbrandedPresentationFileURL')}
                      disabled={uploading.unbrandedPresentationFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.unbrandedPresentationFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                    >
                      {uploading.unbrandedPresentationFileURL ? t.propertyDetail.uploading : t.propertyDetail.updateButton}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-500">{t.propertyDetail.fileNotUploaded}</span>
                  {canEdit() && (
                    <button 
                      onClick={() => handleFileUpload('unbrandedPresentationFileURL')}
                      disabled={uploading.unbrandedPresentationFileURL}
                      className={`px-3 py-1 text-xs rounded ${
                        uploading.unbrandedPresentationFileURL 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white ${isMobile ? 'min-h-[40px]' : ''}`}
                    >
                      {uploading.unbrandedPresentationFileURL ? t.propertyDetail.uploading : t.propertyDetail.uploadButton}
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

      {/* Заявки клиентов по объекту */}
      {property.addedByAgent && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsClientLeadsExpanded(!isClientLeadsExpanded)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title={isClientLeadsExpanded ? "Свернуть секцию" : "Развернуть секцию"}
              >
                <svg 
                  className={`w-5 h-5 transition-transform ${isClientLeadsExpanded ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-800">
                {t.leadForm.clientLeadsTitle} ({clientLeads.length})
              </h3>
            </div>
            <button
              onClick={refreshClientLeadsCache}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Обновить заявки клиентов"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Содержимое секции (отображается только при развернутом состоянии) */}
          {isClientLeadsExpanded && (
            <>
              {clientLeadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 rounded-full border-2 border-gray-400 border-b-transparent" />
                </div>
              ) : clientLeads.length === 0 ? (
                <div className="text-sm text-gray-500 py-4">{t.leadForm.noClientLeads}</div>
              ) : (
                <div className="space-y-3">
                  {clientLeads.map(lead => (
                    <div key={lead.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <div className="font-medium text-gray-900 mb-1">
                              {t.leadForm.clientName}: {lead.name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <span>{t.leadForm.clientPhone}: {lead.phone}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(lead.phone);
                                  toast.success(t.leadForm.phoneCopied);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title={t.leadForm.copyPhoneTooltip}
                              >
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {lead.messenger && (
                            <div className="text-sm text-gray-600 mb-2">
                              {t.leadForm.clientMessenger}: {
                                lead.messenger === 'whatsapp' ? t.leadForm.whatsapp : t.leadForm.telegram
                              }
                            </div>
                          )}
                          
                          {lead.createdAt && (
                            <div className="text-xs text-gray-500">
                              {t.leadForm.requestDate}: {
                                lead.createdAt.toDate ? 
                                  lead.createdAt.toDate().toLocaleString() : 
                                  new Date(lead.createdAt).toLocaleString()
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        )}

      {/* Чаты по объекту (iOS) */}
      {property.addedByAgent && agentChats && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setIsAgentChatsExpanded(!isAgentChatsExpanded)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title={isAgentChatsExpanded ? "Свернуть секцию" : "Развернуть секцию"}
            >
              <svg 
                className={`w-5 h-5 transition-transform ${isAgentChatsExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-800">
              {t.propertyDetail.agentChatsTitle || 'Чаты по объекту'} ({agentChats.length})
            </h3>
          </div>
          
          {/* Содержимое секции (отображается только при развернутом состоянии) */}
          {isAgentChatsExpanded && (
            <>
              {agentChats.length === 0 ? (
                <div className="text-sm text-gray-500">{t.propertyDetail.noChats}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {agentChats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => openChatViewer(chat)}
                      className="flex items-center justify-between w-full px-4 py-2 border rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {localizeChatName(chat.chatName)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(chat.timestamp?.toDate && chat.timestamp.toDate().toLocaleString()) || ''}
                          {chat.chatType ? ` • ${chat.chatType}` : ''}
                        </span>
                      </div>
                      <span className="text-xs text-blue-600">{t.propertyDetail.openChat || 'Открыть чат'}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Кнопки редактирования */}
      {/* Управляющие кнопки редактирования перенесены в верхний бар рядом с загрузкой фото */}

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

      {/* Chat Viewer Dialog */}
      <Dialog open={isChatOpen} onOpenChange={(open) => {
        setIsChatOpen(open);
        if (!open) {
          setNewMessage('');
          setSelectedChat(null);
        }
      }}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {selectedChat?.chatName ? 
                  localizeChatName(selectedChat.chatName) : 
                  (t.propertyDetail.chatDialogTitle || 'Переписка')
                }
              </DialogTitle>
              <button
                onClick={() => refreshChatCache(selectedChat?.id)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Обновить чат"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </DialogHeader>
          <div className="mt-2 max-h-[70vh] overflow-y-auto space-y-3">
            {isChatLoading ? (
              <div className="text-sm text-gray-500">{t.propertyDetail.loadingMessages || 'Загрузка сообщений…'}</div>
            ) : (
              (chatMessages.length ? chatMessages : []).map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender_role === 'agent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <div className="text-[10px] opacity-70 mb-1">
                      {(msg.sender_name || msg.sender_role || '').toString()}
                    </div>
                    {msg.text ? (
                      <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
                    ) : msg.propertyId ? (
                      <div className="text-sm italic text-gray-700">
                        {t.propertyDetail.propertyCardMessage || 'Карточка объекта'}
                      </div>
                    ) : null}
                    {msg.timestamp?.toDate && (
                      <div className={`text-[10px] mt-1 ${msg.sender_role === 'agent' ? 'text-white/80' : 'text-gray-500'}`}>
                        {msg.timestamp.toDate().toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {/* Невидимый элемент для автоматической прокрутки */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Форма ввода нового сообщения */}
          <div className="mt-4 border-t pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t.propertyDetail.messagePlaceholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSendingMessage}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSendingMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSendingMessage ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full" />
                ) : (
                  t.propertyDetail.sendButton
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PropertyDetail; 