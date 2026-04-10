/**
 * İş Kuralları Servisi
 *
 * Kural 1 – Varyant Tipi (MarketField5.Code) — her iki taraf kontrol edilir
 *
 *   S  → Beden varyantlı :
 *          • En az 1 SizeCode ≠ 'NOSIZE' olan beden olmalı
 *          • Tüm renkler NOC olmalı (Code = 'NOC')
 *
 *   R  → Renk varyantlı :
 *          • En az 1 Code ≠ 'NOC' olan renk olmalı
 *          • Tüm bedenler NOSIZE olmalı (SizeCode = 'NOSIZE')
 *
 *   RB → Renk + Beden :
 *          • En az 1 Code ≠ 'NOC' olan renk olmalı
 *          • En az 1 SizeCode ≠ 'NOSIZE' olan beden olmalı
 *
 *   N  → Varyantsız :
 *          • Tüm renkler NOC olmalı
 *          • Tüm bedenler NOSIZE olmalı
 *
 * Kural 2 – Aktif SKU    : en az 1 aktif StyleSKU (Status=1, IsDeleted=0)
 *
 * Kural 3 – POM ölçüleri : tüm StyleMeasurementPomSizes.GradeMeasMetric > 0
 */

const NOC_CODE   = 'NOC';
const NOSIZE_CODE = 'NOSIZE';

// ─── Yardımcı: StyleSizeRanges → tüm StyleSizes (benzersiz SizeId'ler) ───────
function collectSizes(style) {
  const seen = new Set();
  const result = [];

  for (const sr of style.StyleSizeRanges || []) {
    for (const ss of sr.StyleSizes || []) {
      if (!seen.has(ss.SizeId)) {
        seen.add(ss.SizeId);
        result.push({
          sizeId:   ss.SizeId,
          sizeCode: ss.Size?.SizeCode || null,
          sizeName: ss.Size?.Name    || null,
          isDeactivated: ss.IsDeactivated || false
        });
      }
    }
  }
  return result;
}

// ─── Yardımcı: aktif (deactivated olmayan) bedenler ──────────────────────────
function activeSizes(sizes) {
  return sizes.filter(s => !s.isDeactivated);
}

// ─── Yardımcı: SizeCode = 'NOSIZE' mi? ───────────────────────────────────────
function isNoSize(size) {
  return size.sizeCode === NOSIZE_CODE;
}

// ─── Yardımcı: renk listesi özeti ────────────────────────────────────────────
function colorSummary(colorways) {
  return colorways.map(c => c.Code).join(', ') || 'yok';
}

// ─── Yardımcı: beden listesi özeti ───────────────────────────────────────────
function sizeSummary(sizes) {
  return sizes.map(s => s.sizeCode || s.sizeName || s.sizeId).join(', ') || 'yok';
}

