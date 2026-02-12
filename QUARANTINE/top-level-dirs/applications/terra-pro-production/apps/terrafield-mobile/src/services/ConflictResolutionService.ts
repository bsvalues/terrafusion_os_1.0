import AsyncStorage from "@react-native-async-storage/async-storage";
import { FieldNote } from "./DataSyncService";

// Conflict resolution strategies
export enum ConflictResolutionStrategy {
  SERVER_WINS = "server_wins",
  CLIENT_WINS = "client_wins",
  NEWEST_WINS = "newest_wins",
  MANUAL = "manual",
}

// Conflict type
export interface Conflict<T> {
  id: string;
  localData: T;
  serverData: T;
  resolved: boolean;
  resolution?: T;
  timestamp: string;
}

// Resolution preferences type
export interface ConflictResolutionPreferences {
  strategy: ConflictResolutionStrategy;
  notifyOnConflict: boolean;
  autoResolveThreshold: number; // Time in milliseconds (e.g., 24 hours = 86400000)
}

// Main service class
export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private preferences: ConflictResolutionPreferences;
  private conflicts: Map<string, Conflict<any>>;

  // Private constructor
  private constructor() {
    this.preferences = {
      strategy: ConflictResolutionStrategy.NEWEST_WINS,
      notifyOnConflict: true,
      autoResolveThreshold: 86400000, // 24 hours
    };

    this.conflicts = new Map();

    // Load preferences and conflicts
    this.loadPreferences();
    this.loadConflicts();
  }

  // Get instance (singleton)
  public static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }

  // Get preferences
  public getPreferences(): ConflictResolutionPreferences {
    return { ...this.preferences };
  }

  // Set preferences
  public setPreferences(preferences: Partial<ConflictResolutionPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };

    this.savePreferences();
  }

  // Get conflicts
  public getConflicts<T>(): Conflict<T>[] {
    return Array.from(this.conflicts.values()) as Conflict<T>[];
  }

  // Get unresolved conflicts
  public getUnresolvedConflicts<T>(): Conflict<T>[] {
    return Array.from(this.conflicts.values()).filter(
      (conflict) => !conflict.resolved
    ) as Conflict<T>[];
  }

  // Get conflict by ID
  public getConflict<T>(id: string): Conflict<T> | undefined {
    return this.conflicts.get(id) as Conflict<T> | undefined;
  }

  // Detect and record conflict
  public detectConflict<T extends { id: string; updatedAt?: string }>(
    localData: T,
    serverData: T
  ): Conflict<T> | null {
    // If IDs don't match, not a conflict
    if (localData.id !== serverData.id) {
      return null;
    }

    // Create conflict object
    const conflict: Conflict<T> = {
      id: localData.id,
      localData,
      serverData,
      resolved: false,
      timestamp: new Date().toISOString(),
    };

    // Store conflict
    this.conflicts.set(conflict.id, conflict);
    this.saveConflicts();

    return conflict;
  }

  // Resolve a conflict manually
  public resolveConflict<T>(id: string, resolution: T): Conflict<T> {
    const conflict = this.conflicts.get(id) as Conflict<T>;

    if (!conflict) {
      throw new Error(`Conflict with ID ${id} not found`);
    }

    conflict.resolved = true;
    conflict.resolution = resolution;

    this.conflicts.set(id, conflict);
    this.saveConflicts();

    return conflict;
  }

  // Resolve a Field Note conflict
  public resolveNoteConflict(localNote: FieldNote, serverNote: FieldNote): FieldNote {
    // Get or create conflict
    let conflict = this.conflicts.get(localNote.id) as Conflict<FieldNote>;

    if (!conflict) {
      conflict = this.detectConflict(localNote, serverNote) || {
        id: localNote.id,
        localData: localNote,
        serverData: serverNote,
        resolved: false,
        timestamp: new Date().toISOString(),
      };
    }

    // If already resolved, return resolution
    if (conflict.resolved && conflict.resolution) {
      return conflict.resolution;
    }

    // Auto-resolve based on strategy
    let resolution: FieldNote;

    switch (this.preferences.strategy) {
      case ConflictResolutionStrategy.SERVER_WINS:
        resolution = { ...serverNote };
        break;

      case ConflictResolutionStrategy.CLIENT_WINS:
        resolution = { ...localNote };
        break;

      case ConflictResolutionStrategy.NEWEST_WINS:
        // Compare updated timestamps
        const localDate = localNote.updatedAt
          ? new Date(localNote.updatedAt).getTime()
          : new Date(localNote.createdAt).getTime();

        const serverDate = serverNote.updatedAt
          ? new Date(serverNote.updatedAt).getTime()
          : new Date(serverNote.createdAt).getTime();

        resolution = localDate > serverDate ? { ...localNote } : { ...serverNote };
        break;

      case ConflictResolutionStrategy.MANUAL:
        // Keep as unresolved if manual resolution is required
        resolution = { ...localNote, syncStatus: "conflict" };
        break;

      default:
        resolution = { ...localNote, syncStatus: "conflict" };
    }

    // Mark as resolved if not manual strategy
    if (this.preferences.strategy !== ConflictResolutionStrategy.MANUAL) {
      conflict.resolved = true;
      conflict.resolution = resolution;

      this.conflicts.set(conflict.id, conflict);
      this.saveConflicts();
    }

    return resolution;
  }

  // Resolve all Field Note conflicts in a batch
  public resolveFieldNoteConflicts(localNotes: FieldNote[], serverNotes: FieldNote[]): FieldNote[] {
    // Map notes by ID for quick lookup
    const localNotesMap = new Map<string, FieldNote>();
    const serverNotesMap = new Map<string, FieldNote>();

    localNotes.forEach((note) => localNotesMap.set(note.id, note));
    serverNotes.forEach((note) => serverNotesMap.set(note.id, note));

    // Find conflicts
    const conflictIds = new Set<string>();

    // Check all local notes for conflicts
    localNotesMap.forEach((localNote, id) => {
      const serverNote = serverNotesMap.get(id);
      if (serverNote) {
        conflictIds.add(id);
      }
    });

    // Resolve each conflict
    const resolvedNotes: FieldNote[] = [];

    // Add notes from local that don't conflict
    localNotes.forEach((note) => {
      if (!conflictIds.has(note.id)) {
        resolvedNotes.push(note);
      }
    });

    // Add notes from server that don't conflict
    serverNotes.forEach((note) => {
      if (!conflictIds.has(note.id)) {
        resolvedNotes.push(note);
      }
    });

    // Resolve conflicts
    conflictIds.forEach((id) => {
      const localNote = localNotesMap.get(id)!;
      const serverNote = serverNotesMap.get(id)!;

      resolvedNotes.push(this.resolveNoteConflict(localNote, serverNote));
    });

    return resolvedNotes;
  }

  // Clear resolved conflicts
  public clearResolvedConflicts(): void {
    // Keep only unresolved conflicts
    const unresolvedConflicts = new Map<string, Conflict<any>>();

    this.conflicts.forEach((conflict, id) => {
      if (!conflict.resolved) {
        unresolvedConflicts.set(id, conflict);
      }
    });

    this.conflicts = unresolvedConflicts;
    this.saveConflicts();
  }

  // Clear all conflicts
  public clearAllConflicts(): void {
    this.conflicts.clear();
    this.saveConflicts();
  }

  // Load preferences from storage
  private async loadPreferences(): Promise<void> {
    try {
      const preferencesJson = await AsyncStorage.getItem(
        "terrafield_conflict_resolution_preferences"
      );

      if (preferencesJson) {
        this.preferences = JSON.parse(preferencesJson);
      }
    } catch (error) {
      console.error("Failed to load conflict resolution preferences:", error);
    }
  }

  // Save preferences to storage
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "terrafield_conflict_resolution_preferences",
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error("Failed to save conflict resolution preferences:", error);
    }
  }

  // Load conflicts from storage
  private async loadConflicts(): Promise<void> {
    try {
      const conflictsJson = await AsyncStorage.getItem("terrafield_conflicts");

      if (conflictsJson) {
        const conflicts = JSON.parse(conflictsJson) as Conflict<any>[];
        this.conflicts = new Map(conflicts.map((conflict) => [conflict.id, conflict]));
      }
    } catch (error) {
      console.error("Failed to load conflicts:", error);
    }
  }

  // Save conflicts to storage
  private async saveConflicts(): Promise<void> {
    try {
      const conflicts = Array.from(this.conflicts.values());

      await AsyncStorage.setItem("terrafield_conflicts", JSON.stringify(conflicts));
    } catch (error) {
      console.error("Failed to save conflicts:", error);
    }
  }
}

export default ConflictResolutionService;
