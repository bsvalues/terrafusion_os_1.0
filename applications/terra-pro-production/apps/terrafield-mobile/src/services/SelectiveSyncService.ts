import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Platform } from "react-native";
import * as Battery from "expo-battery";
import { DataSyncService } from "./DataSyncService";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";

/**
 * Sync priorities
 */
export enum SyncPriority {
  CRITICAL = "critical", // Must be synced as soon as possible
  HIGH = "high", // Should be synced when good connection is available
  MEDIUM = "medium", // Can be synced when on Wi-Fi
  LOW = "low", // Only sync when on Wi-Fi and charging
  BACKGROUND = "background", // Sync during idle times
}

/**
 * Sync data categories
 */
export enum SyncCategory {
  PROPERTIES = "properties",
  REPORTS = "reports",
  PHOTOS = "photos",
  COMPARABLES = "comparables",
  SKETCHES = "sketches",
  NOTES = "notes",
  USER_PREFERENCES = "user_preferences",
}

/**
 * Sync constraints
 */
export interface SyncConstraints {
  /**
   * Network types required for syncing
   */
  networkTypes: ("wifi" | "cellular" | "ethernet" | "other")[];

  /**
   * Minimum battery percentage required for syncing (0-100)
   */
  minBatteryPercent: number;

  /**
   * Whether the device needs to be charging for syncing
   */
  requiresCharging: boolean;

  /**
   * Maximum data size in bytes that can be synced at once
   */
  maxDataSize?: number;

  /**
   * Maximum number of items that can be synced at once
   */
  maxItems?: number;
}

/**
 * Sync configuration for a category
 */
export interface SyncConfig {
  /**
   * Sync priority
   */
  priority: SyncPriority;

  /**
   * Constraints for this sync category
   */
  constraints: SyncConstraints;

  /**
   * Whether this category is enabled for syncing
   */
  enabled: boolean;

  /**
   * Last successful sync time
   */
  lastSync?: number;
}

/**
 * Default sync constraints for each priority
 */
const DEFAULT_CONSTRAINTS: Record<SyncPriority, SyncConstraints> = {
  [SyncPriority.CRITICAL]: {
    networkTypes: ["wifi", "cellular", "ethernet", "other"],
    minBatteryPercent: 5,
    requiresCharging: false,
  },
  [SyncPriority.HIGH]: {
    networkTypes: ["wifi", "cellular", "ethernet", "other"],
    minBatteryPercent: 15,
    requiresCharging: false,
  },
  [SyncPriority.MEDIUM]: {
    networkTypes: ["wifi", "ethernet"],
    minBatteryPercent: 20,
    requiresCharging: false,
  },
  [SyncPriority.LOW]: {
    networkTypes: ["wifi", "ethernet"],
    minBatteryPercent: 30,
    requiresCharging: true,
  },
  [SyncPriority.BACKGROUND]: {
    networkTypes: ["wifi", "ethernet"],
    minBatteryPercent: 50,
    requiresCharging: true,
  },
};

/**
 * Default sync configuration for each category
 */
const DEFAULT_CONFIG: Record<SyncCategory, SyncConfig> = {
  [SyncCategory.PROPERTIES]: {
    priority: SyncPriority.HIGH,
    constraints: DEFAULT_CONSTRAINTS[SyncPriority.HIGH],
    enabled: true,
  },
  [SyncCategory.REPORTS]: {
    priority: SyncPriority.HIGH,
    constraints: DEFAULT_CONSTRAINTS[SyncPriority.HIGH],
    enabled: true,
  },
  [SyncCategory.PHOTOS]: {
    priority: SyncPriority.MEDIUM,
    constraints: {
      ...DEFAULT_CONSTRAINTS[SyncPriority.MEDIUM],
      maxDataSize: 10 * 1024 * 1024, // 10 MB per sync
    },
    enabled: true,
  },
  [SyncCategory.COMPARABLES]: {
    priority: SyncPriority.MEDIUM,
    constraints: DEFAULT_CONSTRAINTS[SyncPriority.MEDIUM],
    enabled: true,
  },
  [SyncCategory.SKETCHES]: {
    priority: SyncPriority.LOW,
    constraints: DEFAULT_CONSTRAINTS[SyncPriority.LOW],
    enabled: true,
  },
  [SyncCategory.NOTES]: {
    priority: SyncPriority.LOW,
    constraints: DEFAULT_CONSTRAINTS[SyncPriority.LOW],
    enabled: true,
  },
  [SyncCategory.USER_PREFERENCES]: {
    priority: SyncPriority.BACKGROUND,
    constraints: DEFAULT_CONSTRAINTS[SyncPriority.BACKGROUND],
    enabled: true,
  },
};

