import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Edit3, Trash2, Users } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

const ALL_ROLES = ['admin', 'модератор', 'застройщик', 'agent', 'premium agent', 'user'];

const Education = () => {
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].education;
  const navigate = useNavigate();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionNameEn, setSectionNameEn] = useState('');
  const [sectionNameRu, setSectionNameRu] = useState('');
  const [sectionNameId, setSectionNameId] = useState('');
  const [sectionDescriptionEn, setSectionDescriptionEn] = useState('');
  const [sectionDescriptionRu, setSectionDescriptionRu] = useState('');
  const [sectionDescriptionId, setSectionDescriptionId] = useState('');
  const [sectionRoles, setSectionRoles] = useState(['admin', 'модератор']);
  const [saving, setSaving] = useState(false);

  const loadSections = useCallback(async () => {
    setLoading(true);
    const q = collection(db, 'educationSections');
    const snap = await getDocs(q);
    let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Фильтрация по ролям пользователя
    data = data.filter(section => section.roles && section.roles.includes(role));
    setSections(data);
    setLoading(false);
  }, [role]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const handleCreateSection = async () => {
    if (!sectionNameEn.trim() && !sectionNameRu.trim() && !sectionNameId.trim()) return;
    setSaving(true);
    await addDoc(collection(db, 'educationSections'), {
      nameEn: sectionNameEn.trim(),
      nameRu: sectionNameRu.trim(),
      nameId: sectionNameId.trim(),
      descriptionEn: sectionDescriptionEn.trim(),
      descriptionRu: sectionDescriptionRu.trim(),
      descriptionId: sectionDescriptionId.trim(),
      roles: sectionRoles,
      createdAt: new Date()
    });
    setShowCreateDialog(false);
    resetForm();
    loadSections();
    setSaving(false);
  };

  const handleEditSection = async () => {
    if (!selectedSection) return;
    setSaving(true);
    await updateDoc(doc(db, 'educationSections', selectedSection.id), {
      nameEn: sectionNameEn.trim(),
      nameRu: sectionNameRu.trim(),
      nameId: sectionNameId.trim(),
      descriptionEn: sectionDescriptionEn.trim(),
      descriptionRu: sectionDescriptionRu.trim(),
      descriptionId: sectionDescriptionId.trim(),
      roles: sectionRoles
    });
    setShowEditDialog(false);
    setSelectedSection(null);
    resetForm();
    loadSections();
    setSaving(false);
  };

  const handleDeleteSection = async () => {
    if (!selectedSection) return;
    setSaving(true);
    await deleteDoc(doc(db, 'educationSections', selectedSection.id));
    setShowDeleteDialog(false);
    setSelectedSection(null);
    loadSections();
    setSaving(false);
  };

  const openEditDialog = (section) => {
    setSelectedSection(section);
    setSectionNameEn(section.nameEn || '');
    setSectionNameRu(section.nameRu || '');
    setSectionNameId(section.nameId || '');
    setSectionDescriptionEn(section.descriptionEn || '');
    setSectionDescriptionRu(section.descriptionRu || '');
    setSectionDescriptionId(section.descriptionId || '');
    setSectionRoles(section.roles || []);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (section) => {
    setSelectedSection(section);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setSectionNameEn('');
    setSectionNameRu('');
    setSectionNameId('');
    setSectionDescriptionEn('');
    setSectionDescriptionRu('');
    setSectionDescriptionId('');
    setSectionRoles(['admin', 'модератор']);
  };

  const getSectionName = (section) => {
    switch (language) {
      case 'en': return section.nameEn || section.nameRu || section.nameId || 'Untitled';
      case 'ru': return section.nameRu || section.nameEn || section.nameId || 'Без названия';
      case 'id': return section.nameId || section.nameEn || section.nameRu || 'Tanpa Judul';
      default: return section.nameEn || section.nameRu || section.nameId || 'Untitled';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.sections}</h1>
        {role === 'admin' && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.createSection}
          </Button>
        )}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map(section => (
            <Card key={section.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg" onClick={() => navigate(`/education/section/${section.id}`)}>
                  {getSectionName(section)}
                </CardTitle>
                <div className="flex gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" title={section.roles?.join(', ')} />
                  {role === 'admin' && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(section)}><Edit3 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(section)}><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {section[`description${language.charAt(0).toUpperCase() + language.slice(1)}`] || ''}
                </div>
                {(role === 'admin' || role === 'модератор') ? (
                  <div className="flex flex-wrap gap-1">
                    {section.roles?.map(r => (
                      <span key={r} className="bg-gray-100 text-xs rounded px-2 py-0.5 border border-gray-200">{r}</span>
                    ))}
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/education/section/${section.id}`)}
                  >
                    {t.goToEducation}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог создания раздела */}
      <ConfirmDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title={t.createSection}
        description={t.sectionDescription}
        confirmText={t.save}
        cancelText={t.cancel}
        onConfirm={handleCreateSection}
        loading={saving}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div>
              <Label>{t.sectionNameEn}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={sectionNameEn} onChange={e => setSectionNameEn(e.target.value)} placeholder="Section name in English" />
            </div>
            <div>
              <Label>{t.sectionNameRu}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={sectionNameRu} onChange={e => setSectionNameRu(e.target.value)} placeholder="Название раздела на русском" />
            </div>
            <div>
              <Label>{t.sectionNameId}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={sectionNameId} onChange={e => setSectionNameId(e.target.value)} placeholder="Nama bagian dalam bahasa Indonesia" />
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <Label>{t.sectionDescriptionEn}</Label>
              <Textarea className="w-full" value={sectionDescriptionEn} onChange={e => setSectionDescriptionEn(e.target.value)} placeholder="Section description in English" rows={3} />
            </div>
            <div>
              <Label>{t.sectionDescriptionRu}</Label>
              <Textarea className="w-full" value={sectionDescriptionRu} onChange={e => setSectionDescriptionRu(e.target.value)} placeholder="Описание раздела на русском" rows={3} />
            </div>
            <div>
              <Label>{t.sectionDescriptionId}</Label>
              <Textarea className="w-full" value={sectionDescriptionId} onChange={e => setSectionDescriptionId(e.target.value)} placeholder="Deskripsi bagian dalam bahasa Indonesia" rows={3} />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">{t.availableRoles}</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_ROLES.map(r => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={sectionRoles.includes(r)} onChange={e => {
                    if (e.target.checked) setSectionRoles([...sectionRoles, r]);
                    else setSectionRoles(sectionRoles.filter(x => x !== r));
                  }} className="accent-blue-600" />
                  {r}
                </label>
              ))}
            </div>
          </div>
        </div>
      </ConfirmDialog>

      {/* Диалог редактирования раздела */}
      <ConfirmDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title={t.editSection}
        description={t.sectionDescription}
        confirmText={t.save}
        cancelText={t.cancel}
        onConfirm={handleEditSection}
        loading={saving}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div>
              <Label>{t.sectionNameEn}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={sectionNameEn} onChange={e => setSectionNameEn(e.target.value)} placeholder="Section name in English" />
            </div>
            <div>
              <Label>{t.sectionNameRu}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={sectionNameRu} onChange={e => setSectionNameRu(e.target.value)} placeholder="Название раздела на русском" />
            </div>
            <div>
              <Label>{t.sectionNameId}</Label>
              <Input className="w-full py-1 px-3 rounded border text-sm h-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" value={sectionNameId} onChange={e => setSectionNameId(e.target.value)} placeholder="Nama bagian dalam bahasa Indonesia" />
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <Label>{t.sectionDescriptionEn}</Label>
              <Textarea className="w-full" value={sectionDescriptionEn} onChange={e => setSectionDescriptionEn(e.target.value)} placeholder="Section description in English" rows={3} />
            </div>
            <div>
              <Label>{t.sectionDescriptionRu}</Label>
              <Textarea className="w-full" value={sectionDescriptionRu} onChange={e => setSectionDescriptionRu(e.target.value)} placeholder="Описание раздела на русском" rows={3} />
            </div>
            <div>
              <Label>{t.sectionDescriptionId}</Label>
              <Textarea className="w-full" value={sectionDescriptionId} onChange={e => setSectionDescriptionId(e.target.value)} placeholder="Deskripsi bagian dalam bahasa Indonesia" rows={3} />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">{t.availableRoles}</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_ROLES.map(r => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={sectionRoles.includes(r)} onChange={e => {
                    if (e.target.checked) setSectionRoles([...sectionRoles, r]);
                    else setSectionRoles(sectionRoles.filter(x => x !== r));
                  }} className="accent-blue-600" />
                  {r}
                </label>
              ))}
            </div>
          </div>
        </div>
      </ConfirmDialog>

      {/* Диалог удаления раздела */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t.deleteSection}
        description={t.confirmDeleteSection}
        confirmText={t.deleteSection}
        cancelText={t.cancel}
        onConfirm={handleDeleteSection}
        loading={saving}
      >
        <div className="text-red-600 font-semibold">{getSectionName(selectedSection || {})}</div>
      </ConfirmDialog>
    </div>
  );
};

export default Education; 