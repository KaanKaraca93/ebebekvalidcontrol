const express = require('express');
const router = express.Router();
const { getEnv } = require('../services/envFactory');
const { runBusinessRules } = require('../services/businessRules');

/**
 * POST /api/style/process
 *
 * Input (Infor ION schema):
 *   { "StyleId": "44562", "BrandId": 13, "Status": 1, "Filter": "...",
 *     "environment": "PRD", "Schema": "FSH4" }
 *
 * Yönlendirme:
 *   environment === 'PRD' && Schema === 'FSH4'  → PRD (canlı)
 *   diğer tüm senaryolar                        → TST
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

  const { environment, Schema } = req.body;
  const { plmService, plmPatchService, envName } = getEnv(environment, Schema);

  const result = {
    styleId,
    env:              envName,
    styleCode:        null,
    variantType:      null,
    validation:       null,
    patch:            { attempted: false, httpStatus: null, targetStatus: null, error: null },
    sync:             { attempted: false, httpStatus: null, error: null },
    timestamp:        new Date().toISOString()
  };

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`▶  [${envName}] Süreç başlıyor → StyleId: ${styleId}`);

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

    const validation = runBusinessRules(style, stylePackData);
    result.validation = {
      isValid: validation.isValid,
      errors:  validation.errors,
      details: validation.details
    };

    console.log(validation.isValid
      ? `✅ [${envName}] Validasyon BAŞARILI – ${style.StyleCode}`
      : `❌ [${envName}] Validasyon BAŞARISIZ – ${style.StyleCode} | ${validation.errors.length} hata`
    );

    result.patch.attempted = true;
    try {
      const patchResult = await plmPatchService.patchStyleStatus(styleId, validation.isValid, etag);
      result.patch.httpStatus   = patchResult.status;
      result.patch.targetStatus = patchResult.targetStatus;

      if (patchResult.status === 204) {
        result.sync.attempted = true;
        try {
          const syncResult = await plmPatchService.syncSearchData(styleId);
          result.sync.httpStatus = syncResult.status;
        } catch (syncErr) {
          result.sync.httpStatus = syncErr.httpStatus || null;
          result.sync.error      = syncErr.message;
          console.warn(`⚠️  [${envName}] syncSearchData başarısız, süreç devam ediyor`);
        }
      } else {
        console.warn(`⚠️  [${envName}] PATCH ${patchResult.status} döndü (204 değil) – sync atlandı`);
      }

    } catch (patchErr) {
      result.patch.httpStatus = patchErr.httpStatus || null;
      result.patch.error      = patchErr.message;
      console.warn(`⚠️  [${envName}] PATCH başarısız, yine de 200 dönülüyor`);
    }

  } catch (error) {
    console.error(`[${envName}] Süreç hatası:`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }

  console.log(`▶  [${envName}] Süreç tamamlandı → ${result.styleCode} | valid: ${result.validation?.isValid}`);
  console.log(`${'='.repeat(60)}\n`);

  res.status(200).json({ success: true, ...result });
});

/**
 * GET /api/style/:styleId/validate
 * Sadece validasyon – patch yapmaz (debug/test için)
 * Query param: ?env=PRD&schema=FSH4 → PRD ortamına gider
 */
router.get('/:styleId/validate', async (req, res) => {
  const styleId = parseInt(req.params.styleId, 10);
  if (isNaN(styleId)) {
    return res.status(400).json({ success: false, error: 'Geçersiz styleId' });
  }

  const { env, schema } = req.query;
  const { plmService, envName } = getEnv(env, schema);

  try {
    console.log(`\n🔍 [${envName}] Validasyon başlıyor → StyleId: ${styleId}`);

    const [style, stylePackData] = await Promise.all([
      plmService.getStyle(styleId),
      plmService.getStylePackV2(styleId)
    ]);

    if (!style) {
      return res.status(404).json({ success: false, error: `StyleId ${styleId} bulunamadı` });
    }

    const result = runBusinessRules(style, stylePackData);
    console.log(result.isValid
      ? `✅ [${envName}] Validasyon BAŞARILI – ${style.StyleCode}`
      : `❌ [${envName}] Validasyon BAŞARISIZ – ${style.StyleCode} | ${result.errors.length} hata`
    );

    res.status(result.isValid ? 200 : 422).json({
      success: result.isValid,
      env: envName,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${envName}] Validasyon hatası:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/style/:styleId
 * Ham PLM verisi (debug için)
 * Query param: ?env=PRD&schema=FSH4 → PRD ortamına gider
 */
router.get('/:styleId', async (req, res) => {
  const styleId = parseInt(req.params.styleId, 10);
  if (isNaN(styleId)) {
    return res.status(400).json({ success: false, error: 'Geçersiz styleId' });
  }

  const { env, schema } = req.query;
  const { plmService, envName } = getEnv(env, schema);

  try {
    const style = await plmService.getStyle(styleId);
    if (!style) {
      return res.status(404).json({ success: false, error: `StyleId ${styleId} bulunamadı` });
    }
    res.json({ success: true, env: envName, data: style });
  } catch (error) {
    console.error(`[${envName}] GET style hatası:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
