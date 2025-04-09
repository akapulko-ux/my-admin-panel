// src/pages/Chessboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from "firebase/firestore";

// Начальные данные для демонстрации
const initialData = {
  sections: [
    {
      name: 'Section 1',
      floors: [
        { floor: 17, units: [
          { id: 'W178', rooms: 4, area: 89.2, price: 9500000, status: 'free' },
          { id: 'W179', rooms: 3, area: 50.7, price: 0, status: 'sold' },
          { id: 'W180', rooms: 2, area: 74.9, price: 7850000, status: 'booked' },
        ]},
        { floor: 16, units: [
          { id: 'W173', rooms: 3, area: 50.7, price: 0, status: 'sold' },
          { id: 'W174', rooms: 3, area: 50.7, price: 0, status: 'sold' },
          { id: 'W177', rooms: 2, area: 74.9, price: 7850000, status: 'booked' },
        ]},
        { floor: 15, units: [
          { id: 'W169', rooms: 2, area: 85.2, price: 8020000, status: 'free' },
          { id: 'W170', rooms: 3, area: 50.7, price: 0, status: 'sold' },
          { id: 'W171', rooms: 2, area: 74.5, price: 7530000, status: 'booked' },
        ]},
      ],
    },
    {
      name: 'Section 2',
      floors: [
        { floor: 17, units: [
          { id: 'W76', rooms: 3, area: 74.9, price: 0, status: 'sold' },
          { id: 'W77', rooms: 2, area: 74.5, price: 7530000, status: 'booked' },
          { id: 'W78', rooms: 2, area: 74.5, price: 7530000, status: 'booked' },
        ]},
        { floor: 16, units: [
          { id: 'W73', rooms: 2, area: 74.5, price: 7530000, status: 'booked' },
          { id: 'W74', rooms: 2, area: 74.5, price: 7530000, status: 'booked' },
          { id: 'W75', rooms: 2, area: 74.5, price: 7530000, status: 'booked' },
        ]},
      ],
    },
  ],
};

// Обновленные цвета: немного менее яркие, но "sold" теперь более выражен (не кислотно)
const getStatusStyle = (status) => {
  switch (status) {
    case 'free':
      return { backgroundColor: '#66bb6a' };   // moderately green
    case 'booked':
      return { backgroundColor: '#fff176' };   // bright yellow
    case 'sold':
      return { backgroundColor: '#e57373' };     // moderately red
    default:
      return {};
  }
};

// Создание дефолтного юнита
const createDefaultUnit = () => ({
  id: `Unit-${crypto.randomUUID()}`, // генерируем уникальный id
  rooms: 0,
  area: 0,
  price: 0,
  status: 'free'
});

// Создание дефолтного этажа (с одним юнитом)
const createDefaultFloor = () => ({
  // floor поле не используется напрямую (мы нумеруем по индексу)
  units: [createDefaultUnit()]
});

// Создание дефолтной секции (с одним этажом)
const createDefaultSection = () => ({
  name: 'New Section',
  floors: [createDefaultFloor()]
});

