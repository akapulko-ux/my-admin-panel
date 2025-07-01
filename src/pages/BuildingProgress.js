import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Upload,
  X,
  Calendar,
  Camera,
  Video
} from 'lucide-react';
import { uploadToFirebaseStorageInFolder } from '../utils/firebaseStorage';
import { showError, showSuccess } from '../utils/notifications';

function BuildingProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [additionalMonths, setAdditionalMonths] = useState(0); // Количество дополнительных 4-месячных периодов
  const initialMonthsCount = 12; // Изначальное количество месяцев

  // Проверка прав доступа
  const canEdit = () => {
    return ['admin', 'модератор', 'застройщик'].includes(role);
  };

  // Загрузка данных объекта
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', id));
        if (propertyDoc.exists()) {
          const propertyData = propertyDoc.data();
          setProperty(propertyData);
          setProgressData(propertyData.buildingProgress || []);
          // Устанавливаем количество дополнительных месяцев из сохраненных данных
          setAdditionalMonths(propertyData.additionalMonths || 0);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Ошибка загрузки данных объекта');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [id]);

  // Генерация списка месяцев
  const generateMonthsData = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const monthsData = [];
    
    // Вычисляем общее количество месяцев для отображения
    const extraMonths = additionalMonths * 4;
    const totalMonthsToShow = initialMonthsCount + extraMonths;
    
    // Начинаем с текущего месяца - 2 и добавляем нужное количество месяцев
    let startMonth = currentMonth - 2;
    let startYear = currentYear;
    
    // Корректируем начальный месяц и год, если нужно
    if (startMonth < 0) {
      startMonth += 12;
      startYear--;
    }
    
    let monthsToAdd = totalMonthsToShow;
    let yearsToAdd = Math.floor(monthsToAdd / 12);
    
    for (let year = startYear; year <= startYear + yearsToAdd; year++) {
      for (let month = 0; month < 12; month++) {
        // В первый год начинаем с корректного месяца
        if (year === startYear && month < startMonth) continue;
        
        // Останавливаемся, когда добавили нужное количество месяцев
        if (monthsData.length >= totalMonthsToShow) break;
        
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const existingData = progressData.find(item => item.monthKey === monthKey);
        
        monthsData.push({
          monthKey,
          month: months[month],
          year,
          photos: existingData?.photos || [],
          videos: existingData?.videos || []
        });
      }
    }
    
    return monthsData;
  };

  // Обработка загрузки файлов
  const handleFileUpload = async (files, monthKey) => {
    if (!canEdit()) {
      showError('У вас нет прав для загрузки файлов');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const isVideo = file.type.startsWith('video/');
        const folder = `building-progress/${id}/${monthKey}/${isVideo ? 'videos' : 'photos'}`;
        const url = await uploadToFirebaseStorageInFolder(file, folder);
        
        return {
          url,
          type: isVideo ? 'video' : 'photo',
          uploadedAt: new Date().toISOString(),
          filename: file.name
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Обновляем данные прогресса
      const updatedProgressData = progressData.map(item => {
        if (item.monthKey === monthKey) {
          return {
            ...item,
            photos: [...(item.photos || []), ...uploadedFiles.filter(f => f.type === 'photo')],
            videos: [...(item.videos || []), ...uploadedFiles.filter(f => f.type === 'video')]
          };
        }
        return item;
      });

      // Если месяц не существует, создаем новый
      if (!progressData.find(item => item.monthKey === monthKey)) {
        const monthData = generateMonthsData().find(m => m.monthKey === monthKey);
        updatedProgressData.push({
          monthKey,
          month: monthData.month,
          year: monthData.year,
          photos: uploadedFiles.filter(f => f.type === 'photo'),
          videos: uploadedFiles.filter(f => f.type === 'video')
        });
      }

      setProgressData(updatedProgressData);

      // Сохраняем в базу данных
      await updateDoc(doc(db, 'properties', id), {
        buildingProgress: updatedProgressData
      });

      showSuccess('Файлы успешно загружены');
      setShowUploadModal(false);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      showError('Ошибка загрузки файлов');
    } finally {
      setUploading(false);
    }
  };

  // Удаление файла
  const handleFileDelete = async (monthKey, fileUrl, fileType) => {
    if (!canEdit()) {
      showError('У вас нет прав для удаления файлов');
      return;
    }

    try {
      const updatedProgressData = progressData.map(item => {
        if (item.monthKey === monthKey) {
          return {
            ...item,
            [fileType === 'photo' ? 'photos' : 'videos']: 
              item[fileType === 'photo' ? 'photos' : 'videos'].filter(file => file.url !== fileUrl)
          };
        }
        return item;
      });

      setProgressData(updatedProgressData);

      await updateDoc(doc(db, 'properties', id), {
        buildingProgress: updatedProgressData
      });

      showSuccess('Файл удален');
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      showError('Ошибка удаления файла');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  const monthsData = generateMonthsData();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Прогресс строительства</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {property && (
              <div className="text-right">
                <h2 className="text-xl font-semibold text-gray-800">{property.title}</h2>
                <p className="text-gray-600">{property.location}</p>
              </div>
            )}
            
            <button
              onClick={() => {
                const url = `${window.location.origin}/public-building-progress/${id}`;
                navigator.clipboard.writeText(url);
                showSuccess('Публичная ссылка скопирована в буфер обмена');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Публичная ссылка
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {monthsData.map((monthData) => {
              const totalPhotos = monthData.photos.length;
              const totalVideos = monthData.videos.length;
              const hasContent = totalPhotos > 0 || totalVideos > 0;

              return (
                <div
                  key={monthData.monthKey}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gray-900 text-white">
                    {hasContent && monthData.photos.length > 0 ? (
                      <img
                        src={monthData.photos[0].url}
                        alt={`${monthData.month} ${monthData.year}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                        <Calendar className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 bg-black bg-opacity-60 rounded-lg px-3 py-1">
                      <div className="flex items-center gap-2 text-sm">
                        {totalPhotos > 0 && (
                          <span className="flex items-center gap-1">
                            <Camera className="w-4 h-4" />
                            {totalPhotos}
                          </span>
                        )}
                        {totalVideos > 0 && (
                          <span className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            {totalVideos}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4">
                      <div className="text-2xl font-bold">{monthData.month}</div>
                      <div className="text-lg opacity-75">{monthData.year}</div>
                    </div>
                  </div>

                  <div className="p-3">
                    {hasContent ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/building-progress/${id}/${monthData.monthKey}`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Просмотр
                        </button>
                        {canEdit() && (
                          <button
                            onClick={() => {
                              setSelectedMonth(monthData.monthKey);
                              setShowUploadModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs"
                          >
                            <Plus className="w-3 h-3" />
                            Добавить ещё
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedMonth(monthData.monthKey);
                          setShowUploadModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        disabled={!canEdit()}
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </button>
                    )}
                    
                    {hasContent && (
                      <div className="mt-2 text-center text-xs text-gray-600">
                        {totalPhotos > 0 && `${totalPhotos} фото`}
                        {totalPhotos > 0 && totalVideos > 0 && ', '}
                        {totalVideos > 0 && `${totalVideos} видео`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Кнопка добавления периода */}
          <div className="flex justify-center mt-8">
            <button
              onClick={async () => {
                const newValue = additionalMonths + 1;
                setAdditionalMonths(newValue);
                // Сохраняем новое значение в Firebase
                await updateDoc(doc(db, 'properties', id), {
                  additionalMonths: newValue
                });
              }}
              className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Добавить период</span>
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно загрузки */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Загрузить файлы</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    handleFileUpload(e.target.files, selectedMonth);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg"
                disabled={uploading}
              />
              
              <div className="text-sm text-gray-600">
                Поддерживаются изображения и видео файлы
              </div>
              
              {uploading && (
                <div className="text-center text-blue-600">
                  Загрузка файлов...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuildingProgress; 