import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Building, Home, MapPin, Eye, Link as LinkIcon } from "lucide-react";
import ChessboardOverview from './ChessboardOverview';
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
const getStatusBadge = (status) => {
  switch (status) {
    case 'free':
      return <Badge className="bg-emerald-500">Свободно</Badge>;
    case 'booked':
      return <Badge className="bg-amber-500">Забронировано</Badge>;
    case 'sold':
      return <Badge className="bg-rose-500">Продано</Badge>;
    default:
      return <Badge className="bg-gray-500">Неизвестно</Badge>;
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

const PublicChessboard = ({ publicId: propPublicId }) => {
  const navigate = useNavigate();
  const { publicId: urlPublicId } = useParams();
  const publicId = propPublicId || urlPublicId;
  const { language, changeLanguage } = useLanguage();
  const t = chessboardTranslations[language];
  
  const [chessboard, setChessboard] = useState(null);
  const [complex, setComplex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const isFirstLoad = useRef(true);

  // Устанавливаем английский язык по умолчанию для публичных страниц
  useEffect(() => {
    if (isFirstLoad.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const langFromUrl = urlParams.get('lang');
      
      // Если нет параметра lang в URL, устанавливаем английский для публичных страниц
      if (!langFromUrl) {
        changeLanguage('en');
      }
      isFirstLoad.current = false;
    }
  }, [changeLanguage]);

  useEffect(() => {
    async function fetchChessboard() {
      setLoading(true);
      try {
        // Ищем шахматку по publicUrl
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">{error}</h3>
            <p className="text-gray-500">{t.error.checkLink}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chessboard) return null;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Языковой переключатель */}
        <div className="flex justify-end mb-4">
          <Select value={language} onValueChange={changeLanguage}>
            <SelectTrigger className="w-[120px]">
              <SelectValue>
                {language === 'ru' ? 'Русский' : language === 'en' ? 'English' : 'Bahasa'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="id">Bahasa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Кнопка общего обзора */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{chessboard?.name || t.chessboard}</h1>
          <Button
            onClick={() => navigate(`/chessboard-overview/${publicId}?lang=${language}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="w-5 h-5 mr-2" />
            {t.overview}
          </Button>
        </div>


        {/* Секции */}
        <div className="space-y-6">
          {chessboard.sections.map((section, sectionIdx) => (
            <Card key={sectionIdx} className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Home className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold">{section.name}</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.floors
                    .map((floor, floorIdx) => (
                      <div key={floorIdx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold">
                            {floor.floor && String(floor.floor).trim() !== '' ? (
                              `${floor.type ? t.unit[floor.type === 'этаж' ? 'floor' : 'row'] : t.unit.floor} ${floor.floor}`
                            ) : ''}
                          </span>
                        </div>

                        <div className="overflow-x-auto pb-4">
                          <div className="flex gap-3 min-w-max">
                            {floor.units.map((unit, unitIdx) => (
                              <Card key={unitIdx} className={`${getStatusColor(unit.status)} hover:shadow-lg hover:scale-105 transition-all duration-200 w-[300px]`}>
                                <CardHeader className="p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold">{unit.id}</span>
                                    <span className="font-bold">
                                      {unit.propertyType === 'Апартаменты' && t.unit.propertyTypes.apartments}
                                      {unit.propertyType === 'Вилла' && t.unit.propertyTypes.villa}
                                      {unit.propertyType === 'Апарт-вилла' && t.unit.propertyTypes.apartVilla}
                                      {unit.propertyType === 'Таунхаус' && t.unit.propertyTypes.townhouse}
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
                                        <Badge className={`
                                          ${unit.status === 'free' ? 'bg-emerald-500' : 
                                            unit.status === 'booked' ? 'bg-amber-500' : 
                                            unit.status === 'sold' ? 'bg-rose-500' : 'bg-gray-500'}
                                        `}>
                                          {unit.status === 'free' && t.status.free}
                                          {unit.status === 'booked' && t.status.booked}
                                          {unit.status === 'sold' && t.status.sold}
                                        </Badge>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Статус - в отдельной строке если нет цены */
                                    <div className="flex justify-end pt-2 mt-2">
                                      <Badge className={`
                                        ${unit.status === 'free' ? 'bg-emerald-500' : 
                                          unit.status === 'booked' ? 'bg-amber-500' : 
                                          unit.status === 'sold' ? 'bg-rose-500' : 'bg-gray-500'}
                                      `}>
                                        {unit.status === 'free' && t.status.free}
                                        {unit.status === 'booked' && t.status.booked}
                                        {unit.status === 'sold' && t.status.sold}
                                      </Badge>
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

      {/* Модальное окно общего обзора */}
      {isOverviewOpen && (
        <ChessboardOverview onClose={() => setIsOverviewOpen(false)} />
      )}
    </>
  );
};

export default PublicChessboard; 