const Chessboard = () => {
  const { id } = useParams(); // id === "new" при создании новой шахматки
  const navigate = useNavigate();

  // Глобальные поля шахматки
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Используем секции; позже можно загрузить из Firestore
  const [sections, setSections] = useState(initialData.sections);

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Загрузка существующей шахматки из Firestore, если id не "new"
  useEffect(() => {
    async function fetchChessboard() {
      if (id && id !== "new") {
        setLoading(true);
        try {
          const ref = doc(db, "chessboards", id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setName(data.name || "");
            setDescription(data.description || "");
            setSections(data.sections || initialData.sections);
          }
        } catch (error) {
          console.error("Error loading chessboard:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchChessboard();
  }, [id]);

  // Функция для обновления конкретного юнита
  const handleUnitChange = (sectionIdx, floorIdx, unitIdx, field, value) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        return {
          ...section,
          floors: section.floors.map((floor, fIdx) => {
            if (fIdx !== floorIdx) return floor;
            return {
              ...floor,
              units: floor.units.map((unit, uIdx) =>
                uIdx === unitIdx ? { ...unit, [field]: value } : unit
              )
            };
          })
        };
      })
    );
  };

  // Добавление нового юнита в указанном этаже
  const addUnit = (sectionIdx, floorIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        return {
          ...section,
          floors: section.floors.map((floor, fIdx) => {
            if (fIdx !== floorIdx) return floor;
            return {
              ...floor,
              units: [...floor.units, createDefaultUnit()]
            };
          })
        };
      })
    );
  };

  // Удаление юнита из этажа, если в этаже больше одного юнита
  const removeUnit = (sectionIdx, floorIdx, unitIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        return {
          ...section,
          floors: section.floors.map((floor, fIdx) => {
            if (fIdx !== floorIdx) return floor;
            if (floor.units.length <= 1) return floor; // не удаляем, если только один юнит
            return {
              ...floor,
              units: floor.units.filter((_, uIdx) => uIdx !== unitIdx)
            };
          })
        };
      })
    );
  };

  // Добавление нового этажа в секцию
  const addFloor = (sectionIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        return {
          ...section,
          floors: [...section.floors, createDefaultFloor()]
        };
      })
    );
  };

  // Удаление этажа из секции, если в секции больше одного этажа
  const removeFloor = (sectionIdx, floorIdx) => {
    setSections(prev =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;
        if (section.floors.length <= 1) return section; // не удаляем, если единственный этаж
        return {
          ...section,
          floors: section.floors.filter((_, fIdx) => fIdx !== floorIdx)
        };
      })
    );
  };

  // Добавление новой секции
  const addSection = () => {
    setSections(prev => [...prev, createDefaultSection()]);
  };

  // Удаление секции, если их больше одной
  const removeSection = (sectionIdx) => {
    setSections(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, sIdx) => sIdx !== sectionIdx);
    });
  };

  // Обработчик сохранения всех изменений в коллекцию "chessboards"
  const handleSave = async () => {
    if (!name.trim()) {
      alert('The "Name" field is required!');
      return;
    }
    setIsSaving(true);
    try {
      const chessboardData = {
        name: name.trim(),
        description: description.trim(),
        sections,
        updatedAt: Timestamp.fromDate(new Date())
      };
      if (id && id !== "new") {
        await updateDoc(doc(db, "chessboards", id), chessboardData);
        alert("Chessboard updated!");
      } else {
        chessboardData.createdAt = Timestamp.fromDate(new Date());
        await addDoc(collection(db, "chessboards"), chessboardData);
        alert("New chessboard created!");
      }
      navigate("/chessboard");
    } catch (error) {
      console.error("Error saving chessboard:", error);
      alert("Error during saving!");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Global fields */}
      <Typography variant="h4" gutterBottom>Chessboard</Typography>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField 
          label="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          fullWidth 
          required 
        />
        <TextField 
          label="Description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          multiline 
          rows={3} 
          fullWidth 
        />
      </Box>

      {/* Sections */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sections.map((section, sectionIdx) => (
          <Box key={sectionIdx} sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{section.name}</Typography>
              {sections.length > 1 && (
                <Button variant="outlined" color="error" onClick={() => removeSection(sectionIdx)}>
                  Remove Section
                </Button>
              )}
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Floor</TableCell>
                  {/* No row labels */}
                  {section.floors[0]?.units.map((_, unitIdx) => (
                    <TableCell key={unitIdx} align="center"></TableCell>
                  ))}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {section.floors.map((floor, floorIdx) => (
                  <TableRow key={floorIdx}>
                    <TableCell>{floorIdx + 1}</TableCell>
                    {floor.units.map((unit, unitIdx) => (
                      <TableCell
                        key={unit.id}
                        sx={{
                          ...getStatusStyle(unit.status),
                          textAlign: 'center',
                          verticalAlign: 'top',
                          p: 1,
                        }}
                      >
                        <TextField 
                          label="Bedrooms" 
                          type="number" 
                          value={unit.rooms} 
                          onChange={(e) =>
                            handleUnitChange(sectionIdx, floorIdx, unitIdx, "rooms", e.target.value)
                          }
                          inputProps={{ style: { fontSize: '0.8rem', textAlign: 'center' } }}
                          fullWidth
                        />
                        <TextField 
                          label="Area (m²)" 
                          type="number" 
                          value={unit.area} 
                          onChange={(e) =>
                            handleUnitChange(sectionIdx, floorIdx, unitIdx, "area", e.target.value)
                          }
                          inputProps={{ style: { fontSize: '0.8rem', textAlign: 'center' } }}
                          fullWidth 
                          sx={{ mt: 1 }}
                        />
                        <TextField 
                          label="Price" 
                          type="number" 
                          value={unit.price} 
                          onChange={(e) =>
                            handleUnitChange(sectionIdx, floorIdx, unitIdx, "price", e.target.value)
                          }
                          inputProps={{ style: { fontSize: '0.8rem', textAlign: 'center' } }}
                          fullWidth 
                          sx={{ mt: 1 }}
                        />
                        <FormControl fullWidth sx={{ mt: 1 }} size="small">
                          <InputLabel id={`status-label-${sectionIdx}-${floorIdx}-${unitIdx}`}>Status</InputLabel>
                          <Select
                            labelId={`status-label-${sectionIdx}-${floorIdx}-${unitIdx}`}
                            label="Status"
                            value={unit.status}
                            onChange={(e) =>
                              handleUnitChange(sectionIdx, floorIdx, unitIdx, "status", e.target.value)
                            }
                          >
                            <MenuItem value="free">Free</MenuItem>
                            <MenuItem value="booked">Booked</MenuItem>
                            <MenuItem value="sold">Sold</MenuItem>
                          </Select>
                        </FormControl>
                        {floor.units.length > 1 && (
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small" 
                            onClick={() => removeUnit(sectionIdx, floorIdx, unitIdx)}
                            sx={{ mt: 1 }}
                          >
                            Remove Unit
                          </Button>
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <Button 
                        variant="outlined" 
                        onClick={() => addUnit(sectionIdx, floorIdx)}
                        size="small"
                      >
                        Add Unit
                      </Button>
                      {section.floors.length > 1 && (
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => removeFloor(sectionIdx, floorIdx)}
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          Remove Floor
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => addFloor(sectionIdx)}
                size="small"
              >
                Add Floor
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Кнопка для добавления новой секции */}
      <Box sx={{ mt: 4 }}>
        <Button variant="contained" onClick={addSection}>
          Add Section
        </Button>
      </Box>

      {/* Save button */}
      <Box sx={{ mt: 3 }}>
        {isSaving ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} />
            <Typography>Saving...</Typography>
          </Box>
        ) : (
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Chessboard;