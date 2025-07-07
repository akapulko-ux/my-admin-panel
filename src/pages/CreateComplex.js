import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
// Заменяем импорт uploadToCloudinary на загрузку в Firebase Storage с указанием папки
import { uploadToFirebaseStorageInFolder } from "../utils/firebaseStorage";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";
import { getDistanceToNearestBeach } from "../utils/beachDistance";

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
import { showSuccess } from '../utils/notifications';
import { Building2, Upload, Save, Loader2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CustomSelect } from "../components/ui/custom-select";
import { Textarea } from "../components/ui/textarea";

function CreateComplex() {
  const navigate = useNavigate();
  
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

  // ----- Поля формы -----
  const [complexNumber, setComplexNumber] = useState("");

  // "Название" (только заглавные английские буквы + пробелы)
  const [name, setName] = useState("");
  const handleNameChange = (e) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z ]/g, "");
    setName(input);
  };

  // "Застройщик" (только заглавные английские буквы + пробелы, обязательно)
  const [developer, setDeveloper] = useState("");
  const handleDeveloperChange = (e) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z ]/g, "");
    setDeveloper(input);
  };

  // Обязательные поля: район, координаты, цена от, диапазон площади
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");

  // Поле «Вознаграждение» (от 1 до 10, шаг 0.5)
  const [commission, setCommission] = useState("1.0");

  // Поле "ROI" (ссылка на гугл-таблицу)
  const [roi, setRoi] = useState("");

  // [NEW] Поле "3D Тур" (ссылка на страницу с 3D туром)
  const [threeDTour, setThreeDTour] = useState("");

  // Провинция зафиксирована (Bali)
  const province = "Bali";

  // Поля Select для города и RDTR
  const [city, setCity] = useState("Kab. Badung");
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");

  // Поля о форме собственности, статусе земли и т.д.
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [leaseYears, setLeaseYears] = useState("");
  const [docsLink, setDocsLink] = useState("");

  // Новые поля: SHGB, PBG, SLF
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // Поле «Юридическое название компании»
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // Массив для предпросмотра (Drag & Drop)
  const [previews, setPreviews] = useState([]);

  // Состояние загрузки (для спиннера сохранения)
  const [isLoading, setIsLoading] = useState(false);

  // Состояние для спиннера на кнопке «Выбрать фото / PDF»
  const [isUploading, setIsUploading] = useState(false);

  // Обработчик выбора файлов + сжатие + PDF
  const handleFileChange = async (e) => {
    if (!e.target.files) return;

    setIsUploading(true);
    const selectedFiles = Array.from(e.target.files);

    const compressionOptions = {
      maxSizeMB: 10,
      useWebWorker: true
    };

    const newPreviews = [];
    try {
      for (let file of selectedFiles) {
        if (file.type === "application/pdf") {
          // Если PDF — конвертируем в картинки
          const pageBlobs = await convertPdfToImages(file);
          for (let blob of pageBlobs) {
            const compressedFile = await imageCompression(blob, compressionOptions);
            newPreviews.push({
              id: crypto.randomUUID(),
              file: compressedFile,
              url: URL.createObjectURL(compressedFile)
            });
          }
        } else {
          // Обычный файл (jpg/png и т.д.)
          const compressedFile = await imageCompression(file, compressionOptions);
          newPreviews.push({
            id: crypto.randomUUID(),
            file: compressedFile,
            url: URL.createObjectURL(compressedFile)
          });
        }
      }
    } catch (err) {
      console.error("Ошибка сжатия или обработки файла:", err);
    }

    setPreviews((prev) => [...prev, ...newPreviews]);
    setIsUploading(false);
  };

  // Удалить одно фото из предпросмотра
  const handleRemovePreview = (id) => {
    setPreviews((prev) => prev.filter((item) => item.id !== id));
  };

  // Перемещение фото (Drag & Drop)
  const moveItem = (dragIndex, hoverIndex) => {
    setPreviews((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, draggedItem);
      return updated;
    });
  };

  // Сабмит формы (создание комплекса)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1) Загружаем фото в Firebase Storage в папку "complexes"
      const uploadedUrls = [];
      for (let item of previews) {
        // Используем функцию uploadToFirebaseStorageInFolder с указанием папки "complexes"
        const secureUrl = await uploadToFirebaseStorageInFolder(item.file, "complexes");
        uploadedUrls.push(secureUrl);
      }

      // 2) Вычисляем дистанцию и время до ближайшего пляжа (если координаты не пусты)
      let beachDistanceKm = 0;
      let beachTravelTimeMin = 0;
      let nearestBeachName = "";
      if (coordinates.trim()) {
        try {
          const [latStr, lngStr] = coordinates.split(",");
          const latNum = parseFloat(latStr.trim()) || 0;
          const lngNum = parseFloat(lngStr.trim()) || 0;

          const { distanceKm, timeMinutes, beachName } =
            await getDistanceToNearestBeach(latNum, lngNum);

          beachDistanceKm = distanceKm;
          beachTravelTimeMin = timeMinutes;
          nearestBeachName = beachName;
        } catch (calcErr) {
          console.error("Ошибка при вычислении дистанции до пляжа:", calcErr);
        }
      }

      // 3) Собираем объект для Firestore
      const newDoc = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        province, // "Bali"
        city,
        rdtr,
        images: uploadedUrls,
        createdAt: new Date(),

        managementCompany,
        ownershipForm,
        landStatus,
        completionDate,
        videoLink,
        docsLink,

        // Leasehold (лет)
        leaseYears: ownershipForm === "Leashold" ? leaseYears : "",

        // Новые поля (SHGB, PBG, SLF)
        shgb,
        pbg,
        slf,

        // Поле «Юридическое название компании»
        legalCompanyName,

        // Вознаграждение
        commission: parseFloat(commission),

        // Ссылка на ROI (Google Spreadsheet)
        roi,

        // [NEW] Ссылка на 3D Тур
        threeDTour,

        // Результат вычисления расстояния и времени до пляжа
        beachDistanceKm,
        beachTravelTimeMin,
        nearestBeachName
      };

      // 4) Добавляем документ в "complexes"
      await addDoc(collection(db, "complexes"), newDoc);

      // 5) Сбрасываем поля
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

      setManagementCompany("");
      setOwnershipForm("Freehold");
      setLandStatus("Туристическая зона (W)");
      setCompletionDate("");
      setVideoLink("");
      setDocsLink("");
      setLeaseYears("");
      setShgb("");
      setPbg("");
      setSlf("");
      setLegalCompanyName("");
      setCommission("1.0");
      setRoi("");
      setThreeDTour("");

      showSuccess("Комплекс создан!");
    } catch (error) {
      console.error("Ошибка создания комплекса:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`container mx-auto py-${isMobile ? '4' : '8'} px-4`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'} mb-6`}>
        <div className="flex items-center gap-3">
          <Building2 className={`h-${isMobile ? '6' : '8'} w-${isMobile ? '6' : '8'} text-primary`} />
          <div>
            <h1 className={`text-${isMobile ? '2xl' : '3xl'} font-bold`}>
              {isMobile ? 'Добавить комплекс' : 'Добавить комплекс'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Заполните информацию о новом комплексе
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/complex/list")} 
          className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center h-12' : ''}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться к списку
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>
              Заполните основные данные о комплексе
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="complexNumber">Номер комплекса</Label>
                <Input
                  id="complexNumber"
                  value={complexNumber}
                  onChange={(e) => setComplexNumber(e.target.value)}
                  placeholder="Введите номер..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="ТОЛЬКО ЗАГЛАВНЫЕ БУКВЫ"
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="developer">Застройщик *</Label>
                <Input
                  id="developer"
                  value={developer}
                  onChange={handleDeveloperChange}
                  placeholder="ТОЛЬКО ЗАГЛАВНЫЕ БУКВЫ"
                  className="uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">Район *</Label>
                <CustomSelect
                  value={district}
                  onValueChange={setDistrict}
                  placeholder="Выберите район..."
                  required
                  options={[
                    { value: "Амед", label: "Амед" },
                    { value: "Берава", label: "Берава" },
                    { value: "Джимбаран", label: "Джимбаран" },
                    { value: "Кута", label: "Кута" },
                    { value: "Ловина", label: "Ловина" },
                    { value: "Нуану", label: "Нуану" },
                    { value: "Нуса Дуа", label: "Нуса Дуа" },
                    { value: "Переренан", label: "Переренан" },
                    { value: "Санур", label: "Санур" },
                    { value: "Семиньяк", label: "Семиньяк" },
                    { value: "Убуд", label: "Убуд" },
                    { value: "Улувату", label: "Улувату" },
                    { value: "Умалас", label: "Умалас" },
                    { value: "Унгасан", label: "Унгасан" },
                    { value: "Чангу", label: "Чангу" },
                    { value: "Чемаги", label: "Чемаги" },
                    { value: "Гили Траванган", label: "Гили Траванган" },
                    { value: "Ломбок", label: "Ломбок" }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinates">Координаты *</Label>
                <Input
                  id="coordinates"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  placeholder="Формат: lat,lng"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceFrom">Цена от *</Label>
                <Input
                  id="priceFrom"
                  type="number"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  placeholder="Введите цену..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaRange">Диапазон площади *</Label>
                <Input
                  id="areaRange"
                  value={areaRange}
                  onChange={(e) => setAreaRange(e.target.value)}
                  placeholder="Например: 100-150"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Вознаграждение</Label>
                <CustomSelect
                  value={commission}
                  onValueChange={setCommission}
                  placeholder="Выберите процент..."
                  options={Array.from({ length: 19 }, (_, i) => ({
                    value: (i + 2) / 2,
                    label: `${((i + 2) / 2).toFixed(1)}%`
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <CustomSelect
                  value={city}
                  onValueChange={setCity}
                  placeholder="Выберите город..."
                  options={[
                    { value: "Kab. Jembrana", label: "Kab. Jembrana" },
                    { value: "Kab. Tabanan", label: "Kab. Tabanan" },
                    { value: "Kab. Badung", label: "Kab. Badung" },
                    { value: "Kab. Gianyar", label: "Kab. Gianyar" },
                    { value: "Kab. Bangli", label: "Kab. Bangli" },
                    { value: "Kab. Karangasem", label: "Kab. Karangasem" },
                    { value: "Kab. Buleleng", label: "Kab. Buleleng" },
                    { value: "Kota Denpasar", label: "Kota Denpasar" }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rdtr">RDTR</Label>
                <CustomSelect
                  value={rdtr}
                  onValueChange={setRdtr}
                  placeholder="Выберите RDTR..."
                  options={[
                    { value: "RDTR Kecamatan Ubud", label: "RDTR Kecamatan Ubud" },
                    { value: "RDTR Kuta", label: "RDTR Kuta" },
                    { value: "RDTR Kecamatan Kuta Utara", label: "RDTR Kecamatan Kuta Utara" },
                    { value: "RDTR Kuta Selatan", label: "RDTR Кuta Selatan" },
                    { value: "RDTR Mengwi", label: "RDTR Mengwi" },
                    { value: "RDTR Kecamatan Abiansemal", label: "RDTR Kecamatan Abiansemal" },
                    { value: "RDTR Wilayah Перencания Petang", label: "RDTR Wilayah Перencания Petang" },
                    { value: "RDTR Kecamatan Sukawati", label: "RDTR Kecamatan Sukawati" },
                    { value: "RDTR Kecamatan Payangan", label: "RDTR Kecamatan Payangan" },
                    { value: "RDTR Kecamatan Tegallalang", label: "RDTR Kecamatan Tegallalang" }
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание комплекса..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Дополнительная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Дополнительная информация</CardTitle>
            <CardDescription>
              Заполните дополнительные данные о комплексе
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="managementCompany">Управляющая компания</Label>
                <Input
                  id="managementCompany"
                  value={managementCompany}
                  onChange={(e) => setManagementCompany(e.target.value)}
                  placeholder="Название компании..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownershipForm">Форма собственности</Label>
                <CustomSelect
                  value={ownershipForm}
                  onValueChange={setOwnershipForm}
                  placeholder="Выберите форму..."
                  options={[
                    { value: "Freehold", label: "Freehold" },
                    { value: "Leasehold", label: "Leasehold" }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landStatus">Статус земли</Label>
                <CustomSelect
                  id="landStatus"
                  value={landStatus}
                  onValueChange={setLandStatus}
                  placeholder="Выберите статус земли..."
                  options={[
                    { value: "Туристическая зона (W)", label: "Туристическая зона (W)" },
                    { value: "Торговая зона (K)", label: "Торговая зона (K)" },
                    { value: "Смешанная зона (C)", label: "Смешанная зона (C)" },
                    { value: "Жилая зона (R)", label: "Жилая зона (R)" },
                    { value: "Сельхоз зона (P)", label: "Сельхоз зона (P)" },
                    { value: "Заповедная зона (RTH)", label: "Заповедная зона (RTH)" }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completionDate">Дата завершения</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoLink">Ссылка на видео</Label>
                <Input
                  id="videoLink"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="URL видео..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="docsLink">Доступные юниты</Label>
                <Input
                  id="docsLink"
                  value={docsLink}
                  onChange={(e) => setDocsLink(e.target.value)}
                  placeholder="Ссылка на документ..."
                />
              </div>

              {ownershipForm === "Leasehold" && (
                <div className="space-y-2">
                  <Label htmlFor="leaseYears">Срок аренды (лет)</Label>
                  <Input
                    id="leaseYears"
                    type="number"
                    value={leaseYears}
                    onChange={(e) => setLeaseYears(e.target.value)}
                    placeholder="Количество лет..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="shgb">SHGB</Label>
                <Input
                  id="shgb"
                  value={shgb}
                  onChange={(e) => setShgb(e.target.value)}
                  placeholder="SHGB..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pbg">PBG</Label>
                <Input
                  id="pbg"
                  value={pbg}
                  onChange={(e) => setPbg(e.target.value)}
                  placeholder="PBG..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slf">SLF</Label>
                <Input
                  id="slf"
                  value={slf}
                  onChange={(e) => setSlf(e.target.value)}
                  placeholder="SLF..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalCompanyName">Юридическое название</Label>
                <Input
                  id="legalCompanyName"
                  value={legalCompanyName}
                  onChange={(e) => setLegalCompanyName(e.target.value)}
                  placeholder="Название компании..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roi">ROI (Google Spreadsheet)</Label>
                <Input
                  id="roi"
                  value={roi}
                  onChange={(e) => setRoi(e.target.value)}
                  placeholder="Ссылка на таблицу..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threeDTour">3D Тур</Label>
                <Input
                  id="threeDTour"
                  value={threeDTour}
                  onChange={(e) => setThreeDTour(e.target.value)}
                  placeholder="Ссылка на 3D тур..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Фотографии */}
        <Card>
          <CardHeader>
            <CardTitle>Фотографии</CardTitle>
            <CardDescription>
              Загрузите фотографии комплекса (можно выбрать несколько)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <Button
                  type="button"
                  variant="secondary"
                  className={`flex items-center gap-2 ${isMobile ? 'w-full h-12 justify-center' : ''}`}
                  onClick={() => document.getElementById("file-upload").click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? "Загрузка..." : "Выбрать фото / PDF"}
                </Button>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Превью загруженных фото */}
              {previews.length > 0 && (
                <DndProvider backend={HTML5Backend}>
                  <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-4`}>
                    {previews.map((preview, index) => (
                      <DraggablePreviewItem
                        key={preview.id}
                        id={preview.id}
                        url={preview.url}
                        index={index}
                        moveItem={moveItem}
                        onRemove={handleRemovePreview}
                      />
                    ))}
                  </div>
                </DndProvider>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Кнопка сохранения */}
        <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
          <Button
            type="submit"
            className={`flex items-center gap-2 ${isMobile ? 'w-full h-12' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isLoading ? "Сохранение..." : "Сохранить комплекс"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateComplex;