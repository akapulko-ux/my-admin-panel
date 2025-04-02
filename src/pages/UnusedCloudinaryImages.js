// src/pages/UnusedCloudinaryImages.js

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress
} from "@mui/material";
import { db, app } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function UnusedCloudinaryImages() {
  const [unusedImages, setUnusedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});
  const [stats, setStats] = useState({
    totalCloudinary: 0,
    totalUsed: 0,
    totalUnused: 0
  });

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);

        // 1. Собираем все изображения, используемые в Firestore
        const collections = ["complexes", "properties", "landmarks"];
        const used = new Set();

        for (const col of collections) {
          const snap = await getDocs(collection(db, col));
          snap.forEach((doc) => {
            const data = doc.data();
            const imgs = data.images || [];
            imgs.forEach((url) => used.add(url));
          });
        }

        // 2. Вызываем облачную функцию Firebase
        const functions = getFunctions(app);
        const listImages = httpsCallable(functions, "listCloudinaryImages");
        const result = await listImages();

        const resources = result.data.resources || [];

        const unused = resources.filter((img) => !used.has(img.secure_url));

        setUnusedImages(unused);
        setStats({
          totalCloudinary: resources.length,
          totalUsed: used.size,
          totalUnused: unused.length
        });
      } catch (err) {
        console.error("Ошибка загрузки изображений:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleDelete = async (publicId) => {
    if (!window.confirm("Удалить это изображение?")) return;
    setDeleting((prev) => ({ ...prev, [publicId]: true }));

    try {
      // Вызов отдельной callable-функции удаления
      const functions = getFunctions(app);
      const deleteImage = httpsCallable(functions, "deleteCloudinaryImage");

      await deleteImage({ publicId });

      setUnusedImages((prev) => prev.filter((img) => img.public_id !== publicId));
    } catch (error) {
      console.error("Ошибка удаления:", error);
    } finally {
      setDeleting((prev) => ({ ...prev, [publicId]: false }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress /> Загрузка...
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Неиспользуемые изображения в Cloudinary
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Всего в Cloudinary: <strong>{stats.totalCloudinary}</strong> | Используются в Firestore:{" "}
        <strong>{stats.totalUsed}</strong> | Неиспользуемые:{" "}
        <strong>{stats.totalUnused}</strong>
      </Typography>

      {unusedImages.length === 0 ? (
        <Typography>Все изображения используются</Typography>
      ) : (
        <Grid container spacing={2}>
          {unusedImages.map((img) => (
            <Grid item xs={6} sm={4} md={3} key={img.public_id}>
              <Card>
                <CardContent>
                  <img
                    src={img.secure_url}
                    alt="preview"
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={() => handleDelete(img.public_id)}
                    disabled={deleting[img.public_id]}
                    sx={{ mt: 1 }}
                  >
                    {deleting[img.public_id] ? "Удаление..." : "Удалить"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}