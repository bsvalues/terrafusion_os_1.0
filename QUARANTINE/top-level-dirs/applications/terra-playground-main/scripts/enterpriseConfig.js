const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const log = require('electron-log');

class EnterpriseConfig {
  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'enterprise-config.json');
    this.defaultConfig = {
      security: {
        encryption: {
          enabled: true,
          algorithm: 'aes-256-gcm',
          keyRotation: 30, // days
          lastRotation: Date.now()
        },
        authentication: {
          mfa: {
            enabled: true,
            methods: ['totp', 'email', 'sms'],
            backupCodes: true
          },
          session: {
            timeout: 30, // minutes
            maxConcurrent: 3,
            rememberMe: true
          },
          password: {
            minLength: 12,
            requireSpecial: true,
            requireNumbers: true,
            requireUppercase: true,
            requireLowercase: true,
            historySize: 5
          }
        },
        audit: {
          enabled: true,
          retention: 365, // days
          events: ['login', 'logout', 'config_change', 'data_access', 'export']
        }
      },
      compliance: {
        gdpr: {
          enabled: true,
          dataRetention: 730, // days
          rightToForget: true,
          dataExport: true
        },
        hipaa: {
          enabled: false,
          phiProtection: true,
          auditTrail: true
        },
        soc2: {
          enabled: false,
          controls: ['security', 'availability', 'processing_integrity']
        }
      },
      deployment: {
        updates: {
          channel: 'stable',
          autoDownload: true,
          autoInstall: false,
          schedule: {
            enabled: true,
            time: '02:00',
            timezone: 'UTC'
          },
          rollback: {
            enabled: true,
            maxVersions: 3
          }
        },
        backup: {
          enabled: true,
          schedule: 'daily',
          retention: 30, // days
          encryption: true,
          compression: true
        }
      },
      monitoring: {
        performance: {
          enabled: true,
          interval: 5, // minutes
          metrics: ['cpu', 'memory', 'disk', 'network']
        },
        logging: {
          level: 'info',
          rotation: 'daily',
          maxSize: '100m',
          compression: true
        },
        alerts: {
          email: {
            enabled: true,
            recipients: []
          },
          slack: {
            enabled: false,
            webhook: ''
          }
        }
      },
      integration: {
        ldap: {
          enabled: false,
          url: '',
          baseDN: '',
          bindDN: '',
          bindPassword: ''
        },
        saml: {
          enabled: false,
          entryPoint: '',
          issuer: '',
          cert: ''
        },
        oauth: {
          enabled: false,
          providers: []
        }
      },
      customization: {
        branding: {
          logo: '',
          colors: {
            primary: '#3b82f6',
            secondary: '#1e40af',
            accent: '#60a5fa'
          },
          fonts: {
            primary: 'Inter',
            secondary: 'Roboto'
          }
        },
        features: {
          enabled: [],
          disabled: []
        },
        localization: {
          defaultLanguage: 'en',
          supportedLanguages: ['en'],
          dateFormat: 'ISO',
          timeFormat: '24h'
        }
      }
    };

    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const encryptedData = fs.readFileSync(this.configPath, 'utf8');
        const decryptedData = this.decrypt(encryptedData);
        this.config = JSON.parse(decryptedData);
      } else {
        this.config = this.defaultConfig;
        this.saveConfig();
      }
    } catch (error) {
      log.error('Error loading config:', error);
      this.config = this.defaultConfig;
    }
  }

  saveConfig() {
    try {
      const encryptedData = this.encrypt(JSON.stringify(this.config));
      fs.writeFileSync(this.configPath, encryptedData);
    } catch (error) {
      log.error('Error saving config:', error);
    }
  }

  encrypt(data) {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.config.security.encryption.algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    });
  }

  decrypt(data) {
    const { iv, encrypted, authTag } = JSON.parse(data);
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      this.config.security.encryption.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  getEncryptionKey() {
    // In production, this should be securely stored and rotated
    return crypto.scryptSync('your-secure-password', 'salt', 32);
  }

  rotateEncryptionKey() {
    const lastRotation = this.config.security.encryption.lastRotation;
    const daysSinceRotation = (Date.now() - lastRotation) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRotation >= this.config.security.encryption.keyRotation) {
      // Implement key rotation logic
      this.config.security.encryption.lastRotation = Date.now();
      this.saveConfig();
    }
  }

  validateConfig() {
    const validationRules = {
      security: {
        encryption: {
          enabled: 'boolean',
          algorithm: 'string',
          keyRotation: 'number'
        },
        authentication: {
          mfa: {
            enabled: 'boolean',
            methods: 'array'
          }
        }
      }
      // Add more validation rules
    };

    return this.validateObject(this.config, validationRules);
  }

  validateObject(obj, rules) {
    for (const [key, rule] of Object.entries(rules)) {
      if (typeof rule === 'object') {
        if (!this.validateObject(obj[key], rule)) {
          return false;
        }
      } else {
        if (typeof obj[key] !== rule) {
          return false;
        }
      }
    }
    return true;
  }

  getConfig(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  setConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.config);
    target[lastKey] = value;
    this.saveConfig();
  }

  exportConfig() {
    return {
      config: this.config,
      metadata: {
        version: app.getVersion(),
        timestamp: Date.now(),
        checksum: this.calculateChecksum()
      }
    };
  }

  importConfig(data) {
    if (this.validateImport(data)) {
      this.config = data.config;
      this.saveConfig();
      return true;
    }
    return false;
  }

  validateImport(data) {
    // Implement import validation
    return true;
  }

  calculateChecksum() {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(this.config))
      .digest('hex');
  }

  getAuditLog() {
    // Implement audit log retrieval
    return [];
  }

  addAuditLogEntry(event) {
    if (this.config.security.audit.enabled) {
      const entry = {
        timestamp: Date.now(),
        event,
        user: 'system', // Replace with actual user
        details: {}
      };
      // Implement audit log storage
    }
  }
}

module.exports = EnterpriseConfig; 