// TerraFusion OS — Sketch Module Types
// Harvested from terra-forge-rebuild, adapted for OS shell
// Governs all sketch observation payloads with provenance + confidence

// ── Measurement Method Provenance ──────────────────────────────────
export type MeasurementMethod =
  | "manual_entry"       // typed by appraiser
  | "ar_measure"         // AR tape / IMU
  | "lidar_mesh"         // LiDAR scan
  | "room_plan"          // Apple RoomPlan
  | "plan_trace_vector"  // traced from vector PDF
  | "plan_trace_raster"  // traced from raster/scanned PDF
  | "pencil_draw";       // freehand Apple Pencil

export type ConfidenceLevel = "high" | "medium" | "low";

export type SketchMode = "measurement" | "sketch" | "plan_trace";

// ── Wall Segment ──────────────────────────────────────────────────
export interface WallSegment {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;         // in feet
  method: MeasurementMethod;
  locked: boolean;        // appraiser override
  estimated: boolean;     // flagged as estimate
  label?: string;
}

// ── Component Area ────────────────────────────────────────────────
export type ComponentType =
  | "living"
  | "garage"
  | "porch"
  | "deck"
  | "basement"
  | "attic"
  | "outbuilding"
  | "carport"
  | "screened_porch"
  | "other";

export interface ComponentArea {
  id: string;
  type: ComponentType;
  label: string;
  polygon: { x: number; y: number }[];
  area: number;           // computed sqft
  floor?: number;         // floor level (1, 2, etc.)
}

// ── Plan Source Provenance ─────────────────────────────────────────
export type PlanSourceType =
  | "permit_packet"
  | "mls"
  | "builder"
  | "assessor_archive"
  | "autocad_export"
  | "other";

export type ScaleMethod =
  | "embedded"            // PDF has native scale
  | "scale_bar"           // user marked a printed scale bar
  | "two_point"           // user picked two known-distance points
  | "manual";             // user entered scale manually

export interface PlanProvenance {
  source: PlanSourceType;
  fileHash: string;       // SHA-256 of the source plan file
  scaleMethod: ScaleMethod;
  scaleValue: number;     // pixels per foot
  scaleUnit: "feet" | "meters";
}

// ── Sketch Observation Payload ────────────────────────────────────
export interface SketchPayload {
  mode: SketchMode;
  buildingRef?: string;   // existing building ID if known

  // Geometry
  segments: WallSegment[];
  components: ComponentArea[];
  closedPolygon: boolean;

  // Derived metrics
  derivedGLA: number;     // gross living area (sqft)
  derivedPerimeter: number;
  componentBreakdown: Record<string, number>; // type -> sqft

  // Provenance
  method: MeasurementMethod;
  deviceModel?: string;
  confidence: ConfidenceLevel;
  confidenceReason?: string;

  // Plan-specific (Tier: Plan Trace)
  planProvenance?: PlanProvenance;

  // Artifacts
  previewImageBase64?: string;  // rendered PNG/SVG of sketch
  annotatedPhotos?: string[];   // photo IDs attached to sketch

  // QA
  glaDeltaFromRecord?: number;  // difference from canonical GLA
  glaDeltaPct?: number;         // percentage difference
  flaggedForReview: boolean;
}

// ── Sketch Canvas State (UI-only, not persisted) ──────────────────
export interface SketchCanvasState {
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;         // snap grid in pixels
  snapToGrid: boolean;
  snapToOrthogonal: boolean;
  activeToolId: SketchToolId;
  selectedSegmentId: string | null;
  selectedComponentId: string | null;
}

export type SketchToolId =
  | "select"
  | "wall"
  | "measure"
  | "erase"
  | "tag_component"
  | "pan"
  | "scale_set";

// ── Measurement Plan Types (Tier 0) ───────────────────────────────
export interface MeasurementEntry {
  id: string;
  side: "front" | "rear" | "left" | "right" | "custom";
  length: number;
  notes?: string;
  photoId?: string;      // linked photo observation
}

export interface MeasurementPlanPayload {
  measurements: MeasurementEntry[];
  footprintShape: "rectangular" | "l_shape" | "t_shape" | "custom";
  estimatedArea: number;
  notes: string;
  confidence: ConfidenceLevel;
  method: MeasurementMethod;
}
