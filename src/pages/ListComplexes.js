// src/pages/ListComplexes.js
import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Box, Card, CardContent, CardMedia, Typography, Button, Grid, TextField } from "@mui/material";
import { Link } from "react-router-dom";

function ListComplexes() {
  const [complexes, setComplexes] = useState([]);
  const [filteredComplexes, setFilteredComplexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchComplexes = async () => {
      try {
        const colRef = collection(db, "complexes");
        const snapshot = await getDocs(colRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComplexes(data);
        setFilteredComplexes(data);
      } catch (error) {
        console.error("Ошибка загрузки комплексов:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplexes();
  }, []);

  // Фильтрация по поисковому запросу (например, по названию, номеру, району)
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredComplexes(complexes);
    } else {
      const filtered = complexes.filter(complex =>
        (complex.name && complex.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (complex.number && complex.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (complex.district && complex.district.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredComplexes(filtered);
    }
  }, [searchTerm, complexes]);

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
                <Button variant="contained" component={Link} to={`/complex/edit/${complex.id}`} sx={{ mt: 1 }}>
                  Редактировать
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