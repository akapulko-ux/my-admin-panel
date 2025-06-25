import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  LocationCity as LocationCityIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  Support as SupportIcon,
  GridView as GridViewIcon,
  AccountBox as AccountBoxIcon
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';

// Определяем доступ к маршрутам для разных ролей
const ROUTE_ACCESS = {
  admin: ['*'], // Админ имеет доступ ко всем маршрутам
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
    '/gallery/*'
  ],
  user: [
    '/gallery/*'
  ]
};

const Navigation = () => {
  const { role } = useAuth();

  // Для застройщика не показываем боковую панель
  if (role === 'застройщик') {
    return null;
  }

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

  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <List component="nav">
        {/* Галерея объектов (доступна всем) */}
        <ListItem button component={Link} to="/property/gallery">
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Галерея объектов" />
        </ListItem>

        <Divider />

        {/* Объекты - доступны админу, модератору и агентам */}
        {['admin', 'модератор', 'премиум агент', 'agent'].includes(role) && (
          <>
            <ListItem button component={Link} to="/property/list">
              <ListItemIcon>
                <ApartmentIcon />
              </ListItemIcon>
              <ListItemText primary="Объекты" />
            </ListItem>
            {['admin', 'модератор', 'премиум агент', 'agent'].includes(role) && (
              <ListItem button component={Link} to="/property/new">
                <ListItemText primary="Создать объект" inset />
              </ListItem>
            )}
          </>
        )}

        {/* Комплексы - доступны админу и модератору */}
        {['admin', 'модератор'].includes(role) && (
          <>
            <ListItem button component={Link} to="/complex/list">
              <ListItemIcon>
                <LocationCityIcon />
              </ListItemIcon>
              <ListItemText primary="Комплексы" />
            </ListItem>
            <ListItem button component={Link} to="/complex/new">
              <ListItemText primary="Создать комплекс" inset />
            </ListItem>
          </>
        )}

        {/* Застройщики - доступны админу и модератору */}
        {['admin', 'модератор'].includes(role) && (
          <ListItem button component={Link} to="/developers/list">
            <ListItemIcon>
              <BusinessIcon />
            </ListItemIcon>
            <ListItemText primary="Застройщики" />
          </ListItem>
        )}

        {/* Достопримечательности - доступны админу и модератору */}
        {['admin', 'модератор'].includes(role) && (
          <>
            <ListItem button component={Link} to="/landmark/list">
              <ListItemIcon>
                <LocationCityIcon />
              </ListItemIcon>
              <ListItemText primary="Достопримечательности" />
            </ListItem>
            <ListItem button component={Link} to="/landmark/new">
              <ListItemText primary="Создать достопримечательность" inset />
            </ListItem>
          </>
        )}

        <Divider />

        {/* Шахматка - доступна админу и модератору */}
        {['admin', 'модератор'].includes(role) && (
          <ListItem button component={Link} to="/chessboard">
            <ListItemIcon>
              <GridViewIcon />
            </ListItemIcon>
            <ListItemText primary="Шахматка" />
          </ListItem>
        )}

        {/* Поддержка - доступна всем кроме застройщика */}
        {['admin', 'модератор', 'премиум агент', 'agent'].includes(role) && (
          <ListItem button component={Link} to="/support/chats">
            <ListItemIcon>
              <SupportIcon />
            </ListItemIcon>
            <ListItemText primary="Поддержка" />
          </ListItem>
        )}

        {/* Управление пользователями - только для админа */}
        {role === 'admin' && (
          <ListItem button component={Link} to="/users/manage">
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Управление пользователями" />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default Navigation; 