/**
 * Advanced Analytics Service
 * 
 * Provides high-level analytics capabilities that integrate market prediction,
 * risk assessment, and AI-powered insights.
 */

import { IStorage } from '../storage';
import { EnhancedMarketPredictionModel } from './enhanced-market-prediction-model';
import { EnhancedRiskAssessmentEngine } from './enhanced-risk-assessment-engine';
import { LLMService } from './llm-service';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';

export class AdvancedAnalyticsService {
  private storage: IStorage;
  private marketPredictionModel: EnhancedMarketPredictionModel;
  private riskAssessmentEngine: EnhancedRiskAssessmentEngine;
  private llmService: LLMService;
  
  constructor(
    storage: IStorage,
    marketPredictionModel: EnhancedMarketPredictionModel,
    riskAssessmentEngine: EnhancedRiskAssessmentEngine,
    llmService: LLMService
  ) {
    this.storage = storage;
    this.marketPredictionModel = marketPredictionModel;
    this.riskAssessmentEngine = riskAssessmentEngine;
    this.llmService = llmService;
    
    logger.info('Advanced Analytics Service initialized', {
      component: 'AdvancedAnalyticsService'
    });
  }
  
  /**
   * Generate an investment opportunity analysis for a property
   */
  public async generateInvestmentOpportunityAnalysis(propertyId: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      logger.info(`Generating investment opportunity analysis for property: ${propertyId}`, {
        component: 'AdvancedAnalyticsService',
        metadata: { propertyId }
      });
      
      // Get property details
      const property = await this.storage.getPropertyByPropertyId(propertyId);
      
      if (!property) {
        throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
      }
      
      // Get future value prediction
      const valuePrediction = await this.marketPredictionModel.predictForProperty(propertyId, 5);
      
      // Get risk assessment
      const riskAssessment = await this.riskAssessmentEngine.assessPropertyRisks(propertyId);
      
      // Get comparable properties
      const comparableProperties = await this.storage.findComparableProperties(propertyId, 5);
      
      // Calculate ROI metrics
      const currentValue = valuePrediction.currentValue;
      const projectedValue = valuePrediction.predictedValues[4].value; // 5-year projection
      const appreciationRate = (projectedValue - currentValue) / currentValue;
      
      // Calculate risk-adjusted return
      const riskFactor = riskAssessment.overallRiskScore / 100;
      const riskAdjustedReturn = (appreciationRate * (1 - riskFactor)) * 100;
      
      // Calculate potential cash flow (estimated)
      const estimatedRentalYield = this.estimateRentalYield(property);
      const annualAppreciationRate = Math.pow((projectedValue / currentValue), 1/5) - 1;
      
      // Generate investment score (0-100)
      const investmentScore = this.calculateInvestmentScore(
        annualAppreciationRate,
        estimatedRentalYield,
        riskFactor
      );
      
      // Get regional metrics
      const region = property.region || property.address.split(',').pop()?.trim() || 'Unknown';
      const marketTrends = await this.marketPredictionModel.getMarketTrends(region);
      const economicIndicators = await this.marketPredictionModel.getEconomicIndicators(region);
      
      // Generate investment strength and opportunities
      const [strengths, opportunities] = this.generateStrengthsAndOpportunities(
        property,
        valuePrediction,
        riskAssessment,
        marketTrends,
        economicIndicators
      );
      
      // Generate final analysis
      const analysis = {
        propertyId: property.propertyId,
        address: property.address,
        investmentMetrics: {
          currentValue,
          projectedValue,
          appreciationRate: appreciationRate * 100,
          annualAppreciationRate: annualAppreciationRate * 100,
          estimatedRentalYield: estimatedRentalYield * 100,
          riskAdjustedReturn,
          investmentScore
        },
        riskProfile: {
          overallRiskScore: riskAssessment.overallRiskScore,
          riskLevel: this.getRiskLevelText(riskAssessment.overallRiskScore),
          topRiskFactors: riskAssessment.riskFactors
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
        },
        marketConditions: {
          marketTrends: marketTrends.slice(0, 3),
          keyEconomicIndicators: Array.isArray(economicIndicators.topFactors) 
            ? economicIndicators.topFactors 
            : []
        },
        comparablesAnalysis: {
          comparableCount: comparableProperties.length,
          averageValue: this.calculateAverageValue(comparableProperties),
          valuePercentile: this.calculateValuePercentile(property, comparableProperties)
        },
        investmentStrengths: strengths,
        investmentOpportunities: opportunities,
        generatedDate: new Date().toISOString()
      };
      
      const duration = Date.now() - startTime;
      logger.info(`Generated investment opportunity analysis in ${duration}ms`, {
        component: 'AdvancedAnalyticsService',
        metadata: { propertyId, duration }
      });
      
      return analysis;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to generate investment opportunity analysis: ${error}`, {
        component: 'AdvancedAnalyticsService',
        metadata: { propertyId, duration, error }
      });
      
      throw ErrorHandler.handleError(error, 'generateInvestmentOpportunityAnalysis');
    }
  }
  
  /**
   * Generate a neighborhood analysis report
   */
  public async generateNeighborhoodAnalysis(
    zipCode: string,
    radius: number = 1,
    includeComparables: boolean = true
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      logger.info(`Generating neighborhood analysis for zip code: ${zipCode}`, {
        component: 'AdvancedAnalyticsService',
        metadata: { zipCode, radius, includeComparables }
      });
      
      // Get properties in the area
      const properties = await this.storage.getPropertiesByZipCode(zipCode);
      
      if (!properties || properties.length === 0) {
        throw ErrorHandler.notFound(`No properties found in zip code ${zipCode}`);
      }
      
      // Get market trends for the area
      const region = properties[0].region || zipCode;
      const marketTrends = await this.marketPredictionModel.getMarketTrends(region);
      
      // Get economic indicators for the area
      const economicIndicators = await this.marketPredictionModel.getEconomicIndicators(region);
      
      // Get property types distribution
      const propertyTypesDistribution = this.calculatePropertyTypeDistribution(properties);
      
      // Get value ranges distribution
      const valueRangesDistribution = this.calculateValueRangesDistribution(properties);
      
      // Calculate neighborhood metrics
      const neighborhoodMetrics = this.calculateNeighborhoodMetrics(properties);
      
      // Generate comparable sales analysis if requested
      let comparablesSummary = null;
      if (includeComparables) {
        comparablesSummary = await this.generateComparablesSummary(properties);
      }
      
      // Generate final analysis
      const analysis = {
        zipCode,
        regionName: region,
        propertyCount: properties.length,
        marketMetrics: {
          medianValue: neighborhoodMetrics.medianValue,
          averageValue: neighborhoodMetrics.averageValue,
          valueChange: marketTrends.find(t => t.metric === 'median_sale_price')?.value || 0,
          averageDaysOnMarket: marketTrends.find(t => t.metric === 'days_on_market')?.value || 0,
          inventoryLevels: marketTrends.find(t => t.metric === 'inventory_levels')?.value || 0,
        },
        propertyDistribution: {
          byType: propertyTypesDistribution,
          byValue: valueRangesDistribution
        },
        economicFactors: {
          topFactors: Array.isArray(economicIndicators.topFactors) 
            ? economicIndicators.topFactors 
            : [],
          unemployment: economicIndicators.unemploymentRate || 0,
          jobGrowth: economicIndicators.gdpGrowth || 0,
          incomeGrowth: 0 // Not available in current data
        },
        marketTrends,
        comparablesSummary,
        generatedDate: new Date().toISOString()
      };
      
      const duration = Date.now() - startTime;
      logger.info(`Generated neighborhood analysis in ${duration}ms`, {
        component: 'AdvancedAnalyticsService',
        metadata: { zipCode, duration }
      });
      
      return analysis;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to generate neighborhood analysis: ${error}`, {
        component: 'AdvancedAnalyticsService',
        metadata: { zipCode, duration, error }
      });
      
