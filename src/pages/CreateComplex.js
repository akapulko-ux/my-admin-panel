// src/pages/CreateComplex.js
import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";

// --- Импорт из react-dnd ---
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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

/** 
 * Тип для DnD (произвольная строка, одинаковая в useDrag/useDrop)
 */
const DRAG_TYPE = "PREVIEW_IMAGE";

/**
 * Компонент одной «карточки» превью, которую можно перетаскивать
 */
function DraggablePreviewItem({ item, index, movePreviewItem }) {
  // useDrag: «источник» перетаскивания
  const [{ isDragging }, dragRef] = useDrag({
    type: DRAG_TYPE,
    item: { index }, // что передаём при «захвате»
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // useDrop: «приёмник» — реагирует, когда над ним «висят»
  const [, dropRef] = useDrop({
    accept: DRAG_TYPE,
    hover: (dragged) => {
      if (dragged.index !== index) {
        // Перемещаем элемент в массиве
        movePreviewItem(dragged.index, index);
        // Чтобы не дёргалось при последующем hover
        dragged.index = index;
      }
    },
  });

  // Чтобы элемент и «таскался», и «принимал» drop, объединим ref
  const refFn = (node) => {
    dragRef(node);
    dropRef(node);
  };

  return (
    <Box
      ref={refFn}
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: 1,
        border: "1px solid #ccc",
        overflow: "hidden",
        opacity: isDragging ? 0.4 : 1,
        cursor: "move",
      }}
    >
      <img
        src={item.url}
        alt="preview"
        style={{ width: "100%", display: "block" }}
      />
      {/* Можно добавить кнопку «Удалить» или что-то ещё */}
    </Box>
  );
}

function CreateComplex() {
  // Основные поля
  const [complexNumber, setComplexNumber] = useState("");
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");

  // Район (Select), аналогично CreateProperty
  const [district, setDistrict] = useState("");

  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");

  // Провинция (фиксированная, Bali)
  const province = "Bali";

  // Город (Select)
  const [city, setCity] = useState("Kab. Badung");

  // RDTR (Select)
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");

  /**
   * Вместо двух массивов (selectedFiles + previewUrls) —
   * храним единый массив объектов: { id, file, url }
   */
  const [previews, setPreviews] = useState([]);

  /**
   * Обработчик выбора файлов
   */
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: crypto.randomUUID(), // или Date.now(), или любой другой уникальный ключ
        file,
        url: URL.createObjectURL(file),
      }));
      setPreviews((prev) => [...prev, ...newFiles]);
    }
  };

  /**
   * Удаление конкретного фото из предпросмотра
   */
  const handleRemovePreview = (id) => {
    setPreviews((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Функция, которая вызывается при «hover» одного элемента над другим
   * и меняет их местами в массиве
   */
  const movePreviewItem = (dragIndex, hoverIndex) => {
    setPreviews((prev) => {
      const updated = [...prev];
      // меняем местами
      const [draggedItem] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, draggedItem);
      return updated;
    });
  };

  /**
   * Сабмит формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Сначала загружаем фото в Cloudinary в порядке, который видит пользователь
      const uploadedUrls = [];
      for (let item of previews) {
        const secureUrl = await uploadToCloudinary(item.file);
        uploadedUrls.push(secureUrl);
      }

      // Формируем объект для Firestore
      const newDoc = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        province: "Bali", // фиксированная строка
        city,
        rdtr,
        images: uploadedUrls,
        createdAt: new Date(),
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
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");
      setPreviews([]);

      alert("Комплекс создан!");
    } catch (error) {
      console.error("Ошибка создания комплекса:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", p: 2 }}>
      {/* DndProvider должен оборачивать ту часть, где есть Drag/Drop */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Комплекс
          </Typography>

          {/* Оборачиваем всё в DndProvider */}
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
                  <MenuItem value="RDTR Wilayah Perencanaan Petang">RDTR Wilayah Perencanaan Petang</MenuItem>
                  <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                  <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                  <MenuItem value="RDTR Kecamatan Tegallalang">RDTR Kecamatan Tegallalang</MenuItem>
                </Select>
              </FormControl>

              {/* Превью выбранных фото (drag & drop) */}
              <Typography>Предпросмотр выбранных фото (Drag & Drop):</Typography>
              <Grid container spacing={2}>
                {previews.map((item, idx) => (
                  <Grid item xs={6} sm={4} key={item.id}>
                    <Box position="relative">
                      {/* Вставляем компонент, который умеет перетаскиваться */}
                      <DraggablePreviewItem
                        item={item}
                        index={idx}
                        movePreviewItem={movePreviewItem}
                      />

                      {/* Кнопка «Удалить» поверх */}
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

              <Button variant="contained" color="primary" type="submit">
                Создать
              </Button>
            </Box>
          </DndProvider>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateComplex;