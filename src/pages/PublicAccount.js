import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Timestamp, getDocs, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translatePropertyType } from "../lib/utils";
import { Building2 } from "lucide-react";
import { Button } from "../components/ui/button";

function PublicAccount() {
  const { currentUser, logout } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [myProperties, setMyProperties] = useState([]);
  const [myLeads, setMyLeads] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  useEffect(() => {
    async function loadData() {
      try {
        if (!currentUser) return;
        // Мои объекты
        const propsSnap = await getDocs(collection(db, 'properties'));
        const props = propsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.createdBy === currentUser.uid);
        setMyProperties(props);

        // Мои заявки (таблица clientLeads, где propertyId в моих объектах)
        const leadsSnap = await getDocs(collection(db, 'clientLeads'));
        const myPropIds = new Set(props.map(p => p.id));
        const leads = leadsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => l.propertyId && myPropIds.has(l.propertyId));
        setMyLeads(leads);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout error', e);
    }
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="mb-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.propertyDetail?.backButton || 'Назад'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t.accountPage.title}</h1>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">{t.accountPage.logout}</Button>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.accountPage.myProperties}</h2>
          {myProperties.length === 0 ? (
            <div className="text-gray-500">{t.accountPage.noProperties}</div>
          ) : (
            <div className="divide-y">
              {myProperties.map((p) => (
                <Link key={p.id} to={`/public/property/${p.id}`} className="flex items-stretch gap-4 p-4 hover:bg-gray-50">
                  <div className="relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 w-48 h-32 min-w-48">
                    {p.images?.length ? (
                      <img src={p.images[0]} alt={safeDisplay(p.type)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col text-gray-900 space-y-1">
                    <span className="text-lg font-semibold">{safeDisplay(p.propertyName || p.complex || p.type)}</span>
                    <span className="text-sm"><span className="text-gray-600">Тип:</span><span className="ml-2">{translatePropertyType(safeDisplay(p.type), language)}</span></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.accountPage.myLeads}</h2>
          {myLeads.length === 0 ? (
            <div className="text-gray-500">{t.accountPage.noLeads}</div>
          ) : (
            <div className="divide-y">
              {myLeads.map((l) => (
                <div key={l.id} className="p-4">
                  <div className="text-sm text-gray-600">{l.createdAt instanceof Timestamp ? l.createdAt.toDate().toLocaleString() : ''}</div>
                  <div className="font-medium text-gray-900">{safeDisplay(l.name)} — {safeDisplay(l.phone)} ({safeDisplay(l.messenger)})</div>
                  {l.propertyId && (
                    <Link to={`/public/property/${l.propertyId}`} className="text-blue-600 hover:underline text-sm">{t.accountPage.goToProperty}</Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PublicAccount;


