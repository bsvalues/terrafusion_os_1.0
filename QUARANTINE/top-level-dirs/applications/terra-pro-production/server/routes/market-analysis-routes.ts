import { Router, Request, Response } from "express";
import { generateMarketAnalysis } from "../services/openai-service";
import { generateMarketAnalysisWithClaude } from "../services/anthropic-service";
import { z } from "zod";

const marketAnalysisRouter = Router();

// Request validation schema
const marketAnalysisRequestSchema = z.object({
  location: z.string().min(1, "Location is required"),
  propertyType: z.string().min(1, "Property type is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  provider: z.enum(["openai", "anthropic", "auto"]).default("auto"),
  additionalContext: z.string().optional(),
});

/**
 * Generate a market analysis report using AI
 *
 * POST /api/market-analysis
 */
marketAnalysisRouter.post("/", async (req: Request, res: Response) => {
  try {
    // Validate request
    const validationResult = marketAnalysisRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.errors,
      });
    }

    const params = validationResult.data;
    const { provider } = params;

    console.log(`Generating market analysis for ${params.location} using ${provider} provider`);

    // Select AI provider based on request or availability
    try {
      let result;

      if (provider === "openai" || provider === "auto") {
        result = await generateMarketAnalysis(params);
      } else if (provider === "anthropic") {
        result = await generateMarketAnalysisWithClaude(params);
      }

      return res.status(200).json(result);
    } catch (aiError) {
      console.error("Error with primary AI provider:", aiError);

      // Fallback to alternative provider if 'auto' was specified
      if (provider === "auto") {
        try {
          // If OpenAI failed, try Anthropic
          console.log("Falling back to alternate AI provider");
          const result = await generateMarketAnalysisWithClaude(params);
          return res.status(200).json(result);
        } catch (fallbackError) {
          console.error("Error with fallback AI provider:", fallbackError);
          throw fallbackError;
        }
      } else {
        throw aiError;
      }
    }
  } catch (error: any) {
    console.error("Error generating market analysis:", error);
    return res.status(500).json({
      message: "Failed to generate market analysis",
      error: error.message || "Unknown error occurred",
    });
  }
});

/**
 * Get saved market analyses for a specific area
 *
 * GET /api/market-analysis?location=Austin,TX
 */
marketAnalysisRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { location } = req.query;

    if (!location || typeof location !== "string") {
      return res.status(400).json({ message: "Location parameter is required" });
    }

    // Fetch saved market analyses from storage
    // This is a placeholder - you would typically retrieve from database
    const analyses = [
      {
        id: 1,
        location: location,
        propertyType: "Single Family",
        timeframe: "6 months",
        createdAt: new Date().toISOString(),
        summary: "Simulated saved market analysis",
        priceTrends: [],
      },
    ];

    return res.status(200).json(analyses);
  } catch (error: any) {
    console.error("Error fetching market analyses:", error);
    return res.status(500).json({
      message: "Failed to fetch market analyses",
      error: error.message || "Unknown error",
    });
  }
});

/**
 * Get a specific saved market analysis by ID
 *
 * GET /api/market-analysis/:id
 */
marketAnalysisRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const analysisId = parseInt(req.params.id);

    if (isNaN(analysisId)) {
      return res.status(400).json({ message: "Invalid analysis ID" });
    }

    // Fetch specific market analysis from storage
    // This is a placeholder - you would typically retrieve from database
    const analysis = {
      id: analysisId,
      location: "Austin, TX",
      propertyType: "Single Family",
      timeframe: "6 months",
      createdAt: new Date().toISOString(),
      summary: "Simulated saved market analysis",
      priceTrends: [],
    };

    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error(`Error fetching market analysis ${req.params.id}:`, error);
    return res.status(500).json({
      message: "Failed to fetch market analysis",
      error: error.message || "Unknown error",
    });
  }
});

export { marketAnalysisRouter };
