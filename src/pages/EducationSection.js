import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Edit3, Trash2, ArrowLeft, Move } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

const EducationSection = () => {
  const { sectionId } = useParams();
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].education;
  const navigate = useNavigate();

  const [section, setSection] = useState(null);
  const [topics, setTopics] = useState([]);
  const [sections, setSections] = useState([]); // для перемещения тем
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicNameEn, setTopicNameEn] = useState('');
  const [topicNameRu, setTopicNameRu] = useState('');
  const [topicNameId, setTopicNameId] = useState('');
  const [topicDescriptionEn, setTopicDescriptionEn] = useState('');
  const [topicDescriptionRu, setTopicDescriptionRu] = useState('');
  const [topicDescriptionId, setTopicDescriptionId] = useState('');
  const [topicOrder, setTopicOrder] = useState(1);
  const [moveToSectionId, setMoveToSectionId] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = role === 'admin' || role === 'модератор';

  useEffect(() => {
    loadSectionAndTopics();
    if (canEdit) loadSections();
    // eslint-disable-next-line
  }, [sectionId]);

  const loadSectionAndTopics = async () => {
    setLoading(true);
    const sectionDoc = await getDocs(query(collection(db, 'educationSections'), where('__name__', '==', sectionId)));
    setSection(sectionDoc.docs[0] ? { id: sectionDoc.docs[0].id, ...sectionDoc.docs[0].data() } : null);
    const topicsQuery = query(collection(db, 'educationTopics'), where('sectionId', '==', sectionId));
    const topicsSnapshot = await getDocs(topicsQuery);
    const topicsData = topicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTopics(topicsData);
    setLoading(false);
  };

  const loadSections = async () => {
    const snap = await getDocs(collection(db, 'educationSections'));
    setSections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateTopic = async () => {
    if (!topicNameEn.trim() && !topicNameRu.trim() && !topicNameId.trim()) return;
    setSaving(true);
    await addDoc(collection(db, 'educationTopics'), {
      nameEn: topicNameEn.trim(),
      nameRu: topicNameRu.trim(),
      nameId: topicNameId.trim(),
      descriptionEn: topicDescriptionEn.trim(),
      descriptionRu: topicDescriptionRu.trim(),
      descriptionId: topicDescriptionId.trim(),
      order: parseInt(topicOrder) || 1,
      sectionId,
      createdAt: new Date(),
      createdBy: role
    });
    setShowCreateDialog(false);
    resetForm();
    loadSectionAndTopics();
    setSaving(false);
  };

  const handleEditTopic = async () => {
    if (!selectedTopic) return;
    setSaving(true);
    await updateDoc(doc(db, 'educationTopics', selectedTopic.id), {
      nameEn: topicNameEn.trim(),
      nameRu: topicNameRu.trim(),
      nameId: topicNameId.trim(),
      descriptionEn: topicDescriptionEn.trim(),
      descriptionRu: topicDescriptionRu.trim(),
      descriptionId: topicDescriptionId.trim(),
      order: parseInt(topicOrder) || 1,
      updatedAt: new Date()
    });
    setShowEditDialog(false);
    setSelectedTopic(null);
    resetForm();
    loadSectionAndTopics();
    setSaving(false);
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;
    setSaving(true);
    await deleteDoc(doc(db, 'educationTopics', selectedTopic.id));
    setShowDeleteDialog(false);
    setSelectedTopic(null);
    loadSectionAndTopics();
    setSaving(false);
  };

  const handleMoveTopic = async () => {
    if (!selectedTopic || !moveToSectionId) return;
    setSaving(true);
    await updateDoc(doc(db, 'educationTopics', selectedTopic.id), { sectionId: moveToSectionId });
    setShowMoveDialog(false);
    setSelectedTopic(null);
    setMoveToSectionId('');
    loadSectionAndTopics();
    setSaving(false);
  };

  const openEditDialog = (topic) => {
    setSelectedTopic(topic);
    setTopicNameEn(topic.nameEn || '');
    setTopicNameRu(topic.nameRu || '');
    setTopicNameId(topic.nameId || '');
    setTopicDescriptionEn(topic.descriptionEn || '');
    setTopicDescriptionRu(topic.descriptionRu || '');
    setTopicDescriptionId(topic.descriptionId || '');
    setTopicOrder(topic.order || 1);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (topic) => {
    setSelectedTopic(topic);
    setShowDeleteDialog(true);
  };

  const openMoveDialog = (topic) => {
    setSelectedTopic(topic);
    setMoveToSectionId('');
    setShowMoveDialog(true);
  };

  const resetForm = () => {
    setTopicNameEn('');
    setTopicNameRu('');
    setTopicNameId('');
    setTopicDescriptionEn('');
    setTopicDescriptionRu('');
    setTopicDescriptionId('');
    setTopicOrder(1);
  };

  const getTopicName = (topic) => {
    switch (language) {
      case 'en': return topic.nameEn || topic.nameRu || topic.nameId || 'Untitled';
      case 'ru': return topic.nameRu || topic.nameEn || topic.nameId || 'Без названия';
      case 'id': return topic.nameId || topic.nameEn || topic.nameRu || 'Tanpa Judul';
      default: return topic.nameEn || topic.nameRu || topic.nameId || 'Untitled';
    }
  };

  const getTopicDescription = (topic) => {
    switch (language) {
      case 'en': return topic.descriptionEn || topic.descriptionRu || topic.descriptionId || '';
      case 'ru': return topic.descriptionRu || topic.descriptionEn || topic.descriptionId || '';
      case 'id': return topic.descriptionId || topic.descriptionEn || topic.descriptionRu || '';
      default: return topic.descriptionEn || topic.descriptionRu || topic.descriptionId || '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/education')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToSection}
        </Button>
        <h1 className="text-3xl font-bold">{section ? (section[`name${language.charAt(0).toUpperCase() + language.slice(1)}`] || '') : ''}</h1>
        {canEdit && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.createTopic}
          </Button>
        )}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map(topic => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg cursor-pointer" onClick={() => navigate(`/education/topic/${topic.id}`)}>
                  {getTopicName(topic)}
                </CardTitle>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(topic)}><Edit3 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(topic)}><Trash2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => openMoveDialog(topic)}><Move className="h-4 w-4" /></Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {getTopicDescription(topic)}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/education/topic/${topic.id}`)}
                >
                  {t.viewLessons}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог создания темы */}
      <ConfirmDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title={t.createTopic}
        description={t.topicName}
        confirmText={t.save}
        cancelText={t.cancel}
        onConfirm={handleCreateTopic}
        loading={saving}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div>
              <Label>{t.topicNameEn}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={topicNameEn} onChange={e => setTopicNameEn(e.target.value)} placeholder="Topic name in English" />
            </div>
            <div>
              <Label>{t.topicNameRu}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={topicNameRu} onChange={e => setTopicNameRu(e.target.value)} placeholder="Название темы на русском" />
            </div>
            <div>
              <Label>{t.topicNameId}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={topicNameId} onChange={e => setTopicNameId(e.target.value)} placeholder="Nama topik dalam bahasa Indonesia" />
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <Label>{t.topicDescriptionEn}</Label>
              <Textarea className="w-full" value={topicDescriptionEn} onChange={e => setTopicDescriptionEn(e.target.value)} placeholder="Topic description in English" rows={3} />
            </div>
            <div>
              <Label>{t.topicDescriptionRu}</Label>
              <Textarea className="w-full" value={topicDescriptionRu} onChange={e => setTopicDescriptionRu(e.target.value)} placeholder="Описание темы на русском" rows={3} />
            </div>
            <div>
              <Label>{t.topicDescriptionId}</Label>
              <Textarea className="w-full" value={topicDescriptionId} onChange={e => setTopicDescriptionId(e.target.value)} placeholder="Deskripsi topik dalam bahasa Indonesia" rows={3} />
            </div>
          </div>
          <div>
            <Label>{t.order}</Label>
            <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" type="number" value={topicOrder} onChange={e => setTopicOrder(e.target.value)} min="1" placeholder="1" />
          </div>
        </div>
      </ConfirmDialog>

      {/* Диалог редактирования темы */}
      <ConfirmDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title={t.editTopic}
        description={t.topicName}
        confirmText={t.save}
        cancelText={t.cancel}
        onConfirm={handleEditTopic}
        loading={saving}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div>
              <Label>{t.topicNameEn}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={topicNameEn} onChange={e => setTopicNameEn(e.target.value)} placeholder="Topic name in English" />
            </div>
            <div>
              <Label>{t.topicNameRu}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={topicNameRu} onChange={e => setTopicNameRu(e.target.value)} placeholder="Название темы на русском" />
            </div>
            <div>
              <Label>{t.topicNameId}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={topicNameId} onChange={e => setTopicNameId(e.target.value)} placeholder="Nama topik dalam bahasa Indonesia" />
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <Label>{t.topicDescriptionEn}</Label>
              <Textarea className="w-full" value={topicDescriptionEn} onChange={e => setTopicDescriptionEn(e.target.value)} placeholder="Topic description in English" rows={3} />
            </div>
            <div>
              <Label>{t.topicDescriptionRu}</Label>
              <Textarea className="w-full" value={topicDescriptionRu} onChange={e => setTopicDescriptionRu(e.target.value)} placeholder="Описание темы на русском" rows={3} />
            </div>
            <div>
              <Label>{t.topicDescriptionId}</Label>
              <Textarea className="w-full" value={topicDescriptionId} onChange={e => setTopicDescriptionId(e.target.value)} placeholder="Deskripsi topik dalam bahasa Indonesia" rows={3} />
            </div>
          </div>
          <div>
            <Label>{t.order}</Label>
            <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" type="number" value={topicOrder} onChange={e => setTopicOrder(e.target.value)} min="1" placeholder="1" />
          </div>
        </div>
      </ConfirmDialog>

      {/* Диалог удаления темы */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t.deleteTopic}
        description={t.confirmDeleteTopic}
        confirmText={t.deleteTopic}
        cancelText={t.cancel}
        onConfirm={handleDeleteTopic}
        loading={saving}
      >
        <div className="text-red-600 font-semibold">{getTopicName(selectedTopic || {})}</div>
      </ConfirmDialog>

      {/* Диалог перемещения темы */}
      <ConfirmDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        title={t.moveTopic}
        description={t.moveTopicToSection}
        confirmText={t.save}
        cancelText={t.cancel}
        onConfirm={handleMoveTopic}
        loading={saving}
      >
        <div className="space-y-4">
          <label>{t.sections}</label>
          <select className="w-full" value={moveToSectionId} onChange={e => setMoveToSectionId(e.target.value)}>
            <option value="">{t.sections}</option>
            {sections.filter(s => s.id !== sectionId).map(s => (
              <option key={s.id} value={s.id}>{s[`name${language.charAt(0).toUpperCase() + language.slice(1)}`] || ''}</option>
            ))}
          </select>
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default EducationSection; 