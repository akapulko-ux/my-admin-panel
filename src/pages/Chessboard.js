// src/pages/Chessboard.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc
} from "firebase/firestore";
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
  DollarSign,
  Copy,
  GripVertical,
  AlertCircle
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../AuthContext';
import { showError, showSuccess } from '../utils/notifications';
import ConfirmDialog from '../components/ConfirmDialog';

// Создаем пустые структуры данных
// eslint-disable-next-line no-unused-vars
const createDefaultUnit = () => ({
  id: crypto.randomUUID().substring(0, 8),
  rooms: '',
  bathrooms: '1',
  floors: '',
  area: 0,
  priceUSD: 0,
  priceIDR: 0,
  showPriceIDR: false,
  status: 'free',
  propertyType: '',
  view: ''
});

const createDefaultSection = () => ({
  name: '',
  floors: []
});

// Начальное состояние - одна пустая секция
// eslint-disable-next-line no-unused-vars
const initialData = {
  sections: [createDefaultSection()]
};

// Стили статусов (яркие цвета)
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

const getPropertyTypeBadge = (propertyType) => {
  switch (propertyType) {
    case 'Апартаменты':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">🏢 Апартаменты</Badge>;
    case 'Вилла':
      return <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-xs">🏖️ Вилла</Badge>;
    case 'Апарт-вилла':
      return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs">🏘️ Апарт-вилла</Badge>;
    case 'Таунхаус':
      return <Badge className="bg-teal-500 hover:bg-teal-600 text-white text-xs">🏘️ Таунхаус</Badge>;
    default:
      return <Badge className="bg-gray-500 text-white text-xs">🏢 Апартаменты</Badge>;
  }
};

const getViewBadge = (view) => {
  switch (view) {
    case 'Море':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">🌊 Море</Badge>;
    case 'Река':
      return <Badge className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs">🌊 Река</Badge>;
    case 'Лес':
      return <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">🌳 Лес</Badge>;
    case 'Бассейн':
      return <Badge className="bg-sky-500 hover:bg-sky-600 text-white text-xs">🏊‍♂️ Бассейн</Badge>;
    case 'Двор':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs">🏡 Двор</Badge>;
    default:
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">🌊 Море</Badge>;
  }
};

// Новые функции валидации
// eslint-disable-next-line no-unused-vars
const validateChessboard = (data) => {
  const errors = [];
  
  // Проверка основных полей
  if (!data.name?.trim()) {
    errors.push("Название шахматки обязательно");
  }
  
  if (!data.sections?.length) {
    errors.push("Должна быть хотя бы одна секция");
  }
  
  // Проверка секций
  data.sections?.forEach((section, sIdx) => {
    if (!section.name?.trim()) {
      errors.push(`Секция ${sIdx + 1}: название обязательно`);
    }
    
    // Проверка этажей
    const floorNumbers = new Set();
    section.floors?.forEach((floor, fIdx) => {
      // Проверяем только если номер этажа указан
      if (floor.floor !== null && floor.floor !== undefined && floor.floor !== '') {
        if (floorNumbers.has(floor.floor)) {
          errors.push(`Секция ${sIdx + 1}: дублирование этажа ${floor.floor}`);
        }
        floorNumbers.add(floor.floor);
      }
      
      // Проверка юнитов
      floor.units?.forEach((unit, uIdx) => {
        if (!unit.id?.trim()) {
          errors.push(`Секция ${sIdx + 1}, Этаж ${floor.floor || 'без номера'}, Юнит ${uIdx + 1}: ID обязателен`);
        }
        if (unit.area !== null && unit.area !== undefined && (isNaN(unit.area) || unit.area <= 0)) {
          errors.push(`Секция ${sIdx + 1}, Этаж ${floor.floor || 'без номера'}, Юнит ${unit.id}: некорректная площадь`);
        }
        if (unit.priceUSD !== null && unit.priceUSD !== undefined && (isNaN(unit.priceUSD) || unit.priceUSD < 0)) {
          errors.push(`Секция ${sIdx + 1}, Этаж ${floor.floor || 'без номера'}, Юнит ${unit.id}: некорректная цена`);
        }
      });
    });
  });
  
  return errors;
};

