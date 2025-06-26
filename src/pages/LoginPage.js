import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import ResetPasswordModal from "../components/ResetPasswordModal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

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
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { role } = await login(email, password);
      // Используем роль, полученную непосредственно при входе
      const defaultRoute = DEFAULT_ROUTES[role] || '/property/gallery';
      navigate(defaultRoute);
    } catch (err) {
      alert("Ошибка входа: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
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
        </CardContent>
      </Card>

      <ResetPasswordModal 
        open={resetModalOpen} 
        onClose={() => setResetModalOpen(false)} 
      />
    </div>
  );
}

export default LoginPage;