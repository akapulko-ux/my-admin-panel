// src/pages/EditDeveloper.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from "../utils/firebaseStorage";
import imageCompression from "browser-image-compression";
import { showSuccess, showError } from '../utils/notifications';
import { Building2, Upload, Save } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";

function EditDeveloper() {
  const navigate = useNavigate();
  const { id } = useParams(); // либо "new", либо реальный docId

  // Мобильная детекция
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [approved, setApproved] = useState(false);

  // Логотип: File (для загрузки) и URL (для предпросмотра)
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Загружаем данные, если id не "new"
  useEffect(() => {
    async function fetchData() {
      if (id === "new") {
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "developers", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setDescription(data.description || "");
          setApproved(data.approved || false);
          if (data.logo) {
            setLogoPreview(data.logo);
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки застройщика:", error);
        showError("Ошибка при загрузке данных!");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Обработчик выбора файла (логотип)
  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 5,
        useWebWorker: true
      });
      setLogoFile(compressed);
      setLogoPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Ошибка сжатия:", err);
      showError("Ошибка при обработке изображения!");
    }
  };

  // Сохранение (создание или обновление)
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Сохраняем старый логотип для последующего удаления
      const oldLogoUrl = logoPreview;

      let newLogoUrl = logoPreview;

      // Если выбран новый логотип, сначала загружаем его в Storage
      if (logoFile) {
        newLogoUrl = await uploadToFirebaseStorageInFolder(logoFile, "developers");
      }

      // Подготавливаем данные для обновления или создания
      const newData = {
        name: name.trim(),
        description: description.trim(),
        approved: approved,
        logo: newLogoUrl || ""
      };

      if (id === "new") {
        await addDoc(collection(db, "developers"), newData);
      } else {
        await updateDoc(doc(db, "developers", id), newData);
      }

      // Если документ редактируется и выбран новый логотип,
      // а старый логотип существует и отличается от нового, удаляем старый
      if (id !== "new" && logoFile && oldLogoUrl && oldLogoUrl !== newLogoUrl && !oldLogoUrl.startsWith("blob:")) {
        try {
          await deleteFileFromFirebaseStorage(oldLogoUrl);
          console.log("Старый логотип успешно удалён из Storage");
        } catch (deleteError) {
          console.error("Ошибка удаления старого логотипа:", deleteError);
          // Можно продолжить даже если удаление не удалось
        }
      }

      showSuccess("Сохранено!");
      navigate("/developers/list");
    } catch (error) {
      console.error("Ошибка сохранения застройщика:", error);
      showError("Ошибка при сохранении!");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`container max-w-2xl mx-auto py-${isMobile ? '4' : '8'} px-4`}>
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-${isMobile ? 'lg' : 'xl'}`}>
            <Building2 className={`h-${isMobile ? '5' : '6'} w-${isMobile ? '5' : '6'}`} />
            {id === "new" ? "Добавить Застройщика" : "Редактировать Застройщика"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Имя застройщика</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Введите имя застройщика"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание застройщика"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="approved"
                checked={approved}
                onCheckedChange={setApproved}
              />
              <Label htmlFor="approved" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Проверено сервисом
              </Label>
            </div>

            {logoPreview && (
              <div className="space-y-2">
                <Label>Текущий логотип</Label>
                <div className={`relative ${isMobile ? 'w-32 h-32' : 'w-40 h-40'} rounded-lg overflow-hidden border`}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="logo">Логотип</Label>
              <div className={`flex items-center gap-4 ${isMobile ? 'flex-col' : ''}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo').click()}
                  className={`${isMobile ? 'w-full h-12' : ''}`}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Загрузить логотип
                </Button>
                <input
                  id="logo"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'} pt-4`}>
              <Button type="submit" disabled={isSaving} className={`${isMobile ? 'w-full h-12' : ''}`}>
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {id === "new" ? "Добавить" : "Сохранить"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EditDeveloper;