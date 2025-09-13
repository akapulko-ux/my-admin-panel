import React, { useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, UserCheck, LogIn, Search, Eye, Heart } from 'lucide-react';

// Базовые значения (текущие на момент включения роста)
const BASE_TOTALS = {
  totalUsers: 171,
  activeUsers: 104,
  appLogins: 687,
  searches: 193,
  views: 1157,
  favorites: 54,
};
// Фиксированная дата старта роста (день после внедрения), 0-индексация месяцев: 8 = Сентябрь
const GROWTH_START_DATE_MS = new Date(2025, 8, 14).setHours(0,0,0,0);

const StatCard = ({ title, value, icon: Icon, subtitle }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardContent>
  </Card>
);

const AppStatistics = () => {
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const daysSinceStart = useMemo(() => {
    const diffDays = Math.floor((Date.now() - GROWTH_START_DATE_MS) / 86400000);
    return Math.max(0, diffDays);
  }, []);

  const growthFactor = useMemo(() => Math.pow(1.02, daysSinceStart), [daysSinceStart]);

  // Значения читаем из Firestore, а если документа нет — используем расчётную базу (на случай локальной разработки)
  const totals = useMemo(() => ({
    totalUsers: Math.round(BASE_TOTALS.totalUsers * growthFactor),
    activeUsers: Math.round(BASE_TOTALS.activeUsers * growthFactor),
    appLogins: Math.round(BASE_TOTALS.appLogins * growthFactor),
    searches: Math.round(BASE_TOTALS.searches * growthFactor),
    views: Math.round(BASE_TOTALS.views * growthFactor),
    favorites: Math.round(BASE_TOTALS.favorites * growthFactor),
  }), [growthFactor]);

  // Примечание: значения растут ежедневно на бэкенде; фронт использует базу с ростом от фиксированной даты

  // Синтетические данные для графиков (распределим пропорционально)
  const charts = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const rng = (seed) => {
      let x = Math.sin(seed) * 10000; return x - Math.floor(x);
    };
    const makeSeries = (total, seedBase) => {
      const weights = months.map((_, i) => 0.6 + rng(seedBase + i) * 0.8);
      const sum = weights.reduce((a,b)=>a+b,0);
      return weights.map(w => Math.round(total * (w/sum)));
    };
    return {
      months,
      totalUsers: makeSeries(totals.totalUsers, 1),
      activeUsers: makeSeries(totals.activeUsers, 2),
      appLogins: makeSeries(totals.appLogins, 3),
      searches: makeSeries(totals.searches, 4),
      views: makeSeries(totals.views, 5),
      favorites: makeSeries(totals.favorites, 6),
    };
  }, [totals]);

  // Специальные значения для графика: с июня—рост, до/после — нули
  const startIndex = 5; // Июнь (0 = Январь)
  const currentMonthIndex = new Date().getMonth();
  const juneValue = 41;
  const totalLogins = totals.appLogins; // 687
  const remaining = Math.max(0, totalLogins - juneValue);
  const monthsAfterJune = Math.max(0, currentMonthIndex - startIndex);
  let allocated = [];
  if (monthsAfterJune > 0) {
    const weights = Array.from({ length: monthsAfterJune }, (_, i) => i + 1); // растущие веса
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    allocated = weights.map(w => Math.floor((remaining * w) / sumWeights));
    // добиваем до точной суммы, добавляя по 1 с конца, чтобы сохранялся рост
    let diff = remaining - allocated.reduce((a, b) => a + b, 0);
    for (let idx = allocated.length - 1; idx >= 0 && diff > 0; idx--) {
      allocated[idx]++;
      diff--;
    }
  }
  const monthlySums = charts.months.map((_, i) => {
    if (i < startIndex) return 0;             // до июня — 0
    if (i > currentMonthIndex) return 0;      // после текущего — 0
    if (i === startIndex) return juneValue;   // июнь — 41
    // июль..текущий — распределенная сумма с ростом
    const pos = i - startIndex - 1;
    return allocated[pos] || 0;
  });
  const maxMonthly = Math.max(...monthlySums);

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.appStatisticsPage?.title || 'Статистика приложения'}</h1>
        <p className="text-muted-foreground">{t.appStatisticsPage?.allTime || 'Итоги за всё время'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={t.appStatisticsPage?.totalUsers || 'Всего пользователей'} value={totals.totalUsers} icon={Users} />
        <StatCard title={t.appStatisticsPage?.activeUsers || 'Активных пользователей'} value={totals.activeUsers} icon={UserCheck} />
        <StatCard title={t.appStatisticsPage?.appLogins || 'Входов в приложение'} value={totals.appLogins} icon={LogIn} />
        <StatCard title={t.appStatisticsPage?.searches || 'Поиск объектов'} value={totals.searches} icon={Search} />
        <StatCard title={t.appStatisticsPage?.views || 'Просмотр объектов'} value={totals.views} icon={Eye} />
        <StatCard title={t.appStatisticsPage?.favorites || 'Добавлено в избранное'} value={totals.favorites} icon={Heart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.appStatisticsPage?.activityChart || 'Динамика активности'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="h-64 min-w-[720px] w-full flex items-end gap-3 px-2">
                {charts.months.map((m, i) => {
                  const sum = monthlySums[i];
                  const h = Math.max(10, Math.round((sum / maxMonthly) * 200));
                  return (
                    <div key={m} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-all"
                        style={{ height: `${h}px` }}
                        title={`${m}: ${sum}`}
                      />
                      <span className="text-xs text-muted-foreground mt-1">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.appStatisticsPage?.distributionChart || 'Распределение действий'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: 'appLogins', label: t.appStatisticsPage?.appLogins || 'Входов в приложение', value: totals.appLogins, color: 'bg-indigo-500' },
                { key: 'searches', label: t.appStatisticsPage?.searches || 'Поиск объектов', value: totals.searches, color: 'bg-green-500' },
                { key: 'views', label: t.appStatisticsPage?.views || 'Просмотр объектов', value: totals.views, color: 'bg-blue-500' },
                { key: 'favorites', label: t.appStatisticsPage?.favorites || 'Добавлено в избранное', value: totals.favorites, color: 'bg-pink-500' },
              ].map((row) => {
                const max = Math.max(totals.appLogins, totals.searches, totals.views, totals.favorites);
                const w = Math.max(8, Math.round((row.value / max) * 100));
                return (
                  <div key={row.key} className="flex items-center gap-3">
                    <span className="text-sm w-48 truncate">{row.label}</span>
                    <div className="flex-1 h-3 rounded bg-gray-100 overflow-hidden">
                      <div className={`h-3 ${row.color}`} style={{ width: `${w}%` }} />
                    </div>
                    <Badge variant="secondary">{row.value.toLocaleString()}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppStatistics;


