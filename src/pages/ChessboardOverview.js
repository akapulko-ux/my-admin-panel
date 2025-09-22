import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Building, Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useLanguage } from '../lib/LanguageContext';
import { chessboardTranslations } from '../lib/chessboardTranslations';

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
const getStatusBadge = (status, t) => {
  switch (status) {
    case 'free':
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg">✓ {t.status.free}</Badge>;
    case 'booked':
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg">⏳ {t.status.booked}</Badge>;
    case 'sold':
      return <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg">✖ {t.status.sold}</Badge>;
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
  const { language, changeLanguage } = useLanguage();
  const t = chessboardTranslations[language];
  const [chessboard, setChessboard] = useState(null);
  const [complex, setComplex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const contentRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Считываем язык из URL при загрузке компонента
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    
    if (isFirstLoad.current) {
      // При первой загрузке: если есть lang в URL - используем его, иначе английский
      if (langFromUrl && ['ru', 'en', 'id'].includes(langFromUrl)) {
        changeLanguage(langFromUrl);
      } else if (!langFromUrl) {
        changeLanguage('en');
      }
      isFirstLoad.current = false;
    } else if (langFromUrl && ['ru', 'en', 'id'].includes(langFromUrl) && langFromUrl !== language) {
      changeLanguage(langFromUrl);
    }
  }, [changeLanguage, language]);

  useEffect(() => {
    async function fetchChessboard() {
      setLoading(true);
      try {
        const q = collection(db, "chessboards");
        const querySnapshot = await getDocs(query(q, where("publicUrl", "==", publicId)));
        
        if (querySnapshot.empty) {
          setError(t.error.notFound);
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
        setError(t.error.loading);
      } finally {
        setLoading(false);
      }
    }
    fetchChessboard();
  }, [publicId, t.error.notFound, t.error.loading]);

  // Функция для расчета масштаба
  const calculateScale = useCallback(() => {
    if (contentRef.current && chessboard) {
      const content = contentRef.current;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const scaleX = viewportWidth / contentWidth;
      const scaleY = viewportHeight / contentHeight;
      
      // Используем минимальный масштаб, но не больше 1
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale);
    }
  }, [chessboard]);

  // Обновляем масштаб при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      calculateScale();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale]);

  // Обновляем масштаб при загрузке данных
  useEffect(() => {
    if (chessboard) {
      // Используем setTimeout, чтобы дать время для рендеринга контента
      setTimeout(() => {
        calculateScale();
      }, 100);
    }
  }, [chessboard, calculateScale]);

  // Дополнительный useEffect для гарантированного расчета масштаба
  useEffect(() => {
    const timer = setInterval(() => {
      if (contentRef.current && chessboard) {
        calculateScale();
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [chessboard, calculateScale]);

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
            <p className="text-gray-400">{t.error.checkLink}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chessboard) return null;

  return (
    <div className="fixed inset-0 bg-[#0f1117] overflow-hidden">
      {/* Основной контент */}
      <div className="absolute inset-0 bg-[#0f1117] overflow-auto" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
        <div 
          ref={contentRef}
          className="min-h-full flex items-start justify-start"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.3s ease'
          }}
        >
          <div className="w-fit">
            {/* Информация о комплексе */}
            {complex && (
              <Card className="mb-6 bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate(`/public-chessboard/${publicId}?lang=${language}`)}
                      className="text-white hover:bg-[#2a2e36] p-6"
                    >
                      <ArrowLeft className="w-24 h-24" />
                    </Button>
                    <Building className="w-8 h-8 text-blue-400" />
                    <div className="flex-1">
                      <h2 className="text-2xl text-white">{complex.name}</h2>
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
                        .map((floor, floorIdx) => (
                          <div key={floorIdx} className="border rounded-lg p-4 bg-[#1a1d24]/50 border-[#2a2e36]">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-semibold text-white">
                                {floor.floor && String(floor.floor).trim() !== '' ? (
                                  `${floor.type ? t.unit[floor.type === 'этаж' ? 'floor' : 'row'] : t.unit.floor} ${floor.floor}`
                                ) : ''}
                              </span>
                            </div>

                            <div className="overflow-x-auto pb-4">
                              <div className="flex gap-3 min-w-max">
                              {floor.units.map((unit, unitIdx) => (
                                <Card 
                                  key={unitIdx} 
                                  className={`${getStatusColor(unit.status)} hover:shadow-lg hover:scale-105 transition-all duration-200 w-[300px] flex-shrink-0`}
                                >
                                  <CardHeader className="p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold">{unit.id}</span>
                                      <span className="font-bold">
                                        {unit.propertyType === 'Апартаменты' && t.unit.propertyTypes.apartments}
                                        {unit.propertyType === 'Вилла' && t.unit.propertyTypes.villa}
                                        {unit.propertyType === 'Апарт-вилла' && t.unit.propertyTypes.apartVilla}
                                        {unit.propertyType === 'Таунхаус' && t.unit.propertyTypes.townhouse}
                                        {unit.propertyType === 'Пентхаус' && t.unit.propertyTypes.penthouse}
                                        {!unit.propertyType && t.unit.propertyTypes.apartments}
                                      </span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-0 space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-white">
                                          {unit.floors === '1' && t.unit.floors.one}
                                          {unit.floors === '2' && t.unit.floors.two}
                                          {unit.floors === '3' && t.unit.floors.three}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-white/90">{t.unit.area}:</span>
                                        <span className="font-semibold text-white">{unit.area} {t.unit.areaUnit}</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-1">
                                          <span className="font-semibold text-white">
                                            {unit.rooms === 'Студия' && t.unit.rooms.studio}
                                            {unit.rooms === '1' && t.unit.rooms.one}
                                            {unit.rooms === '2' && t.unit.rooms.two}
                                            {unit.rooms === '3' && t.unit.rooms.three}
                                            {unit.rooms === '4' && t.unit.rooms.four}
                                            {unit.rooms === '5' && t.unit.rooms.five}
                                            {unit.rooms === '6' && t.unit.rooms.six}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="font-semibold text-white">
                                            {unit.bathrooms === '1' && t.unit.bathrooms.one}
                                            {unit.bathrooms === '2' && t.unit.bathrooms.two}
                                            {unit.bathrooms === '3' && t.unit.bathrooms.three}
                                            {unit.bathrooms === '4' && t.unit.bathrooms.four}
                                            {unit.bathrooms === '5' && t.unit.bathrooms.five}
                                            {unit.bathrooms === '6' && t.unit.bathrooms.six}
                                          </span>
                                        </div>
                                      </div>
                                      {unit.view && (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {language !== 'en' && <span className="text-white/90">{t.unit.view}</span>}
                                          <span className="font-semibold text-white">
                                            {unit.view === 'Океан' && t.unit.views.ocean}
                                            {unit.view === 'Джунгли' && t.unit.views.jungle}
                                            {unit.view === 'Бассейн' && t.unit.views.pool}
                                            {unit.view === 'Река' && t.unit.views.river}
                                            {unit.view === 'Двор' && t.unit.views.yard}
                                            {unit.view === 'Вулкан' && t.unit.views.volcano}
                                            {unit.view === 'Рисовые террасы' && t.unit.views.riceTerraces}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {unit.side && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-white">
                                          {unit.side === 'Рассветная' && t.unit.sides.sunrise}
                                          {unit.side === 'Закатная' && t.unit.sides.sunset}
                                        </span>
                                      </div>
                                    )}

                                    {unit.status === 'free' && unit.priceUSD > 0 && unit.showPrice ? (
                                      <div className="border-t border-white/20 pt-2 mt-2">
                                        <div className="flex justify-between items-start">
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
                                          {getStatusBadge(unit.status, t)}
                                        </div>
                                      </div>
                                    ) : (
                                      /* Статус - в отдельной строке если нет цены */
                                      <div className="flex justify-end pt-2 mt-2">
                                        {getStatusBadge(unit.status, t)}
                                      </div>
                                    )}
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