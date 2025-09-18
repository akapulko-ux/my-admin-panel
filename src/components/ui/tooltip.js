import React, { useState, useEffect, useRef } from 'react';

export const AdaptiveTooltip = ({ content, children }) => {
  const [position, setPosition] = useState({ top: false, left: false });
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const detectTouchMode = () => {
      try {
        return window.matchMedia('(hover: none), (pointer: coarse)').matches;
      } catch (e) {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      }
    };

    const updateTouchMode = () => setIsTouchMode(detectTouchMode());
    updateTouchMode();

    const mq1 = window.matchMedia('(hover: none)');
    const mq2 = window.matchMedia('(pointer: coarse)');
    const onChange = () => updateTouchMode();
    if (mq1.addEventListener) {
      mq1.addEventListener('change', onChange);
      mq2.addEventListener('change', onChange);
    } else if (mq1.addListener) {
      mq1.addListener(onChange);
      mq2.addListener(onChange);
    }

    return () => {
      if (mq1.removeEventListener) {
        mq1.removeEventListener('change', onChange);
        mq2.removeEventListener('change', onChange);
      } else if (mq1.removeListener) {
        mq1.removeListener(onChange);
        mq2.removeListener(onChange);
      }
    };
  }, []);

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

  useEffect(() => {
    if (!isTouchMode || !isOpen) return;
    const handleClickOutside = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isTouchMode, isOpen]);

  return (
    <div
      className="relative group inline-block"
      ref={containerRef}
      onClick={isTouchMode ? () => setIsOpen((v) => !v) : undefined}
    >
      {children}
      <div
        ref={tooltipRef}
        className={`pointer-events-none ${isTouchMode ? (isOpen ? 'block' : 'hidden') : 'hidden group-hover:block'} absolute z-50 w-48 sm:w-64 p-2 bg-white border rounded-lg shadow-lg text-xs sm:text-sm whitespace-pre-line
          ${position.top ? 'bottom-full mb-1' : 'top-full mt-1'}
          ${position.left ? 'right-0' : 'left-0'}`}
      >
        {content}
      </div>
    </div>
  );
}; 