import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Download, Share2, Trash2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

const ImageMessageView = ({ message, isFromCurrentUser, onDelete, onOpenFullScreen }) => {
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Получаем URL миниатюры из mediaURL (формат: "thumbURL||fullURL")
  const getThumbnailURL = () => {
    if (!message.mediaURL) return null;
    const components = message.mediaURL.split('||');
    return components[0] || message.mediaURL;
  };

  // Получаем полный URL изображения
  const getFullImageURL = () => {
    if (!message.mediaURL) return null;
    const components = message.mediaURL.split('||');
    return components[1] || components[0] || message.mediaURL;
  };

  const thumbnailURL = getThumbnailURL();
  const fullImageURL = getFullImageURL();

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleClick = () => {
    // Если это был долгий клик, не открываем полноэкранный режим
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }

    if (showActionButtons) {
      setShowActionButtons(false);
    } else {
      onOpenFullScreen(message);
    }
  };

  const handleMouseDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowActionButtons(true);
    }, 500); // 500ms для долгого нажатия
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowActionButtons(true);
    }, 500); // 500ms для долгого нажатия
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDownload = async () => {
    if (!fullImageURL) {
      setShowActionButtons(false);
      return;
    }

    try {
      // Простое решение - всегда сохраняем как .jpg
      const fileName = `image_${Date.now()}.jpg`;
      
      // Скачиваем изображение как blob
      const response = await fetch(fullImageURL);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке изображения');
      }

      const blob = await response.blob();
      
      // Создаем URL для blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      
      // Добавляем в DOM, кликаем и удаляем
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error('Ошибка при скачивании изображения:', error);
      
      // Fallback - открываем изображение в новой вкладке
      window.open(fullImageURL, '_blank');
    }
    
    setShowActionButtons(false);
  };

  const handleShare = async () => {
    if (!fullImageURL) {
      setShowActionButtons(false);
      return;
    }

    try {
      // Загружаем изображение как blob
      const response = await fetch(fullImageURL);
      if (!response.ok) {
        throw new Error('Ошибка при загрузке изображения');
      }

      const blob = await response.blob();
      const fileName = `image_${Date.now()}.jpg`;
      
      // Создаем файл из blob
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

      // Проверяем поддержку Web Share API с файлами
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Изображение из чата',
            text: 'Посмотрите это изображение',
            files: [file]
          });
        } catch (shareError) {
          console.log('Ошибка при попытке поделиться файлом:', shareError);
          // Fallback к копированию в буфер обмена
          await fallbackShare(fullImageURL);
        }
      } else {
        // Fallback для браузеров без поддержки Share API с файлами
        await fallbackShare(fullImageURL);
      }
    } catch (error) {
      console.error('Ошибка при подготовке изображения для обмена:', error);
      // Fallback к копированию в буфер обмена
      await fallbackShare(fullImageURL);
    }
    
    setShowActionButtons(false);
  };

  const fallbackShare = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      // Можно добавить toast уведомление о том, что ссылка скопирована
      console.log('Ссылка на изображение скопирована в буфер обмена');
    } catch (error) {
      console.log('Ошибка при копировании URL:', error);
    }
  };

  const handleDelete = () => {
    onDelete(message);
    setShowActionButtons(false);
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
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
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

        {/* Оверлей с кнопками действий */}
        {showActionButtons && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="flex gap-4">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t.fixationChat.downloadImage}
                </Button>
                
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {t.fixationChat.shareImage}
                </Button>
                
                {isFromCurrentUser && (
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.fixationChat.deleteImage}
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowActionButtons(false)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t.fixationChat.closeImage}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageMessageView; 