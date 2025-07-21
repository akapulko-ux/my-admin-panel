import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Download,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  Video
} from 'lucide-react';
import { showError, showSuccess } from '../utils/notifications';

function BuildingProgressDetail() {
  const { id, monthKey } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  
  const [data, setData] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allMedia, setAllMedia] = useState([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  // Проверка прав доступа
  const canEdit = () => {
    return ['admin', 'модератор', 'застройщик', 'премиум застройщик'].includes(role);
  };

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'complexes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          setData(fetchedData);
          
          const progressData = fetchedData.buildingProgress || [];
          const currentMonthData = progressData.find(item => item.monthKey === monthKey);
          
          if (currentMonthData) {
            setMonthData(currentMonthData);
            
            // Объединяем фотографии и видео в один массив для просмотра
            const combinedMedia = [
              ...(currentMonthData.photos || []).map(item => ({ ...item, type: 'photo' })),
              ...(currentMonthData.videos || []).map(item => ({ ...item, type: 'video' }))
            ].sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
            
            setAllMedia(combinedMedia);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError(t.buildingProgress.errorLoading);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, monthKey, t.buildingProgress.errorLoading]);

  // Удаление медиа файла
  const handleDeleteMedia = async (mediaUrl, mediaType) => {
    if (!canEdit()) {
      showError(t.buildingProgress.noAccessDelete);
      return;
    }

    if (!window.confirm(t.buildingProgress.confirmDelete)) {
      return;
    }

    try {
      const docRef = doc(db, 'complexes', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const fetchedData = docSnap.data();
        const progressData = fetchedData.buildingProgress || [];
        
        const updatedProgressData = progressData.map(item => {
          if (item.monthKey === monthKey) {
            return {
              ...item,
              [mediaType === 'photo' ? 'photos' : 'videos']: 
                item[mediaType === 'photo' ? 'photos' : 'videos'].filter(file => file.url !== mediaUrl)
            };
          }
          return item;
        });

        await updateDoc(docRef, {
          buildingProgress: updatedProgressData
        });

        // Обновляем локальное состояние
        const updatedMonthData = updatedProgressData.find(item => item.monthKey === monthKey);
        setMonthData(updatedMonthData);
        
        const combinedMedia = [
          ...(updatedMonthData.photos || []).map(item => ({ ...item, type: 'photo' })),
          ...(updatedMonthData.videos || []).map(item => ({ ...item, type: 'video' }))
        ].sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
        
        setAllMedia(combinedMedia);
        setSelectedMedia(null);

        showSuccess(t.buildingProgress.successDelete);
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      showError(t.buildingProgress.errorDelete);
    }
  };

  // Навигация по медиа файлам
  const navigateMedia = (direction) => {
    if (direction === 'next' && currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedMedia(allMedia[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedMedia(allMedia[currentIndex - 1]);
    }
  };

  // Открытие медиа в полноэкранном режиме
  const openMedia = (media, index) => {
    setSelectedMedia(media);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.buildingProgress.loading}</div>
      </div>
    );
  }

  if (!monthData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t.buildingProgress.dataNotFound}</h2>
          <button
            onClick={() => navigate(`/building-progress/complex/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.buildingProgress.backToProgress}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
                      <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/building-progress/complex/${id}`)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {monthData.month} {monthData.year}
                  </h1>
                  <p className="text-gray-600">
                    {monthData.photos?.length || 0} {t.buildingProgress.photos}, {monthData.videos?.length || 0} {t.buildingProgress.videos}
                  </p>
                  {data?.name && (
                    <p className="text-lg font-semibold text-gray-800 mt-2">
                      {data.name}
                    </p>
                  )}
                  {monthData.description && (
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                      {monthData.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Галерея */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allMedia.map((media, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
              onClick={() => openMedia(media, index)}
            >
              {media.type === 'photo' ? (
                <img
                  src={media.url}
                  alt={`${t.buildingProgress.photo} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Иконка типа медиа */}
              <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5">
                {media.type === 'photo' ? (
                  <Camera className="w-4 h-4" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </div>

              {/* Кнопка удаления */}
              {canEdit() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMedia(media.url, media.type);
                  }}
                  className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно просмотра */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <div className="absolute top-4 right-4 flex gap-2">
            {selectedMedia.type === 'video' && (
              <>
                <button
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="p-2 text-white hover:text-gray-300"
                >
                  {isVideoPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-white hover:text-gray-300"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </>
            )}
            <a
              href={selectedMedia.url}
              download
              className="p-2 text-white hover:text-gray-300"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-6 h-6" />
            </a>
            <button
              onClick={() => setSelectedMedia(null)}
              className="p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateMedia('prev');
              }}
              className="p-2 text-white hover:text-gray-300"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateMedia('next');
              }}
              className="p-2 text-white hover:text-gray-300"
              disabled={currentIndex === allMedia.length - 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-center h-full">
            {selectedMedia.type === 'photo' ? (
              <img
                src={selectedMedia.url}
                alt={t.buildingProgress.photo}
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                src={selectedMedia.url}
                className="max-h-[90vh] max-w-[90vw]"
                controls={false}
                autoPlay={isVideoPlaying}
                muted={isMuted}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BuildingProgressDetail; 