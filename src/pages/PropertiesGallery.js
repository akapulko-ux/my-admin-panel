import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";

function PropertiesGallery() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Безопасное отображение любых типов значений
  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Загрузка данных из Firestore
  const fetchProperties = async () => {
    try {
      const snapshot = await getDocs(collection(db, "properties"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Сортировка ‑ новые сверху
      data.sort((a, b) => {
        const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setProperties(data);
    } catch (err) {
      console.error("Ошибка загрузки объектов:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

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

  const handleClick = (id) => navigate(`/property/${id}`);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Список компактных карточек */}
      <div className="divide-y max-w-lg mx-auto">
        {properties.map((p) => (
          <div
            key={p.id}
            onClick={() => handleClick(p.id)}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PropertiesGallery; 