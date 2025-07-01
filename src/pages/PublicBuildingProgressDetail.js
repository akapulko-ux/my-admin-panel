import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Camera, Video } from 'lucide-react';
import { showError } from '../utils/notifications';

function PublicBuildingProgressDetail() {
  const { id, monthKey } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', id));
        if (propertyDoc.exists()) {
          const propertyData = propertyDoc.data();
          setProperty(propertyData);
          
          const monthProgress = propertyData.buildingProgress?.find(
            item => item.monthKey === monthKey
          );
          setMonthData(monthProgress);
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

  const allMedia = [
    ...(monthData?.photos || []).map(item => ({ ...item, type: 'photo' })),
    ...(monthData?.videos || []).map(item => ({ ...item, type: 'video' }))
  ].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {monthData?.month} {monthData?.year}
              </h1>
              {property && (
                <p className="text-gray-600 mt-1">
                  {property.title}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allMedia.map((media, index) => (
            <div
              key={media.url}
              className="relative bg-white rounded-lg shadow-md overflow-hidden group cursor-pointer"
              onClick={() => setSelectedMedia(media)}
            >
              {media.type === 'photo' ? (
                <img
                  src={media.url}
                  alt={media.filename}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="relative w-full h-48 bg-gray-900">
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-12 h-12 text-white opacity-75" />
                  </div>
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <div className="bg-black bg-opacity-60 rounded-full p-2">
                  {media.type === 'photo' ? (
                    <Camera className="w-4 h-4 text-white" />
                  ) : (
                    <Video className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно для просмотра */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-4xl w-full mx-4">
            {selectedMedia.type === 'photo' ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.filename}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                className="w-full h-auto max-h-[80vh]"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicBuildingProgressDetail; 