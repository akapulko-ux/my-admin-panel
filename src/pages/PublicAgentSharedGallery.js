import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import PublicPropertiesGallery from "./PublicPropertiesGallery";

function PublicAgentSharedGallery() {
  const { token } = useParams();
  const { language } = useLanguage();
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function checkToken() {
      try {
        if (!token) {
          if (isMounted) setIsAllowed(false);
          return;
        }
        // Читаем публичную мапу токена
        const mapSnap = await getDoc(doc(db, 'publicSharedLinks', token));
        if (!mapSnap.exists()) {
          if (isMounted) setIsAllowed(false);
          return;
        }
        const map = mapSnap.data() || {};
        const role = String(map.role || '').toLowerCase();
        const isPremiumAgent = (role === 'premium agent' || role === 'премиум агент' || role === 'premium_agent' || role === 'премиум-агент');
        const enabled = map.enabled !== false; // по умолчанию true, можно выключить
        if (isMounted) {
          setIsAllowed(enabled && isPremiumAgent);
          const name = map.ownerName || "";
          setOwnerName(name);
        }
      } catch (e) {
        console.error("Shared gallery token check error", e);
        // При ошибке чтения (например, правила Firestore) всё равно пускаем по валидному роутингу
        if (isMounted) setIsAllowed(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">{t.sharedGalleryPage?.premiumRequiredTitle}</h1>
          <p className="text-gray-600">{t.sharedGalleryPage?.premiumRequiredMessage}</p>
          <Link to="/public" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            {t.sharedGalleryPage?.goToMain}
          </Link>
        </div>
      </div>
    );
  }

  return <PublicPropertiesGallery sharedOwnerName={ownerName} sharedToken={token} />;
}

export default PublicAgentSharedGallery;




