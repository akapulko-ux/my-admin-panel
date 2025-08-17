import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, isPremiumDeveloper, isDeveloper, isAnyDeveloper } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import LanguageSwitcher from './LanguageSwitcher';
import { AdaptiveTooltip } from './ui/tooltip';
import {
  Home,
  Building2,
  Building,
  Landmark,
  Users2,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Calculator,
  UserCheck,
  ClipboardList,
  Network,
  Settings,
  GraduationCap,
  Star,
  Bell,
  Globe,
  BarChart3,
  Briefcase,
  CheckSquare,
  List
} from 'lucide-react';

// Определяем доступ к маршрутам для разных ролей
const ROUTE_ACCESS = {
  admin: ['*'],
  moderator: [
    '/property/*',
    '/complex/*',
    '/developers/*',
    '/landmark/*',
    '/gallery/*',
    '/support/*',
    '/client-fixations',
    '/building-progress/*',
    '/general-overview',
    '/users/manage'
  ],
  'premium agent': [
    '/property/gallery',
    '/building-progress/*'
  ],
  agent: [
    '/property/gallery',
    '/building-progress/*'
  ],
  застройщик: [
    '/property/gallery',
    '/property/*',
    '/chessboard',
    '/chessboard/*',
    '/client-fixations',
    '/building-progress/*'
  ],
  'премиум застройщик': [
    '/property/gallery',
    '/property/*',
    '/chessboard',
    '/chessboard/*',
    '/client-fixations',
    '/building-progress/*'
  ],
  user: [
    '/gallery/*'
  ],
  closed: [] // Закрытый аккаунт не имеет доступа ни к каким маршрутам
};

const Navigation = () => {
  const { role } = useAuth();
  const { language } = useLanguage();
  const nav = translations[language].navigation;
  const location = useLocation();
  
  // Отладочная информация
  console.log('Navigation - Current role:', role);
  console.log('Navigation - Available roles for education:', ['admin', 'moderator', 'застройщик', 'премиум застройщик']);
  console.log('Navigation - Has education access:', ['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCrmExpanded, setIsCrmExpanded] = useState(false);

  // Проверка размера экрана
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Автоматически закрываем мобильное меню при изменении размера окна
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Закрываем мобильное меню при изменении роута
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Функция для проверки доступа к маршрутам
  // Временно не используется, но может понадобиться для будущих проверок доступа
  // eslint-disable-next-line no-unused-vars
  const hasAccess = (path) => {
    const allowedPaths = ROUTE_ACCESS[role] || ROUTE_ACCESS.user;
    
    if (allowedPaths.includes('*')) {
      return true;
    }

    return allowedPaths.some(pattern => {
      const regexPattern = pattern.replace('*', '.*');
      return new RegExp(`^${regexPattern}$`).test(path);
    });
  };

  const NavItem = ({ to, icon: Icon, children, isSubItem = false, onClick, target, rel }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link 
        to={to}
        target={target}
        rel={rel}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent touch-manipulation",
          "min-h-[44px] md:min-h-[36px]", // Увеличенная высота для мобильных устройств
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground",
          isSubItem && "pl-9",
          isMobile && "text-base py-3" // Больший размер текста и отступы на мобильных
        )}
      >
        {!isSubItem && Icon && <Icon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />}
        <span className={cn(
          "flex-1 truncate",
          isCollapsed && !isSubItem && !isMobile && "hidden"
        )}>
          {children}
        </span>
        {isActive && <ChevronRight className={cn("h-3 w-3 ml-auto", isMobile && "h-4 w-4")} />}
      </Link>
    );
  };

  const CrmMenuItem = ({ onClick }) => {
    const crmSubRoutes = ['/crm/deals', '/crm/tasks', '/crm/lists'];
    const isAnyCrmActive = crmSubRoutes.some(route => location.pathname.startsWith(route));
    
    return (
      <div>
        <button
          onClick={() => setIsCrmExpanded(!isCrmExpanded)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent touch-manipulation w-full",
            "min-h-[44px] md:min-h-[36px]",
            isAnyCrmActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground",
            isMobile && "text-base py-3"
          )}
        >
          <Briefcase className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
          <span className={cn(
            "flex-1 truncate text-left",
            isCollapsed && !isMobile && "hidden"
          )}>
            {nav.crmSystem}
          </span>
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform",
            isCrmExpanded && "rotate-180",
            isMobile && "h-4 w-4",
            isCollapsed && !isMobile && "hidden"
          )} />
        </button>
        
        {isCrmExpanded && (
          <div className="ml-3 mt-1 space-y-1">
            <NavItem 
              to="/crm/deals" 
              icon={Briefcase}
              isSubItem={true}
              onClick={onClick}
            >
              {nav.deals}
            </NavItem>
            <NavItem 
              to="/crm/tasks" 
              icon={CheckSquare}
              isSubItem={true}
              onClick={onClick}
            >
              {nav.tasks}
            </NavItem>
            <NavItem 
              to="/crm/lists" 
              icon={List}
              isSubItem={true}
              onClick={onClick}
            >
              {nav.lists}
            </NavItem>
          </div>
        )}
      </div>
    );
  };

  // Мобильная версия навигации
  if (isMobile) {
    return (
      <>
        {/* Мобильная кнопка меню */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-background shadow-lg"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Оверлей для мобильного меню */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Мобильное меню */}
        <div className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-background border-r transform transition-transform duration-300 ease-in-out z-50 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
            {/* Заголовок меню */}
            <div className="flex items-center justify-between pt-12">
              <span className="text-lg font-semibold">
                {nav.adminPanel}
              </span>
            </div>
            
            {/* Переключатель языков для мобильной версии */}
            <div className="px-2">
              <LanguageSwitcher />
            </div>

            {/* Навигационные элементы */}
            <nav className="space-y-2">
              {/* Публичная галерея - ПЕРВОЙ в списке, открывается в новой вкладке */}
              {['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
                <NavItem 
                  to="/public" 
                  icon={Globe}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.publicGallery}
                </NavItem>
              )}

              {['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
                <NavItem 
                  to="/property/gallery" 
                  icon={Home}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.propertyGallery}
                </NavItem>
              )}

              {['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
                <NavItem 
                  to="/complex/gallery" 
                  icon={Building2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.complexGallery}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/agent-properties" 
                  icon={List}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.agentProperties}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/property/list" 
                  icon={Building}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.properties}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/complex/list" 
                  icon={Building2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.complexes}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/developers/list" 
                  icon={Building2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.developers}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/landmark/list" 
                  icon={Landmark}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.landmarks}
                </NavItem>
              )}

              {['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role) && (
                <NavItem 
                  to="/chessboard" 
                  icon={LayoutGrid}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.chessboards}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/support/chats" 
                  icon={MessageSquare}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.support}
                </NavItem>
              )}

              {['admin', 'moderator', 'premium agent', 'agent'].includes(role) && (
                <NavItem 
                  to="/roi-calculator" 
                  icon={Calculator}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.roiCalculator}
                </NavItem>
              )}

              {/* CRM System */}
              {['admin', 'moderator'].includes(role) && (
                <CrmMenuItem onClick={() => setIsMobileMenuOpen(false)} />
              )}

              {['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role) && (
                <NavItem 
                  to="/client-fixations" 
                  icon={UserCheck}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.clientFixations}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/users/manage" 
                  icon={Users2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.userManagement}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/general-overview" 
                  icon={BarChart3}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.generalOverview}
                </NavItem>
              )}

              {role === 'admin' && (
                <NavItem 
                  to="/registration-requests" 
                  icon={ClipboardList}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.registrationRequests}
                </NavItem>
              )}

              {role === 'admin' && (
                <NavItem 
                  to="/agent-registration-requests" 
                  icon={UserCheck}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.agentRegistrationRequests}
                </NavItem>
              )}

              {['admin', 'moderator'].includes(role) && (
                <NavItem 
                  to="/referral-map" 
                  icon={Network}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.referralMap}
                </NavItem>
              )}

              {['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role) && (
                <NavItem 
                  to="/education" 
                  icon={GraduationCap}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.education}
                </NavItem>
              )}

              {['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role) && (
                <NavItem 
                  to="/settings" 
                  icon={Settings}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {nav.settings}
                </NavItem>
              )}



                      {/* Новые разделы для застройщиков */}
        {isAnyDeveloper(role) && (
          <NavItem 
            to="/premium-features" 
            icon={Star}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {nav.premiumFeatures}
          </NavItem>
        )}

        {/* Уведомления - доступны для премиум застройщика и админа */}
        {(isPremiumDeveloper(role) || role === 'admin') && (
          <NavItem 
            to="/notifications" 
            icon={Bell}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {nav.notifications}
          </NavItem>
        )}
        {isDeveloper(role) && !isPremiumDeveloper(role) && role !== 'admin' && (
          <AdaptiveTooltip content={nav.premiumSubscriptionTooltip}>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
              <Bell className="h-4 w-4" />
              <span>{nav.notifications}</span>
            </div>
          </AdaptiveTooltip>
        )}

        {/* ⚠️ КРИТИЧЕСКИ ВАЖНО: Публичная страница - активна только для премиум застройщика */}
        {isPremiumDeveloper(role) && (
          <NavItem 
            to="/public-page" 
            icon={Globe}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {nav.publicPage}
          </NavItem>
        )}
              {role === 'застройщик' && (
                <AdaptiveTooltip content={nav.premiumSubscriptionTooltip}>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                    <Globe className="h-4 w-4" />
                    <span>{nav.publicPage}</span>
                  </div>
                </AdaptiveTooltip>
              )}
            </nav>
          </div>
        </div>
      </>
    );
  }

  // Десктопная версия навигации
  return (
    <div className={cn(
      "flex flex-col gap-4 p-4 h-screen border-r transition-all duration-300",
      isCollapsed ? "w-[70px]" : "w-[250px]"
    )}>
      <div className="flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-lg font-semibold">
            {nav.adminPanel}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Переключатель языков для десктопной версии */}
      {!isCollapsed && (
        <div className="px-2">
          <LanguageSwitcher />
        </div>
      )}

      <nav className="space-y-1">
        {/* Публичная галерея - ПЕРВОЙ в списке, открывается в новой вкладке */}
        {['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
          <NavItem to="/public" icon={Globe} target="_blank" rel="noopener noreferrer">
            {nav.publicGallery}
          </NavItem>
        )}

        {['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
          <NavItem to="/property/gallery" icon={Home}>
            {nav.propertyGallery}
          </NavItem>
        )}

        {['admin', 'moderator', 'premium agent', 'agent', 'застройщик', 'премиум застройщик'].includes(role) && (
          <NavItem to="/complex/gallery" icon={Building2}>
            {nav.complexGallery}
          </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
            <NavItem to="/agent-properties" icon={List}>
              {nav.agentProperties}
            </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
            <NavItem to="/property/list" icon={Building}>
              {nav.properties}
            </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
            <NavItem to="/complex/list" icon={Building2}>
              {nav.complexes}
            </NavItem>
        )}

        {['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role) && (
          <NavItem to="/developers/list" icon={Building2}>
            {['застройщик', 'премиум застройщик'].includes(role) ? translations[language]?.developersList?.titleForDeveloper || nav.developers : nav.developers}
          </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
            <NavItem to="/landmark/list" icon={Landmark}>
              {nav.landmarks}
            </NavItem>
        )}

        {(['admin', 'moderator'].includes(role) || isAnyDeveloper(role)) && (
          <NavItem to="/chessboard" icon={LayoutGrid}>
            {nav.chessboards}
          </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
          <NavItem to="/support/chats" icon={MessageSquare}>
            {nav.support}
          </NavItem>
        )}

        {['admin', 'moderator', 'premium agent', 'agent'].includes(role) && (
          <NavItem to="/roi-calculator" icon={Calculator}>
            {nav.roiCalculator}
          </NavItem>
        )}

        {/* CRM System */}
        {['admin', 'moderator'].includes(role) && (
          <CrmMenuItem />
        )}

        {(['admin', 'moderator'].includes(role) || isAnyDeveloper(role)) && (
          <NavItem to="/client-fixations" icon={UserCheck}>
            {nav.clientFixations}
          </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
          <NavItem to="/client-leads" icon={Users2}>
            {nav.clientLeads}
          </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
          <NavItem to="/users/manage" icon={Users2}>
            {nav.userManagement}
          </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
          <NavItem to="/general-overview" icon={BarChart3}>
            {nav.generalOverview}
          </NavItem>
        )}

        {role === 'admin' && (
          <NavItem to="/registration-requests" icon={ClipboardList}>
            {nav.registrationRequests}
          </NavItem>
        )}

        {role === 'admin' && (
          <NavItem to="/agent-registration-requests" icon={UserCheck}>
            {nav.agentRegistrationRequests}
          </NavItem>
        )}

        {['admin', 'moderator'].includes(role) && (
          <NavItem to="/referral-map" icon={Network}>
            {nav.referralMap}
          </NavItem>
        )}

        {['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role) && (
          <NavItem to="/education" icon={GraduationCap}>
            {nav.education}
          </NavItem>
        )}

        {['admin', 'moderator', 'застройщик', 'премиум застройщик'].includes(role) && (
          <NavItem to="/settings" icon={Settings}>
            {nav.settings}
          </NavItem>
        )}



        {/* Новые разделы для застройщиков */}
        {isAnyDeveloper(role) && (
          <NavItem to="/premium-features" icon={Star}>
            {nav.premiumFeatures}
          </NavItem>
        )}

        {/* Уведомления - доступны для премиум застройщика и админа */}
        {(isPremiumDeveloper(role) || role === 'admin') && (
          <NavItem to="/notifications" icon={Bell}>
            {nav.notifications}
          </NavItem>
        )}
        {isDeveloper(role) && !isPremiumDeveloper(role) && role !== 'admin' && (
          <AdaptiveTooltip content={nav.premiumSubscriptionTooltip}>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
              <Bell className="h-4 w-4" />
              <span>{nav.notifications}</span>
            </div>
          </AdaptiveTooltip>
        )}

        {/* ⚠️ КРИТИЧЕСКИ ВАЖНО: Публичная страница - активна только для премиум застройщика */}
        {isPremiumDeveloper(role) && (
          <NavItem to="/public-page" icon={Globe}>
            {nav.publicPage}
          </NavItem>
        )}
                       {isDeveloper(role) && (
                 <AdaptiveTooltip content={nav.premiumSubscriptionTooltip}>
                   <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                     <Globe className="h-4 w-4" />
                     <span>{nav.publicPage}</span>
                   </div>
                 </AdaptiveTooltip>
               )}
      </nav>
    </div>
  );
};

export default Navigation; 