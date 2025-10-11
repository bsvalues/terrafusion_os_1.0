/**
 * Comprehensive Geospatial Utilities for TerraFusion OS
 * 
 * Provides coordinate operations, distance calculations, bounding boxes,
 * and geometry utilities for GIS and property assessment applications.
 * 
 * Based on WGS84 (EPSG:4326) coordinate reference system.
 * 
 * @module utils/geospatial
 */

/**
 * Earth's radius in meters (mean radius)
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Conversion constants
 */
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;
const METERS_TO_FEET = 3.28084;
const FEET_TO_METERS = 0.3048;
const METERS_TO_MILES = 0.000621371;
const MILES_TO_METERS = 1609.34;

// =============================================================================
// Types
// =============================================================================

/**
 * Geographic coordinate point
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Geographic bounding box
 */
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Bearing direction
 */
export interface Bearing {
  degrees: number;
  direction?: 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
}

/**
 * Distance measurement units
 */
export type DistanceUnit = 'meters' | 'kilometers' | 'feet' | 'miles';

/**
 * Area measurement units
 */
export type AreaUnit = 'square-meters' | 'square-feet' | 'acres' | 'hectares' | 'square-miles';

/**
 * Polygon represented as array of points
 */
export type Polygon = GeoPoint[];

// =============================================================================
// Coordinate Validation
// =============================================================================

/**
 * Validates if a value is a valid latitude (-90 to 90)
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates if a value is a valid longitude (-180 to 180)
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validates if a point has valid coordinates
 */
export function isValidGeoPoint(point: GeoPoint): boolean {
  return isValidLatitude(point.lat) && isValidLongitude(point.lng);
}

/**
 * Validates if a bounding box has valid coordinates
 */
export function isValidGeoBounds(bounds: GeoBounds): boolean {
  return (
    isValidLatitude(bounds.north) &&
    isValidLatitude(bounds.south) &&
    isValidLongitude(bounds.east) &&
    isValidLongitude(bounds.west) &&
    bounds.north >= bounds.south
  );
}

/**
 * Normalizes longitude to -180 to 180 range
 */
export function normalizeLongitude(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

// =============================================================================
// Coordinate Formatting
// =============================================================================

/**
 * Formats a decimal coordinate to specified decimal places
 */
export function formatCoordinate(value: number, decimals: number = 6): string {
  return value.toFixed(decimals);
}

/**
 * Formats a geographic point as "lat, lng"
 */
export function formatGeoPoint(point: GeoPoint, decimals: number = 6): string {
  return `${formatCoordinate(point.lat, decimals)}, ${formatCoordinate(point.lng, decimals)}`;
}

/**
 * Parses a coordinate string to GeoPoint
 * Supports formats: "lat, lng" or "lat lng"
 */
export function parseGeoPoint(str: string): GeoPoint | null {
  const parts = str.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;
  
  return { lat, lng };
}

// =============================================================================
// Distance Calculations
// =============================================================================

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * DEGREES_TO_RADIANS;
}

/**
 * Converts radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * RADIANS_TO_DEGREES;
}

/**
 * Calculates the great-circle distance between two points using the Haversine formula
 * 
 * @param point1 - First geographic point
 * @param point2 - Second geographic point
 * @param unit - Unit of measurement (default: meters)
 * @returns Distance between points in specified unit
 * 
 * @example
 * const kennewick = { lat: 46.2068, lng: -119.0377 };
 * const richland = { lat: 46.2856, lng: -119.2844 };
 * const distance = calculateDistance(kennewick, richland, 'miles');
 * // Returns approximately 15.4 miles
 */
export function calculateDistance(
  point1: GeoPoint,
  point2: GeoPoint,
  unit: DistanceUnit = 'meters'
): number {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = EARTH_RADIUS_METERS * c;

  return convertDistance(distanceMeters, 'meters', unit);
}

/**
 * Converts distance between different units
 */
