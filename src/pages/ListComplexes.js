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
import { Link } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { showError, showSuccess, showInfo } from '../utils/notifications';
import { Building2, Plus, Download, Filter, Edit, RefreshCw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

function ListComplexes() {
  const [complexes, setComplexes] = useState([]);
  const [filteredComplexes, setFilteredComplexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [massEditExpanded, setMassEditExpanded] = useState(false);

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Список Комплексов</h1>
        <Link to="/complex/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить комплекс
          </Button>
        </Link>
      </div>

      {/* Фильтры */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-lg">Фильтр комплексов</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Настройте критерии поиска</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterExpanded(!filterExpanded)}
              className="flex items-center gap-2"
            >
              {filterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {filterExpanded ? 'Свернуть' : 'Развернуть'}
            </Button>
          </div>
        </CardHeader>
        
        {filterExpanded && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Фильтры */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Номер</label>
                <Input
                  value={filterNumber}
                  onChange={(e) => setFilterNumber(e.target.value)}
                  placeholder="Номер комплекса..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Название комплекса..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Застройщик</label>
                <Input
                  value={filterDeveloper}
                  onChange={(e) => setFilterDeveloper(e.target.value)}
                  placeholder="Застройщик..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Район</label>
                <Input
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  placeholder="Район..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Координаты</label>
                <Input
                  value={filterCoordinates}
                  onChange={(e) => setFilterCoordinates(e.target.value)}
                  placeholder="Координаты..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена от</label>
                <Input
                  value={filterPriceFrom}
                  onChange={(e) => setFilterPriceFrom(e.target.value)}
                  placeholder="Цена от..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Диапазон площади</label>
                <Input
                  value={filterAreaRange}
                  onChange={(e) => setFilterAreaRange(e.target.value)}
                  placeholder="Диапазон площади..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Input
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  placeholder="Описание..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Провинция</label>
                <Input
                  value={filterProvince}
                  onChange={(e) => setFilterProvince(e.target.value)}
                  placeholder="Провинция..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Город</label>
                <Input
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Город..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">RDTR</label>
                <Input
                  value={filterRdtr}
                  onChange={(e) => setFilterRdtr(e.target.value)}
                  placeholder="RDTR..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Упр. компания</label>
                <Input
                  value={filterManagementCompany}
                  onChange={(e) => setFilterManagementCompany(e.target.value)}
                  placeholder="Упр. компания..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Форма собств.</label>
                <Input
                  value={filterOwnershipForm}
                  onChange={(e) => setFilterOwnershipForm(e.target.value)}
                  placeholder="Форма собств...."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Статус земли</label>
                <Input
                  value={filterLandStatus}
                  onChange={(e) => setFilterLandStatus(e.target.value)}
                  placeholder="Статус земли..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата заверш.</label>
                <Input
                  value={filterCompletionDate}
                  onChange={(e) => setFilterCompletionDate(e.target.value)}
                  placeholder="Дата заверш...."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ссылка на видео</label>
                <Input
                  value={filterVideoLink}
                  onChange={(e) => setFilterVideoLink(e.target.value)}
                  placeholder="Ссылка на видео..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Доступные юниты</label>
                <Input
                  value={filterDocsLink}
                  onChange={(e) => setFilterDocsLink(e.target.value)}
                  placeholder="Доступные юниты..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Лет</label>
                <Input
                  value={filterLeaseYears}
                  onChange={(e) => setFilterLeaseYears(e.target.value)}
                  placeholder="Лет..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SHGB</label>
                <Input
                  value={filterShgb}
                  onChange={(e) => setFilterShgb(e.target.value)}
                  placeholder="SHGB..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PBG</label>
                <Input
                  value={filterPbg}
                  onChange={(e) => setFilterPbg(e.target.value)}
                  placeholder="PBG..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SLF</label>
                <Input
                  value={filterSlf}
                  onChange={(e) => setFilterSlf(e.target.value)}
                  placeholder="SLF..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Юр. название</label>
                <Input
                  value={filterLegalCompanyName}
                  onChange={(e) => setFilterLegalCompanyName(e.target.value)}
                  placeholder="Юр. название..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleFilter} className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Применить фильтр
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Сброс всех фильтров
                  setFilterNumber("");
                  setFilterName("");
                  // ... сброс остальных фильтров ...
                  handleFilter();
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Сбросить
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Массовое редактирование */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit className="w-6 h-6 text-orange-600" />
              <div>
                <CardTitle className="text-lg">Массовое редактирование</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Изменить {filteredComplexes.length} отфильтрованных комплексов
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMassEditExpanded(!massEditExpanded)}
              className="flex items-center gap-2"
            >
              {massEditExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {massEditExpanded ? 'Свернуть' : 'Развернуть'}
            </Button>
          </div>
        </CardHeader>
        
        {massEditExpanded && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Поля массового редактирования */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Номер</label>
                <Input
                  value={massEditNumber}
                  onChange={(e) => setMassEditNumber(e.target.value)}
                  placeholder="Новый номер..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={massEditName}
                  onChange={(e) => setMassEditName(e.target.value)}
                  placeholder="Новое название..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Застройщик</label>
                <Input
                  value={massEditDeveloper}
                  onChange={(e) => setMassEditDeveloper(e.target.value)}
                  placeholder="Новый застройщик..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Район</label>
                <Input
                  value={massEditDistrict}
                  onChange={(e) => setMassEditDistrict(e.target.value)}
                  placeholder="Новый район..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Координаты</label>
                <Input
                  value={massEditCoordinates}
                  onChange={(e) => setMassEditCoordinates(e.target.value)}
                  placeholder="Новые координаты..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена от</label>
                <Input
                  value={massEditPriceFrom}
                  onChange={(e) => setMassEditPriceFrom(e.target.value)}
                  placeholder="Новая цена от..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Диапазон площади</label>
                <Input
                  value={massEditAreaRange}
                  onChange={(e) => setMassEditAreaRange(e.target.value)}
                  placeholder="Новый диапазон площади..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Input
                  value={massEditDescription}
                  onChange={(e) => setMassEditDescription(e.target.value)}
                  placeholder="Новое описание..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Провинция</label>
                <Input
                  value={massEditProvince}
                  onChange={(e) => setMassEditProvince(e.target.value)}
                  placeholder="Новая провинция..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Город</label>
                <Input
                  value={massEditCity}
                  onChange={(e) => setMassEditCity(e.target.value)}
                  placeholder="Новый город..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">RDTR</label>
                <Input
                  value={massEditRdtr}
                  onChange={(e) => setMassEditRdtr(e.target.value)}
                  placeholder="Новый RDTR..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Упр. компания</label>
                <Input
                  value={massEditManagementCompany}
                  onChange={(e) => setMassEditManagementCompany(e.target.value)}
                  placeholder="Новая упр. компания..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Форма собств.</label>
                <Input
                  value={massEditOwnershipForm}
                  onChange={(e) => setMassEditOwnershipForm(e.target.value)}
                  placeholder="Новая форма собств...."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Статус земли</label>
                <Input
                  value={massEditLandStatus}
                  onChange={(e) => setMassEditLandStatus(e.target.value)}
                  placeholder="Новый статус земли..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Бассейн</label>
                <Input
                  value={massEditPool}
                  onChange={(e) => setMassEditPool(e.target.value)}
                  placeholder="Новый бассейн..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата заверш.</label>
                <Input
                  value={massEditCompletionDate}
                  onChange={(e) => setMassEditCompletionDate(e.target.value)}
                  placeholder="Новая дата заверш...."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ссылка на видео</label>
                <Input
                  value={massEditVideoLink}
                  onChange={(e) => setMassEditVideoLink(e.target.value)}
                  placeholder="Новая ссылка на видео..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Доступные юниты</label>
                <Input
                  value={massEditDocsLink}
                  onChange={(e) => setMassEditDocsLink(e.target.value)}
                  placeholder="Новые доступные юниты..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Лет</label>
                <Input
                  value={massEditLeaseYears}
                  onChange={(e) => setMassEditLeaseYears(e.target.value)}
                  placeholder="Новые ленты..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SHGB</label>
                <Input
                  value={massEditShgb}
                  onChange={(e) => setMassEditShgb(e.target.value)}
                  placeholder="Новый SHGB..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PBG</label>
                <Input
                  value={massEditPbg}
                  onChange={(e) => setMassEditPbg(e.target.value)}
                  placeholder="Новый PBG..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SLF</label>
                <Input
                  value={massEditSlf}
                  onChange={(e) => setMassEditSlf(e.target.value)}
                  placeholder="Новый SLF..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Юр. название</label>
                <Input
                  value={massEditLegalCompanyName}
                  onChange={(e) => setMassEditLegalCompanyName(e.target.value)}
                  placeholder="Новое юр. название..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Вознаграждение</label>
                <Input
                  value={massEditCommission}
                  onChange={(e) => setMassEditCommission(e.target.value)}
                  placeholder="Новое вознаграждение..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={handleMassEdit}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Массово изменить ({filteredComplexes.length})
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Сброс всех полей массового редактирования
                  setMassEditNumber("");
                  setMassEditName("");
                  // ... сброс остальных полей ...
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Очистить поля
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Прогресс скачивания */}
      {downloading && (
        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-2">
            Загружено {downloadedImages} из {totalImages} изображений ({progress}%)
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Список комплексов */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplexes.map((complex) => (
            <Card key={complex.id} className="overflow-hidden">
              {complex.images && complex.images.length > 0 && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={complex.images[0]}
                    alt={complex.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>
                  {complex.number ? `№${complex.number} - ` : ""}{complex.name || "Без названия"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {complex.developer && (
                    <p className="text-sm text-muted-foreground">
                      Застройщик: {complex.developer}
                    </p>
                  )}
                  {complex.district && (
                    <p className="text-sm text-muted-foreground">
                      Район: {complex.district}
                    </p>
                  )}
                  {complex.priceFrom && (
                    <p className="text-sm font-medium">
                      От ${parseInt(complex.priceFrom).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDuplicate(complex.id)}
                  >
                    Дублировать
                  </Button>
                  <Link to={`/complex/edit/${complex.id}`} className="flex-1">
                    <Button variant="default" className="w-full">
                      Редактировать
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListComplexes;