import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { Landmark, Plus, Download, Pencil, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Список Достопримечательностей</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/landmark/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить достопримечательность
          </Button>
          <Button variant="outline" onClick={handleDownloadAllPhotos} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" />
            Скачать все фотографии
          </Button>
        </div>
      </div>

      {/* Строка поиска */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Поиск по названию, координатам или описанию..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Прогресс-бар */}
      {downloading && (
        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-2">
            Загружено {downloadedImages} из {totalImages} изображений ({progress}%)
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {filteredLandmarks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">
              {landmarks.length === 0 ? "Нет достопримечательностей" : "Ничего не найдено по вашему запросу"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLandmarks.map((landmark) => (
            <Card key={landmark.id} className="overflow-hidden">
              {landmark.images && landmark.images.length > 0 && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={landmark.images[0]}
                    alt={landmark.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{landmark.name || "Без названия"}</CardTitle>
                <CardDescription>
                  Координаты: {landmark.coordinates || "не указаны"}
                </CardDescription>
              </CardHeader>
              {landmark.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {landmark.description}
                  </p>
                </CardContent>
              )}
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/landmark/edit/${landmark.id}`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListLandmarks;