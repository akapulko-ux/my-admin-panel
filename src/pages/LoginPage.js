import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ResetPasswordModal from "../components/ResetPasswordModal";
import RegistrationRequestModal from "../components/RegistrationRequestModal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { showError } from '../utils/notifications';
import { ArrowLeft } from 'lucide-react';
import { landingTranslations } from '../lib/landingTranslations';
import { useLanguage } from '../lib/LanguageContext';

// Маршруты по умолчанию для разных ролей
const DEFAULT_ROUTES = {
  admin: '/property/gallery',
  moderator: '/property/gallery',
  'premium agent': '/property/gallery',
  agent: '/property/gallery',
  застройщик: '/property/gallery',
  user: '/gallery'
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const t = landingTranslations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { role } = await login(email, password);
      const defaultRoute = DEFAULT_ROUTES[role] || '/property/gallery';
      navigate(defaultRoute);
    } catch (error) {
      console.error("Ошибка входа:", error);
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/public" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t.backToHome}
          </Link>
          <Select value={language} onValueChange={changeLanguage}>
            <SelectTrigger className="w-[120px]">
              <SelectValue>
                {language === 'ru' ? 'Русский' : language === 'en' ? 'English' : 'Bahasa'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="id">Bahasa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t.loginTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => setIsResetModalOpen(true)}
              >
                {t.forgotPassword}
              </Button>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t.sending : t.login}
              </Button>

              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t.developerQuestion}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRegistrationModalOpen(true)}
                >
                  {t.registrationRequest}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ResetPasswordModal
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        language={language}
      />

      <RegistrationRequestModal
        open={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        language={language}
      />
    </div>
  );
};

export default LoginPage;