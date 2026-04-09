/**
 * Market Factor Service
 * 
 * This service provides detailed market factor data and analysis for property value predictions.
 * It includes historical trends, impact weights, and specific local market data to enhance
 * value forecasting accuracy.
 */

export interface MarketFactor {
  name: string;
  description: string;
  currentTrend: 'rising' | 'falling' | 'stable';
  impactWeight: number; // 0-1 indicating relative importance
  historicalData?: {
    period: string;
    value: number;
  }[];
  forecastData?: {
    period: string;
    value: number;
    confidence: number;
  }[];
  localData?: Record<string, any>;
  nationalData?: Record<string, any>;
}

export interface MarketFactorReport {
  factors: MarketFactor[];
  timestamp: Date;
  marketOutlook: 'positive' | 'negative' | 'neutral';
  overallImpactScore: number; // -1 to 1 indicating negative to positive impact
  confidenceLevel: number; // 0-1
  regionSpecificFactors: Record<string, any>;
}

/**
 * Predefined market factors with their respective weights and descriptions
 */
const MARKET_FACTORS: Record<string, Omit<MarketFactor, 'currentTrend' | 'historicalData' | 'forecastData'>> = {
  'interest_rates': {
    name: 'Interest Rates',
    description: 'Current mortgage and lending rates affecting buyer purchasing power',
    impactWeight: 0.8,
    // Higher rates generally decrease property values due to lower purchasing power
  },
  'local_economic_growth': {
    name: 'Local Economic Growth',
    description: 'Economic growth indicators for the specific region including job growth, wage growth, and business expansion',
    impactWeight: 0.75,
    // Strong economic growth generally increases property values
  },
  'property_tax_trends': {
    name: 'Property Tax Trends',
    description: 'Historical and projected changes in property tax rates in the region',
    impactWeight: 0.6,
    // Higher property taxes can negatively impact property values
  },
  'infrastructure_development': {
    name: 'Infrastructure Development',
    description: 'Planned or ongoing infrastructure projects that may affect property values (roads, public transport, utilities)',
    impactWeight: 0.7,
    // Major infrastructure improvements generally increase property values
  },
  'school_district_quality': {
    name: 'School District Quality',
    description: 'Ratings and performance metrics for local school districts',
    impactWeight: 0.65,
    // Better schools generally increase residential property values
  },
  'comparable_sales_trends': {
    name: 'Comparable Sales Trends',
    description: 'Recent sales data for similar properties in the area',
    impactWeight: 0.9,
    // Most direct indicator of market value directions
  },
  'neighborhood_development': {
    name: 'Neighborhood Development',
    description: 'Development plans, zoning changes, and community investment in the area',
    impactWeight: 0.7,
    // Positive development generally increases property values
  },
  'housing_supply': {
    name: 'Housing Supply',
    description: 'Current and projected housing inventory levels relative to demand',
    impactWeight: 0.75,
    // Low supply relative to demand increases values
  },
  'population_growth': {
    name: 'Population Growth',
    description: 'Population growth rates in the region',
    impactWeight: 0.65,
    // Population growth generally increases demand and values
  },
  'employment_trends': {
    name: 'Employment Trends',
    description: 'Employment rates, job creation, and major employer activities in the region',
    impactWeight: 0.7,
    // Strong employment generally increases property values
  },
  'affordability_index': {
    name: 'Affordability Index',
    description: 'Measures how affordable housing is relative to income in the area',
    impactWeight: 0.6,
    // Lower affordability can limit price growth
  },
  'rental_market_strength': {
    name: 'Rental Market Strength',
    description: 'Rental rates, vacancy rates, and rental yield trends',
    impactWeight: 0.65,
    // Strong rental markets generally support property values
  },
  'environmental_factors': {
    name: 'Environmental Factors',
    description: 'Environmental considerations like flood risk, wildfires, or other hazards',
    impactWeight: 0.55,
    // Environmental risks generally decrease property values
  },
  'market_seasonality': {
    name: 'Market Seasonality',
    description: 'Seasonal patterns in the local real estate market',
    impactWeight: 0.3,
    // Lower impact but important for short-term predictions
  }
};

