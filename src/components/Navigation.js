import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
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
  LayoutGrid,
  Calculator,
  UserCheck,
  ClipboardList
} from 'lucide-react';

// Определяем доступ к маршрутам для разных ролей
const ROUTE_ACCESS = {
  admin: ['*'],
  модератор: [
    '/property/*',
    '/complex/*',
    '/developers/*',
    '/landmark/*',
    '/gallery/*',
    '/support/*',
    '/client-fixations',
    '/building-progress/*'
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
  user: [
    '/gallery/*'
  ]
};

const Navigation = () => {
  const { role } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const NavItem = ({ to, icon: Icon, children, isSubItem = false, onClick }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link 
        to={to}
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
                Админ панель
              </span>
            </div>

            {/* Навигационные элементы */}
            <nav className="space-y-2">
              {['admin', 'модератор', 'premium agent', 'agent', 'застройщик'].includes(role) && (
                <NavItem 
                  to="/property/gallery" 
                  icon={Home}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Галерея объектов
                </NavItem>
              )}

              {['admin', 'модератор', 'premium agent', 'agent', 'застройщик'].includes(role) && (
                <NavItem 
                  to="/complex/gallery" 
                  icon={Building2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Галерея комплексов
                </NavItem>
              )}

              {['admin', 'модератор'].includes(role) && (
                <NavItem 
                  to="/property/list" 
                  icon={Building}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Объекты
                </NavItem>
              )}

              {['admin', 'модератор'].includes(role) && (
                <NavItem 
                  to="/complex/list" 
                  icon={Building2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Комплексы
                </NavItem>
              )}

              {['admin', 'модератор'].includes(role) && (
                <NavItem 
                  to="/developers/list" 
                  icon={Building2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Застройщики
                </NavItem>
              )}

              {['admin', 'модератор'].includes(role) && (
                <NavItem 
                  to="/landmark/list" 
                  icon={Landmark}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Достопримечательности
                </NavItem>
              )}

              {['admin', 'модератор', 'застройщик'].includes(role) && (
                <NavItem 
                  to="/chessboard" 
                  icon={LayoutGrid}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Шахматки
                </NavItem>
              )}

              {['admin', 'модератор'].includes(role) && (
                <NavItem 
                  to="/support/chats" 
                  icon={MessageSquare}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Поддержка
                </NavItem>
              )}

              {['admin', 'модератор'].includes(role) && (
                <NavItem 
                  to="/roi-calculator" 
                  icon={Calculator}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Калькулятор ROI
                </NavItem>
              )}

              {['admin', 'модератор', 'застройщик'].includes(role) && (
                <NavItem 
                  to="/client-fixations" 
                  icon={UserCheck}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Фиксации клиентов
                </NavItem>
              )}

              {role === 'admin' && (
                <NavItem 
                  to="/users/manage" 
                  icon={Users2}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Управление пользователями
                </NavItem>
              )}

              {role === 'admin' && (
                <NavItem 
                  to="/registration-requests" 
                  icon={ClipboardList}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Заявки на регистрацию
                </NavItem>
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
            Админ панель
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

      <nav className="space-y-1">
        {['admin', 'модератор', 'premium agent', 'agent', 'застройщик'].includes(role) && (
          <NavItem to="/property/gallery" icon={Home}>
            Галерея объектов
          </NavItem>
        )}

        {['admin', 'модератор', 'premium agent', 'agent', 'застройщик'].includes(role) && (
          <NavItem to="/complex/gallery" icon={Building2}>
            Галерея комплексов
          </NavItem>
        )}

        {['admin', 'модератор'].includes(role) && (
            <NavItem to="/property/list" icon={Building}>
              Объекты
            </NavItem>
        )}

        {['admin', 'модератор'].includes(role) && (
            <NavItem to="/complex/list" icon={Building2}>
              Комплексы
            </NavItem>
        )}

        {['admin', 'модератор'].includes(role) && (
          <NavItem to="/developers/list" icon={Building2}>
            Застройщики
          </NavItem>
        )}

        {['admin', 'модератор'].includes(role) && (
            <NavItem to="/landmark/list" icon={Landmark}>
              Достопримечательности
            </NavItem>
        )}

        {['admin', 'модератор', 'застройщик'].includes(role) && (
          <NavItem to="/chessboard" icon={LayoutGrid}>
            Шахматки
          </NavItem>
        )}

        {['admin', 'модератор'].includes(role) && (
          <NavItem to="/support/chats" icon={MessageSquare}>
            Поддержка
          </NavItem>
        )}

        {['admin', 'модератор'].includes(role) && (
          <NavItem to="/roi-calculator" icon={Calculator}>
            Калькулятор ROI
          </NavItem>
        )}

        {['admin', 'модератор', 'застройщик'].includes(role) && (
          <NavItem to="/client-fixations" icon={UserCheck}>
            Фиксации клиентов
          </NavItem>
        )}

        {role === 'admin' && (
          <NavItem to="/users/manage" icon={Users2}>
            Управление пользователями
          </NavItem>
        )}

        {role === 'admin' && (
          <NavItem to="/registration-requests" icon={ClipboardList}>
            Заявки на регистрацию
          </NavItem>
        )}
      </nav>
    </div>
  );
};

export default Navigation; 