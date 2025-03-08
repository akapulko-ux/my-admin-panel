// src/pages/CreateComplex.js

import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";

// DnD Provider и back-end
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Наш компонент для Drag & Drop превью
import DraggablePreviewItem from "../components/DraggablePreviewItem";

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

function CreateComplex() {
  // ----- Поля формы -----
  const [complexNumber, setComplexNumber] = useState("");
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");

  // Провинция зафиксирована (Bali)
  const province = "Bali";

  // Поля Select для города и RDTR
  const [city, setCity] = useState("Kab. Badung");
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");

  // Поля о форме собственности, статусе земли и т.д.
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState(""); // строка "2025-03" и т.п.
  const [videoLink, setVideoLink] = useState("");
  const [leaseYears, setLeaseYears] = useState("");
  const [docsLink, setDocsLink] = useState("");

  // *** Новые поля: SHGB, PBG, SLF ***
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // Массив для превью (Drag & Drop)
  const [previews, setPreviews] = useState([]);

  // Состояние загрузки
  const [isLoading, setIsLoading] = useState(false);

  // Обработчик выбора файлов
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      }));
      setPreviews((prev) => [...prev, ...newFiles]);
    }
  };

  // Удалить одно фото из превью
  const handleRemovePreview = (id) => {
    setPreviews((prev) => prev.filter((item) => item.id !== id));
  };

  // Перемещение фото (Drag & Drop)
  const moveItem = (dragIndex, hoverIndex) => {
    setPreviews((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, draggedItem);
      return updated;
    });
  };

  // Сабмит формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // включаем «загрузка»

    try {
      // 1) Загружаем фото
      const uploadedUrls = [];
      for (let item of previews) {
        const secureUrl = await uploadToCloudinary(item.file);
        uploadedUrls.push(secureUrl);
      }

      // 2) Собираем объект для Firestore
      const newDoc = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        province, // "Bali"
        city,
        rdtr,
        images: uploadedUrls,
        createdAt: new Date(),

        managementCompany,
        ownershipForm,
        landStatus,
        completionDate,
        videoLink,
        docsLink,

        // Leasehold (лет)
        leaseYears: ownershipForm === "Leashold" ? leaseYears : "",

        // Новые поля (SHGB, PBG, SLF)
        shgb,
        pbg,
        slf
      };

      // 3) Добавляем документ в "complexes"
      await addDoc(collection(db, "complexes"), newDoc);

      // 4) Сбрасываем поля
      setComplexNumber("");
      setName("");
      setDeveloper("");
      setDistrict("");
      setCoordinates("");
      setPriceFrom("");
      setAreaRange("");
      setDescription("");
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");
      setPreviews([]);

      setManagementCompany("");
      setOwnershipForm("Freehold");
      setLandStatus("Туристическая зона (W)");
      setCompletionDate("");
      setVideoLink("");
      setDocsLink("");
      setLeaseYears("");

      // Сбрасываем новые поля
      setShgb("");
      setPbg("");
      setSlf("");

      alert("Комплекс создан!");
    } catch (error) {
      console.error("Ошибка создания комплекса:", error);
    } finally {
      setIsLoading(false); // выключаем «загрузка»
    }
  };

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Комплекс
          </Typography>

          <DndProvider backend={HTML5Backend}>
            <Box
              component="form"
              onSubmit={handleSubmit}
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
                required
              />
              <TextField
                label="Застройщик"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
              />

              {/* Район (Select) */}
              <FormControl>
                <InputLabel id="district-label">Район</InputLabel>
                <Select
                  labelId="district-label"
                  label="Район"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <MenuItem value="">(не выбрано)</MenuItem>
                  <MenuItem value="Чангу">Чангу</MenuItem>
                  <MenuItem value="Семиньяк">Семиньяк</MenuItem>
                  <MenuItem value="Кута">Кута</MenuItem>
                  <MenuItem value="Джимбаран">Джимбаран</MenuItem>
                  <MenuItem value="Нуса Дуа">Нуса Дуа</MenuItem>
                  <MenuItem value="Улувату">Улувату</MenuItem>
                  <MenuItem value="Убуд">Убуд</MenuItem>
                  <MenuItem value="Санур">Санур</MenuItem>
                  <MenuItem value="Амед">Амед</MenuItem>
                  <MenuItem value="Ловина">Ловина</MenuItem>
                  <MenuItem value="Берава">Берава</MenuItem>
                  <MenuItem value="Умалас">Умалас</MenuItem>
                  <MenuItem value="Переренан">Переренан</MenuItem>
                  <MenuItem value="Чемаги">Чемаги</MenuItem>
                  <MenuItem value="Нуану">Нуану</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Координаты (шир, долг)"
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
              <TextField
                label="Описание"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Провинция (Bali) */}
              <TextField
                label="Провинция"
                value={province}
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
                  <MenuItem value="RDTR Kuta Selatan">RDTR Кuta Selatan</MenuItem>
                  <MenuItem value="RDTR Mengwi">RDTR Mengwi</MenuItem>
                  <MenuItem value="RDTR Kecamatan Abiansemal">RDTR Kecamatan Abiansemal</MenuItem>
                  <MenuItem value="RDTR Wilayah Перencanaan Petang">RDTR Wilayah Перencanaan Petang</MenuItem>
                  <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                  <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                  <MenuItem value="RDTR Kecamatan Tegallalang">RDTR Kecamatan Tegallalang</MenuItem>
                </Select>
              </FormControl>

              {/* Поля для сертификатов, даты и прочего */}
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

              {/* Если выбрано "Leashold" — показываем поле "Лет" */}
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
                  <MenuItem value="Торговая зона (C)">Торговая зона (C)</MenuItem>
                  <MenuItem value="Жилая зона (R)">Жилая зона (R)</MenuItem>
                  <MenuItem value="Сельхоз зона (P)">Сельхоз зона (P)</MenuItem>
                  <MenuItem value="Заповедная зона (RTH)">Заповедная зона (RTH)</MenuItem>
                </Select>
              </FormControl>

              {/* Дата завершения (только месяц/год) */}
              <TextField
                label="Дата завершения (месяц/год)"
                type="month"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {/* Ссылка на видео */}
              <TextField
                label="Ссылка на видео"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
              />

              {/* Ссылка на документы (доступно) */}
              <TextField
                label="Доступно"
                value={docsLink}
                onChange={(e) => setDocsLink(e.target.value)}
              />

              {/* *** Новые поля: SHGB, PBG, SLF *** */}
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

              {/* Drag & Drop предпросмотр */}
              <Typography>Предпросмотр выбранных фото (Drag & Drop):</Typography>
              <Grid container spacing={2}>
                {previews.map((item, idx) => (
                  <Grid item xs={6} sm={4} key={item.id}>
                    <Box position="relative">
                      <DraggablePreviewItem
                        item={item}
                        index={idx}
                        moveItem={moveItem}
                      />
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleRemovePreview(item.id)}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                      >
                        Удалить
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Button variant="contained" component="label">
                Выбрать фото
                <input type="file" hidden multiple onChange={handleFileChange} />
              </Button>

              {/* Кнопка «Создать» или спиннер */}
              {isLoading ? (
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
          </DndProvider>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateComplex;