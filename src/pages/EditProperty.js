// src/pages/EditProperty.js
import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Card, CardContent, TextField, Typography, Button, Grid } from "@mui/material";

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [status, setStatus] = useState("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");
  const [developer, setDeveloper] = useState("");
  const [complex, setComplex] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [area, setArea] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [rdtr, setRdtr] = useState("");
  const [classRating, setClassRating] = useState("");
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("");
  const [landStatus, setLandStatus] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [pool, setPool] = useState("");

  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const ref = doc(db, "properties", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setPrice(data.price || "");
          setType(data.type || "");
          // Если в документе есть отдельные поля latitude и longitude, объединяем их в строку:
          if (data.latitude !== undefined && data.longitude !== undefined) {
            setCoordinates(`${data.latitude}, ${data.longitude}`);
          } else if (
            data.coordinates &&
            typeof data.coordinates === "object" &&
            data.coordinates.latitude !== undefined &&
            data.coordinates.longitude !== undefined
          ) {
            setCoordinates(`${data.coordinates.latitude}, ${data.coordinates.longitude}`);
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
          setProvince(data.province || "");
          setCity(data.city || "");
          setRdtr(data.rdtr || "");
          setClassRating(data.classRating || "");
          setManagementCompany(data.managementCompany || "");
          setOwnershipForm(data.ownershipForm || "");
          setLandStatus(data.landStatus || "");
          if (data.completionDate) {
            setCompletionDate(data.completionDate.toDate().toISOString().slice(0, 10));
          } else {
            setCompletionDate("");
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

  const handleFileChange = (e) => {
    if (e.target.files) {
      setNewFiles([...e.target.files]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const newUrls = [];
      for (let file of newFiles) {
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
      }
      const updatedImages = [...images, ...newUrls];
      const compDateStamp = completionDate ? Timestamp.fromDate(new Date(completionDate)) : null;
      const updatedData = {
        price,
        type,
        coordinates,
        status,
        district,
        description,
        developer,
        complex,
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
        completionDate: compDateStamp,
        pool,
        images: updatedImages
      };
      const ref = doc(db, "properties", id);
      await updateDoc(ref, updatedData);
      setImages(updatedImages);
      setNewFiles([]);
      alert("Объект обновлён!");
    } catch (error) {
      console.error("Ошибка обновления объекта:", error);
    }
  };

  const handleRemoveImage = async (idx) => {
    try {
      const updated = [...images];
      updated.splice(idx, 1);
      const ref = doc(db, "properties", id);
      await updateDoc(ref, { images: updated });
      setImages(updated);
    } catch (error) {
      console.error("Ошибка удаления ссылки на фото:", error);
    }
  };

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
            <TextField label="Цена (USD)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <TextField label="Тип" value={type} onChange={(e) => setType(e.target.value)} />
            <TextField label="Координаты (шир, долг)" value={coordinates} onChange={(e) => setCoordinates(e.target.value)} />
            <TextField label="Статус" value={status} onChange={(e) => setStatus(e.target.value)} />
            <TextField label="Район" value={district} onChange={(e) => setDistrict(e.target.value)} />
            <TextField label="Описание" multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <TextField label="Застройщик" value={developer} onChange={(e) => setDeveloper(e.target.value)} />
            <TextField label="Комплекс" value={complex} onChange={(e) => setComplex(e.target.value)} />
            <TextField label="Тип постройки" value={buildingType} onChange={(e) => setBuildingType(e.target.value)} />
            <TextField label="Спальни" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
            <TextField label="Площадь (м²)" type="number" value={area} onChange={(e) => setArea(e.target.value)} />
            <TextField label="Провинция" value={province} onChange={(e) => setProvince(e.target.value)} />
            <TextField label="Город" value={city} onChange={(e) => setCity(e.target.value)} />
            <TextField label="RDTR" value={rdtr} onChange={(e) => setRdtr(e.target.value)} />
            <TextField label="Класс" value={classRating} onChange={(e) => setClassRating(e.target.value)} />
            <TextField label="Управляющая компания" value={managementCompany} onChange={(e) => setManagementCompany(e.target.value)} />
            <TextField label="Форма собственности" value={ownershipForm} onChange={(e) => setOwnershipForm(e.target.value)} />
            <TextField label="Статус земли" value={landStatus} onChange={(e) => setLandStatus(e.target.value)} />
            <TextField label="Дата завершения" type="date" InputLabelProps={{ shrink: true }} value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
            <TextField label="Бассейн" value={pool} onChange={(e) => setPool(e.target.value)} />

            <Typography>Существующие фото:</Typography>
            <Grid container spacing={2}>
              {images.map((url, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Box>
                    <img src={url} alt="property" style={{ width: "100%", borderRadius: 4 }} />
                    <Button variant="contained" color="error" size="small" onClick={() => handleRemoveImage(idx)} sx={{ mt: 1 }}>
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