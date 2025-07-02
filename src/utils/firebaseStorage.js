import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getApp } from "firebase/app";

/**
 * Загружает файл в Firebase Storage в папку по умолчанию ("uploads")
 * и возвращает публичный URL.
 * @param {File|Blob} file - Файл для загрузки.
 * @returns {Promise<string>} - Публичный URL загруженного файла.
 */
export async function uploadToFirebaseStorage(file) {
  return uploadToFirebaseStorageInFolder(file, "uploads");
}

/**
 * Загружает файл в Firebase Storage в указанную папку и возвращает публичный URL.
 * @param {File|Blob} file - Файл для загрузки.
 * @param {string} folder - Путь к папке, в которую нужно загрузить файл.
 * @returns {Promise<string>} - Публичный URL загруженного файла.
 */
export async function uploadToFirebaseStorageInFolder(file, folder = "uploads") {
  if (!file) {
    throw new Error("Файл не передан");
  }
  const app = getApp();
  const storage = getStorage(app, "gs://bali-estate-1130f.firebasestorage.app");
  const uniqueName = `${Date.now()}-${file.name}`;
  const fileRef = ref(storage, `${folder}/${uniqueName}`);

  try {
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Ошибка загрузки файла в Firebase Storage:", error);
    throw error;
  }
}

/**
 * Удаляет файл из Firebase Storage по его публичному URL.
 * @param {string} fileUrl - Публичный URL файла.
 * @returns {Promise<void>}
 */
export async function deleteFileFromFirebaseStorage(fileUrl) {
  if (!fileUrl) throw new Error("URL не передан");

  try {
    console.log("Начинаем удаление файла:", fileUrl);
    
    // Firebase Storage URL имеет формат:
    // https://firebasestorage.googleapis.com/v0/b/[project-id].appspot.com/o/[path]?alt=media&token=[token]
    const url = new URL(fileUrl);
    console.log("Разобранный URL:", {
      href: url.href,
      pathname: url.pathname,
      search: url.search
    });
    
    // Извлекаем путь файла из pathname
    const parts = url.pathname.split('/o/');
    if (parts.length !== 2) {
      throw new Error("Некорректный формат URL Firebase Storage");
    }
    
    // Декодируем путь файла
    const filePath = decodeURIComponent(parts[1]);
    console.log("Извлеченный путь файла:", filePath);
    
    if (!filePath) {
      throw new Error("Не удалось извлечь путь файла из URL");
    }

    const app = getApp();
    const storage = getStorage(app, "gs://bali-estate-1130f.firebasestorage.app");
    const fileRef = ref(storage, filePath);
    console.log("Создана ссылка на файл:", fileRef.fullPath);
    
    await deleteObject(fileRef);
    console.log(`Файл ${filePath} успешно удалён из Storage`);
  } catch (error) {
    console.error("Подробная информация об ошибке удаления файла:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      url: fileUrl
    });
    throw new Error(`Не удалось удалить файл: ${error.message}`);
  }
}