import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

/**
 * Compression quality enum
 */
export enum CompressionQuality {
  LOW = 0.3,
  MEDIUM = 0.6,
  HIGH = 0.8,
  MAXIMUM = 0.9,
  LOSSLESS = 1.0,
}

/**
 * Compression format enum
 */
export enum CompressionFormat {
  JPEG = "jpeg",
  PNG = "png",
  WEBP = "webp",
}

/**
 * Compression options interface
 */
export interface CompressionOptions {
  /**
   * Target quality (0-1)
   */
  quality?: CompressionQuality | number;

  /**
   * Target format
   */
  format?: CompressionFormat;

  /**
   * Max width
   */
  maxWidth?: number;

  /**
   * Max height
   */
  maxHeight?: number;

  /**
   * Whether to preserve EXIF metadata
   */
  preserveMetadata?: boolean;

  /**
   * Base64 output
   */
  base64?: boolean;

  /**
   * Custom file name
   */
  fileName?: string;

  /**
   * Resize mode
   */
  resizeMode?: "contain" | "cover" | "stretch";

  /**
   * Whether to compress based on network conditions
   */
  adaptiveCompression?: boolean;
}

/**
 * Compression result interface
 */
export interface CompressionResult {
  /**
   * Compressed image URI
   */
  uri: string;

  /**
   * Image width
   */
  width: number;

  /**
   * Image height
   */
  height: number;

  /**
   * Image format
   */
  format: string;

  /**
   * Original file size in bytes
   */
  originalSize?: number;

  /**
   * Compressed file size in bytes
   */
  compressedSize?: number;

  /**
   * Compression ratio
   */
  compressionRatio?: number;

  /**
   * Base64 encoded data
   */
  base64?: string;
}

/**
 * Default compression options
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  quality: CompressionQuality.MEDIUM,
  format: CompressionFormat.JPEG,
  preserveMetadata: true,
  base64: false,
  adaptiveCompression: true,
};

/**
 * ImageCompressionService
 *
 * Service for compressing images to optimize storage and transmission
 */
export class ImageCompressionService {
  private static instance: ImageCompressionService;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ImageCompressionService {
    if (!ImageCompressionService.instance) {
      ImageCompressionService.instance = new ImageCompressionService();
    }
    return ImageCompressionService.instance;
  }

