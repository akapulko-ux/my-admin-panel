import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, collectionGroup, getFirestore, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
// (icons removed: not used yet)

const db = getFirestore();

export default function BotMonitoring() {
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [activeBotId, setActiveBotId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [messagesPreview, setMessagesPreview] = useState({});
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    activeConversations24h: 0,
    messages24h: 0,
    messagesIn24h: 0,
    messagesOut24h: 0
  });

  // Subscribe bots
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'bots')), snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBots(items);
      if (!activeBotId && items.length > 0) setActiveBotId(items[0].botId || items[0].id);
    });
    return () => unsub();
  }, [activeBotId]);

  // Subscribe conversations for active bot
  useEffect(() => {
    if (!activeBotId) return;
    const unsub = onSnapshot(
      query(collection(db, 'bots', String(activeBotId), 'conversations'), orderBy('lastAt', 'desc'), limit(200)),
      snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setConversations(items);
        // Метрики по беседам
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const active24 = items.filter(c => {
          const ts = c.lastAt?.toDate?.() ? c.lastAt.toDate().getTime() : (c.lastAt?.seconds ? c.lastAt.seconds * 1000 : 0);
          return ts >= dayAgo;
        }).length;
        setMetrics(prev => ({ ...prev, totalConversations: items.length, activeConversations24h: active24 }));
      }
    );
    return () => unsub();
  }, [activeBotId]);

  // Load last message text for preview via collectionGroup when needed
  useEffect(() => {
    if (!activeBotId || conversations.length === 0) return;
    const unsubs = conversations.slice(0, 50).map(conv => {
      const qy = query(
        collection(db, 'bots', String(activeBotId), 'conversations', String(conv.chatId || conv.id), 'messages'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      return onSnapshot(qy, snap => {
        if (!snap.empty) {
          const m = snap.docs[0].data();
          setMessagesPreview(prev => ({ ...prev, [conv.id]: m.text || m.caption || '' }));
        }
      });
    });
    return () => unsubs.forEach(u => u && u());
  }, [activeBotId, conversations]);

  // Метрики сообщений за 24 часа (через collectionGroup)
  useEffect(() => {
    if (!activeBotId) return;
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const qy = query(
        collectionGroup(db, 'messages'),
        where('botId', '==', String(activeBotId)),
        where('timestamp', '>=', start),
        orderBy('timestamp', 'desc'),
        limit(2000)
      );
      const unsub = onSnapshot(qy, snap => {
        const docs = snap.docs.map(d => d.data());
        let total = docs.length;
        let inc = 0;
        let outc = 0;
        for (const m of docs) {
          if (m.direction === 'in') inc++; else if (m.direction === 'out') outc++;
        }
        setMetrics(prev => ({
          ...prev,
          messages24h: total,
          messagesIn24h: inc,
          messagesOut24h: outc
        }));
      });
      return () => unsub();
    } catch (_) {
      // Если требуется индекс, Firestore подскажет; UI не падает
    }
  }, [activeBotId]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return conversations;
    return conversations.filter(c =>
      (c.username || '').toLowerCase().includes(s) ||
      (c.firstName || '').toLowerCase().includes(s) ||
      (c.lastName || '').toLowerCase().includes(s) ||
      (String(c.chatId || c.id)).includes(s)
    );
  }, [search, conversations]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.botMonitoring?.title || 'Мониторинг ботов'}</h1>
          <p className="text-muted-foreground">{t.botMonitoring?.subtitle || 'Статистика и диалоги по каждому боту'}</p>
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t.botMonitoring?.totalConversations || 'Всего диалогов'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalConversations}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t.botMonitoring?.active24h || 'Активны за 24ч'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.activeConversations24h}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t.botMonitoring?.messages24h || 'Сообщений 24ч'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.messages24h}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t.botMonitoring?.in24h || 'Входящих 24ч'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.messagesIn24h}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t.botMonitoring?.out24h || 'Исходящих 24ч'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.messagesOut24h}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t.botMonitoring?.bots || 'Боты'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bots.map(b => (
              <button
                key={b.botId || b.id}
                onClick={() => setActiveBotId(b.botId || b.id)}
                className={`w-full text-left px-3 py-2 rounded border ${activeBotId === (b.botId || b.id) ? 'bg-accent' : 'hover:bg-accent/50'}`}
              >
                <div className="font-medium">{b.name || (b.slug || 'Bot')}</div>
                <div className="text-xs text-muted-foreground">{(b.isActive ? 'Активен' : 'Выключен')}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.botMonitoring?.conversations || 'Диалоги'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Input placeholder={t.botMonitoring?.searchPlaceholder || 'Поиск по имени/username/chatId'} value={search} onChange={e => setSearch(e.target.value)} />
                <Badge variant="outline" className="whitespace-nowrap">{filtered.length}</Badge>
              </div>
              <div className="max-h-[70vh] overflow-auto divide-y">
                {filtered.map(c => (
                  <div key={c.id} className="py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{c.displayName || [c.firstName, c.lastName].filter(Boolean).join(' ') || (c.username ? `@${c.username}` : 'User')}</div>
                        <span className="text-xs text-muted-foreground">#{c.chatId || c.id}</span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {messagesPreview[c.id] || c.lastMessage || ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{c.lastDirection === 'in' ? (t.botMonitoring?.fromUser || 'от пользователя') : (t.botMonitoring?.fromBot || 'от бота')}</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/bots/chat/${encodeURIComponent(activeBotId)}/${encodeURIComponent(c.chatId || c.id)}`)}>{t.botMonitoring?.open || 'Открыть'}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


