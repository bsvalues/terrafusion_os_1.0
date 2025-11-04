import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import { v4 as uuidv4 } from "uuid";

export interface PhotoMetadata {
  id: string;
  reportId: number;
  originalUrl: string;
  enhancedUrl?: string;
  photoType: string;
  caption?: string;
  dateTaken?: Date;
  latitude?: string;
  longitude?: string;
  enhancementOptions?: Record<string, boolean>;
  analysis?: any;
  createdAt: Date;
  updatedAt: Date;
  pendingSync: boolean;
  syncStatus: "pending" | "synced" | "failed";
  syncError?: string;
}

/**
 * PhotoSyncManager handles the synchronization of property photos
 * using CRDT data structures for conflict-free offline capabilities
 */
export class PhotoSyncManager {
  private doc: Y.Doc;
  private photos: Y.Array<PhotoMetadata>;
  private indexeddbProvider: IndexeddbPersistence;
  private websocketProvider: WebsocketProvider | null = null;
  private apiBaseUrl: string;
  private reportId: number;
  private observers: Set<(photos: PhotoMetadata[]) => void> = new Set();

  /**
   * Create a new PhotoSyncManager
   * @param reportId - The ID of the appraisal report
   * @param apiBaseUrl - The base URL for API calls
   */
  constructor(reportId: number, apiBaseUrl: string = "") {
    this.reportId = reportId;
    this.apiBaseUrl = apiBaseUrl;
    this.doc = new Y.Doc();

    // Get or create the photos array in the CRDT document
    this.photos = this.doc.getArray<PhotoMetadata>("photos");

    // Set up IndexedDB for local persistence
    this.indexeddbProvider = new IndexeddbPersistence(`terrafield-photos-${reportId}`, this.doc);

    // Listen for local changes to trigger observers
    this.photos.observe(() => {
      this.notifyObservers();
    });

    // Set up initial connection when IndexedDB is ready
    this.indexeddbProvider.whenSynced.then(() => {
      console.log("Photos loaded from local storage");
      this.notifyObservers();
      this.setupWebsocketSync();
    });
  }

