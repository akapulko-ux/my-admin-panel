import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Building2, 
  User, 
  Star, 
  Mail, 
  Phone, 
  MessageCircle,
  CheckCircle,
  Loader2,
  Check,
  X,
  MoreHorizontal
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';

// Компонент для отображения комментария (минималистичный дизайн)
const CommentSection = ({ 
  userId, 
  userType, 
  comments, 
  editingComment, 
  commentText, 
  setCommentText, 
  savingComment, 
  saveComment, 
  deleteComment, 
  startEditComment, 
  cancelEditComment 
}) => {
  const commentKey = `${userType}_${userId}`;
  const currentComment = comments[commentKey] || '';
  const isEditing = editingComment === commentKey;
  const isSaving = savingComment === userId;

  if (isEditing) {
    return (
      <div className="mt-2">
        <div className="flex items-start gap-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded text-xs resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="Введите комментарий..."
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => saveComment(userId, userType, commentText)}
              disabled={isSaving}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Сохранить"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </button>
            <button
              onClick={cancelEditComment}
              disabled={isSaving}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title="Отмена"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentComment) {
    return (
      <div className="mt-2">
        <div className="flex items-start gap-2 group">
          <p className="flex-1 text-xs text-gray-600 leading-relaxed">
            {currentComment}
          </p>
          <button
            onClick={() => deleteComment(userId, userType)}
            disabled={isSaving}
            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50"
            title="Удалить комментарий"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => startEditComment(userId, userType)}
        className="p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded transition-colors"
        title="Добавить комментарий"
      >
        <MoreHorizontal className="h-3 w-3" />
      </button>
    </div>
  );
};

