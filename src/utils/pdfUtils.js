// src/utils/pdfUtils.js

// Импортируем нужные методы из pdfjs-dist (legacy)
// "legacy" – чтобы избежать проблем с ESM/JSX окружением
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf";

// Указываем, где находится pdf.worker (вместо react-pdf).
// Есть несколько вариантов, здесь используем CDN pdfjs-dist:
GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

/**
 * Конвертирует PDF-файл в массив Blob-объектов (по одной странице).
 * @param {File|Blob} file PDF-файл
 * @returns {Promise<Blob[]>} Массив Blob'ов, по одному на каждую страницу
 */
export async function convertPdfToImages(file) {
  // Превращаем файл в ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Загружаем документ
  const pdfDoc = await getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;

  const pageBlobs = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);

    // Масштаб (scale) при рендере страницы
    const viewport = page.getViewport({ scale: 1.0 });

    // Создаём canvas для рендеринга
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Рендерим страницу на canvas
    const renderContext = {
      canvasContext: context,
      viewport
    };
    await page.render(renderContext).promise;

    // Получаем dataURL из canvas
    const dataUrl = canvas.toDataURL("image/jpeg");

    // Превращаем dataURL в Blob
    const blob = dataURLtoBlob(dataUrl);
    pageBlobs.push(blob);
  }

  return pageBlobs;
}

/**
 * Вспомогательная функция: превращает dataURL в Blob
 * @param {string} dataURL
 * @returns {Blob}
 */
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}