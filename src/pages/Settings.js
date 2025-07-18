import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updatePassword, updateProfile } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import toast from 'react-hot-toast';
import { Bot, Check, X, ExternalLink, FileText, User } from 'lucide-react';

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
        if (role === 'застройщик' && userData.developerId) {
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
    
    // Загружаем все договора для админа
    if (role === 'admin') {
      loadAllContracts();
    }
  }, [currentUser, role, loadUserSettings]);

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

  // Копируем ссылку Telegram в буфер обмена
  const copyTelegramLink = async () => {
    const telegramLink = `https://t.me/${BOT_USERNAME}?start=${verificationCode}`;
    try {
      await navigator.clipboard.writeText(telegramLink);
      toast.success(t.linkCopied);
    } catch (error) {
      console.error('Ошибка при копировании:', error);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = telegramLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(t.linkCopied);
    }
  };

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
    if (role === 'застройщик' && developerName) {
      const developerPlaceholder = language === 'en' ? 'Developer' : language === 'id' ? 'Pengembang' : 'Застройщик';
      contractText = contractText.replace(new RegExp(developerPlaceholder, 'g'), developerName);
    }
    
    // Если договор подписан, заменяем подписи на названия сторон
    if (contractSigned) {
      const developerNameForSignature = (role === 'застройщик' && developerName) ? 
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

      {/* Все подписанные договора (только для админа) */}
      {role === 'admin' && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{t.contract.allContracts}</h3>
              <p className="text-muted-foreground mb-4">
                {t.contract.description}
              </p>

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
            </div>
          </div>
        </Card>
      )}

      {/* Агентский договор */}
      {role === 'застройщик' && (
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
            
            {/* Кнопка для копирования ссылки (особенно полезна для мобильных устройств) */}
            <Button 
              variant="outline" 
              onClick={copyTelegramLink}
              className="w-full"
            >
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t.copyLink}
              </div>
            </Button>
            
            <Button variant="outline" onClick={() => setShowConnectDialog(false)} className="w-full">
              {common.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра договора */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t.contract.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-6 max-h-96 overflow-y-auto bg-white shadow-inner">
              <div className="whitespace-pre-wrap text-base leading-7 font-serif text-gray-900">
                {getContractText()}
              </div>
            </div>
            
            {!contractSigned && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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

                     <DialogFooter className="flex gap-2">
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
    </div>
  );
};

export default Settings; 