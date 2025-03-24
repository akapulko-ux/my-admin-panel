// src/pages/EditDeveloper.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc
} from "firebase/firestore";

import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  CircularProgress
} from "@mui/material";

// Импорт для загрузки в Cloudinary
import { uploadToCloudinary } from "../utils/cloudinary";

// Импорт для сжатия изображений
import imageCompression from "browser-image-compression";

function EditDeveloper() {
  const navigate = useNavigate();
  const { id } = useParams(); // либо "new", либо реальный docId

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Логотип (храним URL и File для предпросмотра)
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Загружаем данные, если id != "new"
  useEffect(() => {
    async function fetchData() {
      if (id === "new") {
        // Новый застройщик, нечего грузить
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
          if (data.logo) {
            setLogoPreview(data.logo); // URL
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки застройщика:", error);
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

    // Сжимаем (необязательно, но полезно)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 5,
        useWebWorker: true
      });
      setLogoFile(compressed);
      setLogoPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Ошибка сжатия:", err);
    }
  };

  // Сохранение (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1) Если есть логотип (logoFile) — загружаем в Cloudinary
      let logoUrl = logoPreview; // если уже был
      if (logoFile) {
        logoUrl = await uploadToCloudinary(logoFile);
      }

      // 2) Собираем данные
      const newData = {
        name: name.trim(),
        description: description.trim(),
        logo: logoUrl || "" // может быть пусто
      };

      // 3) Если id === "new", создаём новый документ
      if (id === "new") {
        await addDoc(collection(db, "developers"), newData);
      } else {
        // Иначе обновляем существующий
        await updateDoc(doc(db, "developers", id), newData);
      }

      alert("Сохранено!");
      navigate("/developers/list"); // или куда-то ещё
    } catch (error) {
      console.error("Ошибка сохранения застройщика:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {id === "new" ? "Создать Застройщика" : "Редактировать Застройщика"}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSave}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Имя */}
            <TextField
              label="Имя застройщика"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Описание */}
            <TextField
              label="Описание"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Логотип (предпросмотр) */}
            {logoPreview && (
              <Box>
                <Typography>Предпросмотр логотипа:</Typography>
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ width: 150, height: "auto", borderRadius: 4 }}
                />
              </Box>
            )}
            <Button variant="contained" component="label">
              Загрузить логотип
              <input type="file" hidden onChange={handleFileChange} />
            </Button>

            {/* Кнопка "Создать" или "Сохранить" */}
            {isSaving ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={24} />
                <Typography>Сохраняем...</Typography>
              </Box>
            ) : (
              <Button variant="contained" color="primary" type="submit">
                {id === "new" ? "Создать" : "Сохранить"}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EditDeveloper;