/**
 * Health Check Routes
 *
 * Endpoints for checking system health and connection status
 * Helps diagnose WebSocket and database connectivity issues
 */

import { Router } from "express";
import { networkHealth } from "../utils/network-health";
import { Logger } from "../utils/logger";

const router = Router();
const logger = new Logger("HealthCheck");

// Simple health check that returns OK
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Detailed health check that runs all checks
router.get("/health/detailed", async (req, res) => {
  try {
    const result = await networkHealth.checkHealth();

    // Set status code based on health status
    if (result.status === "unhealthy") {
      res.status(503); // Service Unavailable
    } else if (result.status === "degraded") {
      res.status(207); // Multi-Status
    } else {
      res.status(200); // OK
    }

    res.json(result);
  } catch (error) {
    logger.error("Error during health check:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to run health check",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get the latest health check result without running a new check
router.get("/health/latest", (req, res) => {
  const result = networkHealth.getLastHealthCheck();

  if (!result) {
    res.status(404).json({
      status: "unknown",
      error: "No health check has been run yet",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Set status code based on health status
  if (result.status === "unhealthy") {
    res.status(503); // Service Unavailable
  } else if (result.status === "degraded") {
    res.status(207); // Multi-Status
  } else {
    res.status(200); // OK
  }

  res.json(result);
});

// WebSocket-specific health check
router.get("/health/websocket", (req, res) => {
  const fullCheck = networkHealth.getLastHealthCheck();
  const canUseWs = networkHealth.isRealtimeCommunicationReliable();

  res.json({
    status: canUseWs ? "healthy" : "degraded",
    canUseWebSockets: canUseWs,
    shouldFallbackToPolling: !canUseWs,
    timestamp: new Date().toISOString(),
    fullCheck: fullCheck || undefined,
  });
});

// Database-specific health check
router.get("/health/database", async (req, res) => {
  try {
    const result = await networkHealth.checkHealth();

    res.json({
      status: result.databaseConnectivity ? "healthy" : "unhealthy",
      databaseConnectivity: result.databaseConnectivity,
      latency: result.details.databaseLatency,
      timestamp: result.timestamp,
      details: result.details.errors?.filter((err) => err.includes("Database")) || [],
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Failed to check database health",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
