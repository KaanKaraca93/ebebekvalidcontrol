/**
 * Ortam Fabrikası
 *
 * Her ortam (TST / PRD) için bağımsız TokenService, PLMService ve
 * PLMPatchService instance'ları tutar. Token cache'leri birbirinden
 * tamamen izole çalışır.
 *
 * Yönlendirme kuralı:
 *   payload.environment === 'PRD' && payload.Schema === 'FSH4'  → PRD
 *   diğer tüm senaryolar                                        → TST
 */

const TokenService    = require('./tokenService');
const PLMService      = require('./plmService');
const PLMPatchService = require('./plmPatchService');

const TST_CONFIG = require('../config/plm.config');
const PRD_CONFIG = require('../config/plm.config.prd');

function createEnv(config) {
  const tokenService    = new TokenService(config);
  const plmService      = new PLMService(tokenService, config);
  const plmPatchService = new PLMPatchService(tokenService, config);
  return { tokenService, plmService, plmPatchService, config };
}

const envs = {
  tst: createEnv(TST_CONFIG),
  prd: createEnv(PRD_CONFIG)
};

/**
 * Payload'a göre doğru ortam servislerini döner.
 * @param {string} [environment]
 * @param {string} [schema]
 * @returns {{ tokenService, plmService, plmPatchService, config, envName: string }}
 */
function getEnv(environment, schema) {
  if (environment === 'PRD' && schema === 'FSH4') {
    return { ...envs.prd, envName: 'PRD' };
  }
  return { ...envs.tst, envName: 'TST' };
}

module.exports = { getEnv, envs };
