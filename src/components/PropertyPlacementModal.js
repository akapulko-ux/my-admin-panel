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

export default function PropertyPlacementModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
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
        userStatus: regStatus, // статус пользователя (агент/агентство)
        requestStatus: 'pending', // статус заявки
        createdAt: new Date(),
        language: language || 'ru'
      };
      
      // Сохраняем заявку в коллекцию registrationRequests
      const requestRef = doc(collection(db, 'registrationRequests'));
      await setDoc(requestRef, registrationRequest);
      
      // Показываем уведомление об успешной отправке
      alert('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
      
      onClose();
    } catch (err) {
      console.error('Registration request error', err);
      alert('Ошибка при отправке заявки. Попробуйте еще раз.');
    } finally {
      setIsRegLoading(false);
    }
  };

  if (!isOpen) return null;

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