const GeneralOverview = () => {
  // eslint-disable-next-line no-unused-vars
  const { role } = useAuth();
  const [agents, setAgents] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Состояния для комментариев
  const [comments, setComments] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(null);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Функции для работы с комментариями
  const loadComments = async () => {
    try {
      const commentsDoc = await getDoc(doc(db, 'overview_comments', 'all'));
      if (commentsDoc.exists()) {
        setComments(commentsDoc.data().comments || {});
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    }
  };

  const saveComment = async (userId, userType, comment) => {
    setSavingComment(userId);
    try {
      const commentKey = `${userType}_${userId}`;
      const newComments = { ...comments, [commentKey]: comment };
      
      await setDoc(doc(db, 'overview_comments', 'all'), {
        comments: newComments
      }, { merge: true });
      
      setComments(newComments);
      setEditingComment(null);
      setCommentText('');
      showSuccess('Комментарий сохранен');
    } catch (error) {
      console.error('Ошибка сохранения комментария:', error);
      showError('Ошибка сохранения комментария');
    } finally {
      setSavingComment(null);
    }
  };

  const deleteComment = async (userId, userType) => {
    setSavingComment(userId);
    try {
      const commentKey = `${userType}_${userId}`;
      const newComments = { ...comments };
      delete newComments[commentKey];
      
      await setDoc(doc(db, 'overview_comments', 'all'), {
        comments: newComments
      }, { merge: true });
      
      setComments(newComments);
      setEditingComment(null);
      setCommentText('');
      showSuccess('Комментарий удален');
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      showError('Ошибка удаления комментария');
    } finally {
      setSavingComment(null);
    }
  };

  const startEditComment = (userId, userType) => {
    const commentKey = `${userType}_${userId}`;
    setEditingComment(commentKey);
    setCommentText(comments[commentKey] || '');
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setCommentText('');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Получаем всех агентов (пользователи с ролями agent или premium agent)
        const agentsQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['agent', 'premium agent'])
        );
        const agentsSnapshot = await getDocs(agentsQuery);
        const agentsData = agentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Получаем всех застройщиков (пользователи с ролями застройщик или премиум застройщик)
        const developersQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['застройщик', 'премиум застройщик'])
        );
        const developersSnapshot = await getDocs(developersQuery);
        const developersData = developersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Получаем данные застройщиков из коллекции developers для получения названий комплексов
        const developersCollectionSnapshot = await getDocs(collection(db, 'developers'));
        const developersCollectionData = developersCollectionSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Получаем комплексы для определения привязки к застройщикам
        const complexesSnapshot = await getDocs(collection(db, 'complexes'));
        const complexesData = complexesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Обогащаем данные застройщиков информацией о комплексах
        const enrichedDevelopersData = developersData.map(developer => {
          const developerInfo = developersCollectionData.find(d => d.id === developer.developerId);
          
          // Ищем комплексы застройщика по разным полям
          let developerComplexes = [];
          if (developer.developerId && developerInfo?.name) {
            // Сначала ищем по developerId
            developerComplexes = complexesData.filter(complex => complex.developerId === developer.developerId);
            
            // Если не найдено, ищем по названию застройщика
            if (developerComplexes.length === 0) {
              developerComplexes = complexesData.filter(complex => 
                complex.developer === developerInfo.name
              );
            }
            
            // Отладочная информация
            console.log(`Застройщик ${developerInfo.name} (ID: ${developer.developerId}):`);
            console.log(`  - Найдено комплексов по developerId: ${complexesData.filter(complex => complex.developerId === developer.developerId).length}`);
            console.log(`  - Найдено комплексов по названию: ${complexesData.filter(complex => complex.developer === developerInfo.name).length}`);
            console.log(`  - Итого комплексов: ${developerComplexes.length}`);
            console.log(`  - Договор подписан: ${developer.contractSigned || false}`);
          }
          
          return {
            ...developer,
            developerName: developerInfo?.name || 'Не указано',
            complexes: developerComplexes.map(complex => complex.name),
            hasContract: developer.contractSigned || false
          };
        });

        // Отладочная информация
        console.log('=== ОТЛАДОЧНАЯ ИНФОРМАЦИЯ ===');
        console.log('Застройщики:', enrichedDevelopersData.length);
        console.log('Комплексы:', complexesData.length);
        console.log('Примеры комплексов:', complexesData.slice(0, 3).map(c => ({ name: c.name, developer: c.developer, developerId: c.developerId })));
        console.log('Застройщики с подписанными договорами:', developersData.filter(d => d.contractSigned).length);
        console.log('Примеры застройщиков:', developersData.slice(0, 3).map(d => ({ 
          email: d.email, 
          role: d.role, 
          developerId: d.developerId, 
          contractSigned: d.contractSigned 
        })));
        
        setAgents(agentsData);
        setDevelopers(enrichedDevelopersData);
        setError(null);
        
        // Загружаем комментарии
        await loadComments();
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const getRoleBadge = (role) => {
    const roleConfig = {
      'agent': { label: 'Агент', color: 'bg-blue-500', icon: User },
      'premium agent': { label: 'Премиум агент', color: 'bg-purple-500', icon: Star },
      'застройщик': { label: 'Застройщик', color: 'bg-green-500', icon: Building2 },
      'премиум застройщик': { label: 'Премиум застройщик', color: 'bg-orange-500', icon: Star }
    };

    const config = roleConfig[role] || { label: role, color: 'bg-gray-500', icon: User };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon size={14} />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Загрузка данных...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-2">Ошибка загрузки</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Общий обзор</h1>
        <p className="text-gray-600">Управление агентами и застройщиками</p>
      </div>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Список агентов */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Все агенты ({agents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Агенты не найдены
                </div>
              ) : (
                agents.map((agent) => (
                  <Card key={agent.id} className="p-4">
                    <div className="space-y-3">
                      {/* Бейдж роли в самом верху */}
                      <div className="flex items-center gap-2">
                        {getRoleBadge(agent.role)}
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {agent.name || agent.displayName || 'Имя не указано'}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        {agent.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{agent.email}</span>
                          </div>
                        )}
                        
                        {agent.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{agent.phone}</span>
                          </div>
                        )}
                        
                        {agent.telegramChatId && (
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Telegram подключен</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Секция комментария */}
                      <CommentSection 
                        userId={agent.id} 
                        userType="agent"
                        comments={comments}
                        editingComment={editingComment}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        savingComment={savingComment}
                        saveComment={saveComment}
                        deleteComment={deleteComment}
                        startEditComment={startEditComment}
                        cancelEditComment={cancelEditComment}
                      />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Список застройщиков */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Все застройщики ({developers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {developers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Застройщики не найдены
                </div>
              ) : (
                developers.map((developer) => (
                  <Card key={developer.id} className="p-4">
                    <div className="space-y-3">
                      {/* Бейджи роли и договора в самом верху */}
                      <div className="flex items-center gap-2">
                        {getRoleBadge(developer.role)}
                        {developer.hasContract && (
                          <Badge className="bg-green-500 text-white flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Договор подписан
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {developer.developerName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {developer.name || developer.displayName || 'Имя не указано'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        {developer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{developer.email}</span>
                          </div>
                        )}
                        
                        {developer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{developer.phone}</span>
                          </div>
                        )}
                        
                        {developer.complexes && developer.complexes.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium text-sm text-gray-700 mb-1">
                              Комплексы ({developer.complexes.length}):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {developer.complexes.map((complex, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {complex}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Секция комментария */}
                      <CommentSection 
                        userId={developer.id} 
                        userType="developer"
                        comments={comments}
                        editingComment={editingComment}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        savingComment={savingComment}
                        saveComment={saveComment}
                        deleteComment={deleteComment}
                        startEditComment={startEditComment}
                        cancelEditComment={cancelEditComment}
                      />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeneralOverview; 