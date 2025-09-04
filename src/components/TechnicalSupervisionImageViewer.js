import React, { useState } from 'react';
import { Button } from './ui/button';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '../lib/utils';

const TechnicalSupervisionImageViewer = ({ 
  images = [], 
  isOpen, 
  onClose, 
  initialIndex = 0,
  inspectionTitle = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${inspectionTitle}_фото_${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка скачивания изображения:', error);
    }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        prevImage();
        break;
      case 'ArrowRight':
        nextImage();
        break;
      case '+':
      case '=':
        setZoom(prev => Math.min(prev + 0.2, 3));
        break;
      case '-':
        setZoom(prev => Math.max(prev - 0.2, 0.5));
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!isOpen || !images.length) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Заголовок и управление */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10">
        <div>
          <h3 className="text-lg font-semibold">{inspectionTitle}</h3>
          <p className="text-sm text-gray-300">
            {currentIndex + 1} из {images.length}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Управление масштабом */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
            className="text-white hover:bg-white/20"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-300 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
            className="text-white hover:bg-white/20"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Скачать */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Закрыть */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Навигация влево */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {/* Изображение */}
      <div className="relative max-w-[90vw] max-h-[90vh] overflow-auto">
        <img
          src={currentImage}
          alt={`${inspectionTitle} ${currentIndex + 1}`}
          className="max-w-none cursor-move"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
          onDoubleClick={() => setZoom(zoom === 1 ? 2 : 1)}
          draggable={false}
        />
      </div>

      {/* Навигация вправо */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
            {images.map((url, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                }}
                className={cn(
                  "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
                  index === currentIndex 
                    ? "border-white" 
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={url}
                  alt={`Миниатюра ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Оверлей для закрытия */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default TechnicalSupervisionImageViewer;
