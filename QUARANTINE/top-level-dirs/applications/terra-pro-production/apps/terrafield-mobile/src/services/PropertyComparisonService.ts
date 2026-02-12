import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import { AuthService } from "./AuthService";
import { SecureStorageService, SecurityLevel } from "./SecureStorageService";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";
import { ComparableService } from "./ComparableService";

/**
 * Comparison metric type
 */
export enum ComparisonMetricType {
  PRICE = "price",
  PRICE_PER_SQFT = "price_per_sqft",
  SQUARE_FOOTAGE = "square_footage",
  LOT_SIZE = "lot_size",
  BEDROOMS = "bedrooms",
  BATHROOMS = "bathrooms",
  YEAR_BUILT = "year_built",
  GARAGE_SPACES = "garage_spaces",
  DAYS_ON_MARKET = "days_on_market",
  DISTANCE = "distance",
  CONDITION = "condition",
  QUALITY = "quality",
  ADJUSTMENT = "adjustment",
  RECONCILED_VALUE = "reconciled_value",
  SIMILARITY_SCORE = "similarity_score",
  CUSTOM = "custom",
}

/**
 * Chart type
 */
export enum ChartType {
  BAR = "bar",
  LINE = "line",
  RADAR = "radar",
  PIE = "pie",
  SCATTER = "scatter",
  BUBBLE = "bubble",
  TABLE = "table",
  HEATMAP = "heatmap",
}

/**
 * Visualization mode
 */
export enum VisualizationMode {
  CHART = "chart",
  MAP = "map",
  TABLE = "table",
  GRID = "grid",
  DETAIL = "detail",
  SUMMARY = "summary",
}

/**
 * Comparison dashboard config
 */
export interface ComparisonDashboardConfig {
  /**
   * Dashboard ID
   */
  id: string;

  /**
   * Dashboard name
   */
  name: string;

  /**
   * Dashboard description
   */
  description: string;

  /**
   * Dashboard visualization mode
   */
  visualizationMode: VisualizationMode;

  /**
   * Metrics to display
   */
  metrics: {
    /**
     * Metric type
     */
    type: ComparisonMetricType;

    /**
     * Display name
     */
    displayName: string;

    /**
     * Chart type
     */
    chartType: ChartType;

    /**
     * Is metric enabled
     */
    enabled: boolean;

    /**
     * Custom field name (for CUSTOM type)
     */
    customField?: string;

    /**
     * Custom field unit (for CUSTOM type)
     */
    customUnit?: string;

    /**
     * Custom field formula (for CUSTOM type)
     */
    customFormula?: string;

    /**
     * Value mapping
     */
    valueMapping?: {
      key: string;
      value: string;
    }[];

    /**
     * Color scale
     */
    colorScale?: string[];

    /**
     * Display position
     */
    position: number;
  }[];

  /**
   * Dashboard layout (grid configuration)
   */
  layout?: {
    rows: number;
    columns: number;
    items: {
      id: string;
      metricType: ComparisonMetricType;
      row: number;
      column: number;
      rowSpan: number;
      columnSpan: number;
    }[];
  };

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;

  /**
   * Is default dashboard
   */
  isDefault: boolean;

  /**
   * Is system dashboard
   */
  isSystem: boolean;
}

/**
 * Comparison result
 */
export interface ComparisonResult {
  /**
   * Result ID
   */
  id: string;

  /**
   * Subject property ID
   */
  subjectPropertyId: string;

  /**
   * Comparable property IDs
   */
  comparablePropertyIds: string[];

  /**
   * Dashboard ID used for comparison
   */
  dashboardId: string;

  /**
   * Comparison timestamp
   */
  timestamp: number;

  /**
   * Metric results
   */
  metricResults: {
    /**
     * Metric type
     */
    type: ComparisonMetricType;

    /**
     * Subject property value
     */
    subjectValue: any;

    /**
     * Comparable property values
     */
    comparableValues: {
      /**
       * Property ID
       */
      propertyId: string;

      /**
       * Property value
       */
      value: any;

      /**
       * Difference from subject (percentage)
       */
      percentDifference: number;

      /**
       * Difference from subject (absolute)
       */
      absoluteDifference: number;

      /**
       * Adjustment value
       */
      adjustment?: number;
    }[];

    /**
     * Aggregate statistics
     */
    statistics: {
      min: number;
      max: number;
      mean: number;
      median: number;
      standardDeviation: number;
    };
  }[];

  /**
   * Overall similarity scores
   */
  similarityScores: {
    /**
     * Property ID
     */
    propertyId: string;

    /**
     * Overall similarity score
     */
    score: number;

    /**
     * Similarity scores by category
     */
    categoryScores: {
      /**
       * Category name
       */
      category: string;

      /**
       * Category score
       */
      score: number;
    }[];
  }[];

  /**
   * Value reconciliation
   */
  valueReconciliation?: {
    /**
     * Minimum indicated value
     */
    minValue: number;

    /**
     * Maximum indicated value
     */
    maxValue: number;

    /**
     * Reconciled value
     */
    reconciledValue: number;

    /**
     * Reconciliation notes
     */
    notes?: string;
  };

  /**
   * Comparison notes
   */
  notes?: string;
}

/**
 * Property comparison service options
 */
