import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SecureStorageService, SecurityLevel } from "./SecureStorageService";
import { AuthService } from "./AuthService";

/**
 * Comparable property interface
 */
export interface ComparableProperty {
  /**
   * Unique ID
   */
  id: string;

  /**
   * Property address
   */
  address: string;

  /**
   * City
   */
  city: string;

  /**
   * State/Province
   */
  state: string;

  /**
   * Postal code
   */
  postalCode: string;

  /**
   * Country
   */
  country: string;

  /**
   * Sale price
   */
  salePrice: number;

  /**
   * Sale date
   */
  saleDate: string;

  /**
   * Square footage
   */
  squareFootage: number;

  /**
   * Lot size
   */
  lotSize: number;

  /**
   * Bedrooms
   */
  bedrooms: number;

  /**
   * Bathrooms
   */
  bathrooms: number;

  /**
   * Year built
   */
  yearBuilt: number;

  /**
   * Property type
   */
  propertyType: string;

  /**
   * Construction quality
   */
  constructionQuality?: string;

  /**
   * Condition
   */
  condition?: string;

  /**
   * Amenities
   */
  amenities?: string[];

  /**
   * Location quality
   */
  locationQuality?: string;

  /**
   * View quality
   */
  viewQuality?: string;

  /**
   * Distance from subject property (miles)
   */
  distance?: number;

  /**
   * Latitude
   */
  latitude?: number;

  /**
   * Longitude
   */
  longitude?: number;

  /**
   * Photo URLs
   */
  photos?: string[];

  /**
   * Source of data
   */
  source?: string;

  /**
   * MLS number
   */
  mlsNumber?: string;

  /**
   * Date added to database
   */
  dateAdded: string;

  /**
   * Adjusted price (after adjustments)
   */
  adjustedPrice?: number;

  /**
   * Adjustments applied
   */
  adjustments?: {
    name: string;
    amount: number;
    reason: string;
  }[];

  /**
   * Similarity score (0-1)
   */
  similarityScore?: number;

  /**
   * Time-adjusted value
   */
  timeAdjustedValue?: number;

  /**
   * Whether this is a user-added comparable
   */
  userAdded?: boolean;
}

/**
 * Subject property interface
 */
export interface SubjectProperty {
  /**
   * Unique ID
   */
  id: string;

  /**
   * Property address
   */
  address: string;

  /**
   * City
   */
  city: string;

  /**
   * State/Province
   */
  state: string;

  /**
   * Postal code
   */
  postalCode: string;

  /**
   * Country
   */
  country: string;

  /**
   * Square footage
   */
  squareFootage: number;

  /**
   * Lot size
   */
  lotSize: number;

  /**
   * Bedrooms
   */
  bedrooms: number;

  /**
   * Bathrooms
   */
  bathrooms: number;

  /**
   * Year built
   */
  yearBuilt: number;

  /**
   * Property type
   */
  propertyType: string;

  /**
   * Construction quality
   */
  constructionQuality?: string;

  /**
   * Condition
   */
  condition?: string;

  /**
   * Amenities
   */
  amenities?: string[];

  /**
   * Location quality
   */
  locationQuality?: string;

  /**
   * View quality
   */
  viewQuality?: string;

  /**
   * Latitude
   */
  latitude?: number;

  /**
   * Longitude
   */
  longitude?: number;
}

/**
 * Search criteria interface
 */
export interface ComparableSearchCriteria {
  /**
   * Subject property
   */
  subjectProperty: SubjectProperty;

  /**
   * Search radius (miles)
   */
  radius: number;

  /**
   * Maximum number of results
   */
  maxResults: number;

  /**
   * Date range for sales
   */
  saleDate?: {
    from: string;
    to: string;
  };

  /**
   * Price range
   */
  priceRange?: {
    min: number;
    max: number;
  };

  /**
   * Square footage range
   */
  squareFootageRange?: {
    min: number;
    max: number;
  };

