// src/pages/CreateProperty.js

import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
// Импортируем функцию загрузки в Firebase Storage в нужную папку
import { uploadToFirebaseStorageInFolder } from "../utils/firebaseStorage";
import { showSuccess } from '../utils/notifications';

// Импорт компонентов shadcn
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Loader2 } from "lucide-react";

// Для Drag & Drop
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

// Для сжатия и PDF
import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";

function CreateProperty() {
  // Мобильная детекция
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Цена (USD) — обязательное поле
  const [price, setPrice] = useState("");

  // Тип (Select)
  const [type, setType] = useState("Вилла");

  // Список комплексов и выбранный комплекс
  const [complexList, setComplexList] = useState([]);
  const [complex, setComplex] = useState("none");

  // Застройщик (только заглавные английские буквы и пробелы, обязательно)
  const [developer, setDeveloper] = useState("");
  const handleDeveloperChange = (e) => {
    // Преобразуем ввод в заглавные и убираем всё, кроме A-Z и пробела
    const input = e.target.value.toUpperCase().replace(/[^A-Z ]/g, "");
    setDeveloper(input);
  };

  // Район (обязательное)
  const [district, setDistrict] = useState("none");
  // Координаты (обязательное)
  const [coordinates, setCoordinates] = useState("");
  // Город, RDTR
  const [city, setCity] = useState("Kab. Badung");
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");

  // Нужно ли блокировать поля при автозаполнении
  const [isAutoFill, setIsAutoFill] = useState(false);

  // Остальные поля
  const [status, setStatus] = useState("Строится");
  const [buildingType, setBuildingType] = useState("Новый комплекс");

  // Спальни (обязательное)
  const [bedrooms, setBedrooms] = useState("none");
  // Площадь (обязательное)
  const [area, setArea] = useState("");

  // Провинция (Bali)
  const province = "Bali";

  // Форма собственности, ...
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState("");
  const [pool, setPool] = useState("none");
  const [description, setDescription] = useState("");

  // Поле «Лет» (для Leashold)
  const [leaseYears, setLeaseYears] = useState("");

  // Три новых поля: SHGB, PBG, SLF
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // Новое поле «Юридическое название компании»
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // [NEW] Поле «Вознаграждение» (от 1 до 10, шаг 0.5)
  const [commission, setCommission] = useState("1.0");
  // Генерируем варианты "1.0", "1.5", ... "10.0"
  const commissionOptions = [];
  for (let val = 1; val <= 10; val += 0.5) {
    commissionOptions.push(val.toFixed(1));
  }

  // Массив для Drag & Drop (фото)
  const [dndItems, setDndItems] = useState([]);

  // Состояния для спиннеров
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
            legalCompanyName: data.legalCompanyName || "",
            commission: data.commission ?? "1.0"
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

    setIsUploading(true);
    const selectedFiles = Array.from(e.target.files);

    // Настройки сжатия
    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };

    const newItems = [];
    try {
      for (let file of selectedFiles) {
        if (file.type === "application/pdf") {
          // PDF -> конвертация
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
          // Обычный файл
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

    setDndItems((prev) => [...prev, ...newItems]);
    setIsUploading(false);
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
  const handleComplexChange = (value) => {
    const chosenName = value === "none" ? "" : value;
    setComplex(chosenName);

    if (!chosenName) {
      // Сброс
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
      setCommission("1.0");
      setIsAutoFill(false);
    } else {
      const found = complexList.find((c) => c.name === chosenName);
      if (found) {
        setCoordinates(found.coordinates || "");
        // Застройщик: приводим к заглавным + пробелам
        setDeveloper(found.developer.toUpperCase().replace(/[^A-Z ]/g, ""));
        setDistrict(found.district || "");
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

        // Commission
        if (found.commission !== undefined) {
          const c = parseFloat(found.commission);
          setCommission(c.toFixed(1));
        } else {
          setCommission("1.0");
        }

        setIsAutoFill(true);
      }
    }
  };

  // Сабмит формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Загружаем фото через Firebase Storage в папку "property"
      const imageUrls = [];
      for (let item of dndItems) {
        const url = await uploadToFirebaseStorageInFolder(item.file, "property");
        imageUrls.push(url);
      }

      // Координаты
      let latitude = 0;
      let longitude = 0;
      if (coordinates.trim()) {
        const [latStr, lonStr] = coordinates.split(",");
        latitude = parseFloat(latStr?.trim()) || 0;
        longitude = parseFloat(lonStr?.trim()) || 0;
      }

      // Если Leashold => leaseYears, иначе ""
      const finalLeaseYears = ownershipForm === "Leashold" ? leaseYears : "";

      // Парсим commission
      const finalCommission = parseFloat(commission) || 1.0;

      // Собираем объект
      const newProp = {
        price: parseFloat(price) || 0,
        type,
        complex: complex === "none" ? "" : complex,
        developer,
        district: district === "none" ? "" : district,
        latitude,
        longitude,
        status,
        buildingType,
        bedrooms: bedrooms === "none" ? "" : bedrooms,
        area,
        province,
        city,
        rdtr,
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate,
        pool: pool === "none" ? "" : pool,
        description,
        images: imageUrls,
        createdAt: new Date(),
        leaseYears: finalLeaseYears,
        shgb,
        pbg,
        slf,
        legalCompanyName,
        commission: finalCommission
      };

      // Сохраняем объект в Firestore
      await addDoc(collection(db, "properties"), newProp);

      // Сбрасываем поля формы
      setPrice("");
      setType("Вилла");
      setComplex("none");
      setDeveloper("");
      setDistrict("none");
      setCoordinates("");
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");
      setIsAutoFill(false);
      setStatus("Строится");
      setBuildingType("Новый комплекс");
      setBedrooms("none");
      setArea("");
      setManagementCompany("");
      setOwnershipForm("Freehold");
      setLandStatus("Туристическая зона (W)");
      setCompletionDate("");
      setPool("none");
      setDescription("");
      setLeaseYears("");
      setShgb("");
      setPbg("");
      setSlf("");
      setLegalCompanyName("");
      setCommission("1.0");
      setDndItems([]);

      showSuccess("Объект создан!");
    } catch (error) {
      console.error("Ошибка создания объекта:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-4 ${isMobile ? 'px-2' : ''}`}>
      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>
            Создать Объект
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
              {/* Цена (USD) */}
              <div className="space-y-2">
                <Label htmlFor="price">Цена (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              {/* Тип */}
              <div className="space-y-2">
                <Label htmlFor="type">Тип</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Вилла">Вилла</SelectItem>
                    <SelectItem value="Апартаменты">Апартаменты</SelectItem>
                    <SelectItem value="Дом">Дом</SelectItem>
                    <SelectItem value="Коммерческая недвижимость">
                      Коммерческая недвижимость
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Комплекс */}
              <div className="space-y-2">
                <Label htmlFor="complex">Комплекс</Label>
                <Select value={complex} onValueChange={handleComplexChange}>
                  <SelectTrigger id="complex">
                    <SelectValue placeholder="Выберите комплекс" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(не выбрано)</SelectItem>
                    {complexList.map((c, idx) => (
                      <SelectItem key={idx} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Застройщик */}
              <div className="space-y-2">
                <Label htmlFor="developer">Застройщик</Label>
                <Input
                  id="developer"
                  value={developer}
                  onChange={handleDeveloperChange}
                  required
                  disabled={isAutoFill}
                />
              </div>

              {/* Район */}
              <div className="space-y-2">
                <Label htmlFor="district">Район</Label>
                <Select 
                  value={district} 
                  onValueChange={setDistrict}
                  disabled={isAutoFill}
                >
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Выберите район" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(не выбрано)</SelectItem>
                    <SelectItem value="Амед">Амед</SelectItem>
                    <SelectItem value="Берава">Берава</SelectItem>
                    <SelectItem value="Джимбаран">Джимбаран</SelectItem>
                    <SelectItem value="Кута">Кута</SelectItem>
                    <SelectItem value="Ловина">Ловина</SelectItem>
                    <SelectItem value="Нуану">Нуану</SelectItem>
                    <SelectItem value="Нуса Дуа">Нуса Дуа</SelectItem>
                    <SelectItem value="Переренан">Переренан</SelectItem>
                    <SelectItem value="Санур">Санур</SelectItem>
                    <SelectItem value="Семиньяк">Семиньяк</SelectItem>
                    <SelectItem value="Убуд">Убуд</SelectItem>
                    <SelectItem value="Улувату">Улувату</SelectItem>
                    <SelectItem value="Умалас">Умалас</SelectItem>
                    <SelectItem value="Унгасан">Унгасан</SelectItem>
                    <SelectItem value="Чангу">Чангу</SelectItem>
                    <SelectItem value="Чемаги">Чемаги</SelectItem>
                    <SelectItem value="Гили Траванган">Гили Траванган</SelectItem>
                    <SelectItem value="Ломбок">Ломбок</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Координаты */}
              <div className="space-y-2">
                <Label htmlFor="coordinates">Координаты (шир, долг)</Label>
                <Input
                  id="coordinates"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  required
                  disabled={isAutoFill}
                />
              </div>

              {/* Статус */}
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Проект">Проект</SelectItem>
                    <SelectItem value="Строится">Строится</SelectItem>
                    <SelectItem value="Готовый">Готовый</SelectItem>
                    <SelectItem value="От собственника">От собственника</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Тип постройки */}
              <div className="space-y-2">
                <Label htmlFor="buildingType">Тип постройки</Label>
                <Select value={buildingType} onValueChange={setBuildingType}>
                  <SelectTrigger id="buildingType">
                    <SelectValue placeholder="Выберите тип постройки" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Новый комплекс">Новый комплекс</SelectItem>
                    <SelectItem value="Реновация">Реновация</SelectItem>
                    <SelectItem value="ИЖС">ИЖС</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Спальни */}
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Спальни</Label>
                <Select value={bedrooms} onValueChange={setBedrooms} required>
                  <SelectTrigger id="bedrooms">
                    <SelectValue placeholder="Выберите количество спален" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(не выбрано)</SelectItem>
                    <SelectItem value="Студия">Студия</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Площадь */}
              <div className="space-y-2">
                <Label htmlFor="area">Площадь (м²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                />
              </div>

              {/* Провинция */}
              <div className="space-y-2">
                <Label htmlFor="province">Провинция</Label>
                <Input
                  id="province"
                  value={province}
                  disabled
                />
              </div>

              {/* Город */}
              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <Select value={city} onValueChange={setCity} disabled={isAutoFill}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kab. Jembrana">Kab. Jembrana</SelectItem>
                    <SelectItem value="Kab. Tabanan">Kab. Tabanan</SelectItem>
                    <SelectItem value="Kab. Badung">Kab. Badung</SelectItem>
                    <SelectItem value="Kab. Gianyar">Kab. Gianyar</SelectItem>
                    <SelectItem value="Kab. Bangli">Kab. Bangli</SelectItem>
                    <SelectItem value="Kab. Karangasem">Kab. Karangasem</SelectItem>
                    <SelectItem value="Kab. Buleleng">Kab. Buleleng</SelectItem>
                    <SelectItem value="Kota Denpasar">Kota Denpasar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RDTR */}
              <div className="space-y-2">
                <Label htmlFor="rdtr">RDTR</Label>
                <Select value={rdtr} onValueChange={setRdtr} disabled={isAutoFill}>
                  <SelectTrigger id="rdtr">
                    <SelectValue placeholder="Выберите RDTR" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RDTR Kecamatan Ubud">RDTR Kecamatan Ubud</SelectItem>
                    <SelectItem value="RDTR Kuta">RDTR Kuta</SelectItem>
                    <SelectItem value="RDTR Kecamatan Kuta Utara">RDTR Kecamatan Kuta Utara</SelectItem>
                    <SelectItem value="RDTR Kuta Selatan">RDTR Кuta Selatan</SelectItem>
                    <SelectItem value="RDTR Mengwi">RDTR Mengwi</SelectItem>
                    <SelectItem value="RDTR Kecamatan Abiansemal">RDTR Kecamatan Abiansemal</SelectItem>
                    <SelectItem value="RDTR Wilayah Перencания Petang">RDTR Wilayah Перencания Petang</SelectItem>
                    <SelectItem value="RDTR Kecamatan Sukawati">RDTR Kecamatan Sukawati</SelectItem>
                    <SelectItem value="RDTR Kecamatan Payangan">RDTR Kecamatan Payangan</SelectItem>
                    <SelectItem value="RDTR Kecamatan Tegallalang">RDTR Kecamatan Tegallalang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Управляющая компания */}
              <div className="space-y-2">
                <Label htmlFor="managementCompany">Управляющая компания</Label>
                <Input
                  id="managementCompany"
                  value={managementCompany}
                  onChange={(e) => setManagementCompany(e.target.value)}
                  disabled={isAutoFill}
                />
              </div>

              {/* Форма собственности */}
              <div className="space-y-2">
                <Label htmlFor="ownershipForm">Форма собственности</Label>
                <Select value={ownershipForm} onValueChange={setOwnershipForm} disabled={isAutoFill}>
                  <SelectTrigger id="ownershipForm">
                    <SelectValue placeholder="Выберите форму собственности" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leashold">Leashold</SelectItem>
                    <SelectItem value="Freehold">Freehold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {ownershipForm === "Leashold" && (
                <div className="space-y-2">
                  <Label htmlFor="leaseYears">Лет</Label>
                  <Input
                    id="leaseYears"
                    value={leaseYears}
                    onChange={(e) => setLeaseYears(e.target.value)}
                    disabled={isAutoFill}
                    placeholder="Например: 30, 30+20"
                  />
                </div>
              )}

              {/* Статус земли */}
              <div className="space-y-2">
                <Label htmlFor="landStatus">Статус земли</Label>
                <Select value={landStatus} onValueChange={setLandStatus} disabled={isAutoFill}>
                  <SelectTrigger id="landStatus">
                    <SelectValue placeholder="Выберите статус земли" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Туристическая зона (W)">Туристическая зона (W)</SelectItem>
                    <SelectItem value="Торговая зона (K)">Торговая зона (K)</SelectItem>
                    <SelectItem value="Смешанная зона (C)">Смешанная зона (C)</SelectItem>
                    <SelectItem value="Жилая зона (R)">Жилая зона (R)</SelectItem>
                    <SelectItem value="Сельхоз зона (P)">Сельхоз зона (P)</SelectItem>
                    <SelectItem value="Заповедная зона (RTH)">Заповедная зона (RTH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Дата завершения */}
              <div className="space-y-2">
                <Label htmlFor="completionDate">Дата завершения (месяц/год)</Label>
                <Input
                  id="completionDate"
                  type="month"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  disabled={isAutoFill}
                />
              </div>

              {/* Бассейн */}
              <div className="space-y-2">
                <Label htmlFor="pool">Бассейн</Label>
                <Select value={pool} onValueChange={setPool}>
                  <SelectTrigger id="pool">
                    <SelectValue placeholder="Выберите тип бассейна" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(не выбрано)</SelectItem>
                    <SelectItem value="Нет">Нет</SelectItem>
                    <SelectItem value="Частный">Частный</SelectItem>
                    <SelectItem value="Общий">Общий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SHGB */}
              <div className="space-y-2">
                <Label htmlFor="shgb">Сертификат права на землю (SHGB)</Label>
                <Input
                  id="shgb"
                  value={shgb}
                  onChange={(e) => setShgb(e.target.value)}
                />
              </div>

              {/* PBG */}
              <div className="space-y-2">
                <Label htmlFor="pbg">Разрешение на строительство (PBG)</Label>
                <Input
                  id="pbg"
                  value={pbg}
                  onChange={(e) => setPbg(e.target.value)}
                />
              </div>

              {/* SLF */}
              <div className="space-y-2">
                <Label htmlFor="slf">Сертификат готовности здания (SLF)</Label>
                <Input
                  id="slf"
                  value={slf}
                  onChange={(e) => setSlf(e.target.value)}
                />
              </div>

              {/* Юридическое название компании */}
              <div className="space-y-2">
                <Label htmlFor="legalCompanyName">Юридическое название компании</Label>
                <Input
                  id="legalCompanyName"
                  value={legalCompanyName}
                  onChange={(e) => setLegalCompanyName(e.target.value)}
                />
              </div>

              {/* Вознаграждение */}
              <div className="space-y-2">
                <Label htmlFor="commission">Вознаграждение</Label>
                <Select value={commission} onValueChange={setCommission}>
                  <SelectTrigger id="commission">
                    <SelectValue placeholder="Выберите вознаграждение" />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionOptions.map((val) => (
                      <SelectItem key={val} value={val}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Описание - на всю ширину */}
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            {/* Загрузка файлов */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Загрузите JPG/PNG или PDF (будет разбит на страницы):
              </p>
              
              <DndProvider backend={HTML5Backend}>
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-4`}>
                  {dndItems.map((item, idx) => (
                    <div key={item.id} className="relative">
                      <DraggablePreviewItem
                        item={item}
                        url={item.url}
                        index={idx}
                        moveItem={moveDndItem}
                        onRemove={() => handleRemoveDndItem(item.id)}
                      />
                    </div>
                  ))}
                </div>
              </DndProvider>

              <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : ''}`}>
                <Button
                  variant="outline"
                  className={`w-full ${isMobile ? 'h-12' : ''}`}
                  disabled={isUploading}
                  asChild
                >
                  <label>
                    Загрузить фото / PDF
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileChangeDnd}
                    />
                  </label>
                </Button>
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>

            {/* Кнопка создания */}
            <div className="pt-6">
              {isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Сохраняем...</span>
                </div>
              ) : (
                <Button type="submit" className={`w-full ${isMobile ? 'h-12' : ''}`}>
                  Создать
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateProperty;