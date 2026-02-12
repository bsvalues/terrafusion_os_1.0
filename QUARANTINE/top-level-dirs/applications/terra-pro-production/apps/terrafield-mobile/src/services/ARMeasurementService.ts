import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

/**
 * Measurement type enum
 */
export enum MeasurementType {
  DISTANCE = "distance",
  AREA = "area",
  VOLUME = "volume",
  PERIMETER = "perimeter",
  HEIGHT = "height",
  ANGLE = "angle",
}

/**
 * Measurement unit enum
 */
export enum MeasurementUnit {
  IMPERIAL = "imperial",
  METRIC = "metric",
}

/**
 * Distance unit enum
 */
export enum DistanceUnit {
  METERS = "m",
  CENTIMETERS = "cm",
  FEET = "ft",
  INCHES = "in",
}

/**
 * Area unit enum
 */
export enum AreaUnit {
  SQUARE_METERS = "m²",
  SQUARE_FEET = "ft²",
  SQUARE_INCHES = "in²",
  ACRES = "acres",
  HECTARES = "ha",
}

/**
 * Volume unit enum
 */
export enum VolumeUnit {
  CUBIC_METERS = "m³",
  CUBIC_FEET = "ft³",
  GALLONS = "gal",
  LITERS = "L",
}

/**
 * Point interface
 */
export interface Point {
  x: number;
  y: number;
  z: number;
  confidence?: number;
}

/**
 * Measurement result interface
 */
export interface MeasurementResult {
  /**
   * Measurement type
   */
  type: MeasurementType;

  /**
   * Measurement value
   */
  value: number;

  /**
   * Measurement unit
   */
  unit: string;

  /**
   * Points used in measurement
   */
  points: Point[];

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Timestamp of measurement
   */
  timestamp: number;

  /**
   * Optional image URI of the measurement
   */
  imageUri?: string;

  /**
   * Optional label/description
   */
  label?: string;

  /**
   * Optional group ID for related measurements
   */
  groupId?: string;
}

/**
 * Room boundary interface
 */
export interface RoomBoundary {
  /**
   * Corners of the room (floor)
   */
  corners: Point[];

  /**
   * Ceiling height
   */
  ceilingHeight: number;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Floor area in square meters
   */
  floorArea: number;

  /**
   * Volume in cubic meters
   */
  volume: number;

  /**
   * Wall surfaces as arrays of points defining each wall
   */
  walls: Point[][];

  /**
   * Openings (doors, windows) as arrays of points
   */
  openings: {
    type: "door" | "window";
    points: Point[];
    width: number;
    height: number;
  }[];
}

/**
 * AR Measurement options
 */
export interface ARMeasurementOptions {
  /**
   * Preferred measurement unit system
   */
  unitSystem: MeasurementUnit;

  /**
   * Whether to capture an image with the measurement
   */
  captureImage: boolean;

  /**
   * Whether to save measurements to device storage
   */
  saveMeasurements: boolean;

  /**
   * Minimum confidence threshold (0-1)
   */
  confidenceThreshold: number;

  /**
   * Enable continuous measurement
   */
  continuousMeasurement: boolean;

  /**
   * Enable surface detection
   */
  detectSurfaces: boolean;
}

/**
 * Default AR measurement options
 */
const DEFAULT_OPTIONS: ARMeasurementOptions = {
  unitSystem: MeasurementUnit.IMPERIAL,
  captureImage: true,
  saveMeasurements: true,
  confidenceThreshold: 0.7,
  continuousMeasurement: false,
  detectSurfaces: true,
};

/**
 * ARMeasurementService
 *
 * Service for measuring real-world dimensions using augmented reality
 */
export class ARMeasurementService {
  private static instance: ARMeasurementService;
  private arSessionActive: boolean = false;
  private measurements: MeasurementResult[] = [];
  private roomBoundaries: RoomBoundary[] = [];
  private options: ARMeasurementOptions = DEFAULT_OPTIONS;

