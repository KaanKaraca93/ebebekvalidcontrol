const axios = require('axios');

class TokenService {
  constructor(config) {
    this.config = config;
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
      console.log(`✅ [${this.config.tenantId}] Cached token kullanılıyor`);
      return this.accessToken;
    }

    console.log(`🔄 [${this.config.tenantId}] Yeni token alınıyor...`);
    return await this._fetchNewToken();
  }

  async _fetchNewToken() {
    const tokenUrl = `${this.config.providerUrl}${this.config.endpoints.token}`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', this.config.serviceAccountAccessKey);
    params.append('password', this.config.serviceAccountSecretKey);

    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
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

      console.log(`✅ [${this.config.tenantId}] Token alındı | tip: ${this.tokenType} | süre: ${expires_in}s`);
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
      console.log(`ℹ️  [${this.config.tenantId}] Revoke edilecek token yok`);
      return;
    }

    const revokeUrl = `${this.config.providerUrl}${this.config.endpoints.revoke}`;
    const params = new URLSearchParams();
    params.append('token', this.accessToken);

    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');

    try {
      await axios.post(revokeUrl, params, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log(`✅ [${this.config.tenantId}] Token revoke edildi`);
    } finally {
      this.accessToken = null;
      this.tokenExpiry = null;
    }
  }
}

module.exports = TokenService;
