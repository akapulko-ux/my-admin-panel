// src/pages/CreateLandmark.js

import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";

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
   * Сохранение достопримечательности (Firestore + Cloudinary).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1) Загрузить фото в Cloudinary
      const uploadedUrls = [];
      for (let item of images) {
        const secureUrl = await uploadToCloudinary(item.file);
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
            {/* Поле «Название» — только A-Z и пробел */}
            <TextField
              label="Название"
              value={name}
              onChange={handleNameChange}
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
            <Typography sx={{ mt: 2 }}>Предпросмотр фото:</Typography>
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