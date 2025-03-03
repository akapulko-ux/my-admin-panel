// src/pages/CreateComplex.js
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

function CreateComplex() {
  // Основные поля
  const [complexNumber, setComplexNumber] = useState("");
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");

  // Новые поля:
  // Провинция (фиксированная, Bali)
  const province = "Bali";

  // Город (Select)
  const [city, setCity] = useState("Kab. Badung");

  // RDTR (Select)
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");

  // Файлы, выбранные для загрузки
  const [selectedFiles, setSelectedFiles] = useState([]);
  // Превью (локальные ссылки) для выбранных файлов
  const [previewUrls, setPreviewUrls] = useState([]);

  // Обработчик выбора файлов
  const handleFileChange = (e) => {
    if (e.target.files) {
      // Преобразуем FileList в массив
      const newFiles = Array.from(e.target.files);
      // Создаём локальные ссылки для предпросмотра
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

      // Дополняем массивы (старые + новые)
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  // Удаление конкретного фото из предпросмотра
  const handleRemovePreview = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Сабмит формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Загружаем фото в Cloudinary
      const uploadedUrls = [];
      for (let file of selectedFiles) {
        const secureUrl = await uploadToCloudinary(file);
        uploadedUrls.push(secureUrl);
      }

      // Создаём объект для Firestore
      const newDoc = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        // Новые поля:
        province: "Bali", // фиксированная строка
        city,
        rdtr,
        images: uploadedUrls,
        createdAt: new Date()
      };

      // Сохраняем в коллекции "complexes"
      await addDoc(collection(db, "complexes"), newDoc);

      // Сбрасываем поля
      setComplexNumber("");
      setName("");
      setDeveloper("");
      setDistrict("");
      setCoordinates("");
      setPriceFrom("");
      setAreaRange("");
      setDescription("");
      // Селекты тоже сбрасываем к начальному состоянию
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");

      setSelectedFiles([]);
      setPreviewUrls([]);

      alert("Комплекс создан!");
    } catch (error) {
      console.error("Ошибка создания комплекса:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Комплекс
          </Typography>

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
            <TextField
              label="Район"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
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

            {/* Поле «Провинция» — зафиксировано "Bali", disabled */}
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
                <MenuItem value="RDTR Kuta Selatan">RDTR Kuta Selatan</MenuItem>
                <MenuItem value="RDTR Mengwi">RDTR Mengwi</MenuItem>
                <MenuItem value="RDTR Kecamatan Abiansemal">RDTR Kecamatan Abiansemal</MenuItem>
                <MenuItem value="RDTR Wilayah Perencanaan Petang">RDTR Wilayah Perencания Petang</MenuItem>
                <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                <MenuItem value="RDTR Kecamatan Tegallalang">RDTR Kecamatan Tegallalang</MenuItem>
              </Select>
            </FormControl>

            {/* Превью выбранных фото */}
            <Typography>Предпросмотр выбранных фото:</Typography>
            <Grid container spacing={2}>
              {previewUrls.map((url, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Box position="relative">
                    <img
                      src={url}
                      alt="preview"
                      style={{ width: "100%", borderRadius: 4 }}
                    />
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleRemovePreview(idx)}
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

            <Button variant="contained" color="primary" type="submit">
              Создать
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateComplex;