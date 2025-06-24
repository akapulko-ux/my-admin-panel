// src/pages/Chessboard.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Building, 
  Home,
  MapPin,
  DollarSign
} from "lucide-react";

// Начальные данные
const initialData = {
  sections: [
    {
      name: 'Секция A',
      floors: [
        { floor: 3, units: [
          { id: 'A3-01', rooms: 2, area: 65.5, price: 5500000, status: 'free' },
          { id: 'A3-02', rooms: 3, area: 85.2, price: 7200000, status: 'booked' },
          { id: 'A3-03', rooms: 1, area: 45.0, price: 0, status: 'sold' },
        ]},
        { floor: 2, units: [
          { id: 'A2-01', rooms: 2, area: 65.5, price: 5200000, status: 'free' },
          { id: 'A2-02', rooms: 3, area: 85.2, price: 6900000, status: 'free' },
          { id: 'A2-03', rooms: 1, area: 45.0, price: 0, status: 'sold' },
        ]},
        { floor: 1, units: [
          { id: 'A1-01', rooms: 2, area: 65.5, price: 4900000, status: 'booked' },
          { id: 'A1-02', rooms: 3, area: 85.2, price: 6600000, status: 'free' },
          { id: 'A1-03', rooms: 1, area: 45.0, price: 3800000, status: 'free' },
        ]},
      ],
    },
    {
      name: 'Секция B',
      floors: [
        { floor: 3, units: [
          { id: 'B3-01', rooms: 4, area: 120.0, price: 0, status: 'sold' },
          { id: 'B3-02', rooms: 2, area: 70.0, price: 5800000, status: 'booked' },
        ]},
        { floor: 2, units: [
          { id: 'B2-01', rooms: 4, area: 120.0, price: 9500000, status: 'free' },
          { id: 'B2-02', rooms: 2, area: 70.0, price: 5500000, status: 'free' },
        ]},
        { floor: 1, units: [
          { id: 'B1-01', rooms: 4, area: 120.0, price: 9200000, status: 'free' },
          { id: 'B1-02', rooms: 2, area: 70.0, price: 5200000, status: 'booked' },
        ]},
      ],
    },
  ],
};

