import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { useCache } from "../CacheContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict } from "../lib/utils";
import {
  Building2,
  FileText,
  Layers,
  ArrowLeft,
  Edit2,
  Save,
  X,
  Video,
  Globe,
  Building,
  BarChart3,
  Camera,
  Plus,
  Sparkles,
  Utensils,
  Dumbbell,
  Baby
} from "lucide-react";
import { showError, showSuccess } from '../utils/notifications';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from '../utils/firebaseStorage';
// Импорт для сжатия изображений и конвертации PDF
import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";

function ComplexDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complex, setComplex] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const { currentUser, role } = useAuth();
  const { getPropertiesList, propertiesCache } = useCache();
  const { language } = useLanguage();
  const t = translations[language];
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  
  // Состояния для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // Функция для проверки, может ли пользователь редактировать комплекс
  const canEdit = () => {
    if (role === 'admin' || role === 'moderator') return true;
    if (['застройщик', 'премиум застройщик'].includes(role)) {
      // Застройщик может редактировать только свои комплексы
      return complex?.developer && complex.developer === complex.userDeveloperName;
    }
    return false;
  };

  // Функция для обработки изменений значений
  const handleValueChange = (field, value) => {
    let processedValue = value;
    if (field === 'priceFrom') {
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
      const complexRef = doc(db, "complexes", id);
      await updateDoc(complexRef, {
        ...editedValues,
        updatedAt: Timestamp.now()
      });
      setComplex(prev => ({ ...prev, ...editedValues }));
      setEditedValues({});
      setHasChanges(false);
      setIsEditing(false);
      showSuccess(t.complexDetail.changesSaved);
    } catch (error) {
      console.error("Ошибка при сохранении изменений:", error);
      showError(t.complexDetail.saveError);
    }
  };

  // Функция для отмены редактирования
  const handleCancel = () => {
    setEditedValues({});
    setHasChanges(false);
    setIsEditing(false);
  };

  // Безопасное отображение значений
  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "—";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Форматирование цены
  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Загрузка данных комплекса и объектов
  useEffect(() => {
    // Переносим fetchDeveloperName внутрь useEffect
    const fetchDeveloperName = async (developerId) => {
      try {
        const developerDoc = await getDoc(doc(db, "developers", developerId));
        if (developerDoc.exists()) {
          return developerDoc.data().name;
        }
        return null;
      } catch (err) {
        console.error("Ошибка загрузки данных застройщика:", err);
        return null;
      }
    };

    async function fetchData() {
      try {
        console.log('Загружаем комплекс с ID:', id);
        const complexRef = doc(db, "complexes", id);
        const complexSnap = await getDoc(complexRef);

        if (!complexSnap.exists()) {
          console.log('Комплекс не найден');
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        let complexData = { id: complexSnap.id, ...complexSnap.data() };

        // Проверяем доступ для застройщика
        if (['застройщик', 'премиум застройщик'].includes(role) && currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().developerId) {
            const userDeveloperName = await fetchDeveloperName(userDoc.data().developerId);
            complexData.userDeveloperName = userDeveloperName;
            
            // Если не совпадает застройщик, запрещаем доступ
            if (complexData.developer !== userDeveloperName) {
              setAccessDenied(true);
              setLoading(false);
              return;
            }
          }
        }

        console.log('Данные комплекса загружены:', complexData);
        setComplex(complexData);

        // Загружаем объекты для расчета цен
        let propertiesData;
        if (propertiesCache.list?.data && Date.now() - propertiesCache.list.timestamp < 5 * 60 * 1000) {
          propertiesData = propertiesCache.list.data;
        } else {
          propertiesData = await getPropertiesList();
        }

        // Загружаем названия комплексов для объектов (как в ComplexesGallery)
        const propertiesWithComplexNames = await Promise.all(
          propertiesData.map(async (property) => {
            if (property.complexId) {
              try {
                const complexDoc = await getDoc(doc(db, "complexes", property.complexId));
                if (complexDoc.exists()) {
                  return { ...property, complexName: complexDoc.data().name };
                }
              } catch (err) {
                console.error("Ошибка загрузки названия комплекса:", err);
              }
            }
            return property;
          })
        );

        setProperties(propertiesWithComplexNames);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        showError("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id, currentUser, role, getPropertiesList, propertiesCache]);

  // После useEffect
  const getMinPriceForComplex = (complexName) => {
    if (!complexName || !properties.length) return null;
    const relatedProperties = properties.filter(property => {
      const propertyComplexName = property.complexName || property.complex;
      return propertyComplexName && propertyComplexName.toLowerCase() === complexName.toLowerCase();
    });
    if (relatedProperties.length === 0) return null;
    const prices = relatedProperties
      .map(property => property.price)
      .filter(price => price && price > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  // Функция для рендеринга редактируемого поля
  const renderEditableValue = (field, value, type = 'text', label) => {
    const currentValue = editedValues[field] !== undefined ? editedValues[field] : value;
    
    if (isEditing && canEdit()) {
      return (
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-600">{label}</Label>
          <Input
            type={type}
            value={currentValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className="text-sm"
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        <Label className="text-sm font-medium text-gray-600">{label}</Label>
        <div className="text-sm">{safeDisplay(currentValue)}</div>
      </div>
    );
  };

  // Функция для загрузки новых фотографий (с сжатием и поддержкой PDF)
  const handleImageUpload = async () => {
    if (!canEdit()) {
      showError(t.complexDetail.editPermissionError);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.onchange = async (event) => {
      const files = Array.from(event.target.files);
      if (!files.length) return;

      setUploading(true);
      
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
          uploadToFirebaseStorageInFolder(file, 'complexes/images')
        );

        const urls = await Promise.all(uploadPromises);
        
        // Обновляем комплекс в базе данных
        const complexRef = doc(db, "complexes", id);
        const currentImages = complex.images || [];
        await updateDoc(complexRef, { 
          images: [...currentImages, ...urls],
          updatedAt: Timestamp.now()
        });
        
        // Обновляем локальное состояние
        setComplex(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls]
        }));
        
        showSuccess(t.complexDetail.photosUploadSuccess);
      } catch (error) {
        console.error("Ошибка загрузки фотографий:", error);
        showError(t.complexDetail.photosUploadError);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Функция для удаления фотографии
  const handleImageDelete = async (index) => {
    if (!canEdit()) {
      showError(t.complexDetail.editPermissionError);
      return;
    }

    if (!complex.images?.[index]) {
      showError(t.complexDetail.photoNotFound);
      return;
    }

    try {
      const imageUrl = complex.images[index];
      console.log("Начинаем процесс удаления фотографии:", imageUrl);
      
      // Сначала пытаемся удалить файл из хранилища
      await deleteFileFromFirebaseStorage(imageUrl);
      console.log("Файл успешно удален из хранилища");

      // После успешного удаления файла обновляем базу данных
      const newImages = [...complex.images];
      newImages.splice(index, 1);
      
      const complexRef = doc(db, "complexes", id);
      await updateDoc(complexRef, { 
        images: newImages,
        updatedAt: Timestamp.now()
      });
      console.log("База данных успешно обновлена");
      
      // Обновляем локальное состояние
      setComplex(prev => ({
        ...prev,
        images: newImages
      }));
      
      // Если удалили текущую фотографию, переключаемся на предыдущую
      if (currentImg >= newImages.length) {
        setCurrentImg(Math.max(0, newImages.length - 1));
      }

      showSuccess(t.complexDetail.photoDeleteSuccess);
    } catch (error) {
      console.error("Ошибка при удалении фотографии:", error);
      
      if (error.message.includes("storage/object-not-found")) {
        // Если файл не найден в storage, все равно удаляем ссылку из базы данных
        try {
          const newImages = [...complex.images];
          newImages.splice(index, 1);
          
          const complexRef = doc(db, "complexes", id);
          await updateDoc(complexRef, { 
            images: newImages,
            updatedAt: Timestamp.now()
          });
          
          setComplex(prev => ({
            ...prev,
            images: newImages
          }));
          
          if (currentImg >= newImages.length) {
            setCurrentImg(Math.max(0, newImages.length - 1));
          }
          
          showSuccess(t.complexDetail.photoLinkDeleted);
        } catch (dbError) {
          console.error("Ошибка обновления базы данных:", dbError);
          showError(t.complexDetail.databaseUpdateError);
        }
      } else {
        showError(t.complexDetail.photoDeleteError);
      }
      
      // Перезагружаем данные комплекса в случае ошибки
      try {
        const complexRef = doc(db, "complexes", id);
        const complexSnap = await getDoc(complexRef);
        if (complexSnap.exists()) {
          setComplex(prev => ({
            ...prev,
            ...complexSnap.data()
          }));
        }
      } catch (reloadError) {
        console.error("Ошибка перезагрузки данных:", reloadError);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t.complexDetail.loadingText}</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t.complexDetail.accessDenied}</h2>
          <p className="text-gray-600 mb-4">
            {t.complexDetail.accessDeniedMessage}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.complexDetail.backButton}
          </Button>
        </Card>
      </div>
    );
  }

  if (!complex) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t.complexDetail.complexNotFound}</h2>
          <p className="text-gray-600 mb-4">
            {t.complexDetail.complexNotFoundMessage}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.complexDetail.backButton}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Кнопка возврата и заголовок */}
      <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mb-6`}>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/complex/list")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
            {complex?.name || "Загрузка..."}
          </h1>
        </div>
        {canEdit() && (
          <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className={`gap-2 ${isMobile ? 'w-full h-12' : ''}`}
                >
                  <X className="h-4 w-4" />
                  {t.complexDetail.cancelButton}
                </Button>
                <Button
                  onClick={handleSave}
                  className={`gap-2 ${isMobile ? 'w-full h-12' : ''}`}
                  disabled={!hasChanges}
                >
                  <Save className="h-4 w-4" />
                  {t.complexDetail.saveButton}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className={`gap-2 ${isMobile ? 'w-full h-12' : ''}`}
              >
                <Edit2 className="h-4 w-4" />
                {t.complexDetail.editButton}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Кнопка загрузки фотографий */}
      {canEdit() && (
        <div className="mb-4">
          <Button
            onClick={handleImageUpload}
            variant="outline"
            className={`gap-2 ${isMobile ? 'w-full h-12' : ''}`}
            disabled={uploading}
          >
            {uploading ? (
              t.complexDetail.uploadingText
            ) : (
              <>
                <Camera className="h-4 w-4" />
                {t.complexDetail.addPhotoButton}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Мобильная горизонтальная галерея */}
      {complex?.images?.length ? (
        <div className="md:hidden overflow-x-auto flex pb-4 -mx-4 px-4 mb-4 snap-x snap-mandatory">
          {complex.images.map((url, idx) => (
            <div
              key={idx}
              className="relative flex-none w-full h-56 rounded-xl overflow-hidden bg-gray-200 snap-center mr-4 last:mr-0"
              style={{ scrollSnapAlign: "center" }}
            >
              <img 
                onClick={() => { setCurrentImg(idx); setLightbox(true); }} 
                src={url} 
                alt={`${t.complexDetail.photoAltText} ${idx + 1}`} 
                className="w-full h-full object-cover cursor-pointer" 
              />
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
      {complex?.images?.length ? (
        <div className="hidden md:block relative mb-4 group">
          <div className="w-full h-72 rounded-xl overflow-hidden bg-gray-200">
            <img
              src={complex.images[currentImg]}
              alt={`${t.complexDetail.photoAltText} ${currentImg + 1}`}
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
          {currentImg < complex.images.length - 1 && (
            <button
              onClick={() => setCurrentImg((i) => i + 1)}
              className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition"
            >
              ▶
            </button>
          )}
        </div>
      ) : (
        <div 
          className="hidden md:flex w-full h-72 rounded-xl overflow-hidden mb-4 bg-gray-200 items-center justify-center text-gray-400 flex-col gap-4"
          onClick={canEdit() ? handleImageUpload : undefined}
          style={{ cursor: canEdit() ? 'pointer' : 'default' }}
        >
          <Building2 className="w-12 h-12" />
          {canEdit() && (
            <div className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              {t.complexDetail.addPhotoButton}
            </div>
          )}
        </div>
      )}

      {/* Лайтбокс */}
      {lightbox && complex?.images?.length && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-4xl w-full max-h-screen p-4">
            <img
              src={complex.images[currentImg]}
              alt={`${t.complexDetail.photoAltText} ${currentImg + 1}`}
              className="w-full h-auto max-h-screen object-contain"
            />
            {/* Prev */}
            {currentImg > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImg((i) => i - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
              >
                ◀
              </button>
            )}
            {/* Next */}
            {currentImg < complex.images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImg((i) => i + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
              >
                ▶
              </button>
            )}
          </div>
        </div>
      )}

      {/* Основная информация */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Цена */}
          {(() => {
            const minPrice = getMinPriceForComplex(complex.name);
            const displayPrice = minPrice || complex.priceFrom;
            
            return displayPrice ? (
              <div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">
                    {t.complexDetail.priceFromLabel} {minPrice ? t.complexDetail.priceMinFromObjects : t.complexDetail.priceFromComplex}
                  </Label>
                  <div className="flex items-center gap-2">
                    {isEditing && canEdit() && !minPrice ? (
                      <Input
                        type="text"
                        value={editedValues.priceFrom !== undefined ? editedValues.priceFrom : complex.priceFrom}
                        onChange={(e) => handleValueChange('priceFrom', e.target.value)}
                        className="text-lg font-bold"
                        placeholder={t.complexDetail.pricePlaceholder}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(displayPrice)}
                      </span>
                    )}
                  </div>
                  {minPrice && (
                    <div className="text-xs text-gray-500">
                      {t.complexDetail.autoCalculatedPriceText}
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}

          {/* Остальные поля в одну линию */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-4 gap-4'}`}>
            {/* Застройщик */}
            <div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-600">{t.complexDetail.developerLabel}</Label>
                <div className="text-sm break-words">{safeDisplay(complex.developer)}</div>
              </div>
            </div>

            {/* Район */}
            <div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-600">{t.complexDetail.districtLabel}</Label>
                <div className="text-sm break-words">{translateDistrict(safeDisplay(complex.district), language)}</div>
              </div>
            </div>

            {/* Дата сдачи */}
            <div>
              {renderEditableValue('completionDate', complex.completionDate, 'text', t.complexDetail.completionDateLabel)}
            </div>

            {/* Координаты */}
            <div>
              {renderEditableValue('coordinates', complex.coordinates, 'text', t.complexDetail.coordinatesLabel)}
            </div>
          </div>
        </div>
      </Card>

      {/* Описание */}
      {complex.description && (
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.complexDetail.description}
            </h3>
            {isEditing && canEdit() ? (
              <textarea
                value={editedValues.description !== undefined ? editedValues.description : complex.description}
                onChange={(e) => handleValueChange('description', e.target.value)}
                className="w-full p-3 border rounded-md min-h-[512px] font-mono text-sm"
                placeholder={t.complexDetail.descriptionPlaceholder}
              />
            ) : (
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                {complex.description}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Дополнительные опции */}
      {(complex.spaSalon || complex.restaurant || complex.fitnessGym || complex.playground || isEditing) && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              {t.complexDetail.onComplexTerritory}
            </h3>
            
            {isEditing && canEdit() ? (
              // Режим редактирования - чекбоксы
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="spaSalon"
                    checked={editedValues.spaSalon !== undefined ? editedValues.spaSalon : complex.spaSalon || false}
                    onChange={(e) => handleValueChange('spaSalon', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <Label htmlFor="spaSalon" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.spaSalon}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="restaurant"
                    checked={editedValues.restaurant !== undefined ? editedValues.restaurant : complex.restaurant || false}
                    onChange={(e) => handleValueChange('restaurant', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <Label htmlFor="restaurant" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.restaurant}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="fitnessGym"
                    checked={editedValues.fitnessGym !== undefined ? editedValues.fitnessGym : complex.fitnessGym || false}
                    onChange={(e) => handleValueChange('fitnessGym', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <Label htmlFor="fitnessGym" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.fitnessGym}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="playground"
                    checked={editedValues.playground !== undefined ? editedValues.playground : complex.playground || false}
                    onChange={(e) => handleValueChange('playground', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <Label htmlFor="playground" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.playground}
                  </Label>
                </div>
              </div>
            ) : (
              // Режим просмотра - бейджи
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-3`}>
                {complex.spaSalon && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <Sparkles className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{t.complexDetail.spaSalon}</span>
                  </div>
                )}
                {complex.restaurant && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <Utensils className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{t.complexDetail.restaurant}</span>
                  </div>
                )}
                {complex.fitnessGym && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <Dumbbell className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{t.complexDetail.fitnessGym}</span>
                  </div>
                )}
                {complex.playground && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <Baby className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{t.complexDetail.playground}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Ссылки и документы */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {t.complexDetail.linksAndDocuments}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Видео */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">{t.complexDetail.videoLabel}</Label>
            {isEditing && canEdit() ? (
              <Input
                type="text"
                value={editedValues.videoLink !== undefined ? editedValues.videoLink : complex.videoLink || ''}
                onChange={(e) => handleValueChange('videoLink', e.target.value)}
                className="w-full mb-2"
                placeholder={t.complexDetail.videoLinkPlaceholder}
              />
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className={`w-full ${isMobile ? 'h-12' : ''}`}
                asChild={!!complex.videoLink}
                disabled={!complex.videoLink}
              >
                {complex.videoLink ? (
                  <a href={complex.videoLink} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    {t.complexDetail.watchVideoButton}
                  </a>
                ) : (
                  <span>
                    <Video className="h-4 w-4 mr-2" />
                    {t.complexDetail.watchVideoButton}
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* 3D тур */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">{t.complexDetail.tourLabel}</Label>
            {isEditing && canEdit() ? (
              <Input
                type="text"
                value={editedValues.threeDTour !== undefined ? editedValues.threeDTour : complex.threeDTour || ''}
                onChange={(e) => handleValueChange('threeDTour', e.target.value)}
                className="w-full mb-2"
                placeholder={t.complexDetail.tourLinkPlaceholder}
              />
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className={`w-full ${isMobile ? 'h-12' : ''}`}
                asChild={!!complex.threeDTour}
                disabled={!complex.threeDTour}
              >
                {complex.threeDTour ? (
                  <a href={complex.threeDTour} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    {t.complexDetail.view3DTourButton}
                  </a>
                ) : (
                  <span>
                    <Globe className="h-4 w-4 mr-2" />
                    {t.complexDetail.view3DTourButton}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Кнопка "Прогресс строительства" */}
        {['admin', 'moderator', 'premium agent', 'agent', 'застройщик'].includes(role) && (
          <div className="mt-6">
            <Button
              onClick={() => navigate(`/building-progress/complex/${id}`)}
              className={`w-full bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'h-12' : ''}`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t.complexDetail.buildingProgressButton}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ComplexDetail; 