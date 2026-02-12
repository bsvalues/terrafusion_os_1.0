import { z } from "zod";

export interface PredictiveModelInput {
  zipCode: string;
  timestamp: string;
  features: {
    averageGLA: number;
    medianPrice: number;
    salesVolume: number;
    daysOnMarket: number;
    pricePerSqft: number;
    zoningMix: Record<string, number>;
    neighboringZipTrends: Record<string, number>;
  };
}

export interface PredictionResult {
  zipCode: string;
  predictedPricePerSqft: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  riskScore: number;
  trend: "increasing" | "decreasing" | "stable";
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  timestamp: string;
}

export interface EconomicRiskSignal {
  type: "employment" | "permits" | "inventory" | "financing" | "demographic";
  zipCode: string;
  value: number;
  change: number;
  significance: number;
  source: string;
  timestamp: string;
}

export class PredictiveModelingService {
  private modelCache: Map<string, any> = new Map();
  private signalCache: Map<string, EconomicRiskSignal[]> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize predictive models
   */
  private async initializeModels() {
    console.log("Initializing predictive modeling service...");
    // In production, load trained models from storage
  }

  /**
   * Generate price prediction for ZIP code
   */
  async predictZipPrice(input: PredictiveModelInput): Promise<PredictionResult> {
    try {
      // Fetch historical comps for the ZIP code
      const historicalData = await this.fetchHistoricalData(input.zipCode);

      // Extract features
      const features = await this.extractFeatures(input, historicalData);

      // Run prediction model
      const prediction = await this.runPredictionModel(features);

      // Calculate risk score
      const riskScore = await this.calculateRiskScore(input.zipCode);

      // Determine trend
      const trend = this.analyzeTrend(historicalData, prediction.predictedPrice);

      return {
        zipCode: input.zipCode,
        predictedPricePerSqft: prediction.predictedPrice,
        confidenceInterval: prediction.confidence,
        riskScore,
        trend,
        factors: prediction.factors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Prediction failed:", error);
      throw new Error("Failed to generate price prediction");
    }
  }

  /**
   * Fetch historical market data
   */
  private async fetchHistoricalData(zipCode: string): Promise<any[]> {
    try {
      // In production, fetch from authenticated MLS APIs
      const response = await fetch(`/api/market-data/${zipCode}?months=12`);

      if (!response.ok) {
        // Return mock historical data structure for demo
        return this.generateMockHistoricalData(zipCode);
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch historical data, using fallback");
      return this.generateMockHistoricalData(zipCode);
    }
  }

  /**
   * Generate mock historical data for demonstration
   */
  private generateMockHistoricalData(zipCode: string): any[] {
    const basePrice = 200 + (parseInt(zipCode) % 500);
    const data = [];

    for (let i = 12; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      data.push({
        month: date.toISOString().slice(0, 7),
        averagePrice: basePrice + (Math.random() * 50 - 25),
        salesVolume: Math.floor(50 + Math.random() * 100),
        medianGLA: 1800 + Math.floor(Math.random() * 600),
        daysOnMarket: 20 + Math.floor(Math.random() * 40),
      });
    }

    return data;
  }

  /**
   * Extract features for model input
   */
  private async extractFeatures(
    input: PredictiveModelInput,
    historicalData: any[]
  ): Promise<number[]> {
    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];

    return [
      input.features.averageGLA / 1000, // Normalized GLA
      input.features.medianPrice / 100000, // Normalized price
      input.features.salesVolume / 100, // Normalized volume
      input.features.daysOnMarket / 30, // Normalized DOM
      latest?.averagePrice / previous?.averagePrice || 1, // Price momentum
      input.features.neighboringZipTrends[input.zipCode] || 0, // Local trend
      this.getSeasonalFactor(new Date(input.timestamp)), // Seasonal adjustment
    ];
  }

  /**
   * Run prediction model
   */
  private async runPredictionModel(features: number[]): Promise<{
    predictedPrice: number;
    confidence: { lower: number; upper: number };
    factors: Array<{ name: string; impact: number; description: string }>;
  }> {
    // Simplified linear model for demo (in production, use trained ML model)
    const weights = [0.3, 0.4, 0.1, -0.2, 0.5, 0.3, 0.1];

    let prediction = 0;
    for (let i = 0; i < features.length && i < weights.length; i++) {
      prediction += features[i] * weights[i];
    }

    const basePrediction = Math.max(100, prediction * 250 + 200);
    const confidenceRange = basePrediction * 0.15;

    return {
      predictedPrice: Math.round(basePrediction),
      confidence: {
        lower: Math.round(basePrediction - confidenceRange),
        upper: Math.round(basePrediction + confidenceRange),
      },
      factors: [
        {
          name: "Market Volume",
          impact: weights[2] * features[2],
          description: "Sales activity impact",
        },
        {
          name: "Price Momentum",
          impact: weights[4] * features[4],
          description: "Recent price trend",
        },
        {
          name: "Inventory Levels",
          impact: weights[3] * features[3],
          description: "Days on market effect",
        },
        {
          name: "Seasonal Factors",
          impact: weights[6] * features[6],
          description: "Time of year adjustment",
        },
      ],
    };
  }

  /**
   * Calculate economic risk score
   */
  private async calculateRiskScore(zipCode: string): Promise<number> {
    try {
      const signals = await this.gatherEconomicSignals(zipCode);

      let riskScore = 0;
      signals.forEach((signal) => {
        riskScore += signal.significance * Math.abs(signal.change);
      });

      return Math.min(100, Math.max(0, riskScore));
    } catch (error) {
      // Return moderate risk score for demo
      return 45;
    }
  }

  /**
   * Gather economic risk signals
   */
  private async gatherEconomicSignals(zipCode: string): Promise<EconomicRiskSignal[]> {
    const signals: EconomicRiskSignal[] = [];

    try {
      // Employment data
      const employmentData = await this.fetchEmploymentData(zipCode);
      if (employmentData) {
        signals.push({
          type: "employment",
          zipCode,
          value: employmentData.rate,
          change: employmentData.change,
          significance: 0.3,
          source: "BLS",
          timestamp: new Date().toISOString(),
        });
      }

      // Building permits
      const permitData = await this.fetchPermitData(zipCode);
      if (permitData) {
        signals.push({
          type: "permits",
          zipCode,
          value: permitData.count,
          change: permitData.change,
          significance: 0.2,
          source: "Local Building Dept",
          timestamp: new Date().toISOString(),
        });
      }

      // Housing inventory
      signals.push({
        type: "inventory",
        zipCode,
        value: Math.random() * 100,
        change: (Math.random() - 0.5) * 20,
        significance: 0.25,
        source: "MLS",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Failed to gather some economic signals:", error);
    }

    return signals;
  }

  /**
   * Fetch employment data
   */
  private async fetchEmploymentData(
    zipCode: string
  ): Promise<{ rate: number; change: number } | null> {
    try {
      // In production, use BLS API with proper authentication
      const apiKey = process.env.BLS_API_KEY;
      if (!apiKey) {
        return { rate: 3.5 + Math.random() * 2, change: (Math.random() - 0.5) * 1 };
      }

      // Implement actual BLS API call
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch building permit data
   */
  private async fetchPermitData(
    zipCode: string
  ): Promise<{ count: number; change: number } | null> {
    try {
      // In production, integrate with local building department APIs
      return { count: Math.floor(Math.random() * 50), change: (Math.random() - 0.5) * 20 };
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze price trend
   */
  private analyzeTrend(
    historicalData: any[],
    predictedPrice: number
  ): "increasing" | "decreasing" | "stable" {
    if (historicalData.length < 2) return "stable";

    const recent = historicalData.slice(-3);
    const average = recent.reduce((sum, d) => sum + d.averagePrice, 0) / recent.length;

    const threshold = average * 0.05; // 5% threshold

    if (predictedPrice > average + threshold) return "increasing";
    if (predictedPrice < average - threshold) return "decreasing";
    return "stable";
  }

  /**
   * Get seasonal adjustment factor
   */
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Spring/summer months typically see higher activity
    const seasonalFactors = [0.8, 0.9, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8];
    return seasonalFactors[month] || 1.0;
  }

  /**
   * Generate economic risk assessment
   */
  async generateRiskAssessment(zipCode: string): Promise<{
    overallScore: number;
    signals: EconomicRiskSignal[];
    narrative: string;
    recommendations: string[];
  }> {
    const signals = await this.gatherEconomicSignals(zipCode);
    const overallScore = await this.calculateRiskScore(zipCode);

    const narrative = this.generateRiskNarrative(signals, overallScore);
    const recommendations = this.generateRecommendations(signals, overallScore);

    return {
      overallScore,
      signals,
      narrative,
      recommendations,
    };
  }

  /**
   * Generate risk narrative using AI insights
   */
  private generateRiskNarrative(signals: EconomicRiskSignal[], riskScore: number): string {
    const riskLevel = riskScore > 70 ? "high" : riskScore > 40 ? "moderate" : "low";

    const keySignals = signals
      .filter((s) => s.significance > 0.2)
      .map((s) => `${s.type} trends`)
      .join(", ");

    return (
      `Market analysis indicates ${riskLevel} risk based on ${keySignals}. ` +
      `Current risk score of ${riskScore} reflects market volatility and economic indicators.`
    );
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(signals: EconomicRiskSignal[], riskScore: number): string[] {
    const recommendations = [];

    if (riskScore > 60) {
      recommendations.push("Consider increased due diligence on new investments");
      recommendations.push("Monitor market closely for signs of correction");
    }

    const employmentSignal = signals.find((s) => s.type === "employment");
    if (employmentSignal && employmentSignal.change < -0.5) {
      recommendations.push("Employment decline may impact local housing demand");
    }

    const permitSignal = signals.find((s) => s.type === "permits");
    if (permitSignal && permitSignal.change > 20) {
      recommendations.push("Increased construction activity may affect supply balance");
    }

    if (recommendations.length === 0) {
      recommendations.push("Market conditions appear stable for investment");
    }

    return recommendations;
  }
}
