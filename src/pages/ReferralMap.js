import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Network, Search, Users, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';

const ReferralMap = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedView, setSelectedView] = useState('tree'); // 'tree' or 'list'

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (err) {
        console.error('Ошибка при загрузке пользователей:', err);
        setError('Не удалось загрузить данные пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Функция для построения дерева рефералов
  const buildReferralTree = (users) => {
    const userMap = new Map();
    const rootUsers = [];

    // Создаем мапу пользователей
    users.forEach(user => {
      userMap.set(user.id, { ...user, children: [] });
    });

    // Строим дерево
    users.forEach(user => {
      if (user.refCode) {
        // Ищем пользователя, чей agentCode совпадает с refCode текущего пользователя
        const parent = users.find(u => u.agentCode === user.refCode);
        if (parent && userMap.has(parent.id)) {
          userMap.get(parent.id).children.push(userMap.get(user.id));
        } else {
          // Если родитель не найден, считаем пользователя корневым
          rootUsers.push(userMap.get(user.id));
        }
      } else {
        // Пользователь без refCode - корневой
        rootUsers.push(userMap.get(user.id));
      }
    });

    return rootUsers;
  };

  // Функция для подсчета статистики
  const calculateStats = (users) => {
    const totalUsers = users.length;
    const withReferrals = users.filter(user => user.refCode).length;
    const withoutReferrals = totalUsers - withReferrals;
    
    // Подсчитываем уникальных рефереров
    const uniqueReferrers = new Set(
      users.filter(user => user.refCode).map(user => user.refCode)
    ).size;

    return {
      totalUsers,
      withReferrals,
      withoutReferrals,
      uniqueReferrers
    };
  };

  // Функция для переключения развернутого состояния узла
  const toggleNode = (userId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  // Функция для фильтрации пользователей по поиску
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || '';
    
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.agentCode?.toLowerCase().includes(searchLower) ||
      user.refCode?.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower)
    );
  });

  // Функция для экспорта в CSV
  const exportToCSV = (users) => {
    const csvContent = [
      ['Имя', 'Email', 'Роль', 'Код агента', 'Реферальный код', 'Дата регистрации'],
      ...users.map(user => [
        user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || '',
        user.email || '',
        user.role || '',
        user.agentCode || '',
        user.refCode || '',
        user.registrationDate ? new Date(user.registrationDate.seconds * 1000).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `referral_map_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tree = buildReferralTree(filteredUsers);
  const stats = calculateStats(users);

  // Проверка доступа только для админов и модераторов
  if (role !== 'admin' && role !== 'moderator') {
    return <Navigate to="/dashboard" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Карта рефералов</h1>
        </div>
        
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">С рефералами</p>
                  <p className="text-2xl font-bold">{stats.withReferrals}</p>
                </div>
                <Network className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Без рефералов</p>
                  <p className="text-2xl font-bold">{stats.withoutReferrals}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Активных рефереров</p>
                  <p className="text-2xl font-bold">{stats.uniqueReferrers}</p>
                </div>
                <Network className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Поиск и фильтры */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по имени, email, agentCode или refCode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedView === 'tree' ? 'default' : 'outline'}
              onClick={() => setSelectedView('tree')}
            >
              Дерево
            </Button>
            <Button
              variant={selectedView === 'list' ? 'default' : 'outline'}
              onClick={() => setSelectedView('list')}
            >
              Список
            </Button>
          </div>
        </div>

        {/* Кнопка для развертывания/сворачивания всех узлов */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allUserIds = new Set(users.map(user => user.id));
              setExpandedNodes(allUserIds);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Развернуть все
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set())}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Свернуть все
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(users)}
          >
            Экспорт в CSV
          </Button>
        </div>
      </div>

      {/* Основное содержимое */}
      {selectedView === 'tree' ? (
        <ReferralTree 
          tree={tree} 
          expandedNodes={expandedNodes} 
          toggleNode={toggleNode}
        />
      ) : (
        <ReferralList users={filteredUsers} />
      )}
    </div>
  );
};

// Компонент для отображения дерева рефералов
const ReferralTree = ({ tree, expandedNodes, toggleNode }) => {
  return (
    <div className="space-y-4">
      {tree.map(node => (
        <ReferralNode
          key={node.id}
          node={node}
          level={0}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        />
      ))}
    </div>
  );
};

// Компонент для отображения одного узла дерева
const ReferralNode = ({ node, level, expandedNodes, toggleNode }) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`ml-${Math.min(level * 6, 24)}`}>
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-3">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNode(node.id)}
                  className="p-1"
                >
                  {isExpanded ? '▼' : '▶'}
                </Button>
              )}
              {!hasChildren && <div className="w-8"></div>}
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex flex-col">
                    {(node.name || node.firstName || node.displayName) && (
                      <span className="font-medium text-base">
                        {node.name || `${node.firstName || ''} ${node.lastName || ''}`.trim() || node.displayName}
                      </span>
                    )}
                    <span className={`${node.name || node.firstName || node.displayName ? 'text-sm text-gray-600' : 'font-medium'}`}>
                      {node.email}
                    </span>
                  </div>
                  <Badge variant="outline">{node.role}</Badge>
                </div>
                <div className="flex flex-col md:flex-row md:gap-4 text-sm text-gray-500 mt-1 space-y-1 md:space-y-0">
                  {node.agentCode && (
                    <span>Код агента: <code className="bg-gray-100 px-1 rounded">{node.agentCode}</code></span>
                  )}
                  {node.refCode && (
                    <span>Реф. код: <code className="bg-gray-100 px-1 rounded">{node.refCode}</code></span>
                  )}
                </div>
              </div>
            </div>
            
            {hasChildren && (
              <Badge variant="secondary" className="self-start md:self-center">
                {node.children.length} {node.children.length === 1 ? 'реферал' : 'рефералов'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {hasChildren && isExpanded && (
        <div className="ml-4 space-y-2">
          {node.children.map(child => (
            <ReferralNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент для отображения списка рефералов
const ReferralList = ({ users }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map(user => (
        <Card key={user.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                {(user.name || user.firstName || user.displayName) && (
                  <span className="font-medium text-base">
                    {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName}
                  </span>
                )}
                <span className={`${user.name || user.firstName || user.displayName ? 'text-sm text-gray-600' : 'font-medium'}`}>
                  {user.email}
                </span>
              </div>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {user.agentCode && (
                <div>Код агента: <code className="bg-gray-100 px-1 rounded">{user.agentCode}</code></div>
              )}
              {user.refCode && (
                <div>Реф. код: <code className="bg-gray-100 px-1 rounded">{user.refCode}</code></div>
              )}
              <div>Дата регистрации: {user.registrationDate ? new Date(user.registrationDate.seconds * 1000).toLocaleDateString() : 'Не указана'}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReferralMap; 