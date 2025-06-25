import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useCache } from "../CacheContext";

function PropertiesGallery() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [developerName, setDeveloperName] = useState(null);
  const { currentUser, role } = useAuth();
  const { getPropertiesList, propertiesCache } = useCache();

  // Безопасное отображение любых типов значений
  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Получение имени застройщика по ID
  const fetchDeveloperName = async (developerId) => {
    try {
      const developerDoc = await getDoc(doc(db, "developers", developerId));
      if (developerDoc.exists()) {
        return developerDoc.data().name;
      }
      return null;
    } catch (err) {
      console.error("Ошибка загрузки застройщика:", err);
      return null;
    }
  };

  // Загрузка данных из кеша или Firestore
  const fetchProperties = useCallback(async () => {
    try {
      // Если пользователь - застройщик, получаем его developerId из Firestore
      let developerNameToFilter = null;
      if (role === 'застройщик' && currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().developerId) {
          developerNameToFilter = await fetchDeveloperName(userDoc.data().developerId);
          setDeveloperName(developerNameToFilter);
        }
      }

      // Сначала проверяем кеш
      let data;
      if (propertiesCache.list?.data && Date.now() - propertiesCache.list.timestamp < 5 * 60 * 1000) {
        data = propertiesCache.list.data;
      } else {
        data = await getPropertiesList();
      }

      // Фильтруем объекты для застройщика
      let filteredData = data;
      if (role === 'застройщик' && developerNameToFilter) {
        filteredData = data.filter(property => property.developer === developerNameToFilter);
      }

      // Сортировка - новые сверху
      filteredData.sort((a, b) => {
        const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setProperties(filteredData);
    } catch (err) {
      console.error("Ошибка загрузки объектов:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, role, getPropertiesList, propertiesCache]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Форматирование цены в USD без копеек
  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Заголовок для застройщика */}
      {role === 'застройщик' && developerName && (
        <div className="max-w-lg mx-auto p-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Объекты застройщика: {developerName}
          </h1>
        </div>
      )}

      {/* Список компактных карточек */}
      <div className="divide-y max-w-lg mx-auto">
        {properties.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {role === 'застройщик' 
              ? "У вас пока нет объектов в системе"
              : "Объекты не найдены"}
          </div>
        ) : (
          properties.map((p) => (
            <Link
              key={p.id}
              to={`/property/${p.id}`}
              className="flex items-stretch gap-4 p-4 cursor-pointer hover:bg-gray-50"
            >
              {/* Изображение */}
              <div className="relative w-48 h-32 min-w-48 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                {p.images?.length ? (
                  <img
                    src={p.images[0]}
                    alt={safeDisplay(p.type)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Текстовая информация */}
              <div className="flex flex-col text-gray-900 space-y-0.5">
                <span className="text-lg font-semibold leading-none">
                  {formatPrice(p.price)}
                </span>
                {p.type && <span className="text-sm">{safeDisplay(p.type)}</span>}
                {p.area && <span className="text-sm">{safeDisplay(p.area)} м²</span>}
                {p.bedrooms !== undefined && p.bedrooms !== null && (
                  <span className="text-sm">
                    {p.bedrooms === 0 ? "Студия" : `Спален: ${safeDisplay(p.bedrooms)}`}
                  </span>
                )}
                {p.classRating && <span className="text-sm">{safeDisplay(p.classRating)}</span>}
                {p.district && <span className="text-sm">{safeDisplay(p.district)}</span>}
                {/* Показываем застройщика только для не-застройщиков */}
                {role !== 'застройщик' && p.developer && (
                  <span className="text-sm text-gray-600">
                    Застройщик: {safeDisplay(p.developer)}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default PropertiesGallery; 