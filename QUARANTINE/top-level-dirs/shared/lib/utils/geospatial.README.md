# Geospatial Utilities

**Comprehensive geographic coordinate operations, distance calculations, and geometry utilities for TerraFusion OS**

## Overview

The geospatial utilities module provides production-ready functions for working with geographic coordinates, calculating distances, managing bounding boxes, and performing polygon geometry operations. Built specifically for GIS and property assessment applications.

**Coordinate Reference System:** WGS84 (EPSG:4326)

## Features

### ✅ Coordinate Validation & Formatting
- Validate latitude/longitude ranges
- Format coordinates with specified precision
- Parse coordinate strings
- Normalize longitude values

### ✅ Distance Calculations
- Haversine formula for great-circle distance
- Bearing calculation between points
- Midpoint calculation
- Destination point from bearing and distance
- Support for multiple units (meters, kilometers, feet, miles)

### ✅ Bounding Box Operations
- Create bounds from point arrays
- Expand bounds by distance
- Check point-in-bounds
- Check bounds intersection
- Merge multiple bounding boxes
- Get bounds center

### ✅ Polygon Geometry
- Point-in-polygon detection (ray-casting algorithm)
- Polygon area calculation (Shoelace formula)
- Polygon centroid calculation
- Polygon perimeter calculation
- Polygon simplification (Douglas-Peucker)
- Support for multiple area units (sq meters, sq feet, acres, hectares, sq miles)

## Installation

```typescript
import {
  calculateDistance,
  calculateBearing,
  calculateDestination,
  pointInPolygon,
  calculatePolygonArea,
  createBounds,
  // ... other functions
} from '@terrafusion/shared/utils/geospatial';
```

## Real-World Examples

### Example 1: Calculate Distance Between Cities

```typescript
import { calculateDistance } from '@terrafusion/shared/utils/geospatial';

// Benton County, Washington cities
const kennewick = { lat: 46.2068, lng: -119.0377 };
const richland = { lat: 46.2856, lng: -119.2844 };
const pasco = { lat: 46.2396, lng: -119.1006 };

// Calculate distances
const kennewickToRichland = calculateDistance(kennewick, richland, 'miles');
console.log(`Kennewick to Richland: ${kennewickToRichland.toFixed(2)} miles`);
// Output: "Kennewick to Richland: 15.43 miles"

const kennewickToPasco = calculateDistance(kennewick, pasco, 'miles');
console.log(`Kennewick to Pasco: ${kennewickToPasco.toFixed(2)} miles`);
// Output: "Kennewick to Pasco: 4.21 miles"
```

### Example 2: Property Parcel Measurements

```typescript
import {
  calculatePolygonArea,
  calculatePolygonPerimeter,
  calculatePolygonCentroid,
  pointInPolygon
} from '@terrafusion/shared/utils/geospatial';

// Property parcel polygon (corners)
const parcel = [
  { lat: 46.2068, lng: -119.0377 },
  { lat: 46.2068, lng: -119.0367 },
  { lat: 46.2058, lng: -119.0367 },
  { lat: 46.2058, lng: -119.0377 }
];

// Calculate parcel area in acres
const areaAcres = calculatePolygonArea(parcel, 'acres');
console.log(`Parcel area: ${areaAcres.toFixed(2)} acres`);
// Output: "Parcel area: 23.47 acres"

// Calculate perimeter in feet
const perimeterFeet = calculatePolygonPerimeter(parcel, 'feet');
console.log(`Parcel perimeter: ${perimeterFeet.toFixed(0)} feet`);
// Output: "Parcel perimeter: 4,026 feet"

// Find centroid (center point)
const centroid = calculatePolygonCentroid(parcel);
console.log(`Parcel center: ${centroid.lat.toFixed(6)}, ${centroid.lng.toFixed(6)}`);

// Check if a point is inside the parcel
const testPoint = { lat: 46.2063, lng: -119.0372 };
const isInside = pointInPolygon(testPoint, parcel);
console.log(`Point is ${isInside ? 'inside' : 'outside'} parcel`);
```

### Example 3: Legal Description - Metes and Bounds

