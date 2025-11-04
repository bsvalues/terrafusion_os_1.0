import { Router, Request, Response } from "express";
import { storage } from "../storage";

const router = Router();

// GET /api/analytics/trends - Monthly trends data
router.get("/trends", async (req: Request, res: Response) => {
  try {
    // Return mock trends data for demo purposes
    const mockTrends = [
      { month: "2024-01", medianPrice: 520000, avgGLA: 1850, salesCount: 45 },
      { month: "2024-02", medianPrice: 535000, avgGLA: 1920, salesCount: 52 },
      { month: "2024-03", medianPrice: 548000, avgGLA: 1880, salesCount: 67 },
      { month: "2024-04", medianPrice: 562000, avgGLA: 1950, salesCount: 73 },
      { month: "2024-05", medianPrice: 578000, avgGLA: 1975, salesCount: 81 },
    ];

    res.json(mockTrends);
  } catch (error) {
    console.error("Analytics trends error:", error);
    res.status(500).json({ error: "Failed to fetch trends data" });
  }
});

// GET /api/analytics/zip-codes - ZIP code analysis
router.get("/zip-codes", async (req: Request, res: Response) => {
  try {
    // Return mock ZIP code data for demo purposes
    const mockZipData = [
      { zipCode: "98052", medianPrice: 875000, salesCount: 23 },
      { zipCode: "98040", medianPrice: 795000, salesCount: 18 },
      { zipCode: "98004", medianPrice: 1250000, salesCount: 12 },
      { zipCode: "98006", medianPrice: 682000, salesCount: 34 },
      { zipCode: "98033", medianPrice: 598000, salesCount: 45 },
      { zipCode: "98074", medianPrice: 715000, salesCount: 28 },
      { zipCode: "98039", medianPrice: 1850000, salesCount: 7 },
      { zipCode: "98034", medianPrice: 556000, salesCount: 39 },
    ];

    res.json(mockZipData);
  } catch (error) {
    console.error("Analytics zip codes error:", error);
    res.status(500).json({ error: "Failed to fetch ZIP code data" });
  }
});

// GET /api/analytics/property-types - Property type distribution
router.get("/property-types", async (req: Request, res: Response) => {
  try {
    // Return mock property type data for demo purposes
    const mockPropertyTypes = [
      { type: "Single Family", count: 156, fill: "#0088FE" },
      { type: "Townhouse", count: 89, fill: "#00C49F" },
      { type: "Condo", count: 73, fill: "#FFBB28" },
      { type: "Multi-Family", count: 42, fill: "#FF8042" },
      { type: "Land", count: 18, fill: "#8884D8" },
    ];

    res.json(mockPropertyTypes);
  } catch (error) {
    console.error("Analytics property types error:", error);
    res.status(500).json({ error: "Failed to fetch property type data" });
  }
});

// GET /api/analytics/summary - Summary statistics
router.get("/summary", async (req: Request, res: Response) => {
  try {
    // Return mock summary data for demo purposes
    const mockSummary = {
      totalProperties: 378,
      totalValue: 218450000,
      avgPrice: 578000,
      medianGLA: 1925,
    };

    res.json(mockSummary);
  } catch (error) {
    console.error("Analytics summary error:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

export default router;
