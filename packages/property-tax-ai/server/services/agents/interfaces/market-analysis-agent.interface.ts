/**
 * Market Analysis Agent Interface
 * 
 * This interface defines the methods that should be implemented by
 * any MarketAnalysisAgent to ensure consistent functionality across
 * different implementations.
 */

/**
 * Interface for MarketAnalysisAgent
 */
export interface MarketAnalysisAgent {
  /**
   * Analyze a property's market conditions and value
   * 
   * @param propertyId The ID of the property to analyze
   * @returns Analysis results including estimated market value and trends
   */
  analyzeProperty(propertyId: string): Promise<{
    estimatedMarketValue?: number;
    analysis: string;
    trends: {
      salesTrend: string;
      valuationTrend: string;
    };
    confidence?: number;
  }>;
  
  /**
   * Analyze market trends for a property or area
   * 
   * @param params Parameters including propertyId or area and options
   * @returns Market trends analysis
   */
  analyzeMarketTrends(params: any): Promise<any>;
  
  /**
   * Generate detailed comparable property analysis
   * 
   * @param params Parameters including propertyId and options
   * @returns Comparable property analysis
   */
  generateComparableAnalysis(params: any): Promise<any>;
  
  /**
   * Forecast future property value based on market trends
   * 
   * @param params Parameters including propertyId, timeframe, and scenarios
   * @returns Future value forecast
   */
  forecastPropertyValue(params: any): Promise<any>;
  
  /**
   * Assess investment potential of a property
   * 
   * @param params Parameters including propertyId and investment criteria
   * @returns Investment potential assessment
   */
  assessInvestmentPotential(params: any): Promise<any>;
}