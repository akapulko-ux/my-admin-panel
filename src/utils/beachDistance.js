import { getDistance } from "geolib";

/**
 * Примерный расширенный список пляжей Бали с координатами (широта, долгота).
 * Обратите внимание, что это не полный перечень всех пляжей, 
 * а лишь популярные/известные варианты. Координаты приблизительны.
 */
const BEACHES = [
  { name: "Kuta Beach", latitude: -8.71613, longitude: 115.16727 },
  { name: "Legian Beach", latitude: -8.69760, longitude: 115.16230 },
  { name: "Seminyak Beach", latitude: -8.69150, longitude: 115.15850 },
  { name: "Canggu Beach", latitude: -8.64695, longitude: 115.12549 },
  { name: "Berawa Beach", latitude: -8.66319, longitude: 115.13357 },
  { name: "Echo Beach", latitude: -8.64256, longitude: 115.12588 },
  { name: "Pererenan Beach", latitude: -8.63389, longitude: 115.11777 },
  { name: "Tanah Lot", latitude: -8.62112, longitude: 115.08673 },
  { name: "Jimbaran Beach", latitude: -8.78029, longitude: 115.16771 },
  { name: "Nusa Dua Beach", latitude: -8.80000, longitude: 115.23333 },
  { name: "Tanjung Benoa Beach", latitude: -8.77233, longitude: 115.21923 },
  { name: "Sanur Beach", latitude: -8.69690, longitude: 115.25607 },
  { name: "Uluwatu Beach", latitude: -8.81871, longitude: 115.08782 },
  { name: "Padang Padang Beach", latitude: -8.81731, longitude: 115.10371 },
  { name: "Bingin Beach", latitude: -8.80371, longitude: 115.11024 },
  { name: "Dreamland Beach", latitude: -8.79583, longitude: 115.10723 },
  { name: "Balangan Beach", latitude: -8.78836, longitude: 115.10454 },
  { name: "Nyang Nyang Beach", latitude: -8.82827, longitude: 115.08749 },
  { name: "Green Bowl Beach", latitude: -8.84905, longitude: 115.17574 },
  { name: "Melasti Beach", latitude: -8.85410, longitude: 115.16958 },
  { name: "Pandawa Beach", latitude: -8.84853, longitude: 115.19835 },
  { name: "Karma Beach", latitude: -8.83712, longitude: 115.17745 },
  { name: "Lovina Beach", latitude: -8.15762, longitude: 115.02637 },
  { name: "Amed Beach", latitude: -8.33474, longitude: 115.66618 },
  { name: "Tulamben Beach", latitude: -8.27844, longitude: 115.60629 },
  { name: "Blue Lagoon (Padang Bai)", latitude: -8.53420, longitude: 115.50817 },
  { name: "White Sand Beach (Pasir Putih)", latitude: -8.51960, longitude: 115.54750 },
  { name: "Medewi Beach", latitude: -8.42825, longitude: 114.96880 },
  { name: "Soka Beach", latitude: -8.54032, longitude: 114.98153 },
  { name: "Balian Beach", latitude: -8.53400, longitude: 114.94800 },
  { name: "Yeh Gangga Beach", latitude: -8.56307, longitude: 115.03463 },
  { name: "Ketewel Beach", latitude: -8.63251, longitude: 115.27122 },
  { name: "Lebih Beach", latitude: -8.59986, longitude: 115.28627 },
  { name: "Bias Tugel Beach", latitude: -8.53994, longitude: 115.51181 },

  // --- 20 добавленных пляжей с приблизительными координатами ---
  { name: "Pantai Matahari Terbit", latitude: -8.6999, longitude: 115.2560 },
  { name: "Pantai Karang", latitude: -8.6934, longitude: 115.2641 },
  { name: "Pantai Sindhu", latitude: -8.6890, longitude: 115.2645 },
  { name: "Padang Galak Beach", latitude: -8.6612, longitude: 115.2733 },
  { name: "Pantai Gumicik", latitude: -8.6247, longitude: 115.2844 },
  { name: "Pantai Masceti", latitude: -8.5973, longitude: 115.3001 },
  { name: "Cucukan Beach", latitude: -8.5739, longitude: 115.3396 },
  { name: "Pantai Klotok", latitude: -8.5560, longitude: 115.3902 },
  { name: "Pantai Keramas", latitude: -8.5967, longitude: 115.3214 },
  { name: "Pantai Lepang", latitude: -8.5904, longitude: 115.3667 },
  { name: "Pantai Goa Lawah", latitude: -8.5307, longitude: 115.4667 },
  { name: "Pantai Kusamba", latitude: -8.5394, longitude: 115.4872 },
  { name: "Pantai Wates", latitude: -8.5569, longitude: 115.4176 },
  { name: "Pantai Jungutbatu (Nusa Lembongan)", latitude: -8.6713, longitude: 115.4510 },
  { name: "Pantai Dream Beach (Nusa Lembongan)", latitude: -8.6882, longitude: 115.4421 },
  { name: "Pantai Mushroom Bay (Nusa Lembongan)", latitude: -8.6873, longitude: 115.4382 },
  { name: "Pantai Atuh (Nusa Penida)", latitude: -8.7500, longitude: 115.6200 },
  { name: "Pantai Diamond Beach (Nusa Penida)", latitude: -8.7487, longitude: 115.6175 },
  { name: "Pantai Crystal Bay (Nusa Penida)", latitude: -8.7252, longitude: 115.4479 },
  { name: "Pantai Suwehan (Nusa Penida)", latitude: -8.7470, longitude: 115.6002 },
];

/**
 * Находит ближайший пляж к заданным координатам (lat, lng)
 * и возвращает расстояние (км), примерное время (мин) 
 * при условной скорости 40 км/ч, а также название пляжа.
 *
 * @param {number} lat - Широта комплекса
 * @param {number} lng - Долгота комплекса
 * @returns {Promise<{ distanceKm: number, timeMinutes: number, beachName: string }>}
 */
export async function getDistanceToNearestBeach(lat, lng) {
  let nearestBeach = null;
  let minDistance = Infinity;

  // Перебираем все пляжи и находим тот, до которого ближе всего
  for (const beach of BEACHES) {
    const distMeters = getDistance(
      { latitude: lat, longitude: lng },
      { latitude: beach.latitude, longitude: beach.longitude }
    );
    if (distMeters < minDistance) {
      minDistance = distMeters;
      nearestBeach = beach;
    }
  }

  // Переводим расстояние из метров в километры
  const distanceKm = minDistance / 1000;

  // Примерная логика расчёта времени:
  // средняя скорость ~ 40 км/ч => (distanceKm / 40) * 60 = минуты
  const timeMinutes = (distanceKm / 40) * 60;

  return {
    distanceKm,
    timeMinutes,
    beachName: nearestBeach ? nearestBeach.name : "Неизвестный пляж"
  };
}