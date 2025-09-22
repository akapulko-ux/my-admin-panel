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
  const [agentMap, setAgentMap] = useState({});
  const [userMap, setUserMap] = useState({});

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

        // Загружаем информацию об агентах для объектов, добавленных агентами
        const agentIds = Array.from(new Set(
          Object.values(Object.fromEntries(entries))
            .filter(p => p && p.addedByAgent === true && (p.createdBy || p.userId || p.agentId))
            .map(p => p.createdBy || p.userId || p.agentId)
        ));
        
        console.log('Found agent IDs:', agentIds);
        
        if (agentIds.length > 0) {
          const agentEntries = await Promise.all(agentIds.map(async (agentId) => {
            try {
              console.log('Loading agent data for ID:', agentId);
              // Сначала пробуем загрузить из коллекции users (основные данные)
              let agentSnap = await getDoc(doc(db, 'users', agentId));
              if (agentSnap.exists()) {
                console.log('Agent found in users collection');
                const agentData = { id: agentId, ...agentSnap.data() };
                console.log('Loaded agent data from users:', agentData);
                console.log('Agent data fields:', Object.keys(agentData));
                return [agentId, agentData];
              }
              
              // Если не найден в users, пробуем в agents
              console.log('Agent not found in users collection, trying agents collection');
              agentSnap = await getDoc(doc(db, 'agents', agentId));
              if (agentSnap.exists()) {
                console.log('Agent found in agents collection');
                const agentData = { id: agentId, ...agentSnap.data() };
                console.log('Loaded agent data from agents:', agentData);
                console.log('Agent data fields:', Object.keys(agentData));
                return [agentId, agentData];
              }
              
              console.log('Agent not found in either collection');
              return [agentId, null];
            } catch (error) {
              console.error('Error loading agent:', error);
              return [agentId, null];
            }
          }));
          const agentMapData = Object.fromEntries(agentEntries);
          console.log('Final agent map:', agentMapData);
          setAgentMap(agentMapData);
        }

        // Загружаем информацию о пользователях для заявок с userId
        const userIds = Array.from(new Set(
          data
            .filter(lead => lead.userId)
            .map(lead => lead.userId)
        ));
        
        console.log('Found user IDs:', userIds);
        
        if (userIds.length > 0) {
          const userEntries = await Promise.all(userIds.map(async (userId) => {
            try {
              console.log('Loading user data for ID:', userId);
              const userSnap = await getDoc(doc(db, 'users', userId));
              if (userSnap.exists()) {
                console.log('User found in users collection');
                const userData = { id: userId, ...userSnap.data() };
                console.log('Loaded user data:', userData);
                return [userId, userData];
              }
              
              console.log('User not found in users collection');
              return [userId, null];
            } catch (error) {
              console.error('Error loading user:', error);
              return [userId, null];
            }
          }));
          const userMapData = Object.fromEntries(userEntries);
          console.log('Final user map:', userMapData);
          setUserMap(userMapData);
        }
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
            // Отладочная информация (можно убрать после исправления)
            if (p && p.addedByAgent === true) {
              console.log('Property with addedByAgent:', p);
              console.log('Property createdBy:', p.createdBy);
              const agentId = p.createdBy || p.userId || p.agentId;
              console.log('Using agent ID:', agentId);
              console.log('Agent data for this property:', agentMap[agentId]);
            }
            return (
              <div key={lead.id} className="p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{lead.name} • {lead.phone}</div>
                  {lead.source === 'iOS' && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-medium">
                      iOS приложение
                    </div>
                  )}
                </div>
                {lead.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">{new Date(lead.createdAt.seconds ? lead.createdAt.seconds * 1000 : lead.createdAt).toLocaleString()}</div>
                )}

                {/* Информация о пользователе, если есть userId */}
                {lead.userId && userMap[lead.userId] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Информация о пользователе</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Имя:</span> {
                          userMap[lead.userId].name || 
                          userMap[lead.userId].displayName || 
                          userMap[lead.userId].fullName ||
                          userMap[lead.userId].firstName ||
                          userMap[lead.userId].lastName ||
                          userMap[lead.userId].username ||
                          '—'
                        }
                      </div>
                      {(userMap[lead.userId].phone || userMap[lead.userId].phoneNumber || userMap[lead.userId].tel) && (
                        <div>
                          <span className="font-medium">Телефон:</span> {userMap[lead.userId].phone || userMap[lead.userId].phoneNumber || userMap[lead.userId].tel}
                        </div>
                      )}
                      {(userMap[lead.userId].email || userMap[lead.userId].emailAddress) && (
                        <div>
                          <span className="font-medium">Email:</span> {userMap[lead.userId].email || userMap[lead.userId].emailAddress}
                        </div>
                      )}
                      {userMap[lead.userId].role && (
                        <div>
                          <span className="font-medium">Роль:</span> {userMap[lead.userId].role}
                        </div>
                      )}
                      {userMap[lead.userId].createdAt && (
                        <div>
                          <span className="font-medium">Регистрация:</span> {new Date(userMap[lead.userId].createdAt.seconds ? userMap[lead.userId].createdAt.seconds * 1000 : userMap[lead.userId].createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {p ? (
                  <div className="mt-3 flex items-stretch gap-4 p-4 rounded-md border">
                    <Link to={`/property/${p.id}`} className="flex items-stretch cursor-pointer hover:bg-gray-50 transition-colors gap-4 flex-1">
                      <div className="relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 w-48 h-32 min-w-48">
                        {p.images?.length ? (
                          <>
                            <img src={p.images[0]} alt={safeDisplay(p.type) || t.propertiesGallery.propertyAltText} className="w-full h-full object-cover" />
                            {p.addedByAgent === true && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                                {t.leadForm.addedByAgent}
                              </div>
                            )}
                          </>
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
                          <span className="text-sm">{(p.bedrooms === 0 || p.bedrooms === "Студия") ? t.propertiesGallery.studio : `${t.propertiesGallery.bedroomsText}: ${safeDisplay(p.bedrooms)}`}</span>
                        )}
                        {p.unitsCount !== undefined && p.unitsCount !== null && p.unitsCount !== '' && (
                          <span className="text-sm">{t.propertiesGallery.unitsCountText}: {safeDisplay(p.unitsCount)}</span>
                        )}
                        {p.district && <span className="text-sm">{translateDistrict(safeDisplay(p.district), language)}</span>}
                      </div>
                    </Link>
                    
                    {/* Информация об агенте справа */}
                    {p.addedByAgent === true && (p.createdBy || p.userId || p.agentId) && (
                      <div className="flex-shrink-0 w-64 border-l pl-4">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">{t.leadForm.agentInfo}</h4>
                        {(() => {
                          const agentId = p.createdBy || p.userId || p.agentId;
                          const agentData = agentMap[agentId];
                          return agentData ? (
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">{t.leadForm.agentName}:</span> {
                                  agentData.name || 
                                  agentData.displayName || 
                                  agentData.fullName ||
                                  agentData.firstName ||
                                  agentData.lastName ||
                                  agentData.username ||
                                  '—'
                                }
                              </div>
                              {(agentData.phone || agentData.phoneNumber || agentData.tel) && (
                                <div>
                                  <span className="font-medium">{t.leadForm.agentPhone}:</span> {agentData.phone || agentData.phoneNumber || agentData.tel}
                                </div>
                              )}
                              {(agentData.email || agentData.emailAddress) && (
                                <div>
                                  <span className="font-medium">{t.leadForm.agentEmail}:</span> {agentData.email || agentData.emailAddress}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              <div>ID агента: {agentId}</div>
                              <div>Данные агента загружаются...</div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
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


