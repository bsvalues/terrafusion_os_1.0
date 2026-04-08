/**
 * Market Prediction Model
 * 
 * This service provides advanced predictive modeling for real estate market analysis.
 * It leverages historical data, economic indicators, and AI models to generate 
 * property value forecasts, market trend analysis, and risk assessments.
 */

import { IStorage } from '../storage';
import { LLMService } from './llm-service';

export interface MarketTrend {
  metric: string;
  timeframe: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface EconomicIndicator {
  name: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  significance: number; // 0-1 scale
}

export interface MarketPrediction {
  propertyId: string;
  currentValue: number;
  predictedValues: {
    year: number;
    value: number;
    confidence: number;
  }[];
  annualGrowthRate: number;
  confidenceScore: number;
  riskScore: number;
  influencingFactors: {
    factor: string;
    impact: number; // -10 to +10 scale
    confidence: number;
  }[];
}

export class MarketPredictionModel {
  private storage: IStorage;
  private llmService: LLMService | null = null;
  
  // Cached data to improve performance
  private cachedMarketTrends: Map<string, { data: MarketTrend[], timestamp: Date }> = new Map();
  private cachedEconomicIndicators: Map<string, { data: any, timestamp: Date }> = new Map();
  
  constructor(storage: IStorage, llmService?: LLMService) {
    this.storage = storage;
    
    if (llmService) {
      this.llmService = llmService;
    } else {
      // Create a default LLM service if none provided
      this.llmService = new LLMService({
        defaultProvider: 'openai',
        defaultModels: {
          openai: 'gpt-4o',
          anthropic: 'claude-3-opus-20240229'
        }
      });
    }
  }
  
  /**
   * Predict future property values based on historical data and market trends
   */
  public async predictForProperty(propertyId: string, years: number = 5): Promise<MarketPrediction> {
    // Get property data
    const property = await this.storage.getPropertyByPropertyId(propertyId);
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Get historical property data if available
    const propertyHistory = await this.getPropertyHistory(propertyId);
    
    // Get market trends for the region
    const marketTrends = await this.getMarketTrends(property.region || 'unknown');
    
    // Get economic indicators
    const economicIndicators = await this.getEconomicIndicators(property.region || 'unknown');
    
    // Get comparable properties
    const comparables = await this.storage.findComparableProperties(propertyId, 10);
    
    // Calculate current value
    const currentValue = parseFloat(property.value || '0');
    
    // Generate predictions using a multi-model approach
    const predictions = await this.generatePredictions(
      property,
      propertyHistory,
      marketTrends,
      economicIndicators,
      comparables,
      years
    );
    
    // Analyze risk factors
    const riskAnalysis = await this.analyzeRiskFactors(
      property,
      marketTrends,
      economicIndicators,
      predictions
    );
    
    // Create final prediction object
    const marketPrediction: MarketPrediction = {
      propertyId,
      currentValue,
      predictedValues: predictions.map((value, index) => ({
        year: new Date().getFullYear() + index + 1,
        value,
        confidence: Math.max(0.95 - (index * 0.05), 0.7) // Confidence decreases with time
      })),
      annualGrowthRate: this.calculateAnnualGrowthRate(currentValue, predictions[predictions.length - 1], years),
      confidenceScore: riskAnalysis.confidence,
      riskScore: riskAnalysis.risk,
      influencingFactors: riskAnalysis.factors
    };
    
    return marketPrediction;
  }
  
