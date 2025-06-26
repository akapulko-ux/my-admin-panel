import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc
} from "firebase/firestore";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { showError, showSuccess, showInfo } from '../utils/notifications';

function ListComplexes() {
  const [complexes, setComplexes] = useState([]);
  const [filteredComplexes, setFilteredComplexes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Поля фильтра (соответствуют EditComplex) ---
  const [filterNumber, setFilterNumber] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterCoordinates, setFilterCoordinates] = useState("");
  const [filterPriceFrom, setFilterPriceFrom] = useState("");
  const [filterAreaRange, setFilterAreaRange] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRdtr, setFilterRdtr] = useState("");
  const [filterManagementCompany, setFilterManagementCompany] = useState("");
  const [filterOwnershipForm, setFilterOwnershipForm] = useState("");
  const [filterLandStatus, setFilterLandStatus] = useState("");
  const [filterCompletionDate, setFilterCompletionDate] = useState("");
  const [filterVideoLink, setFilterVideoLink] = useState("");
  const [filterDocsLink, setFilterDocsLink] = useState("");
  const [filterLeaseYears, setFilterLeaseYears] = useState("");
  const [filterShgb, setFilterShgb] = useState("");
  const [filterPbg, setFilterPbg] = useState("");
  const [filterSlf, setFilterSlf] = useState("");
  const [filterLegalCompanyName, setFilterLegalCompanyName] = useState("");

  // --- Поля для массового редактирования (аналогичные EditComplex) ---
  const [massEditNumber, setMassEditNumber] = useState("");
  const [massEditName, setMassEditName] = useState("");
  const [massEditDeveloper, setMassEditDeveloper] = useState("");
  const [massEditDistrict, setMassEditDistrict] = useState("");
  const [massEditCoordinates, setMassEditCoordinates] = useState("");
  const [massEditPriceFrom, setMassEditPriceFrom] = useState("");
  const [massEditAreaRange, setMassEditAreaRange] = useState("");
  const [massEditDescription, setMassEditDescription] = useState("");
  const [massEditProvince, setMassEditProvince] = useState("");
  const [massEditCity, setMassEditCity] = useState("");
  const [massEditRdtr, setMassEditRdtr] = useState("");
  const [massEditManagementCompany, setMassEditManagementCompany] = useState("");
  const [massEditOwnershipForm, setMassEditOwnershipForm] = useState("");
  const [massEditLandStatus, setMassEditLandStatus] = useState("");
  const [massEditCompletionDate, setMassEditCompletionDate] = useState("");
  const [massEditVideoLink, setMassEditVideoLink] = useState("");
  const [massEditDocsLink, setMassEditDocsLink] = useState("");
  const [massEditLeaseYears, setMassEditLeaseYears] = useState("");
  const [massEditShgb, setMassEditShgb] = useState("");
  const [massEditPbg, setMassEditPbg] = useState("");
  const [massEditSlf, setMassEditSlf] = useState("");
  const [massEditLegalCompanyName, setMassEditLegalCompanyName] = useState("");
  // [NEW] Массовое редактирование «Вознаграждение»
  const [massEditCommission, setMassEditCommission] = useState("");
  // Добавляем недостающий state для massEditPool
  const [massEditPool, setMassEditPool] = useState("");

  // --- Новые состояния для скачивания фотографий ---
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedImages, setDownloadedImages] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  // Функция загрузки комплексов
  const fetchComplexes = async () => {
    try {
      const colRef = collection(db, "complexes");
      const snapshot = await getDocs(colRef);
      let data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Сортируем по номеру (parseInt)
      data.sort((a, b) => {
        const numA = parseInt(a.number, 10) || 0;
        const numB = parseInt(b.number, 10) || 0;
        return numA - numB;
      });

      setComplexes(data);
      setFilteredComplexes(data); // изначально без фильтра
    } catch (error) {
      console.error("Ошибка загрузки комплексов:", error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании
  useEffect(() => {
    fetchComplexes();
  }, []);

  // --- Функция фильтрации ---
  const handleFilter = () => {
    let result = [...complexes];

    if (filterNumber.trim() !== "") {
      result = result.filter((c) =>
        c.number?.toLowerCase().includes(filterNumber.toLowerCase())
      );
    }
    if (filterName.trim() !== "") {
      result = result.filter((c) =>
        c.name?.toLowerCase().includes(filterName.toLowerCase())
      );
    }
    if (filterDeveloper.trim() !== "") {
      result = result.filter((c) =>
        c.developer?.toLowerCase().includes(filterDeveloper.toLowerCase())
      );
    }
    if (filterDistrict.trim() !== "") {
      result = result.filter((c) =>
        c.district?.toLowerCase().includes(filterDistrict.toLowerCase())
      );
    }
    if (filterCoordinates.trim() !== "") {
      result = result.filter((c) =>
        c.coordinates?.toLowerCase().includes(filterCoordinates.toLowerCase())
      );
    }
    if (filterPriceFrom.trim() !== "") {
      result = result.filter((c) =>
        String(c.priceFrom ?? "").includes(filterPriceFrom)
      );
    }
    if (filterAreaRange.trim() !== "") {
      result = result.filter((c) =>
        c.areaRange?.toLowerCase().includes(filterAreaRange.toLowerCase())
      );
    }
    if (filterDescription.trim() !== "") {
      result = result.filter((c) =>
        c.description?.toLowerCase().includes(filterDescription.toLowerCase())
      );
    }
    if (filterProvince.trim() !== "") {
      result = result.filter((c) =>
        c.province?.toLowerCase().includes(filterProvince.toLowerCase())
      );
    }
    if (filterCity.trim() !== "") {
      result = result.filter((c) =>
        c.city?.toLowerCase().includes(filterCity.toLowerCase())
      );
    }
    if (filterRdtr.trim() !== "") {
      result = result.filter((c) =>
        c.rdtr?.toLowerCase().includes(filterRdtr.toLowerCase())
      );
    }
    if (filterManagementCompany.trim() !== "") {
      result = result.filter((c) =>
        c.managementCompany
          ?.toLowerCase()
          .includes(filterManagementCompany.toLowerCase())
      );
    }
    if (filterOwnershipForm.trim() !== "") {
      result = result.filter((c) =>
        c.ownershipForm?.toLowerCase().includes(filterOwnershipForm.toLowerCase())
      );
    }
    if (filterLandStatus.trim() !== "") {
      result = result.filter((c) =>
        c.landStatus?.toLowerCase().includes(filterLandStatus.toLowerCase())
      );
    }
    if (filterCompletionDate.trim() !== "") {
      result = result.filter((c) =>
        String(c.completionDate ?? "").includes(filterCompletionDate)
      );
    }
    if (filterVideoLink.trim() !== "") {
      result = result.filter((c) =>
        c.videoLink?.toLowerCase().includes(filterVideoLink.toLowerCase())
      );
    }
    if (filterDocsLink.trim() !== "") {
      result = result.filter((c) =>
        c.docsLink?.toLowerCase().includes(filterDocsLink.toLowerCase())
      );
    }
    if (filterLeaseYears.trim() !== "") {
      result = result.filter((c) =>
        String(c.leaseYears ?? "").includes(filterLeaseYears)
      );
    }
    if (filterShgb.trim() !== "") {
      result = result.filter((c) =>
        c.shgb?.toLowerCase().includes(filterShgb.toLowerCase())
      );
    }
    if (filterPbg.trim() !== "") {
      result = result.filter((c) =>
        c.pbg?.toLowerCase().includes(filterPbg.toLowerCase())
      );
    }
    if (filterSlf.trim() !== "") {
      result = result.filter((c) =>
        c.slf?.toLowerCase().includes(filterSlf.toLowerCase())
      );
    }
    if (filterLegalCompanyName.trim() !== "") {
      result = result.filter((c) =>
        c.legalCompanyName
          ?.toLowerCase()
          .includes(filterLegalCompanyName.toLowerCase())
      );
    }

    setFilteredComplexes(result);
  };

  // Функция «Дублировать»
  const handleDuplicate = async (docId) => {
    try {
      const ref = doc(db, "complexes", docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        showError("Документ не найден");
        return;
      }
      const data = snap.data();

      const { /* createdAt, */ ...rest } = data;
      const newData = {
        ...rest,
      };

      await addDoc(collection(db, "complexes"), newData);
      showSuccess("Дубликат создан!");
      fetchComplexes();
    } catch (error) {
      console.error("Ошибка при дублировании комплекса:", error);
    }
  };

  // --- Логика массового редактирования (для ВСЕХ полей) ---
  const handleMassEdit = async () => {
    if (
      !window.confirm(
        "Вы действительно хотите массово изменить все отфильтрованные комплексы?"
      )
    ) {
      return;
    }

    try {
      for (let item of filteredComplexes) {
        const ref = doc(db, "complexes", item.id);

        const newData = {};

        if (massEditNumber.trim() !== "") {
          newData.number = massEditNumber;
        }
        if (massEditName.trim() !== "") {
          newData.name = massEditName;
        }
        if (massEditDeveloper.trim() !== "") {
          newData.developer = massEditDeveloper;
        }
        if (massEditDistrict.trim() !== "") {
          newData.district = massEditDistrict;
        }
        if (massEditCoordinates.trim() !== "") {
          newData.coordinates = massEditCoordinates;
        }
        if (massEditPriceFrom.trim() !== "") {
          newData.priceFrom = parseFloat(massEditPriceFrom) || 0;
        }
        if (massEditAreaRange.trim() !== "") {
          newData.areaRange = massEditAreaRange;
        }
        if (massEditDescription.trim() !== "") {
          newData.description = massEditDescription;
        }
        if (massEditProvince.trim() !== "") {
          newData.province = massEditProvince;
        }
        if (massEditCity.trim() !== "") {
          newData.city = massEditCity;
        }
        if (massEditRdtr.trim() !== "") {
          newData.rdtr = massEditRdtr;
        }
        if (massEditManagementCompany.trim() !== "") {
          newData.managementCompany = massEditManagementCompany;
        }
        if (massEditOwnershipForm.trim() !== "") {
          newData.ownershipForm = massEditOwnershipForm;
        }
        if (massEditLandStatus.trim() !== "") {
          newData.landStatus = massEditLandStatus;
        }
        if (massEditCompletionDate.trim() !== "") {
          newData.completionDate = massEditCompletionDate;
        }
        if (massEditVideoLink.trim() !== "") {
          newData.videoLink = massEditVideoLink;
        }
        if (massEditDocsLink.trim() !== "") {
          newData.docsLink = massEditDocsLink;
        }
        if (massEditLeaseYears.trim() !== "") {
          newData.leaseYears = massEditLeaseYears;
        }
        if (massEditShgb.trim() !== "") {
          newData.shgb = massEditShgb;
        }
        if (massEditPbg.trim() !== "") {
          newData.pbg = massEditPbg;
        }
        if (massEditSlf.trim() !== "") {
          newData.slf = massEditSlf;
        }
        if (massEditLegalCompanyName.trim() !== "") {
          newData.legalCompanyName = massEditLegalCompanyName;
        }
        // [NEW] Массовое редактирование commission
        if (massEditCommission.trim() !== "") {
          newData.commission = parseFloat(massEditCommission) || 0;
        }
        // Добавляем massEditPool, если задан
        if (massEditPool.trim() !== "") {
          newData.pool = massEditPool;
        }

        if (Object.keys(newData).length > 0) {
          await updateDoc(ref, newData);
        }
      }

      showSuccess("Массовое редактирование выполнено!");
      fetchComplexes();
    } catch (err) {
      console.error("Ошибка массового редактирования:", err);
      showError("Ошибка: " + err.message);
    }
  };

  // --- Утилиты для скачивания фотографий ---
  const sanitizeFolderName = (name) => {
    return name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "Complex";
  };

  const getExtensionFromBlob = (blob) => {
    const type = blob.type;
    if (type.includes("jpeg")) return "jpg";
    if (type.includes("png")) return "png";
    if (type.includes("gif")) return "gif";
    return "jpg"; // fallback
  };

  // --- Функция для скачивания всех фотографий ---
  const handleDownloadAllPhotos = async () => {
    setDownloading(true);
    setProgress(0);
    setDownloadedImages(0);
    let total = 0;
    // Подсчитываем общее количество изображений во всех комплексах
    complexes.forEach((complex) => {
      if (complex.images && Array.isArray(complex.images)) {
        total += complex.images.length;
      }
    });
    setTotalImages(total);

    const zip = new JSZip();
    let downloadedCount = 0;

    // Итерация по каждому комплексу
    for (const complex of complexes) {
      const folderName = sanitizeFolderName(complex.name || "БезНазвание");
      const folder = zip.folder(folderName);
      if (complex.images && Array.isArray(complex.images)) {
        for (const [index, imageUrl] of complex.images.entries()) {
          try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
              console.error(`Ошибка загрузки изображения ${imageUrl}: ${response.statusText}`);
              continue;
            }
            const blob = await response.blob();
            const ext = getExtensionFromBlob(blob);
            const fileName = `image_${index + 1}.${ext}`;
            folder.file(fileName, blob);
          } catch (err) {
            console.error("Ошибка при скачивании изображения:", err);
          }
          downloadedCount++;
          setDownloadedImages(downloadedCount);
          setProgress(Math.round((downloadedCount / total) * 100));
        }
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
      setProgress(Math.round(metadata.percent));
    });
    saveAs(zipBlob, "complexes_photos.zip");
    setDownloading(false);
  };

  if (loading) {
    return <Typography>Загрузка комплексов...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Комплексов
      </Typography>

      {/* --- Новая кнопка для скачивания фотографий --- */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleDownloadAllPhotos}
          disabled={downloading}
        >
          Скачать все фотографии
        </Button>
      </Box>

      {/* Прогресс-бар при скачивании */}
      {downloading && (
        <Box sx={{ mb: 2 }}>
          <Typography>
            Загружено {downloadedImages} из {totalImages} изображений ({progress}%)
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {/* --- Блок ФИЛЬТРА по всем полям (EditComplex) --- */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Фильтр по всем полям
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Развернуть / Свернуть фильтр</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <TextField
                label="Номер (number)"
                size="small"
                value={filterNumber}
                onChange={(e) => setFilterNumber(e.target.value)}
              />
              <TextField
                label="Название (name)"
                size="small"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <TextField
                label="Застройщик (developer)"
                size="small"
                value={filterDeveloper}
                onChange={(e) => setFilterDeveloper(e.target.value)}
              />
              <TextField
                label="Район (district)"
                size="small"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
              />
              <TextField
                label="Координаты (coordinates)"
                size="small"
                value={filterCoordinates}
                onChange={(e) => setFilterCoordinates(e.target.value)}
              />
              <TextField
                label="Цена от (priceFrom)"
                size="small"
                value={filterPriceFrom}
                onChange={(e) => setFilterPriceFrom(e.target.value)}
              />
              <TextField
                label="Диапазон площади (areaRange)"
                size="small"
                value={filterAreaRange}
                onChange={(e) => setFilterAreaRange(e.target.value)}
              />
              <TextField
                label="Описание (description)"
                size="small"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
              />
              <TextField
                label="Провинция (province)"
                size="small"
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
              />
              <TextField
                label="Город (city)"
                size="small"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
              <TextField
                label="RDTR"
                size="small"
                value={filterRdtr}
                onChange={(e) => setFilterRdtr(e.target.value)}
              />
              <TextField
                label="Упр. компания (managementCompany)"
                size="small"
                value={filterManagementCompany}
                onChange={(e) => setFilterManagementCompany(e.target.value)}
              />
              <TextField
                label="Форма собств. (ownershipForm)"
                size="small"
                value={filterOwnershipForm}
                onChange={(e) => setFilterOwnershipForm(e.target.value)}
              />
              <TextField
                label="Статус земли (landStatus)"
                size="small"
                value={filterLandStatus}
                onChange={(e) => setFilterLandStatus(e.target.value)}
              />
              <TextField
                label="Дата заверш. (completionDate)"
                size="small"
                value={filterCompletionDate}
                onChange={(e) => setFilterCompletionDate(e.target.value)}
              />
              <TextField
                label="Ссылка на видео (videoLink)"
                size="small"
                value={filterVideoLink}
                onChange={(e) => setFilterVideoLink(e.target.value)}
              />
              <TextField
                label="Доступные юниты (docsLink)"
                size="small"
                value={filterDocsLink}
                onChange={(e) => setFilterDocsLink(e.target.value)}
              />
              <TextField
                label="Лет (leaseYears)"
                size="small"
                value={filterLeaseYears}
                onChange={(e) => setFilterLeaseYears(e.target.value)}
              />
              <TextField
                label="SHGB"
                size="small"
                value={filterShgb}
                onChange={(e) => setFilterShgb(e.target.value)}
              />
              <TextField
                label="PBG"
                size="small"
                value={filterPbg}
                onChange={(e) => setFilterPbg(e.target.value)}
              />
              <TextField
                label="SLF"
                size="small"
                value={filterSlf}
                onChange={(e) => setFilterSlf(e.target.value)}
              />
              <TextField
                label="Юр. название (legalCompanyName)"
                size="small"
                value={filterLegalCompanyName}
                onChange={(e) => setFilterLegalCompanyName(e.target.value)}
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleFilter}
            >
              Применить фильтр
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* --- Блок для массового редактирования (все поля) --- */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Массовое редактирование (для отфильтрованных комплексов)
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Развернуть / Свернуть массовое редактирование</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <TextField
                label="Номер (number)"
                variant="outlined"
                size="small"
                value={massEditNumber}
                onChange={(e) => setMassEditNumber(e.target.value)}
              />
              <TextField
                label="Название (name)"
                variant="outlined"
                size="small"
                value={massEditName}
                onChange={(e) => setMassEditName(e.target.value)}
              />
              <TextField
                label="Застройщик (developer)"
                variant="outlined"
                size="small"
                value={massEditDeveloper}
                onChange={(e) => setMassEditDeveloper(e.target.value)}
              />
              <TextField
                label="Район (district)"
                variant="outlined"
                size="small"
                value={massEditDistrict}
                onChange={(e) => setMassEditDistrict(e.target.value)}
              />
              <TextField
                label="Координаты (coordinates)"
                variant="outlined"
                size="small"
                value={massEditCoordinates}
                onChange={(e) => setMassEditCoordinates(e.target.value)}
              />
              <TextField
                label="Цена от (priceFrom)"
                variant="outlined"
                size="small"
                value={massEditPriceFrom}
                onChange={(e) => setMassEditPriceFrom(e.target.value)}
              />
              <TextField
                label="Диапазон площади (areaRange)"
                variant="outlined"
                size="small"
                value={massEditAreaRange}
                onChange={(e) => setMassEditAreaRange(e.target.value)}
              />
              <TextField
                label="Описание (description)"
                variant="outlined"
                size="small"
                value={massEditDescription}
                onChange={(e) => setMassEditDescription(e.target.value)}
              />
              <TextField
                label="Провинция (province)"
                variant="outlined"
                size="small"
                value={massEditProvince}
                onChange={(e) => setMassEditProvince(e.target.value)}
              />
              <TextField
                label="Город (city)"
                variant="outlined"
                size="small"
                value={massEditCity}
                onChange={(e) => setMassEditCity(e.target.value)}
              />
              <TextField
                label="RDTR"
                variant="outlined"
                size="small"
                value={massEditRdtr}
                onChange={(e) => setMassEditRdtr(e.target.value)}
              />
              <TextField
                label="Упр. компания (managementCompany)"
                variant="outlined"
                size="small"
                value={massEditManagementCompany}
                onChange={(e) => setMassEditManagementCompany(e.target.value)}
              />
              <TextField
                label="Форма собств. (ownershipForm)"
                variant="outlined"
                size="small"
                value={massEditOwnershipForm}
                onChange={(e) => setMassEditOwnershipForm(e.target.value)}
              />
              <TextField
                label="Статус земли (landStatus)"
                variant="outlined"
                size="small"
                value={massEditLandStatus}
                onChange={(e) => setMassEditLandStatus(e.target.value)}
              />
              <TextField
                label="Бассейн (pool)"
                variant="outlined"
                size="small"
                value={massEditPool}
                onChange={(e) => setMassEditPool(e.target.value)}
              />
              <TextField
                label="Дата заверш. (completionDate)"
                variant="outlined"
                size="small"
                value={massEditCompletionDate}
                onChange={(e) => setMassEditCompletionDate(e.target.value)}
              />
              <TextField
                label="Ссылка на видео (videoLink)"
                variant="outlined"
                size="small"
                value={massEditVideoLink}
                onChange={(e) => setMassEditVideoLink(e.target.value)}
              />
              <TextField
                label="Доступные юниты (docsLink)"
                variant="outlined"
                size="small"
                value={massEditDocsLink}
                onChange={(e) => setMassEditDocsLink(e.target.value)}
              />
              <TextField
                label="Лет (leaseYears)"
                variant="outlined"
                size="small"
                value={massEditLeaseYears}
                onChange={(e) => setMassEditLeaseYears(e.target.value)}
              />
              <TextField
                label="SHGB"
                variant="outlined"
                size="small"
                value={massEditShgb}
                onChange={(e) => setMassEditShgb(e.target.value)}
              />
              <TextField
                label="PBG"
                variant="outlined"
                size="small"
                value={massEditPbg}
                onChange={(e) => setMassEditPbg(e.target.value)}
              />
              <TextField
                label="SLF"
                variant="outlined"
                size="small"
                value={massEditSlf}
                onChange={(e) => setMassEditSlf(e.target.value)}
              />
              <TextField
                label="Юр. название (legalCompanyName)"
                variant="outlined"
                size="small"
                value={massEditLegalCompanyName}
                onChange={(e) => setMassEditLegalCompanyName(e.target.value)}
              />
              {/* [NEW] Массовое редактирование «Вознаграждение» */}
              <TextField
                label="Вознаграждение (commission)"
                variant="outlined"
                size="small"
                value={massEditCommission}
                onChange={(e) => setMassEditCommission(e.target.value)}
              />
            </Box>

            <Button variant="contained" color="warning" onClick={handleMassEdit}>
              Массово изменить
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* --- Список комплексов (после фильтра) --- */}
      <Grid container spacing={2}>
        {filteredComplexes.map((complex) => (
          <Grid item xs={12} sm={6} md={4} key={complex.id}>
            <Card variant="outlined">
              {complex.images && complex.images.length > 0 && (
                <CardMedia
                  component="img"
                  height="140"
                  image={complex.images[0]}
                  alt="Complex Photo"
                />
              )}
              <CardContent>
                <Typography variant="h6">{complex.name}</Typography>
                <Typography variant="body2">
                  Номер: {complex.number}
                </Typography>
                <Typography variant="body2">
                  Застройщик: {complex.developer}
                </Typography>
                <Typography variant="body2">
                  Район: {complex.district}
                </Typography>
                {/* ВАЖНО: здесь вместо PriceFrom -> "Цена от ... $" */}
                <Typography variant="body2">
                  Цена от: {complex.priceFrom} $
                </Typography>

                {/* Кнопка «Редактировать» */}
                <Button
                  variant="contained"
                  component={Link}
                  to={`/complex/edit/${complex.id}`}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Редактировать
                </Button>

                {/* Кнопка «Дублировать» */}
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ mt: 1 }}
                  onClick={() => handleDuplicate(complex.id)}
                >
                  Дублировать
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ListComplexes;