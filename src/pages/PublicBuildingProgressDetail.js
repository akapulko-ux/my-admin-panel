import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Camera, Video } from 'lucide-react';
import { showError } from '../utils/notifications';

function PublicBuildingProgressDetail() {
  const { id, monthKey } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'complexes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          setData(fetchedData);
          
          const monthData = fetchedData.buildingProgress?.find(item => item.monthKey === monthKey);
          if (monthData) {
            setProgressData(monthData);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Data not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/public-building-progress/complex/${id}`)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {progressData.month} {progressData.year}
              </h1>
              <p className="text-gray-600">
                {progressData.photos?.length || 0} photos, {progressData.videos?.length || 0} videos
              </p>
            </div>
          </div>
          
          {data && (
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-800">
                {data.name}
              </h2>
            </div>
          )}
        </div>

        {/* Сетка медиафайлов */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {progressData.photos?.map((photo, index) => (
            <div
              key={`photo-${index}`}
              className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedMedia(photo.url);
                setMediaType('photo');
              }}
            >
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-lg px-2 py-1">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}

          {progressData.videos?.map((video, index) => (
            <div
              key={`video-${index}`}
              className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedMedia(video.url);
                setMediaType('video');
              }}
            >
              <video
                src={video.url}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-lg px-2 py-1">
                <Video className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно для просмотра медиафайлов */}
        {selectedMedia && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => {
              setSelectedMedia(null);
              setMediaType(null);
            }}
          >
            <div className="max-w-4xl w-full max-h-screen p-4">
              {mediaType === 'photo' ? (
                <img
                  src={selectedMedia}
                  alt="View photo"
                  className="w-full h-auto max-h-screen object-contain"
                />
              ) : (
                <video
                  src={selectedMedia}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-screen"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicBuildingProgressDetail; 