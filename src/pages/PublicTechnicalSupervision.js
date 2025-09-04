import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { db } from '../firebaseConfig';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  FileText,
  Camera,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Clock,
  Eye,
  Building2
} from 'lucide-react';
import TechnicalSupervisionImageViewer from '../components/TechnicalSupervisionImageViewer';

const PublicTechnicalSupervision = () => {
  const { projectId } = useParams();
  const { language, changeLanguage } = useLanguage();
  const t = translations[language];

  // Состояния
  const [project, setProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [viewerTitle, setViewerTitle] = useState('');

  // Загрузка данных
  useEffect(() => {
    loadProjectData();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загрузка проекта
      const projectDoc = await getDoc(doc(db, 'technicalSupervisionProjects', projectId));
      if (!projectDoc.exists()) {
        setError(t.technicalSupervision?.projectNotFound || 'Проект не найден');
        return;
      }

      const projectData = { id: projectDoc.id, ...projectDoc.data() };
      setProject(projectData);

      // Загрузка разделов проекта
      const sectionsQuery = query(
        collection(db, 'technicalSupervisionSections'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'asc')
      );
      const sectionsSnapshot = await getDocs(sectionsQuery);
      const sectionsData = sectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSections(sectionsData);

      // Загрузка обследований для всех разделов проекта
      if (sectionsData.length > 0) {
        const sectionIds = sectionsData.map(section => section.id);
        const inspectionsQuery = query(
          collection(db, 'technicalSupervisionInspections'),
          where('sectionId', 'in', sectionIds),
          orderBy('createdAt', 'desc')
        );
        const inspectionsSnapshot = await getDocs(inspectionsQuery);
        const inspectionsData = inspectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Сортируем обследования по номеру очередности, затем по дате создания
        const sortedInspections = inspectionsData.sort((a, b) => {
          const orderA = a.orderNumber || 999;
          const orderB = b.orderNumber || 999;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // Если номера одинаковые, сортируем по дате создания
          return a.createdAt?.seconds - b.createdAt?.seconds || 0;
        });
        setInspections(sortedInspections);
      }

    } catch (error) {
      console.error('Ошибка загрузки данных проекта:', error);
      setError(t.technicalSupervision?.loadError || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Открытие просмотрщика изображений
  const openImageViewer = (images, initialIndex, title) => {
    setViewerImages(images);
    setViewerInitialIndex(initialIndex);
    setViewerTitle(title);
    setImageViewerOpen(true);
  };

  // Функция для форматирования текста с переносами строк
  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Обработка смены языка
  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
  };

  // Получение бейджа статуса
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        label: t.technicalSupervision?.statusPending || 'В ожидании', 
        variant: 'secondary',
        icon: Clock 
      },
      in_progress: { 
        label: t.technicalSupervision?.statusInProgress || 'В процессе', 
        variant: 'default',
        icon: Eye 
      },
      completed: { 
        label: t.technicalSupervision?.statusCompleted || 'Завершено', 
        variant: 'success',
        icon: CheckCircle 
      },
      critical: { 
        label: t.technicalSupervision?.statusCritical || 'Критично', 
        variant: 'destructive',
        icon: AlertTriangle 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.common?.loading || 'Загрузка...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                {t.common?.error || 'Ошибка'}
              </h2>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Переключатель языка */}
      <div className="bg-white border-b">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex justify-end">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <Button
                variant={language === 'en' ? 'default' : 'ghost'}
                onClick={() => handleLanguageChange('en')}
                size="sm"
                className="px-3 text-sm"
              >
                English
              </Button>
              <Button
                variant={language === 'ru' ? 'default' : 'ghost'}
                onClick={() => handleLanguageChange('ru')}
                size="sm"
                className="px-3 text-sm"
              >
                Русский
              </Button>
              <Button
                variant={language === 'id' ? 'default' : 'ghost'}
                onClick={() => handleLanguageChange('id')}
                size="sm"
                className="px-3 text-sm"
              >
                Indonesia
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {project.name}
              </h1>
              <p className="text-gray-600">
                {t.technicalSupervision?.publicPageSubtitle || 'Отчет технического надзора'}
              </p>
            </div>
          </div>
          
          {project.address && (
            <div className="flex items-center gap-2 mt-4 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{project.address}</span>
            </div>
          )}
          
          {project.description && (
            <p className="text-gray-700 mt-2 whitespace-pre-wrap">{formatText(project.description)}</p>
          )}
        </div>
      </div>

      {/* Основной контент */}
      <div className="container mx-auto p-6 md:p-6 px-0 max-w-7xl">
        {/* Статистика проекта */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8 px-4 md:px-0">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{sections.length}</div>
                <p className="text-sm text-gray-600">{t.technicalSupervision?.totalSections || 'Всего разделов'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {inspections.filter(insp => insp.status === 'completed').length}
                </div>
                <p className="text-sm text-gray-600">{t.technicalSupervision?.completed || 'Завершено'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {inspections.filter(insp => insp.status === 'in_progress').length}
                </div>
                <p className="text-sm text-gray-600">{t.technicalSupervision?.inProgress || 'В процессе'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {inspections.filter(insp => insp.status === 'critical').length}
                </div>
                <p className="text-sm text-gray-600">{t.technicalSupervision?.critical || 'Критично'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Разделы и обследования */}
        <div className="space-y-6 px-4 md:px-0">
          {sections.map(section => {
            const sectionInspections = inspections
              .filter(insp => insp.sectionId === section.id)
              .sort((a, b) => {
                const orderA = a.orderNumber || 999;
                const orderB = b.orderNumber || 999;
                if (orderA !== orderB) {
                  return orderA - orderB;
                }
                // Если номера одинаковые, сортируем по дате создания
                return a.createdAt?.seconds - b.createdAt?.seconds || 0;
              });
            
            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {section.name}
                  </CardTitle>
                  {section.description && (
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{formatText(section.description)}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>
                      {t.technicalSupervision?.totalInspections || 'Всего обследований'}: {sectionInspections.length}
                    </span>
                    <span>
                      {t.technicalSupervision?.completed || 'Завершено'}: {sectionInspections.filter(insp => insp.status === 'completed').length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {sectionInspections.length > 0 ? (
                    <div className="space-y-4 p-6 md:p-6 px-0">
                      {sectionInspections.map(inspection => (
                        <Card key={inspection.id} className="border-l-4 border-l-blue-500 bg-white md:border md:rounded-lg border-0 rounded-none md:shadow-sm shadow-none">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{inspection.title}</h4>
                                {inspection.location && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {inspection.location}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(inspection.status)}
                              </div>
                            </div>

                            {inspection.description && (
                              <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{formatText(inspection.description)}</p>
                            )}

                            {inspection.defects && (
                              <div className="text-sm mb-2">
                                <div className="font-medium text-red-600 mb-1">
                                  {t.technicalSupervision?.defects || 'Замечания'}:
                                </div>
                                <div className="text-gray-700 whitespace-pre-wrap">{formatText(inspection.defects)}</div>
                              </div>
                            )}

                            {inspection.risks && (
                              <div className="text-sm mb-2">
                                <div className="font-medium text-orange-600 mb-1">
                                  {t.technicalSupervision?.risks || 'Риски'}:
                                </div>
                                <div className="text-gray-700 whitespace-pre-wrap">{formatText(inspection.risks)}</div>
                              </div>
                            )}

                            {inspection.recommendations && (
                              <div className="text-sm mb-2">
                                <div className="font-medium text-green-600 mb-1">
                                  {t.technicalSupervision?.recommendations || 'Рекомендации'}:
                                </div>
                                <div className="text-gray-700 whitespace-pre-wrap">{formatText(inspection.recommendations)}</div>
                              </div>
                            )}

                            {inspection.images && inspection.images.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Camera className="h-3 w-3" />
                                  {t.technicalSupervision?.photos || 'Фотографии'} ({inspection.images.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {inspection.images.slice(0, 6).map((url, index) => (
                                    <img
                                      key={index}
                                      src={url}
                                      alt={`${inspection.title} ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => openImageViewer(inspection.images, index, inspection.title)}
                                    />
                                  ))}
                                  {inspection.images.length > 6 && (
                                    <button
                                      onClick={() => openImageViewer(inspection.images, 6, inspection.title)}
                                      className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center text-xs hover:bg-gray-200 transition-colors"
                                    >
                                      +{inspection.images.length - 6}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                              {t.technicalSupervision?.created || 'Создано'}: {inspection.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 md:p-6 px-4 text-center text-gray-500">
                      <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm">
                        {t.technicalSupervision?.noInspectionsInSection || 'Обследований в данном разделе пока нет'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Пустое состояние */}
        {sections.length === 0 && (
          <Card className="text-center py-12 mx-4 md:mx-0">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.technicalSupervision?.noSections || 'Нет разделов'}
              </h3>
              <p className="text-gray-600">
                {t.technicalSupervision?.noSectionsInProject || 'В данном проекте пока нет разделов технического надзора'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Информация о проекте */}
        <Card className="mt-8 mx-4 md:mx-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {t.technicalSupervision?.projectInfo || 'Информация о проекте'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">
              {t.technicalSupervision?.projectCreated || 'Проект создан'}: {project.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}
            </div>
            {project.updatedAt && (
              <div className="text-xs text-gray-500 mt-1">
                {t.technicalSupervision?.lastUpdated || 'Последнее обновление'}: {project.updatedAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Просмотрщик изображений */}
      <TechnicalSupervisionImageViewer
        images={viewerImages}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        initialIndex={viewerInitialIndex}
        inspectionTitle={viewerTitle}
      />
    </div>
  );
};

export default PublicTechnicalSupervision;
