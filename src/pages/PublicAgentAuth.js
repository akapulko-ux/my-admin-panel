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