/**
 * Sync result
 */
export interface SyncResult {
  /**
   * Whether the sync was successful
   */
  success: boolean;

  /**
   * Categories that were synced
   */
  syncedCategories: SyncCategory[];

  /**
   * Categories that were skipped due to constraints
   */
  skippedCategories: SyncCategory[];

  /**
   * Categories that failed to sync
   */
  failedCategories: SyncCategory[];

  /**
   * Error message, if any
   */
  error?: string;

  /**
   * Items synced count
   */
  itemsSynced: number;

  /**
   * Data size synced in bytes
   */
  dataSizeSynced: number;
}

/**
 * SelectiveSyncService
 *
 * Provides optimized data synchronization based on network conditions,
 * battery level, and user preferences.
 */
export class SelectiveSyncService {
  private static instance: SelectiveSyncService;
  private syncConfig: Record<SyncCategory, SyncConfig>;
  private dataSyncService: DataSyncService;
  private offlineQueueService: OfflineQueueService;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  // Storage key
  private readonly SYNC_CONFIG_KEY = "terrafield:sync:config";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.syncConfig = { ...DEFAULT_CONFIG };
    this.dataSyncService = DataSyncService.getInstance();
    this.offlineQueueService = OfflineQueueService.getInstance();
    this.loadConfig();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SelectiveSyncService {
    if (!SelectiveSyncService.instance) {
      SelectiveSyncService.instance = new SelectiveSyncService();
    }
    return SelectiveSyncService.instance;
  }

  /**
   * Load sync configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const configJson = await AsyncStorage.getItem(this.SYNC_CONFIG_KEY);

      if (configJson) {
        const savedConfig = JSON.parse(configJson) as Record<SyncCategory, SyncConfig>;

        // Merge saved config with defaults (keeping saved priorities and constraints)
        Object.keys(DEFAULT_CONFIG).forEach((category) => {
          const key = category as SyncCategory;

          if (savedConfig[key]) {
            this.syncConfig[key] = {
              ...DEFAULT_CONFIG[key],
              ...savedConfig[key],
            };
          }
        });
      }
    } catch (error) {
      console.error("Error loading sync configuration:", error);
    }
  }

  /**
   * Save sync configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_CONFIG_KEY, JSON.stringify(this.syncConfig));
    } catch (error) {
      console.error("Error saving sync configuration:", error);
    }
  }

  /**
   * Set the priority for a sync category
   */
  public async setPriority(category: SyncCategory, priority: SyncPriority): Promise<void> {
    if (!this.syncConfig[category]) {
      throw new Error(`Invalid sync category: ${category}`);
    }

    this.syncConfig[category].priority = priority;

    // Update constraints based on priority
    this.syncConfig[category].constraints = {
      ...DEFAULT_CONSTRAINTS[priority],
      ...this.syncConfig[category].constraints,
    };

    await this.saveConfig();
  }

  /**
   * Set constraints for a sync category
   */
  public async setConstraints(
    category: SyncCategory,
    constraints: Partial<SyncConstraints>
  ): Promise<void> {
    if (!this.syncConfig[category]) {
      throw new Error(`Invalid sync category: ${category}`);
    }

    this.syncConfig[category].constraints = {
      ...this.syncConfig[category].constraints,
      ...constraints,
    };

    await this.saveConfig();
  }

  /**
   * Enable or disable a sync category
   */
  public async setEnabled(category: SyncCategory, enabled: boolean): Promise<void> {
    if (!this.syncConfig[category]) {
      throw new Error(`Invalid sync category: ${category}`);
    }

    this.syncConfig[category].enabled = enabled;

    await this.saveConfig();
  }

  /**
   * Get sync configuration for a category
   */
  public getConfig(category: SyncCategory): SyncConfig {
    return this.syncConfig[category];
  }

  /**
   * Get all sync configurations
   */
  public getAllConfigs(): Record<SyncCategory, SyncConfig> {
    return { ...this.syncConfig };
  }

