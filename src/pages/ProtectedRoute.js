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
    '/roi-calculator'
  ],
  'премиум агент': [
    '/property/*',
    '/support/*',
    '/roi-calculator'
  ],
  agent: [
    '/property/*',
    '/support/*',
    '/roi-calculator'
  ],
  застройщик: [
    '/property/gallery',
    '/chessboard',
    '/chessboard/*',
    '/roi-calculator',
    '/'
  ],
  user: [
    '/property/gallery',
    '/'
  ]
};

const ProtectedRoute = ({ children }) => {
  const { currentUser, role } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
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
    return <Navigate to="/property/gallery" />;
  }

  return children;
};

export default ProtectedRoute;