import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Users, 
  Eye, 
  TrendingUp, 
  MapPin,
  Building2,
  Building,
  BarChart3,
  Clock,
  Smartphone,
  Monitor,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle,
  UserCheck,
  Users2
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';

const Dashboard = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    topReferrers: [],
    deviceTypes: {},
    browserStats: {},
    geographicData: [],
    hourlyTraffic: [],
    dailyTraffic: [],
    monthlyTraffic: [],
    popularPages: [],
    conversionRate: 0,
    mobileVsDesktop: { mobile: 0, desktop: 0 },
    // Новая статистика по ролям
    visitsByRole: {},
    uniqueVisitorsByRole: {},
    authByRole: {},
    totalAuths: 0,
    authSuccessRate: 0,
    // Статистика переходов на объекты
    propertyVisits: [],
    propertyVisitsByRole: {},
    totalPropertyVisits: 0,
    topProperties: []
  });

  // Состояние для детальной информации об объектах
  const [propertyDetails, setPropertyDetails] = useState({});
  const [loadingPropertyDetails, setLoadingPropertyDetails] = useState(false);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
  const [lastUpdated, setLastUpdated] = useState(null);

  // Проверяем доступ к дашборду
  useEffect(() => {
    if (!['admin', 'moderator'].includes(role)) {
      showError('У вас нет доступа к этой странице');
      return;
    }
  }, [role]);

  // Функция для загрузки деталей объектов из БД
  const fetchPropertyDetails = useCallback(async (propertyIds) => {
    setLoadingPropertyDetails(true);
    const details = {};
    
    try {
      for (const propertyId of propertyIds) {
        try {
          const propertyRef = doc(db, "properties", propertyId);
          const propertySnap = await getDoc(propertyRef);
          
          if (propertySnap.exists()) {
            const propertyData = propertySnap.data();
            
            // Отладочная информация для понимания структуры данных
            console.log(`🔍 Данные объекта ${propertyId}:`, {
              title: propertyData.title,
              name: propertyData.name,
              complexName: propertyData.complexName,
              complex: propertyData.complex,
              complex_id: propertyData.complex_id,
              complexId: propertyData.complexId,
              developer: propertyData.developer,
              price: propertyData.price,
              district: propertyData.district
            });
            
            // Ищем название комплекса в различных полях
            let complexName = null;
            if (propertyData.complex && typeof propertyData.complex === 'string') {
              // Название комплекса хранится как строка в поле complex
              complexName = propertyData.complex;
            } else if (propertyData.complexName) {
              complexName = propertyData.complexName;
            } else if (propertyData.complex && typeof propertyData.complex === 'object' && propertyData.complex.name) {
              // Название комплекса в объекте complex.name
              complexName = propertyData.complex.name;
            } else if (propertyData.complex_id) {
              // Если есть только ID комплекса, попробуем получить название
              try {
                const complexRef = doc(db, "complexes", propertyData.complex_id);
                const complexSnap = await getDoc(complexRef);
                if (complexSnap.exists()) {
                  complexName = complexSnap.data().name;
                }
              } catch (error) {
                console.log(`Не удалось получить название комплекса для ${propertyId}:`, error);
              }
            } else if (propertyData.complexId) {
              // Альтернативное название поля
              try {
                const complexRef = doc(db, "complexes", propertyData.complexId);
                const complexSnap = await getDoc(complexRef);
                if (complexSnap.exists()) {
                  complexName = complexSnap.data().name;
                }
              } catch (error) {
                console.log(`Не удалось получить название комплекса для ${propertyId}:`, error);
              }
            }
            
            console.log(`✅ Название комплекса для ${propertyId}: "${complexName}"`);
            
            details[propertyId] = {
              title: propertyData.title || propertyData.name || `Объект ${propertyId}`,
              price: propertyData.price,
              complexName: complexName,
              developer: propertyData.developer,
              type: propertyData.type,
              status: propertyData.status,
              district: propertyData.district
            };
          }
        } catch (error) {
          console.error(`Ошибка при загрузке деталей объекта ${propertyId}:`, error);
          details[propertyId] = {
            title: `Объект ${propertyId}`,
            price: null,
            complexName: null,
            developer: null,
            type: null,
            status: null,
            district: null
          };
        }
      }
      
      setPropertyDetails(details);
    } finally {
      setLoadingPropertyDetails(false);
    }
  }, []);

  // Функция для получения данных аналитики
  const fetchAnalytics = useCallback(async () => {
    if (!['admin', 'moderator'].includes(role)) return;
    
    setLoading(true);
    try {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Получаем логи посещений главной публичной страницы (текущий маршрут '/')
      const visitsQueryRoot = query(
        collection(db, 'pageVisits'),
        where('page', '==', '/'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );
      const visitsSnapshotRoot = await getDocs(visitsQueryRoot);
      
      // Получаем данные об авторизациях пользователей
      const authQueryRoot = query(
        collection(db, 'userAuthLogs'),
        where('page', '==', '/'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      // Получаем данные о переходах на страницы объектов
      const propertyVisitsQuery = query(
        collection(db, 'pageVisits'),
        where('page', '>=', '/public/property/'),
        where('page', '<=', '/public/property/\uf8ff'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      let authSnapshot;
      let propertyVisitsSnapshot;
      
      try {
        const authSnapRoot = await getDocs(authQueryRoot);
        authSnapshot = { empty: authSnapRoot.empty, docs: [...authSnapRoot.docs] };
      } catch (error) {
        console.log('Коллекция userAuthLogs не найдена, продолжаем без данных авторизации');
        authSnapshot = { empty: true, docs: [] };
      }

      try {
        propertyVisitsSnapshot = await getDocs(propertyVisitsQuery);
      } catch (error) {
        console.log('Ошибка при получении данных о переходах на объекты:', error);
        propertyVisitsSnapshot = { empty: true, docs: [] };
      }
      
      const visits = [
        ...(visitsSnapshotRoot.empty ? [] : visitsSnapshotRoot.docs.map(doc => doc.data()))
      ];

      if (visits.length === 0 && authSnapshot.empty && propertyVisitsSnapshot.empty) {
        setAnalytics({
          totalVisits: 0,
          uniqueVisitors: 0,
          pageViews: 0,
          averageSessionDuration: 0,
          bounceRate: 0,
          topReferrers: [],
          deviceTypes: {},
          browserStats: {},
          geographicData: [],
          hourlyTraffic: [],
          dailyTraffic: [],
          monthlyTraffic: [],
          popularPages: [],
          conversionRate: 0,
          mobileVsDesktop: { mobile: 0, desktop: 0 },
          visitsByRole: {},
          uniqueVisitorsByRole: {},
          authByRole: {},
          totalAuths: 0,
          authSuccessRate: 0
        });
        setLoading(false);
        return;
      }

      const auths = authSnapshot.empty ? [] : authSnapshot.docs.map(doc => doc.data());
      const propertyVisits = propertyVisitsSnapshot.empty ? [] : propertyVisitsSnapshot.docs.map(doc => doc.data());
      
      // Анализируем данные посещений
      const uniqueUsers = new Set(visits.map(v => v.userId || v.sessionId));
      const deviceTypes = {};
      const browserStats = {};
      const referrers = {};
      const hourlyData = new Array(24).fill(0);
      const dailyData = new Array(7).fill(0);
      const monthlyData = {};
      const geographicData = {};
      
      // Статистика по ролям
      const visitsByRole = {};
      const uniqueVisitorsByRole = {};
      const authByRole = {};
      
      // Статистика переходов на объекты
      const propertyVisitsByRole = {};
      const propertyVisitsCount = {};
      const propertyVisitsDetails = {};
      
      let totalDuration = 0;
      let sessionsWithDuration = 0;
      let mobileCount = 0;
      let desktopCount = 0;

      // Обрабатываем посещения
      visits.forEach(visit => {
        // Подсчет по устройствам
        const deviceType = visit.deviceType || 'unknown';
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
        
        // Подсчет по браузерам
        const browser = visit.browser || 'unknown';
        browserStats[browser] = (browserStats[browser] || 0) + 1;
        
        // Подсчет по реферерам
        const referrer = visit.referrer || 'direct';
        referrers[referrer] = (referrers[referrer] || 0) + 1;
        
        // Подсчет по часам
        if (visit.timestamp) {
          const hour = visit.timestamp.toDate().getHours();
          hourlyData[hour]++;
        }
        
        // Подсчет по дням недели
        if (visit.timestamp) {
          const day = visit.timestamp.toDate().getDay();
          dailyData[day]++;
        }
        
        // Подсчет по месяцам
        if (visit.timestamp) {
          const month = visit.timestamp.toDate().toISOString().substring(0, 7);
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        }
        
        // Географические данные
        if (visit.country) {
          geographicData[visit.country] = (geographicData[visit.country] || 0) + 1;
        }
        
        // Длительность сессии
        if (visit.sessionDuration) {
          totalDuration += visit.sessionDuration;
          sessionsWithDuration++;
        }
        
        // Мобильные vs десктоп
        if (visit.deviceType === 'mobile') {
          mobileCount++;
        } else if (visit.deviceType === 'desktop') {
          desktopCount++;
        }

        // Статистика по ролям (если есть информация о роли)
        if (visit.userRole) {
          visitsByRole[visit.userRole] = (visitsByRole[visit.userRole] || 0) + 1;
        }
      });

      // Обрабатываем переходы на объекты
      console.log(`🔍 Всего переходов на объекты: ${propertyVisits.length}`);
      
      // Дедупликация: создаем уникальные ключи для каждого посещения
      const uniqueVisits = new Map();
      const duplicates = [];
      
      propertyVisits.forEach((visit, index) => {
        const propertyId = visit.page.split('/').pop();
        const timestamp = visit.timestamp?.toDate?.() || visit.timestamp;
        const sessionId = visit.sessionId || visit.userId || 'unknown';
        
        // Создаем уникальный ключ: sessionId + propertyId + timestamp (с точностью до секунды)
        const timestampKey = timestamp instanceof Date ? 
          Math.floor(timestamp.getTime() / 1000) : 
          Math.floor(new Date(timestamp).getTime() / 1000);
        const uniqueKey = `${sessionId}_${propertyId}_${timestampKey}`;
        
        console.log(`📊 Переход ${index + 1}: ${visit.page} -> ID: ${propertyId}, Роль: ${visit.userRole || 'guest'}, Время: ${timestamp}, Ключ: ${uniqueKey}`);
        
        if (uniqueVisits.has(uniqueKey)) {
          console.log(`🚫 Дубликат найден для ключа: ${uniqueKey}`);
          duplicates.push({ index: index + 1, propertyId, timestamp, uniqueKey });
        } else {
          uniqueVisits.set(uniqueKey, visit);
        }
      });
      
      console.log(`🔄 Дубликатов найдено: ${duplicates.length}`);
      if (duplicates.length > 0) {
        console.log('🚫 Список дубликатов:', duplicates);
      }
      
      // Обрабатываем только уникальные посещения
      Array.from(uniqueVisits.values()).forEach((visit) => {
        const propertyId = visit.page.split('/').pop();
        
        // Подсчитываем общее количество переходов на объект
        propertyVisitsCount[propertyId] = (propertyVisitsCount[propertyId] || 0) + 1;
        
        // Сохраняем детали объекта
        if (!propertyVisitsDetails[propertyId]) {
          propertyVisitsDetails[propertyId] = {
            id: propertyId,
            url: visit.page,
            title: visit.title || `Объект ${propertyId}`,
            visits: 0,
            visitsByRole: {},
            lastVisit: visit.timestamp
          };
        }
        propertyVisitsDetails[propertyId].visits++;
        
        // Статистика по ролям для переходов на объекты
        if (visit.userRole) {
          if (!propertyVisitsByRole[visit.userRole]) {
            propertyVisitsByRole[visit.userRole] = 0;
          }
          propertyVisitsByRole[visit.userRole]++;
          
          if (!propertyVisitsDetails[propertyId].visitsByRole[visit.userRole]) {
            propertyVisitsDetails[propertyId].visitsByRole[visit.userRole] = 0;
          }
          propertyVisitsDetails[propertyId].visitsByRole[visit.userRole]++;
        }
      });
      
      // Отладочная информация о результатах подсчета
      console.log('📈 Результаты подсчета переходов (после дедупликации):');
      Object.entries(propertyVisitsCount).forEach(([propertyId, count]) => {
        console.log(`  ${propertyId}: ${count} переходов`);
      });

      // Обрабатываем авторизации
      let totalAuths = 0;
      let successfulAuths = 0;
      
      auths.forEach(auth => {
        totalAuths++;
        
        if (auth.success) {
          successfulAuths++;
        }
        
        // Статистика авторизаций по ролям
        if (auth.userRole) {
          if (!authByRole[auth.userRole]) {
            authByRole[auth.userRole] = { total: 0, successful: 0 };
          }
          authByRole[auth.userRole].total++;
          if (auth.success) {
            authByRole[auth.userRole].successful++;
          }
        }
      });

      // Сортируем топ рефереров
      const topReferrers = Object.entries(referrers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([referrer, count]) => ({ referrer, count }));

      // Сортируем географические данные
      const sortedGeographicData = Object.entries(geographicData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }));

      // Сортируем месячные данные
      const sortedMonthlyData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      // Названия дней недели
      const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const dailyTraffic = dailyData.map((count, index) => ({
        day: dayNames[index],
        count
      }));

      // Формируем топ объектов по количеству переходов
      const topProperties = Object.values(propertyVisitsDetails)
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

      setAnalytics({
        totalVisits: visits.length,
        uniqueVisitors: uniqueUsers.size,
        pageViews: visits.length,
        averageSessionDuration: sessionsWithDuration > 0 ? Math.round(totalDuration / sessionsWithDuration) : 0,
        bounceRate: 0, // Пока не реализовано
        topReferrers,
        deviceTypes,
        browserStats,
        geographicData: sortedGeographicData,
        hourlyTraffic: hourlyData.map((count, hour) => ({ hour, count })),
        dailyTraffic,
        monthlyTraffic: sortedMonthlyData,
        popularPages: [], // Пока не реализовано
        conversionRate: 0, // Пока не реализовано
        mobileVsDesktop: { mobile: mobileCount, desktop: desktopCount },
        visitsByRole,
        uniqueVisitorsByRole,
        authByRole,
        totalAuths,
        authSuccessRate: totalAuths > 0 ? Math.round((successfulAuths / totalAuths) * 100) : 0,
        propertyVisits: Object.values(propertyVisitsDetails),
        propertyVisitsByRole,
        totalPropertyVisits: Object.values(propertyVisitsCount).reduce((sum, count) => sum + count, 0),
        topProperties
      });

      // Загружаем детали объектов для топ-10
      if (topProperties.length > 0) {
        const propertyIds = topProperties.map(prop => prop.id);
        await fetchPropertyDetails(propertyIds);
      }

      setLastUpdated(new Date());
      showSuccess('Данные аналитики обновлены');
      
    } catch (error) {
      console.error('Ошибка при получении аналитики:', error);
      showError('Ошибка при получении данных аналитики');
    } finally {
      setLoading(false);
    }
  }, [timeRange, role, fetchPropertyDetails]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Компонент для отображения статистики
  const StatCard = ({ title, value, icon: Icon, subtitle, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Компонент для отображения графика
  const ChartCard = ({ title, children, className = "" }) => (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  if (!['admin', 'moderator'].includes(role)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Доступ запрещен</h1>
          <p className="text-muted-foreground">У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Дашборд аналитики</h1>
          <p className="text-muted-foreground">
            Аналитика использования публичной главной страницы
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Последние 7 дней</option>
            <option value="30d">Последние 30 дней</option>
            <option value="90d">Последние 90 дней</option>
          </select>
          
          <Button
            onClick={fetchAnalytics}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Обновить
          </Button>
        </div>
      </div>

      {/* Информация о последнем обновлении */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
        </div>
      )}

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Всего посещений"
          value={analytics.totalVisits.toLocaleString()}
          icon={Eye}
          subtitle="За выбранный период"
        />
        <StatCard
          title="Уникальные посетители"
          value={analytics.uniqueVisitors.toLocaleString()}
          icon={Users}
          subtitle="Новые пользователи"
        />
        <StatCard
          title="Просмотры страниц"
          value={analytics.pageViews.toLocaleString()}
          icon={BarChart3}
          subtitle="Общее количество просмотров"
        />
        <StatCard
          title="Средняя длительность"
          value={`${Math.floor(analytics.averageSessionDuration / 60)}:${(analytics.averageSessionDuration % 60).toString().padStart(2, '0')}`}
          icon={Clock}
          subtitle="Время на сайте"
        />
      </div>

      {/* Дополнительные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Мобильные устройства"
          value={analytics.mobileVsDesktop.mobile.toLocaleString()}
          icon={Smartphone}
          subtitle={`${analytics.mobileVsDesktop.mobile + analytics.mobileVsDesktop.desktop > 0 ? Math.round((analytics.mobileVsDesktop.mobile / (analytics.mobileVsDesktop.mobile + analytics.mobileVsDesktop.desktop)) * 100) : 0}% от общего трафика`}
        />
        <StatCard
          title="Десктопные устройства"
          value={analytics.mobileVsDesktop.desktop.toLocaleString()}
          icon={Monitor}
          subtitle={`${analytics.mobileVsDesktop.mobile + analytics.mobileVsDesktop.desktop > 0 ? Math.round((analytics.mobileVsDesktop.desktop / (analytics.mobileVsDesktop.mobile + analytics.mobileVsDesktop.desktop)) * 100) : 0}% от общего трафика`}
        />
        <StatCard
          title="Страна"
          value={analytics.geographicData.length > 0 ? analytics.geographicData[0].country : 'N/A'}
          icon={MapPin}
          subtitle={analytics.geographicData.length > 0 ? `${analytics.geographicData[0].count} посещений` : 'Нет данных'}
        />
      </div>

      {/* Статистика по ролям и авторизациям */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Всего авторизаций"
          value={analytics.totalAuths.toLocaleString()}
          icon={Users}
          subtitle="За выбранный период"
        />
        <StatCard
          title="Успешные авторизации"
          value={`${analytics.authSuccessRate}%`}
          icon={CheckCircle}
          subtitle="Процент успешных входов"
        />
        <StatCard
          title="Авторизованные пользователи"
          value={Object.keys(analytics.authByRole).length > 0 ? 
            Object.values(analytics.authByRole).reduce((sum, role) => sum + role.total, 0) : 0}
          icon={UserCheck}
          subtitle="Количество входов в систему"
        />
        <StatCard
          title="Активные роли"
          value={Object.keys(analytics.visitsByRole).length.toLocaleString()}
          icon={Users2}
          subtitle="Различные роли посетителей"
        />
      </div>

      {/* Статистика переходов на объекты */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Переходы на объекты"
          value={analytics.totalPropertyVisits.toLocaleString()}
          icon={Building2}
          subtitle="Общее количество переходов"
        />
        <StatCard
          title="Уникальные объекты"
          value={analytics.propertyVisits.length.toLocaleString()}
          icon={Building}
          subtitle="Количество просмотренных объектов"
        />
        <StatCard
          title="Средние переходы"
          value={analytics.propertyVisits.length > 0 ? 
            Math.round(analytics.totalPropertyVisits / analytics.propertyVisits.length) : 0}
          icon={BarChart3}
          subtitle="На один объект"
        />
      </div>

      {/* Графики и детальная аналитика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Трафик по часам */}
        <ChartCard title="Трафик по часам">
          <div className="h-64 flex items-end justify-between gap-1">
            {analytics.hourlyTraffic.map(({ hour, count }, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ 
                    height: `${Math.max(10, (count / Math.max(...analytics.hourlyTraffic.map(h => h.count))) * 200)}px` 
                  }}
                  title={`${hour}:00 - ${count} посещений`}
                />
                <span className="text-xs text-muted-foreground mt-1">{hour}:00</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Трафик по дням недели */}
        <ChartCard title="Трафик по дням недели">
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.dailyTraffic.map(({ day, count }, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-12 bg-green-500 rounded-t transition-all hover:bg-green-600"
                  style={{ 
                    height: `${Math.max(10, (count / Math.max(...analytics.dailyTraffic.map(d => d.count))) * 200)}px` 
                  }}
                  title={`${day} - ${count} посещений`}
                />
                <span className="text-xs text-muted-foreground mt-1 text-center">
                  {day.substring(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Топ рефереров и географические данные */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Топ источников трафика">
          <div className="space-y-3">
            {analytics.topReferrers.map(({ referrer, count }, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm truncate max-w-48" title={referrer}>
                    {referrer === 'direct' ? 'Прямой переход' : referrer}
                  </span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {analytics.topReferrers.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Нет данных о реферерах</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Географическое распределение">
          <div className="space-y-3">
            {analytics.geographicData.map(({ country, count }, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm">{country}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {analytics.geographicData.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Нет географических данных</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Устройства и браузеры */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Типы устройств">
          <div className="space-y-3">
            {Object.entries(analytics.deviceTypes).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {device === 'mobile' ? 'Мобильные' : 
                   device === 'desktop' ? 'Десктоп' : 
                   device === 'tablet' ? 'Планшеты' : device}
                </span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(analytics.deviceTypes).length === 0 && (
              <p className="text-muted-foreground text-center py-4">Нет данных об устройствах</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Популярные браузеры">
          <div className="space-y-3">
            {Object.entries(analytics.browserStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([browser, count]) => (
                <div key={browser} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{browser}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            {Object.keys(analytics.browserStats).length === 0 && (
              <p className="text-muted-foreground text-center py-4">Нет данных о браузерах</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Статистика по ролям */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Посещения по ролям">
          <div className="space-y-3">
            {Object.entries(analytics.visitsByRole)
              .sort(([,a], [,b]) => b - a)
              .map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {role === 'admin' ? 'Администратор' :
                     role === 'moderator' ? 'Модератор' :
                     role === 'agent' ? 'Агент' :
                     role === 'premium agent' ? 'Премиум агент' :
                     role === 'застройщик' ? 'Застройщик' :
                     role === 'премиум застройщик' ? 'Премиум застройщик' :
                     role === 'user' ? 'Пользователь' : role}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            {Object.keys(analytics.visitsByRole).length === 0 && (
              <p className="text-muted-foreground text-center py-4">Нет данных о ролях посетителей</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Авторизации по ролям">
          <div className="space-y-3">
            {Object.entries(analytics.authByRole)
              .sort(([,a], [,b]) => b.total - a.total)
              .map(([role, data]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm capitalize font-medium">
                      {role === 'admin' ? 'Администратор' :
                       role === 'moderator' ? 'Модератор' :
                       role === 'agent' ? 'Агент' :
                       role === 'premium agent' ? 'Премиум агент' :
                       role === 'застройщик' ? 'Застройщик' :
                       role === 'премиум застройщик' ? 'Премиум застройщик' :
                       role === 'user' ? 'Пользователь' : role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {data.successful}/{data.total} успешно
                    </span>
                  </div>
                  <Badge variant="outline">{data.total}</Badge>
                </div>
              ))}
            {Object.keys(analytics.authByRole).length === 0 && (
              <p className="text-muted-foreground text-center py-4">Нет данных об авторизациях</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Топ объектов по переходам */}
      <ChartCard title="Топ объектов по количеству переходов">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (analytics.topProperties.length > 0) {
                  const propertyIds = analytics.topProperties.map(prop => prop.id);
                  fetchPropertyDetails(propertyIds);
                }
              }}
              disabled={loadingPropertyDetails}
            >
              {loadingPropertyDetails ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Обновление...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Обновить детали
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {loadingPropertyDetails && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Загрузка деталей объектов...</span>
            </div>
          )}
          {!loadingPropertyDetails && analytics.topProperties.map((property, index) => {
            const details = propertyDetails[property.id] || {};
            return (
              <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                                     <div className="flex flex-col min-w-0 flex-1">
                     <span className="text-sm font-medium truncate" title={details.complexName || details.title || property.title || `Объект ${property.id}`}>
                       {details.complexName || details.title || property.title || `Объект ${property.id}`}
                     </span>
                     <div className="flex flex-wrap gap-2 mt-1">
                       {details.price && (
                         <span className="text-xs text-green-600 font-medium">
                           ${details.price.toLocaleString()}
                         </span>
                       )}
                       {details.developer && (
                         <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                           {details.developer}
                         </span>
                       )}
                       {details.district && (
                         <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                           {details.district}
                         </span>
                       )}
                     </div>
                     <span className="text-xs text-muted-foreground mt-1">
                       ID: {property.id}
                     </span>
                   </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="secondary">{property.visits}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(property.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!loadingPropertyDetails && analytics.topProperties.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Нет данных о переходах на объекты</p>
          )}
        </div>
      </ChartCard>

      {/* Переходы на объекты по ролям */}
      <ChartCard title="Переходы на объекты по ролям">
        <div className="space-y-3">
          {Object.entries(analytics.propertyVisitsByRole)
            .sort(([,a], [,b]) => b - a)
            .map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {role === 'admin' ? 'Администратор' :
                   role === 'moderator' ? 'Модератор' :
                   role === 'agent' ? 'Агент' :
                   role === 'premium agent' ? 'Премиум агент' :
                   role === 'застройщик' ? 'Застройщик' :
                   role === 'премиум застройщик' ? 'Премиум застройщик' :
                   role === 'user' ? 'Пользователь' : 
                   role === 'guest' ? 'Гость' : role}
                </span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          {Object.keys(analytics.propertyVisitsByRole).length === 0 && (
            <p className="text-muted-foreground text-center py-4">Нет данных о переходах по ролям</p>
          )}
        </div>
      </ChartCard>

      {/* Кнопка для перехода на публичную страницу */}
      <div className="text-center">
        <Button
          onClick={() => window.open('/', '_blank')}
          className="gap-2"
          size="lg"
        >
          <ExternalLink className="h-4 w-4" />
          Открыть главную страницу
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
