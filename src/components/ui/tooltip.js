import React, { useState, useEffect, useRef } from 'react';

export const AdaptiveTooltip = ({ content, children }) => {
  const [position, setPosition] = useState({ top: false, left: false });
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!tooltipRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Получаем размеры экрана
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Определяем центр элемента
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Определяем, в какую сторону открывать подсказку
      setPosition({
        top: centerY > viewportHeight / 2,
        left: centerX > viewportWidth / 2
      });
    };

    // Обновляем позицию при монтировании и изменении размера окна
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);

  return (
    <div className="relative group inline-block" ref={containerRef}>
      {children}
      <div
        ref={tooltipRef}
        className={`pointer-events-none hidden group-hover:block absolute z-50 w-48 sm:w-64 p-2 bg-white border rounded-lg shadow-lg text-xs sm:text-sm whitespace-pre-line
          ${position.top ? 'bottom-full mb-1' : 'top-full mt-1'}
          ${position.left ? 'right-0' : 'left-0'}`}
      >
        {content}
      </div>
    </div>
  );
}; 