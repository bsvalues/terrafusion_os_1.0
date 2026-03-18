/**
 * SegmentDiscovery Fixtures
 * ===================================================================
 * Fallback data for the Forge Segment Discovery Dashboard.
 * Auto-discovered market segment clusters — Benton County WA patterns.
 * Used when backend segment-discovery API is unavailable.
 */

// ============================================================================
// Types
// ============================================================================

export interface DiscoveredSegment {
  id: string;
  name: string;
  parcelCount: number;
  medianValue: number;
  avgSqft: number;
  avgAge: number;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  boundaryDescription: string;
  keyCharacteristics: string[];
}

// ============================================================================
// Fixtures
// ============================================================================

export const DISCOVERED_SEGMENTS_FIXTURE: DiscoveredSegment[] = [
  { id: 'd1', name: 'Cluster A: New Construction SFR', parcelCount: 312, medianValue: 425000, avgSqft: 2200, avgAge: 3, confidence: 0.92, status: 'pending', boundaryDescription: 'NE quadrant, north of Highway 240', keyCharacteristics: ['Built after 2022', '2000+ sqft', 'Quality Grade: Good+'] },
  { id: 'd2', name: 'Cluster B: Historic Downtown', parcelCount: 178, medianValue: 285000, avgSqft: 1450, avgAge: 65, confidence: 0.87, status: 'pending', boundaryDescription: 'Downtown core, within 0.5mi of Main St', keyCharacteristics: ['Pre-1970 construction', 'Mixed use zone', 'Walkable area'] },
  { id: 'd3', name: 'Cluster C: Rural Large Lot', parcelCount: 524, medianValue: 195000, avgSqft: 1600, avgAge: 28, confidence: 0.78, status: 'accepted', boundaryDescription: 'South county, lots > 2 acres', keyCharacteristics: ['Lot > 2 acres', 'Agricultural proximity', 'Well/septic'] },
  { id: 'd4', name: 'Cluster D: Waterfront Premium', parcelCount: 67, medianValue: 680000, avgSqft: 2800, avgAge: 18, confidence: 0.95, status: 'pending', boundaryDescription: 'Columbia River frontage, 500ft buffer', keyCharacteristics: ['Water access', 'View premium', 'Higher quality grade'] },
  { id: 'd5', name: 'Cluster E: Commercial Corridor', parcelCount: 143, medianValue: 520000, avgSqft: 4500, avgAge: 22, confidence: 0.81, status: 'rejected', boundaryDescription: 'Along US-395, commercial zoning', keyCharacteristics: ['Commercial zone', 'High traffic', 'Strip mall proximity'] },
];
