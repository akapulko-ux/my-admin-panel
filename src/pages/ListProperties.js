// src/pages/ListProperties.js
import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Box, Card, CardContent, CardMedia, Typography, Button, Grid, TextField } from "@mui/material";
import { Link } from "react-router-dom";

function ListProperties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const colRef = collection(db, "properties");
        const snapshot = await getDocs(colRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProperties(data);
        setFilteredProperties(data);
      } catch (error) {
        console.error("Ошибка загрузки объектов:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(prop =>
        (prop.type && prop.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (prop.district && prop.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (prop.description && prop.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (prop.developer && prop.developer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (prop.complex && prop.complex.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  if (loading) {
    return <Typography>Загрузка объектов...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Объектов
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
        {filteredProperties.map((property) => (
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
                <Typography variant="h6">Цена: {property.price}</Typography>
                <Typography variant="body2">Тип: {property.type}</Typography>
                <Typography variant="body2">Район: {property.district}</Typography>
                {/* Новые поля */}
                <Typography variant="body2">Застройщик: {property.developer}</Typography>
                <Typography variant="body2">Комплекс: {property.complex}</Typography>
                <Button variant="contained" component={Link} to={`/property/edit/${property.id}`} sx={{ mt: 1 }}>
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