/**
 * Market regions with their specific characteristics
 */
const MARKET_REGIONS: Record<string, {
  name: string;
  description: string;
  dominantFactors: string[];
  economicStrength: number; // 0-1
}> = {
  'pacific_northwest': {
    name: 'Pacific Northwest',
    description: 'Includes Washington, Oregon, and parts of Idaho',
    dominantFactors: ['local_economic_growth', 'environmental_factors', 'population_growth'],
    economicStrength: 0.8
  },
  'southwest': {
    name: 'Southwest',
    description: 'Includes Arizona, New Mexico, Nevada, and parts of California',
    dominantFactors: ['housing_supply', 'population_growth', 'environmental_factors'],
    economicStrength: 0.75
  },
  'midwest': {
    name: 'Midwest',
    description: 'Includes Illinois, Ohio, Michigan, and surrounding states',
    dominantFactors: ['affordability_index', 'employment_trends', 'school_district_quality'],
    economicStrength: 0.65
  },
  'southeast': {
    name: 'Southeast',
    description: 'Includes Florida, Georgia, the Carolinas, and surrounding states',
    dominantFactors: ['population_growth', 'infrastructure_development', 'rental_market_strength'],
    economicStrength: 0.7
  },
  'northeast': {
    name: 'Northeast',
    description: 'Includes New York, Massachusetts, and surrounding states',
    dominantFactors: ['housing_supply', 'property_tax_trends', 'local_economic_growth'],
    economicStrength: 0.75
  }
};

/**
 * Generate current trends for market factors based on zip code
 * In a real system, this would use actual data sources
 */
const generateMarketTrends = (zipCode: string): Record<string, 'rising' | 'falling' | 'stable'> => {
  // This is a simplified simulation - in a real system, this would pull from actual data
  // Get last digit of zip code for deterministic randomness
  const lastDigit = parseInt(zipCode.charAt(zipCode.length - 1));
  
  const trends: Record<string, 'rising' | 'falling' | 'stable'> = {};
  
  // Create deterministic trends based on zip code
  Object.keys(MARKET_FACTORS).forEach((factor, index) => {
    // Cycle through rising/stable/falling based on factor index plus zip last digit
    const trendIndex = (index + lastDigit) % 3;
    trends[factor] = trendIndex === 0 ? 'rising' : trendIndex === 1 ? 'stable' : 'falling';
  });
  
  return trends;
};

/**
 * Determine which market region a zip code belongs to
 * In a real system, this would use actual geographic data
 */
const getMarketRegionForZipCode = (zipCode: string): string => {
  // This is a simplified mapping - in a real system, this would use actual geographic data
  const firstDigit = parseInt(zipCode.charAt(0));
  
  // Simple mapping based on first digit of zip code
  switch (firstDigit) {
    case 0:
    case 1:
      return 'northeast';
    case 2:
    case 3:
      return 'southeast';
    case 4:
    case 5:
    case 6:
      return 'midwest';
    case 7:
    case 8:
      return 'southwest';
    case 9:
    default:
      return 'pacific_northwest';
  }
};

/**
 * Calculate the overall market impact based on all factors
 */
const calculateOverallMarketImpact = (factors: MarketFactor[]): number => {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.impactWeight, 0);
  
  const weightedImpact = factors.reduce((sum, factor) => {
    // Convert trend to numeric impact value
    const trendValue = factor.currentTrend === 'rising' ? 1 : 
                        factor.currentTrend === 'stable' ? 0 : -1;
    
    // Multiply trend value by factor weight and add to sum
    return sum + (trendValue * factor.impactWeight);
  }, 0);
  
  // Normalize to -1 to 1 range
  return weightedImpact / totalWeight;
};

/**
 * Market Factor Service class
 */
