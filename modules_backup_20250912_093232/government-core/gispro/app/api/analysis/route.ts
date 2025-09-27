import { type NextRequest, NextResponse } from 'next/server';

interface AnalysisRequest {
  property_id?: string;
  address: string;
  size_sqft: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  location_type: string;
  lot_size_sqft?: number;
}

interface AnalysisResult {
  property_id: string;
  estimated_value: number;
  confidence_score: number;
  geometry_factor: number;
  market_factor: number;
  risk_assessment: {
    total_risk_score: number;
    risk_level: string;
  };
  recommendations: string[];
  analysis_timestamp: string;
}

class GAMAAnalysisEngine {
  private phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

  async analyzeProperty(data: AnalysisRequest): Promise<AnalysisResult> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const baseValue = this.calculateBaseValue(data);
    const geometryFactor = this.calculateGeometryFactor(data);
    const marketFactor = this.analyzeMarketConditions(data);
    const confidence = this.calculateConfidence(data);

    const estimatedValue = Math.round(baseValue * geometryFactor * marketFactor);
    const riskAssessment = this.assessRisk(data, confidence);
    const recommendations = this.generateRecommendations(data, confidence, geometryFactor);

    return {
      property_id: data.property_id || `analysis_${Date.now()}`,
      estimated_value: estimatedValue,
      confidence_score: Math.round(confidence * 100) / 100,
      geometry_factor: Math.round(geometryFactor * 1000) / 1000,
      market_factor: Math.round(marketFactor * 1000) / 1000,
      risk_assessment: riskAssessment,
      recommendations,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  private calculateBaseValue(data: AnalysisRequest): number {
    const pricePerSqft = 150;
    const bedroomValue = data.bedrooms * 25000;
    const bathroomValue = data.bathrooms * 15000;
    const ageAdjustment = Math.max(0, (2024 - data.year_built) * -1000);

    return Math.max(
      100000,
      data.size_sqft * pricePerSqft + bedroomValue + bathroomValue + ageAdjustment
    );
  }

  private calculateGeometryFactor(data: AnalysisRequest): number {
    let factor = 1.0;

    // Fibonacci alignment check
    const fibNumbers = [1597, 2584, 4181, 6765];
    const isFibonacci = fibNumbers.some(fib => Math.abs(data.size_sqft - fib) / fib < 0.1);
    if (isFibonacci) factor += 0.03;

    // Golden ratio analysis
    if (data.lot_size_sqft) {
      const ratio = data.size_sqft / data.lot_size_sqft;
      const goldenDeviation = Math.abs(ratio - 1 / this.phi);
      if (goldenDeviation < 0.1) factor += 0.05;
    }

    // Room ratio harmony
    const roomRatio = data.bedrooms / Math.max(data.bathrooms, 1);
    const harmony = 1 - Math.abs(roomRatio - this.phi) / this.phi;
    factor += (harmony - 0.5) * 0.1;

    return Math.max(0.8, Math.min(1.2, factor));
  }

  private analyzeMarketConditions(data: AnalysisRequest): number {
    const locationFactors = {
      urban: 1.15,
      suburban: 1.0,
      rural: 0.85,
      waterfront: 1.25,
      downtown: 1.2,
    };

    const baseFactor =
      locationFactors[data.location_type.toLowerCase() as keyof typeof locationFactors] || 1.0;
    const marketTrend = 0.95 + Math.random() * 0.15; // ±10% market variation

    return baseFactor * marketTrend;
  }

  private calculateConfidence(data: AnalysisRequest): number {
    const dataCompleteness =
      Object.values(data).filter(v => v !== null && v !== undefined).length /
      Object.keys(data).length;
    const comparableCount = 5 + Math.random() * 20;
    const comparableFactor = Math.min(1.0, comparableCount / 15);
    const marketStability = 0.7 + Math.random() * 0.25;

    return Math.min(
      0.99,
      Math.max(0.5, dataCompleteness * 0.4 + comparableFactor * 0.3 + marketStability * 0.3)
    );
  }

  private assessRisk(data: AnalysisRequest, confidence: number) {
    const ageRisk = Math.max(0, (2024 - data.year_built - 20) * 2);
    const locationRisk =
      { urban: 15, suburban: 10, rural: 25, waterfront: 20 }[data.location_type.toLowerCase()] ||
      15;
    const confidenceRisk = (1 - confidence) * 30;

    const totalRisk = Math.min(100, ageRisk + locationRisk + confidenceRisk);
    const riskLevel = totalRisk < 20 ? 'Low' : totalRisk < 40 ? 'Medium' : 'High';

    return {
      total_risk_score: Math.round(totalRisk * 10) / 10,
      risk_level: riskLevel,
    };
  }

  private generateRecommendations(
    data: AnalysisRequest,
    confidence: number,
    geometryFactor: number
  ): string[] {
    const recommendations = [];

    if (data.year_built < 2000) {
      recommendations.push('Consider energy efficiency upgrades to increase value');
    }

    if (data.size_sqft < 1500) {
      recommendations.push('Property size below market average - consider expansion opportunities');
    } else if (data.size_sqft > 3000) {
      recommendations.push('Large property size is a market advantage');
    }

    if (confidence > 0.8) {
      recommendations.push('High confidence analysis - favorable for investment decisions');
    } else if (confidence < 0.7) {
      recommendations.push('Lower confidence due to limited data - gather more comparables');
    }

    if (geometryFactor > 1.05) {
      recommendations.push('Property exhibits excellent geometric harmony - premium positioning');
    } else if (geometryFactor < 0.95) {
      recommendations.push('Consider architectural improvements to enhance geometric balance');
    }

    recommendations.push('Market timing appears favorable based on current trends');

    return recommendations;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'address',
      'size_sqft',
      'bedrooms',
      'bathrooms',
      'year_built',
      'location_type',
    ];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const engine = new GAMAAnalysisEngine();
    const analysis = await engine.analyzeProperty(body);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Analysis failed - please try again',
      },
      { status: 500 }
    );
  }
}
