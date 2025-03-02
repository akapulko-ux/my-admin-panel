// src/pages/CreateProperty.js
import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";
import { Box, Card, CardContent, TextField, Typography, Button } from "@mui/material";

function CreateProperty() {
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Вилла");
  const [coordinates, setCoordinates] = useState("");
  const [status, setStatus] = useState("Строится");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");
  const [developer, setDeveloper] = useState("");
  const [complex, setComplex] = useState("");
  const [buildingType, setBuildingType] = useState("Новый комплекс");
  const [bedrooms, setBedrooms] = useState("");
  const [area, setArea] = useState("");
  const [province, setProvince] = useState("Bali");
  const [city, setCity] = useState("Kab. Badung");
  const [rdtr, setRdtr] = useState("RDTR Kecamatan Ubud");
  const [classRating, setClassRating] = useState("Комфорт (B)");
  const [managementCompany, setManagementCompany] = useState("");
  const [ownershipForm, setOwnershipForm] = useState("Freehold");
  const [landStatus, setLandStatus] = useState("Туристическая зона (W)");
  const [completionDate, setCompletionDate] = useState("");
  const [pool, setPool] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles([...e.target.files]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const imageUrls = [];
      for (let file of selectedFiles) {
        const url = await uploadToCloudinary(file);
        imageUrls.push(url);
      }
      const newProp = {
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
        completionDate,
        pool,
        images: imageUrls,
        createdAt: new Date()
      };
      await addDoc(collection(db, "properties"), newProp);
      setPrice("");
      setType("Вилла");
      setCoordinates("");
      setStatus("Строится");
      setDistrict("");
      setDescription("");
      setDeveloper("");
      setComplex("");
      setBuildingType("Новый комплекс");
      setBedrooms("");
      setArea("");
      setProvince("Bali");
      setCity("Kab. Badung");
      setRdtr("RDTR Kecamatan Ubud");
      setClassRating("Комфорт (B)");
      setManagementCompany("");
      setOwnershipForm("Freehold");
      setLandStatus("Туристическая зона (W)");
      setCompletionDate("");
      setPool("");
      setSelectedFiles([]);
      alert("Объект создан!");
    } catch (error) {
      console.error("Ошибка создания объекта:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Объект
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            <Button variant="contained" component="label">
              Загрузить фото
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>
            <Button variant="contained" color="primary" type="submit">
              Создать
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateProperty;