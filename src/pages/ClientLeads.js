import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { translateDistrict, translatePropertyType } from '../lib/utils';
import { Building2 } from 'lucide-react';

const ClientLeads = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyMap, setPropertyMap] = useState({});

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const q = query(collection(db, 'clientLeads'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLeads(data);
        const ids = Array.from(new Set(data.map(l => l.propertyId).filter(Boolean)));
        const entries = await Promise.all(ids.map(async (pid) => {
          try {
            const pSnap = await getDoc(doc(db, 'properties', pid));
            if (!pSnap.exists()) return [pid, null];
            const pData = { id: pid, ...pSnap.data() };
            if (pData.complexId) {
              try {
                const cSnap = await getDoc(doc(db, 'complexes', pData.complexId));
                if (cSnap.exists()) pData.complexName = cSnap.data().name;
              } catch {}
            }
            return [pid, pData];
          } catch {
            return [pid, null];
          }
        }));
        setPropertyMap(Object.fromEntries(entries));
      } catch (e) {
        console.error('Failed to load leads', e);
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  };

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString('ru-RU');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t.navigation.clientLeads}</h1>
      {leads.length === 0 ? (
        <div className="text-gray-500">—</div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => {
            const p = lead.propertyId ? propertyMap[lead.propertyId] : null;
            return (
              <div key={lead.id} className="p-4 border rounded-md">
                <div className="font-semibold">{lead.name} • {lead.phone}</div>
                {lead.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">{new Date(lead.createdAt.seconds ? lead.createdAt.seconds * 1000 : lead.createdAt).toLocaleString()}</div>
                )}

                {p ? (
                  <Link to={`/property/${p.id}`} className="mt-3 flex items-stretch cursor-pointer hover:bg-gray-50 transition-colors gap-4 p-4 rounded-md border">
                    <div className="relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 w-48 h-32 min-w-48">
                      {p.images?.length ? (
                        <img src={p.images[0]} alt={safeDisplay(p.type) || t.propertiesGallery.propertyAltText} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col text-gray-900 space-y-0.5">
                      {(p.complexName || p.complex || p.propertyName) && (
                        <span className="font-semibold leading-none text-black text-lg">{safeDisplay(p.complexName || p.complex || p.propertyName)}</span>
                      )}
                      <span className="font-semibold leading-none text-lg">{formatPrice(p.price)}</span>
                      {p.type && <span className="text-sm">{translatePropertyType(safeDisplay(p.type), language)}</span>}
                      {p.area && <span className="text-sm">{safeDisplay(p.area)} {t.propertiesGallery.areaText}</span>}
                      {p.bedrooms !== undefined && p.bedrooms !== null && p.bedrooms !== '' && (
                        <span className="text-sm">{p.bedrooms === 0 ? t.propertiesGallery.studio : `${t.propertiesGallery.bedroomsText}: ${safeDisplay(p.bedrooms)}`}</span>
                      )}
                      {p.unitsCount !== undefined && p.unitsCount !== null && p.unitsCount !== '' && (
                        <span className="text-sm">{t.propertiesGallery.unitsCountText}: {safeDisplay(p.unitsCount)}</span>
                      )}
                      {p.district && <span className="text-sm">{translateDistrict(safeDisplay(p.district), language)}</span>}
                    </div>
                  </Link>
                ) : lead.propertyId ? (
                  <div className="mt-3 text-sm text-gray-500">Объект не найден (ID: {lead.propertyId})</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientLeads;


