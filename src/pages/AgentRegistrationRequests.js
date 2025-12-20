import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useLanguage } from '../lib/LanguageContext';

const statusColors = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  processed: 'bg-blue-500'
};

const statusLabels = {
  pending: 'Ожидает рассмотрения',
  approved: 'Одобрена',
  rejected: 'Отклонена',
  processed: 'Обработана'
};

const AgentRegistrationRequests = () => {
  const { language } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    // Читаем заявки из отдельной коллекции для агентов
    const q = query(
      collection(db, 'agentRegistrationRequests'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
      
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Функция для получения локализованного значения статуса пользователя
  const getUserStatusLabel = (status) => {
    if (!status) return '';
    const statusMap = {
      agent: language === 'ru' ? 'Агент' : language === 'id' ? 'Agen' : 'Agent',
      agency: language === 'ru' ? 'Агентство' : language === 'id' ? 'Agensi' : 'Agency',
      developer: language === 'ru' ? 'Застройщик' : language === 'id' ? 'Pengembang' : 'Developer'
    };
    return statusMap[status] || status;
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      await updateDoc(doc(db, 'agentRegistrationRequests', requestId), {
        requestStatus: newStatus
      });
      toast.success('Статус заявки обновлен');
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      toast.error('Ошибка при обновлении статуса');
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-6`}>
        {language === 'ru' ? 'Заявки агентов' : language === 'id' ? 'Permintaan Agen' : 'Agent Requests'}
      </h1>
      
      <p className="text-muted-foreground mb-6">
        {language === 'ru' 
          ? 'Заявки от агентов и агентств на регистрацию в PROPWAY'
          : language === 'id'
          ? 'Permintaan dari agen dan agensi untuk pendaftaran di PROPWAY'
          : 'Requests from agents and agencies for registration in PROPWAY'
        }
      </p>
      
      {requests.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          {language === 'ru' ? 'Заявок пока нет' : language === 'id' ? 'Belum ada permintaan' : 'No requests yet'}
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex items-start justify-between'}`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                      {request.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {getUserStatusLabel(request.userStatus)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">
                        {language === 'ru' ? 'Email:' : language === 'id' ? 'Email:' : 'Email:'}
                      </span> {request.email}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === 'ru' ? 'Телефон:' : language === 'id' ? 'Telepon:' : 'Phone:'}
                      </span> {request.phone}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === 'ru' ? 'Дата подачи:' : language === 'id' ? 'Tanggal pengajuan:' : 'Submission date:'}
                      </span> {format(request.createdAt, 'dd.MM.yyyy HH:mm')}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === 'ru' ? 'Язык:' : language === 'id' ? 'Bahasa:' : 'Language:'}
                      </span> {request.language === 'ru' ? 'Русский' : request.language === 'id' ? 'Bahasa Indonesia' : 'English'}
                    </p>
                  </div>
                </div>

                <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex flex-col items-end space-y-2'}`}>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${statusColors[request.requestStatus] || 'bg-gray-500'} text-white`}
                    >
                      {statusLabels[request.requestStatus] || request.requestStatus}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    {request.requestStatus === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatus(request.id, 'approved')}
                          className="text-xs"
                        >
                          {language === 'ru' ? 'Одобрить' : language === 'id' ? 'Setujui' : 'Approve'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatus(request.id, 'rejected')}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          {language === 'ru' ? 'Отклонить' : language === 'id' ? 'Tolak' : 'Reject'}
                        </Button>
                      </>
                    )}
                    
                    {request.requestStatus === 'approved' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatus(request.id, 'processed')}
                        className="text-xs"
                      >
                        {language === 'ru' ? 'Обработать' : language === 'id' ? 'Proses' : 'Process'}
                      </Button>
                    )}
                    
                    {request.requestStatus === 'rejected' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatus(request.id, 'pending')}
                        className="text-xs"
                      >
                        {language === 'ru' ? 'Вернуть' : language === 'id' ? 'Kembalikan' : 'Return'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentRegistrationRequests;
