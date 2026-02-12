import { v4 as uuidv4 } from "uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AuthService } from "./AuthService";
import { SecureStorageService, SecurityLevel } from "./SecureStorageService";

/**
 * Value history type
 */
export enum ValueHistoryType {
  ASSESSED = "assessed",
  MARKET = "market",
  APPRAISED = "appraised",
  LISTING = "listing",
  SOLD = "sold",
  AUTOMATED = "automated",
  FORECASTED = "forecasted",
  CUSTOM = "custom",
}

/**
 * Value history period
 */
export enum ValueHistoryPeriod {
  DAYS_30 = "30d",
  DAYS_90 = "90d",
  DAYS_180 = "180d",
  YEAR_1 = "1y",
  YEAR_3 = "3y",
  YEAR_5 = "5y",
  YEAR_10 = "10y",
  MAX = "max",
}

/**
 * Value history interval
 */
export enum ValueHistoryInterval {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  QUARTER = "quarter",
  YEAR = "year",
}

/**
 * Value history data point
 */
export interface ValueHistoryDataPoint {
  /**
   * Date of the valuation
   */
  date: string;

  /**
   * Value amount
   */
  value: number;

  /**
   * Source of the valuation
   */
  source?: string;

  /**
   * Confidence score (0-1)
   */
  confidence?: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Value history series
 */
export interface ValueHistorySeries {
  /**
   * Series ID
   */
  id: string;

  /**
   * Property ID
   */
  propertyId: string;

  /**
   * Value history type
   */
  type: ValueHistoryType;

  /**
   * Display name
   */
  name: string;

  /**
   * Series color
   */
  color?: string;

  /**
   * Data points
   */
  dataPoints: ValueHistoryDataPoint[];

  /**
   * Last updated timestamp
   */
  updatedAt: number;

  /**
   * Cached statistics
   */
  statistics?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    changeAbsolute: number;
    changePercent: number;
  };
}

/**
 * Value history service options
 */
export interface PropertyValueHistoryServiceOptions {
  /**
   * Default data refresh interval (ms)
   */
  defaultRefreshInterval: number;

  /**
   * Default colors for series types
   */
  defaultColors: Record<ValueHistoryType, string>;

  /**
   * Maximum history points to keep per series
   */
  maxHistoryPoints: number;

  /**
   * Whether to generate statistics on data load
   */
  autoGenerateStatistics: boolean;
}

/**
 * Default service options
 */
const DEFAULT_OPTIONS: PropertyValueHistoryServiceOptions = {
  defaultRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
  defaultColors: {
    [ValueHistoryType.ASSESSED]: "#3498db",
    [ValueHistoryType.MARKET]: "#2ecc71",
    [ValueHistoryType.APPRAISED]: "#f39c12",
    [ValueHistoryType.LISTING]: "#e74c3c",
    [ValueHistoryType.SOLD]: "#9b59b6",
    [ValueHistoryType.AUTOMATED]: "#1abc9c",
    [ValueHistoryType.FORECASTED]: "#34495e",
    [ValueHistoryType.CUSTOM]: "#95a5a6",
  },
  maxHistoryPoints: 100,
  autoGenerateStatistics: true,
};

/**
 * Property value history service
 */
export class PropertyValueHistoryService {
  private static instance: PropertyValueHistoryService;
  private options: PropertyValueHistoryServiceOptions;
  private authService: AuthService;
  private secureStorageService: SecureStorageService;

  // State
  private valueHistorySeries: Map<string, ValueHistorySeries> = new Map();

  // API endpoints
  private readonly API_ENDPOINT = "https://api.appraisalcore.replit.app/api/valuations";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.options = { ...DEFAULT_OPTIONS };
    this.authService = AuthService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();

    // Load state
    this.loadState();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PropertyValueHistoryService {
    if (!PropertyValueHistoryService.instance) {
      PropertyValueHistoryService.instance = new PropertyValueHistoryService();
    }
    return PropertyValueHistoryService.instance;
  }

  /**
   * Initialize with options
   */
  public initialize(options: Partial<PropertyValueHistoryServiceOptions>): void {
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
      // Load value history series
      const series = await this.secureStorageService.getData<ValueHistorySeries[]>(
        "terrafield:value_history:series",
        [],
        SecurityLevel.MEDIUM
      );

      for (const s of series) {
        this.valueHistorySeries.set(s.id, s);

        // Generate statistics if needed
        if (this.options.autoGenerateStatistics && !s.statistics) {
          s.statistics = this.generateStatistics(s.dataPoints);
        }
      }
    } catch (error) {
      console.error("Error loading property value history state:", error);
    }
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    try {
      // Save value history series
      await this.secureStorageService.saveData(
        "terrafield:value_history:series",
        Array.from(this.valueHistorySeries.values()),
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving property value history state:", error);
    }
  }

  /**
   * Create a new value history series
   */
  public async createValueHistorySeries(
    propertyId: string,
    type: ValueHistoryType,
    name: string,
    dataPoints: ValueHistoryDataPoint[] = [],
    color?: string
  ): Promise<ValueHistorySeries> {
    try {
      // Generate series ID
      const seriesId = `series_${uuidv4()}`;

      // Determine color
      const seriesColor =
        color ||
        this.options.defaultColors[type] ||
        this.options.defaultColors[ValueHistoryType.CUSTOM];

      // Sort data points by date
      const sortedDataPoints = [...dataPoints].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Limit to max history points
      const limitedDataPoints = sortedDataPoints.slice(-this.options.maxHistoryPoints);

      // Generate statistics
      const statistics = this.generateStatistics(limitedDataPoints);

      // Create series
      const series: ValueHistorySeries = {
        id: seriesId,
        propertyId,
        type,
        name,
        color: seriesColor,
        dataPoints: limitedDataPoints,
        updatedAt: Date.now(),
        statistics,
      };

      // Store series
      this.valueHistorySeries.set(seriesId, series);
      await this.saveState();

      return series;
    } catch (error) {
      console.error("Error creating value history series:", error);
      throw error;
    }
  }

