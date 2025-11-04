import { Router, Request, Response } from "express";
import {
  getRetrainLog,
  getLatestModelInfo,
  getModelAccuracyTrend,
  getModelDriftTrend,
  getModelImprovementSummary,
} from "../model/monitor_retrain";

const router = Router();

// Get all model retraining logs
router.get("/model/retrain-logs", (req: Request, res: Response) => {
  try {
    const logs = getRetrainLog();
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching model retrain logs:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve model retrain logs", error: String(error) });
  }
});

// Get latest model information
router.get("/model/latest", (req: Request, res: Response) => {
  try {
    const latestModel = getLatestModelInfo();
    if (!latestModel) {
      return res.status(404).json({ message: "No model information available" });
    }
    res.status(200).json(latestModel);
  } catch (error) {
    console.error("Error fetching latest model info:", error);
    res.status(500).json({ message: "Failed to retrieve latest model info", error: String(error) });
  }
});

// Get model accuracy trend
router.get("/model/accuracy-trend", (req: Request, res: Response) => {
  try {
    const trend = getModelAccuracyTrend();
    res.status(200).json(trend);
  } catch (error) {
    console.error("Error calculating model accuracy trend:", error);
    res.status(500).json({ message: "Failed to calculate accuracy trend", error: String(error) });
  }
});

// Get model drift trend
router.get("/model/drift-trend", (req: Request, res: Response) => {
  try {
    const trend = getModelDriftTrend();
    res.status(200).json(trend);
  } catch (error) {
    console.error("Error calculating model drift trend:", error);
    res.status(500).json({ message: "Failed to calculate drift trend", error: String(error) });
  }
});

// Get model improvement summary
router.get("/model/improvement-summary", (req: Request, res: Response) => {
  try {
    const summary = getModelImprovementSummary();
    res.status(200).json({ summary });
  } catch (error) {
    console.error("Error generating model improvement summary:", error);
    res
      .status(500)
      .json({ message: "Failed to generate improvement summary", error: String(error) });
  }
});

export default router;
