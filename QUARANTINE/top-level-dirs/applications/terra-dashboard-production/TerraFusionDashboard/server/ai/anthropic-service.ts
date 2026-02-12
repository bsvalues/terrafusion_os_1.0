import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PropertyAnalysisInput {
  parcelId: string;
  address: string;
  propertyType: string;
  squareFootage?: number;
  yearBuilt?: number;
  assessedValue?: number;
  marketValue?: number;
  coordinates?: { lat: number; lng: number };
}

export interface CostAnalysisResult {
  rcnValue: number;
  depreciation: number;
  finalCost: number;
  confidence: number;
  methodology: string;
  factors: string[];
}

export interface ExemptionAnalysisResult {
  eligibleExemptions: string[];
  taxSavings: number;
  qualificationScore: number;
  requirements: string[];
  recommendations: string[];
}

export interface ComplianceResult {
  isCompliant: boolean;
  iaaoStandards: boolean;
  variance: number;
  issues: string[];
  recommendations: string[];
}

export class AnthropicService {
  async analyzeCost(property: PropertyAnalysisInput): Promise<CostAnalysisResult> {
    const prompt = `You are a professional property assessor specializing in cost analysis. Analyze this property for replacement cost new (RCN) calculation.

Property Details:
- Parcel ID: ${property.parcelId}
- Address: ${property.address}
- Type: ${property.propertyType}
- Square Footage: ${property.squareFootage || 'Not provided'}
- Year Built: ${property.yearBuilt || 'Not provided'}
- Current Assessed Value: $${property.assessedValue?.toLocaleString() || 'Not provided'}

Using current construction costs and depreciation schedules, provide a detailed cost analysis. Consider:
1. Current construction costs per square foot for ${property.propertyType} properties
2. Age-related depreciation (built in ${property.yearBuilt})
3. Physical depreciation factors
4. Functional obsolescence
5. External obsolescence

Respond with JSON in this exact format:
{
  "rcnValue": <replacement_cost_new_in_dollars>,
  "depreciation": <depreciation_percentage>,
  "finalCost": <final_cost_after_depreciation>,
  "confidence": <confidence_score_0_to_1>,
  "methodology": "<brief_description_of_method>",
  "factors": ["<factor1>", "<factor2>", "<factor3>"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const content = response.content[0];
      if ('text' in content) {
        const result = JSON.parse(content.text);
        return result as CostAnalysisResult;
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      throw new Error('Failed to parse cost analysis response');
    }
  }

  async analyzeExemptions(property: PropertyAnalysisInput): Promise<ExemptionAnalysisResult> {
    const prompt = `You are a tax exemption specialist. Analyze this property for potential tax exemptions and qualifications.

Property Details:
- Parcel ID: ${property.parcelId}
- Address: ${property.address}
- Type: ${property.propertyType}
- Square Footage: ${property.squareFootage || 'Not provided'}
- Assessed Value: $${property.assessedValue?.toLocaleString() || 'Not provided'}

Consider these exemption categories:
1. Agricultural exemptions (if applicable)
2. Senior citizen exemptions
3. Veteran exemptions
4. Nonprofit/religious exemptions
5. Historic property exemptions
6. Open space exemptions
7. Solar/renewable energy exemptions

Respond with JSON in this exact format:
{
  "eligibleExemptions": ["<exemption1>", "<exemption2>"],
  "taxSavings": <estimated_annual_tax_savings>,
  "qualificationScore": <score_0_to_1>,
  "requirements": ["<requirement1>", "<requirement2>"],
  "recommendations": ["<recommendation1>", "<recommendation2>"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const result = JSON.parse(response.content[0].text);
      return result as ExemptionAnalysisResult;
    } catch (error) {
      throw new Error('Failed to parse exemption analysis response');
    }
  }

  async validateCompliance(property: PropertyAnalysisInput): Promise<ComplianceResult> {
    const assessedValue = property.assessedValue || 0;
    const marketValue = property.marketValue || 0;
    const variance = marketValue > 0 ? Math.abs((assessedValue - marketValue) / marketValue) * 100 : 0;

    const prompt = `You are a compliance officer specializing in IAAO (International Association of Assessing Officers) standards. Validate this property assessment for compliance.

Property Assessment:
- Parcel ID: ${property.parcelId}
- Address: ${property.address}
- Type: ${property.propertyType}
- Assessed Value: $${assessedValue.toLocaleString()}
- Market Value: $${marketValue.toLocaleString()}
- Variance: ${variance.toFixed(2)}%

IAAO Standards Check:
1. Assessment ratio should be within acceptable range (typically 90-110% of market value)
2. Coefficient of dispersion should be under 15% for residential, 20% for commercial
3. Assessment methodology must be consistently applied
4. Documentation must be complete and defensible

Respond with JSON in this exact format:
{
  "isCompliant": <true_or_false>,
  "iaaoStandards": <true_or_false>,
  "variance": <variance_percentage>,
  "issues": ["<issue1>", "<issue2>"],
  "recommendations": ["<recommendation1>", "<recommendation2>"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const result = JSON.parse(response.content[0].text);
      return result as ComplianceResult;
    } catch (error) {
      throw new Error('Failed to parse compliance validation response');
    }
  }

  async generateExplanation(property: PropertyAnalysisInput, analysisResults: any): Promise<string> {
    const prompt = `You are NarratorAI, specializing in creating clear, professional explanations of property assessments for taxpayers and stakeholders.

Property: ${property.address} (Parcel: ${property.parcelId})
Assessment Results: ${JSON.stringify(analysisResults, null, 2)}

Generate a comprehensive but readable explanation that covers:
1. How the property was valued
2. Key factors that influenced the assessment
3. Comparison to market value
4. Any exemptions or special considerations
5. Appeal rights and process (if applicable)

Write in professional but accessible language that a property owner would understand. Keep it factual and objective.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text;
  }
}

export const anthropicService = new AnthropicService();