  /**
   * Get market trends for a specific region
   */
  public async getMarketTrends(region: string): Promise<MarketTrend[]> {
    // Check cache first
    const cacheKey = `market_trends_${region}`;
    const cachedData = this.cachedMarketTrends.get(cacheKey);
    
    // If we have cached data less than 24 hours old, use it
    if (cachedData && (new Date().getTime() - cachedData.timestamp.getTime()) < 86400000) {
      return cachedData.data;
    }
    
    // Try to fetch from storage first
    try {
      const storedTrends = await this.storage.getMarketTrends(region);
      
      if (storedTrends && storedTrends.length > 0) {
        // Cache the results
        this.cachedMarketTrends.set(cacheKey, {
          data: storedTrends,
          timestamp: new Date()
        });
        
        return storedTrends;
      }
    } catch (error) {
      console.warn(`Error fetching market trends from storage: ${error.message}`);
    }
    
    // If no stored data, generate synthetic data (in production, this would be real market data)
    const syntheticTrends: MarketTrend[] = [
      {
        metric: 'median_sale_price',
        timeframe: '1year',
        value: 3.2,
        trend: 'increasing',
        confidence: 0.92
      },
      {
        metric: 'days_on_market',
        timeframe: '1year',
        value: -5.1,
        trend: 'decreasing',
        confidence: 0.87
      },
      {
        metric: 'inventory_levels',
        timeframe: '1year',
        value: -2.8,
        trend: 'decreasing',
        confidence: 0.85
      },
      {
        metric: 'price_per_sqft',
        timeframe: '1year',
        value: 4.1,
        trend: 'increasing',
        confidence: 0.9
      },
      {
        metric: 'new_listings',
        timeframe: '1year',
        value: 1.2,
        trend: 'increasing',
        confidence: 0.8
      }
    ];
    
    // Cache the results
    this.cachedMarketTrends.set(cacheKey, {
      data: syntheticTrends,
      timestamp: new Date()
    });
    
    return syntheticTrends;
  }
  
  /**
   * Get economic indicators for a region
   */
  public async getEconomicIndicators(region: string): Promise<any> {
    // Check cache first
    const cacheKey = `economic_indicators_${region}`;
    const cachedData = this.cachedEconomicIndicators.get(cacheKey);
    
    // If we have cached data less than 24 hours old, use it
    if (cachedData && (new Date().getTime() - cachedData.timestamp.getTime()) < 86400000) {
      return cachedData.data;
    }
    
    // Try to fetch from storage first
    try {
      const storedIndicators = await this.storage.getEconomicIndicators(region);
      
      if (storedIndicators && Object.keys(storedIndicators).length > 0) {
        // Cache the results
        this.cachedEconomicIndicators.set(cacheKey, {
          data: storedIndicators,
          timestamp: new Date()
        });
        
        return storedIndicators;
      }
    } catch (error) {
      console.warn(`Error fetching economic indicators from storage: ${error.message}`);
    }
    
    // If no stored data, use placeholders (in production, this would pull from economic API)
    const currentYear = new Date().getFullYear();
    const indicators = {
      interestRate: 5.75,
      unemploymentRate: 3.8,
      gdpGrowth: 2.1,
      inflationRate: 3.2,
      housingStarts: 1.45, // in millions
      buildingPermits: 1.52, // in millions
      constructionSpending: 1821.0, // in billions
      consumerConfidence: 105.2,
      topFactors: [
        {
          name: 'Interest Rates',
          value: 5.75,
          impact: 'negative' as const,
          significance: 0.85
        },
        {
          name: 'Employment Growth',
          value: 2.1,
          impact: 'positive' as const,
          significance: 0.77
        },
        {
          name: 'Housing Supply',
          value: -3.2,
          impact: 'positive' as const,
          significance: 0.81
        }
      ],
      historicalData: {
        interestRates: [
          { year: currentYear - 4, value: 3.2 },
          { year: currentYear - 3, value: 3.0 },
          { year: currentYear - 2, value: 3.5 },
          { year: currentYear - 1, value: 4.75 },
          { year: currentYear, value: 5.75 }
        ],
        homeValueIndex: [
          { year: currentYear - 4, value: 245.8 },
          { year: currentYear - 3, value: 267.3 },
          { year: currentYear - 2, value: 302.1 },
          { year: currentYear - 1, value: 325.4 },
          { year: currentYear, value: 342.7 }
        ]
      }
    };
    
    // Cache the results
    this.cachedEconomicIndicators.set(cacheKey, {
      data: indicators,
      timestamp: new Date()
    });
    
    return indicators;
  }
  
