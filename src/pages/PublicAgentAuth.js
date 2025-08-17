import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { landingTranslations } from '../lib/landingTranslations';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export default function PublicAgentAuth() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get('redirect') || '/property/gallery';
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
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regStatus, setRegStatus] = useState('agent');
  const [isRegLoading, setIsRegLoading] = useState(false);

  const statuses = [
    { value: 'agent', ru: 'Агент', en: 'Agent', id: 'Agen' },
    { value: 'agency', ru: 'Агентство', en: 'Agency', id: 'Agensi' },
    { value: 'investor', ru: 'Инвестор', en: 'Investor', id: 'Investor' },
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
      navigate(redirect);
    } catch (err) {
      console.error(err);
      // уведомления уже обрабатываются внутри login через showError
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      console.error('Пароли не совпадают');
      return;
    }
    try {
      setIsRegLoading(true);
      const userCred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const { user } = userCred;
      const userDoc = {
        uid: user.uid,
        email: user.email,
        role: 'agent',
        name: regName || user.displayName || '',
        displayName: regName || user.displayName || '',
        phone: regPhone || '',
        status: regStatus,
        createdAt: new Date(),
        language: language || 'ru'
      };
      await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
      navigate(redirect);
    } catch (err) {
      console.error('Registration error', err);
    } finally {
      setIsRegLoading(false);
    }
  };

  // Функция для закрытия окна успеха и сброса формы
  // const handleSuccessClose = () => { // This function was removed as per the edit hint
  //   setShowSuccess(false);
  //   setTab('login');
  //   // Сбрасываем форму
  //   setRegName('');
  //   setRegPhone('');
  //   setRegEmail('');
  //   setRegPassword('');
  //   setRegConfirm('');
  //   setRegStatus('agent');
  //   navigate(redirect);
  // };

  // Если показываем окно успеха
  // if (showSuccess) { // This block was removed as per the edit hint
  //   return (
  //     <div className="min-h-screen bg-white">
  //       <div className="max-w-md mx-auto p-4">
  //         <div className="text-center">
  //           <div className="mb-6">
  //             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //               <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  //               </svg>
  //             </div>
  //             <h2 className="text-xl font-semibold text-gray-900 mb-2">
  //               {language === 'ru' ? 'Спасибо за вашу заявку!' : language === 'id' ? 'Terima kasih atas aplikasi Anda!' : 'Thank you for your application!'}
  //             </h2>
  //             <p className="text-gray-600 mb-4">
  //               {language === 'ru' ? 'Наши специалисты свяжутся с вами в ближайшее время.' : language === 'id' ? 'Para spesialis kami akan segera menghubungi Anda.' : 'Our specialists will contact you soon.'}
  //             </p>
  //           </div>
            
  //           <div className="mb-6">
  //             <p className="text-gray-600 text-sm leading-relaxed">
  //               {language === 'ru' 
  //                 ? 'В это время вы можете скачать и установить наше приложение IT Agent для риэлторов на iPhone и iPad. В нём вы найдёте полный список комплексов и объектов из балийских застройщиков и множество удобных инструментов для риэлторов.'
  //                 : language === 'id'
  //                 ? 'Dalam waktu yang sama, Anda dapat mengunduh dan menginstal aplikasi IT Agent untuk agen real estate di iPhone dan iPad. Di dalamnya Anda akan menemukan daftar lengkap kompleks dan properti dari pengembang Bali dan banyak alat yang nyaman untuk agen real estate.'
  //                 : 'In the meantime, you can download and install our IT Agent app for realtors on iPhone and iPad. In it you will find a complete listing of complexes and properties from Bali developers and many convenient tools for realtors.'
  //               }
  //             </p>
  //           </div>
            
  //           <div className="space-y-3">
  //             <a
  //               href="https://apps.apple.com/id/app/it-agent-bali/id6746729723"
  //               target="_blank"
  //               rel="noopener noreferrer"
  //               className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
  //             >
  //               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
  //                 <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  //               </svg>
  //               {language === 'ru' ? 'Установить IT Agent' : language === 'id' ? 'Instal IT Agent' : 'Install IT Agent'}
  //             </a>
              
  //             <Button 
  //               variant="outline" 
  //               onClick={handleSuccessClose}
  //               className="w-full"
  //             >
  //               {language === 'ru' ? 'Закрыть' : language === 'id' ? 'Tutup' : 'Close'}
  //             </Button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">
            {tab === 'login' ? (language === 'ru' ? 'Вход' : language === 'id' ? 'Masuk' : 'Login')
                             : (language === 'ru' ? 'Регистрация' : language === 'id' ? 'Daftar' : 'Sign up')}
          </h1>
          <LanguageSwitcher />
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant={tab === 'login' ? 'default' : 'outline'} onClick={() => setTab('login')}>
            {language === 'ru' ? 'Вход' : language === 'id' ? 'Masuk' : 'Login'}
          </Button>
          <Button variant={tab === 'register' ? 'default' : 'outline'} onClick={() => setTab('register')}>
            {language === 'ru' ? 'Регистрация' : language === 'id' ? 'Daftar' : 'Register'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {tab === 'login' ? t.loginTitle : (language === 'ru' ? 'Регистрация' : language === 'id' ? 'Pendaftaran' : 'Registration')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t.sending : (language === 'ru' ? 'Войти' : language === 'id' ? 'Masuk' : 'Login')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">{language === 'ru' ? 'Имя' : language === 'id' ? 'Nama' : 'Name'}</Label>
                  <Input id="name" value={regName} onChange={(e) => setRegName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">{language === 'ru' ? 'Номер телефона' : language === 'id' ? 'Telepon' : 'Phone'}</Label>
                  <Input id="phone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="regEmail">Email</Label>
                  <Input id="regEmail" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="regPassword">{t.password}</Label>
                  <Input id="regPassword" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="regConfirm">{language === 'ru' ? 'Подтверждение пароля' : language === 'id' ? 'Konfirmasi kata sandi' : 'Confirm password'}</Label>
                  <Input id="regConfirm" type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{language === 'ru' ? 'Статус' : language === 'id' ? 'Status' : 'Status'}</Label>
                  <Select value={regStatus} onValueChange={setRegStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s.value} value={s.value}>{statusLabel(s.value)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isRegLoading}>
                  {isRegLoading ? (t.sending || 'Отправка...') : (language === 'ru' ? 'Зарегистрироваться' : language === 'id' ? 'Daftar' : 'Register')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


