const express = require('express');
const router = express.Router();
const tokenService = require('../services/tokenService');

router.get('/token', async (req, res) => {
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
  res.json({ success: true, ...tokenService.getTokenInfo() });
});

router.post('/token/refresh', async (req, res) => {
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
