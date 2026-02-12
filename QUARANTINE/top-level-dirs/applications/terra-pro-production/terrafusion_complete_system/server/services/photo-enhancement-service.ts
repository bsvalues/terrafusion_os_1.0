import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { type Uploadable } from "openai/uploads";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { promisify } from "util";

// Convert callbacks to promises
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const ANTHROPIC_MODEL = "claude-3-7-sonnet-20250219";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const OPENAI_MODEL = "gpt-4o";

export interface PhotoEnhancementOptions {
  improveLighting?: boolean;
  correctPerspective?: boolean;
  enhanceDetails?: boolean;
  removeClutter?: boolean;
  identifyFeatures?: boolean;
}

export interface EnhancedPhotoResult {
  enhancedImagePath: string;
  detectedFeatures?: string[];
  enhancementDetails?: string;
  originalImagePath?: string;
}

/**
 * Service for enhancing property photos using AI
 */
export class PhotoEnhancementService {
  private static instance: PhotoEnhancementService;
  private uploadDir: string;

  private constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads");

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PhotoEnhancementService {
    if (!PhotoEnhancementService.instance) {
      PhotoEnhancementService.instance = new PhotoEnhancementService();
    }
    return PhotoEnhancementService.instance;
  }

  /**
   * Save a base64 image to disk
   */
  private async saveBase64Image(base64Data: string, prefix: string = "photo"): Promise<string> {
    // Create hash for unique filename
    const hash = crypto.createHash("md5").update(base64Data).digest("hex");
    const filename = `${prefix}_${hash}.jpg`;
    const filepath = path.join(this.uploadDir, filename);

    // Remove data URL prefix if present
    let imageData = base64Data;
    if (base64Data.startsWith("data:image")) {
      imageData = base64Data.split(",")[1];
    }

    // Save image to disk
    await writeFileAsync(filepath, Buffer.from(imageData, "base64"));

    return filepath;
  }

  /**
   * Analyze property photo using Anthropic API
   */
  private async analyzePhotoWithAnthropic(
    base64Image: string,
    options: PhotoEnhancementOptions
  ): Promise<string[]> {
    try {
      // Construct the prompt based on options
      let prompt = "Analyze this property photo and identify key features. ";

      if (options.identifyFeatures) {
        prompt +=
          "List specific property features visible in the image such as architectural style, " +
          "exterior materials, condition issues, renovations, landscaping elements, etc. ";
      }

      prompt += "Provide a JSON array of strings with each detected feature.";

      // Make API call to Anthropic
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      // Parse the response to extract features
      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response format from Anthropic API");
      }

      // Try to find a JSON array in the response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Error parsing JSON from Anthropic response:", e);
        }
      }

      // Fallback: split by lines and clean up
      return content.text
        .split("\n")
        .filter((line: string) => line.trim().startsWith("-") || line.trim().startsWith("*"))
        .map((line: string) => line.replace(/^[-*]\s+/, "").trim());
    } catch (error) {
      console.error(
        "Error analyzing photo with Anthropic:",
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  }

  /**
   * Enhance property photo using OpenAI's DALL-E
   */
  private async enhancePhotoWithOpenAI(
    base64Image: string,
    options: PhotoEnhancementOptions
  ): Promise<string> {
    try {
      // Construct the prompt based on options
      let prompt = "Enhance this real estate property photo";

      if (options.improveLighting) {
        prompt += ", improve lighting and exposure";
      }

      if (options.correctPerspective) {
        prompt += ", correct perspective distortion";
      }

      if (options.enhanceDetails) {
        prompt += ", enhance architectural details";
      }

      if (options.removeClutter) {
        prompt += ", remove clutter and distractions";
      }

      prompt +=
        ". Make it look professional while maintaining photorealistic quality. Do not add or remove major elements.";

      // Convert buffer to uploadable format
      const imageBuffer = Buffer.from(base64Image, "base64");
      const uploadableImage = new Blob([imageBuffer]) as unknown as Uploadable;

      // Make API call to OpenAI
      const response = await openai.images.edit({
        model: "dall-e-3",
        image: uploadableImage,
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      });

      // Return the enhanced image
      if (!response.data || response.data.length === 0 || !response.data[0].b64_json) {
        throw new Error("Invalid response from OpenAI API");
      }

      return response.data[0].b64_json;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error enhancing photo with OpenAI:", errorMessage);
      throw new Error("Failed to enhance photo: " + errorMessage);
    }
  }

  /**
   * Enhance a property photo using AI
   */
  public async enhancePropertyPhoto(
    base64Image: string,
    options: PhotoEnhancementOptions = {}
  ): Promise<EnhancedPhotoResult> {
    try {
      // Save the original image
      const originalImagePath = await this.saveBase64Image(base64Image, "original");

      // Process in parallel for efficiency
      const [enhancedImageBase64, detectedFeatures] = await Promise.all([
        // Use OpenAI for image enhancement
        this.enhancePhotoWithOpenAI(base64Image, options),

        // Use Anthropic for feature detection
        options.identifyFeatures
          ? this.analyzePhotoWithAnthropic(base64Image, options)
          : Promise.resolve([]),
      ]);

      // Save the enhanced image
      const enhancedImagePath = await this.saveBase64Image(enhancedImageBase64, "enhanced");

      // Prepare enhancement details
      const enhancementDetails = [
        options.improveLighting ? "Improved lighting and exposure" : "",
        options.correctPerspective ? "Corrected perspective distortion" : "",
        options.enhanceDetails ? "Enhanced architectural details" : "",
        options.removeClutter ? "Removed clutter and distractions" : "",
        options.identifyFeatures ? "Identified property features" : "",
      ]
        .filter(Boolean)
        .join(", ");

      return {
        enhancedImagePath,
        detectedFeatures,
        enhancementDetails,
        originalImagePath,
      };
    } catch (error) {
      console.error("Error enhancing property photo:", error);
      throw error;
    }
  }

  /**
   * Get a list of recommended enhancement options based on image analysis
   */
  public async getRecommendedEnhancements(base64Image: string): Promise<PhotoEnhancementOptions> {
    try {
      // Use Anthropic to analyze the image and recommend enhancements
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Analyze this real estate property photo and recommend enhancement options. " +
                  "Return your response as a JSON object with boolean properties for: " +
                  "improveLighting, correctPerspective, enhanceDetails, removeClutter, identifyFeatures. " +
                  "Set each to true or false based on whether you recommend that enhancement.",
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      // Parse the JSON from the response
      const contentBlock = response.content[0];
      if (contentBlock.type !== "text") {
        throw new Error("Unexpected response format from Anthropic API");
      }

      const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Error parsing JSON from Anthropic response:", e);
        }
      }

      // Default recommendations if parsing fails
      return {
        improveLighting: true,
        correctPerspective: true,
        enhanceDetails: true,
        removeClutter: false,
        identifyFeatures: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error getting recommended enhancements:", errorMessage);

      // Default recommendations on error
      return {
        improveLighting: true,
        correctPerspective: true,
        enhanceDetails: true,
        removeClutter: false,
        identifyFeatures: true,
      };
    }
  }
}
