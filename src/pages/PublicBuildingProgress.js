import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Camera,
  Video
} from 'lucide-react';
import { showError } from '../utils/notifications';

function PublicBuildingProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState([]);
  const [additionalMonths, setAdditionalMonths] = useState(0);
  const initialMonthsCount = 12;

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
        showError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            <h1 className="text-3xl font-bold text-gray-900">Building Progress</h1>
          </div>
          
          {data && (
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-800">
                {data.name}
              </h2>
            </div>
          )}
        </div>

        {/* Сетка месяцев */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {monthsData.map((monthData) => {
            const hasPhotos = monthData.photos?.length > 0;
            const hasVideos = monthData.videos?.length > 0;
            const hasContent = hasPhotos || hasVideos;

            return (
              <div
                key={monthData.monthKey}
                className={`
                  relative rounded-xl overflow-hidden shadow-sm border
                  ${hasContent ? 'border-blue-200 bg-white hover:shadow-md transition-shadow cursor-pointer' : 'border-gray-200 bg-gray-50'}
                `}
                onClick={() => {
                  if (hasContent) {
                    navigate(`/public-building-progress/complex/${id}/${monthData.monthKey}`);
                  }
                }}
              >
                {/* Миниатюра первой фотографии */}
                {monthData.photos?.length > 0 ? (
                  <div className="w-full aspect-video">
                    <img 
                      src={monthData.photos[0].url} 
                      alt={`Фото за ${monthData.month} ${monthData.year}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                )}

                <div className="p-4">
                  <div className="text-lg font-semibold mb-2">
                    {monthData.month} {monthData.year}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Camera className="w-4 h-4" />
                      <span>{monthData.photos?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <span>{monthData.videos?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PublicBuildingProgress; 