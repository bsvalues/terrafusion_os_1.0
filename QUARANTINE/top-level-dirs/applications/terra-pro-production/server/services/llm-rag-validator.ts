import { TerraFusionComp } from "./rust-importer-bridge";

export interface RAGCorrectionResult {
  originalComp: TerraFusionComp;
  correctedComp: TerraFusionComp;
  corrections: {
    field: string;
    originalValue: any;
    correctedValue: any;
    confidence: number;
    reasoning: string;
  }[];
  overallConfidence: number;
}

export class LLMRAGValidator {
  private apiKey: string | null = null;
  private ragDatabase: Map<string, TerraFusionComp[]> = new Map();

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
    this.initializeRAGDatabase();
  }

  private initializeRAGDatabase() {
    // Initialize with reference property data for similar property lookups
    // In production, this would be loaded from a vector database like Pinecone
    const referenceData: TerraFusionComp[] = [
      {
        address: "123 Main St, Seattle, WA",
        sale_price_usd: 750000,
        gla_sqft: 2200,
        lot_size_sqft: 8000,
        bedrooms: 3,
        bathrooms: 2.5,
        year_built: 1995,
        sale_date: "2023-06-15",
        property_type: "Single Family",
      },
      {
        address: "456 Oak Ave, Portland, OR",
        sale_price_usd: 650000,
        gla_sqft: 1800,
        lot_size_sqft: 6500,
        bedrooms: 3,
        bathrooms: 2,
        year_built: 1988,
        sale_date: "2023-05-20",
        property_type: "Single Family",
      },
    ];

    // Store by region/area for quick similarity matching
    this.ragDatabase.set("pacific_northwest", referenceData);
  }

  public async correctWithRAG(comp: TerraFusionComp): Promise<RAGCorrectionResult> {
    if (!this.apiKey) {
      console.warn("[RAG] OpenAI API key not available, using rule-based corrections");
      return this.fallbackCorrection(comp);
    }

    try {
      // Find similar properties from RAG database
      const similarProperties = this.findSimilarProperties(comp);

      // Build LLM prompt with context
      const prompt = this.buildCorrectionPrompt(comp, similarProperties);

      // Call OpenAI API for corrections
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a real estate data validation expert. Analyze the property record and suggest corrections based on similar properties. Return valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const correctionText = data.choices[0]?.message?.content;

      if (!correctionText) {
        throw new Error("No correction response from LLM");
      }

      return this.parseLLMResponse(comp, correctionText);
    } catch (error) {
      console.error("[RAG] LLM correction failed:", error);
      return this.fallbackCorrection(comp);
    }
  }

  private findSimilarProperties(comp: TerraFusionComp): TerraFusionComp[] {
    // Simple similarity matching - in production would use vector embeddings
    const allProperties = Array.from(this.ragDatabase.values()).flat();

    return allProperties
      .filter((prop) => {
        // Match by property type and approximate size
        const sizeMatch =
          comp.gla_sqft && prop.gla_sqft && Math.abs(comp.gla_sqft - prop.gla_sqft) < 500;

        const typeMatch = comp.property_type === prop.property_type;

        return sizeMatch || typeMatch;
      })
      .slice(0, 3); // Return top 3 similar properties
  }

  private buildCorrectionPrompt(
    comp: TerraFusionComp,
    similarProperties: TerraFusionComp[]
  ): string {
    return `
Analyze this property record and suggest corrections:

TARGET PROPERTY:
${JSON.stringify(comp, null, 2)}

SIMILAR REFERENCE PROPERTIES:
${similarProperties.map((p) => JSON.stringify(p, null, 2)).join("\n\n")}

Please identify and correct any issues in the target property:
1. Missing or invalid addresses
2. Unrealistic sale prices (should be > $10,000 and < $5,000,000)
3. Invalid square footage (should be > 300 and < 10,000)
4. Missing or future sale dates
5. Logical inconsistencies

Return corrections in this exact JSON format:
{
  "corrections": [
    {
      "field": "field_name",
      "originalValue": "current_value",
      "correctedValue": "suggested_value",
      "confidence": 0.85,
      "reasoning": "explanation"
    }
  ],
  "overallConfidence": 0.90
}
`;
  }

  private parseLLMResponse(
    originalComp: TerraFusionComp,
    llmResponse: string
  ): RAGCorrectionResult {
    try {
      // Extract JSON from LLM response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const corrections = parsed.corrections || [];

      // Apply corrections to create corrected comp
      const correctedComp = { ...originalComp };
      corrections.forEach((correction: any) => {
        if (correction.field && correction.correctedValue !== undefined) {
          (correctedComp as any)[correction.field] = correction.correctedValue;
        }
      });

      return {
        originalComp,
        correctedComp,
        corrections,
        overallConfidence: parsed.overallConfidence || 0.5,
      };
    } catch (error) {
      console.error("[RAG] Failed to parse LLM response:", error);
      return this.fallbackCorrection(originalComp);
    }
  }

  private fallbackCorrection(comp: TerraFusionComp): RAGCorrectionResult {
    const corrections: any[] = [];
    const correctedComp = { ...comp };

    // Rule-based corrections when LLM is unavailable
    if (!comp.address || comp.address.trim().length < 5) {
      corrections.push({
        field: "address",
        originalValue: comp.address,
        correctedValue: "Address Required",
        confidence: 0.9,
        reasoning: "Address is missing or too short",
      });
      correctedComp.address = "Address Required";
    }

    if (!comp.sale_price_usd || comp.sale_price_usd < 10000) {
      const estimatedPrice = comp.gla_sqft ? comp.gla_sqft * 300 : 250000;
      corrections.push({
        field: "sale_price_usd",
        originalValue: comp.sale_price_usd,
        correctedValue: estimatedPrice,
        confidence: 0.6,
        reasoning: "Sale price appears unrealistic, estimated based on size",
      });
      correctedComp.sale_price_usd = estimatedPrice;
    }

    if (!comp.gla_sqft || comp.gla_sqft < 300) {
      corrections.push({
        field: "gla_sqft",
        originalValue: comp.gla_sqft,
        correctedValue: 1500,
        confidence: 0.5,
        reasoning: "Living area missing or unrealistic, using average estimate",
      });
      correctedComp.gla_sqft = 1500;
    }

    return {
      originalComp: comp,
      correctedComp,
      corrections,
      overallConfidence: corrections.length > 0 ? 0.7 : 0.95,
    };
  }

  public addReferenceProperty(region: string, property: TerraFusionComp) {
    if (!this.ragDatabase.has(region)) {
      this.ragDatabase.set(region, []);
    }
    this.ragDatabase.get(region)!.push(property);
  }

  public getReferenceData(): Map<string, TerraFusionComp[]> {
    return this.ragDatabase;
  }
}

// Global singleton instance
export const llmRAGValidator = new LLMRAGValidator();
