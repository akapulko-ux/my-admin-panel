// src/pages/ListProperties.js

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp
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
  AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";
// Импорт функции загрузки в Firebase Storage (используем папку "property")
import { uploadToFirebaseStorageInFolder } from "../utils/firebaseStorage";
import { showError, showSuccess } from '../utils/notifications';

function ListProperties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Поля для ФИЛЬТРА (соответствуют EditProperty) ---
  const [filterPrice, setFilterPrice] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCoordinates, setFilterCoordinates] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterBuildingType, setFilterBuildingType] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterOwnershipForm, setFilterOwnershipForm] = useState("");
  const [filterLandStatus, setFilterLandStatus] = useState("");
  const [filterPool, setFilterPool] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState("");
  const [filterComplex, setFilterComplex] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRdtr, setFilterRdtr] = useState("");
  const [filterManagementCompany, setFilterManagementCompany] = useState("");
  const [filterCompletionDate, setFilterCompletionDate] = useState("");
  const [filterLeaseYears, setFilterLeaseYears] = useState("");
  const [filterShgb, setFilterShgb] = useState("");
  const [filterPbg, setFilterPbg] = useState("");
  const [filterSlf, setFilterSlf] = useState("");
  const [filterLegalCompanyName, setFilterLegalCompanyName] = useState("");
  // [NEW] Фильтр по «Вознаграждению»
  const [filterCommission, setFilterCommission] = useState("");

  // --- Поля для МАССОВОГО РЕДАКТИРОВАНИЯ (те же) ---
  const [massEditPrice, setMassEditPrice] = useState("");
  const [massEditType, setMassEditType] = useState("");
  const [massEditCoordinates, setMassEditCoordinates] = useState("");
  const [massEditStatus, setMassEditStatus] = useState("");
  const [massEditDistrict, setMassEditDistrict] = useState("");
  const [massEditBuildingType, setMassEditBuildingType] = useState("");
  const [massEditBedrooms, setMassEditBedrooms] = useState("");
  const [massEditOwnershipForm, setMassEditOwnershipForm] = useState("");
  const [massEditLandStatus, setMassEditLandStatus] = useState("");
  const [massEditPool, setMassEditPool] = useState("");
  const [massEditDescription, setMassEditDescription] = useState("");
  const [massEditDeveloper, setMassEditDeveloper] = useState("");
  const [massEditComplex, setMassEditComplex] = useState("");
  const [massEditArea, setMassEditArea] = useState("");
  const [massEditProvince, setMassEditProvince] = useState("");
  const [massEditCity, setMassEditCity] = useState("");
  const [massEditRdtr, setMassEditRdtr] = useState("");
  const [massEditManagementCompany, setMassEditManagementCompany] = useState("");
  const [massEditCompletionDate, setMassEditCompletionDate] = useState("");
  const [massEditLeaseYears, setMassEditLeaseYears] = useState("");
  const [massEditShgb, setMassEditShgb] = useState("");
  const [massEditPbg, setMassEditPbg] = useState("");
  const [massEditSlf, setMassEditSlf] = useState("");
  const [massEditLegalCompanyName, setMassEditLegalCompanyName] = useState("");
  // [NEW] Массовое редактирование «Вознаграждение»
  const [massEditCommission, setMassEditCommission] = useState("");

  // --- Загрузка данных из Firestore ---
  const fetchProperties = async () => {
    try {
      const colRef = collection(db, "properties");
      const snapshot = await getDocs(colRef);
      let data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Сортируем по createdAt (Timestamp) от новых к старым
      data.sort((a, b) => {
        const timeA =
          a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const timeB =
          b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error("Ошибка загрузки объектов:", error);
    } finally {
      setLoading(false);
    }
  };

  // При монтировании
  useEffect(() => {
    fetchProperties();
  }, []);

  // --- Функция «Дублировать» ---
  const handleDuplicate = async (docId) => {
    try {
      const ref = doc(db, "properties", docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        showError("Документ не найден.");
        return;
      }
      const data = snap.data();

      // Копируем данные, исключая createdAt
      const { createdAt, ...rest } = data;
      // Если в объекте есть фотографии, для каждого фото выполняем загрузку заново в Firebase Storage,
      // чтобы получить новый URL (уникальную копию)
      let newImages = [];
      if (Array.isArray(rest.images)) {
        newImages = await Promise.all(
          rest.images.map(async (imgUrl) => {
            try {
              const response = await fetch(imgUrl);
              if (response.ok) {
                const blob = await response.blob();
                const newUrl = await uploadToFirebaseStorageInFolder(blob, "property");
                return newUrl;
              } else {
                console.error(`Ошибка загрузки изображения ${imgUrl}: ${response.statusText}`);
                return imgUrl;
              }
            } catch (error) {
              console.error("Ошибка при обработке изображения:", error);
              return imgUrl;
            }
          })
        );
      }

      const newData = {
        ...rest,
        images: newImages,
        createdAt: new Date()
      };

      await addDoc(collection(db, "properties"), newData);
      showSuccess("Дубликат создан!");
      fetchProperties();
    } catch (error) {
      console.error("Ошибка при дублировании объекта:", error);
    }
  };

  // --- Фильтрация по всем полям ---
  const handleFilter = () => {
    let result = [...properties];

    if (filterPrice.trim() !== "") {
      result = result.filter((p) =>
        String(p.price ?? "").includes(filterPrice.trim())
      );
    }
    if (filterType.trim() !== "") {
      result = result.filter((p) =>
        p.type?.toLowerCase().includes(filterType.toLowerCase())
      );
    }
    if (filterCoordinates.trim() !== "") {
      result = result.filter((p) =>
        p.coordinates?.toLowerCase().includes(filterCoordinates.toLowerCase())
      );
    }
    if (filterStatus.trim() !== "") {
      result = result.filter((p) =>
        p.status?.toLowerCase().includes(filterStatus.toLowerCase())
      );
    }
    if (filterDistrict.trim() !== "") {
      result = result.filter((p) =>
        p.district?.toLowerCase().includes(filterDistrict.toLowerCase())
      );
    }
    if (filterBuildingType.trim() !== "") {
      result = result.filter((p) =>
        p.buildingType?.toLowerCase().includes(filterBuildingType.toLowerCase())
      );
    }
    if (filterBedrooms.trim() !== "") {
      result = result.filter((p) =>
        String(p.bedrooms ?? "").includes(filterBedrooms.trim())
      );
    }

    if (filterOwnershipForm.trim() !== "") {
      result = result.filter((p) =>
        p.ownershipForm?.toLowerCase().includes(filterOwnershipForm.toLowerCase())
      );
    }
    if (filterLandStatus.trim() !== "") {
      result = result.filter((p) =>
        p.landStatus?.toLowerCase().includes(filterLandStatus.toLowerCase())
      );
    }
    if (filterPool.trim() !== "") {
      result = result.filter((p) =>
        p.pool?.toLowerCase().includes(filterPool.toLowerCase())
      );
    }
    if (filterDescription.trim() !== "") {
      result = result.filter((p) =>
        p.description?.toLowerCase().includes(filterDescription.toLowerCase())
      );
    }
    if (filterDeveloper.trim() !== "") {
      result = result.filter((p) =>
        p.developer?.toLowerCase().includes(filterDeveloper.toLowerCase())
      );
    }
    if (filterComplex.trim() !== "") {
      result = result.filter((p) =>
        p.complex?.toLowerCase().includes(filterComplex.toLowerCase())
      );
    }
    if (filterArea.trim() !== "") {
      result = result.filter((p) =>
        String(p.area ?? "").includes(filterArea.trim())
      );
    }
    if (filterProvince.trim() !== "") {
      result = result.filter((p) =>
        p.province?.toLowerCase().includes(filterProvince.toLowerCase())
      );
    }
    if (filterCity.trim() !== "") {
      result = result.filter((p) =>
        p.city?.toLowerCase().includes(filterCity.toLowerCase())
      );
    }
    if (filterRdtr.trim() !== "") {
      result = result.filter((p) =>
        p.rdtr?.toLowerCase().includes(filterRdtr.toLowerCase())
      );
    }
    if (filterManagementCompany.trim() !== "") {
      result = result.filter((p) =>
        p.managementCompany?.toLowerCase().includes(filterManagementCompany.toLowerCase())
      );
    }
    if (filterCompletionDate.trim() !== "") {
      result = result.filter((p) =>
        String(p.completionDate ?? "").includes(filterCompletionDate)
      );
    }
    if (filterLeaseYears.trim() !== "") {
      result = result.filter((p) =>
        String(p.leaseYears ?? "").includes(filterLeaseYears.trim())
      );
    }
    if (filterShgb.trim() !== "") {
      result = result.filter((p) =>
        p.shgb?.toLowerCase().includes(filterShgb.toLowerCase())
      );
    }
    if (filterPbg.trim() !== "") {
      result = result.filter((p) =>
        p.pbg?.toLowerCase().includes(filterPbg.toLowerCase())
      );
    }
    if (filterSlf.trim() !== "") {
      result = result.filter((p) =>
        p.slf?.toLowerCase().includes(filterSlf.toLowerCase())
      );
    }
    if (filterLegalCompanyName.trim() !== "") {
      result = result.filter((p) =>
        p.legalCompanyName?.toLowerCase().includes(filterLegalCompanyName.toLowerCase())
      );
    }
    if (filterCommission.trim() !== "") {
      result = result.filter((p) =>
        String(p.commission ?? "").includes(filterCommission.trim())
      );
    }

    setFilteredProperties(result);
  };

  // --- Массовое редактирование ---
  const handleMassEdit = async () => {
    if (
      !window.confirm(
        "Вы действительно хотите массово изменить все отфильтрованные объекты?"
      )
    ) {
      return;
    }

    try {
      for (let item of filteredProperties) {
        const ref = doc(db, "properties", item.id);
        const newData = {};

        if (massEditPrice.trim() !== "") {
          newData.price = parseFloat(massEditPrice) || 0;
        }
        if (massEditType.trim() !== "") {
          newData.type = massEditType;
        }
        if (massEditCoordinates.trim() !== "") {
          newData.coordinates = massEditCoordinates;
        }
        if (massEditStatus.trim() !== "") {
          newData.status = massEditStatus;
        }
        if (massEditDistrict.trim() !== "") {
          newData.district = massEditDistrict;
        }
        if (massEditBuildingType.trim() !== "") {
          newData.buildingType = massEditBuildingType;
        }
        if (massEditBedrooms.trim() !== "") {
          newData.bedrooms = massEditBedrooms;
        }

        if (massEditOwnershipForm.trim() !== "") {
          newData.ownershipForm = massEditOwnershipForm;
        }
        if (massEditLandStatus.trim() !== "") {
          newData.landStatus = massEditLandStatus;
        }
        if (massEditPool.trim() !== "") {
          newData.pool = massEditPool;
        }
        if (massEditDescription.trim() !== "") {
          newData.description = massEditDescription;
        }
        if (massEditDeveloper.trim() !== "") {
          newData.developer = massEditDeveloper;
        }
        if (massEditComplex.trim() !== "") {
          newData.complex = massEditComplex;
        }
        if (massEditArea.trim() !== "") {
          newData.area = parseFloat(massEditArea) || 0;
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
        if (massEditCompletionDate.trim() !== "") {
          newData.completionDate = massEditCompletionDate;
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
        if (massEditCommission.trim() !== "") {
          newData.commission = parseFloat(massEditCommission) || 0;
        }

        if (Object.keys(newData).length > 0) {
          await updateDoc(ref, newData);
        }
      }

      showSuccess("Массовое редактирование выполнено!");
      fetchProperties();
    } catch (err) {
      console.error("Ошибка массового редактирования:", err);
      showError("Ошибка: " + err.message);
    }
  };

  if (loading) {
    return <Typography>Загрузка объектов...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Объектов
      </Typography>

      {/* --- Секция ФИЛЬТРА (Accordion) --- */}
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
                label="Цена (price)"
                size="small"
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
              />
              <TextField
                label="Тип (type)"
                size="small"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              />
              <TextField
                label="Координаты (coordinates)"
                size="small"
                value={filterCoordinates}
                onChange={(e) => setFilterCoordinates(e.target.value)}
              />
              <TextField
                label="Статус (status)"
                size="small"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              />
              <TextField
                label="Район (district)"
                size="small"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
              />
              <TextField
                label="Тип постройки (buildingType)"
                size="small"
                value={filterBuildingType}
                onChange={(e) => setFilterBuildingType(e.target.value)}
              />
              <TextField
                label="Спальни (bedrooms)"
                size="small"
                value={filterBedrooms}
                onChange={(e) => setFilterBedrooms(e.target.value)}
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
                label="Бассейн (pool)"
                size="small"
                value={filterPool}
                onChange={(e) => setFilterPool(e.target.value)}
              />
              <TextField
                label="Описание (description)"
                size="small"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
              />
              <TextField
                label="Застройщик (developer)"
                size="small"
                value={filterDeveloper}
                onChange={(e) => setFilterDeveloper(e.target.value)}
              />
              <TextField
                label="Комплекс (complex)"
                size="small"
                value={filterComplex}
                onChange={(e) => setFilterComplex(e.target.value)}
              />
              <TextField
                label="Площадь (area)"
                size="small"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
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
                label="Дата заверш. (completionDate)"
                size="small"
                value={filterCompletionDate}
                onChange={(e) => setFilterCompletionDate(e.target.value)}
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
              <TextField
                label="Вознаграждение (commission)"
                size="small"
                value={filterCommission}
                onChange={(e) => setFilterCommission(e.target.value)}
              />
            </Box>
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleFilter}>
              Применить фильтр
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* --- Блок для массового редактирования (Accordion) --- */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Массовое редактирование (для отфильтрованных объектов)
        </Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Развернуть / Свернуть массовое редактирование</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <TextField label="Цена (price)" variant="outlined" size="small" value={massEditPrice} onChange={(e) => setMassEditPrice(e.target.value)} />
              <TextField label="Тип (type)" variant="outlined" size="small" value={massEditType} onChange={(e) => setMassEditType(e.target.value)} />
              <TextField label="Координаты (coordinates)" variant="outlined" size="small" value={massEditCoordinates} onChange={(e) => setMassEditCoordinates(e.target.value)} />
              <TextField label="Статус (status)" variant="outlined" size="small" value={massEditStatus} onChange={(e) => setMassEditStatus(e.target.value)} />
              <TextField label="Район (district)" variant="outlined" size="small" value={massEditDistrict} onChange={(e) => setMassEditDistrict(e.target.value)} />
              <TextField label="Тип постройки (buildingType)" variant="outlined" size="small" value={massEditBuildingType} onChange={(e) => setMassEditBuildingType(e.target.value)} />
              <TextField label="Спальни (bedrooms)" variant="outlined" size="small" value={massEditBedrooms} onChange={(e) => setMassEditBedrooms(e.target.value)} />
              <TextField label="Форма собств. (ownershipForm)" variant="outlined" size="small" value={massEditOwnershipForm} onChange={(e) => setMassEditOwnershipForm(e.target.value)} />
              <TextField label="Статус земли (landStatus)" variant="outlined" size="small" value={massEditLandStatus} onChange={(e) => setMassEditLandStatus(e.target.value)} />
              <TextField label="Бассейн (pool)" variant="outlined" size="small" value={massEditPool} onChange={(e) => setMassEditPool(e.target.value)} />
              <TextField label="Описание (description)" variant="outlined" size="small" value={massEditDescription} onChange={(e) => setMassEditDescription(e.target.value)} />
              <TextField label="Застройщик (developer)" variant="outlined" size="small" value={massEditDeveloper} onChange={(e) => setMassEditDeveloper(e.target.value)} />
              <TextField label="Комплекс (complex)" variant="outlined" size="small" value={massEditComplex} onChange={(e) => setMassEditComplex(e.target.value)} />
              <TextField label="Площадь (area)" variant="outlined" size="small" value={massEditArea} onChange={(e) => setMassEditArea(e.target.value)} />
              <TextField label="Провинция (province)" variant="outlined" size="small" value={massEditProvince} onChange={(e) => setMassEditProvince(e.target.value)} />
              <TextField label="Город (city)" variant="outlined" size="small" value={massEditCity} onChange={(e) => setMassEditCity(e.target.value)} />
              <TextField label="RDTR" variant="outlined" size="small" value={massEditRdtr} onChange={(e) => setMassEditRdtr(e.target.value)} />
              <TextField label="Упр. компания (managementCompany)" variant="outlined" size="small" value={massEditManagementCompany} onChange={(e) => setMassEditManagementCompany(e.target.value)} />
              <TextField label="Дата заверш. (completionDate)" variant="outlined" size="small" value={massEditCompletionDate} onChange={(e) => setMassEditCompletionDate(e.target.value)} />
              <TextField label="Лет (leaseYears)" variant="outlined" size="small" value={massEditLeaseYears} onChange={(e) => setMassEditLeaseYears(e.target.value)} />
              <TextField label="SHGB" variant="outlined" size="small" value={massEditShgb} onChange={(e) => setMassEditShgb(e.target.value)} />
              <TextField label="PBG" variant="outlined" size="small" value={massEditPbg} onChange={(e) => setMassEditPbg(e.target.value)} />
              <TextField label="SLF" variant="outlined" size="small" value={massEditSlf} onChange={(e) => setMassEditSlf(e.target.value)} />
              <TextField label="Юр. название (legalCompanyName)" variant="outlined" size="small" value={massEditLegalCompanyName} onChange={(e) => setMassEditLegalCompanyName(e.target.value)} />
              <TextField label="Вознаграждение (commission)" variant="outlined" size="small" value={massEditCommission} onChange={(e) => setMassEditCommission(e.target.value)} />
            </Box>
            <Button variant="contained" color="warning" onClick={handleMassEdit}>
              Массово изменить
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* --- Список объектов (после фильтра) --- */}
      <Grid container spacing={2}>
        {filteredProperties.map((property) => {
          const priceValue = parseFloat(property.price) || 0;
          const formattedPrice = priceValue.toLocaleString("ru-RU");
          return (
            <Grid item xs={12} sm={6} md={4} key={property.id}>
              <Card variant="outlined">
                {property.images && property.images.length > 0 && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={property.images[0]}
                    alt="Property Photo"
                  />
                )}
                <CardContent>
                  <Typography variant="h6">
                    Цена: {formattedPrice} $
                  </Typography>
                  <Typography variant="body2">Тип: {property.type}</Typography>
                  <Typography variant="body2">
                    Район: {property.district}
                  </Typography>
                  <Typography variant="body2">
                    Застройщик: {property.developer}
                  </Typography>
                  <Typography variant="body2">
                    Комплекс: {property.complex}
                  </Typography>
                  <Typography variant="body2">
                    Спальни: {property.bedrooms}
                  </Typography>
                  <Typography variant="body2">
                    Площадь: {property.area}
                  </Typography>
                  {property.commission !== undefined && (
                    <Typography variant="body2">
                      Вознаграждение: {property.commission}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    component={Link}
                    to={`/property/edit/${property.id}`}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Редактировать
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    sx={{ mt: 1 }}
                    onClick={() => handleDuplicate(property.id)}
                  >
                    Дублировать
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default ListProperties;