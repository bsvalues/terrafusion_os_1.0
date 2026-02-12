import express, { Router, Request, Response } from "express";
import { z } from "zod";

// Define a simple logger (since the project logger may not be accessible)
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args),
};

// Import our valuation service
import * as valuationServiceImport from "../valuation-service.js";

// Create a variable to hold our imported module
const valuationService: any = valuationServiceImport;

// Schema for request validation
const propertyAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().optional().default("USA"),
});

const propertyFeatureSchema = z.object({
  name: z.string(),
  value: z.string().optional(),
});

const propertyDetailsSchema = z.object({
  address: propertyAddressSchema,
  propertyType: z.string(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number().int().optional(),
  yearBuilt: z.number().int().optional(),
  lotSize: z.number().optional(),
  features: z.array(propertyFeatureSchema).optional(),
  condition: z.string().optional(),
});

// Create router
const aiValuationRouter = Router();

// GET endpoint to retrieve valuation by property ID
aiValuationRouter.get("/value/:propertyId", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    logger.info(`Received valuation request for property ID: ${propertyId}`);

    // Get property from our service
    const property = valuationService.getPropertyById(propertyId);
    if (!property) {
      return res.status(404).json({ error: `Property with ID ${propertyId} not found` });
    }

    // Generate valuation report
    const valuationReport = valuationService.generateValuationReport(property);

    return res.json(valuationReport);
  } catch (error) {
    logger.error("Error in AI valuation endpoint:", error);
    return res.status(500).json({ error: "Failed to generate valuation" });
  }
});

// POST endpoint to perform valuation based on property details
aiValuationRouter.post("/value", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = propertyDetailsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid property details",
        details: validationResult.error.format(),
      });
    }

    const propertyDetails = validationResult.data;
    logger.info(`Received valuation request for property at ${propertyDetails.address.street}`);

    // Generate valuation report
    const valuationReport = valuationService.generateValuationReport(propertyDetails);

    return res.json(valuationReport);
  } catch (error) {
    logger.error("Error in AI valuation endpoint:", error);
    return res.status(500).json({ error: "Failed to generate valuation" });
  }
});

export default aiValuationRouter;
