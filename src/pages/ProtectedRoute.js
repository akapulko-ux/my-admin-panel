import React from "react";
import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

// Определяем доступ к маршрутам для разных ролей
const ROUTE_ACCESS = {
  admin: ['*'], // Админ имеет доступ ко всем маршрутам
  модератор: [
    '/property/*',
    '/complex/*',
    '/developers/*',
    '/landmark/*',
    '/support/*',
    '/roi-calculator',
    '/client-fixations',
    '/building-progress/*',
    '/settings',
    '/education/*',
    '/referral-map',
  ],
  'premium agent': [
    '/property/gallery',
    '/building-progress/*',
    '/roi-calculator'
  ],
  agent: [
    '/property/gallery',
    '/building-progress/*',
    '/roi-calculator'
  ],
  застройщик: [
    '/property/gallery',
    '/property/*',
    '/complex/*',
    '/chessboard',
    '/chessboard/*',
    '/client-fixations',
    '/dashboard',
    '/building-progress/*',
    '/settings',
    '/education',
    '/education/*',
    '/premium-features',
    '/notifications',
    '/public-page'
  ],
  'премиум застройщик': [
    '/property/gallery',
    '/property/*',
    '/complex/*',
    '/chessboard',
    '/chessboard/*',
    '/client-fixations',
    '/dashboard',
    '/building-progress/*',
    '/settings',
    '/education',
    '/education/*',
    '/premium-features',
    '/notifications',
    '/public-page'
  ],
  user: [
    '/property/gallery',
    '/dashboard'
  ],
  closed: [] // Закрытый аккаунт не имеет доступа ни к каким маршрутам
};

// Маршруты по умолчанию для разных ролей
const DEFAULT_ROUTES = {
  admin: '/complex/list',
  модератор: '/complex/list',
  'premium agent': '/property/gallery',
  agent: '/property/gallery',
  застройщик: '/chessboard',
  'премиум застройщик': '/chessboard',
  user: '/property/gallery',
  closed: '/access-closed' // Специальная страница для закрытого аккаунта
};

const ProtectedRoute = ({ children, isPublic = false }) => {
  const { currentUser, role } = useAuth();

  // Для публичных маршрутов
  if (isPublic) {
    // Если пользователь авторизован, перенаправляем на дашборд
    if (currentUser) {
      const defaultRoute = DEFAULT_ROUTES[role] || '/dashboard';
      return <Navigate to={defaultRoute} />;
    }
    return children;
  }

  // Для защищенных маршрутов
  if (!currentUser) {
    return <Navigate to="/" />;
  }

  // Проверяем, не является ли пользователь заблокированным
  if (role === 'closed') {
    return <Navigate to="/access-closed" />;
  }

  // Получаем текущий путь
  const currentPath = window.location.pathname;
  
  // Проверяем доступ для роли
  const allowedPaths = ROUTE_ACCESS[role] || ROUTE_ACCESS.user;
  
  // Админ имеет доступ ко всему
  if (role === 'admin' || allowedPaths.includes('*')) {
    return children;
  }

  // Проверяем, соответствует ли текущий путь разрешенным шаблонам
  const hasAccess = allowedPaths.some(pattern => {
    if (pattern.includes('*')) {
      // Если путь содержит звездочку, используем регулярное выражение
      const regexPattern = pattern.replace('*', '.*');
      return new RegExp(`^${regexPattern}$`).test(currentPath);
    } else {
      // Если путь точный, сравниваем напрямую
      return pattern === currentPath;
    }
  });

  if (!hasAccess) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;