// Функция для обработки ошибок Firestore
// eslint-disable-next-line no-unused-vars
const handleFirestoreError = (error) => {
  console.error("Детали ошибки:", error);
  
  if (error.code === 'permission-denied') {
    return "У вас нет прав для выполнения этой операции";
  }
  if (error.code === 'not-found') {
    return "Шахматка не найдена";
  }
  if (error.code === 'failed-precondition') {
    return "Операция не может быть выполнена в текущем состоянии";
  }
  if (error.code === 'resource-exhausted') {
    return "Превышен лимит запросов. Попробуйте позже";
  }
  
  return "Произошла ошибка при сохранении. Попробуйте еще раз";
};

// Генерация уникального ID для публичной ссылки
// eslint-disable-next-line no-unused-vars
const generatePublicId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Компонент для перетаскиваемой секции
const SortableSection = ({ 
  section, 
  sectionIdx, 
  children, 
  onNameChange,
  onAddFloor,
  onRemoveSection,
  canRemoveSection
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `section-${sectionIdx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-6 h-6 text-gray-400" />
            </div>
            <Home className="w-6 h-6 text-green-600" />
            <input
              type="text"
              value={section.name}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAddFloor} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" />
              Этаж
            </Button>
            {canRemoveSection && (
              <Button size="sm" variant="destructive" onClick={onRemoveSection}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {children}
    </Card>
  );
};

// Компонент для перетаскиваемого этажа
const SortableFloor = ({ 
  floor, 
  sectionIdx, 
  floorIdx, 
  children, 
  onFloorChange,
  onAddUnit,
  onRemoveFloor,
  canRemoveFloor
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `floor-${sectionIdx}-${floorIdx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <MapPin className="w-5 h-5 text-blue-600" />
          <input
            type="number"
            value={floor.floor === null ? '' : floor.floor}
            onChange={(e) => onFloorChange(e.target.value)}
            className="font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-16 text-center"
            placeholder="Без номера"
          />
          <span className="font-semibold">этаж</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onAddUnit}>
            <Plus className="w-4 h-4 mr-1" />
            Юнит
          </Button>
          {canRemoveFloor && (
            <Button size="sm" variant="destructive" onClick={onRemoveFloor}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

// Компонент для перетаскиваемого юнита
const SortableUnit = ({ 
  unit, 
  sectionIdx, 
  floorIdx, 
  unitIdx, 
  onUnitChange, 
  getStatusColor,
  onCopyUnit,
  onRemoveUnit,
  canRemoveUnit,
  exchangeRate,
  formatPrice,
  formatPriceUSD,
  onExchangeRateChange
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `unit-${sectionIdx}-${floorIdx}-${unitIdx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRateSubmit = (e) => {
    e.preventDefault();
    onExchangeRateChange(tempRate);
    setIsEditingRate(false);
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      id={`unit-${sectionIdx}-${floorIdx}-${unitIdx}`}
      className={`${getStatusColor(unit.status)} hover:shadow-lg hover:scale-105 transition-all duration-200 w-[300px]`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-white/60" />
            </div>
            <Edit3 className="w-4 h-4 text-gray-600" />
            <input
              type="text"
              value={unit.id}
              onChange={(e) => onUnitChange('id', e.target.value)}
              className="font-mono text-sm font-bold bg-white/90 text-gray-900 border border-white/50 rounded px-2 py-1 focus:border-white focus:ring-2 focus:ring-white/50 outline-none w-20"
            />
          </div>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onCopyUnit}
              className="hover:bg-white/20"
            >
              <Copy className="w-3 h-3" />
            </Button>
            {canRemoveUnit && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onRemoveUnit}
                className="hover:bg-white/20"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <select
              value={unit.propertyType || 'Апартаменты'}
              onChange={(e) => onUnitChange('propertyType', e.target.value)}
              className="w-full px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white text-sm font-bold mb-3"
            >
              <option value="Апартаменты">🏢 Апартаменты</option>
              <option value="Вилла">🏖️ Вилла</option>
              <option value="Апарт-вилла">🏘️ Апарт-вилла</option>
              <option value="Таунхаус">🏘️ Таунхаус</option>
            </select>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label className="block text-xs text-white/90 font-semibold mb-1">Этажность</label>
                <select
                  value={unit.floors || '1'} 
                  onChange={(e) => onUnitChange('floors', e.target.value)}
                  className="w-full px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white text-sm font-bold"
                >
                  <option value="1">🏢 1</option>
                  <option value="2">🏢 2</option>
                  <option value="3">🏢 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/90 font-semibold mb-1">Площадь м²</label>
                <input
                  type="number"
                  step="0.1"
                  value={unit.area === null ? '' : unit.area}
                  onChange={(e) => onUnitChange('area', e.target.value)}
                  className="w-full px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white"
                  placeholder="0.0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label className="block text-xs text-white/90 font-semibold mb-1">Спальни</label>
                  <select
                    value={unit.rooms} 
                    onChange={(e) => onUnitChange('rooms', e.target.value)}
                    className="w-full px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white text-sm font-bold"
                  >
                    <option value="Студия">🏠 Студия</option>
                    <option value="1">🛏️ 1</option>
                    <option value="2">🛏️ 2</option>
                    <option value="3">🛏️ 3</option>
                    <option value="4">🛏️ 4</option>
                    <option value="5">🛏️ 5</option>
                    <option value="6">🛏️ 6</option>
                  </select>
              </div>
              <div>
                <label className="block text-xs text-white/90 font-semibold mb-1">Санузлы</label>
                  <select
                    value={unit.bathrooms || '1'} 
                    onChange={(e) => onUnitChange('bathrooms', e.target.value)}
                    className="w-full px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white text-sm font-bold"
                  >
                    <option value="1">🚿 1</option>
                    <option value="2">🚿 2</option>
                    <option value="3">🚿 3</option>
                    <option value="4">🚿 4</option>
                    <option value="5">🚿 5</option>
                    <option value="6">🚿 6</option>
                  </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label className="block text-xs text-white/90 font-semibold mb-1">Вид из окна</label>
                  <select
                    value={unit.view || ''} 
                    onChange={(e) => onUnitChange('view', e.target.value)}
                    className="w-full px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white text-sm font-bold"
                  >
                    <option value="">❓ Не указан</option>
                    <option value="Море">🌊 Море</option>
                    <option value="Река">🌊 Река</option>
                    <option value="Лес">🌳 Лес</option>
                    <option value="Бассейн">🏊‍♂️ Бассейн</option>
                    <option value="Двор">🏡 Двор</option>
                  </select>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-white/90 font-semibold mb-1">
              Цена (USD → IDR) 
              {isEditingRate ? (
                <form onSubmit={handleRateSubmit} className="inline-flex items-center ml-1">
                  <span className="text-yellow-200 font-bold">1:</span>
                  <input
                    type="number"
                    value={tempRate}
                    onChange={(e) => setTempRate(parseFloat(e.target.value) || 0)}
                    onBlur={handleRateSubmit}
                    autoFocus
                    className="w-20 px-1 py-0.5 bg-white/20 text-yellow-200 font-bold border border-yellow-200/50 rounded focus:outline-none focus:ring-1 focus:ring-yellow-200"
                  />
                </form>
              ) : (
                <button
                  onClick={() => setIsEditingRate(true)}
                  className="text-yellow-200 font-bold hover:text-yellow-300 cursor-pointer ml-1"
                >
                  1:{exchangeRate.toLocaleString()}
                </button>
              )}
            </label>
            
            {/* Ввод в долларах */}
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <input
                type="number"
                value={unit.priceUSD === null ? '' : unit.priceUSD}
                onChange={(e) => {
                  const priceUSD = parseFloat(e.target.value) || 0;
                  onUnitChange('priceUSD', priceUSD);
                  onUnitChange('priceIDR', priceUSD * exchangeRate);
                }}
                className="flex-1 px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white"
                placeholder="0"
              />
            </div>
            
            {/* Отображение в рупиях */}
            {unit.priceUSD > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-white/95 font-semibold">
                  <strong>USD:</strong> {formatPriceUSD(unit.priceUSD)}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-yellow-200 font-bold">
                    <strong>IDR:</strong> {formatPrice(unit.priceIDR)}
                  </p>
                  <label className="flex items-center gap-1 text-xs text-white/90">
                    <input
                      type="checkbox"
                      checked={unit.showPriceIDR}
                      onChange={(e) => onUnitChange('showPriceIDR', e.target.checked)}
                      className="w-3 h-3 rounded border-white/50 focus:ring-2 focus:ring-white/50"
                    />
                    Показывать
                  </label>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-xs text-white/90 font-semibold mb-1">Статус</label>
            <select
              value={unit.status}
              onChange={(e) => onUnitChange('status', e.target.value)}
              className="w-full px-2 py-1 bg-white/90 text-gray-900 border border-white/50 rounded focus:ring-2 focus:ring-white/50 focus:border-white text-sm font-bold"
            >
              <option value="free" className="text-emerald-800">✓ Свободно</option>
              <option value="booked" className="text-amber-800">⏳ Забронировано</option>
              <option value="sold" className="text-rose-800">✖ Продано</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Chessboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(16000);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // Состояния для работы с комплексами
  const [complexes, setComplexes] = useState([]);
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [complexError, setComplexError] = useState('');

  // Оборачиваем объекты в useMemo
  const defaultUnit = useMemo(() => ({
    id: "",
    propertyType: "Апартаменты",
    floors: "1",
    rooms: "1",
    bathrooms: "1",
    area: "",
    view: "",
    priceUSD: 0,
    priceIDR: 0,
    showPriceIDR: false,
    status: "free"
  }), []);

  const defaultFloor = useMemo(() => ({
    floor: "",
    units: []
  }), []);

  const defaultSection = useMemo(() => ({
    name: "",
    floors: []
  }), []);

  // Добавим функцию для создания записи в истории изменений
  const createHistoryRecord = async (chessboardId, action) => {
    try {
      await addDoc(collection(db, "chessboard_history"), {
        chessboardId,
        action,
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.email,
        userRole: currentUser.role
      });
    } catch (error) {
      console.error("Error creating history record:", error);
    }
  };

  // Добавим функцию для создания уведомления
  const createNotification = async (chessboardId, action) => {
    try {
      await addDoc(collection(db, "notifications"), {
        type: "chessboard",
        action,
        chessboardId,
        chessboardName: name,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        status: "unread",
        forRoles: ["admin", "застройщик"]
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Добавим функцию для настройки прав доступа
  const setupAccessRights = async (chessboardId) => {
    try {
      await setDoc(doc(db, "chessboard_access", chessboardId), {
        owners: [currentUser.uid],
        editors: [],
        viewers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid
      });
    } catch (error) {
      console.error("Error setting up access rights:", error);
    }
  };

  // Функция для обновления курса и пересчета цен
  const updateExchangeRate = (newRate) => {
    const rate = parseFloat(newRate) || 16000;
    setExchangeRate(rate);
    
    // Пересчитываем цены во всех юнитах
    setSections(prevSections => {
      return prevSections.map(section => ({
        ...section,
        floors: section.floors.map(floor => ({
          ...floor,
          units: floor.units.map(unit => ({
            ...unit,
            priceIDR: (parseFloat(unit.priceUSD) || 0) * rate
          }))
        }))
      }));
    });
  };

  // Загрузка списка доступных комплексов
  useEffect(() => {
    const loadComplexes = async () => {
      try {
        // Получаем все комплексы
        const complexesSnapshot = await getDocs(collection(db, "complexes"));
        const allComplexes = complexesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));

        // Получаем все шахматки, чтобы проверить какие комплексы уже имеют шахматку
        const chessboardsSnapshot = await getDocs(collection(db, "chessboards"));
        const usedComplexIds = new Set(
          chessboardsSnapshot.docs
            .map(doc => doc.data().complexId)
            .filter(Boolean)
        );

        // Фильтруем комплексы, оставляя только те, у которых нет шахматки
        const availableComplexes = allComplexes.filter(complex => !usedComplexIds.has(complex.id));
        
        setComplexes(availableComplexes);
      } catch (error) {
        console.error("Ошибка загрузки комплексов:", error);
        setComplexError("Ошибка загрузки списка комплексов");
      }
    };

    if (!id || id === 'new') {
      loadComplexes();
    }
  }, [id]);

  // Загрузка данных шахматки
  useEffect(() => {
    const loadChessboard = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "chessboards", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Если есть привязанный комплекс, загружаем его данные
          if (data.complexId) {
            const complexDoc = await getDoc(doc(db, "complexes", data.complexId));
            if (complexDoc.exists()) {
              const complexData = complexDoc.data();
              setName(complexData.name || "");
            }
          }
          
          setDescription(data.description || "");
          setSelectedComplexId(data.complexId || "");
          setExchangeRate(data.exchangeRate || 16000);
          
          const processedSections = data.sections.map(section => ({
            ...defaultSection,
            ...section,
            floors: section.floors.map(floor => ({
              ...defaultFloor,
              ...floor,
              units: floor.units.map(unit => ({
                ...defaultUnit,
                ...unit
              }))
            }))
          }));
          
          setSections(processedSections);
        }
      } catch (error) {
        console.error("Error loading chessboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && id !== "new") {
      loadChessboard();
    } else {
      // Инициализация новой шахматки
      const initialSection = {
        ...defaultSection,
        name: "Секция 1",
        floors: [{
          ...defaultFloor,
          floor: "1",
          units: [{
            ...defaultUnit,
            id: "1-01"
          }]
        }]
      };
      setSections([initialSection]);
      setLoading(false);
    }
  }, [id, defaultSection, defaultFloor, defaultUnit]);

  // Добавление новой секции
  const addSection = () => {
    setSections(prev => [...prev, {
      ...defaultSection,
      name: `Секция ${prev.length + 1}`,
      floors: [{
        ...defaultFloor,
        floor: "1",
        units: [{
          ...defaultUnit,
          id: `${prev.length + 1}-01`
        }]
      }]
    }]);
  };

  // Добавление нового этажа
  const addFloor = (sectionIndex) => {
    setSections(prev => {
      const newSections = [...prev];
      const section = newSections[sectionIndex];
      const floorNumber = section.floors.length + 1;
      
      section.floors.push({
        ...defaultFloor,
        floor: floorNumber.toString(),
        units: [{
          ...defaultUnit,
          id: `${sectionIndex + 1}-${floorNumber.toString().padStart(2, '0')}-01`
        }]
      });
      
      return newSections;
    });
  };

  // Функция для прокрутки к юниту
  const scrollToUnit = (sectionIdx, floorIdx, unitIdx) => {
    const unitElement = document.getElementById(`unit-${sectionIdx}-${floorIdx}-${unitIdx}`);
    if (unitElement) {
      unitElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Добавление нового юнита
  const addUnit = (sectionIndex, floorIndex) => {
    setSections(prev => {
      const newSections = [...prev];
      const section = newSections[sectionIndex];
      const floor = section.floors[floorIndex];
      const unitNumber = floor.units.length + 1;
      
      floor.units.push({
        ...defaultUnit,
        id: `${sectionIndex + 1}-${floor.floor.toString().padStart(2, '0')}-${unitNumber.toString().padStart(2, '0')}`
      });

      // Получаем индекс нового юнита
      const newUnitIdx = floor.units.length - 1;
      
      // Используем setTimeout, чтобы дать React время для рендеринга
      setTimeout(() => {
        scrollToUnit(sectionIndex, floorIndex, newUnitIdx);
      }, 100);
      
      return newSections;
    });
  };

  // Копирование юнита
  const copyUnit = (sectionIdx, floorIdx, unitIdx) => {
    setSections(prevSections => {
      const newSections = JSON.parse(JSON.stringify(prevSections));
      if (newSections[sectionIdx]?.floors[floorIdx]?.units[unitIdx]) {
        const unitToCopy = { ...newSections[sectionIdx].floors[floorIdx].units[unitIdx] };
        unitToCopy.id = crypto.randomUUID().substring(0, 8);
        newSections[sectionIdx].floors[floorIdx].units.push(unitToCopy);
        
        // Получаем индекс нового юнита
        const newUnitIdx = newSections[sectionIdx].floors[floorIdx].units.length - 1;
        
        // Используем setTimeout, чтобы дать React время для рендеринга
        setTimeout(() => {
          scrollToUnit(sectionIdx, floorIdx, newUnitIdx);
        }, 100);
      }
      return newSections;
    });
  };

  // Сохранение шахматки
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Валидация
      if (!id && !selectedComplexId) {
        showError("Пожалуйста, выберите комплекс");
        setIsSaving(false);
        return;
      }

      // Проверяем, не привязана ли уже шахматка к этому комплексу
      if (!id) {
        const existingChessboardsQuery = query(
          collection(db, "chessboards"),
          where("complexId", "==", selectedComplexId)
        );
        const existingChessboards = await getDocs(existingChessboardsQuery);
        if (!existingChessboards.empty) {
          showError("К этому комплексу уже привязана шахматка");
          setIsSaving(false);
          return;
        }
      }

      // Получаем актуальное название комплекса
      let complexName = "";
      if (selectedComplexId) {
        const complexDoc = await getDoc(doc(db, "complexes", selectedComplexId));
        if (complexDoc.exists()) {
          complexName = complexDoc.data().name || "";
        }
      }

      const data = {
        name: complexName, // Всегда используем название из комплекса
        sections,
        description,
        complexId: selectedComplexId || null,
        exchangeRate,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      if (!id || id === "new") {
        // Создание новой шахматки
        data.createdAt = serverTimestamp();
        data.createdBy = currentUser.uid;
        data.publicUrl = await generatePublicId();

        // Сохраняем новую шахматку
        const docRef = await addDoc(collection(db, "chessboards"), data);

        // Настраиваем права доступа
        await setupAccessRights(docRef.id);

        // Создаем запись в истории
        await createHistoryRecord(docRef.id, "create");

        // Создаем уведомление
        await createNotification(docRef.id, "create");

        // Перенаправляем на список шахматок
        navigate("/chessboard");
      } else {
        // Обновление существующей шахматки
        const docRef = doc(db, "chessboards", id);
        await updateDoc(docRef, data);

        // Создаем запись в истории
        await createHistoryRecord(id, "update");
        
        // Создаем уведомление
        await createNotification(id, "update");

        // Перенаправляем на список шахматок
        navigate("/chessboard");
      }
    } catch (error) {
      console.error("Error saving chessboard:", error);
      handleFirestoreError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: null });

  // Обновляем handleDelete для удаления ссылки из комплекса
  const handleDelete = async (id, name) => {
    setDeleteDialog({
      isOpen: true,
      id,
      name
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.name) return;
    
    const { id, name } = deleteDialog;
    try {
      // Получаем данные шахматки
      const chessboardRef = doc(db, "chessboards", id);
      const chessboardSnap = await getDoc(chessboardRef);
      
      if (chessboardSnap.exists()) {
        const chessboardData = chessboardSnap.data();
        
        // Если шахматка привязана к комплексу, удаляем ссылку
        if (chessboardData.complexId) {
          await updateDoc(doc(db, "complexes", chessboardData.complexId), {
            chessboardPublicUrl: null
          });
        }
      }
      
      // Удаляем саму шахматку
      await deleteDoc(chessboardRef);
      showSuccess("Шахматка удалена!");
      navigate('/chessboard');
    } catch (error) {
      console.error("Ошибка удаления:", error);
      showError("Ошибка при удалении шахматки");
    } finally {
      setDeleteDialog({ isOpen: false, id: null, name: null });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const [activeType, ...activeRest] = active.id.split('-');
    const [overType, ...overRest] = over.id.split('-');

    if (activeType !== overType) return;

    setSections(prevSections => {
      const newSections = JSON.parse(JSON.stringify(prevSections));

      switch (activeType) {
        case 'section': {
          const oldIndex = parseInt(activeRest[0]);
          const newIndex = parseInt(overRest[0]);
          return arrayMove(newSections, oldIndex, newIndex);
        }
        case 'floor': {
          const [activeSectionIdx, activeFloorIdx] = activeRest;
          const [overSectionIdx, overFloorIdx] = overRest;
          if (activeSectionIdx === overSectionIdx) {
            newSections[activeSectionIdx].floors = arrayMove(
              newSections[activeSectionIdx].floors,
              parseInt(activeFloorIdx),
              parseInt(overFloorIdx)
            );
          }
          return newSections;
        }
        case 'unit': {
          const [activeSectionIdx, activeFloorIdx, activeUnitIdx] = activeRest;
          const [overSectionIdx, overFloorIdx, overUnitIdx] = overRest;
          if (activeSectionIdx === overSectionIdx && activeFloorIdx === overFloorIdx) {
            newSections[activeSectionIdx].floors[activeFloorIdx].units = arrayMove(
              newSections[activeSectionIdx].floors[activeFloorIdx].units,
              parseInt(activeUnitIdx),
              parseInt(overUnitIdx)
            );
          }
          return newSections;
        }
        default:
          return prevSections;
      }
    });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: null })}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        description={`Вы уверены, что хотите удалить шахматку "${deleteDialog.name}"?`}
      />
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-gray-600">
        <button 
          onClick={() => navigate("/chessboard")}
          className="hover:text-blue-600 transition-colors"
        >
          Шахматки
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900">
          {!id || id === "new" ? "Новая шахматка" : "Редактирование шахматки"}
        </span>
      </nav>

      {/* Заголовок */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">
                  {!id || id === "new" ? "Новая шахматка" : "Редактирование шахматки"}
                </CardTitle>
                <p className="text-gray-600 mt-1">Управление планировкой объекта</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => navigate("/chessboard")} disabled={isSaving}>
                К списку
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Поле выбора комплекса (только для новой шахматки) */}
          {(!id || id === "new") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите комплекс *
              </label>
              <select
                value={selectedComplexId}
                onChange={(e) => {
                  setSelectedComplexId(e.target.value);
                  // Автоматически устанавливаем название из выбранного комплекса
                  const selectedComplex = complexes.find(c => c.id === e.target.value);
                  if (selectedComplex) {
                    setName(selectedComplex.name);
                  }
                }}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Выберите комплекс</option>
                {complexes.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.name}
                  </option>
                ))}
              </select>
              {complexError && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {complexError}
                </p>
              )}
              {complexes.length === 0 && !complexError && (
                <p className="text-amber-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Нет доступных комплексов без шахматки
                </p>
              )}
            </div>
          )}

          {/* Отображаем название комплекса при редактировании */}
          {id && id !== "new" && selectedComplexId && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комплекс
              </label>
              <div className="p-2 bg-gray-50 border rounded-md">
                {name}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Секции */}
        <div className="space-y-6">
          <SortableContext
            items={sections.map((_, idx) => `section-${idx}`)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section, sectionIdx) => (
              <SortableSection 
                key={sectionIdx} 
                section={section} 
                sectionIdx={sectionIdx}
                onNameChange={(value) => {
                  setSections(prev =>
                    prev.map((s, sIdx) => 
                      sIdx === sectionIdx ? { ...s, name: value } : s
                    )
                  );
                }}
                onAddFloor={() => addFloor(sectionIdx)}
                onRemoveSection={() => {
                  setSections(prev => prev.filter((_, sIdx) => sIdx !== sectionIdx));
                }}
                canRemoveSection={sections.length > 1}
              >
                <CardContent>
                  <div className="space-y-4">
                    <SortableContext
                      items={section.floors.map((_, idx) => `floor-${sectionIdx}-${idx}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {section.floors
                        .sort((a, b) => b.floor - a.floor)
                        .map((floor, floorIdx) => (
                          <SortableFloor
                            key={floorIdx}
                            floor={floor}
                            sectionIdx={sectionIdx}
                            floorIdx={floorIdx}
                            onFloorChange={(value) => {
                              setSections(prev => {
                                const newSections = JSON.parse(JSON.stringify(prev));
                                if (newSections[sectionIdx]?.floors[floorIdx]) {
                                  newSections[sectionIdx].floors[floorIdx] = {
                                    ...newSections[sectionIdx].floors[floorIdx],
                                    floor: value === '' ? null : parseInt(value)
                                  };
                                }
                                return newSections;
                              });
                            }}
                            onAddUnit={() => addUnit(sectionIdx, floorIdx)}
                            onRemoveFloor={() => {
                              setSections(prev => {
                                const newSections = JSON.parse(JSON.stringify(prev));
                                if (newSections[sectionIdx]?.floors.length > 1) {
                                  newSections[sectionIdx].floors = newSections[sectionIdx].floors.filter((_, fIdx) => fIdx !== floorIdx);
                                }
                                return newSections;
                              });
                            }}
                            canRemoveFloor={section.floors.length > 1}
                          >
                            <div className="overflow-x-auto pb-4">
                              <SortableContext
                                items={floor.units.map((_, idx) => `unit-${sectionIdx}-${floorIdx}-${idx}`)}
                                strategy={horizontalListSortingStrategy}
                              >
                                <div className="flex gap-3 min-w-max">
                                  {floor.units.map((unit, unitIdx) => (
                                    <SortableUnit
                                      key={unitIdx}
                                      unit={unit}
                                      sectionIdx={sectionIdx}
                                      floorIdx={floorIdx}
                                      unitIdx={unitIdx}
                                      onUnitChange={(field, value) => {
                                        setSections(prev => {
                                          const newSections = JSON.parse(JSON.stringify(prev));
                                          if (newSections[sectionIdx]?.floors[floorIdx]?.units[unitIdx]) {
                                            const unit = newSections[sectionIdx].floors[floorIdx].units[unitIdx];
                                            unit[field] = value;
                                          }
                                          return newSections;
                                        });
                                      }}
                                      getStatusColor={getStatusColor}
                                      onCopyUnit={() => copyUnit(sectionIdx, floorIdx, unitIdx)}
                                      onRemoveUnit={() => {
                                        setSections(prev => {
                                          const newSections = JSON.parse(JSON.stringify(prev));
                                          if (newSections[sectionIdx]?.floors[floorIdx]?.units.length > 1) {
                                            newSections[sectionIdx].floors[floorIdx].units = newSections[sectionIdx].floors[floorIdx].units.filter((_, idx) => idx !== unitIdx);
                                          }
                                          return newSections;
                                        });
                                      }}
                                      canRemoveUnit={floor.units.length > 1}
                                      exchangeRate={exchangeRate}
                                      formatPrice={formatPrice}
                                      formatPriceUSD={formatPriceUSD}
                                      onExchangeRateChange={updateExchangeRate}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </div>
                          </SortableFloor>
                        ))}
                    </SortableContext>
                  </div>
                </CardContent>
              </SortableSection>
            ))}
          </SortableContext>
        </div>
      </DndContext>

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