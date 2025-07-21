import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Shield, 
  ShieldCheck, 
  Star, 
  User, 
  UserCircle, 
  Building,
  Users,
  AlertCircle,
  Loader2,
  BarChart3,
  Lock
} from 'lucide-react';

// Определение ролей и их отображения
const ROLES = {
  admin: {
    value: 'admin',
    label: 'Администратор',
    icon: Shield,
    color: 'bg-red-500'
  },
  moderator: {
    value: 'moderator',
    label: 'Модератор',
    icon: ShieldCheck,
    color: 'bg-yellow-500'
  },
  'premium agent': {
    value: 'premium agent',
    label: 'Премиум агент',
    icon: Star,
    color: 'bg-purple-500'
  },
  agent: {
    value: 'agent',
    label: 'Агент',
    icon: User,
    color: 'bg-blue-500'
  },
  user: {
    value: 'user',
    label: 'Пользователь',
    icon: UserCircle,
    color: 'bg-gray-500'
  },
  'застройщик': {
    value: 'застройщик',
    label: 'Застройщик',
    icon: Building,
    color: 'bg-green-500'
  },
  'премиум застройщик': {
    value: 'премиум застройщик',
    label: 'Премиум застройщик',
    icon: Star,
    color: 'bg-orange-500'
  },
  closed: {
    value: 'closed',
    label: 'Закрытый аккаунт',
    icon: Lock,
    color: 'bg-gray-700'
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Получаем список пользователей
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Получаем список застройщиков
        const developersSnapshot = await getDocs(collection(db, 'developers'));
        const developersData = developersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Сортируем застройщиков по имени
        developersData.sort((a, b) => a.name.localeCompare(b.name));

        setUsers(usersData);
        setDevelopers(developersData);
        setError(null);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData = { role: newRole };
      
      // Если меняем роль с застройщика на другую, удаляем developerId
      if (!['застройщик', 'премиум застройщик'].includes(newRole)) {
        updateData.developerId = null;
      }
      
      await updateDoc(userRef, updateData);
      
      // Обновляем локальное состояние
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, ...updateData };
        }
        return user;
      }));
      setError(null);
    } catch (error) {
      console.error('Ошибка при обновлении роли:', error);
      setError('Ошибка при обновлении роли пользователя');
    }
  };

  const handleDeveloperChange = async (userId, developerId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const finalDeveloperId = developerId === 'unselected' ? null : developerId;
      await updateDoc(userRef, { developerId: finalDeveloperId });
      
      // Обновляем локальное состояние
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, developerId: finalDeveloperId };
        }
        return user;
      }));
      setError(null);
    } catch (error) {
      console.error('Ошибка при обновлении застройщика:', error);
      setError('Ошибка при назначении застройщика');
    }
  };

  const getRoleBadge = (roleValue) => {
    const role = ROLES[roleValue] || {
      value: roleValue,
      label: roleValue,
      icon: UserCircle,
      color: 'bg-gray-500'
    };
    const Icon = role.icon;
    return (
      <Badge className={`${role.color} text-white hover:${role.color}/80 flex items-center gap-1 min-w-[120px] justify-center`}>
        <Icon className="w-3 h-3" />
        {role.label}
      </Badge>
    );
  };

  const getAvailableRoles = () => {
    return Object.values(ROLES);
  };

  const getDeveloperName = (developerId) => {
    const developer = developers.find(dev => dev.id === developerId);
    return developer ? developer.name : 'Не выбран';
  };

  // Функция для подсчета пользователей по ролям
  const getUsersCountByRole = () => {
    const counts = {};
    
    // Инициализируем счетчики для всех ролей
    Object.keys(ROLES).forEach(role => {
      counts[role] = 0;
    });
    
    // Подсчитываем пользователей по ролям
    users.forEach(user => {
      const role = user.role || 'user';
      counts[role] = (counts[role] || 0) + 1;
    });
    
    return counts;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-blue-600" />
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>Управление пользователями</h1>
      </div>

      {/* Счетчики пользователей по ролям */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(ROLES).map(([roleKey, roleConfig]) => {
          const Icon = roleConfig.icon;
          const count = getUsersCountByRole()[roleKey] || 0;
          
          return (
            <Card key={roleKey} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`p-2 rounded-lg ${roleConfig.color.replace('bg-', 'bg-')} bg-opacity-10`}>
                    <Icon className={`w-4 h-4 ${roleConfig.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-medium text-gray-600 truncate">{roleConfig.label}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Общий счетчик всех пользователей */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Пользователи не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-5 gap-4 items-center'}`}>
                  {/* Имя пользователя */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Имя пользователя</p>
                    <p className="font-semibold text-gray-900">
                      {user.displayName || 'Не указано'}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>

                  {/* Роль */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Роль</p>
                    <Select 
                      value={user.role || 'user'} 
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className={`${isMobile ? 'w-full h-12' : 'min-w-[160px]'}`}>
                        <SelectValue>
                          {getRoleBadge(user.role || 'user')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles().map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <role.icon className="w-4 h-4" />
                              {role.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Застройщик */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Застройщик</p>
                    {['застройщик', 'премиум застройщик'].includes(user.role) ? (
                      <Select 
                        value={user.developerId || 'unselected'} 
                        onValueChange={(value) => handleDeveloperChange(user.id, value)}
                      >
                        <SelectTrigger className={`${isMobile ? 'w-full h-12' : 'min-w-[180px]'}`}>
                          <SelectValue placeholder="Не выбран" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unselected">
                            <em>Сбросить выбор</em>
                          </SelectItem>
                          {developers.map(developer => (
                            <SelectItem key={developer.id} value={developer.id}>
                              {developer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-10 flex items-center text-gray-400">
                        Недоступно
                      </div>
                    )}
                  </div>

                  {/* Текущий застройщик */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Текущий застройщик</p>
                    {['застройщик', 'премиум застройщик'].includes(user.role) && user.developerId ? (
                      <Badge className="bg-green-500 text-white flex items-center gap-1 w-fit">
                        <Building className="w-3 h-3" />
                        {getDeveloperName(user.developerId)}
                      </Badge>
                    ) : (
                      <div className="h-10 flex items-center text-gray-400">
                        Не назначен
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManagement; 