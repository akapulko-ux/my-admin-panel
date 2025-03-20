// src/pages/ListLandmarks.js

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

import {
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function ListLandmarks() {
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLandmarks() {
      try {
        const snapshot = await getDocs(collection(db, "landmarks"));
        const loaded = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setLandmarks(loaded);
      } catch (error) {
        console.error("Ошибка загрузки достопримечательностей:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLandmarks();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (landmarks.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Нет достопримечательностей</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Достопримечательностей
      </Typography>

      <Grid container spacing={2}>
        {landmarks.map((landmark) => (
          <Grid item xs={12} sm={6} md={4} key={landmark.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {landmark.name || "Без названия"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Координаты: {landmark.coordinates || "не указаны"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {landmark.description || ""}
                </Typography>

                {/* Если есть хотя бы одно изображение, покажем первое */}
                {landmark.images && landmark.images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={landmark.images[0]}
                      alt="landmark"
                      style={{ width: "100%", borderRadius: 4 }}
                    />
                  </Box>
                )}

                {/* Кнопка "Редактировать" -> переход к /landmark/edit/:id */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/landmark/edit/${landmark.id}`)}
                  >
                    Редактировать
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ListLandmarks;