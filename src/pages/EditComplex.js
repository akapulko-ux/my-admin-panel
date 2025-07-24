// src/pages/EditComplex.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
// Используем функцию загрузки и удаления из Firebase Storage
import { uploadToFirebaseStorageInFolder, deleteFileFromFirebaseStorage } from "../utils/firebaseStorage";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggablePreviewItem from "../components/DraggablePreviewItem";

import imageCompression from "browser-image-compression";
import { convertPdfToImages } from "../utils/pdfUtils";

import {
  Card,
  Button,
  Typography
} from "@mui/material";
import { showSuccess } from '../utils/notifications';
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";

// Импорт компонентов shadcn
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { CustomSelect } from "../components/ui/custom-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

// Иконки
import { ArrowLeft, Loader2, Save, Trash2, Upload } from "lucide-react";

function EditComplex() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Состояния для загрузки
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Основные поля
  const [complexNumber, setComplexNumber] = useState("");
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [description, setDescription] = useState("");

  // Поля "Провинция", "Город", "RDTR"
  const [province, setProvince] = useState("Bali");
  const [city, setCity] = useState("");
  const [rdtr, setRdtr] = useState("");

  // Поля о форме собственности, статусе и т.д.
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [leaseYears, setLeaseYears] = useState("");
  const [docsLink, setDocsLink] = useState("");

  // Обработчик для поля срока аренды (только цифры и знак +)
  const handleLeaseYearsChange = (e) => {
    const input = e.target.value.replace(/[^0-9+]/g, "");
    setLeaseYears(input);
  };

  // Новые поля: SHGB, PBG, SLF
  const [shgb, setShgb] = useState("");
  const [pbg, setPbg] = useState("");
  const [slf, setSlf] = useState("");

  // Поле «Юридическое название компании»
  const [legalCompanyName, setLegalCompanyName] = useState("");

  // [NEW] Поля «ROI» и «3D Тур»
  const [roi, setRoi] = useState("");
  const [threeDTour, setThreeDTour] = useState("");

  // Массив объектов для фото (старые + новые)
  // Каждый элемент: { id, url, file }
  const [images, setImages] = useState([]);

  // Добавляем недостающие состояния для commission
  const [commission, setCommission] = useState("1.0");
  const commissionOptions = [];
  for (let val = 1; val <= 10; val += 0.5) {
    commissionOptions.push(val.toFixed(1));
  }

  // Дополнительные опции
  const [spaSalon, setSpaSalon] = useState(false);
  const [restaurant, setRestaurant] = useState(false);
  const [fitnessGym, setFitnessGym] = useState(false);
  const [playground, setPlayground] = useState(false);

  // Загрузка данных из Firestore
  useEffect(() => {
    async function fetchComplex() {
      try {
        const ref = doc(db, "complexes", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();

          // Заполняем поля
          setComplexNumber(data.number || "");
          setName(data.name || "");
          setDeveloper(data.developer || "");
          setDistrict(data.district || "");
          setCoordinates(data.coordinates || "");
          setDescription(data.description || "");

          setProvince(data.province || "Bali");
          setCity(data.city || "");
          setRdtr(data.rdtr || "");

          setManagementCompany(data.managementCompany || "");
          setOwnershipForm(data.ownershipForm || "Freehold");
          setLandStatus(data.landStatus || "Туристическая зона (W)");
          setCompletionDate(data.completionDate || "");
          setVideoLink(data.videoLink || "");
          setLeaseYears(data.leaseYears || "");
          setDocsLink(data.docsLink || "");

          setShgb(data.shgb || "");
          setPbg(data.pbg || "");
          setSlf(data.slf || "");

          setLegalCompanyName(data.legalCompanyName || "");

          // [NEW] ROI и 3D Тур
          setRoi(data.roi || "");
          setThreeDTour(data.threeDTour || "");

          // Преобразуем массив URL в [{ id, url, file: null }]
          const oldImages = (data.images || []).map((url) => ({
            id: crypto.randomUUID(),
            url,
            file: null
          }));
          setImages(oldImages);

          // Если commission есть, приводим к строке с одним знаком после запятой
          if (data.commission !== undefined) {
            const c = parseFloat(data.commission);
            setCommission(c.toFixed(1));
          }

          // Загружаем дополнительные опции
          setSpaSalon(data.spaSalon || false);
          setRestaurant(data.restaurant || false);
          setFitnessGym(data.fitnessGym || false);
          setPlayground(data.playground || false);
        }
      } catch (error) {
        console.error("Ошибка загрузки комплекса:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchComplex();
  }, [id]);

  // Обработчик выбора новых фото (с учётом сжатия и PDF)
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
          // PDF -> конвертация
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
    }

    setImages((prev) => [...prev, ...newImagesArr]);
    setIsUploading(false);
  };

  // Перестановка (Drag & Drop)
  const moveImage = (dragIndex, hoverIndex) => {
    setImages((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, draggedItem);
      return updated;
    });
  };

  // Функция удаления изображения
  const handleRemoveImage = async (index) => {
    const removed = images[index];
    console.log("Удаляем изображение с URL:", removed.url);
    setImages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
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

  // Функция удаления всех фотографий из Storage
  const deleteAllImagesFromStorage = async () => {
    const deletionPromises = images.map((img) => {
      if (!img.file && !img.url.startsWith("blob:")) {
        return deleteFileFromFirebaseStorage(img.url).catch((error) => {
          console.error("Ошибка удаления файла из Storage:", error);
          return Promise.resolve();
        });
      }
      return Promise.resolve();
    });
    await Promise.all(deletionPromises);
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
          // Новое фото — загружаем в Firebase Storage в папку "complexes"
          const url = await uploadToFirebaseStorageInFolder(item.file, "complexes");
          finalUrls.push(url);
        } else {
          finalUrls.push(item.url);
        }
      }
      const updatedData = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        description,
        province,
        city,
        rdtr,
        images: finalUrls,
        managementCompany,
        ownershipForm,
        landStatus,
        completionDate,
        videoLink,
        docsLink,
        leaseYears: ownershipForm === "Leashold" ? leaseYears : "",
        shgb,
        pbg,
        slf,
        legalCompanyName,
        roi,
        threeDTour,
        commission,
        spaSalon,
        restaurant,
        fitnessGym,
        playground
      };
      await updateDoc(doc(db, "complexes", id), updatedData);
      showSuccess("Комплекс обновлён!");
      // Обновляем состояние images, чтобы для всех файлов file стало null
      setImages(finalUrls.map((url) => ({ id: crypto.randomUUID(), url, file: null })));
    } catch (error) {
      console.error("Ошибка обновления комплекса:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление всего комплекса и всех фотографий
  const handleDelete = async () => {
    if (window.confirm("Вы действительно хотите удалить этот комплекс?")) {
      try {
        // Сначала удаляем физически все файлы из Storage
        await deleteAllImagesFromStorage();
        // Затем удаляем документ из Firestore
        await deleteDoc(doc(db, "complexes", id));
        showSuccess("Комплекс и все фотографии удалены!");
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
    <div className={`container mx-auto p-${isMobile ? '4' : '6'}`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'} mb-6`}>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/complexes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className={`text-${isMobile ? 'xl' : '2xl'} font-bold`}>
            {isMobile ? 'Редактировать комплекс' : 'Редактировать комплекс'}
          </h1>
        </div>
        <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || isSaving}
            className={`${isMobile ? 'flex-1 h-12' : ''}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || isSaving}
            className={`${isMobile ? 'flex-1 h-12' : ''}`}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Основная информация */}
          <Card className="p-6">
            <h2 className={`text-${isMobile ? 'lg' : 'xl'} font-semibold mb-4`}>Основная информация</h2>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="complexNumber">Номер комплекса</Label>
                <Input
                  id="complexNumber"
                  value={complexNumber}
                  onChange={(e) => setComplexNumber(e.target.value)}
                  placeholder="Введите номер комплекса"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название комплекса"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="developer">Застройщик</Label>
                <Input
                  id="developer"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="Введите название застройщика"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Район</Label>
                <CustomSelect
                  id="district"
                  value={district}
                  onValueChange={setDistrict}
                  placeholder="Выберите район..."
                  options={[
                    { value: "Амед", label: "Амед" },
                    { value: "Берава", label: "Берава" },
                    { value: "Будук", label: "Будук" },
                    { value: "Джимбаран", label: "Джимбаран" },
                    { value: "Кута", label: "Кута" },
                    { value: "Кутух", label: "Кутух" },
                    { value: "Кинтамани", label: "Кинтамани" },
                    { value: "Ловина", label: "Ловина" },
                    { value: "Нуану", label: "Нуану" },
                    { value: "Нуса Дуа", label: "Нуса Дуа" },
                    { value: "Пандава", label: "Пандава" },
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
                <Label htmlFor="coordinates">Координаты</Label>
                <Input
                  id="coordinates"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  placeholder="Введите координаты"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Комиссия</Label>
                <CustomSelect
                  id="commission"
                  value={commission}
                  onValueChange={setCommission}
                  options={commissionOptions.map(val => ({
                    label: `${val}%`,
                    value: val
                  }))}
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание комплекса"
                className="min-h-[100px]"
              />
            </div>
          </Card>

          {/* Местоположение */}
          <Card className="p-6">
            <h2 className={`text-${isMobile ? 'lg' : 'xl'} font-semibold mb-4`}>Местоположение</h2>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="province">Провинция</Label>
                <CustomSelect
                  id="province"
                  value={province}
                  onValueChange={setProvince}
                  options={[
                    { label: "Bali", value: "Bali" }
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <CustomSelect
                  id="city"
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
                  id="rdtr"
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
          </Card>

          {/* Юридическая информация */}
          <Card className="p-6">
            <h2 className={`text-${isMobile ? 'lg' : 'xl'} font-semibold mb-4`}>Юридическая информация</h2>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="managementCompany">Управляющая компания</Label>
                <Input
                  id="managementCompany"
                  value={managementCompany}
                  onChange={(e) => setManagementCompany(e.target.value)}
                  placeholder="Введите название управляющей компании"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownershipForm">Форма собственности</Label>
                <CustomSelect
                  id="ownershipForm"
                  value={ownershipForm}
                  onValueChange={setOwnershipForm}
                  options={[
                    { label: "Freehold", value: "Freehold" },
                    { label: "Leasehold", value: "Leasehold" }
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
                  placeholder="Выберите дату завершения"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseYears">Срок аренды (лет)</Label>
                <Input
                  id="leaseYears"
                  value={leaseYears}
                  onChange={handleLeaseYearsChange}
                  placeholder="Например: 30, 25+5, 30+25..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalCompanyName">Юридическое название компании</Label>
                <Input
                  id="legalCompanyName"
                  value={legalCompanyName}
                  onChange={(e) => setLegalCompanyName(e.target.value)}
                  placeholder="Введите юридическое название"
                />
              </div>
            </div>
          </Card>

          {/* Документы и ссылки */}
          <Card className="p-6">
            <h2 className={`text-${isMobile ? 'lg' : 'xl'} font-semibold mb-4`}>Документы и ссылки</h2>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="shgb">SHGB</Label>
                <Input
                  id="shgb"
                  value={shgb}
                  onChange={(e) => setShgb(e.target.value)}
                  placeholder="Введите SHGB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pbg">PBG</Label>
                <Input
                  id="pbg"
                  value={pbg}
                  onChange={(e) => setPbg(e.target.value)}
                  placeholder="Введите PBG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slf">SLF</Label>
                <Input
                  id="slf"
                  value={slf}
                  onChange={(e) => setSlf(e.target.value)}
                  placeholder="Введите SLF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="docsLink">Ссылка на документы</Label>
                <Input
                  id="docsLink"
                  value={docsLink}
                  onChange={(e) => setDocsLink(e.target.value)}
                  placeholder="Введите ссылку на документы"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoLink">Ссылка на видео</Label>
                <Input
                  id="videoLink"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="Введите ссылку на видео"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threeDTour">3D Тур</Label>
                <Input
                  id="threeDTour"
                  value={threeDTour}
                  onChange={(e) => setThreeDTour(e.target.value)}
                  placeholder="Введите ссылку на 3D тур"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roi">ROI</Label>
                <Input
                  id="roi"
                  value={roi}
                  onChange={(e) => setRoi(e.target.value)}
                  placeholder="Введите ROI"
                />
              </div>
            </div>
          </Card>

          {/* Секция дополнительных опций */}
          <Card className="p-6">
            <h2 className={`text-${isMobile ? 'lg' : 'xl'} font-semibold mb-4`}>{t.complexDetail.additionalOptions}</h2>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="spaSalon"
                  checked={spaSalon}
                  onChange={(e) => setSpaSalon(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                                  <Label htmlFor="spaSalon" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.spaSalon}
                  </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="restaurant"
                  checked={restaurant}
                  onChange={(e) => setRestaurant(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                                  <Label htmlFor="restaurant" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.restaurant}
                  </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fitnessGym"
                  checked={fitnessGym}
                  onChange={(e) => setFitnessGym(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                                  <Label htmlFor="fitnessGym" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.fitnessGym}
                  </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="playground"
                  checked={playground}
                  onChange={(e) => setPlayground(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                                  <Label htmlFor="playground" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.complexDetail.playground}
                  </Label>
              </div>
            </div>
          </Card>

          {/* Фотографии */}
          <Card className="p-6">
            <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'} mb-4`}>
              <h2 className={`text-${isMobile ? 'lg' : 'xl'} font-semibold`}>Фотографии</h2>
              <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
                <Input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="images"
                  disabled={isUploading}
                />
                <Label
                  htmlFor="images"
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''} ${isMobile ? 'w-full h-12' : 'h-10'}`}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Загрузить фото
                </Label>
              </div>
            </div>
            
            <DndProvider backend={HTML5Backend}>
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-4`}>
                {images.map((image, index) => (
                  <DraggablePreviewItem
                    key={image.id}
                    id={image.id}
                    index={index}
                    url={image.url}
                    onRemove={() => handleRemoveImage(index)}
                    moveImage={moveImage}
                  />
                ))}
              </div>
            </DndProvider>
          </Card>
        </form>
      )}

      {/* Диалог подтверждения удаления */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" className="hidden">Delete</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить комплекс?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Вы уверены, что хотите удалить этот комплекс? Это действие нельзя отменить.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => document.querySelector('[role="dialog"]')?.close()}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EditComplex;