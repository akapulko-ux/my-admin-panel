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
  MenuItem
} from "@mui/material";

function EditComplex() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);

  // Основные поля
  const [complexNumber, setComplexNumber] = useState("");
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  // Добавляем поля "Провинция", "Город", "RDTR"
  // Считаем, что в Firestore документе "complexes" могут быть поля province, city, rdtr
  // Если их там нет, вы можете установить им значения по умолчанию
  const [province, setProvince] = useState("Bali"); // фиксированное поле
  const [city, setCity] = useState("");
  const [rdtr, setRdtr] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "complexes", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();

          setComplexNumber(data.number || "");
          setName(data.name || "");
          setDeveloper(data.developer || "");
          setDistrict(data.district || "");
          setCoordinates(data.coordinates || "");
          setPriceFrom(data.priceFrom || "");
          setAreaRange(data.areaRange || "");
          setDescription(data.description || "");
          setImages(data.images || []);

          // Если в документе есть поля province, city, rdtr:
          setProvince(data.province || "Bali"); // По умолчанию "Bali"
          setCity(data.city || "");            // Пусть будет пусто, если нет в БД
          setRdtr(data.rdtr || "");            // Или пусто, если нет
        }
      } catch (error) {
        console.error("Ошибка загрузки комплекса:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Обработка новых файлов
  const handleFileChange = (e) => {
    if (e.target.files) {
      setNewFiles([...e.target.files]);
    }
  };

  // Сохранение
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Загрузка новых фото
      const newUrls = [];
      for (let file of newFiles) {
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
      }
      const updatedImages = [...images, ...newUrls];

      // Обновляем документ
      const updatedData = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        images: updatedImages,

        // Теперь также сохраняем province, city, rdtr
        province, 
        city,
        rdtr
      };

      const ref = doc(db, "complexes", id);
      await updateDoc(ref, updatedData);

      // Обновляем состояние
      setImages(updatedImages);
      setNewFiles([]);

      alert("Комплекс обновлён!");
    } catch (error) {
      console.error("Ошибка обновления комплекса:", error);
    }
  };

  // Удаление фото
  const handleRemoveImage = async (idx) => {
    try {
      const updated = [...images];
      updated.splice(idx, 1);
      await updateDoc(doc(db, "complexes", id), { images: updated });
      setImages(updated);
    } catch (error) {
      console.error("Ошибка удаления фото:", error);
    }
  };

  // Удаление комплекса
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

            {/* Новые поля: Провинция, Город, RDTR */}
            {/* Провинция зафиксирована на Bali (disabled) */}
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
                <MenuItem value="">(не выбрано)</MenuItem>
                <MenuItem value="RDTR Kecamatan Ubud">RDTR Kecamatan Ubud</MenuItem>
                <MenuItem value="RDTR Kuta">RDTR Kuta</MenuItem>
                <MenuItem value="RDTR Kecamatan Kuta Utara">RDTR Kecamatan Kuta Utara</MenuItem>
                <MenuItem value="RDTR Kuta Selatan">RDTR Kuta Selatan</MenuItem>
                <MenuItem value="RDTR Mengwi">RDTR Mengwi</MenuItem>
                <MenuItem value="RDTR Kecamatan Abiansemal">RDTR Kecamatan Abiansemal</MenuItem>
                <MenuItem value="RDTR Wilayah Perencanaan Petang">RDTR Wilayah Perencanaan Petang</MenuItem>
                <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                <MenuItem value="RDTR Kecamatan Tegallalang">RDTR Kecamatan Tegallalang</MenuItem>
              </Select>
            </FormControl>
            {/* Конец новых полей */}

            <TextField
              label="Описание"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Typography>Существующие фото:</Typography>
            <Grid container spacing={2}>
              {images.map((url, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Box>
                    <img
                      src={url}
                      alt="complex"
                      style={{ width: "100%", borderRadius: 4 }}
                    />
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveImage(idx)}
                      sx={{ mt: 1 }}
                    >
                      Удалить
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Button variant="contained" component="label">
              Добавить фото
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button variant="contained" color="primary" type="submit">
                Сохранить изменения
              </Button>
              <Button variant="contained" color="error" onClick={handleDelete}>
                Удалить комплекс
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EditComplex;