  /**
   * Set up WebSocket synchronization when online
   */
  private setupWebsocketSync() {
    // Check if we're in a browser environment with WebSocket support
    if (typeof window !== "undefined" && "WebSocket" in window) {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.websocketProvider = new WebsocketProvider(
          wsUrl,
          `terrafield-photos-${this.reportId}`,
          this.doc,
          { connect: true }
        );

        this.websocketProvider.on("status", (event: { status: string }) => {
          if (event.status === "connected") {
            console.log("Connected to WebSocket server for photo sync");
            this.syncWithServer();
          }
        });

        // Set up reconnection logic
        window.addEventListener("online", () => {
          this.websocketProvider?.connect();
        });

        window.addEventListener("offline", () => {
          // When offline, we'll continue to work with local data
          console.log("Device offline, continuing with local data");
        });
      } catch (error) {
        console.error("Error setting up WebSocket provider:", error);
      }
    }
  }

  /**
   * Subscribe to changes in the photos collection
   * @param callback - Function to call when photos change
   * @returns Unsubscribe function
   */
  public subscribe(callback: (photos: PhotoMetadata[]) => void): () => void {
    this.observers.add(callback);
    // Immediately notify with current state
    callback(this.getAllPhotos());

    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Notify all observers of changes
   */
  private notifyObservers() {
    const photos = this.getAllPhotos();
    this.observers.forEach((callback) => callback(photos));
  }

  /**
   * Get all photos from the CRDT document
   */
  public getAllPhotos(): PhotoMetadata[] {
    return this.photos.toArray();
  }

  /**
   * Get a photo by ID
   * @param id - The photo ID
   */
  public getPhotoById(id: string): PhotoMetadata | undefined {
    return this.getAllPhotos().find((photo) => photo.id === id);
  }

  /**
   * Add a new photo to the collection
   * @param photo - The photo metadata (without id, createdAt, etc)
   */
  public addPhoto(photo: Partial<PhotoMetadata>): PhotoMetadata {
    const newPhoto: PhotoMetadata = {
      id: uuidv4(),
      reportId: this.reportId,
      originalUrl: photo.originalUrl || "",
      enhancedUrl: photo.enhancedUrl,
      photoType: photo.photoType || "property",
      caption: photo.caption,
      dateTaken: photo.dateTaken || new Date(),
      latitude: photo.latitude,
      longitude: photo.longitude,
      enhancementOptions: photo.enhancementOptions,
      analysis: photo.analysis,
      createdAt: new Date(),
      updatedAt: new Date(),
      pendingSync: true,
      syncStatus: "pending",
    };

    this.doc.transact(() => {
      this.photos.push([newPhoto]);
    });

    // Attempt to sync with server if connected
    this.syncWithServer();

    return newPhoto;
  }

  /**
   * Update an existing photo
   * @param id - The photo ID
   * @param updates - The fields to update
   */
  public updatePhoto(id: string, updates: Partial<PhotoMetadata>): boolean {
    const photos = this.getAllPhotos();
    const index = photos.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    this.doc.transact(() => {
      const updatedPhoto = {
        ...photos[index],
        ...updates,
        updatedAt: new Date(),
        pendingSync: true,
        syncStatus: "pending",
      };

      this.photos.delete(index);
      this.photos.insert(index, [updatedPhoto]);
    });

    // Attempt to sync with server if connected
    this.syncWithServer();

    return true;
  }

  /**
   * Delete a photo
   * @param id - The photo ID
   */
  public deletePhoto(id: string): boolean {
    const photos = this.getAllPhotos();
    const index = photos.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    this.doc.transact(() => {
      this.photos.delete(index);
    });

    // Attempt to sync with server if connected
    this.syncWithServer();

    return true;
  }

  /**
   * Sync changes with the server
   */
  public async syncWithServer(): Promise<void> {
    const pendingPhotos = this.getAllPhotos().filter((p) => p.pendingSync);

    if (pendingPhotos.length === 0) {
      return;
    }

    if (!navigator.onLine) {
      console.log("Device offline, sync postponed");
      return;
    }

    try {
      // For each pending photo, send to server
      for (const photo of pendingPhotos) {
        try {
          const response = await fetch(`${this.apiBaseUrl}/api/photo-sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(photo),
          });

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }

          const result = await response.json();

          // Update the local copy with server data (including server ID if needed)
          this.updatePhoto(photo.id, {
            pendingSync: false,
            syncStatus: "synced",
            syncError: undefined,
            // Include any other fields the server might have updated
            ...result,
          });
        } catch (error) {
          console.error(`Error syncing photo ${photo.id}:`, error);
          this.updatePhoto(photo.id, {
            syncStatus: "failed",
            syncError: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } catch (error) {
      console.error("Error during photo sync:", error);
    }
  }

  /**
   * Import photos from the server
   * Used to initially load photos when the app starts
   */
  public async importFromServer(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/reports/${this.reportId}/photos`);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const serverPhotos = await response.json();

      // Import photos that don't already exist locally
      const localPhotoIds = new Set(this.getAllPhotos().map((p) => p.id));

      this.doc.transact(() => {
        for (const serverPhoto of serverPhotos) {
          if (!localPhotoIds.has(serverPhoto.id)) {
            // Add server photo with pendingSync=false since it came from server
            this.photos.push([
              {
                ...serverPhoto,
                pendingSync: false,
                syncStatus: "synced",
              },
            ]);
          }
        }
      });

      this.notifyObservers();
    } catch (error) {
      console.error("Error importing photos from server:", error);
    }
  }

  /**
   * Cleanup resources when the manager is no longer needed
   */
  public destroy(): void {
    this.websocketProvider?.disconnect();
    this.indexeddbProvider?.destroy();
    this.doc.destroy();
    this.observers.clear();
  }
}

/**
 * Create a singleton instance of PhotoSyncManager for a specific report
 * @param reportId - The report ID
 * @param apiBaseUrl - Base URL for API calls
 */
export function createPhotoSyncManager(
  reportId: number,
  apiBaseUrl: string = ""
): PhotoSyncManager {
  return new PhotoSyncManager(reportId, apiBaseUrl);
}
