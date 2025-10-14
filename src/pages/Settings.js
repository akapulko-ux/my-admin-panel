import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { updatePassword, updateProfile } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import toast from 'react-hot-toast';
import { Bot, Check, X, ExternalLink, FileText, User, Key, Webhook, Plus, Eye, EyeOff, Copy, Trash2, Settings as SettingsIcon, AlertCircle, Clock, CheckCircle, Database, TestTube, RefreshCw, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

const Settings = () => {
  const { currentUser, role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].settings;
  const common = translations[language];
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Состояния для профиля
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Состояние для агентского договора
  const [contractSigned, setContractSigned] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [contractSignDate, setContractSignDate] = useState(null);
  const [developerName, setDeveloperName] = useState('');
  
  // Состояние для админа - список всех договоров
  const [allContracts, setAllContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [selectedContractUser, setSelectedContractUser] = useState(null);
  
  // Состояния для API интеграций
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showApiKeyVisibility, setShowApiKeyVisibility] = useState({});
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyDescription, setNewApiKeyDescription] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState(['fixations']);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState(['fixation_created']);
  
  // Состояния для CRM интеграций
  const [crmIntegrations, setCrmIntegrations] = useState([]);
  const [isLoadingCrmIntegrations, setIsLoadingCrmIntegrations] = useState(false);
  const [showCrmIntegrationDialog, setShowCrmIntegrationDialog] = useState(false);
  const [showCrmTestDialog, setShowCrmTestDialog] = useState(false);
  const [selectedCrmIntegration, setSelectedCrmIntegration] = useState(null);
  const [crmTestResult, setCrmTestResult] = useState(null);
  const [showCrmToken, setShowCrmToken] = useState(false);

  // Форма создания CRM интеграции
  const [crmFormData, setCrmFormData] = useState({
    name: '',
    crmType: 'amo',
    domain: '',
    accessToken: '',
    pipelineId: '',
    statusId: '',
    clientNameFieldId: '',
    phoneFieldId: '',
    emailFieldId: '',
    propertyFieldId: '',
    commentFieldId: '',
    isActive: true
  });
  
  // Состояния для сворачивания разделов
  const [isAllContractsExpanded, setIsAllContractsExpanded] = useState(false);
  const [isCrmIntegrationsExpanded, setIsCrmIntegrationsExpanded] = useState(false);
  
  // Telegram Bot данные
  const BOT_USERNAME = 'it_agent_admin_bot';
  
  // Загружаем настройки пользователя
  const loadUserSettings = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Загружаем данные профиля
        setUserName(userData.name || userData.displayName || currentUser.displayName || '');
        setUserEmail(userData.email || currentUser.email || '');
        
        if (userData.telegramChatId) {
          setTelegramChatId(userData.telegramChatId);
          setIsConnected(true);
        }
        
        // Загружаем статус договора
        if (userData.contractSigned) {
          setContractSigned(true);
          setContractSignDate(userData.contractSignDate);
        }
        
        // Загружаем название застройщика для роли застройщик
        if (['застройщик', 'премиум застройщик'].includes(role) && userData.developerId) {
          const developerRef = doc(db, 'developers', userData.developerId);
          const developerDoc = await getDoc(developerRef);
          if (developerDoc.exists()) {
            setDeveloperName(developerDoc.data().name);
          }
        }
      } else {
        // Если документ не существует, используем данные из currentUser
        setUserName(currentUser.displayName || '');
        setUserEmail(currentUser.email || '');
      }
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      toast.error('Ошибка при загрузке настроек');
    }
  }, [currentUser, role]);

  useEffect(() => {
    loadUserSettings();
  }, [currentUser, role, loadUserSettings]);

  // Загружаем договора для админа и модератора
  useEffect(() => {
    if (role === 'admin' || role === 'moderator') {
      loadAllContracts();
    }
  }, [role]);

  // Загружаем API ключи пользователя
  const loadApiKeys = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoadingApiKeys(true);
    try {
      const apiKeysRef = collection(db, 'apiKeys');
      const q = query(apiKeysRef, where('userId', '==', currentUser.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const keys = [];
        snapshot.forEach((doc) => {
          keys.push({ id: doc.id, ...doc.data() });
        });
        setApiKeys(keys);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Ошибка при загрузке API ключей:', error);
      toast.error('Ошибка при загрузке API ключей');
    } finally {
      setIsLoadingApiKeys(false);
    }
  }, [currentUser]);

  // Загружаем webhook подписки пользователя
  const loadWebhooks = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoadingWebhooks(true);
    try {
      const webhooksRef = collection(db, 'webhooks');
      const q = query(webhooksRef, where('userId', '==', currentUser.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const hooks = [];
        snapshot.forEach((doc) => {
          hooks.push({ id: doc.id, ...doc.data() });
        });
        setWebhooks(hooks);
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('Ошибка при загрузке webhook подписок:', error);
      toast.error('Ошибка при загрузке webhook подписок');
    } finally {
      setIsLoadingWebhooks(false);
    }
  }, [currentUser]);

  // Генерируем новый API ключ
  const generateApiKey = async () => {
    if (!currentUser) return;
    
    if (!newApiKeyName.trim()) {
      toast.error('Введите название API ключа');
      return;
    }
    
    try {
      const key = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const apiKeyData = {
        userId: currentUser.uid,
        name: newApiKeyName.trim(),
        description: newApiKeyDescription.trim(),
        key: key,
        permissions: newApiKeyPermissions,
        isActive: true,
        createdAt: new Date(),
        usageCount: 0,
        lastUsed: null
      };
      
      await addDoc(collection(db, 'apiKeys'), apiKeyData);
      
      setNewApiKeyName('');
      setNewApiKeyDescription('');
      setNewApiKeyPermissions(['fixations']);
      setShowApiKeyDialog(false);
      
      toast.success('API ключ успешно создан');
    } catch (error) {
      console.error('Ошибка при создании API ключа:', error);
      toast.error('Ошибка при создании API ключа');
    }
  };

  // Создаем новую webhook подписку
  const createWebhook = async () => {
    if (!currentUser) return;
    
    if (!newWebhookName.trim()) {
      toast.error('Введите название webhook подписки');
      return;
    }
    
    if (!newWebhookUrl.trim()) {
      toast.error('Введите URL для webhook');
      return;
    }
    
    try {
      const webhookData = {
        userId: currentUser.uid,
        name: newWebhookName.trim(),
        url: newWebhookUrl.trim(),
        events: newWebhookEvents,
        isActive: true,
        createdAt: new Date(),
        deliveryCount: 0,
        lastDelivery: null,
        secret: Math.random().toString(36).substring(2, 15)
      };
      
      await addDoc(collection(db, 'webhooks'), webhookData);
      
      setNewWebhookName('');
      setNewWebhookUrl('');
      setNewWebhookEvents(['fixation_created']);
      setShowWebhookDialog(false);
      
      toast.success('Webhook подписка успешно создана');
    } catch (error) {
      console.error('Ошибка при создании webhook подписки:', error);
      toast.error('Ошибка при создании webhook подписки');
    }
  };

  // Копируем API ключ в буфер обмена
  const copyApiKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('API ключ скопирован в буфер обмена');
    } catch (error) {
      console.error('Ошибка при копировании:', error);
      toast.error('Ошибка при копировании API ключа');
    }
  };

  // Переключаем видимость API ключа
  const toggleApiKeyVisibility = (keyId) => {
    setShowApiKeyVisibility(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  // Удаляем API ключ
  const deleteApiKey = async (keyId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот API ключ? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'apiKeys', keyId));
      toast.success('API ключ удален');
    } catch (error) {
      console.error('Ошибка при удалении API ключа:', error);
      toast.error('Ошибка при удалении API ключа');
    }
  };

  // Удаляем webhook подписку
  const deleteWebhook = async (webhookId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту webhook подписку? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'webhooks', webhookId));
      toast.success('Webhook подписка удалена');
    } catch (error) {
      console.error('Ошибка при удалении webhook подписки:', error);
      toast.error('Ошибка при удалении webhook подписки');
    }
  };

  // Получаем лимит использования API
  const getUsageLimit = () => {
    const limits = {
      'admin': 10000,
      'agent': 1000,
      'застройщик': 1000,
      'default': 100
    };
    return limits[role] || limits.default;
  };

  // Загружаем CRM интеграции пользователя
  const loadCrmIntegrations = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoadingCrmIntegrations(true);
    try {
      const integrationsRef = collection(db, 'crmIntegrations');
      const q = query(integrationsRef, where('userId', '==', currentUser.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const integrations = [];
        snapshot.forEach((doc) => {
          integrations.push({ id: doc.id, ...doc.data() });
        });
        setCrmIntegrations(integrations);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Ошибка при загрузке CRM интеграций:', error);
      toast.error('Ошибка при загрузке CRM интеграций');
    } finally {
      setIsLoadingCrmIntegrations(false);
    }
  }, [currentUser]);

  // Загружаем API ключи, webhook подписки и CRM интеграции
  useEffect(() => {
    if (currentUser) {
      loadApiKeys();
      loadWebhooks();
      loadCrmIntegrations();
    }
  }, [currentUser, loadApiKeys, loadWebhooks, loadCrmIntegrations]);

  // Создаем новую CRM интеграцию
  const createCrmIntegration = async () => {
    if (!currentUser) return;

    if (!crmFormData.name.trim() || !crmFormData.domain.trim() || !crmFormData.accessToken.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsLoadingCrmIntegrations(true);
    try {
      // Создаем новую интеграцию
      const integrationData = {
        userId: currentUser.uid,
        ...crmFormData,
        createdAt: new Date(),
        lastSync: null,
        syncCount: 0,
        errorCount: 0,
        lastError: null
      };

      await addDoc(collection(db, 'crmIntegrations'), integrationData);
      toast.success('CRM интеграция успешно создана');
      
      setCrmFormData({
        name: '',
        crmType: 'amo',
        domain: '',
        accessToken: '',
        clientId: '',
        description: '',
        syncInterval: '1hour',
        enabled: true
      });
      setShowCrmIntegrationDialog(false);
    } catch (error) {
      console.error('Ошибка при создании CRM интеграции:', error);
      toast.error('Ошибка при создании CRM интеграции');
    } finally {
      setIsLoadingCrmIntegrations(false);
    }
  };

  // Обновляем существующую CRM интеграцию
  const updateCrmIntegration = async () => {
    if (!currentUser || !selectedCrmIntegration) return;

    if (!crmFormData.name.trim() || !crmFormData.domain.trim() || !crmFormData.accessToken.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsLoadingCrmIntegrations(true);
    try {
      // Обновляем существующую интеграцию
      const integrationRef = doc(db, 'crmIntegrations', selectedCrmIntegration.id);
      await updateDoc(integrationRef, {
        ...crmFormData,
        updatedAt: new Date()
      });
      
      setSelectedCrmIntegration(null);
      toast.success('CRM интеграция успешно обновлена');
      
      setCrmFormData({
        name: '',
        crmType: 'amo',
        domain: '',
        accessToken: '',
        clientId: '',
        description: '',
        syncInterval: '1hour',
        enabled: true
      });
      setShowCrmIntegrationDialog(false);
    } catch (error) {
      console.error('Ошибка при обновлении CRM интеграции:', error);
      toast.error('Ошибка при обновлении CRM интеграции');
    } finally {
      setIsLoadingCrmIntegrations(false);
    }
  };

  // Тестируем CRM интеграцию
  const testCrmIntegration = async (integration) => {
    setSelectedCrmIntegration(integration);
    setShowCrmTestDialog(true);
    setCrmTestResult(null);

    try {
      const testResult = await testCrmConnection(integration);
      setCrmTestResult(testResult);
    } catch (error) {
      setCrmTestResult({
        success: false,
        message: error.message
      });
    }
  };

  // Функция тестирования подключения к CRM
  const testCrmConnection = async (integration) => {
    const { crmType, domain, accessToken } = integration;
    
    if (crmType === 'amo') {
      try {
        const response = await fetch(`https://${domain}/api/v4/leads`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          return {
            success: true,
            message: 'Подключение к AMO CRM успешно'
          };
        } else {
          return {
            success: false,
            message: `Ошибка подключения к AMO CRM: ${response.status}`
          };
        }
      } catch (error) {
        return {
          success: false,
          message: `Ошибка сети: ${error.message}`
        };
      }
    }

    return {
      success: false,
      message: 'Неподдерживаемый тип CRM'
    };
  };

  // Удаляем CRM интеграцию
  const deleteCrmIntegration = async (integrationId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту CRM интеграцию?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'crmIntegrations', integrationId));
      toast.success('CRM интеграция удалена');
    } catch (error) {
      console.error('Ошибка при удалении CRM интеграции:', error);
      toast.error('Ошибка при удалении CRM интеграции');
    }
  };

  // Получаем статус CRM интеграции
  const getCrmStatusBadge = (integration) => {
    if (!integration.isActive) {
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Неактивна</Badge>;
    }
    
    if (integration.lastError) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Ошибка</Badge>;
    }
    
    if (integration.lastSync) {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Активна</Badge>;
    }
    
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>;
  };

  // Получаем название CRM
  const getCrmName = (crmType) => {
    const crmNames = {
      'amo': 'AMO CRM',
      'bitrix24': 'Bitrix24',
      'crm': 'Другая CRM'
    };
    return crmNames[crmType] || crmType;
  };

  // Загружаем все подписанные договора (только для админа)
  const loadAllContracts = async () => {
    setLoadingContracts(true);
    try {
      // Получаем всех пользователей с подписанными договорами
      const usersRef = collection(db, 'users');
      const contractQuery = query(usersRef, where('contractSigned', '==', true));
      const contractSnapshot = await getDocs(contractQuery);
      
      const contracts = [];
      
      for (const userDoc of contractSnapshot.docs) {
        const userData = userDoc.data();
        let developerName = 'Неизвестный застройщик';
        
        // Получаем название застройщика, если есть developerId
        if (userData.developerId) {
          try {
            const developerRef = doc(db, 'developers', userData.developerId);
            const developerDoc = await getDoc(developerRef);
            if (developerDoc.exists()) {
              developerName = developerDoc.data().name;
            }
          } catch (error) {
            console.error('Ошибка при загрузке застройщика:', error);
          }
        }
        
        contracts.push({
          userId: userDoc.id,
          userName: userData.name || userData.email || 'Пользователь без имени',
          userEmail: userData.email || 'Email не указан',
          role: userData.role || 'Роль не указана',
          contractSignDate: userData.contractSignDate,
          developerName,
          developerId: userData.developerId
        });
      }
      
      // Сортируем по дате подписания (новые сначала)
      contracts.sort((a, b) => {
        const dateA = a.contractSignDate?.toDate ? a.contractSignDate.toDate() : new Date(a.contractSignDate || 0);
        const dateB = b.contractSignDate?.toDate ? b.contractSignDate.toDate() : new Date(b.contractSignDate || 0);
        return dateB - dateA;
      });
      
      setAllContracts(contracts);
    } catch (error) {
      console.error('Ошибка при загрузке договоров:', error);
      toast.error('Ошибка при загрузке договоров');
    } finally {
      setLoadingContracts(false);
    }
  };

  // Открываем диалог профиля
  const openProfileDialog = () => {
    setNewUserName(userName);
    setNewPassword('');
    setConfirmPassword('');
    setShowProfileDialog(true);
  };

  // Обновляем профиль пользователя
  const updateUserProfile = async () => {
    if (!currentUser) return;

    // Валидация
    if (!newUserName.trim()) {
      toast.error('Введите имя пользователя');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      // Обновляем имя пользователя в Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: newUserName.trim(),
        displayName: newUserName.trim(),
        updatedAt: new Date()
      });

      // Обновляем displayName в Firebase Auth
      await updateProfile(currentUser, {
        displayName: newUserName.trim()
      });

      // Обновляем пароль, если указан
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
      }

      // Обновляем локальные состояния
      setUserName(newUserName.trim());
      setShowProfileDialog(false);
      
      toast.success('Профиль успешно обновлен');
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Для смены пароля необходимо войти в систему повторно');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Пароль слишком слабый');
      } else {
        toast.error('Ошибка при обновлении профиля');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Генерируем код верификации
  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Открываем диалог подключения
  const openConnectDialog = () => {
    const code = generateVerificationCode();
    setVerificationCode(code);
    setShowConnectDialog(true);
  };



  // Подключаем телеграм аккаунт автоматически
  const connectTelegramAutomatically = async () => {
    setIsLoading(true);
    try {
      // Сохраняем код верификации в профиле пользователя
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        telegramVerificationCode: verificationCode,
        telegramConnectingAt: new Date(),
        telegramConnected: false // Пока не подключено, ждем ответа от бота
      });

      // Создаем ссылку для автоматического подключения
      const telegramLink = `https://t.me/${BOT_USERNAME}?start=${verificationCode}`;
      
      // Определяем, является ли устройство мобильным
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Для мобильных устройств пробуем несколько методов
        try {
          // Сначала пробуем прямой переход
          window.location.href = telegramLink;
          
          // Если прямой переход не сработал через 1 секунду, показываем инструкции
          setTimeout(() => {
            // Проверяем, остались ли мы на той же странице
            if (document.visibilityState === 'visible') {
              // Создаем временную ссылку и кликаем по ней
              const tempLink = document.createElement('a');
              tempLink.href = telegramLink;
              tempLink.target = '_blank';
              tempLink.rel = 'noopener noreferrer';
              document.body.appendChild(tempLink);
              tempLink.click();
              document.body.removeChild(tempLink);
            }
          }, 1000);
        } catch (error) {
          console.error('Ошибка при переходе в Telegram:', error);
          // Fallback: показываем ссылку для копирования
          toast.error('Не удалось открыть Telegram. Скопируйте ссылку вручную.');
        }
      } else {
        // Для десктопных устройств используем window.open
      window.open(telegramLink, '_blank');
      }
      
      // Начинаем проверку статуса подключения
      checkConnectionStatus();
      
      toast.success('Перейдите в телеграм и нажмите "Start" для завершения подключения');
    } catch (error) {
      console.error('Ошибка при подключении телеграм:', error);
      toast.error('Ошибка при подключении телеграм');
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем статус подключения
  const checkConnectionStatus = () => {
    const checkInterval = setInterval(async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        if (userData.telegramConnected && userData.telegramChatId) {
          setTelegramChatId(userData.telegramChatId);
          setIsConnected(true);
          setShowConnectDialog(false);
          clearInterval(checkInterval);
          toast.success('Телеграм успешно подключен!');
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса:', error);
      }
    }, 2000); // Проверяем каждые 2 секунды

    // Останавливаем проверку через 60 секунд
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 60000);
  };

  // copyTelegramLink удален: ссылка больше не копируется из модалки

  // Отключаем телеграм аккаунт
  const disconnectTelegram = async () => {
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        telegramChatId: null,
        telegramConnected: null,
        telegramConnectedAt: null,
        telegramConnectingAt: null,
        telegramVerificationCode: null
      });

      setTelegramChatId('');
      setIsConnected(false);
      
      toast.success('Телеграм отключен');
    } catch (error) {
      console.error('Ошибка при отключении телеграм:', error);
      toast.error('Ошибка при отключении телеграм');
    } finally {
      setIsLoading(false);
    }
  };

  // Подписываем договор
  const signContract = async () => {
    setIsLoading(true);
    try {
      const signDate = new Date();
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        contractSigned: true,
        contractSignDate: signDate
      });

      setContractSigned(true);
      setContractSignDate(signDate);
      setShowContractDialog(false);
      
      toast.success('Договор успешно подписан');
    } catch (error) {
      console.error('Ошибка при подписании договора:', error);
      toast.error('Ошибка при подписании договора');
    } finally {
      setIsLoading(false);
    }
  };

  // Получаем текст договора с подстановкой названия застройщика
  const getContractText = (userContract = null) => {
    let contractText = t.contract.contractText;
    
    // Для админа, просматривающего договор пользователя
    if (userContract) {
      // Заменяем локализованное слово "Застройщик"/"Developer"/"Pengembang" на реальное название
      const developerPlaceholder = language === 'en' ? 'Developer' : language === 'id' ? 'Pengembang' : 'Застройщик';
      contractText = contractText.replace(new RegExp(developerPlaceholder, 'g'), userContract.developerName);
      
      // Заменяем подчеркивания на названия сторон (договор всегда подписан для просмотра)
      let signatureCount = 0;
      contractText = contractText.replace(/_________________/g, () => {
        signatureCount++;
        if (signatureCount === 1) {
          const padding = Math.max(0, Math.floor((17 - 'IT Agent'.length) / 2));
          return '  ' + ' '.repeat(padding) + 'IT Agent' + ' '.repeat(17 - padding - 'IT Agent'.length);
        } else if (signatureCount === 2) {
          // Располагаем название застройщика так же далеко справа, как верхнее значение
          const spacing = '                  '; // Убрали 1 пробел
          return spacing + userContract.developerName;
        }
        return '_________________';
      });
      
      // Центрируем строки с переведенным словом "(подпись)"
      const signatureWord = t.contract.signature;
      const escapedSignature = signatureWord.replace(/[()]/g, '\\$&');
      contractText = contractText.replace(
        new RegExp(`${escapedSignature}\\s+${escapedSignature}`, 'g'),
        `  ${signatureWord}                              ${signatureWord}`
      );
      
      return contractText;
    }
    
    // Обычная логика для текущего пользователя
    // Заменяем локализованное слово "Застройщик"/"Developer"/"Pengembang" на реальное название
    if (['застройщик', 'премиум застройщик'].includes(role) && developerName) {
      const developerPlaceholder = language === 'en' ? 'Developer' : language === 'id' ? 'Pengembang' : 'Застройщик';
      contractText = contractText.replace(new RegExp(developerPlaceholder, 'g'), developerName);
    }
    
          // Если договор подписан, заменяем подписи на названия сторон
      if (contractSigned) {
        const developerNameForSignature = (['застройщик', 'премиум застройщик'].includes(role) && developerName) ? 
          developerName : 
          (language === 'en' ? 'Developer' : language === 'id' ? 'Pengembang' : 'Застройщик');
      
      // Заменяем подчеркивания на отцентрованные названия сторон
      let signatureCount = 0;
      contractText = contractText.replace(/_________________/g, () => {
        signatureCount++;
        if (signatureCount === 1) {
          // Центрируем "IT Agent" под "ИСПОЛНИТЕЛЬ" (добавляем отступы)
          const padding = Math.max(0, Math.floor((17 - 'IT Agent'.length) / 2));
          return '  ' + ' '.repeat(padding) + 'IT Agent' + ' '.repeat(17 - padding - 'IT Agent'.length);
        } else if (signatureCount === 2) {
          // Располагаем название застройщика так же далеко справа, как верхнее значение
          const spacing = '                  '; // Убрали 1 пробел
          return spacing + developerNameForSignature;
        }
        return '_________________'; // На случай если есть еще подчеркивания
      });
      
      // Центрируем строки с переведенным словом "(подпись)"
      const signatureWord = t.contract.signature;
      const escapedSignature = signatureWord.replace(/[()]/g, '\\$&');
      contractText = contractText.replace(
        new RegExp(`${escapedSignature}\\s+${escapedSignature}`, 'g'),
        `  ${signatureWord}                              ${signatureWord}`
      );
    }
    
    return contractText;
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">
          {t.profile.description}
        </p>
      </div>

      {/* Профиль пользователя */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{t.profile.title}</h3>
            <p className="text-muted-foreground mb-4">
              {t.profile.description}
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t.profile.name}:</span>
                <span className="text-sm text-muted-foreground">
                  {userName || t.profile.notSpecified}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t.profile.email}:</span>
                <span className="text-sm text-muted-foreground">
                  {userEmail || t.profile.notSpecifiedEmail}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t.profile.role}:</span>
                <Badge variant="secondary" className="text-xs">
                  {role || t.profile.roleNotDefined}
                </Badge>
              </div>
            </div>
            
            <Button onClick={openProfileDialog}>
              <User className="h-4 w-4 mr-2" />
              {t.profile.updateProfile}
            </Button>
          </div>
        </div>
      </Card>

      {/* Подключение телеграм бота */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{t.telegram.title}</h3>
            <p className="text-muted-foreground mb-4">
              {t.telegram.description}
            </p>

            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    {t.telegram.connected}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {t.telegram.chatId}: {telegramChatId}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={disconnectTelegram}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t.telegram.disconnect}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    <X className="h-3 w-3 mr-1" />
                    {t.telegram.notConnected}
                  </Badge>
                </div>
                
                <Button onClick={openConnectDialog}>
                  <Bot className="h-4 w-4 mr-2" />
                  {t.telegram.connect}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Все подписанные договора (только для админа и модератора) */}
      {(role === 'admin' || role === 'moderator') && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{t.contract.allContracts}</h3>
                  <p className="text-muted-foreground">
                    {t.contract.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAllContractsExpanded(!isAllContractsExpanded)}
                  className="p-2"
                >
                  {isAllContractsExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {isAllContractsExpanded && (
                <>
                  {loadingContracts ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                      <span className="ml-2 text-muted-foreground">{t.contract.loading}</span>
                    </div>
                  ) : allContracts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t.profile.noSignedContracts}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allContracts.map((contract) => (
                        <div key={contract.userId} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium">{contract.userName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {contract.role}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>📧 {contract.userEmail}</div>
                                <div>🏢 {contract.developerName}</div>
                                <div>📅 {t.contract.signDate}: {contract.contractSignDate?.toDate ? 
                                  contract.contractSignDate.toDate().toLocaleDateString('ru-RU') : 
                                  new Date(contract.contractSignDate || 0).toLocaleDateString('ru-RU')
                                }</div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedContractUser(contract)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {t.contract.viewContract}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Агентский договор */}
      {['застройщик', 'премиум застройщик'].includes(role) && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{t.contract.title}</h3>
              <p className="text-muted-foreground mb-4">
                {t.contract.description}
              </p>

              {contractSigned ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      {t.contract.signed}
                    </Badge>
                                         <span className="text-sm text-muted-foreground">
                       {contractSignDate && `${t.contract.signDate}: ${contractSignDate.toDate ? contractSignDate.toDate().toLocaleDateString('ru-RU') : new Date(contractSignDate).toLocaleDateString('ru-RU')}`}
                     </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowContractDialog(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {t.contract.viewContract}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      <X className="h-3 w-3 mr-1" />
                      {t.contract.notSigned}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => setShowContractDialog(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      {t.contract.signContract}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Интеграции с внешними CRM системами */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
            <SettingsIcon className="h-6 w-6 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-2">Интеграции с внешними CRM системами</h3>
                <p className="text-muted-foreground text-sm">
                  Настройте API ключи и webhook подписки для интеграции с внешними системами
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCrmIntegrationsExpanded(!isCrmIntegrationsExpanded)}
                className="p-2 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start"
              >
                <span className="sm:hidden mr-2">
                  {isCrmIntegrationsExpanded ? 'Свернуть' : 'Развернуть'}
                </span>
                {isCrmIntegrationsExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
            </div>

            {isCrmIntegrationsExpanded && (
              <>
                {/* Информационная карточка */}
                <Card className="bg-blue-50 border-blue-200 mb-6">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-blue-900 mb-2">Информация об API</h4>
                        <div className="space-y-1 text-sm text-blue-800">
                          <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>• Базовый URL:</span>
                            <code className="bg-blue-100 px-2 py-1 rounded text-xs break-all">
                              https://us-central1-bali-estate-1130f.cloudfunctions.net/api/v1
                            </code>
                          </p>
                          <p>• Лимит запросов: <strong>{getUsageLimit().toLocaleString()}</strong> запросов в месяц</p>
                          <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>• Аутентификация: используйте заголовок</span>
                            <code className="bg-blue-100 px-2 py-1 rounded text-xs">X-API-Key</code>
                          </p>
                          <p>• Документация: <a href="/api-docs.html" className="underline hover:text-blue-700">открыть документацию</a></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* API Ключи */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h4 className="text-lg font-medium">API Ключи</h4>
                    <Button onClick={() => setShowApiKeyDialog(true)} size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Создать API ключ
                    </Button>
                  </div>

                  {isLoadingApiKeys ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                      <span className="ml-2 text-muted-foreground">Загрузка API ключей...</span>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                      <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Нет API ключей</h3>
                      <p className="mb-4">Создайте свой первый API ключ для интеграции с внешними системами</p>
                      <Button onClick={() => setShowApiKeyDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать API ключ
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {apiKeys.map(key => (
                        <div key={key.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                <h5 className="font-semibold truncate">{key.name}</h5>
                                <Badge variant={key.isActive ? "default" : "secondary"}>
                                  {key.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Активен
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Неактивен
                                    </>
                                  )}
                                </Badge>
                              </div>
                              
                              {key.description && (
                                <p className="text-muted-foreground mb-2 text-sm">{key.description}</p>
                              )}
                              
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <Key className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-mono break-all">
                                  {showApiKeyVisibility[key.id] 
                                    ? key.key 
                                    : `${key.key.substring(0, 20)}...`
                                  }
                                </span>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleApiKeyVisibility(key.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {showApiKeyVisibility[key.id] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyApiKey(key.key)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                Создан: {key.createdAt?.toDate ? key.createdAt.toDate().toLocaleDateString('ru-RU') : 'Неизвестно'}
                                {key.lastUsed && ` • Последнее использование: ${key.lastUsed.toDate ? key.lastUsed.toDate().toLocaleDateString('ru-RU') : 'Неизвестно'}`}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteApiKey(key.id)}
                              className="text-red-600 hover:text-red-700 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Webhook Подписки */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h4 className="text-lg font-medium">Webhook Подписки</h4>
                    <Button onClick={() => setShowWebhookDialog(true)} size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Создать Webhook
                    </Button>
                  </div>

                  {isLoadingWebhooks ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                      <span className="ml-2 text-muted-foreground">Загрузка webhook подписок...</span>
                    </div>
                  ) : webhooks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                      <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Нет webhook подписок</h3>
                      <p className="mb-4">Создайте webhook подписку для получения уведомлений о событиях</p>
                      <Button onClick={() => setShowWebhookDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать Webhook
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {webhooks.map(webhook => (
                        <div key={webhook.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                <h5 className="font-semibold truncate">{webhook.name}</h5>
                                <Badge variant={webhook.isActive ? "default" : "secondary"}>
                                  {webhook.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Активен
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Неактивен
                                    </>
                                  )}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-2">
                                <div className="font-mono break-all text-xs bg-gray-100 p-2 rounded border">
                                  {webhook.url}
                                </div>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                Создан: {webhook.createdAt?.toDate ? webhook.createdAt.toDate().toLocaleDateString('ru-RU') : 'Неизвестно'}
                                {webhook.lastDelivery && ` • Последняя доставка: ${webhook.lastDelivery.toDate ? webhook.lastDelivery.toDate().toLocaleDateString('ru-RU') : 'Неизвестно'}`}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWebhook(webhook.id)}
                              className="text-red-600 hover:text-red-700 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CRM Интеграции */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h4 className="text-lg font-medium">CRM Интеграции</h4>
                    <Button onClick={() => {
                      setCrmFormData({
                        name: '',
                        crmType: 'amo',
                        domain: '',
                        accessToken: '',
                        clientId: '',
                        description: '',
                        syncInterval: '1hour',
                        enabled: true
                      });
                      setSelectedCrmIntegration(null);
                      setShowCrmIntegrationDialog(true);
                    }} size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить CRM
                    </Button>
                  </div>

                  {isLoadingCrmIntegrations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                      <span className="ml-2 text-muted-foreground">Загрузка CRM интеграций...</span>
                    </div>
                  ) : crmIntegrations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                      <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Нет CRM интеграций</h3>
                      <p className="mb-4">Создайте интеграцию с CRM для автоматической синхронизации фиксаций</p>
                      <Button onClick={() => {
                        setCrmFormData({
                          name: '',
                          crmType: 'amo',
                          domain: '',
                          accessToken: '',
                          clientId: '',
                          description: '',
                          syncInterval: '1hour',
                          enabled: true
                        });
                        setSelectedCrmIntegration(null);
                        setShowCrmIntegrationDialog(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить CRM
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {crmIntegrations.map(integration => (
                        <div key={integration.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                                <h5 className="font-semibold text-lg truncate">{integration.name}</h5>
                                {getCrmStatusBadge(integration)}
                              </div>
                              
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                  <span>CRM:</span> 
                                  <strong className="text-gray-900">{getCrmName(integration.crmType)}</strong>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                  <span>Домен:</span> 
                                  <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">{integration.domain}</code>
                                </div>
                                {integration.lastSync && (
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                    <span>Последняя синхронизация:</span>
                                    <span className="text-gray-900 text-xs">
                                      {integration.lastSync.toDate ? 
                                        integration.lastSync.toDate().toLocaleString('ru-RU') : 
                                        new Date(integration.lastSync).toLocaleString('ru-RU')
                                      }
                                    </span>
                                  </div>
                                )}
                                {integration.syncCount > 0 && (
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                    <span>Всего синхронизировано:</span> 
                                    <strong className="text-gray-900">{integration.syncCount}</strong> записей
                                  </div>
                                )}
                                {integration.lastError && (
                                  <div className="text-red-600 text-xs break-words bg-red-50 p-2 rounded border border-red-200">
                                    <strong>Последняя ошибка:</strong> {integration.lastError}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testCrmIntegration(integration)}
                                disabled={isLoadingCrmIntegrations}
                                className="flex-1 sm:flex-none min-h-[40px]"
                              >
                                <TestTube className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Тестировать</span>
                                <span className="sm:hidden">Тест</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCrmIntegration(integration);
                                  setCrmFormData({
                                    name: integration.name || '',
                                    crmType: integration.crmType || 'amo',
                                    domain: integration.domain || '',
                                    accessToken: integration.accessToken || '',
                                    clientId: integration.clientId || '',
                                    description: integration.description || '',
                                    syncInterval: integration.syncInterval || '1hour',
                                    enabled: integration.enabled !== false
                                  });
                                  setShowCrmIntegrationDialog(true);
                                }}
                                className="flex-1 sm:flex-none min-h-[40px]"
                              >
                                <SettingsIcon className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Настроить</span>
                                <span className="sm:hidden">Настр.</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteCrmIntegration(integration.id)}
                                disabled={isLoadingCrmIntegrations}
                                className="flex-1 sm:flex-none min-h-[40px] hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Удалить</span>
                                <span className="sm:hidden">Удал.</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Диалог подключения телеграм */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.telegram.dialogTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <Bot className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">@{BOT_USERNAME}</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {t.telegram.autoConnectInstructions}
              </p>
              
              <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                <p className="text-sm font-medium text-yellow-800">
                  🔑 {t.telegram.codeLabel} <code className="bg-yellow-200 px-2 py-1 rounded">{verificationCode}</code>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {t.telegram.codeInstructions}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button 
              onClick={connectTelegramAutomatically} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {t.telegram.waitingConnection}
                </div>
              ) : (
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t.telegram.connectViaTelegram}
                </div>
              )}
            </Button>
            
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра договора */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>{t.contract.title}</DialogTitle>
            <DialogDescription>
              {contractSigned ? 'Просмотр подписанного договора' : 'Ознакомьтесь с договором и подпишите его'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="border rounded-lg flex-1 overflow-hidden bg-white shadow-inner">
              <div className="h-full overflow-y-auto p-6">
                <div className="whitespace-pre-wrap text-base leading-7 font-serif text-gray-900">
                  {getContractText()}
                </div>
              </div>
            </div>
            
            {!contractSigned && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      {t.contract.warningTitle}
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t.contract.warningText}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 flex gap-2 pt-4 border-t">
            {!contractSigned && (
              <Button 
                onClick={signContract} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {t.contract.signing}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    {t.contract.signContract}
                  </div>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>
              {common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра договора конкретного пользователя (для админа) */}
      <Dialog open={!!selectedContractUser} onOpenChange={() => setSelectedContractUser(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {t.contract.userContractTitle} {selectedContractUser?.userName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Информация о пользователе */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t.profile.user}:</span> {selectedContractUser?.userName}
                </div>
                <div>
                  <span className="font-medium">{t.profile.email}:</span> {selectedContractUser?.userEmail}
                </div>
                <div>
                  <span className="font-medium">{t.profile.role}:</span> {selectedContractUser?.role}
                </div>
                <div>
                  <span className="font-medium">{t.profile.signDate}:</span> {
                    selectedContractUser?.contractSignDate?.toDate ? 
                      selectedContractUser.contractSignDate.toDate().toLocaleDateString('ru-RU') : 
                      new Date(selectedContractUser?.contractSignDate || 0).toLocaleDateString('ru-RU')
                  }
                </div>
                <div className="col-span-2">
                  <span className="font-medium">{t.profile.developer}:</span> {selectedContractUser?.developerName}
                </div>
              </div>
            </div>
            
            {/* Текст договора */}
            <div className="border rounded-lg p-6 max-h-96 overflow-y-auto bg-white shadow-inner">
              <div className="whitespace-pre-wrap text-base leading-7 font-serif text-gray-900">
                {selectedContractUser && getContractText(selectedContractUser)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedContractUser(null)}>
              {common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования профиля */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.profile.editProfileTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">{t.profile.userName}</Label>
              <Input
                id="userName"
                type="text"
                placeholder={t.profile.userNamePlaceholder}
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                {t.profile.emailCannotBeChanged}
              </p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">{t.profile.changePassword}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t.profile.changePasswordDescription}
              </p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t.profile.newPassword}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t.profile.newPasswordPlaceholder}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.profile.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t.profile.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              onClick={updateUserProfile} 
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {t.profile.saving}
                </div>
              ) : (
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  {common.save}
                </div>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              {common.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания API ключа */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать новый API ключ</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKeyName">Название *</Label>
              <Input
                id="apiKeyName"
                type="text"
                placeholder="Например: CRM Integration"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKeyDescription">Описание</Label>
              <Textarea
                id="apiKeyDescription"
                placeholder="Описание для чего используется этот ключ"
                value={newApiKeyDescription}
                onChange={(e) => setNewApiKeyDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Разрешения</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newApiKeyPermissions.includes('fixations')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewApiKeyPermissions([...newApiKeyPermissions, 'fixations']);
                      } else {
                        setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== 'fixations'));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Фиксации клиентов</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newApiKeyPermissions.includes('properties')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewApiKeyPermissions([...newApiKeyPermissions, 'properties']);
                      } else {
                        setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== 'properties'));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Недвижимость</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newApiKeyPermissions.includes('complexes')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewApiKeyPermissions([...newApiKeyPermissions, 'complexes']);
                      } else {
                        setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== 'complexes'));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Жилые комплексы</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={generateApiKey}>
              <Key className="h-4 w-4 mr-2" />
              Создать API ключ
            </Button>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания Webhook подписки */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать новую Webhook подписку</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookName">Название *</Label>
              <Input
                id="webhookName"
                type="text"
                placeholder="Например: CRM Notifications"
                value={newWebhookName}
                onChange={(e) => setNewWebhookName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL *</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://your-crm.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>События</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newWebhookEvents.includes('fixation_created')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewWebhookEvents([...newWebhookEvents, 'fixation_created']);
                      } else {
                        setNewWebhookEvents(newWebhookEvents.filter(e => e !== 'fixation_created'));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Создание фиксации</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newWebhookEvents.includes('fixation_updated')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewWebhookEvents([...newWebhookEvents, 'fixation_updated']);
                      } else {
                        setNewWebhookEvents(newWebhookEvents.filter(e => e !== 'fixation_updated'));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Обновление фиксации</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={createWebhook}>
              <Webhook className="h-4 w-4 mr-2" />
              Создать Webhook
            </Button>
            <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания/редактирования CRM интеграции */}
      <Dialog open={showCrmIntegrationDialog} onOpenChange={setShowCrmIntegrationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCrmIntegration ? 'Редактировать CRM интеграцию' : 'Создать новую CRM интеграцию'}
            </DialogTitle>
            <DialogDescription>
              Настройте подключение к внешней CRM системе
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crmName">Название интеграции *</Label>
                <Input
                  id="crmName"
                  value={crmFormData.name}
                  onChange={(e) => setCrmFormData({...crmFormData, name: e.target.value})}
                  placeholder="Например: Основная CRM"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Тип CRM *</Label>
                <Select 
                  value={crmFormData.crmType} 
                  onValueChange={(value) => setCrmFormData({...crmFormData, crmType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amo">AMO CRM</SelectItem>
                    <SelectItem value="bitrix24">Bitrix24</SelectItem>
                    <SelectItem value="crm">Другая CRM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crmDomain">Домен CRM *</Label>
                <Input
                  id="crmDomain"
                  value={crmFormData.domain}
                  onChange={(e) => setCrmFormData({...crmFormData, domain: e.target.value})}
                  placeholder="your-domain.amocrm.ru"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="crmClientId">Client ID</Label>
                <Input
                  id="crmClientId"
                  value={crmFormData.clientId}
                  onChange={(e) => setCrmFormData({...crmFormData, clientId: e.target.value})}
                  placeholder="Опционально"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crmAccessToken">Access Token *</Label>
              <div className="relative">
                <Input
                  id="crmAccessToken"
                  type={showCrmToken ? 'text' : 'password'}
                  value={crmFormData.accessToken}
                  onChange={(e) => setCrmFormData({...crmFormData, accessToken: e.target.value})}
                  placeholder="Введите access token"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCrmToken(!showCrmToken)}
                >
                  {showCrmToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crmDescription">Описание</Label>
              <Textarea
                id="crmDescription"
                value={crmFormData.description}
                onChange={(e) => setCrmFormData({...crmFormData, description: e.target.value})}
                placeholder="Краткое описание интеграции"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Периодичность синхронизации</Label>
                <Select 
                  value={crmFormData.syncInterval} 
                  onValueChange={(value) => setCrmFormData({...crmFormData, syncInterval: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">Каждые 5 минут</SelectItem>
                    <SelectItem value="15min">Каждые 15 минут</SelectItem>
                    <SelectItem value="30min">Каждые 30 минут</SelectItem>
                    <SelectItem value="1hour">Каждый час</SelectItem>
                    <SelectItem value="manual">Вручную</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="crmEnabled"
                  checked={crmFormData.enabled}
                  onChange={(e) => setCrmFormData({...crmFormData, enabled: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="crmEnabled" className="text-sm">
                  Включить интеграцию
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            {selectedCrmIntegration && (
              <Button 
                variant="outline" 
                onClick={() => testCrmIntegration(selectedCrmIntegration)}
                disabled={isLoadingCrmIntegrations}
                className="w-full sm:w-auto"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Тестировать
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setShowCrmIntegrationDialog(false)}
                className="flex-1 sm:flex-none"
              >
                Отмена
              </Button>
              <Button 
                onClick={selectedCrmIntegration ? updateCrmIntegration : createCrmIntegration}
                disabled={isLoadingCrmIntegrations}
                className="flex-1 sm:flex-none"
              >
                {isLoadingCrmIntegrations ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {selectedCrmIntegration ? 'Обновление...' : 'Создание...'}
                  </div>
                ) : (
                  selectedCrmIntegration ? 'Обновить' : 'Создать'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог тестирования CRM интеграции */}
      <Dialog open={showCrmTestDialog} onOpenChange={setShowCrmTestDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>Тестирование CRM интеграции</DialogTitle>
            <DialogDescription>
              Проверяем подключение к внешней CRM системе
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCrmIntegration && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 text-lg">{selectedCrmIntegration.name}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span>CRM:</span>
                    <strong className="text-gray-900">{getCrmName(selectedCrmIntegration.crmType)}</strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span>Домен:</span>
                    <code className="bg-white px-2 py-1 rounded text-xs break-all border">{selectedCrmIntegration.domain}</code>
                  </div>
                </div>
              </div>
            )}
            
            {crmTestResult && (
              <div className={`p-4 rounded-lg border ${
                crmTestResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {crmTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium mb-1 ${crmTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {crmTestResult.success ? 'Подключение успешно!' : 'Ошибка подключения'}
                    </div>
                    <p className={`text-sm break-words ${crmTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {crmTestResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isLoadingCrmIntegrations && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-600 border-t-transparent"></div>
                <span className="ml-3 text-muted-foreground">Тестирование подключения...</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCrmTestDialog(false)}
              className="flex-1 sm:flex-none"
            >
              Закрыть
            </Button>
            {selectedCrmIntegration && !isLoadingCrmIntegrations && (
              <Button 
                onClick={() => testCrmIntegration(selectedCrmIntegration)}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Повторить тест
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings; 