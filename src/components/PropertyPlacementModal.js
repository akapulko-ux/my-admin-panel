import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { landingTranslations } from '../lib/landingTranslations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { X } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, setDoc, collection } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function PropertyPlacementModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [showSuccess, setShowSuccess] = useState(false); // новое состояние для окна успеха
  const [showError, setShowError] = useState(false); // состояние для показа ошибок
  const [errorMessage, setErrorMessage] = useState(''); // сообщение об ошибке
  const { login } = useAuth();
  const { language } = useLanguage();
  const t = landingTranslations[language];

  // login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regStatus, setRegStatus] = useState('agent');
  const [isRegLoading, setIsRegLoading] = useState(false);

  const statuses = [
    { value: 'agent', ru: 'Агент', en: 'Agent', id: 'Agen' },
    { value: 'agency', ru: 'Агентство', en: 'Agency', id: 'Agensi' },
    { value: 'developer', ru: 'Застройщик', en: 'Developer', id: 'Pengembang' },
  ];

  const statusLabel = (code) => {
    const item = statuses.find(s => s.value === code);
    if (!item) return code;
    return language === 'ru' ? item.ru : language === 'id' ? item.id : item.en;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await login(email, password);
      onClose();
      // Здесь можно добавить редирект на страницу размещения объекта
    } catch (err) {
      console.error(err);
      // уведомления уже обрабатываются внутри login через showError
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setIsRegLoading(true);
      
      // Создаем заявку на регистрацию
      const registrationRequest = {
        name: regName,
        phone: regPhone,
        email: regEmail,
        userStatus: regStatus, // статус пользователя (агент/агентство/застройщик)
        requestStatus: 'pending', // статус заявки
        createdAt: new Date(),
        language: language || 'ru'
      };
      
      // Сохраняем заявку в отдельную коллекцию для агентов
      const requestRef = doc(collection(db, 'agentRegistrationRequests'));
      await setDoc(requestRef, registrationRequest);
      
      // Показываем окно успешной подачи заявки
      setShowSuccess(true);
    } catch (err) {
      console.error('Registration request error', err);
      
      // Определяем понятное сообщение об ошибке
      let errorMsg = 'Ошибка при отправке заявки. Попробуйте еще раз.';
      
      if (err.code === 'permission-denied') {
        errorMsg = 'Ошибка доступа. Попробуйте еще раз.';
      } else if (err.code === 'unavailable') {
        errorMsg = 'Сервис временно недоступен. Попробуйте позже.';
      } else if (err.message) {
        errorMsg = `Ошибка: ${err.message}`;
      }
      
      // Показываем ошибку через toast
      toast.error(errorMsg);
      
      // Также показываем в UI
      setErrorMessage(errorMsg);
      setShowError(true);
    } finally {
      setIsRegLoading(false);
    }
  };

  // Функция для закрытия окна успеха и сброса формы
  const handleSuccessClose = () => {
    setShowSuccess(false);
    setTab('login');
    // Сбрасываем форму
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegStatus('agent');
    onClose();
  };

  // Функция для закрытия окна с ошибкой
  const handleErrorClose = () => {
    setShowError(false);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  // Если показываем окно успеха
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ru' ? 'Спасибо за вашу заявку!' : language === 'id' ? 'Terima kasih atas aplikasi Anda!' : 'Thank you for your application!'}
              </h2>
              <p className="text-gray-600 mb-4">
                {language === 'ru' ? 'Наши специалисты свяжутся с вами в ближайшее время.' : language === 'id' ? 'Para spesialis kami akan segera menghubungi Anda.' : 'Our specialists will contact you soon.'}
              </p>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                {language === 'ru' 
                  ? 'В это время вы можете скачать и установить наше приложение IT Agent для риэлторов на iPhone и iPad. В нём вы найдёте полный список комплексов и объектов из балийских застройщиков и множество удобных инструментов для риэлторов.'
                  : language === 'id'
                  ? 'Dalam waktu yang sama, Anda dapat mengunduh dan menginstal aplikasi IT Agent untuk agen real estate di iPhone dan iPad. Di dalamnya Anda akan menemukan daftar lengkap kompleks dan properti dari pengembang Bali dan banyak alat yang nyaman untuk agen real estate.'
                  : 'In the meantime, you can download and install our IT Agent app for realtors on iPhone and iPad. In it you will find a complete listing of complexes and properties from Bali developers and many convenient tools for realtors.'
                }
              </p>
            </div>
            
            <div className="space-y-3">
              <a
                href="https://apps.apple.com/id/app/it-agent-bali/id6746729723"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                {language === 'ru' ? 'Установить IT Agent' : language === 'id' ? 'Instal IT Agent' : 'Install IT Agent'}
              </a>
              
              <Button 
                variant="outline" 
                onClick={handleSuccessClose}
                className="w-full"
              >
                {language === 'ru' ? 'Закрыть' : language === 'id' ? 'Tutup' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если показываем окно с ошибкой
  if (showError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ru' ? 'Произошла ошибка' : language === 'id' ? 'Terjadi kesalahan' : 'An error occurred'}
              </h2>
              <p className="text-gray-600 mb-4">
                {errorMessage}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleErrorClose}
                className="w-full"
              >
                {language === 'ru' ? 'Попробовать снова' : language === 'id' ? 'Coba lagi' : 'Try again'}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full"
              >
                {language === 'ru' ? 'Закрыть' : language === 'id' ? 'Tutup' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t.placePropertyTitle}</h2>
          <div className="flex items-center gap-2">
            {tab === 'register' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTab('login')}
                className="text-sm"
              >
                {t.backButton}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'login' ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">{t.placePropertyDescription}</p>
              
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">{t.modalPassword}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t.sending : t.loginButton}
                </Button>
              </form>
              
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  {t.registrationDescription.split('{link}')[0]}
                  <button 
                    type="button"
                    onClick={() => setTab('register')}
                    className="text-blue-600 hover:text-blue-800 underline text-sm cursor-pointer"
                  >
                    {t.submitRegistrationRequest}
                  </button>
                  {t.registrationDescription.split('{link}')[1]}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t.registrationTitle}</h3>
              
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">{t.modalName}</Label>
                  <Input 
                    id="name" 
                    value={regName} 
                    onChange={(e) => setRegName(e.target.value)} 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">{t.modalPhone}</Label>
                  <Input 
                    id="phone" 
                    value={regPhone} 
                    onChange={(e) => setRegPhone(e.target.value)} 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="regEmail">{t.email}</Label>
                  <Input 
                    id="regEmail" 
                    type="email" 
                    value={regEmail} 
                    onChange={(e) => setRegEmail(e.target.value)} 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t.status}</Label>
                  <Select value={regStatus} onValueChange={setRegStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.status} />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {statusLabel(s.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isRegLoading}>
                  {isRegLoading ? t.sending : t.modalSubmitRequest}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
