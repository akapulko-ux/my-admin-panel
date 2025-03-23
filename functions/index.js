const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { Client } = require("@googlemaps/google-maps-services-js");

admin.initializeApp();
const db = admin.firestore();
const maps = new Client({});

// Получаем API‑ключ из конфигурации и выводим его в лог
console.log("Maps API key:", functions.config().maps.key);

const DIRECTIONS_API_KEY = functions.config().maps.key;

// Триггер: при создании нового документа в коллекции "complexes" или "landmarks"
// автоматически рассчитываем маршруты между всеми комплексами и всеми landmarks.
exports.onLandmarkOrComplexCreate = functions.firestore
  .document("{collection}/{docId}")
  .onCreate(async (snap, context) => {
    const col = context.params.collection;
    if (col !== "complexes" && col !== "landmarks") return;

    const complexes = await db.collection("complexes").get();
    const landmarks = await db.collection("landmarks").get();

    const tasks = [];
    complexes.forEach(c => {
      landmarks.forEach(l => {
        tasks.push(createRouteDoc(c.id, c.data(), l.id, l.data()));
      });
    });

    await Promise.all(tasks);
  });

// Temporary HTTP‑Function для разового back‑fill из браузера.
// Запустите её вручную, чтобы рассчитать маршруты для уже существующих документов.
exports.backfillRoutes = functions.https.onRequest(async (_req, res) => {
  console.log("backfillRoutes triggered. Maps API key:", functions.config().maps.key);
  const complexes = await db.collection("complexes").get();
  const landmarks = await db.collection("landmarks").get();
  const tasks = [];

  complexes.forEach(c => {
    landmarks.forEach(l => {
      tasks.push(createRouteDoc(c.id, c.data(), l.id, l.data()));
    });
  });

  await Promise.all(tasks);
  res.status(200).send("✅ Back‑fill finished");
});

async function createRouteDoc(complexId, complexData, landmarkId, landmarkData) {
  // Разбиваем строку координат на массив чисел
  const complexCoord = complexData.coordinates.split(",").map(Number);
  const landmarkCoord = landmarkData.coordinates.split(",").map(Number);

  // Создаем объекты GeoPoint для расчёта расстояния
  const from = new admin.firestore.GeoPoint(complexCoord[0], complexCoord[1]);
  const to = new admin.firestore.GeoPoint(landmarkCoord[0], landmarkCoord[1]);

  // Вычисляем расстояние между комплексом и landmark (в метрах)
  const dist = distanceMeters(from, to);
  // Если расстояние больше 10 км, не создаем маршрут
  if (dist > 10000) return;

  // Получаем ссылку на документ подколлекции routes для данной пары
  const routeRef = db.collection("complexes").doc(complexId)
                     .collection("routes").doc(landmarkId);
  const existing = await routeRef.get();
  if (existing.exists) return; // Если маршрут уже записан, не пересчитываем его

  // Отправляем запрос к Routes API (здесь используется метод directions)
  const resp = await maps.directions({
    params: {
      origin: `${complexCoord[0]},${complexCoord[1]}`,
      destination: `${landmarkCoord[0]},${landmarkCoord[1]}`,
      key: DIRECTIONS_API_KEY,
      mode: "driving"
    }
  });

  const route = resp.data.routes[0];
  const distanceKm = +(route.legs[0].distance.value / 1000).toFixed(1);
  const travelTimeMin = Math.round(route.legs[0].duration.value / 60);

  // Сохраняем рассчитанные данные в подколлекцию "routes"
  await routeRef.set({ distanceKm, travelTimeMin });
}

// Функция, реализующая формулу Хаверсайна для расчёта расстояния между двумя GeoPoint
function distanceMeters(a, b) {
  const R = 6371000; // Радиус Земли в метрах
  const φ1 = a.latitude * Math.PI / 180;
  const φ2 = b.latitude * Math.PI / 180;
  const Δφ = (b.latitude - a.latitude) * Math.PI / 180;
  const Δλ = (b.longitude - a.longitude) * Math.PI / 180;
  const d = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d));
}