  /**
   * Generate statistics for data points
   */
  private generateStatistics(dataPoints: ValueHistoryDataPoint[]): {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    changeAbsolute: number;
    changePercent: number;
  } {
    // If no data points or only one, return default values
    if (!dataPoints.length) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        changeAbsolute: 0,
        changePercent: 0,
      };
    }

    if (dataPoints.length === 1) {
      return {
        min: dataPoints[0].value,
        max: dataPoints[0].value,
        mean: dataPoints[0].value,
        median: dataPoints[0].value,
        stdDev: 0,
        changeAbsolute: 0,
        changePercent: 0,
      };
    }

    // Extract values
    const values = dataPoints.map((dp) => dp.value);

    // Calculate min and max
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate mean
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;

    // Calculate median
    const sortedValues = [...values].sort((a, b) => a - b);
    let median: number;

    if (sortedValues.length % 2 === 0) {
      // Even number of values
      const midIndex = sortedValues.length / 2;
      median = (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2;
    } else {
      // Odd number of values
      median = sortedValues[Math.floor(sortedValues.length / 2)];
    }

    // Calculate standard deviation
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate change
    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;
    const changeAbsolute = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (changeAbsolute / firstValue) * 100 : 0;

    return {
      min,
      max,
      mean,
      median,
      stdDev,
      changeAbsolute,
      changePercent,
    };
  }

  /**
   * Update a value history series
   */
  public async updateValueHistorySeries(
    seriesId: string,
    updates: Partial<Omit<ValueHistorySeries, "id" | "propertyId" | "updatedAt" | "statistics">>
  ): Promise<ValueHistorySeries> {
    try {
      const series = this.valueHistorySeries.get(seriesId);

      if (!series) {
        throw new Error(`Series with ID ${seriesId} not found`);
      }

      // Update series
      const updatedSeries: ValueHistorySeries = {
        ...series,
        ...updates,
        updatedAt: Date.now(),
      };

      // If data points were updated, regenerate statistics
      if (updates.dataPoints) {
        // Sort data points by date
        updatedSeries.dataPoints = [...updates.dataPoints].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Limit to max history points
        updatedSeries.dataPoints = updatedSeries.dataPoints.slice(-this.options.maxHistoryPoints);

        // Generate statistics
        updatedSeries.statistics = this.generateStatistics(updatedSeries.dataPoints);
      }

      // Store updated series
      this.valueHistorySeries.set(seriesId, updatedSeries);
      await this.saveState();

      return updatedSeries;
    } catch (error) {
      console.error("Error updating value history series:", error);
      throw error;
    }
  }

  /**
   * Add data point to a series
   */
  public async addDataPoint(
    seriesId: string,
    dataPoint: ValueHistoryDataPoint
  ): Promise<ValueHistorySeries> {
    try {
      const series = this.valueHistorySeries.get(seriesId);

      if (!series) {
        throw new Error(`Series with ID ${seriesId} not found`);
      }

      // Add data point
      const updatedDataPoints = [...series.dataPoints, dataPoint];

      // Update series
      return this.updateValueHistorySeries(seriesId, { dataPoints: updatedDataPoints });
    } catch (error) {
      console.error("Error adding data point:", error);
      throw error;
    }
  }

  /**
   * Delete a value history series
   */
  public async deleteValueHistorySeries(seriesId: string): Promise<boolean> {
    try {
      const series = this.valueHistorySeries.get(seriesId);

      if (!series) {
        return false;
      }

      // Remove series
      this.valueHistorySeries.delete(seriesId);
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error deleting value history series:", error);
      return false;
    }
  }

  /**
   * Get all value history series for a property
   */
  public async getValueHistorySeries(propertyId?: string): Promise<ValueHistorySeries[]> {
    try {
      let series = Array.from(this.valueHistorySeries.values());

      if (propertyId) {
        series = series.filter((s) => s.propertyId === propertyId);
      }

      return series;
    } catch (error) {
      console.error("Error getting value history series:", error);
      return [];
    }
  }

  /**
   * Get a value history series by ID
   */
  public async getValueHistorySeriesById(seriesId: string): Promise<ValueHistorySeries | null> {
    try {
      return this.valueHistorySeries.get(seriesId) || null;
    } catch (error) {
      console.error("Error getting value history series by ID:", error);
      return null;
    }
  }

  /**
   * Fetch value history from external API
   */
  public async fetchValueHistory(
    propertyId: string,
    type: ValueHistoryType,
    period: ValueHistoryPeriod = ValueHistoryPeriod.YEAR_5,
    interval: ValueHistoryInterval = ValueHistoryInterval.MONTH
  ): Promise<ValueHistorySeries | null> {
    try {
      // Check network availability
      const networkInfo = await NetInfo.fetch();

      if (!networkInfo.isConnected) {
        console.log("Network unavailable, using cached data if available");
        const existingSeries = (await this.getValueHistorySeries(propertyId)).find(
          (s) => s.propertyId === propertyId && s.type === type
        );

        return existingSeries || null;
      }

      // Make API request
      const url = `${this.API_ENDPOINT}/${propertyId}/history?type=${type}&period=${period}&interval=${interval}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.authService.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Find existing series or create new one
      let series = (await this.getValueHistorySeries(propertyId)).find(
        (s) => s.propertyId === propertyId && s.type === type
      );

      if (series) {
        // Update existing series
        series = await this.updateValueHistorySeries(series.id, {
          dataPoints: data.dataPoints,
        });
      } else {
        // Create new series
        series = await this.createValueHistorySeries(
          propertyId,
          type,
          data.name || this.getTypeDisplayName(type),
          data.dataPoints,
          data.color
        );
      }

      return series;
    } catch (error) {
      console.error("Error fetching value history:", error);

      // Try to return cached data if available
      const existingSeries = (await this.getValueHistorySeries(propertyId)).find(
        (s) => s.propertyId === propertyId && s.type === type
      );

      return existingSeries || null;
    }
  }

  /**
   * Generate mock value history data for testing
   */
  public async generateMockValueHistory(
    propertyId: string,
    type: ValueHistoryType,
    baseValue: number,
    numPoints: number = 24,
    volatility: number = 0.05
  ): Promise<ValueHistorySeries> {
    try {
      // Generate random data points
      const dataPoints: ValueHistoryDataPoint[] = [];
      let currentValue = baseValue;
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() - numPoints + 1);

      for (let i = 0; i < numPoints; i++) {
        // Add some randomness to the value
        const randomFactor = 1 + (Math.random() * 2 - 1) * volatility;
        currentValue *= randomFactor;

        // Create data point
        dataPoints.push({
          date: currentDate.toISOString().split("T")[0], // YYYY-MM-DD format
          value: Math.round(currentValue),
          confidence: 0.7 + Math.random() * 0.3, // Random confidence between 0.7 and 1.0
          source: "mock",
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Create or update series
      const existingSeries = (await this.getValueHistorySeries(propertyId)).find(
        (s) => s.propertyId === propertyId && s.type === type
      );

      if (existingSeries) {
        return this.updateValueHistorySeries(existingSeries.id, { dataPoints });
      } else {
        return this.createValueHistorySeries(
          propertyId,
          type,
          this.getTypeDisplayName(type),
          dataPoints
        );
      }
    } catch (error) {
      console.error("Error generating mock value history:", error);
      throw error;
    }
  }

  /**
   * Get display name for a value history type
   */
  private getTypeDisplayName(type: ValueHistoryType): string {
    switch (type) {
      case ValueHistoryType.ASSESSED:
        return "Assessed Value";
      case ValueHistoryType.MARKET:
        return "Market Value";
      case ValueHistoryType.APPRAISED:
        return "Appraised Value";
      case ValueHistoryType.LISTING:
        return "Listing Price";
      case ValueHistoryType.SOLD:
        return "Sold Price";
      case ValueHistoryType.AUTOMATED:
        return "AVM Value";
      case ValueHistoryType.FORECASTED:
        return "Forecasted Value";
      case ValueHistoryType.CUSTOM:
        return "Custom Value";
      default:
        return "Property Value";
    }
  }

  /**
   * Get property value summary
   */
  public async getPropertyValueSummary(propertyId: string): Promise<{
    currentValue: number;
    historicalChange: number;
    forecastedChange: number;
    lastUpdated: string;
    confidence: number;
    series: ValueHistorySeries[];
  }> {
    try {
      // Get all series for the property
      const allSeries = await this.getValueHistorySeries(propertyId);

      // If no series found, return default values
      if (allSeries.length === 0) {
        return {
          currentValue: 0,
          historicalChange: 0,
          forecastedChange: 0,
          lastUpdated: new Date().toISOString(),
          confidence: 0,
          series: [],
        };
      }

      // Prioritize series types for current value
      const priorityOrder = [
        ValueHistoryType.APPRAISED,
        ValueHistoryType.MARKET,
        ValueHistoryType.AUTOMATED,
        ValueHistoryType.ASSESSED,
        ValueHistoryType.LISTING,
        ValueHistoryType.SOLD,
        ValueHistoryType.FORECASTED,
        ValueHistoryType.CUSTOM,
      ];

      // Sort series by priority
      const sortedSeries = [...allSeries].sort((a, b) => {
        const priorityA = priorityOrder.indexOf(a.type);
        const priorityB = priorityOrder.indexOf(b.type);
        return priorityA - priorityB;
      });

      // Get current value from highest priority series
      const primarySeries = sortedSeries[0];
      const currentValue =
        primarySeries.dataPoints.length > 0
          ? primarySeries.dataPoints[primarySeries.dataPoints.length - 1].value
          : 0;

      // Get historical change
      const historicalChange = primarySeries.statistics?.changePercent || 0;

      // Get forecasted change
      const forecastSeries = allSeries.find((s) => s.type === ValueHistoryType.FORECASTED);
      let forecastedChange = 0;

      if (forecastSeries && forecastSeries.dataPoints.length > 0) {
        const latestValue = forecastSeries.dataPoints[forecastSeries.dataPoints.length - 1].value;
        const firstValue = forecastSeries.dataPoints[0].value;
        forecastedChange = firstValue !== 0 ? ((latestValue - firstValue) / firstValue) * 100 : 0;
      }

      // Get confidence
      const confidence =
        primarySeries.dataPoints.length > 0
          ? primarySeries.dataPoints[primarySeries.dataPoints.length - 1].confidence || 0.8
          : 0.8;

      // Get last updated
      const lastUpdated = new Date(primarySeries.updatedAt).toISOString();

      return {
        currentValue,
        historicalChange,
        forecastedChange,
        lastUpdated,
        confidence,
        series: allSeries,
      };
    } catch (error) {
      console.error("Error getting property value summary:", error);
      return {
        currentValue: 0,
        historicalChange: 0,
        forecastedChange: 0,
        lastUpdated: new Date().toISOString(),
        confidence: 0,
        series: [],
      };
    }
  }
}