  /**
   * Start periodic sync with specified interval
   */
  public startPeriodicSync(intervalMs: number = 15 * 60 * 1000): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncIfNeeded();
    }, intervalMs);

    console.log(`Periodic sync started with interval: ${intervalMs}ms`);
  }

  /**
   * Stop periodic sync
   */
  public stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log("Periodic sync stopped");
    }
  }

  /**
   * Check if sync is needed and perform it if conditions are met
   */
  public async syncIfNeeded(): Promise<SyncResult | null> {
    if (this.isSyncing) {
      return null;
    }

    try {
      this.isSyncing = true;

      // Get current conditions
      const networkState = await NetInfo.fetch();
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const isCharging = (await Battery.getBatteryStateAsync()) === Battery.BatteryState.CHARGING;

      // Calculate battery percentage (0-100)
      const batteryPercent = Math.round(batteryLevel * 100);

      // Get categories eligible for sync based on current conditions
      const eligibleCategories = this.getEligibleCategories(
        networkState,
        batteryPercent,
        isCharging
      );

      if (eligibleCategories.length === 0) {
        console.log("No eligible categories for sync");
        return {
          success: true,
          syncedCategories: [],
          skippedCategories: Object.values(SyncCategory),
          failedCategories: [],
          itemsSynced: 0,
          dataSizeSynced: 0,
        };
      }

      // Perform sync for eligible categories
      return await this.syncCategories(eligibleCategories);
    } catch (error) {
      console.error("Error in syncIfNeeded:", error);

      return {
        success: false,
        syncedCategories: [],
        skippedCategories: [],
        failedCategories: Object.values(SyncCategory),
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        itemsSynced: 0,
        dataSizeSynced: 0,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get categories eligible for sync based on current conditions
   */
  private getEligibleCategories(
    networkState: NetInfoState,
    batteryPercent: number,
    isCharging: boolean
  ): SyncCategory[] {
    const eligible: SyncCategory[] = [];

    // Network type
    const networkType = networkState.type as "wifi" | "cellular" | "ethernet" | "other";

    Object.entries(this.syncConfig).forEach(([category, config]) => {
      const categoryEnum = category as SyncCategory;

      // Skip disabled categories
      if (!config.enabled) {
        return;
      }

      // Check constraints
      const constraints = config.constraints;

      // Check network type
      if (!constraints.networkTypes.includes(networkType)) {
        return;
      }

      // Check battery level
      if (batteryPercent < constraints.minBatteryPercent) {
        return;
      }

      // Check charging state
      if (constraints.requiresCharging && !isCharging) {
        return;
      }

      // All constraints met, add to eligible list
      eligible.push(categoryEnum);
    });

    return eligible;
  }

  /**
   * Sync specified categories
   */
  private async syncCategories(categories: SyncCategory[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCategories: [],
      skippedCategories: [],
      failedCategories: [],
      itemsSynced: 0,
      dataSizeSynced: 0,
    };

    // Queue sync operations
    for (const category of categories) {
      try {
        let syncSuccess = false;

        // Different sync logic for each category
        switch (category) {
          case SyncCategory.PROPERTIES:
            syncSuccess = await this.syncProperties();
            break;

          case SyncCategory.REPORTS:
            syncSuccess = await this.syncReports();
            break;

          case SyncCategory.PHOTOS:
            syncSuccess = await this.syncPhotos();
            break;

          case SyncCategory.COMPARABLES:
            syncSuccess = await this.syncComparables();
            break;

          case SyncCategory.SKETCHES:
            syncSuccess = await this.syncSketches();
            break;

          case SyncCategory.NOTES:
            syncSuccess = await this.syncNotes();
            break;

          case SyncCategory.USER_PREFERENCES:
            syncSuccess = await this.syncUserPreferences();
            break;
        }

        if (syncSuccess) {
          result.syncedCategories.push(category);

          // Update last sync time
          this.syncConfig[category].lastSync = Date.now();
        } else {
          result.failedCategories.push(category);
        }
      } catch (error) {
        console.error(`Error syncing ${category}:`, error);
        result.failedCategories.push(category);
        result.success = false;
      }
    }

    // Save updated sync times
    await this.saveConfig();

    return result;
  }

  /**
   * Sync properties
   */
  private async syncProperties(): Promise<boolean> {
    try {
      // The DataSyncService handles the actual sync logic
      await this.dataSyncService.syncProperties();

      return true;
    } catch (error) {
      console.error("Error syncing properties:", error);
      return false;
    }
  }

  /**
   * Sync reports
   */
  private async syncReports(): Promise<boolean> {
    try {
      // Queue any pending reports for sync
      const operations = this.offlineQueueService
        .getQueue()
        .filter(
          (op) => op.type === OperationType.CREATE_REPORT || op.type === OperationType.UPDATE_REPORT
        );

      // Process all report operations
      if (operations.length > 0) {
        await this.offlineQueueService.processQueue();
      }

      return true;
    } catch (error) {
      console.error("Error syncing reports:", error);
      return false;
    }
  }

  /**
   * Sync photos
   */
  private async syncPhotos(): Promise<boolean> {
    try {
      // Queue any pending photo uploads for sync
      const operations = this.offlineQueueService
        .getQueue()
        .filter(
          (op) => op.type === OperationType.UPLOAD_PHOTO || op.type === OperationType.ENHANCE_PHOTO
        );

      // Get constraints for photos
      const constraints = this.syncConfig[SyncCategory.PHOTOS].constraints;

      // Calculate total data size
      let totalDataSize = 0;
      let processedCount = 0;

      // Process operations up to the max data size or max items
      for (const operation of operations) {
        // Estimate data size from the operation data
        const estimatedSize = this.estimatePhotoSize(operation.data);

        // Check if this operation would exceed the max data size
        if (constraints.maxDataSize && totalDataSize + estimatedSize > constraints.maxDataSize) {
          break;
        }

        // Check if this operation would exceed the max items
        if (constraints.maxItems && processedCount >= constraints.maxItems) {
          break;
        }

        // Process the operation
        await this.offlineQueueService.retryOperation(operation.id);

        totalDataSize += estimatedSize;
        processedCount++;
      }

      return true;
    } catch (error) {
      console.error("Error syncing photos:", error);
      return false;
    }
  }

  /**
   * Estimate the size of a photo from operation data
   */
  private estimatePhotoSize(operationData: any): number {
    // If we have the file size, use it
    if (operationData.fileSize) {
      return operationData.fileSize;
    }

    // If we have the width and height, estimate based on those
    if (operationData.width && operationData.height) {
      // Rough estimate: 3 bytes per pixel (RGB)
      return operationData.width * operationData.height * 3;
    }

    // Default estimate: 1 MB
    return 1 * 1024 * 1024;
  }

  /**
   * Sync comparables
   */
  private async syncComparables(): Promise<boolean> {
    try {
      // Sync comparable properties
      // Implementation would be similar to syncProperties

      return true;
    } catch (error) {
      console.error("Error syncing comparables:", error);
      return false;
    }
  }

  /**
   * Sync sketches
   */
  private async syncSketches(): Promise<boolean> {
    try {
      // Sync sketches and floor plans
      // Implementation would be similar to syncPhotos

      return true;
    } catch (error) {
      console.error("Error syncing sketches:", error);
      return false;
    }
  }

  /**
   * Sync voice notes
   */
  private async syncNotes(): Promise<boolean> {
    try {
      // Sync voice notes
      // Implementation would be similar to syncPhotos

      return true;
    } catch (error) {
      console.error("Error syncing notes:", error);
      return false;
    }
  }

  /**
   * Sync user preferences
   */
  private async syncUserPreferences(): Promise<boolean> {
    try {
      // Sync user preferences
      // This would be a simple API call to update user preferences

      return true;
    } catch (error) {
      console.error("Error syncing user preferences:", error);
      return false;
    }
  }

  /**
   * Force sync all categories immediately, ignoring constraints
   */
  public async forceSyncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    try {
      this.isSyncing = true;

      return await this.syncCategories(Object.values(SyncCategory));
    } catch (error) {
      console.error("Error force syncing all categories:", error);

      return {
        success: false,
        syncedCategories: [],
        skippedCategories: [],
        failedCategories: Object.values(SyncCategory),
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        itemsSynced: 0,
        dataSizeSynced: 0,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force sync specific categories immediately, ignoring constraints
   */
  public async forceSyncCategories(categories: SyncCategory[]): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    try {
      this.isSyncing = true;

      return await this.syncCategories(categories);
    } catch (error) {
      console.error("Error force syncing categories:", error);

      return {
        success: false,
        syncedCategories: [],
        skippedCategories: [],
        failedCategories: categories,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        itemsSynced: 0,
        dataSizeSynced: 0,
      };
    } finally {
      this.isSyncing = false;
    }
  }
}
