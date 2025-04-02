// src/utils/fetchCloudinaryImages.js

import axios from "axios";
import { CLOUDINARY_CONFIG } from "./cloudinary";

/**
 * Получить ВСЕ изображения из Cloudinary (в папке или без папки)
 * Возвращает массив ресурсов (image objects)
 */
export async function fetchCloudinaryImages() {
  let nextCursor = null;
  const allResources = [];

  try {
    do {
      const response = await axios.get(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/resources/image`,
        {
          auth: {
            username: CLOUDINARY_CONFIG.apiKey,
            password: CLOUDINARY_CONFIG.apiSecret,
          },
          params: {
            max_results: 100,
            next_cursor: nextCursor || undefined,
          },
        }
      );

      const { resources = [], next_cursor } = response.data;
      allResources.push(...resources);
      nextCursor = next_cursor;

      console.log("Получено", resources.length, "изображений");
    } while (nextCursor);

    console.log("Итого получено из Cloudinary:", allResources.length);
    return allResources;
  } catch (error) {
    console.error("Ошибка при получении изображений из Cloudinary:", error);
    return [];
  }
}
