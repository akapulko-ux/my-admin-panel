// src/pages/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  Button
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { CacheProvider } from "./CacheContext";

import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import UserManagement from "./pages/UserManagement";

// Комплексы
import CreateComplex from "./pages/CreateComplex";
import EditComplex from "./pages/EditComplex";
import ListComplexes from "./pages/ListComplexes";

// Объекты
import CreateProperty from "./pages/CreateProperty";
import EditProperty from "./pages/EditProperty";
import ListProperties from "./pages/ListProperties";
import PropertiesGallery from "./pages/PropertiesGallery";
import PropertyDetail from "./pages/PropertyDetail";

// Достопримечательности
import CreateLandmark from "./pages/CreateLandmark";
import EditLandmark from "./pages/EditLandmark";
import ListLandmarks from "./pages/ListLandmarks";

// Застройщики
import ListDevelopers from "./pages/ListDevelopers";
import EditDeveloper from "./pages/EditDeveloper";

// Поддержка
import SupportChats from "./pages/SupportChats";

// Шахматка
import Chessboard from "./pages/Chessboard";

import { useAuth } from "./AuthContext";

function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { currentUser, logout, role } = useAuth();

  const toggleDrawer = (open) => () => setDrawerOpen(open);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Router>
      <CacheProvider>
        <AppBar position="static">
          <Toolbar>
            {role !== 'застройщик' && (
              <IconButton edge="start" color="inherit" onClick={toggleDrawer(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ 
                flexGrow: 1,
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': {
                  opacity: 0.8
                },
                cursor: 'pointer'
              }}
            >
              IT Agent Admin Panel
            </Typography>
            {currentUser ? (
              <Button color="inherit" onClick={handleLogout}>Выйти</Button>
            ) : (
              <Button color="inherit" component={Link} to="/login">Войти</Button>
            )}
          </Toolbar>
        </AppBar>

        <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
          <Box sx={{ width: 240 }} onClick={toggleDrawer(false)}>
            <List>
              {/* Комплексы */}
              <ListItem button component={Link} to="/complex/new">
                <ListItemText primary="Создать Комплекс" />
              </ListItem>
              <ListItem button component={Link} to="/complex/list">
                <ListItemText primary="Список Комплексов" />
              </ListItem>

              {/* Объекты */}
              <ListItem button component={Link} to="/property/new">
                <ListItemText primary="Создать Объект" />
              </ListItem>
              <ListItem button component={Link} to="/property/list">
                <ListItemText primary="Список Объектов" />
              </ListItem>
              <ListItem button component={Link} to="/property/gallery">
                <ListItemText primary="Галерея Объектов" />
              </ListItem>

              {/* Достопримечательности */}
              <ListItem button component={Link} to="/landmark/new">
                <ListItemText primary="Создать Достопримечательность" />
              </ListItem>
              <ListItem button component={Link} to="/landmark/list">
                <ListItemText primary="Список Достопримечательностей" />
              </ListItem>

              {/* Застройщики */}
              <ListItem button component={Link} to="/developers/list">
                <ListItemText primary="Застройщики" />
              </ListItem>

              {/* Поддержка */}
              <ListItem button component={Link} to="/support/chats">
                <ListItemText primary="Чаты поддержки" />
              </ListItem>

              {/* Шахматка */}
              <ListItem button component={Link} to="/chessboard">
                <ListItemText primary="Шахматки" />
              </ListItem>

              {/* Управление пользователями */}
              <ListItem button component={Link} to="/users/manage">
                <ListItemText primary="Управление пользователями" />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Box sx={{ p: 2 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Комплексы */}
            <Route path="/complex/new" element={
              <ProtectedRoute>
                <CreateComplex />
              </ProtectedRoute>
            } />
            <Route path="/complex/edit/:id" element={
              <ProtectedRoute>
                <EditComplex />
              </ProtectedRoute>
            } />
            <Route path="/complex/list" element={
              <ProtectedRoute>
                <ListComplexes />
              </ProtectedRoute>
            } />

            {/* Объекты */}
            <Route path="/property/new" element={
              <ProtectedRoute>
                <CreateProperty />
              </ProtectedRoute>
            } />
            <Route path="/property/edit/:id" element={
              <ProtectedRoute>
                <EditProperty />
              </ProtectedRoute>
            } />
            <Route path="/property/list" element={
              <ProtectedRoute>
                <ListProperties />
              </ProtectedRoute>
            } />
            <Route path="/property/gallery" element={
              <ProtectedRoute>
                <PropertiesGallery />
              </ProtectedRoute>
            } />
            <Route path="/property/:id" element={
              <ProtectedRoute>
                <PropertyDetail />
              </ProtectedRoute>
            } />

            {/* Достопримечательности */}
            <Route path="/landmark/new" element={
              <ProtectedRoute>
                <CreateLandmark />
              </ProtectedRoute>
            } />
            <Route path="/landmark/edit/:id" element={
              <ProtectedRoute>
                <EditLandmark />
              </ProtectedRoute>
            } />
            <Route path="/landmark/list" element={
              <ProtectedRoute>
                <ListLandmarks />
              </ProtectedRoute>
            } />

            {/* Застройщики */}
            <Route path="/developers/list" element={
              <ProtectedRoute>
                <ListDevelopers />
              </ProtectedRoute>
            } />
            <Route path="/developers/edit/:id" element={
              <ProtectedRoute>
                <EditDeveloper />
              </ProtectedRoute>
            } />

            {/* Поддержка */}
            <Route path="/support/chats" element={
              <ProtectedRoute>
                <SupportChats />
              </ProtectedRoute>
            } />

            {/* Шахматка */}
            <Route path="/chessboard" element={
              <ProtectedRoute>
                <Chessboard />
              </ProtectedRoute>
            } />

            {/* Управление пользователями */}
            <Route path="/users/manage" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } />

            {/* Главная страница */}
            <Route path="/" element={
              <ProtectedRoute>
                <PropertiesGallery />
              </ProtectedRoute>
            } />
          </Routes>
        </Box>
      </CacheProvider>
    </Router>
  );
}

export default App;