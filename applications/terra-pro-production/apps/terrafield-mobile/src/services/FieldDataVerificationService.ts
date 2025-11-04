import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import { AuthService } from "./AuthService";
import { SecureStorageService, SecurityLevel } from "./SecureStorageService";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";

/**
 * Field data verification rule type
 */
export enum VerificationRuleType {
  RANGE_CHECK = "range_check",
  REQUIRED_FIELD = "required_field",
  FORMAT_CHECK = "format_check",
  CROSS_REFERENCE = "cross_reference",
  ANOMALY_DETECTION = "anomaly_detection",
  REGULATORY_COMPLIANCE = "regulatory_compliance",
  CONSISTENCY_CHECK = "consistency_check",
  DATA_QUALITY = "data_quality",
  LOGICAL_VALIDATION = "logical_validation",
}

/**
 * Verification severity level
 */
export enum VerificationSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Field data verification rule interface
 */
export interface VerificationRule {
  /**
   * Rule ID
   */
  id: string;

  /**
   * Rule name
   */
  name: string;

  /**
   * Rule description
   */
  description: string;

  /**
   * Rule type
   */
  type: VerificationRuleType;

  /**
   * Entity type this rule applies to
   */
  entityType: string;

  /**
   * Field name or path to validate
   */
  fieldPath: string;

  /**
   * Validation parameters
   */
  parameters: Record<string, any>;

  /**
   * Custom validation function as string
   * (can be evaluated with Function constructor)
   */
  validationFunction?: string;

  /**
   * Error message template
   */
  errorMessage: string;

  /**
   * Severity level
   */
  severity: VerificationSeverity;

  /**
   * Whether rule is enabled
   */
  enabled: boolean;

  /**
   * Whether rule is system-defined or user-defined
   */
  isSystemRule: boolean;

  /**
   * Category tags
   */
  tags: string[];

  /**
   * Reference documentation URL
   */
  documentation?: string;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;
}

/**
 * Verification result interface
 */
export interface VerificationResult {
  /**
   * Result ID
   */
  id: string;

  /**
   * Rule ID that produced this result
   */
  ruleId: string;

  /**
   * Entity ID that was validated
   */
  entityId: string;

  /**
   * Entity type
   */
  entityType: string;

  /**
   * Field path that was validated
   */
  fieldPath: string;

  /**
   * Actual field value
   */
  fieldValue: any;

  /**
   * Verification passed
   */
  passed: boolean;

  /**
   * Error message
   */
  message: string;

  /**
   * Severity level
   */
  severity: VerificationSeverity;

  /**
   * Whether this issue was acknowledged
   */
  acknowledged: boolean;

  /**
   * Notes provided during acknowledgment
   */
  acknowledgmentNotes?: string;

  /**
   * User ID who acknowledged the issue
   */
  acknowledgedBy?: string;

  /**
   * Acknowledgment timestamp
   */
  acknowledgedAt?: number;

  /**
   * Verification timestamp
   */
  timestamp: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Verification batch interface
 */
export interface VerificationBatch {
  /**
   * Batch ID
   */
  id: string;

  /**
   * Entity ID
   */
  entityId: string;

  /**
   * Entity type
   */
  entityType: string;

  /**
   * Results
   */
  results: VerificationResult[];

  /**
   * Verification timestamp
   */
  timestamp: number;

  /**
   * Overall status
   */
  status: "passed" | "failed" | "warning";

  /**
   * Issues count by severity
   */
  issueCount: {
    info: number;
    warning: number;
    error: number;
    critical: number;
  };
}

/**
 * Verification options interface
 */
export interface VerificationOptions {
  /**
   * Whether to stop on first error
   */
  stopOnFirstError: boolean;

  /**
   * Whether to run system rules
   */
  includeSystemRules: boolean;

  /**
   * Whether to run user-defined rules
   */
  includeUserRules: boolean;

  /**
   * Minimum severity level to check
   */
  minimumSeverity: VerificationSeverity;

  /**
   * Categories to include
   */
  includeTags?: string[];

  /**
   * Categories to exclude
   */
  excludeTags?: string[];

  /**
   * Whether to save results
   */
  saveResults: boolean;
}

/**
 * Default verification options
 */
const DEFAULT_OPTIONS: VerificationOptions = {
  stopOnFirstError: false,
  includeSystemRules: true,
  includeUserRules: true,
  minimumSeverity: VerificationSeverity.WARNING,
  saveResults: true,
};

/**
 * Field data verification service
 */
export class FieldDataVerificationService {
  private static instance: FieldDataVerificationService;
  private authService: AuthService;
  private secureStorageService: SecureStorageService;
  private offlineQueueService: OfflineQueueService;

