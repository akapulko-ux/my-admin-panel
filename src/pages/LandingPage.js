import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Building2,
  Users2,
  LayoutGrid,
  Calculator,
  MessageSquare,
  UserCheck,
  ArrowRight
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
    <CardContent className="p-6">
      <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  const features = [
    {
      icon: Building2,
      title: "Управление объектами",
      description: "Удобный интерфейс для управления вашими объектами недвижимости"
    },
    {
      icon: LayoutGrid,
      title: "Шахматка проекта",
      description: "Интерактивная шахматка для визуализации и управления статусами юнитов"
    },
    {
      icon: Calculator,
      title: "ROI Калькулятор",
      description: "Автоматический расчет окупаемости и прибыльности инвестиций"
    },
    {
      icon: Users2,
      title: "Фиксация клиентов",
      description: "Система учета и управления обращениями агентов"
    },
    {
      icon: MessageSquare,
      title: "Поддержка 24/7",
      description: "Круглосуточная поддержка и консультации по всем вопросам"
    },
    {
      icon: UserCheck,
      title: "Личный кабинет",
      description: "Персональный доступ к статистике и управлению проектами"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">
            IT Agent Admin Panel
          </Link>
          <Link to="/login">
            <Button variant="default">
              Войти
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
            Система управления недвижимостью для застройщиков
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Современное решение для эффективного управления объектами недвижимости, 
            контроля продаж и взаимодействия с клиентами
          </p>
          <Link to="/login">
            <Button size="lg" className="px-8">
              Начать работу
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Преимущества платформы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-primary/5 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Готовы улучшить управление вашими проектами?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Присоединяйтесь к ведущим застройщикам, которые уже используют нашу платформу
            </p>
            <Link to="/login">
              <Button size="lg" variant="default" className="px-8">
                Используйте бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 IT Agent Admin Panel. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 