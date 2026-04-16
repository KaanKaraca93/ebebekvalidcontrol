/**
 * PLM / Infor ION API Configuration
 * PRD Environment - Credentials from AutoSAS.ionapi
 */

const PLM_CONFIG_PRD = {
  tenantId: 'HA286TFZ2VY8TRHK_PRD',
  clientName: 'FSH4',

  clientId: 'HA286TFZ2VY8TRHK_PRD~jVqIxgO0vQbUjppuaNrbaQq6vhsxRYiRMZeKKKKu6Ng',
  clientSecret: 'fBFip3OjD6Z3RMyuNQYqhTQIv3_UmoYDtdWS-_yIaBTiDlnSqClZyTJVcqvhHeR_-j8MH4ZAAZRru-f5fFOlJA',

  serviceAccountAccessKey: 'HA286TFZ2VY8TRHK_PRD#HDXi67gj_hnI0rSPyH2ft5_I_UkXUpMee53KL4bSXnJNMB-YxqUdn3i4v0jRCSQeB9KD2TkbMMs2pPcwTEluvw',
  serviceAccountSecretKey: '8ICd0IYTrVXvedE0SxuFyfR4pNJzTcU4MqNL4C4xNQMmSXDAsCZ4iqTVgqLtYyF2F4K2FclqaIF869kO8TPY8Q',

  ionApiUrl: 'https://mingle-ionapi.eu1.inforcloudsuite.com',
  providerUrl: 'https://mingle-sso.eu1.inforcloudsuite.com:443/HA286TFZ2VY8TRHK_PRD/as/',

  endpoints: {
    token: 'token.oauth2',
    revoke: 'revoke_token.oauth2'
  }
};

PLM_CONFIG_PRD.plmBaseUrl = `${PLM_CONFIG_PRD.ionApiUrl}/${PLM_CONFIG_PRD.tenantId}/FASHIONPLM/odata2/api/odata2`;
PLM_CONFIG_PRD.jobBaseUrl = `${PLM_CONFIG_PRD.ionApiUrl}/${PLM_CONFIG_PRD.tenantId}/FASHIONPLM/job/api/job`;

module.exports = PLM_CONFIG_PRD;
