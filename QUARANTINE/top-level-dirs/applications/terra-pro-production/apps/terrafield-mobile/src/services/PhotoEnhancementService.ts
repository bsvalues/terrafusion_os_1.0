import * as FileSystem from "expo-file-system";
import { Platform, Alert } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";

import { AuthService } from "./AuthService";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";
import { ImageCompressionService, CompressionQuality } from "./ImageCompressionService";
import { SecureStorageService, SecurityLevel } from "./SecureStorageService";

/**
 * Enhancement type
 */
export enum EnhancementType {
  BASIC = "basic", // Basic image improvements (contrast, brightness, etc.)
  QUALITY = "quality", // Upscale, denoise, and sharpen
  HDR = "hdr", // HDR-like effect from a single image
  LOW_LIGHT = "low_light", // Low light/dark photo enhancement
  ARCHITECTURE = "architecture", // Specialized for buildings and architecture
  INTERIOR = "interior", // Specialized for interior photos
  CORRECTION = "correction", // Fix perspective, lens distortion
  CUSTOM = "custom", // Custom enhancement parameters
}

/**
 * Enhancement result
 */
export interface EnhancementResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message, if any
   */
  error?: string;

  /**
   * Original image URI
   */
  originalUri: string;

  /**
   * Enhanced image URI
   */
  enhancedUri?: string;

  /**
   * Enhancement type used
   */
  enhancementType: EnhancementType;

  /**
   * Original image size in bytes
   */
  originalSize?: number;

  /**
   * Enhanced image size in bytes
   */
  enhancedSize?: number;

  /**
   * Original image dimensions
   */
  originalDimensions?: {
    width: number;
    height: number;
  };

  /**
   * Enhanced image dimensions
   */
  enhancedDimensions?: {
    width: number;
    height: number;
  };

  /**
   * Time taken for enhancement in milliseconds
   */
  processingTime?: number;

  /**
   * Whether the enhancement was done locally
   */
  processedLocally: boolean;

  /**
   * Timestamp of the enhancement
   */
  timestamp: number;
}

/**
 * Enhancement options
 */
export interface EnhancementOptions {
  /**
   * Enhancement type
   */
  enhancementType: EnhancementType;

  /**
   * Enhancement intensity (0-1)
   */
  intensity?: number;

  /**
   * Target quality (0-1)
   */
  quality?: number;

  /**
   * Whether to preserve metadata (EXIF)
   */
  preserveMetadata?: boolean;

  /**
   * Target width (if upscaling)
   */
  targetWidth?: number;

  /**
   * Target height (if upscaling)
   */
  targetHeight?: number;

  /**
   * Custom parameters for custom enhancement type
   */
  customParameters?: Record<string, any>;

  /**
   * Whether to save the enhanced image to the photo library
   */
  saveToPhotoLibrary?: boolean;

  /**
   * Whether to compress the enhanced image
   */
  compressOutput?: boolean;

  /**
   * Whether to prefer offline processing
   */
  preferOffline?: boolean;
}

/**
 * Default enhancement options
 */
const DEFAULT_OPTIONS: EnhancementOptions = {
  enhancementType: EnhancementType.BASIC,
  intensity: 0.5,
  quality: 0.9,
  preserveMetadata: true,
  compressOutput: true,
  preferOffline: false,
  saveToPhotoLibrary: false,
};

/**
 * Enhancement parameter presets for different enhancement types
 */
const ENHANCEMENT_PRESETS: Record<EnhancementType, any> = {
  [EnhancementType.BASIC]: {
    contrast: 1.1,
    brightness: 1.05,
    saturation: 1.1,
    vibrance: 1.1,
    sharpness: 1.2,
  },
  [EnhancementType.QUALITY]: {
    upscale: 1.5,
    denoise: 0.7,
    sharpness: 1.3,
    detail: 1.2,
  },
  [EnhancementType.HDR]: {
    shadows: 1.3,
    highlights: 0.8,
    contrast: 1.2,
    vibrance: 1.3,
    saturation: 1.1,
  },
  [EnhancementType.LOW_LIGHT]: {
    exposure: 1.5,
    shadows: 1.5,
    brightness: 1.3,
    contrast: 1.1,
    denoise: 0.8,
  },
  [EnhancementType.ARCHITECTURE]: {
    perspective: 1.0,
    straighten: 1.0,
    verticalCorrection: 1.0,
    sharpness: 1.2,
    detail: 1.3,
  },
  [EnhancementType.INTERIOR]: {
    brightness: 1.2,
    shadows: 1.2,
    whites: 1.1,
    contrast: 1.05,
    vibrance: 1.1,
  },
  [EnhancementType.CORRECTION]: {
    perspective: 1.0,
    distortion: 1.0,
    chromatic: 1.0,
    straighten: 1.0,
  },
  [EnhancementType.CUSTOM]: {},
};

