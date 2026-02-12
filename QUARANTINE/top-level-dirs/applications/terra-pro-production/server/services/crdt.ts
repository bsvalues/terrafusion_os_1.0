/**
 * CRDT Service
 *
 * Handles Conflict-free Replicated Data Types (CRDT) for collaborative editing
 */
import * as Y from "yjs";
import { encodeStateAsUpdate, encodeStateVector, mergeUpdates } from "yjs";

// Store for CRDT documents
const docStore = new Map<string, Y.Doc>();

/**
 * Get or create a YDoc for a specific document ID
 */
export const getOrCreateDoc = (docId: string): Y.Doc => {
  if (!docStore.has(docId)) {
    const doc = new Y.Doc();
    docStore.set(docId, doc);
    return doc;
  }

  return docStore.get(docId)!;
};

/**
 * Get document data as JSON
 */
export const getDocData = (docId: string): object => {
  const doc = getOrCreateDoc(docId);
  return doc.getMap("content").toJSON();
};

/**
 * Update document with client changes
 */
export const updateDoc = (docId: string, update: Uint8Array): object => {
  const doc = getOrCreateDoc(docId);
  Y.applyUpdate(doc, update);
  return doc.getMap("content").toJSON();
};

/**
 * Set values directly in document (for non-collaborative updates)
 */
export const setDocValues = (docId: string, values: Record<string, any>): object => {
  const doc = getOrCreateDoc(docId);
  const content = doc.getMap("content");

  Object.entries(values).forEach(([key, value]) => {
    content.set(key, value);
  });

  return content.toJSON();
};

/**
 * Get encoded state vector for synchronization
 */
export const getStateVector = (docId: string): Uint8Array => {
  const doc = getOrCreateDoc(docId);
  return encodeStateVector(doc);
};

/**
 * Get encoded document update for a specific state vector
 */
export const getDocUpdate = (docId: string, stateVector?: Uint8Array): Uint8Array => {
  const doc = getOrCreateDoc(docId);
  return encodeStateAsUpdate(doc, stateVector);
};

/**
 * Merge multiple updates
 */
export const mergeDocUpdates = (updates: Uint8Array[]): Uint8Array => {
  return mergeUpdates(updates);
};

/**
 * Delete a document from the store
 */
export const deleteDoc = (docId: string): boolean => {
  return docStore.delete(docId);
};

/**
 * Check if document exists
 */
export const docExists = (docId: string): boolean => {
  return docStore.has(docId);
};
