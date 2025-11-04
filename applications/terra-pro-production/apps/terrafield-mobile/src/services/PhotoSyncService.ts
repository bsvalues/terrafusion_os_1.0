import {
  createPhotoStore,
  PhotoMetadata,
  encodeDocUpdate,
  applyEncodedUpdate,
  addPhoto,
  updatePhotoMetadata,
  removePhoto,
  getAllPhotos,
  getPendingPhotos,
} from "@terrafield/crdt";
import { v4 as uuidv4 } from "uuid";
import { ApiService } from "./ApiService";

/**
 * Service responsible for managing photo synchronization between
 * the mobile device and the server using CRDT
 */
export class PhotoSyncService {
  private static instance: PhotoSyncService;
  private syncInProgress: boolean = false;
  private serverUrl: string;
  private photoStores: Map<string, ReturnType<typeof createPhotoStore>> = new Map();

  private constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Get singleton instance of PhotoSyncService
   */
  public static getInstance(serverUrl: string): PhotoSyncService {
    if (!PhotoSyncService.instance) {
      PhotoSyncService.instance = new PhotoSyncService(serverUrl);
    }
    return PhotoSyncService.instance;
  }

  /**
   * Get or create a photo store for a specific report
   * @param reportId The unique identifier for the report
   */
  private getPhotoStore(reportId: string) {
    if (!this.photoStores.has(reportId)) {
      this.photoStores.set(reportId, createPhotoStore(reportId));
    }
    return this.photoStores.get(reportId)!;
  }

  /**
   * Add a new photo to the local store
   * @param photo The photo metadata to add
   */
  public addPhoto(photo: Omit<PhotoMetadata, "id" | "status">): string {
    const { reportId } = photo;
    const { store } = this.getPhotoStore(reportId);

    const photoId = uuidv4();
    const photoMetadata: PhotoMetadata = {
      ...photo,
      id: photoId,
      status: "pending",
    };

    addPhoto(store, photoMetadata);
    this.scheduleSyncForReport(reportId);

    return photoId;
  }

  /**
   * Update an existing photo's metadata
   * @param photoId The ID of the photo to update
   * @param reportId The ID of the report containing the photo
   * @param updates The metadata updates to apply
   */
  public updatePhoto(photoId: string, reportId: string, updates: Partial<PhotoMetadata>): void {
    const { store } = this.getPhotoStore(reportId);
    updatePhotoMetadata(store, photoId, updates);
    this.scheduleSyncForReport(reportId);
  }

  /**
   * Remove a photo from the local store
   * @param photoId The ID of the photo to remove
   * @param reportId The ID of the report containing the photo
   */
  public removePhoto(photoId: string, reportId: string): void {
    const { store } = this.getPhotoStore(reportId);
    removePhoto(store, photoId);
    this.scheduleSyncForReport(reportId);
  }

  /**
   * Get all photos for a specific report
   * @param reportId The ID of the report
   */
  public getPhotos(reportId: string): PhotoMetadata[] {
    const { store } = this.getPhotoStore(reportId);
    return getAllPhotos(store);
  }

  /**
   * Get photos that need to be synced (pending or error status)
   * @param reportId The ID of the report
   */
  public getPendingPhotos(reportId: string): PhotoMetadata[] {
    const { store } = this.getPhotoStore(reportId);
    return getPendingPhotos(store);
  }

  /**
   * Schedule a sync operation for a specific report
   * @param reportId The ID of the report to sync
   */
  private scheduleSyncForReport(reportId: string): void {
    // Debounce sync operations
    setTimeout(() => {
      this.syncReport(reportId).catch((err) => {
        console.error(`Error syncing report ${reportId}:`, err);
      });
    }, 500);
  }

  /**
   * Synchronize photos for a specific report with the server
   * @param reportId The ID of the report to sync
   */
  public async syncReport(reportId: string): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    const apiService = ApiService.getInstance();

    try {
      const { store, doc } = this.getPhotoStore(reportId);

      // Encode the current state for transmission
      const encodedUpdate = encodeDocUpdate(doc);

      // Send the encoded update to the server using ApiService
      const { mergedUpdate } = await apiService.syncReportPhotos(reportId, encodedUpdate);

      // Apply the merged update to our local document
      applyEncodedUpdate(doc, mergedUpdate);

      // Update status of any pending photos that were successfully synced
      const photos = getAllPhotos(store);
      for (const photo of photos) {
        if (photo.status === "pending" || photo.status === "syncing") {
          updatePhotoMetadata(store, photo.id, {
            status: "synced",
            isOffline: false,
          });
        }
      }

      console.log(`Successfully synced ${photos.length} photos for report ${reportId}`);
    } catch (error) {
      console.error("Error syncing photos:", error);

      // Mark photos as error if sync failed
      const { store } = this.getPhotoStore(reportId);
      const pendingPhotos = getPendingPhotos(store);

      for (const photo of pendingPhotos) {
        if (photo.status === "syncing") {
          updatePhotoMetadata(store, photo.id, {
            status: "error",
            errorMessage: "Failed to sync with server",
            lastSyncAttempt: new Date().toISOString(),
          });
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Initialize sync from the server for a specific report
   * @param reportId The ID of the report to initialize
   */
  public async initializeFromServer(reportId: string): Promise<void> {
    const apiService = ApiService.getInstance();

    try {
      // Fetch the current state from the server using ApiService
      const { update } = await apiService.getReportPhotos(reportId);

      if (update) {
        const { doc } = this.getPhotoStore(reportId);
        applyEncodedUpdate(doc, update);
        console.log(`Initialized photos for report ${reportId} from server`);
      }
    } catch (error) {
      console.error("Error initializing from server:", error);
      throw error;
    }
  }
}
