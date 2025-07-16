import React from 'react';
import { useAuth } from '../AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Lock, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

function AccessClosed() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Доступ закрыт
            </h1>
            <p className="text-gray-600 mb-6">
              Ваш аккаунт был заблокирован администратором. 
              Для получения дополнительной информации обратитесь в службу поддержки.
            </p>
          </div>
          
          {currentUser && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Вы вошли как:
              </p>
              <p className="text-sm font-medium text-gray-900">
                {currentUser.email}
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти из аккаунта
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccessClosed; 