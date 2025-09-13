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
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { translations } from './lib/translations';
import PWANotifications from './components/PWANotifications';
import './testLanguageUpdate'; // Импортируем тестовую функцию

// Лендинги
import DevLandingPage from "./pages/DevLandingPage";
import MainLandingPage from "./pages/MainLandingPage";
import ConstructionSupervisionLanding from "./pages/ConstructionSupervisionLanding";

// Комплексы
import CreateComplex from "./pages/CreateComplex";
import EditComplex from "./pages/EditComplex";
import ListComplexes from "./pages/ListComplexes";
import ComplexesGallery from "./pages/ComplexesGallery";
import ComplexDetail from "./pages/ComplexDetail";

// Объекты
import CreateProperty from "./pages/CreateProperty";
import EditProperty from "./pages/EditProperty";
import ListProperties from "./pages/ListProperties";
import PropertiesGallery from "./pages/PropertiesGallery";
import PropertyDetail from "./pages/PropertyDetail";
import BuildingProgress from "./pages/BuildingProgress";
import BuildingProgressDetail from "./pages/BuildingProgressDetail";
import PublicBuildingProgress from "./pages/PublicBuildingProgress";
import PublicBuildingProgressDetail from "./pages/PublicBuildingProgressDetail";

// Достопримечательности
import CreateLandmark from "./pages/CreateLandmark";
import EditLandmark from "./pages/EditLandmark";
import ListLandmarks from "./pages/ListLandmarks";

// Обучение
import Education from "./pages/Education";
import EducationTopic from "./pages/EducationTopic";
import EducationLesson from "./pages/EducationLesson";
import EducationSection from "./pages/EducationSection";

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
import PublicRoiPage from "./pages/PublicRoiPage";
import PublicPropertyRoiPage from "./pages/PublicPropertyRoiPage";

// Фиксации клиентов
import ClientFixations from "./pages/ClientFixations";



// Прочее
import LoginPage from "./pages/LoginPage";
import UserManagement from "./pages/UserManagement";
import GeneralOverview from "./pages/GeneralOverview";

// Дашборд аналитики
import Dashboard from "./pages/Dashboard";
import AppStatistics from "./pages/AppStatistics";

import AccessClosed from "./pages/AccessClosed";

// Заявки на регистрацию
import RegistrationRequests from "./pages/RegistrationRequests";

// Заявки агентов на регистрацию в IT Agent
import AgentRegistrationRequests from "./pages/AgentRegistrationRequests";

// Карта рефералов
import ReferralMap from "./pages/ReferralMap";

// Настройки
import Settings from "./pages/Settings";

// Технический надзор
import TechnicalSupervision from "./pages/TechnicalSupervision";
import PublicTechnicalSupervision from "./pages/PublicTechnicalSupervision";

// Новые разделы для застройщиков
import PremiumFeatures from "./pages/PremiumFeatures";
import Notifications from "./pages/Notifications";
import PublicPage from "./pages/PublicPage";
import BotsManager from "./pages/BotsManager";
import KnowledgeBase from "./pages/KnowledgeBase";
import PublicPageAgent from "./pages/PublicPageAgent";
import PublicAgentAuth from "./pages/PublicAgentAuth";
import PublicPropertiesGallery from "./pages/PublicPropertiesGallery";
import PublicFavorites from "./pages/PublicFavorites";
import PublicAccount from "./pages/PublicAccount";
import PublicComplexDetail from "./pages/PublicComplexDetail";
import PublicPropertyDetail from "./pages/PublicPropertyDetail";
import PublicAdminLikePropertyDetail from "./pages/PublicAdminLikePropertyDetail";
import ClientLeads from "./pages/ClientLeads";
import AgentProperties from "./pages/AgentProperties";
import AgentPropertyCreate from "./pages/AgentPropertyCreate";

// CRM система
import CrmDeals from "./pages/CrmDeals";
import CrmTasks from "./pages/CrmTasks";
import CrmLists from "./pages/CrmLists";

