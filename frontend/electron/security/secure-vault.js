// SecureVault for Terrafusion OS (Electron Main Process)
// Uses keytar if available; falls back to in-memory store for development

let keytar = null;
try {
  // Optional dependency to avoid install failures in constrained environments
  // eslint-disable-next-line global-require
  keytar = require('keytar');
} catch (_) {
  // Optional dependency - keytar may not be available
  keytar = null;
}

const crypto = require('crypto');

class SecureVault {
  constructor(serviceName = 'TerraFusionOS') {
    this.serviceName = serviceName;
    this._memStore = new Map();
  }

  async storeCountyCredentials(countyId, credentialsPlainJson) {
    const envelope = this._encrypt(credentialsPlainJson);
    const key = `county_${countyId}`;
    if (keytar) {
      await keytar.setPassword(this.serviceName, key, JSON.stringify(envelope));
    } else {
      this._memStore.set(key, JSON.stringify(envelope));
    }
    return true;
  }

  async retrieveCountyCredentials(countyId) {
    const key = `county_${countyId}`;
    let raw = null;
    if (keytar) {
      raw = await keytar.getPassword(this.serviceName, key);
    } else {
      raw = this._memStore.get(key) || null;
    }
    if (!raw) return null;
    try {
      const envelope = JSON.parse(raw);
      return this._decrypt(envelope);
    } catch (_) {
      // Invalid JSON or decryption failed
      return null;
    }
  }

  _encrypt(plain) {
    const iv = crypto.randomBytes(12);
    const key = this._getKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify(plain), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      algorithm: 'AES-256-GCM',
      iv: iv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  _decrypt(env) {
    if (!env || env.algorithm !== 'AES-256-GCM') return null;
    const key = this._getKey();
    const iv = Buffer.from(env.iv, 'base64');
    const ciphertext = Buffer.from(env.ciphertext, 'base64');
    const tag = Buffer.from(env.tag, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plaintext.toString('utf8'));
  }

  _getKey() {
    // Derive a stable process-local key (for development only). In production, load from OS secret store/HSM.
    const seed = process.env.TF_VAULT_KEY || `${process.platform}:${process.arch}:terrafusion-os`;
    return crypto.createHash('sha256').update(seed).digest();
  }
}

module.exports = { SecureVault };