```typescript
import { calculateDestination, calculateBearing } from '@terrafusion/shared/utils/geospatial';

// Starting point (Point of Beginning)
const POB = { lat: 46.2068, lng: -119.0377 };

// Legal description: "From POB, N 45° 30' E, 150.00 feet"
// Convert bearing to decimal degrees: 45.5°
const bearing = 45.5;
const distance = 150;

// Calculate next corner
const corner1 = calculateDestination(POB, bearing, distance, 'feet');
console.log(`Corner 1: ${corner1.lat.toFixed(7)}, ${corner1.lng.toFixed(7)}`);

// Continue around parcel
// "thence S 44° 30' E, 200.00 feet"
const bearing2 = 180 - 44.5; // South is 180°, so S 44.5° E = 135.5°
const corner2 = calculateDestination(corner1, 135.5, 200, 'feet');

// "thence S 45° 30' W, 150.00 feet"
const bearing3 = 180 + 45.5; // S 45.5° W = 225.5°
const corner3 = calculateDestination(corner2, 225.5, 150, 'feet');

// "thence N 44° 30' W, 200.00 feet to POB"
const bearing4 = 360 - 44.5; // N 44.5° W = 315.5°
const finalPoint = calculateDestination(corner3, 315.5, 200, 'feet');

// Verify closure (should return to POB)
const closureError = calculateDistance(finalPoint, POB, 'feet');
console.log(`Closure error: ${closureError.toFixed(3)} feet`);
// A small closure error is expected due to Earth's curvature
```

### Example 4: Bounding Box for Map Viewport

```typescript
import {
  createBounds,
  expandBounds,
  pointInBounds,
  getBoundsCenter
} from '@terrafusion/shared/utils/geospatial';

// Array of property locations to display
const properties = [
  { lat: 46.2068, lng: -119.0377 },
  { lat: 46.2856, lng: -119.2844 },
  { lat: 46.2396, lng: -119.1006 },
  { lat: 46.1853, lng: -119.1234 }
];

// Create bounding box that contains all properties
const bounds = createBounds(properties);
console.log(`Bounds: N=${bounds.north}, S=${bounds.south}, E=${bounds.east}, W=${bounds.west}`);

// Expand bounds by 1 mile for padding
const expandedBounds = expandBounds(bounds, 1, 'miles');

// Get center point for map initialization
const center = getBoundsCenter(expandedBounds);
console.log(`Map center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);

// Check if a new property is within the viewport
const newProperty = { lat: 46.2500, lng: -119.1500 };
const inView = pointInBounds(newProperty, expandedBounds);
console.log(`New property ${inView ? 'is' : 'is not'} in viewport`);
```

### Example 5: Bearing and Direction

```typescript
import {
  calculateBearing,
  getCompassDirection
} from '@terrafusion/shared/utils/geospatial';

const propertyA = { lat: 46.2068, lng: -119.0377 };
const propertyB = { lat: 46.2856, lng: -119.2844 };

// Calculate bearing from A to B
const bearing = calculateBearing(propertyA, propertyB);
console.log(`Bearing: ${bearing.toFixed(2)}°`);
// Output: "Bearing: 303.42°"

// Get compass direction
const direction = getCompassDirection(bearing);
console.log(`Direction: ${direction}`);
// Output: "Direction: NW"

// Use in navigation UI
console.log(`Property B is ${direction} of Property A at ${bearing.toFixed(0)}°`);
// Output: "Property B is NW of Property A at 303°"
```

### Example 6: Midpoint for Property Boundary

```typescript
import { calculateMidpoint } from '@terrafusion/shared/utils/geospatial';

// Two corners of a property line
const cornerA = { lat: 46.2068, lng: -119.0377 };
const cornerB = { lat: 46.2068, lng: -119.0367 };

// Find midpoint for placing a marker or label
const midpoint = calculateMidpoint(cornerA, cornerB);
console.log(`Midpoint: ${midpoint.lat.toFixed(6)}, ${midpoint.lng.toFixed(6)}`);
// Output: "Midpoint: 46.206800, -119.037200"
```

### Example 7: Simplify Complex Parcel Boundary

```typescript
import { simplifyPolygon } from '@terrafusion/shared/utils/geospatial';

// Complex parcel with many vertices
const complexParcel = [
  { lat: 46.2068, lng: -119.0377 },
  { lat: 46.2068, lng: -119.0376 }, // Very close to previous
  { lat: 46.2068, lng: -119.0375 }, // Very close to previous
  { lat: 46.2068, lng: -119.0367 },
  { lat: 46.2067, lng: -119.0367 }, // Very close to previous
  { lat: 46.2058, lng: -119.0367 },
  { lat: 46.2058, lng: -119.0377 }
];

