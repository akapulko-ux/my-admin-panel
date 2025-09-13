import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getAuth } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

const API_BASE = process.env.REACT_APP_FUNCTIONS_API_URL || 'https://api-nsnqs3w4aq-uc.a.run.app';

export default function KnowledgeBase() {
  const { role, currentUser } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', type: 'legal', locale: 'ru', tags: '', visibility: 'tenant', content: '' });
  const [indexing, setIndexing] = useState({ running: false, indexed: 0, lastToken: null, stepError: '' });
  const [editing, setEditing] = useState(null); // id
  const [editForm, setEditForm] = useState({ id: '', title: '', type: '', locale: '', tags: '', content: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const canManage = role === 'admin' || role === 'premium agent' || role === 'премиум застройщик';
  const tenantId = React.useMemo(() => {
    if (!currentUser) return '—';
    if (role === 'admin') return 'admin';
    return String(currentUser.uid || '—');
  }, [role, currentUser]);

  const fetchDocs = async () => {
    setLoading(true); setError('');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Требуется авторизация');
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE}/v1/knowledge`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resp.ok) throw new Error('Failed to load knowledge');
      const json = await resp.json();
      setDocs(Array.isArray(json.data) ? json.data : []);
    } catch (e) { setError(e.message); }
     finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); // eslint-disable-next-line
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Требуется авторизация');
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE}/v1/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Failed to create doc');
      setForm({ title: '', type: 'legal', locale: 'ru', tags: '', visibility: 'public', content: '' });
      await fetchDocs();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const indexPage = async (startAfter = null) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Требуется авторизация');
    const token = await user.getIdToken();
    const resp = await fetch(`${API_BASE}/v1/knowledge/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ batchSize: 100, ...(startAfter ? { startAfter } : {}) })
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.error || 'Не удалось запустить индексацию');
    return json;
  };

  const onIndexPage = async () => {
    setError('');
    setIndexing(prev => ({ ...prev, running: true, stepError: '' }));
    try {
      const res = await indexPage(indexing.lastToken);
      setIndexing(prev => ({ running: false, indexed: prev.indexed + (res.indexed || 0), lastToken: res.nextPageToken || null, stepError: '' }));
    } catch (e) {
      setIndexing(prev => ({ ...prev, running: false, stepError: e.message }));
    }
  };

  const onIndexAll = async () => {
    setError('');
    setIndexing({ running: true, indexed: 0, lastToken: null, stepError: '' });
    try {
      let token = null; let total = 0; let guard = 0;
      do {
        const res = await indexPage(token);
        total += Number(res.indexed || 0);
        token = res.nextPageToken || null;
        setIndexing({ running: true, indexed: total, lastToken: token, stepError: '' });
        guard++;
      } while (token && guard < 100);
      setIndexing(prev => ({ ...prev, running: false }));
    } catch (e) {
      setIndexing(prev => ({ ...prev, running: false, stepError: e.message }));
    }
  };

  const openEdit = async (id) => {
    setEditError('');
    setEditLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Требуется авторизация');
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE}/v1/knowledge/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Не удалось загрузить документ');
      const d = json.data || {};
      setEditing(id);
      setEditForm({ id, title: d.title || '', type: d.type || '', locale: d.locale || 'ru', tags: Array.isArray(d.tags) ? d.tags.join(', ') : '', content: d.content || '' });
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    setEditLoading(true); setEditError('');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Требуется авторизация');
      const token = await user.getIdToken();
      const payload = {
        title: editForm.title,
        type: editForm.type,
        locale: editForm.locale,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        content: editForm.content
      };
      const resp = await fetch(`${API_BASE}/v1/knowledge/${editing}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Не удалось сохранить изменения');
      setEditing(null);
      await fetchDocs();
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">База знаний</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Card className="p-4 space-y-1">
        <div className="text-sm">Текущий тенант:</div>
        <div className="text-sm font-medium select-all">{tenantId}</div>
        <div className="text-xs text-muted-foreground">Все документы и индексация RAG будут привязаны к этому тенанту автоматически.</div>
      </Card>

      {canManage && (
        <Card className="p-4 space-y-3">
          <h2 className="font-medium">Добавить документ</h2>
          <form onSubmit={onCreate} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Заголовок</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">Тип</label>
                <Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Язык</label>
                <Input value={form.locale} onChange={e => setForm({ ...form, locale: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Теги (через запятую)</label>
                <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Привязка</label>
              <div className="text-sm py-2 px-3 border rounded bg-muted/30">Ваш тенант (автоматически, без возможности изменения)</div>
              <div className="text-xs text-muted-foreground mt-1">Документ будет виден только в рамках вашего тенанта и использоваться ИИ только для ваших ботов/аккаунта.</div>
            </div>
            <div>
              <label className="block text-sm mb-1">Контент</label>
              <textarea className="w-full border rounded p-2 h-40" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <Button type="submit" disabled={loading}>Сохранить</Button>
          </form>
          {role === 'admin' && (
            <div className="pt-3 space-x-2">
              <Button type="button" variant="secondary" disabled={indexing.running} onClick={onIndexPage}>Индексировать страницу</Button>
              <Button type="button" variant="secondary" disabled={indexing.running} onClick={onIndexAll}>Индексировать всё</Button>
              {indexing.running && <span className="text-sm text-muted-foreground ml-2">Индексация… {indexing.indexed} чанк(ов)</span>}
              {!indexing.running && (indexing.indexed > 0) && <span className="text-sm text-green-600 ml-2">Готово: {indexing.indexed} чанк(ов)</span>}
              {indexing.stepError && <div className="text-sm text-red-600 mt-2">Ошибка: {indexing.stepError}</div>}
            </div>
          )}
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-medium">Документы</h2>
        {loading && <div>Загрузка…</div>}
        {docs.map(d => (
          <Card key={d.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{d.title}</div>
                <div className="text-sm text-muted-foreground">{d.type} · {d.locale} · {d.visibility} · status: {d.status}</div>
              </div>
              {canManage && (
                <Button type="button" variant="secondary" onClick={() => openEdit(d.id)}>Редактировать</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <Card className="p-4 space-y-3">
          <h2 className="font-medium">Редактирование документа</h2>
          {editError && <div className="text-sm text-red-600">{editError}</div>}
          <div>
            <label className="block text-sm mb-1">Заголовок</label>
            <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Тип</label>
              <Input value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Язык</label>
              <Input value={editForm.locale} onChange={e => setEditForm({ ...editForm, locale: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Теги (через запятую)</label>
              <Input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Контент</label>
            <textarea className="w-full border rounded p-2 h-40" value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={onSaveEdit} disabled={editLoading}>Сохранить</Button>
            <Button type="button" variant="secondary" onClick={() => { setEditing(null); setEditError(''); }} disabled={editLoading}>Отмена</Button>
          </div>
        </Card>
      )}
    </div>
  );
}


