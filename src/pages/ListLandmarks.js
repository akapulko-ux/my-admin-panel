import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import {
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  LinearProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Функция для очистки имени папки
const sanitizeFolderName = (name) => {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "Landmark";
};

// Функция для определения расширения файла по типу Blob
const getExtensionFromBlob = (blob) => {
  const type = blob.type;
  if (type.includes("jpeg")) return "jpg";
  if (type.includes("png")) return "png";
  if (type.includes("gif")) return "gif";
  return "jpg"; // fallback
};

function ListLandmarks() {
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Новые состояния для скачивания
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedImages, setDownloadedImages] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  useEffect(() => {
    async function fetchLandmarks() {
      try {
        const snapshot = await getDocs(collection(db, "landmarks"));
        const loaded = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setLandmarks(loaded);
      } catch (error) {
        console.error("Ошибка загрузки достопримечательностей:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLandmarks();
  }, []);

  // Фильтрация по поисковой строке
  const filteredLandmarks = landmarks.filter((landmark) => {
    const term = searchTerm.toLowerCase();
    const name = (landmark.name || "").toLowerCase();
    const coords = (landmark.coordinates || "").toLowerCase();
    const desc = (landmark.description || "").toLowerCase();
    return (
      name.includes(term) ||
      coords.includes(term) ||
      desc.includes(term)
    );
  });

  // Функция для скачивания всех фотографий
  const handleDownloadAllPhotos = async () => {
    setDownloading(true);
    setProgress(0);
    setDownloadedImages(0);
    let total = 0;
    // Подсчитываем общее количество изображений во всех достопримечательностях
    landmarks.forEach((landmark) => {
      if (landmark.images && Array.isArray(landmark.images)) {
        total += landmark.images.length;
      }
    });
    setTotalImages(total);

    const zip = new JSZip();
    let downloadedCount = 0;

    // Итерация по каждому landmark
    for (const landmark of landmarks) {
      const folderName = sanitizeFolderName(landmark.name);
      const folder = zip.folder(folderName);
      if (landmark.images && Array.isArray(landmark.images)) {
        for (const [index, imageUrl] of landmark.images.entries()) {
          try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
              console.error(`Ошибка загрузки изображения ${imageUrl}: ${response.statusText}`);
              continue;
            }
            const blob = await response.blob();
            const ext = getExtensionFromBlob(blob);
            const fileName = `image_${index + 1}.${ext}`;
            folder.file(fileName, blob);
          } catch (err) {
            console.error("Ошибка при скачивании изображения:", err);
          }
          downloadedCount++;
          setDownloadedImages(downloadedCount);
          setProgress(Math.round((downloadedCount / total) * 100));
        }
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
      setProgress(Math.round(metadata.percent));
    });
    saveAs(zipBlob, "landmarks_photos.zip");
    setDownloading(false);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (landmarks.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Нет достопримечательностей</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Достопримечательностей
      </Typography>

      {/* Строка поиска */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Поиск"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Введите название, координаты или описание..."
          fullWidth
        />
      </Box>

      {/* Кнопка скачивания всех фотографий */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleDownloadAllPhotos}
          disabled={downloading}
        >
          Скачать все фотографии
        </Button>
      </Box>

      {/* Прогресс-бар */}
      {downloading && (
        <Box sx={{ mb: 2 }}>
          <Typography>
            Загружено {downloadedImages} из {totalImages} изображений ({progress}%)
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {filteredLandmarks.length === 0 ? (
        <Typography>Ничего не найдено по вашему запросу.</Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredLandmarks.map((landmark) => (
            <Grid item xs={12} sm={6} md={4} key={landmark.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {landmark.name || "Без названия"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Координаты: {landmark.coordinates || "не указаны"}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {landmark.description || ""}
                  </Typography>
                  {landmark.images && landmark.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <img
                        src={landmark.images[0]}
                        alt="landmark"
                        style={{ width: "100%", borderRadius: 4 }}
                      />
                    </Box>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/landmark/edit/${landmark.id}`)}
                    >
                      Редактировать
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default ListLandmarks;