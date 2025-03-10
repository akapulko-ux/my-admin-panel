// src/pages/EditComplex.js

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";
import { useParams, useNavigate } from "react-router-dom";

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

// Для Drag & Drop
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

function EditComplex() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Состояния для загрузки/сохранения
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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

  // Новые поля
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState(""); // "YYYY-MM"
  const [videoLink, setVideoLink] = useState("");
  const [leaseYears, setLeaseYears] = useState("");
  const [docsLink, setDocsLink] = useState("");

  // Три новых поля: SHGB, PBG, SLF
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // *** Новое поле «Юридическое название компании» ***
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // Массив объектов для фото (старые + новые)
  // Формат: { id, url, file }
  // - Старое фото: file = null
  // - Новое фото: file = File
  const [images, setImages] = useState([]);

  // Загрузка данных из Firestore при монтировании
  useEffect(() => {
    const fetchData = async () => {
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

          // Юридическое название компании
          setLegalCompanyName(data.legalCompanyName || "");

          // Преобразуем старые URL в формат { id, url, file: null }
          const oldImages = (data.images || []).map((url) => ({
            id: crypto.randomUUID(),
            url,
            file: null
          }));
          setImages(oldImages);
        }
      } catch (error) {
        console.error("Ошибка загрузки комплекса:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Обработчик выбора новых фото
  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newImages = selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file), // локальный preview
        file
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  // Перестановка фото (Drag & Drop)
  const moveExistingImage = (dragIndex, hoverIndex) => {
    setImages((prev) => {
      const arr = [...prev];
      const [draggedItem] = arr.splice(dragIndex, 1);
      arr.splice(hoverIndex, 0, draggedItem);
      return arr;
    });
  };

  // Удаление одного фото (локально)
  const handleRemoveImage = async (idx) => {
    const updated = [...images];
    updated.splice(idx, 1);
    setImages(updated);
    // (Опционально) сразу удалять из Firestore — обычно делается при «Сохранить»
  };

  // Сохранение изменений
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Собираем итоговый массив URL (старые + новые)
      const finalUrls = [];
      for (let item of images) {
        if (item.file) {
          // Новое фото
          const url = await uploadToCloudinary(item.file);
          finalUrls.push(url);
        } else {
          // Старое фото
          finalUrls.push(item.url);
        }
      }

      // Если ownershipForm = "Leashold", leaseYears, иначе ""
      const finalLeaseYears = ownershipForm === "Leashold" ? leaseYears : "";

      // Собираем объект для Firestore
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
        leaseYears: finalLeaseYears,

        // Три новых поля
        shgb,
        pbg,
        slf,

        // Новое поле «Юридическое название компании»
        legalCompanyName
      };

      // Обновляем документ
      await updateDoc(doc(db, "complexes", id), updatedData);

      // (Опционально) локально обновляем images, чтобы у всех фото file = null
      // ...
      alert("Комплекс обновлён!");
    } catch (error) {
      console.error("Ошибка обновления комплекса:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление всего комплекса
  const handleDelete = async () => {
    if (window.confirm("Вы действительно хотите удалить этот комплекс?")) {
      try {
        await deleteDoc(doc(db, "complexes", id));
        alert("Комплекс удалён!");
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
              {/* Номер комплекса */}
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

              {/* Провинция (Bali), disabled */}
              <TextField
                label="Провинция"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                disabled
              />

              {/* Город */}
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
                  <MenuItem value="Kota Denpasar">Kota Denpasar</MenuItem>
                </Select>
              </FormControl>

              {/* RDTR */}
              <FormControl>
                <InputLabel id="rdtr-label">RDTR</InputLabel>
                <Select
                  labelId="rdtr-label"
                  label="RDTR"
                  value={rdtr}
                  onChange={(e) => setRdtr(e.target.value)}
                >
                  <MenuItem value="">(не выбрано)</MenuItem>
                  <MenuItem value="RDTR Kecamatan Ubud">RDTR Kecamatan Ubud</MenuItem>
                  <MenuItem value="RDTR Kuta">RDTR Kuta</MenuItem>
                  <MenuItem value="RDTR Kecamatan Kuta Utara">RDTR Kecamatan Kuta Utara</MenuItem>
                  <MenuItem value="RDTR Kuta Selatan">RDTR Kuta Selatan</MenuItem>
                  <MenuItem value="RDTR Mengwi">RDTR Mengwi</MenuItem>
                  <MenuItem value="RDTR Kecamatan Abiansemal">
                    RDTR Kecamatan Abiansemal
                  </MenuItem>
                  <MenuItem value="RDTR Wilayah Перencanaan Petang">
                    RDTR Wilayah Перencanaan Petang
                  </MenuItem>
                  <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                  <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                  <MenuItem value="RDTR Kecamatan Tegallalang">
                    RDTR Kecamatan Tegallalang
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Описание"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Новые поля */}
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
                label="Доступно"
                value={docsLink}
                onChange={(e) => setDocsLink(e.target.value)}
              />

              {/* Три новых поля: SHGB, PBG, SLF */}
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

              {/* Новое поле: «Юридическое название компании» */}
              <TextField
                label="Юридическое название компании"
                value={legalCompanyName}
                onChange={(e) => setLegalCompanyName(e.target.value)}
              />

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
                        moveItem={moveExistingImage}
                        onRemove={() => handleRemoveImage(idx)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </DndProvider>

              <Button variant="contained" component="label">
                Добавить фото
                <input type="file" hidden multiple onChange={handleFileChange} />
              </Button>

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                {isLoading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={24} />
                    <Typography>Сохраняем...</Typography>
                  </Box>
                ) : (
                  <Button variant="contained" color="primary" type="submit">
                    Сохранить изменения
                  </Button>
                )}

                <Button variant="contained" color="error" onClick={handleDelete}>
                  Удалить комплекс
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