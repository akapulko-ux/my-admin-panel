import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { 
  Star, 
  Smartphone, 
  Bell, 
  Shield, 
  Globe, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Crown,
  Zap,
  Target,
  Bot
} from 'lucide-react';

function PremiumFeatures() {
  const { language } = useLanguage();
  const t = translations[language].premiumFeatures;

  const handleSubscribe = () => {
    window.open('https://aicoming.burned.pro/product-page/premium-agent', '_blank');
  };

  const features = [
    {
      icon: Smartphone,
      ...t.features.iosAppPlacement
    },
    {
      icon: Bell,
      ...t.features.pushNotifications
    },
    {
      icon: Shield,
      ...t.features.verifiedBadge
    },
    {
      icon: Globe,
      ...t.features.publicWebPage
    },
    {
      icon: Star,
      ...t.features.ratingBoost
    },
    {
      icon: Bot,
      ...t.features.aiTelegramBot
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Заголовок */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      {/* Основные преимущества */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
                  <feature.icon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {feature.benefit}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Дополнительные преимущества */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-yellow-600" />
            <CardTitle className="text-xl">{t.additionalBenefits}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {t.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold text-blue-600">100+</span>
            </div>
            <p className="text-muted-foreground">{t.statistics.agents}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold text-green-600">5x</span>
            </div>
            <p className="text-muted-foreground">{t.statistics.viewsIncrease}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-8 w-8 text-purple-600" />
              <span className="text-3xl font-bold text-purple-600">24/7</span>
            </div>
            <p className="text-muted-foreground">{t.statistics.availability}</p>
          </CardContent>
        </Card>
      </div>

      {/* CTA секция */}
      <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="h-8 w-8" />
              <h2 className="text-3xl font-bold">{t.cta.title}</h2>
            </div>
            <p className="text-xl opacity-90">
              {t.cta.subtitle}
            </p>
            <Button 
              size="lg" 
              className="bg-white text-yellow-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg"
              onClick={handleSubscribe}
            >
              {t.cta.subscribeButton}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm opacity-75">
              {t.cta.footer}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PremiumFeatures; 