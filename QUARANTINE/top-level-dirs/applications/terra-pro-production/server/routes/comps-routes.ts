/**
 * Comps Routes
 *
 * API endpoints for comparable property management
 */
import { Router } from "express";
import { z } from "zod";
import {
  getSnapshotsByPropertyId,
  getSnapshotById,
  createSnapshot,
  compareSnapshots,
} from "../services/comps";

const router = Router();

// Get property snapshots
router.get("/history/:propertyId", async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const snapshots = await getSnapshotsByPropertyId(propertyId);

    res.json({ snapshots });
  } catch (error) {
    console.error("Error fetching property snapshots:", error);
    res.status(500).json({
      message: "Failed to fetch property snapshots",
      error: error.message,
    });
  }
});

// Get a specific snapshot
router.get("/snapshot/:snapshotId", async (req, res) => {
  try {
    const snapshotId = req.params.snapshotId;
    const snapshot = await getSnapshotById(snapshotId);

    if (!snapshot) {
      return res.status(404).json({ message: "Snapshot not found" });
    }

    res.json({ snapshot });
  } catch (error) {
    console.error("Error fetching snapshot:", error);
    res.status(500).json({
      message: "Failed to fetch snapshot",
      error: error.message,
    });
  }
});

// Create a new snapshot
router.post("/snapshot", async (req, res) => {
  try {
    const schema = z.object({
      propertyId: z.string(),
      source: z.string(),
      fields: z.record(z.any()),
    });

    const validatedData = schema.parse(req.body);

    const newSnapshot = await createSnapshot(
      validatedData.propertyId,
      validatedData.source,
      validatedData.fields
    );

    res.status(201).json({ snapshot: newSnapshot });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error creating snapshot:", error);
    res.status(500).json({
      message: "Failed to create snapshot",
      error: error.message,
    });
  }
});

// Compare two snapshots
router.post("/compare", async (req, res) => {
  try {
    const schema = z.object({
      beforeId: z.string(),
      afterId: z.string(),
    });

    const validatedData = schema.parse(req.body);

    const beforeSnapshot = await getSnapshotById(validatedData.beforeId);
    const afterSnapshot = await getSnapshotById(validatedData.afterId);

    if (!beforeSnapshot || !afterSnapshot) {
      return res.status(404).json({ message: "One or both snapshots not found" });
    }

    const differences = compareSnapshots(beforeSnapshot, afterSnapshot);

    res.json({ differences });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error comparing snapshots:", error);
    res.status(500).json({
      message: "Failed to compare snapshots",
      error: error.message,
    });
  }
});

export default router;