  // Rules and results caches
  private rulesCache: Map<string, VerificationRule> = new Map();
  private resultsCache: Map<string, VerificationBatch> = new Map();

  // API endpoints
  private readonly API_ENDPOINT = "https://api.appraisalcore.replit.app/api/verification";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.authService = AuthService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();
    this.offlineQueueService = OfflineQueueService.getInstance();

    // Load caches
    this.loadRulesCache();
    this.loadResultsCache();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FieldDataVerificationService {
    if (!FieldDataVerificationService.instance) {
      FieldDataVerificationService.instance = new FieldDataVerificationService();
    }
    return FieldDataVerificationService.instance;
  }

  /**
   * Load rules cache
   */
  private async loadRulesCache(): Promise<void> {
    try {
      // Load rules from secure storage
      const rules = await this.secureStorageService.getData<VerificationRule[]>(
        "terrafield:verification:rules",
        [],
        SecurityLevel.MEDIUM
      );

      // Populate cache
      for (const rule of rules) {
        this.rulesCache.set(rule.id, rule);
      }

      // Load system rules if cache is empty
      if (this.rulesCache.size === 0) {
        await this.loadSystemRules();
      }
    } catch (error) {
      console.error("Error loading rules cache:", error);
    }
  }

  /**
   * Load results cache
   */
  private async loadResultsCache(): Promise<void> {
    try {
      // Load results from secure storage
      const results = await this.secureStorageService.getData<VerificationBatch[]>(
        "terrafield:verification:results",
        [],
        SecurityLevel.MEDIUM
      );

      // Populate cache
      for (const batch of results) {
        this.resultsCache.set(batch.id, batch);
      }
    } catch (error) {
      console.error("Error loading results cache:", error);
    }
  }

