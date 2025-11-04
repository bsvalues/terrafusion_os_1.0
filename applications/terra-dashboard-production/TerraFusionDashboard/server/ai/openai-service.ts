import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MarketAnalysisInput {
  property: any;
  comparableProperties?: any[];
  marketTrends?: any;
}

export interface MarketAnalysisResult {
  rating: number;
  confidence: number;
  marketTrends: string[];
  comparableSales: any[];
  recommendedValue: number;
  marketPosition: string;
}

export class OpenAIService {
  async analyzeMarket(input: MarketAnalysisInput): Promise<MarketAnalysisResult> {
    const prompt = `You are a real estate market analyst. Analyze this property's market position and provide valuation recommendations.

Property Details:
${JSON.stringify(input.property, null, 2)}

Comparable Properties:
${JSON.stringify(input.comparableProperties || [], null, 2)}

Analyze market conditions, comparable sales, and provide a market rating from 1-5 stars with confidence score. Consider:
1. Current market trends in the area
2. Property's competitive position
3. Recent comparable sales
4. Market demand indicators
5. Economic factors affecting value

Respond with JSON in this format:
{
  "rating": <1-5_star_rating>,
  "confidence": <0-1_confidence_score>,
  "marketTrends": ["<trend1>", "<trend2>"],
  "comparableSales": [<comparable_data>],
  "recommendedValue": <recommended_market_value>,
  "marketPosition": "<strong/average/weak>"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a real estate market analysis expert. Analyze market data and provide accurate valuations with confidence scores."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return {
        rating: Math.max(1, Math.min(5, Math.round(result.rating))),
        confidence: Math.max(0, Math.min(1, result.confidence)),
        marketTrends: result.marketTrends || [],
        comparableSales: result.comparableSales || [],
        recommendedValue: result.recommendedValue || 0,
        marketPosition: result.marketPosition || "average"
      };
    } catch (error) {
      throw new Error("Failed to analyze market data: " + error.message);
    }
  }

  async generateNarrative(property: any, analysisResults: any): Promise<string> {
    const prompt = `Create a comprehensive, professional property assessment narrative for this property. Make it clear and understandable for property owners while maintaining professional standards.

Property: ${property.address}
Parcel: ${property.parcelId}

Analysis Results:
${JSON.stringify(analysisResults, null, 2)}

Generate a narrative that explains:
1. Assessment methodology used
2. Key value drivers and factors
3. Market context and comparable properties
4. Any special considerations or exemptions
5. Quality assurance and compliance verification

Write in professional but accessible language.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are NarratorAI, specializing in creating clear property assessment explanations for taxpayers."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
    });

    return response.choices[0].message.content;
  }

  async coordinateAgents(property: any, agentResults: any[]): Promise<any> {
    const prompt = `You are the Property Assessment Coordinator AI. Review and synthesize results from multiple specialized agents to create a final comprehensive assessment.

Property: ${property.address} (${property.parcelId})

Agent Results:
${JSON.stringify(agentResults, null, 2)}

Coordinate the results from:
- Cost Analysis Agent
- Market Analysis Agent  
- Exemption Seer
- Compliance Validator
- Geospatial Analyzer

Provide a final coordinated assessment with quality control checks. Respond with JSON:
{
  "finalAssessedValue": <recommended_value>,
  "confidence": <overall_confidence_0_to_1>,
  "methodology": "<primary_method_used>",
  "qualityChecks": ["<check1>", "<check2>"],
  "recommendations": ["<rec1>", "<rec2>"],
  "agentConsensus": <percentage_agreement>,
  "flaggedIssues": ["<issue1>", "<issue2>"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI coordinator that synthesizes multiple agent analyses into final property assessments."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      throw new Error("Failed to coordinate agent results: " + error.message);
    }
  }
}

export const openaiService = new OpenAIService();