import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Building, Home, MapPin, Eye, Link as LinkIcon } from "lucide-react";
import ChessboardOverview from './ChessboardOverview';
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

const PublicChessboard = ({ publicId: propPublicId }) => {
  const navigate = useNavigate();
  const { publicId: urlPublicId } = useParams();
  const publicId = propPublicId || urlPublicId;
  
  const [chessboard, setChessboard] = useState(null);
  const [complex, setComplex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);

  useEffect(() => {
    async function fetchChessboard() {
      setLoading(true);
      try {
        // Ищем шахматку по publicUrl
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
            <p className="text-gray-500">Проверьте правильность ссылки</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chessboard) return null;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Кнопка общего обзора */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{chessboard?.name || "Шахматка"}</h1>
          <Button
            onClick={() => navigate(`/chessboard-overview/${publicId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="w-5 h-5 mr-2" />
            Общий обзор
          </Button>
        </div>
        
        {/* Информация о комплексе и шахматке */}
        <div className="space-y-6 mb-6">
          {/* Карточка комплекса */}
          {complex && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building className="w-8 h-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl">{complex.name}</CardTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {complex.district && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{complex.district}</span>
                        </div>
                      )}
                      {complex.developer && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{complex.developer}</span>
                        </div>
                      )}
                      {complex.priceFrom && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Цена от: ${complex.priceFrom}</span>
                        </div>
                      )}
                      {complex.areaRange && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Площадь: {complex.areaRange}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Карточка шахматки */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">{chessboard.name || "Без названия"}</CardTitle>
                  {chessboard.description && (
                    <p className="text-gray-600 mt-1">{chessboard.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
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
                    .sort((a, b) => b.floor - a.floor)
                    .map((floor, floorIdx) => (
                      <div key={floorIdx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          {floor.floor !== null && 
                           floor.floor !== undefined && 
                           floor.floor !== '' && 
                           !isNaN(floor.floor) && (
                            <span className="font-semibold">{floor.floor} этаж</span>
                          )}
                        </div>

                        <div className="overflow-x-auto pb-4">
                          <div className="flex gap-3 min-w-max">
                            {floor.units.map((unit, unitIdx) => (
                              <Card key={unitIdx} className={`${getStatusColor(unit.status)} hover:shadow-lg hover:scale-105 transition-all duration-200 w-[300px] relative`}>
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
                                  <div className="absolute bottom-3 right-3">
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

      {/* Модальное окно общего обзора */}
      {isOverviewOpen && (
        <ChessboardOverview onClose={() => setIsOverviewOpen(false)} />
      )}
    </>
  );
};

export default PublicChessboard; 