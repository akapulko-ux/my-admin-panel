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
import CreateLandmark from "./pages/CreateLandmark";
import ListLandmarks from "./pages/ListLandmarks";
import EditLandmark from "./pages/EditLandmark";
import ListDevelopers from "./pages/ListDevelopers";
import EditDeveloper from "./pages/EditDeveloper";
import SupportChats from "./pages/SupportChats"; // ✅ Импорт нового компонента

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
            <ListItem button component={Link} to="/landmark/new">
              <ListItemText primary="Создать Достопримечательность" />
            </ListItem>
            <ListItem button component={Link} to="/landmark/list">
              <ListItemText primary="Список Достопримечательностей" />
            </ListItem>

            {/* ✅ Новая кнопка "Застройщики" */}
            <ListItem button component={Link} to="/developers">
              <ListItemText primary="Застройщики" />
            </ListItem>

            {/* ✅ Новая кнопка "Чаты техподдержки" */}
            <ListItem button component={Link} to="/support/chats">
              <ListItemText primary="Чаты техподдержки" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box sx={{ p: 2 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

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

          <Route
            path="/developers"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <ListDevelopers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/developers/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <EditDeveloper />
              </ProtectedRoute>
            }
          />

          {/* ✅ Новый маршрут для страницы SupportChats */}
          <Route
            path="/support/chats"
            element={
              <ProtectedRoute requiredRoles={["admin", "moderator", "agent"]}>
                <SupportChats />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/complex/list" />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;