export class MarketFactorService {
  /**
   * Get a detailed market factor report for a property
   */
  public getMarketFactorReport(zipCode: string, propertyType: string): MarketFactorReport {
    // Get the market region for this zip code
    const regionKey = getMarketRegionForZipCode(zipCode);
    const region = MARKET_REGIONS[regionKey];
    
    // Get current trends for all market factors based on zip code
    const trends = generateMarketTrends(zipCode);
    
    // Create detailed market factors
    const factors: MarketFactor[] = Object.entries(MARKET_FACTORS).map(([key, baseFactor]) => {
      // Generate simulated historical data
      const historicalData = this.generateHistoricalData(key, trends[key]);
      
      // Generate simulated forecast data
      const forecastData = this.generateForecastData(key, trends[key]);
      
      // Create the complete market factor
      return {
        ...baseFactor,
        currentTrend: trends[key],
        historicalData,
        forecastData,
        // Add property type specific adjustments
        localData: this.getLocalMarketData(zipCode, key, propertyType),
        nationalData: this.getNationalMarketData(key)
      };
    });
    
    // Calculate the overall market impact score
    const overallImpactScore = calculateOverallMarketImpact(factors);
    
    // Determine market outlook based on impact score
    const marketOutlook: 'positive' | 'negative' | 'neutral' = 
      overallImpactScore > 0.2 ? 'positive' :
      overallImpactScore < -0.2 ? 'negative' : 'neutral';
    
    // Return the complete market factor report
    return {
      factors,
      timestamp: new Date(),
      marketOutlook,
      overallImpactScore,
      confidenceLevel: 0.8, // Could be calculated based on data quality in a real system
      regionSpecificFactors: {
        region: region.name,
        description: region.description,
        economicStrength: region.economicStrength,
        dominantFactors: region.dominantFactors.map(f => MARKET_FACTORS[f].name)
      }
    };
  }
  
  /**
   * Get a subset of the most important market factors
   */
  public getTopMarketFactors(zipCode: string, propertyType: string, count: number = 5): MarketFactor[] {
    const report = this.getMarketFactorReport(zipCode, propertyType);
    
    // Sort factors by impact weight and take the top 'count'
    return [...report.factors]
      .sort((a, b) => b.impactWeight - a.impactWeight)
      .slice(0, count);
  }
  
  /**
   * Get market factors formatted for the LLM prompt
   */
  public getMarketFactorsForLLM(zipCode: string, propertyType: string): string[] {
    const topFactors = this.getTopMarketFactors(zipCode, propertyType, 7);
    
    // Format each factor as a string with trend direction
    return topFactors.map(factor => 
      `${factor.name} (${factor.currentTrend.toUpperCase()}): ${factor.description}`
    );
  }
  
  /**
   * Generate simulated historical data for a market factor
   */
  private generateHistoricalData(factorKey: string, currentTrend: 'rising' | 'falling' | 'stable'): { period: string; value: number }[] {
    const result = [];
    const currentYear = new Date().getFullYear();
    
    // Generate 5 years of historical data
    for (let i = 5; i >= 1; i--) {
      // Create a realistic trend based on current direction
      let baseValue = 100;
      
      if (currentTrend === 'rising') {
        // Rising trend with historical values lower than current
        baseValue = baseValue * (0.85 + (i * 0.03));
      } else if (currentTrend === 'falling') {
        // Falling trend with historical values higher than current
        baseValue = baseValue * (1.15 - (i * 0.03));
      } else {
        // Stable trend with minor fluctuations
        baseValue = baseValue * (0.95 + (i * 0.01));
      }
      
      // Add random noise to the trend (±5%)
      const noise = 0.95 + (Math.random() * 0.1);
      
      result.push({
        period: `${currentYear - i}`,
        value: Math.round(baseValue * noise * 100) / 100
      });
    }
    
    return result;
  }
  
  /**
   * Generate simulated forecast data for a market factor
   */
  private generateForecastData(factorKey: string, currentTrend: 'rising' | 'falling' | 'stable'): { period: string; value: number; confidence: number }[] {
    const result = [];
    const currentYear = new Date().getFullYear();
    
    // Generate 3 years of forecast data
    for (let i = 1; i <= 3; i++) {
      // Create a realistic forecast based on current direction
      let baseValue = 100;
      
      if (currentTrend === 'rising') {
        // Rising trend with future values higher than current
        baseValue = baseValue * (1.0 + (i * 0.04));
      } else if (currentTrend === 'falling') {
        // Falling trend with future values lower than current
        baseValue = baseValue * (1.0 - (i * 0.04));
      } else {
        // Stable trend with minor fluctuations
        baseValue = baseValue * (0.98 + (i * 0.02));
      }
      
      // Add random noise to the trend (±3%)
      const noise = 0.97 + (Math.random() * 0.06);
      
      // Confidence decreases the further into the future
      const confidence = Math.round((0.9 - (i * 0.1)) * 100) / 100;
      
      result.push({
        period: `${currentYear + i}`,
        value: Math.round(baseValue * noise * 100) / 100,
        confidence
      });
    }
    
    return result;
  }
  
