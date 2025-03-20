// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
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

import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import CreateComplex from "./pages/CreateComplex";
import EditComplex from "./pages/EditComplex";
import ListComplexes from "./pages/ListComplexes";
import CreateProperty from "./pages/CreateProperty";
import EditProperty from "./pages/EditProperty";
import ListProperties from "./pages/ListProperties";

// [NEW] Импортируем новый компонент для создания достопримечательности
import CreateLandmark from "./pages/CreateLandmark";

// [NEW] Импортируем компонент для списка достопримечательностей
import ListLandmarks from "./pages/ListLandmarks";

// [NEW] Импортируем компонент для редактирования достопримечательности
import EditLandmark from "./pages/EditLandmark";

import { useAuth } from "./AuthContext";

function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { currentUser, logout } = useAuth();

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            IT Agent Admin Panel
          </Typography>
          {currentUser ? (
            <Button color="inherit" onClick={handleLogout}>
              Выйти
            </Button>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Войти
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 240 }} onClick={toggleDrawer(false)}>
          <List>
            {/* Пункты меню */}
            <ListItem button component={Link} to="/complex/new">
              <ListItemText primary="Создать Комплекс" />
            </ListItem>
            <ListItem button component={Link} to="/complex/list">
              <ListItemText primary="Список Комплексов" />
            </ListItem>
            <ListItem button component={Link} to="/property/new">
              <ListItemText primary="Создать Объект" />
            </ListItem>
            <ListItem button component={Link} to="/property/list">
              <ListItemText primary="Список Объектов" />
            </ListItem>

            {/* Создать достопримечательность */}
            <ListItem button component={Link} to="/landmark/new">
              <ListItemText primary="Создать Достопримечательность" />
            </ListItem>

            {/* Список достопримечательностей */}
            <ListItem button component={Link} to="/landmark/list">
              <ListItemText primary="Список Достопримечательностей" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box sx={{ p: 2 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Создать Комплекс (admin, moderator, agent) */}
          <Route
            path="/complex/new"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <CreateComplex />
              </ProtectedRoute>
            }
          />
          {/* Редактировать Комплекс (admin, moderator) */}
          <Route
            path="/complex/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <EditComplex />
              </ProtectedRoute>
            }
          />
          {/* Список Комплексов (admin, moderator) */}
          <Route
            path="/complex/list"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <ListComplexes />
              </ProtectedRoute>
            }
          />

          {/* Создать Объект (admin, moderator, agent) */}
          <Route
            path="/property/new"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <CreateProperty />
              </ProtectedRoute>
            }
          />
          {/* Редактировать Объект (admin, moderator) */}
          <Route
            path="/property/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <EditProperty />
              </ProtectedRoute>
            }
          />
          {/* Список Объектов (admin, moderator) */}
          <Route
            path="/property/list"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <ListProperties />
              </ProtectedRoute>
            }
          />

          {/* Создать достопримечательность (admin, moderator, agent) */}
          <Route
            path="/landmark/new"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <CreateLandmark />
              </ProtectedRoute>
            }
          />
          {/* Список достопримечательностей (admin, moderator, agent) */}
          <Route
            path="/landmark/list"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <ListLandmarks />
              </ProtectedRoute>
            }
          />

          {/* [NEW] Редактировать достопримечательность (admin, moderator, agent) */}
          <Route
            path="/landmark/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <EditLandmark />
              </ProtectedRoute>
            }
          />

          {/* Если путь не найден, переходим к списку комплексов */}
          <Route path="*" element={<Navigate to="/complex/list" />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;