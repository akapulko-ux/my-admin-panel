import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { 
  ChevronLeft, 
  Plus, 
  X,
  Calendar,
  Camera,
  Video,
  Edit3,
  Save
} from 'lucide-react';
import { uploadToFirebaseStorageInFolder } from '../utils/firebaseStorage';
import { showError, showSuccess } from '../utils/notifications';

function BuildingProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [additionalMonths, setAdditionalMonths] = useState(0);
  const [editingDescription, setEditingDescription] = useState(null);
  const [descriptionText, setDescriptionText] = useState('');
  const initialMonthsCount = 12;

  // Проверка прав доступа
  const canEdit = () => {
    return ['admin', 'модератор', 'застройщик'].includes(role);
  };

  // Загрузка данных комплекса
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'complexes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          setData(fetchedData);
          setProgressData(fetchedData.buildingProgress || []);
          setAdditionalMonths(fetchedData.additionalMonths || 0);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError(t.buildingProgress.errorLoading);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t.buildingProgress.errorLoading]);

  // Генерация списка месяцев
  const generateMonthsData = () => {
    const months = [
      t.buildingProgress.months.january,
      t.buildingProgress.months.february,
      t.buildingProgress.months.march,
      t.buildingProgress.months.april,
      t.buildingProgress.months.may,
      t.buildingProgress.months.june,
      t.buildingProgress.months.july,
      t.buildingProgress.months.august,
      t.buildingProgress.months.september,
      t.buildingProgress.months.october,
      t.buildingProgress.months.november,
      t.buildingProgress.months.december
    ];
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const monthsData = [];
    
    const extraMonths = additionalMonths * 4;
    const totalMonthsToShow = initialMonthsCount + extraMonths;
    
    let startMonth = currentMonth - 2;
    let startYear = currentYear;
    
    if (startMonth < 0) {
      startMonth += 12;
      startYear--;
    }
    
    let monthsToAdd = totalMonthsToShow;
    let yearsToAdd = Math.floor(monthsToAdd / 12);
    
    for (let year = startYear; year <= startYear + yearsToAdd; year++) {
      for (let month = 0; month < 12; month++) {
        if (year === startYear && month < startMonth) continue;
        
        if (monthsData.length >= totalMonthsToShow) break;
        
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const existingData = progressData.find(item => item.monthKey === monthKey);
        
        monthsData.push({
          monthKey,
          month: months[month],
          year,
          photos: existingData?.photos || [],
          videos: existingData?.videos || [],
          description: existingData?.description || ''
        });
      }
    }
    
    return monthsData;
  };

  // Обработка загрузки файлов
  const handleFileUpload = async (files, monthKey) => {
    if (!canEdit()) {
      showError(t.buildingProgress.noAccessUpload);
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const isVideo = file.type.startsWith('video/');
        const folder = `building-progress/complex/${id}/${monthKey}/${isVideo ? 'videos' : 'photos'}`;
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
          videos: uploadedFiles.filter(f => f.type === 'video'),
          description: monthData.description || ''
        });
      }

      setProgressData(updatedProgressData);

      // Сохраняем в базу данных
      await updateDoc(doc(db, 'complexes', id), {
        buildingProgress: updatedProgressData
      });

      showSuccess(t.buildingProgress.successUpload);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      showError(t.buildingProgress.errorUpload);
    } finally {
      setUploading(false);
    }
  };

  // Сохранение описания альбома
  const handleSaveDescription = async (monthKey) => {
    if (!canEdit()) {
      showError(t.buildingProgress.noAccessUpload);
      return;
    }

    try {
      const updatedProgressData = progressData.map(item => {
        if (item.monthKey === monthKey) {
          return {
            ...item,
            description: descriptionText.trim()
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
          photos: [],
          videos: [],
          description: descriptionText.trim()
        });
      }

      setProgressData(updatedProgressData);

      // Сохраняем в базу данных
      await updateDoc(doc(db, 'complexes', id), {
        buildingProgress: updatedProgressData
      });

      showSuccess(t.buildingProgress.descriptionSaved);
      setEditingDescription(null);
      setDescriptionText('');
    } catch (error) {
      console.error('Ошибка сохранения описания:', error);
      showError(t.buildingProgress.descriptionError);
    }
  };

  // Начало редактирования описания
  const handleStartEditDescription = (monthKey, currentDescription = '') => {
    setEditingDescription(monthKey);
    setDescriptionText(currentDescription);
  };

  // Отмена редактирования описания
  const handleCancelEditDescription = () => {
    setEditingDescription(null);
    setDescriptionText('');
  };

  // Удаление файла (используется в BuildingProgressDetail.js)
  // const handleFileDelete = async (monthKey, fileUrl, fileType) => {
  //   if (!canEdit()) {
  //     showError(t.buildingProgress.noAccessDelete);
  //     return;
  //   }

  //   try {
  //     const updatedProgressData = progressData.map(item => {
  //       if (item.monthKey === monthKey) {
  //         return {
  //           ...item,
  //           [fileType === 'photo' ? 'photos' : 'videos']: 
  //             item[fileType === 'photo' ? 'photos' : 'videos'].filter(file => file.url !== fileUrl)
  //         };
  //       }
  //       return item;
  //     });

  //     setProgressData(updatedProgressData);

  //     await updateDoc(doc(db, 'complexes', id), {
  //       buildingProgress: updatedProgressData
  //     });

  //     showSuccess(t.buildingProgress.successDelete);
  //   } catch (error) {
  //     console.error('Ошибка удаления файла:', error);
  //     showError(t.buildingProgress.errorDelete);
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.buildingProgress.loading}</div>
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
              onClick={() => navigate(`/complex/${id}`)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{t.buildingProgress.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {data && (
              <div className="text-right">
                <h2 className="text-xl font-semibold text-gray-800">
                  {data.name}
                </h2>
              </div>
            )}
            
            <button
              onClick={() => {
                const url = `${window.location.origin}/public-building-progress/complex/${id}`;
                navigator.clipboard.writeText(url);
                showSuccess(t.buildingProgress.successLinkCopied);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              {t.buildingProgress.copyPublicLink}
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
                    {/* Секция описания */}
                    <div className="mb-3">
                      {editingDescription === monthData.monthKey ? (
                        <div className="space-y-2">
                          <textarea
                            value={descriptionText}
                            onChange={(e) => setDescriptionText(e.target.value)}
                            placeholder={t.buildingProgress.descriptionPlaceholder}
                            className="w-full p-2 text-xs border border-gray-300 rounded-md resize-none"
                            rows="3"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveDescription(monthData.monthKey)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              <Save className="w-3 h-3" />
                              {t.buildingProgress.saveDescription}
                            </button>
                            <button
                              onClick={handleCancelEditDescription}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                            >
                              <X className="w-3 h-3" />
                              {t.buildingProgress.cancelEdit}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {monthData.description ? (
                              <p className="text-xs text-gray-700 leading-relaxed">{monthData.description}</p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">{t.buildingProgress.albumDescription}</p>
                            )}
                          </div>
                          {canEdit() && (
                            <button
                              onClick={() => handleStartEditDescription(monthData.monthKey, monthData.description)}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Кнопки действий */}
                    {hasContent ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/building-progress/complex/${id}/${monthData.monthKey}`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          {t.buildingProgress.view}
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
                            {t.buildingProgress.addMore}
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
                        {t.buildingProgress.add}
                      </button>
                    )}
                    
                    {hasContent && (
                      <div className="mt-2 text-center text-xs text-gray-600">
                        {totalPhotos > 0 && `${totalPhotos} ${t.buildingProgress.photos}`}
                        {totalPhotos > 0 && totalVideos > 0 && ', '}
                        {totalVideos > 0 && `${totalVideos} ${t.buildingProgress.videos}`}
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
                await updateDoc(doc(db, 'complexes', id), {
                  additionalMonths: newValue
                });
              }}
              className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">{t.buildingProgress.addPeriod}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно загрузки */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t.buildingProgress.uploadFiles}</h3>
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
                {t.buildingProgress.supportedFormats}
              </div>
              
              {uploading && (
                <div className="text-center text-blue-600">
                  {t.buildingProgress.uploadingFiles}
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