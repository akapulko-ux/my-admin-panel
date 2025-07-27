import React, { useState } from 'react';
import { Card } from './ui/card';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

const ImageMessageView = ({ message, isFromCurrentUser, onDelete, onOpenFullScreen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  // Получаем URL миниатюры из mediaURL (формат: "thumbURL||fullURL")
  const getThumbnailURL = () => {
    if (!message.mediaURL) return null;
    const components = message.mediaURL.split('||');
    return components[0] || message.mediaURL;
  };

  const thumbnailURL = getThumbnailURL();

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleClick = () => {
    onOpenFullScreen(message);
  };



  if (!thumbnailURL) {
    return null;
  }

  return (
    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="relative">
        <Card 
          className={`max-w-[200px] p-2 cursor-pointer transition-transform hover:scale-105 ${
            isFromCurrentUser ? 'bg-blue-500' : 'bg-gray-100'
          }`}
          onClick={handleClick}
        >
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            )}
            
            {imageError ? (
              <div className="w-[150px] h-[150px] flex items-center justify-center bg-gray-200 rounded-lg">
                <span className="text-gray-500 text-sm">{t.fixationChat.imageError}</span>
              </div>
            ) : (
              <img
                src={thumbnailURL}
                alt="Изображение"
                className="w-[150px] h-[150px] object-cover rounded-lg"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            )}
          </div>
        </Card>


      </div>
    </div>
  );
};

export default ImageMessageView; 