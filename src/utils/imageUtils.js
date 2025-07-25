/**
 * Создает миниатюру изображения с заданными размерами и качеством
 * @param {File} file - Файл изображения
 * @param {number} maxDimension - Максимальное измерение для миниатюры
 * @param {number} quality - Качество JPEG (0-1)
 * @returns {Promise<Blob>} - Blob миниатюры
 */
export function createImageThumbnail(file, maxDimension = 300, quality = 0.3) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      // Устанавливаем размеры canvas
      canvas.width = width;
      canvas.height = height;

      // Рисуем изображение на canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Конвертируем в blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Сжимает изображение с заданным качеством
 * @param {File} file - Файл изображения
 * @param {number} quality - Качество JPEG (0-1)
 * @returns {Promise<Blob>} - Сжатое изображение
 */
export function compressImage(file, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Сохраняем оригинальные размеры
      canvas.width = img.width;
      canvas.height = img.height;

      // Рисуем изображение на canvas
      ctx.drawImage(img, 0, 0);

      // Конвертируем в blob с нужным качеством
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Проверяет, является ли файл изображением
 * @param {File} file - Файл для проверки
 * @returns {boolean} - true если файл является изображением
 */
export function isImageFile(file) {
  return file && file.type && file.type.startsWith('image/');
}

/**
 * Создает preview URL для изображения
 * @param {File} file - Файл изображения
 * @returns {string} - URL для preview
 */
export function createImagePreview(file) {
  return URL.createObjectURL(file);
} 