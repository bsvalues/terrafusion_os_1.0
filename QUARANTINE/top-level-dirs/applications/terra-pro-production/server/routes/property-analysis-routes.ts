import express from "express";
// Import the valuation service functions using ES modules
import { generatePropertyValuation } from "../valuation-service.mjs";

const router = express.Router();

/**
 * API endpoint for property analysis
 * POST /api/property-analysis
 * Analyzes a property based on provided details
 */
router.post("/", async (req, res) => {
  try {
    const propertyData = req.body;

    // Validate required fields
    if (!propertyData || !propertyData.address) {
      return res.status(400).json({
        error: "Property data including address is required",
      });
    }

    // Generate AI valuation for the property
    const analysisResult = await generatePropertyValuation(propertyData);

    return res.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing property:", error);
    return res.status(500).json({
      error: "Failed to analyze property",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * API endpoint for analyzing a specific property at 406 Stardust Court
 * GET /api/property-analysis/specific/stardust
 * This is a convenience endpoint for testing with a pre-defined property
 */
router.get("/specific/stardust", async (req, res) => {
  try {
    // Create a predefined property object for 406 Stardust Ct
    const propertyData = {
      address: {
        street: "406 Stardust Ct",
        city: "Grandview",
        state: "WA",
        zipCode: "98930",
      },
      propertyType: "Single Family",
      bedrooms: 4,
      bathrooms: 2.5,
      squareFeet: 1850,
      yearBuilt: 1995,
      lotSize: 0.17,
      features: [{ name: "Garage" }, { name: "Fireplace" }, { name: "Patio" }],
      condition: "Good",
    };

    // Generate valuation using the same method as POST endpoint
    const analysisResult = await generatePropertyValuation(propertyData);

    return res.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing Stardust property:", error);
    return res.status(500).json({
      error: "Failed to analyze Stardust property",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
