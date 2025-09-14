import React, { useEffect, useRef, useState } from 'react';
import { collection, addDoc, getFirestore, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

const db = getFirestore();

export default function BotChatViewer() {
  const { botId, chatId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!botId || !chatId) return;
    const ref = collection(db, 'bots', String(botId), 'conversations', String(chatId), 'messages');
    const qy = query(ref, orderBy('timestamp'));
    const unsub = onSnapshot(qy, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(items);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    });
    return () => unsub();
  }, [botId, chatId]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    try {
      const ref = collection(db, 'bots', String(botId), 'conversations', String(chatId), 'messages');
      await addDoc(ref, { direction: 'out', text: value, timestamp: serverTimestamp() });
      setText('');
    } catch (e) {}
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.botMonitoring?.chatWith || 'Чат с пользователем'} #{chatId}</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>{t.back || 'Назад'}</Button>
      </div>

      <Card className="p-4 h-[70vh] overflow-auto space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.direction === 'out' ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded px-3 py-2 max-w-[70%]`}>
              <div className="whitespace-pre-wrap break-words">{m.text || m.caption || ''}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </Card>

      <div className="flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder={t.botMonitoring?.typeMessage || 'Введите сообщение...'} onKeyDown={e => { if (e.key === 'Enter') send(); }} />
        <Button onClick={send}>{t.send || 'Отправить'}</Button>
      </div>
    </div>
  );
}