const AdminLayout = ({ children }) => {
  const { currentUser, logout, role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const [developerName, setDeveloperName] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchDeveloperName = async () => {
      if (['застройщик', 'премиум застройщик'].includes(role) && currentUser) {
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
      {/* Десктопная навигация */}
      {!isMobile && <Navigation />}
      
      {/* Мобильная навигация */}
      {isMobile && <Navigation />}
      
      <div className={cn(
        "flex-1 flex flex-col",
        isMobile ? "w-full" : "min-w-0"
      )}>
        <header className={cn(
          "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          isMobile && "pl-16" // Добавляем отступ слева для мобильной кнопки меню
        )}>
          <div className={cn(
            "flex h-14 items-center justify-between",
            isMobile ? "px-4" : "px-6"
          )}>
            <Link 
              to="/" 
              className={cn(
                "text-lg font-semibold transition-colors hover:text-primary",
                "flex items-center gap-2",
                isMobile && "text-base truncate" // Уменьшаем размер на мобильных
              )}
            >
              {isMobile ? "IT Agent" : "IT Agent Admin Panel"}
              {['застройщик', 'премиум застройщик'].includes(role) && developerName && !isMobile && (
                <span className="text-gray-500">({developerName})</span>
              )}
            </Link>
            
            {currentUser && (
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {!isMobile && <span>{t.logout}</span>}
              </Button>
            )}
          </div>
        </header>
        <main className={cn(
          "flex-1 overflow-auto",
          isMobile ? "p-4" : "p-6"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <CacheProvider>
            <Toaster />
            <PWANotifications />
            <Routes>
              {/* Публичные маршруты - без оболочки админ-панели */}
              <Route path="/public/:publicId" element={<PublicChessboard />} />
              <Route path="/public-chessboard/:publicId" element={<PublicChessboard />} />
              <Route path="/chessboard-overview/:publicId" element={<ChessboardOverview />} />
              <Route path="/public-roi/:id" element={<PublicRoiPage />} />
              <Route path="/public-roi/property/:propertyId" element={<PublicPropertyRoiPage />} />
              <Route path="/public-building-progress/:type/:id" element={<PublicBuildingProgress />} />
              <Route path="/public-building-progress/:type/:id/:monthKey" element={<PublicBuildingProgressDetail />} />
              <Route path="/public-technical-supervision/:projectId" element={<PublicTechnicalSupervision />} />
              <Route path="/construction-supervision" element={<ConstructionSupervisionLanding />} />
              <Route path="/public" element={<MainLandingPage />} />
              <Route path="/public/complex/:id" element={<PublicComplexDetail />} />
              <Route path="/public/property/:id" element={<PublicPropertyDetail />} />
              <Route path="/public/favorites" element={<PublicFavorites />} />
              <Route path="/public/account" element={<PublicAccount />} />
              <Route path="/public-agent-page/:developerId" element={<ProtectedRoute><PublicPageAgent /></ProtectedRoute>} />
              <Route path="/public-agent-auth" element={<PublicAgentAuth />} />
              <Route path="/public/complex-property/:id" element={<PublicAdminLikePropertyDetail />} />
              <Route path="/agent-property/create" element={<AgentPropertyCreate />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/roi-calculator" element={<RoiCalculator />} />
              <Route path="/access-closed" element={<AccessClosed />} />

              {/* Главная страница - теперь публичная галерея */}
              <Route path="/" element={<PublicPropertiesGallery />} />
              
              {/* Лендинг для застройщиков */}
              <Route path="/dev" element={<DevLandingPage />} />

              {/* Детальная страница объекта без боковой панели */}
              <Route path="/property/:id/standalone" element={
                <ProtectedRoute>
                  <PropertyDetail />
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
                    <Route path="/complex/gallery" element={
                      <ProtectedRoute>
                        <ComplexesGallery />
                      </ProtectedRoute>
                    } />
                    <Route path="/complex/:id" element={
                      <ProtectedRoute>
                        <ComplexDetail />
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
                    {/* Маршрут для редактирования объектов перенесен в публичную часть */}
                    
                    {/* Детальная страница объекта */}
                    <Route path="/property/:id" element={
                      <ProtectedRoute>
                        <PropertyDetail />
                      </ProtectedRoute>
                    } />

                    {/* Объекты агентов */}
                    <Route path="/agent-properties" element={
                      <ProtectedRoute>
                        <AgentProperties />
                      </ProtectedRoute>
                    } />
                    
                    {/* Прогресс строительства */}
                    <Route path="/building-progress/complex/:id" element={
                      <ProtectedRoute>
                        <BuildingProgress type="complex" />
                      </ProtectedRoute>
                    } />
                    <Route path="/building-progress/:type/:id/:monthKey" element={
                      <ProtectedRoute>
                        <BuildingProgressDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/public-building-progress/:type/:id" element={<PublicBuildingProgress />} />
                    <Route path="/public-building-progress/:type/:id/:monthKey" element={<PublicBuildingProgressDetail />} />

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

                    {/* Заявки клиентов */}
                    <Route path="/client-leads" element={
                      <ProtectedRoute>
                        <ClientLeads />
                      </ProtectedRoute>
                    } />

                    {/* Общий обзор */}
                    <Route path="/general-overview" element={
                      <ProtectedRoute>
                        <GeneralOverview />
                      </ProtectedRoute>
                    } />

                    {/* Статистика приложения */}
                    <Route path="/app-statistics" element={
                      <ProtectedRoute>
                        <AppStatistics />
                      </ProtectedRoute>
                    } />

                    {/* Дашборд аналитики */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
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

                    {/* Заявки агентов на регистрацию в IT Agent (только для админа) */}
                    <Route path="/agent-registration-requests" element={
                      <ProtectedRoute>
                        <AgentRegistrationRequests />
                      </ProtectedRoute>
                    } />

                    {/* Карта рефералов (только для админа) */}
                    <Route path="/referral-map" element={
                      <ProtectedRoute>
                        <ReferralMap />
                      </ProtectedRoute>
                    } />

                    {/* Обучение */}
                    <Route path="/education" element={
                      <ProtectedRoute>
                        <Education />
                      </ProtectedRoute>
                    } />
                    <Route path="/education/section/:sectionId" element={
                      <ProtectedRoute>
                        <EducationSection />
                      </ProtectedRoute>
                    } />
                    <Route path="/education/topic/:topicId" element={
                      <ProtectedRoute>
                        <EducationTopic />
                      </ProtectedRoute>
                    } />
                    <Route path="/education/lesson/:topicId/:lessonId" element={
                      <ProtectedRoute>
                        <EducationLesson />
                      </ProtectedRoute>
                    } />

                    {/* Настройки */}
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />

                    {/* Технический надзор */}
                    <Route path="/technical-supervision" element={
                      <ProtectedRoute>
                        <TechnicalSupervision />
                      </ProtectedRoute>
                    } />

                    {/* CRM система */}
                    <Route path="/crm/deals" element={
                      <ProtectedRoute>
                        <CrmDeals />
                      </ProtectedRoute>
                    } />
                    <Route path="/crm/tasks" element={
                      <ProtectedRoute>
                        <CrmTasks />
                      </ProtectedRoute>
                    } />
                    <Route path="/crm/lists" element={
                      <ProtectedRoute>
                        <CrmLists />
                      </ProtectedRoute>
                    } />

                    {/* Новые разделы для застройщиков */}
                    <Route path="/premium-features" element={
                      <ProtectedRoute>
                        <PremiumFeatures />
                      </ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    } />
                    <Route path="/public-page" element={
                      <ProtectedRoute>
                        <PublicPage />
                      </ProtectedRoute>
                    } />

                    {/* Боты (admin, premium agent, премиум застройщик) */}
                    <Route path="/bots" element={
                      <ProtectedRoute>
                        <BotsManager />
                      </ProtectedRoute>
                    } />

                    {/* База знаний */}
                    <Route path="/knowledge" element={
                      <ProtectedRoute>
                        <KnowledgeBase />
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
      </LanguageProvider>
    </Router>
  );
}

export default App;