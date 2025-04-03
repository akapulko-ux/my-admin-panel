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
 * Эта версия использует объект URL для извлечения пути файла.
 * @param {string} fileUrl - Публичный URL файла.
 * @returns {Promise<void>}
 */
export async function deleteFileFromFirebaseStorage(fileUrl) {
  if (!fileUrl) throw new Error("URL не передан");

  try {
    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname; // например: /v0/b/bali-estate-1130f.firebasestorage.app/o/landmarks%2F1743665251256-image_1.jpg
    const idx = pathname.indexOf("/o/");
    if (idx === -1) {
      throw new Error("Не удалось извлечь путь файла из URL");
    }
    const filePathEncoded = pathname.substring(idx + 3); // после "/o/"
    const filePath = decodeURIComponent(filePathEncoded); // получим "landmarks/1743665251256-image_1.jpg"
    
    const app = getApp();
    const storage = getStorage(app, "gs://bali-estate-1130f.firebasestorage.app");
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log(`Файл ${filePath} успешно удалён из Storage`);
  } catch (error) {
    console.error("Ошибка удаления файла из Firebase Storage:", error);
    throw error;
  }
}