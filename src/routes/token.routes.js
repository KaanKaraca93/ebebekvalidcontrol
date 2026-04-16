const express = require('express');
const router = express.Router();
const { envs } = require('../services/envFactory');

// Token route'ları varsayılan olarak TST ortamını yönetir.
// ?env=PRD query param'ı ile PRD token'ına erişilebilir (debug için).
function resolveTokenService(req) {
  return req.query.env === 'PRD' ? envs.prd.tokenService : envs.tst.tokenService;
}

router.get('/token', async (req, res) => {
  const tokenService = resolveTokenService(req);
  try {
    const token = await tokenService.getAccessToken();
    const info = tokenService.getTokenInfo();
    res.json({
      success: true,
      accessToken: token,
      tokenType: info.tokenType,
      expiresAt: info.expiresAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/token/info', (req, res) => {
  const tokenService = resolveTokenService(req);
  res.json({ success: true, ...tokenService.getTokenInfo() });
});

router.post('/token/refresh', async (req, res) => {
  const tokenService = resolveTokenService(req);
  try {
    if (tokenService.getTokenInfo().hasToken) await tokenService.revokeToken();
    const token = await tokenService.getAccessToken();
    const info = tokenService.getTokenInfo();
    res.json({
      success: true,
      message: 'Token yenilendi',
      accessToken: token,
      tokenType: info.tokenType,
      expiresAt: info.expiresAt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