  /**
   * Include active listings
   */
  includeActive?: boolean;

  /**
   * Include pending sales
   */
  includePending?: boolean;

  /**
   * Include only verified sales
   */
  onlyVerified?: boolean;

  /**
   * Required property features
   */
  requiredFeatures?: string[];

  /**
   * Excluded property features
   */
  excludedFeatures?: string[];

  /**
   * Sort order
   */
  sortBy?: "distance" | "date" | "price" | "similarity";

  /**
   * Sort direction
   */
  sortDirection?: "asc" | "desc";
}

/**
 * Default search criteria
 */
const DEFAULT_SEARCH_CRITERIA: Partial<ComparableSearchCriteria> = {
  radius: 1.0,
  maxResults: 10,
  includeActive: false,
  includePending: false,
  onlyVerified: true,
  sortBy: "similarity",
  sortDirection: "desc",
};

/**
 * Market trend interface
 */
export interface MarketTrend {
  /**
   * Trend period
   */
  period: string;

  /**
   * Median sale price
   */
  medianPrice: number;

  /**
   * Percent change from previous period
   */
  percentChange: number;

  /**
   * Average days on market
   */
  avgDaysOnMarket: number;

  /**
   * Inventory level
   */
  inventory: number;

  /**
   * Sales volume
   */
  salesVolume: number;

  /**
   * Price per square foot
   */
  pricePerSqFt: number;
}

/**
 * Comparable adjustment factor interface
 */
export interface AdjustmentFactor {
  /**
   * Factor name
   */
  name: string;

  /**
   * Factor description
   */
  description: string;

  /**
   * Adjustment type
   */
  type: "additive" | "multiplicative" | "percentage";

  /**
   * Adjustment value
   */
  value: number;

  /**
   * Adjustment unit
   */
  unit: string;

  /**
   * Maximum adjustment percentage
   */
  maxPercentage?: number;

  /**
   * Whether adjustment is location-specific
   */
  locationSpecific?: boolean;

  /**
   * Whether adjustment is time-dependent
   */
  timeDependent?: boolean;
}

/**
 * Comparable service options
 */
export interface ComparableServiceOptions {
  /**
   * API endpoint URL
   */
  apiUrl: string;

  /**
   * Whether to cache results
   */
  cacheResults: boolean;

  /**
   * Cache expiration time (ms)
   */
  cacheExpiration: number;

  /**
   * Whether to use offline mode
   */
  offlineMode: boolean;

  /**
   * Maximum search radius (miles)
   */
  maxRadius: number;

  /**
   * Minimum similarity score (0-1)
   */
  minSimilarityScore: number;

  /**
   * Whether to apply time adjustments
   */
  applyTimeAdjustments: boolean;

  /**
   * Annual appreciation rate (for time adjustments)
   */
  annualAppreciationRate: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: ComparableServiceOptions = {
  apiUrl: "https://api.appraisalcore.replit.app/api/comparables",
  cacheResults: true,
  cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
  offlineMode: false,
  maxRadius: 5.0,
  minSimilarityScore: 0.5,
  applyTimeAdjustments: true,
  annualAppreciationRate: 0.03, // 3% annual appreciation
};

/**
 * ComparableService
 *
 * Service for finding and managing comparable properties
 */
export class ComparableService {
  private static instance: ComparableService;
  private options: ComparableServiceOptions;
  private secureStorageService: SecureStorageService;
  private authService: AuthService;
  private cachedResults: Map<string, { timestamp: number; results: ComparableProperty[] }> =
    new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.options = { ...DEFAULT_OPTIONS };
    this.secureStorageService = SecureStorageService.getInstance();
    this.authService = AuthService.getInstance();
    this.loadCachedResults();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ComparableService {
    if (!ComparableService.instance) {
      ComparableService.instance = new ComparableService();
    }
    return ComparableService.instance;
  }