export function convertDistance(
  value: number,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit
): number {
  if (fromUnit === toUnit) return value;

  // Convert to meters first
  let meters: number;
  switch (fromUnit) {
    case 'meters':
      meters = value;
      break;
    case 'kilometers':
      meters = value * 1000;
      break;
    case 'feet':
      meters = value * FEET_TO_METERS;
      break;
    case 'miles':
      meters = value * MILES_TO_METERS;
      break;
  }

  // Convert from meters to target unit
  switch (toUnit) {
    case 'meters':
      return meters;
    case 'kilometers':
      return meters / 1000;
    case 'feet':
      return meters * METERS_TO_FEET;
    case 'miles':
      return meters * METERS_TO_MILES;
  }
}

/**
 * Calculates the initial bearing (forward azimuth) from point1 to point2
 * 
 * @param point1 - Starting point
 * @param point2 - Ending point
 * @returns Bearing in degrees (0-360, where 0 is North)
 * 
 * @example
 * const start = { lat: 46.2068, lng: -119.0377 };
 * const end = { lat: 46.2856, lng: -119.2844 };
 * const bearing = calculateBearing(start, end);
 * // Returns approximately 303 degrees (NW)
 */
export function calculateBearing(point1: GeoPoint, point2: GeoPoint): number {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = toDegrees(bearingRad);

  // Normalize to 0-360
  return (bearingDeg + 360) % 360;
}

/**
 * Calculates the midpoint between two geographic points
 * 
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Midpoint between the two points
 */
export function calculateMidpoint(point1: GeoPoint, point2: GeoPoint): GeoPoint {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const lng1Rad = toRadians(point1.lng);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const bx = Math.cos(lat2Rad) * Math.cos(deltaLng);
  const by = Math.cos(lat2Rad) * Math.sin(deltaLng);

  const lat3Rad = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + bx) * (Math.cos(lat1Rad) + bx) + by * by)
  );
  const lng3Rad = lng1Rad + Math.atan2(by, Math.cos(lat1Rad) + bx);

  return {
    lat: toDegrees(lat3Rad),
    lng: normalizeLongitude(toDegrees(lng3Rad))
  };
}

/**
 * Calculates a destination point given a starting point, bearing, and distance
 * 
 * @param start - Starting point
 * @param bearing - Bearing in degrees (0-360)
 * @param distance - Distance to travel
 * @param unit - Unit of distance measurement
 * @returns Destination point
 * 
 * @example
 * // From parcel corner, go N 45° E for 150 feet
 * const start = { lat: 46.2068, lng: -119.0377 };
 * const destination = calculateDestination(start, 45, 150, 'feet');
 */
export function calculateDestination(
  start: GeoPoint,
  bearing: number,
  distance: number,
  unit: DistanceUnit = 'meters'
): GeoPoint {
  const distanceMeters = convertDistance(distance, unit, 'meters');
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearingRad = toRadians(bearing);
  const lat1Rad = toRadians(start.lat);
  const lng1Rad = toRadians(start.lng);

  const lat2Rad = Math.asin(
    Math.sin(lat1Rad) * Math.cos(angularDistance) +
    Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lng2Rad = lng1Rad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1Rad),
    Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
  );

  return {
    lat: toDegrees(lat2Rad),
    lng: normalizeLongitude(toDegrees(lng2Rad))
  };
}

// =============================================================================
// Bounding Box Operations
// =============================================================================

/**
 * Creates a bounding box from an array of points
 * 
 * @param points - Array of geographic points
 * @returns Bounding box containing all points
 */
export function createBounds(points: GeoPoint[]): GeoBounds | null {
  if (points.length === 0) return null;

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  for (const point of points) {
    if (!isValidGeoPoint(point)) continue;
    north = Math.max(north, point.lat);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lng);
    west = Math.min(west, point.lng);
  }

  return { north, south, east, west };
}

/**
 * Expands a bounding box by a specified distance in all directions
 * 
 * @param bounds - Original bounding box
 * @param distance - Distance to expand
 * @param unit - Unit of distance measurement
 * @returns Expanded bounding box
 */
