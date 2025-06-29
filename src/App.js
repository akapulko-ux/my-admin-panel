// src/pages/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { CacheProvider } from "./CacheContext";
import { AuthProvider } from "./AuthContext";
import Navigation from "./components/Navigation";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "./lib/utils";
import { useAuth } from "./AuthContext";
import ProtectedRoute from "./pages/ProtectedRoute";
import { Toaster } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Лендинг
import LandingPage from "./pages/LandingPage";

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
import SupportChatDetail from "./pages/SupportChatDetail";

// Шахматка
import Chessboard from "./pages/Chessboard";
import ListChessboards from "./pages/ListChessboards";
import PublicChessboard from "./pages/PublicChessboard";
import ChessboardOverview from "./pages/ChessboardOverview";

// Калькулятор ROI
import RoiCalculator from "./pages/RoiCalculator";

// Фиксации клиентов
import ClientFixations from "./pages/ClientFixations";

// Прочее
import LoginPage from "./pages/LoginPage";
import UserManagement from "./pages/UserManagement";

// Заявки на регистрацию
import RegistrationRequests from "./pages/RegistrationRequests";

const AdminLayout = ({ children }) => {
  const { currentUser, logout, role } = useAuth();
  const [developerName, setDeveloperName] = useState('');

  useEffect(() => {
    const fetchDeveloperName = async () => {
      if (role === 'застройщик' && currentUser) {
        try {
          // Получаем developerId из профиля пользователя
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          const developerId = userDoc.data()?.developerId;

          if (developerId) {
            // Получаем название застройщика
            const developerRef = doc(db, 'developers', developerId);
            const developerDoc = await getDoc(developerRef);
            if (developerDoc.exists()) {
              setDeveloperName(developerDoc.data().name);
            }
          }
        } catch (error) {
          console.error('Ошибка при получении названия застройщика:', error);
        }
      }
    };

    fetchDeveloperName();
  }, [role, currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <Navigation />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-6 justify-between">
            <Link 
              to="/" 
              className={cn(
                "text-lg font-semibold transition-colors hover:text-primary",
                "flex items-center gap-2"
              )}
            >
              IT Agent Admin Panel
              {role === 'застройщик' && developerName && (
                <span className="text-gray-500">({developerName})</span>
              )}
            </Link>
            
            {currentUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CacheProvider>
          <Toaster />
          <Routes>
            {/* Публичные маршруты - без оболочки админ-панели */}
            <Route path="/public/:publicId" element={<PublicChessboard />} />
            <Route path="/public-chessboard/:publicId" element={<PublicChessboard />} />
            <Route path="/chessboard-overview/:publicId" element={<ChessboardOverview />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Лендинг для неавторизованных пользователей */}
            <Route path="/" element={
              <ProtectedRoute isPublic>
                <LandingPage />
              </ProtectedRoute>
            } />

            {/* Административные маршруты - с оболочкой админ-панели */}
            <Route path="*" element={
              <AdminLayout>
                <Routes>
                  <Route path="/chessboard" element={
                    <ProtectedRoute>
                      <ListChessboards />
                    </ProtectedRoute>
                  } />
                  <Route path="/chessboard/:id" element={
                    <ProtectedRoute>
                      <Chessboard />
                    </ProtectedRoute>
                  } />

                  {/* Калькулятор ROI */}
                  <Route path="/roi-calculator" element={
                    <ProtectedRoute>
                      <RoiCalculator />
                    </ProtectedRoute>
                  } />

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
                  <Route path="/support/chats/:id" element={
                    <ProtectedRoute>
                      <SupportChatDetail />
                    </ProtectedRoute>
                  } />

                  {/* Управление пользователями */}
                  <Route path="/users/manage" element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  } />

                  {/* Фиксации клиентов */}
                  <Route path="/client-fixations" element={
                    <ProtectedRoute>
                      <ClientFixations />
                    </ProtectedRoute>
                  } />

                  {/* Заявки на регистрацию (только для админа) */}
                  <Route path="/registration-requests" element={
                    <ProtectedRoute>
                      <RegistrationRequests />
                    </ProtectedRoute>
                  } />

                  {/* Главная страница для авторизованных пользователей */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <PropertiesGallery />
                    </ProtectedRoute>
                  } />
                </Routes>
              </AdminLayout>
            } />
          </Routes>
        </CacheProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;