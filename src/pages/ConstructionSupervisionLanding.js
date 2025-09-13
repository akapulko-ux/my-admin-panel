import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, ClipboardList, Building2, Shield, Clock, FileText } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const ConstructionSupervisionLanding = () => {
  const { language, changeLanguage } = useLanguage();

  const t = {
    ru: {
      brand: 'BALI SUPERVISION',
      headerCta: 'Оставить заявку',
      heroTitle: 'Технический надзор и приемка объектов на Бали',
      heroSubtitle:
        'Контролируем качество, сроки и соответствие работ. Снижаем риски, экономим бюджет, защищаем ваши интересы на каждом этапе строительства и отделки.',
      heroButtons: { supervision: 'Технадзор', acceptance: 'Приемка' },
      valueProps: {
        quality: { title: 'Качество и соответствие', desc: 'Работаем по проектной и нормативной документации. Фиксируем несоответствия и добиваемся их устранения.' },
        timing: { title: 'Сроки под контролем', desc: 'Отслеживаем график и план производства работ. Предупреждаем срывы и простаивания.' },
        reports: { title: 'Отчеты по фактам', desc: 'Еженедельные отчеты со статусом работ, фотофиксацией, списком замечаний и ответственными за исправления.' }
      },
      supervision: {
        title: 'Технадзор',
        priceLabel: 'Стоимость услуги',
        priceValue: '$1500 / мес.',
        order: 'Заказать',
        points: [
          'Изучение технической и юридической документации.',
          'Систематические выезды инженера технического контроля на объект.',
          'Контроль реализации проекта в соответствии с рабочей документацией и нормативными документами.',
          'Контроль исполнения графика производства работ.',
          'Контроль исполнения плана производства работ.',
          'Уведомление и информирование заказчика или его представителя о нарушениях производства работ.',
          'Рекомендации по устранению и недопущению нарушений в процессе реализации проекта.',
          'Проверка актов выполненных и скрытых работ на соответствие.',
          'Формирование еженедельного отчета о ходе реализации проекта с указанием исправленных и не исправленных подрядчиком замечаний.',
          'Все отчеты оформляются в продвинутом IT интерфейсе с доступом с любого устройства на английском, русском и индонезийском языках.'
        ]
      },
      acceptance: {
        title: 'Приемка объектов',
        priceLabel: 'Стоимость услуги',
        priceValue: '$600',
        includes: 'Что входит',
        apply: 'Оставить заявку',
        points: [
          'Изучение технической и юридической документации.',
          'Комплексная инспекция объекта по чек-листу из более чем 50 пунктов (готового или в процессе строительства).',
          'Проверка соответствия выполненных работ проектной документации и спецификациям.',
          'Проверка ключевых инженерных систем: электрика, водоснабжение, канализация, вентиляция.',
          'Оценка качества отделочных материалов, ровности поверхностей, качества монтажа.',
          'Выявление скрытых дефектов и рисков дальнейшей эксплуатации.',
          'Фото- и видеофиксация замечаний для подрядчика и заказчика.',
          'Подготовка сводного отчета с приоритизацией дефектов и рекомендациями по исправлению.',
          'Повторная приемка после устранения замечаний и подтверждение качества (дополнительно).',
          'Все отчеты оформляются в продвинутом IT интерфейсе с доступом с любого устройства на английском, русском и индонезийском языках.'
        ]
      },
      contact: {
        title: 'Получите консультацию инженера',
        subtitle:
          'Оставьте контакты — мы свяжемся в ближайшее время, уточним задачи и предложим оптимальный формат работы.',
        telegram: 'Написать в Telegram',
        whatsapp: 'Написать в WhatsApp'
      },
      footer: { copyright: '© 2025 BALI SUPERVISION. Все права защищены.' },
      langRu: 'Рус',
      langEn: 'Eng'
    },
    en: {
      brand: 'BALI SUPERVISION',
      headerCta: 'Contact us',
      heroTitle: 'Technical supervision and property acceptance in Bali',
      heroSubtitle:
        'We control quality, deadlines and compliance. We reduce risks, save your budget and protect your interests at every stage of construction and finishing.',
      heroButtons: { supervision: 'Supervision', acceptance: 'Acceptance' },
      valueProps: {
        quality: { title: 'Quality & compliance', desc: 'We work according to project and regulatory documentation. We record non‑conformities and ensure they are fixed.' },
        timing: { title: 'On‑time delivery', desc: 'We monitor the work schedule and plan. We prevent delays and downtime.' },
        reports: { title: 'Fact‑based reports', desc: 'Weekly reports with work status, photo evidence, list of issues and responsible parties.' }
      },
      supervision: {
        title: 'Technical supervision',
        priceLabel: 'Service price',
        priceValue: '$1500 / month',
        order: 'Order',
        points: [
          'Study of technical and legal documentation.',
          'Regular site visits by the technical supervision engineer.',
          'Control of project implementation according to working documentation and standards.',
          'Control of production schedule execution.',
          'Control of work plan execution.',
          'Notification and informing the client or representative about violations of work.',
          'Recommendations to eliminate and prevent violations during project implementation.',
          'Verification of acts of completed and concealed works for compliance.',
          'Weekly project progress report indicating issues fixed and not fixed by the contractor.',
          'All reports are delivered in an advanced IT interface accessible from any device in English, Russian and Indonesian.'
        ]
      },
      acceptance: {
        title: 'Acceptance',
        priceLabel: 'Service price',
        priceValue: '$600',
        includes: "What's included",
        apply: 'Request consultation',
        points: [
          'Study of technical and legal documentation.',
          'Comprehensive inspection using a checklist of more than 50 items (completed or under construction).',
          'Verification of compliance of completed works with project documentation and specifications.',
          'Check of key engineering systems: electricity, water supply, sewage, ventilation.',
          'Assessment of finishing quality, surface flatness and installation quality.',
          'Identification of hidden defects and operational risks.',
          'Photo and video evidence of issues for the contractor and the client.',
          'Summary report with prioritised defects and recommendations for correction.',
          'Repeated acceptance after fixing issues and confirmation of quality (optional).',
          'All reports are delivered in an advanced IT interface accessible from any device in English, Russian and Indonesian.'
        ]
      },
      contact: {
        title: 'Get an engineer consultation',
        subtitle:
          'Leave your contacts — we will get back to you shortly, clarify the tasks and offer the optimal work format.',
        telegram: 'Message on Telegram',
        whatsapp: 'Message on WhatsApp'
      },
      footer: { copyright: '© 2025 BALI SUPERVISION. All rights reserved.' },
      langRu: 'Рус',
      langEn: 'Eng'
    }
  };

  const tr = t[language] || t.ru;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/public" className="text-xl font-semibold">{tr.brand}</Link>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <Button
                variant={language === 'ru' ? 'default' : 'ghost'}
                size="sm"
                className="px-3 text-sm"
                onClick={() => changeLanguage('ru')}
              >
                {tr.langRu}
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'ghost'}
                size="sm"
                className="px-3 text-sm"
                onClick={() => changeLanguage('en')}
              >
                {tr.langEn}
              </Button>
            </div>
            <a href="#contact"><Button size="sm">{tr.headerCta}</Button></a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 py-16 md:py-24 bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/construction-supervision-hero.png?v=1"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/hiro-landing.png"; }}
            alt="Инженер на строительной площадке в каске — технический надзор на Бали"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 z-[1] bg-black/35"></div>
        <div className="container mx-auto relative z-20">
          <div className="md:flex md:justify-end">
            <div className="max-w-3xl md:text-right">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                {tr.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-white mb-8">
                {tr.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:justify-end md:ml-auto">
                <a href="#supervision"><Button size="lg" className="gap-2"><Shield className="h-4 w-4"/> {tr.heroButtons.supervision}</Button></a>
                <a href="#acceptance"><Button variant="outline" size="lg" className="gap-2"><ClipboardList className="h-4 w-4"/> {tr.heroButtons.acceptance}</Button></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-12 md:py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-blue-600"/>
                  <h3 className="font-semibold">{tr.valueProps.quality.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{tr.valueProps.quality.desc}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-blue-600"/>
                  <h3 className="font-semibold">{tr.valueProps.timing.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{tr.valueProps.timing.desc}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-blue-600"/>
                  <h3 className="font-semibold">{tr.valueProps.reports.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{tr.valueProps.reports.desc}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supervision Section */}
      <section id="supervision" className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-6 w-6 text-blue-600"/>
            <h2 className="text-2xl md:text-3xl font-bold">{tr.supervision.title}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-l-4 border-l-blue-600">
                <CardContent className="pt-6">
                  <ul className="space-y-3 text-gray-800">
                    {tr.supervision.points.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0"/>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">{tr.supervision.priceLabel}</div>
                  <div className="text-3xl font-bold mb-4">{tr.supervision.priceValue}</div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge>Еженедельные отчеты</Badge>
                    <Badge>Фотофиксация</Badge>
                    <Badge>Контроль графика</Badge>
                  </div>
                  <a href="#contact"><Button className="w-full">{tr.supervision.order}</Button></a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Acceptance Section */}
      <section id="acceptance" className="py-16 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="h-6 w-6 text-blue-600"/>
            <h2 className="text-2xl md:text-3xl font-bold">{tr.acceptance.title}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-l-4 border-l-blue-600">
                <CardContent className="pt-6">
                  <ul className="space-y-3 text-gray-800">
                    {tr.acceptance.points.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0"/>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">{tr.acceptance.priceLabel}</div>
                  <div className="text-3xl font-bold mb-4">{tr.acceptance.priceValue}</div>
                  <div className="text-sm text-gray-600 mb-2">{tr.acceptance.includes}</div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge>{language === 'ru' ? 'Чек-лист 50+ пунктов' : 'Checklist 50+ items'}</Badge>
                    <Badge>{language === 'ru' ? 'Инженерные системы' : 'Engineering systems'}</Badge>
                    <Badge>{language === 'ru' ? 'Фото/видеофиксация' : 'Photo/Video evidence'}</Badge>
                  </div>
                  <a href="#contact"><Button className="w-full" variant="secondary">{tr.acceptance.apply}</Button></a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <Card className="border-2 border-blue-600">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-2">{tr.contact.title}</h3>
              <p className="text-gray-700 mb-6">{tr.contact.subtitle}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href="https://t.me/bali_supervision_bot" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">{tr.contact.telegram}</Button>
                </a>
                <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">{tr.contact.whatsapp}</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 bg-white">
        <div className="container mx-auto text-center">
          <div className="text-sm text-gray-500">{tr.footer.copyright}</div>
        </div>
      </footer>
    </div>
  );
};

export default ConstructionSupervisionLanding;