/**
 * PhotoEnhancementService
 *
 * Service for enhancing property photos using AI and image processing.
 */
export class PhotoEnhancementService {
  private static instance: PhotoEnhancementService;
  private authService: AuthService;
  private offlineQueueService: OfflineQueueService;
  private imageCompressionService: ImageCompressionService;
  private secureStorageService: SecureStorageService;

  // Enhancement queue
  private enhancementQueue: {
    uri: string;
    options: EnhancementOptions;
    callback: (result: EnhancementResult) => void;
  }[] = [];
  private isProcessingQueue: boolean = false;

  // Directories
  private readonly ENHANCED_IMAGES_DIRECTORY = `${FileSystem.documentDirectory}enhanced_images/`;
  private readonly TEMP_DIRECTORY = `${FileSystem.cacheDirectory}photo_enhancement_temp/`;

  // API endpoint
  private readonly API_ENDPOINT = "https://api.appraisalcore.replit.app/api/photo-enhancement";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.authService = AuthService.getInstance();
    this.offlineQueueService = OfflineQueueService.getInstance();
    this.imageCompressionService = ImageCompressionService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();

    // Ensure directories exist
    this.ensureDirectories();
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
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      // Check if enhanced images directory exists
      const enhancedDirInfo = await FileSystem.getInfoAsync(this.ENHANCED_IMAGES_DIRECTORY);
      if (!enhancedDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.ENHANCED_IMAGES_DIRECTORY, {
          intermediates: true,
        });
      }

      // Check if temp directory exists
      const tempDirInfo = await FileSystem.getInfoAsync(this.TEMP_DIRECTORY);
      if (!tempDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.TEMP_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error("Error ensuring directories:", error);
    }
  }

  /**
   * Enhance a photo with AI processing
   */
  public async enhancePhoto(
    imageUri: string,
    options: Partial<EnhancementOptions> = {}
  ): Promise<EnhancementResult> {
    try {
      // Check if image exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri, { size: true });
      if (!fileInfo.exists) {
        throw new Error(`Image file not found: ${imageUri}`);
      }

      // Merge options with defaults
      const mergedOptions: EnhancementOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      // Get original dimensions
      const originalDimensions = await this.getImageDimensions(imageUri);

      // Create base result
      const baseResult: Partial<EnhancementResult> = {
        success: false,
        originalUri: imageUri,
        enhancementType: mergedOptions.enhancementType,
        originalSize: fileInfo.size,
        originalDimensions,
        timestamp: Date.now(),
        processedLocally: true,
      };

      // Check network connectivity for online enhancement
      const networkInfo = await FileSystem.getInfoAsync("https://api.appraisalcore.replit.app");
      const isOnline = networkInfo.exists;

      // Use online enhancement if available and not preferring offline
      if (isOnline && !mergedOptions.preferOffline) {
        try {
          return await this.enhancePhotoOnline(imageUri, mergedOptions, baseResult);
        } catch (error) {
          console.warn("Online enhancement failed, falling back to offline:", error);
          // Fall back to offline enhancement
        }
      }

      // Offline enhancement
      return await this.enhancePhotoOffline(imageUri, mergedOptions, baseResult);
    } catch (error) {
      console.error("Error enhancing photo:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error enhancing photo",
        originalUri: imageUri,
        enhancementType: options.enhancementType || DEFAULT_OPTIONS.enhancementType,
        timestamp: Date.now(),
        processedLocally: true,
      };
    }
  }

  /**
   * Enhance photo using online API
   */
  private async enhancePhotoOnline(
    imageUri: string,
    options: EnhancementOptions,
    baseResult: Partial<EnhancementResult>
  ): Promise<EnhancementResult> {
    try {
      const startTime = Date.now();

      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required for online enhancement");
      }

      // Compress image before upload if needed
      let uploadUri = imageUri;
      if (options.compressOutput) {
        const compressed = await this.imageCompressionService.compressImage(imageUri, {
          quality: CompressionQuality.MEDIUM,
        });
        uploadUri = compressed.uri;
      }

      // Create form data
      const formData = new FormData();

      // Add image file
      const fileNameMatch = uploadUri.match(/([^\/]+)$/);
      const fileName = fileNameMatch ? fileNameMatch[1] : "photo.jpg";

      formData.append("image", {
        uri: uploadUri,
        name: fileName,
        type: "image/jpeg",
      } as any);

      // Add enhancement options
      formData.append("enhancementType", options.enhancementType);
      formData.append("intensity", options.intensity?.toString() || "0.5");
      formData.append("quality", options.quality?.toString() || "0.9");
      formData.append("preserveMetadata", options.preserveMetadata ? "true" : "false");

      if (options.targetWidth) {
        formData.append("targetWidth", options.targetWidth.toString());
      }

      if (options.targetHeight) {
        formData.append("targetHeight", options.targetHeight.toString());
      }

      if (options.customParameters) {
        formData.append("customParameters", JSON.stringify(options.customParameters));
      }

      // Make API request
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to enhance photo");
      }

      // Get enhanced image
      const responseData = await response.json();

      // Download enhanced image
      const enhancedFileName = `enhanced_${Date.now()}_${fileName}`;
      const enhancedUri = `${this.ENHANCED_IMAGES_DIRECTORY}${enhancedFileName}`;

      await FileSystem.downloadAsync(responseData.enhancedImageUrl, enhancedUri);

      // Get enhanced image info
      const enhancedInfo = await FileSystem.getInfoAsync(enhancedUri, { size: true });

      // Get enhanced dimensions
      const enhancedDimensions = await this.getImageDimensions(enhancedUri);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Save to photo library if requested
      if (options.saveToPhotoLibrary) {
        await this.saveToPhotoLibrary(enhancedUri);
      }

      return {
        ...(baseResult as EnhancementResult),
        success: true,
        enhancedUri,
        enhancedSize: enhancedInfo.size,
        enhancedDimensions,
        processingTime,
        processedLocally: false,
      };
    } catch (error) {
      console.error("Error enhancing photo online:", error);
      throw error;
    }
  }

  /**
   * Enhance photo using offline processing
   */
  private async enhancePhotoOffline(
    imageUri: string,
    options: EnhancementOptions,
    baseResult: Partial<EnhancementResult>
  ): Promise<EnhancementResult> {
    try {
      const startTime = Date.now();

      // Get enhancement preset
      const preset = ENHANCEMENT_PRESETS[options.enhancementType];

      // Apply basic image adjustments using ImageManipulator
      // This is a simplified offline enhancement
      const enhancedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Basic adjustments available in ImageManipulator
          { flip: { horizontal: false, vertical: false } },
          { rotate: 0 },
        ],
        {
          compress: options.quality || 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Generate enhanced file name
      const fileNameMatch = imageUri.match(/([^\/]+)$/);
      const fileName = fileNameMatch ? fileNameMatch[1] : "photo.jpg";
      const enhancedFileName = `enhanced_${Date.now()}_${fileName}`;
      const enhancedUri = `${this.ENHANCED_IMAGES_DIRECTORY}${enhancedFileName}`;

      // Save enhanced image
      await FileSystem.copyAsync({
        from: enhancedImage.uri,
        to: enhancedUri,
      });

      // Get enhanced image info
      const enhancedInfo = await FileSystem.getInfoAsync(enhancedUri, { size: true });

      // Get enhanced dimensions
      const enhancedDimensions = {
        width: enhancedImage.width,
        height: enhancedImage.height,
      };

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Save to photo library if requested
      if (options.saveToPhotoLibrary) {
        await this.saveToPhotoLibrary(enhancedUri);
      }

      // Queue for online enhancement when network is available
      await this.offlineQueueService.enqueue(
        OperationType.ENHANCE_PHOTO,
        {
          originalUri: imageUri,
          enhancedUri,
          options,
        },
        2 // Medium priority
      );

      return {
        ...(baseResult as EnhancementResult),
        success: true,
        enhancedUri,
        enhancedSize: enhancedInfo.size,
        enhancedDimensions,
        processingTime,
        processedLocally: true,
      };
    } catch (error) {
      console.error("Error enhancing photo offline:", error);
      throw error;
    }
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error("Error getting image dimensions:", error);
      throw error;
    }
  }

  /**
   * Save image to photo library
   */
  private async saveToPhotoLibrary(imageUri: string): Promise<string> {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        throw new Error("Permission to access photo library was denied");
      }

      // Save to photo library
      const asset = await MediaLibrary.createAssetAsync(imageUri);

      // Create album if it doesn't exist
      const albums = await MediaLibrary.getAlbumsAsync();
      const terraFieldAlbum = albums.find((album) => album.title === "TerraField");

      if (terraFieldAlbum) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], terraFieldAlbum, false);
      } else {
        await MediaLibrary.createAlbumAsync("TerraField", asset, false);
      }

      return asset.uri;
    } catch (error) {
      console.error("Error saving to photo library:", error);
      throw error;
    }
  }

  /**
   * Add enhancement to queue
   */
  public async queueEnhancement(
    imageUri: string,
    options: Partial<EnhancementOptions> = {},
    callback?: (result: EnhancementResult) => void
  ): Promise<void> {
    // Merge options with defaults
    const mergedOptions: EnhancementOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Add to queue
    this.enhancementQueue.push({
      uri: imageUri,
      options: mergedOptions,
      callback: callback || (() => {}),
    });

    // Start processing queue if not already
    if (!this.isProcessingQueue) {
      await this.processQueue();
    }
  }

  /**
   * Process enhancement queue
   */
  private async processQueue(): Promise<void> {
    try {
      if (this.isProcessingQueue || this.enhancementQueue.length === 0) {
        return;
      }

      this.isProcessingQueue = true;

      while (this.enhancementQueue.length > 0) {
        const item = this.enhancementQueue.shift();

        if (!item) continue;

        try {
          const result = await this.enhancePhoto(item.uri, item.options);
          item.callback(result);
        } catch (error) {
          console.error("Error processing enhancement queue item:", error);

          item.callback({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error enhancing photo",
            originalUri: item.uri,
            enhancementType: item.options.enhancementType,
            timestamp: Date.now(),
            processedLocally: true,
          });
        }
      }
    } catch (error) {
      console.error("Error processing enhancement queue:", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Detect quality issues in a photo
   */
  public async detectQualityIssues(
    imageUri: string
  ): Promise<{ hasIssues: boolean; issues: string[]; suggestedEnhancement?: EnhancementType }> {
    try {
      // This would normally involve AI image analysis
      // For demonstration, we'll use a simplified approach

      // Get image dimensions and size
      const dimensions = await this.getImageDimensions(imageUri);
      const fileInfo = await FileSystem.getInfoAsync(imageUri, { size: true });

      const issues: string[] = [];

      // Check image dimensions (minimum 800x600)
      if (dimensions.width < 800 || dimensions.height < 600) {
        issues.push("Low resolution");
      }

      // Check image size (minimum 100KB for decent quality)
      if (fileInfo.size && fileInfo.size < 100 * 1024) {
        issues.push("Low file size suggests compressed quality");
      }

      // Aspect ratio check
      const aspectRatio = dimensions.width / dimensions.height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        issues.push("Unusual aspect ratio");
      }

      // Suggest enhancement type based on issues
      let suggestedEnhancement: EnhancementType | undefined;

      if (issues.length > 0) {
        if (issues.includes("Low resolution")) {
          suggestedEnhancement = EnhancementType.QUALITY;
        } else {
          suggestedEnhancement = EnhancementType.BASIC;
        }
      }

      return {
        hasIssues: issues.length > 0,
        issues,
        suggestedEnhancement,
      };
    } catch (error) {
      console.error("Error detecting quality issues:", error);

      return {
        hasIssues: false,
        issues: ["Error analyzing image"],
      };
    }
  }

  /**
   * Batch enhance multiple photos
   */
  public async batchEnhancePhotos(
    imageUris: string[],
    options: Partial<EnhancementOptions> = {}
  ): Promise<EnhancementResult[]> {
    const results: EnhancementResult[] = [];

    // Process each image
    for (const uri of imageUris) {
      try {
        const result = await this.enhancePhoto(uri, options);
        results.push(result);
      } catch (error) {
        console.error(`Error enhancing photo ${uri}:`, error);

        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error enhancing photo",
          originalUri: uri,
          enhancementType: options.enhancementType || DEFAULT_OPTIONS.enhancementType,
          timestamp: Date.now(),
          processedLocally: true,
        });
      }
    }

    return results;
  }

  /**
   * Get all enhanced photos
   */
  public async getEnhancedPhotos(): Promise<{ original: string; enhanced: string }[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.ENHANCED_IMAGES_DIRECTORY);

      // Filter for enhanced photos (format: enhanced_TIMESTAMP_FILENAME)
      const enhancedFiles = files.filter((file) => file.startsWith("enhanced_"));

      // Get cached mapping
      const mapping = await this.secureStorageService.getData<Record<string, string>>(
        "terrafield:photo_enhancement:mapping",
        {}
      );

      const result: { original: string; enhanced: string }[] = [];

      for (const file of enhancedFiles) {
        const enhancedUri = `${this.ENHANCED_IMAGES_DIRECTORY}${file}`;

        // Find original in mapping
        const originalUri = Object.entries(mapping).find(
          ([_, enhanced]) => enhanced === enhancedUri
        )?.[0];

        if (originalUri) {
          result.push({
            original: originalUri,
            enhanced: enhancedUri,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting enhanced photos:", error);
      return [];
    }
  }

  /**
   * Clean up temporary files
   */
  public async cleanupTempFiles(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.TEMP_DIRECTORY);

      let deletedCount = 0;

      for (const file of files) {
        await FileSystem.deleteAsync(`${this.TEMP_DIRECTORY}${file}`);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
      return 0;
    }
  }
}
