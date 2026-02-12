import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { ApiService } from "./ApiService";
import { NotificationService } from "./NotificationService";
import { ConflictResolutionService } from "./ConflictResolutionService";
import * as Colors from "../constants/Colors";

// Types
export interface FieldNote {
  id: string;
  parcelId: string;
  text: string;
  userId: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  syncStatus: "synced" | "pending" | "conflict";
}

export interface UserPresence {
  userId: number;
  name: string;
  color: string;
  status: "online" | "offline" | "away";
  lastActive: string;
}

interface YjsDocument {
  doc: Y.Doc;
  persistence?: IndexeddbPersistence;
  provider?: WebsocketProvider;
  awareness?: any;
}

// Main class
export class DataSyncService {
  private static instance: DataSyncService;
  private documents: Map<string, YjsDocument>;
  private clientId: number;
  private clientName: string;
  private clientColor: string;
  private apiService: ApiService;
  private notificationService: NotificationService;
  private conflictResolutionService: ConflictResolutionService;
  private syncInProgress: boolean;
  private syncQueue: string[];

  // User presence colors
  private readonly USER_COLORS = [
    Colors.primary,
    Colors.secondary,
    Colors.tertiary,
    Colors.accent,
    "#E63946",
    "#2A9D8F",
    "#E9C46A",
    "#F4A261",
  ];

  // Private constructor
  private constructor() {
    this.documents = new Map();
    this.clientId = 0;
    this.clientName = "";
    this.clientColor = this.USER_COLORS[0];
    this.apiService = ApiService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.conflictResolutionService = ConflictResolutionService.getInstance();
    this.syncInProgress = false;
    this.syncQueue = [];

    // Setup sync timer
    setInterval(() => {
      this.processSyncQueue();
    }, 60000); // Check every minute
  }

  // Get instance
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  // Set client state
  public setClientState(userId: number, userName: string): void {
    this.clientId = userId;
    this.clientName = userName;

    // Assign a color based on user ID
    const colorIndex = userId % this.USER_COLORS.length;
    this.clientColor = this.USER_COLORS[colorIndex];
  }

  // Get or create Yjs document
  private getOrCreateDocument(docId: string): YjsDocument {
    if (!this.documents.has(docId)) {
      const doc = new Y.Doc();

      // Initialize persistence (offline)
      const persistence = new IndexeddbPersistence(docId, doc);

      let provider: WebsocketProvider | undefined;

      // Initialize provider if online
      if (this.apiService.isConnected()) {
        try {
          const wsUrl = this.apiService.getWebSocketURL();
          provider = new WebsocketProvider(wsUrl, docId, doc, {
            connect: true,
          });

          // Setup awareness
          if (provider.awareness) {
            provider.awareness.setLocalState({
              userId: this.clientId,
              name: this.clientName,
              color: this.clientColor,
              status: "online",
              lastActive: new Date().toISOString(),
            });
          }

          // Handle connection status changes
          provider.on("status", (event: { status: string }) => {
            if (event.status === "connected") {
              this.notificationService.sendSystemNotification(
                "Connected",
                "Connected to synchronization server. Changes will be synced in real-time."
              );
            } else if (event.status === "disconnected") {
              this.notificationService.sendSystemNotification(
                "Disconnected",
                "Disconnected from synchronization server. Changes will be saved locally and synced when reconnected."
              );
            }
          });
        } catch (error) {
          console.error("Failed to initialize WebSocket provider:", error);
        }
      }

      const document: YjsDocument = {
        doc,
        persistence,
        provider,
        awareness: provider?.awareness,
      };

      this.documents.set(docId, document);
    }

    return this.documents.get(docId)!;
  }

