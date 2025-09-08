/**
 * Legal Description Service
 * 
 * This service handles parsing and converting legal property descriptions
 * into GeoJSON features that can be displayed on a map.
 */

import { Feature } from 'geojson';
import { 
  ConfidenceLevel, 
  LegalDescriptionType, 
  parseLegalDescription 
} from '../../shared/legal-description-parser';

/**
 * Extended parsing result with additional metadata for the server
 */
export interface ServerParsingResult {
  type: LegalDescriptionType;
  confidence: ConfidenceLevel;
  feature?: Feature;
  errorMessage?: string;
  segments?: any[];
  referencePoint?: [number, number];
  rawText: string;
  processedAt: Date;
  processingTimeMs: number;
  userReference?: {
    parcelId?: string;
    coordinates?: [number, number];
  };
}

/**
 * Example legal description
 */
const EXAMPLE_DESCRIPTIONS = [
  {
    name: "Simple Metes and Bounds",
    description: "Commencing at the Northeast corner of Section 14, Township 4 North, Range 3 West; thence South 89°42'30\" West 210 feet; thence South 0°15' East 185 feet; thence North 89°42'30\" East 210 feet; thence North 0°15' West 185 feet to the point of beginning.",
    type: LegalDescriptionType.METES_AND_BOUNDS
  },
  {
    name: "Complex Metes and Bounds",
    description: "Beginning at a point which is 330 feet South of the Northwest corner of the Northeast Quarter of Section 22, Township 7 North, Range 2 East of the Salt Lake Base and Meridian; thence East 330 feet; thence South 165 feet; thence West 330 feet; thence North 165 feet to the point of beginning.",
    type: LegalDescriptionType.METES_AND_BOUNDS
  },
  {
    name: "Section Township Range",
    description: "The Northeast Quarter of the Southwest Quarter (NE¼ SW¼) of Section 32, Township 8 North, Range 4 West, Boise Meridian, Benton County, Washington, containing 40 acres, more or less.",
    type: LegalDescriptionType.SECTION_TOWNSHIP_RANGE
  },
  {
    name: "Lot and Block",
    description: "Lot 7, Block 12, WOODLAND HILLS SUBDIVISION, according to the official plat thereof, filed in Book 8 of Plats at Pages 10-12, records of Benton County, Washington.",
    type: LegalDescriptionType.LOT_BLOCK
  }
];

/**
 * Parse a legal description text
 */
export async function parseDescription(
  text: string, 
  referencePoint?: [number, number]
): Promise<ServerParsingResult> {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Call the shared parser
    const result = parseLegalDescription(text, referencePoint);
    
    // Calculate processing time
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;
    
    // Create the server result with additional metadata
    const serverResult: ServerParsingResult = {
      ...result,
      processedAt: new Date(),
      processingTimeMs
    };
    
    return serverResult;
  } catch (error) {
    console.error('Error parsing legal description:', error);
    return {
      type: LegalDescriptionType.UNKNOWN,
      confidence: ConfidenceLevel.LOW,
      errorMessage: error instanceof Error ? error.message : String(error),
      rawText: text,
      processedAt: new Date(),
      processingTimeMs: 0
    };
  }
}

/**
 * Get example legal descriptions for testing and demonstration
 */
export function getExampleDescriptions(): { description: string, type: LegalDescriptionType, name: string }[] {
  return EXAMPLE_DESCRIPTIONS;
}

/**
 * Analyze a legal description and provide insights without fully parsing it
 */
export function analyzeLegalDescription(text: string): {
  type: LegalDescriptionType;
  confidence: ConfidenceLevel;
  keywords: string[];
  patterns: string[];
} {
  const type = LegalDescriptionType.UNKNOWN;
  
  // Extract keywords from the text
  const keywords = extractKeywords(text);
  
  // Identify patterns in the text
  const patterns = identifyPatterns(text, type);
  
  // Assess confidence based on the patterns
  const confidence = assessConfidence(text, type, patterns);
  
  return {
    type,
    confidence,
    keywords,
    patterns
  };
}

/**
 * Extract key terminology from legal description
 */
function extractKeywords(text: string): string[] {
  const keywordsArray = [];
  
  // Extract direction terms
  const directions = text.match(/north|south|east|west|N\s|S\s|E\s|W\s|N\d|S\d|E\d|W\d/gi) || [];
  keywordsArray.push(...directions);
  
  // Extract numeric values
  const numbers = text.match(/\d+\.?\d*\s*(feet|foot|ft|meters|m)/gi) || [];
  keywordsArray.push(...numbers);
  
  // Extract section/township/range terms
  const sectionTerms = text.match(/section|township|range|quarter|NE¼|NW¼|SE¼|SW¼|meridian/gi) || [];
  keywordsArray.push(...sectionTerms);
  
  // Extract lot/block terms
  const lotTerms = text.match(/lot\s+\d+|block\s+\d+|subdivision|addition|plat/gi) || [];
  keywordsArray.push(...lotTerms);
  
  // Remove duplicates using a filter instead of Set
  return keywordsArray.filter((value, index, self) => 
    self.indexOf(value) === index
  );
}

/**
 * Identify potential patterns in the legal description text
 */
function identifyPatterns(text: string, type: LegalDescriptionType): string[] {
  const patterns = [];
  
  // Look for bearing patterns
  const bearingPatterns = text.match(/([NSEW])\s*(\d+)[°\s]*(\d*)['\s]*(\d*)["\s]*([NSEW])?/gi) || [];
  if (bearingPatterns.length > 0) {
    patterns.push('bearings');
  }
  
  // Look for distance patterns
  const distancePatterns = text.match(/\d+\.?\d*\s*(feet|foot|ft|meters|m)/gi) || [];
  if (distancePatterns.length > 0) {
    patterns.push('distances');
  }
  
  // Look for section patterns
  const sectionPatterns = text.match(/section\s+\d+/gi) || [];
  if (sectionPatterns.length > 0) {
    patterns.push('sections');
  }
  
  // Look for township patterns
  const townshipPatterns = text.match(/township\s+\d+\s*[NS]/gi) || [];
  if (townshipPatterns.length > 0) {
    patterns.push('townships');
  }
  
  // Look for range patterns
  const rangePatterns = text.match(/range\s+\d+\s*[EW]/gi) || [];
  if (rangePatterns.length > 0) {
    patterns.push('ranges');
  }
  
  // Look for lot patterns
  const lotPatterns = text.match(/lot\s+\d+/gi) || [];
  if (lotPatterns.length > 0) {
    patterns.push('lots');
  }
  
  // Look for block patterns
  const blockPatterns = text.match(/block\s+\d+/gi) || [];
  if (blockPatterns.length > 0) {
    patterns.push('blocks');
  }
  
  return patterns;
}

/**
 * Assess confidence level based on detected patterns
 */
function assessConfidence(text: string, type: LegalDescriptionType, patterns: string[]): ConfidenceLevel {
  // More patterns generally means higher confidence
  const patternCount = patterns.length;
  
  if (patternCount >= 4) {
    return ConfidenceLevel.HIGH;
  } else if (patternCount >= 2) {
    return ConfidenceLevel.MEDIUM;
  } else if (patternCount > 0) {
    return ConfidenceLevel.LOW;
  } else {
    return ConfidenceLevel.UNKNOWN;
  }
}