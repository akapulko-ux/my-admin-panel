import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Building, Home, MapPin, ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "../components/ui/button";

// Утилиты для форматирования
const formatPrice = (priceIDR) => {
  if (!priceIDR || priceIDR === 0) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(priceIDR);
};

const formatPriceUSD = (priceUSD) => {
  if (!priceUSD || priceUSD === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(priceUSD);
};

// Компонент статуса
const getStatusBadge = (status) => {
  switch (status) {
    case 'free':
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg">✓ Свободно</Badge>;
    case 'booked':
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg">⏳ Забронировано</Badge>;
    case 'sold':
      return <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg">✖ Продано</Badge>;
    default:
      return <Badge className="bg-gray-500 text-white">❓ Неизвестно</Badge>;
  }
};

// Стили статусов
const getStatusColor = (status) => {
  switch (status) {
    case 'free':
      return 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-2 border-emerald-600 shadow-lg shadow-emerald-200';
    case 'booked':
      return 'bg-gradient-to-br from-amber-400 to-amber-500 text-white border-2 border-amber-600 shadow-lg shadow-amber-200';
    case 'sold':
      return 'bg-gradient-to-br from-rose-400 to-rose-500 text-white border-2 border-rose-600 shadow-lg shadow-rose-200';
    default:
      return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white border-2 border-gray-600 shadow-lg shadow-gray-200';
  }
};

const ChessboardOverview = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const [chessboard, setChessboard] = useState(null);
  const [complex, setComplex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const contentRef = useRef(null);

  useEffect(() => {
    async function fetchChessboard() {
      setLoading(true);
      try {
        const q = collection(db, "chessboards");
        const querySnapshot = await getDocs(query(q, where("publicUrl", "==", publicId)));
        
        if (querySnapshot.empty) {
          setError("Шахматка не найдена");
          return;
        }

        const chessboardData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        setChessboard(chessboardData);

        // Если есть привязанный комплекс, загружаем его данные
        if (chessboardData.complexId) {
          const complexDoc = await getDoc(doc(db, "complexes", chessboardData.complexId));
          if (complexDoc.exists()) {
            setComplex(complexDoc.data());
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки:", error);
        setError("Ошибка при загрузке шахматки");
      } finally {
        setLoading(false);
      }
    }
    fetchChessboard();
  }, [publicId]);

  // Функция для расчета масштаба
  const calculateScale = () => {
    if (contentRef.current && chessboard) {
      const content = contentRef.current;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight - 64; // Высота минус высота шапки

      // Учитываем отступы (меньше на мобильных)
      const padding = window.innerWidth <= 768 ? 16 : 32; // 8px с каждой стороны на мобильных, 16px на десктопе
      const availableWidth = viewportWidth - padding;
      const availableHeight = viewportHeight - padding;

      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;
      
      // Используем минимальный масштаб, но не больше 1
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale);
    }
  };

  // Обновляем масштаб при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      calculateScale();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chessboard]);

  // Обновляем масштаб при загрузке данных
  useEffect(() => {
    if (chessboard) {
      // Используем setTimeout, чтобы дать время для рендеринга контента
      setTimeout(() => {
        calculateScale();
      }, 100);
    }
  }, [chessboard]);

  // Дополнительный useEffect для гарантированного расчета масштаба
  useEffect(() => {
    const timer = setInterval(() => {
      if (contentRef.current && chessboard) {
        calculateScale();
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [contentRef.current, chessboard]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-blue-600 border-b-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="w-full max-w-lg bg-gray-800 text-white">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">{error}</h3>
            <p className="text-gray-400">Проверьте правильность ссылки</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chessboard) return null;

  return (
    <div className="fixed inset-0 bg-[#0f1117] overflow-hidden">
      {/* Верхняя панель */}
      <div className="absolute top-0 left-0 right-0 bg-[#1a1d24] h-16 shadow-lg z-50 flex items-center px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/public/${publicId}`)}
          className="text-white hover:bg-[#2a2e36]"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Вернуться к шахматке
        </Button>
        <h1 className="text-xl font-semibold text-white truncate ml-4">
          {chessboard.name || "Без названия"}
        </h1>
      </div>

      {/* Основной контент */}
      <div className="absolute inset-0 top-16 bg-[#0f1117] overflow-auto" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
        <div 
          className="min-w-fit transform-gpu"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            padding: '16px',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}
        >
          <div ref={contentRef} className="w-fit">
            {/* Информация о комплексе */}
            {complex && (
              <Card className="mb-6 bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Building className="w-8 h-8 text-blue-400" />
                    <div className="flex-1">
                      <h2 className="text-2xl text-white">{complex.name}</h2>
                      <div className="flex flex-col gap-2 mt-4">
                        {complex.district && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{complex.district}</span>
                          </div>
                        )}
                        {complex.developer && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{complex.developer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Секции */}
            <div className="space-y-6">
              {chessboard.sections.map((section, sectionIdx) => (
                <Card key={sectionIdx} className="border border-[#2a2e36] bg-[#1a1d24] w-fit">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Home className="w-6 h-6 text-green-400" />
                      <h3 className="text-xl text-white">{section.name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.floors
                        .sort((a, b) => b.floor - a.floor)
                        .map((floor, floorIdx) => (
                          <div key={floorIdx} className="border rounded-lg p-4 bg-[#1a1d24]/50 border-[#2a2e36]">
                            <div className="flex items-center gap-2 mb-4">
                              <MapPin className="w-5 h-5 text-blue-400" />
                              {floor.floor !== null && 
                               floor.floor !== undefined && 
                               floor.floor !== '' && 
                               !isNaN(floor.floor) && (
                                <span className="font-semibold text-white">{floor.floor} этаж</span>
                              )}
                            </div>

                            <div className="overflow-x-auto pb-4">
                              <div className="flex gap-3 min-w-max">
                              {floor.units.map((unit, unitIdx) => (
                                <Card 
                                  key={unitIdx} 
                                  className={`${getStatusColor(unit.status)} hover:shadow-lg hover:scale-105 transition-all duration-200 w-[300px] relative flex-shrink-0`}
                                >
                                  <CardHeader className="p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold">{unit.id}</span>
                                      <span className="font-bold">{unit.propertyType || 'Апартаменты'}</span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-0 space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-white">
                                          {unit.floors === '1' && '1 этаж'}
                                          {unit.floors === '2' && '2 этажа'}
                                          {unit.floors === '3' && '3 этажа'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-white/90">Площадь:</span>
                                        <span className="font-semibold text-white">{unit.area} м²</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-white">
                                          {unit.rooms === 'Студия' && 'Студия'}
                                          {unit.rooms === '1' && '1 спальня'}
                                          {unit.rooms === '2' && '2 спальни'}
                                          {unit.rooms === '3' && '3 спальни'}
                                          {unit.rooms === '4' && '4 спальни'}
                                          {unit.rooms === '5' && '5 спален'}
                                          {unit.rooms === '6' && '6 спален'}
                                        </span>
                                      </div>
                                      {unit.view && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-white/90">Вид</span>
                                          <span className="font-semibold text-white">
                                            {unit.view === 'Море' && 'на море'}
                                            {unit.view === 'Лес' && 'на лес'}
                                            {unit.view === 'Бассейн' && 'на бассейн'}
                                            {unit.view === 'Река' && 'на реку'}
                                            {unit.view === 'Двор' && 'во двор'}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-white">
                                          {(unit.bathrooms || '1') === '1' && '1 санузел'}
                                          {unit.bathrooms === '2' && '2 санузла'}
                                          {unit.bathrooms === '3' && '3 санузла'}
                                          {unit.bathrooms === '4' && '4 санузла'}
                                          {unit.bathrooms === '5' && '5 санузлов'}
                                          {unit.bathrooms === '6' && '6 санузлов'}
                                        </span>
                                      </div>
                                    </div>

                                    {unit.status === 'free' && unit.priceUSD > 0 && (
                                      <div className="border-t border-white/20 pt-2 mt-2">
                                        <div className="space-y-1">
                                          <p className="font-semibold text-white text-lg">
                                            {formatPriceUSD(unit.priceUSD)}
                                          </p>
                                          {unit.showPriceIDR && (
                                            <p className="text-yellow-200 font-bold">
                                              {formatPrice(unit.priceIDR)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Статус в правом нижнем углу */}
                                    <div className="absolute bottom-3 right-3 z-10">
                                      {getStatusBadge(unit.status)}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessboardOverview; 