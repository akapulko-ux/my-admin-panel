import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, Check, Pencil, Eye, EyeOff, Plus } from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import toast from 'react-hot-toast';

function ListDevelopers() {
  const navigate = useNavigate();

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const { language } = useLanguage();
  const t = translations[language]?.developersList || translations.ru.developersList;

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
    async function loadDevelopers() {
      try {
        setLoading(true);

        // Считываем все документы из коллекции "developers"
        const snap = await getDocs(collection(db, "developers"));

        const devs = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          // Документ может содержать поля: { name, description, logo, ... }
          if (data.name && data.name.trim() !== "") {
            devs.push({
              id: docSnap.id, // чтобы знать, какой документ редактировать
              name: data.name,
              description: data.description || "",
              logo: data.logo || null,
              approved: data.approved || false,
              isHidden: data.isHidden || false
            });
          }
        });

        // Сортируем по алфавиту
        devs.sort((a, b) => a.name.localeCompare(b.name));

        setDevelopers(devs);
      } catch (error) {
        console.error("Ошибка при загрузке застройщиков:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDevelopers();
  }, []);

  // Функция для обновления статуса approved
  const handleToggleApproved = async (developerId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, "developers", developerId), {
        approved: newStatus
      });
      
      // Обновляем локальное состояние
      setDevelopers(prev => prev.map(dev => 
        dev.id === developerId 
          ? { ...dev, approved: newStatus }
          : dev
      ));
      
      showSuccess(newStatus ? "Застройщик проверен" : "Статус проверки снят");
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      showError("Ошибка при обновлении статуса");
    }
  };

  // Функция для массового переключения видимости застройщика и всех связанных объектов
  const handleToggleVisibility = async (developerId, currentHiddenStatus, developerName) => {
    try {
      const newHiddenStatus = !currentHiddenStatus;
      const batch = writeBatch(db);
      
      // Показываем загрузку
      toast.loading(newHiddenStatus ? 'Скрываем застройщика и все связанные объекты...' : 'Показываем застройщика и все связанные объекты...');
      
      // 1. Обновляем самого застройщика
      const developerRef = doc(db, "developers", developerId);
      batch.update(developerRef, { isHidden: newHiddenStatus });
      
      // 2. Находим и обновляем все комплексы этого застройщика
      const complexesQuery = query(
        collection(db, "complexes"),
        where("developerId", "==", developerId)
      );
      const complexesSnapshot = await getDocs(complexesQuery);
      const complexesByIdCount = complexesSnapshot.size;
      
      console.log(`Найдено комплексов по developerId "${developerId}":`, complexesByIdCount);
      
      complexesSnapshot.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, { isHidden: newHiddenStatus });
      });
      
      // 2.1. Также ищем комплексы по имени застройщика
      let complexesByNameCount = 0;
      if (developerName) {
        const complexesByNameQuery = query(
          collection(db, "complexes"),
          where("developer", "==", developerName)
        );
        const complexesByNameSnapshot = await getDocs(complexesByNameQuery);
        complexesByNameCount = complexesByNameSnapshot.size;
        
        console.log(`Найдено комплексов по имени "${developerName}":`, complexesByNameCount);
        
        complexesByNameSnapshot.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, { isHidden: newHiddenStatus });
        });
      }
      
      // 3. Находим и обновляем все объекты этого застройщика по developerId
      const propertiesByIdQuery = query(
        collection(db, "properties"),
        where("developerId", "==", developerId)
      );
      const propertiesByIdSnapshot = await getDocs(propertiesByIdQuery);
      const propertiesByIdCount = propertiesByIdSnapshot.size;
      
      console.log(`Найдено объектов по developerId "${developerId}":`, propertiesByIdCount);
      
      propertiesByIdSnapshot.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, { isHidden: newHiddenStatus });
      });
      
      // 4. Находим и обновляем все объекты этого застройщика по имени
      let propertiesByNameCount = 0;
      if (developerName) {
        const propertiesByNameQuery = query(
          collection(db, "properties"),
          where("developer", "==", developerName)
        );
        const propertiesByNameSnapshot = await getDocs(propertiesByNameQuery);
        propertiesByNameCount = propertiesByNameSnapshot.size;
        
        console.log(`Найдено объектов по имени "${developerName}":`, propertiesByNameCount);
        
        propertiesByNameSnapshot.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, { isHidden: newHiddenStatus });
        });
      }
      
      // Выполняем все обновления
      await batch.commit();
      
      // Подсчитываем общее количество обновленных записей
      const totalUpdated = 1 + complexesByIdCount + complexesByNameCount + propertiesByIdCount + propertiesByNameCount;
      
      // Обновляем локальное состояние
      setDevelopers(prev => prev.map(dev => 
        dev.id === developerId 
          ? { ...dev, isHidden: newHiddenStatus }
          : dev
      ));

      toast.dismiss();
      toast.success(
        newHiddenStatus 
          ? `Застройщик "${developerName}" и ${totalUpdated - 1} связанных записей скрыты из листинга`
          : `Застройщик "${developerName}" и ${totalUpdated - 1} связанных записей возвращены в листинг`
      );
      
    } catch (error) {
      console.error("Ошибка при обновлении видимости:", error);
      toast.dismiss();
      toast.error("Ошибка при обновлении видимости застройщика");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex justify-between items-center'} mb-8`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>{t.title}</h1>
        <Button 
          onClick={() => navigate("/developers/edit/new")}
          className={`${isMobile ? 'w-full h-12' : ''}`}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t.addDeveloper}
        </Button>
      </div>

      {/* Счетчик количества застройщиков */}
      <div className="text-sm text-gray-500 mb-4">
        {t.developersFound.replace('{count}', developers.length)}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : developers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">{t.noDevelopers}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developers.map((dev) => (
            <Card key={dev.id} className={`overflow-hidden relative transition-opacity duration-200 ${dev.isHidden ? 'opacity-50' : 'opacity-100'}`}>
              {/* Кнопка переключения видимости в левом верхнем углу */}
              <button
                onClick={() => handleToggleVisibility(dev.id, dev.isHidden, dev.name)}
                className={`absolute top-2 left-2 p-2 rounded-full transition-all duration-200 ${
                  dev.isHidden 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title={dev.isHidden ? "Показать застройщика и все связанные объекты" : "Скрыть застройщика и все связанные объекты"}
              >
                {dev.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              {/* Кнопка с галочкой в правом верхнем углу */}
              <button
                onClick={() => handleToggleApproved(dev.id, dev.approved)}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                  dev.approved 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 hover:bg-gray-400'
                }`}
                title={dev.approved ? "Снять проверку" : "Проверить застройщика"}
              >
                <Check className="w-4 h-4" />
              </button>
              
              <CardHeader className="space-y-4 pt-12">
                <div className="flex items-center space-x-4">
                  {dev.logo ? (
                    <img
                      src={dev.logo}
                      alt={dev.name}
                      className="w-16 h-16 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl">{dev.name}</CardTitle>
                    {dev.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {dev.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  className={`w-full ${isMobile ? 'h-12' : ''}`}
                  onClick={() => navigate(`/developers/edit/${dev.id}`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t.editDeveloper}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListDevelopers;