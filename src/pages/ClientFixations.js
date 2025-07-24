import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp, addDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import FixationChat from '../components/FixationChat';
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
  const [filteredFixations, setFilteredFixations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, role: userRole } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFixation, setSelectedFixation] = useState(null);
  const [validUntilDate, setValidUntilDate] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Функция для группировки статусов по типу (игнорируя язык)
  const getStatusType = useCallback((status) => {
    if (['На согласовании', 'Pending Approval', 'Menunggu Persetujuan'].includes(status)) {
      return 'pending';
    }
    if (['Зафиксирован', 'Fixed', 'Diperbaiki'].includes(status)) {
      return 'approved';
    }
    if (['Срок истек', 'Expired', 'Kedaluwarsa'].includes(status)) {
      return 'expired';
    }
    if (['Отклонен', 'Rejected', 'Ditolak'].includes(status)) {
      return 'rejected';
    }
    return 'unknown';
  }, []);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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

  // Функция для открытия диалога удаления
  const openDeleteDialog = (fixation) => {
    setSelectedFixation(fixation);
    setIsDeleteDialogOpen(true);
  };

  // Функция для закрытия диалога удаления
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedFixation(null);
  };

  // Функция для получения статуса с правильным цветом
  const getStatusBadge = (status) => {
    const statusType = getStatusType(status);
    const statusColor = getStatusColor(statusType);
    
    // Получаем локализованное название статуса
    const localizedStatus = {
      pending: t.clientFixations.statuses.pending,
      approved: t.clientFixations.statuses.approved,
      expired: t.clientFixations.statuses.expired,
      rejected: t.clientFixations.statuses.rejected
    }[statusType] || status;

    return (
      <Badge className={statusColor}>
        {localizedStatus}
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

      // Если статус соответствует "зафиксирован", добавляем срок действия
      const approvedStatuses = [
        t.clientFixations.statuses.approved,
        'Зафиксирован', 'Fixed', 'Diperbaiki' // для обратной совместимости
      ];
      if (approvedStatuses.includes(newStatus) && validUntil) {
        const validUntilDate = new Date(validUntil);
        validUntilDate.setHours(23, 59, 59);
        updateData.validUntil = Timestamp.fromDate(validUntilDate);
      }

      // Если статус соответствует "отклонен", добавляем комментарий
      const rejectedStatuses = [
        t.clientFixations.statuses.rejected,
        'Отклонен', 'Rejected', 'Ditolak' // для обратной совместимости
      ];
      if (rejectedStatuses.includes(newStatus) && comment) {
        updateData.rejectComment = comment;
        updateData.rejectedAt = Timestamp.now();
        updateData.rejectedBy = currentUser.email;
      }

      await updateDoc(fixationRef, updateData);

      // Обновляем локальное состояние
      const updatedFixations = fixations.map(f => 
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
      );
      setFixations(updatedFixations);
      filterFixations(searchQuery);

      toast.success(t.clientFixations.statusUpdated.replace('{status}', newStatus));
      closeApproveDialog();
      closeRejectDialog();
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      toast.error(t.clientFixations.statusUpdateError);
    }
  };

  // Функция для получения локализованного названия типа недвижимости
  const getLocalizedPropertyType = (propertyType) => {
    if (!propertyType) return '';
    
    const propertyTypeMap = {
      'Апартаменты': t.chessboards.propertyTypes.apartments,
      'Вилла': t.chessboards.propertyTypes.villa,
      'Апарт-вилла': t.chessboards.propertyTypes.apartVilla,
      'Таунхаус': t.chessboards.propertyTypes.townhouse
    };
    
    return propertyTypeMap[propertyType] || propertyType;
  };

  // Функция для получения правильного статуса в зависимости от языка
  const getLocalizedStatus = (targetStatus) => {
    return targetStatus === 'approved' 
      ? t.clientFixations.statuses.approved 
      : t.clientFixations.statuses.rejected;
  };

  // Функция для получения локализованного системного сообщения
  const getLocalizedSystemMessage = useCallback((type, fixation, validUntilDate = null, rejectComment = null) => {
    // Определяем язык фиксации
    const fixationLanguage = fixation.language || 'ru'; // По умолчанию русский
    
    // Получаем переводы для нужного языка
    let translations;
    switch (fixationLanguage) {
      case 'en':
        translations = {
          approved: 'Your client {clientName} {clientPhone} has been fixed with developer {developerName} until {validUntil}',
          rejected: 'Your fixation request for client {clientName} {clientPhone} with developer {developerName} has been rejected. Reason: {reason}',
          expired: 'Your fixation for client {clientName} {clientPhone} with developer {developerName} has expired on {expiredDate}'
        };
        break;
      case 'id':
        translations = {
          approved: 'Klien Anda {clientName} {clientPhone} telah difiksasi dengan pengembang {developerName} hingga {validUntil}',
          rejected: 'Permintaan fiksasi Anda untuk klien {clientName} {clientPhone} с pengembang {developerName} telah ditolak. Alasan: {reason}',
          expired: 'Fiksasi Anda untuk klien {clientName} {clientPhone} с pengembang {developerName} telah kedaluwarsa pada {expiredDate}'
        };
        break;
      default: // ru
        translations = {
          approved: 'Ваш клиент {clientName} {clientPhone} зафиксирован за вами у застройщика {developerName} до {validUntil}',
          rejected: 'Ваша заявка на фиксацию клиента {clientName} {clientPhone} у застройщика {developerName} отклонена. Причина отклонения: {reason}',
          expired: 'Ваша фиксация клиента {clientName} {clientPhone} у застройщика {developerName} истекла {expiredDate}'
        };
    }
    
    const template = translations[type];
    if (!template) return '';
    
    // Форматируем дату в зависимости от языка
    let validUntilFormatted = '';
    let expiredDateFormatted = '';
    
    if (validUntilDate) {
      const date = new Date(validUntilDate);
      switch (fixationLanguage) {
        case 'en':
          validUntilFormatted = date.toLocaleDateString('en-US');
          break;
        case 'id':
          validUntilFormatted = date.toLocaleDateString('id-ID');
          break;
        default: // ru
          validUntilFormatted = date.toLocaleDateString('ru-RU');
      }
    }
    
    // Для истекших фиксаций используем дату истечения из validUntil
    if (type === 'expired' && fixation.validUntil) {
      const expiredDate = new Date(fixation.validUntil.seconds * 1000);
      switch (fixationLanguage) {
        case 'en':
          expiredDateFormatted = expiredDate.toLocaleDateString('en-US');
          break;
        case 'id':
          expiredDateFormatted = expiredDate.toLocaleDateString('id-ID');
          break;
        default: // ru
          expiredDateFormatted = expiredDate.toLocaleDateString('ru-RU');
      }
    }
    
    // Заменяем плейсхолдеры
    return template
      .replace('{clientName}', fixation.clientName || '')
      .replace('{clientPhone}', fixation.clientPhone || '')
      .replace('{developerName}', fixation.developerName || '')
      .replace('{validUntil}', validUntilFormatted)
      .replace('{expiredDate}', expiredDateFormatted)
      .replace('{reason}', rejectComment || '');
  }, []);

  // Функция для подтверждения фиксации с выбранной датой
  const handleApproveFixation = async () => {
    if (!selectedFixation || !validUntilDate) return;
    
    try {
      // Получаем правильный статус на нужном языке
      const approvedStatus = getLocalizedStatus('approved');
      
      // Обновляем статус фиксации
      await updateFixationStatus(selectedFixation.id, approvedStatus, validUntilDate);
      
      // Отправляем локализованное системное сообщение в чат фиксации
      const systemMessage = getLocalizedSystemMessage('approved', selectedFixation, validUntilDate);
      
      const messagesRef = collection(db, 'agents', selectedFixation.agentId, 'chats', selectedFixation.chatId, 'messages');
      await addDoc(messagesRef, {
        text: systemMessage,
        senderId: 'system',
        sender_id: 'system',
        sender_name: 'Система',
        sender_role: 'system',
        timestamp: Timestamp.now(),
        isFromCurrentUser: false
      });

      // Обновляем последнее сообщение в чате
      const chatRef = doc(db, 'agents', selectedFixation.agentId, 'chats', selectedFixation.chatId);
      await updateDoc(chatRef, {
        lastMessage: systemMessage,
        timestamp: Timestamp.now()
      });

      toast.success('Фиксация подтверждена и сообщение отправлено в чат');
    } catch (error) {
      console.error('Ошибка при подтверждении фиксации:', error);
      toast.error('Ошибка при подтверждении фиксации');
    }
  };

  // Функция для отклонения фиксации с комментарием
  const handleRejectFixation = async () => {
    if (!selectedFixation || rejectComment.length < 10) return;
    
    try {
      // Получаем правильный статус на нужном языке
      const rejectedStatus = getLocalizedStatus('rejected');
      
      // Обновляем статус фиксации
      await updateFixationStatus(selectedFixation.id, rejectedStatus, null, rejectComment);
      
      // Отправляем локализованное системное сообщение в чат фиксации
      const systemMessage = getLocalizedSystemMessage('rejected', selectedFixation, null, rejectComment);
      
      const messagesRef = collection(db, 'agents', selectedFixation.agentId, 'chats', selectedFixation.chatId, 'messages');
      await addDoc(messagesRef, {
        text: systemMessage,
        senderId: 'system',
        sender_id: 'system',
        sender_name: 'Система',
        sender_role: 'system',
        timestamp: Timestamp.now(),
        isFromCurrentUser: false
      });

      // Обновляем последнее сообщение в чате
      const chatRef = doc(db, 'agents', selectedFixation.agentId, 'chats', selectedFixation.chatId);
      await updateDoc(chatRef, {
        lastMessage: systemMessage,
        timestamp: Timestamp.now()
      });

      toast.success('Фиксация отклонена и сообщение отправлено в чат');
    } catch (error) {
      console.error('Ошибка при отклонении фиксации:', error);
      toast.error('Ошибка при отклонении фиксации');
    }
  };

  // Функция для удаления фиксации и чата
  const handleDeleteFixation = async () => {
    if (!selectedFixation) return;

    try {
      const batch = writeBatch(db);

      // Удаляем документ фиксации
      const fixationRef = doc(db, 'clientFixations', selectedFixation.id);
      batch.delete(fixationRef);

      // Удаляем чат и все его сообщения
      const chatRef = doc(db, 'agents', selectedFixation.agentId, 'chats', selectedFixation.chatId);
      const messagesRef = collection(db, 'agents', selectedFixation.agentId, 'chats', selectedFixation.chatId, 'messages');
      
      // Получаем все сообщения чата для удаления
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.docs.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
      });

      // Удаляем сам чат
      batch.delete(chatRef);

      // Выполняем batch операцию
      await batch.commit();

      // Обновляем локальное состояние
      const updatedFixations = fixations.filter(f => f.id !== selectedFixation.id);
      setFixations(updatedFixations);
      setFilteredFixations(updatedFixations.filter(f => {
        if (!searchQuery.trim()) return true;
        const searchTerms = searchQuery.toLowerCase().split(' ');
        const searchableText = [
          f.clientName || '',
          f.clientPhone || '',
          f.agentName || '',
          f.complexName || '',
          f.developerName || '',
          f.propertyType || '',
          f.status || ''
        ].join(' ').toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      }));

      toast.success(t.clientFixations.fixationDeleted);
      closeDeleteDialog();
    } catch (error) {
      console.error('Ошибка при удалении фиксации:', error);
      toast.error(t.clientFixations.deleteError);
    }
  };

  // Функция для проверки и обновления истекших фиксаций
  const checkAndUpdateExpiredFixations = useCallback(async (fixationsData) => {
    const currentDate = new Date();
    
    for (const fixation of fixationsData) {
      // Проверяем статус "зафиксирован" используя getStatusType
      const statusType = getStatusType(fixation.status);
                     
      if (
        statusType === 'approved' &&
        fixation.validUntil &&
        currentDate > new Date(fixation.validUntil.seconds * 1000)
      ) {
        try {
          // Устанавливаем статус "истек" в текущем языке
          const expiredStatus = t.clientFixations.statuses.expired;
          
          await updateDoc(doc(db, 'clientFixations', fixation.id), {
            status: expiredStatus
          });
          
          // Отправляем локализованное системное сообщение об истечении срока
          const systemMessage = getLocalizedSystemMessage('expired', fixation);
          
          if (systemMessage) {
            const messagesRef = collection(db, 'agents', fixation.agentId, 'chats', fixation.chatId, 'messages');
            await addDoc(messagesRef, {
              text: systemMessage,
              senderId: 'system',
              sender_id: 'system',
              sender_name: 'Система',
              sender_role: 'system',
              timestamp: Timestamp.now(),
              isFromCurrentUser: false
            });

            // Обновляем последнее сообщение в чате
            const chatRef = doc(db, 'agents', fixation.agentId, 'chats', fixation.chatId);
            await updateDoc(chatRef, {
              lastMessage: systemMessage,
              timestamp: Timestamp.now()
            });
          }
          
          // Обновляем локальное состояние
          setFixations(prev => prev.map(f => 
            f.id === fixation.id ? { ...f, status: expiredStatus } : f
          ));
        } catch (error) {
          console.error('Ошибка при обновлении статуса:', error);
        }
      }
    }
  }, [getStatusType, t.clientFixations.statuses.expired, getLocalizedSystemMessage]);

  // Функция для загрузки фиксаций
  const fetchFixations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let fixationsQuery;
      
      if (userRole === 'admin' || userRole === 'moderator') {
        // Админы и модераторы видят все фиксации
        fixationsQuery = query(
          collection(db, 'clientFixations'),
          orderBy('dateTime', 'desc')
        );
      } else if (['застройщик', 'премиум застройщик'].includes(userRole)) {
        // Застройщики видят фиксации только своих объектов
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const developerId = userDoc.data()?.developerId;

        if (!developerId) {
          setError(t.clientFixations.fetchError);
          setIsLoading(false);
          return;
        }

        // Получаем данные застройщика
        const developerRef = doc(db, 'developers', developerId);
        const developerDoc = await getDoc(developerRef);
        
        if (!developerDoc.exists()) {
          setError(t.clientFixations.fetchError);
          setIsLoading(false);
          return;
        }

        const developerName = developerDoc.data().name;

        fixationsQuery = query(
          collection(db, 'clientFixations'),
          where('developerName', '==', developerName),
          orderBy('dateTime', 'desc')
        );
      } else {
        // Агенты видят только свои фиксации
        fixationsQuery = query(
          collection(db, 'clientFixations'),
          where('agentId', '==', currentUser.uid),
          orderBy('dateTime', 'desc')
        );
      }

      const snapshot = await getDocs(fixationsQuery);
      const fixationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Формируем chatId из префикса и ID фиксации
        const chatId = `fix-${doc.id}`;
        return {
          id: doc.id,
          chatId,
          ...data,
        };
      });

      setFixations(fixationsData);
      setFilteredFixations(fixationsData);
      checkAndUpdateExpiredFixations(fixationsData);
    } catch (err) {
      setError(t.clientFixations.fetchError + ': ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, userRole, t.clientFixations.fetchError, checkAndUpdateExpiredFixations]);

  // Функция для открытия чата
  const openChat = (fixation) => {
    setSelectedChatId(fixation.chatId);
    setSelectedAgentId(fixation.agentId);
    setIsChatOpen(true);
  };

  // Функция для закрытия чата
  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedChatId(null);
    setSelectedAgentId(null);
  };

  // Функция для фильтрации фиксаций по поисковому запросу и статусу
  const filterFixations = useCallback((query = searchQuery, statusFilter = selectedStatusFilter) => {
    let filtered = fixations;

    // Фильтр по тексту
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().split(' ');
      filtered = filtered.filter((fixation) => {
        const searchableText = [
          fixation.clientName || '',
          fixation.clientPhone || '',
          fixation.agentName || '',
          fixation.complexName || '',
          fixation.developerName || '',
          fixation.propertyType || '',
          fixation.status || ''
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Фильтр по статусу
    if (statusFilter) {
      filtered = filtered.filter(fixation => {
        const statusType = getStatusType(fixation.status);
        return statusType === statusFilter;
      });
    }

    setFilteredFixations(filtered);
  }, [fixations, searchQuery, selectedStatusFilter, getStatusType]);

  // Обработчик изменения поискового запроса
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterFixations(query, selectedStatusFilter);
  };

  // Обработчик клика на бейдж статуса
  const handleStatusFilterClick = (statusType) => {
    const newStatusFilter = selectedStatusFilter === statusType ? null : statusType;
    setSelectedStatusFilter(newStatusFilter);
    filterFixations(searchQuery, newStatusFilter);
  };

  // Функция для получения отображаемого названия статуса
  const getStatusDisplayName = (statusType) => {
    const names = {
      pending: t.clientFixations.statuses.pending_plural,
      approved: t.clientFixations.statuses.approved_plural,
      expired: t.clientFixations.statuses.expired_plural,
      rejected: t.clientFixations.statuses.rejected_plural
    };
    return names[statusType] || 'Unknown';
  };

  // Функция для получения цвета статуса
  const getStatusColor = (statusType) => {
    const colors = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      expired: 'bg-red-500',
      rejected: 'bg-red-500'
    };
    return colors[statusType] || 'bg-gray-500';
  };

  // Функция для подсчета статусов
  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      approved: 0,
      expired: 0,
      rejected: 0
    };

    // Считаем от полного списка fixations, а не от отфильтрованного
    fixations.forEach(fixation => {
      const statusType = getStatusType(fixation.status);
      if (counts.hasOwnProperty(statusType)) {
        counts[statusType]++;
      }
    });

    return counts;
  };

  useEffect(() => {
    if (currentUser) {
      fetchFixations();
    }
  }, [currentUser, userRole, fetchFixations]);

  // useEffect для обновления фильтрованных фиксаций при изменении основного списка
  useEffect(() => {
    if (!searchQuery.trim() && !selectedStatusFilter) {
      setFilteredFixations(fixations);
    } else {
      filterFixations(searchQuery, selectedStatusFilter);
    }
  }, [fixations, searchQuery, selectedStatusFilter, filterFixations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{t.clientFixations.loading}</span>
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
        <p>{t.clientFixations.noFixations}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex justify-between items-center'} mb-6`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{t.clientFixations.title}</h1>
        <Button 
          onClick={fetchFixations}
          className={`${isMobile ? 'w-full h-12' : ''}`}
        >
          {t.clientFixations.refresh}
        </Button>
      </div>
      
      {/* Поле поиска */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={t.clientFixations.searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                filterFixations('', selectedStatusFilter);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            {t.clientFixations.searchResults
              .replace('{count}', filteredFixations.length)
              .replace('{total}', fixations.length)}
          </p>
                 )}
       </div>

       {/* Бейджи со счетчиками статусов */}
       {fixations.length > 0 && (
         <div className="mb-6">
           <div className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'flex flex-wrap gap-3'}`}>
             {Object.entries(getStatusCounts()).map(([statusType, count]) => (
               <button
                 key={statusType}
                 onClick={() => handleStatusFilterClick(statusType)}
                 className={`inline-flex items-center px-3 py-2 rounded-full text-white text-sm font-medium transition-all duration-200 hover:scale-105 ${
                   selectedStatusFilter === statusType 
                     ? `${getStatusColor(statusType)} ring-2 ring-offset-2 ring-gray-300 shadow-lg scale-105` 
                     : getStatusColor(statusType)
                 } ${isMobile ? 'h-12 justify-center' : ''}`}
               >
                 <span className="mr-2">{getStatusDisplayName(statusType)}</span>
                 <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">
                   {count}
                 </span>
               </button>
             ))}
             <button
               onClick={() => {
                 setSelectedStatusFilter(null);
                 setSearchQuery('');
                 setFilteredFixations(fixations);
               }}
               className={`inline-flex items-center px-3 py-2 rounded-full text-white text-sm font-medium transition-all duration-200 hover:scale-105 ${
                 !selectedStatusFilter && !searchQuery
                   ? 'bg-gray-600 ring-2 ring-offset-2 ring-gray-300 shadow-lg scale-105'
                   : 'bg-gray-500'
               } ${isMobile ? 'h-12 justify-center col-span-2' : ''}`}
             >
               <span className="mr-2">{t.clientFixations.total}</span>
               <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">
                 {fixations.length}
               </span>
             </button>
           </div>
           {(searchQuery || selectedStatusFilter) && (
             <p className="text-xs text-gray-500 mt-2">
               * {t.clientFixations.statusFilters} 
               {searchQuery && ` ${t.clientFixations.searchFilter.replace('{query}', searchQuery)}`}
               {searchQuery && selectedStatusFilter && ', '}
               {selectedStatusFilter && ` ${t.clientFixations.statusFilter.replace('{status}', getStatusDisplayName(selectedStatusFilter))}`}
             </p>
           )}
         </div>
       )}
       
       {filteredFixations.length === 0 && fixations.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>{t.clientFixations.noSearchResults}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilteredFixations(fixations);
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            {t.clientFixations.clearSearch}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFixations.map((fixation) => (
          <Card key={fixation.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{fixation.clientName}</h3>
                {fixation.clientPhone && (
                  <p className="text-sm text-gray-600 font-medium">
                    {t.clientFixations.phone}: {fixation.clientPhone}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {t.clientFixations.agent}: {fixation.agentName}
                </p>
                <p className="text-sm text-gray-600">
                  {t.clientFixations.complex}: {fixation.complexName}
                </p>
                <p className="text-sm text-gray-600">
                  {t.clientFixations.developer}: {fixation.developerName}
                </p>
                <p className="text-sm text-gray-600">
                  {t.clientFixations.propertyType}: {getLocalizedPropertyType(fixation.propertyType)}
                </p>
                {fixation.rejectComment && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {t.clientFixations.rejectReason}: {fixation.rejectComment}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.clientFixations.rejectedBy}: {fixation.rejectedBy} ({formatDate(fixation.rejectedAt.seconds * 1000)})
                    </p>
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
                    {t.clientFixations.validUntil}: {formatDate(fixation.validUntil.seconds * 1000)}
                  </p>
                )}
              </div>
            </div>
            <div className={`${isMobile ? 'space-y-4' : 'flex justify-between'} mt-4`}>
              <div>
                {/* Проверяем статус "на согласовании" на всех языках */}
                {getStatusType(fixation.status) === 'pending' && 
                  (userRole === 'admin' || userRole === 'moderator' || ['застройщик', 'премиум застройщик'].includes(userRole)) && (
                  <div className={`${isMobile ? 'flex flex-col gap-2' : 'space-x-2'}`}>
                    <Button
                      onClick={() => openApproveDialog(fixation)}
                      className={`bg-green-500 hover:bg-green-600 text-white ${isMobile ? 'w-full h-12' : ''}`}
                    >
                      {t.clientFixations.accept}
                    </Button>
                    <Button
                      onClick={() => openRejectDialog(fixation)}
                      className={`bg-red-500 hover:bg-red-600 text-white ${isMobile ? 'w-full h-12' : ''}`}
                    >
                      {t.clientFixations.reject}
                    </Button>
                  </div>
                )}
              </div>
              <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'}`}>
                <Button
                  onClick={() => openChat(fixation)}
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  className={`${isMobile ? 'w-full h-12' : ''}`}
                >
                  {t.clientFixations.chatWithAgent}
                </Button>
                {(userRole === 'admin' || userRole === 'moderator') && (
                  <Button
                    onClick={() => openDeleteDialog(fixation)}
                    variant="outline"
                    size={isMobile ? "default" : "sm"}
                    className={`text-red-500 hover:text-red-700 hover:bg-red-50 ${isMobile ? 'w-full h-12' : ''}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}

      {/* Диалог подтверждения фиксации */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.clientFixations.confirmFixation}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.clientFixations.validUntilLabel}
            </label>
            <Input
              type="date"
              value={validUntilDate}
              onChange={(e) => setValidUntilDate(e.target.value)}
              min={formatDateForInput(new Date())}
              className="w-full"
            />
          </div>
          <DialogFooter className={`${isMobile ? 'flex-col gap-2' : 'flex-row gap-2'}`}>
            <Button
              variant="outline"
              onClick={closeApproveDialog}
              className={`${isMobile ? 'w-full h-12' : ''}`}
            >
              {t.clientFixations.cancel}
            </Button>
            <Button
              onClick={handleApproveFixation}
              className={`bg-green-500 hover:bg-green-600 text-white ${isMobile ? 'w-full h-12' : 'ml-2'}`}
            >
              {t.clientFixations.accept}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог отклонения фиксации */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.clientFixations.rejectFixation}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectComment" className="text-sm font-medium text-gray-700">
              {t.clientFixations.commentLabel} <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1">
              <Textarea
                id="rejectComment"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder={t.clientFixations.commentPlaceholder}
                className="w-full min-h-[100px]"
              />
            </div>
            {rejectComment.length < 10 && rejectComment.length > 0 && (
              <p className="text-sm text-red-500 mt-1">
                {t.clientFixations.commentMinLength.replace('{count}', 10 - rejectComment.length)}
              </p>
            )}
          </div>
          <DialogFooter className={`${isMobile ? 'flex-col gap-2' : 'flex-row gap-2'}`}>
            <Button
              variant="outline"
              onClick={closeRejectDialog}
              className={`${isMobile ? 'w-full h-12' : ''}`}
            >
              {t.clientFixations.cancel}
            </Button>
            <Button
              onClick={handleRejectFixation}
              className={`bg-red-500 hover:bg-red-600 text-white ${isMobile ? 'w-full h-12' : 'ml-2'}`}
              disabled={rejectComment.length < 10}
            >
              {t.clientFixations.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления фиксации */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.clientFixations.deleteFixation}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              {t.clientFixations.deleteConfirmation.replace('{clientName}', selectedFixation?.clientName || '')}
            </p>
            <p className="text-red-600 text-sm mt-2">
              {t.clientFixations.deleteWarning}
            </p>
          </div>
          <DialogFooter className={`${isMobile ? 'flex-col gap-2' : 'flex-row gap-2'}`}>
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              className={`${isMobile ? 'w-full h-12' : ''}`}
            >
              {t.clientFixations.cancel}
            </Button>
            <Button
              onClick={handleDeleteFixation}
              className={`bg-red-500 hover:bg-red-600 text-white ${isMobile ? 'w-full h-12' : 'ml-2'}`}
            >
              {t.clientFixations.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Компонент чата */}
      <FixationChat
        chatId={selectedChatId}
        agentId={selectedAgentId}
        isOpen={isChatOpen}
        onClose={closeChat}
      />
    </div>
  );
};

export default ClientFixations; 