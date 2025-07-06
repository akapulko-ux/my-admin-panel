import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Pencil } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

function ListDevelopers() {
  const navigate = useNavigate();

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
              description: data.description || "",
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex justify-between items-center'} mb-8`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Список Застройщиков</h1>
        <Button 
          onClick={() => navigate("/developers/edit/new")}
          className={`${isMobile ? 'w-full h-12' : ''}`}
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить Застройщика
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : developers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Нет застройщиков</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developers.map((dev) => (
            <Card key={dev.id} className="overflow-hidden">
              <CardHeader className="space-y-4">
                <div className="flex items-center space-x-4">
                  {dev.logo ? (
                    <img
                      src={dev.logo}
                      alt={dev.name}
                      className="w-16 h-16 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl">{dev.name}</CardTitle>
                    {dev.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {dev.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  className={`w-full ${isMobile ? 'h-12' : ''}`}
                  onClick={() => navigate(`/developers/edit/${dev.id}`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListDevelopers;