// src/pages/CloudinaryCleanup.js

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Typography,
} from "@mui/material";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function CloudinaryCleanup() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ожидание действия...");
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    setStatus("Собираем ссылки из Firestore...");

    const allImageLinks = new Set();

    // Сканируем коллекции, в которых могут быть изображения
    const collectionsToScan = ["complexes", "properties", "landmarks", "developers"];

    for (let collectionName of collectionsToScan) {
      const snapshot = await getDocs(collection(db, collectionName));
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (Array.isArray(data.images)) {
          data.images.forEach((url) => allImageLinks.add(url));
        }
        if (typeof data.logo === "string") {
          allImageLinks.add(data.logo);
        }
      });
    }

    setStatus("Получаем список из Cloudinary...");

    // Получаем список всех файлов в Cloudinary (через API)
    const response = await fetch("/api/cloudinary/list");
    const result = await response.json();
    const allCloudinaryImages = result.resources || [];

    const unused = allCloudinaryImages.filter(
      (img) => !allImageLinks.has(img.secure_url)
    );

    setStatus(`Найдено ${unused.length} неиспользуемых фото. Удаляем...`);

    for (let i = 0; i < unused.length; i++) {
      const publicId = unused[i].public_id;
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId }),
      });

      setProgress(Math.round(((i + 1) / unused.length) * 100));
    }

    setStatus(`Удалено ${unused.length} фото!`);
    setIsCleaning(false);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", p: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Очистка Cloudinary
          </Typography>

          <Typography sx={{ mb: 2 }}>{status}</Typography>

          {isCleaning && <LinearProgress variant="determinate" value={progress} />}

          <Button
            variant="contained"
            onClick={handleCleanup}
            disabled={isCleaning}
            sx={{ mt: 2 }}
          >
            Очистить неиспользуемые фото
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
