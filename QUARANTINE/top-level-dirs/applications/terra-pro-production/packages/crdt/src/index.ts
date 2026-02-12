import * as Y from "yjs";
import { syncedStore, getYjsDoc } from "@syncedstore/core";

// Define the store interfaces for our application
export interface ParcelStore {
  notes: string;
}

export interface PhotoStore {
  metadata: {
    [key: string]: PhotoMetadata;
  };
}

// Interface for the parcel note data
export interface ParcelNote {
  parcelId: string;
  text: string;
  lastUpdated: string;
  version: number;
}

export interface PhotoMetadata {
  id: string;
  reportId: string;
  photoType: string;
  url: string;
  caption: string;
  dateTaken: string;
  latitude: number | null;
  longitude: number | null;
  isOffline: boolean;
  localPath?: string;
  status: "pending" | "syncing" | "synced" | "error";
  errorMessage?: string;
  lastSyncAttempt?: string;
}

/**
 * Creates a CRDT-enabled store for parcel notes
 * @param parcelId The unique identifier for the parcel
 * @returns A synchronized store with CRDT capabilities
 */
export function createParcelStore(parcelId: string) {
  // Create a synced store with a notes field
  const store = syncedStore<ParcelStore>({ notes: "" });

  // Get the underlying Yjs document
  const doc = getYjsDoc(store);

  // Set the clientID to ensure consistent merges
  doc.clientID = generateClientId(parcelId);

  return {
    store,
    doc,
  };
}

/**
 * Creates a CRDT-enabled store for photos
 * @param reportId The unique identifier for the appraisal report
 * @returns A synchronized store with CRDT capabilities for photos
 */
export function createPhotoStore(reportId: string) {
  // Create a synced store with a metadata map
  const store = syncedStore<PhotoStore>({
    metadata: {},
  });

  // Get the underlying Yjs document
  const doc = getYjsDoc(store);

  // Set the clientID to ensure consistent merges
  doc.clientID = generateClientId(reportId);

  return {
    store,
    doc,
  };
}

/**
 * Generates a deterministic client ID based on ID string
 * This helps with consistent conflict resolution
 */
function generateClientId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Encodes a Yjs document update as a Base64 string
 * @param doc The Yjs document
 * @returns Base64 encoded update
 */
export function encodeDocUpdate(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return Buffer.from(update).toString("base64");
}

/**
 * Decodes a Base64 encoded update and applies it to a Yjs document
 * @param doc The target Yjs document
 * @param base64Update The Base64 encoded update
 */
export function applyEncodedUpdate(doc: Y.Doc, base64Update: string): void {
  const update = Buffer.from(base64Update, "base64");
  Y.applyUpdate(doc, update);
}

/**
 * Merges an encoded update into a document and returns the new state
 * @param doc The target Yjs document
 * @param base64Update The Base64 encoded update to merge
 * @returns The Base64 encoded state after merge
 */
export function mergeUpdates(doc: Y.Doc, base64Update: string): string {
  applyEncodedUpdate(doc, base64Update);
  return encodeDocUpdate(doc);
}

/**
 * Adds a photo to the photo store
 * @param store The photo store to add to
 * @param metadata The photo metadata to add
 */
export function addPhoto(store: PhotoStore, metadata: PhotoMetadata): void {
  store.metadata[metadata.id] = {
    ...metadata,
    status: metadata.isOffline ? "pending" : "synced",
  };
}

/**
 * Updates a photo's metadata in the store
 * @param store The photo store to update
 * @param id The photo ID to update
 * @param updates Partial metadata updates
 */
export function updatePhotoMetadata(
  store: PhotoStore,
  id: string,
  updates: Partial<PhotoMetadata>
): void {
  if (store.metadata[id]) {
    store.metadata[id] = {
      ...store.metadata[id],
      ...updates,
    };
  }
}

/**
 * Removes a photo from the store
 * @param store The photo store
 * @param id The photo ID to remove
 */
export function removePhoto(store: PhotoStore, id: string): void {
  if (store.metadata[id]) {
    delete store.metadata[id];
  }
}

/**
 * Gets all photos from a store
 * @param store The photo store
 * @returns Array of photo metadata
 */
export function getAllPhotos(store: PhotoStore): PhotoMetadata[] {
  return Object.values(store.metadata);
}

/**
 * Gets all pending photos that need to be synced
 * @param store The photo store
 * @returns Array of pending photo metadata
 */
export function getPendingPhotos(store: PhotoStore): PhotoMetadata[] {
  return Object.values(store.metadata).filter(
    (photo) => photo.status === "pending" || photo.status === "error"
  );
}

/**
 * Creates a new Y.Doc for parcel notes
 * @param parcelId The unique identifier for the parcel
 * @returns A Y.Doc instance initialized for parcel notes
 */
export function createParcelDoc(parcelId: string): Y.Doc {
  const doc = new Y.Doc();

  // Set the clientID to ensure consistent merges
  doc.clientID = generateClientId(parcelId);

  // Initialize with empty note data
  const noteData: ParcelNote = {
    parcelId,
    text: "",
    lastUpdated: new Date().toISOString(),
    version: 1,
  };

  // Store the note data in the Y.Doc
  const ymap = doc.getMap("note");
  ymap.set("parcelId", parcelId);
  ymap.set("text", "");
  ymap.set("lastUpdated", new Date().toISOString());
  ymap.set("version", 1);

  return doc;
}

/**
 * Gets the parcel note data from a Y.Doc
 * @param doc The Y.Doc containing parcel note data
 * @returns The parcel note data
 */
export function getParcelNoteData(doc: Y.Doc): ParcelNote {
  const ymap = doc.getMap("note");

  return {
    parcelId: ymap.get("parcelId") as string,
    text: ymap.get("text") as string,
    lastUpdated: ymap.get("lastUpdated") as string,
    version: ymap.get("version") as number,
  };
}

/**
 * Updates the parcel note data in a Y.Doc
 * @param doc The Y.Doc to update
 * @param updates The updates to apply
 */
export function updateParcelNoteData(doc: Y.Doc, updates: Partial<ParcelNote>): void {
  const ymap = doc.getMap("note");

  // Apply updates
  if (updates.text !== undefined) {
    ymap.set("text", updates.text);
  }

  // Always update these fields
  ymap.set("lastUpdated", new Date().toISOString());
  ymap.set("version", (ymap.get("version") as number) + 1);
}
