/**
 * PLM / Infor ION API Configuration
 * TRN Environment - Credentials from FSH11.ionapi
 */

const PLM_CONFIG = {
  tenantId: 'HA286TFZ2VY8TRHK_TRN',
  clientName: 'FSH11',

  // OAuth2 client credentials (ci / cs from ionapi)
  clientId: 'HA286TFZ2VY8TRHK_TRN~lbYIgsxR83m7qtFC9u-JSoJemTZ5V-fDI4kyLw3ulVY',
  clientSecret: '4niecxahcZcVe3qkqSSlweP6XYts1hUOmwlG2-qo5hRCvc12GkMYQ8bMmhLfjqUCIKXXZJDAPoydLx0TMoUivw',

  // Service account keys (saak / sask from ionapi)
  serviceAccountAccessKey: 'HA286TFZ2VY8TRHK_TRN#_qrovjBzkj0TVMGwsUOCdb5Qi-WZS7IDybOwS2gQioJq-ODhkeQi6Rnxg0wkoZvtijZwnjsba3qr0xoFcibk4A',
  serviceAccountSecretKey: 'cnEzZMGHDAEyG1lpuxffe8PC90EI0t0nHnDzSQ3uaxS5NGRMyJO6p6NCb0TsvOYuCSYdG-Lz8YO5DmZWAd1GJg',

  // Base URLs
  ionApiUrl: 'https://mingle-ionapi.eu1.inforcloudsuite.com',
  providerUrl: 'https://mingle-sso.eu1.inforcloudsuite.com:443/HA286TFZ2VY8TRHK_TRN/as/',

  // OAuth2 endpoint suffixes
  endpoints: {
    token: 'token.oauth2',
    revoke: 'revoke_token.oauth2'
  }
};

// Derived URLs
PLM_CONFIG.plmBaseUrl = `${PLM_CONFIG.ionApiUrl}/${PLM_CONFIG.tenantId}/FASHIONPLM/odata2/api/odata2`;
PLM_CONFIG.jobBaseUrl = `${PLM_CONFIG.ionApiUrl}/${PLM_CONFIG.tenantId}/FASHIONPLM/job/api/job`;

module.exports = PLM_CONFIG;
