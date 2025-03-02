// src/pages/ListProperties.js
import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Box, Card, CardContent, CardMedia, Typography, Button, Grid } from "@mui/material";
import { Link } from "react-router-dom";

function ListProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const colRef = collection(db, "properties");
        const snapshot = await getDocs(colRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProperties(data);
      } catch (error) {
        console.error("Ошибка загрузки объектов:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  if (loading) {
    return <Typography>Загрузка объектов...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Объектов
      </Typography>
      <Grid container spacing={2}>
        {properties.map((property) => (
          <Grid item xs={12} sm={6} md={4} key={property.id}>
            <Card variant="outlined">
              {/* Отображаем первую фотографию, если она есть */}
              {property.images && property.images.length > 0 && (
                <CardMedia
                  component="img"
                  height="140"
                  image={property.images[0]}
                  alt="Property Photo"
                />
              )}
              <CardContent>
                <Typography variant="h6">Цена: {property.price}</Typography>
                <Typography variant="body2">Тип: {property.type}</Typography>
                <Typography variant="body2">Район: {property.district}</Typography>
                <Button
                  variant="contained"
                  component={Link}
                  to={`/property/edit/${property.id}`}
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

export default ListProperties;