import { Request, Response, Router } from "express";
import * as Y from "yjs";
import {
  encodeDocUpdate,
  applyEncodedUpdate,
  mergeUpdates,
  PhotoMetadata,
} from "../../packages/crdt/src/index";
import { storage } from "../storage";

// Store for photo metadata, using reportId as the key
const photoDocStore = new Map<string, Y.Doc>();

// Create a router for photo sync endpoints
export const photoSyncRouter = Router();

/**
 * Initialize a photo document if it doesn't exist yet
 */
function getOrCreatePhotoDoc(reportId: string): Y.Doc {
  if (!photoDocStore.has(reportId)) {
    const doc = new Y.Doc();

    // Initialize the document with a map
    const photosMap = doc.getMap("photos");

    // Load existing photos from database to initialize the document
    storage
      .getPhotosByReportId(Number(reportId))
      .then((photos) => {
        if (photos && photos.length > 0) {
          photos.forEach((photo) => {
            const metadata: PhotoMetadata = {
              id: photo.id.toString(),
              reportId: reportId,
              photoType: photo.photoType || "SUBJECT",
              url: photo.url || "",
              caption: photo.caption || "",
              dateTaken: photo.dateTaken?.toISOString() || new Date().toISOString(),
              latitude: photo.latitude || null,
              longitude: photo.longitude || null,
              isOffline: false,
              status: "synced",
            };

            photosMap.set(photo.id.toString(), metadata);
          });
        }
      })
      .catch((err) => {
        console.error("Error initializing photo doc from database:", err);
      });

    photoDocStore.set(reportId, doc);
  }

  return photoDocStore.get(reportId)!;
}

/**
 * Get all photo metadata from a Y.Doc
 */
function getPhotoMetadata(doc: Y.Doc): PhotoMetadata[] {
  const photosMap = doc.getMap("photos");
  return Array.from(photosMap.values()) as PhotoMetadata[];
}

/**
 * Update photo metadata in the database
 */
async function syncPhotoMetadataToDatabase(
  reportId: string,
  photos: PhotoMetadata[]
): Promise<void> {
  try {
    // Process each photo
    for (const photo of photos) {
      // If the photo doesn't have a URL but has a localPath, it needs to be uploaded
      if (!photo.url && photo.localPath && photo.status !== "error") {
        // In a real implementation, we would handle file uploads here
        // For now, we'll just mark it as synced with a placeholder URL
        photo.url = `https://example.com/photos/${photo.id}`;
        photo.status = "synced";
        photo.isOffline = false;
      }

      // Check if the photo exists in the database
      const existingPhoto = await storage.getPhoto(Number(photo.id));

      if (existingPhoto) {
        // Update existing photo
        await storage.updatePhoto(Number(photo.id), {
          photoType: photo.photoType,
          caption: photo.caption,
          url: photo.url,
          latitude: photo.latitude,
          longitude: photo.longitude,
          // Store additional metadata as JSON
          metadata: JSON.stringify({
            dateTaken: photo.dateTaken,
            isOffline: photo.isOffline,
            status: photo.status,
            lastSyncAttempt: photo.lastSyncAttempt,
          }),
        });
      } else {
        // Create new photo record
        await storage.createPhoto({
          id: Number(photo.id),
          reportId: Number(reportId),
          photoType: photo.photoType,
          caption: photo.caption,
          url: photo.url || "",
          dateTaken: new Date(photo.dateTaken),
          latitude: photo.latitude,
          longitude: photo.longitude,
          metadata: JSON.stringify({
            isOffline: photo.isOffline,
            status: photo.status,
            lastSyncAttempt: photo.lastSyncAttempt,
            localPath: photo.localPath,
          }),
        });
      }
    }
  } catch (error) {
    console.error("Error syncing photos to database:", error);
    throw error;
  }
}

// GET endpoint to retrieve all photos for a report
photoSyncRouter.get("/reports/:reportId/photos", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ message: "Report ID is required" });
    }

    // Initialize or get the document
    const doc = getOrCreatePhotoDoc(reportId);

    // Encode the current state
    const update = encodeDocUpdate(doc);

    // Return the encoded state
    res.status(200).json({
      update,
      photos: getPhotoMetadata(doc),
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ message: "Error fetching photos" });
  }
});

// POST endpoint to sync photo updates
photoSyncRouter.post("/reports/:reportId/photos", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { update } = req.body;

    if (!reportId) {
      return res.status(400).json({ message: "Report ID is required" });
    }

    if (!update) {
      return res.status(400).json({ message: "Update data is required" });
    }

    // Get the document
    const doc = getOrCreatePhotoDoc(reportId);

    // Apply the received update to our document
    const mergedUpdate = mergeUpdates(doc, update);

    // Get all photo metadata
    const photos = getPhotoMetadata(doc);

    // Sync to database
    await syncPhotoMetadataToDatabase(reportId, photos);

    // Return the merged state
    res.status(200).json({
      mergedUpdate,
      photos,
    });
  } catch (error) {
    console.error("Error syncing photos:", error);
    res.status(500).json({ message: "Error syncing photos" });
  }
});