  /**
   * Save rules cache
   */
  private async saveRulesCache(): Promise<void> {
    try {
      await this.secureStorageService.saveData(
        "terrafield:verification:rules",
        Array.from(this.rulesCache.values()),
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving rules cache:", error);
    }
  }

  /**
   * Save results cache
   */
  private async saveResultsCache(): Promise<void> {
    try {
      await this.secureStorageService.saveData(
        "terrafield:verification:results",
        Array.from(this.resultsCache.values()),
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving results cache:", error);
    }
  }

  /**
   * Load system rules
   */
  private async loadSystemRules(): Promise<void> {
    try {
      const systemRules: VerificationRule[] = [
        // Required field rules
        {
          id: "rule_required_address",
          name: "Property Address Required",
          description: "Property address must be provided",
          type: VerificationRuleType.REQUIRED_FIELD,
          entityType: "property",
          fieldPath: "address",
          parameters: {},
          errorMessage: "Property address is required",
          severity: VerificationSeverity.ERROR,
          enabled: true,
          isSystemRule: true,
          tags: ["required", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "rule_required_property_type",
          name: "Property Type Required",
          description: "Property type must be provided",
          type: VerificationRuleType.REQUIRED_FIELD,
          entityType: "property",
          fieldPath: "propertyType",
          parameters: {},
          errorMessage: "Property type is required",
          severity: VerificationSeverity.ERROR,
          enabled: true,
          isSystemRule: true,
          tags: ["required", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },

        // Range check rules
        {
          id: "rule_range_bedrooms",
          name: "Bedroom Count Range",
          description: "Bedroom count must be between 0 and 20",
          type: VerificationRuleType.RANGE_CHECK,
          entityType: "property",
          fieldPath: "bedrooms",
          parameters: {
            min: 0,
            max: 20,
          },
          errorMessage: "Bedroom count must be between 0 and 20",
          severity: VerificationSeverity.WARNING,
          enabled: true,
          isSystemRule: true,
          tags: ["range", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "rule_range_bathrooms",
          name: "Bathroom Count Range",
          description: "Bathroom count must be between 0 and 20",
          type: VerificationRuleType.RANGE_CHECK,
          entityType: "property",
          fieldPath: "bathrooms",
          parameters: {
            min: 0,
            max: 20,
          },
          errorMessage: "Bathroom count must be between 0 and 20",
          severity: VerificationSeverity.WARNING,
          enabled: true,
          isSystemRule: true,
          tags: ["range", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "rule_range_square_footage",
          name: "Square Footage Range",
          description: "Square footage must be between 100 and 100,000",
          type: VerificationRuleType.RANGE_CHECK,
          entityType: "property",
          fieldPath: "squareFootage",
          parameters: {
            min: 100,
            max: 100000,
          },
          errorMessage: "Square footage must be between 100 and 100,000",
          severity: VerificationSeverity.WARNING,
          enabled: true,
          isSystemRule: true,
          tags: ["range", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "rule_range_year_built",
          name: "Year Built Range",
          description: "Year built must be between 1700 and current year",
          type: VerificationRuleType.RANGE_CHECK,
          entityType: "property",
          fieldPath: "yearBuilt",
          parameters: {
            min: 1700,
            max: new Date().getFullYear(),
          },
          errorMessage: "Year built must be between 1700 and current year",
          severity: VerificationSeverity.WARNING,
          enabled: true,
          isSystemRule: true,
          tags: ["range", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },

        // Format check rules
        {
          id: "rule_format_zip_code",
          name: "Zip Code Format",
          description: "Zip code must be in valid format",
          type: VerificationRuleType.FORMAT_CHECK,
          entityType: "property",
          fieldPath: "postalCode",
          parameters: {
            pattern: "^\\d{5}(-\\d{4})?$",
          },
          errorMessage: "Zip code must be in valid format (e.g., 12345 or 12345-6789)",
          severity: VerificationSeverity.WARNING,
          enabled: true,
          isSystemRule: true,
          tags: ["format", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },

        // Cross-reference rules
        {
          id: "rule_cross_ref_property_type_bathrooms",
          name: "Property Type and Bathrooms",
          description: 'If property type is "Land", bathrooms should be 0',
          type: VerificationRuleType.CROSS_REFERENCE,
          entityType: "property",
          fieldPath: "bathrooms",
          parameters: {
            refField: "propertyType",
            condition: 'property.propertyType === "Land" && property.bathrooms > 0',
          },
          validationFunction: 'return !(entity.propertyType === "Land" && entity.bathrooms > 0);',
          errorMessage: "Land properties should not have bathrooms",
          severity: VerificationSeverity.WARNING,
          enabled: true,
          isSystemRule: true,
          tags: ["cross-reference", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },

        // Anomaly detection rules
        {
          id: "rule_anomaly_price_per_sqft",
          name: "Price per Square Foot Anomaly",
          description: "Checks if price per square foot is within reasonable range for the area",
          type: VerificationRuleType.ANOMALY_DETECTION,
          entityType: "property",
          fieldPath: "price",
          parameters: {
            minPricePerSqFt: 50,
            maxPricePerSqFt: 2000,
          },
          validationFunction:
            "const pricePerSqFt = entity.price / entity.squareFootage; return pricePerSqFt >= params.minPricePerSqFt && pricePerSqFt <= params.maxPricePerSqFt;",
          errorMessage: "Price per square foot ({{value}}) is outside expected range",
          severity: VerificationSeverity.WARNING,
          enabled: true,
          isSystemRule: true,
          tags: ["anomaly", "property", "price"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },

        // Logical validation rules
        {
          id: "rule_logical_bedrooms_vs_sqft",
          name: "Bedrooms vs Square Footage",
          description: "Checks if bedroom count is reasonable for square footage",
          type: VerificationRuleType.LOGICAL_VALIDATION,
          entityType: "property",
          fieldPath: "bedrooms",
          parameters: {
            minSqFtPerBedroom: 100,
          },
          validationFunction:
            "if (entity.bedrooms === 0) return true; return entity.squareFootage / entity.bedrooms >= params.minSqFtPerBedroom;",
          errorMessage: "Bedroom count seems high for square footage",
          severity: VerificationSeverity.INFO,
          enabled: true,
          isSystemRule: true,
          tags: ["logical", "property"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Add to cache
      for (const rule of systemRules) {
        this.rulesCache.set(rule.id, rule);
      }

      // Save to secure storage
      await this.saveRulesCache();
    } catch (error) {
      console.error("Error loading system rules:", error);
    }
  }

  /**
   * Get all rules
   */
  public async getRules(entityType?: string): Promise<VerificationRule[]> {
    try {
      // Check network availability
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.fetchRulesFromServer();
        } catch (error) {
          console.warn("Failed to fetch rules from server:", error);
        }
      }

      let rules = Array.from(this.rulesCache.values());

      if (entityType) {
        rules = rules.filter((rule) => rule.entityType === entityType);
      }

      return rules;
    } catch (error) {
      console.error("Error getting rules:", error);
      return Array.from(this.rulesCache.values());
    }
  }

  /**
   * Fetch rules from server
   */
  private async fetchRulesFromServer(): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to fetch rules");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/rules`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch rules");
      }

      // Get rules
      const responseData = await response.json();
      const rules: VerificationRule[] = responseData.rules || [];

      // Update cache
      for (const rule of rules) {
        this.rulesCache.set(rule.id, rule);
      }

      // Save to secure storage
      await this.saveRulesCache();
    } catch (error) {
      console.error("Error fetching rules from server:", error);
      throw error;
    }
  }

  /**
   * Create rule
   */
  public async createRule(
    rule: Omit<VerificationRule, "id" | "createdAt" | "updatedAt" | "isSystemRule">
  ): Promise<VerificationRule> {
    try {
      // Generate rule ID
      const ruleId = `rule_${uuidv4()}`;

      // Create rule object
      const newRule: VerificationRule = {
        ...rule,
        id: ruleId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isSystemRule: false,
      };

      // Validate rule
      const validation = this.validateRule(newRule);

      if (!validation.valid) {
        throw new Error(`Invalid rule: ${validation.error}`);
      }

      // Save to cache
      this.rulesCache.set(ruleId, newRule);
      await this.saveRulesCache();

      // Upload to server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.uploadRuleToServer(newRule);
        } catch (error) {
          console.warn("Failed to upload rule to server:", error);
        }
      } else {
        // Queue for upload when online
        await this.offlineQueueService.enqueue(
          OperationType.UPLOAD_VERIFICATION_RULE,
          { ruleId },
          1 // Low priority
        );
      }

      return newRule;
    } catch (error) {
      console.error("Error creating rule:", error);
      throw error;
    }
  }

  /**
   * Upload rule to server
   */
  private async uploadRuleToServer(rule: VerificationRule): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to upload rule");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/rules`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload rule");
      }
    } catch (error) {
      console.error("Error uploading rule to server:", error);
      throw error;
    }
  }

  /**
   * Update rule
   */
  public async updateRule(
    ruleId: string,
    updates: Partial<VerificationRule>
  ): Promise<VerificationRule> {
    try {
      const rule = this.rulesCache.get(ruleId);

      if (!rule) {
        throw new Error("Rule not found");
      }

      // Can't update system rules
      if (rule.isSystemRule) {
        throw new Error("Cannot update system rules");
      }

      // Update rule
      const updatedRule: VerificationRule = {
        ...rule,
        ...updates,
        id: rule.id, // Ensure ID remains the same
        isSystemRule: rule.isSystemRule, // Ensure system rule status remains the same
        createdAt: rule.createdAt, // Ensure created timestamp remains the same
        updatedAt: Date.now(),
      };

      // Validate rule
      const validation = this.validateRule(updatedRule);

      if (!validation.valid) {
        throw new Error(`Invalid rule: ${validation.error}`);
      }

      // Save to cache
      this.rulesCache.set(ruleId, updatedRule);
      await this.saveRulesCache();

      // Update on server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.updateRuleOnServer(updatedRule);
        } catch (error) {
          console.warn("Failed to update rule on server:", error);
        }
      } else {
        // Queue for update when online
        await this.offlineQueueService.enqueue(
          OperationType.UPDATE_VERIFICATION_RULE,
          { ruleId },
          1 // Low priority
        );
      }

      return updatedRule;
    } catch (error) {
      console.error("Error updating rule:", error);
      throw error;
    }
  }

