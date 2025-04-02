// functions/index.js

const functions = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { v2: cloudinary } = require("cloudinary");

initializeApp();

// Настройка Cloudinary
cloudinary.config({
  cloud_name: "dwulwgihw",
  api_key: "593255834195831",
  api_secret: "m7JfPeg48L94SujIuZus52E2TMM"
});

/**
 * Возвращает ВСЕ изображения из Cloudinary (с paginated fetch)
 */
exports.listCloudinaryImages = onCall(async () => {
  const allImages = [];

  let nextCursor = undefined;
  try {
    do {
      const res = await cloudinary.api.resources({
        type: "upload",
        max_results: 100,
        next_cursor: nextCursor
        // prefix: "blob_" — удаляем
      });

      allImages.push(...res.resources);
      nextCursor = res.next_cursor;
    } while (nextCursor);

    return {
      images: allImages.map((img) => ({
        public_id: img.public_id,
        secure_url: img.secure_url,
        created_at: img.created_at
      }))
    };
  } catch (error) {
    console.error("Ошибка при получении изображений:", error);
    throw new functions.HttpsError("internal", "Ошибка загрузки из Cloudinary");
  }
});
exports.deleteCloudinaryImage = onCall(async (data, context) => {
  const publicId = data.public_id;
  if (!publicId) {
    throw new functions.HttpsError("invalid-argument", "public_id обязателен");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { result };
  } catch (error) {
    console.error("Ошибка удаления изображения:", error);
    throw new functions.HttpsError("internal", "Ошибка удаления");
  }
});