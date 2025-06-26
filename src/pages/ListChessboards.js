import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Building, 
  Home,
  Eye,
  Calendar,
  Link as LinkIcon,
  Users
} from 'lucide-react';

const ListChessboards = () => {
  const navigate = useNavigate();
  const [chessboards, setChessboards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загрузка списка шахматок
  useEffect(() => {
    fetchChessboards();
  }, []);

  const fetchChessboards = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "chessboards"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const chessboardsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChessboards(chessboardsData);
    } catch (error) {
      console.error("Ошибка загрузки шахматок:", error);
    } finally {
      setLoading(false);
    }
  };

  // Удаление шахматки
  const handleDelete = async (id, name) => {
    if (window.confirm(`Вы уверены, что хотите удалить шахматку "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "chessboards", id));
        setChessboards(prev => prev.filter(item => item.id !== id));
        alert("Шахматка удалена!");
      } catch (error) {
        console.error("Ошибка удаления:", error);
        alert("Ошибка при удалении шахматки");
      }
    }
  };

  // Подсчёт статистики по шахматке
  const getChessboardStats = (sections) => {
    if (!sections || !Array.isArray(sections)) {
      return { totalUnits: 0, freeUnits: 0, bookedUnits: 0, soldUnits: 0, totalFloors: 0 };
    }

    let totalUnits = 0;
    let freeUnits = 0;
    let bookedUnits = 0;
    let soldUnits = 0;
    let totalFloors = 0;

    sections.forEach(section => {
      if (section.floors && Array.isArray(section.floors)) {
        totalFloors += section.floors.length;
        section.floors.forEach(floor => {
          if (floor.units && Array.isArray(floor.units)) {
            floor.units.forEach(unit => {
              totalUnits++;
              switch (unit.status) {
                case 'free':
                  freeUnits++;
                  break;
                case 'booked':
                  bookedUnits++;
                  break;
                case 'sold':
                  soldUnits++;
                  break;
                default:
                  break;
              }
            });
          }
        });
      }
    });

    return { totalUnits, freeUnits, bookedUnits, soldUnits, totalFloors };
  };

  // Форматирование даты
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric"
    });
  };

  // Копирование публичной ссылки
  const copyPublicLink = (publicUrl) => {
    const link = `${window.location.origin}/public/${publicUrl}`;
    navigator.clipboard.writeText(link);
    alert("Публичная ссылка скопирована!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Шахматки</h1>
        <Button
          onClick={() => navigate('/chessboard/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Создать шахматку
        </Button>
      </div>

      {/* Список шахматок */}
      {chessboards.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Нет созданных шахматок</h3>
            <p className="text-gray-500 mb-6">Создайте первую шахматку для управления планировкой объекта</p>
            <Button 
              onClick={() => navigate('/chessboard/new')} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать первую шахматку
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chessboards.map((chessboard) => {
            const stats = getChessboardStats(chessboard.sections);
            return (
              <Card key={chessboard.id} className="mb-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{chessboard.name || "Без названия"}</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(chessboard.id, chessboard.name)}
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Статистика */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-600">Всего юнитов:</span>
                        <span className="font-semibold ml-[4px]">{stats.totalUnits}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600">Секций:</span>
                        <span className="font-semibold ml-[4px]">
                          {chessboard.sections ? chessboard.sections.length : 0}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600">Этажей:</span>
                        <span className="font-semibold ml-[4px]">{stats.totalFloors}</span>
                      </div>
                    </div>

                    {/* Статусы */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                        Свободно: {stats.freeUnits}
                      </Badge>
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                        Забронировано: {stats.bookedUnits}
                      </Badge>
                      <Badge className="bg-red-500 hover:bg-red-600 text-xs">
                        Продано: {stats.soldUnits}
                      </Badge>
                    </div>

                    {/* Публичная ссылка */}
                    {chessboard.publicUrl && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-3 mb-3">
                        <LinkIcon className="w-3 h-3" />
                        <span className="flex-1">Публичная ссылка доступна</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyPublicLink(chessboard.publicUrl)}
                            title="Копировать ссылку"
                          >
                            <LinkIcon className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/public/${chessboard.publicUrl}`, '_blank')}
                            title="Открыть в новой вкладке"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Дата создания */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-3">
                      <Calendar className="w-3 h-3" />
                      <span>Создано: {formatDate(chessboard.createdAt)}</span>
                    </div>

                    {/* Кнопка просмотра */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/chessboard/${chessboard.id}`)}
                      className="w-full mt-3"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Открыть
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListChessboards; 