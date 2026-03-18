/**
 * LEV-087 - GIS Polygon Generation Utilities
 *
 * Utility functions for generating and rendering tax district boundary
 * polygons from coordinate data. Used by DistrictMap and ImmersiveDistrictMap.
 */

export interface BoundaryCoordinate {
  lng: number;
  lat: number;
}

export interface PolygonOptions {
  /** Number of sides for generated regular polygons (default 6) */
  sides?: number;
  /** Radius in coordinate units */
  radius?: number;
  /** Center point */
  center: BoundaryCoordinate;
  /** Rotation offset in radians */
  rotation?: number;
}

export interface RenderedBoundary {
  svgPath: string;
  viewBox: { minX: number; minY: number; width: number; height: number };
  centroid: BoundaryCoordinate;
}

/**
 * Generate a regular polygon with the given number of sides, centered at
 * the provided coordinate. Useful for placeholder district boundaries.
 */
export function generatePolygon(options: PolygonOptions): BoundaryCoordinate[] {
  const { sides = 6, radius = 1, center, rotation = 0 } = options;
  const coords: BoundaryCoordinate[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = rotation + (2 * Math.PI * i) / sides;
    coords.push({
      lng: center.lng + radius * Math.cos(angle),
      lat: center.lat + radius * Math.sin(angle),
    });
  }

  return coords;
}

/**
 * Convert an array of boundary coordinates into an SVG path string and
 * compute a bounding viewBox and centroid.
 */
export function renderDistrictBoundary(
  coordinates: BoundaryCoordinate[],
): RenderedBoundary {
  if (coordinates.length === 0) {
    return {
      svgPath: '',
      viewBox: { minX: 0, minY: 0, width: 0, height: 0 },
      centroid: { lng: 0, lat: 0 },
    };
  }

  // Build SVG path
  const pathParts = coordinates.map((c, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return `${cmd}${c.lng},${c.lat}`;
  });
  pathParts.push('Z');
  const svgPath = pathParts.join(' ');

  // Bounding box
  const lngs = coordinates.map((c) => c.lng);
  const lats = coordinates.map((c) => c.lat);
  const minX = Math.min(...lngs);
  const minY = Math.min(...lats);
  const width = Math.max(...lngs) - minX;
  const height = Math.max(...lats) - minY;

  // Centroid (simple average)
  const centroid: BoundaryCoordinate = {
    lng: coordinates.reduce((s, c) => s + c.lng, 0) / coordinates.length,
    lat: coordinates.reduce((s, c) => s + c.lat, 0) / coordinates.length,
  };

  return { svgPath, viewBox: { minX, minY, width, height }, centroid };
}
