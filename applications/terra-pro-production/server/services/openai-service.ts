import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Market Analysis Types
export interface MarketAnalysisRequest {
  location: string;
  propertyType: string;
  timeframe: string;
  additionalContext?: string;
}

export interface MarketTrendPoint {
  date: string;
  value: number;
}

export interface MarketAnalysisResult {
  summary: string;
  keyInsights: string[];
  priceTrends: MarketTrendPoint[];
  inventoryTrends: MarketTrendPoint[];
  riskAssessment: {
    level: "low" | "moderate" | "high";
    factors: string[];
  };
  recommendations: string[];
}

/**
 * Generate a market analysis using OpenAI
 *
 * @param params Analysis parameters
 * @returns Structured market analysis data
 */
export async function generateMarketAnalysis(
  params: MarketAnalysisRequest
): Promise<MarketAnalysisResult> {
  try {
    const { location, propertyType, timeframe, additionalContext } = params;

    const systemPrompt = `You are an expert real estate market analyst with deep knowledge of property markets across the United States. 
    Provide a detailed market analysis for ${propertyType} properties in ${location} over the ${timeframe} timeframe.
    ${additionalContext ? `Additional context to consider: ${additionalContext}` : ""}
    
    Format your response as a JSON object with the following structure:
    {
      "summary": "A concise summary of the overall market conditions",
      "keyInsights": ["Array of 3-5 key insights about this market"],
      "priceTrends": [{"date": "YYYY-MM", "value": numericValue}, ...],
      "inventoryTrends": [{"date": "YYYY-MM", "value": numericValue}, ...],
      "riskAssessment": {
        "level": "low"|"moderate"|"high",
        "factors": ["Array of factors contributing to the risk assessment"]
      },
      "recommendations": ["Array of 2-4 actionable recommendations for investors or appraisers"]
    }
    
    Generate realistic but simulated market data for the charts based on your market knowledge.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze the ${propertyType} market in ${location} over the ${timeframe} timeframe.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const contentText = response.choices[0].message.content;
    if (!contentText) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(contentText) as MarketAnalysisResult;
  } catch (error) {
    console.error("Error generating market analysis with OpenAI:", error);
    throw new Error(
      `Failed to generate market analysis: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate property valuation insights using OpenAI
 *
 * @param propertyData Property details
 * @param comps Comparable properties
 * @returns Valuation insights and recommendations
 */
export async function generatePropertyValuationInsights(
  propertyData: any,
  comps: any[]
): Promise<any> {
  try {
    const systemPrompt = `You are an expert real estate appraiser with deep knowledge of property valuation methodologies. 
    Analyze the subject property data and comparable properties to provide insights on valuation.
    
    Format your response as a JSON object with the following structure:
    {
      "estimatedValue": numericValue,
      "confidenceLevel": "high"|"medium"|"low",
      "valueRange": {"min": numericValue, "max": numericValue},
      "adjustments": [
        {
          "factor": "Name of adjustment factor",
          "amount": numericValue,
          "reasoning": "Explanation of this adjustment"
        }
      ],
      "insights": ["Array of 3-5 key insights about this valuation"]
    }`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify({ subject: propertyData, comparables: comps }) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const contentText = response.choices[0].message.content;
    if (!contentText) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(contentText);
  } catch (error) {
    console.error("Error generating property valuation insights with OpenAI:", error);
    throw new Error(
      `Failed to generate property valuation insights: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
