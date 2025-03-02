// src/pages/ListComplexes.js
import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Box, Card, CardContent, CardMedia, Typography, Button, Grid } from "@mui/material";
import { Link } from "react-router-dom";

function ListComplexes() {
  const [complexes, setComplexes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplexes = async () => {
      try {
        const colRef = collection(db, "complexes");
        const snapshot = await getDocs(colRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComplexes(data);
      } catch (error) {
        console.error("Ошибка загрузки комплексов:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplexes();
  }, []);

  if (loading) {
    return <Typography>Загрузка комплексов...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Комплексов
      </Typography>
      <Grid container spacing={2}>
        {complexes.map((complex) => (
          <Grid item xs={12} sm={6} md={4} key={complex.id}>
            <Card variant="outlined">
              {/* Отображаем первую фотографию, если она есть */}
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
                  Застройщик: {complex.developer}
                </Typography>
                <Typography variant="body2">
                  Район: {complex.district}
                </Typography>
                <Button
                  variant="contained"
                  component={Link}
                  to={`/complex/edit/${complex.id}`}
                  sx={{ mt: 1 }}
                >
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