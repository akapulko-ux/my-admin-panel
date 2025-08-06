import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { useAuth } from '../AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
// Select компоненты убраны - отправляем всем пользователям
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Bell, Send, Clock, Users, AlertTriangle } from 'lucide-react';
import { 
  sendDeveloperNotification,
  getDeveloperNotificationHistory,
  getDeveloperNotificationStats,
  validateNotificationData,
  formatNotificationDate,
  getNotificationStatusColor,
  getNotificationStatusText
} from '../utils/notifications';
// Шаблоны убраны - оставляем только простую отправку

function Notifications() {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const t = translations[language].notificationsPage;
  const nav = translations[language].navigation;
  
  // Состояние формы
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // Упрощено: всегда отправляем всем пользователям
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояние статистики и истории
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState([]);
  
  // Состояние для уведомлений
  const [notification, setNotification] = useState(null);
  
  // Автоматическое скрытие уведомления
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Скрываем через 5 секунд
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    // Вызываем функции только если пользователь авторизован
    if (currentUser) {
      console.log('🔄 User authenticated, loading notification data...');
      loadStats();
      loadHistory();
    } else {
      console.log('⏳ Waiting for user authentication...');
    }
  }, [currentUser]); // Зависимость от currentUser

  // Функции загрузки данных
  const loadStats = async () => {
    try {
      const data = await getDeveloperNotificationStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getDeveloperNotificationHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Валидация формы
  const validateForm = () => {
    const validation = validateNotificationData(title, body, t.sendForm.validation);
    setErrors(validation.errors);
    setWarnings(validation.warnings);
    return validation.isValid;
  };

  // Обработка отправки уведомления
  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    // Проверяем авторизацию перед отправкой
    if (!currentUser) {
      setNotification({
        type: 'error',
        title: t.notifications.authError.title,
        message: t.notifications.authError.message
      });
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const notificationData = {
        title: title.trim(),
        body: body.trim(),
        targetAudience: 'all_users'
      };
      
      const result = await sendDeveloperNotification(notificationData);
      
      if (result.success) {
        // Показываем красивое уведомление об успехе
        setNotification({
          type: 'success',
          title: t.notifications.success.title,
          message: t.notifications.success.message
            .replace('{successCount}', result.successCount || 0)
            .replace('{failureCount}', result.failureCount || 0)
        });
        
        // Очищаем форму
        setTitle('');
        setBody('');
        
        // Обновляем данные
        loadStats();
        loadHistory();
      } else {
        setNotification({
          type: 'error',
          title: t.notifications.error.title,
          message: result.error || t.notifications.error.message
        });
      }
    } catch (error) {
      console.error('Send notification error:', error);
      setNotification({
        type: 'error',
        title: t.notifications.error.title,
        message: error.message || t.notifications.error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Шаблоны убраны

  return (
    <div className="space-y-6">
      {/* Уведомления */}
      {notification && (
        <div className={`p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.statistics.sentToday}</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sentToday}</div>
              <p className="text-xs text-muted-foreground">
                {t.statistics.remaining}: {Math.max(0, 10 - stats.sentToday)} {t.statistics.of} 10
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.statistics.totalSent}</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
              <p className="text-xs text-muted-foreground">
                {t.statistics.total}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.statistics.lastSent}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastSent ? formatNotificationDate(stats.lastSent, language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'ru-RU') : t.statistics.never}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">{t.tabs.send}</TabsTrigger>
          <TabsTrigger value="history">{t.tabs.history}</TabsTrigger>
        </TabsList>

        {/* Вкладка отправки */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                {t.sendForm.title}
              </CardTitle>
              <CardDescription>
                {t.sendForm.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t.sendForm.titleLabel}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.sendForm.titlePlaceholder}
                    maxLength={100}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {title.length}/100 {t.sendForm.characters}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">{t.sendForm.bodyLabel}</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t.sendForm.bodyPlaceholder}
                    rows={4}
                    maxLength={500}
                    className={errors.body ? 'border-red-500' : ''}
                  />
                  {errors.body && (
                    <p className="text-sm text-red-500">{errors.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {body.length}/500 {t.sendForm.characters}
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {t.sendForm.targetAudience}
                    </span>
                  </div>
                </div>

                {warnings.length > 0 && (
                  <Alert className="border-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {warnings.map((warning, index) => (
                          <p key={index}>{warning}</p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading || !title.trim() || !body.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      {t.sendForm.sending}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t.sendForm.sendButton}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка шаблонов убрана */}

        {/* Вкладка истории */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t.history.title}
              </CardTitle>
              <CardDescription>
                {t.history.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t.history.noNotifications}
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {notification.body}
                          </p>
                        </div>
                        <Badge 
                          variant={getNotificationStatusColor(notification.status)}
                        >
                          {getNotificationStatusText(notification.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatNotificationDate(notification.createdAt, language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'ru-RU')}</span>
                        <span>{t.history.sentToAllUsers}</span>
                        {notification.successCount !== undefined && (
                          <span>{t.history.delivered}: {notification.successCount}</span>
                        )}
                        {notification.failureCount !== undefined && notification.failureCount > 0 && (
                          <span className="text-red-500">{t.history.errors}: {notification.failureCount}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Notifications; 