export function expandBounds(
  bounds: GeoBounds,
  distance: number,
  unit: DistanceUnit = 'meters'
): GeoBounds {
  const distanceMeters = convertDistance(distance, unit, 'meters');
  
  // Approximate degrees per meter at different latitudes
  const latDelta = distanceMeters / 111000; // ~111km per degree latitude
  
  // Longitude delta varies by latitude - use center latitude
  const centerLat = (bounds.north + bounds.south) / 2;
  const lngDelta = distanceMeters / (111000 * Math.cos(toRadians(centerLat)));

  return {
    north: Math.min(90, bounds.north + latDelta),
    south: Math.max(-90, bounds.south - latDelta),
    east: normalizeLongitude(bounds.east + lngDelta),
    west: normalizeLongitude(bounds.west - lngDelta)
  };
}

/**
 * Checks if a point is within a bounding box
 * 
 * @param point - Geographic point to check
 * @param bounds - Bounding box
 * @returns True if point is within bounds
 */
export function pointInBounds(point: GeoPoint, bounds: GeoBounds): boolean {
  return (
    point.lat >= bounds.south &&
    point.lat <= bounds.north &&
    point.lng >= bounds.west &&
    point.lng <= bounds.east
  );
}

/**
 * Checks if two bounding boxes intersect
 * 
 * @param bounds1 - First bounding box
 * @param bounds2 - Second bounding box
 * @returns True if bounding boxes intersect
 */
export function boundsIntersect(bounds1: GeoBounds, bounds2: GeoBounds): boolean {
  return !(
    bounds1.south > bounds2.north ||
    bounds1.north < bounds2.south ||
    bounds1.west > bounds2.east ||
    bounds1.east < bounds2.west
  );
}

/**
 * Merges multiple bounding boxes into a single bounding box
 * 
 * @param boundsArray - Array of bounding boxes
 * @returns Merged bounding box containing all input boxes
 */
export function mergeBounds(boundsArray: GeoBounds[]): GeoBounds | null {
  if (boundsArray.length === 0) return null;

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  for (const bounds of boundsArray) {
    if (!isValidGeoBounds(bounds)) continue;
    north = Math.max(north, bounds.north);
    south = Math.min(south, bounds.south);
    east = Math.max(east, bounds.east);
    west = Math.min(west, bounds.west);
  }

  return { north, south, east, west };
}

/**
 * Gets the center point of a bounding box
 * 
 * @param bounds - Bounding box
 * @returns Center point of the bounding box
 */
export function getBoundsCenter(bounds: GeoBounds): GeoPoint {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
}

// =============================================================================
// Polygon Geometry Operations
// =============================================================================

/**
 * Checks if a point is inside a polygon using ray-casting algorithm
 * 
 * @param point - Point to check
 * @param polygon - Polygon as array of points
 * @returns True if point is inside polygon
 * 
 * @example
 * const parcel = [
 *   { lat: 46.2068, lng: -119.0377 },
 *   { lat: 46.2068, lng: -119.0367 },
 *   { lat: 46.2058, lng: -119.0367 },
 *   { lat: 46.2058, lng: -119.0377 }
 * ];
 * const point = { lat: 46.2063, lng: -119.0372 };
 * const inside = pointInPolygon(point, parcel); // true
 */
