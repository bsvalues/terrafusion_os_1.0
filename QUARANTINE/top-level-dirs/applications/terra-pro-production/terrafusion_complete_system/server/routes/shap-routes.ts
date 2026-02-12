/**
 * Terrafusion SHAP API Routes
 */

import fs from "fs";
import path from "path";
import { Router, Request, Response } from "express";

// Path to SHAP values directory
const SHAP_VALUES_DIR = path.join(process.cwd(), "models", "shap_values");
const SAMPLE_IMAGES_DIR = path.join(process.cwd(), "data", "sample_images");

// Create router
export const shapRouter = Router();

/**
 * Get SHAP sample image
 */
shapRouter.get("/sample-images/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  const imagePath = path.join(SAMPLE_IMAGES_DIR, filename);

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Sample image not found" });
  }

  // Set appropriate content type
  res.setHeader("Content-Type", "image/png");

  // Send file
  fs.createReadStream(imagePath).pipe(res);
});

/**
 * Get all SHAP values
 */
shapRouter.get("/values", (req: Request, res: Response) => {
  try {
    const filePath = path.join(SHAP_VALUES_DIR, "all_shap_values.json");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "SHAP values not found" });
    }

    const shapValues = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.json(shapValues);
  } catch (error) {
    console.error("Error retrieving SHAP values:", error);
    res.status(500).json({ error: "Failed to retrieve SHAP values" });
  }
});

/**
 * Get SHAP values for a specific condition
 */
shapRouter.get("/values/:condition", (req: Request, res: Response) => {
  const { condition } = req.params;
  const normalizedCondition = condition.toLowerCase();

  try {
    const filePath = path.join(SHAP_VALUES_DIR, `${normalizedCondition}_shap.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `SHAP values for condition '${condition}' not found` });
    }

    const shapValues = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.json(shapValues);
  } catch (error) {
    console.error(`Error retrieving SHAP values for condition '${condition}':`, error);
    res.status(500).json({ error: "Failed to retrieve SHAP values" });
  }
});

/**
 * Generate SHAP values
 */
shapRouter.post("/generate", (req: Request, res: Response) => {
  const { propertyId, imageUrl } = req.body;

  // Validate request
  if (!propertyId || !imageUrl) {
    return res.status(400).json({ error: "Property ID and image URL are required" });
  }

  // This would typically call a Python script or backend service to generate SHAP values
  // For now, we'll return a simulated response based on our sample data

  try {
    // Get a random condition type for demonstration
    const conditions = ["excellent", "good", "average", "fair", "poor"];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

    // Read the corresponding SHAP values
    const filePath = path.join(SHAP_VALUES_DIR, `${randomCondition}_shap.json`);

    if (!fs.existsSync(filePath)) {
      return res
        .status(500)
        .json({ error: "Failed to generate SHAP values - sample data not found" });
    }

    const shapValues = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Simulate a processing delay
    setTimeout(() => {
      res.json({
        propertyId,
        condition: randomCondition,
        shapValues,
        sampleImageUrl: `/api/shap/sample-images/${randomCondition}_condition.png`,
      });
    }, 1500);
  } catch (error) {
    console.error("Error generating SHAP values:", error);
    res.status(500).json({ error: "Failed to generate SHAP values" });
  }
});
