import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

const API_BASE = process.env.REACT_APP_FUNCTIONS_API_URL || 'https://api-nsnqs3w4aq-uc.a.run.app';

export default function BotsManager() {
  const { role } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', telegramBotToken: '', menuButtonText: 'Find a property with AI' });

  const canManage = role === 'admin' || role === 'premium agent' || role === 'премиум застройщик';

  const apiKey = localStorage.getItem('apiKey') || '';

  const fetchBots = async () => {
    setLoading(true); setError('');
    try {
      const resp = await fetch(`${API_BASE}/v1/bots`, { headers: { 'x-api-key': apiKey }});
      if (!resp.ok) throw new Error('Failed to load bots');
      const json = await resp.json();
      setBots(Array.isArray(json.data) ? json.data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBots(); // eslint-disable-next-line
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setLoading(true); setError('');
    try {
      const resp = await fetch(`${API_BASE}/v1/bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(form)
      });
      if (!resp.ok) throw new Error('Failed to create bot');
      setForm({ name: '', telegramBotToken: '', menuButtonText: 'Find a property with AI' });
      await fetchBots();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const onToggle = async (botId, isActive) => {
    setLoading(true); setError('');
    try {
      const resp = await fetch(`${API_BASE}/v1/bots/${encodeURIComponent(botId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ isActive })
      });
      if (!resp.ok) throw new Error('Failed to update bot');
      await fetchBots();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Боты</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {canManage && (
        <Card className="p-4 space-y-3">
          <h2 className="font-medium">Создать бота</h2>
          <form onSubmit={onCreate} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Название</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Telegram Bot Token</label>
              <Input value={form.telegramBotToken} onChange={e => setForm({ ...form, telegramBotToken: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Menu Button Text</label>
              <Input value={form.menuButtonText} onChange={e => setForm({ ...form, menuButtonText: e.target.value })} />
            </div>
            <Button type="submit" disabled={loading}>Создать</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-medium">Мои боты</h2>
        {loading && <div>Загрузка…</div>}
        {bots.map(b => (
          <Card key={b.botId} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="text-sm text-muted-foreground">botId: {b.botId}</div>
              <div className="text-sm text-muted-foreground">active: {String(b.isActive)}</div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onToggle(b.botId, !b.isActive)} disabled={loading}>
                  {b.isActive ? 'Выключить' : 'Включить'}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}


