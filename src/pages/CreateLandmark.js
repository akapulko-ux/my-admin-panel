// src/pages/CreateLandmark.js

import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";

// Импортируем для UI
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

// Импортируем библиотеку для сжатия изображений
import imageCompression from "browser-image-compression";

/**
 * Компонент для создания «достопримечательности» (landmark).
 * Создаёт документ в новой коллекции Firestore (например, "landmarks").
 */
function CreateLandmark() {
  // Поля формы
  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [description, setDescription] = useState("");

  // Список выбранных (и сжатых) изображений для предпросмотра
  const [images, setImages] = useState([]);

  // Состояния для спиннеров
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Обработчик выбора файлов (из input type="file").
   * Выполняет сжатие и сохраняет в массив для предпросмотра.
   */
  const handleFileChange = async (e) => {
    if (!e.target.files) return;

    setIsUploading(true); // Включаем спиннер
    const selectedFiles = Array.from(e.target.files);

    // Настройки сжатия (макс. 10 MB)
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
    setIsUploading(false); // Выключаем спиннер
  };

  /**
   * Удаление одного фото из массива (при предпросмотре).
   */
  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  /**
   * Сохранение достопримечательности в Firestore (коллекция "landmarks").
   * Фото загружаются в Cloudinary, а их URL сохраняются в Firestore.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1) Загружаем каждое фото в Cloudinary
      const uploadedUrls = [];
      for (let item of images) {
        const secureUrl = await uploadToCloudinary(item.file);
        uploadedUrls.push(secureUrl);
      }

      // 2) Формируем объект достопримечательности
      const newLandmark = {
        name: name.trim(),
        coordinates: coordinates.trim(),
        description: description.trim(),
        images: uploadedUrls,
        createdAt: new Date()
      };

      // 3) Сохраняем в Firestore (коллекция "landmarks")
      await addDoc(collection(db, "landmarks"), newLandmark);

      // 4) Сбрасываем поля
      setName("");
      setCoordinates("");
      setDescription("");
      setImages([]);

      alert("Достопримечательность создана!");
    } catch (error) {
      console.error("Ошибка создания достопримечательности:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Достопримечательность
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Поле «Название» */}
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Поле «Координаты» */}
            <TextField
              label="Координаты (шир, долг)"
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
              required
            />

            {/* Поле «Описание» */}
            <TextField
              label="Описание"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Предпросмотр выбранных фото */}
            <Typography sx={{ mt: 2 }}>
              Предпросмотр фото:
            </Typography>
            <Grid container spacing={2}>
              {images.map((img) => (
                <Grid item xs={6} sm={4} key={img.id}>
                  <Box position="relative">
                    <img
                      src={img.url}
                      alt="preview"
                      style={{ width: "100%", height: "auto", borderRadius: 4 }}
                    />
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveImage(img.id)}
                      sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                      Удалить
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Кнопка «Загрузить фото» со спиннером */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                  "Загрузить фото"
                )}
                <input type="file" hidden multiple onChange={handleFileChange} />
              </Button>
            </Box>

            {/* Кнопка «Создать» или спиннер */}
            {isSaving ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={24} />
                <Typography>Сохраняем...</Typography>
              </Box>
            ) : (
              <Button variant="contained" color="primary" type="submit">
                Создать
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateLandmark;