import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import toast from 'react-hot-toast';
import { Bot, Check, X, ExternalLink, FileText } from 'lucide-react';

const Settings = () => {
  const { currentUser, role } = useAuth();
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
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
  const BOT_LINK = `https://t.me/${BOT_USERNAME}`;
  
  // Текст агентского договора
  const CONTRACT_TEXT = `
ДОГОВОР ЦЕССИИ
об оказании информационно-технических услуг

"IT Agent", именуемое в дальнейшем "Исполнитель", с одной стороны, и Застройщик, именуемый в дальнейшем "Заказчик", с другой стороны, заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Исполнитель обязуется предоставить Заказчику IT-платформу для размещения информации об объектах недвижимости и организации взаимодействия с агентами по недвижимости.

1.2. Заказчик обязуется оплачивать услуги Исполнителя в размере и порядке, установленном настоящим Договором.

2. ПРАВА И ОБЯЗАННОСТИ СТОРОН

2.1. Исполнитель обязуется:
2.1.1. Предоставить доступ к IT-платформе для размещения объектов недвижимости;
2.1.2. Обеспечивать техническое функционирование платформы;
2.1.3. Организовывать получение и обработку заявок от агентов;
2.1.4. Предоставлять инструменты для взаимодействия с агентами по недвижимости.

2.2. Заказчик обязуется:
2.2.1. Своевременно предоставлять актуальную и достоверную информацию об объектах недвижимости;
2.2.2. Поддерживать информацию об объектах в актуальном состоянии;
2.2.3. Своевременно производить оплату услуг согласно условиям настоящего Договора;
2.2.4. Уведомлять Исполнителя о продаже объектов недвижимости через платформу.

3. ПОРЯДОК РАСЧЕТОВ

3.1. Стоимость услуг Исполнителя составляет 0,5% (ноль целых пять десятых процента) от стоимости каждого объекта недвижимости, проданного через IT-платформу.

3.2. Указанная в п. 3.1 комиссия выплачивается Заказчиком сверх стандартной комиссии агентам по недвижимости (5%).

3.3. Оплата производится в течение 10 (десяти) банковских дней с момента заключения договора купли-продажи недвижимости между Заказчиком и покупателем, привлеченным через IT-платформу.

3.4. Основанием для оплаты служит подписанный договор купли-продажи и уведомление Заказчика о совершенной сделке.

4. ОТВЕТСТВЕННОСТЬ СТОРОН

4.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему Договору стороны несут ответственность в соответствии с действующим законодательством.

4.2. При просрочке платежа Заказчик выплачивает пеню в размере 0,1% от суммы просроченного платежа за каждый день просрочки.

5. СРОК ДЕЙСТВИЯ ДОГОВОРА

5.1. Настоящий Договор вступает в силу с момента его подписания и действует в течение одного года.

5.2. Договор автоматически продлевается на тот же срок, если ни одна из сторон не уведомит другую о расторжении за 30 дней до истечения срока действия.

6. ПОРЯДОК РАЗРЕШЕНИЯ СПОРОВ

6.1. Все споры и разногласия разрешаются путем переговоров.

6.2. При невозможности достижения соглашения споры разрешаются в судебном порядке по месту нахождения Исполнителя.

7. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ

7.1. Настоящий Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.

7.2. Изменения и дополнения к Договору действительны только при оформлении в письменной форме и подписании обеими сторонами.

8. ПОДПИСИ СТОРОН

ИСПОЛНИТЕЛЬ:                                    ЗАКАЗЧИК:
IT Agent                                        Застройщик


     _________________                               _________________
        (подпись)                                       (подпись)
  `;
  
  useEffect(() => {
    loadUserSettings();
    
    // Загружаем все договора для админа
    if (role === 'admin') {
      loadAllContracts();
    }
  }, [currentUser, role]);

  // Загружаем настройки пользователя
  const loadUserSettings = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
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
      }
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      toast.error('Ошибка при загрузке настроек');
    }
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
      
      // Открываем ссылку в новом окне
      window.open(telegramLink, '_blank');
      
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
    let contractText = CONTRACT_TEXT;
    
    // Для админа, просматривающего договор пользователя
    if (userContract) {
      contractText = contractText.replace(/Застройщик/g, userContract.developerName);
      
      // Заменяем подчеркивания на названия сторон (договор всегда подписан для просмотра)
      let signatureCount = 0;
      contractText = contractText.replace(/_________________/g, () => {
        signatureCount++;
        if (signatureCount === 1) {
          const padding = Math.max(0, Math.floor((17 - 'IT Agent'.length) / 2));
          return ' '.repeat(padding) + 'IT Agent' + ' '.repeat(17 - padding - 'IT Agent'.length);
        } else if (signatureCount === 2) {
          const padding = Math.max(0, Math.floor((17 - userContract.developerName.length) / 2));
          return ' '.repeat(padding) + userContract.developerName + ' '.repeat(17 - padding - userContract.developerName.length);
        }
        return '_________________';
      });
      
      // Центрируем строки с "(подпись)"
      contractText = contractText.replace(
        /          \(подпись\)                                       \(подпись\)/g,
        '        (подпись)                                       (подпись)'
      );
      
      return contractText;
    }
    
    // Обычная логика для текущего пользователя
    // Заменяем "Застройщик" на реальное название
    if (role === 'застройщик' && developerName) {
      contractText = contractText.replace(/Застройщик/g, developerName);
    }
    
    // Если договор подписан, заменяем подписи на названия сторон
    if (contractSigned) {
      const developerNameForSignature = (role === 'застройщик' && developerName) ? developerName : 'Застройщик';
      
      // Заменяем подчеркивания на отцентрованные названия сторон
      let signatureCount = 0;
      contractText = contractText.replace(/_________________/g, () => {
        signatureCount++;
        if (signatureCount === 1) {
          // Центрируем "IT Agent" под "ИСПОЛНИТЕЛЬ" (добавляем отступы)
          const padding = Math.max(0, Math.floor((17 - 'IT Agent'.length) / 2));
          return ' '.repeat(padding) + 'IT Agent' + ' '.repeat(17 - padding - 'IT Agent'.length);
        } else if (signatureCount === 2) {
          // Центрируем название застройщика под "ЗАКАЗЧИК"
          const padding = Math.max(0, Math.floor((17 - developerNameForSignature.length) / 2));
          return ' '.repeat(padding) + developerNameForSignature + ' '.repeat(17 - padding - developerNameForSignature.length);
        }
        return '_________________'; // На случай если есть еще подчеркивания
      });
      
      // Центрируем строки с "(подпись)" под подписями
      contractText = contractText.replace(
        /          \(подпись\)                                       \(подпись\)/g,
        '        (подпись)                                       (подпись)'
      );
    }
    
    return contractText;
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">
          Управляйте настройками вашего аккаунта и уведомлениями
        </p>
      </div>

      {/* Подключение телеграм бота */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Подключить телеграм бота</h3>
            <p className="text-muted-foreground mb-4">
              Подключите телеграм бота, чтобы получать уведомления о новых фиксациях клиентов.
            </p>

            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Подключено
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Chat ID: {telegramChatId}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={disconnectTelegram}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Отключить телеграм
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    <X className="h-3 w-3 mr-1" />
                    Не подключено
                  </Badge>
                </div>
                
                <Button onClick={openConnectDialog}>
                  <Bot className="h-4 w-4 mr-2" />
                  Подключить телеграм
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
              <h3 className="text-lg font-semibold mb-2">Подписанные договора</h3>
              <p className="text-muted-foreground mb-4">
                Список всех пользователей, подписавших агентские договора.
              </p>

              {loadingContracts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                  <span className="ml-2 text-muted-foreground">Загрузка договоров...</span>
                </div>
              ) : allContracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Пока нет подписанных договоров
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
                            <div>📅 Подписан: {contract.contractSignDate?.toDate ? 
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
                          Просмотреть
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
              <h3 className="text-lg font-semibold mb-2">Агентский договор</h3>
              <p className="text-muted-foreground mb-4">
                Договор цессии об оказании информационно-технических услуг между застройщиком и IT-платформой.
              </p>

              {contractSigned ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Подписан
                    </Badge>
                                         <span className="text-sm text-muted-foreground">
                       {contractSignDate && `Дата: ${contractSignDate.toDate ? contractSignDate.toDate().toLocaleDateString('ru-RU') : new Date(contractSignDate).toLocaleDateString('ru-RU')}`}
                     </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowContractDialog(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Просмотреть договор
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      <X className="h-3 w-3 mr-1" />
                      Не подписан
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => setShowContractDialog(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Просмотреть и подписать
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
            <DialogTitle>Подключение телеграм бота</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <Bot className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">@{BOT_USERNAME}</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Нажмите кнопку ниже для автоматического подключения к боту. 
                Вы будете перенаправлены в Telegram, где нужно будет нажать "Start".
              </p>
              
              <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                <p className="text-sm font-medium text-yellow-800">
                  🔑 Код верификации: <code className="bg-yellow-200 px-2 py-1 rounded">{verificationCode}</code>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Этот код будет автоматически передан боту
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
                  Ожидание подключения...
                </div>
              ) : (
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Подключить через Telegram
                </div>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)} className="w-full">
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра договора */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Агентский договор</DialogTitle>
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
                      Внимание
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Внимательно прочитайте договор перед подписанием. После подписания договор станет юридически обязательным документом.
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
                     Подписание...
                   </div>
                 ) : (
                   <div className="flex items-center">
                     <Check className="h-4 w-4 mr-2" />
                     Подписать договор
                   </div>
                 )}
               </Button>
             )}
             <Button variant="outline" onClick={() => setShowContractDialog(false)}>
               Закрыть
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра договора конкретного пользователя (для админа) */}
      <Dialog open={!!selectedContractUser} onOpenChange={() => setSelectedContractUser(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Договор пользователя: {selectedContractUser?.userName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Информация о пользователе */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Пользователь:</span> {selectedContractUser?.userName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedContractUser?.userEmail}
                </div>
                <div>
                  <span className="font-medium">Роль:</span> {selectedContractUser?.role}
                </div>
                <div>
                  <span className="font-medium">Дата подписания:</span> {
                    selectedContractUser?.contractSignDate?.toDate ? 
                      selectedContractUser.contractSignDate.toDate().toLocaleDateString('ru-RU') : 
                      new Date(selectedContractUser?.contractSignDate || 0).toLocaleDateString('ru-RU')
                  }
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Застройщик:</span> {selectedContractUser?.developerName}
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
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings; 