import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
// Используем функцию загрузки и удаления из Firebase Storage
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from "../utils/firebaseStorage";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";

import {
  Card,
  CardContent,
  Button
} from "@mui/material";
import { showSuccess } from '../utils/notifications';
import { Landmark, Upload, Save, Trash2 } from "lucide-react";

import {
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

function EditLandmark() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // Состояния для загрузки данных и сохранения
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Поля достопримечательности
  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [description, setDescription] = useState("");

  // Массив изображений (старые + новые)
  const [images, setImages] = useState([]);

  // При монтировании загружаем данные из Firestore
  useEffect(() => {
    const fetchLandmark = async () => {
      try {
        const ref = doc(db, "landmarks", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setCoordinates(data.coordinates || "");
          setDescription(data.description || "");
          // Преобразуем массив строк (URL) в объекты { id, url, file: null }
          const oldImages = (data.images || []).map((imgUrl) => ({
            id: crypto.randomUUID(),
            url: imgUrl,
            file: null
          }));
          setImages(oldImages);
        }
      } catch (error) {
        console.error("Ошибка загрузки достопримечательности:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLandmark();
  }, [id]);

  /**
   * Обработчик изменения поля "Название".
   * Разрешаем только заглавные латинские буквы и пробелы.
   */
  const handleNameChange = (e) => {
    const input = e.target.value
      .toUpperCase()            // всё к верхнему регистру
      .replace(/[^A-Z ]/g, ""); // удаляем всё, кроме A-Z и пробела
    setName(input);
  };

  // Обработчик выбора новых файлов (jpg/png/pdf)
  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    setIsUploading(true);
    const selectedFiles = Array.from(e.target.files);
    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };
    const newImagesArr = [];
    try {
      for (let file of selectedFiles) {
        if (file.type === "application/pdf") {
          // Если PDF -> конвертируем в картинки
          const pageBlobs = await convertPdfToImages(file);
          for (let blob of pageBlobs) {
            const compressed = await imageCompression(blob, compressionOptions);
            newImagesArr.push({
              id: crypto.randomUUID(),
              file: compressed,
              url: URL.createObjectURL(compressed)
            });
          }
        } else {
          // Обычное изображение
          const compressedFile = await imageCompression(file, compressionOptions);
          newImagesArr.push({
            id: crypto.randomUUID(),
            file: compressedFile,
            url: URL.createObjectURL(compressedFile)
          });
        }
      }
    } catch (err) {
      console.error("Ошибка обработки файла:", err);
    }
    setImages((prev) => [...prev, ...newImagesArr]);
    setIsUploading(false);
  };

  // Перестановка (Drag & Drop)
  const moveImage = (dragIndex, hoverIndex) => {
    setImages((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, draggedItem);
      return updated;
    });
  };

  // Удаление изображения: если это старое фото (file === null) и URL не является локальным blob, удаляем его физически из Storage
  const handleRemoveImage = async (index) => {
    const removed = images[index];
    console.log("Удаляем изображение с URL:", removed.url);
    setImages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    if (!removed.file && !removed.url.startsWith("blob:")) {
      try {
        await deleteFileFromFirebaseStorage(removed.url);
        console.log("Файл удалён физически из Storage");
      } catch (error) {
        console.error("Ошибка удаления файла из Firebase Storage:", error);
      }
    } else {
      console.log("Локальный blob URL — физическое удаление не требуется");
    }
  };

  // Сохранить изменения
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalUrls = [];
      for (let item of images) {
        if (item.file) {
          // Новое изображение — загружаем в Firebase Storage в папку "landmarks"
          const url = await uploadToFirebaseStorageInFolder(item.file, "landmarks");
          finalUrls.push(url);
        } else {
          finalUrls.push(item.url);
        }
      }
      const updatedData = {
        name,
        coordinates,
        description,
        images: finalUrls
      };
      await updateDoc(doc(db, "landmarks", id), updatedData);
      showSuccess("Достопримечательность обновлена!");
      // Обновляем состояние images, чтобы для всех файлов file было null
      setImages(finalUrls.map(url => ({ id: crypto.randomUUID(), url, file: null })));
    } catch (error) {
      console.error("Ошибка обновления достопримечательности:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление достопримечательности и всех связанных фотографий из Firebase Storage
  const handleDelete = async () => {
    if (window.confirm("Вы действительно хотите удалить эту достопримечательность?")) {
      try {
        // Удаляем физически все файлы из Storage
        const deletionPromises = images.map((img) => {
          // Если файл уже загружен (нет локального blob URL)
          if (!img.file && !img.url.startsWith("blob:")) {
            return deleteFileFromFirebaseStorage(img.url).catch((error) => {
              console.error("Ошибка удаления файла из Storage:", error);
              // Продолжаем, даже если удаление не удалось
            });
          } else {
            return Promise.resolve();
          }
        });
        await Promise.all(deletionPromises);
        // Затем удаляем документ из Firestore
        await deleteDoc(doc(db, "landmarks", id));
        showSuccess("Достопримечательность и все фотографии удалены!");
        navigate("/landmark/list");
      } catch (error) {
        console.error("Ошибка удаления достопримечательности:", error);
      }
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
    <div className={`container mx-auto py-${isMobile ? '4' : '8'} px-4`}>
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-${isMobile ? 'lg' : 'xl'}`}>
            <Landmark className={`h-${isMobile ? '5' : '6'} w-${isMobile ? '5' : '6'}`} />
            {isMobile ? 'Редактировать Достопримечательность' : 'Редактировать Достопримечательность'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
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
                rows={4}
                placeholder="Опишите достопримечательность..."
              />
            </div>

            <div className="space-y-4">
              <Label>Фотографии (Drag & Drop)</Label>
              <DndProvider backend={HTML5Backend}>
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                  {images.map((item, idx) => (
                    <div key={item.id} className="relative">
                      <DraggablePreviewItem
                        id={item.id}
                        url={item.url}
                        index={idx}
                        moveImage={moveImage}
                        onRemove={() => handleRemoveImage(idx)}
                      />
                    </div>
                  ))}
                </div>
              </DndProvider>

              <div className={`flex items-center gap-4 ${isMobile ? 'flex-col' : ''}`}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('file-upload').click()}
                  className={`relative ${isMobile ? 'w-full h-12' : ''}`}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Загрузка...
                    </div>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Добавить фото / PDF
                    </>
                  )}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
              </div>
            </div>

            <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className={`${isMobile ? 'w-full h-12' : 'min-w-[150px]'}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>

              <Button
                type="submit"
                disabled={isSaving}
                className={`${isMobile ? 'w-full h-12' : 'min-w-[150px]'}`}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Сохранение...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить
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

export default EditLandmark;