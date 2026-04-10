const axios = require('axios');
const tokenService = require('./tokenService');
const PLM_CONFIG = require('../config/plm.config');

// Validasyon başarılı → 119, başarısız → 117
const STATUS_VALID   = 119;
const STATUS_INVALID = 117;

class PLMPatchService {

  /**
   * STYLE(styleId) kaydına Status patch'i atar.
   * @param {number} styleId
   * @param {boolean} isValid
   * @param {string|null} etag  - GET'ten gelen @odata.etag (opsiyonel)
   * @returns {{ status: number, targetStatus: number }}
   */
  async patchStyleStatus(styleId, isValid, etag = null) {
    const targetStatus = isValid ? STATUS_VALID : STATUS_INVALID;
    const url = `${PLM_CONFIG.plmBaseUrl}/STYLE(${styleId})`;

    console.log(`📤 PATCH STYLE(${styleId}) → Status: ${targetStatus} (${isValid ? 'GEÇERLİ' : 'GEÇERSİZ'})`);
    console.log(`   URL: ${url}`);

    const authHeader = await tokenService.getAuthorizationHeader();
    const headers = {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (etag) {
      headers['If-Match'] = etag;
    }

    try {
      const response = await axios.patch(url, { Status: targetStatus }, { headers });
      console.log(`✅ PATCH tamamlandı → HTTP ${response.status}`);
      return { status: response.status, targetStatus };
    } catch (error) {
      const httpStatus = error.response?.status;
      const detail = error.response
        ? `HTTP ${httpStatus} - ${JSON.stringify(error.response.data)}`
        : error.message;
      console.error(`❌ PATCH hatası: ${detail}`);
      // Hata fırlat, üstte yakalanır
      throw Object.assign(new Error(`PATCH Style hatası: ${detail}`), { httpStatus });
    }
  }

  /**
   * syncSearchData job'ını tetikler.
   * @param {number} styleId
   * @returns {{ status: number }}
   */
  async syncSearchData(styleId) {
    const url = `${PLM_CONFIG.jobBaseUrl}/tasks`;

    const payload = {
      TaskId: 'syncSearchData',
      IsSystem: true,
      CustomData: [
        { key: 'cluster',             value: 'styleoverview' },
        { key: 'moduleId',            value: String(styleId) },
        { key: 'schema',              value: PLM_CONFIG.clientName },
        { key: 'updateOrgLevelPath',  value: 'true' }
      ],
      Sequence: 1
    };

    console.log(`📤 POST syncSearchData → StyleId: ${styleId}`);
    console.log(`   URL: ${url}`);

    const authHeader = await tokenService.getAuthorizationHeader();

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });
      console.log(`✅ syncSearchData tamamlandı → HTTP ${response.status}`);
      return { status: response.status };
    } catch (error) {
      const httpStatus = error.response?.status;
      const detail = error.response
        ? `HTTP ${httpStatus} - ${JSON.stringify(error.response.data)}`
        : error.message;
      console.error(`❌ syncSearchData hatası: ${detail}`);
      throw Object.assign(new Error(`syncSearchData hatası: ${detail}`), { httpStatus });
    }
  }
}

module.exports = new PLMPatchService();
module.exports.STATUS_VALID   = STATUS_VALID;
module.exports.STATUS_INVALID = STATUS_INVALID;
