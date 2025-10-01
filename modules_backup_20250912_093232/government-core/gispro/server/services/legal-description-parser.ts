/**
 * Legal Description Parser Service
 *
 * This service provides utilities for parsing legal descriptions of properties and
 * converting them into GeoJSON geometries for visualization on maps.
 */

import { Parcel } from '@shared/schema';

// Geographic coordinate reference
export interface Coordinate {
  lat: number;
  lng: number;
}

// A point in a legal description (with optional metadata)
export interface DescriptionPoint {
  coordinate: Coordinate;
  description?: string;
  type: 'corner' | 'midpoint' | 'reference';
}

// A line segment in a legal description
export interface DescriptionSegment {
  start: DescriptionPoint;
  end: DescriptionPoint;
  description?: string;
  type: 'boundary' | 'reference' | 'extension';
  bearing?: string; // e.g., "N45°E"
  distance?: string; // e.g., "150 feet"
}

// A parsed legal description result
export interface ParsedLegalDescription {
  points: DescriptionPoint[];
  segments: DescriptionSegment[];
  polygon?: GeoJSON.Polygon;
  confidence: number; // 0-1 scale of how confident the parser is
  issues?: string[]; // Any issues found during parsing
}

/**
 * Common patterns found in legal descriptions
 */
export enum LegalDescriptionPattern {
  METES_AND_BOUNDS = 'metes_and_bounds',
  RECTANGULAR_SURVEY_SYSTEM = 'rectangular_survey_system',
  LOT_AND_BLOCK = 'lot_and_block',
  INFORMAL = 'informal',
}

/**
 * Parse a legal description text and convert it to GeoJSON
 *
 * @param text The legal description text
 * @returns ParsedLegalDescription object containing points, segments, and polygon
 */
