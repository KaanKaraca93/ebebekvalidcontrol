const axios = require('axios');
const tokenService = require('./tokenService');
const PLM_CONFIG = require('../config/plm.config');

class PLMService {
  constructor() {
    this.baseUrl = PLM_CONFIG.plmBaseUrl;
  }

  /**
   * StyleId için STPACKV2 (barkod paketleri) verisini çeker.
   * Name='ADT' filtreli — tüm paketlerde en az 1 StylePackContent olmalı.
   * Style üzerinden expand yapılamadığı için ayrı çağrı gerekir.
   */
  async getStylePackV2(styleId) {
    const authHeader = await tokenService.getAuthorizationHeader();

    const query = [
      `$filter=StyleId eq ${styleId} and Name eq 'ADT'`,
      `$expand=StylePackContent($select=StylePackContentId)`,
      `$select=StylePackId,StyleId`
    ].join('&');

    const url = `${this.baseUrl}/STPACKV2?${query}`;

    console.log(`📡 PLM GET STPACKV2 → StyleId: ${styleId}`);

    try {
      const response = await axios.get(url, {
        headers: { Authorization: authHeader, Accept: 'application/json' }
      });
      return response.data?.value || [];
    } catch (error) {
      const detail = error.response
        ? `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`
        : error.message;
      throw new Error(`PLM GET STPACKV2 hatası: ${detail}`);
    }
  }

  /**
   * StyleId'ye göre PLM'den style verisi çeker.
   * OData query: MarketField5, Brand, Colorways, SizeRanges, SKU, Measurements (POM dahil)
   */
  async getStyle(styleId) {
    const authHeader = await tokenService.getAuthorizationHeader();

    const expand = [
      'marketfield5',
      'Brand',
      'StyleColorways',
      'StyleSizeranges($expand=Stylesizes($expand=Size))',
      'StyleSKU',
      [
        'StyleMeasurements(',
          '$select=Id,IsMain,StyleId;',
          '$expand=',
            'StyleMeasurementSizes(',
              '$select=Id,StyleMeasurementId,SizeId,Seq;',
              '$expand=Size($select=SizeId,Name)',
            '),',
            'StyleMeasurementPom(',
              '$select=Id,GradeRuleId,Priority,Seq,PomCode,PomName,Description,ToleranceMinusMetric,TolerancePlusMetric;',
              '$expand=',
                'StyleMeasurementPomSizes($select=Id,StyleMeasurementSizeId,GradeMeasMetric),',
                'StyleMeasurementPOMCultureInfos',
            ')',
        ')'
      ].join('')
    ].join(',');

    const query = `$select=StyleId,StyleCode&$filter=StyleId eq ${styleId}&$expand=${expand}`;
    const url = `${this.baseUrl}/STYLE?${query}`;

    console.log(`📡 PLM GET Style → StyleId: ${styleId}`);

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json'
        }
      });

      const items = response.data?.value;
      if (!items || items.length === 0) {
        return null;
      }

      return items[0];
    } catch (error) {
      const detail = error.response
        ? `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`
        : error.message;
      throw new Error(`PLM GET Style hatası: ${detail}`);
    }
  }
}

module.exports = new PLMService();
