const axios = require('axios');
const tokenService = require('./tokenService');
const PLM_CONFIG = require('../config/plm.config');

class PLMService {
  constructor() {
    this.baseUrl = PLM_CONFIG.plmBaseUrl;
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
