const axios = require('axios');
const PLM_CONFIG = require('../config/plm.config');

class TokenService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.tokenType = 'Bearer';
  }

  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) return false;
    const bufferMs = 5 * 60 * 1000;
    return Date.now() < this.tokenExpiry - bufferMs;
  }

  async getAccessToken() {
    if (this.isTokenValid()) {
      console.log('✅ Cached token kullanılıyor');
      return this.accessToken;
    }

    console.log('🔄 Yeni token alınıyor...');
    return await this._fetchNewToken();
  }

  async _fetchNewToken() {
    const tokenUrl = `${PLM_CONFIG.providerUrl}${PLM_CONFIG.endpoints.token}`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', PLM_CONFIG.serviceAccountAccessKey);
    params.append('password', PLM_CONFIG.serviceAccountSecretKey);

    const basicAuth = Buffer.from(
      `${PLM_CONFIG.clientId}:${PLM_CONFIG.clientSecret}`
    ).toString('base64');

    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, token_type, expires_in } = response.data;

      if (!access_token) {
        throw new Error('Yanıtta access_token bulunamadı');
      }

      this.accessToken = access_token;
      this.tokenType = token_type || 'Bearer';
      this.tokenExpiry = Date.now() + (expires_in || 3600) * 1000;

      console.log(`✅ Token alındı | tip: ${this.tokenType} | süre: ${expires_in}s`);
      console.log(`⏰ Token geçerlilik: ${new Date(this.tokenExpiry).toISOString()}`);

      return this.accessToken;
    } catch (error) {
      const detail = error.response
        ? `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`
        : error.message;
      throw new Error(`Token alınamadı: ${detail}`);
    }
  }

  async getAuthorizationHeader() {
    const token = await this.getAccessToken();
    return `${this.tokenType} ${token}`;
  }

  getTokenInfo() {
    return {
      hasToken: !!this.accessToken,
      isValid: this.isTokenValid(),
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
      tokenType: this.tokenType
    };
  }

  async revokeToken() {
    if (!this.accessToken) {
      console.log('ℹ️  Revoke edilecek token yok');
      return;
    }

    const revokeUrl = `${PLM_CONFIG.providerUrl}${PLM_CONFIG.endpoints.revoke}`;
    const params = new URLSearchParams();
    params.append('token', this.accessToken);

    const basicAuth = Buffer.from(
      `${PLM_CONFIG.clientId}:${PLM_CONFIG.clientSecret}`
    ).toString('base64');

    try {
      await axios.post(revokeUrl, params, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('✅ Token revoke edildi');
    } finally {
      this.accessToken = null;
      this.tokenExpiry = null;
    }
  }
}

module.exports = new TokenService();
