// src/utils/cloudinary.js

/**
 * Загрузка одного файла (Blob/File) в Cloudinary
 * Возвращает secure_url (строка)
 */
export async function uploadToCloudinary(file) {
    // Замените на своё:
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
  
    // Если ошибка:
    if (data.error) {
      throw new Error(data.error.message || "Cloudinary upload failed");
    }
  
    // Возвращаем только secure_url
    return data.secure_url;
  }