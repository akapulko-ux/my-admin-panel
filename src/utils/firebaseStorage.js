import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

/**
 * Загружает файл в Firebase Storage и возвращает публичный URL.
 * @param {File|Blob} file - Файл для загрузки.
 * @returns {Promise<string>} - Публичный URL загруженного файла.
 */
export async function uploadToFirebaseStorage(file) {
  if (!file) {
    throw new Error("Файл не передан");
  }

  // Получаем экземпляр приложения Firebase
  const app = getApp();
  // Явно указываем нужный bucket. Замените URL на ваш, если потребуется.
  const storage = getStorage(app, "gs://bali-estate-1130f.firebasestorage.app");
  // Формируем уникальное имя файла (используем текущее время и оригинальное имя файла)
  const uniqueName = `${Date.now()}-${file.name}`;
  const fileRef = ref(storage, `uploads/${uniqueName}`);

  try {
    // Загружаем файл в Firebase Storage
    const snapshot = await uploadBytes(fileRef, file);
    // Получаем публичный URL загруженного файла
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Ошибка загрузки файла в Firebase Storage:", error);
    throw error;
  }
}