import { Platform, AppState, AppStateStatus } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

// Import CRDT libraries (using Y.js for CRDT)
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

// Optional: for improved network reliability
import { Observable, Subject } from "rxjs";

/**
 * Collaboration change type enum
 */
export enum ChangeType {
  ADD = "add",
  UPDATE = "update",
  DELETE = "delete",
  PRESENCE = "presence",
  COMMENT = "comment",
  SYNC = "sync",
}

/**
 * Entity type enum
 */
export enum EntityType {
  PROPERTY = "property",
  REPORT = "report",
  PHOTO = "photo",
  SKETCH = "sketch",
  COMPARABLE = "comparable",
  ADJUSTMENT = "adjustment",
  MEASUREMENT = "measurement",
  OTHER = "other",
}

/**
 * Collaboration user interface
 */
export interface CollaborationUser {
  /**
   * User ID
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * User color for UI
   */
  color: string;

  /**
   * User role
   */
  role: "owner" | "editor" | "viewer";

  /**
   * Avatar URL
   */
  avatarUrl?: string;

  /**
   * Last active timestamp
   */
  lastActive: number;

  /**
   * Whether the user is currently online
   */
  isOnline: boolean;
}

/**
 * Presence data interface (real-time user location/activity)
 */
export interface PresenceData {
  /**
   * User ID
   */
  userId: string;

  /**
   * Current screen/view
   */
  currentView: string;

  /**
   * Entity being viewed/edited
   */
  currentEntity?: {
    type: EntityType;
    id: string;
  };

  /**
   * Additional context
   */
  context?: Record<string, any>;

  /**
   * Cursor/selection info
   */
  cursor?: {
    x: number;
    y: number;
    field?: string;
  };

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Comment interface
 */
export interface Comment {
  /**
   * Comment ID
   */
  id: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * Comment text
   */
  text: string;

  /**
   * Entity type
   */
  entityType: EntityType;

  /**
   * Entity ID
   */
  entityId: string;

  /**
   * Optional field within entity
   */
  fieldName?: string;

  /**
   * Reference point (for positioned comments)
   */
  position?: {
    x: number;
    y: number;
  };

  /**
   * Parent comment ID (for threaded comments)
   */
  parentId?: string;

  /**
   * Whether comment is resolved
   */
  resolved: boolean;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;
}

/**
 * Change record interface
 */
export interface ChangeRecord {
  /**
   * Change ID
   */
  id: string;

  /**
   * Change type
   */
  type: ChangeType;

  /**
   * User ID
   */
  userId: string;

  /**
   * Entity type
   */
  entityType: EntityType;

  /**
   * Entity ID
   */
  entityId: string;

  /**
   * Previous state
   */
  previousState?: any;

  /**
   * New state
   */
  newState?: any;

  /**
   * Fields that changed
   */
  changedFields?: string[];

  /**
   * Change timestamp
   */
  timestamp: number;

  /**
   * Whether change is synced to server
   */
  synced: boolean;
}

/**
 * Collaboration options interface
 */
export interface CollaborationOptions {
  /**
   * Server URL
   */
  serverUrl: string;

  /**
   * User info
   */
  user: {
    id: string;
    name: string;
    role: "owner" | "editor" | "viewer";
    avatarUrl?: string;
  };

  /**
   * Room to join (typically project ID)
   */
  room: string;

  /**
   * Whether to auto-connect
   */
  autoConnect: boolean;

  /**
   * Auth token for secure rooms
   */
  authToken?: string;

  /**
   * Whether to persist data locally
   */
  persistLocally: boolean;

  /**
   * Whether to track presence
   */
  trackPresence: boolean;

  /**
   * Whether to track change history
   */
  trackHistory: boolean;

  /**
   * Sync interval in milliseconds
   */
  syncInterval: number;

  /**
   * Connection timeout in milliseconds
   */
  connectionTimeout: number;
}

/**
 * Default collaboration options
 */
const DEFAULT_OPTIONS: CollaborationOptions = {
  serverUrl: "wss://appraisalcore.replit.app/collaboration",
  user: {
    id: "",
    name: "Anonymous",
    role: "viewer",
  },
  room: "",
  autoConnect: true,
  persistLocally: true,
  trackPresence: true,
  trackHistory: true,
  syncInterval: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
};

/**
 * CollaborationService
 *
 * Service for real-time collaboration using CRDT
 */
export class CollaborationService {
  private static instance: CollaborationService;

