import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Play,
  ArrowLeft,
  BookOpen,
  Video,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

const EducationTopic = () => {
  const { topicId } = useParams();
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].education;
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonNameEn, setLessonNameEn] = useState('');
  const [lessonNameRu, setLessonNameRu] = useState('');
  const [lessonNameId, setLessonNameId] = useState('');
  const [lessonDescriptionEn, setLessonDescriptionEn] = useState('');
  const [lessonDescriptionRu, setLessonDescriptionRu] = useState('');
  const [lessonDescriptionId, setLessonDescriptionId] = useState('');
  const [videoUrlEn, setVideoUrlEn] = useState('');
  const [videoUrlRu, setVideoUrlRu] = useState('');
  const [videoUrlId, setVideoUrlId] = useState('');
  const [lessonOrder, setLessonOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  const canEdit = role === 'admin' || role === 'moderator';

  const loadTopicAndLessons = useCallback(async () => {
    try {
      setLoading(true);
      
      // Загружаем тему
      const topicDoc = await getDoc(doc(db, 'educationTopics', topicId));
      if (!topicDoc.exists()) {
        toast.error(t.topicNotFound);
        navigate('/education');
        return;
      }
      setTopic({ id: topicDoc.id, ...topicDoc.data() });
      
      // Загружаем уроки
      const lessonsQuery = query(
        collection(db, 'educationTopics', topicId, 'lessons'), 
        orderBy('order', 'asc')
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lessonsData = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLessons(lessonsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast.error(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [topicId, navigate, t.errorLoading]);

  useEffect(() => {
    loadTopicAndLessons();
  }, [loadTopicAndLessons]);

  const handleCreateLesson = async () => {
    if (!lessonNameEn.trim() && !lessonNameRu.trim() && !lessonNameId.trim()) {
      toast.error(t.enterLessonName);
      return;
    }

    if (!videoUrlEn && !videoUrlRu && !videoUrlId) {
      toast.error(t.addVideoUrl);
      return;
    }

    try {
      setSaving(true);
      const newLesson = {
        nameEn: lessonNameEn.trim(),
        nameRu: lessonNameRu.trim(),
        nameId: lessonNameId.trim(),
        descriptionEn: lessonDescriptionEn.trim(),
        descriptionRu: lessonDescriptionRu.trim(),
        descriptionId: lessonDescriptionId.trim(),
        videoUrlEn: videoUrlEn.trim(),
        videoUrlRu: videoUrlRu.trim(),
        videoUrlId: videoUrlId.trim(),
        order: parseInt(lessonOrder) || 1,
        createdAt: new Date(),
        createdBy: role
      };
      
      await addDoc(collection(db, 'educationTopics', topicId, 'lessons'), newLesson);
      resetForm();
      setShowCreateDialog(false);
      toast.success(t.lessonCreated);
      loadTopicAndLessons();
    } catch (error) {
      console.error('Ошибка создания урока:', error);
      toast.error(t.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  const handleEditLesson = async () => {
    if (!lessonNameEn.trim() && !lessonNameRu.trim() && !lessonNameId.trim()) {
      toast.error(t.enterLessonName);
      return;
    }

    if (!videoUrlEn && !videoUrlRu && !videoUrlId) {
      toast.error(t.addVideoUrl);
      return;
    }

    try {
      setSaving(true);
      const lessonRef = doc(db, 'educationTopics', topicId, 'lessons', selectedLesson.id);
      await updateDoc(lessonRef, {
        nameEn: lessonNameEn.trim(),
        nameRu: lessonNameRu.trim(),
        nameId: lessonNameId.trim(),
        descriptionEn: lessonDescriptionEn.trim(),
        descriptionRu: lessonDescriptionRu.trim(),
        descriptionId: lessonDescriptionId.trim(),
        videoUrlEn: videoUrlEn.trim(),
        videoUrlRu: videoUrlRu.trim(),
        videoUrlId: videoUrlId.trim(),
        order: parseInt(lessonOrder) || 1,
        updatedAt: new Date()
      });
      
      setShowEditDialog(false);
      setSelectedLesson(null);
      resetForm();
      toast.success(t.lessonUpdated);
      loadTopicAndLessons();
    } catch (error) {
      console.error('Ошибка обновления урока:', error);
      toast.error(t.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async () => {
    try {
      setSaving(true);
      await deleteDoc(doc(db, 'educationTopics', topicId, 'lessons', selectedLesson.id));
      setShowDeleteDialog(false);
      setSelectedLesson(null);
      toast.success(t.lessonDeleted);
      loadTopicAndLessons();
    } catch (error) {
      console.error('Ошибка удаления урока:', error);
      toast.error(t.errorDeleting);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setLessonNameEn('');
    setLessonNameRu('');
    setLessonNameId('');
    setLessonDescriptionEn('');
    setLessonDescriptionRu('');
    setLessonDescriptionId('');
    setVideoUrlEn('');
    setVideoUrlRu('');
    setVideoUrlId('');
    setLessonOrder(1);
  };

  const openEditDialog = (lesson) => {
    setSelectedLesson(lesson);
    setLessonNameEn(lesson.nameEn || '');
    setLessonNameRu(lesson.nameRu || '');
    setLessonNameId(lesson.nameId || '');
    setLessonDescriptionEn(lesson.descriptionEn || '');
    setLessonDescriptionRu(lesson.descriptionRu || '');
    setLessonDescriptionId(lesson.descriptionId || '');
    setVideoUrlEn(lesson.videoUrlEn || '');
    setVideoUrlRu(lesson.videoUrlRu || '');
    setVideoUrlId(lesson.videoUrlId || '');
    setLessonOrder(lesson.order || 1);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (lesson) => {
    setSelectedLesson(lesson);
    setShowDeleteDialog(true);
  };

  const openLesson = (lessonId) => {
    navigate(`/education/lesson/${topicId}/${lessonId}`);
  };

  const getVideoUrlForLanguage = (lesson) => {
    switch (language) {
      case 'en':
        return lesson.videoUrlEn;
      case 'ru':
        return lesson.videoUrlRu;
      case 'id':
        return lesson.videoUrlId;
      default:
        return lesson.videoUrlEn || lesson.videoUrlRu || lesson.videoUrlId;
    }
  };

  const getLessonName = (lesson) => {
    switch (language) {
      case 'en':
        return lesson.nameEn || lesson.name || 'Untitled';
      case 'ru':
        return lesson.nameRu || lesson.name || 'Без названия';
      case 'id':
        return lesson.nameId || lesson.name || 'Tanpa Judul';
      default:
        return lesson.nameEn || lesson.nameRu || lesson.nameId || lesson.name || 'Untitled';
    }
  };

  const getLessonDescription = (lesson) => {
    switch (language) {
      case 'en':
        return lesson.descriptionEn || lesson.description || '';
      case 'ru':
        return lesson.descriptionRu || lesson.description || '';
      case 'id':
        return lesson.descriptionId || lesson.description || '';
      default:
        return lesson.descriptionEn || lesson.descriptionRu || lesson.descriptionId || lesson.description || '';
    }
  };

  const hasVideoForLanguage = (lesson) => {
    const url = getVideoUrlForLanguage(lesson);
    return url && url.trim() !== '';
  };

  const getTopicName = (topic) => {
    switch (language) {
      case 'en':
        return topic.nameEn || topic.name || 'Untitled';
      case 'ru':
        return topic.nameRu || topic.name || 'Без названия';
      case 'id':
        return topic.nameId || topic.name || 'Tanpa Judul';
      default:
        return topic.nameEn || topic.nameRu || topic.nameId || topic.name || 'Untitled';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-2 text-muted-foreground">{t.loading}</span>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t.topicNotFound}</h3>
          <Button onClick={() => navigate(`/education/section/${topic.sectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToTopics}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(`/education/section/${topic.sectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToTopics}
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              {getTopicName(topic)}
            </h1>
            <p className="text-muted-foreground mt-2">
              {lessons.length} {t.lessons}
            </p>
          </div>
        </div>
        
        {canEdit && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.createLesson}
          </Button>
        )}
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.noLessons}</h3>
            {canEdit && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.createLesson}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{getLessonName(lesson)}</CardTitle>
                  <Badge variant="secondary">#{lesson.order}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {getLessonDescription(lesson) && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {getLessonDescription(lesson)}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!hasVideoForLanguage(lesson) && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {t.videoNotAvailable}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openLesson(lesson.id)}
                      disabled={!hasVideoForLanguage(lesson)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {t.watchVideo}
                    </Button>
                    
                    {canEdit && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(lesson)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                    {role === 'admin' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDeleteDialog(lesson)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог создания урока */}
      <ConfirmDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title={t.createLesson}
        description="Создайте новый урок"
        confirmText={t.save}
        cancelText={t.cancel}
        onConfirm={handleCreateLesson}
        loading={saving}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="lessonNameEn">{t.lessonNameEn}</Label>
            <Input
              id="lessonNameEn"
              value={lessonNameEn}
              onChange={(e) => setLessonNameEn(e.target.value)}
              placeholder="Enter lesson name in English"
            />
          </div>
          <div>
            <Label htmlFor="lessonNameRu">{t.lessonNameRu}</Label>
            <Input
              id="lessonNameRu"
              value={lessonNameRu}
              onChange={(e) => setLessonNameRu(e.target.value)}
              placeholder="Введите название урока на русском"
            />
          </div>
          <div>
            <Label htmlFor="lessonNameId">{t.lessonNameId}</Label>
            <Input
              id="lessonNameId"
              value={lessonNameId}
              onChange={(e) => setLessonNameId(e.target.value)}
              placeholder="Masukkan nama pelajaran dalam bahasa Indonesia"
            />
          </div>
          <div>
            <Label htmlFor="lessonDescriptionEn">{t.lessonDescriptionEn}</Label>
            <Textarea
              id="lessonDescriptionEn"
              value={lessonDescriptionEn}
              onChange={(e) => setLessonDescriptionEn(e.target.value)}
              placeholder="Enter lesson description in English"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="lessonDescriptionRu">{t.lessonDescriptionRu}</Label>
            <Textarea
              id="lessonDescriptionRu"
              value={lessonDescriptionRu}
              onChange={(e) => setLessonDescriptionRu(e.target.value)}
              placeholder="Введите описание урока на русском"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="lessonDescriptionId">{t.lessonDescriptionId}</Label>
            <Textarea
              id="lessonDescriptionId"
              value={lessonDescriptionId}
              onChange={(e) => setLessonDescriptionId(e.target.value)}
              placeholder="Masukkan deskripsi pelajaran dalam bahasa Indonesia"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="videoUrlEn">{t.videoUrlEn}</Label>
            <Input
              id="videoUrlEn"
              value={videoUrlEn}
              onChange={(e) => setVideoUrlEn(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="videoUrlRu">{t.videoUrlRu}</Label>
            <Input
              id="videoUrlRu"
              value={videoUrlRu}
              onChange={(e) => setVideoUrlRu(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="videoUrlId">{t.videoUrlId}</Label>
            <Input
              id="videoUrlId"
              value={videoUrlId}
              onChange={(e) => setVideoUrlId(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="lessonOrder">{t.order}</Label>
            <Input
              id="lessonOrder"
              type="number"
              value={lessonOrder}
              onChange={(e) => setLessonOrder(e.target.value)}
              placeholder="1"
              min="1"
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* Диалог редактирования урока */}
      <ConfirmDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title={t.editLesson}
        description="Редактируйте урок"
        confirmText={t.save}
        cancelText={t.cancel}
        onConfirm={handleEditLesson}
        loading={saving}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="editLessonNameEn">{t.lessonNameEn}</Label>
            <Input
              id="editLessonNameEn"
              value={lessonNameEn}
              onChange={(e) => setLessonNameEn(e.target.value)}
              placeholder="Enter lesson name in English"
            />
          </div>
          <div>
            <Label htmlFor="editLessonNameRu">{t.lessonNameRu}</Label>
            <Input
              id="editLessonNameRu"
              value={lessonNameRu}
              onChange={(e) => setLessonNameRu(e.target.value)}
              placeholder="Введите название урока на русском"
            />
          </div>
          <div>
            <Label htmlFor="editLessonNameId">{t.lessonNameId}</Label>
            <Input
              id="editLessonNameId"
              value={lessonNameId}
              onChange={(e) => setLessonNameId(e.target.value)}
              placeholder="Masukkan nama pelajaran dalam bahasa Indonesia"
            />
          </div>
          <div>
            <Label htmlFor="editLessonDescriptionEn">{t.lessonDescriptionEn}</Label>
            <Textarea
              id="editLessonDescriptionEn"
              value={lessonDescriptionEn}
              onChange={(e) => setLessonDescriptionEn(e.target.value)}
              placeholder="Enter lesson description in English"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="editLessonDescriptionRu">{t.lessonDescriptionRu}</Label>
            <Textarea
              id="editLessonDescriptionRu"
              value={lessonDescriptionRu}
              onChange={(e) => setLessonDescriptionRu(e.target.value)}
              placeholder="Введите описание урока на русском"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="editLessonDescriptionId">{t.lessonDescriptionId}</Label>
            <Textarea
              id="editLessonDescriptionId"
              value={lessonDescriptionId}
              onChange={(e) => setLessonDescriptionId(e.target.value)}
              placeholder="Masukkan deskripsi pelajaran dalam bahasa Indonesia"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="editVideoUrlEn">{t.videoUrlEn}</Label>
            <Input
              id="editVideoUrlEn"
              value={videoUrlEn}
              onChange={(e) => setVideoUrlEn(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="editVideoUrlRu">{t.videoUrlRu}</Label>
            <Input
              id="editVideoUrlRu"
              value={videoUrlRu}
              onChange={(e) => setVideoUrlRu(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="editVideoUrlId">{t.videoUrlId}</Label>
            <Input
              id="editVideoUrlId"
              value={videoUrlId}
              onChange={(e) => setVideoUrlId(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="editLessonOrder">{t.order}</Label>
            <Input
              id="editLessonOrder"
              type="number"
              value={lessonOrder}
              onChange={(e) => setLessonOrder(e.target.value)}
              placeholder="1"
              min="1"
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* Диалог удаления урока */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t.deleteLesson}
        description={t.confirmDeleteLesson}
        confirmText="Удалить"
        cancelText={t.cancel}
        onConfirm={handleDeleteLesson}
        loading={saving}
        variant="destructive"
      />
    </div>
  );
};

export default EducationTopic; 