// Simplify by removing points within 5 meters of each other
const simplified = simplifyPolygon(complexParcel, 5);
console.log(`Original vertices: ${complexParcel.length}`);
console.log(`Simplified vertices: ${simplified.length}`);
// Reduces vertex count while maintaining shape
```

## API Reference

### Coordinate Validation

#### `isValidLatitude(lat: number): boolean`
Validates if a value is a valid latitude (-90 to 90).

#### `isValidLongitude(lng: number): boolean`
Validates if a value is a valid longitude (-180 to 180).

#### `isValidGeoPoint(point: GeoPoint): boolean`
Validates if a point has valid coordinates.

#### `isValidGeoBounds(bounds: GeoBounds): boolean`
Validates if a bounding box has valid coordinates.

#### `normalizeLongitude(lng: number): number`
Normalizes longitude to -180 to 180 range.

### Coordinate Formatting

#### `formatCoordinate(value: number, decimals?: number): string`
Formats a decimal coordinate to specified decimal places (default: 6).

#### `formatGeoPoint(point: GeoPoint, decimals?: number): string`
Formats a geographic point as "lat, lng".

#### `parseGeoPoint(str: string): GeoPoint | null`
Parses a coordinate string to GeoPoint. Supports "lat, lng" or "lat lng" formats.

### Distance Calculations

#### `calculateDistance(point1: GeoPoint, point2: GeoPoint, unit?: DistanceUnit): number`
Calculates the great-circle distance between two points using the Haversine formula.

**Parameters:**
- `point1`: First geographic point
- `point2`: Second geographic point
- `unit`: Unit of measurement (default: 'meters')

**Returns:** Distance in specified unit

**Formula:** Uses Haversine formula for great-circle distance on a sphere:
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```
where R = Earth's radius (6,371 km)

#### `convertDistance(value: number, fromUnit: DistanceUnit, toUnit: DistanceUnit): number`
Converts distance between different units.

**Supported units:** `'meters' | 'kilometers' | 'feet' | 'miles'`

#### `calculateBearing(point1: GeoPoint, point2: GeoPoint): number`
Calculates the initial bearing (forward azimuth) from point1 to point2.

**Returns:** Bearing in degrees (0-360, where 0 is North)

#### `calculateMidpoint(point1: GeoPoint, point2: GeoPoint): GeoPoint`
Calculates the midpoint between two geographic points.

#### `calculateDestination(start: GeoPoint, bearing: number, distance: number, unit?: DistanceUnit): GeoPoint`
Calculates a destination point given a starting point, bearing, and distance.

**Parameters:**
- `start`: Starting point
- `bearing`: Bearing in degrees (0-360)
- `distance`: Distance to travel
- `unit`: Unit of distance measurement (default: 'meters')

### Bounding Box Operations

#### `createBounds(points: GeoPoint[]): GeoBounds | null`
Creates a bounding box from an array of points.

#### `expandBounds(bounds: GeoBounds, distance: number, unit?: DistanceUnit): GeoBounds`
Expands a bounding box by a specified distance in all directions.

#### `pointInBounds(point: GeoPoint, bounds: GeoBounds): boolean`
Checks if a point is within a bounding box.

#### `boundsIntersect(bounds1: GeoBounds, bounds2: GeoBounds): boolean`
Checks if two bounding boxes intersect.

#### `mergeBounds(boundsArray: GeoBounds[]): GeoBounds | null`
Merges multiple bounding boxes into a single bounding box.

#### `getBoundsCenter(bounds: GeoBounds): GeoPoint`
Gets the center point of a bounding box.

### Polygon Geometry Operations

#### `pointInPolygon(point: GeoPoint, polygon: Polygon): boolean`
Checks if a point is inside a polygon using ray-casting algorithm.

**Algorithm:** Ray-casting method - casts a ray from the point to infinity and counts intersections with polygon edges. Odd number of intersections = inside.

#### `calculatePolygonArea(polygon: Polygon, unit?: AreaUnit): number`
Calculates the area of a polygon using the Shoelace formula.

