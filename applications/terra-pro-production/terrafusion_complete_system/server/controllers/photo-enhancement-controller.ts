import { Request, Response } from "express";
import {
  enhancePropertyPhoto,
  analyzePropertyPhoto,
  EnhancementOptions,
} from "../lib/image-enhancement";
import {
  analyzePropertyPhotoWithAnthropic,
  detailedPropertyInspection,
} from "../lib/anthropic-image-analysis";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage as dbStorage } from "../storage";

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Create multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed") as any);
    }
  },
});

/**
 * Handle property photo enhancement
 */
export async function enhancePhoto(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Get enhancement options from request body
    const options: EnhancementOptions = {
      enhanceQuality: req.body.enhanceQuality === "true",
      fixLighting: req.body.fixLighting === "true",
      removeGlare: req.body.removeGlare === "true",
      removeNoise: req.body.removeNoise === "true",
      enhanceColors: req.body.enhanceColors === "true",
      improveComposition: req.body.improveComposition === "true",
      targetWidth: req.body.targetWidth ? parseInt(req.body.targetWidth) : undefined,
      targetHeight: req.body.targetHeight ? parseInt(req.body.targetHeight) : undefined,
    };

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);

    // Process the image
    const result = await enhancePropertyPhoto(imageBuffer, req.file.originalname, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to enhance photo",
      });
    }

    // Create relative URLs for the images
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const originalRelativePath = path
      .relative(process.cwd(), result.originalPath)
      .replace(/\\/g, "/");
    const enhancedRelativePath = path
      .relative(process.cwd(), result.enhancedPath)
      .replace(/\\/g, "/");

    // Return URLs to both original and enhanced images
    return res.status(200).json({
      success: true,
      originalUrl: `${baseUrl}/${originalRelativePath}`,
      enhancedUrl: `${baseUrl}/${enhancedRelativePath}`,
      originalPath: originalRelativePath,
      enhancedPath: enhancedRelativePath,
    });
  } catch (error) {
    console.error("Error in enhancePhoto:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Handle property photo analysis
 */
export async function analyzePhoto(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);

    // Analyze the image using OpenAI
    const result = await analyzePropertyPhoto(imageBuffer);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to analyze photo",
      });
    }

    // Return analysis results
    return res.status(200).json({
      success: true,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("Error in analyzePhoto:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Handle property photo analysis with Anthropic
 */
export async function analyzePhotoAdvanced(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);

    // Analyze the image using Anthropic
    const result = await analyzePropertyPhotoWithAnthropic(imageBuffer);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to analyze photo",
      });
    }

    // Return analysis results
    return res.status(200).json({
      success: true,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("Error in analyzePhotoAdvanced:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Handle detailed property inspection
 */
export async function inspectProperty(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);

    // Perform detailed inspection using Anthropic
    const result = await detailedPropertyInspection(imageBuffer);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to perform property inspection",
      });
    }

    // Return inspection results
    return res.status(200).json({
      success: true,
      inspectionReport: result.inspectionReport,
    });
  } catch (error) {
    console.error("Error in inspectProperty:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Save enhanced photo to database
 */
export async function saveEnhancedPhoto(req: Request, res: Response) {
  try {
    const { reportId, originalPath, enhancedPath, description } = req.body;

    if (!reportId || !originalPath || !enhancedPath) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // Create a new photo record in the database
    const newPhoto = await dbStorage.createPhoto({
      reportId: Number(reportId),
      url: enhancedPath, // Use url field instead of path
      photoType: "enhanced", // Use photoType field instead of type
      caption: description || "AI-enhanced property photo", // Use caption field instead of description
      // We store the original path in the metadata
      metadata: {
        originalPath: originalPath,
        enhancedAt: new Date().toISOString(),
        enhancementMethod: "AI-powered enhancement",
      },
    });

    return res.status(201).json({
      success: true,
      photo: newPhoto,
    });
  } catch (error) {
    console.error("Error in saveEnhancedPhoto:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
