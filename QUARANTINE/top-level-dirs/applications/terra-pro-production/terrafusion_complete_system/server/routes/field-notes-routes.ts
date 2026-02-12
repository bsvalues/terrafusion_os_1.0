import express, { Request, Response, Router } from "express";
import * as Y from "yjs";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { fieldNotes, FieldNote, fieldNoteSchema } from "@shared/schema";
import { fromUint8Array, toUint8Array } from "js-base64";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";

const router = Router();

// In-memory store of active Yjs documents (to be moved to a persistent store like Redis in production)
const documents = new Map<string, Y.Doc>();

/**
 * Get an existing document from the store or create a new one
 */
function getOrCreateFieldNoteDoc(parcelId: string): Y.Doc {
  if (!documents.has(parcelId)) {
    const doc = new Y.Doc();
    documents.set(parcelId, doc);

    // Initialize with data from the database
    initDocFromDb(doc, parcelId);
  }

  return documents.get(parcelId)!;
}

/**
 * Initialize a Yjs document with data from the database
 */
async function initDocFromDb(doc: Y.Doc, parcelId: string): Promise<void> {
  try {
    // Get field notes for this parcel from the database
    const notes = await db.select().from(fieldNotes).where(eq(fieldNotes.parcelId, parcelId));

    if (notes.length > 0) {
      // Add the notes to the Yjs document
      const notesArray = doc.getArray("notes");
      notes.forEach((note) => {
        notesArray.push([note]);
      });
    }
  } catch (error) {
    console.error(`Error initializing document for parcel ${parcelId}:`, error);
  }
}

/**
 * Get field notes data from a Yjs document
 */
function getFieldNotesData(doc: Y.Doc): { notes: FieldNote[] } {
  const notesArray = doc.getArray("notes");
  const rawNotes = notesArray.toArray();

  // Ensure we're returning properly typed FieldNote objects
  const notes: FieldNote[] = rawNotes.map((note) => {
    // Validate and cast each note using the schema
    try {
      return fieldNoteSchema.parse(note);
    } catch (e) {
      console.error("Invalid field note data:", e, note);
      // Return a minimally valid note to prevent crashes
      return {
        id: note.id || uuidv4(),
        parcelId: note.parcelId || "",
        text: note.text || "",
        createdAt: note.createdAt || new Date().toISOString(),
        createdBy: note.createdBy || "Unknown",
        userId: note.userId || 0,
      };
    }
  });

  return { notes };
}

/**
 * Update a field note in the Yjs document
 */
function updateFieldNoteData(doc: Y.Doc, noteData: any): void {
  const notesArray = doc.getArray("notes");

  // Check if this is an update or a new note
  if (noteData.id) {
    // Find the existing note
    const index = notesArray.toArray().findIndex((note) => note.id === noteData.id);

    if (index !== -1) {
      // Update the existing note
      notesArray.delete(index, 1);
      notesArray.insert(index, [noteData]);
    }
  } else {
    // Add a new note
    noteData.id = uuidv4();
    noteData.createdAt = new Date().toISOString();
    notesArray.push([noteData]);
  }
}

/**
 * Apply an encoded update to a Yjs document
 */
function applyEncodedUpdate(doc: Y.Doc, encodedUpdate: string): void {
  const update = toUint8Array(encodedUpdate);
  Y.applyUpdate(doc, update);
}

/**
 * Encode a Yjs document update as a base64 string
 */
function encodeDocUpdate(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return fromUint8Array(update);
}

/**
 * Merge updates and return the merged state
 */
function mergeUpdates(doc: Y.Doc, encodedUpdate: string): string {
  applyEncodedUpdate(doc, encodedUpdate);
  return encodeDocUpdate(doc);
}

/**
 * Persist field notes to the database
 */
async function persistNotesToDb(parcelId: string, doc: Y.Doc): Promise<void> {
  try {
    const { notes } = getFieldNotesData(doc);

    // Get existing notes for this parcel
    const existingNotes = await db
      .select()
      .from(fieldNotes)
      .where(eq(fieldNotes.parcelId, parcelId));
    const existingNoteIds = new Set(existingNotes.map((note) => note.id));

    // Transaction to update the database
    await db.transaction(async (tx) => {
      // Add or update notes
      for (const note of notes) {
        try {
          // Ensure we have a valid note with an ID
          if (!note.id) {
            note.id = uuidv4();
          }

          const validatedNote = fieldNoteSchema.parse(note);

          if (existingNoteIds.has(validatedNote.id)) {
            // Update existing note
            await tx
              .update(fieldNotes)
              .set({
                text: validatedNote.text,
                // Don't include updatedAt as it doesn't exist in our schema
              })
              .where(eq(fieldNotes.id, validatedNote.id || ""));

            // Remove from the set of existing notes
            existingNoteIds.delete(validatedNote.id);
          } else {
            // Insert new note
            await tx.insert(fieldNotes).values({
              parcelId: validatedNote.parcelId,
              text: validatedNote.text,
              createdAt: new Date(validatedNote.createdAt || new Date()),
              createdBy: validatedNote.createdBy,
              userId: validatedNote.userId,
              id: validatedNote.id,
            });
          }
        } catch (error) {
          console.error(`Error persisting note for parcel ${parcelId}:`, error);
        }
      }

      // Delete notes that no longer exist in the Yjs document
      for (const id of Array.from(existingNoteIds)) {
        if (id) {
          await tx.delete(fieldNotes).where(eq(fieldNotes.id, id));
        }
      }
    });

    console.log(`Successfully persisted ${notes.length} notes for parcel ${parcelId}`);
  } catch (error) {
    console.error(`Error persisting notes for parcel ${parcelId}:`, error);
  }
}

// GET endpoint to retrieve field notes for a parcel
router.get("/:parcelId/notes", async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;

    if (!parcelId) {
      return res.status(400).json({ error: "Parcel ID is required" });
    }

    // Get or create the document
    const doc = getOrCreateFieldNoteDoc(parcelId);

    // Get the notes data
    const data = getFieldNotesData(doc);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error retrieving field notes:", error);
    res.status(500).json({ error: "Failed to retrieve field notes" });
  }
});

// PUT endpoint to update field notes for a parcel
router.put("/:parcelId/notes", async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;
    const { update } = req.body;

    if (!parcelId) {
      return res.status(400).json({ error: "Parcel ID is required" });
    }

    if (!update) {
      return res.status(400).json({ error: "Update data is required" });
    }

    // Get or create the document
    const doc = getOrCreateFieldNoteDoc(parcelId);

    // Apply the update
    applyEncodedUpdate(doc, update);

    // Get the updated notes
    const data = getFieldNotesData(doc);

    // Persist to database
    await persistNotesToDb(parcelId, doc);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error updating field notes:", error);
    res.status(500).json({ error: "Failed to update field notes" });
  }
});

// POST endpoint for CRDT sync operations
router.post("/:parcelId/sync", async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;
    const { update } = req.body;

    if (!parcelId) {
      return res.status(400).json({ error: "Parcel ID is required" });
    }

    if (!update) {
      return res.status(400).json({ error: "Update data is required" });
    }

    // Get or create the document
    const doc = getOrCreateFieldNoteDoc(parcelId);

    // Merge the updates
    const mergedState = mergeUpdates(doc, update);

    // Get the updated notes
    const data = getFieldNotesData(doc);

    // Persist to database
    await persistNotesToDb(parcelId, doc);

    res.status(200).json({
      state: mergedState,
      data,
    });
  } catch (error) {
    console.error("Error syncing field notes:", error);
    res.status(500).json({ error: "Failed to sync field notes" });
  }
});

// DELETE endpoint to remove a field note
router.delete("/:parcelId/notes/:noteId", async (req: Request, res: Response) => {
  try {
    const { parcelId, noteId } = req.params;

    if (!parcelId || !noteId) {
      return res.status(400).json({ error: "Parcel ID and Note ID are required" });
    }

    // Get the document
    const doc = getOrCreateFieldNoteDoc(parcelId);

    // Get the notes array
    const notesArray = doc.getArray("notes");

    // Find the note to delete
    const notes = notesArray.toArray();
    const noteIndex = notes.findIndex((note) => note.id === noteId);

    if (noteIndex === -1) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Delete from Yjs document
    notesArray.delete(noteIndex, 1);

    // Delete from database
    await db.delete(fieldNotes).where(eq(fieldNotes.id, noteId));

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting field note:", error);
    res.status(500).json({ error: "Failed to delete field note" });
  }
});

export default router;
