import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import toast from 'react-hot-toast';

// Функция для форматирования даты
const formatDate = (date) => {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Функция для форматирования даты в формат yyyy-MM-dd
const formatDateForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ClientFixations = () => {
  const [fixations, setFixations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, role: userRole } = useAuth();
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedFixation, setSelectedFixation] = useState(null);
  const [validUntilDate, setValidUntilDate] = useState('');
  const [rejectComment, setRejectComment] = useState('');

  // Функция для открытия диалога подтверждения
  const openApproveDialog = (fixation) => {
    setSelectedFixation(fixation);
    // Устанавливаем дату на 30 дней вперед по умолчанию
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    setValidUntilDate(formatDateForInput(thirtyDaysFromNow));
    setIsApproveDialogOpen(true);
  };

  // Функция для закрытия диалога
  const closeApproveDialog = () => {
    setIsApproveDialogOpen(false);
    setSelectedFixation(null);
    setValidUntilDate('');
  };

  // Функция для открытия диалога отклонения
  const openRejectDialog = (fixation) => {
    setSelectedFixation(fixation);
    setRejectComment('');
    setIsRejectDialogOpen(true);
  };

  // Функция для закрытия диалога отклонения
  const closeRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setSelectedFixation(null);
    setRejectComment('');
  };

  // Функция для получения статуса с правильным цветом
  const getStatusBadge = (status) => {
    const statusColors = {
      'На согласовании': 'bg-yellow-500',
      'Зафиксирован': 'bg-green-500',
      'Срок истек': 'bg-red-500',
      'Отклонен': 'bg-red-500'
    };

    return (
      <Badge className={`${statusColors[status] || 'bg-gray-500'}`}>
        {status}
      </Badge>
    );
  };

  // Функция для обновления статуса фиксации
  const updateFixationStatus = async (fixationId, newStatus, validUntil = null, comment = null) => {
    try {
      const fixationRef = doc(db, 'clientFixations', fixationId);
      const updateData = {
        status: newStatus
      };

      // Если статус "Зафиксирован", добавляем срок действия
      if (newStatus === 'Зафиксирован' && validUntil) {
        const validUntilDate = new Date(validUntil);
        validUntilDate.setHours(23, 59, 59);
        updateData.validUntil = Timestamp.fromDate(validUntilDate);
      }

      // Если статус "Отклонен", добавляем комментарий
      if (newStatus === 'Отклонен' && comment) {
        updateData.rejectComment = comment;
        updateData.rejectedAt = Timestamp.now();
        updateData.rejectedBy = currentUser.email;
      }

      await updateDoc(fixationRef, updateData);

      // Обновляем локальное состояние
      setFixations(prev => prev.map(f => 
        f.id === fixationId 
          ? { 
              ...f, 
              status: newStatus,
              validUntil: updateData.validUntil || f.validUntil,
              rejectComment: updateData.rejectComment || f.rejectComment,
              rejectedAt: updateData.rejectedAt || f.rejectedAt,
              rejectedBy: updateData.rejectedBy || f.rejectedBy
            } 
          : f
      ));

      toast.success(`Статус фиксации успешно обновлен на "${newStatus}"`);
      closeApproveDialog();
      closeRejectDialog();
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      toast.error('Ошибка при обновлении статуса фиксации');
    }
  };

  // Функция для подтверждения фиксации с выбранной датой
  const handleApproveFixation = () => {
    if (!selectedFixation || !validUntilDate) return;
    updateFixationStatus(selectedFixation.id, 'Зафиксирован', validUntilDate);
  };

  // Функция для отклонения фиксации с комментарием
  const handleRejectFixation = () => {
    if (!selectedFixation || rejectComment.length < 10) return;
    updateFixationStatus(selectedFixation.id, 'Отклонен', null, rejectComment);
  };

  // Функция для проверки и обновления истекших фиксаций
  const checkAndUpdateExpiredFixations = async (fixationsData) => {
    const currentDate = new Date();
    
    for (const fixation of fixationsData) {
      if (
        fixation.status === 'Зафиксирован' &&
        fixation.validUntil &&
        currentDate > new Date(fixation.validUntil.seconds * 1000)
      ) {
        try {
          await updateDoc(doc(db, 'clientFixations', fixation.id), {
            status: 'Срок истек'
          });
          
          // Обновляем локальное состояние
          setFixations(prev => prev.map(f => 
            f.id === fixation.id ? { ...f, status: 'Срок истек' } : f
          ));
        } catch (error) {
          console.error('Ошибка при обновлении статуса:', error);
        }
      }
    }
  };

  // Функция для загрузки фиксаций
  const fetchFixations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let fixationsQuery;
      
      if (userRole === 'admin') {
        // Админы видят все фиксации
        fixationsQuery = query(
          collection(db, 'clientFixations'),
          orderBy('dateTime', 'desc')
        );
      } else {
        // Остальные видят только свои фиксации
        fixationsQuery = query(
          collection(db, 'clientFixations'),
          where('agentId', '==', currentUser.uid),
          orderBy('dateTime', 'desc')
        );
      }

      const snapshot = await getDocs(fixationsQuery);
      const fixationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFixations(fixationsData);
      checkAndUpdateExpiredFixations(fixationsData);
    } catch (err) {
      setError('Ошибка при загрузке фиксаций: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFixations();
    }
  }, [currentUser, userRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Загрузка фиксаций...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-600">
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  if (fixations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p>Фиксации отсутствуют</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Фиксации клиентов</h1>
        <Button onClick={fetchFixations}>
          Обновить
        </Button>
      </div>

      <div className="grid gap-4">
        {fixations.map((fixation) => (
          <Card key={fixation.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{fixation.clientName}</h3>
                <p className="text-sm text-gray-600">
                  Агент: {fixation.agentName}
                </p>
                <p className="text-sm text-gray-600">
                  Комплекс: {fixation.complexName}
                </p>
                <p className="text-sm text-gray-600">
                  Застройщик: {fixation.developerName}
                </p>
                <p className="text-sm text-gray-600">
                  Тип недвижимости: {fixation.propertyType}
                </p>
                {fixation.rejectComment && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Причина отклонения: {fixation.rejectComment}
                    </p>
                    <p className="text-xs text-gray-500">
                      Отклонено: {fixation.rejectedBy} ({formatDate(fixation.rejectedAt.seconds * 1000)})
                    </p>
                  </div>
                )}
                {fixation.status === 'На согласовании' && userRole === 'admin' && (
                  <div className="mt-4 space-x-2">
                    <Button
                      onClick={() => openApproveDialog(fixation)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Принять
                    </Button>
                    <Button
                      onClick={() => openRejectDialog(fixation)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="mb-2">
                  {getStatusBadge(fixation.status)}
                </div>
                <p className="text-sm text-gray-600">
                  {formatDate(fixation.dateTime.seconds * 1000)}
                </p>
                {fixation.validUntil && (
                  <p className="text-sm text-gray-600">
                    Действует до: {formatDate(fixation.validUntil.seconds * 1000)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Диалог подтверждения фиксации */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение фиксации</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Действует до
            </label>
            <Input
              type="date"
              value={validUntilDate}
              onChange={(e) => setValidUntilDate(e.target.value)}
              min={formatDateForInput(new Date())}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeApproveDialog}
            >
              Отмена
            </Button>
            <Button
              onClick={handleApproveFixation}
              className="bg-green-500 hover:bg-green-600 text-white ml-2"
            >
              Принять
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог отклонения фиксации */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонение фиксации</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectComment" className="text-sm font-medium text-gray-700">
              Комментарий <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1">
              <Textarea
                id="rejectComment"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Укажите причину отклонения фиксации (минимум 10 символов)"
                className="w-full min-h-[100px]"
              />
            </div>
            {rejectComment.length < 10 && rejectComment.length > 0 && (
              <p className="text-sm text-red-500 mt-1">
                Комментарий должен содержать не менее 10 символов (осталось {10 - rejectComment.length})
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRejectDialog}
            >
              Отмена
            </Button>
            <Button
              onClick={handleRejectFixation}
              className="bg-red-500 hover:bg-red-600 text-white ml-2"
              disabled={rejectComment.length < 10}
            >
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientFixations; 