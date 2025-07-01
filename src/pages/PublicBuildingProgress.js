import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { 
  ChevronLeft,
  Calendar,
  Camera,
  Video
} from 'lucide-react';
import { showError } from '../utils/notifications';

function PublicBuildingProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState([]);

  // Загрузка данных объекта
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', id));
        if (propertyDoc.exists()) {
          const propertyData = propertyDoc.data();
          setProperty(propertyData);
          setProgressData(propertyData.buildingProgress || []);
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
    const extraMonths = (property?.additionalMonths || 0) * 4;
    const totalMonthsToShow = 12 + extraMonths;
    
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
          
          {property && (
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-800">{property.title}</h2>
              <p className="text-gray-600">{property.location}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {monthsData.map((monthData) => {
              const totalPhotos = monthData.photos.length;
              const totalVideos = monthData.videos.length;
              const hasContent = totalPhotos > 0 || totalVideos > 0;

              return hasContent ? (
                <div
                  key={monthData.monthKey}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gray-900 text-white">
                    {monthData.photos.length > 0 && (
                      <img
                        src={monthData.photos[0].url}
                        alt={`${monthData.month} ${monthData.year}`}
                        className="w-full h-full object-cover"
                      />
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
                    <button
                      onClick={() => navigate(`/public-building-progress/${id}/${monthData.monthKey}`)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Просмотр
                    </button>
                    
                    <div className="mt-2 text-center text-xs text-gray-600">
                      {totalPhotos > 0 && `${totalPhotos} фото`}
                      {totalPhotos > 0 && totalVideos > 0 && ', '}
                      {totalVideos > 0 && `${totalVideos} видео`}
                    </div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicBuildingProgress; 