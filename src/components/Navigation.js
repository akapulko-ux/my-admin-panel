import React, { useState } from 'react';
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
  LogOut,
  Menu,
  ChevronRight,
  Plus,
  LayoutGrid
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
    '/support/*'
  ],
  'премиум агент': [
    '/property/*',
    '/gallery/*',
    '/support/*'
  ],
  agent: [
    '/property/*',
    '/gallery/*',
    '/support/*'
  ],
  застройщик: [
    '/property/gallery',
    '/chessboard',
    '/chessboard/*'
  ],
  user: [
    '/gallery/*'
  ]
};

const Navigation = () => {
  const { role } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const NavItem = ({ to, icon: Icon, children, isSubItem = false }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link 
        to={to}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground",
          isSubItem && "pl-9"
        )}
      >
        {!isSubItem && Icon && <Icon className="h-4 w-4" />}
        <span className={cn(
          "flex-1 truncate",
          isCollapsed && !isSubItem && "hidden"
        )}>
          {children}
        </span>
        {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
      </Link>
    );
  };

  return (
    <div className={cn(
      "flex flex-col gap-4 p-4 h-screen border-r",
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
        {['admin', 'модератор', 'премиум агент', 'agent', 'застройщик'].includes(role) && (
          <NavItem to="/property/gallery" icon={Home}>
            Галерея объектов
          </NavItem>
        )}

        {['admin', 'модератор', 'премиум агент', 'agent'].includes(role) && (
          <>
            <NavItem to="/property/list" icon={Building}>
              Объекты
            </NavItem>
            {!isCollapsed && (
              <NavItem to="/property/new" isSubItem>
                Создать объект
              </NavItem>
            )}
          </>
        )}

        {['admin', 'модератор'].includes(role) && (
          <>
            <NavItem to="/complex/list" icon={Building2}>
              Комплексы
            </NavItem>
            {!isCollapsed && (
              <NavItem to="/complex/new" isSubItem>
                Создать комплекс
              </NavItem>
            )}
          </>
        )}

        {['admin', 'модератор'].includes(role) && (
          <NavItem to="/developers/list" icon={Building2}>
            Застройщики
          </NavItem>
        )}

        {['admin', 'модератор'].includes(role) && (
          <>
            <NavItem to="/landmark/list" icon={Landmark}>
              Достопримечательности
            </NavItem>
            {!isCollapsed && (
              <NavItem to="/landmark/new" isSubItem>
                Создать достопримечательность
              </NavItem>
            )}
          </>
        )}

        {['admin', 'модератор', 'застройщик'].includes(role) && (
          <NavItem to="/chessboard" icon={LayoutGrid}>
            Шахматки
          </NavItem>
        )}

        {['admin', 'модератор', 'премиум агент', 'agent'].includes(role) && (
          <NavItem to="/support/chats" icon={MessageSquare}>
            Поддержка
          </NavItem>
        )}

        {role === 'admin' && (
          <NavItem to="/users/manage" icon={Users2}>
            Управление пользователями
          </NavItem>
        )}
      </nav>
    </div>
  );
};

export default Navigation; 