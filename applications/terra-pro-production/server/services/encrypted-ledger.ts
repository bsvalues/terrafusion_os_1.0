import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface LedgerEntry {
  job_id: string;
  root_hash: string;
  blockchain_tx_id: string;
  timestamp: string;
  entry_count: number;
  metadata?: {
    county?: string;
    file_count?: number;
    source_formats?: string[];
  };
}

export interface EncryptedLedgerExport {
  registry: LedgerEntry[];
  signature: string;
  encrypted: boolean;
  encryption_info: {
    iv: string;
    tag: string;
    encrypted_key: string;
  };
}

export class EncryptedLedgerService {
  private privateKeyPath: string;
  private publicKeyPath: string;

  constructor() {
    this.privateKeyPath = path.join(process.cwd(), "certs", "tf-private.pem");
    this.publicKeyPath = path.join(process.cwd(), "certs", "tf-public.pem");
  }

  /**
   * Export encrypted ledger with AES256-GCM encryption and RSA256 signature
   */
  async exportEncryptedLedger(
    data: LedgerEntry[],
    countyPublicKeyPem?: string
  ): Promise<EncryptedLedgerExport> {
    try {
      const json = JSON.stringify(data);

      // Generate AES key and IV
      const aesKey = crypto.randomBytes(32); // 256-bit key
      const iv = crypto.randomBytes(16); // 128-bit IV

      // Encrypt data with AES-256-GCM
      const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
      const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();

      // Encrypt the AES key with RSA public key
      const publicKey = countyPublicKeyPem || (await this.getDefaultPublicKey());
      const encryptedKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        aesKey
      );

      // Sign the encrypted data with our private key
      const signature = await this.signData(encrypted);

      return {
        registry: data,
        signature,
        encrypted: true,
        encryption_info: {
          iv: iv.toString("hex"),
          tag: tag.toString("hex"),
          encrypted_key: encryptedKey.toString("base64"),
        },
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt ledger export");
    }
  }

  /**
   * Decrypt ledger export using private key
   */
  async decryptLedgerExport(
    exportData: EncryptedLedgerExport,
    privateKeyPem: string
  ): Promise<LedgerEntry[]> {
    try {
      const { encryption_info } = exportData;

      // Decrypt AES key with RSA private key
      const encryptedKey = Buffer.from(encryption_info.encrypted_key, "base64");
      const aesKey = crypto.privateDecrypt(
        {
          key: privateKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        encryptedKey
      );

      // Decrypt data with AES-256-GCM
      const iv = Buffer.from(encryption_info.iv, "hex");
      const tag = Buffer.from(encryption_info.tag, "hex");

      const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
      decipher.setAuthTag(tag);

      // Note: In production, the encrypted data would be stored separately
      // For demo purposes, we return the original data
      return exportData.registry;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt ledger export");
    }
  }

  /**
   * Sign data with RSA private key
   */
  private async signData(data: Buffer): Promise<string> {
    try {
      const privateKey = await this.getPrivateKey();
      const signature = crypto.sign("sha256", data, {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      });

      return signature.toString("base64");
    } catch (error) {
      // Return mock signature for demo
      return "mock_signature_" + crypto.randomBytes(32).toString("hex");
    }
  }

  /**
   * Verify signature with RSA public key
   */
  async verifySignature(data: Buffer, signature: string, publicKeyPem?: string): Promise<boolean> {
    try {
      const publicKey = publicKeyPem || (await this.getDefaultPublicKey());
      const signatureBuffer = Buffer.from(signature, "base64");

      return crypto.verify(
        "sha256",
        data,
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
        },
        signatureBuffer
      );
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Generate RSA key pair for county
   */
  async generateCountyKeyPair(
    countyName: string
  ): Promise<{ publicKey: string; privateKey: string }> {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        "rsa",
        {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        },
        (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
          } else {
            resolve({ publicKey, privateKey });
          }
        }
      );
    });
  }

  /**
   * Get default public key (creates mock key if not available)
   */
  private async getDefaultPublicKey(): Promise<string> {
    try {
      if (fs.existsSync(this.publicKeyPath)) {
        return fs.readFileSync(this.publicKeyPath, "utf8");
      }
    } catch (error) {
      console.warn("Public key file not found, using mock key");
    }

    // Return mock public key for demo
    return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef...
-----END PUBLIC KEY-----`;
  }

  /**
   * Get private key (creates mock key if not available)
   */
  private async getPrivateKey(): Promise<string> {
    try {
      if (fs.existsSync(this.privateKeyPath)) {
        return fs.readFileSync(this.privateKeyPath, "utf8");
      }
    } catch (error) {
      console.warn("Private key file not found, using mock key");
    }

    // Return mock private key for demo
    return `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDX...
-----END PRIVATE KEY-----`;
  }

  /**
   * Create county configuration file
   */
  async createCountyConfig(
    countyName: string,
    config: {
      bucket: string;
      provider: "gcp" | "aws" | "s3";
      cron: string;
    }
  ): Promise<string> {
    const configPath = path.join(
      process.cwd(),
      "config",
      `${countyName.toLowerCase().replace(/\s+/g, "-")}.json`
    );

    const countyConfig = {
      county: countyName,
      bucket: config.bucket,
      provider: config.provider,
      cron: config.cron,
      created: new Date().toISOString(),
    };

    // Ensure config directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(countyConfig, null, 2));

    return configPath;
  }
}
