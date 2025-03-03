// src/pages/EditProperty.js

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
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

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Основные поля
  const [price, setPrice] = useState(""); // вводим/сохраняем как строку, чтобы потом parseFloat
  const [type, setType] = useState("");  // будет Select
  const [coordinates, setCoordinates] = useState(""); // строка вида "lat, lon"

  // Поля-Select
  const [status, setStatus] = useState("");
  const [district, setDistrict] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [classRating, setClassRating] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("");
  const [landStatus, setLandStatus] = useState("");
  const [pool, setPool] = useState("");

  // Остальные поля
  const [description, setDescription] = useState("");
  const [developer, setDeveloper] = useState("");
  const [complex, setComplex] = useState("");
  const [area, setArea] = useState("");
  
  // «Провинция» теперь зафиксирована на Bali (disabled)
  // «Город» — Select
  const [province, setProvince] = useState("Bali");
  const [city, setCity] = useState("");
  
  // «RDTR» — Select
  const [rdtr, setRdtr] = useState("");

  const [managementCompany, setManagementCompany] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  // Изображения
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  // Загрузка данных из Firestore
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const ref = doc(db, "properties", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();

          // 1) price -> строка
          setPrice(data.price?.toString() || "");

          // 2) type
          setType(data.type || "");

          // 3) Координаты
          let coordsStr = "";
          if (typeof data.latitude === "number" && typeof data.longitude === "number") {
            coordsStr = `${data.latitude}, ${data.longitude}`;
          } else {
            coordsStr = data.coordinates || "";
          }
          setCoordinates(coordsStr);

          // 4) status
          setStatus(data.status || "");
          // 5) district
          setDistrict(data.district || "");

          setDescription(data.description || "");
          setDeveloper(data.developer || "");
          setComplex(data.complex || "");

          setBuildingType(data.buildingType || "");
          setBedrooms(data.bedrooms || "");
          setArea(data.area || "");

          // province — если в БД уже хранится что-то, но по условию
          // у нас зафиксировано "Bali", можем принудительно выставлять:
          setProvince("Bali");

          setCity(data.city || "");

          // RDTR
          setRdtr(data.rdtr || "");

          setClassRating(data.classRating || "");
          setManagementCompany(data.managementCompany || "");
          setOwnershipForm(data.ownershipForm || "");
          setLandStatus(data.landStatus || "");

          if (data.completionDate instanceof Timestamp) {
            setCompletionDate(data.completionDate.toDate().toISOString().slice(0, 10));
          } else {
            setCompletionDate(data.completionDate || "");
          }

          setPool(data.pool || "");
          setImages(data.images || []);
        }
      } catch (error) {
        console.error("Ошибка загрузки объекта:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // Загрузка новых фото
  const handleFileChange = (e) => {
    if (e.target.files) {
      setNewFiles([...e.target.files]);
    }
  };

  // Сохранение
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Загрузка фото
      const newUrls = [];
      for (let file of newFiles) {
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
      }
      const updatedImages = [...images, ...newUrls];

      // Парсим price как число
      const parsedPrice = parseFloat(price) || 0;

      // Координаты -> lat/lon
      let latitude = 0;
      let longitude = 0;
      if (coordinates.trim()) {
        const [latStr, lonStr] = coordinates.split(",");
        latitude = parseFloat(latStr?.trim()) || 0;
        longitude = parseFloat(lonStr?.trim()) || 0;
      }

      // Дата завершения -> Timestamp
      let compDateStamp = null;
      if (completionDate) {
        compDateStamp = Timestamp.fromDate(new Date(completionDate));
      }

      const updatedData = {
        price: parsedPrice,
        type,
        latitude,
        longitude,
        status,
        district,
        description,
        developer,
        complex,
        buildingType,
        bedrooms,
        area,
        // «province» всегда Bali, но сохраняем, если нужно
        province: "Bali",
        city,
        rdtr,
        classRating,
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate: compDateStamp,
        pool,
        images: updatedImages
      };

      await updateDoc(doc(db, "properties", id), updatedData);

      setImages(updatedImages);
      setNewFiles([]);

      alert("Объект обновлён!");
    } catch (error) {
      console.error("Ошибка обновления объекта:", error);
    }
  };

  // Удалить фото
  const handleRemoveImage = async (idx) => {
    try {
      const updated = [...images];
      updated.splice(idx, 1);
      await updateDoc(doc(db, "properties", id), { images: updated });
      setImages(updated);
    } catch (error) {
      console.error("Ошибка удаления ссылки на фото:", error);
    }
  };

  // Удалить объект
  const handleDelete = async () => {
    if (window.confirm("Вы действительно хотите удалить этот объект?")) {
      try {
        await deleteDoc(doc(db, "properties", id));
        alert("Объект удалён!");
        navigate("/property/list");
      } catch (error) {
        console.error("Ошибка удаления объекта:", error);
      }
    }
  };

  if (loading) return <Box sx={{ p: 2 }}>Загрузка...</Box>;

  return (
    <Box sx={{ maxWidth: 800, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Редактировать Объект (ID: {id})
          </Typography>

          <Box component="form" onSubmit={handleSave} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Цена (USD) */}
            <TextField
              label="Цена (USD)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            {/* Тип (Select) */}
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

            {/* Координаты */}
            <TextField
              label="Координаты (шир, долг)"
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
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
              label="Описание"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <TextField
              label="Застройщик"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
            />

            <TextField
              label="Комплекс"
              value={complex}
              onChange={(e) => setComplex(e.target.value)}
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

            {/* Провинция (заблокированное поле, всегда "Bali") */}
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

            <Typography>Существующие фото:</Typography>
            <Grid container spacing={2}>
              {images.map((url, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Box>
                    <img
                      src={url}
                      alt="property"
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
              Загрузить новые фото
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button variant="contained" color="primary" type="submit">
                Сохранить
              </Button>
              <Button variant="contained" color="error" onClick={handleDelete}>
                Удалить объект
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EditProperty;