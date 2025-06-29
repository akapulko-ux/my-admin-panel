import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
// Заменяем импорт функции загрузки с Cloudinary на Firebase Storage
import { uploadToFirebaseStorageInFolder } from "../utils/firebaseStorage";
import { showSuccess } from '../utils/notifications';
import { Landmark, Plus, Upload, X, Save } from "lucide-react";

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

import imageCompression from "browser-image-compression";

function CreateLandmark() {
  // Поля формы
  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [description, setDescription] = useState("");

  // Массив для предпросмотра фото
  const [images, setImages] = useState([]);

  // Состояния для спиннеров
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Обработчик изменения поля "Название".
   * Позволяет только заглавные английские буквы (A-Z) и пробелы.
   */
  const handleNameChange = (e) => {
    const input = e.target.value
      .toUpperCase()          // всё приводим к верхнему регистру
      .replace(/[^A-Z ]/g, ""); // удаляем все символы, кроме A-Z и пробела
    setName(input);
  };

  /**
   * Обработчик выбора файлов (сжатие).
   */
  const handleFileChange = async (e) => {
    if (!e.target.files) return;

    setIsUploading(true);
    const selectedFiles = Array.from(e.target.files);

    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };

    const newImages = [];
    try {
      for (let file of selectedFiles) {
        // Сжимаем файл (jpg/png и т.д.)
        const compressedFile = await imageCompression(file, compressionOptions);
        newImages.push({
          id: crypto.randomUUID(),
          file: compressedFile,
          url: URL.createObjectURL(compressedFile)
        });
      }
    } catch (err) {
      console.error("Ошибка сжатия файла:", err);
    }

    setImages((prev) => [...prev, ...newImages]);
    setIsUploading(false);
  };

  /**
   * Удаление одного фото (предпросмотр).
   */
  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  /**
   * Сохранение достопримечательности (Firestore + Firebase Storage).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1) Загружаем фото в Firebase Storage в папку "landmarks"
      const uploadedUrls = [];
      for (let item of images) {
        const secureUrl = await uploadToFirebaseStorageInFolder(item.file, "landmarks");
        uploadedUrls.push(secureUrl);
      }

      // 2) Сформировать объект
      const newLandmark = {
        name: name.trim(),
        coordinates: coordinates.trim(),
        description: description.trim(),
        images: uploadedUrls,
        createdAt: new Date()
      };

      // 3) Добавить в коллекцию "landmarks"
      await addDoc(collection(db, "landmarks"), newLandmark);

      // 4) Сброс полей
      setName("");
      setCoordinates("");
      setDescription("");
      setImages([]);

      showSuccess("Достопримечательность создана!");
    } catch (error) {
      console.error("Ошибка создания достопримечательности:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Добавить Достопримечательность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={name}
                onChange={handleNameChange}
                required
                placeholder="Только заглавные латинские буквы"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinates">Координаты (шир, долг)</Label>
              <Input
                id="coordinates"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                required
                placeholder="Например: -8.409518, 115.188919"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Опишите достопримечательность..."
              />
            </div>

            <div className="space-y-4">
              <Label>Фотографии</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.url}
                      alt="preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(img.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('file-upload').click()}
                  className="relative"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Загрузка...
                    </div>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Загрузить фото
                    </>
                  )}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="min-w-[150px]"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Сохранение...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Создать
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

export default CreateLandmark;