export function parseLegalDescription(text: string): ParsedLegalDescription {
  // Detect the pattern type
  const patternType = detectDescriptionPattern(text);

  let result: ParsedLegalDescription = {
    points: [],
    segments: [],
    confidence: 0,
    issues: [],
  };

  try {
    switch (patternType) {
      case LegalDescriptionPattern.METES_AND_BOUNDS:
        result = parseMetesAndBounds(text);
        break;
      case LegalDescriptionPattern.RECTANGULAR_SURVEY_SYSTEM:
        result = parseRectangularSurvey(text);
        break;
      case LegalDescriptionPattern.LOT_AND_BLOCK:
        result = parseLotAndBlock(text);
        break;
      case LegalDescriptionPattern.INFORMAL:
        result = parseInformalDescription(text);
        break;
      default:
        result.issues?.push('Unable to determine description pattern');
        result.confidence = 0.1;
    }
  } catch (error) {
    result.issues?.push(
      `Error parsing description: ${error instanceof Error ? error.message : String(error)}`
    );
    result.confidence = 0;
  }

  // If parsing produced points but no polygon, try to create one
  if (result.points.length > 2 && !result.polygon) {
    try {
      result.polygon = createPolygonFromPoints(result.points.map(p => p.coordinate));
    } catch (error) {
      result.issues?.push(
        `Error creating polygon: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return result;
}

/**
 * Detect the pattern type of a legal description
 */
function detectDescriptionPattern(text: string): LegalDescriptionPattern {
  // Normalize text
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');

  // Check for rectangular survey system patterns (township/range)
  if (/township|range|section|quarter|t\d+[nsew]|r\d+[nsew]/.test(normalizedText)) {
    return LegalDescriptionPattern.RECTANGULAR_SURVEY_SYSTEM;
  }

  // Check for metes and bounds patterns (bearings and distances)
  if (
    /(north|south|east|west|n|s|e|w)(\s*\d+\s*degrees|\s*\d+°)/.test(normalizedText) &&
    /(feet|foot|ft|meters|m|chains)/.test(normalizedText)
  ) {
    return LegalDescriptionPattern.METES_AND_BOUNDS;
  }

  // Check for lot and block patterns
  if (/lot\s+\d+|block\s+\d+|subdivision|plat/.test(normalizedText)) {
    return LegalDescriptionPattern.LOT_AND_BLOCK;
  }

  // Default to informal
  return LegalDescriptionPattern.INFORMAL;
}

/**
 * Parse a metes and bounds description
 */
function parseMetesAndBounds(text: string): ParsedLegalDescription {
  const result: ParsedLegalDescription = {
    points: [],
    segments: [],
    confidence: 0.7, // Default confidence
    issues: [],
  };

  // Simple parsing for demonstration - in reality, this would be much more complex
  // This is a placeholder implementation

  // Extract potential point of beginning
  const pobMatch = /point of (beginning|commencement)|POB|P\.O\.B\.|commencing at/i.exec(text);
  if (pobMatch) {
    // For demo purposes, use a fixed starting point - this would be parsed from the text
    const startPoint: DescriptionPoint = {
      coordinate: { lat: 47.586, lng: -122.347 }, // Example coordinate
      description: 'Point of Beginning',
      type: 'corner',
    };
    result.points.push(startPoint);
  } else {
    result.issues?.push('No clear point of beginning found');
    result.confidence -= 0.2;
  }

  // Extract bearings and distances
  const bearingMatches = text.matchAll(
    /(?:thence|then)?\s*(north|south|east|west|n|s|e|w)(?:\s*(\d+)(?:°|degrees|deg))?(?:\s*(east|west|north|south|e|w|n|s))?(?:\s*(\d+(?:\.\d+)?)\s*(feet|foot|ft|meters|m|chains))/gi
  );

  let lastPoint = result.points[0] || {
    coordinate: { lat: 47.586, lng: -122.347 }, // Default if no POB
    type: 'corner',
  };

  let index = 0;
  for (const match of bearingMatches) {
    index++;
    // This is a simplified calculation that doesn't account for actual geographic conversions
    // In a real implementation, proper bearing and distance calculations would be used

    const bearing = `${match[1]}${match[2] ? match[2] + '°' : ''}${match[3] ? match[3] : ''}`;
    const distance = `${match[4]} ${match[5]}`;

    // Calculate next point (very simplified)
    // This is just for demonstration - not geographically accurate
    const distanceValue = parseFloat(match[4]);
    const scaleFactor = 0.00001; // Arbitrary scale for demonstration
    const bearingAngle = calculateBearingAngle(bearing);

    const nextPoint: DescriptionPoint = {
      coordinate: {
        lat: lastPoint.coordinate.lat + Math.cos(bearingAngle) * distanceValue * scaleFactor,
        lng: lastPoint.coordinate.lng + Math.sin(bearingAngle) * distanceValue * scaleFactor,
      },
      description: `Point ${index + 1}`,
      type: 'corner',
    };

    // Create segment
    const segment: DescriptionSegment = {
      start: lastPoint,
      end: nextPoint,
      description: `${bearing} ${distance}`,
      bearing: bearing,
      distance: distance,
      type: 'boundary',
    };

    result.points.push(nextPoint);
    result.segments.push(segment);
    lastPoint = nextPoint;
  }

  // If we found at least 3 points, we can create a polygon
  if (result.points.length >= 3) {
    const coordinates = result.points.map(p => [p.coordinate.lng, p.coordinate.lat]);
    // Close the polygon by adding the first point again
    coordinates.push([result.points[0].coordinate.lng, result.points[0].coordinate.lat]);

    result.polygon = {
      type: 'Polygon',
      coordinates: [coordinates],
    };
  } else {
    result.issues?.push('Not enough points to create a polygon');
    result.confidence -= 0.3;
  }

  return result;
}

/**
 * Parse a rectangular survey system description (Township/Range/Section)
 */
function parseRectangularSurvey(text: string): ParsedLegalDescription {
  const result: ParsedLegalDescription = {
    points: [],
    segments: [],
    confidence: 0.6,
    issues: [],
  };

  // This is a placeholder implementation - would need real algorithms for:
  // 1. Parsing township, range, section references
  // 2. Converting to actual geographic coordinates

  // Example implementation to detect township/range pattern
  const regex = /T(\d+)(N|S).*R(\d+)(E|W)/i;
  const match = regex.exec(text);

  if (match) {
    const township = parseInt(match[1]);
    const townshipDir = match[2].toUpperCase();
    const range = parseInt(match[3]);
    const rangeDir = match[4].toUpperCase();

    // For demonstration only - this would need real conversion algorithms
    // These are just placeholder values to demonstrate the concept
    const baseCoordinate = { lat: 45.0, lng: -123.0 };

    // Adjust based on township and range (very simplified)
    const coordinate = {
      lat: baseCoordinate.lat + (townshipDir === 'N' ? township * 0.1 : -township * 0.1),
      lng: baseCoordinate.lng + (rangeDir === 'E' ? range * 0.1 : -range * 0.1),
    };

    // Create a simplified square for demo purposes
    const corners = [
      { lat: coordinate.lat, lng: coordinate.lng },
      { lat: coordinate.lat, lng: coordinate.lng + 0.05 },
      { lat: coordinate.lat + 0.05, lng: coordinate.lng + 0.05 },
      { lat: coordinate.lat + 0.05, lng: coordinate.lng },
    ];

    // Add points and segments
    corners.forEach((corner /* , index */) => {
      const point: DescriptionPoint = {
        coordinate: corner,
        description: `Corner ${index + 1}`,
        type: 'corner',
      };
      result.points.push(point);

      // Add segment (connecting this point to the next)
      if (index < corners.length - 1) {
        const segment: DescriptionSegment = {
          start: point,
          end: { coordinate: corners[index + 1], type: 'corner' },
          type: 'boundary',
        };
        result.segments.push(segment);
      }
    });

    // Add the closing segment
    result.segments.push({
      start: result.points[corners.length - 1],
      end: result.points[0],
      type: 'boundary',
    });

    // Create the polygon
    result.polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [corners[0].lng, corners[0].lat],
          [corners[1].lng, corners[1].lat],
          [corners[2].lng, corners[2].lat],
          [corners[3].lng, corners[3].lat],
          [corners[0].lng, corners[0].lat], // Close the polygon
        ],
      ],
    };
  } else {
    result.issues?.push('Could not parse township/range information');
    result.confidence = 0.2;
  }

  return result;
}

/**
 * Parse a lot and block description
 */
function parseLotAndBlock(text: string): ParsedLegalDescription {
  // This is a placeholder implementation
  return {
    points: [],
    segments: [],
    confidence: 0.4,
    issues: ['Lot and block parsing not fully implemented'],
  };
}

/**
 * Parse an informal description without standard format
 */
function parseInformalDescription(text: string): ParsedLegalDescription {
  // This is a placeholder implementation
  return {
    points: [],
    segments: [],
    confidence: 0.2,
    issues: ['Informal description parsing not fully implemented'],
  };
}

/**
 * Create a GeoJSON polygon from a set of points
 */
function createPolygonFromPoints(points: Coordinate[]): GeoJSON.Polygon {
  if (points.length < 3) {
    throw new Error('At least 3 points required to create a polygon');
  }

  // Map points to GeoJSON format [lng, lat]
  const coordinates = points.map(p => [p.lng, p.lat]);

  // Close the polygon by adding the first point again if it's not already closed
  if (
    coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
    coordinates[0][1] !== coordinates[coordinates.length - 1][1]
  ) {
    coordinates.push(coordinates[0]);
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

/**
 * Calculate bearing angle in radians for simple distance calculation
 * This is a very simplified calculation for demonstration purposes
 */
function calculateBearingAngle(bearing: string): number {
  const normalized = bearing.toLowerCase();

  if (normalized.includes('north') || normalized.startsWith('n')) {
    if (normalized.includes('east') || normalized.endsWith('e')) {
      return Math.PI / 4; // NE = 45 degrees
    } else if (normalized.includes('west') || normalized.endsWith('w')) {
      return (Math.PI * 7) / 4; // NW = 315 degrees
    } else {
      return 0; // N = 0 degrees
    }
  } else if (normalized.includes('south') || normalized.startsWith('s')) {
    if (normalized.includes('east') || normalized.endsWith('e')) {
      return (Math.PI * 3) / 4; // SE = 135 degrees
    } else if (normalized.includes('west') || normalized.endsWith('w')) {
      return (Math.PI * 5) / 4; // SW = 225 degrees
    } else {
      return Math.PI; // S = 180 degrees
    }
  } else if (normalized.includes('east') || normalized.startsWith('e')) {
    return Math.PI / 2; // E = 90 degrees
  } else if (normalized.includes('west') || normalized.startsWith('w')) {
    return (Math.PI * 3) / 2; // W = 270 degrees
  }

  // Default
  return 0;
}

/**
 * Save a parsed legal description to a parcel
 *
 * @param parsedDescription The parsed legal description
 * @param parcelId The ID of the parcel to update
 * @returns boolean indicating success
 */
export async function saveParsedDescription(
  parsedDescription: ParsedLegalDescription,
  parcelId: number
): Promise<boolean> {
  try {
    // This would be implemented to save the data to the database
    // For now, it's a placeholder that returns success
    return true;
  } catch (error) {
    console.error('Error saving parsed description:', error);
    return false;
  }
}

/**
 * Generate sample GeoJSON for testing when no coordinates are available
 */
export function generateSampleParcelGeometry(
  center: Coordinate,
  size: number = 0.01
): GeoJSON.Polygon {
  const halfSize = size / 2;

  // Create a simple square centered at the given coordinates
  return {
    type: 'Polygon',
    coordinates: [
      [
        [center.lng - halfSize, center.lat - halfSize],
        [center.lng + halfSize, center.lat - halfSize],
        [center.lng + halfSize, center.lat + halfSize],
        [center.lng - halfSize, center.lat + halfSize],
        [center.lng - halfSize, center.lat - halfSize], // Close the polygon
      ],
    ],
  };
}
