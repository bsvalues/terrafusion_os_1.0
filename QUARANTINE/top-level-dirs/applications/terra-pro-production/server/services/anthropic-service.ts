import Anthropic from "@anthropic-ai/sdk";
import { MarketAnalysisRequest, MarketAnalysisResult } from "./openai-service";

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = "claude-3-7-sonnet-20250219";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a market analysis using Anthropic Claude
 *
 * @param params Analysis parameters
 * @returns Structured market analysis data
 */
export async function generateMarketAnalysisWithClaude(
  params: MarketAnalysisRequest
): Promise<MarketAnalysisResult> {
  try {
    const { location, propertyType, timeframe, additionalContext } = params;

    const systemPrompt = `You are an expert real estate market analyst with deep knowledge of property markets across the United States. 
    Your task is to provide a structured market analysis.
    
    Analyze ${propertyType} properties in ${location} over the ${timeframe} timeframe.
    ${additionalContext ? `Additional context to consider: ${additionalContext}` : ""}`;

    const userPrompt = `Please provide a detailed market analysis for ${propertyType} properties in ${location} over the ${timeframe} timeframe.
    
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

    const response = await anthropic.messages.create({
      model: MODEL,
      system: systemPrompt,
      max_tokens: 4000,
      temperature: 0.5,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract the content from the response
    const content = response.content[0];

    if (!content || content.type !== "text") {
      throw new Error("Invalid response format from Anthropic");
    }

    // Extract the JSON from the response
    const textContent = content.text.trim();
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Anthropic response");
    }

    const jsonString = jsonMatch[0];
    return JSON.parse(jsonString) as MarketAnalysisResult;
  } catch (error) {
    console.error("Error generating market analysis with Anthropic Claude:", error);
    throw new Error(
      `Failed to generate market analysis with Claude: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate compliance assessment report using Anthropic Claude
 *
 * @param reportData Report to evaluate
 * @param complianceStandards Standards to check against
 * @returns Compliance assessment
 */
export async function generateComplianceAssessment(
  reportData: any,
  complianceStandards: string[]
): Promise<any> {
  try {
    const systemPrompt = `You are an expert in real estate appraisal compliance with deep knowledge of industry standards and regulations.
    Your task is to evaluate if an appraisal report meets compliance standards.`;

    const userPrompt = `Please evaluate the following appraisal report against these compliance standards:
    ${complianceStandards.join("\n")}
    
    Here is the appraisal report data:
    ${JSON.stringify(reportData, null, 2)}
    
    Format your response as a JSON object with the following structure:
    {
      "overallCompliance": "compliant"|"non-compliant"|"partially-compliant",
      "score": numbericValueFrom0To100,
      "findings": [
        {
          "standard": "Name of standard",
          "status": "met"|"not-met"|"partially-met",
          "issue": "Description of compliance issue if any",
          "recommendation": "How to address the issue"
        }
      ],
      "summary": "Overall assessment summary"
    }`;

    const response = await anthropic.messages.create({
      model: MODEL,
      system: systemPrompt,
      max_tokens: 4000,
      temperature: 0.2,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract the content from the response
    const content = response.content[0];

    if (!content || content.type !== "text") {
      throw new Error("Invalid response format from Anthropic");
    }

    // Extract the JSON from the response
    const textContent = content.text.trim();
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Anthropic response");
    }

    const jsonString = jsonMatch[0];
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating compliance assessment with Claude:", error);
    throw new Error(
      `Failed to generate compliance assessment: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
