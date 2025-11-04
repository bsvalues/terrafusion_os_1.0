import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import {
  PhotoEnhancementService,
  PhotoEnhancementOptions,
} from "../services/photo-enhancement-service";
import { NotificationService } from "../services/notification-service";

const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

// Create router
export const photoEnhancementRouter = Router();

// Configure file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "upload-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
  },
});

/**
 * Convert file to base64
 */
async function fileToBase64(filePath: string): Promise<string> {
  const data = await readFileAsync(filePath);
  return data.toString("base64");
}

/**
 * Endpoint to analyze a photo and get enhancement recommendations
 */
photoEnhancementRouter.post(
  "/analyze",
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      // Get service instance
      const enhancementService = PhotoEnhancementService.getInstance();

      // Convert file to base64
      const base64Image = await fileToBase64(req.file.path);

      // Get enhancement recommendations
      const recommendations = await enhancementService.getRecommendedEnhancements(base64Image);

      // Clean up temporary file
      await unlinkAsync(req.file.path);

      res.status(200).json({
        success: true,
        recommendations,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error analyzing photo:", errorMessage);
      res.status(500).json({
        success: false,
        message: "Error analyzing photo",
        error: errorMessage,
      });
    }
  }
);

/**
 * Endpoint to enhance a property photo
 */
photoEnhancementRouter.post(
  "/enhance",
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      // Get service instance
      const enhancementService = PhotoEnhancementService.getInstance();

      // Parse enhancement options
      const options: PhotoEnhancementOptions = {
        improveLighting: req.body.improveLighting === "true",
        correctPerspective: req.body.correctPerspective === "true",
        enhanceDetails: req.body.enhanceDetails === "true",
        removeClutter: req.body.removeClutter === "true",
        identifyFeatures: req.body.identifyFeatures === "true",
      };

      // Convert file to base64
      const base64Image = await fileToBase64(req.file.path);

      // Get notification service
      const notificationService = NotificationService.getInstance();

      // Send 'started' notification
      const userId = parseInt(req.body.userId || "1", 10);
      const photoId = req.file.filename.split(".")[0];

      notificationService.sendPhotoEnhancementNotification(userId, "started", photoId, { options });

      let enhancementResult;

      try {
        // Enhance photo
        enhancementResult = await enhancementService.enhancePropertyPhoto(base64Image, options);

        // Send 'completed' notification
        notificationService.sendPhotoEnhancementNotification(userId, "completed", photoId, {
          enhancedImageUrl: `/uploads/${path.basename(enhancementResult.enhancedImagePath || "")}`,
          detectedFeatures: enhancementResult.detectedFeatures,
        });

        // Clean up temporary file
        await unlinkAsync(req.file.path);
      } catch (error) {
        // Send 'failed' notification
        notificationService.sendPhotoEnhancementNotification(userId, "failed", photoId, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Re-throw to be caught by the outer try-catch
        throw error;
      }

      // Return result
      res.status(200).json({
        success: true,
        result: {
          ...enhancementResult,
          // Convert paths to URLs
          enhancedImageUrl: `/uploads/${path.basename(enhancementResult.enhancedImagePath || "")}`,
          originalImageUrl: `/uploads/${path.basename(enhancementResult.originalImagePath || "")}`,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error enhancing photo:", errorMessage);
      res.status(500).json({
        success: false,
        message: "Error enhancing photo",
        error: errorMessage,
      });
    }
  }
);

export default photoEnhancementRouter;
