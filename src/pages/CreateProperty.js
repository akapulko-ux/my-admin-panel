// src/pages/CreateProperty.js
import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";

import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

function CreateProperty() {
  // Цена
  const [price, setPrice] = useState("");

  // Тип (Select)
  const [type, setType] = useState("Вилла");

  // Комплекс (Select)
  const [complexList, setComplexList] = useState([]);
  const [complex, setComplex] = useState("");
  // Поля, которые могут автозаполняться (заблокированы, если autoFill)
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [isAutoFill, setIsAutoFill] = useState(false);

  // Остальные поля
  const [status, setStatus] = useState("Строится");
  const [description, setDescription] = useState("");
  const [buildingType, setBuildingType] = useState("Новый комплекс");
  const [bedrooms, setBedrooms] = useState("");
  const [area, setArea] = useState("");
  const [province, setProvince] = useState("Bali");
  const [city, setCity] = useState("Kab. Badung");
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");
  const [classRating, setClassRating] = useState("Комфорт (B)");
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState("");
  const [pool, setPool] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Загружаем список комплексов (для поля "Комплекс")
  useEffect(() => {
    async function loadComplexes() {
      try {
        const snapshot = await getDocs(collection(db, "complexes"));
        const loaded = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            name: data.name || "Без названия",
            developer: data.developer || "",
            district: data.district || "",
            coordinates: data.coordinates || "",
          };
        });
        setComplexList(loaded);
      } catch (error) {
        console.error("Ошибка загрузки комплексов:", error);
      }
    }
    loadComplexes();
  }, []);

  // При выборе файлов (для загрузки фото)
  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles([...e.target.files]);
    }
  };

  // При выборе комплекса
  const handleComplexChange = (e) => {
    const chosenName = e.target.value;
    setComplex(chosenName);

    if (!chosenName) {
      // Если "(не выбрано)"
      setCoordinates("");
      setDeveloper("");
      setDistrict("");
      setIsAutoFill(false);
    } else {
      // Ищем в списке
      const found = complexList.find((c) => c.name === chosenName);
      if (found) {
        setCoordinates(found.coordinates);
        setDeveloper(found.developer);
        setDistrict(found.district);
        setIsAutoFill(true);
      }
    }
  };

  // Сабмит формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Сначала загружаем фото в Cloudinary
      const imageUrls = [];
      for (let file of selectedFiles) {
        const url = await uploadToCloudinary(file);
        imageUrls.push(url);
      }

      // Создаём объект для Firestore
      const newProp = {
        price,
        type,
        complex,
        developer,
        district,
        coordinates,
        status,
        description,
        buildingType,
        bedrooms,
        area,
        province,
        city,
        rdtr,
        classRating,
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate,
        pool,
        images: imageUrls,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "properties"), newProp);

      // Сброс полей
      setPrice("");
      setType("Вилла");
      setComplex("");
      setDeveloper("");
      setDistrict("");
      setCoordinates("");
      setIsAutoFill(false);

      setStatus("Строится");
      setDescription("");
      setBuildingType("Новый комплекс");
      setBedrooms("");
      setArea("");
      setProvince("Bali");
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");
      setClassRating("Комфорт (B)");
      setManagementCompany("");
      setOwnershipForm("Freehold");
      setLandStatus("Туристическая зона (W)");
      setCompletionDate("");
      setPool("");
      setSelectedFiles([]);

      alert("Объект создан!");
    } catch (error) {
      console.error("Ошибка создания объекта:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Объект
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* 1. Цена */}
            <TextField
              label="Цена (USD)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            {/* 2. Тип (Select) */}
            <FormControl>
              <InputLabel id="type-label">Тип</InputLabel>
              <Select
                labelId="type-label"
                label="Тип"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="Вилла">Вилла</MenuItem>
                <MenuItem value="Апартаменты">Апартаменты</MenuItem>
                <MenuItem value="Дом">Дом</MenuItem>
                <MenuItem value="Коммерческая недвижимость">Коммерческая недвижимость</MenuItem>
              </Select>
            </FormControl>

            {/* 3. Комплекс (Select) */}
            <FormControl>
              <InputLabel id="complex-label">Комплекс</InputLabel>
              <Select
                labelId="complex-label"
                label="Комплекс"
                value={complex}
                onChange={handleComplexChange}
              >
                <MenuItem value="">(не выбрано)</MenuItem>
                {complexList.map((c, idx) => (
                  <MenuItem key={idx} value={c.name}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 4. Застройщик (заблокирован, если autoFill) */}
            <TextField
              label="Застройщик"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              disabled={isAutoFill}
            />

            {/* 5. Район (Select, заблокирован если autoFill) */}
            <FormControl disabled={isAutoFill}>
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

            {/* 6. Координаты (заблокированы, если autoFill) */}
            <TextField
              label="Координаты (шир, долг)"
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
              disabled={isAutoFill}
            />

            {/* Статус (Select) */}
            <FormControl>
              <InputLabel id="status-label">Статус</InputLabel>
              <Select
                labelId="status-label"
                label="Статус"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="Проект">Проект</MenuItem>
                <MenuItem value="Строится">Строится</MenuItem>
                <MenuItem value="Готовый">Готовый</MenuItem>
                <MenuItem value="От собственника">От собственника</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Описание"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Тип постройки (Select) */}
            <FormControl>
              <InputLabel id="buildingType-label">Тип постройки</InputLabel>
              <Select
                labelId="buildingType-label"
                label="Тип постройки"
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
              >
                <MenuItem value="Новый комплекс">Новый комплекс</MenuItem>
                <MenuItem value="Реновация">Реновация</MenuItem>
                <MenuItem value="ИЖС">ИЖС</MenuItem>
              </Select>
            </FormControl>

            {/* Спальни (Select) */}
            <FormControl>
              <InputLabel id="bedrooms-label">Спальни</InputLabel>
              <Select
                labelId="bedrooms-label"
                label="Спальни"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              >
                <MenuItem value="">(не выбрано)</MenuItem>
                <MenuItem value="Студия">Студия</MenuItem>
                <MenuItem value="1">1</MenuItem>
                <MenuItem value="2">2</MenuItem>
                <MenuItem value="3">3</MenuItem>
                <MenuItem value="4">4</MenuItem>
                <MenuItem value="5">5</MenuItem>
                <MenuItem value="6">6</MenuItem>
                <MenuItem value="7">7</MenuItem>
                <MenuItem value="8">8</MenuItem>
                <MenuItem value="9">9</MenuItem>
                <MenuItem value="10">10</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Площадь (м²)"
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <TextField
              label="Провинция"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            />
            <TextField
              label="Город"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <TextField
              label="RDTR"
              value={rdtr}
              onChange={(e) => setRdtr(e.target.value)}
            />

            {/* Класс (Select) */}
            <FormControl>
              <InputLabel id="classRating-label">Класс</InputLabel>
              <Select
                labelId="classRating-label"
                label="Класс"
                value={classRating}
                onChange={(e) => setClassRating(e.target.value)}
              >
                <MenuItem value="Эконом (C)">Эконом (C)</MenuItem>
                <MenuItem value="Комфорт (B)">Комфорт (B)</MenuItem>
                <MenuItem value="Комфорт плюс (B+)">Комфорт плюс (B+)</MenuItem>
                <MenuItem value="Премиум (A)">Премиум (A)</MenuItem>
                <MenuItem value="Лакшери (A++)">Лакшери (A++)</MenuItem>
              </Select>
            </FormControl>

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

            <TextField
              label="Дата завершения"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />

            {/* Бассейн (Select) */}
            <FormControl>
              <InputLabel id="pool-label">Бассейн</InputLabel>
              <Select
                labelId="pool-label"
                label="Бассейн"
                value={pool}
                onChange={(e) => setPool(e.target.value)}
              >
                <MenuItem value="">(не выбрано)</MenuItem>
                <MenuItem value="Нет">Нет</MenuItem>
                <MenuItem value="Частный">Частный</MenuItem>
                <MenuItem value="Общий">Общий</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" component="label">
              Загрузить фото
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

export default CreateProperty;