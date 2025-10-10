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

async function fetchImageAsDataUrl(url, maxDimension = 1200) {
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.crossOrigin = 'anonymous';
      image.src = objectUrl;
    });
    const { width, height } = img;
    const scale = Math.min(maxDimension / width, maxDimension / height, 1);
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    URL.revokeObjectURL(objectUrl);
    return dataUrl;
  } catch (_) { return null; }
}

function formatPriceUSD(price) {
  if (!price) return '—';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price); } catch { return String(price); }
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
  if (property.completionDate) fields.push({ text: `${t.propertyDetail.completionDate}:\n${property.completionDate}` });
  if (property.pool) fields.push({ text: `${t.propertyDetail.pool}:\n${translatePoolStatus(property.pool, language)}` });
  if (property.landStatus) fields.push({ text: `${t.propertyDetail.landStatus}:\n${translateLandStatus(property.landStatus, language)}` });
  if (property.managementCompany) fields.push({ text: `${t.propertyDetail.managementCompany}:\n${property.managementCompany}` });
  if (property.reliabilityRating) fields.push({ text: `${t.propertyDetail.reliabilityRating}:\n${property.reliabilityRating}` });
  return fields;
}

function TwoPageProperty({ property, lang, t, coverDataUrl, collageDataUrls, rawCoverUrl, rawRestUrls }) {
  const omitTitle = property.__omitTitle === true;
  const title = omitTitle ? '' : (property.complexResolvedName || property.complex || property.name || property.title || '');
  const fields = getFields(property, lang, t, omitTitle);
  const gridItems = collageDataUrls.slice(0, 9);
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
          {(() => {
            const src = coverDataUrl || rawCoverUrl || null;
            if (src) {
              return <Image src={src} style={{ width: CONTENT_W, height: coverH, alignSelf: 'center', objectFit: 'cover', backgroundColor: '#222' }} />;
            }
            return <View style={{ width: CONTENT_W, height: coverH, alignSelf: 'center', backgroundColor: '#222' }} />;
          })()}
          {!!gridItems.length && (
            <View style={[styles.grid, { marginTop: belowCoverGap, width: CONTENT_W, alignSelf: 'center' }]}>
              {gridItems.map((srcDataUrl, idx) => {
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const mr = col < 2 ? GAP : 0;
                const mb = row < 2 ? GAP : 0;
                const rawUrl = Array.isArray(rawRestUrls) ? rawRestUrls[idx] : null;
                return (
                  <View key={idx} style={{ width: CELL, height: CELL, marginRight: mr, marginBottom: mb }}>
                    {(srcDataUrl || rawUrl) ? (
                      <Image src={srcDataUrl || rawUrl} style={[styles.square, { width: CELL, height: CELL }]} />
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
  // Предзагрузка изображений для всех объектов
  const preloads = await Promise.all(valid.map(async (p) => {
    const images = Array.isArray(p.images) ? p.images : [];
    const cover = images[0] ? await fetchImageAsDataUrl(images[0]) : null;
    const restUrls = images.slice(1, 10);
    const rest = await Promise.all(restUrls.map((u) => fetchImageAsDataUrl(u)));
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


