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

// DnD
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Компонент для Drag & Drop фото
import DraggablePreviewItem from "../components/DraggablePreviewItem";

// Тип для перетаскиваемых элементов (необязательно использовать, но пусть будет)
// eslint-disable-next-line no-unused-vars
const DRAG_TYPE = "EXISTING_IMAGE";

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

  // Поля "Провинция", "Город", "RDTR"
  const [province, setProvince] = useState("Bali");
  const [city, setCity] = useState("");
  const [rdtr, setRdtr] = useState("");

  // Новые поля:
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  // Дата завершения: только месяц/год (например, "2025-03")
  const [completionDate, setCompletionDate] = useState("");

  // Массив объектов для фото { id, url }
  const [images, setImages] = useState([]);
  // Новые файлы, которые пользователь загружает
  const [newFiles, setNewFiles] = useState([]);

  // Загружаем данные из Firestore
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

          // province, city, rdtr
          setProvince(data.province || "Bali");
          setCity(data.city || "");
          setRdtr(data.rdtr || "");

          // Новые поля (если в БД нет, используем значения по умолчанию)
          setManagementCompany(data.managementCompany || "");
          setOwnershipForm(data.ownershipForm || "Freehold");
          setLandStatus(data.landStatus || "Туристическая зона (W)");
          setCompletionDate(data.completionDate || "");

          // Преобразуем массив строк (URL) в объекты { id, url }
          const existing = (data.images || []).map((url) => ({
            id: crypto.randomUUID(),
            url,
          }));
          setImages(existing);
        }
      } catch (error) {
        console.error("Ошибка загрузки комплекса:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Функция перестановки элементов (Drag & Drop)
  const moveExistingImage = (dragIndex, hoverIndex) => {
    setImages((prev) => {
      const arr = [...prev];
      // Извлекаем перетаскиваемый элемент
      const [draggedItem] = arr.splice(dragIndex, 1);
      // Вставляем на позицию hoverIndex
      arr.splice(hoverIndex, 0, draggedItem);
      return arr;
    });
  };

  // Удаление одного фото (по индексу)
  const handleRemoveImage = async (idx) => {
    try {
      // Удаляем из массива
      const updated = [...images];
      updated.splice(idx, 1);
      setImages(updated);

      // Обновляем в Firestore (при желании можно делать это только при "Сохранить")
      const finalUrls = updated.map((item) => item.url);
      await updateDoc(doc(db, "complexes", id), { images: finalUrls });
    } catch (error) {
      console.error("Ошибка удаления фото:", error);
    }
  };

  // Добавление новых фото
  const handleFileChange = (e) => {
    if (e.target.files) {
      setNewFiles((prev) => [...prev, ...e.target.files]);
    }
  };

  // Сохранение изменений
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Загружаем новые фото в Cloudinary
      const newUrls = [];
      for (let file of newFiles) {
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
      }
      // Превращаем новые URL в объекты
      const newObjects = newUrls.map((url) => ({
        id: crypto.randomUUID(),
        url,
      }));
      // Добавляем к текущим
      const updatedImages = [...images, ...newObjects];
      // Извлекаем только URL для Firestore
      const finalUrls = updatedImages.map((obj) => obj.url);

      // Формируем объект для Firestore
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
        // Новые поля
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate,
      };

      // Обновляем документ
      await updateDoc(doc(db, "complexes", id), updatedData);

      // Обновляем стейт
      setImages(updatedImages);
      setNewFiles([]);

      alert("Комплекс обновлён!");
    } catch (error) {
      console.error("Ошибка обновления комплекса:", error);
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

              {/* Описание */}
              <TextField
                label="Описание"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* ---- Новые поля ---- */}
              <TextField
                label="Управляющая компания"
                value={managementCompany}
                onChange={(e) => setManagementCompany(e.target.value)}
              />

              {/* Форма собственности (Select) */}
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

              {/* Статус земли (Select) */}
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

              {/* Дата завершения (месяц/год) */}
              <TextField
                label="Дата завершения (месяц/год)"
                type="month"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              {/* ---- Конец новых полей ---- */}

              <Typography>Существующие фото (Drag & Drop):</Typography>
              <Grid container spacing={2}>
                {images.map((item, idx) => (
                  <Grid item xs={6} sm={4} key={item.id}>
                    <DraggablePreviewItem
                      item={item}
                      index={idx}
                      moveItem={moveExistingImage}
                      onRemove={(indexToRemove) => handleRemoveImage(indexToRemove)}
                    />
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
          </DndProvider>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EditComplex;