  /**
   * Update rule on server
   */
  private async updateRuleOnServer(rule: VerificationRule): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to update rule");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/rules/${rule.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update rule");
      }
    } catch (error) {
      console.error("Error updating rule on server:", error);
      throw error;
    }
  }

  /**
   * Delete rule
   */
  public async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const rule = this.rulesCache.get(ruleId);

      if (!rule) {
        return false;
      }

      // Can't delete system rules
      if (rule.isSystemRule) {
        throw new Error("Cannot delete system rules");
      }

      // Remove from cache
      this.rulesCache.delete(ruleId);
      await this.saveRulesCache();

      // Delete from server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.deleteRuleFromServer(ruleId);
        } catch (error) {
          console.warn("Failed to delete rule from server:", error);
        }
      } else {
        // Queue for deletion when online
        await this.offlineQueueService.enqueue(
          OperationType.DELETE_VERIFICATION_RULE,
          { ruleId },
          1 // Low priority
        );
      }

      return true;
    } catch (error) {
      console.error("Error deleting rule:", error);
      return false;
    }
  }

  /**
   * Delete rule from server
   */
  private async deleteRuleFromServer(ruleId: string): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to delete rule");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/rules/${ruleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete rule");
      }
    } catch (error) {
      console.error("Error deleting rule from server:", error);
      throw error;
    }
  }

  /**
   * Validate rule
   */
  private validateRule(rule: VerificationRule): { valid: boolean; error?: string } {
    try {
      // Check required fields
      if (
        !rule.name ||
        !rule.description ||
        !rule.type ||
        !rule.entityType ||
        !rule.fieldPath ||
        !rule.errorMessage
      ) {
        return { valid: false, error: "Missing required fields" };
      }

      // Check validation function if provided
      if (rule.validationFunction) {
        try {
          new Function("entity", "params", rule.validationFunction);
        } catch (error) {
          return { valid: false, error: "Invalid validation function" };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error("Error validating rule:", error);
      return { valid: false, error: "Error validating rule" };
    }
  }

  /**
   * Verify entity
   */
  public async verifyEntity<T extends { id: string }>(
    entity: T,
    entityType: string,
    options: Partial<VerificationOptions> = {}
  ): Promise<VerificationBatch> {
    try {
      // Merge options with defaults
      const mergedOptions: VerificationOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      // Get applicable rules
      const allRules = await this.getRules(entityType);

      // Filter rules based on options
      let rules = allRules.filter((rule) => rule.enabled);

      if (!mergedOptions.includeSystemRules) {
        rules = rules.filter((rule) => !rule.isSystemRule);
      }

      if (!mergedOptions.includeUserRules) {
        rules = rules.filter((rule) => rule.isSystemRule);
      }

      if (mergedOptions.includeTags && mergedOptions.includeTags.length > 0) {
        rules = rules.filter((rule) =>
          rule.tags.some((tag) => mergedOptions.includeTags!.includes(tag))
        );
      }

      if (mergedOptions.excludeTags && mergedOptions.excludeTags.length > 0) {
        rules = rules.filter(
          (rule) => !rule.tags.some((tag) => mergedOptions.excludeTags!.includes(tag))
        );
      }

      // Filter by severity
      const severityLevels = [
        VerificationSeverity.INFO,
        VerificationSeverity.WARNING,
        VerificationSeverity.ERROR,
        VerificationSeverity.CRITICAL,
      ];

      const minimumSeverityIndex = severityLevels.indexOf(mergedOptions.minimumSeverity);

      rules = rules.filter((rule /* , index */) => {
        const ruleSeverityIndex = severityLevels.indexOf(rule.severity);
        return ruleSeverityIndex >= minimumSeverityIndex;
      });

      // Execute rules
      const results: VerificationResult[] = [];

      for (const rule of rules) {
        const result = this.executeRule(rule, entity);
        results.push(result);

        // Stop on first error if option is enabled
        if (
          mergedOptions.stopOnFirstError &&
          !result.passed &&
          (result.severity === VerificationSeverity.ERROR ||
            result.severity === VerificationSeverity.CRITICAL)
        ) {
          break;
        }
      }

      // Count issues by severity
      const issueCount = {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      };

      for (const result of results) {
        if (!result.passed) {
          switch (result.severity) {
            case VerificationSeverity.INFO:
              issueCount.info++;
              break;
            case VerificationSeverity.WARNING:
              issueCount.warning++;
              break;
            case VerificationSeverity.ERROR:
              issueCount.error++;
              break;
            case VerificationSeverity.CRITICAL:
              issueCount.critical++;
              break;
          }
        }
      }

      // Determine overall status
      let status: "passed" | "failed" | "warning" = "passed";

      if (issueCount.critical > 0 || issueCount.error > 0) {
        status = "failed";
      } else if (issueCount.warning > 0) {
        status = "warning";
      }

      // Create batch
      const batch: VerificationBatch = {
        id: `batch_${uuidv4()}`,
        entityId: entity.id,
        entityType,
        results,
        timestamp: Date.now(),
        status,
        issueCount,
      };

      // Save results if option is enabled
      if (mergedOptions.saveResults) {
        this.resultsCache.set(batch.id, batch);
        await this.saveResultsCache();
      }

      return batch;
    } catch (error) {
      console.error("Error verifying entity:", error);
      throw error;
    }
  }

  /**
   * Execute rule
   */
  private executeRule<T extends { id: string }>(
    rule: VerificationRule,
    entity: T
  ): VerificationResult {
    try {
      let fieldValue: any;
      let passed = false;

      // Get field value
      if (rule.fieldPath.includes(".")) {
        // Handle nested path
        const paths = rule.fieldPath.split(".");
        let current: any = entity;

        for (const path of paths) {
          if (current === undefined || current === null) {
            break;
          }
          current = current[path];
        }

        fieldValue = current;
      } else {
        // Simple path
        fieldValue = entity[rule.fieldPath];
      }

      // Execute rule
      switch (rule.type) {
        case VerificationRuleType.REQUIRED_FIELD:
          passed = fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
          break;

        case VerificationRuleType.RANGE_CHECK:
          if (typeof fieldValue === "number") {
            const min = rule.parameters.min;
            const max = rule.parameters.max;

            if (min !== undefined && max !== undefined) {
              passed = fieldValue >= min && fieldValue <= max;
            } else if (min !== undefined) {
              passed = fieldValue >= min;
            } else if (max !== undefined) {
              passed = fieldValue <= max;
            } else {
              passed = true;
            }
          } else {
            passed = false;
          }
          break;

        case VerificationRuleType.FORMAT_CHECK:
          if (typeof fieldValue === "string" && rule.parameters.pattern) {
            const regex = new RegExp(rule.parameters.pattern);
            passed = regex.test(fieldValue);
          } else {
            passed = false;
          }
          break;

        default:
          // For other types, use validation function if available
          if (rule.validationFunction) {
            try {
              const validationFn = new Function("entity", "params", rule.validationFunction);
              passed = validationFn(entity, rule.parameters);
            } catch (error) {
              console.error("Error executing validation function:", error);
              passed = false;
            }
          } else {
            passed = true;
          }
      }

      // Format error message
      let message = rule.errorMessage;

      // Replace placeholders in message
      message = message.replace(/{{value}}/g, String(fieldValue));
      message = message.replace(/{{min}}/g, String(rule.parameters.min));
      message = message.replace(/{{max}}/g, String(rule.parameters.max));

      return {
        id: `result_${uuidv4()}`,
        ruleId: rule.id,
        entityId: entity.id,
        entityType: rule.entityType,
        fieldPath: rule.fieldPath,
        fieldValue,
        passed,
        message: passed ? "" : message,
        severity: rule.severity,
        acknowledged: false,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error executing rule:", error);

      return {
        id: `result_${uuidv4()}`,
        ruleId: rule.id,
        entityId: entity.id,
        entityType: rule.entityType,
        fieldPath: rule.fieldPath,
        fieldValue: null,
        passed: false,
        message: `Error executing rule: ${error.message}`,
        severity: rule.severity,
        acknowledged: false,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get results
   */
  public async getResults(entityId?: string, entityType?: string): Promise<VerificationBatch[]> {
    try {
      let results = Array.from(this.resultsCache.values());

      if (entityId) {
        results = results.filter((batch) => batch.entityId === entityId);
      }

      if (entityType) {
        results = results.filter((batch) => batch.entityType === entityType);
      }

      // Sort by timestamp, newest first
      results.sort((a, b) => b.timestamp - a.timestamp);

      return results;
    } catch (error) {
      console.error("Error getting results:", error);
      return [];
    }
  }

  /**
   * Acknowledge result
   */
  public async acknowledgeResult(
    batchId: string,
    resultId: string,
    notes: string = ""
  ): Promise<boolean> {
    try {
      const batch = this.resultsCache.get(batchId);

      if (!batch) {
        return false;
      }

      // Find result
      const resultIndex = batch.results.findIndex((result) => result.id === resultId);

      if (resultIndex === -1) {
        return false;
      }

      // Update result
      const result = batch.results[resultIndex];

      result.acknowledged = true;
      result.acknowledgmentNotes = notes;
      result.acknowledgedBy = await this.authService.getUserId();
      result.acknowledgedAt = Date.now();

      // Update batch
      batch.results[resultIndex] = result;
      this.resultsCache.set(batchId, batch);
      await this.saveResultsCache();

      return true;
    } catch (error) {
      console.error("Error acknowledging result:", error);
      return false;
    }
  }

  /**
   * Delete result
   */
  public async deleteResult(batchId: string): Promise<boolean> {
    try {
      const batch = this.resultsCache.get(batchId);

      if (!batch) {
        return false;
      }

      // Remove from cache
      this.resultsCache.delete(batchId);
      await this.saveResultsCache();

      return true;
    } catch (error) {
      console.error("Error deleting result:", error);
      return false;
    }
  }
}
