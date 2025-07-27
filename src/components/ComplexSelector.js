import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Building2, 
  Search, 
  MapPin, 
  Users, 
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';

const ComplexSelector = ({ selectedComplexIds = [], onChange, className = '' }) => {
  const { currentUser } = useAuth();
  const [complexes, setComplexes] = useState([]);
  const [filteredComplexes, setFilteredComplexes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComplexes();
  }, [currentUser]);

  useEffect(() => {
    filterComplexes();
  }, [complexes, searchTerm]);

  const loadComplexes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let complexQuery;
      
      // Если пользователь - премиум застройщик, показываем только его комплексы
      if (currentUser?.role === 'премиум застройщик' && currentUser?.developerId) {
        complexQuery = query(
          collection(db, 'complexes'),
          where('developerId', '==', currentUser.developerId)
        );
      } else {
        // Для других ролей показываем все комплексы
        complexQuery = query(collection(db, 'complexes'));
      }

      const snapshot = await getDocs(complexQuery);
      const complexData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setComplexes(complexData);
    } catch (error) {
      console.error('Error loading complexes:', error);
      setError('Ошибка при загрузке комплексов');
    } finally {
      setIsLoading(false);
    }
  };

  const filterComplexes = () => {
    if (!searchTerm.trim()) {
      setFilteredComplexes(complexes);
      return;
    }

    const filtered = complexes.filter(complex =>
      complex.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complex.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complex.developerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredComplexes(filtered);
  };

  const handleComplexToggle = (complexId) => {
    const newSelectedIds = selectedComplexIds.includes(complexId)
      ? selectedComplexIds.filter(id => id !== complexId)
      : [...selectedComplexIds, complexId];
    
    onChange(newSelectedIds);
  };

  const handleSelectAll = () => {
    const allIds = filteredComplexes.map(complex => complex.id);
    onChange(allIds);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Загрузка комплексов...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadComplexes} variant="outline" className="mt-3">
              Повторить попытку
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск комплексов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Кнопки управления */}
          {filteredComplexes.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedComplexIds.length === filteredComplexes.length}
              >
                Выбрать все
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedComplexIds.length === 0}
              >
                Очистить
              </Button>
              {selectedComplexIds.length > 0 && (
                <Badge variant="secondary">
                  Выбрано: {selectedComplexIds.length}
                </Badge>
              )}
            </div>
          )}

          {/* Список комплексов */}
          {filteredComplexes.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'Комплексы не найдены' : 'Нет доступных комплексов'}
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredComplexes.map((complex) => {
                const isSelected = selectedComplexIds.includes(complex.id);
                
                return (
                  <div
                    key={complex.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleComplexToggle(complex.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {complex.name}
                        </h4>
                        
                        {complex.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {complex.location}
                            </span>
                          </div>
                        )}
                        
                        {complex.developerName && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {complex.developerName}
                            </span>
                          </div>
                        )}

                        {complex.propertiesCount && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {complex.propertiesCount} объектов
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplexSelector; 