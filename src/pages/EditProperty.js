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
  MenuItem,
  CircularProgress
} from "@mui/material";

// Для Drag & Drop
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Состояния для загрузки/сохранения
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Основные поля
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [status, setStatus] = useState("");
  const [district, setDistrict] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [classRating, setClassRating] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("");
  const [landStatus, setLandStatus] = useState("");
  const [pool, setPool] = useState("");
  const [description, setDescription] = useState("");
  const [developer, setDeveloper] = useState("");
  const [complex, setComplex] = useState("");
  const [area, setArea] = useState("");

  // «Провинция» (Bali), «Город», «RDTR»
  const [province, setProvince] = useState("Bali");
  const [city, setCity] = useState("");
  const [rdtr, setRdtr] = useState("");

  // Дополнительные поля
  const [managementCompany, setManagementCompany] = useState("");

  // Поле «Дата завершения» (только месяц/год)
  const [completionDate, setCompletionDate] = useState("");

  // Поле «Лет» (для Leashold)
  const [leaseYears, setLeaseYears] = useState("");

  // Три новых поля: SHGB, PBG, SLF
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // Новое поле «Юридическое название компании»
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // [NEW] Поле «Вознаграждение» (commission) — от 1 до 10, шаг 0.5
  const [commission, setCommission] = useState("1.0");

  // Создаём массив опций [ "1.0", "1.5", "2.0", ..., "10.0" ]
  const commissionOptions = [];
  for (let val = 1; val <= 10; val += 0.5) {
    commissionOptions.push(val.toFixed(1)); // например "1.0", "1.5", "2.0"...
  }

  // Массив объектов для фото (старые + новые)
  // Каждый элемент: { id, url, file }
  const [images, setImages] = useState([]);

  // Загрузка данных при монтировании
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const ref = doc(db, "properties", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();

          // Цена (число) -> строка
          setPrice(data.price?.toString() || "");
          setType(data.type || "");

          // Координаты
          if (typeof data.latitude === "number" && typeof data.longitude === "number") {
            setCoordinates(`${data.latitude}, ${data.longitude}`);
          } else {
            setCoordinates(data.coordinates || "");
          }

          setStatus(data.status || "");
          setDistrict(data.district || "");
          setDescription(data.description || "");
          setDeveloper(data.developer || "");
          setComplex(data.complex || "");
          setBuildingType(data.buildingType || "");
          setBedrooms(data.bedrooms || "");
          setArea(data.area || "");

          // Province, city, rdtr
          setProvince("Bali");
          setCity(data.city || "");
          setRdtr(data.rdtr || "");
          setClassRating(data.classRating || "");
          setManagementCompany(data.managementCompany || "");
          setOwnershipForm(data.ownershipForm || "");
          setLandStatus(data.landStatus || "");
          setPool(data.pool || "");

          // Дата завершения (Timestamp -> "YYYY-MM")
          if (data.completionDate instanceof Timestamp) {
            const dateObj = data.completionDate.toDate();
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
            setCompletionDate(`${yyyy}-${mm}`);
          } else {
            setCompletionDate(data.completionDate || "");
          }

          // Лет (для Leashold)
          setLeaseYears(data.leaseYears || "");

          // Три новых поля: SHGB, PBG, SLF
          setShgb(data.shgb || "");
          setPbg(data.pbg || "");
          setSlf(data.slf || "");

          // Юридическое название компании
          setLegalCompanyName(data.legalCompanyName || "");

          // Если уже есть commission (число), приводим к строке с одним знаком после запятой
          if (data.commission !== undefined) {
            const c = parseFloat(data.commission);
            setCommission(c.toFixed(1));
          } else {
            setCommission("1.0"); // значение по умолчанию
          }

          // Преобразуем массив строк (URL) в объекты { id, url, file: null }
          const oldImages = (data.images || []).map((url) => ({
            id: crypto.randomUUID(),
            url,
            file: null
          }));
          setImages(oldImages);
        }
      } catch (error) {
        console.error("Ошибка загрузки объекта:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // Обработчик выбора новых файлов (с учётом сжатия и PDF-конвертации)
  const handleFileChange = async (e) => {
    if (!e.target.files) return;

    setIsUploading(true); // Показываем спиннер и блокируем кнопку

    // Динамический импорт imageCompression
    const imageCompression = (await import("browser-image-compression")).default;
    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };

    const selectedFiles = Array.from(e.target.files);
    const newImagesArr = [];

    for (let file of selectedFiles) {
      try {
        if (file.type === "application/pdf") {
          // Если это PDF — конвертируем
          const { convertPdfToImages } = await import("../utils/pdfUtils");
          const pageBlobs = await convertPdfToImages(file);

          for (let blob of pageBlobs) {
            const compressed = await imageCompression(blob, compressionOptions);
            newImagesArr.push({
              id: crypto.randomUUID(),
              url: URL.createObjectURL(compressed),
              file: compressed
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
      } catch (err) {
        console.error("Ошибка обработки файла:", err);
      }
    }

    setImages((prev) => [...prev, ...newImagesArr]);
    setIsUploading(false); // Выключаем спиннер
  };

  // Перестановка (Drag & Drop)
  const moveImage = (dragIndex, hoverIndex) => {
    setImages((prev) => {
      const arr = [...prev];
      const [draggedItem] = arr.splice(dragIndex, 1);
      arr.splice(hoverIndex, 0, draggedItem);
      return arr;
    });
  };

  // Удаление одного фото
  const handleRemoveImage = (idx) => {
    const updated = [...images];
    updated.splice(idx, 1);
    setImages(updated);
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
          // Новое фото
          const url = await uploadToCloudinary(item.file);
          finalUrls.push(url);
        } else {
          // Старое фото
          finalUrls.push(item.url);
        }
      }

      // Парсим цену
      const parsedPrice = parseFloat(price) || 0;

      // Координаты -> latitude, longitude
      let latitude = 0;
      let longitude = 0;
      if (coordinates.trim()) {
        const [latStr, lonStr] = coordinates.split(",");
        latitude = parseFloat(latStr.trim()) || 0;
        longitude = parseFloat(lonStr.trim()) || 0;
      }

      // Дата завершения "YYYY-MM" -> Timestamp
      let compDateStamp = null;
      if (completionDate) {
        const [yyyy, mm] = completionDate.split("-");
        const parsedYear = parseInt(yyyy, 10);
        const parsedMonth = parseInt(mm, 10) - 1;
        const dateObj = new Date(parsedYear, parsedMonth, 1);
        compDateStamp = Timestamp.fromDate(dateObj);
      }

      // Если Leashold, сохраняем leaseYears, иначе ""
      const finalLeaseYears = ownershipForm === "Leashold" ? leaseYears : "";

      // Парсим commission (строка -> число), либо 1.0 по умолчанию
      const finalCommission = parseFloat(commission) || 1.0;

      // Собираем данные
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
        province: "Bali",
        city,
        rdtr,
        classRating,
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate: compDateStamp,
        pool,
        images: finalUrls,
        leaseYears: finalLeaseYears,

        // Три новых поля
        shgb,
        pbg,
        slf,

        // Новое поле «Юридическое название компании»
        legalCompanyName,

        // Вознаграждение
        commission: finalCommission
      };

      // Обновляем документ
      await updateDoc(doc(db, "properties", id), updatedData);

      // (Опционально) обновляем локальный стейт
      const updatedImagesState = finalUrls.map((url) => ({
        id: crypto.randomUUID(),
        url,
        file: null
      }));
      setImages(updatedImagesState);

      alert("Объект обновлён!");
    } catch (error) {
      console.error("Ошибка обновления объекта:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление всего объекта
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

  if (loading) {
    return <Box sx={{ p: 2 }}>Загрузка...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 800, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Редактировать Объект (ID: {id})
          </Typography>

          <DndProvider backend={HTML5Backend}>
            <Box
              component="form"
              onSubmit={handleSave}
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

              {/* Координаты */}
              <TextField
                label="Координаты (шир, долг)"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
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

              {/* Район */}
              <FormControl>
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
                  <MenuItem value="Гили Траванган">Гили Траванган</MenuItem>
                  <MenuItem value="Ломбок">Ломбок</MenuItem>
                </Select>
              </FormControl>

              {/* Застройщик */}
              <TextField
                label="Застройщик"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
              />

              {/* Комплекс */}
              <TextField
                label="Комплекс"
                value={complex}
                onChange={(e) => setComplex(e.target.value)}
              />

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
                  <MenuItem value="RDTR Kecamatan Ubud">RDTR Kecamatan Ubud</MenuItem>
                  <MenuItem value="RDTR Kuta">RDTR Kuta</MenuItem>
                  <MenuItem value="RDTR Kecamatan Kuta Utara">RDTR Kecamatan Kuta Utara</MenuItem>
                  <MenuItem value="RDTR Kuta Selatan">RDTR Kuta Selatan</MenuItem>
                  <MenuItem value="RDTR Mengwi">RDTR Mengwi</MenuItem>
                  <MenuItem value="RDTR Kecamatan Abiansemal">
                    RDTR Kecamatan Abiansemal
                  </MenuItem>
                  <MenuItem value="RDTR Wilayah Перencanaan Petang">
                    RDTR Wilayah Перencания Petang
                  </MenuItem>
                  <MenuItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</MenuItem>
                  <MenuItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</MenuItem>
                  <MenuItem value="RDTR Kecamatan Tegallalang">
                    RDTR Kecamatan Tegallalang
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Класс */}
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
              />

              {/* Форма собственности */}
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

              {/* Статус земли */}
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

              {/* Дата завершения (месяц/год) */}
              <TextField
                label="Дата завершения (месяц/год)"
                type="month"
                InputLabelProps={{ shrink: true }}
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
              />

              {/* Бассейн */}
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

              {/* Новое поле: «Юридическое название компании» */}
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
                <Button variant="contained" component="label" disabled={isUploading}>
                  Загрузить новые фото / PDF
                  <input type="file" hidden multiple onChange={handleFileChange} />
                </Button>
                {isUploading && <CircularProgress size={24} />}
              </Box>

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                {isSaving ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={24} />
                    <Typography>Сохраняем...</Typography>
                  </Box>
                ) : (
                  <Button variant="contained" color="primary" type="submit">
                    Сохранить
                  </Button>
                )}

                <Button variant="contained" color="error" onClick={handleDelete}>
                  Удалить объект
                </Button>
              </Box>
            </Box>
          </DndProvider>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EditProperty;