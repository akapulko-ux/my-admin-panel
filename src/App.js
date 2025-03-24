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

// --- Комплексы ---
import CreateComplex from "./pages/CreateComplex";
import EditComplex from "./pages/EditComplex";
import ListComplexes from "./pages/ListComplexes";

// --- Объекты ---
import CreateProperty from "./pages/CreateProperty";
import EditProperty from "./pages/EditProperty";
import ListProperties from "./pages/ListProperties";

// --- Достопримечательности ---
import CreateLandmark from "./pages/CreateLandmark";
import ListLandmarks from "./pages/ListLandmarks";
import EditLandmark from "./pages/EditLandmark";

// --- Застройщики ---
import ListDevelopers from "./pages/ListDevelopers";
// [NEW] Импортируем EditDeveloper
import EditDeveloper from "./pages/EditDeveloper";

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
            {/* Меню Комплексов */}
            <ListItem button component={Link} to="/complex/new">
              <ListItemText primary="Создать Комплекс" />
            </ListItem>
            <ListItem button component={Link} to="/complex/list">
              <ListItemText primary="Список Комплексов" />
            </ListItem>

            {/* Меню Объектов */}
            <ListItem button component={Link} to="/property/new">
              <ListItemText primary="Создать Объект" />
            </ListItem>
            <ListItem button component={Link} to="/property/list">
              <ListItemText primary="Список Объектов" />
            </ListItem>

            {/* Меню Достопримечательностей */}
            <ListItem button component={Link} to="/landmark/new">
              <ListItemText primary="Создать Достопримечательность" />
            </ListItem>
            <ListItem button component={Link} to="/landmark/list">
              <ListItemText primary="Список Достопримечательностей" />
            </ListItem>

            {/* [NEW] Кнопка «Застройщики» -> /developers/list */}
            <ListItem button component={Link} to="/developers/list">
              <ListItemText primary="Застройщики" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box sx={{ p: 2 }}>
        <Routes>
          {/* Авторизация */}
          <Route path="/login" element={<LoginPage />} />

          {/* --- Комплексы --- */}
          <Route
            path="/complex/new"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <CreateComplex />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complex/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <EditComplex />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complex/list"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <ListComplexes />
              </ProtectedRoute>
            }
          />

          {/* --- Объекты --- */}
          <Route
            path="/property/new"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <CreateProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <EditProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/list"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <ListProperties />
              </ProtectedRoute>
            }
          />

          {/* --- Достопримечательности --- */}
          <Route
            path="/landmark/new"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <CreateLandmark />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landmark/list"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <ListLandmarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landmark/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <EditLandmark />
              </ProtectedRoute>
            }
          />

          {/* --- Застройщики --- */}
          {/* (Старый маршрут "/developers" уже есть — оставим или уберём, по желанию) */}

          {/* [NEW] /developers/list -> список застройщиков */}
          <Route
            path="/developers/list"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <ListDevelopers />
              </ProtectedRoute>
            }
          />

          {/* [NEW] /developer/edit/:id -> редактирование застройщика */}
          <Route
            path="/developer/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator"]}>
                <EditDeveloper />
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