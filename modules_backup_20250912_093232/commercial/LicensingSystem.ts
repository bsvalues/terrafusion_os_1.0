import { createHash, randomBytes } from 'crypto';

export interface LicenseConfig {
  productName: string;
  version: string;
  licensee: string;
  organization: string;
  email: string;
  licenseType: 'trial' | 'standard' | 'premium' | 'enterprise';
  features: string[];
  maxUsers: number;
  expirationDate: Date;
  issuedDate: Date;
  hardwareFingerprint?: string;
}

export interface LicenseValidation {
  isValid: boolean;
  isExpired: boolean;
  daysRemaining: number;
  features: string[];
  maxUsers: number;
  errors: string[];
}

export class TerraFusionLicensingSystem {
  private readonly secretKey: string;
  private readonly productId: string = 'TERRAFUSION_OS_1_0';

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.TERRAFUSION_LICENSE_KEY || this.generateSecretKey();
  }

  /**
   * Generate a new license for a customer
   */
  generateLicense(config: LicenseConfig): string {
    const licenseData = {
      productId: this.productId,
      ...config,
      issuedDate: config.issuedDate.toISOString(),
      expirationDate: config.expirationDate.toISOString(),
      hardwareFingerprint: config.hardwareFingerprint || this.generateHardwareFingerprint(),
    };

    const licenseString = Buffer.from(JSON.stringify(licenseData)).toString('base64');
    const signature = this.generateSignature(licenseString);

    return `${licenseString}.${signature}`;
  }

  /**
   * Validate a license key
   */
  validateLicense(licenseKey: string, currentHardwareFingerprint?: string): LicenseValidation {
    const result: LicenseValidation = {
      isValid: false,
      isExpired: false,
      daysRemaining: 0,
      features: [],
      maxUsers: 0,
      errors: [],
    };

    try {
      const [licenseString, signature] = licenseKey.split('.');

      if (!licenseString || !signature) {
        result.errors.push('Invalid license format');
        return result;
      }

      // Verify signature
      const expectedSignature = this.generateSignature(licenseString);
      if (signature !== expectedSignature) {
        result.errors.push('Invalid license signature');
        return result;
      }

      // Decode license data
      const licenseData = JSON.parse(Buffer.from(licenseString, 'base64').toString());

      // Validate product ID
      if (licenseData.productId !== this.productId) {
        result.errors.push('License not valid for this product');
        return result;
      }

      // Check expiration
      const expirationDate = new Date(licenseData.expirationDate);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      result.daysRemaining = daysRemaining;
      result.isExpired = daysRemaining <= 0;

      if (result.isExpired) {
        result.errors.push('License has expired');
        return result;
      }

      // Validate hardware fingerprint (if provided)
      if (currentHardwareFingerprint && licenseData.hardwareFingerprint) {
        if (currentHardwareFingerprint !== licenseData.hardwareFingerprint) {
          result.errors.push('License not valid for this hardware');
          return result;
        }
      }

      // License is valid
      result.isValid = true;
      result.features = licenseData.features || [];
      result.maxUsers = licenseData.maxUsers || 1;

      return result;
    } catch (error) {
      result.errors.push(`License validation error: ${error.message}`);
      return result;
    }
  }

  /**
   * Check if a specific feature is licensed
   */
  hasFeature(licenseKey: string, featureName: string): boolean {
    const validation = this.validateLicense(licenseKey);
    return validation.isValid && validation.features.includes(featureName);
  }

  /**
   * Get license information
   */
  getLicenseInfo(licenseKey: string): LicenseConfig | null {
    try {
      const [licenseString] = licenseKey.split('.');
      if (!licenseString) return null;

      const licenseData = JSON.parse(Buffer.from(licenseString, 'base64').toString());

      return {
        productName: licenseData.productName,
        version: licenseData.version,
        licensee: licenseData.licensee,
        organization: licenseData.organization,
        email: licenseData.email,
        licenseType: licenseData.licenseType,
        features: licenseData.features,
        maxUsers: licenseData.maxUsers,
        expirationDate: new Date(licenseData.expirationDate),
        issuedDate: new Date(licenseData.issuedDate),
        hardwareFingerprint: licenseData.hardwareFingerprint,
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate trial license
   */
  generateTrialLicense(
    licensee: string,
    organization: string,
    email: string,
    durationDays: number = 30
  ): string {
    const config: LicenseConfig = {
      productName: 'Terrafusion OS',
      version: '1.0.0',
      licensee,
      organization,
      email,
      licenseType: 'trial',
      features: ['basic_modules', 'cost_analysis', 'property_management'],
      maxUsers: 5,
      issuedDate: new Date(),
      expirationDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
    };

    return this.generateLicense(config);
  }

  /**
   * Generate enterprise license
   */
  generateEnterpriseLicense(
    licensee: string,
    organization: string,
    email: string,
    maxUsers: number,
    durationYears: number = 1
  ): string {
    const config: LicenseConfig = {
      productName: 'Terrafusion OS',
      version: '1.0.0',
      licensee,
      organization,
      email,
      licenseType: 'enterprise',
      features: [
        'all_modules',
        'ai_command_brain',
        'cost_analysis',
        'property_management',
        'public_records',
        'land_recording',
        'advanced_analytics',
        'custom_integrations',
        'priority_support',
        'white_label',
      ],
      maxUsers,
      issuedDate: new Date(),
      expirationDate: new Date(Date.now() + durationYears * 365 * 24 * 60 * 60 * 1000),
    };

    return this.generateLicense(config);
  }

  /**
   * Generate hardware fingerprint
   */
  private generateHardwareFingerprint(): string {
    // In a real implementation, this would collect actual hardware info
    // For now, generate a unique identifier
    return createHash('sha256')
      .update(`${process.platform}-${process.arch}-${randomBytes(16).toString('hex')}`)
      .digest('hex');
  }

  /**
   * Generate cryptographic signature for license
   */
  private generateSignature(data: string): string {
    return createHash('sha256')
      .update(data + this.secretKey)
      .digest('hex');
  }

  /**
   * Generate a new secret key
   */
  private generateSecretKey(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * License pricing calculator
   */
  calculatePricing(
    licenseType: LicenseConfig['licenseType'],
    users: number,
    years: number = 1
  ): number {
    const basePricing = {
      trial: 0,
      standard: 2400, // $2,400 per user per year
      premium: 4800, // $4,800 per user per year
      enterprise: 7200, // $7,200 per user per year
    };

    const basePrice = basePricing[licenseType] * users * years;

    // Volume discounts
    let discount = 0;
    if (users >= 100)
      discount = 0.2; // 20% discount for 100+ users
    else if (users >= 50)
      discount = 0.15; // 15% discount for 50+ users
    else if (users >= 25) discount = 0.1; // 10% discount for 25+ users

    // Multi-year discounts
    if (years >= 3)
      discount += 0.1; // Additional 10% for 3+ years
    else if (years >= 2) discount += 0.05; // Additional 5% for 2+ years

    return Math.round(basePrice * (1 - discount));
  }

  /**
   * Generate license activation code
   */
  generateActivationCode(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(randomBytes(2).toString('hex').toUpperCase());
    }
    return segments.join('-');
  }
}

// Export singleton instance
export const licensingSystem = new TerraFusionLicensingSystem();

// Feature constants
export const TERRAFUSION_FEATURES = {
  BASIC_MODULES: 'basic_modules',
  AI_COMMAND_BRAIN: 'ai_command_brain',
  COST_ANALYSIS: 'cost_analysis',
  PROPERTY_MANAGEMENT: 'property_management',
  PUBLIC_RECORDS: 'public_records',
  LAND_RECORDING: 'land_recording',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  PRIORITY_SUPPORT: 'priority_support',
  WHITE_LABEL: 'white_label',
} as const;