  /**
   * Compress an image
   */
  public async compressImage(
    uri: string,
    options?: Partial<CompressionOptions>
  ): Promise<CompressionResult> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });

      if (!fileInfo.exists) {
        throw new Error(`Image file not found: ${uri}`);
      }

      // Merge options with defaults
      const mergedOptions = this.getMergedOptions(options);

      // If adaptive compression is enabled, check network conditions
      if (mergedOptions.adaptiveCompression) {
        const adaptedOptions = await this.getAdaptiveCompressionOptions(mergedOptions);
        Object.assign(mergedOptions, adaptedOptions);
      }

      // Get image format
      const format = this.getManipulatorFormat(mergedOptions.format);

      // Calculate resize actions if needed
      const resizeActions = await this.calculateResizeActions(
        uri,
        mergedOptions.maxWidth,
        mergedOptions.maxHeight,
        mergedOptions.resizeMode
      );

      // Apply manipulations
      const result = await ImageManipulator.manipulateAsync(uri, resizeActions, {
        compress: mergedOptions.quality,
        format,
        base64: mergedOptions.base64,
      });

      // Generate output path if not base64
      const outputUri = result.uri;

      // Get compressed file info
      const compressedInfo = await FileSystem.getInfoAsync(outputUri, { size: true });

      // Calculate compression ratio
      const originalSize = fileInfo.size || 0;
      const compressedSize = compressedInfo.size || 0;
      const compressionRatio = originalSize > 0 ? 1 - compressedSize / originalSize : 0;

      return {
        uri: outputUri,
        width: result.width,
        height: result.height,
        format: mergedOptions.format || "jpeg",
        originalSize,
        compressedSize,
        compressionRatio,
        base64: result.base64,
      };
    } catch (error) {
      console.error("Error compressing image:", error);
      throw error;
    }
  }

  /**
   * Merge options with defaults
   */
  private getMergedOptions(options?: Partial<CompressionOptions>): CompressionOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Get adaptive compression options based on network conditions
   */
  private async getAdaptiveCompressionOptions(
    currentOptions: CompressionOptions
  ): Promise<Partial<CompressionOptions>> {
    try {
      const netInfo = await NetInfo.fetch();

      // Default to medium quality
      let quality = CompressionQuality.MEDIUM;

      if (!netInfo.isConnected) {
        // Offline - use higher quality as we're not transmitting
        quality = CompressionQuality.HIGH;
      } else if (netInfo.type === "wifi") {
        // WiFi - use higher quality
        quality = CompressionQuality.HIGH;
      } else if (netInfo.type === "cellular") {
        // Check connection quality for cellular
        if (netInfo.details?.cellularGeneration === "4g") {
          quality = CompressionQuality.MEDIUM;
        } else {
          // 3G or worse
          quality = CompressionQuality.LOW;
        }
      }

      return { quality };
    } catch (error) {
      console.error("Error determining adaptive compression:", error);
      return {};
    }
  }

  /**
   * Convert CompressionFormat to ImageManipulator SaveFormat
   */
  private getManipulatorFormat(format?: CompressionFormat): ImageManipulator.SaveFormat {
    switch (format) {
      case CompressionFormat.PNG:
        return ImageManipulator.SaveFormat.PNG;
      case CompressionFormat.WEBP:
        // WebP only supported on Android
        return Platform.OS === "android"
          ? (ImageManipulator.SaveFormat as any).WEBP
          : ImageManipulator.SaveFormat.JPEG;
      case CompressionFormat.JPEG:
      default:
        return ImageManipulator.SaveFormat.JPEG;
    }
  }

  /**
   * Calculate resize actions if max dimensions are provided
   */
  private async calculateResizeActions(
    uri: string,
    maxWidth?: number,
    maxHeight?: number,
    resizeMode?: "contain" | "cover" | "stretch"
  ): Promise<ImageManipulator.Action[]> {
    // If no resize needed, return empty actions
    if (!maxWidth && !maxHeight) {
      return [];
    }

    try {
      // Get current image dimensions
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const { width, height } = result;

      // If image is already smaller than max dimensions, no resize needed
      if ((!maxWidth || width <= maxWidth) && (!maxHeight || height <= maxHeight)) {
        return [];
      }

      // Calculate new dimensions based on resize mode
      let newWidth = width;
      let newHeight = height;

      if (resizeMode === "stretch") {
        // Stretch: use max dimensions directly
        newWidth = maxWidth || width;
        newHeight = maxHeight || height;
      } else {
        // Default to 'contain' behavior
        const aspectRatio = width / height;

        if (maxWidth && maxHeight) {
          // Both dimensions specified
          const maxAspectRatio = maxWidth / maxHeight;

          if (
            (resizeMode === "contain" && aspectRatio > maxAspectRatio) ||
            (resizeMode === "cover" && aspectRatio < maxAspectRatio)
          ) {
            // Width constrained
            newWidth = maxWidth;
            newHeight = maxWidth / aspectRatio;
          } else {
            // Height constrained
            newHeight = maxHeight;
            newWidth = maxHeight * aspectRatio;
          }
        } else if (maxWidth) {
          // Only max width specified
          newWidth = maxWidth;
          newHeight = maxWidth / aspectRatio;
        } else if (maxHeight) {
          // Only max height specified
          newHeight = maxHeight;
          newWidth = maxHeight * aspectRatio;
        }
      }

      // Round dimensions to integers
      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);

      return [
        {
          resize: {
            width: newWidth,
            height: newHeight,
          },
        },
      ];
    } catch (error) {
      console.error("Error calculating resize actions:", error);
      return [];
    }
  }

  /**
   * Batch compress multiple images
   */
  public async batchCompressImages(
    uris: string[],
    options?: Partial<CompressionOptions>
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    for (const uri of uris) {
      try {
        const result = await this.compressImage(uri, options);
        results.push(result);
      } catch (error) {
        console.error(`Error compressing image ${uri}:`, error);
      }
    }

    return results;
  }

  /**
   * Get a recommended compression quality based on file size
   */
  public getRecommendedQuality(fileSize: number): CompressionQuality {
    if (fileSize < 500 * 1024) {
      // Less than 500KB - use high quality
      return CompressionQuality.HIGH;
    } else if (fileSize < 2 * 1024 * 1024) {
      // 500KB - 2MB - use medium quality
      return CompressionQuality.MEDIUM;
    } else if (fileSize < 5 * 1024 * 1024) {
      // 2MB - 5MB - use low quality
      return CompressionQuality.LOW;
    } else {
      // Over 5MB - use very low quality
      return CompressionQuality.LOW;
    }
  }

  /**
   * Get display size string from bytes
   */
  public getDisplaySize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}
