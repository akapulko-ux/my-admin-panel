import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  Box,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function ListDevelopers() {
  const navigate = useNavigate();

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevelopers() {
      try {
        setLoading(true);

        // Считываем все документы из коллекции "developers"
        const snap = await getDocs(collection(db, "developers"));

        const devs = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          // Документ может содержать поля: { name, description, logo, ... }
          if (data.name && data.name.trim() !== "") {
            devs.push({
              id: docSnap.id, // чтобы знать, какой документ редактировать
              name: data.name,
              logo: data.logo || null
            });
          }
        });

        // Сортируем по алфавиту
        devs.sort((a, b) => a.name.localeCompare(b.name));

        setDevelopers(devs);
      } catch (error) {
        console.error("Ошибка при загрузке застройщиков:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDevelopers();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Список Застройщиков
      </Typography>

      {/* Кнопка "Создать нового застройщика" -> /developer/edit/new */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate("/developer/edit/new")}
        >
          Создать Застройщика
        </Button>
      </Box>

      {developers.length === 0 ? (
        <Typography>Нет застройщиков</Typography>
      ) : (
        <List>
          {developers.map((dev) => (
            <ListItem
              key={dev.id}
              secondaryAction={
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/developer/edit/${dev.id}`)}
                >
                  Редактировать
                </Button>
              }
            >
              <ListItemAvatar>
                {dev.logo ? (
                  <Box
                    component="img"
                    src={dev.logo}
                    alt={dev.name}
                    sx={{
                      width: 60,   // фиксированная ширина
                      height: "auto", // высота автоматически сохраняет пропорции
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  // Если логотипа нет, используем стандартный Avatar с первой буквой
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "1rem",
                    }}
                  >
                    {dev.name.charAt(0).toUpperCase()}
                  </Box>
                )}
              </ListItemAvatar>
              {/* Добавлен отступ слева, равный примерно 3 пробелам */}
              <ListItemText primary={dev.name} sx={{ ml: 2 }} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default ListDevelopers;