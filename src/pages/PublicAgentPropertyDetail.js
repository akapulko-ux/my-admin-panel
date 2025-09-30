import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import PublicPropertyDetail from './PublicPropertyDetail';

// Обертка над PublicPropertyDetail со скрытием секции "Просмотр детальной информации и документов"
// и перенаправлением лидов на владельца ссылки (agentId из URL)
function PublicAgentPropertyDetail() {
  const { id, agentId } = useParams();
  const { language } = useLanguage();
  const t = translations[language];
  const [allowed, setAllowed] = useState(null); // null loading, true ok, false not premium

  useEffect(() => {
    let canceled = false;
    async function checkAgent() {
      try {
        const uref = doc(db, 'users', agentId);
        const snap = await getDoc(uref);
        if (!snap.exists()) { if (!canceled) setAllowed(false); return; }
        const role = String(snap.data()?.role || '').toLowerCase().trim();
        const ok = (role === 'premium agent' || role === 'премиум агент' || role === 'premium_agent' || role === 'премиум-агент');
        if (!canceled) setAllowed(ok);
        // После проверки роли — устанавливаем параметры URL один раз
        const url = new URL(window.location.href);
        let changed = false;
        if (ok && url.searchParams.get('hideDocs') !== '1') { url.searchParams.set('hideDocs', '1'); changed = true; }
        if (ok && url.searchParams.get('owner') !== agentId) { url.searchParams.set('owner', agentId); changed = true; }
        if (changed) {
          window.history.replaceState({}, '', url.toString());
        }
      } catch {
        if (!canceled) setAllowed(false);
      }
    }
    checkAgent();
    return () => { canceled = true; };
  }, [agentId]);

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white text-center">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">{t.agentPublicListing?.premiumRequiredTitle || 'Требуется премиум‑подписка'}</h1>
          <p className="text-gray-600">{t.agentPublicListing?.premiumRequiredText || 'Для использования этой страницы необходимо оформить премиум подписку.'}</p>
        </div>
      </div>
    );
  }

  // Используем исходный компонент, но через URL сигнализируем о скрытии секций и назначении владельца для лидов
  // Внутри PublicPropertyDetail используем query-параметры: hideDocs=1 и owner=agentId
  const adjustedId = id; // передаем как есть

  // параметры URL уже выставляются в эффекте выше после подтверждения роли

  return <PublicPropertyDetail id={adjustedId} />;
}

export default PublicAgentPropertyDetail;


