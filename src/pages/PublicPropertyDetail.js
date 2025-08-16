import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, addDoc, collection, serverTimestamp, getDocs, where, query } from "firebase/firestore";
import { Building2, Map as MapIcon, Home, Droplet, Star, Square, Flame, Sofa, Waves, Bed, Ruler, MapPin, Hammer, Layers, Bath, FileText, Calendar, DollarSign, Settings } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { useAuth } from "../AuthContext";
import {
  translateDistrict,
  translatePropertyType,
  translateAreaUnit,
  translateBuildingType,
  translateConstructionStatus,
  translateLandStatus,
  translatePoolStatus,
  translateOwnership,
  formatArea,
} from "../lib/utils";
import { showError, showSuccess } from "../utils/notifications";
import { Badge } from "../components/ui/badge";

function PublicPropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [roiPercent, setRoiPercent] = useState(null);
  const { language } = useLanguage();
  const t = translations[language];
  const { currentUser } = useAuth();
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSending, setLeadSending] = useState(false);

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

  // Функция для перехода к управлению объектом
  const handleManageProperty = () => {
    navigate(`/property/${id}`);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const ref = doc(db, "properties", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          // Подтягиваем имя комплекса, если нужно
          if (data.complexId) {
            try {
              const complexSnap = await getDoc(doc(db, "complexes", data.complexId));
              if (complexSnap.exists()) {
                data.complexName = complexSnap.data().name;
              }
            } catch {}
          }
          // Подтягиваем ROI, если сохранен
          try {
            const roiSnap = await getDoc(doc(db, "properties", id, "calculations", "roi"));
            if (roiSnap.exists()) {
              const r = roiSnap.data();
              const savedRoi = r?.results?.roi;
              if (typeof savedRoi === 'number' && !isNaN(savedRoi)) {
                setRoiPercent(savedRoi);
              }
            }
          } catch {}

          // Подтягиваем статус проверки застройщика (для публичного бейджа)
          try {
            if (data.developerId) {
              const devDoc = await getDoc(doc(db, "developers", data.developerId));
              data.isDeveloperApproved = devDoc.exists() && devDoc.data().approved === true;
            } else if (data.developer) {
              const devQuery = query(collection(db, "developers"), where("name", "==", data.developer));
              const devSnap = await getDocs(devQuery);
              if (!devSnap.empty) {
                data.isDeveloperApproved = !!devSnap.docs[0].data().approved;
              } else {
                data.isDeveloperApproved = false;
              }
            } else {
              data.isDeveloperApproved = false;
            }
          } catch {}
          setProperty(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const getLatLng = () => {
    if (!property) return null;
    let lat = null;
    let lng = null;
    if (property.latitude && property.longitude) {
      lat = property.latitude;
      lng = property.longitude;
    } else if (property.coordinates) {
      const parts = String(property.coordinates).split(/[;,.\s]+/).filter(Boolean);
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
        {t.propertyDetail.notFound}
      </div>
    );
  }

  const shouldShowUnitsCount = property.buildingType === "Отель" || property.buildingType === "Резорт";

  const renderAttribute = (label, value, IconComp) => (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-gray-500 leading-none mb-1">{label}</div>
        <div className="text-sm font-medium text-gray-900 leading-none whitespace-pre-line">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Галерея изображений */}
      {property.images?.length ? (
        <div className="relative mb-4">
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
              className="hidden md:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white"
            >
              ◀
            </button>
          )}
          {/* Next */}
          {currentImg < property.images.length - 1 && (
            <button
              onClick={() => setCurrentImg((i) => i + 1)}
              className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white"
            >
              ▶
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-72 rounded-xl overflow-hidden mb-4 bg-gray-200 flex items-center justify-center text-gray-400">
          <Building2 className="w-12 h-12" />
        </div>
      )}

      

      {/* Lead modal */}
      {isLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLeadOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-4">{t.leadForm.writeToAgent}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.leadForm.name}</label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.leadForm.phone}</label>
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsLeadOpen(false)} className="px-4 py-2 border rounded">
                  {t.leadForm.cancel}
                </button>
                <button
                  disabled={leadSending}
                  onClick={async () => {
                    if (!leadName || !leadPhone) {
                      showError(t.leadForm.sentError);
                      return;
                    }
                    try {
                      setLeadSending(true);
                      await addDoc(collection(db, 'clientLeads'), {
                        name: leadName,
                        phone: leadPhone,
                        propertyId: id || null,
                        createdAt: serverTimestamp(),
                      });
                      showSuccess(t.leadForm.sentSuccess);
                      setIsLeadOpen(false);
                      setLeadName('');
                      setLeadPhone('');
                    } catch (e) {
                      console.error('Lead save failed', e);
                      showError(t.leadForm.sentError);
                    } finally {
                      setLeadSending(false);
                    }
                  }}
                  className={`px-4 py-2 rounded text-white ${leadSending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {t.leadForm.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Цена и кнопка "на карте" */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl font-semibold text-gray-600">
          {formatPrice(property.price)}
        </div>
        {getLatLng() && (
          <button onClick={handleOpenMap} className="flex flex-col items-center text-blue-600 hover:underline">
            <MapIcon className="w-6 h-6 mb-1 fill-blue-600 text-blue-600" />
            <span className="text-xs">{t.propertyDetail.onMap}</span>
          </button>
        )}
      </div>

      {/* Тип */}
      <div className="text-2xl font-bold mb-2 text-gray-800">
        {translatePropertyType(safeDisplay(property.type), language)}
      </div>
      {property.isDeveloperApproved === true && (
        <div className="mb-4">
          <div className="inline-block group relative">
            <Badge className="border bg-green-100 text-green-800 border-green-200">
              {t.propertyDetail.serviceVerified}
            </Badge>
            <div className="pointer-events-none hidden group-hover:block absolute z-50 w-72 p-3 bg-white border rounded-lg shadow-lg text-xs sm:text-sm whitespace-pre-line top-full mt-1 left-0">
              {t.propertyDetail.serviceVerifiedTooltip}
            </div>
          </div>
        </div>
      )}



      {/* Характеристики (только просмотр) */}
      <div className="grid grid-cols-2 gap-4">
        {renderAttribute(
          shouldShowUnitsCount ? t.propertyDetail.unitsCount : (property.bedrooms === 0 ? t.propertyDetail.studio : t.propertyDetail.bedrooms),
          shouldShowUnitsCount ? safeDisplay(property.unitsCount) : (property.bedrooms === 0 ? t.propertyDetail.studio : safeDisplay(property.bedrooms)),
          Bed
        )}

        {renderAttribute(
          t.propertyDetail.area,
          property.area ? translateAreaUnit(formatArea(property.area), language) : "—",
          Ruler
        )}

        {renderAttribute(
          t.propertyDetail.district,
          translateDistrict(safeDisplay(property.district), language),
          MapPin
        )}

        {renderAttribute(
          t.propertyDetail.buildingType,
          translateBuildingType(safeDisplay(property.buildingType), language),
          Hammer
        )}

        {renderAttribute(
          t.propertiesGallery.statusLabel,
          translateConstructionStatus(safeDisplay(property.status), language),
          Hammer
        )}

        {renderAttribute(
          t.propertyDetail.landStatus,
          translateLandStatus(safeDisplay(property.landStatus), language),
          MapPin
        )}

        {renderAttribute(
          t.propertyDetail.pool,
          translatePoolStatus(safeDisplay(property.pool), language),
          Droplet
        )}

        {property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms !== '' && (
          renderAttribute(t.propertyDetail.bathrooms, safeDisplay(property.bathrooms), Bath)
        )}

        {property.floors !== undefined && property.floors !== null && property.floors !== '' && (
          renderAttribute(
            t.propertyDetail.floors,
            `${safeDisplay(property.floors)} ${Number(property.floors) === 1 ? t.propertyDetail.floorText : t.propertyDetail.floorsText}`,
            Layers
          )
        )}

        {property.totalArea !== undefined && property.totalArea !== null && property.totalArea !== '' && (
          renderAttribute(t.propertyDetail.totalArea, safeDisplay(property.totalArea), Ruler)
        )}

        {property.managementCompany && (
          renderAttribute(t.propertyDetail.managementCompany, safeDisplay(property.managementCompany), Building2)
        )}

        {renderAttribute(
          t.propertyDetail.ownership,
          property.ownershipForm
            ? `${translateOwnership(property.ownershipForm, language)}${property.leaseYears ? ` ${property.leaseYears} ${t.propertyDetail.years}` : ""}`
            : "—",
          FileText
        )}

        {renderAttribute(
          t.propertyDetail.completionDate,
          safeDisplay(property.completionDate),
          Calendar
        )}

        {/* Цена за м² после даты завершения */}
        {renderAttribute(
          t.propertyDetail.pricePerSqm,
          property.price && property.area
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Math.round(Number(property.price) / Number(property.area)))
            : "—",
          DollarSign
        )}

        {/* ROI после даты завершения (если сохранён) */}
        {roiPercent !== null && (
          renderAttribute(
            t.roiShort,
            `${Number(roiPercent).toFixed(2)}%`,
            Star
          )
        )}

        {/* Планировка (если загружен файл) */}
        {property.layoutFileURL && (
          renderAttribute(
            t.propertyDetail.layout,
            (
              <a
                href={property.layoutFileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {t.propertyDetail.viewButton}
              </a>
            ),
            FileText
          )
        )}
      </div>

      {/* Дополнительные опции (бейджи) */}
      {(property.smartHome || property.jacuzzi || property.terrace || property.rooftop || property.balcony || property.bbq || property.furniture || property.washingMachine) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.additionalOptions}</h3>
          <div className="grid grid-cols-2 gap-3">
            {property.smartHome && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Home className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.smartHome}</span>
              </div>
            )}
            {property.jacuzzi && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Droplet className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.jacuzzi}</span>
              </div>
            )}
            {property.terrace && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Star className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.terrace}</span>
              </div>
            )}
            {property.rooftop && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Building2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.rooftop}</span>
              </div>
            )}
            {property.balcony && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Square className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.balcony}</span>
              </div>
            )}
            {property.bbq && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Flame className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.bbq}</span>
              </div>
            )}
            {property.furniture && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Sofa className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.furniture}</span>
              </div>
            )}
            {property.washingMachine && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Waves className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.propertyDetail.washingMachine}</span>
              </div>
            )}
            {property.distanceToBeach && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t.propertyDetail.distanceToBeach} {String(property.distanceToBeach)} {t.propertyDetail.kmUnit}
                </span>
              </div>
            )}
            {property.distanceToCenter && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t.propertyDetail.distanceToCenter} {String(property.distanceToCenter)} {t.propertyDetail.kmUnit}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Поле "Описание" */}
      {property.description && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.propertyDetail.description}</h3>
          <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            <img
              src={property.images[currentImg]}
              alt={`${t.propertyDetail.photo} ${currentImg + 1}`}
              className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
              onClick={() => setLightbox(false)}
            />
            {/* Кнопка закрытия */}
            <button className="absolute top-4 right-4 text-white text-4xl" onClick={() => setLightbox(false)}>
              ×
            </button>
            {/* Стрелка влево */}
            {currentImg > 0 && (
              <button
                onClick={() => setCurrentImg((prev) => prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                ←
              </button>
            )}
            {/* Стрелка вправо */}
            {currentImg < property.images.length - 1 && (
              <button
                onClick={() => setCurrentImg((prev) => prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                →
              </button>
            )}
            {/* Счетчик фотографий */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {t.propertyDetail.photoCounter.replace('{current}', currentImg + 1).replace('{total}', property.images.length)}
            </div>
          </div>
        </div>
      )}

      {/* CTA: Кнопка управления объектом для создателя или "Написать агенту" для остальных */}
      <div className="mt-8">
        {currentUser && property?.createdBy === currentUser.uid ? (
          <button
            onClick={handleManageProperty}
            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t.leadForm.manageProperty}
          </button>
        ) : (
          <button
            onClick={() => setIsLeadOpen(true)}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.leadForm.writeToAgent}
          </button>
        )}
      </div>
    </div>
  );
}

export default PublicPropertyDetail;