  /**
   * Get local market data for a specific factor and zip code
   */
  private getLocalMarketData(zipCode: string, factorKey: string, propertyType: string): Record<string, any> {
    // This would pull from actual local data sources in a real system
    // Here we're generating simulated data
    
    switch (factorKey) {
      case 'interest_rates':
        return {
          localLenders: {
            averageRate: 4.5 + (Math.random() * 1),
            lowestRate: 4.2 + (Math.random() * 0.5)
          }
        };
        
      case 'local_economic_growth':
        return {
          jobGrowth: 2.1 + (Math.random() * 1.5),
          newBusinessFormation: 3.2 + (Math.random() * 2),
          medianIncomeGrowth: 1.8 + (Math.random() * 1.2)
        };
        
      case 'school_district_quality':
        return {
          districtName: `${zipCode} Unified School District`,
          rating: Math.floor(3 + (Math.random() * 3)),
          testScores: 75 + (Math.random() * 20)
        };
        
      case 'housing_supply':
        const months = 2 + (Math.random() * 4);
        return {
          inventoryMonths: Math.round(months * 10) / 10,
          newConstructionUnits: Math.floor(50 + (Math.random() * 150)),
          vacancyRate: Math.round((3 + (Math.random() * 5)) * 10) / 10
        };
        
      case 'comparable_sales_trends':
        const basePricePerSqFt = propertyType === 'Residential' ? 
          200 + (Math.random() * 150) : 
          300 + (Math.random() * 200);
        
        return {
          medianSalePrice: Math.floor(300000 + (Math.random() * 200000)),
          averageDaysOnMarket: Math.floor(20 + (Math.random() * 40)),
          pricePerSquareFoot: Math.round(basePricePerSqFt)
        };
        
      default:
        return {
          localImpact: Math.round((Math.random() * 0.6 + 0.2) * 100) / 100
        };
    }
  }
  
  /**
   * Get national market data for a specific factor
   */
  private getNationalMarketData(factorKey: string): Record<string, any> {
    // This would pull from actual national data sources in a real system
    
    switch (factorKey) {
      case 'interest_rates':
        return {
          federalFundsRate: 3.5 + (Math.random() * 0.5),
          thirtyYearFixed: 5.8 + (Math.random() * 0.8),
          fifteenYearFixed: 5.0 + (Math.random() * 0.7)
        };
        
      case 'housing_supply':
        return {
          nationalInventoryMonths: Math.round((3 + (Math.random() * 2)) * 10) / 10,
          housingStartsTrend: (Math.random() > 0.5) ? 'increasing' : 'decreasing',
          completionRatePercentage: 80 + (Math.random() * 15)
        };
        
      case 'population_growth':
        return {
          nationalGrowthRate: Math.round((0.5 + (Math.random() * 0.7)) * 10) / 10,
          domesticMigrationTrends: ['sunbelt', 'mountain west', 'southeast'],
          ageDistributionShift: 'aging'
        };
        
      default:
        return {
          nationalTrend: (Math.random() > 0.3) ? 
            (Math.random() > 0.5 ? 'improving' : 'stable') : 'deteriorating',
          percentChange: Math.round((Math.random() * 5 - 2) * 10) / 10
        };
    }
  }
  