  /**
   * Get economic forecasts for a region
   */
  public async getEconomicForecasts(region: string, years: number = 5): Promise<any> {
    // Get current indicators as baseline
    const currentIndicators = await this.getEconomicIndicators(region);
    
    // Generate forecasts
    const currentYear = new Date().getFullYear();
    const forecasts = {
      interestRates: Array.from({length: years}, (_, i) => ({
        year: currentYear + i + 1,
        value: this.forecastMetric(currentIndicators.interestRate, -0.25, 0.5, i + 1),
        confidence: Math.max(0.9 - (i * 0.08), 0.6)
      })),
      unemploymentRate: Array.from({length: years}, (_, i) => ({
        year: currentYear + i + 1,
        value: this.forecastMetric(currentIndicators.unemploymentRate, 0.1, 0.4, i + 1),
        confidence: Math.max(0.85 - (i * 0.1), 0.55)
      })),
      gdpGrowth: Array.from({length: years}, (_, i) => ({
        year: currentYear + i + 1,
        value: this.forecastMetric(currentIndicators.gdpGrowth, -0.2, 0.3, i + 1),
        confidence: Math.max(0.8 - (i * 0.12), 0.5)
      })),
      inflationRate: Array.from({length: years}, (_, i) => ({
        year: currentYear + i + 1,
        value: this.forecastMetric(currentIndicators.inflationRate, -0.3, 0.2, i + 1),
        confidence: Math.max(0.82 - (i * 0.11), 0.52)
      })),
      homeValueIndex: Array.from({length: years}, (_, i) => ({
        year: currentYear + i + 1,
        value: this.forecastMetric(currentIndicators.historicalData.homeValueIndex[4].value, 8, 15, i + 1),
        confidence: Math.max(0.88 - (i * 0.09), 0.58)
      }))
    };
    
    return forecasts;
  }
  
  /**
   * Get historical data for a specific region
   */
  public async getHistoricalData(region: string): Promise<any> {
    // Try to fetch from storage first
    try {
      const storedData = await this.storage.getRegionalHistoricalData(region);
      
      if (storedData && Object.keys(storedData).length > 0) {
        return storedData;
      }
    } catch (error) {
      console.warn(`Error fetching historical data from storage: ${error.message}`);
    }
    
    // If no stored data, use placeholders (in production, this would pull from historical data API)
    const currentYear = new Date().getFullYear();
    const historicalData = {
      medianHomeValues: [
        { year: currentYear - 10, value: 198500 },
        { year: currentYear - 9, value: 210000 },
        { year: currentYear - 8, value: 224500 },
        { year: currentYear - 7, value: 235000 },
        { year: currentYear - 6, value: 248000 },
        { year: currentYear - 5, value: 265000 },
        { year: currentYear - 4, value: 278500 },
        { year: currentYear - 3, value: 295000 },
        { year: currentYear - 2, value: 315500 },
        { year: currentYear - 1, value: 342000 },
        { year: currentYear, value: 365000 }
      ],
      salesVolume: [
        { year: currentYear - 10, value: 5125000 },
        { year: currentYear - 9, value: 5280000 },
        { year: currentYear - 8, value: 5520000 },
        { year: currentYear - 7, value: 5750000 },
        { year: currentYear - 6, value: 5890000 },
        { year: currentYear - 5, value: 6050000 },
        { year: currentYear - 4, value: 6180000 },
        { year: currentYear - 3, value: 5950000 },
        { year: currentYear - 2, value: 6320000 },
        { year: currentYear - 1, value: 6480000 },
        { year: currentYear, value: 6420000 }
      ],
      priceToIncomeRatio: [
        { year: currentYear - 10, value: 3.8 },
        { year: currentYear - 9, value: 3.9 },
        { year: currentYear - 8, value: 4.0 },
        { year: currentYear - 7, value: 4.1 },
        { year: currentYear - 6, value: 4.2 },
        { year: currentYear - 5, value: 4.3 },
        { year: currentYear - 4, value: 4.4 },
        { year: currentYear - 3, value: 4.5 },
        { year: currentYear - 2, value: 4.7 },
        { year: currentYear - 1, value: 4.9 },
        { year: currentYear, value: 5.1 }
      ]
    };
    
    return historicalData;
  }
  