  // Storage paths
  private readonly MEASUREMENTS_DIRECTORY = `${FileSystem.documentDirectory}measurements/`;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.ensureDirectories();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ARMeasurementService {
    if (!ARMeasurementService.instance) {
      ARMeasurementService.instance = new ARMeasurementService();
    }
    return ARMeasurementService.instance;
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.MEASUREMENTS_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.MEASUREMENTS_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error("Error ensuring directories:", error);
    }
  }

  /**
   * Start AR session
   */
  public async startARSession(options?: Partial<ARMeasurementOptions>): Promise<boolean> {
    try {
      if (this.arSessionActive) {
        return true;
      }

      // Merge options
      this.options = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      // Check AR availability
      const isARAvailable = await this.checkARAvailability();
      if (!isARAvailable) {
        throw new Error("AR is not available on this device");
      }

      // Clear previous measurements
      this.measurements = [];

      // Set session as active
      this.arSessionActive = true;

      return true;
    } catch (error) {
      console.error("Error starting AR session:", error);
      return false;
    }
  }

  /**
   * Stop AR session
   */
  public stopARSession(): void {
    if (!this.arSessionActive) {
      return;
    }

    this.arSessionActive = false;
  }

  /**
   * Check if AR is available on the device
   */
  private async checkARAvailability(): Promise<boolean> {
    // This is a simplified check - in a real app, we would use ARKit/ARCore APIs
    // For now, we'll assume AR is available on iOS 13+ and Android 7.0+
    const platform = Platform.OS;

    if (platform === "ios") {
      return true; // Simplified check
    } else if (platform === "android") {
      return true; // Simplified check
    }

    return false;
  }

  /**
   * Measure distance between two points
   */
  public async measureDistance(
    startPoint: Point,
    endPoint: Point,
    label?: string
  ): Promise<MeasurementResult> {
    if (!this.arSessionActive) {
      throw new Error("AR session is not active");
    }

    // Calculate distance (Euclidean)
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2) +
        Math.pow(endPoint.z - startPoint.z, 2)
    );

    // Convert to preferred unit
    const { value, unit } = this.convertDistance(distance);

    // Calculate confidence based on input point confidence
    const confidence = Math.min(startPoint.confidence || 1.0, endPoint.confidence || 1.0);

    // Create measurement result
    const result: MeasurementResult = {
      type: MeasurementType.DISTANCE,
      value,
      unit,
      points: [startPoint, endPoint],
      confidence,
      timestamp: Date.now(),
      label,
    };

    // Capture image if enabled
    if (this.options.captureImage) {
      try {
        result.imageUri = await this.captureARImage();
      } catch (error) {
        console.error("Error capturing AR image:", error);
      }
    }

    // Add to measurements
    this.measurements.push(result);

    // Save if enabled
    if (this.options.saveMeasurements) {
      await this.saveMeasurement(result);
    }

    return result;
  }

  /**
   * Measure area defined by multiple points
   */
  public async measureArea(points: Point[], label?: string): Promise<MeasurementResult> {
    if (!this.arSessionActive) {
      throw new Error("AR session is not active");
    }

    if (points.length < 3) {
      throw new Error("At least 3 points are required to measure an area");
    }

    // Calculate area using the Shoelace formula (for planar polygon)
    const area = this.calculatePolygonArea(points);

    // Convert to preferred unit
    const { value, unit } = this.convertArea(area);

    // Calculate confidence based on input point confidence
    const confidence = points.reduce((min, point) => Math.min(min, point.confidence || 1.0), 1.0);

    // Create measurement result
    const result: MeasurementResult = {
      type: MeasurementType.AREA,
      value,
      unit,
      points,
      confidence,
      timestamp: Date.now(),
      label,
    };

    // Capture image if enabled
    if (this.options.captureImage) {
      try {
        result.imageUri = await this.captureARImage();
      } catch (error) {
        console.error("Error capturing AR image:", error);
      }
    }

    // Add to measurements
    this.measurements.push(result);

    // Save if enabled
    if (this.options.saveMeasurements) {
      await this.saveMeasurement(result);
    }

    return result;
  }

  /**
   * Detect room boundaries
   */
  public async detectRoomBoundaries(): Promise<RoomBoundary> {
    if (!this.arSessionActive) {
      throw new Error("AR session is not active");
    }

    if (!this.options.detectSurfaces) {
      throw new Error("Surface detection is disabled");
    }

    // In a real implementation, this would use ARKit/ARCore to detect planes and boundaries
    // For this demo, we'll create a simplified rectangular room
    const cornerDistance = 3 + Math.random() * 2; // 3-5 meters

    const corners: Point[] = [
      { x: 0, y: 0, z: 0, confidence: 0.9 },
      { x: cornerDistance, y: 0, z: 0, confidence: 0.9 },
      { x: cornerDistance, y: 0, z: cornerDistance * 1.5, confidence: 0.9 },
      { x: 0, y: 0, z: cornerDistance * 1.5, confidence: 0.9 },
    ];

    const ceilingHeight = 2.4 + Math.random() * 0.6; // 2.4-3.0 meters
    const floorArea = cornerDistance * (cornerDistance * 1.5);
    const volume = floorArea * ceilingHeight;

    // Create walls
    const walls: Point[][] = [
      // Wall 1
      [
        { x: corners[0].x, y: corners[0].y, z: corners[0].z, confidence: 0.9 },
        { x: corners[1].x, y: corners[1].y, z: corners[1].z, confidence: 0.9 },
        { x: corners[1].x, y: corners[1].y + ceilingHeight, z: corners[1].z, confidence: 0.9 },
        { x: corners[0].x, y: corners[0].y + ceilingHeight, z: corners[0].z, confidence: 0.9 },
      ],
      // Wall 2
      [
        { x: corners[1].x, y: corners[1].y, z: corners[1].z, confidence: 0.9 },
        { x: corners[2].x, y: corners[2].y, z: corners[2].z, confidence: 0.9 },
        { x: corners[2].x, y: corners[2].y + ceilingHeight, z: corners[2].z, confidence: 0.9 },
        { x: corners[1].x, y: corners[1].y + ceilingHeight, z: corners[1].z, confidence: 0.9 },
      ],
      // Wall 3
      [
        { x: corners[2].x, y: corners[2].y, z: corners[2].z, confidence: 0.9 },
        { x: corners[3].x, y: corners[3].y, z: corners[3].z, confidence: 0.9 },
        { x: corners[3].x, y: corners[3].y + ceilingHeight, z: corners[3].z, confidence: 0.9 },
        { x: corners[2].x, y: corners[2].y + ceilingHeight, z: corners[2].z, confidence: 0.9 },
      ],
      // Wall 4
      [
        { x: corners[3].x, y: corners[3].y, z: corners[3].z, confidence: 0.9 },
        { x: corners[0].x, y: corners[0].y, z: corners[0].z, confidence: 0.9 },
        { x: corners[0].x, y: corners[0].y + ceilingHeight, z: corners[0].z, confidence: 0.9 },
        { x: corners[3].x, y: corners[3].y + ceilingHeight, z: corners[3].z, confidence: 0.9 },
      ],
    ];

    // Add some openings (doors, windows)
    const openings = [
      {
        type: "door" as const,
        points: [
          {
            x: (corners[3].x + corners[0].x) / 2 - 0.4,
            y: corners[0].y,
            z: corners[0].z,
            confidence: 0.9,
          },
          {
            x: (corners[3].x + corners[0].x) / 2 + 0.4,
            y: corners[0].y,
            z: corners[0].z,
            confidence: 0.9,
          },
          {
            x: (corners[3].x + corners[0].x) / 2 + 0.4,
            y: corners[0].y + 2.0,
            z: corners[0].z,
            confidence: 0.9,
          },
          {
            x: (corners[3].x + corners[0].x) / 2 - 0.4,
            y: corners[0].y + 2.0,
            z: corners[0].z,
            confidence: 0.9,
          },
        ],
        width: 0.8,
        height: 2.0,
      },
      {
        type: "window" as const,
        points: [
          {
            x: (corners[1].x + corners[2].x) / 2 - 0.6,
            y: corners[1].y + 1.0,
            z: corners[1].z,
            confidence: 0.9,
          },
          {
            x: (corners[1].x + corners[2].x) / 2 + 0.6,
            y: corners[1].y + 1.0,
            z: corners[1].z,
            confidence: 0.9,
          },
          {
            x: (corners[1].x + corners[2].x) / 2 + 0.6,
            y: corners[1].y + 1.8,
            z: corners[1].z,
            confidence: 0.9,
          },
          {
            x: (corners[1].x + corners[2].x) / 2 - 0.6,
            y: corners[1].y + 1.8,
            z: corners[1].z,
            confidence: 0.9,
          },
        ],
        width: 1.2,
        height: 0.8,
      },
    ];

    const roomBoundary: RoomBoundary = {
      corners,
      ceilingHeight,
      confidence: 0.85,
      floorArea,
      volume,
      walls,
      openings,
    };

    // Store room boundary
    this.roomBoundaries.push(roomBoundary);

    return roomBoundary;
  }

  /**
   * Calculate wall surface area
   */
  public calculateWallSurfaceArea(
    roomBoundary: RoomBoundary,
    excludeOpenings: boolean = true
  ): Record<number, number> {
    const wallAreas: Record<number, number> = {};

    // Calculate area for each wall
    for (let i = 0; i < roomBoundary.walls.length; i++) {
      const wall = roomBoundary.walls[i];

      // Calculate wall dimensions
      const width = Math.sqrt(
        Math.pow(wall[1].x - wall[0].x, 2) + Math.pow(wall[1].z - wall[0].z, 2)
      );
      const height = wall[2].y - wall[1].y;

      // Calculate gross wall area
      let area = width * height;

      // Subtract openings if requested
      if (excludeOpenings) {
        const wallOpenings = roomBoundary.openings.filter((opening) => {
          // Simple check to see if opening is on this wall
          const openingX = (opening.points[0].x + opening.points[1].x) / 2;
          const openingY = (opening.points[0].y + opening.points[2].y) / 2;
          const openingZ = (opening.points[0].z + opening.points[1].z) / 2;

          const wallX = (wall[0].x + wall[1].x) / 2;
          const wallY = (wall[0].y + wall[2].y) / 2;
          const wallZ = (wall[0].z + wall[1].z) / 2;

          const distance = Math.sqrt(
            Math.pow(openingX - wallX, 2) +
              Math.pow(openingY - wallY, 2) +
              Math.pow(openingZ - wallZ, 2)
          );

          return distance < 0.5; // If opening is close to wall center
        });

        // Subtract opening areas
        for (const opening of wallOpenings) {
          area -= opening.width * opening.height;
        }
      }

      wallAreas[i] = area;
    }

    return wallAreas;
  }

  /**
   * Create 3D point cloud from AR session
   */
  public async create3DPointCloud(): Promise<Point[]> {
    if (!this.arSessionActive) {
      throw new Error("AR session is not active");
    }

    // In a real implementation, this would extract point cloud data from ARKit/ARCore
    // For this demo, we'll generate a simplified point cloud
    const points: Point[] = [];
    const pointCount = 500;

    for (let i = 0; i < pointCount; i++) {
      points.push({
        x: Math.random() * 5 - 2.5,
        y: Math.random() * 3,
        z: Math.random() * 5 - 2.5,
        confidence: 0.5 + Math.random() * 0.5,
      });
    }

    return points;
  }

  /**
   * Save measurement to storage
   */
  private async saveMeasurement(measurement: MeasurementResult): Promise<void> {
    try {
      const filename = `${this.MEASUREMENTS_DIRECTORY}measurement_${measurement.timestamp}.json`;

      await FileSystem.writeAsStringAsync(filename, JSON.stringify(measurement), {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error("Error saving measurement:", error);
    }
  }

  /**
   * Load measurements from storage
   */
  public async loadMeasurements(): Promise<MeasurementResult[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.MEASUREMENTS_DIRECTORY);
      const measurements: MeasurementResult[] = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await FileSystem.readAsStringAsync(
            `${this.MEASUREMENTS_DIRECTORY}${file}`
          );

          try {
            const measurement = JSON.parse(content) as MeasurementResult;
            measurements.push(measurement);
          } catch (parseError) {
            console.error("Error parsing measurement file:", parseError);
          }
        }
      }

      return measurements;
    } catch (error) {
      console.error("Error loading measurements:", error);
      return [];
    }
  }

  /**
   * Get current measurements
   */
  public getMeasurements(): MeasurementResult[] {
    return [...this.measurements];
  }

  /**
   * Get room boundaries
   */
  public getRoomBoundaries(): RoomBoundary[] {
    return [...this.roomBoundaries];
  }

  /**
   * Capture AR session image
   */
  private async captureARImage(): Promise<string> {
    // In a real implementation, this would capture the current AR view
    // For this demo, we'll just return a placeholder path
    return `${this.MEASUREMENTS_DIRECTORY}placeholder_${Date.now()}.jpg`;
  }

  /**
   * Calculate polygon area using Shoelace formula
   */
  private calculatePolygonArea(points: Point[]): number {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].z;
      area -= points[j].x * points[i].z;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Convert distance to preferred unit
   */
  private convertDistance(meters: number): { value: number; unit: string } {
    if (this.options.unitSystem === MeasurementUnit.METRIC) {
      // Use meters for distances >= 1m, cm for smaller
      if (meters >= 1) {
        return { value: meters, unit: DistanceUnit.METERS };
      } else {
        return { value: meters * 100, unit: DistanceUnit.CENTIMETERS };
      }
    } else {
      // Convert to feet for distances >= 1ft, inches for smaller
      const feet = meters * 3.28084;
      if (feet >= 1) {
        return { value: feet, unit: DistanceUnit.FEET };
      } else {
        return { value: feet * 12, unit: DistanceUnit.INCHES };
      }
    }
  }

  /**
   * Convert area to preferred unit
   */
  private convertArea(squareMeters: number): { value: number; unit: string } {
    if (this.options.unitSystem === MeasurementUnit.METRIC) {
      // Use m² for most areas, hectares for very large areas
      if (squareMeters >= 10000) {
        return { value: squareMeters / 10000, unit: AreaUnit.HECTARES };
      } else {
        return { value: squareMeters, unit: AreaUnit.SQUARE_METERS };
      }
    } else {
      // Convert to square feet for most areas, acres for very large areas
      const squareFeet = squareMeters * 10.7639;
      if (squareFeet >= 43560) {
        return { value: squareFeet / 43560, unit: AreaUnit.ACRES };
      } else {
        return { value: squareFeet, unit: AreaUnit.SQUARE_FEET };
      }
    }
  }

  /**
   * Format measurement for display
   */
  public formatMeasurement(measurement: MeasurementResult): string {
    const value = measurement.value.toFixed(2);

    switch (measurement.type) {
      case MeasurementType.DISTANCE:
        return `${value} ${measurement.unit}`;
      case MeasurementType.AREA:
        return `${value} ${measurement.unit}`;
      case MeasurementType.VOLUME:
        return `${value} ${measurement.unit}`;
      case MeasurementType.PERIMETER:
        return `${value} ${measurement.unit}`;
      case MeasurementType.HEIGHT:
        return `${value} ${measurement.unit}`;
      case MeasurementType.ANGLE:
        return `${value}°`;
      default:
        return `${value} ${measurement.unit}`;
    }
  }
}