  /**
   * Calculate the adjusted growth rate based on market factors
   */
  public calculateMarketFactorAdjustment(
    zipCode: string, 
    propertyType: string, 
    baseGrowthRate: number
  ): { 
    adjustedRate: number; 
    marketOutlook: 'positive' | 'negative' | 'neutral';
    confidenceLevel: number;
    dominantFactors: string[];
    propertyTypeImpact: number;
    regionalFactors: string[];
  } {
    const report = this.getMarketFactorReport(zipCode, propertyType);
    
    // Normalize the overall impact to a growth rate adjustment
    // Range of -0.02 to +0.02 (±2 percentage points)
    const marketAdjustment = report.overallImpactScore * 0.02;
    
    // Apply property type specific adjustments
    let propertyTypeMultiplier = 1.0;
    
    // Different property types react differently to market conditions
    switch (propertyType) {
      case 'Residential':
        propertyTypeMultiplier = 1.0;
        break;
      case 'Commercial':
        // Commercial properties are more sensitive to economic factors
        propertyTypeMultiplier = 1.2;
        break;
      case 'Industrial':
        // Industrial properties can be more stable
        propertyTypeMultiplier = 0.9;
        break;
      case 'Agricultural':
        // Agricultural properties are less correlated with general market
        propertyTypeMultiplier = 0.7;
        break;
      case 'Vacant':
        // Vacant land can be more volatile
        propertyTypeMultiplier = 1.3;
        break;
      default:
        propertyTypeMultiplier = 1.0;
    }
    
    // Apply the adjustment to the base growth rate
    const adjustment = marketAdjustment * propertyTypeMultiplier;
    
    // Get top market factors
    const topFactors = [...report.factors]
      .sort((a, b) => b.impactWeight - a.impactWeight)
      .slice(0, 3)
      .map(f => f.name);
    
    // Determine market outlook based on overall impact score
    const marketOutlook: 'positive' | 'negative' | 'neutral' = 
      report.overallImpactScore > 0.1 ? 'positive' : 
      report.overallImpactScore < -0.1 ? 'negative' : 'neutral';
    
    return {
      adjustedRate: baseGrowthRate + adjustment,
      marketOutlook,
      confidenceLevel: report.confidenceLevel,
      dominantFactors: topFactors,
      propertyTypeImpact: propertyTypeMultiplier,
      regionalFactors: report.regionSpecificFactors.dominantFactors || []
    };
  }
  
  /**
   * Get a detailed explanation of market factor impacts
   */
  public getMarketFactorExplanation(zipCode: string, propertyType: string): string {
    const report = this.getMarketFactorReport(zipCode, propertyType);
    const region = report.regionSpecificFactors;
    
    // Create an explanation of the market factors
    let explanation = `Market Analysis for ${zipCode} (${region.region}):\n\n`;
    
    // Overall market outlook
    explanation += `Overall Market Outlook: ${report.marketOutlook.toUpperCase()}\n`;
    explanation += `Impact Score: ${Math.round(report.overallImpactScore * 100)}% (${report.overallImpactScore > 0 ? 'positive' : report.overallImpactScore < 0 ? 'negative' : 'neutral'})\n\n`;
    
    // Regional factors
    explanation += `Regional Characteristics:\n`;
    explanation += `- ${region.description}\n`;
    explanation += `- Economic Strength: ${Math.round(region.economicStrength * 100)}%\n`;
    explanation += `- Dominant Factors: ${region.dominantFactors.join(', ')}\n\n`;
    
    // Top impact factors
    explanation += `Key Market Factors:\n`;
    
    const topFactors = [...report.factors]
      .sort((a, b) => b.impactWeight - a.impactWeight)
      .slice(0, 5);
    
    topFactors.forEach(factor => {
      const trendSymbol = factor.currentTrend === 'rising' ? '↑' : 
                           factor.currentTrend === 'falling' ? '↓' : '→';
      
      explanation += `- ${factor.name} ${trendSymbol} (Impact: ${Math.round(factor.impactWeight * 100)}%): ${factor.description}\n`;
      
      // Add local data if available
      if (factor.localData) {
        const localData = Object.entries(factor.localData)
          .map(([key, value]) => {
            if (typeof value === 'object') {
              return `${key}: ${JSON.stringify(value)}`;
            }
            return `${key}: ${value}`;
          })
          .join(', ');
        
        explanation += `  Local Data: ${localData}\n`;
      }
    });
    
    return explanation;
  }
}

// Export a singleton instance
export const marketFactorService = new MarketFactorService();