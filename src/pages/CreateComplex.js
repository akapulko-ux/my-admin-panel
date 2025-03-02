// src/pages/CreateComplex.js
import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";
import { Box, Card, CardContent, TextField, Typography, Button } from "@mui/material";

function CreateComplex() {
  // Добавляем состояние для номера комплекса (поле "number")
  const [complexNumber, setComplexNumber] = useState("");
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles([...e.target.files]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const uploadedUrls = [];
      for (let file of selectedFiles) {
        const secureUrl = await uploadToCloudinary(file);
        uploadedUrls.push(secureUrl);
      }
      // В документ добавляем и поле "number" с введённым значением complexNumber
      const newDoc = {
        number: complexNumber,
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        images: uploadedUrls,
        createdAt: new Date()
      };
      await addDoc(collection(db, "complexes"), newDoc);
      setComplexNumber("");
      setName("");
      setDeveloper("");
      setDistrict("");
      setCoordinates("");
      setPriceFrom("");
      setAreaRange("");
      setDescription("");
      setSelectedFiles([]);
      alert("Комплекс создан!");
    } catch (error) {
      console.error("Ошибка создания комплекса:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Создать Комплекс
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Поле для номера комплекса */}
            <TextField
              label="Номер комплекса"
              value={complexNumber}
              onChange={(e) => setComplexNumber(e.target.value)}
              required
            />
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Застройщик"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
            />
            <TextField
              label="Район"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
            <TextField
              label="Координаты (шир, долг)"
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
            />
            <TextField
              label="Цена от (USD)"
              type="number"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
            />
            <TextField
              label="Диапазон площади"
              value={areaRange}
              onChange={(e) => setAreaRange(e.target.value)}
            />
            <TextField
              label="Описание"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button variant="contained" component="label">
              Выбрать фото
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

export default CreateComplex;