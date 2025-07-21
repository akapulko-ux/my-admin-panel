import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card } from '../components/ui/card';
import { Star } from 'lucide-react';

function PremiumFeatures() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.navigation.premiumFeatures}</h1>
        <p className="text-muted-foreground">
          Расширенные возможности для премиум аккаунтов
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="h-6 w-6 text-yellow-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Премиум функции</h3>
            <p className="text-muted-foreground">
              Этот раздел находится в разработке. Здесь будут доступны расширенные возможности для премиум аккаунтов.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PremiumFeatures; 