export function pointInPolygon(point: GeoPoint, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculates the area of a polygon using the Shoelace formula
 * 
 * @param polygon - Polygon as array of points
 * @param unit - Unit of area measurement
 * @returns Area of polygon in specified unit
 * 
 * @example
 * const parcel = [
 *   { lat: 46.2068, lng: -119.0377 },
 *   { lat: 46.2068, lng: -119.0367 },
 *   { lat: 46.2058, lng: -119.0367 },
 *   { lat: 46.2058, lng: -119.0377 }
 * ];
 * const area = calculatePolygonArea(parcel, 'acres');
 */
export function calculatePolygonArea(
  polygon: Polygon,
  unit: AreaUnit = 'square-meters'
): number {
  if (polygon.length < 3) return 0;

  let areaSquareMeters = 0;

  // Shoelace formula using latitude/longitude
  // Note: This is an approximation that works for small polygons
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const lat1 = toRadians(polygon[i].lat);
    const lat2 = toRadians(polygon[j].lat);
    const lng1 = toRadians(polygon[i].lng);
    const lng2 = toRadians(polygon[j].lng);

    areaSquareMeters += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  areaSquareMeters = Math.abs(areaSquareMeters * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS / 2);

  return convertArea(areaSquareMeters, 'square-meters', unit);
}

/**
 * Converts area between different units
 */
export function convertArea(
  value: number,
  fromUnit: AreaUnit,
  toUnit: AreaUnit
): number {
  if (fromUnit === toUnit) return value;

  // Convert to square meters first
  let squareMeters: number;
  switch (fromUnit) {
    case 'square-meters':
      squareMeters = value;
      break;
    case 'square-feet':
      squareMeters = value / 10.7639;
      break;
    case 'acres':
      squareMeters = value / 0.000247105;
      break;
    case 'hectares':
      squareMeters = value / 0.0001;
      break;
    case 'square-miles':
      squareMeters = value / 0.000000386102;
      break;
  }

  // Convert from square meters to target unit
  switch (toUnit) {
    case 'square-meters':
      return squareMeters;
    case 'square-feet':
      return squareMeters * 10.7639;
    case 'acres':
      return squareMeters * 0.000247105;
    case 'hectares':
      return squareMeters * 0.0001;
    case 'square-miles':
      return squareMeters * 0.000000386102;
  }
}

/**
 * Calculates the centroid (geometric center) of a polygon
 * 
 * @param polygon - Polygon as array of points
 * @returns Centroid point of the polygon
 */
export function calculatePolygonCentroid(polygon: Polygon): GeoPoint | null {
  if (polygon.length === 0) return null;

  let latSum = 0;
  let lngSum = 0;
  let signedArea = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const a = xi * yj - xj * yi;
    signedArea += a;
    latSum += (yi + yj) * a;
    lngSum += (xi + xj) * a;
  }

  signedArea *= 0.5;
  const centroidLat = latSum / (6 * signedArea);
  const centroidLng = lngSum / (6 * signedArea);

  return {
    lat: centroidLat,
    lng: centroidLng
  };
}

/**
 * Calculates the perimeter of a polygon
 * 
 * @param polygon - Polygon as array of points
 * @param unit - Unit of distance measurement
 * @returns Perimeter of polygon in specified unit
 */
export function calculatePolygonPerimeter(
  polygon: Polygon,
  unit: DistanceUnit = 'meters'
): number {
  if (polygon.length < 2) return 0;

  let perimeter = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    perimeter += calculateDistance(polygon[i], polygon[j], 'meters');
  }

  return convertDistance(perimeter, 'meters', unit);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if two points are approximately equal within a tolerance
 * 
 * @param point1 - First point
 * @param point2 - Second point
 * @param tolerance - Tolerance in meters (default: 1 meter)
 * @returns True if points are within tolerance
 */
export function pointsEqual(
  point1: GeoPoint,
  point2: GeoPoint,
  tolerance: number = 1
): boolean {
  const distance = calculateDistance(point1, point2, 'meters');
  return distance <= tolerance;
}

/**
 * Gets the compass direction from a bearing
 * 
 * @param bearing - Bearing in degrees (0-360)
 * @returns Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
export function getCompassDirection(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360;
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  
  return directions[index];
}

/**
 * Simplifies a polygon by removing points that are within tolerance
 * Uses Douglas-Peucker algorithm simplified for coordinate lists
 * 
 * @param polygon - Polygon to simplify
 * @param tolerance - Simplification tolerance in meters
 * @returns Simplified polygon
 */
export function simplifyPolygon(polygon: Polygon, tolerance: number = 1): Polygon {
  if (polygon.length < 3) return polygon;

  const simplified: Polygon = [polygon[0]];

  for (let i = 1; i < polygon.length - 1; i++) {
    const distance = calculateDistance(simplified[simplified.length - 1], polygon[i], 'meters');
    if (distance > tolerance) {
      simplified.push(polygon[i]);
    }
  }

  simplified.push(polygon[polygon.length - 1]);

  return simplified;
}
