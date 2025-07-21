import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card } from '../components/ui/card';
import { Bell } from 'lucide-react';

function Notifications() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.navigation.notifications}</h1>
        <p className="text-muted-foreground">
          Управление рассылкой уведомлений для ваших объектов
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Рассылка уведомлений</h3>
            <p className="text-muted-foreground">
              Этот раздел находится в разработке. Здесь вы сможете управлять рассылкой уведомлений для ваших объектов недвижимости.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Notifications; 