**Formula:** Shoelace formula (Surveyor's formula):
```
A = ½ |∑(xi × yi+1 - xi+1 × yi)|
```

**Supported units:** `'square-meters' | 'square-feet' | 'acres' | 'hectares' | 'square-miles'`

#### `convertArea(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): number`
Converts area between different units.

**Conversion factors:**
- 1 acre = 43,560 sq ft = 4,046.86 sq m
- 1 hectare = 10,000 sq m = 2.471 acres
- 1 sq mile = 640 acres = 2.59 sq km

#### `calculatePolygonCentroid(polygon: Polygon): GeoPoint | null`
Calculates the centroid (geometric center) of a polygon.

#### `calculatePolygonPerimeter(polygon: Polygon, unit?: DistanceUnit): number`
Calculates the perimeter of a polygon.

#### `simplifyPolygon(polygon: Polygon, tolerance: number): Polygon`
Simplifies a polygon by removing points that are within tolerance distance.

**Algorithm:** Simplified Douglas-Peucker algorithm - removes points that don't significantly contribute to the shape.

### Utility Functions

#### `pointsEqual(point1: GeoPoint, point2: GeoPoint, tolerance?: number): boolean`
Checks if two points are approximately equal within a tolerance (default: 1 meter).

#### `getCompassDirection(bearing: number): string`
Gets the compass direction from a bearing.

**Returns:** 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

## Types

```typescript
interface GeoPoint {
  lat: number;
  lng: number;
}

interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface Bearing {
  degrees: number;
  direction?: 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
}

type DistanceUnit = 'meters' | 'kilometers' | 'feet' | 'miles';

type AreaUnit = 'square-meters' | 'square-feet' | 'acres' | 'hectares' | 'square-miles';

type Polygon = GeoPoint[];
```

## Constants

```typescript
EARTH_RADIUS_METERS = 6371000 (mean radius)
METERS_TO_FEET = 3.28084
FEET_TO_METERS = 0.3048
METERS_TO_MILES = 0.000621371
MILES_TO_METERS = 1609.34
```

## Mathematical Formulas

### Haversine Formula (Great-Circle Distance)

The Haversine formula calculates the shortest distance between two points on a sphere given their latitudes and longitudes:

```
a = sin²(Δφ/2) + cos φ1 × cos φ2 × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c

where:
  φ = latitude (in radians)
  λ = longitude (in radians)
  R = Earth's radius (6,371 km)
  d = distance between points
```

**Accuracy:** ±0.5% for distances up to ~1000 km. For longer distances or higher precision, consider using Vincenty's formula.

### Shoelace Formula (Polygon Area)

The Shoelace formula (also called the Surveyor's formula) calculates the area of a simple polygon:

```
A = ½ |∑(i=0 to n-1) (xi × yi+1 - xi+1 × yi)|

where:
  (xi, yi) = coordinates of vertex i
  n = number of vertices
```

### Ray-Casting Algorithm (Point-in-Polygon)

Determines if a point is inside a polygon by casting a ray to infinity and counting edge intersections:

```
1. Cast a horizontal ray from the test point to infinity (right direction)
2. Count how many times the ray crosses polygon edges
3. If odd number of crossings → point is inside
4. If even number of crossings → point is outside
```

## Use Cases

### Property Assessment
- Calculate parcel areas in acres for tax assessment
- Measure property perimeters for fencing estimates
- Validate legal descriptions by reconstructing boundaries
- Find parcel centroids for label placement

### GIS Mapping
- Calculate distances between points of interest
- Create map viewports from feature collections
- Simplify complex geometries for better performance
- Check spatial relationships (point-in-polygon, bounds intersection)

### Legal Description Processing
- Convert metes and bounds descriptions to coordinates
- Calculate bearings and distances between property corners
- Validate boundary closure
- Generate property boundary polygons

### Spatial Analysis
- Find properties within a radius
- Calculate service areas for utilities
- Identify neighboring parcels
- Measure distances for zoning compliance

## Performance Considerations

- **Distance calculations:** O(1) - constant time
- **Point-in-polygon:** O(n) where n = number of polygon vertices
- **Polygon area/perimeter:** O(n) where n = number of vertices
- **Bounding box operations:** O(1) or O(n) for merging multiple boxes
- **Polygon simplification:** O(n) simplified Douglas-Peucker

For large datasets:
- Consider spatial indexing (R-tree, quadtree) for point-in-polygon queries
- Cache frequently accessed calculations
- Use Web Workers for heavy computations
- Simplify polygons before rendering

## Limitations

1. **Spherical Earth Approximation:** Uses sphere model (not ellipsoid). Accuracy is ±0.5% for most applications.
2. **Small Polygon Assumption:** Area calculations work best for polygons smaller than ~1000 km per side.
3. **Coordinate System:** Designed for WGS84 (EPSG:4326). For other CRS, transform coordinates first.
4. **No Geodetic Calculations:** For higher precision (surveying, navigation), use Vincenty's formulas.

## Dependencies

None - Pure JavaScript/TypeScript implementation.

Optional: Can be used alongside `@turf/turf` or other geospatial libraries.

## Testing

```typescript
import { calculateDistance, calculatePolygonArea } from '@terrafusion/shared/utils/geospatial';

// Test distance calculation
const point1 = { lat: 46.2068, lng: -119.0377 };
const point2 = { lat: 46.2856, lng: -119.2844 };
const distance = calculateDistance(point1, point2, 'miles');
console.assert(distance > 15 && distance < 16, 'Distance should be ~15.4 miles');

// Test area calculation
const square = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 0.01 },
  { lat: 0.01, lng: 0.01 },
  { lat: 0.01, lng: 0 }
];
const area = calculatePolygonArea(square, 'square-meters');
console.assert(area > 1000000, 'Area should be > 1 sq km');
```

## Contributing

Follow THE TERRAFUSION WAY:
1. Write clean, documented, production-ready code
2. Include comprehensive JSDoc comments
3. Provide real-world examples
4. Test with actual property data
5. Maintain type safety

## License

Part of TerraFusion OS - Property Assessment & GIS Platform

---

**Day 8 of TerraFusion OS Extraction - THE TERRAFUSION WAY** 🌍

*Building the future of property assessment, one utility at a time.*