  // Get field notes
  public async getFieldNotes(docId: string, parcelId: string): Promise<FieldNote[]> {
    const document = this.getOrCreateDocument(docId);
    const doc = document.doc;

    // Get notes from Yjs document
    const notesArray = doc.getArray<any>("notes");

    // Convert to FieldNote array
    const notes: FieldNote[] = [];

    notesArray.forEach((noteObj) => {
      if (noteObj.parcelId === parcelId) {
        notes.push({
          id: noteObj.id,
          parcelId: noteObj.parcelId,
          text: noteObj.text,
          userId: noteObj.userId,
          createdBy: noteObj.createdBy,
          createdAt: noteObj.createdAt,
          updatedAt: noteObj.updatedAt,
          syncStatus: noteObj.syncStatus || "pending",
        });
      }
    });

    // If online and no notes in Yjs document, try to fetch from server
    if (notes.length === 0 && this.apiService.isConnected()) {
      try {
        const serverNotes = await this.apiService.get(`/api/parcels/${parcelId}/notes`);

        if (serverNotes && Array.isArray(serverNotes)) {
          // Update Yjs document with notes from server
          serverNotes.forEach((serverNote) => {
            this.addNoteToDocument(doc, {
              id: serverNote.id,
              parcelId: serverNote.parcelId,
              text: serverNote.text,
              userId: serverNote.userId,
              createdBy: serverNote.createdBy,
              createdAt: serverNote.createdAt,
              updatedAt: serverNote.updatedAt,
              syncStatus: "synced",
            });
          });

          // Convert to FieldNote array again
          notesArray.forEach((noteObj) => {
            if (noteObj.parcelId === parcelId) {
              notes.push({
                id: noteObj.id,
                parcelId: noteObj.parcelId,
                text: noteObj.text,
                userId: noteObj.userId,
                createdBy: noteObj.createdBy,
                createdAt: noteObj.createdAt,
                updatedAt: noteObj.updatedAt,
                syncStatus: noteObj.syncStatus || "synced",
              });
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch notes from server:", error);

        // Try to get from local storage as a fallback
        try {
          const storageKey = `terrafield_notes_${parcelId}`;
          const storedNotes = await AsyncStorage.getItem(storageKey);

          if (storedNotes) {
            const localNotes = JSON.parse(storedNotes);

            if (Array.isArray(localNotes)) {
              // Update Yjs document with notes from local storage
              localNotes.forEach((localNote) => {
                this.addNoteToDocument(doc, {
                  ...localNote,
                  syncStatus: "pending",
                });
              });

              // Add to notes array
              localNotes.forEach((localNote) => {
                notes.push({
                  ...localNote,
                  syncStatus: "pending",
                });
              });
            }
          }
        } catch (storageError) {
          console.error("Failed to load notes from local storage:", storageError);
        }
      }
    }

    return notes;
  }

  // Add field note
  public async addFieldNote(
    docId: string,
    parcelId: string,
    text: string,
    userId: number,
    userName: string
  ): Promise<FieldNote> {
    const document = this.getOrCreateDocument(docId);
    const doc = document.doc;

    // Create note
    const newNote: FieldNote = {
      id: uuidv4(),
      parcelId,
      text,
      userId,
      createdBy: userName,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    // Add to Yjs document
    this.addNoteToDocument(doc, newNote);

    // Save to local storage as backup
    try {
      const storageKey = `terrafield_notes_${parcelId}`;
      let storedNotes = [];

      const storedNotesJson = await AsyncStorage.getItem(storageKey);
      if (storedNotesJson) {
        storedNotes = JSON.parse(storedNotesJson);
      }

      storedNotes.push(newNote);
      await AsyncStorage.setItem(storageKey, JSON.stringify(storedNotes));
    } catch (error) {
      console.error("Failed to save note to local storage:", error);
    }

    // Add to sync queue
    this.addToSyncQueue(docId);

    // If online, sync immediately
    if (this.apiService.isConnected()) {
      this.syncDoc(docId, parcelId);
    }

    return newNote;
  }

  // Add note to Yjs document
  private addNoteToDocument(doc: Y.Doc, note: FieldNote): void {
    const notesArray = doc.getArray<any>("notes");

    // Check if note already exists
    let exists = false;
    notesArray.forEach((existingNote /* , index */) => {
      if (existingNote.id === note.id) {
        exists = true;

        // If existing note is in conflict state, use conflict resolution
        if (existingNote.syncStatus === "conflict") {
          const resolvedNote = this.conflictResolutionService.resolveNoteConflict(
            existingNote,
            note
          );

          // Update note
          notesArray.delete(index);
          notesArray.insert(index, [resolvedNote]);
        }
      }
    });

    // If note doesn't exist, add it
    if (!exists) {
      notesArray.push([note]);
    }
  }

  // Sync document
  public async syncDoc(docId: string, parcelId: string): Promise<void> {
    if (!this.apiService.isConnected()) {
      this.addToSyncQueue(docId);
      return;
    }

    const document = this.getOrCreateDocument(docId);
    const doc = document.doc;
    const notesArray = doc.getArray<any>("notes");
    const pendingNotes: FieldNote[] = [];

    // Find pending notes
    notesArray.forEach((note) => {
      if (note.parcelId === parcelId && note.syncStatus === "pending") {
        pendingNotes.push({
          id: note.id,
          parcelId: note.parcelId,
          text: note.text,
          userId: note.userId,
          createdBy: note.createdBy,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          syncStatus: note.syncStatus,
        });
      }
    });

    if (pendingNotes.length === 0) {
      return;
    }

    try {
      // Send pending notes to server
      const response = await this.apiService.post(`/api/parcels/${parcelId}/sync`, {
        notes: pendingNotes,
      });

      if (response && response.notes) {
        const { notes, conflicts } = response;

        // Update sync status of successful notes
        notesArray.forEach((note /* , index */) => {
          if (notes.some((syncedNote: any) => syncedNote.id === note.id)) {
            // Mark as synced
            const updatedNote = { ...note, syncStatus: "synced" };
            notesArray.delete(index);
            notesArray.insert(index, [updatedNote]);
          } else if (conflicts && conflicts.some((conflict: any) => conflict.id === note.id)) {
            // Mark as conflict
            const updatedNote = { ...note, syncStatus: "conflict" };
            notesArray.delete(index);
            notesArray.insert(index, [updatedNote]);
          }
        });

        // Show notification
        this.notificationService.sendSystemNotification(
          "Sync Complete",
          `Synchronized ${notes.length} field notes.`
        );

        // If there were conflicts, show notification
        if (conflicts && conflicts.length > 0) {
          this.notificationService.sendSystemNotification(
            "Sync Conflicts",
            `There were ${conflicts.length} conflicts. Please review and resolve.`
          );
        }

        // Update local storage
        this.updateLocalStorage(parcelId, notesArray);
      }
    } catch (error) {
      console.error("Failed to sync notes with server:", error);
      this.notificationService.sendSystemNotification(
        "Sync Failed",
        "Failed to synchronize field notes. Will retry later."
      );

      // Keep in sync queue
      this.addToSyncQueue(docId);
    }
  }

  // Process sync queue
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0 || !this.apiService.isConnected()) {
      return;
    }

    this.syncInProgress = true;

    try {
      const docId = this.syncQueue.shift()!;
      const document = this.getOrCreateDocument(docId);
      const doc = document.doc;
      const notesArray = doc.getArray<any>("notes");

      // Get unique parcel IDs
      const parcelIds = new Set<string>();
      notesArray.forEach((note) => {
        if (note.syncStatus === "pending") {
          parcelIds.add(note.parcelId);
        }
      });

      // Sync each parcel
      for (const parcelId of parcelIds) {
        await this.syncDoc(docId, parcelId);
      }
    } catch (error) {
      console.error("Error processing sync queue:", error);
    } finally {
      this.syncInProgress = false;

      // Process next item if queue is not empty
      if (this.syncQueue.length > 0) {
        setTimeout(() => {
          this.processSyncQueue();
        }, 5000); // Wait 5 seconds before next sync
      }
    }
  }

  // Add to sync queue
  private addToSyncQueue(docId: string): void {
    if (!this.syncQueue.includes(docId)) {
      this.syncQueue.push(docId);
    }
  }

  // Update local storage
  private async updateLocalStorage(parcelId: string, notesArray: Y.Array<any>): Promise<void> {
    try {
      const storageKey = `terrafield_notes_${parcelId}`;
      const notes: FieldNote[] = [];

      notesArray.forEach((note) => {
        if (note.parcelId === parcelId) {
          notes.push({
            id: note.id,
            parcelId: note.parcelId,
            text: note.text,
            userId: note.userId,
            createdBy: note.createdBy,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            syncStatus: note.syncStatus,
          });
        }
      });

      await AsyncStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to update local storage:", error);
    }
  }

  // Get active users
  public getActiveUsers(docId: string): UserPresence[] {
    const document = this.getOrCreateDocument(docId);
    const awareness = document.awareness;

    if (!awareness) {
      return [
        {
          userId: this.clientId,
          name: this.clientName,
          color: this.clientColor,
          status: this.apiService.isConnected() ? "online" : "offline",
          lastActive: new Date().toISOString(),
        },
      ];
    }

    const states = awareness.getStates();
    const users: UserPresence[] = [];

    states.forEach((state: any, clientId: number) => {
      if (state.userId && state.name) {
        users.push({
          userId: state.userId,
          name: state.name,
          color: state.color || this.USER_COLORS[0],
          status: state.status || "online",
          lastActive: state.lastActive || new Date().toISOString(),
        });
      }
    });

    // Make sure current user is in the list
    if (!users.some((user) => user.userId === this.clientId)) {
      users.push({
        userId: this.clientId,
        name: this.clientName,
        color: this.clientColor,
        status: this.apiService.isConnected() ? "online" : "offline",
        lastActive: new Date().toISOString(),
      });
    }

    return users;
  }

  // Clean up resources
  public destroy(): void {
    this.documents.forEach((document) => {
      if (document.provider) {
        document.provider.disconnect();
      }

      if (document.persistence) {
        document.persistence.destroy();
      }
    });

    this.documents.clear();
  }
}

export default DataSyncService;
