// src/pages/ListComplexes.js

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

function ListComplexes() {
  const [complexes, setComplexes] = useState([]);
  const [filteredComplexes, setFilteredComplexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Функция загрузки комплексов (чтобы можно было вызвать повторно после дублирования)
  const fetchComplexes = async () => {
    try {
      const colRef = collection(db, "complexes");
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setComplexes(data);
      setFilteredComplexes(data);
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

  // Фильтрация по поисковому запросу (например, по названию, номеру, району)
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredComplexes(complexes);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = complexes.filter((complex) =>
        (complex.name && complex.name.toLowerCase().includes(term)) ||
        (complex.number && complex.number.toLowerCase().includes(term)) ||
        (complex.district && complex.district.toLowerCase().includes(term))
      );
      setFilteredComplexes(filtered);
    }
  }, [searchTerm, complexes]);

  // Функция «Дублировать» комплекс
  const handleDuplicate = async (docId) => {
    try {
      // 1) Читаем документ по docId
      const ref = doc(db, "complexes", docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert("Документ не найден");
        return;
      }
      const data = snap.data();

      // 2) При необходимости исключаем/изменяем поля
      // (например, убираем createdAt или что-то ещё)
      // Ниже — лишь пример, вы можете скорректировать по своим нуждам
      const { /* createdAt, */ ...rest } = data;
      const newData = {
        ...rest,
        // например, можно добавить новое время создания
        // createdAt: new Date(),
      };

      // 3) Создаём новый документ в "complexes"
      await addDoc(collection(db, "complexes"), newData);

      alert("Дубликат создан!");

      // 4) Обновляем список
      fetchComplexes();
    } catch (error) {
      console.error("Ошибка при дублировании комплекса:", error);
    }
  };

  if (loading) {
    return <Typography>Загрузка комплексов...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Комплексов
      </Typography>

      {/* Поисковое поле */}
      <TextField
        label="Поиск"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

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