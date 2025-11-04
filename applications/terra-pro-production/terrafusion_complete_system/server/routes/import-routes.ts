/**
 * Import Routes
 *
 * Provides endpoints for importing appraisal data from different file formats.
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { ImportService } from "../lib/import-service";
import { storage } from "../storage";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Initialize multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");

      // Create the uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Use a unique filename to prevent collisions
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const importRoutes = Router();
const importService = new ImportService();

// Upload and process a file
importRoutes.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Get the user ID from the authenticated user or request body
    const userId = req.body.userId || 1; // Default to user 1 for demo

    // Process the uploaded file
    const result = await importService.processFile({
      userId,
      filename: req.file.path,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    res.status(200).json({
      message: "File uploaded and processed successfully",
      importId: result.importId,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({
      error: "Failed to process file",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get import results for a user
importRoutes.get("/results", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1; // Default to user 1 for demo
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    const results = await importService.getImportResults(userId, limit, offset);
    res.json(results);
  } catch (error) {
    console.error("Error getting import results:", error);
    res.status(500).json({ error: "Failed to get import results" });
  }
});

// Get a specific import result
importRoutes.get("/results/:id", async (req: Request, res: Response) => {
  try {
    const importId = req.params.id;
    const result = await importService.getImportResult(importId);

    if (!result) {
      return res.status(404).json({ error: "Import result not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error getting import result:", error);
    res.status(500).json({ error: "Failed to get import result" });
  }
});

export { importRoutes };
