// src/pages/ListProperties.js
import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc
} from "firebase/firestore";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  TextField
} from "@mui/material";
import { Link } from "react-router-dom";

function ListProperties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Функция загрузки списка документов
  const fetchProperties = async () => {
    try {
      const colRef = collection(db, "properties");
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error("Ошибка загрузки объектов:", error);
    } finally {
      setLoading(false);
    }
  };

  // При монтировании загружаем объекты
  useEffect(() => {
    fetchProperties();
  }, []);

  // Обработка поиска
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredProperties(properties);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = properties.filter((prop) =>
        (prop.type && prop.type.toLowerCase().includes(term)) ||
        (prop.district && prop.district.toLowerCase().includes(term)) ||
        (prop.description && prop.description.toLowerCase().includes(term)) ||
        (prop.developer && prop.developer.toLowerCase().includes(term)) ||
        (prop.complex && prop.complex.toLowerCase().includes(term))
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  // Функция «Дублировать»
  const handleDuplicate = async (docId) => {
    try {
      // 1) Читаем документ из Firestore
      const ref = doc(db, "properties", docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert("Документ не найден.");
        return;
      }
      const data = snap.data();

      // 2) Исключаем/меняем поля, которые не нужно копировать «как есть»
      //    Ниже — лишь пример, вы можете убрать/изменить любые поля
      //    или добавить новую дату создания и т.д.
      const { /*createdAt,*/ ...rest } = data;
      const newData = {
        ...rest,
        // Например, можно выставить новую дату или что-то ещё
        // createdAt: new Date(),
      };

      // 3) Создаём новый документ в коллекции
      await addDoc(collection(db, "properties"), newData);

      alert("Дубликат создан!");
      // 4) Обновляем список, чтобы сразу увидеть новый объект
      fetchProperties();
    } catch (error) {
      console.error("Ошибка при дублировании объекта:", error);
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

      {/* Поле поиска */}
      <TextField
        label="Поиск"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Grid container spacing={2}>
        {filteredProperties.map((property) => {
          // Парсим price как число, затем форматируем
          const priceValue = parseFloat(property.price) || 0;
          const formattedPrice = priceValue.toLocaleString("ru-RU");

          return (
            <Grid item xs={12} sm={6} md={4} key={property.id}>
              <Card variant="outlined">
                {/* Если есть хотя бы одно фото, показываем превью */}
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
                  <Typography variant="body2">
                    Тип: {property.type}
                  </Typography>
                  <Typography variant="body2">
                    Район: {property.district}
                  </Typography>
                  <Typography variant="body2">
                    Застройщик: {property.developer}
                  </Typography>
                  <Typography variant="body2">
                    Комплекс: {property.complex}
                  </Typography>

                  {/* Кнопка «Редактировать» */}
                  <Button
                    variant="contained"
                    component={Link}
                    to={`/property/edit/${property.id}`}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Редактировать
                  </Button>

                  {/* Кнопка «Дублировать» */}
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