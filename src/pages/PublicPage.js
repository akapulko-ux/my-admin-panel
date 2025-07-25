import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card } from '../components/ui/card';
import { Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';

function PublicPage() {
  const { language } = useLanguage();
  const { role } = useAuth();
  const t = translations[language];

  // Проверка доступа
  if (role !== 'премиум застройщик') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t.navigation.publicPage}</h1>
          <p className="text-muted-foreground">
            Этот раздел доступен только для премиум застройщиков
          </p>
        </div>
        <Card className="p-6">
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Доступ ограничен</h3>
            <p className="text-muted-foreground">
              Раздел "Публичная страница" доступен только для пользователей с ролью "премиум застройщик".
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.navigation.publicPage}</h1>
        <p className="text-muted-foreground">
          Настройка публичной страницы для ваших объектов
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe className="h-6 w-6 text-green-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Публичная страница</h3>
            <p className="text-muted-foreground">
              Этот раздел находится в разработке. Здесь вы сможете настроить публичную страницу для демонстрации ваших объектов недвижимости.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PublicPage; 