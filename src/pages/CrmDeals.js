import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Button } from '../components/ui/button';
import { Search, Settings, Plus, MoreVertical } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import QuickAddDealForm from '../components/QuickAddDealForm';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

const CrmDeals = () => {
  const { language } = useLanguage();
  const t = translations[language].deals;
  const [isQuickAddVisible, setIsQuickAddVisible] = useState(false);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Empty data - no test values
  const stats = {
    todayTasks: 0,
    noTasks: 0,
    overdue: 0,
    newTodayYesterday: '0 / 0',
    salesForecast: 'Rp0'
  };

  // Group deals by stage
  const firstContactDeals = deals.filter(deal => deal.stage === 'first-contact');
  const negotiationsDeals = deals.filter(deal => deal.stage === 'negotiations');
  const decisionMakingDeals = deals.filter(deal => deal.stage === 'decision-making');
  const bookingDeals = deals.filter(deal => deal.stage === 'booking');

  const pipelineStages = [
    {
      id: 'first-contact',
      title: t.firstContact,
      color: 'bg-blue-500',
      count: firstContactDeals.length,
      amount: firstContactDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
      deals: firstContactDeals
    },
    {
      id: 'negotiations',
      title: t.negotiations,
      color: 'bg-yellow-500',
      count: negotiationsDeals.length,
      amount: negotiationsDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
      deals: negotiationsDeals
    },
    {
      id: 'decision-making',
      title: t.decisionMaking,
      color: 'bg-orange-500',
      count: decisionMakingDeals.length,
      amount: decisionMakingDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
      deals: decisionMakingDeals
    },
    {
      id: 'booking',
      title: t.booking,
      color: 'bg-green-500',
      count: bookingDeals.length,
      amount: bookingDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
      deals: bookingDeals
    }
  ];

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === 0) return 'Rp0';
    return `Rp${amount.toLocaleString('id-ID')}`;
  };

  // Load deals from Firebase
  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const dealsRef = collection(db, 'crm_deals');
      const q = query(dealsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const dealsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          contact: [data.contactName, data.companyName].filter(Boolean).join(', '),
          time: data.createdAt ? 
            `Сегодня ${data.createdAt.toDate().toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })}` : 
            'Неизвестно'
        };
      });
      
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error('Ошибка загрузки сделок');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleDealAdded = useCallback((deal) => {
    setDeals(prevDeals => [deal, ...prevDeals]);
    setIsQuickAddVisible(false);
  }, []);

  const handleCancelForm = useCallback(() => {
    setIsQuickAddVisible(false);
  }, []);

  // Drag and Drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id;
    let newStage = over.id;

    // Валидные этапы воронки
    const validStages = ['first-contact', 'negotiations', 'decision-making', 'booking'];

    // Если over.id не является валидным этапом, значит мы drop на другую карточку
    // Нужно найти этап, к которому принадлежит эта карточка
    if (!validStages.includes(newStage)) {
      const targetDeal = deals.find(deal => deal.id === newStage);
      if (targetDeal) {
        newStage = targetDeal.stage;
      } else {
        // Попробуем найти ближайший droppable parent
        if (over.data?.current?.type === 'stage') {
          newStage = over.data.current.stageId;
        } else {
          return;
        }
      }
    }

    // Find the deal that was moved
    const dealToMove = deals.find(deal => deal.id === dealId);
    if (!dealToMove || dealToMove.stage === newStage) {
      return;
    }

    // Store the original stage for potential rollback
    const originalStage = dealToMove.stage;

    // OPTIMISTIC UPDATE: Update local state immediately
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === dealId 
          ? { ...deal, stage: newStage }
          : deal
      )
    );

    // Then update Firebase in the background
    try {
      const dealRef = doc(db, 'crm_deals', dealId);
      await updateDoc(dealRef, {
        stage: newStage,
        updatedAt: new Date()
      });

      // Success - show quick success feedback without delay
      // UI is already updated optimistically
    } catch (error) {
      console.error('Error updating deal stage:', error);
      
      // ROLLBACK: Revert the optimistic update on error
      setDeals(prevDeals => 
        prevDeals.map(deal => 
          deal.id === dealId 
            ? { ...deal, stage: originalStage }
            : deal
        )
      );
      
      toast.error('Ошибка при перемещении сделки');
    }
  };

  // Droppable Column Component
  const DroppableColumn = ({ stage, children }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: stage.id,
      data: {
        type: 'stage',
        stageId: stage.id
      }
    });

    const style = {
      backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    };

    return (
      <div className="min-h-[600px] w-[360px] flex-shrink-0">
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">{stage.title}</h3>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {stage.count} {stage.count === 1 ? 'сделка' : 'сделок'}: {formatCurrency(stage.amount)}
            </span>
          </div>
          {/* Цветная полоска под заголовком */}
          <div className={`w-full ${stage.color} mt-3`} style={{ height: '2px' }}></div>
        </div>
        
        <div 
          ref={setNodeRef} 
          style={style}
          className="p-4 pt-2 min-h-[500px] transition-colors duration-200 rounded-lg"
        >
          {children}
        </div>
      </div>
    );
  };

  // Draggable Deal Card Component
  const DraggableDealCard = ({ deal }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: deal.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : transition, // No transition while dragging for instant feedback
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing min-h-[120px] w-full"
      >
        {/* Верхняя часть: Название и сумма */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-2">
            <h4 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">{deal.name}</h4>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-bold text-sm text-green-600">{formatCurrency(deal.amount)}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // TODO: Здесь будет меню действий для сделки
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Средняя часть: Контакт */}
        <div className="mb-3 min-h-[16px]">
          {deal.contact && (
            <p className="text-xs text-gray-600 leading-relaxed">{deal.contact}</p>
          )}
        </div>
        
        {/* Нижняя часть: ID, статус задач и время */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium">#{deal.id.slice(0, 8)}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              deal.hasTask 
                ? 'bg-orange-100 text-orange-600' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {deal.hasTask ? t.today : t.noTask}
            </span>
          </div>
          <span className="text-xs text-gray-500">{deal.time}</span>
        </div>
      </div>
    );
  };



  const QuickAddButton = () => (
    <div className="mb-4">
      <button
        onClick={() => setIsQuickAddVisible(true)}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium min-h-[60px] flex items-center justify-center"
      >
        + {t.quickAdd}
      </button>
    </div>
  );



  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка сделок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="pl-10 pr-4 py-2 border rounded-lg w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t.settings}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsQuickAddVisible(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.newDeal}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.todayTasks}</div>
          <div className="text-sm text-gray-600">{t.todayTasks}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
                     <div className="text-2xl font-bold text-green-600">{deals.filter(deal => !deal.hasTask).length}</div>
          <div className="text-sm text-gray-600">{t.noTasks}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">{t.overdue}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
                     <div className="text-2xl font-bold text-purple-600">{deals.length} / 0</div>
          <div className="text-sm text-gray-600">{t.newTodayYesterday}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
                     <div className="text-2xl font-bold text-orange-600">{formatCurrency(deals.reduce((sum, deal) => sum + (deal.amount || 0), 0))}</div>
          <div className="text-sm text-gray-600">{t.salesForecast}</div>
        </div>
      </div>

      {/* Pipeline */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {pipelineStages.map((stage) => (
              <DroppableColumn key={stage.id} stage={stage}>
                {stage.id === 'first-contact' && (
                  <>
                    {isQuickAddVisible ? (
                      <QuickAddDealForm 
                        onDealAdded={handleDealAdded}
                        onCancel={handleCancelForm}
                      />
                    ) : (
                      <QuickAddButton />
                    )}
                  </>
                )}
                
                <SortableContext 
                  items={stage.deals.map(deal => deal.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stage.deals.map((deal) => (
                    <DraggableDealCard key={deal.id} deal={deal} />
                  ))}
                </SortableContext>
              </DroppableColumn>
            ))}
          </div>
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="bg-white border rounded-lg p-4 shadow-lg">
              <div className="text-sm font-medium">
                {deals.find(d => d.id === activeId)?.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default CrmDeals;