export interface PropertyComparisonServiceOptions {
  /**
   * Max cache size (bytes)
   */
  maxCacheSize: number;

  /**
   * Default cache expiration (ms)
   */
  defaultCacheExpiration: number;

  /**
   * Comparison field weights
   */
  fieldWeights: Record<string, number>;

  /**
   * Default metrics to include
   */
  defaultMetrics: ComparisonMetricType[];

  /**
   * Default chart type
   */
  defaultChartType: ChartType;

  /**
   * Default visualization mode
   */
  defaultVisualizationMode: VisualizationMode;
}

/**
 * Default service options
 */
const DEFAULT_OPTIONS: PropertyComparisonServiceOptions = {
  maxCacheSize: 10 * 1024 * 1024, // 10 MB
  defaultCacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
  fieldWeights: {
    location: 0.3,
    size: 0.2,
    propertyType: 0.15,
    yearBuilt: 0.1,
    bedrooms: 0.1,
    bathrooms: 0.1,
    condition: 0.05,
  },
  defaultMetrics: [
    ComparisonMetricType.PRICE,
    ComparisonMetricType.PRICE_PER_SQFT,
    ComparisonMetricType.SQUARE_FOOTAGE,
    ComparisonMetricType.BEDROOMS,
    ComparisonMetricType.BATHROOMS,
    ComparisonMetricType.YEAR_BUILT,
  ],
  defaultChartType: ChartType.BAR,
  defaultVisualizationMode: VisualizationMode.CHART,
};

/**
 * Property comparison service
 */
export class PropertyComparisonService {
  private static instance: PropertyComparisonService;
  private options: PropertyComparisonServiceOptions;
  private authService: AuthService;
  private secureStorageService: SecureStorageService;
  private offlineQueueService: OfflineQueueService;
  private comparableService: ComparableService;

  // State
  private dashboards: Map<string, ComparisonDashboardConfig> = new Map();
  private comparisonResults: Map<string, ComparisonResult> = new Map();

  // Cache
  private cache: Map<
    string,
    {
      data: any;
      timestamp: number;
      expires: number;
      size: number;
    }
  > = new Map();
  private cacheSize: number = 0;

  // API endpoints
  private readonly API_ENDPOINT = "https://api.appraisalcore.replit.app/api/comparisons";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.options = { ...DEFAULT_OPTIONS };
    this.authService = AuthService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();
    this.offlineQueueService = OfflineQueueService.getInstance();
    this.comparableService = ComparableService.getInstance();

    // Load state
    this.loadState();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PropertyComparisonService {
    if (!PropertyComparisonService.instance) {
      PropertyComparisonService.instance = new PropertyComparisonService();
    }
    return PropertyComparisonService.instance;
  }