  /**
   * Private: Get property history
   */
  private async getPropertyHistory(propertyId: string): Promise<any> {
    try {
      const history = await this.storage.getPropertyHistory(propertyId);
      return history;
    } catch (error) {
      console.warn(`Error fetching property history: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Private: Generate value predictions
   */
  private async generatePredictions(
    property: any,
    propertyHistory: any,
    marketTrends: MarketTrend[],
    economicIndicators: any,
    comparables: any[],
    years: number
  ): Promise<number[]> {
    const currentValue = parseFloat(property.value || '0');
    
    // Base growth rate on market trends
    const medianPriceGrowth = marketTrends.find(t => t.metric === 'median_sale_price')?.value || 3.0;
    
    // Apply adjustments based on economic indicators
    const interestRateImpact = this.calculateInterestRateImpact(economicIndicators.interestRate);
    const unemploymentImpact = this.calculateUnemploymentImpact(economicIndicators.unemploymentRate);
    const inflationImpact = economicIndicators.inflationRate * 0.2;
    
    // Calculate property-specific factors
    let propertySpecificGrowth = 0;
    
    // Property type adjustment
    if (property.propertyType === 'Residential') {
      propertySpecificGrowth += 0.3;
    } else if (property.propertyType === 'Commercial') {
      propertySpecificGrowth += 0.1;
    }
    
    // Age adjustment
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - parseInt(property.yearBuilt);
      propertySpecificGrowth += age < 5 ? 0.5 : 
                               age < 10 ? 0.3 : 
                               age < 20 ? 0.1 : 
                               age < 40 ? -0.1 : -0.3;
    }
    
    // Calculate final growth rate
    const adjustedGrowthRate = (
      medianPriceGrowth + 
      interestRateImpact + 
      unemploymentImpact + 
      inflationImpact + 
      propertySpecificGrowth
    ) / 100; // Convert to decimal
    
    // Generate predictions for each year
    const predictions: number[] = [];
    let lastValue = currentValue;
    
    for (let i = 0; i < years; i++) {
      // Growth rate varies slightly each year with some random variation
      const yearAdjustment = (Math.random() * 0.01) - 0.005; // -0.5% to +0.5%
      const yearGrowthRate = adjustedGrowthRate + yearAdjustment;
      
      // Calculate new value
      const newValue = lastValue * (1 + yearGrowthRate);
      predictions.push(Math.round(newValue));
      lastValue = newValue;
    }
    
    return predictions;
  }
  
  /**
   * Private: Analyze risk factors
   */
  private async analyzeRiskFactors(
    property: any,
    marketTrends: MarketTrend[],
    economicIndicators: any,
    predictions: number[]
  ): Promise<{
    risk: number;
    confidence: number;
    factors: { factor: string; impact: number; confidence: number; }[];
  }> {
    // Calculate risk score (0-100)
    let riskScore = 50; // Start with neutral risk
    
    // Adjust based on market trends
    const medianPriceTrend = marketTrends.find(t => t.metric === 'median_sale_price');
    if (medianPriceTrend) {
      if (medianPriceTrend.trend === 'increasing') {
        riskScore -= (medianPriceTrend.value * 2); // Lower risk with price increases
      } else if (medianPriceTrend.trend === 'decreasing') {
        riskScore += (Math.abs(medianPriceTrend.value) * 3); // Higher risk with price decreases
      }
    }
    
    // Adjust based on days on market
    const domTrend = marketTrends.find(t => t.metric === 'days_on_market');
    if (domTrend) {
      if (domTrend.trend === 'increasing') {
        riskScore += (domTrend.value * 1.5); // Higher risk with increasing DOM
      } else if (domTrend.trend === 'decreasing') {
        riskScore -= (Math.abs(domTrend.value) * 1); // Lower risk with decreasing DOM
      }
    }
    
    // Adjust based on economic indicators
    riskScore += this.calculateInterestRateRisk(economicIndicators.interestRate);
    riskScore += this.calculateUnemploymentRisk(economicIndicators.unemploymentRate);
    
    // Limit to 0-100 range
    riskScore = Math.min(100, Math.max(0, riskScore));
    
    // Generate risk factors
    const factors = [];
    
    // Interest rates
    factors.push({
      factor: 'Interest Rates',
      impact: this.calculateInterestRateImpact(economicIndicators.interestRate),
      confidence: 0.9
    });
    
    // Unemployment
    factors.push({
      factor: 'Unemployment Rate',
      impact: this.calculateUnemploymentImpact(economicIndicators.unemploymentRate),
      confidence: 0.85
    });
    
    // Market inventory
    const inventoryTrend = marketTrends.find(t => t.metric === 'inventory_levels');
    if (inventoryTrend) {
      factors.push({
        factor: 'Housing Inventory',
        impact: inventoryTrend.trend === 'increasing' ? -2 : 3,
        confidence: inventoryTrend.confidence
      });
    }
    
    // Price growth rate
    const growthRate = this.calculateAnnualGrowthRate(
      parseFloat(property.value || '0'),
      predictions[predictions.length - 1],
      predictions.length
    );
    
    factors.push({
      factor: 'Projected Growth Rate',
      impact: growthRate > 4 ? 8 : growthRate > 2 ? 5 : growthRate > 0 ? 2 : -5,
      confidence: 0.8
    });
    
    // Property type
    if (property.propertyType) {
      const propertyTypeImpact = 
        property.propertyType === 'Residential' ? 3 :
        property.propertyType === 'Commercial' ? 1 :
        property.propertyType === 'Industrial' ? -1 : 0;
      
      factors.push({
        factor: 'Property Type',
        impact: propertyTypeImpact,
        confidence: 0.95
      });
    }
    
    // Calculate overall confidence
    const confidence = 0.85 - (riskScore / 1000); // Higher risk = slightly lower confidence
    
    return {
      risk: riskScore,
      confidence,
      factors
    };
  }
  
  /**
   * Helper: Calculate interest rate impact
   */
  private calculateInterestRateImpact(rate: number): number {
    // Higher rates generally reduce property value growth
    if (rate <= 3) return 0.5;  // Very low rates are positive
    if (rate <= 4) return 0.2;
    if (rate <= 5) return 0;    // Neutral around 5%
    if (rate <= 6) return -0.5;
    if (rate <= 7) return -1.0;
    return -2.0;               // Very high rates are strongly negative
  }
  
  /**
   * Helper: Calculate interest rate risk contribution
   */
  private calculateInterestRateRisk(rate: number): number {
    if (rate <= 3) return -5;   // Very low rates reduce risk
    if (rate <= 4) return -2;
    if (rate <= 5) return 0;    // Neutral around 5%
    if (rate <= 6) return 3;
    if (rate <= 7) return 8;
    return 15;                 // Very high rates increase risk significantly
  }
  
  /**
   * Helper: Calculate unemployment impact
   */
  private calculateUnemploymentImpact(rate: number): number {
    // Higher unemployment generally reduces property value growth
    if (rate <= 3) return 0.5;  // Very low unemployment is positive
    if (rate <= 4) return 0.2;
    if (rate <= 5) return 0;    // Neutral around 5%
    if (rate <= 6) return -0.5;
    if (rate <= 8) return -1.5;
    return -3.0;               // Very high unemployment is strongly negative
  }
  
  /**
   * Helper: Calculate unemployment risk contribution
   */
  private calculateUnemploymentRisk(rate: number): number {
    if (rate <= 3) return -5;   // Very low unemployment reduces risk
    if (rate <= 4) return -2;
    if (rate <= 5) return 0;    // Neutral around 5%
    if (rate <= 6) return 4;
    if (rate <= 8) return 10;
    return 20;                 // Very high unemployment increases risk significantly
  }
  
  /**
   * Helper: Calculate annual growth rate
   */
  private calculateAnnualGrowthRate(startValue: number, endValue: number, years: number): number {
    // Use CAGR formula: (endValue / startValue)^(1/years) - 1
    const growthRate = Math.pow(endValue / startValue, 1 / years) - 1;
    return parseFloat((growthRate * 100).toFixed(2)); // Convert to percentage with 2 decimal places
  }
  
  /**
   * Helper: Forecast metric with realistic variation
   */
  private forecastMetric(baseValue: number, minChange: number, maxChange: number, yearsAhead: number): number {
    // Add some randomness and variation based on years ahead
    const randomFactor = Math.random() * (maxChange - minChange) + minChange;
    const timeDecay = 1 / (1 + (yearsAhead * 0.1)); // Decreasing impact over time
    const change = randomFactor * timeDecay * yearsAhead;
    
    return parseFloat((baseValue + change).toFixed(2));
  }
}