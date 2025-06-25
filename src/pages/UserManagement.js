import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BusinessIcon from '@mui/icons-material/Business';

// Определение ролей и их отображения
const ROLES = {
  admin: {
    value: 'admin',
    label: 'Администратор',
    icon: AdminPanelSettingsIcon,
    color: 'error'
  },
  moderator: {
    value: 'moderator',
    label: 'Модератор',
    icon: SupervisorAccountIcon,
    color: 'warning'
  },
  'премиум агент': {
    value: 'премиум агент',
    label: 'Премиум агент',
    icon: StarIcon,
    color: 'success'
  },
  agent: {
    value: 'agent',
    label: 'Агент',
    icon: PersonIcon,
    color: 'primary'
  },
  user: {
    value: 'user',
    label: 'Пользователь',
    icon: AccountCircleIcon,
    color: 'default'
  },
  'застройщик': {
    value: 'застройщик',
    label: 'Застройщик',
    icon: BusinessIcon,
    color: 'success'
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      if (newRole !== 'застройщик') {
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
      await updateDoc(userRef, { developerId });
      
      // Обновляем локальное состояние
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, developerId };
        }
        return user;
      }));
      setError(null);
    } catch (error) {
      console.error('Ошибка при обновлении застройщика:', error);
      setError('Ошибка при назначении застройщика');
    }
  };

  const getRoleChip = (roleValue) => {
    const role = ROLES[roleValue] || {
      value: roleValue,
      label: roleValue,
      icon: AccountCircleIcon,
      color: 'default'
    };
    const Icon = role.icon;
    return (
      <Chip
        icon={<Icon />}
        label={role.label}
        color={role.color}
        size="small"
        sx={{ minWidth: 150 }}
      />
    );
  };

  const getAvailableRoles = () => {
    return Object.values(ROLES);
  };

  const getDeveloperName = (developerId) => {
    const developer = developers.find(dev => dev.id === developerId);
    return developer ? developer.name : 'Не выбран';
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Управление пользователями
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Застройщик</TableCell>
              <TableCell>Текущий застройщик</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body1" color="textSecondary">
                    Пользователи не найдены
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        {getAvailableRoles().map((role) => (
                          <MenuItem key={role.value} value={role.value}>
                            {getRoleChip(role.value)}
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'застройщик' && (
                      <Select
                        value={user.developerId || ''}
                        onChange={(e) => handleDeveloperChange(user.id, e.target.value)}
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        <MenuItem value="">
                          <em>Выберите застройщика</em>
                        </MenuItem>
                        {developers.map(developer => (
                          <MenuItem key={developer.id} value={developer.id}>
                            {developer.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role === 'застройщик' && user.developerId && (
                      <Chip
                        icon={<BusinessIcon />}
                        label={getDeveloperName(user.developerId)}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default UserManagement; 