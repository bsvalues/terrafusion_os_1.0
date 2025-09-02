/**
 * Legal Description Parser
 * 
 * This module parses different types of legal descriptions and converts them
 * into GeoJSON features that can be drawn on a map.
 */

import { Feature, Polygon, Point } from 'geojson';

/**
 * Type of legal description
 */
export enum LegalDescriptionType {
  METES_AND_BOUNDS = 'metes_and_bounds',
  SECTION_TOWNSHIP_RANGE = 'section_township_range',
  LOT_BLOCK = 'lot_block',
  UNKNOWN = 'unknown'
}

/**
 * Confidence level in the parsing result
 */
export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  UNKNOWN = 'unknown'
}

/**
 * Bearing information (direction)
 */
export interface Bearing {
  degrees: number;
  minutes?: number;
  seconds?: number;
}

/**
 * Metes and bounds segment
 */
export interface MetesBoundsSegment {
  startPoint?: [number, number]; // [longitude, latitude]
  bearing: Bearing;
  distance: number;
  unit: string; // 'feet', 'meters', etc.
}

/**
 * Parsing result interface
 */
export interface ParsingResult {
  type: LegalDescriptionType;
  confidence: ConfidenceLevel;
  feature?: Feature;
  errorMessage?: string;
  segments?: MetesBoundsSegment[];
  referencePoint?: [number, number]; // [longitude, latitude]
  rawText: string;
}

// Constants for unit conversion
const FEET_TO_METERS = 0.3048;
const METERS_TO_DEGREES_LAT = 1 / 111000; // Roughly 111 km per degree of latitude
const METERS_TO_DEGREES_LNG_EQUATOR = 1 / 111321; // At equator

/**
 * Detects the type of legal description based on the text
 */
export function detectDescriptionType(text: string): LegalDescriptionType {
  const lowerText = text.toLowerCase();
  
  // Check for metes and bounds indicators
  if (
    /beginning at|commencing at|point of beginning|thence|bearing|distance/i.test(text) &&
    /north|south|east|west|N\s|S\s|E\s|W\s|N\d|S\d|E\d|W\d|degrees|°/i.test(text) &&
    /feet|foot|ft|meters|m\s/i.test(text)
  ) {
    return LegalDescriptionType.METES_AND_BOUNDS;
  }
  
  // Check for section-township-range indicators
  if (
    /section|township|range|T\d+[NS]|R\d+[EW]/i.test(text) &&
    /quarter|NE|NW|SE|SW|½|1\/4|1\/2/i.test(text)
  ) {
    return LegalDescriptionType.SECTION_TOWNSHIP_RANGE;
  }
  
  // Check for lot and block indicators
  if (
    /lot\s+\d+/i.test(text) &&
    /block\s+\d+/i.test(text) &&
    /subdivision|addition|plat|according to|recorded/i.test(text)
  ) {
    return LegalDescriptionType.LOT_BLOCK;
  }
  
  // Default to unknown if no patterns match
  return LegalDescriptionType.UNKNOWN;
}

/**
 * Parse a directional bearing (e.g. "N 45° 30' 15" E")
 */
