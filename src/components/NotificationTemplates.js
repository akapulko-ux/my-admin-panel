import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy,
  Building2,
  Users,
  MessageSquare,
  Save,
  X
} from 'lucide-react';

// Предустановленные шаблоны (упрощенные)
const DEFAULT_TEMPLATES = [
  {
    id: 'new_project',
    name: 'Новый проект',
    category: 'Анонсы',
    title: 'Новый проект от {developer_name}!',
    body: 'Представляем новый жилой комплекс {project_name}. Узнайте подробности в приложении!',
    isDefault: true
  },
  {
    id: 'price_update',
    name: 'Изменение цен',
    category: 'Коммерческие',
    title: 'Обновление цен в {project_name}',
    body: 'Актуальные цены на квартиры в комплексе {project_name}. Не упустите выгодные предложения!',
    isDefault: true
  },
  {
    id: 'construction_update',
    name: 'Ход строительства',
    category: 'Информационные',
    title: 'Новости строительства {project_name}',
    body: 'Следите за прогрессом строительства вашего будущего дома. Фото и видео в приложении.',
    isDefault: true
  },
  {
    id: 'special_offer',
    name: 'Специальное предложение',
    category: 'Коммерческие',
    title: 'Специальное предложение!',
    body: 'Ограниченное по времени предложение для покупателей {project_name}. Подробности в приложении.',
    isDefault: true
  },
  {
    id: 'event_invitation',
    name: 'Приглашение на мероприятие',
    category: 'События',
    title: 'Приглашение на презентацию',
    body: 'Приглашаем вас на презентацию нового проекта {project_name}. Дата и место в приложении.',
    isDefault: true
  }
];

const NotificationTemplates = ({ onSelectTemplate, className = '' }) => {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    // Загружаем шаблоны из localStorage или используем дефолтные
    const savedTemplates = localStorage.getItem('notificationTemplates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
      } catch (error) {
        console.error('Error parsing saved templates:', error);
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  };

  const saveTemplates = (newTemplates) => {
    // Сохраняем только пользовательские шаблоны
    const userTemplates = newTemplates.filter(t => !t.isDefault);
    localStorage.setItem('notificationTemplates', JSON.stringify(userTemplates));
    setTemplates(newTemplates);
  };

  const handleCreateTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: '',
      category: 'Пользовательские',
      title: '',
      body: '',
      isDefault: false
    };
    setEditingTemplate(newTemplate);
    setIsCreatingNew(true);
  };

  const handleEditTemplate = (template) => {
    if (template.isDefault) {
      // Для дефолтных шаблонов создаем копию
      const copy = {
        ...template,
        id: Date.now().toString(),
        name: template.name + ' (копия)',
        category: 'Пользовательские',
        isDefault: false
      };
      setEditingTemplate(copy);
      setIsCreatingNew(true);
    } else {
      setEditingTemplate({ ...template });
      setIsCreatingNew(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate.name.trim() || !editingTemplate.title.trim() || !editingTemplate.body.trim()) {
      return;
    }

    let newTemplates;
    if (isCreatingNew) {
      newTemplates = [...templates, editingTemplate];
    } else {
      newTemplates = templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      );
    }

    saveTemplates(newTemplates);
    setEditingTemplate(null);
    setIsCreatingNew(false);
  };

  const handleDeleteTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template.isDefault) return; // Нельзя удалить дефолтные шаблоны

    if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      const newTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(newTemplates);
    }
  };

  const handleUseTemplate = (template) => {
    onSelectTemplate({
      title: template.title,
      body: template.body
    });
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(templates.map(t => t.category))];

  if (editingTemplate) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              {isCreatingNew ? 'Создать шаблон' : 'Редактировать шаблон'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingTemplate(null);
                setIsCreatingNew(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название шаблона
            </label>
            <Input
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({
                ...editingTemplate,
                name: e.target.value
              })}
              placeholder="Введите название шаблона"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заголовок уведомления
            </label>
            <Input
              value={editingTemplate.title}
              onChange={(e) => setEditingTemplate({
                ...editingTemplate,
                title: e.target.value
              })}
              placeholder="Заголовок (можно использовать {project_name}, {developer_name})"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Доступные переменные: {'{project_name}'}, {'{developer_name}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст сообщения
            </label>
            <textarea
              value={editingTemplate.body}
              onChange={(e) => setEditingTemplate({
                ...editingTemplate,
                body: e.target.value
              })}
              placeholder="Текст уведомления"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Шаблон будет использоваться для отправки всем пользователям iOS приложения
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveTemplate} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTemplate(null);
                setIsCreatingNew(false);
              }}
            >
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Шаблоны уведомлений
          </span>
          <Button onClick={handleCreateTemplate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Поиск */}
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск шаблонов..."
        />

        {/* Категории */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const count = templates.filter(t => t.category === category).length;
            return (
              <Badge key={category} variant="secondary">
                {category} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Список шаблонов */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Шаблоны не найдены</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {template.name}
                      </h4>
                      <Badge variant={template.isDefault ? 'default' : 'secondary'} className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                      {template.title}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.body}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Для всех пользователей</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      title="Использовать шаблон"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      title={template.isDefault ? "Скопировать и редактировать" : "Редактировать"}
                    >
                      {template.isDefault ? <Copy className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </Button>
                    {!template.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Удалить шаблон"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTemplates; 