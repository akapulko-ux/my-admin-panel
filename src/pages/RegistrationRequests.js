import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors = {
  new: 'bg-blue-500',
  processing: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500'
};

const statusLabels = {
  new: 'Новая',
  processing: 'В обработке',
  approved: 'Одобрена',
  rejected: 'Отклонена'
};

const RegistrationRequests = () => {
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
    const q = query(collection(db, 'registrationRequests'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (requestId, newStatus) => {
    try {
      await updateDoc(doc(db, 'registrationRequests', requestId), {
        status: newStatus
      });
      toast.success('Статус заявки обновлен');
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      toast.error('Не удалось обновить статус заявки');
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-6`}>Заявки на регистрацию</h1>
      
      {requests.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          Нет заявок на регистрацию
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex items-start justify-between'}`}>
                <div className="space-y-2">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>{request.companyName}</h3>
                  <div className="text-sm text-muted-foreground">
                    <p>Имя: {request.name}</p>
                    <p>Email: {request.email}</p>
                    <p>Телефон: {request.phone}</p>
                    <p>Дата заявки: {format(request.createdAt, 'dd.MM.yyyy HH:mm')}</p>
                  </div>
                </div>
                <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex flex-col items-end space-y-2'}`}>
                  <Badge className={statusColors[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                  {request.status === 'new' && (
                    <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
                      <Button
                        size={isMobile ? "default" : "sm"}
                        variant="outline"
                        onClick={() => updateStatus(request.id, 'processing')}
                        className={`${isMobile ? 'w-full h-12' : ''}`}
                      >
                        Взять в работу
                      </Button>
                      <Button
                        size={isMobile ? "default" : "sm"}
                        variant="default"
                        onClick={() => updateStatus(request.id, 'approved')}
                        className={`${isMobile ? 'w-full h-12' : ''}`}
                      >
                        Одобрить
                      </Button>
                      <Button
                        size={isMobile ? "default" : "sm"}
                        variant="destructive"
                        onClick={() => updateStatus(request.id, 'rejected')}
                        className={`${isMobile ? 'w-full h-12' : ''}`}
                      >
                        Отклонить
                      </Button>
                    </div>
                  )}
                  {request.status === 'processing' && (
                    <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
                      <Button
                        size={isMobile ? "default" : "sm"}
                        variant="default"
                        onClick={() => updateStatus(request.id, 'approved')}
                        className={`${isMobile ? 'w-full h-12' : ''}`}
                      >
                        Одобрить
                      </Button>
                      <Button
                        size={isMobile ? "default" : "sm"}
                        variant="destructive"
                        onClick={() => updateStatus(request.id, 'rejected')}
                        className={`${isMobile ? 'w-full h-12' : ''}`}
                      >
                        Отклонить
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationRequests; 