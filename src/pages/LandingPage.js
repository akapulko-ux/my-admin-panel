import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { landingTranslations } from '../lib/landingTranslations';
import { useLanguage } from '../lib/LanguageContext';
import RegistrationRequestModal from '../components/RegistrationRequestModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const t = landingTranslations[language];

  const features = [
    {
      icon: Building2,
      title: t.features.propertyManagement.title,
      description: t.features.propertyManagement.description
    },
    {
      icon: LayoutGrid,
      title: t.features.projectChessboard.title,
      description: t.features.projectChessboard.description
    },
    {
      icon: Calculator,
      title: t.features.roiCalculator.title,
      description: t.features.roiCalculator.description
    },
    {
      icon: Users2,
      title: t.features.clientFixation.title,
      description: t.features.clientFixation.description
    },
    {
      icon: MessageSquare,
      title: t.features.support.title,
      description: t.features.support.description
    },
    {
      icon: UserCheck,
      title: t.features.personalAccount.title,
      description: t.features.personalAccount.description
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
          <div className="flex items-center gap-4">
            <Select value={language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-[120px]">
                <SelectValue>
                  {language === 'ru' ? 'Русский' : language === 'en' ? 'English' : 'Bahasa'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Bahasa</SelectItem>
              </SelectContent>
            </Select>
            <Link to="/login">
              <Button variant="ghost">{t.login}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text leading-normal md:leading-relaxed">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.heroDescription}
          </p>
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
            {t.getStarted}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t.platformBenefits}
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
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t.ctaDescription}
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="lg">
              {t.useFree}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>{t.footerText}</p>
        </div>
      </footer>

      {/* Registration Request Modal */}
      <RegistrationRequestModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        language={language}
      />
    </div>
  );
};

export default LandingPage; 