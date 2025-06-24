import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import {
  Bed,
  Ruler,
  Home,
  Star,
  Building2,
  MapPin,
  Hammer,
  FileText,
  Calendar,
  Droplet,
  Map as MapIcon,
} from "lucide-react";

function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "—";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDoc(doc(db, "properties", id));
        if (snap.exists()) {
          setProperty({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const getLatLng = () => {
    let lat = null;
    let lng = null;
    if (property.latitude && property.longitude) {
      lat = property.latitude;
      lng = property.longitude;
    } else if (property.coordinates) {
      const parts = String(property.coordinates).split(/[;,\s]+/).filter(Boolean);
      if (parts.length >= 2) {
        lat = parts[0];
        lng = parts[1];
      }
    }
    return lat && lng ? [lat, lng] : null;
  };

  const handleOpenMap = () => {
    const ll = getLatLng();
    if (!ll) return;
    const [lat, lng] = ll;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Объект не найден
      </div>
    );
  }

  const attributes = [
    {
      label: property.bedrooms === 0 ? "Студия" : "Спален",
      value: property.bedrooms === 0 ? "Студия" : safeDisplay(property.bedrooms),
      icon: Bed,
      show: property.bedrooms !== undefined,
    },
    {
      label: "Площадь",
      value: property.area ? `${safeDisplay(property.area)} м²` : "—",
      icon: Ruler,
      show: property.area,
    },
    {
      label: "Класс",
      value: safeDisplay(property.classRating),
      icon: Star,
      show: property.classRating,
    },
    {
      label: "Район",
      value: safeDisplay(property.district),
      icon: MapPin,
      show: property.district,
    },
    {
      label: "Тип постройки",
      value: safeDisplay(property.buildingType),
      icon: Home,
      show: property.buildingType,
    },
    {
      label: "Статус строительства",
      value: safeDisplay(property.status),
      icon: Hammer,
      show: property.status,
    },
    {
      label: "Статус земли",
      value: safeDisplay(property.landStatus),
      icon: MapPin,
      show: property.landStatus,
    },
    {
      label: "Бассейн",
      value: safeDisplay(property.pool),
      icon: Droplet,
      show: property.pool,
    },
    {
      label: "Собственность",
      value: property.ownershipForm ? `${property.ownershipForm}${property.leaseYears ? ` ${property.leaseYears} лет` : ""}` : "—",
      icon: FileText,
      show: property.ownershipForm,
    },
    {
      label: "Дата завершения",
      value: safeDisplay(property.completionDate),
      icon: Calendar,
      show: property.completionDate,
    },
  ].filter((a) => a.show);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Мобильная горизонтальная галерея */}
      {property.images?.length ? (
        <div className="md:hidden overflow-x-auto flex pb-4 -mx-4 px-4 mb-4 snap-x snap-mandatory">
          {property.images.map((url, idx) => (
            <div
              key={idx}
              className="flex-none w-full h-56 rounded-xl overflow-hidden bg-gray-200 snap-center mr-4 last:mr-0"
              style={{ scrollSnapAlign: "center" }}
            >
              <img onClick={() => { setCurrentImg(idx); setLightbox(true); }} src={url} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover cursor-pointer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="md:hidden w-full h-56 rounded-xl overflow-hidden mb-4 bg-gray-200 flex items-center justify-center text-gray-400">
          <Building2 className="w-12 h-12" />
        </div>
      )}

      {/* Десктопный слайдер */}
      {property.images?.length ? (
        <div className="hidden md:block relative mb-4 group">
          <div className="w-full h-72 rounded-xl overflow-hidden bg-gray-200">
            <img
              src={property.images[currentImg]}
              alt={`Фото ${currentImg + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightbox(true)}
            />
          </div>
          {/* Prev */}
          {currentImg > 0 && (
            <button
              onClick={() => setCurrentImg((i) => i - 1)}
              className="hidden md:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition"
            >
              ◀
            </button>
          )}
          {/* Next */}
          {currentImg < property.images.length - 1 && (
            <button
              onClick={() => setCurrentImg((i) => i + 1)}
              className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition"
            >
              ▶
            </button>
          )}
        </div>
      ) : (
        <div className="hidden md:flex w-full h-72 rounded-xl overflow-hidden mb-4 bg-gray-200 items-center justify-center text-gray-400">
          <Building2 className="w-12 h-12" />
        </div>
      )}

      {/* Цена и кнопка "на карте" в одной строке */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl font-semibold text-gray-600">
          {formatPrice(property.price)}
        </div>

        {getLatLng() && (
          <button
            onClick={handleOpenMap}
            className="flex flex-col items-center text-blue-600 hover:underline"
          >
            <MapIcon className="w-6 h-6 mb-1 fill-blue-600 text-blue-600" />
            <span className="text-xs">на карте</span>
          </button>
        )}
      </div>

      {/* Тип */}
      {property.type && (
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {safeDisplay(property.type)}
        </h2>
      )}

      {/* Сетка характеристик */}
      <div className="grid grid-cols-2 gap-4">
        {attributes.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 leading-none mb-1">{label}</div>
              <div className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <div className="relative max-w-screen max-h-screen flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={property.images[currentImg]} alt="full" className="max-w-full max-h-full object-contain" />

            {currentImg > 0 && (
              <button onClick={() => setCurrentImg((i) => i - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl">◀</button>
            )}
            {currentImg < property.images.length - 1 && (
              <button onClick={() => setCurrentImg((i) => i + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl">▶</button>
            )}
            <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white text-3xl">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetail; 