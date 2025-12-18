import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  Video,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EducationLesson = () => {
  const { topicId, lessonId } = useParams();
  const { language } = useLanguage();
  const t = translations[language].education;
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTopicAndLesson = useCallback(async () => {
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
      
      // Загружаем урок
      const lessonDoc = await getDoc(doc(db, 'educationTopics', topicId, 'lessons', lessonId));
      if (!lessonDoc.exists()) {
        toast.error(t.lessonNotFound);
        navigate(`/education/topic/${topicId}`);
        return;
      }
      setLesson({ id: lessonDoc.id, ...lessonDoc.data() });
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast.error(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [topicId, lessonId, navigate, t.errorLoading, t.lessonNotFound, t.topicNotFound]);

  useEffect(() => {
    loadTopicAndLesson();
  }, [loadTopicAndLesson]);

  const getVideoUrlForLanguage = (lang) => {
    switch (lang) {
      case 'en':
        return lesson?.videoUrlEn;
      case 'ru':
        return lesson?.videoUrlRu;
      case 'id':
        return lesson?.videoUrlId;
      default:
        return lesson?.videoUrlEn || lesson?.videoUrlRu || lesson?.videoUrlId;
    }
  };

  const getLessonName = (lesson) => {
    switch (language) {
      case 'en':
        return lesson?.nameEn || lesson?.name || 'Untitled';
      case 'ru':
        return lesson?.nameRu || lesson?.name || 'Без названия';
      case 'id':
        return lesson?.nameId || lesson?.name || 'Tanpa Judul';
      default:
        return lesson?.nameEn || lesson?.nameRu || lesson?.nameId || lesson?.name || 'Untitled';
    }
  };

  const getLessonDescription = (lesson) => {
    switch (language) {
      case 'en':
        return lesson?.descriptionEn || lesson?.description || '';
      case 'ru':
        return lesson?.descriptionRu || lesson?.description || '';
      case 'id':
        return lesson?.descriptionId || lesson?.description || '';
      default:
        return lesson?.descriptionEn || lesson?.descriptionRu || lesson?.descriptionId || lesson?.description || '';
    }
  };

  const getTopicName = (topic) => {
    switch (language) {
      case 'en':
        return topic?.nameEn || topic?.name || 'Untitled';
      case 'ru':
        return topic?.nameRu || topic?.name || 'Без названия';
      case 'id':
        return topic?.nameId || topic?.name || 'Tanpa Judul';
      default:
        return topic?.nameEn || topic?.nameRu || topic?.nameId || topic?.name || 'Untitled';
    }
  };



  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Извлекаем ID видео из различных форматов YouTube URL
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Добавляем параметры для максимальной очистки интерфейса YouTube
        // controls=1 - показывать элементы управления
        // modestbranding=1 - скрыть логотип YouTube
        // rel=0 - не показывать связанные видео в конце
        // showinfo=0 - скрыть информацию о видео
        // iv_load_policy=3 - скрыть аннотации
        // cc_load_policy=0 - скрыть субтитры по умолчанию
        // fs=1 - разрешить полноэкранный режим
        // disablekb=1 - отключить управление с клавиатуры
        // autohide=1 - скрыть элементы управления после паузы
        // color=white - белый цвет элементов управления
        // theme=light - светлая тема
        // loop=0 - не зацикливать видео
        // playlist=${match[1]} - для совместимости с loop
        return `https://www.youtube.com/embed/${match[1]}?controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&cc_load_policy=0&fs=1&disablekb=1&autohide=1&color=white&theme=light&loop=0&playlist=${match[1]}`;
      }
    }
    
    return null;
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-2 text-muted-foreground">{t.loading}</span>
      </div>
    );
  }

  if (!topic || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t.lessonNotFound}</h3>
          <Button onClick={() => navigate(`/education/topic/${topicId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToLessons}
          </Button>
        </div>
      </div>
    );
  }

  const currentVideoUrl = getVideoUrlForLanguage(language);
  const embedUrl = getYouTubeEmbedUrl(currentVideoUrl);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(`/education/topic/${topicId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToLessons}
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            {getLessonName(lesson)}
          </h1>
          <p className="text-muted-foreground mt-2">
            {getTopicName(topic)} • {t.lessons}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Основной контент */}
        <div className="lg:col-span-2 space-y-6">
          {/* Видео */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {t.watchVideo}
                </CardTitle>
                <Badge variant="secondary">#{lesson.order}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {embedUrl ? (
                <div className="aspect-video w-full relative">
                  <iframe
                    src={embedUrl}
                    title={lesson.name}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      // Дополнительные стили для скрытия элементов YouTube
                      pointerEvents: 'auto'
                    }}
                  ></iframe>
                  {/* CSS для скрытия элементов YouTube */}
                  <style jsx>{`
                    iframe {
                      position: relative;
                      z-index: 1;
                    }
                    /* Скрываем возможные оверлеи YouTube */
                    iframe::before,
                    iframe::after {
                      display: none !important;
                    }
                  `}</style>
                </div>
              ) : (
                <div className="aspect-video w-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t.videoNotAvailable}</h3>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Описание */}
          {getLessonDescription(lesson) && (
            <Card>
              <CardHeader>
                <CardTitle>{t.lessonDescriptionSection}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {getLessonDescription(lesson)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">

          {/* Информация об уроке */}
          <Card>
            <CardHeader>
              <CardTitle>{t.infoSection}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.topicName || 'Тема'}:</span>
                <p className="text-sm">{getTopicName(topic)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.order || 'Порядок'}:</span>
                <p className="text-sm">#{lesson.order}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.createdAt}:</span>
                <p className="text-sm">
                  {lesson.createdAt?.toDate ? 
                    lesson.createdAt.toDate().toLocaleDateString(language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'ru-RU') : 
                    new Date(lesson.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'ru-RU')
                  }
                </p>
              </div>
              {lesson.updatedAt && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.updatedAt}:</span>
                  <p className="text-sm">
                    {lesson.updatedAt?.toDate ? 
                      lesson.updatedAt.toDate().toLocaleDateString(language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'ru-RU') : 
                      new Date(lesson.updatedAt).toLocaleDateString(language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'ru-RU')
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Навигация */}
          <Card>
            <CardHeader>
              <CardTitle>{t.navigationSection}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/education/topic/${topicId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.backToLessons}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/education')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t.backToTopics}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EducationLesson; 