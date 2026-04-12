// TerraFusion OS — Field Studio IndexedDB Store (v2)
// Event-sourced offline queue with sync tracking, retry support, and queue stats.
// Harvested from terra-forge-rebuild — Supabase-free, pure browser storage.
// Upgrade from localStorage fieldStore to IndexedDB for larger payload support.

import { openDB, type IDBPDatabase } from "idb";
import type {
  FieldAssignment,
  FieldObservation,
  InspectionStatus,
} from "@/types/field";

const DB_NAME = "terrafield";
const DB_VERSION = 2;

export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export interface StoredObservation extends FieldObservation {
  syncError: string | null;
  syncedAt: string | null;
  syncAttempts: number;
  lastSyncAttempt: string | null;
}

// ── Database Init ──────────────────────────────────────────────────
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const aStore = db.createObjectStore("assignments", { keyPath: "id" });
          aStore.createIndex("by-status", "status");
          aStore.createIndex("by-parcel", "parcelId");
          const oStore = db.createObjectStore("observations", { keyPath: "id" });
          oStore.createIndex("by-assignment", "assignmentId");
          oStore.createIndex("by-sync", "syncStatus");
          oStore.createIndex("by-parcel", "parcelId");
        }
      },
    });
  }
  return dbPromise;
}

// ── Assignment Operations ──────────────────────────────────────────
export async function saveAssignment(assignment: FieldAssignment): Promise<void> {
  const db = await getDB();
  await db.put("assignments", assignment);
}

export async function saveAssignments(assignments: FieldAssignment[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("assignments", "readwrite");
  for (const a of assignments) {
    await tx.store.put(a);
  }
  await tx.done;
}

export async function getAssignments(status?: InspectionStatus): Promise<FieldAssignment[]> {
  const db = await getDB();
  if (status) {
    return db.getAllFromIndex("assignments", "by-status", status);
  }
  return db.getAll("assignments");
}

export async function getAssignment(id: string): Promise<FieldAssignment | undefined> {
  const db = await getDB();
  return db.get("assignments", id);
}

export async function updateAssignmentStatus(id: string, status: InspectionStatus): Promise<void> {
  const db = await getDB();
  const assignment = await db.get("assignments", id);
  if (assignment) {
    assignment.status = status;
    await db.put("assignments", assignment);
  }
}

// ── Observation Operations ─────────────────────────────────────────
export async function addObservation(
  obs: Omit<FieldObservation, "id" | "syncStatus">
): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const stored: StoredObservation = {
    ...obs,
    id,
    syncStatus: "pending",
    syncError: null,
    syncedAt: null,
    syncAttempts: 0,
    lastSyncAttempt: null,
  };
  await db.put("observations", stored);
  return id;
}

export async function getObservations(assignmentId: string): Promise<StoredObservation[]> {
  const db = await getDB();
  return db.getAllFromIndex("observations", "by-assignment", assignmentId);
}

export async function getPendingObservations(): Promise<StoredObservation[]> {
  const db = await getDB();
  return db.getAllFromIndex("observations", "by-sync", "pending");
}

export async function markObservationSynced(id: string): Promise<void> {
  const db = await getDB();
  const obs = await db.get("observations", id);
  if (obs) {
    obs.syncStatus = "synced";
    obs.syncedAt = new Date().toISOString();
    await db.put("observations", obs);
  }
}

export async function markObservationError(id: string, error: string): Promise<void> {
  const db = await getDB();
  const obs = await db.get("observations", id);
  if (obs) {
    obs.syncStatus = "error";
    obs.syncError = error;
    obs.syncAttempts = (obs.syncAttempts || 0) + 1;
    obs.lastSyncAttempt = new Date().toISOString();
    await db.put("observations", obs);
  }
}

export async function resetObservationForRetry(id: string): Promise<void> {
  const db = await getDB();
  const obs = await db.get("observations", id);
  if (obs) {
    obs.syncStatus = "pending";
    obs.syncError = null;
    await db.put("observations", obs);
  }
}

export async function getRetryableObservations(maxAttempts = 3): Promise<StoredObservation[]> {
  const db = await getDB();
  const errors: StoredObservation[] = await db.getAllFromIndex("observations", "by-sync", "error");
  return errors.filter((o) => (o.syncAttempts || 0) < maxAttempts);
}

// ── Queue Stats ────────────────────────────────────────────────────
export async function getQueueStats(): Promise<{
  pending: number;
  synced: number;
  error: number;
  total: number;
}> {
  const db = await getDB();
  const all: StoredObservation[] = await db.getAll("observations");
  return {
    pending: all.filter((o) => o.syncStatus === "pending").length,
    synced: all.filter((o) => o.syncStatus === "synced").length,
    error: all.filter((o) => o.syncStatus === "error").length,
    total: all.length,
  };
}
