import { Router, Request, Response } from "express";
import { terminologyService } from "../services/terminology-service";
import { z } from "zod";

const router = Router();

// Schema for explain term request
const explainTermSchema = z.object({
  term: z.string().min(1, "Term is required"),
  context: z.string().optional(),
  userRole: z.string().optional(),
});

// Schema for contextual definition request
const contextualDefinitionSchema = z.object({
  term: z.string().min(1, "Term is required"),
  propertyData: z.object({
    propertyType: z.string().optional(),
    county: z.string().optional(),
    state: z.string().optional(),
    zoning: z.string().optional(),
    specialFeatures: z.string().optional(),
  }),
  assessmentContext: z.string().optional(),
  audience: z.string().optional(),
});

// Schema for related terms request
const relatedTermsSchema = z.object({
  term: z.string().min(1, "Term is required"),
  count: z.number().int().positive().default(5),
  knownTerms: z.array(z.string()).optional(),
});

// Schema for simplify explanation request
const simplifyExplanationSchema = z.object({
  term: z.string().min(1, "Term is required"),
  originalExplanation: z.string().min(1, "Original explanation is required"),
  readingLevel: z
    .enum(["elementary", "middle school", "high school", "college"])
    .default("middle school"),
});

// Schema for batch enhance terms request
const enhanceTermsSchema = z.object({
  terms: z.array(z.string()).min(1, "At least one term is required"),
  detailLevel: z.enum(["basic", "standard", "comprehensive"]).default("comprehensive"),
});

/**
 * Get an explanation for a real estate term
 */
router.post("/explain", async (req: Request, res: Response) => {
  try {
    const validation = explainTermSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.format(),
      });
    }

    const { term, context, userRole } = validation.data;
    const explanation = await terminologyService.explainTerm(term, context, userRole);

    return res.status(200).json(explanation);
  } catch (error) {
    console.error("Error explaining term:", error);
    return res.status(500).json({
      error: "Failed to get term explanation",
      message: error.message,
    });
  }
});

/**
 * Get a contextual definition for a term based on property data
 */
router.post("/contextual-definition", async (req: Request, res: Response) => {
  try {
    const validation = contextualDefinitionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.format(),
      });
    }

    const { term, propertyData, assessmentContext, audience } = validation.data;
    const definition = await terminologyService.getContextualDefinition(
      term,
      propertyData,
      assessmentContext,
      audience
    );

    return res.status(200).json(definition);
  } catch (error) {
    console.error("Error generating contextual definition:", error);
    return res.status(500).json({
      error: "Failed to generate contextual definition",
      message: error.message,
    });
  }
});

/**
 * Find terms related to a given term
 */
router.post("/related-terms", async (req: Request, res: Response) => {
  try {
    const validation = relatedTermsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.format(),
      });
    }

    const { term, count, knownTerms } = validation.data;
    const relatedTerms = await terminologyService.findRelatedTerms(term, count, knownTerms || []);

    return res.status(200).json(relatedTerms);
  } catch (error) {
    console.error("Error finding related terms:", error);
    return res.status(500).json({
      error: "Failed to find related terms",
      message: error.message,
    });
  }
});

/**
 * Simplify an explanation for easier understanding
 */
router.post("/simplify", async (req: Request, res: Response) => {
  try {
    const validation = simplifyExplanationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.format(),
      });
    }

    const { term, originalExplanation, readingLevel } = validation.data;
    const simplified = await terminologyService.simplifyExplanation(
      term,
      originalExplanation,
      readingLevel
    );

    return res.status(200).json(simplified);
  } catch (error) {
    console.error("Error simplifying explanation:", error);
    return res.status(500).json({
      error: "Failed to simplify explanation",
      message: error.message,
    });
  }
});

/**
 * Batch enhance terms in the database
 * Admin only endpoint
 */
router.post("/enhance-database", async (req: Request, res: Response) => {
  try {
    // TODO: Add proper authentication middleware
    // This should be an admin-only endpoint

    const validation = enhanceTermsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.format(),
      });
    }

    const { terms, detailLevel } = validation.data;
    const results = await terminologyService.enhanceTermDatabase(terms, detailLevel);

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error enhancing term database:", error);
    return res.status(500).json({
      error: "Failed to enhance term database",
      message: error.message,
    });
  }
});

export default router;