  /**
   * Initialize with options
   */
  public initialize(options: Partial<ComparableServiceOptions>): void {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Load cached results from storage
   */
  private async loadCachedResults(): Promise<void> {
    try {
      const cachedData = await this.secureStorageService.getData<
        Record<string, { timestamp: number; results: ComparableProperty[] }>
      >("terrafield:comparable:cache", null, SecurityLevel.MEDIUM);

      if (cachedData) {
        this.cachedResults = new Map(Object.entries(cachedData));

        // Clean expired cache entries
        this.cleanupCache();
      }
    } catch (error) {
      console.error("Error loading cached comparable results:", error);
    }
  }

  /**
   * Save cached results to storage
   */
  private async saveCachedResults(): Promise<void> {
    try {
      const cachedData: Record<string, { timestamp: number; results: ComparableProperty[] }> = {};

      this.cachedResults.forEach((value, key) => {
        cachedData[key] = value;
      });

      await this.secureStorageService.saveData(
        "terrafield:comparable:cache",
        cachedData,
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving cached comparable results:", error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();

    for (const [key, value] of this.cachedResults.entries()) {
      if (now - value.timestamp > this.options.cacheExpiration) {
        this.cachedResults.delete(key);
      }
    }

    this.saveCachedResults();
  }

  /**
   * Find comparable properties
   */
  public async findComparables(
    criteria: Partial<ComparableSearchCriteria>
  ): Promise<ComparableProperty[]> {
    // Apply default criteria
    const searchCriteria: ComparableSearchCriteria = {
      ...DEFAULT_SEARCH_CRITERIA,
      ...criteria,
      subjectProperty: criteria.subjectProperty!,
    };

    // Check if we have a cached result
    const cacheKey = this.generateCacheKey(searchCriteria);

    if (this.options.cacheResults && this.cachedResults.has(cacheKey)) {
      const cached = this.cachedResults.get(cacheKey)!;

      // Check if cache is still valid
      if (Date.now() - cached.timestamp <= this.options.cacheExpiration) {
        console.log("Using cached comparable results");
        return cached.results;
      }
    }

    try {
      // Check network availability
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected && !this.options.offlineMode) {
        throw new Error("No network connection available");
      }

      if (this.options.offlineMode || !netInfo.isConnected) {
        // Use offline mode or fallback
        return this.findComparablesOffline(searchCriteria);
      }

      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to find comparables");
      }

      // Make API request
      const response = await fetch(`${this.options.apiUrl}/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchCriteria),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to find comparable properties");
      }

      const responseData = await response.json();
      const comparables: ComparableProperty[] = responseData.comparables || [];

      // Apply time adjustments if enabled
      if (this.options.applyTimeAdjustments) {
        this.applyTimeAdjustments(comparables, searchCriteria.subjectProperty);
      }

      // Calculate similarity scores if not provided by API
      if (!comparables[0]?.similarityScore) {
        this.calculateSimilarityScores(comparables, searchCriteria.subjectProperty);
      }

      // Filter by minimum similarity score
      const filteredComparables = comparables.filter(
        (comp) => (comp.similarityScore || 0) >= this.options.minSimilarityScore
      );

      // Cache results
      if (this.options.cacheResults) {
        this.cachedResults.set(cacheKey, {
          timestamp: Date.now(),
          results: filteredComparables,
        });
        this.saveCachedResults();
      }

      return filteredComparables;
    } catch (error) {
      console.error("Error finding comparable properties:", error);

      // Try offline mode as fallback
      if (!this.options.offlineMode) {
        try {
          console.log("Falling back to offline mode");
          return this.findComparablesOffline(searchCriteria);
        } catch (offlineError) {
          console.error("Offline fallback failed:", offlineError);
          throw error;
        }
      }

      throw error;
    }
  }

  /**
   * Find comparable properties in offline mode
   */
  private async findComparablesOffline(
    criteria: ComparableSearchCriteria
  ): Promise<ComparableProperty[]> {
    try {
      // Load saved comparables from storage
      const savedComparables = await this.loadSavedComparables();

      if (!savedComparables || savedComparables.length === 0) {
        throw new Error("No saved comparables available for offline use");
      }

      // Filter comparables based on criteria
      let filteredComparables = savedComparables;

      // Filter by distance
      if (criteria.subjectProperty.latitude && criteria.subjectProperty.longitude) {
        filteredComparables = filteredComparables.filter((comp) => {
          if (!comp.latitude || !comp.longitude) return false;

          const distance = this.calculateDistance(
            criteria.subjectProperty.latitude!,
            criteria.subjectProperty.longitude!,
            comp.latitude,
            comp.longitude
          );

          // Update distance
          comp.distance = distance;

          return distance <= criteria.radius;
        });
      }

      // Filter by price range
      if (criteria.priceRange) {
        filteredComparables = filteredComparables.filter(
          (comp) =>
            comp.salePrice >= criteria.priceRange!.min && comp.salePrice <= criteria.priceRange!.max
        );
      }

      // Filter by square footage range
      if (criteria.squareFootageRange) {
        filteredComparables = filteredComparables.filter(
          (comp) =>
            comp.squareFootage >= criteria.squareFootageRange!.min &&
            comp.squareFootage <= criteria.squareFootageRange!.max
        );
      }

      // Calculate similarity scores
      this.calculateSimilarityScores(filteredComparables, criteria.subjectProperty);

      // Apply time adjustments
      if (this.options.applyTimeAdjustments) {
        this.applyTimeAdjustments(filteredComparables, criteria.subjectProperty);
      }

      // Filter by minimum similarity score
      filteredComparables = filteredComparables.filter(
        (comp) => (comp.similarityScore || 0) >= this.options.minSimilarityScore
      );

      // Sort by specified criteria
      this.sortComparables(
        filteredComparables,
        criteria.sortBy || "similarity",
        criteria.sortDirection || "desc"
      );

      // Limit results
      return filteredComparables.slice(0, criteria.maxResults);
    } catch (error) {
      console.error("Error finding comparables offline:", error);
      throw error;
    }
  }

  /**
   * Sort comparables
   */
  private sortComparables(
    comparables: ComparableProperty[],
    sortBy: string,
    sortDirection: "asc" | "desc"
  ): void {
    const sortFactor = sortDirection === "asc" ? 1 : -1;

    comparables.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return sortFactor * ((a.distance || Infinity) - (b.distance || Infinity));
        case "price":
          return sortFactor * (a.salePrice - b.salePrice);
        case "date":
          return sortFactor * (new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
        case "similarity":
        default:
          return sortFactor * ((b.similarityScore || 0) - (a.similarityScore || 0));
      }
    });
  }

  /**
   * Calculate similarity scores
   */
  private calculateSimilarityScores(
    comparables: ComparableProperty[],
    subjectProperty: SubjectProperty
  ): void {
    // Define feature weights
    const weights = {
      squareFootage: 0.25,
      lotSize: 0.1,
      bedrooms: 0.1,
      bathrooms: 0.1,
      yearBuilt: 0.1,
      propertyType: 0.15,
      location: 0.2,
    };

    for (const comp of comparables) {
      let score = 0;

      // Square footage similarity (within 20%)
      const sqftDiff =
        Math.abs(comp.squareFootage - subjectProperty.squareFootage) /
        subjectProperty.squareFootage;
      score += weights.squareFootage * Math.max(0, 1 - sqftDiff / 0.2);

      // Lot size similarity (within 30%)
      const lotDiff = Math.abs(comp.lotSize - subjectProperty.lotSize) / subjectProperty.lotSize;
      score += weights.lotSize * Math.max(0, 1 - lotDiff / 0.3);

      // Bedroom similarity
      const bedroomDiff = Math.abs(comp.bedrooms - subjectProperty.bedrooms);
      score += weights.bedrooms * Math.max(0, 1 - bedroomDiff / 2);

      // Bathroom similarity
      const bathroomDiff = Math.abs(comp.bathrooms - subjectProperty.bathrooms);
      score += weights.bathrooms * Math.max(0, 1 - bathroomDiff / 2);

      // Year built similarity (within 20 years)
      const yearDiff = Math.abs(comp.yearBuilt - subjectProperty.yearBuilt);
      score += weights.yearBuilt * Math.max(0, 1 - yearDiff / 20);

      // Property type similarity
      const propertyTypeScore = comp.propertyType === subjectProperty.propertyType ? 1 : 0;
      score += weights.propertyType * propertyTypeScore;

      // Location similarity (based on distance if available)
      if (comp.distance !== undefined) {
        // Closer is better; 0 miles = 1.0, maxRadius miles = 0.0
        const locationScore = Math.max(0, 1 - comp.distance / this.options.maxRadius);
        score += weights.location * locationScore;
      } else if (comp.city === subjectProperty.city) {
        // Same city
        score += weights.location * 0.8;
      } else if (comp.postalCode === subjectProperty.postalCode) {
        // Same postal code
        score += weights.location * 0.9;
      } else {
        // Different city
        score += weights.location * 0.4;
      }

      // Store similarity score
      comp.similarityScore = Math.min(1, Math.max(0, score));
    }
  }

  /**
   * Apply time adjustments to comparable sale prices
   */
  private applyTimeAdjustments(
    comparables: ComparableProperty[],
    subjectProperty: SubjectProperty
  ): void {
    // Use current date as reference
    const referenceDate = new Date();
    const dailyRate = this.options.annualAppreciationRate / 365;

    for (const comp of comparables) {
      const saleDate = new Date(comp.saleDate);
      const daysDifference = Math.floor(
        (referenceDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate time adjustment factor
      const adjustmentFactor = 1 + dailyRate * daysDifference;

      // Apply time adjustment
      comp.timeAdjustedValue = comp.salePrice * adjustmentFactor;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Generate cache key from search criteria
   */
  private generateCacheKey(criteria: ComparableSearchCriteria): string {
    const key = {
      address: criteria.subjectProperty.address,
      city: criteria.subjectProperty.city,
      state: criteria.subjectProperty.state,
      radius: criteria.radius,
      maxResults: criteria.maxResults,
      saleDate: criteria.saleDate,
      priceRange: criteria.priceRange,
      squareFootageRange: criteria.squareFootageRange,
      includeActive: criteria.includeActive,
      includePending: criteria.includePending,
      onlyVerified: criteria.onlyVerified,
      sortBy: criteria.sortBy,
      sortDirection: criteria.sortDirection,
    };

    return JSON.stringify(key);
  }

  /**
   * Load saved comparables from storage
   */
  private async loadSavedComparables(): Promise<ComparableProperty[]> {
    try {
      return await this.secureStorageService.getData<ComparableProperty[]>(
        "terrafield:comparable:saved",
        [],
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error loading saved comparables:", error);
      return [];
    }
  }

  /**
   * Save comparable to storage
   */
  public async saveComparable(comparable: ComparableProperty): Promise<boolean> {
    try {
      // Load existing saved comparables
      const savedComparables = await this.loadSavedComparables();

      // Check if already saved
      const existingIndex = savedComparables.findIndex((c) => c.id === comparable.id);

      if (existingIndex >= 0) {
        // Update existing
        savedComparables[existingIndex] = {
          ...comparable,
          userAdded: true,
        };
      } else {
        // Add new
        savedComparables.push({
          ...comparable,
          userAdded: true,
        });
      }

      // Save to storage
      await this.secureStorageService.saveData(
        "terrafield:comparable:saved",
        savedComparables,
        SecurityLevel.MEDIUM
      );

      return true;
    } catch (error) {
      console.error("Error saving comparable:", error);
      return false;
    }
  }

  /**
   * Delete comparable from storage
   */
  public async deleteComparable(comparableId: string): Promise<boolean> {
    try {
      // Load existing saved comparables
      const savedComparables = await this.loadSavedComparables();

      // Filter out the one to delete
      const filteredComparables = savedComparables.filter((c) => c.id !== comparableId);

      if (filteredComparables.length === savedComparables.length) {
        // No comparable was deleted
        return false;
      }

      // Save to storage
      await this.secureStorageService.saveData(
        "terrafield:comparable:saved",
        filteredComparables,
        SecurityLevel.MEDIUM
      );

      return true;
    } catch (error) {
      console.error("Error deleting comparable:", error);
      return false;
    }
  }

  /**
   * Get adjustment factors
   */
  public async getAdjustmentFactors(location?: {
    city: string;
    state: string;
  }): Promise<AdjustmentFactor[]> {
    try {
      // Check if we can use stored adjustment factors
      const storedFactors = await this.secureStorageService.getData<AdjustmentFactor[]>(
        "terrafield:comparable:adjustment_factors",
        null,
        SecurityLevel.MEDIUM
      );

      if (storedFactors) {
        return storedFactors;
      }

      // If offline, return default adjustment factors
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || this.options.offlineMode) {
        return this.getDefaultAdjustmentFactors();
      }

      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to get adjustment factors");
      }

      // Make API request
      let url = `${this.options.apiUrl}/adjustment-factors`;

      if (location) {
        url += `?city=${encodeURIComponent(location.city)}&state=${encodeURIComponent(location.state)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get adjustment factors");
      }

      const responseData = await response.json();
      const adjustmentFactors: AdjustmentFactor[] = responseData.factors || [];

      // Save to storage
      await this.secureStorageService.saveData(
        "terrafield:comparable:adjustment_factors",
        adjustmentFactors,
        SecurityLevel.MEDIUM
      );

      return adjustmentFactors;
    } catch (error) {
      console.error("Error getting adjustment factors:", error);

      // Return default factors as fallback
      return this.getDefaultAdjustmentFactors();
    }
  }

  /**
   * Get default adjustment factors
   */
  private getDefaultAdjustmentFactors(): AdjustmentFactor[] {
    return [
      {
        name: "SquareFootage",
        description: "Adjustment for difference in square footage",
        type: "additive",
        value: 100, // $100 per square foot
        unit: "sq ft",
        maxPercentage: 0.1, // Max 10% of sale price
      },
      {
        name: "Bedroom",
        description: "Adjustment for additional or missing bedrooms",
        type: "additive",
        value: 5000, // $5,000 per bedroom
        unit: "bedroom",
      },
      {
        name: "Bathroom",
        description: "Adjustment for additional or missing bathrooms",
        type: "additive",
        value: 7500, // $7,500 per bathroom
        unit: "bathroom",
      },
      {
        name: "Garage",
        description: "Adjustment for garage spaces",
        type: "additive",
        value: 10000, // $10,000 per garage space
        unit: "space",
      },
      {
        name: "Pool",
        description: "Adjustment for presence of a pool",
        type: "additive",
        value: 15000, // $15,000 for a pool
        unit: "pool",
      },
      {
        name: "LotSize",
        description: "Adjustment for difference in lot size",
        type: "additive",
        value: 2, // $2 per square foot of lot
        unit: "sq ft",
        maxPercentage: 0.1, // Max 10% of sale price
      },
      {
        name: "Age",
        description: "Adjustment for difference in property age",
        type: "additive",
        value: 500, // $500 per year of age difference
        unit: "year",
        maxPercentage: 0.05, // Max 5% of sale price
      },
      {
        name: "Condition",
        description: "Adjustment for property condition",
        type: "percentage",
        value: 0.05, // 5% of sale price
        unit: "percentage",
      },
      {
        name: "View",
        description: "Adjustment for property view",
        type: "percentage",
        value: 0.03, // 3% of sale price
        unit: "percentage",
      },
      {
        name: "Location",
        description: "Adjustment for location quality",
        type: "percentage",
        value: 0.05, // 5% of sale price
        unit: "percentage",
        locationSpecific: true,
      },
    ];
  }

  /**
   * Get market trends
   */
  public async getMarketTrends(
    location: { city: string; state: string },
    months: number = 12
  ): Promise<MarketTrend[]> {
    try {
      // Check if we can use stored market trends
      const cacheKey = `${location.city}_${location.state}_${months}`;
      const storedTrends = await this.secureStorageService.getData<{
        timestamp: number;
        trends: MarketTrend[];
      }>(`terrafield:comparable:market_trends:${cacheKey}`, null, SecurityLevel.MEDIUM);

      if (storedTrends && Date.now() - storedTrends.timestamp < this.options.cacheExpiration) {
        return storedTrends.trends;
      }

      // If offline, return empty array
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || this.options.offlineMode) {
        throw new Error("Network connection required to fetch market trends");
      }

      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to get market trends");
      }

      // Make API request
      const url = `${this.options.apiUrl}/market-trends?city=${encodeURIComponent(location.city)}&state=${encodeURIComponent(location.state)}&months=${months}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get market trends");
      }

      const responseData = await response.json();
      const marketTrends: MarketTrend[] = responseData.trends || [];

      // Save to storage
      await this.secureStorageService.saveData(
        `terrafield:comparable:market_trends:${cacheKey}`,
        {
          timestamp: Date.now(),
          trends: marketTrends,
        },
        SecurityLevel.MEDIUM
      );

      return marketTrends;
    } catch (error) {
      console.error("Error getting market trends:", error);
      throw error;
    }
  }

  /**
   * Apply adjustments to comparable
   */
  public applyAdjustments(
    comparable: ComparableProperty,
    subjectProperty: SubjectProperty,
    adjustmentFactors: AdjustmentFactor[]
  ): ComparableProperty {
    // Create a copy of the comparable
    const adjustedComparable: ComparableProperty = {
      ...comparable,
      adjustments: [],
    };

    let totalAdjustment = 0;

    // Apply square footage adjustment
    if (subjectProperty.squareFootage !== comparable.squareFootage) {
      const squareFootageFactor = adjustmentFactors.find((f) => f.name === "SquareFootage");

      if (squareFootageFactor) {
        const difference = subjectProperty.squareFootage - comparable.squareFootage;
        let adjustment = difference * squareFootageFactor.value;

        // Apply max percentage if specified
        if (squareFootageFactor.maxPercentage) {
          const maxAdjustment = comparable.salePrice * squareFootageFactor.maxPercentage;
          adjustment =
            Math.abs(adjustment) > maxAdjustment
              ? Math.sign(adjustment) * maxAdjustment
              : adjustment;
        }

        totalAdjustment += adjustment;

        adjustedComparable.adjustments?.push({
          name: "Square Footage",
          amount: adjustment,
          reason: `Difference of ${difference} square feet at $${squareFootageFactor.value}/sq ft`,
        });
      }
    }

    // Apply bedroom adjustment
    if (subjectProperty.bedrooms !== comparable.bedrooms) {
      const bedroomFactor = adjustmentFactors.find((f) => f.name === "Bedroom");

      if (bedroomFactor) {
        const difference = subjectProperty.bedrooms - comparable.bedrooms;
        const adjustment = difference * bedroomFactor.value;

        totalAdjustment += adjustment;

        adjustedComparable.adjustments?.push({
          name: "Bedrooms",
          amount: adjustment,
          reason: `Difference of ${difference} bedrooms at $${bedroomFactor.value} each`,
        });
      }
    }

    // Apply bathroom adjustment
    if (subjectProperty.bathrooms !== comparable.bathrooms) {
      const bathroomFactor = adjustmentFactors.find((f) => f.name === "Bathroom");

      if (bathroomFactor) {
        const difference = subjectProperty.bathrooms - comparable.bathrooms;
        const adjustment = difference * bathroomFactor.value;

        totalAdjustment += adjustment;

        adjustedComparable.adjustments?.push({
          name: "Bathrooms",
          amount: adjustment,
          reason: `Difference of ${difference} bathrooms at $${bathroomFactor.value} each`,
        });
      }
    }

    // Apply lot size adjustment
    if (subjectProperty.lotSize !== comparable.lotSize) {
      const lotSizeFactor = adjustmentFactors.find((f) => f.name === "LotSize");

      if (lotSizeFactor) {
        const difference = subjectProperty.lotSize - comparable.lotSize;
        let adjustment = difference * lotSizeFactor.value;

        // Apply max percentage if specified
        if (lotSizeFactor.maxPercentage) {
          const maxAdjustment = comparable.salePrice * lotSizeFactor.maxPercentage;
          adjustment =
            Math.abs(adjustment) > maxAdjustment
              ? Math.sign(adjustment) * maxAdjustment
              : adjustment;
        }

        totalAdjustment += adjustment;

        adjustedComparable.adjustments?.push({
          name: "Lot Size",
          amount: adjustment,
          reason: `Difference of ${difference} square feet at $${lotSizeFactor.value}/sq ft`,
        });
      }
    }

    // Apply age/year built adjustment
    if (subjectProperty.yearBuilt !== comparable.yearBuilt) {
      const ageFactor = adjustmentFactors.find((f) => f.name === "Age");

      if (ageFactor) {
        const difference = subjectProperty.yearBuilt - comparable.yearBuilt;
        let adjustment = difference * ageFactor.value;

        // Apply max percentage if specified
        if (ageFactor.maxPercentage) {
          const maxAdjustment = comparable.salePrice * ageFactor.maxPercentage;
          adjustment =
            Math.abs(adjustment) > maxAdjustment
              ? Math.sign(adjustment) * maxAdjustment
              : adjustment;
        }

        totalAdjustment += adjustment;

        adjustedComparable.adjustments?.push({
          name: "Age/Year Built",
          amount: adjustment,
          reason: `Difference of ${difference} years at $${ageFactor.value}/year`,
        });
      }
    }

    // Apply condition adjustment if different
    if (
      subjectProperty.condition &&
      comparable.condition &&
      subjectProperty.condition !== comparable.condition
    ) {
      const conditionFactor = adjustmentFactors.find((f) => f.name === "Condition");

      if (conditionFactor) {
        // Convert condition to numeric value
        const conditionValues: Record<string, number> = {
          excellent: 5,
          good: 4,
          average: 3,
          fair: 2,
          poor: 1,
        };

        const subjectConditionValue = conditionValues[subjectProperty.condition.toLowerCase()] || 3;
        const compConditionValue = conditionValues[comparable.condition.toLowerCase()] || 3;

        if (subjectConditionValue !== compConditionValue) {
          const conditionDifference = subjectConditionValue - compConditionValue;
          let adjustment = 0;

          if (conditionFactor.type === "percentage") {
            adjustment = conditionDifference * conditionFactor.value * comparable.salePrice;
          } else {
            adjustment = conditionDifference * conditionFactor.value;
          }

          totalAdjustment += adjustment;

          adjustedComparable.adjustments?.push({
            name: "Condition",
            amount: adjustment,
            reason: `Subject condition: ${subjectProperty.condition}, Comparable condition: ${comparable.condition}`,
          });
        }
      }
    }

    // Calculate adjusted price
    adjustedComparable.adjustedPrice = comparable.salePrice + totalAdjustment;

    return adjustedComparable;
  }

  /**
   * Format currency
   */
  public formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Format date
   */
  public formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}
