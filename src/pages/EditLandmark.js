import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";

// Для Drag & Drop
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

// Импорт для сжатия и PDF-конвертации
import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";

import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Grid,
  CircularProgress
} from "@mui/material";

function EditLandmark() {
  const { id } = useParams();
  const navigate = useNavigate();

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

          // Заполняем поля
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

    // Настройки для сжатия
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
          // Обычный файл (jpg/png)
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

  // Удалить одно изображение из массива
  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Сохранить изменения
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Собираем итоговый массив URL (старые + новые)
      const finalUrls = [];
      for (let item of images) {
        if (item.file) {
          // Новое изображение — загружаем в Cloudinary
          const url = await uploadToCloudinary(item.file);
          finalUrls.push(url);
        } else {
          // Старое изображение
          finalUrls.push(item.url);
        }
      }

      // Обновляем документ в Firestore
      const updatedData = {
        name,
        coordinates,
        description,
        images: finalUrls
      };
      await updateDoc(doc(db, "landmarks", id), updatedData);

      alert("Достопримечательность обновлена!");
      // navigate("/landmark/list"); // или другой маршрут
    } catch (error) {
      console.error("Ошибка обновления достопримечательности:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление достопримечательности
  const handleDelete = async () => {
    if (window.confirm("Вы действительно хотите удалить эту достопримечательность?")) {
      try {
        await deleteDoc(doc(db, "landmarks", id));
        alert("Достопримечательность удалена!");
        navigate("/landmark/list");
      } catch (error) {
        console.error("Ошибка удаления достопримечательности:", error);
      }
    }
  };

  if (loading) {
    return <Box sx={{ p: 2 }}>Загрузка...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 800, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Редактировать Достопримечательность (ID: {id})
          </Typography>

          <DndProvider backend={HTML5Backend}>
            <Box
              component="form"
              onSubmit={handleSave}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              {/* Название (только заглавные латинские буквы и пробел) */}
              <TextField
                label="Название"
                value={name}
                onChange={handleNameChange}
                required
              />

              {/* Координаты */}
              <TextField
                label="Координаты (шир, долг)"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
              />

              {/* Описание */}
              <TextField
                label="Описание"
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Существующие/новые фото (Drag & Drop) */}
              <Typography>Фото (Drag & Drop):</Typography>
              <Grid container spacing={2}>
                {images.map((item, idx) => (
                  <Grid item xs={6} sm={4} key={item.id}>
                    <DraggablePreviewItem
                      item={item}
                      index={idx}
                      moveItem={moveImage}
                      onRemove={() => handleRemoveImage(idx)}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Кнопка "Добавить фото / PDF" */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Загрузка...
                    </>
                  ) : (
                    "Добавить фото / PDF"
                  )}
                  <input type="file" hidden multiple onChange={handleFileChange} />
                </Button>
              </Box>

              {/* Кнопки "Сохранить" / "Удалить" */}
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                {isSaving ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={24} />
                    <Typography>Сохраняем...</Typography>
                  </Box>
                ) : (
                  <Button variant="contained" color="primary" type="submit">
                    Сохранить
                  </Button>
                )}

                <Button variant="contained" color="error" onClick={handleDelete}>
                  Удалить
                </Button>
              </Box>
            </Box>
          </DndProvider>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EditLandmark;