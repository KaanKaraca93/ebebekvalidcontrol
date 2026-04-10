const express = require('express');
const router = express.Router();
const plmService = require('../services/plmService');
const plmPatchService = require('../services/plmPatchService');
const { runBusinessRules } = require('../services/businessRules');

/**
 * POST /api/style/process
 *
 * Input (Infor ION schema):
 *   { "StyleId": "44562", "BrandId": 13, "Status": 1, "Filter": "..." }
 *
 * Akış:
 *   1. PLM'den style GET
 *   2. İş kuralları validasyonu
 *   3. PATCH STYLE(styleId) → Status 119 (geçerli) veya 117 (geçersiz)
 *   4. PATCH 204 ise → POST syncSearchData
 *   5. Her durumda 200 dön
 */
router.post('/process', async (req, res) => {
  const raw = req.body?.StyleId;
  const styleId = parseInt(raw, 10);

  if (!raw || isNaN(styleId)) {
    return res.status(400).json({ success: false, error: 'StyleId zorunludur ve sayısal olmalıdır' });
  }

  const result = {
    styleId,
    styleCode:        null,
    variantType:      null,
    validation:       null,
    patch:            { attempted: false, httpStatus: null, targetStatus: null, error: null },
    sync:             { attempted: false, httpStatus: null, error: null },
    timestamp:        new Date().toISOString()
  };

  try {
    // ── 1. PLM'den style + STPACKV2 paralel GET ────────────────────────────
    console.log(`\n${'='.repeat(60)}`);
    console.log(`▶  Süreç başlıyor → StyleId: ${styleId}`);

    const [style, stylePackData] = await Promise.all([
      plmService.getStyle(styleId),
      plmService.getStylePackV2(styleId)
    ]);

    if (!style) {
      return res.status(404).json({ success: false, error: `StyleId ${styleId} PLM'de bulunamadı` });
    }

    result.styleCode   = style.StyleCode;
    result.variantType = style.MarketField5?.Code || null;
    const etag         = style['@odata.etag'] || null;

    // ── 2. Validasyon ────────────────────────────────────────────────────────
    const validation = runBusinessRules(style, stylePackData);
    result.validation = {
      isValid: validation.isValid,
      errors:  validation.errors,
      details: validation.details
    };

    console.log(validation.isValid
      ? `✅ Validasyon BAŞARILI – ${style.StyleCode}`
      : `❌ Validasyon BAŞARISIZ – ${style.StyleCode} | ${validation.errors.length} hata`
    );

    // ── 3. PATCH Status ──────────────────────────────────────────────────────
    result.patch.attempted = true;
    try {
      const patchResult = await plmPatchService.patchStyleStatus(styleId, validation.isValid, etag);
      result.patch.httpStatus   = patchResult.status;
      result.patch.targetStatus = patchResult.targetStatus;

      // ── 4. syncSearchData (sadece 204 gelirse) ───────────────────────────
      if (patchResult.status === 204) {
        result.sync.attempted = true;
        try {
          const syncResult = await plmPatchService.syncSearchData(styleId);
          result.sync.httpStatus = syncResult.status;
        } catch (syncErr) {
          result.sync.httpStatus = syncErr.httpStatus || null;
          result.sync.error      = syncErr.message;
          console.warn(`⚠️  syncSearchData başarısız, süreç devam ediyor`);
        }
      } else {
        console.warn(`⚠️  PATCH ${patchResult.status} döndü (204 değil) – sync atlandı`);
      }

    } catch (patchErr) {
      result.patch.httpStatus = patchErr.httpStatus || null;
      result.patch.error      = patchErr.message;
      console.warn(`⚠️  PATCH başarısız, yine de 200 dönülüyor`);
    }

  } catch (error) {
    console.error('Süreç hatası:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }

  console.log(`▶  Süreç tamamlandı → ${result.styleCode} | valid: ${result.validation?.isValid}`);
  console.log(`${'='.repeat(60)}\n`);

  // Her durumda 200
  res.status(200).json({ success: true, ...result });
});

/**
 * GET /api/style/:styleId/validate
 * Sadece validasyon – patch yapmaz (debug/test için)
 */
router.get('/:styleId/validate', async (req, res) => {
  const styleId = parseInt(req.params.styleId, 10);
  if (isNaN(styleId)) {
    return res.status(400).json({ success: false, error: 'Geçersiz styleId' });
  }

  try {
    console.log(`\n🔍 Validasyon başlıyor → StyleId: ${styleId}`);

    const [style, stylePackData] = await Promise.all([
      plmService.getStyle(styleId),
      plmService.getStylePackV2(styleId)
    ]);

    if (!style) {
      return res.status(404).json({ success: false, error: `StyleId ${styleId} bulunamadı` });
    }

    const result = runBusinessRules(style, stylePackData);
    console.log(result.isValid
      ? `✅ Validasyon BAŞARILI – ${style.StyleCode}`
      : `❌ Validasyon BAŞARISIZ – ${style.StyleCode} | ${result.errors.length} hata`
    );

    res.status(result.isValid ? 200 : 422).json({
      success: result.isValid,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Validasyon hatası:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/style/:styleId
 * Ham PLM verisi (debug için)
 */
router.get('/:styleId', async (req, res) => {
  const styleId = parseInt(req.params.styleId, 10);
  if (isNaN(styleId)) {
    return res.status(400).json({ success: false, error: 'Geçersiz styleId' });
  }

  try {
    const style = await plmService.getStyle(styleId);
    if (!style) {
      return res.status(404).json({ success: false, error: `StyleId ${styleId} bulunamadı` });
    }
    res.json({ success: true, data: style });
  } catch (error) {
    console.error('GET style hatası:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