// Стили статусов
const getStatusBadge = (status) => {
  switch (status) {
    case 'free':
      return <Badge className="bg-green-500 hover:bg-green-600">Свободно</Badge>;
    case 'booked':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Забронировано</Badge>;
    case 'sold':
      return <Badge className="bg-red-500 hover:bg-red-600">Продано</Badge>;
    default:
      return <Badge>Неизвестно</Badge>;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'free':
      return 'border-l-green-500 bg-green-50';
    case 'booked':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'sold':
      return 'border-l-red-500 bg-red-50';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

// Утилиты
const createDefaultUnit = () => ({
  id: `Unit-${crypto.randomUUID()}`,
  rooms: 1,
  area: 50,
  price: 5000000,
  status: 'free'
});

const createDefaultFloor = (floorNumber) => ({
  floor: floorNumber,
  units: [createDefaultUnit()]
});

const createDefaultSection = () => ({
  name: 'Новая секция',
  floors: [createDefaultFloor(1)]
});

const Chessboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState(initialData.sections);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Загрузка данных
  useEffect(() => {
    async function fetchChessboard() {
      if (id && id !== "new") {
        setLoading(true);
        try {
          const ref = doc(db, "chessboards", id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setName(data.name || "");
            setDescription(data.description || "");
            setSections(data.sections || initialData.sections);
          }
        } catch (error) {
          console.error("Ошибка загрузки:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchChessboard();
  }, [id]);

  // Обновление юнита
  const handleUnitChange = (sectionIdx, floorIdx, unitIdx, field, value) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        return {
          ...section,
          floors: section.floors.map((floor, fIdx) => {
            if (fIdx !== floorIdx) return floor;
            return {
              ...floor,
              units: floor.units.map((unit, uIdx) =>
                uIdx === unitIdx ? { ...unit, [field]: value } : unit
              )
            };
          })
        };
      })
    );
  };

  // Добавление юнита
  const addUnit = (sectionIdx, floorIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        return {
          ...section,
          floors: section.floors.map((floor, fIdx) => {
            if (fIdx !== floorIdx) return floor;
            return {
              ...floor,
              units: [...floor.units, createDefaultUnit()]
            };
          })
        };
      })
    );
  };

  // Удаление юнита
  const removeUnit = (sectionIdx, floorIdx, unitIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        return {
          ...section,
          floors: section.floors.map((floor, fIdx) => {
            if (fIdx !== floorIdx) return floor;
            if (floor.units.length <= 1) return floor;
            return {
              ...floor,
              units: floor.units.filter((_, uIdx) => uIdx !== unitIdx)
            };
          })
        };
      })
    );
  };

  // Добавление этажа
  const addFloor = (sectionIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        const maxFloor = Math.max(...section.floors.map(f => f.floor), 0);
        return {
          ...section,
          floors: [...section.floors, createDefaultFloor(maxFloor + 1)]
        };
      })
    );
  };

  // Удаление этажа
  const removeFloor = (sectionIdx, floorIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        if (section.floors.length <= 1) return section;
        return {
          ...section,
          floors: section.floors.filter((_, fIdx) => fIdx !== floorIdx)
        };
      })
    );
  };

  // Добавление секции
  const addSection = () => {
    setSections(prev => [...prev, createDefaultSection()]);
  };

  // Удаление секции
  const removeSection = (sectionIdx) => {
    if (sections.length <= 1) return;
    setSections(prev => prev.filter((_, sIdx) => sIdx !== sectionIdx));
  };

  // Сохранение
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        name,
        description,
        sections,
        updatedAt: Timestamp.now()
      };

      if (id === "new") {
        data.createdAt = Timestamp.now();
        await addDoc(collection(db, "chessboards"), data);
        alert("Шахматка создана!");
      } else {
        await updateDoc(doc(db, "chessboards", id), data);
        alert("Шахматка сохранена!");
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      alert("Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Заголовок */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">
                  {id === "new" ? "Новая шахматка" : "Редактирование шахматки"}
                </CardTitle>
                <p className="text-gray-600 mt-1">Управление планировкой объекта</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/chessboard")}>
                Назад
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название</label>
            <input
              type="text"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите название объекта"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={3} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Описание объекта"
        />
          </div>
        </CardContent>
      </Card>

      {/* Секции */}
      <div className="space-y-6">
        {sections.map((section, sectionIdx) => (
          <Card key={sectionIdx} className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Home className="w-6 h-6 text-green-600" />
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => handleUnitChange(sectionIdx, 0, 0, 'sectionName', e.target.value)}
                    className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addFloor(sectionIdx)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Этаж
                  </Button>
              {sections.length > 1 && (
                    <Button size="sm" variant="destructive" onClick={() => removeSection(sectionIdx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.floors
                  .sort((a, b) => b.floor - a.floor)
                  .map((floor, floorIdx) => (
                    <div key={floorIdx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">{floor.floor} этаж</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => addUnit(sectionIdx, floorIdx)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Юнит
                          </Button>
                          {section.floors.length > 1 && (
                            <Button size="sm" variant="destructive" onClick={() => removeFloor(sectionIdx, floorIdx)}>
                              <Trash2 className="w-4 h-4" />
                </Button>
              )}
                        </div>
                      </div>
                      
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {floor.units.map((unit, unitIdx) => (
                          <Card key={unitIdx} className={`border-l-4 ${getStatusColor(unit.status)} hover:shadow-md transition-shadow`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Edit3 className="w-4 h-4 text-gray-600" />
                                  <input
                                    type="text"
                                    value={unit.id}
                                    onChange={(e) => handleUnitChange(sectionIdx, floorIdx, unitIdx, 'id', e.target.value)}
                                    className="font-mono text-sm font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-20"
                                  />
                                </div>
                                {floor.units.length > 1 && (
                                  <Button size="sm" variant="ghost" onClick={() => removeUnit(sectionIdx, floorIdx, unitIdx)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Комнат</label>
                                    <input
                          type="number" 
                          value={unit.rooms} 
                                      onChange={(e) => handleUnitChange(sectionIdx, floorIdx, unitIdx, 'rooms', parseInt(e.target.value) || 0)}
                                      className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Площадь м²</label>
                                    <input
                          type="number" 
                                      step="0.1"
                          value={unit.area} 
                                      onChange={(e) => handleUnitChange(sectionIdx, floorIdx, unitIdx, 'area', parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Цена</label>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <input
                          type="number" 
                          value={unit.price} 
                                      onChange={(e) => handleUnitChange(sectionIdx, floorIdx, unitIdx, 'price', parseInt(e.target.value) || 0)}
                                      className="flex-1 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                                      placeholder="0"
                                    />
                                  </div>
                                  {unit.price > 0 && (
                                    <p className="text-xs text-gray-600 mt-1">{formatPrice(unit.price)}</p>
                                  )}
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Статус</label>
                                  <select
                            value={unit.status}
                                    onChange={(e) => handleUnitChange(sectionIdx, floorIdx, unitIdx, 'status', e.target.value)}
                                    className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                  >
                                    <option value="free">Свободно</option>
                                    <option value="booked">Забронировано</option>
                                    <option value="sold">Продано</option>
                                  </select>
                                </div>
                                
                                <div className="pt-2">
                                  {getStatusBadge(unit.status)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Добавить секцию */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="flex items-center justify-center py-12">
          <Button onClick={addSection} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Добавить секцию
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chessboard;