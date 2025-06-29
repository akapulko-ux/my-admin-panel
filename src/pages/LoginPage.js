import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ResetPasswordModal from "../components/ResetPasswordModal";
import RegistrationRequestModal from "../components/RegistrationRequestModal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { showError } from '../utils/notifications';
import { ArrowLeft } from 'lucide-react';

// Маршруты по умолчанию для разных ролей
const DEFAULT_ROUTES = {
  admin: '/complex/list',
  модератор: '/complex/list',
  'премиум агент': '/property/list',
  agent: '/property/gallery',
  застройщик: '/chessboard',
  user: '/property/gallery'
};

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { role } = await login(email, password);
      const defaultRoute = DEFAULT_ROUTES[role] || '/dashboard';
      navigate(defaultRoute);
    } catch (err) {
      showError("Ошибка входа: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться на главную
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Вход в систему
            </CardTitle>
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
                  required
                  placeholder="example@mail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Войти
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setResetModalOpen(true)}
                className="w-full"
              >
                Забыли пароль?
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Вы застройщик и всё ещё не с нами?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegistrationModalOpen(true)}
                className="w-full"
              >
                Оставить заявку на регистрацию
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ResetPasswordModal 
        open={resetModalOpen} 
        onClose={() => setResetModalOpen(false)} 
      />

      <RegistrationRequestModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
      />
    </div>
  );
}

export default LoginPage;