  // Core state
  private options: CollaborationOptions;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private connectionAttempts: number = 0;
  private lastSyncTimestamp: number = 0;
  private activeUsers: Map<string, CollaborationUser> = new Map();

  // CRDT state
  private ydoc: Y.Doc | null = null;
  private wsProvider: WebsocketProvider | null = null;
  private localProvider: IndexeddbPersistence | null = null;

  // Data references
  private properties: Y.Map<any> | null = null;
  private reports: Y.Map<any> | null = null;
  private photos: Y.Map<any> | null = null;
  private sketches: Y.Map<any> | null = null;
  private comparables: Y.Map<any> | null = null;
  private measurements: Y.Map<any> | null = null;
  private presence: Y.Map<any> | null = null;
  private comments: Y.Array<any> | null = null;
  private changes: Y.Array<any> | null = null;

  // Event subjects
  private connectedSubject = new Subject<boolean>();
  private syncedSubject = new Subject<void>();
  private presenceSubject = new Subject<PresenceData>();
  private commentSubject = new Subject<Comment>();
  private changeSubject = new Subject<ChangeRecord>();
  private userPresenceSubject = new Subject<Map<string, CollaborationUser>>();

  // Event observables
  public connected$: Observable<boolean> = this.connectedSubject.asObservable();
  public synced$: Observable<void> = this.syncedSubject.asObservable();
  public presence$: Observable<PresenceData> = this.presenceSubject.asObservable();
  public comment$: Observable<Comment> = this.commentSubject.asObservable();
  public change$: Observable<ChangeRecord> = this.changeSubject.asObservable();
  public userPresence$: Observable<Map<string, CollaborationUser>> =
    this.userPresenceSubject.asObservable();

  // App state monitoring
  private appState: AppStateStatus = "active";
  private appStateListener: any = null;
  private syncTimer: any = null;

  // Connection management
  private reconnectTimer: any = null;
  private connectionTimeout: any = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize with default options
    this.options = { ...DEFAULT_OPTIONS };

    // Set up app state listener
    this.appStateListener = AppState.addEventListener("change", this.handleAppStateChange);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  /**
   * Initialize collaboration
   */
  public async initialize(options: Partial<CollaborationOptions>): Promise<boolean> {
    try {
      // Merge options
      this.options = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      // Ensure we have a user ID
      if (!this.options.user.id) {
        const storedUserId = await AsyncStorage.getItem("terrafield:collaboration:userId");
        if (storedUserId) {
          this.options.user.id = storedUserId;
        } else {
          const newUserId = uuidv4();
          await AsyncStorage.setItem("terrafield:collaboration:userId", newUserId);
          this.options.user.id = newUserId;
        }
      }

      // Ensure we have a room
      if (!this.options.room) {
        this.options.room = "default";
      }

      // Create Y.Doc
      this.ydoc = new Y.Doc();

      // Set up data structures
      this.setupDataStructures();

      // Set up local persistence if enabled
      if (this.options.persistLocally) {
        await this.setupLocalPersistence();
      }

      // Connect if auto-connect is enabled
      if (this.options.autoConnect) {
        await this.connect();
      }

      // Set up sync timer
      this.setupSyncTimer();

      return true;
    } catch (error) {
      console.error("Error initializing collaboration:", error);
      return false;
    }
  }

  /**
   * Set up data structures
   */
  private setupDataStructures(): void {
    if (!this.ydoc) return;

    // Create shared data structures
    this.properties = this.ydoc.getMap("properties");
    this.reports = this.ydoc.getMap("reports");
    this.photos = this.ydoc.getMap("photos");
    this.sketches = this.ydoc.getMap("sketches");
    this.comparables = this.ydoc.getMap("comparables");
    this.measurements = this.ydoc.getMap("measurements");
    this.presence = this.ydoc.getMap("presence");
    this.comments = this.ydoc.getArray("comments");
    this.changes = this.ydoc.getArray("changes");

    // Set up change observers
    this.setupObservers();
  }

  /**
   * Set up local persistence
   */
  private async setupLocalPersistence(): Promise<void> {
    if (!this.ydoc) return;

    try {
      // Set up IndexedDB persistence
      const roomId = this.options.room;
      this.localProvider = new IndexeddbPersistence(`terrafield-${roomId}`, this.ydoc);

      // Wait for local provider to sync
      await new Promise<void>((resolve) => {
        this.localProvider!.once("synced", () => {
          console.log("Loaded data from local IndexedDB");
          resolve();
        });
      });
    } catch (error) {
      console.error("Error setting up local persistence:", error);

      // Fallback to AsyncStorage for persistence on error or if on React Native
      if (Platform.OS !== "web") {
        try {
          // Load state from AsyncStorage
          const storedState = await AsyncStorage.getItem(
            `terrafield:collaboration:${this.options.room}`
          );
          if (storedState) {
            const encodedState = JSON.parse(storedState);
            Y.applyUpdate(this.ydoc, new Uint8Array(encodedState));
          }
        } catch (asyncError) {
          console.error("Error loading from AsyncStorage:", asyncError);
        }
      }
    }
  }

  /**
   * Set up observers
   */
  private setupObservers(): void {
    // Observe presence changes
    this.presence?.observe(this.handlePresenceChange);

    // Observe comments
    this.comments?.observe(this.handleCommentChange);

    // Set up document observation for change tracking
    if (this.options.trackHistory && this.ydoc) {
      this.ydoc.on("update", this.handleDocumentUpdate);
    }
  }

  /**
   * Connect to collaboration server
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected || this.isConnecting || !this.ydoc) return false;

    try {
      this.isConnecting = true;

      // Check network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.log("No network connection, working offline");
        this.isConnecting = false;
        return false;
      }

      // Set up connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          console.log("Connection timeout, working offline");
          this.isConnecting = false;
          this.setupReconnectTimer();
        }
      }, this.options.connectionTimeout);

      // Connect to WebSocket server
      this.wsProvider = new WebsocketProvider(
        this.options.serverUrl,
        this.options.room,
        this.ydoc,
        {
          params: {
            token: this.options.authToken || "",
          },
        }
      );

      // Handle connection status
      this.wsProvider.on("status", (event: { status: string }) => {
        if (event.status === "connected") {
          clearTimeout(this.connectionTimeout);
          this.handleConnected();
        }
      });

      // Handle disconnect
      this.wsProvider.on("connection-close", (msg: string) => {
        this.handleDisconnected();
      });

      // Handle awareness (presence) updates
      this.wsProvider.awareness.on("change", this.handleAwarenessChange);

      // Add initial presence
      if (this.options.trackPresence) {
        this.updatePresence({
          currentView: "connecting",
        });
      }

      return true;
    } catch (error) {
      console.error("Error connecting to collaboration server:", error);
      this.isConnecting = false;
      this.setupReconnectTimer();
      return false;
    }
  }

  /**
   * Disconnect from collaboration server
   */
  public disconnect(): void {
    if (!this.isConnected) return;

    // Clear timers
    this.clearTimers();

    // Remove presence
    if (this.options.trackPresence && this.wsProvider) {
      this.wsProvider.awareness.setLocalState(null);
    }

    // Disconnect WebSocket
    if (this.wsProvider) {
      this.wsProvider.disconnect();
      this.wsProvider = null;
    }

    // Update state
    this.isConnected = false;
    this.connectedSubject.next(false);
  }

  /**
   * Handle connected event
   */
  private handleConnected(): void {
    this.isConnected = true;
    this.isConnecting = false;
    this.connectionAttempts = 0;

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Notify listeners
    this.connectedSubject.next(true);

    // Update presence
    if (this.options.trackPresence) {
      this.updatePresence({
        currentView: "connected",
      });
    }

    console.log("Connected to collaboration server");
  }

  /**
   * Handle disconnected event
   */
  private handleDisconnected(): void {
    if (!this.isConnected) return;

    this.isConnected = false;
    this.connectedSubject.next(false);

    // Setup reconnect timer
    this.setupReconnectTimer();

    console.log("Disconnected from collaboration server");
  }

  /**
   * Handle app state change
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (this.appState === "active" && nextAppState.match(/inactive|background/)) {
      // App going to background
      if (this.options.trackPresence && this.wsProvider) {
        this.updatePresence({
          currentView: "background",
        });
      }
    } else if (nextAppState === "active" && this.appState.match(/inactive|background/)) {
      // App coming to foreground
      if (!this.isConnected && this.options.autoConnect) {
        this.connect();
      }

      if (this.options.trackPresence) {
        this.updatePresence({
          currentView: "foreground",
        });
      }
    }

    this.appState = nextAppState;
  };

  /**
   * Set up reconnect timer
   */
  private setupReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Exponential backoff for reconnection
    const delay = Math.min(30000, Math.pow(2, this.connectionAttempts) * 1000);
    this.connectionAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && !this.isConnecting && this.options.autoConnect) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Set up sync timer
   */
  private setupSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Only set up timer if sync interval is positive
    if (this.options.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        this.syncData();
      }, this.options.syncInterval);
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Handle presence change
   */
  private handlePresenceChange = (event: Y.YMapEvent<any>): void => {
    // Process changes to presence data
    event.changes.keys.forEach((change, key) => {
      if (change.action === "add" || change.action === "update") {
        const presenceData = this.presence?.get(key);
        if (presenceData) {
          this.presenceSubject.next(presenceData);
        }
      }
    });
  };

  /**
   * Handle comment change
   */
  private handleCommentChange = (event: Y.YArrayEvent<any>): void => {
    // Process added comments
    event.changes.added.forEach((item) => {
      item.content.forEach((comment: Comment) => {
        this.commentSubject.next(comment);
      });
    });
  };

  /**
   * Handle document update
   */
  private handleDocumentUpdate = (update: Uint8Array, origin: any, doc: Y.Doc): void => {
    if (origin === "local" && this.options.trackHistory) {
      // Track local changes
      this.trackChanges();
    }
  };

  /**
   * Handle awareness change
   */
  private handleAwarenessChange = (changes: {
    added: number[];
    updated: number[];
    removed: number[];
  }): void => {
    if (!this.wsProvider) return;

    // Process all clients
    const states = this.wsProvider.awareness.getStates() as Map<number, any>;
    const users: Map<string, CollaborationUser> = new Map();

    states.forEach((state, clientId) => {
      if (state.user && state.user.id) {
        users.set(state.user.id, {
          id: state.user.id,
          name: state.user.name || "Anonymous",
          color: state.user.color || "#3498db",
          role: state.user.role || "viewer",
          avatarUrl: state.user.avatarUrl,
          lastActive: Date.now(),
          isOnline: true,
        });
      }
    });

    // Update active users
    this.activeUsers = users;

    // Notify subscribers
    this.userPresenceSubject.next(users);
  };

  /**
   * Update presence
   */
  public updatePresence(data: Partial<PresenceData>): void {
    if (!this.wsProvider || !this.options.trackPresence) return;

    // Get current state
    const existingState = this.wsProvider.awareness.getLocalState() || {};

    // Update presence
    this.wsProvider.awareness.setLocalState({
      ...existingState,
      user: {
        id: this.options.user.id,
        name: this.options.user.name,
        role: this.options.user.role,
        avatarUrl: this.options.user.avatarUrl,
        color: existingState.user?.color || this.getRandomColor(),
      },
      presence: {
        ...existingState.presence,
        ...data,
        userId: this.options.user.id,
        timestamp: Date.now(),
      },
    });

    // Also update in shared presence map
    if (this.presence && this.options.user.id) {
      const presenceData: PresenceData = {
        userId: this.options.user.id,
        currentView: data.currentView || "unknown",
        currentEntity: data.currentEntity,
        context: data.context,
        cursor: data.cursor,
        timestamp: Date.now(),
      };

      this.presence.set(this.options.user.id, presenceData);
    }
  }

  /**
   * Get random color
   */
  private getRandomColor(): string {
    const colors = [
      "#3498db", // Blue
      "#2ecc71", // Green
      "#e74c3c", // Red
      "#f39c12", // Orange
      "#9b59b6", // Purple
      "#1abc9c", // Turquoise
      "#d35400", // Pumpkin
      "#2c3e50", // Dark Blue
      "#27ae60", // Nephritis
      "#c0392b", // Pomegranate
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Sync data
   */
  private async syncData(): Promise<void> {
    if (!this.isConnected || !this.ydoc) return;

    try {
      // For Y.js, syncing is automatic in real-time
      // But we can force a flush to persistence

      if (this.options.persistLocally && Platform.OS !== "web" && !this.localProvider) {
        // For React Native, use AsyncStorage as fallback
        const state = Y.encodeStateAsUpdate(this.ydoc);
        await AsyncStorage.setItem(
          `terrafield:collaboration:${this.options.room}`,
          JSON.stringify(Array.from(state))
        );
      }

      this.lastSyncTimestamp = Date.now();
      this.syncedSubject.next();
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  }

  /**
   * Track changes
   */
  private trackChanges(): void {
    if (!this.changes || !this.options.trackHistory) return;

    // This would create a change record based on the actual changes
    // For now, this is a placeholder that would be implemented based on specific needs
    const changeRecord: ChangeRecord = {
      id: uuidv4(),
      type: ChangeType.UPDATE,
      userId: this.options.user.id,
      entityType: EntityType.OTHER,
      entityId: "unknown",
      timestamp: Date.now(),
      synced: this.isConnected,
    };

    // Add to changes
    this.changes.push([changeRecord]);

    // Notify subscribers
    this.changeSubject.next(changeRecord);
  }

  /**
   * Add comment
   */
  public addComment(
    text: string,
    entityType: EntityType,
    entityId: string,
    options: {
      fieldName?: string;
      position?: { x: number; y: number };
      parentId?: string;
    } = {}
  ): Comment | null {
    if (!this.comments) return null;

    const comment: Comment = {
      id: uuidv4(),
      userId: this.options.user.id,
      text,
      entityType,
      entityId,
      fieldName: options.fieldName,
      position: options.position,
      parentId: options.parentId,
      resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add to comments
    this.comments.push([comment]);

    return comment;
  }

  /**
   * Get comments
   */
  public getComments(entityType?: EntityType, entityId?: string): Comment[] {
    if (!this.comments) return [];

    const allComments = this.comments.toArray() as Comment[];

    if (!entityType) {
      return allComments;
    }

    return allComments.filter((comment) => {
      if (comment.entityType !== entityType) {
        return false;
      }

      if (entityId && comment.entityId !== entityId) {
        return false;
      }

      return true;
    });
  }

  /**
   * Resolve comment
   */
  public resolveComment(commentId: string): boolean {
    if (!this.comments) return false;

    const allComments = this.comments.toArray() as Comment[];
    const index = allComments.findIndex((c) => c.id === commentId);

    if (index === -1) return false;

    const comment = { ...allComments[index], resolved: true, updatedAt: Date.now() };

    this.comments.delete(index, 1);
    this.comments.insert(index, [comment]);

    return true;
  }

  /**
   * Get active users
   */
  public getActiveUsers(): CollaborationUser[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Get recent changes
   */
  public getRecentChanges(
    limit: number = 50,
    entityType?: EntityType,
    entityId?: string
  ): ChangeRecord[] {
    if (!this.changes) return [];

    const allChanges = this.changes.toArray() as ChangeRecord[];

    let filteredChanges = allChanges;

    // Filter by entity type and ID if provided
    if (entityType) {
      filteredChanges = filteredChanges.filter((change) => change.entityType === entityType);

      if (entityId) {
        filteredChanges = filteredChanges.filter((change) => change.entityId === entityId);
      }
    }

    // Sort by timestamp (newest first)
    filteredChanges.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    return filteredChanges.slice(0, limit);
  }

  /**
   * Get connection status
   */
  public isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Save entity
   */
  public saveEntity<T>(entityType: EntityType, entityId: string, data: T): boolean {
    if (!this.ydoc) return false;

    let map: Y.Map<any> | null = null;

    // Select the appropriate map
    switch (entityType) {
      case EntityType.PROPERTY:
        map = this.properties;
        break;
      case EntityType.REPORT:
        map = this.reports;
        break;
      case EntityType.PHOTO:
        map = this.photos;
        break;
      case EntityType.SKETCH:
        map = this.sketches;
        break;
      case EntityType.COMPARABLE:
        map = this.comparables;
        break;
      case EntityType.MEASUREMENT:
        map = this.measurements;
        break;
      default:
        return false;
    }

    if (!map) return false;

    // Get previous state for change tracking
    const previousState = map.get(entityId);

    // Save entity
    map.set(entityId, {
      ...data,
      lastModified: Date.now(),
      lastModifiedBy: this.options.user.id,
    });

    // Track change
    if (this.options.trackHistory) {
      const changeRecord: ChangeRecord = {
        id: uuidv4(),
        type: previousState ? ChangeType.UPDATE : ChangeType.ADD,
        userId: this.options.user.id,
        entityType,
        entityId,
        previousState,
        newState: data,
        timestamp: Date.now(),
        synced: this.isConnected,
      };

      // Add to changes
      if (this.changes) {
        this.changes.push([changeRecord]);
      }

      // Notify subscribers
      this.changeSubject.next(changeRecord);
    }

    return true;
  }

  /**
   * Get entity
   */
  public getEntity<T>(entityType: EntityType, entityId: string): T | null {
    if (!this.ydoc) return null;

    let map: Y.Map<any> | null = null;

    // Select the appropriate map
    switch (entityType) {
      case EntityType.PROPERTY:
        map = this.properties;
        break;
      case EntityType.REPORT:
        map = this.reports;
        break;
      case EntityType.PHOTO:
        map = this.photos;
        break;
      case EntityType.SKETCH:
        map = this.sketches;
        break;
      case EntityType.COMPARABLE:
        map = this.comparables;
        break;
      case EntityType.MEASUREMENT:
        map = this.measurements;
        break;
      default:
        return null;
    }

    if (!map) return null;

    return (map.get(entityId) as T) || null;
  }

  /**
   * Get all entities
   */
  public getAllEntities<T>(entityType: EntityType): Record<string, T> {
    if (!this.ydoc) return {};

    let map: Y.Map<any> | null = null;

    // Select the appropriate map
    switch (entityType) {
      case EntityType.PROPERTY:
        map = this.properties;
        break;
      case EntityType.REPORT:
        map = this.reports;
        break;
      case EntityType.PHOTO:
        map = this.photos;
        break;
      case EntityType.SKETCH:
        map = this.sketches;
        break;
      case EntityType.COMPARABLE:
        map = this.comparables;
        break;
      case EntityType.MEASUREMENT:
        map = this.measurements;
        break;
      default:
        return {};
    }

    if (!map) return {};

    const result: Record<string, T> = {};
    map.forEach((value, key) => {
      result[key] = value as T;
    });

    return result;
  }

  /**
   * Delete entity
   */
  public deleteEntity(entityType: EntityType, entityId: string): boolean {
    if (!this.ydoc) return false;

    let map: Y.Map<any> | null = null;

    // Select the appropriate map
    switch (entityType) {
      case EntityType.PROPERTY:
        map = this.properties;
        break;
      case EntityType.REPORT:
        map = this.reports;
        break;
      case EntityType.PHOTO:
        map = this.photos;
        break;
      case EntityType.SKETCH:
        map = this.sketches;
        break;
      case EntityType.COMPARABLE:
        map = this.comparables;
        break;
      case EntityType.MEASUREMENT:
        map = this.measurements;
        break;
      default:
        return false;
    }

    if (!map) return false;

    // Get previous state for change tracking
    const previousState = map.get(entityId);

    if (!previousState) return false;

    // Delete entity
    map.delete(entityId);

    // Track change
    if (this.options.trackHistory) {
      const changeRecord: ChangeRecord = {
        id: uuidv4(),
        type: ChangeType.DELETE,
        userId: this.options.user.id,
        entityType,
        entityId,
        previousState,
        timestamp: Date.now(),
        synced: this.isConnected,
      };

      // Add to changes
      if (this.changes) {
        this.changes.push([changeRecord]);
      }

      // Notify subscribers
      this.changeSubject.next(changeRecord);
    }

    return true;
  }

  /**
   * Get connection stats
   */
  public getConnectionStats(): {
    isConnected: boolean;
    isConnecting: boolean;
    connectionAttempts: number;
    lastSyncTimestamp: number;
    activeUserCount: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      connectionAttempts: this.connectionAttempts,
      lastSyncTimestamp: this.lastSyncTimestamp,
      activeUserCount: this.activeUsers.size,
    };
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // Disconnect
    this.disconnect();

    // Clear app state listener
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    // Destroy CRDT document
    if (this.ydoc) {
      this.ydoc.destroy();
      this.ydoc = null;
    }

    // Clear local provider
    if (this.localProvider) {
      this.localProvider.destroy();
      this.localProvider = null;
    }

    // Clear data references
    this.properties = null;
    this.reports = null;
    this.photos = null;
    this.sketches = null;
    this.comparables = null;
    this.measurements = null;
    this.presence = null;
    this.comments = null;
    this.changes = null;
  }
}
