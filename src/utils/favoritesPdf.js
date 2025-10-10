// Генерация PDF «Избранное» в стиле iOS-приложения
// Стр.1: cover (верх ~33%) + коллаж (до 9 фото)
// Стр.2: заголовок + характеристики

import { Document, Page, View, Text, Image, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { translations } from '../lib/translations';
import { translateDistrict, translatePropertyType, translateConstructionStatus, translateBuildingType, translatePoolStatus, translateOwnership, translateLandStatus } from '../lib/utils';

// Регистрация шрифта с поддержкой кириллицы (Noto Sans)
let FONT_READY = false;
async function ensurePdfFont() {
  if (FONT_READY) return;
  const localRegular = '/fonts/NotoSans-Regular.ttf';
  const localBold = '/fonts/NotoSans-Bold.ttf';
  // Сначала регистрируем локальные файлы напрямую (важно сохранить расширение .ttf в URL)
  try {
    Font.register({
      family: 'NotoSans',
      fonts: [
        { src: localRegular, fontWeight: 'normal' },
        { src: localBold, fontWeight: 'bold' }
      ]
    });
  } catch (e) {
    // Фолбэк на CDN при ошибке
    try {
      Font.register({
        family: 'NotoSans',
        fonts: [
          { src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf', fontWeight: 'normal' },
          { src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Bold.ttf', fontWeight: 'bold' }
        ]
      });
    } catch (_) {}
  }
  FONT_READY = true;
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#000', padding: 0 },
  content: { padding: 20 },
  title: { fontFamily: 'NotoSans', fontWeight: 'bold', fontSize: 33, color: '#fff', textAlign: 'center', marginBottom: 10 },
  grid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' },
  square: { backgroundColor: '#222', objectFit: 'cover' },
  section: { marginTop: 10 },
  field: { color: '#fff', fontSize: 12, lineHeight: 1.3, marginBottom: 8, fontFamily: 'NotoSans' },
  fieldLarge: { color: '#fff', fontSize: 16, marginBottom: 10, fontFamily: 'NotoSans', fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  col: { width: '50%' }
});

const log = (...args) => console.log('[PDF]', ...args);

async function fetchImageAsDataUrl(url, maxDimension = 1200, quality = 0.72) {
  const t0 = performance.now();
  try {
    log('download:start', url);
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) {
      log('download:fail', url, res.status, res.statusText);
      return null;
    }
    const blob = await res.blob();
    log('download:done', url, 'bytes=', blob.size, 'ms=', Math.round(performance.now() - t0));
    const objectUrl = URL.createObjectURL(blob);
    let imgWidth = 0, imgHeight = 0;
    let decodeStart = performance.now();
    // Декодирование изображений: пробуем createImageBitmap, если недоступно — Image()
    let imageBitmap = null;
    try {
      if ('createImageBitmap' in window) {
        imageBitmap = await createImageBitmap(blob);
        imgWidth = imageBitmap.width; imgHeight = imageBitmap.height;
      }
    } catch (e) {
      log('decode:bitmap-failed', url, e?.message || e);
    }
    let dataUrl = null;
    if (imageBitmap) {
      const scale = Math.min(maxDimension / imageBitmap.width, maxDimension / imageBitmap.height, 1);
      const targetW = Math.max(1, Math.round(imageBitmap.width * scale));
      const targetH = Math.max(1, Math.round(imageBitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    } else {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.crossOrigin = 'anonymous';
        image.src = objectUrl;
      });
      imgWidth = img.width; imgHeight = img.height;
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetW, targetH);
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    URL.revokeObjectURL(objectUrl);
    log('decode+encode:done', url, 'srcSize=', imgWidth + 'x' + imgHeight, 'ms=', Math.round(performance.now() - decodeStart), 'totalMs=', Math.round(performance.now() - t0), 'dataUrlLen=', dataUrl?.length || 0);
    return dataUrl;
  } catch (e) {
    log('compress:error', url, e?.message || e);
    return null;
  }
}

async function compressMany(urls, maxDimension, quality) {
  const results = new Array(urls.length).fill(null);
  const concurrency = 3;
  let index = 0;
  async function worker() {
    while (index < urls.length) {
      const i = index++;
      const u = urls[i];
      if (!u) { results[i] = null; continue; }
      // retry до 3 раз с экспоненциальной задержкой
      let attempt = 0; let out = null;
      while (attempt < 3 && !out) {
        attempt++;
        out = await fetchImageAsDataUrl(u, maxDimension, quality);
        if (!out) {
          const delay = 300 * attempt;
          log('retry', attempt, 'in', delay, 'ms for', u);
          await new Promise(r => setTimeout(r, delay));
        }
      }
      results[i] = out;
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function formatPriceUSD(price) {
  if (!price) return '—';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price); } catch { return String(price); }
}

function normalizeToDate(input) {
  try {
    if (!input) return null;
    // Firestore Timestamp object
    if (typeof input === 'object') {
      if (typeof input.toDate === 'function') return input.toDate();
      if (typeof input.seconds === 'number') return new Date(input.seconds * 1000);
      if (typeof input._seconds === 'number') return new Date(input._seconds * 1000);
    }
    if (typeof input === 'number') {
      const ms = input > 1e12 ? input : input * 1000; // seconds or ms
      return new Date(ms);
    }
    if (typeof input === 'string') {
      // Try Timestamp(seconds=..., ...)
      const m = input.match(/seconds\s*=\s*(\d{6,})/i);
      if (m) return new Date(parseInt(m[1], 10) * 1000);
      const t = Date.parse(input);
      if (!Number.isNaN(t)) return new Date(t);
    }
  } catch {}
  return null;
}

function formatMonthYearValue(input, language) {
  const d = normalizeToDate(input);
  if (!d) return '—';
  const locale = language === 'ru' ? 'ru-RU' : language === 'id' ? 'id-ID' : 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function getFields(property, language, t, omitTitle) {
  const fields = [];
  fields.push({ large: true, text: formatPriceUSD(property.price) });
  if (property.type) fields.push({ large: true, text: translatePropertyType(String(property.type), language) });
  if (property.district) fields.push({ large: true, text: translateDistrict(String(property.district), language) });

  if (property.bedrooms !== undefined && property.bedrooms !== null && property.bedrooms !== '') {
    const isStudio = (property.bedrooms === 0 || String(property.bedrooms).trim().toLowerCase() === 'студия');
    fields.push({ text: `${t.propertiesGallery.bedroomsLabel}:\n${isStudio ? t.propertiesGallery.studio : property.bedrooms}` });
  }
  if (property.area) fields.push({ text: `${t.propertiesGallery.areaLabel}:\n${property.area} ${t.propertiesGallery.areaText}` });
  if (!omitTitle && property.developer) fields.push({ text: `${t.propertyDetail.developer}:\n${property.developer}` });
  if (property.ownershipForm) fields.push({ text: `${t.propertyDetail.ownership}:\n${translateOwnership(property.ownershipForm, language)}` });
  if (property.buildingType) fields.push({ text: `${t.propertyDetail.buildingType}:\n${translateBuildingType(String(property.buildingType), language)}` });
  if (property.status) fields.push({ text: `${t.propertiesGallery.statusLabel}:\n${translateConstructionStatus(String(property.status), language)}` });
  if (property.completionDate) fields.push({ text: `${t.propertyDetail.completionDate}:\n${formatMonthYearValue(property.completionDate, language)}` });
  if (property.pool) fields.push({ text: `${t.propertyDetail.pool}:\n${translatePoolStatus(property.pool, language)}` });
  if (property.landStatus) fields.push({ text: `${t.propertyDetail.landStatus}:\n${translateLandStatus(property.landStatus, language)}` });
  if (property.managementCompany) fields.push({ text: `${t.propertyDetail.managementCompany}:\n${property.managementCompany}` });
  if (property.reliabilityRating) fields.push({ text: `${t.propertyDetail.reliabilityRating}:\n${property.reliabilityRating}` });
  return fields;
}

function TwoPageProperty({ property, lang, t, coverDataUrl, collageDataUrls }) {
  const omitTitle = property.__omitTitle === true;
  const title = omitTitle ? '' : (property.complexResolvedName || property.complex || property.name || property.title || '');
  const fields = getFields(property, lang, t, omitTitle);
  const gridDataUrls = Array.isArray(collageDataUrls) ? collageDataUrls : [];
  const gridCount = Math.min(9, gridDataUrls.length);
  // Геометрия A4 и вычисление коллажа 3x3 так, чтобы всё поместилось на первой странице
  const PAGE_W = 595; // pt
  const PAGE_H = 842; // pt
  const PAD = 20;
  const CONTENT_W = PAGE_W - PAD * 2;
  const CONTENT_H = PAGE_H - PAD * 2;
  const GAP = 8;
  const coverH = Math.floor(CONTENT_H * 0.33);
  const belowCoverGap = 10;
  const collageAvailH = CONTENT_H - coverH - belowCoverGap;
  const cellWByWidth = Math.floor((CONTENT_W - GAP * 2) / 3);
  const cellWByHeight = Math.floor((collageAvailH - GAP * 2) / 3);
  const CELL = Math.min(cellWByWidth, cellWByHeight);
  // Геометрия сетки характеристик: 3 колонки
  const COL_GAP = 24;
  const COL_W = Math.floor((CONTENT_W - COL_GAP * 2) / 3);
  return (
    <>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {coverDataUrl
            ? <Image src={coverDataUrl} style={{ width: CONTENT_W, height: coverH, alignSelf: 'center', objectFit: 'cover', backgroundColor: '#222', imageRendering: 'optimizeQuality' }} />
            : <View style={{ width: CONTENT_W, height: coverH, alignSelf: 'center', backgroundColor: '#222' }} />}
          {gridCount > 0 && (
            <View style={[styles.grid, { marginTop: belowCoverGap, width: CONTENT_W, alignSelf: 'center' }]}>
              {Array.from({ length: gridCount }).map((_, idx) => {
                const srcDataUrl = gridDataUrls[idx];
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const mr = col < 2 ? GAP : 0;
                const mb = row < 2 ? GAP : 0;
                return (
                  <View key={idx} style={{ width: CELL, height: CELL, marginRight: mr, marginBottom: mb }}>
                    {srcDataUrl ? (
                      <Image src={srcDataUrl} style={[styles.square, { width: CELL, height: CELL, imageRendering: 'optimizeQuality' }]} />
                    ) : (
                      <View style={{ width: CELL, height: CELL, backgroundColor: '#222' }} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          <View style={{ marginTop: 6, width: CONTENT_W, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
            {fields.map((f, i) => {
              const col = i % 3;
              const mr = col < 2 ? COL_GAP : 0;
              return (
                <View key={i} style={{ width: COL_W, marginRight: mr, marginBottom: 10 }}>
                  <Text style={f.large ? styles.fieldLarge : styles.field}>{f.text}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Page>
    </>
  );
}

export async function generateFavoritesPdf(properties, lang = 'ru') {
  const valid = Array.isArray(properties) ? properties : [];
  if (!valid.length) throw new Error('No properties');

  const t = translations[lang] || translations.ru;
  // Гарантируем регистрацию шрифтов один раз
  await ensurePdfFont();
  // 1) СЖАТИЕ ВСЕХ ИЗОБРАЖЕНИЙ ДО НАЧАЛА РЕНДЕРА
  // ЖДЁМ ПОЛНОГО СЖАТИЯ ДЛЯ КАЖДОГО ОБЪЕКТА (без фолбэков на «сырые» URL), с подробным логом
  const preloads = await Promise.all(valid.map(async (p) => {
    const images = Array.isArray(p.images) ? p.images : [];
    const coverUrl = images[0] || null;
    const restUrls = images.slice(1, 10);
    log('object:start', p.id, { coverUrl, restCount: restUrls.length });
    // Поднимаем качество обложки ещё на шаг
    const cover = coverUrl ? await fetchImageAsDataUrl(coverUrl, 1600, 0.80) : null;
    const rest = await compressMany(restUrls, 600, 0.70);
    log('object:compressed', p.id, { coverOk: !!cover, restOk: rest.every(Boolean) });
    if (!cover) {
      throw new Error('cover_compress_failed');
    }
    if (restUrls.length && rest.some(v => !v)) {
      throw new Error('grid_compress_failed');
    }
    return { cover, rest };
  }));

  const doc = (
    <Document title="Favorites">
      {valid.map((p, idx) => (
        <TwoPageProperty
          key={p.id || idx}
          property={p}
          lang={lang}
          t={t}
          coverDataUrl={preloads[idx].cover}
          collageDataUrls={preloads[idx].rest}
          rawCoverUrl={(Array.isArray(p.images) && p.images[0]) || null}
          rawRestUrls={(Array.isArray(p.images) && p.images.slice(1, 10)) || []}
        />
      ))}
    </Document>
  );

  // Защита от подвисания генерации: таймаут
  const toBlobPromise = pdf(doc).toBlob();
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 60000));
  const blob = await Promise.race([toBlobPromise, timeoutPromise]);
  return blob;
}

export async function downloadFavoritesPdf(properties, lang = 'ru') {
  const blob = await generateFavoritesPdf(properties, lang);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `favorites_${date}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


