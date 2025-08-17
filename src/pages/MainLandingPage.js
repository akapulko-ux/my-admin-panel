import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  TrendingUp,
  Users2,
  Building2,
  ArrowRight,
  Globe,
  BarChart3,
  Shield,
  Zap,
  Target,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, collection } from 'firebase/firestore';

const MainLandingPage = () => {
  const { language, changeLanguage } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Устанавливаем английский как основной язык, если язык не определен
  React.useEffect(() => {
    if (!language) {
      changeLanguage('en');
    }
  }, [language, changeLanguage]);
  
  // Состояние для модального окна авторизации
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Состояние для формы входа
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояние для формы регистрации
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regStatus, setRegStatus] = useState('agent');
  const [isRegLoading, setIsRegLoading] = useState(false);
  
  const statuses = [
    { value: 'agent', ru: 'Агент', en: 'Agent', id: 'Agen' },
    { value: 'agency', ru: 'Агентство', en: 'Agency', id: 'Agensi' },
    { value: 'developer', ru: 'Застройщик', en: 'Developer', id: 'Pengembang' },
  ];
  
  const statusLabel = (code) => {
    const item = statuses.find(s => s.value === code);
    if (!item) return code;
    return language === 'ru' ? item.ru : language === 'id' ? item.id : item.en;
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await login(email, password);
      setIsAuthModalOpen(false);
      // Перенаправляем на страницу /public после успешного входа
      navigate('/public');
    } catch (err) {
      console.error(err);
      setErrorMessage('Ошибка входа. Проверьте email и пароль.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setIsRegLoading(true);
      
      // Создаем заявку на регистрацию
      const registrationRequest = {
        name: regName,
        phone: regPhone,
        email: regEmail,
        userStatus: regStatus,
        requestStatus: 'pending',
        createdAt: new Date(),
        language: language || 'ru'
      };
      
      // Сохраняем заявку в отдельную коллекцию для агентов
      const requestRef = doc(collection(db, 'agentRegistrationRequests'));
      await setDoc(requestRef, registrationRequest);
      
      // Показываем окно успешной подачи заявки
      setShowSuccess(true);
    } catch (err) {
      console.error('Registration request error', err);
      
      // Определяем понятное сообщение об ошибке
      let errorMsg = 'Ошибка при отправке заявки. Попробуйте еще раз.';
      
      if (err.code === 'permission-denied') {
        errorMsg = 'Ошибка доступа. Попробуйте еще раз.';
      } else if (err.code === 'unavailable') {
        errorMsg = 'Сервис временно недоступен. Попробуйте позже.';
      } else if (err.message) {
        errorMsg = `Ошибка: ${err.message}`;
      }
      
      setErrorMessage(errorMsg);
      setShowError(true);
    } finally {
      setIsRegLoading(false);
    }
  };

  // Переводы для нового лендинга
  const t = {
    en: {
      title: "Welcome to IT Agent Platform",
      subtitle: "Your comprehensive solution for real estate investment in Bali",
      investors: {
        title: "For Investors",
        subtitle: "Discover profitable investment opportunities",
        description: "Access exclusive properties, detailed analytics, and ROI calculations. Make informed investment decisions with our comprehensive market insights and professional support.",
        features: [
          "Exclusive property listings",
          "Verified real estate properties",
          "Market trend insights",
          "Professional investment consultation"
        ],
        cta: "Explore Investments",
        link: "/public"
      },
      agents: {
        title: "For Real Estate Agents",
        subtitle: "Enhance your business with powerful tools",
        description: "Get access to the complete listing of Bali's developer properties, advanced tools, and comprehensive support to boost your sales and client management.",
        features: [
          "Complete property database",
          "Advanced search system",
          "Direct interaction with developers",
          "Professional realtor tools"
        ],
        cta: "Join as Agent",
        link: "/public"
      },
      developers: {
        title: "For Developers",
        subtitle: "Streamline your property management",
        description: "Efficiently manage your real estate projects, track sales progress, and interact with clients through our comprehensive management platform.",
        features: [
          "Property management system",
          "Sales progress tracking",
          "Agent and client interaction tools",
          "Project chessboard management"
        ],
        cta: "Developer Portal",
        link: "/dev"
      },
      languageSwitch: "Language",
      russian: "Русский",
      english: "English",
      indonesian: "Bahasa",
      // Features Overview section
      featuresOverview: {
        analytics: {
          title: "Analytics",
          description: "Comprehensive market insights and ROI calculations"
        },
        security: {
          title: "Security",
          description: "Secure platform with data protection and privacy"
        },
        performance: {
          title: "Performance",
          description: "Fast and responsive platform for optimal user experience"
        },
        precision: {
          title: "Precision",
          description: "Accurate data and reliable information for decision making"
        }
      },
      // Footer
      footer: {
        tagline: "Your trusted partner in Bali real estate",
        copyright: "© 2025 IT Agent Platform. All rights reserved."
      },
      // Auth Modal
      authModal: {
        title: "Agent Authorization",
        loginTab: "Login",
        registerTab: "Registration Request",
        email: "Email",
        password: "Password",
        name: "Name",
        phone: "Phone",
        status: "Status",
        loginButton: "Login",
        submitRequest: "Submit Request",
        backButton: "Back",
        successTitle: "Thank you for your application!",
        successMessage: "Our specialists will contact you soon.",
        successAppInfo: "In the meantime, you can download and install our IT Agent app for realtors on iPhone and iPad. In it you will find a complete listing of complexes and properties from Bali developers and many convenient tools for realtors.",
        installButton: "Install IT Agent"
      }
    },
    ru: {
      title: "Добро пожаловать на платформу IT Agent",
      subtitle: "Ваше комплексное решение для инвестиций в недвижимость на Бали",
      investors: {
        title: "Для инвесторов",
        subtitle: "Откройте прибыльные инвестиционные возможности",
        description: "Получите доступ к эксклюзивным объектам, детальной аналитике и расчетам ROI. Принимайте обоснованные инвестиционные решения с нашими комплексными рыночными инсайтами и профессиональной поддержкой.",
        features: [
          "Эксклюзивные листинги объектов",
          "Проверенные объекты недвижимости",
          "Рыночные тренды",
          "Профессиональная инвестиционная консультация"
        ],
        cta: "Изучить инвестиции",
        link: "/public"
      },
      agents: {
        title: "Для риелторов",
        subtitle: "Развивайте свой бизнес с мощными инструментами",
        description: "Получите доступ к полному листингу объектов застройщиков Бали, продвинутым инструментам и комплексной поддержке для увеличения продаж и управления клиентами.",
        features: [
          "Полная база объектов",
          "Продвинутая система поиска",
          "Прямое взаимодействие с застройщиками",
          "Профессиональные инструменты риелтора"
        ],
        cta: "Присоединиться как агент",
        link: "/public"
      },
      developers: {
        title: "Для застройщиков",
        subtitle: "Оптимизируйте управление недвижимостью",
        description: "Эффективно управляйте своими проектами недвижимости, отслеживайте прогресс продаж и взаимодействуйте с клиентами через нашу комплексную платформу управления.",
        features: [
          "Система управления объектами",
          "Отслеживание прогресса продаж",
          "Инструменты взаимодействия с агентами и клиентами",
          "Управление шахматкой проекта"
        ],
        cta: "Портал застройщика",
        link: "/dev"
      },
      languageSwitch: "Язык",
      russian: "Русский",
      english: "English",
      indonesian: "Bahasa",
      // Features Overview section
      featuresOverview: {
        analytics: {
          title: "Аналитика",
          description: "Комплексные рыночные инсайты и расчеты ROI"
        },
        security: {
          title: "Безопасность",
          description: "Защищенная платформа с защитой данных и конфиденциальностью"
        },
        performance: {
          title: "Производительность",
          description: "Быстрая и отзывчивая платформа для оптимального пользовательского опыта"
        },
        precision: {
          title: "Точность",
          description: "Точные данные и надежная информация для принятия решений"
        }
      },
      // Footer
      footer: {
        tagline: "Ваш надежный партнер в недвижимости Бали",
        copyright: "© 2025 Платформа IT Agent. Все права защищены."
      },
      // Auth Modal
      authModal: {
        title: "Авторизация агента",
        loginTab: "Вход",
        registerTab: "Заявка на регистрацию",
        email: "Email",
        password: "Пароль",
        name: "Имя",
        phone: "Телефон",
        status: "Статус",
        loginButton: "Войти",
        submitRequest: "Отправить заявку",
        backButton: "Назад",
        successTitle: "Благодарим за заявку!",
        successMessage: "Наши специалисты свяжутся с вами в ближайшее время.",
        successAppInfo: "А пока вы можете скачать и установить наше приложение для риелторов IT Agent на iPhone и iPad. В нем вы найдете полный листинг комплексов и объектов застройщиков Бали и множество удобных инструментов для риелторов.",
        installButton: "Установить IT Agent"
      }
    },
    id: {
      title: "Selamat Datang di Platform\nIT Agent",
      subtitle: "Solusi komprehensif Anda untuk investasi properti di Bali",
      investors: {
        title: "Untuk Investor",
        subtitle: "Temukan peluang investasi yang menguntungkan",
        description: "Akses properti eksklusif, analisis detail, dan perhitungan ROI. Buat keputusan investasi yang tepat dengan wawasan pasar komprehensif dan dukungan profesional kami.",
        features: [
          "Daftar properti eksklusif",
          "Properti real estate yang terverifikasi",
          "Wawasan tren pasar",
          "Konsultasi investasi profesional"
        ],
        cta: "Jelajahi Investasi",
        link: "/public"
      },
      agents: {
        title: "Untuk Agen Properti",
        subtitle: "Tingkatkan bisnis Anda dengan alat yang kuat",
        description: "Dapatkan akses ke daftar lengkap properti pengembang Bali, alat canggih, dan dukungan komprehensif untuk meningkatkan penjualan dan manajemen klien Anda.",
        features: [
          "Database properti lengkap",
          "Sistem pencarian canggih",
          "Interaksi langsung dengan pengembang",
          "Alat profesional untuk agen properti"
        ],
        cta: "Bergabung sebagai Agen",
        link: "/public"
      },
      developers: {
        title: "Untuk Pengembang",
        subtitle: "Sederhanakan manajemen properti Anda",
        description: "Kelola proyek properti Anda secara efisien, lacak kemajuan penjualan, dan berinteraksi dengan klien melalui platform manajemen komprehensif kami.",
        features: [
          "Sistem manajemen properti",
          "Pelacakan kemajuan penjualan",
          "Alat interaksi agen dan klien",
          "Manajemen papan catur proyek"
        ],
        cta: "Portal Pengembang",
        link: "/dev"
      },
      languageSwitch: "Bahasa",
      russian: "Русский",
      english: "English",
      indonesian: "Bahasa",
      // Features Overview section
      featuresOverview: {
        analytics: {
          title: "Analitik",
          description: "Wawasan pasar komprehensif dan perhitungan ROI"
        },
        security: {
          title: "Keamanan",
          description: "Platform aman dengan perlindungan data dan privasi"
        },
        performance: {
          title: "Kinerja",
          description: "Platform cepat dan responsif untuk pengalaman pengguna yang optimal"
        },
        precision: {
          title: "Presisi",
          description: "Data akurat dan informasi terpercaya untuk pengambilan keputusan"
        }
      },
      // Footer
      footer: {
        tagline: "Mitra terpercaya Anda dalam properti Bali",
        copyright: "© 2025 Platform IT Agent. Semua hak dilindungi."
      },
      // Auth Modal
      authModal: {
        title: "Otorisasi Agen",
        loginTab: "Masuk",
        registerTab: "Permintaan Registrasi",
        email: "Email",
        password: "Kata Sandi",
        name: "Nama",
        phone: "Telepon",
        status: "Status",
        loginButton: "Masuk",
        submitRequest: "Ajukan Permintaan",
        backButton: "Kembali",
        successTitle: "Terima kasih atas permintaan Anda!",
        successMessage: "Spesialis kami akan menghubungi Anda segera.",
        successAppInfo: "Sementara itu, Anda dapat mengunduh dan menginstal aplikasi IT Agent kami untuk agen properti di iPhone dan iPad. Di dalamnya Anda akan menemukan daftar lengkap kompleks dan properti dari pengembang Bali dan banyak alat yang nyaman untuk agen properti.",
        installButton: "Instal IT Agent"
      }
    }
  };

  const currentT = t[language];

  const TargetCard = ({ icon: Icon, title, subtitle, description, features, cta, link, gradient }) => (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gray-200">
      <div className={`h-2 ${gradient}`}></div>
      <CardContent className="p-8">
        <div className="mb-6 inline-block p-4 bg-primary/10 rounded-xl">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-lg font-medium text-muted-foreground mb-4">{subtitle}</p>
        <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        {link === "/public" && (cta === "Присоединиться как агент" || cta === "Join as Agent" || cta === "Bergabung sebagai Agen") ? (
          <Button 
            onClick={() => setIsAuthModalOpen(true)} 
            className="w-full gap-2" 
            size="lg"
          >
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Link to={link}>
            <Button className="w-full gap-2" size="lg">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        
        {/* Дополнительная кнопка "Установить IT Agent" для карточки агентов */}
        {link === "/public" && (cta === "Присоединиться как агент" || cta === "Join as Agent" || cta === "Bergabung sebagai Agen") && (
          <a
            href="https://apps.apple.com/id/app/it-agent-bali/id6746729723"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mt-3"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            {language === 'ru' ? 'Установить IT Agent' : language === 'id' ? 'Instal IT Agent' : 'Install IT Agent'}
          </a>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-white">
            IT Agent
          </Link>
          <div className="flex items-center gap-4">
            <Select value={language} onValueChange={(lang) => changeLanguage(lang)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {language === 'ru' ? currentT.russian : language === 'en' ? currentT.english : currentT.indonesian}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{currentT.english}</SelectItem>
                <SelectItem value="ru">{currentT.russian}</SelectItem>
                <SelectItem value="id">{currentT.indonesian}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] px-4 overflow-hidden flex items-center justify-center">
        {/* Фоновое изображение */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hiro-landing.png" 
            alt="Luxury resort in Bali overlooking ocean at sunset"
            className="w-full h-full object-cover"
          />
          {/* Затемнение для лучшей читаемости текста */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Контент */}
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white" style={{ lineHeight: '1.2' }}>
              {currentT.title.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              {currentT.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience Cards */}
      <section className="py-20 px-0 sm:px-4 bg-black">
        <div className="w-full sm:container sm:mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <TargetCard
              icon={TrendingUp}
              title={currentT.investors.title}
              subtitle={currentT.investors.subtitle}
              description={currentT.investors.description}
              features={currentT.investors.features}
              cta={currentT.investors.cta}
              link={currentT.investors.link}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
            />
            
            <TargetCard
              icon={Users2}
              title={currentT.agents.title}
              subtitle={currentT.agents.subtitle}
              description={currentT.agents.description}
              features={currentT.agents.features}
              cta={currentT.agents.cta}
              link={currentT.agents.link}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
            />
            
            <TargetCard
              icon={Building2}
              title={currentT.developers.title}
              subtitle={currentT.developers.subtitle}
              description={currentT.developers.description}
              features={currentT.developers.features}
              cta={currentT.developers.cta}
              link={currentT.developers.link}
              gradient="bg-gradient-to-r from-purple-500 to-violet-600"
            />
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 px-0 sm:px-4 bg-gray-200">
        <div className="w-full sm:container sm:mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="mb-4 inline-block p-4 bg-primary/10 rounded-xl">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{currentT.featuresOverview.analytics.title}</h3>
              <p className="text-muted-foreground text-sm">{currentT.featuresOverview.analytics.description}</p>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-block p-4 bg-primary/10 rounded-xl">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{currentT.featuresOverview.security.title}</h3>
              <p className="text-muted-foreground text-sm">{currentT.featuresOverview.security.description}</p>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-block p-4 bg-primary/10 rounded-xl">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{currentT.featuresOverview.performance.title}</h3>
              <p className="text-muted-foreground text-sm">{currentT.featuresOverview.performance.description}</p>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-block p-4 bg-primary/10 rounded-xl">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{currentT.featuresOverview.precision.title}</h3>
              <p className="text-muted-foreground text-sm">{currentT.featuresOverview.precision.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-gray-200">
        <div className="container mx-auto text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-primary mb-2">IT Agent</h3>
            <p className="text-black">{currentT.footer.tagline}</p>
          </div>

                     <p className="text-black text-sm">
              {currentT.footer.copyright}
            </p>
        </div>
      </footer>

      {/* Модальное окно авторизации */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{currentT.authModal.title}</h2>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Вкладки */}
              <div className="flex border-b mb-6">
                <button
                  onClick={() => setAuthTab('login')}
                  className={`px-4 py-2 font-medium ${
                    authTab === 'login'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {currentT.authModal.loginTab}
                </button>
                <button
                  onClick={() => setAuthTab('register')}
                  className={`px-4 py-2 font-medium ${
                    authTab === 'register'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {currentT.authModal.registerTab}
                </button>
              </div>

              {/* Форма входа */}
              {authTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">{currentT.authModal.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">{currentT.authModal.password}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Вход...' : currentT.authModal.loginButton}
                  </Button>
                </form>
              )}

              {/* Форма регистрации */}
              {authTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="regName">{currentT.authModal.name}</Label>
                    <Input
                      id="regName"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regPhone">{currentT.authModal.phone}</Label>
                    <Input
                      id="regPhone"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regEmail">{currentT.authModal.email}</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regStatus">{currentT.authModal.status}</Label>
                    <Select value={regStatus} onValueChange={setRegStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {statusLabel(status.value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isRegLoading}>
                    {isRegLoading ? 'Отправка...' : currentT.authModal.submitRequest}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно успеха */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentT.authModal.successTitle}
                </h2>
                <p className="text-gray-600 mb-4">
                  {currentT.authModal.successMessage}
                </p>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentT.authModal.successAppInfo}
                </p>
              </div>
              
              <div className="space-y-3">
                <a
                  href="https://apps.apple.com/id/app/it-agent-bali/id6746729723"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  {currentT.authModal.installButton}
                </a>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowSuccess(false)}
                  className="w-full"
                >
                  {currentT.authModal.backButton}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно ошибки */}
      {showError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Ошибка</h3>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <Button
              onClick={() => setShowError(false)}
              className="w-full"
            >
              {currentT.authModal.backButton}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLandingPage;
