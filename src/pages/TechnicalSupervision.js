import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  Timestamp,
  orderBy,
  query 
} from 'firebase/firestore';
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from '../utils/firebaseStorage';
import { showError, showSuccess } from '../utils/notifications';
import { convertPdfToImages } from '../utils/pdfUtils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  X, 
  Eye,
  FileText,
  Camera,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Clock
} from 'lucide-react';

import imageCompression from 'browser-image-compression';
import TechnicalSupervisionImageViewer from '../components/TechnicalSupervisionImageViewer';

const TechnicalSupervision = () => {
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  // Состояния
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [viewerTitle, setViewerTitle] = useState('');

  // Формы
  const [projectForm, setProjectForm] = useState({ name: '', description: '', address: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [inspectionForm, setInspectionForm] = useState({
    title: '',
    location: '',
    description: '',
    defects: '',
    risks: '',
    recommendations: '',
    status: 'pending',
    images: []
  });

  // Загрузка данных
  useEffect(() => {
    if (role === 'admin') {
      loadData();
    }
  }, [role]);

  // Проверка доступа - только для админов
  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                {t.technicalSupervision?.accessDenied || 'Доступ запрещен'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t.technicalSupervision?.adminOnlyAccess || 'Раздел "Технадзор" доступен только администраторам'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загрузка проектов
      const projectsQuery = query(
        collection(db, 'technicalSupervisionProjects'),
        orderBy('createdAt', 'desc')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Загрузка разделов
      const sectionsQuery = query(
        collection(db, 'technicalSupervisionSections'),
        orderBy('createdAt', 'asc')
      );
      const sectionsSnapshot = await getDocs(sectionsQuery);
      const sectionsData = sectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Загрузка обследований
      const inspectionsQuery = query(
        collection(db, 'technicalSupervisionInspections'),
        orderBy('createdAt', 'desc')
      );
      const inspectionsSnapshot = await getDocs(inspectionsQuery);
      const inspectionsData = inspectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProjects(projectsData);
      setSections(sectionsData);
      setInspections(inspectionsData);
    } catch (error) {
      console.error('Ошибка загрузки данных технадзора:', error);
    } finally {
      setLoading(false);
    }
  };

  // Управление проектами
  const handleCreateProject = async () => {
    try {
      if (!projectForm.name.trim()) return;

      const newProject = {
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
        address: projectForm.address.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'technicalSupervisionProjects'), newProject);
      setProjects(prev => [{ id: docRef.id, ...newProject }, ...prev]);
      setProjectForm({ name: '', description: '', address: '' });
      setShowProjectModal(false);
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
    }
  };

  const handleUpdateProject = async () => {
    try {
      if (!selectedProject || !projectForm.name.trim()) return;

      const updateData = {
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
        address: projectForm.address.trim(),
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'technicalSupervisionProjects', selectedProject.id), updateData);
      setProjects(prev => prev.map(project => 
        project.id === selectedProject.id 
          ? { ...project, ...updateData }
          : project
      ));
      
      setProjectForm({ name: '', description: '', address: '' });
      setSelectedProject(null);
      setShowProjectModal(false);
    } catch (error) {
      console.error('Ошибка обновления проекта:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      // Проверяем есть ли разделы в этом проекте
      const projectSections = sections.filter(section => section.projectId === projectId);
      if (projectSections.length > 0) {
        alert(t.technicalSupervision?.projectHasSections || 'Нельзя удалить проект, в котором есть разделы');
        return;
      }

      await deleteDoc(doc(db, 'technicalSupervisionProjects', projectId));
      setProjects(prev => prev.filter(project => project.id !== projectId));
    } catch (error) {
      console.error('Ошибка удаления проекта:', error);
    }
  };

  // Управление разделами
  const handleCreateSection = async () => {
    try {
      if (!sectionForm.name.trim() || !selectedProject) return;

      const newSection = {
        name: sectionForm.name.trim(),
        description: sectionForm.description.trim(),
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'technicalSupervisionSections'), newSection);
      setSections(prev => [...prev, { id: docRef.id, ...newSection }]);
      setSectionForm({ name: '', description: '' });
      setShowSectionModal(false);
    } catch (error) {
      console.error('Ошибка создания раздела:', error);
    }
  };

  const handleUpdateSection = async () => {
    try {
      if (!selectedSection || !sectionForm.name.trim()) return;

      const updateData = {
        name: sectionForm.name.trim(),
        description: sectionForm.description.trim(),
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'technicalSupervisionSections', selectedSection.id), updateData);
      setSections(prev => prev.map(section => 
        section.id === selectedSection.id 
          ? { ...section, ...updateData }
          : section
      ));
      
      setSectionForm({ name: '', description: '' });
      setSelectedSection(null);
      setShowSectionModal(false);
    } catch (error) {
      console.error('Ошибка обновления раздела:', error);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      // Проверяем есть ли обследования в этом разделе
      const sectionInspections = inspections.filter(insp => insp.sectionId === sectionId);
      if (sectionInspections.length > 0) {
        alert(t.technicalSupervision?.sectionHasInspections || 'Нельзя удалить раздел, в котором есть обследования');
        return;
      }

      await deleteDoc(doc(db, 'technicalSupervisionSections', sectionId));
      setSections(prev => prev.filter(section => section.id !== sectionId));
    } catch (error) {
      console.error('Ошибка удаления раздела:', error);
    }
  };

  // Управление обследованиями
  const handleCreateInspection = async () => {
    try {
      if (!inspectionForm.title.trim() || !selectedSection) return;

      const newInspection = {
        ...inspectionForm,
        title: inspectionForm.title.trim(),
        sectionId: selectedSection.id,
        sectionName: selectedSection.name,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'technicalSupervisionInspections'), newInspection);
      setInspections(prev => [{ id: docRef.id, ...newInspection }, ...prev]);
      
      resetInspectionForm();
      setShowInspectionModal(false);
    } catch (error) {
      console.error('Ошибка создания обследования:', error);
    }
  };

  const handleUpdateInspection = async () => {
    try {
      if (!selectedInspection || !inspectionForm.title.trim()) return;

      const updateData = {
        ...inspectionForm,
        title: inspectionForm.title.trim(),
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'technicalSupervisionInspections', selectedInspection.id), updateData);
      setInspections(prev => prev.map(inspection => 
        inspection.id === selectedInspection.id 
          ? { ...inspection, ...updateData }
          : inspection
      ));
      
      resetInspectionForm();
      setSelectedInspection(null);
      setShowInspectionModal(false);
    } catch (error) {
      console.error('Ошибка обновления обследования:', error);
    }
  };

  const handleDeleteInspection = async (inspectionId) => {
    try {
      const inspection = inspections.find(insp => insp.id === inspectionId);
      
      // Удаляем все связанные изображения
      if (inspection?.images?.length > 0) {
        for (const imageUrl of inspection.images) {
          try {
            await deleteFileFromFirebaseStorage(imageUrl);
          } catch (error) {
            console.error('Ошибка удаления изображения:', error);
          }
        }
      }

      await deleteDoc(doc(db, 'technicalSupervisionInspections', inspectionId));
      setInspections(prev => prev.filter(inspection => inspection.id !== inspectionId));
    } catch (error) {
      console.error('Ошибка удаления обследования:', error);
    }
  };

  // Функция для принудительной конвертации в JPEG (как в других компонентах проекта)
  const convertToJpeg = async (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        const maxDimension = 1280;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const jpegFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg'
          });
          resolve(jpegFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Загрузка изображений
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    
    input.onchange = async (event) => {
      const files = Array.from(event.target.files);
      if (!files.length) return;

      setUploadingImages(true);
      
      try {
        const compressionOptions = {
          maxSizeMB: 10,
          useWebWorker: true,
          fileType: 'image/jpeg',
          maxWidthOrHeight: 1280,
          initialQuality: 0.8
        };

        const processedFiles = [];
        
        for (let file of files) {
          if (file.type === "application/pdf") {
            // PDF -> конвертация в изображения
            const pageBlobs = await convertPdfToImages(file);
            for (let blob of pageBlobs) {
              // Принудительно конвертируем в JPEG
              const jpegFile = await convertToJpeg(blob);
              const compressedFile = await imageCompression(jpegFile, compressionOptions);
              processedFiles.push(compressedFile);
            }
          } else {
            // Обычное изображение - принудительно конвертируем в JPEG
            const jpegFile = await convertToJpeg(file);
            const compressedFile = await imageCompression(jpegFile, compressionOptions);
            processedFiles.push(compressedFile);
          }
        }

        const uploadPromises = processedFiles.map(file => 
          uploadToFirebaseStorageInFolder(file, 'technical-supervision/images')
        );

        const urls = await Promise.all(uploadPromises);
        
        setInspectionForm(prev => ({
          ...prev,
          images: [...prev.images, ...urls]
        }));

        showSuccess(t.technicalSupervision?.photosUploadSuccess || 'Фотографии загружены успешно');
      } catch (error) {
        console.error('Ошибка загрузки изображений:', error);
        showError(t.technicalSupervision?.photosUploadError || 'Ошибка загрузки фотографий');
      } finally {
        setUploadingImages(false);
      }
    };
    
    input.click();
  };

  const removeImage = async (imageUrl, index) => {
    try {
      // Удаляем из Firebase Storage
      await deleteFileFromFirebaseStorage(imageUrl);
      
      // Удаляем из формы
      setInspectionForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
    }
  };

  const resetInspectionForm = () => {
    setInspectionForm({
      title: '',
      location: '',
      description: '',
      defects: '',
      risks: '',
      recommendations: '',
      status: 'pending',
      images: []
    });
  };

  // Открытие просмотрщика изображений
  const openImageViewer = (images, initialIndex, title) => {
    setViewerImages(images);
    setViewerInitialIndex(initialIndex);
    setViewerTitle(title);
    setImageViewerOpen(true);
  };

  // Вспомогательные функции
  const openProjectModal = (project = null) => {
    if (project) {
      setProjectForm({ 
        name: project.name, 
        description: project.description || '', 
        address: project.address || '' 
      });
      setSelectedProject(project);
    } else {
      setProjectForm({ name: '', description: '', address: '' });
      setSelectedProject(null);
    }
    setShowProjectModal(true);
  };

  const openSectionModal = (section = null) => {
    if (section) {
      setSectionForm({ name: section.name, description: section.description || '' });
      setSelectedSection(section);
    } else {
      setSectionForm({ name: '', description: '' });
      setSelectedSection(null);
    }
    setShowSectionModal(true);
  };

  const openInspectionModal = (inspection = null) => {
    if (inspection) {
      setInspectionForm(inspection);
      setSelectedInspection(inspection);
    } else {
      resetInspectionForm();
      setSelectedInspection(null);
    }
    setShowInspectionModal(true);
  };

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t.common?.loading || 'Загрузка...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {t.technicalSupervision?.title || 'Технический надзор'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.technicalSupervision?.subtitle || 'Управление отчетами технического надзора строительных объектов'}
          </p>
          {selectedProject && (
            <div className="flex items-center gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedProject(null)}
              >
                ← {t.technicalSupervision?.backToProjects || 'Назад к проектам'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t.technicalSupervision?.currentProject || 'Текущий проект'}: <strong>{selectedProject.name}</strong>
              </span>
            </div>
          )}
        </div>
        {!selectedProject ? (
          <Button onClick={() => openProjectModal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t.technicalSupervision?.addProject || 'Добавить проект'}
          </Button>
        ) : (
          <Button onClick={() => openSectionModal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t.technicalSupervision?.addSection || 'Добавить раздел'}
          </Button>
        )}
      </div>

      {/* Проекты или разделы */}
      {!selectedProject ? (
        /* Список проектов */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {projects.map(project => {
            const projectSections = sections.filter(section => section.projectId === project.id);
            const projectInspections = inspections.filter(insp => 
              projectSections.some(section => section.id === insp.sectionId)
            );
            const criticalCount = projectInspections.filter(insp => insp.status === 'critical').length;
            const completedCount = projectInspections.filter(insp => insp.status === 'completed').length;

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => setSelectedProject(project)}>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.address}
                        </p>
                      )}
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProjectModal(project);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => setSelectedProject(project)}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>{t.technicalSupervision?.totalSections || 'Всего разделов'}: {projectSections.length}</span>
                      {criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {t.technicalSupervision?.critical || 'Критично'}: {criticalCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{t.technicalSupervision?.totalInspections || 'Всего обследований'}: {projectInspections.length}</span>
                      <span>{t.technicalSupervision?.completed || 'Завершено'}: {completedCount}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t.technicalSupervision?.created || 'Создано'}: {project.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Разделы выбранного проекта */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sections.filter(section => section.projectId === selectedProject.id).map(section => {
            const sectionInspections = inspections.filter(insp => insp.sectionId === section.id);
            const criticalCount = sectionInspections.filter(insp => insp.status === 'critical').length;
            const completedCount = sectionInspections.filter(insp => insp.status === 'completed').length;

            return (
              <Card key={section.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSectionModal(section)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>{t.technicalSupervision?.totalInspections || 'Всего обследований'}: {sectionInspections.length}</span>
                      {criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {t.technicalSupervision?.critical || 'Критично'}: {criticalCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{t.technicalSupervision?.completed || 'Завершено'}: {completedCount}</span>
                      <span>{t.technicalSupervision?.inProgress || 'В процессе'}: {sectionInspections.length - completedCount}</span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSection(section);
                          openInspectionModal();
                        }}
                        className="flex-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {t.technicalSupervision?.addInspection || 'Добавить обследование'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Список обследований */}
      {selectedSection && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t.technicalSupervision?.inspectionsIn || 'Обследования в разделе'}: {selectedSection.name}
              </CardTitle>
              <Button variant="ghost" onClick={() => setSelectedSection(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inspections
                .filter(inspection => inspection.sectionId === selectedSection.id)
                .map(inspection => (
                  <Card key={inspection.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{inspection.title}</h4>
                          {inspection.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {inspection.location}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(inspection.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openInspectionModal(inspection)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInspection(inspection.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {inspection.description && (
                        <p className="text-sm mb-2">{inspection.description}</p>
                      )}

                      {inspection.defects && (
                        <div className="text-sm mb-2">
                          <span className="font-medium text-red-600">{t.technicalSupervision?.defects || 'Замечания'}: </span>
                          {inspection.defects}
                        </div>
                      )}

                      {inspection.risks && (
                        <div className="text-sm mb-2">
                          <span className="font-medium text-orange-600">{t.technicalSupervision?.risks || 'Риски'}: </span>
                          {inspection.risks}
                        </div>
                      )}

                      {inspection.recommendations && (
                        <div className="text-sm mb-2">
                          <span className="font-medium text-green-600">{t.technicalSupervision?.recommendations || 'Рекомендации'}: </span>
                          {inspection.recommendations}
                        </div>
                      )}

                      {inspection.images && inspection.images.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {t.technicalSupervision?.photos || 'Фотографии'} ({inspection.images.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {inspection.images.slice(0, 3).map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`${inspection.title} ${index + 1}`}
                                className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openImageViewer(inspection.images, index, inspection.title)}
                              />
                            ))}
                            {inspection.images.length > 3 && (
                              <button
                                onClick={() => openImageViewer(inspection.images, 3, inspection.title)}
                                className="w-16 h-16 bg-muted rounded border flex items-center justify-center text-xs hover:bg-muted/80 transition-colors"
                              >
                                +{inspection.images.length - 3}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mt-3">
                        {t.technicalSupervision?.created || 'Создано'}: {inspection.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно для проектов */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {selectedProject 
                  ? (t.technicalSupervision?.editProject || 'Редактировать проект')
                  : (t.technicalSupervision?.createProject || 'Создать проект')
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectName">
                  {t.technicalSupervision?.projectName || 'Название проекта'}
                </Label>
                <Input
                  id="projectName"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.technicalSupervision?.projectNamePlaceholder || 'Например: ЖК Солнечный, Дом по ул. Пушкина'}
                />
              </div>
              
              <div>
                <Label htmlFor="projectAddress">
                  {t.technicalSupervision?.address || 'Адрес'} ({t.common?.optional || 'необязательно'})
                </Label>
                <Input
                  id="projectAddress"
                  value={projectForm.address}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t.technicalSupervision?.addressPlaceholder || 'Полный адрес объекта'}
                />
              </div>
              
              <div>
                <Label htmlFor="projectDescription">
                  {t.technicalSupervision?.description || 'Описание'} ({t.common?.optional || 'необязательно'})
                </Label>
                <Textarea
                  id="projectDescription"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.technicalSupervision?.projectDescriptionPlaceholder || 'Краткое описание проекта'}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={selectedProject ? handleUpdateProject : handleCreateProject}
                  disabled={!projectForm.name.trim()}
                  className="flex-1"
                >
                  {selectedProject 
                    ? (t.common?.save || 'Сохранить')
                    : (t.common?.create || 'Создать')
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1"
                >
                  {t.common?.cancel || 'Отмена'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Модальное окно для разделов */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {selectedSection 
                  ? (t.technicalSupervision?.editSection || 'Редактировать раздел')
                  : (t.technicalSupervision?.createSection || 'Создать раздел')
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sectionName">
                  {t.technicalSupervision?.sectionName || 'Название раздела'}
                </Label>
                <Input
                  id="sectionName"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.technicalSupervision?.sectionNamePlaceholder || 'Например: Фундамент, Стены, Электрика'}
                />
              </div>
              
              <div>
                <Label htmlFor="sectionDescription">
                  {t.technicalSupervision?.description || 'Описание'} ({t.common?.optional || 'необязательно'})
                </Label>
                <Textarea
                  id="sectionDescription"
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.technicalSupervision?.sectionDescriptionPlaceholder || 'Краткое описание раздела'}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={selectedSection ? handleUpdateSection : handleCreateSection}
                  disabled={!sectionForm.name.trim()}
                  className="flex-1"
                >
                  {selectedSection 
                    ? (t.common?.save || 'Сохранить')
                    : (t.common?.create || 'Создать')
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSectionModal(false)}
                  className="flex-1"
                >
                  {t.common?.cancel || 'Отмена'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Модальное окно для обследований */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {selectedInspection 
                  ? (t.technicalSupervision?.editInspection || 'Редактировать обследование')
                  : (t.technicalSupervision?.createInspection || 'Создать обследование')
                }
                {selectedSection && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    в разделе "{selectedSection.name}"
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspectionTitle">
                    {t.technicalSupervision?.inspectionTitle || 'Название обследования'}
                  </Label>
                  <Input
                    id="inspectionTitle"
                    value={inspectionForm.title}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={t.technicalSupervision?.inspectionTitlePlaceholder || 'Например: Штукатурка, Проводка'}
                  />
                </div>
                
                <div>
                  <Label htmlFor="inspectionLocation">
                    {t.technicalSupervision?.location || 'Расположение'}
                  </Label>
                  <Input
                    id="inspectionLocation"
                    value={inspectionForm.location}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t.technicalSupervision?.locationPlaceholder || 'Этаж, комната, участок'}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="inspectionDescription">
                  {t.technicalSupervision?.description || 'Описание'}
                </Label>
                <Textarea
                  id="inspectionDescription"
                  value={inspectionForm.description}
                  onChange={(e) => setInspectionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.technicalSupervision?.descriptionPlaceholder || 'Общее описание проведенного обследования'}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="inspectionDefects">
                  {t.technicalSupervision?.defects || 'Замечания и дефекты'}
                </Label>
                <Textarea
                  id="inspectionDefects"
                  value={inspectionForm.defects}
                  onChange={(e) => setInspectionForm(prev => ({ ...prev, defects: e.target.value }))}
                  placeholder={t.technicalSupervision?.defectsPlaceholder || 'Описание найденных дефектов и нарушений'}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="inspectionRisks">
                  {t.technicalSupervision?.risks || 'Риски и опасности'}
                </Label>
                <Textarea
                  id="inspectionRisks"
                  value={inspectionForm.risks}
                  onChange={(e) => setInspectionForm(prev => ({ ...prev, risks: e.target.value }))}
                  placeholder={t.technicalSupervision?.risksPlaceholder || 'Чем опасны найденные дефекты'}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="inspectionRecommendations">
                  {t.technicalSupervision?.recommendations || 'Рекомендации по устранению'}
                </Label>
                <Textarea
                  id="inspectionRecommendations"
                  value={inspectionForm.recommendations}
                  onChange={(e) => setInspectionForm(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder={t.technicalSupervision?.recommendationsPlaceholder || 'Как устранить найденные проблемы'}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="inspectionStatus">
                  {t.technicalSupervision?.status || 'Статус'}
                </Label>
                <select
                  id="inspectionStatus"
                  value={inspectionForm.status}
                  onChange={(e) => setInspectionForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="pending">{t.technicalSupervision?.statusPending || 'В ожидании'}</option>
                  <option value="in_progress">{t.technicalSupervision?.statusInProgress || 'В процессе'}</option>
                  <option value="completed">{t.technicalSupervision?.statusCompleted || 'Завершено'}</option>
                  <option value="critical">{t.technicalSupervision?.statusCritical || 'Критично'}</option>
                </select>
              </div>

              {/* Загрузка фотографий */}
              <div>
                <Label>{t.technicalSupervision?.photos || 'Фотографии'}</Label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onClick={handleImageUpload}
                    disabled={uploadingImages}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingImages 
                      ? (t.technicalSupervision?.uploading || 'Загрузка...')
                      : (t.technicalSupervision?.uploadPhotos || 'Загрузить фотографии')
                    }
                  </Button>
                  
                  {inspectionForm.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {inspectionForm.images.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`${inspectionForm.title} ${index + 1}`}
                            className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageViewer(inspectionForm.images, index, inspectionForm.title || 'Обследование')}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(url, index)}
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={selectedInspection ? handleUpdateInspection : handleCreateInspection}
                  disabled={!inspectionForm.title.trim() || (!selectedSection && !selectedInspection)}
                  className="flex-1"
                >
                  {selectedInspection 
                    ? (t.common?.save || 'Сохранить')
                    : (t.common?.create || 'Создать')
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInspectionModal(false)}
                  className="flex-1"
                >
                  {t.common?.cancel || 'Отмена'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Пустое состояние */}
      {!selectedProject && projects.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t.technicalSupervision?.noProjects || 'Нет проектов'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t.technicalSupervision?.noProjectsDescription || 'Создайте первый проект для начала работы с техническим надзором'}
            </p>
            <Button onClick={() => openProjectModal()}>
              <Plus className="h-4 w-4 mr-2" />
              {t.technicalSupervision?.createFirstProject || 'Создать первый проект'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Пустое состояние для разделов */}
      {selectedProject && sections.filter(s => s.projectId === selectedProject.id).length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t.technicalSupervision?.noSections || 'Нет разделов'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t.technicalSupervision?.noSectionsDescription || 'Создайте первый раздел для начала работы с техническим надзором'}
            </p>
            <Button onClick={() => openSectionModal()}>
              <Plus className="h-4 w-4 mr-2" />
              {t.technicalSupervision?.createFirstSection || 'Создать первый раздел'}
            </Button>
          </CardContent>
        </Card>
      )}

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

export default TechnicalSupervision;
