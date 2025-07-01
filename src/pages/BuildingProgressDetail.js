import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Download,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { showError, showSuccess } from '../utils/notifications';

function BuildingProgressDetail() {
  const { id, monthKey } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [property, setProperty] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allMedia, setAllMedia] = useState([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Проверка прав доступа
  const canEdit = () => {
    return ['admin', 'модератор', 'застройщик'].includes(role);
  };

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', id));
        if (propertyDoc.exists()) {
          const propertyData = propertyDoc.data();
          setProperty(propertyData);
          
          const progressData = propertyData.buildingProgress || [];
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
        showError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, monthKey]);

  // Удаление медиа файла
  const handleDeleteMedia = async (mediaUrl, mediaType) => {
    if (!canEdit()) {
      showError('У вас нет прав для удаления файлов');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      const propertyDoc = await getDoc(doc(db, 'properties', id));
      if (propertyDoc.exists()) {
        const propertyData = propertyDoc.data();
        const progressData = propertyData.buildingProgress || [];
        
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

        await updateDoc(doc(db, 'properties', id), {
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

        showSuccess('Файл удален');
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      showError('Ошибка удаления файла');
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
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!monthData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Данные не найдены</h2>
          <button
            onClick={() => navigate(`/building-progress/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Вернуться к прогрессу строительства
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
                onClick={() => navigate(`/building-progress/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {monthData.month} {monthData.year}
                </h1>
                {property && (
                  <p className="text-gray-600">{property.title}</p>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {allMedia.length} файлов
            </div>
          </div>
        </div>
      </div>

      {/* Сетка медиа файлов */}
      <div className="max-w-7xl mx-auto p-6">
        {allMedia.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Нет загруженных файлов для этого месяца</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allMedia.map((media, index) => (
              <div
                key={index}
                className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => openMedia(media, index)}
              >
                {media.type === 'photo' ? (
                  <img
                    src={media.url}
                    alt={`${monthData.month} ${monthData.year} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Действия при наведении */}
                {canEdit() && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(media.url, media.type);
                      }}
                      className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Полноэкранный просмотр */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Кнопка закрытия */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Навигация */}
            {currentIndex > 0 && (
              <button
                onClick={() => navigateMedia('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {currentIndex < allMedia.length - 1 && (
              <button
                onClick={() => navigateMedia('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Контент */}
            {selectedMedia.type === 'photo' ? (
              <img
                src={selectedMedia.url}
                alt={`${monthData.month} ${monthData.year}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="relative">
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  muted={isMuted}
                  className="max-w-full max-h-full"
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
              </div>
            )}

            {/* Информация */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
              <div className="text-sm">
                {currentIndex + 1} из {allMedia.length}
              </div>
              <div className="text-lg font-semibold">
                {monthData.month} {monthData.year}
              </div>
              {selectedMedia.filename && (
                <div className="text-sm opacity-75">
                  {selectedMedia.filename}
                </div>
              )}
            </div>

            {/* Действия */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <a
                href={selectedMedia.url}
                download
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
              >
                <Download className="w-5 h-5" />
              </a>
              
              {canEdit() && (
                <button
                  onClick={() => handleDeleteMedia(selectedMedia.url, selectedMedia.type)}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuildingProgressDetail; 