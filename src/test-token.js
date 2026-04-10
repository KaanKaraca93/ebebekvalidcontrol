/**
 * Standalone token testi - sunucu gerektirmez
 * node src/test-token.js
 */

const axios = require('axios');

const PLM_CONFIG = {
  clientId: 'HA286TFZ2VY8TRHK_TRN~lbYIgsxR83m7qtFC9u-JSoJemTZ5V-fDI4kyLw3ulVY',
  clientSecret: '4niecxahcZcVe3qkqSSlweP6XYts1hUOmwlG2-qo5hRCvc12GkMYQ8bMmhLfjqUCIKXXZJDAPoydLx0TMoUivw',
  serviceAccountAccessKey: 'HA286TFZ2VY8TRHK_TRN#_qrovjBzkj0TVMGwsUOCdb5Qi-WZS7IDybOwS2gQioJq-ODhkeQi6Rnxg0wkoZvtijZwnjsba3qr0xoFcibk4A',
  serviceAccountSecretKey: 'cnEzZMGHDAEyG1lpuxffe8PC90EI0t0nHnDzSQ3uaxS5NGRMyJO6p6NCb0TsvOYuCSYdG-Lz8YO5DmZWAd1GJg',
  tokenUrl: 'https://mingle-sso.eu1.inforcloudsuite.com:443/HA286TFZ2VY8TRHK_TRN/as/token.oauth2'
};

async function testToken() {
  console.log('🔐 TRN Ortamı Token Testi');
  console.log('='.repeat(50));
  console.log(`📡 Token URL: ${PLM_CONFIG.tokenUrl}`);
  console.log('');

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', PLM_CONFIG.serviceAccountAccessKey);
  params.append('password', PLM_CONFIG.serviceAccountSecretKey);

  const basicAuth = Buffer.from(
    `${PLM_CONFIG.clientId}:${PLM_CONFIG.clientSecret}`
  ).toString('base64');

  try {
    console.log('⏳ Token isteniyor...');
    const start = Date.now();

    const response = await axios.post(PLM_CONFIG.tokenUrl, params, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const elapsed = Date.now() - start;
    const { access_token, token_type, expires_in, scope } = response.data;

    console.log(`✅ TOKEN ALINDI! (${elapsed}ms)`);
    console.log('');
    console.log(`   Token tipi  : ${token_type}`);
    console.log(`   Geçerlilik  : ${expires_in} saniye (~${Math.round(expires_in / 60)} dakika)`);
    console.log(`   Scope       : ${scope || '-'}`);
    console.log(`   Token (ilk 80 karakter):`);
    console.log(`   ${access_token.substring(0, 80)}...`);
    console.log('');
    console.log('🎉 TRN ortamına başarıyla bağlanıldı!');

  } catch (error) {
    console.error('❌ TOKEN ALINAMADI!');
    if (error.response) {
      console.error(`   HTTP Status : ${error.response.status}`);
      console.error(`   Hata        : ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Hata        : ${error.message}`);
    }
    process.exit(1);
  }
}

testToken();
