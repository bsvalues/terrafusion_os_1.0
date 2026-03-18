/**
 * Animated Map Types (BIV-170)
 * ===================================================================
 * TypeScript interfaces for the Atlas animated map system.
 * Covers map configuration, frame-based animation, layer styling,
 * heatmaps, and time-series playback.
 */

// ============================================================================
// GEOMETRY PRIMITIVES
// ============================================================================

/** A geographic point (longitude, latitude) */
export interface GeoPoint {
  lng: number;
  lat: number;
}

/** Axis-aligned bounding box: [west, south, east, north] */
export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** A closed polygon defined by an array of coordinate rings */
export interface Polygon {
  /** Outer ring and optional holes, each ring is an array of [lng, lat] tuples */
  rings: Array<Array<[number, number]>>;
}

// ============================================================================
// MAP LAYERS & STYLING
// ============================================================================

/** A renderable map layer */
export interface MapLayer {
  /** Layer identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Layer category for grouping in the layer panel */
  category: 'base' | 'overlay' | 'analysis' | 'annotation';
  /** Whether the layer is currently visible */
  visible: boolean;
  /** Opacity (0-1) */
  opacity: number;
  /** Render type */
  type: 'vector' | 'raster' | 'geojson' | 'heatmap' | 'cluster';
  /** Minimum zoom level at which the layer is shown */
  minZoom: number;
  /** Maximum zoom level at which the layer is shown */
  maxZoom: number;
  /** Source URL or inline data reference */
  source: string;
}

/** Visual style for a map layer */
export interface MapStyle {
  /** Fill color (CSS color string) */
  fillColor: string;
  /** Fill opacity (0-1) */
  fillOpacity: number;
  /** Stroke/border color */
  strokeColor: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Optional dash pattern [dash, gap] */
  dashArray?: [number, number];
  /** Label field name (property key from feature properties) */
  labelField?: string;
  /** Label font size in pixels */
  labelSize?: number;
}

/** Map interaction event */
export interface MapEvent {
  /** Event type */
  type: 'click' | 'hover' | 'moveend' | 'zoomend' | 'layerchange';
  /** Geographic coordinates of the event */
  lngLat: GeoPoint;
  /** Screen pixel coordinates */
  point: { x: number; y: number };
  /** Feature(s) at the event location, if any */
  features: Array<{
    layerId: string;
    featureId: string;
    properties: Record<string, unknown>;
  }>;
}

// ============================================================================
// COLOR & HEATMAP
// ============================================================================

/** A continuous color scale for thematic mapping */
export interface ColorScale {
  /** Scale identifier */
  id: string;
  /** Display name */
  name: string;
  /** Ordered color stops from low to high */
  stops: Array<{
    /** Normalized position (0-1) */
    position: number;
    /** CSS color string */
    color: string;
  }>;
  /** Value range the scale maps to */
  domain: { min: number; max: number };
}

/** Configuration for a heatmap layer */
export interface HeatmapConfig {
  /** Data property to use for intensity */
  weightField: string;
  /** Radius in pixels */
  radius: number;
  /** Intensity multiplier */
  intensity: number;
  /** Color scale to apply */
  colorScale: ColorScale;
  /** Minimum zoom at which individual points replace the heatmap */
  dissipateZoom: number;
}

// ============================================================================
// ANIMATION & TIME SERIES
// ============================================================================

/** A single frame in a map animation sequence */
export interface MapFrame {
  /** Frame index (0-based) */
  index: number;
  /** ISO timestamp this frame represents */
  timestamp: string;
  /** Human-readable label (e.g. "Jan 2025") */
  label: string;
  /** GeoJSON FeatureCollection for this frame */
  featureCollection: GeoJSON.FeatureCollection;
}

/** Configuration for an animated map */
export interface AnimatedMapConfig {
  /** Animation title */
  title: string;
  /** Frames to cycle through */
  frames: MapFrame[];
  /** Playback speed in milliseconds per frame */
  frameDurationMs: number;
  /** Whether animation should loop */
  loop: boolean;
  /** Whether to interpolate between frames */
  interpolate: boolean;
  /** Base map layers to show under the animation */
  baseLayers: MapLayer[];
  /** Color scale for the animated data */
  colorScale: ColorScale;
}

/** A data overlay that shows trends over time on the map */
export interface TrendOverlay {
  /** Overlay identifier */
  id: string;
  /** Display name */
  name: string;
  /** Property field driving the overlay */
  dataField: string;
  /** Color scale for rendering */
  colorScale: ColorScale;
  /** Aggregation method for multi-parcel areas */
  aggregation: 'mean' | 'median' | 'sum' | 'count' | 'min' | 'max';
  /** Geographic granularity */
  granularity: 'parcel' | 'neighborhood' | 'district' | 'county';
}

/** A single frame in a time-series playback sequence */
export interface TimeSeriesFrame {
  /** ISO timestamp */
  timestamp: string;
  /** Human-readable period label */
  label: string;
  /** Data values keyed by geographic unit (parcel ID, neighborhood code, etc.) */
  values: Record<string, number>;
  /** Summary statistics for this frame */
  summary: {
    min: number;
    max: number;
    mean: number;
    median: number;
    count: number;
  };
}
