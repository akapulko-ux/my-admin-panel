// src/pages/EditProperty.js

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
// Импорт функций для загрузки и удаления из Firebase Storage
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from "../utils/firebaseStorage";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { showSuccess, showError } from '../utils/notifications';
import { validateArea } from "../lib/utils";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
// Импорт для сжатия изображений и конвертации PDF
import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";

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
import { Badge } from "../components/ui/badge";

// Импорт иконок
import { 
  Loader2,
  Trash2,
  Save,
  Upload
} from "lucide-react";

// Для Drag & Drop
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

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
  const [ownershipForm, setOwnershipForm] = useState("");
  const [landStatus, setLandStatus] = useState("");
  const [pool, setPool] = useState("");
  const [description, setDescription] = useState("");
  const [developer, setDeveloper] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [complex, setComplex] = useState("");
  const [area, setArea] = useState("");
  const [areaError, setAreaError] = useState("");

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
  
  // Дата окончания аренды земли
  const [landLeaseEndDate, setLandLeaseEndDate] = useState("");

  // Новое поле «Юридическое название компании»
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // [NEW] Поле «Агентское вознаграждение» (agentCommission) — от 4% до 10%
  const [agentCommission, setAgentCommission] = useState("5");
  const agentCommissionOptions = ["4", "5", "6", "7", "8", "9", "10"];

  // Поле «Количество юнитов»
  const [unitsCount, setUnitsCount] = useState("");

  // Дополнительные опции
  const [smartHome, setSmartHome] = useState(false);
  const [jacuzzi, setJacuzzi] = useState(false);
  const [terrace, setTerrace] = useState(false);
  const [rooftop, setRooftop] = useState(false);
  const [balcony, setBalcony] = useState(false);
  const [bbq, setBbq] = useState(false);
  const [furniture, setFurniture] = useState(false);
  const [washingMachine, setWashingMachine] = useState(false);

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

          setPrice(data.price?.toString() || "");
          setType(data.type || "");

          if (typeof data.latitude === "number" && typeof data.longitude === "number") {
            setCoordinates(`${data.latitude}, ${data.longitude}`);
          } else {
            setCoordinates(data.coordinates || "");
          }

          setStatus(data.status || "");
          setDistrict(data.district || "");
          setDescription(data.description || "");
          setDeveloper(data.developer || "");
          setPropertyName(data.propertyName || "");
          setComplex(data.complex || "");
          setBuildingType(data.buildingType || "");
          setBedrooms(data.bedrooms || "");
          setArea(data.area || "");

          setProvince("Bali");
          setCity(data.city || "");
          setRdtr(data.rdtr || "");

          setManagementCompany(data.managementCompany || "");
          setOwnershipForm(data.ownershipForm || "");
          setLandStatus(data.landStatus || "");
          setPool(data.pool || "");

          if (data.completionDate instanceof Timestamp) {
            const dateObj = data.completionDate.toDate();
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
            setCompletionDate(`${yyyy}-${mm}`);
          } else {
            setCompletionDate(data.completionDate || "");
          }

          setLeaseYears(data.leaseYears || "");
          setShgb(data.shgb || "");
          setPbg(data.pbg || "");
          setSlf(data.slf || "");
          setLandLeaseEndDate(data.landLeaseEndDate || "");
          setLegalCompanyName(data.legalCompanyName || "");
          setUnitsCount(data.unitsCount ? data.unitsCount.toString() : "");

          if (data.agentCommission !== undefined) {
            const val = String(data.agentCommission).replace(/[%\s]/g, '');
            setAgentCommission(val || "5");
          } else {
            setAgentCommission("5");
          }

          // Загружаем дополнительные опции
          setSmartHome(data.smartHome || false);
          setJacuzzi(data.jacuzzi || false);
          setTerrace(data.terrace || false);
          setRooftop(data.rooftop || false);
          setBalcony(data.balcony || false);
          setBbq(data.bbq || false);
          setFurniture(data.furniture || false);
          setWashingMachine(data.washingMachine || false);

          const oldImages = (data.images || []).map((url) => ({
            id: crypto.randomUUID(),
            url,
            file: null
          }));
          setImages(oldImages);
        }
      } catch (error) {
        console.error("Ошибка загрузки объекта:", error);
        showError("Ошибка при загрузке объекта");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // Обработчик выбора новых файлов (с сжатием и поддержкой PDF)
  const handleFileChange = async (e) => {
    if (!e.target.files) return;

    setIsUploading(true);
    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };

    const selectedFiles = Array.from(e.target.files);
    const newImagesArr = [];

    try {
      for (let file of selectedFiles) {
        if (file.type === "application/pdf") {
          // PDF -> конвертация в изображения
          const pageBlobs = await convertPdfToImages(file);
          for (let blob of pageBlobs) {
            const compressedFile = await imageCompression(blob, compressionOptions);
            newImagesArr.push({
              id: crypto.randomUUID(),
              url: URL.createObjectURL(compressedFile),
              file: compressedFile
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
      }
    } catch (err) {
      console.error("Ошибка обработки файла:", err);
      showError("Ошибка при обработке файлов");
    }

    setImages((prev) => [...prev, ...newImagesArr]);
    setIsUploading(false);
  };

  // Обработка изменения площади с валидацией
  const handleAreaChange = (value) => {
    setArea(value);
    
    if (value === "") {
      setAreaError("");
      return;
    }
    
    const validation = validateArea(value);
    if (!validation.isValid) {
      setAreaError(validation.error);
    } else {
      setAreaError("");
    }
  };

  // Обработчик сохранения
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Валидация площади перед сохранением
    const areaValidation = validateArea(area);
    if (!areaValidation.isValid) {
      setAreaError(areaValidation.error);
      setIsSaving(false);
      return;
    }

    try {
      const finalUrls = [];
      for (let item of images) {
        if (item.file) {
          const url = await uploadToFirebaseStorageInFolder(item.file, "property");
          finalUrls.push(url);
        } else {
          finalUrls.push(item.url);
        }
      }

      let latitude = 0;
      let longitude = 0;
      if (coordinates.trim()) {
        const [latStr, lonStr] = coordinates.split(",");
        latitude = parseFloat(latStr.trim()) || 0;
        longitude = parseFloat(lonStr.trim()) || 0;
      }

      let compDateStamp = null;
      if (completionDate) {
        const [yyyy, mm] = completionDate.split("-");
        const parsedYear = parseInt(yyyy, 10);
        const parsedMonth = parseInt(mm, 10) - 1;
        const dateObj = new Date(parsedYear, parsedMonth, 1);
        compDateStamp = Timestamp.fromDate(dateObj);
      }

      const finalLeaseYears = ownershipForm === "Leashold" ? leaseYears : "";
      const finalAgentCommission = agentCommission ? agentCommission + '%' : '';

      const updatedData = {
        price: parseFloat(price) || 0,
        type,
        latitude,
        longitude,
        status,
        district,
        description,
        developer,
        propertyName,
        complex,
        buildingType,
        bedrooms,
        area: areaValidation.value,
        province,
        city,
        rdtr,
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate: compDateStamp,
        pool,
        images: finalUrls,
        leaseYears: finalLeaseYears,
        shgb,
        pbg,
        slf,
        landLeaseEndDate,
        legalCompanyName,
        agentCommission: finalAgentCommission,
        unitsCount: unitsCount ? parseInt(unitsCount) : null,
        smartHome,
        jacuzzi,
        terrace,
        rooftop,
        balcony,
        bbq,
        furniture,
        washingMachine
      };

      await updateDoc(doc(db, "properties", id), updatedData);

      const updatedImagesState = finalUrls.map((url) => ({
        id: crypto.randomUUID(),
        url,
        file: null
      }));
      setImages(updatedImagesState);

      showSuccess("Объект обновлён!");
    } catch (error) {
      console.error("Ошибка обновления объекта:", error);
      showError("Ошибка при обновлении объекта!");
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление объекта
  const handleDelete = async () => {
    if (window.confirm("Вы действительно хотите удалить этот объект?")) {
      try {
        await deleteDoc(doc(db, "properties", id));
        showSuccess("Объект удалён!");
        navigate("/property/list");
      } catch (error) {
        console.error("Ошибка удаления объекта:", error);
        showError("Ошибка при удалении объекта");
      }
    }
  };

  // Перемещение изображений
  const moveImage = (dragIndex, hoverIndex) => {
    const dragItem = images[dragIndex];
    setImages(prev => {
      const newImages = [...prev];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, dragItem);
      return newImages;
    });
  };

  // Удаление изображения
  const handleRemoveImage = async (index) => {
    const removed = images[index];
    console.log("Удаляем изображение с URL:", removed.url);
    
    // Обновляем локальное состояние
    setImages(prev => prev.filter((_, idx) => idx !== index));
    
    // Если это старое фото (file === null) и URL не локальный blob, удаляем его физически из Storage
    if (!removed.file && !removed.url.startsWith("blob:")) {
      try {
        await deleteFileFromFirebaseStorage(removed.url);
        console.log("Файл удалён физически из Storage");
      } catch (error) {
        console.error("Ошибка удаления файла из Firebase Storage:", error);
      }
    } else {
      console.log("Локальный blob URL — физическое удаление не требуется");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-${isMobile ? '4' : '6'} px-4 max-w-5xl`}>
      <Card>
        <CardHeader>
          <CardTitle className={`text-${isMobile ? 'xl' : '2xl'} font-bold flex ${isMobile ? 'flex-col space-y-2' : 'items-center'} gap-2`}>
            Редактировать объект
            <Badge variant="secondary" className="text-sm font-normal">
              ID: {id}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <div className="space-y-2">
                  <Label htmlFor="price">Цена (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

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
                      <SelectItem value="Коммерческая недвижимость">Коммерческая недвижимость</SelectItem>
                      <SelectItem value="Апарт-вилла">Апарт-вилла</SelectItem>
                      <SelectItem value="Таунхаус">Таунхаус</SelectItem>
                      <SelectItem value="Земельный участок">Земельный участок</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coordinates">Координаты (шир, долг)</Label>
                  <Input
                    id="coordinates"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="district">Район</Label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger id="district">
                      <SelectValue placeholder="Выберите район" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Амед", "Берава", "Будук", "Джимбаран", "Кута", "Кутух", "Кинтамани", "Ловина", "Нуану",
                        "Нуса Дуа", "Пандава", "Переренан", "Санур", "Семиньяк", "Убуд",
                        "Улувату", "Умалас", "Унгасан", "Чангу", "Чемаги",
                        "Гили Траванган", "Ломбок"
                      ].map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="developer">Застройщик</Label>
                  <Input
                    id="developer"
                    value={developer}
                    onChange={(e) => setDeveloper(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyName">Название объекта</Label>
                  <Input
                    id="propertyName"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complex">Комплекс</Label>
                  <Input
                    id="complex"
                    value={complex}
                    onChange={(e) => setComplex(e.target.value)}
                  />
                </div>

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
                      <SelectItem value="Отель">Отель</SelectItem>
                      <SelectItem value="Резорт">Резорт</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Спальни</Label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger id="bedrooms">
                      <SelectValue placeholder="Выберите количество спален" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Студия">Студия</SelectItem>
                      {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Площадь (м²)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={area}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className={areaError ? "border-red-500" : ""}
                  />
                  {areaError && (
                    <p className="text-sm text-red-500">{areaError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitsCount">Количество юнитов</Label>
                  <Input
                    id="unitsCount"
                    type="number"
                    min="1"
                    value={unitsCount}
                    onChange={(e) => setUnitsCount(e.target.value)}
                    placeholder="Введите количество юнитов"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Провинция</Label>
                  <Input
                    id="province"
                    value={province}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Город</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Выберите город" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Kab. Jembrana", "Kab. Tabanan", "Kab. Badung",
                        "Kab. Gianyar", "Kab. Klungkung", "Kab. Bangli",
                        "Kab. Karangasem", "Kab. Buleleng", "Kota Denpasar"
                      ].map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rdtr">RDTR</Label>
                  <Select value={rdtr} onValueChange={setRdtr}>
                    <SelectTrigger id="rdtr">
                      <SelectValue placeholder="Выберите RDTR" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "RDTR Kecamatan Ubud", "RDTR Kuta",
                        "RDTR Kecamatan Kuta Utara", "RDTR Kuta Selatan",
                        "RDTR Mengwi", "RDTR Kecamatan Abiansemal",
                        "RDTR Wilayah Perencanaan Pentang", "RDTR Wilayah Perencanaan Geopark Batur", "RDTR Kecamatan Sukawati",
                        "RDTR Kecamatan Payangan", "RDTR Kecamatan Tegallalang"
                      ].map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managementCompany">Управляющая компания</Label>
                  <Input
                    id="managementCompany"
                    value={managementCompany}
                    onChange={(e) => setManagementCompany(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownershipForm">Форма собственности</Label>
                  <Select value={ownershipForm} onValueChange={setOwnershipForm}>
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
                      placeholder="Например: 30, 30+20"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="landStatus">Статус земли</Label>
                  <Select value={landStatus} onValueChange={setLandStatus}>
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

                <div className="space-y-2">
                  <Label htmlFor="completionDate">Дата завершения (месяц/год)</Label>
                  <Input
                    id="completionDate"
                    type="month"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pool">Бассейн</Label>
                  <Select value={pool} onValueChange={setPool}>
                    <SelectTrigger id="pool">
                      <SelectValue placeholder="Выберите тип бассейна" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Нет">Нет</SelectItem>
                      <SelectItem value="Частный">Частный</SelectItem>
                      <SelectItem value="Общий">Общий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <div className="space-y-2">
                  <Label htmlFor="shgb">Сертификат права на землю (SHGB)</Label>
                  <Input
                    id="shgb"
                    value={shgb}
                    onChange={(e) => setShgb(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landLeaseEndDate">Дата окончания аренды земли</Label>
                  <Input
                    id="landLeaseEndDate"
                    type="date"
                    value={landLeaseEndDate}
                    onChange={(e) => setLandLeaseEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pbg">Разрешение на строительство (PBG)</Label>
                  <Input
                    id="pbg"
                    value={pbg}
                    onChange={(e) => setPbg(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slf">Сертификат готовности здания (SLF)</Label>
                  <Input
                    id="slf"
                    value={slf}
                    onChange={(e) => setSlf(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalCompanyName">Юридическое название компании</Label>
                  <Input
                    id="legalCompanyName"
                    value={legalCompanyName}
                    onChange={(e) => setLegalCompanyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentCommission">Агентское вознаграждение</Label>
                  <Select value={agentCommission} onValueChange={setAgentCommission}>
                    <SelectTrigger id="agentCommission">
                      <SelectValue placeholder="Выберите размер вознаграждения" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentCommissionOptions.map((val) => (
                        <SelectItem key={val} value={val}>{val}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Секция дополнительных опций */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">{t.propertyDetail.additionalOptions}</Label>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smartHome"
                      checked={smartHome}
                      onChange={(e) => setSmartHome(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="smartHome" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.smartHome}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="jacuzzi"
                      checked={jacuzzi}
                      onChange={(e) => setJacuzzi(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="jacuzzi" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.jacuzzi}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terrace"
                      checked={terrace}
                      onChange={(e) => setTerrace(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="terrace" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.terrace}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rooftop"
                      checked={rooftop}
                      onChange={(e) => setRooftop(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="rooftop" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.rooftop}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="balcony"
                      checked={balcony}
                      onChange={(e) => setBalcony(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="balcony" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.balcony}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="bbq"
                      checked={bbq}
                      onChange={(e) => setBbq(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="bbq" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.bbq}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="furniture"
                      checked={furniture}
                      onChange={(e) => setFurniture(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="furniture" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.furniture}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="washingMachine"
                      checked={washingMachine}
                      onChange={(e) => setWashingMachine(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="washingMachine" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.propertyDetail.washingMachine}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Фотографии</Label>
                <DndProvider backend={HTML5Backend}>
                  <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-4`}>
                    {images.map((item, idx) => (
                      <DraggablePreviewItem
                        key={item.id}
                        id={item.id}
                        index={idx}
                        url={item.url}
                        onRemove={() => handleRemoveImage(idx)}
                        moveImage={moveImage}
                      />
                    ))}
                  </div>
                </DndProvider>

                <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center'} gap-4`}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={isUploading}
                    className={`flex items-center gap-2 ${isMobile ? 'w-full h-12' : ''}`}
                  >
                    <Upload className="w-4 h-4" />
                    Загрузить фото / PDF
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Загрузка...
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'} pt-6 border-t`}>
                {role === 'admin' && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    className={`flex items-center gap-2 ${isMobile ? 'w-full h-12' : ''}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить объект
                  </Button>
                )}

                <div className={`flex items-center gap-4 ${isMobile ? 'w-full' : ''}`}>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className={`flex items-center gap-2 ${isMobile ? 'w-full h-12' : ''}`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Сохранить
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EditProperty;