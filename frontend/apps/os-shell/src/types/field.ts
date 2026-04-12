// TerraFusion OS — Field Studio Types
// Domain types for field inspection workflow

export type InspectionStatus = "assigned" | "in_progress" | "completed" | "deferred";
export type ObservationType = "condition" | "quality" | "measurement" | "photo" | "note" | "anomaly";

export interface FieldAssignment {
  id: string;
  parcelId: string;
  parcelNumber: string;
  address: string;
  currentValue?: number;
  status: InspectionStatus;
  priority: "normal" | "high" | "rush";
  assignedAt: string;
  dueDate?: string;
  notes?: string;
}

export interface FieldObservation {
  id: string;
  assignmentId: string;
  parcelId: string;
  type: ObservationType;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  data: Record<string, unknown>;
  syncStatus: "pending" | "synced" | "error";
}

export interface FieldSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  queueStats: {
    total: number;
    pending: number;
    synced: number;
    error: number;
  };
  syncNow: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  label: string;
  timestamp: number;
}
