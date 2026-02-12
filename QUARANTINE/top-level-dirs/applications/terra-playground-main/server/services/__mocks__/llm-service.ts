/**
 * Mock LLM Service for testing
 *
 * This mock service simulates responses from the LLM service without making actual API calls.
 */

export class LLMService {
  private isConfigured = true;

  constructor(config: any) {
    // Mock constructor
  }

  public async prompt(prompt: string, options?: any): Promise<any> {
    // Return a simple mock response
    return {
      text: 'Mock LLM response for: ' + prompt.substring(0, 50) + '...',
      model: 'mock-model',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }

  public async analyzePropertyTrends(request: any): Promise<any> {
    // Mock property trend analysis
    return {
      text: `The property shows a steady growth pattern over the specified timeframe. 
      Market indicators suggest continued appreciation in the ${request.timeframe} timeframe.`,
      model: 'mock-model',
      analysis: {
        trend: 'positive',
        confidence: 0.85,
        factors: ['location', 'market demand', 'inventory levels'],
      },
    };
  }

  public async generatePropertyValuation(request: any): Promise<any> {
    // Mock property valuation
    return {
      text: `Based on the property characteristics and recent comparable sales, 
      the estimated market value is within an acceptable range.`,
      model: 'mock-model',
      valuation: {
        estimatedValue: request.propertyData.value * 1.05,
        confidenceScore: 0.82,
        comparableCount: 5,
      },
    };
  }

  public async analyzeNeighborhood(request: any): Promise<any> {
    // Mock neighborhood analysis
    return {
      text: `The neighborhood shows positive economic indicators with 
      strong property value stability.`,
      model: 'mock-model',
      neighborhoodScore: 85,
    };
  }

  public async predictFutureValue(request: any): Promise<any> {
    // Mock future value prediction with more detailed response
    const currentYear = new Date().getFullYear();
    const currentValue = request.property.value || 375000;
    const yearsAhead = request.yearsAhead || 3;

    // Mock growth rates for different years
    const yearlyGrowthRates = [2.8, 3.1, 3.4, 3.2, 3.5];

    // Generate predicted values for each year
    const predictedValues = [];
    let cumulativeGrowth = 0;
    let lastValue = currentValue;

    for (let i = 0; i < yearsAhead; i++) {
      const yearGrowth = yearlyGrowthRates[i] || 3.0;
      cumulativeGrowth += yearGrowth;
      lastValue = lastValue * (1 + yearGrowth / 100);

      predictedValues.push({
        year: currentYear + i + 1,
        predictedValue: Math.round(lastValue),
        growthRate: yearGrowth,
        growthFromPresent: Math.round(cumulativeGrowth * 10) / 10,
      });
    }

    // Generate confidence intervals
    const confidenceIntervals = predictedValues.map(pv => {
      const marginOfError = 5 + (pv.year - currentYear); // Increasing uncertainty with time
      return {
        year: pv.year,
        low: Math.round(pv.predictedValue * (1 - marginOfError / 100)),
        high: Math.round(pv.predictedValue * (1 + marginOfError / 100)),
        marginOfError,
      };
    });

    return {
      text: `Based on current market conditions and property characteristics, 
      the estimated future value in ${yearsAhead} years is ${predictedValues[predictedValues.length - 1].predictedValue}.
      This represents a ${cumulativeGrowth}% increase from the present value.
      Market factors indicate a positive outlook with moderate growth potential.`,
      model: 'mock-model',
      prediction: {
        currentValue,
        predictedValues,
        confidenceIntervals,
        marketFactors: [
          { name: 'Interest Rates', impact: 'moderate', trend: 'stable' },
          { name: 'Regional Development', impact: 'positive', trend: 'improving' },
          { name: 'Employment Growth', impact: 'positive', trend: 'steady' },
        ],
        overallConfidence: 0.75,
        marketOutlook: 'positive',
      },
    };
  }

  public async detectValuationAnomalies(request: any): Promise<any> {
    // Mock anomaly detection
    return {
      text: `Analysis completed with no significant anomalies detected.`,
      model: 'mock-model',
      anomalies: [],
    };
  }
}

export default LLMService;