// ─── Kural 1: Varyant tipi kontrolü ─────────────────────────────────────────
function checkVariantType(style) {
  const errors = [];

  const marketField5 = style.MarketField5;
  if (!marketField5 || !marketField5.Code) {
    return ['MarketField5.Code alanı boş veya tanımsız – varyant tipi belirlenemiyor'];
  }

  const variantType = marketField5.Code.trim().toUpperCase();
  const colorways   = style.StyleColorways || [];
  const sizes       = activeSizes(collectSizes(style));

  const nonNocColors   = colorways.filter(c => c.Code !== NOC_CODE);
  const nocColors      = colorways.filter(c => c.Code === NOC_CODE);
  const nonNosizeSizes = sizes.filter(s => !isNoSize(s));
  const nosizeSizes    = sizes.filter(s => isNoSize(s));

  switch (variantType) {

    case 'S':
      // Beden tarafı: en az 1 gerçek beden
      if (nonNosizeSizes.length === 0) {
        errors.push(
          `Varyant tipi S (Beden): NOSIZE dışında en az bir beden olmalıdır. ` +
          `Mevcut bedenler: ${sizeSummary(sizes)}`
        );
      }
      // Renk tarafı: tümü NOC olmalı (sahte renk)
      if (nonNocColors.length > 0) {
        errors.push(
          `Varyant tipi S (Beden): Renk tarafında yalnızca NOC rengi olmalıdır. ` +
          `NOC dışı renkler: ${colorSummary(nonNocColors)}`
        );
      }
      break;

    case 'R':
      // Renk tarafı: en az 1 gerçek renk
      if (nonNocColors.length === 0) {
        errors.push(
          `Varyant tipi R (Renk): NOC dışında en az bir renk olmalıdır. ` +
          `Mevcut renkler: ${colorSummary(colorways)}`
        );
      }
      // Beden tarafı: tümü NOSIZE olmalı (sahte beden)
      if (nonNosizeSizes.length > 0) {
        errors.push(
          `Varyant tipi R (Renk): Beden tarafında yalnızca NOSIZE bedeni olmalıdır. ` +
          `NOSIZE dışı bedenler: ${sizeSummary(nonNosizeSizes)}`
        );
      }
      break;

    case 'RB':
      if (nonNocColors.length === 0) {
        errors.push(
          `Varyant tipi RB (Renk+Beden): NOC dışında en az bir renk olmalıdır. ` +
          `Mevcut renkler: ${colorSummary(colorways)}`
        );
      }
      if (nonNosizeSizes.length === 0) {
        errors.push(
          `Varyant tipi RB (Renk+Beden): NOSIZE dışında en az bir beden olmalıdır. ` +
          `Mevcut bedenler: ${sizeSummary(sizes)}`
        );
      }
      break;

    case 'N':
      if (nonNocColors.length > 0) {
        errors.push(
          `Varyant tipi N (Varyantsız): Tüm renkler NOC olmalıdır. ` +
          `NOC dışı renkler: ${colorSummary(nonNocColors)}`
        );
      }
      if (nocColors.length === 0) {
        errors.push(`Varyant tipi N (Varyantsız): NOC rengi bulunmalıdır.`);
      }
      if (nonNosizeSizes.length > 0) {
        errors.push(
          `Varyant tipi N (Varyantsız): Tüm bedenler NOSIZE olmalıdır. ` +
          `NOSIZE dışı bedenler: ${sizeSummary(nonNosizeSizes)}`
        );
      }
      if (nosizeSizes.length === 0) {
        errors.push(`Varyant tipi N (Varyantsız): NOSIZE bedeni bulunmalıdır.`);
      }
      break;

    default:
      errors.push(`Tanınmayan varyant tipi: "${marketField5.Code}" (beklenen: S, R, RB, N)`);
  }

  return errors;
}

// ─── Kural 2: Aktif SKU ───────────────────────────────────────────────────────
function checkActiveSku(style) {
  const skus = style.StyleSku || style.StyleSKU || [];
  const activeSkus = skus.filter(s => s.Status === 1 && s.IsDeleted === 0);

  if (activeSkus.length === 0) {
    return [
      `En az bir aktif StyleSKU bulunmalıdır. ` +
      `Toplam SKU: ${skus.length}, aktif: 0`
    ];
  }
  return [];
}

// ─── Kural 3: POM ölçü değerleri ─────────────────────────────────────────────
function checkPomMeasurements(style) {
  const errors = [];

  for (const measurement of style.StyleMeasurements || []) {
    for (const pom of measurement.StyleMeasurementPom || []) {
      for (const pomSize of pom.StyleMeasurementPomSizes || []) {
        const val = parseFloat(pomSize.GradeMeasMetric);
        if (isNaN(val) || val <= 0) {
          errors.push(
            `POM ölçüsü doldurulmalıdır – ` +
            `PomCode: ${pom.PomCode} (${pom.PomName}), ` +
            `PomSize Id: ${pomSize.Id}, GradeMeasMetric: ${pomSize.GradeMeasMetric}`
          );
        }
      }
    }
  }

  return errors;
}

// ─── Ana fonksiyon ───────────────────────────────────────────────────────────
function runBusinessRules(style) {
  const variantErrors = checkVariantType(style);
  const skuErrors     = checkActiveSku(style);
  const pomErrors     = checkPomMeasurements(style);
  const allErrors     = [...variantErrors, ...skuErrors, ...pomErrors];

  return {
    styleId:     style.StyleId,
    styleCode:   style.StyleCode,
    variantType: style.MarketField5?.Code || null,
    isValid:     allErrors.length === 0,
    errors:      allErrors,
    details: {
      variantCheck:    { passed: variantErrors.length === 0, errors: variantErrors },
      activeSkuCheck:  { passed: skuErrors.length === 0,    errors: skuErrors },
      pomMeasureCheck: { passed: pomErrors.length === 0,    errors: pomErrors }
    }
  };
}

module.exports = { runBusinessRules };
