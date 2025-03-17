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
  Grid,
  CircularProgress
} from "@mui/material";

// ====== Для Drag & Drop ======
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

// ====== Импортируем библиотеку для сжатия ======
import imageCompression from "browser-image-compression";

// ====== Импортируем функцию конвертации PDF (пример) ======
import { convertPdfToImages } from "../utils/pdfUtils";

function CreateProperty() {
  // Цена (USD)
  const [price, setPrice] = useState("");

  // Тип (Select)
  const [type, setType] = useState("Вилла");

  // Список комплексов и выбранный комплекс
  const [complexList, setComplexList] = useState([]);
  const [complex, setComplex] = useState("");

  // Поля, которые могут автозаполняться (заблокированы, если autoFill)
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [city, setCity] = useState("Kab. Badung");
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");
  const [isAutoFill, setIsAutoFill] = useState(false);

  // Остальные поля
  const [status, setStatus] = useState("Строится");
  const [buildingType, setBuildingType] = useState("Новый комплекс");
  const [bedrooms, setBedrooms] = useState("");
  const [area, setArea] = useState("");

  // Провинция (Bali)
  const province = "Bali";

  // Класс, форма собственности и т.д.
  const [classRating, setClassRating] = useState("Комфорт (B)");
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState(""); // "YYYY-MM"
  const [pool, setPool] = useState("");
  const [description, setDescription] = useState("");

  // Новое поле «Лет» (для Leashold)
  const [leaseYears, setLeaseYears] = useState("");

  // *** Три новых поля: SHGB, PBG, SLF
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // *** Новое поле «Юридическое название компании»
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // Массив для Drag & Drop (фото)
  const [dndItems, setDndItems] = useState([]);

  // Состояния для спиннеров
  const [isSaving, setIsSaving] = useState(false);     // спиннер при сохранении формы
  const [isUploading, setIsUploading] = useState(false); // спиннер при загрузке/обработке файлов

  // Загрузка списка комплексов из Firestore
  useEffect(() => {
    async function loadComplexes() {
      try {
        const snapshot = await getDocs(collection(db, "complexes"));
        const loaded = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            name: data.name || "Без названия",
            developer: data.developer || "",
            district: data.district || "",
            coordinates: data.coordinates || "",
            city: data.city || "",
            rdtr: data.rdtr || "",
            managementCompany: data.managementCompany || "",
            ownershipForm: data.ownershipForm || "Freehold",
            landStatus: data.landStatus || "Туристическая зона (W)",
            completionDate: data.completionDate || "",
            leaseYears: data.leaseYears || "",
            shgb: data.shgb || "",
            pbg: data.pbg || "",
            slf: data.slf || "",
            legalCompanyName: data.legalCompanyName || ""
          };
        });
        setComplexList(loaded);
      } catch (error) {
        console.error("Ошибка загрузки комплексов:", error);
      }
    }
    loadComplexes();
  }, []);

  // Обработчик выбора файлов (Drag & Drop) + сжатие + PDF
  const handleFileChangeDnd = async (e) => {
    if (!e.target.files) return;

    setIsUploading(true); // включаем спиннер и блокируем кнопку
    const selectedFiles = Array.from(e.target.files);

    // Настройки сжатия (макс. 10 MB)
    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };

    const newItems = [];
    try {
      for (let file of selectedFiles) {
        // Если это PDF — конвертируем в картинки
        if (file.type === "application/pdf") {
          const pageBlobs = await convertPdfToImages(file);
          for (let blob of pageBlobs) {
            const compressed = await imageCompression(blob, compressionOptions);
            newItems.push({
              id: crypto.randomUUID(),
              file: compressed,
              url: URL.createObjectURL(compressed),
            });
          }
        } else {
          // Обычный файл (jpg/png и т.д.)
          const compressedFile = await imageCompression(file, compressionOptions);
          newItems.push({
            id: crypto.randomUUID(),
            file: compressedFile,
            url: URL.createObjectURL(compressedFile)
          });
        }
      }
    } catch (err) {
      console.error("Ошибка обработки файла:", err);
    }

    // Обновляем dndItems
    setDndItems((prev) => [...prev, ...newItems]);
    setIsUploading(false); // выключаем спиннер, разблокируем кнопку
  };

  // Удалить одно фото
  const handleRemoveDndItem = (id) => {
    setDndItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Перестановка (Drag & Drop)
  const moveDndItem = (dragIndex, hoverIndex) => {
    setDndItems((prev) => {
      const arr = [...prev];
      const [dragged] = arr.splice(dragIndex, 1);
      arr.splice(hoverIndex, 0, dragged);
      return arr;
    });
  };

  // При выборе комплекса (автозаполнение)
  const handleComplexChange = (e) => {
    const chosenName = e.target.value;
    setComplex(chosenName);

    if (!chosenName) {
      // Сброс автозаполнения
      setCoordinates("");
      setDeveloper("");
      setDistrict("");
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");
      setManagementCompany("");
      setOwnershipForm("Freehold");
      setLandStatus("Туристическая зона (W)");
      setCompletionDate("");
      setLeaseYears("");
      setShgb("");
      setPbg("");
      setSlf("");
      setLegalCompanyName("");
      setIsAutoFill(false);
    } else {
      const found = complexList.find((c) => c.name === chosenName);
      if (found) {
        setCoordinates(found.coordinates);
        setDeveloper(found.developer);
        setDistrict(found.district);
        if (found.city) setCity(found.city);
        if (found.rdtr) setRdtr(found.rdtr);
        if (found.managementCompany) setManagementCompany(found.managementCompany);
        if (found.ownershipForm) setOwnershipForm(found.ownershipForm);
        if (found.landStatus) setLandStatus(found.landStatus);
        if (found.completionDate) setCompletionDate(found.completionDate);
        if (found.leaseYears) setLeaseYears(found.leaseYears);
        if (found.shgb) setShgb(found.shgb);
        if (found.pbg) setPbg(found.pbg);
        if (found.slf) setSlf(found.slf);
        if (found.legalCompanyName) setLegalCompanyName(found.legalCompanyName);

        setIsAutoFill(true);
      }
    }
  };

  // Сабмит формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Загружаем фото в Cloudinary
      const imageUrls = [];
      for (let item of dndItems) {
        const url = await uploadToCloudinary(item.file);
        imageUrls.push(url);
      }

      // Парсим координаты
      let latitude = 0;
      let longitude = 0;
      if (coordinates.trim()) {
        const [latStr, lonStr] = coordinates.split(",");
        latitude = parseFloat(latStr?.trim()) || 0;
        longitude = parseFloat(lonStr?.trim()) || 0;
      }

      // Если Leashold, учитываем leaseYears
      const finalLeaseYears = ownershipForm === "Leashold" ? leaseYears : "";

      // Формируем объект для Firestore
      const newProp = {
        price: parseFloat(price) || 0,
        type,
        complex,
        developer,
        district,
        latitude,
        longitude,
        status,
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
        description,
        images: imageUrls,
        createdAt: new Date(),
        leaseYears: finalLeaseYears,
        shgb,
        pbg,
        slf,
        legalCompanyName
      };

      // Сохраняем в Firestore
      await addDoc(collection(db, "properties"), newProp);

      // Сбрасываем все поля
      setPrice("");
      setType("Вилла");
      setComplex("");
      setDeveloper("");
      setDistrict("");
      setCoordinates("");
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");
      setIsAutoFill(false);

      setStatus("Строится");
      setBuildingType("Новый комплекс");
      setBedrooms("");
      setArea("");
      setClassRating("Комфорт (B)");
      setManagementCompany("");
      setOwnershipForm("Freehold");
      setLandStatus("Туристическая зона (W)");
      setCompletionDate("");
      setPool("");
      setDescription("");
      setLeaseYears("");
      setShgb("");
      setPbg("");
      setSlf("");
      setLegalCompanyName("");
      setDndItems([]);

      alert("Объект создан!");
    } catch (error) {
      console.error("Ошибка создания объекта:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Объект
          </Typography>

          <DndProvider backend={HTML5Backend}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
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
                  <MenuItem value="Коммерческая недвижимость">
                    Коммерческая недвижимость
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Комплекс */}
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

              {/* Застройщик */}
              <TextField
                label="Застройщик"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                disabled={isAutoFill}
              />

              {/* Район (Select) */}
              <FormControl disabled={isAutoFill}>
                <InputLabel id="district-label">Район</InputLabel>
                <Select
                  labelId="district-label"
                  label="Район"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <MenuItem value="">(не выбрано)</MenuItem>
                  <MenuItem value="Амед">Амед</MenuItem>
                  <MenuItem value="Берава">Берава</MenuItem>
                  <MenuItem value="Джимбаран">Джимбаран</MenuItem>
                  <MenuItem value="Кута">Кута</MenuItem>
                  <MenuItem value="Ловина">Ловина</MenuItem>
                  <MenuItem value="Нуану">Нуану</MenuItem>
                  <MenuItem value="Нуса Дуа">Нуса Дуа</MenuItem>
                  <MenuItem value="Переренан">Переренан</MenuItem>
                  <MenuItem value="Санур">Санур</MenuItem>
                  <MenuItem value="Семиньяк">Семиньяк</MenuItem>
                  <MenuItem value="Убуд">Убуд</MenuItem>
                  <MenuItem value="Улувату">Улувату</MenuItem>
                  <MenuItem value="Умалас">Умалас</MenuItem>
                  <MenuItem value="Унгасан">Унгасан</MenuItem>
                  <MenuItem value="Чангу">Чангу</MenuItem>
                  <MenuItem value="Чемаги">Чемаги</MenuItem>
                </Select>
              </FormControl>

              {/* Координаты */}
              <TextField
                label="Координаты (шир, долг)"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                disabled={isAutoFill}
              />

              {/* Статус */}
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

              {/* Тип постройки */}
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

              {/* Спальни */}
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

              {/* Площадь */}
              <TextField
                label="Площадь (м²)"
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />

              {/* Провинция (Bali) */}
              <TextField
                label="Провинция"
                value={province}
                disabled
              />

              {/* Город (Select) */}
              <FormControl disabled={isAutoFill}>
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
              <FormControl disabled={isAutoFill}>
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
                  <MenuItem value="RDTR Kecamatan Abiansemal">
                    RDTR Kecamatan Abiansemal
                  </MenuItem>
                  <MenuItem value="RDTR Wilayah Перencания Petang">
                    RDTR Wilayah Перencания Petang
                  </MenuItem>
                  <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                  <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                  <MenuItem value="RDTR Kecamatan Tegallalang">
                    RDTR Kecamatan Tegallalang
                  </MenuItem>
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

              {/* Управляющая компания */}
              <TextField
                label="Управляющая компания"
                value={managementCompany}
                onChange={(e) => setManagementCompany(e.target.value)}
                disabled={isAutoFill}
              />

              {/* Форма собственности */}
              <FormControl disabled={isAutoFill}>
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

              {/* Если Leashold -> поле «Лет» */}
              {ownershipForm === "Leashold" && (
                <TextField
                  label="Лет"
                  type="number"
                  value={leaseYears}
                  onChange={(e) => setLeaseYears(e.target.value)}
                  disabled={isAutoFill}
                />
              )}

              {/* Статус земли */}
              <FormControl disabled={isAutoFill}>
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
                  <MenuItem value="Заповедная зона (RTH)">
                    Заповедная зона (RTH)
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Дата завершения (месяц/год) */}
              <TextField
                label="Дата завершения (месяц/год)"
                type="month"
                InputLabelProps={{ shrink: true }}
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                disabled={isAutoFill}
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

              {/* Описание */}
              <TextField
                label="Описание"
                multiline
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

              {/* Новое поле «Юридическое название компании» */}
              <TextField
                label="Юридическое название компании"
                value={legalCompanyName}
                onChange={(e) => setLegalCompanyName(e.target.value)}
              />

              {/* Drag & Drop превью */}
              <Typography sx={{ mt: 2 }}>
                Загрузите JPG/PNG или PDF (будет разбит на страницы):
              </Typography>

              <DndProvider backend={HTML5Backend}>
                <Grid container spacing={2}>
                  {dndItems.map((item, idx) => (
                    <Grid item xs={6} sm={4} key={item.id}>
                      <Box position="relative">
                        <DraggablePreviewItem
                          item={item}
                          url={item.url}
                          index={idx}
                          moveItem={moveDndItem}
                          onRemove={() => handleRemoveDndItem(item.id)}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </DndProvider>

              {/* Кнопка «Загрузить фото / PDF» (теперь такого же размера и стиля) */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"    // добавили color="primary"
                  component="label"
                  disabled={isUploading}
                  sx={{ width: "820px", mt: 2 }}     // такой же отступ сверху
                >
                  Загрузить фото / PDF
                  <input type="file" hidden multiple onChange={handleFileChangeDnd} />
                </Button>
                {isUploading && <CircularProgress size={24} sx={{ mt: 2 }} />}
              </Box>

              {/* Кнопка «Создать» или спиннер */}
              {isSaving ? (
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Сохраняем...</Typography>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  sx={{ width: "770px", mt: 2 }}
                >
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

export default CreateProperty;