  /**
   * Initialize with options
   */
  public initialize(options: Partial<PropertyComparisonServiceOptions>): void {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Load state from storage
   */
  private async loadState(): Promise<void> {
    try {
      // Load dashboards
      const dashboards = await this.secureStorageService.getData<ComparisonDashboardConfig[]>(
        "terrafield:comparison:dashboards",
        [],
        SecurityLevel.MEDIUM
      );

      for (const dashboard of dashboards) {
        this.dashboards.set(dashboard.id, dashboard);
      }

      // Load comparison results
      const results = await this.secureStorageService.getData<ComparisonResult[]>(
        "terrafield:comparison:results",
        [],
        SecurityLevel.MEDIUM
      );

      for (const result of results) {
        this.comparisonResults.set(result.id, result);
      }

      // Initialize dashboards if none exist
      if (this.dashboards.size === 0) {
        await this.initializeDefaultDashboards();
      }

      // Initialize cache metrics
      this.calculateCacheSize();
    } catch (error) {
      console.error("Error loading property comparison state:", error);
    }
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    try {
      // Save dashboards
      await this.secureStorageService.saveData(
        "terrafield:comparison:dashboards",
        Array.from(this.dashboards.values()),
        SecurityLevel.MEDIUM
      );

      // Save comparison results
      await this.secureStorageService.saveData(
        "terrafield:comparison:results",
        Array.from(this.comparisonResults.values()),
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving property comparison state:", error);
    }
  }

  /**
   * Calculate cache size
   */
  private calculateCacheSize(): void {
    let size = 0;

    for (const entry of this.cache.values()) {
      size += entry.size;
    }

    this.cacheSize = size;
    console.log(`Cache size: ${(this.cacheSize / 1024 / 1024).toFixed(2)} MB`);
  }

  /**
   * Initialize default dashboards
   */
  private async initializeDefaultDashboards(): Promise<void> {
    try {
      // Create default dashboards

      // 1. Standard comparison dashboard
      const standardDashboard: ComparisonDashboardConfig = {
        id: "dashboard_standard",
        name: "Standard Comparison",
        description: "Standard property comparison dashboard showing key metrics",
        visualizationMode: VisualizationMode.CHART,
        metrics: [
          {
            type: ComparisonMetricType.PRICE,
            displayName: "Price",
            chartType: ChartType.BAR,
            enabled: true,
            position: 0,
          },
          {
            type: ComparisonMetricType.PRICE_PER_SQFT,
            displayName: "Price per Sq Ft",
            chartType: ChartType.BAR,
            enabled: true,
            position: 1,
          },
          {
            type: ComparisonMetricType.SQUARE_FOOTAGE,
            displayName: "Square Footage",
            chartType: ChartType.BAR,
            enabled: true,
            position: 2,
          },
          {
            type: ComparisonMetricType.BEDROOMS,
            displayName: "Bedrooms",
            chartType: ChartType.BAR,
            enabled: true,
            position: 3,
          },
          {
            type: ComparisonMetricType.BATHROOMS,
            displayName: "Bathrooms",
            chartType: ChartType.BAR,
            enabled: true,
            position: 4,
          },
          {
            type: ComparisonMetricType.YEAR_BUILT,
            displayName: "Year Built",
            chartType: ChartType.BAR,
            enabled: true,
            position: 5,
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        isSystem: true,
      };

      // 2. Detailed comparison dashboard
      const detailedDashboard: ComparisonDashboardConfig = {
        id: "dashboard_detailed",
        name: "Detailed Comparison",
        description: "Detailed property comparison with all available metrics",
        visualizationMode: VisualizationMode.GRID,
        metrics: [
          {
            type: ComparisonMetricType.PRICE,
            displayName: "Price",
            chartType: ChartType.BAR,
            enabled: true,
            position: 0,
          },
          {
            type: ComparisonMetricType.PRICE_PER_SQFT,
            displayName: "Price per Sq Ft",
            chartType: ChartType.BAR,
            enabled: true,
            position: 1,
          },
          {
            type: ComparisonMetricType.SQUARE_FOOTAGE,
            displayName: "Square Footage",
            chartType: ChartType.BAR,
            enabled: true,
            position: 2,
          },
          {
            type: ComparisonMetricType.LOT_SIZE,
            displayName: "Lot Size",
            chartType: ChartType.BAR,
            enabled: true,
            position: 3,
          },
          {
            type: ComparisonMetricType.BEDROOMS,
            displayName: "Bedrooms",
            chartType: ChartType.BAR,
            enabled: true,
            position: 4,
          },
          {
            type: ComparisonMetricType.BATHROOMS,
            displayName: "Bathrooms",
            chartType: ChartType.BAR,
            enabled: true,
            position: 5,
          },
          {
            type: ComparisonMetricType.YEAR_BUILT,
            displayName: "Year Built",
            chartType: ChartType.BAR,
            enabled: true,
            position: 6,
          },
          {
            type: ComparisonMetricType.GARAGE_SPACES,
            displayName: "Garage Spaces",
            chartType: ChartType.BAR,
            enabled: true,
            position: 7,
          },
          {
            type: ComparisonMetricType.DAYS_ON_MARKET,
            displayName: "Days on Market",
            chartType: ChartType.BAR,
            enabled: true,
            position: 8,
          },
          {
            type: ComparisonMetricType.DISTANCE,
            displayName: "Distance",
            chartType: ChartType.BAR,
            enabled: true,
            position: 9,
          },
          {
            type: ComparisonMetricType.CONDITION,
            displayName: "Condition",
            chartType: ChartType.BAR,
            enabled: true,
            position: 10,
          },
          {
            type: ComparisonMetricType.QUALITY,
            displayName: "Quality",
            chartType: ChartType.BAR,
            enabled: true,
            position: 11,
          },
        ],
        layout: {
          rows: 4,
          columns: 3,
          items: [
            {
              id: "item_1",
              metricType: ComparisonMetricType.PRICE,
              row: 0,
              column: 0,
              rowSpan: 1,
              columnSpan: 2,
            },
            {
              id: "item_2",
              metricType: ComparisonMetricType.PRICE_PER_SQFT,
              row: 0,
              column: 2,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_3",
              metricType: ComparisonMetricType.SQUARE_FOOTAGE,
              row: 1,
              column: 0,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_4",
              metricType: ComparisonMetricType.LOT_SIZE,
              row: 1,
              column: 1,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_5",
              metricType: ComparisonMetricType.BEDROOMS,
              row: 1,
              column: 2,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_6",
              metricType: ComparisonMetricType.BATHROOMS,
              row: 2,
              column: 0,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_7",
              metricType: ComparisonMetricType.YEAR_BUILT,
              row: 2,
              column: 1,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_8",
              metricType: ComparisonMetricType.GARAGE_SPACES,
              row: 2,
              column: 2,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_9",
              metricType: ComparisonMetricType.DAYS_ON_MARKET,
              row: 3,
              column: 0,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_10",
              metricType: ComparisonMetricType.CONDITION,
              row: 3,
              column: 1,
              rowSpan: 1,
              columnSpan: 1,
            },
            {
              id: "item_11",
              metricType: ComparisonMetricType.QUALITY,
              row: 3,
              column: 2,
              rowSpan: 1,
              columnSpan: 1,
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
        isSystem: true,
      };

      // 3. Adjustment grid dashboard
      const adjustmentDashboard: ComparisonDashboardConfig = {
        id: "dashboard_adjustment",
        name: "Adjustment Grid",
        description: "Detailed adjustment grid for valuation analysis",
        visualizationMode: VisualizationMode.TABLE,
        metrics: [
          {
            type: ComparisonMetricType.PRICE,
            displayName: "Price",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 0,
          },
          {
            type: ComparisonMetricType.SQUARE_FOOTAGE,
            displayName: "Square Footage",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 1,
          },
          {
            type: ComparisonMetricType.LOT_SIZE,
            displayName: "Lot Size",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 2,
          },
          {
            type: ComparisonMetricType.BEDROOMS,
            displayName: "Bedrooms",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 3,
          },
          {
            type: ComparisonMetricType.BATHROOMS,
            displayName: "Bathrooms",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 4,
          },
          {
            type: ComparisonMetricType.YEAR_BUILT,
            displayName: "Year Built",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 5,
          },
          {
            type: ComparisonMetricType.CONDITION,
            displayName: "Condition",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 6,
          },
          {
            type: ComparisonMetricType.QUALITY,
            displayName: "Quality",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 7,
          },
          {
            type: ComparisonMetricType.ADJUSTMENT,
            displayName: "Net Adjustments",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 8,
          },
          {
            type: ComparisonMetricType.RECONCILED_VALUE,
            displayName: "Adjusted Value",
            chartType: ChartType.TABLE,
            enabled: true,
            position: 9,
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
        isSystem: true,
      };

      // Add dashboards
      this.dashboards.set(standardDashboard.id, standardDashboard);
      this.dashboards.set(detailedDashboard.id, detailedDashboard);
      this.dashboards.set(adjustmentDashboard.id, adjustmentDashboard);

      // Save state
      await this.saveState();
    } catch (error) {
      console.error("Error initializing default dashboards:", error);
    }
  }

  /**
   * Create dashboard
   */
  public async createDashboard(
    config: Omit<ComparisonDashboardConfig, "id" | "createdAt" | "updatedAt" | "isSystem">
  ): Promise<ComparisonDashboardConfig> {
    try {
      // Generate dashboard ID
      const dashboardId = `dashboard_${uuidv4()}`;

      // Create dashboard configuration
      const dashboard: ComparisonDashboardConfig = {
        ...config,
        id: dashboardId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isSystem: false,
      };

      // Store dashboard
      this.dashboards.set(dashboardId, dashboard);
      await this.saveState();

      return dashboard;
    } catch (error) {
      console.error("Error creating dashboard:", error);
      throw error;
    }
  }

  /**
   * Update dashboard
   */
  public async updateDashboard(
    dashboardId: string,
    updates: Partial<ComparisonDashboardConfig>
  ): Promise<ComparisonDashboardConfig> {
    try {
      const dashboard = this.dashboards.get(dashboardId);

      if (!dashboard) {
        throw new Error(`Dashboard with ID ${dashboardId} not found`);
      }

      // Cannot update system dashboards
      if (dashboard.isSystem) {
        throw new Error("System dashboards cannot be modified");
      }

      // Update dashboard
      const updatedDashboard: ComparisonDashboardConfig = {
        ...dashboard,
        ...updates,
        id: dashboard.id, // Ensure ID remains the same
        isSystem: dashboard.isSystem, // Ensure system flag remains the same
        createdAt: dashboard.createdAt, // Ensure created timestamp remains the same
        updatedAt: Date.now(),
      };

      // Store updated dashboard
      this.dashboards.set(dashboardId, updatedDashboard);
      await this.saveState();

      return updatedDashboard;
    } catch (error) {
      console.error("Error updating dashboard:", error);
      throw error;
    }
  }

  /**
   * Delete dashboard
   */
  public async deleteDashboard(dashboardId: string): Promise<boolean> {
    try {
      const dashboard = this.dashboards.get(dashboardId);

      if (!dashboard) {
        return false;
      }

      // Cannot delete system dashboards
      if (dashboard.isSystem) {
        throw new Error("System dashboards cannot be deleted");
      }

      // Remove dashboard
      this.dashboards.delete(dashboardId);

      // Save state
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      return false;
    }
  }

  /**
   * Get dashboards
   */
  public async getDashboards(): Promise<ComparisonDashboardConfig[]> {
    try {
      return Array.from(this.dashboards.values());
    } catch (error) {
      console.error("Error getting dashboards:", error);
      return [];
    }
  }

  /**
   * Get dashboard by ID
   */
  public async getDashboard(dashboardId: string): Promise<ComparisonDashboardConfig | null> {
    try {
      return this.dashboards.get(dashboardId) || null;
    } catch (error) {
      console.error("Error getting dashboard:", error);
      return null;
    }
  }

  /**
   * Get default dashboard
   */
  public async getDefaultDashboard(): Promise<ComparisonDashboardConfig | null> {
    try {
      const dashboards = Array.from(this.dashboards.values());
      return dashboards.find((d) => d.isDefault) || dashboards[0] || null;
    } catch (error) {
      console.error("Error getting default dashboard:", error);
      return null;
    }
  }

  /**
   * Set default dashboard
   */
  public async setDefaultDashboard(dashboardId: string): Promise<boolean> {
    try {
      const dashboard = this.dashboards.get(dashboardId);

      if (!dashboard) {
        return false;
      }

      // Update all dashboards
      for (const [id, dash] of this.dashboards.entries()) {
        if (id === dashboardId) {
          dash.isDefault = true;
        } else if (dash.isDefault) {
          dash.isDefault = false;
        }
      }

      // Save state
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error setting default dashboard:", error);
      return false;
    }
  }

  /**
   * Compare properties
   */
  public async compareProperties(
    subjectPropertyId: string,
    comparablePropertyIds: string[],
    dashboardId?: string
  ): Promise<ComparisonResult> {
    try {
      // Validate inputs
      if (!subjectPropertyId) {
        throw new Error("Subject property ID is required");
      }

      if (!comparablePropertyIds || comparablePropertyIds.length === 0) {
        throw new Error("At least one comparable property ID is required");
      }

      // Get dashboard
      let dashboard: ComparisonDashboardConfig | null;

      if (dashboardId) {
        dashboard = await this.getDashboard(dashboardId);
      } else {
        dashboard = await this.getDefaultDashboard();
      }

      if (!dashboard) {
        throw new Error("Dashboard not found");
      }

      // Check cache
      const cacheKey = this.getComparisonCacheKey(
        subjectPropertyId,
        comparablePropertyIds,
        dashboard.id
      );
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult && cachedResult.expires > Date.now()) {
        console.log("Using cached comparison result");
        return cachedResult.data;
      }

      // Get properties
      // In a real implementation, you would fetch these from a property service
      // For this example, we'll use mock data
      const subjectProperty = await this.getProperty(subjectPropertyId);
      const comparableProperties = await Promise.all(
        comparablePropertyIds.map((id) => this.getProperty(id))
      );

      // Generate comparison ID
      const comparisonId = `comparison_${uuidv4()}`;

      // Create comparison result
      const result: ComparisonResult = {
        id: comparisonId,
        subjectPropertyId,
        comparablePropertyIds,
        dashboardId: dashboard.id,
        timestamp: Date.now(),
        metricResults: [],
        similarityScores: [],
      };

      // Process each metric
      for (const metric of dashboard.metrics.filter((m) => m.enabled)) {
        // Get values for metric
        const subjectValue = this.getPropertyValue(subjectProperty, metric.type);
        const comparableValues = comparableProperties.map((property) => {
          const value = this.getPropertyValue(property, metric.type);
          let percentDifference = 0;
          let absoluteDifference = 0;

          if (typeof subjectValue === "number" && typeof value === "number" && subjectValue !== 0) {
            percentDifference = ((value - subjectValue) / subjectValue) * 100;
            absoluteDifference = value - subjectValue;
          }

          return {
            propertyId: property.id,
            value,
            percentDifference,
            absoluteDifference,
          };
        });

        // Calculate statistics
        const numericValues = comparableValues
          .map((cv) => cv.value)
          .filter((v) => typeof v === "number");

        const statistics = this.calculateStatistics(numericValues);

        // Add metric result
        result.metricResults.push({
          type: metric.type,
          subjectValue,
          comparableValues,
          statistics,
        });
      }

      // Calculate similarity scores
      result.similarityScores = this.calculateSimilarityScores(
        subjectProperty,
        comparableProperties
      );

      // Store result
      this.comparisonResults.set(comparisonId, result);
      await this.saveState();

      // Cache result
      this.cacheComparisonResult(cacheKey, result);

      return result;
    } catch (error) {
      console.error("Error comparing properties:", error);
      throw error;
    }
  }

  /**
   * Get property
   */
  private async getProperty(propertyId: string): Promise<any> {
    try {
      // In a real app, you would fetch this from a property service
      // For now, we'll use a simple mock property

      // Generate a mock property based on the ID
      // This ensures that each unique ID gets a unique but consistent property
      const idNumber = parseInt(propertyId.replace(/\D/g, ""), 10) || 0;

      return {
        id: propertyId,
        address: `${100 + (idNumber % 900)} Main St`,
        city: "Anytown",
        state: "CA",
        zipCode: "90210",
        propertyType: "Single Family",
        bedrooms: 3 + (idNumber % 3),
        bathrooms: 2 + (idNumber % 2),
        squareFootage: 1500 + ((idNumber * 10) % 1000),
        lotSize: 5000 + ((idNumber * 50) % 5000),
        yearBuilt: 1980 + (idNumber % 40),
        garageSpaces: 1 + (idNumber % 3),
        condition: ["Fair", "Average", "Good", "Excellent"][idNumber % 4],
        quality: ["Fair", "Average", "Good", "Excellent"][idNumber % 4],
        daysOnMarket: 10 + (idNumber % 90),
        price: 300000 + ((idNumber * 1000) % 200000),
        pricePerSqFt: 150 + (idNumber % 100),
        latitude: 34.0522 + idNumber * 0.001,
        longitude: -118.2437 - idNumber * 0.001,
        distance: (idNumber % 10) * 0.1,
      };
    } catch (error) {
      console.error("Error getting property:", error);
      throw error;
    }
  }

  /**
   * Get property value for a specific metric
   */
  private getPropertyValue(property: any, metricType: ComparisonMetricType): any {
    switch (metricType) {
      case ComparisonMetricType.PRICE:
        return property.price;
      case ComparisonMetricType.PRICE_PER_SQFT:
        return property.pricePerSqFt;
      case ComparisonMetricType.SQUARE_FOOTAGE:
        return property.squareFootage;
      case ComparisonMetricType.LOT_SIZE:
        return property.lotSize;
      case ComparisonMetricType.BEDROOMS:
        return property.bedrooms;
      case ComparisonMetricType.BATHROOMS:
        return property.bathrooms;
      case ComparisonMetricType.YEAR_BUILT:
        return property.yearBuilt;
      case ComparisonMetricType.GARAGE_SPACES:
        return property.garageSpaces;
      case ComparisonMetricType.DAYS_ON_MARKET:
        return property.daysOnMarket;
      case ComparisonMetricType.DISTANCE:
        return property.distance;
      case ComparisonMetricType.CONDITION:
        return property.condition;
      case ComparisonMetricType.QUALITY:
        return property.quality;
      case ComparisonMetricType.ADJUSTMENT:
        return property.adjustment;
      case ComparisonMetricType.RECONCILED_VALUE:
        return property.reconciledValue;
      case ComparisonMetricType.SIMILARITY_SCORE:
        return property.similarityScore;
      case ComparisonMetricType.CUSTOM:
        // Custom field handling would go here
        return null;
      default:
        return null;
    }
  }

  /**
   * Calculate statistics for numeric values
   */
  private calculateStatistics(values: number[]): {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
  } {
    if (!values || values.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        standardDeviation: 0,
      };
    }

    // Sort values for median calculation
    const sortedValues = [...values].sort((a, b) => a - b);

    // Calculate min and max
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];

    // Calculate mean
    const sum = sortedValues.reduce((a, b) => a + b, 0);
    const mean = sum / sortedValues.length;

    // Calculate median
    let median;
    if (sortedValues.length % 2 === 0) {
      // Even number of values
      const midIndex = sortedValues.length / 2;
      median = (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2;
    } else {
      // Odd number of values
      median = sortedValues[Math.floor(sortedValues.length / 2)];
    }

    // Calculate standard deviation
    const squareDiffs = sortedValues.map((value) => Math.pow(value - mean, 2));
    const variance = squareDiffs.reduce((a, b) => a + b, 0) / sortedValues.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      min,
      max,
      mean,
      median,
      standardDeviation,
    };
  }

  /**
   * Calculate similarity scores
   */
  private calculateSimilarityScores(
    subjectProperty: any,
    comparableProperties: any[]
  ): {
    propertyId: string;
    score: number;
    categoryScores: {
      category: string;
      score: number;
    }[];
  }[] {
    return comparableProperties.map((property) => {
      // Calculate category scores
      const categoryScores = [
        {
          category: "Location",
          score: this.calculateLocationSimilarity(subjectProperty, property),
        },
        {
          category: "Size",
          score: this.calculateSizeSimilarity(subjectProperty, property),
        },
        {
          category: "Features",
          score: this.calculateFeatureSimilarity(subjectProperty, property),
        },
        {
          category: "Age",
          score: this.calculateAgeSimilarity(subjectProperty, property),
        },
        {
          category: "Condition",
          score: this.calculateConditionSimilarity(subjectProperty, property),
        },
      ];

      // Calculate overall score as weighted average
      const overallScore = categoryScores.reduce((sum, category) => {
        const weight = this.options.fieldWeights[category.category.toLowerCase()] || 0.2;
        return sum + category.score * weight;
      }, 0);

      return {
        propertyId: property.id,
        score: overallScore,
        categoryScores,
      };
    });
  }

  /**
   * Calculate location similarity
   */
  private calculateLocationSimilarity(subject: any, comparable: any): number {
    // In a real implementation, this would calculate distance and
    // neighborhood similarity based on geolocation, school districts, etc.

    // For this example, we'll use a simplified distance-based approach
    // where closer properties are more similar

    if (typeof comparable.distance === "number") {
      // Distance is in miles
      if (comparable.distance <= 0.1) return 1.0; // Within 0.1 miles
      if (comparable.distance <= 0.25) return 0.95;
      if (comparable.distance <= 0.5) return 0.9;
      if (comparable.distance <= 1.0) return 0.8;
      if (comparable.distance <= 2.0) return 0.7;
      if (comparable.distance <= 3.0) return 0.6;
      if (comparable.distance <= 5.0) return 0.4;
      return 0.2; // More than 5 miles away
    }

    // Fallback if distance is not available
    if (subject.zipCode === comparable.zipCode) return 0.8;
    if (subject.city === comparable.city && subject.state === comparable.state) return 0.6;
    if (subject.state === comparable.state) return 0.3;

    return 0.0;
  }

  /**
   * Calculate size similarity
   */
  private calculateSizeSimilarity(subject: any, comparable: any): number {
    // Calculate similarity based on square footage
    let squareFootageSimilarity = 0;

    if (typeof subject.squareFootage === "number" && typeof comparable.squareFootage === "number") {
      const percentDiff =
        Math.abs(comparable.squareFootage - subject.squareFootage) / subject.squareFootage;

      if (percentDiff <= 0.05)
        squareFootageSimilarity = 1.0; // Within 5%
      else if (percentDiff <= 0.1)
        squareFootageSimilarity = 0.9; // Within 10%
      else if (percentDiff <= 0.15)
        squareFootageSimilarity = 0.8; // Within 15%
      else if (percentDiff <= 0.2)
        squareFootageSimilarity = 0.7; // Within 20%
      else if (percentDiff <= 0.25)
        squareFootageSimilarity = 0.6; // Within 25%
      else if (percentDiff <= 0.3)
        squareFootageSimilarity = 0.5; // Within 30%
      else if (percentDiff <= 0.4)
        squareFootageSimilarity = 0.3; // Within 40%
      else squareFootageSimilarity = 0.1; // More than 40% different
    }

    // Calculate similarity based on lot size
    let lotSizeSimilarity = 0;

    if (typeof subject.lotSize === "number" && typeof comparable.lotSize === "number") {
      const percentDiff = Math.abs(comparable.lotSize - subject.lotSize) / subject.lotSize;

      if (percentDiff <= 0.1)
        lotSizeSimilarity = 1.0; // Within 10%
      else if (percentDiff <= 0.2)
        lotSizeSimilarity = 0.9; // Within 20%
      else if (percentDiff <= 0.3)
        lotSizeSimilarity = 0.8; // Within 30%
      else if (percentDiff <= 0.4)
        lotSizeSimilarity = 0.7; // Within 40%
      else if (percentDiff <= 0.5)
        lotSizeSimilarity = 0.5; // Within 50%
      else lotSizeSimilarity = 0.3; // More than 50% different
    }

    // Return weighted average of size similarities
    return squareFootageSimilarity * 0.7 + lotSizeSimilarity * 0.3;
  }

  /**
   * Calculate feature similarity
   */
  private calculateFeatureSimilarity(subject: any, comparable: any): number {
    // Calculate similarity based on bedrooms
    let bedroomSimilarity = 0;

    if (typeof subject.bedrooms === "number" && typeof comparable.bedrooms === "number") {
      const diff = Math.abs(comparable.bedrooms - subject.bedrooms);

      if (diff === 0) bedroomSimilarity = 1.0;
      else if (diff === 1) bedroomSimilarity = 0.8;
      else if (diff === 2) bedroomSimilarity = 0.5;
      else bedroomSimilarity = 0.2;
    }

    // Calculate similarity based on bathrooms
    let bathroomSimilarity = 0;

    if (typeof subject.bathrooms === "number" && typeof comparable.bathrooms === "number") {
      const diff = Math.abs(comparable.bathrooms - subject.bathrooms);

      if (diff === 0) bathroomSimilarity = 1.0;
      else if (diff <= 0.5) bathroomSimilarity = 0.9;
      else if (diff <= 1) bathroomSimilarity = 0.8;
      else if (diff <= 1.5) bathroomSimilarity = 0.6;
      else if (diff <= 2) bathroomSimilarity = 0.4;
      else bathroomSimilarity = 0.2;
    }

    // Calculate similarity based on garage spaces
    let garageSimilarity = 0;

    if (typeof subject.garageSpaces === "number" && typeof comparable.garageSpaces === "number") {
      const diff = Math.abs(comparable.garageSpaces - subject.garageSpaces);

      if (diff === 0) garageSimilarity = 1.0;
      else if (diff === 1) garageSimilarity = 0.8;
      else if (diff === 2) garageSimilarity = 0.5;
      else garageSimilarity = 0.2;
    }

    // Property type similarity
    const propertyTypeSimilarity = subject.propertyType === comparable.propertyType ? 1.0 : 0.3;

    // Return weighted average of feature similarities
    return (
      bedroomSimilarity * 0.3 +
      bathroomSimilarity * 0.3 +
      garageSimilarity * 0.2 +
      propertyTypeSimilarity * 0.2
    );
  }

  /**
   * Calculate age similarity
   */
  private calculateAgeSimilarity(subject: any, comparable: any): number {
    if (typeof subject.yearBuilt === "number" && typeof comparable.yearBuilt === "number") {
      const diff = Math.abs(comparable.yearBuilt - subject.yearBuilt);

      if (diff <= 1) return 1.0;
      if (diff <= 5) return 0.9;
      if (diff <= 10) return 0.8;
      if (diff <= 15) return 0.7;
      if (diff <= 20) return 0.6;
      if (diff <= 30) return 0.4;
      if (diff <= 50) return 0.2;
      return 0.1;
    }

    return 0.5; // Default if year built is not available
  }

  /**
   * Calculate condition similarity
   */
  private calculateConditionSimilarity(subject: any, comparable: any): number {
    // Calculate condition similarity
    let conditionSimilarity = 0.5; // Default

    if (subject.condition && comparable.condition) {
      const conditionMap: Record<string, number> = {
        Poor: 1,
        Fair: 2,
        Average: 3,
        Good: 4,
        Excellent: 5,
      };

      const subjectCondition = conditionMap[subject.condition] || 3;
      const comparableCondition = conditionMap[comparable.condition] || 3;

      const diff = Math.abs(comparableCondition - subjectCondition);

      if (diff === 0) conditionSimilarity = 1.0;
      else if (diff === 1) conditionSimilarity = 0.8;
      else if (diff === 2) conditionSimilarity = 0.5;
      else conditionSimilarity = 0.2;
    }

    // Calculate quality similarity
    let qualitySimilarity = 0.5; // Default

    if (subject.quality && comparable.quality) {
      const qualityMap: Record<string, number> = {
        Low: 1,
        Fair: 2,
        Average: 3,
        Good: 4,
        Excellent: 5,
      };

      const subjectQuality = qualityMap[subject.quality] || 3;
      const comparableQuality = qualityMap[comparable.quality] || 3;

      const diff = Math.abs(comparableQuality - subjectQuality);

      if (diff === 0) qualitySimilarity = 1.0;
      else if (diff === 1) qualitySimilarity = 0.8;
      else if (diff === 2) qualitySimilarity = 0.5;
      else qualitySimilarity = 0.2;
    }

    // Return weighted average of condition and quality similarities
    return conditionSimilarity * 0.5 + qualitySimilarity * 0.5;
  }

  /**
   * Get comparison cache key
   */
  private getComparisonCacheKey(
    subjectPropertyId: string,
    comparablePropertyIds: string[],
    dashboardId: string
  ): string {
    const sortedIds = [...comparablePropertyIds].sort();
    return `comparison:${subjectPropertyId}:${sortedIds.join(":")}:${dashboardId}`;
  }

  /**
   * Cache comparison result
   */
  private cacheComparisonResult(key: string, result: ComparisonResult): void {
    try {
      const dataSize = this.estimateSize(result);

      // Check if caching this would exceed the max cache size
      if (this.cacheSize + dataSize > this.options.maxCacheSize) {
        this.cleanCache(dataSize);
      }

      // Calculate expiration
      const expires = Date.now() + this.options.defaultCacheExpiration;

      // Add to cache
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
        expires,
        size: dataSize,
      });

      // Update cache size
      this.cacheSize += dataSize;
    } catch (error) {
      console.error("Error caching comparison result:", error);
    }
  }

  /**
   * Clean cache
   */
  private cleanCache(neededSpace: number = 0): void {
    try {
      // If cache is empty, nothing to clean
      if (this.cache.size === 0) {
        return;
      }

      // First, remove expired items
      const now = Date.now();
      const entriesByAge: [string, { timestamp: number; size: number }][] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expires <= now) {
          this.cacheSize -= entry.size;
          this.cache.delete(key);
        } else {
          entriesByAge.push([key, { timestamp: entry.timestamp, size: entry.size }]);
        }
      }

      // If still need space, remove oldest entries
      if (neededSpace > 0 && this.cacheSize + neededSpace > this.options.maxCacheSize) {
        // Sort by age (oldest first)
        entriesByAge.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove entries until we have enough space
        for (const [key, entry] of entriesByAge) {
          this.cacheSize -= entry.size;
          this.cache.delete(key);

          if (this.cacheSize + neededSpace <= this.options.maxCacheSize) {
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error cleaning cache:", error);
    }
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data);
      return new TextEncoder().encode(json).length;
    } catch (error) {
      // Fallback to a rough estimate
      return JSON.stringify(data).length * 2;
    }
  }

  /**
   * Get comparison results
   */
  public async getComparisonResults(subjectPropertyId?: string): Promise<ComparisonResult[]> {
    try {
      let results = Array.from(this.comparisonResults.values());

      if (subjectPropertyId) {
        results = results.filter((result) => result.subjectPropertyId === subjectPropertyId);
      }

      // Sort by timestamp, newest first
      results.sort((a, b) => b.timestamp - a.timestamp);

      return results;
    } catch (error) {
      console.error("Error getting comparison results:", error);
      return [];
    }
  }

  /**
   * Get comparison result by ID
   */
  public async getComparisonResult(resultId: string): Promise<ComparisonResult | null> {
    try {
      return this.comparisonResults.get(resultId) || null;
    } catch (error) {
      console.error("Error getting comparison result:", error);
      return null;
    }
  }

  /**
   * Save reconciled value
   */
  public async saveReconciledValue(
    resultId: string,
    reconciledValue: number,
    notes?: string
  ): Promise<boolean> {
    try {
      const result = this.comparisonResults.get(resultId);

      if (!result) {
        return false;
      }

      // Calculate min and max values from comparable properties
      const priceMetric = result.metricResults.find((m) => m.type === ComparisonMetricType.PRICE);

      if (!priceMetric) {
        return false;
      }

      const prices = priceMetric.comparableValues
        .map((cv) => cv.value)
        .filter((v) => typeof v === "number");

      const minValue = Math.min(...prices);
      const maxValue = Math.max(...prices);

      // Update result
      result.valueReconciliation = {
        minValue,
        maxValue,
        reconciledValue,
        notes,
      };

      // Save state
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error saving reconciled value:", error);
      return false;
    }
  }

  /**
   * One-click property comparison
   *
   * This is a convenience method that finds comparable properties
   * and performs comparison in one step
   */
  public async oneClickComparison(
    subjectPropertyId: string,
    options?: {
      maxComparables?: number;
      dashboardId?: string;
      similarityThreshold?: number;
      maxDistance?: number;
    }
  ): Promise<ComparisonResult> {
    try {
      const {
        maxComparables = 5,
        dashboardId,
        similarityThreshold = 0.6,
        maxDistance = 5, // miles
      } = options || {};

      // Find comparable properties
      const comparables = await this.comparableService.findComparables(subjectPropertyId, {
        maxResults: maxComparables,
        similarityThreshold,
        maxDistance,
      });

      if (!comparables || comparables.length === 0) {
        throw new Error("No comparable properties found");
      }

      const comparableIds = comparables.map((comp) => comp.id);

      // Compare properties
      return this.compareProperties(subjectPropertyId, comparableIds, dashboardId);
    } catch (error) {
      console.error("Error in one-click comparison:", error);
      throw error;
    }
  }
}
