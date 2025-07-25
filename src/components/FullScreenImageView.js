import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

const FullScreenImageView = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex = 0,
  onIndexChange 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    setCurrentImageIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setImageError(false);
    }
  }, [isOpen, currentImageIndex]);

  const handlePrevious = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    setCurrentImageIndex(newIndex);
    if (onIndexChange) onIndexChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    if (onIndexChange) onIndexChange(newIndex);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      default:
        break;
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleDownload = async () => {
    const currentImage = images[currentImageIndex];
    if (!currentImage) return;

    try {
      // Простое решение - всегда сохраняем как .jpg
      const fileName = `image_${Date.now()}.jpg`;
      
      // Скачиваем изображение как blob
      const response = await fetch(currentImage);
      
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
      window.open(currentImage, '_blank');
    }
  };

  const handleShare = async () => {
    const currentImage = images[currentImageIndex];
    if (!currentImage) return;

    try {
      // Загружаем изображение как blob
      const response = await fetch(currentImage);
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
            title: t.fixationChat.imageShareTitle || 'Изображение',
            text: t.fixationChat.imageShareText || 'Посмотрите это изображение',
            files: [file]
          });
        } catch (shareError) {
          console.log('Ошибка при попытке поделиться файлом:', shareError);
          // Fallback к копированию в буфер обмена
          await fallbackShare(currentImage);
        }
      } else {
        // Fallback для браузеров без поддержки Share API с файлами
        await fallbackShare(currentImage);
      }
    } catch (error) {
      console.error('Ошибка при подготовке изображения для обмена:', error);
      // Fallback к копированию в буфер обмена
      await fallbackShare(currentImage);
    }
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

  const currentImage = images[currentImageIndex];

  if (!isOpen || !currentImage) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-black border-0">
        <div 
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{ margin: 0, padding: 0 }}
        >
          {/* Кнопка закрытия */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 hover:text-white bg-black/50 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Кнопка "Назад" */}
          {images && images.length > 1 && (
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20 hover:text-white bg-black/50 rounded-full"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Кнопка "Вперед" */}
          {images && images.length > 1 && (
            <Button
              onClick={handleNext}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20 hover:text-white bg-black/50 rounded-full"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Счетчик изображений */}
          {images && images.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-white bg-black/50 px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Кнопки действий */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
            <Button
              onClick={handleDownload}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white bg-black/50 rounded-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {t.fixationChat.downloadImage}
            </Button>
            
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white bg-black/50 rounded-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t.fixationChat.shareImage}
            </Button>
          </div>

          {/* Изображение */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            
            {imageError ? (
              <div className="text-white text-center">
                <p className="text-lg">{t.fixationChat.imageError}</p>
                <p className="text-sm opacity-75">{t.fixationChat.imageLoadError}</p>
              </div>
            ) : (
              <img
                src={currentImage}
                alt={`Изображение ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain cursor-pointer"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ 
                  display: isLoading ? 'none' : 'block',
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  width: 'auto',
                  height: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenImageView; 