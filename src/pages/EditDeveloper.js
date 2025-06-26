// src/pages/EditDeveloper.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from "../utils/firebaseStorage"; // Функции для работы со Storage
import imageCompression from "browser-image-compression";
import { showSuccess, showError } from '../utils/notifications';

import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  CircularProgress
} from "@mui/material";

function EditDeveloper() {
  const navigate = useNavigate();
  const { id } = useParams(); // либо "new", либо реальный docId

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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
          if (data.logo) {
            setLogoPreview(data.logo);
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
            <TextField
              label="Имя застройщика"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Описание"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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