export function parseBearing(bearingText: string): Bearing | null {
  try {
    // Try to match a directional bearing pattern
    const match = bearingText.match(/([NSEW])\s*(\d+)[°\s]*(\d*)['\s]*(\d*)["\s]*([NSEW])?/i);
    
    if (!match) return null;
    
    const startDir = match[1].toUpperCase();
    const degrees = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    const seconds = match[4] ? parseInt(match[4], 10) : 0;
    const endDir = match[5] ? match[5].toUpperCase() : null;
    
    // Calculate the actual bearing angle
    let angle = degrees;
    
    if (startDir === 'N' && endDir === 'E') {
      angle = 90 - angle;
    } else if (startDir === 'S' && endDir === 'E') {
      angle = 90 + angle;
    } else if (startDir === 'S' && endDir === 'W') {
      angle = 270 - angle;
    } else if (startDir === 'N' && endDir === 'W') {
      angle = 270 + angle;
    } else if (startDir === 'E') {
      angle = 90;
    } else if (startDir === 'S') {
      angle = 180;
    } else if (startDir === 'W') {
      angle = 270;
    } else if (startDir === 'N') {
      angle = 0;
    }
    
    // Ensure the angle is between 0 and 360
    angle = angle % 360;
    
    return {
      degrees: angle,
      minutes,
      seconds
    };
  } catch (error) {
    console.error('Error parsing bearing:', error);
    return null;
  }
}

/**
 * Parse a distance with units (e.g. "100 feet")
 */
export function parseDistance(distanceText: string): { distance: number, unit: string } | null {
  try {
    // Try to match a distance pattern
    const match = distanceText.match(/(\d+\.?\d*)\s*(feet|foot|ft|meters|m|')/i);
    
    if (!match) return null;
    
    const distance = parseFloat(match[1]);
    let unit = match[2].toLowerCase();
    
    // Normalize unit
    if (unit === 'foot' || unit === "'" || unit === 'ft') {
      unit = 'feet';
    } else if (unit === 'm') {
      unit = 'meters';
    }
    
    return { distance, unit };
  } catch (error) {
    console.error('Error parsing distance:', error);
    return null;
  }
}

/**
 * Convert a metes and bounds segment to a point
 * Given a starting point, bearing, and distance
 */
export function calculateEndPoint(
  startPoint: [number, number],
  bearing: Bearing,
  distance: number,
  unit: string
): [number, number] {
  try {
    // Convert distance to meters if needed
    let distanceMeters = distance;
    if (unit === 'feet') {
      distanceMeters = distance * FEET_TO_METERS;
    }
    
    // Convert bearing to radians
    const bearingRad = (bearing.degrees * Math.PI) / 180;
    
    // Calculate the approximate longitude factor based on latitude
    const latFactor = Math.cos((startPoint[1] * Math.PI) / 180);
    
    // Calculate the change in latitude and longitude
    const metersToDegreesLng = METERS_TO_DEGREES_LNG_EQUATOR / latFactor;
    
    // Calculate the new latitude and longitude
    const deltaLat = distanceMeters * Math.cos(bearingRad) * METERS_TO_DEGREES_LAT;
    const deltaLng = distanceMeters * Math.sin(bearingRad) * metersToDegreesLng;
    
    // Calculate the new point
    const newLat = startPoint[1] + deltaLat;
    const newLng = startPoint[0] + deltaLng;
    
    return [newLng, newLat];
  } catch (error) {
    console.error('Error calculating end point:', error);
    throw new Error('Failed to calculate coordinate. Please check the bearing and distance values.');
  }
}

/**
 * Parse a metes and bounds description
 */
export function parseMetesBounds(text: string, referencePoint?: [number, number]): ParsingResult {
  try {
    if (!referencePoint) {
      return {
        type: LegalDescriptionType.METES_AND_BOUNDS,
        confidence: ConfidenceLevel.LOW,
        errorMessage: 'Reference point is required for metes and bounds parsing',
        rawText: text
      };
    }
    
    // Extract segments with regular expression
    const regex = /thence\s+([^;,\.]+)/gi;
    let match;
    
    const segments: MetesBoundsSegment[] = [];
    const points: [number, number][] = [referencePoint];
    
    // Current point starts at the reference point
    let currentPoint: [number, number] = [...referencePoint];
    
    // Use exec in a loop instead of matchAll for better compatibility
    while ((match = regex.exec(text)) !== null) {
      const segmentText = match[1];
      
      // Extract bearing
      const bearingMatch = segmentText.match(/([NSEW]\s*\d+[°\s]*\d*['\s]*\d*["\s]*[NSEW]?)/i);
      if (!bearingMatch) continue;
      
      const bearingText = bearingMatch[1];
      const bearing = parseBearing(bearingText);
      
      if (!bearing) continue;
      
      // Extract distance
      const distanceMatch = segmentText.match(/(\d+\.?\d*\s*(feet|foot|ft|meters|m|'))/i);
      if (!distanceMatch) continue;
      
      const distanceText = distanceMatch[1];
      const distance = parseDistance(distanceText);
      
      if (!distance) continue;
      
      // Create the segment
      const segment: MetesBoundsSegment = {
        startPoint: currentPoint,
        bearing,
        distance: distance.distance,
        unit: distance.unit
      };
      
      segments.push(segment);
      
      // Calculate the next point
      const nextPoint = calculateEndPoint(
        currentPoint,
        bearing,
        distance.distance,
        distance.unit
      );
      
      points.push(nextPoint);
      currentPoint = nextPoint;
    }
    
    // If we have multiple points, create a polygon feature
    let feature: Feature | undefined;
    
    if (points.length > 2) {
      // Close the polygon by adding the first point again
      points.push(points[0]);
      
      feature = {
        type: 'Feature',
        properties: {
          type: 'metes_and_bounds',
          name: 'Metes and Bounds Parcel'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [points]
        }
      };
    }
    
    // Set confidence based on the number of segments found
    let confidence = ConfidenceLevel.LOW;
    if (segments.length >= 3) {
      confidence = ConfidenceLevel.HIGH;
    } else if (segments.length > 0) {
      confidence = ConfidenceLevel.MEDIUM;
    }
    
    return {
      type: LegalDescriptionType.METES_AND_BOUNDS,
      confidence,
      feature,
      segments,
      referencePoint,
      rawText: text
    };
  } catch (error) {
    console.error('Error parsing metes and bounds:', error);
    return {
      type: LegalDescriptionType.METES_AND_BOUNDS,
      confidence: ConfidenceLevel.LOW,
      errorMessage: error instanceof Error ? error.message : String(error),
      rawText: text,
      referencePoint
    };
  }
}

/**
 * Parse a section-township-range description (stub implementation)
 */
function parseSectionTownshipRange(text: string): ParsingResult {
  // Note: This is a simplified implementation
  // A complete implementation would need to look up section coordinates
  
  return {
    type: LegalDescriptionType.SECTION_TOWNSHIP_RANGE,
    confidence: ConfidenceLevel.MEDIUM,
    errorMessage: 'Section-township-range parsing is not fully implemented',
    rawText: text
  };
}

/**
 * Parse a lot and block description (stub implementation)
 */
function parseLotBlock(text: string): ParsingResult {
  // Note: This is a simplified implementation
  // A complete implementation would need to look up lot and block coordinates
  
  return {
    type: LegalDescriptionType.LOT_BLOCK,
    confidence: ConfidenceLevel.MEDIUM,
    errorMessage: 'Lot and block parsing is not fully implemented',
    rawText: text
  };
}

/**
 * Main parsing function
 */
export function parseLegalDescription(text: string, referencePoint?: [number, number]): ParsingResult {
  try {
    // First, detect the type of legal description
    const type = detectDescriptionType(text);
    
    // Parse based on the detected type
    switch (type) {
      case LegalDescriptionType.METES_AND_BOUNDS:
        return parseMetesBounds(text, referencePoint);
      case LegalDescriptionType.SECTION_TOWNSHIP_RANGE:
        return parseSectionTownshipRange(text);
      case LegalDescriptionType.LOT_BLOCK:
        return parseLotBlock(text);
      default:
        return {
          type: LegalDescriptionType.UNKNOWN,
          confidence: ConfidenceLevel.LOW,
          errorMessage: 'Could not determine the type of legal description',
          rawText: text
        };
    }
  } catch (error) {
    console.error('Error parsing legal description:', error);
    return {
      type: LegalDescriptionType.UNKNOWN,
      confidence: ConfidenceLevel.LOW,
      errorMessage: error instanceof Error ? error.message : String(error),
      rawText: text
    };
  }
}