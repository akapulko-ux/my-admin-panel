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

const DevLandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const t = landingTranslations[language];

  // Видео в зависимости от языка
  const getVideoUrl = () => {
    if (language === 'ru') {
      return 'https://youtu.be/T4lz_MFMefI';
    } else {
      return 'https://youtu.be/6DqVRzyNUmU';
    }
  };

  // Функция для извлечения ID видео из YouTube URL
  const getYouTubeEmbedUrl = (url) => {
    const videoId = url.split('v=')[1] || url.split('youtu.be/')[1];
    // Добавляем параметры для максимальной очистки интерфейса YouTube
    // controls=1 - показывать элементы управления
    // modestbranding=1 - скрыть логотип YouTube
    // rel=0 - не показывать связанные видео в конце
    // showinfo=0 - скрыть информацию о видео
    // iv_load_policy=3 - скрыть аннотации
    // cc_load_policy=0 - скрыть субтитры по умолчанию
    // fs=1 - разрешить полноэкранный режим
    // disablekb=1 - отключить управление с клавиатуры
    // autohide=1 - скрыть элементы управления после паузы
    // color=white - белый цвет элементов управления
    // theme=light - светлая тема
    // loop=0 - не зацикливать видео
    // playlist=${videoId} - для совместимости с loop
    return `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&cc_load_policy=0&fs=1&disablekb=1&autohide=1&color=white&theme=light&loop=0&playlist=${videoId}`;
  };

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
            <Select value={language} onValueChange={(lang) => changeLanguage(lang)}>
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

      {/* Video Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t.videoTitle}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.videoDescription}
          </p>
          <div className="max-w-4xl mx-auto">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                src={getYouTubeEmbedUrl(getVideoUrl())}
                title="Platform Demo Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  // Дополнительные стили для скрытия элементов YouTube
                  pointerEvents: 'auto'
                }}
              ></iframe>
              {/* CSS для скрытия элементов YouTube */}
              <style jsx>{`
                iframe {
                  position: relative;
                  z-index: 1;
                }
                /* Скрываем возможные оверлеи YouTube */
                iframe::before,
                iframe::after {
                  display: none !important;
                }
              `}</style>
            </div>
          </div>
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

export default DevLandingPage;
