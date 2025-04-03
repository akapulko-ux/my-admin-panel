// src/pages/EditComplex.js

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
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from "@mui/material";

function EditComplex() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Состояния для загрузки
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Основные поля
  const [complexNumber, setComplexNumber] = useState("");
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");

  // Поля "Провинция", "Город", "RDTR"
  const [province, setProvince] = useState("Bali");
  const [city, setCity] = useState("");
  const [rdtr, setRdtr] = useState("");

  // Поля о форме собственности, статусе и т.д.
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [leaseYears, setLeaseYears] = useState("");
  const [docsLink, setDocsLink] = useState("");

  // Новые поля: SHGB, PBG, SLF
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // Поле «Юридическое название компании»
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // [NEW] Поля «ROI» и «3D Тур»
  const [roi, setRoi] = useState("");
  const [threeDTour, setThreeDTour] = useState("");

  // Массив объектов для фото (старые + новые)
  // Каждый элемент: { id, url, file }
  const [images, setImages] = useState([]);

  // Добавляем недостающие состояния для commission
  const [commission, setCommission] = useState("1.0");
  const commissionOptions = [];
  for (let val = 1; val <= 10; val += 0.5) {
    commissionOptions.push(val.toFixed(1));
  }

  // Загрузка данных из Firestore
  useEffect(() => {
    async function fetchComplex() {
      try {
        const ref = doc(db, "complexes", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();

          // Заполняем поля
          setComplexNumber(data.number || "");
          setName(data.name || "");
          setDeveloper(data.developer || "");
          setDistrict(data.district || "");
          setCoordinates(data.coordinates || "");
          setPriceFrom(data.priceFrom || "");
          setAreaRange(data.areaRange || "");
          setDescription(data.description || "");

          setProvince(data.province || "Bali");
          setCity(data.city || "");
          setRdtr(data.rdtr || "");

          setManagementCompany(data.managementCompany || "");
          setOwnershipForm(data.ownershipForm || "Freehold");
          setLandStatus(data.landStatus || "Туристическая зона (W)");
          setCompletionDate(data.completionDate || "");
          setVideoLink(data.videoLink || "");
          setLeaseYears(data.leaseYears || "");
          setDocsLink(data.docsLink || "");

          setShgb(data.shgb || "");
          setPbg(data.pbg || "");
          setSlf(data.slf || "");

          setLegalCompanyName(data.legalCompanyName || "");

          // [NEW] ROI и 3D Тур
          setRoi(data.roi || "");
          setThreeDTour(data.threeDTour || "");

          // Преобразуем массив URL в [{ id, url, file: null }]
          const oldImages = (data.images || []).map((url) => ({
            id: crypto.randomUUID(),
            url,
            file: null
          }));
          setImages(oldImages);

          // Если commission есть, приводим к строке с одним знаком после запятой
          if (data.commission !== undefined) {
            const c = parseFloat(data.commission);
            setCommission(c.toFixed(1));
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки комплекса:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchComplex();
  }, [id]);

  // Обработчик выбора новых фото (с учётом сжатия и PDF)
  const handleFileChange = async (e) => {
    if (!e.target.files) return;

    setIsUploading(true);
    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };

    const selectedFiles = Array.from(e.target.files);
    const newImagesArr = [];

    try {
      for (let file of selectedFiles) {
        if (file.type === "application/pdf") {
          // PDF -> конвертация
          const pageBlobs = await convertPdfToImages(file);
          for (let blob of pageBlobs) {
            const compressedFile = await imageCompression(blob, compressionOptions);
            newImagesArr.push({
              id: crypto.randomUUID(),
              url: URL.createObjectURL(compressedFile),
              file: compressedFile
            });
          }
        } else {
          // Обычное изображение
          const compressedFile = await imageCompression(file, compressionOptions);
          newImagesArr.push({
            id: crypto.randomUUID(),
            url: URL.createObjectURL(compressedFile),
            file: compressedFile
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

  // Функция удаления изображения
  const handleRemoveImage = async (index) => {
    const removed = images[index];
    console.log("Удаляем изображение с URL:", removed.url);
    setImages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    // Если это старое фото (file === null) и URL не локальный blob, удаляем его физически из Storage
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

  // Функция удаления всех фотографий из Storage
  const deleteAllImagesFromStorage = async () => {
    const deletionPromises = images.map((img) => {
      if (!img.file && !img.url.startsWith("blob:")) {
        return deleteFileFromFirebaseStorage(img.url).catch((error) => {
          console.error("Ошибка удаления файла из Storage:", error);
          return Promise.resolve();
        });
      }
      return Promise.resolve();
    });
    await Promise.all(deletionPromises);
  };

  // Сохранение изменений
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Собираем итоговый массив URL (старые + новые)
      const finalUrls = [];
      for (let item of images) {
        if (item.file) {
          // Новое фото — загружаем в Firebase Storage в папку "complexes"
          const url = await uploadToFirebaseStorageInFolder(item.file, "complexes");
          finalUrls.push(url);
        } else {
          finalUrls.push(item.url);
        }
      }
      const updatedData = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        province,
        city,
        rdtr,
        images: finalUrls,
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate,
        videoLink,
        docsLink,
        leaseYears: ownershipForm === "Leashold" ? leaseYears : "",
        shgb,
        pbg,
        slf,
        legalCompanyName,
        roi,
        threeDTour,
        commission
      };
      await updateDoc(doc(db, "complexes", id), updatedData);
      alert("Комплекс обновлён!");
      // Обновляем состояние images, чтобы для всех файлов file стало null
      setImages(finalUrls.map((url) => ({ id: crypto.randomUUID(), url, file: null })));
    } catch (error) {
      console.error("Ошибка обновления комплекса:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление всего комплекса и всех фотографий
  const handleDelete = async () => {
    if (window.confirm("Вы действительно хотите удалить этот комплекс?")) {
      try {
        // Сначала удаляем физически все файлы из Storage
        await deleteAllImagesFromStorage();
        // Затем удаляем документ из Firestore
        await deleteDoc(doc(db, "complexes", id));
        alert("Комплекс и все фотографии удалены!");
        navigate("/complex/list");
      } catch (error) {
        console.error("Ошибка удаления комплекса:", error);
      }
    }
  };

  if (loading) {
    return <Typography sx={{ p: 2 }}>Загрузка...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Редактировать Комплекс (ID: {id})
          </Typography>
          <DndProvider backend={HTML5Backend}>
            <Box
              component="form"
              onSubmit={handleSave}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Номер комплекса"
                value={complexNumber}
                onChange={(e) => setComplexNumber(e.target.value)}
                required
              />
              <TextField
                label="Название"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label="Застройщик"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
              />
              <TextField
                label="Район"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
              <TextField
                label="Координаты"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
              />
              <TextField
                label="Цена от (USD)"
                type="number"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
              />
              <TextField
                label="Диапазон площади"
                value={areaRange}
                onChange={(e) => setAreaRange(e.target.value)}
              />
              {/* Добавлено поле "Описание" */}
              <TextField
                label="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
              />

              {/* Провинция (Bali), disabled */}
              <TextField
                label="Провинция"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                disabled
              />

              {/* Город (Select) */}
              <FormControl>
                <InputLabel id="city-label">Город</InputLabel>
                <Select
                  labelId="city-label"
                  label="Город"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <MenuItem value="">(не выбрано)</MenuItem>
                  <MenuItem value="Kab. Jembrana">Kab. Jembrana</MenuItem>
                  <MenuItem value="Kab. Tabanan">Kab. Tabanan</MenuItem>
                  <MenuItem value="Kab. Badung">Kab. Badung</MenuItem>
                  <MenuItem value="Kab. Gianyar">Kab. Gianyar</MenuItem>
                  <MenuItem value="Kab. Bangli">Kab. Bangli</MenuItem>
                  <MenuItem value="Kab. Karangasem">Kab. Karangasem</MenuItem>
                  <MenuItem value="Kab. Buleleng">Kab. Buleleng</MenuItem>
                  <MenuItem value="Kota Denpasar">Kота Denpasar</MenuItem>
                </Select>
              </FormControl>

              {/* RDTR (Select) */}
              <FormControl>
                <InputLabel id="rdtr-label">RDTR</InputLabel>
                <Select
                  labelId="rdtr-label"
                  label="RDTR"
                  value={rdtr}
                  onChange={(e) => setRdtr(e.target.value)}
                >
                  <MenuItem value="RDTR Kecamatan Ubud">RDTR Kecamatan Ubud</MenuItem>
                  <MenuItem value="RDTR Kuta">RDTR Kuta</MenuItem>
                  <MenuItem value="RDTR Kecamatan Kuta Utara">RDTR Kecamatan Kuta Utara</MenuItem>
                  <MenuItem value="RDTR Kuta Selatan">RDTR Kuta Selatan</MenuItem>
                  <MenuItem value="RDTR Mengwi">RDTR Mengwi</MenuItem>
                  <MenuItem value="RDTR Kecamatan Abiansemal">RDTR Kecamatan Abiansemal</MenuItem>
                  <MenuItem value="RDTR Wilayah Перencания Petang">RDTR Wilayah Перencания Petang</MenuItem>
                  <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                  <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                  <MenuItem value="RDTR Kecamatan Tegallalang">RDTR Kecamatan Tegallalang</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Управляющая компания"
                value={managementCompany}
                onChange={(e) => setManagementCompany(e.target.value)}
              />
              <FormControl>
                <InputLabel id="ownershipForm-label">Форма собственности</InputLabel>
                <Select
                  labelId="ownershipForm-label"
                  label="Форма собственности"
                  value={ownershipForm}
                  onChange={(e) => setOwnershipForm(e.target.value)}
                >
                  <MenuItem value="Leashold">Leashold</MenuItem>
                  <MenuItem value="Freehold">Freehold</MenuItem>
                </Select>
              </FormControl>

              {ownershipForm === "Leashold" && (
                <TextField
                  label="Лет"
                  type="number"
                  value={leaseYears}
                  onChange={(e) => setLeaseYears(e.target.value)}
                />
              )}

              <FormControl>
                <InputLabel id="landStatus-label">Статус земли</InputLabel>
                <Select
                  labelId="landStatus-label"
                  label="Статус земли"
                  value={landStatus}
                  onChange={(e) => setLandStatus(e.target.value)}
                >
                  <MenuItem value="Туристическая зона (W)">Туристическая зона (W)</MenuItem>
                  <MenuItem value="Торговая зона (K)">Торговая зона (K)</MenuItem>
                  <MenuItem value="Смешанная зона (C)">Смешанная зона (C)</MenuItem>
                  <MenuItem value="Жилая зона (R)">Жилая зона (R)</MenuItem>
                  <MenuItem value="Сельхоз зона (P)">Сельхоз зона (P)</MenuItem>
                  <MenuItem value="Заповедная зона (RTH)">Заповедная зона (RTH)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Дата завершения (месяц/год)"
                type="month"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Ссылка на видео"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
              />

              <TextField
                label="Доступные юниты (ссылка)"
                value={docsLink}
                onChange={(e) => setDocsLink(e.target.value)}
              />

              {/* SHGB, PBG, SLF */}
              <TextField
                label="Сертификат права на землю (SHGB)"
                value={shgb}
                onChange={(e) => setShgb(e.target.value)}
              />
              <TextField
                label="Разрешение на строительство (PBG)"
                value={pbg}
                onChange={(e) => setPbg(e.target.value)}
              />
              <TextField
                label="Сертификат готовности здания (SLF)"
                value={slf}
                onChange={(e) => setSlf(e.target.value)}
              />

              {/* Юридическое название компании */}
              <TextField
                label="Юридическое название компании"
                value={legalCompanyName}
                onChange={(e) => setLegalCompanyName(e.target.value)}
              />

              {/* [NEW] Поле «Вознаграждение» */}
              <FormControl>
                <InputLabel id="commission-label">Вознаграждение</InputLabel>
                <Select
                  labelId="commission-label"
                  label="Вознаграждение"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                >
                  {commissionOptions.map((val) => (
                    <MenuItem key={val} value={val}>
                      {val}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography sx={{ mt: 2 }}>
                Существующие (и новые) фото (Drag & Drop):
              </Typography>
              <DndProvider backend={HTML5Backend}>
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
              </DndProvider>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  disabled={isUploading}
                  sx={{ width: "820px", mt: 2 }}
                >
                  Загрузить новые фото / PDF
                  <input type="file" hidden multiple onChange={(e) => handleFileChange(e)} />
                </Button>
                {isUploading && <CircularProgress size={24} />}
              </Box>

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                {isSaving ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

export default EditComplex;