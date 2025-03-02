import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";
import { useParams } from "react-router-dom";
import { Box, Card, CardContent, TextField, Typography, Button, Grid } from "@mui/material";

function EditComplex() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [areaRange, setAreaRange] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "complexes", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setDeveloper(data.developer || "");
          setDistrict(data.district || "");
          setCoordinates(data.coordinates || "");
          setPriceFrom(data.priceFrom || "");
          setAreaRange(data.areaRange || "");
          setDescription(data.description || "");
          setImages(data.images || []);
        }
      } catch (error) {
        console.error("Ошибка загрузки комплекса:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      const updatedData = {
        name,
        developer,
        district,
        coordinates,
        priceFrom,
        areaRange,
        description,
        images: updatedImages
      };
      const ref = doc(db, "complexes", id);
      await updateDoc(ref, updatedData);
      setImages(updatedImages);
      setNewFiles([]);
      alert("Комплекс обновлён!");
    } catch (error) {
      console.error("Ошибка обновления комплекса:", error);
    }
  };

  const handleRemoveImage = async (idx) => {
    try {
      const updated = [...images];
      updated.splice(idx, 1);
      const ref = doc(db, "complexes", id);
      await updateDoc(ref, { images: updated });
      setImages(updated);
    } catch (error) {
      console.error("Ошибка удаления ссылки на фото:", error);
    }
  };

  if (loading) return <Typography sx={{ p: 2 }}>Загрузка...</Typography>;

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Редактировать Комплекс (ID: {id})
          </Typography>
          <Box component="form" onSubmit={handleSave} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Название" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Застройщик" value={developer} onChange={(e) => setDeveloper(e.target.value)} />
            <TextField label="Район" value={district} onChange={(e) => setDistrict(e.target.value)} />
            <TextField label="Координаты" value={coordinates} onChange={(e) => setCoordinates(e.target.value)} />
            <TextField label="Цена от (USD)" type="number" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
            <TextField label="Диапазон площади" value={areaRange} onChange={(e) => setAreaRange(e.target.value)} />
            <TextField label="Описание" multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

            <Typography>Существующие фото:</Typography>
            <Grid container spacing={2}>
              {images.map((url, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Box>
                    <img src={url} alt="complex" style={{ width: "100%", borderRadius: 4 }} />
                    <Button variant="contained" color="error" size="small" onClick={() => handleRemoveImage(idx)} sx={{ mt: 1 }}>
                      Удалить
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Button variant="contained" component="label">
              Добавить фото
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>

            <Button variant="contained" color="primary" type="submit">
              Сохранить изменения
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EditComplex;