import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Bell, Send, History, Users, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, app, functions } from '../firebaseConfig';
import toast from 'react-hot-toast';

function Notifications() {
  const { language } = useLanguage();
  const { currentUser, role, auth } = useAuth();
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    title: '',
    body: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalSent: 0,
    totalFailed: 0
  });
  const [developerId, setDeveloperId] = useState(null);

  const sendDeveloperNotification = httpsCallable(functions, 'sendDeveloperNotification');
  
  // Для отладки в development
  if (process.env.NODE_ENV === 'development') {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('🔍 Подключен к Firebase Functions Emulator');
    } catch (error) {
      console.log('🔍 Firebase Functions Emulator не доступен, используем production');
    }
  }

  // Получаем developerId из Firestore при загрузке компонента
  useEffect(() => {
    const fetchDeveloperId = async () => {
      console.log('🔍 fetchDeveloperId - currentUser:', currentUser);
      console.log('🔍 fetchDeveloperId - role:', role);
      
      if (currentUser?.uid && role === 'премиум застройщик') {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('🔍 fetchDeveloperId - userData:', userData);
            setDeveloperId(userData.developerId);
          } else {
            console.log('❌ Пользователь не найден в Firestore');
          }
        } catch (error) {
          console.error('❌ Ошибка получения данных пользователя:', error);
        }
      }
    };
    
    fetchDeveloperId();
  }, [currentUser, role]);

  // Загружаем историю уведомлений
  useEffect(() => {
    if (currentUser?.uid && role === 'премиум застройщик' && developerId) {
      loadNotificationHistory();
    }
  }, [currentUser, role, developerId]);

  // Обновляем статистику после загрузки истории
  useEffect(() => {
    if ((notificationHistory.length > 0 || currentUser?.uid) && role === 'премиум застройщик' && developerId) {
      loadStats();
    }
  }, [notificationHistory, currentUser, role, developerId]);

  const loadNotificationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      if (!developerId) {
        console.log('❌ Developer ID не найден в состоянии');
        return;
      }

      const q = query(
        collection(db, 'developerNotifications'),
        where('developerId', '==', developerId),
        orderBy('sentAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotificationHistory(history);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      toast.error(t.notifications.historyError || 'Ошибка загрузки истории');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadStats = async () => {
    try {
      if (!developerId) {
        console.log('❌ Developer ID не найден в состоянии');
        return;
      }

      // Получаем количество агентов
      const agentsQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['agent', 'premium_agent'])
      );
      const agentsSnapshot = await getDocs(agentsQuery);
      
      // Подсчитываем общую статистику из истории
      const totalSent = notificationHistory.reduce((sum, notification) => sum + (notification.successCount || 0), 0);
      const totalFailed = notificationHistory.reduce((sum, notification) => sum + (notification.failureCount || 0), 0);
      
      setStats({
        totalAgents: agentsSnapshot.size,
        totalSent,
        totalFailed
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error(t.notifications.fillRequired || 'Заполните заголовок и текст уведомления');
      return;
    }

    if (!developerId) {
      toast.error('Developer ID не найден. Обратитесь к администратору.');
      return;
    }

    // Проверяем аутентификацию
    if (!auth.currentUser) {
      toast.error('Пользователь не аутентифицирован');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 Отладка отправки уведомления:');
      console.log('   User ID:', currentUser.uid);
      console.log('   User email:', currentUser.email);
      console.log('   User role:', role);
      console.log('   Developer ID from state:', developerId);
      console.log('   Title:', formData.title.trim());
      console.log('   Body:', formData.body.trim());
      console.log('   Auth state:', auth.currentUser);
      console.log('   Functions instance:', functions);

      const notificationData = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        developerId: developerId
      };

      console.log('🔍 Данные для отправки в функцию:', notificationData);

      // Передаем данные напрямую
      const result = await sendDeveloperNotification(notificationData);

      const data = result.data;
      
      if (data.success) {
        toast.success(
          t.notifications.sendSuccess
            .replace('{success}', data.sent)
            .replace('{failed}', data.failed) || 
          `Уведомления отправлены: ${data.sent} успешно, ${data.failed} неудачно`
        );
        
        // Очищаем форму
        setFormData({ title: '', body: '' });
        
        // Обновляем историю и статистику
        await loadNotificationHistory();
        await loadStats();
      } else {
        toast.error(t.notifications.sendError || 'Ошибка отправки уведомлений');
      }
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
      toast.error(t.notifications.sendError || 'Ошибка отправки уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ru-RU');
  };

  // Проверка доступа
  if (role !== 'премиум застройщик') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t.navigation.notifications}</h1>
          <p className="text-muted-foreground">
            Этот раздел доступен только для премиум застройщиков
          </p>
        </div>
        <Card className="p-6">
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Доступ ограничен</h3>
            <p className="text-muted-foreground">
              Раздел "Рассылка уведомлений" доступен только для пользователей с ролью "премиум застройщик".
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.navigation.notifications}</h1>
        <p className="text-muted-foreground">
          {t.notifications.subtitle || 'Отправка информационных сообщений агентам через iOS приложение'}
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t.notifications.iosDevices || 'iOS устройств'}
              </p>
              <p className="text-2xl font-bold">{stats.totalAgents}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t.notifications.success || 'Успешно'}
              </p>
              <p className="text-2xl font-bold">{stats.totalSent}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t.notifications.failed || 'Неудачно'}
              </p>
              <p className="text-2xl font-bold">{stats.totalFailed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Форма отправки */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {t.notifications.sendMessage || 'Отправить сообщение агентам'}
            </h3>
            <p className="text-muted-foreground">
              {t.notifications.subtitle || 'Отправка информационных сообщений агентам через iOS приложение'}
            </p>
          </div>
        </div>



        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">
              {t.notifications.titleLabel || 'Заголовок'}
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t.notifications.titlePlaceholder || 'Введите заголовок сообщения'}
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="body">
              {t.notifications.bodyLabel || 'Текст сообщения'}
            </Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder={t.notifications.bodyPlaceholder || 'Введите текст сообщения для агентов'}
              rows={4}
              maxLength={500}
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t.notifications.sending || 'Отправка...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t.notifications.sendButton || 'Отправить сообщение'}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* История уведомлений */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {t.notifications.history || 'История отправленных сообщений'}
          </h3>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-2">
              {t.notifications.loadingStats || 'Загрузка статистики...'}
            </p>
          </div>
        ) : notificationHistory.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {t.notifications.noNotifications || 'Нет отправленных сообщений'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notificationHistory.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{notification.title}</h4>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(notification.sentAt)}
                  </span>
                </div>
                <p className="text-muted-foreground mb-3">{notification.body}</p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {notification.successCount || 0} {t.notifications.success || 'успешно'}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {notification.failureCount || 0} {t.notifications.failed || 'неудачно'}
                  </span>
                  <span className="text-muted-foreground">
                    {notification.totalTokens || 0} {t.notifications.recipients || 'получателей'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Notifications; 