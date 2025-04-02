/**
 * Загрузка одного файла (Blob/File) в Cloudinary
 * Возвращает secure_url (строка)
 */
export async function uploadToCloudinary(file) {
  const CLOUD_NAME = "dwulwgihw";
  const UPLOAD_PRESET = "ml_default";

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const resp = await fetch(url, {
    method: "POST",
    body: formData
  });
  const data = await resp.json();

  if (data.error) {
    throw new Error(data.error.message || "Cloudinary upload failed");
  }

  return data.secure_url;
}

/**
 * Константы Cloudinary API для админских запросов
 */
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY,
  apiSecret: process.env.REACT_APP_CLOUDINARY_API_SECRET
};