      throw ErrorHandler.handleError(error, 'generateNeighborhoodAnalysis');
    }
  }
  
  /**
   * Generate a property valuation sensitivity analysis
   */
  public async generateValuationSensitivityAnalysis(propertyId: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      logger.info(`Generating valuation sensitivity analysis for property: ${propertyId}`, {
        component: 'AdvancedAnalyticsService',
        metadata: { propertyId }
      });
      
      // Get property details
      const property = await this.storage.getPropertyByPropertyId(propertyId);
      
      if (!property) {
        throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
      }
      
      // Get future value prediction
      const valuePrediction = await this.marketPredictionModel.predictForProperty(propertyId, 5);
      
      // Get market trends for the area
      const region = property.region || property.address.split(',').pop()?.trim() || 'Unknown';
      const marketTrends = await this.marketPredictionModel.getMarketTrends(region);
      
      // Generate scenarios for sensitivity analysis
      const baseValue = valuePrediction.currentValue;
      const scenarios = this.generateValueScenarios(
        baseValue,
        valuePrediction.influencingFactors,
        marketTrends
      );
      
      // Calculate impact of various factors
      const factorImpacts = this.calculateFactorImpacts(valuePrediction.influencingFactors);
      
      // Generate final analysis
      const analysis = {
        propertyId: property.propertyId,
        address: property.address,
        currentValue: baseValue,
        baselineForecast: {
          fiveYearValue: valuePrediction.predictedValues[4].value,
          annualGrowthRate: valuePrediction.annualGrowthRate
        },
        scenarios,
        factorSensitivity: factorImpacts,
        breakEvenAnalysis: {
          interestRateThreshold: this.calculateInterestRateThreshold(property, valuePrediction),
          marketDownturnResistance: this.calculateMarketDownturnResistance(valuePrediction),
          vacancyRateThreshold: this.calculateVacancyRateThreshold(property)
        },
        keyRiskPoints: this.generateKeyRiskPoints(property, valuePrediction, factorImpacts),
        generatedDate: new Date().toISOString()
      };
      
      const duration = Date.now() - startTime;
      logger.info(`Generated valuation sensitivity analysis in ${duration}ms`, {
        component: 'AdvancedAnalyticsService',
        metadata: { propertyId, duration }
      });
      
      return analysis;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to generate valuation sensitivity analysis: ${error}`, {
        component: 'AdvancedAnalyticsService',
        metadata: { propertyId, duration, error }
      });
      
      throw ErrorHandler.handleError(error, 'generateValuationSensitivityAnalysis');
    }
  }
  
  //===============================
  // Helper Methods
  //===============================
  
  /**
   * Estimate rental yield for a property
   */
  private estimateRentalYield(property: any): number {
    // Default rental yield ranges by property type
    const rentalYieldRanges: Record<string, [number, number]> = {
      'Residential': [0.04, 0.06],
      'Commercial': [0.05, 0.08],
      'Industrial': [0.06, 0.09],
      'Agricultural': [0.01, 0.03],
      'Mixed Use': [0.05, 0.07],
      'Recreational': [0.03, 0.05]
    };
    
    // Get the range for this property type
    const propertyType = property.propertyType || 'Residential';
    const [minYield, maxYield] = rentalYieldRanges[propertyType] || rentalYieldRanges['Residential'];
    
    // Generate a realistic yield within the range
    // We can make this more sophisticated with actual property attributes
    const rentalYield = minYield + (Math.random() * (maxYield - minYield));
    
    // Apply adjustments based on property attributes if available
    let adjustedYield = rentalYield;
    
    // Example: Adjust based on square footage
    if (property.squareFootage) {
      // Larger properties may have slightly lower yields
      const sizeFactor = property.squareFootage > 2000 ? 0.98 : 1.02;
      adjustedYield *= sizeFactor;
    }
    
    // Example: Adjust based on property age
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      // Newer properties may have slightly lower yields (higher purchase prices)
      const ageFactor = age < 10 ? 0.97 : age > 30 ? 1.03 : 1.0;
      adjustedYield *= ageFactor;
    }
    
    return adjustedYield;
  }
  
  /**
   * Calculate investment score
   */
  private calculateInvestmentScore(
    annualAppreciationRate: number,
    rentalYield: number,
    riskFactor: number
  ): number {
    // Weight factors according to importance
    const appreciationWeight = 0.4;
    const yieldWeight = 0.4;
    const riskWeight = 0.2;
    
    // Normalize appreciation rate (assuming 20% is maximum expected)
    const normalizedAppreciation = Math.min(annualAppreciationRate / 0.2, 1) * 100;
    
    // Normalize rental yield (assuming 10% is maximum expected)
    const normalizedYield = Math.min(rentalYield / 0.1, 1) * 100;
    
    // Normalize risk (lower is better)
    const normalizedRisk = 100 - (riskFactor * 100);
    
    // Calculate weighted score
    const score = (
      (normalizedAppreciation * appreciationWeight) +
      (normalizedYield * yieldWeight) +
      (normalizedRisk * riskWeight)
    );
    
    // Ensure score is between 0-100
    return Math.min(Math.max(score, 0), 100);
  }
  
  /**
   * Get risk level text based on score
   */
  private getRiskLevelText(score: number): string {
    if (score < 25) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 75) return 'High';
    return 'Very High';
  }
  
  /**
   * Calculate average value of comparable properties
   */
  private calculateAverageValue(properties: any[]): number {
    if (properties.length === 0) return 0;
    
    const values = properties.map(p => parseFloat(p.value || '0'));
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  
  /**
   * Calculate value percentile of a property among comparables
   */
  private calculateValuePercentile(property: any, comparables: any[]): number {
    if (comparables.length === 0) return 50;
    
    const propertyValue = parseFloat(property.value || '0');
    const values = comparables.map(p => parseFloat(p.value || '0'));
    
    // Count properties with lower values
    const lowerCount = values.filter(value => value < propertyValue).length;
    
    // Calculate percentile
    return (lowerCount / values.length) * 100;
  }
  
  /**
   * Calculate property type distribution
   */
  private calculatePropertyTypeDistribution(properties: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const property of properties) {
      const type = property.propertyType || 'Unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }
  
  /**
   * Calculate value ranges distribution
   */
  private calculateValueRangesDistribution(properties: any[]): Record<string, number> {
    const ranges = {
      'Under $100k': 0,
      '$100k-$250k': 0,
      '$250k-$500k': 0,
      '$500k-$750k': 0,
      '$750k-$1M': 0,
      'Over $1M': 0
    };
    
    for (const property of properties) {
      const value = parseFloat(property.value || '0');
      
      if (value < 100000) {
        ranges['Under $100k']++;
      } else if (value < 250000) {
        ranges['$100k-$250k']++;
      } else if (value < 500000) {
        ranges['$250k-$500k']++;
      } else if (value < 750000) {
        ranges['$500k-$750k']++;
      } else if (value < 1000000) {
        ranges['$750k-$1M']++;
      } else {
        ranges['Over $1M']++;
      }
    }
    
    return ranges;
  }
  
  /**
   * Calculate neighborhood metrics
   */
  private calculateNeighborhoodMetrics(properties: any[]): any {
    if (properties.length === 0) {
      return {
        medianValue: 0,
        averageValue: 0,
        minValue: 0,
        maxValue: 0,
        valueStdDev: 0
      };
    }
    
    const values = properties.map(p => parseFloat(p.value || '0')).sort((a, b) => a - b);
    
    const min = values[0];
    const max = values[values.length - 1];
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    // Calculate median
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];
    
    // Calculate standard deviation
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    return {
      medianValue: median,
      averageValue: avg,
      minValue: min,
      maxValue: max,
      valueStdDev: stdDev
    };
  }
  
  /**
   * Generate comparable sales summary
   */
  private async generateComparablesSummary(properties: any[]): Promise<any> {
    // This would use actual comparable sales data
    // For now, we'll generate a reasonable summary
    
    const recentSales = properties.slice(0, Math.min(5, properties.length));
    
    return {
      recentSalesCount: recentSales.length,
      averageSalePrice: this.calculateAverageValue(recentSales),
      medianPricePerSqFt: 180, // Placeholder
      averageDaysOnMarket: 45, // Placeholder
      salePriceToListRatio: 0.97, // Placeholder
      comparables: recentSales.map(property => ({
        propertyId: property.propertyId,
        address: property.address,
        salePrice: parseFloat(property.value || '0'),
        saleDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 180 days
        pricePerSqFt: property.squareFootage 
          ? parseFloat(property.value || '0') / property.squareFootage 
          : 0
      }))
    };
  }
  
  /**
   * Generate investment strengths and opportunities
   */
  private generateStrengthsAndOpportunities(
    property: any,
    valuePrediction: any,
    riskAssessment: any,
    marketTrends: any[],
    economicIndicators: any
  ): [string[], string[]] {
    const strengths: string[] = [];
    const opportunities: string[] = [];
    
    // Add strengths based on data
    if (valuePrediction.annualGrowthRate > 0.03) {
      strengths.push(`Strong projected appreciation rate of ${(valuePrediction.annualGrowthRate * 100).toFixed(1)}% annually`);
    }
    
    if (riskAssessment.overallRiskScore < 40) {
      strengths.push(`Low overall risk profile (${riskAssessment.overallRiskScore}/100)`);
    }
    
    const medianPriceTrend = marketTrends.find(t => t.metric === 'median_sale_price');
    if (medianPriceTrend && medianPriceTrend.trend === 'increasing' && medianPriceTrend.value > 2) {
      strengths.push(`Strong market growth with median prices increasing by ${medianPriceTrend.value.toFixed(1)}%`);
    }
    
    const daysOnMarketTrend = marketTrends.find(t => t.metric === 'days_on_market');
    if (daysOnMarketTrend && daysOnMarketTrend.trend === 'decreasing') {
      strengths.push(`Improving market liquidity with days on market decreasing by ${Math.abs(daysOnMarketTrend.value).toFixed(1)}%`);
    }
    
    // Add opportunities based on data
    if (riskAssessment.riskFactors.some(f => f.category.includes('Zoning') && f.score > 60)) {
      opportunities.push('Potential for rezoning or variance to increase property value');
    }
    
    if (property.propertyType === 'Residential' && property.squareFootage < 1500) {
      opportunities.push('Potential for expansion or renovation to increase square footage and value');
    }
    
    if (economicIndicators.jobGrowth > 1.5) {
      opportunities.push(`Strong job growth in the area (${economicIndicators.jobGrowth}%) may drive increased housing demand`);
    }
    
    const inventoryTrend = marketTrends.find(t => t.metric === 'inventory_levels');
    if (inventoryTrend && inventoryTrend.trend === 'decreasing') {
      opportunities.push('Decreasing inventory levels indicate potential for price increases due to supply constraints');
    }
    
    // Ensure we have at least some strengths and opportunities
    if (strengths.length === 0) {
      strengths.push('Property in established neighborhood with stable market conditions');
    }
    
    if (opportunities.length === 0) {
      opportunities.push('Potential for value-add improvements to increase property appeal');
    }
    
    return [strengths, opportunities];
  }
  
  /**
   * Generate value scenarios for sensitivity analysis
   */
  private generateValueScenarios(
    baseValue: number,
    influencingFactors: any[],
    marketTrends: any[]
  ): any {
    // Define standard scenarios
    const scenarios = {
      optimistic: {
        description: 'Strong economic growth, favorable market conditions',
        valueChange: 0,
        factors: [] as any[]
      },
      conservative: {
        description: 'Moderate growth, neutral market conditions',
        valueChange: 0,
        factors: [] as any[]
      },
      pessimistic: {
        description: 'Economic slowdown, challenging market conditions',
        valueChange: 0,
        factors: [] as any[]
      }
    };
    
    // Calculate scenario impacts
    const optimisticImpact = 0.15; // 15% above baseline
    const pessimisticImpact = -0.10; // 10% below baseline
    
    scenarios.optimistic.valueChange = baseValue * optimisticImpact;
    scenarios.conservative.valueChange = 0;
    scenarios.pessimistic.valueChange = baseValue * pessimisticImpact;
    
    // Add scenarios with adjusted values
    (scenarios.optimistic as any).projectedValue = baseValue * (1 + optimisticImpact);
    (scenarios.conservative as any).projectedValue = baseValue;
    (scenarios.pessimistic as any).projectedValue = baseValue * (1 + pessimisticImpact);
    
    // Add key factors for each scenario
    scenarios.optimistic.factors = [
      { factor: 'Interest Rates', impact: 'Decrease by 0.5-1.0%' },
      { factor: 'Market Demand', impact: 'Strong increase' },
      { factor: 'Economic Growth', impact: 'Above forecast (3-4%)' }
    ];
    
    scenarios.conservative.factors = [
      { factor: 'Interest Rates', impact: 'Stable or slight increase' },
      { factor: 'Market Demand', impact: 'Modest growth' },
      { factor: 'Economic Growth', impact: 'As forecasted (1.5-2.5%)' }
    ];
    
    scenarios.pessimistic.factors = [
      { factor: 'Interest Rates', impact: 'Increase by 1.0-1.5%' },
      { factor: 'Market Demand', impact: 'Softening' },
      { factor: 'Economic Growth', impact: 'Below forecast (0-1%)' }
    ];
    
    return scenarios;
  }
  
  /**
   * Calculate impact of various factors on property value
   */
  private calculateFactorImpacts(influencingFactors: any[]): any[] {
    return influencingFactors.map(factor => {
      // Determine the impact direction and magnitude
      const impact = factor.impact === 'positive' ? 1 : factor.impact === 'negative' ? -1 : 0;
      const magnitude = factor.weight;
      
      // Calculate the sensitivity (how much a 1-unit change affects value)
      const sensitivity = impact * magnitude * 5; // Scaled for better readability
      
      return {
        factor: factor.factor,
        impact: factor.impact,
        sensitivity,
        description: factor.description
      };
    });
  }
  
  /**
   * Calculate interest rate threshold for break-even
   */
  private calculateInterestRateThreshold(property: any, valuePrediction: any): number {
    // This would require loan details to be accurate
    // For now, we'll provide a reasonable estimate
    const currentMortgageRate = 6.5; // Current average 30-year fixed rate
    const valuationHeadroom = valuePrediction.annualGrowthRate * 100;
    
    // Estimate rate threshold where valuation growth would be offset
    return currentMortgageRate + valuationHeadroom;
  }
  
  /**
   * Calculate market downturn resistance
   */
  private calculateMarketDownturnResistance(valuePrediction: any): number {
    // Calculate the market downturn percentage that would eliminate 5-year gains
    const fiveYearGrowth = (valuePrediction.predictedValues[4].value / valuePrediction.currentValue) - 1;
    
    // Resistance is the percentage market drop that would eliminate projected gains
    return fiveYearGrowth * 100;
  }
  
  /**
   * Calculate vacancy rate threshold
   */
  private calculateVacancyRateThreshold(property: any): number {
    // This would require rental income details to be accurate
    // For now, we'll provide a reasonable estimate
    return 25; // Placeholder - would be calculated from actual financial data
  }
  
  /**
   * Generate key risk points
   */
  private generateKeyRiskPoints(property: any, valuePrediction: any, factorImpacts: any[]): string[] {
    const keyRisks: string[] = [];
    
    // Add risks based on the most sensitive negative factors
    const negativeFactors = factorImpacts
      .filter(f => f.sensitivity < 0)
      .sort((a, b) => a.sensitivity - b.sensitivity);
    
    if (negativeFactors.length > 0) {
      const topRisk = negativeFactors[0];
      keyRisks.push(`${topRisk.factor} has significant negative impact on valuation`);
    }
    
    // Add risk based on prediction confidence
    const lowestConfidence = Math.min(...valuePrediction.predictedValues.map((p: any) => p.confidence));
    if (lowestConfidence < 0.7) {
      keyRisks.push(`Future value projections have moderate confidence level (${(lowestConfidence * 100).toFixed(0)}%)`);
    }
    
    // Add risks based on property type and attributes
    if (property.yearBuilt && (new Date().getFullYear() - property.yearBuilt) > 30) {
      keyRisks.push('Older property may require significant maintenance or updates');
    }
    
    // Ensure we have at least some key risks
    if (keyRisks.length === 0) {
      keyRisks.push('Standard market volatility risk applies to all property investments');
    }
    
    return keyRisks;
  }
}