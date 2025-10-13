import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import PropertyPlacementModal from '../components/PropertyPlacementModal';
import PricingModal from '../components/PricingModal';
import {
  TrendingUp,
  Users2,
  Building2,
  ArrowRight,
  Globe,
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
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  
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
  const [footerModal, setFooterModal] = useState(null); // 'terms' | 'privacy' | 'support' | null
  
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
      // Перенаправляем на публичную галерею по корню
      navigate('/');
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
        link: "/"
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
        link: "/"
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
      },
      // Pricing Modal
      pricing: {
        title: "Choose Your Plan",
        subtitle: "Select the plan that best fits your needs",
        oneTime: {
          badge: "Popular",
          title: "One-Time Access",
          description: "Get complete information about a specific property with a one-time payment.",
          price: "$25",
          priceNote: "One-time payment, lifetime access",
          featuresTitle: "What's included:",
          features: {
            fullAccess: "Full access to property details and documentation",
            documents: "All legal documents and technical specifications",
            roiCalculator: "ROI calculator and investment analysis",
            support: "Email support for 30 days",
            lifetime: "Lifetime access to purchased property"
          },
          note: "Perfect for investors who want detailed information about a specific property."
        },
        subscription: {
          badge: "Best Value",
          title: "Full Platform Access",
          description: "Unlock all properties and premium features with our monthly subscription.",
          price: "$83",
          priceNote: "Per month, cancel anytime",
          featuresTitle: "What's included:",
          features: {
            allProperties: "Full access to all properties in the listing",
            newListings: "Early access to new properties before public release",
            prioritySupport: "Professional customer support and assistance in chat",
            marketUpdates: "Providing a unique listing link - your own website for receiving inquiries"
          },
          note: "Ideal for real estate professionals and active investors."
        },
        additionalInfo: {
          title: "Additional Information",
          payment: {
            title: "Payment Methods",
            description: "We accept all major credit cards and bank transfers. All payments are processed securely."
          },
          support: {
            title: "Customer Support",
            description: "Our support team is available 24/7 to help you with any questions or issues."
          }
        },
        closeButton: "Close",
        termsLink: "Payment and Refund Terms",
        termsTitle: "Payment and Refund Terms",
        terms: {
          payment: {
            title: "Payment Terms",
            point1: "All payments are processed securely through our payment partner.",
            point2: "Payment is required before access to premium features is granted.",
            point3: "Subscription payments are automatically renewed unless cancelled.",
            point4: "We accept major credit cards and bank transfers."
          },
          refund: {
            title: "Refund Policy",
            point1: "Refunds for one-time purchases are available within 14 days of purchase.",
            point2: "Subscription cancellations take effect at the end of the current billing period.",
            point3: "No refunds are provided for partial usage of subscription services.",
            point4: "Refund requests must be submitted through our support system."
          },
          access: {
            title: "Access Terms",
            point1: "Access to purchased content is granted immediately upon successful payment.",
            point2: "Account access may be suspended for violations of our terms of service."
          },
          liability: {
            title: "Liability",
            point1: "We are not responsible for any financial decisions made based on our content.",
            point2: "Users are responsible for ensuring compliance with local laws and regulations."
          }
        }
      }
    },
    ru: {
      title: "Добро пожаловать на платформу IT Agent",
      subtitle: "Ваше комплексное решение для инвестиций в недвижимость",
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
        link: "/"
      },
      agents: {
        title: "Для риелторов",
        subtitle: "Развивайте свой бизнес с мощными инструментами",
        description: "Получите доступ к полному листингу объектов застройщиков, продвинутым инструментам и комплексной поддержке для увеличения продаж и управления клиентами.",
        features: [
          "Полная база объектов",
          "Продвинутая система поиска",
          "Прямое взаимодействие с застройщиками",
          "Профессиональные инструменты риелтора"
        ],
        cta: "Присоединиться как агент",
        link: "/"
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
      },
      // Pricing Modal
      pricing: {
        title: "Выберите свой план",
        subtitle: "Выберите план, который лучше всего подходит вашим потребностям",
        oneTime: {
          badge: "Популярный",
          title: "Единоразовый доступ",
          description: "Получите полную информацию об объекте недвижимости за единоразовый платеж.",
          price: "₽2,400",
          priceNote: "Единоразовый платеж, доступ навсегда",
          featuresTitle: "Что включено:",
          features: {
            fullAccess: "Полный доступ к деталям объекта и документации",
            documents: "Все юридические документы и технические характеристики",
            roiCalculator: "Калькулятор ROI и анализ инвестиций",
            support: "Поддержка по email в течение 30 дней",
            lifetime: "Пожизненный доступ к купленному объекту"
          },
          note: "Идеально для инвесторов, которые хотят детальную информацию об определенном объекте."
        },
        subscription: {
          badge: "Лучшее предложение",
          title: "Полный доступ к платформе",
          description: "Откройте доступ ко всем объектам и премиум-функциям с нашей ежемесячной подпиской.",
          price: "₽8,000",
          priceNote: "В месяц, можно отменить в любое время",
          featuresTitle: "Что включено:",
          features: {
            allProperties: "Полный доступ ко всем объектам недвижимости в листинге",
            newListings: "Ранний доступ к новым объектам до публичного релиза",
            prioritySupport: "Профессиональная поддержка и сопровождение клиентов в чате",
            marketUpdates: "Предоставление уникальной ссылки на листинг - собственный сайт для получения заявок"
          },
          note: "Идеально для профессионалов недвижимости и активных инвесторов."
        },
        additionalInfo: {
          title: "Дополнительная информация",
          payment: {
            title: "Способы оплаты",
            description: "Мы принимаем все основные кредитные карты и банковские переводы. Все платежи обрабатываются безопасно."
          },
          support: {
            title: "Поддержка клиентов",
            description: "Наша команда поддержки доступна 24/7, чтобы помочь вам с любыми вопросами или проблемами."
          }
        },
        closeButton: "Закрыть",
        termsLink: "Условия оплаты и возврата денежных средств",
        termsTitle: "Условия оплаты и возврата денежных средств",
        terms: {
          payment: {
            title: "Условия оплаты",
            point1: "Все платежи обрабатываются безопасно через нашего партнера по платежам.",
            point2: "Оплата требуется до предоставления доступа к премиум-функциям.",
            point3: "Платежи по подписке автоматически продлеваются, если не отменены.",
            point4: "Мы принимаем основные кредитные карты и банковские переводы."
          },
          refund: {
            title: "Политика возврата",
            point1: "Возврат средств за единоразовые покупки доступен в течение 14 дней с момента покупки.",
            point2: "Отмена подписки вступает в силу в конце текущего расчетного периода.",
            point3: "Возврат средств не предоставляется за частичное использование услуг подписки.",
            point4: "Запросы на возврат средств должны подаваться через нашу систему поддержки."
          },
          access: {
            title: "Условия доступа",
            point1: "Доступ к купленному контенту предоставляется немедленно после успешной оплаты.",
            point2: "Доступ к аккаунту может быть приостановлен за нарушение наших условий использования."
          },
          liability: {
            title: "Ответственность",
            point1: "Мы не несем ответственности за финансовые решения, принятые на основе нашего контента.",
            point2: "Пользователи несут ответственность за соблюдение местных законов и правил."
          }
        }
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
        link: "/"
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
        link: "/"
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
      },
      // Pricing Modal
      pricing: {
        title: "Pilih Paket Anda",
        subtitle: "Pilih paket yang paling sesuai dengan kebutuhan Anda",
        oneTime: {
          badge: "Populer",
          title: "Akses Sekali Bayar",
          description: "Dapatkan informasi lengkap tentang properti tertentu dengan pembayaran sekali.",
          price: "$25",
          priceNote: "Pembayaran sekali, akses seumur hidup",
          featuresTitle: "Yang termasuk:",
          features: {
            fullAccess: "Akses penuh ke detail properti dan dokumentasi",
            documents: "Semua dokumen hukum dan spesifikasi teknis",
            roiCalculator: "Kalkulator ROI dan analisis investasi",
            support: "Dukungan email selama 30 hari",
            lifetime: "Akses seumur hidup ke properti yang dibeli"
          },
          note: "Sempurna untuk investor yang menginginkan informasi detail tentang properti tertentu."
        },
        subscription: {
          badge: "Nilai Terbaik",
          title: "Akses Penuh Platform",
          description: "Buka akses ke semua properti dan fitur premium dengan langganan bulanan kami.",
          price: "$83",
          priceNote: "Per bulan, dapat dibatalkan kapan saja",
          featuresTitle: "Yang termasuk:",
          features: {
            allProperties: "Akses penuh ke semua properti dalam listing",
            newListings: "Akses awal ke properti baru sebelum rilis publik",
            prioritySupport: "Dukungan profesional dan pendampingan pelanggan dalam chat",
            marketUpdates: "Penyediaan link unik untuk listing - website sendiri untuk menerima permintaan"
          },
          note: "Ideal untuk profesional real estate dan investor aktif."
        },
        additionalInfo: {
          title: "Informasi Tambahan",
          payment: {
            title: "Metode Pembayaran",
            description: "Kami menerima semua kartu kredit utama dan transfer bank. Semua pembayaran diproses dengan aman."
          },
          support: {
            title: "Dukungan Pelanggan",
            description: "Tim dukungan kami tersedia 24/7 untuk membantu Anda dengan pertanyaan atau masalah apa pun."
          }
        },
        closeButton: "Tutup",
        termsLink: "Syarat Pembayaran dan Pengembalian Dana",
        termsTitle: "Syarat Pembayaran dan Pengembalian Dana",
        terms: {
          payment: {
            title: "Syarat Pembayaran",
            point1: "Semua pembayaran diproses dengan aman melalui mitra pembayaran kami.",
            point2: "Pembayaran diperlukan sebelum akses ke fitur premium diberikan.",
            point3: "Pembayaran langganan diperpanjang otomatis kecuali dibatalkan.",
            point4: "Kami menerima kartu kredit utama dan transfer bank."
          },
          refund: {
            title: "Kebijakan Pengembalian",
            point1: "Pengembalian untuk pembelian sekali tersedia dalam 14 hari dari pembelian.",
            point2: "Pembatalan langganan berlaku pada akhir periode penagihan saat ini.",
            point3: "Tidak ada pengembalian untuk penggunaan sebagian layanan langganan.",
            point4: "Permintaan pengembalian harus disampaikan melalui sistem dukungan kami."
          },
          access: {
            title: "Syarat Akses",
            point1: "Akses ke konten yang dibeli diberikan segera setelah pembayaran berhasil.",
            point2: "Akses akun dapat ditangguhkan karena pelanggaran terhadap syarat layanan kami."
          },
          liability: {
            title: "Tanggung Jawab",
            point1: "Kami tidak bertanggung jawab atas keputusan keuangan yang dibuat berdasarkan konten kami.",
            point2: "Pengguna bertanggung jawab untuk memastikan kepatuhan terhadap hukum dan peraturan setempat."
          }
        }
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
        
        {link === "/" && (cta === "Присоединиться как агент" || cta === "Join as Agent" || cta === "Bergabung sebagai Agen") ? (
          <Button 
            onClick={() => setIsPlacementModalOpen(true)} 
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
        
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/public" className="text-2xl font-bold text-white">
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

      

      {/* Footer hidden on /public */}
      {false && (
        <footer className="py-12 px-4 bg-black text-gray-300">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1 text-sm">
                <p>© 2025 IT Agent. Все права защищены.</p>
                <p>ИП Манова Вероника Алексеевна</p>
                <p>ИНН 780631330106</p>
              </div>
              <div className="flex gap-8 text-sm">
                <button type="button" className="hover:text-white" onClick={() => setIsPricingModalOpen(true)}>Тарифы</button>
                <button type="button" className="hover:text-white" onClick={() => setFooterModal('terms')}>Условия использования</button>
                <button type="button" className="hover:text-white" onClick={() => setFooterModal('privacy')}>Политика конфиденциальности</button>
                <button type="button" className="hover:text-white" onClick={() => setFooterModal('support')}>Поддержка</button>
              </div>
            </div>
          </div>
        </footer>
      )}

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

      {/* Общее модальное окно (как в публичной галерее) */}
      <PropertyPlacementModal 
        isOpen={isPlacementModalOpen}
        onClose={() => setIsPlacementModalOpen(false)}
      />

      {/* Модальные окна футера */}
      {footerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {footerModal === 'terms' && 'Условия использования'}
                  {footerModal === 'privacy' && 'Политика конфиденциальности'}
                  {footerModal === 'support' && 'Поддержка'}
                </h2>
                <button
                  onClick={() => setFooterModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {footerModal === 'terms' && (
                <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
                  <p>
                    Настоящие Условия использования регулируют порядок доступа и работы
                    с сервисом IT Agent. Продолжая пользоваться сайтом, вы подтверждаете
                    согласие с данными условиями.
                  </p>
                  <h3 className="font-semibold text-gray-900">1. Назначение сервиса</h3>
                  <p>
                    Сервис предоставляет информационные материалы о недвижимости и
                    инструменты для работы риелторов и инвесторов. Сервис не является
                    финансовым консультантом и не гарантирует доходность.
                  </p>
                  <h3 className="font-semibold text-gray-900">2. Аккаунт и доступ</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Вы несете ответственность за сохранность учетных данных.</li>
                    <li>Мы вправе ограничить доступ при нарушении правил или закона.</li>
                  </ul>
                  <h3 className="font-semibold text-gray-900">3. Содержимое и права</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Все материалы защищены законодательством об интеллектуальной собственности.</li>
                    <li>Запрещены копирование, скрейпинг и распространение без письменного разрешения.</li>
                  </ul>
                  <h3 className="font-semibold text-gray-900">4. Ограничение ответственности</h3>
                  <p>
                    Сервис предоставляется «как есть». Мы не отвечаем за косвенные убытки,
                    вызванные использованием или невозможностью использования сервиса.
                  </p>
                  <h3 className="font-semibold text-gray-900">5. Изменения условий</h3>
                  <p>
                    Мы можем обновлять Условия. Актуальная версия публикуется на этой
                    странице. Дата обновления: 19.09.2025.
                  </p>
                  <p className="text-xs text-gray-500">
                    Правообладатель: ИП Манова Вероника Алексеевна, ИНН 780631330106.
                  </p>
                </div>
              )}

              {footerModal === 'privacy' && (
                <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
                  <p>
                    Эта Политика описывает, какие данные мы обрабатываем при вашем
                    использовании IT Agent и для каких целей.
                  </p>
                  <h3 className="font-semibold text-gray-900">1. Какие данные собираем</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Данные аккаунта (имя, email, телефон, статус пользователя).</li>
                    <li>Технические данные (IP, тип устройства, cookies, статистика использования).</li>
                  </ul>
                  <h3 className="font-semibold text-gray-900">2. Для чего используем</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Предоставление функций сервиса и персонализация интерфейса.</li>
                    <li>Связь с пользователями по вопросам обслуживания.</li>
                    <li>Обеспечение безопасности и предотвращение злоупотреблений.</li>
                  </ul>
                  <h3 className="font-semibold text-gray-900">3. Хранение и передача</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Данные хранятся в защищенных системах и обрабатываются на законных основаниях.</li>
                    <li>Мы не продаем персональные данные третьим лицам.</li>
                  </ul>
                  <h3 className="font-semibold text-gray-900">4. Права пользователя</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Доступ к данным, их исправление и удаление в пределах закона.</li>
                    <li>Отзыв согласия на обработку, если основание — согласие.</li>
                  </ul>
                  <p className="text-xs text-gray-500">
                    Ответственный за обработку: ИП Манова Вероника Алексеевна, ИНН 780631330106. Обновлено: 19.09.2025.
                  </p>
                </div>
              )}

              {footerModal === 'support' && (
                <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
                  <p>
                    Раздел поддержки IT Agent помогает решить вопросы по работе
                    платформы. Перед обращением попробуйте обновить страницу и
                    убедиться в стабильности интернет-соединения.
                  </p>
                  <h3 className="font-semibold text-gray-900">Как ускорить решение</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Опишите проблему: что делали, что ожидали, что получили.</li>
                    <li>Приложите скриншоты/видео и укажите время возникновения.</li>
                    <li>Сообщите модель устройства и версию браузера.</li>
                  </ul>
                  <h3 className="font-semibold text-gray-900">Сроки ответа</h3>
                  <p>
                    Мы стараемся отвечать в течение 1–2 рабочих дней. Сложные
                    технические вопросы могут потребовать больше времени на анализ.
                  </p>
                  <p className="text-xs text-gray-500">Обновлено: 19.09.2025.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно тарифов */}
      <PricingModal 
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        t={currentT}
      />
    </div>
  );
};

export default MainLandingPage;
