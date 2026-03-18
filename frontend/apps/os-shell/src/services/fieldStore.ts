/**
 * Field Studio Local Store — Offline-First Field Observations
 * ===================================================================
 * localStorage-backed offline queue for field observations.
 * Queue entries with photo refs, GPS coords, notes.
 * Syncs to backend when online.
 *
 * Future: migrate to IndexedDB for larger payload support.
 */

const STORE_KEY = 'terrafusion:field-observations';

// ============================================================================
// Types
// ============================================================================

export interface FieldObservation {
  id: string;
  parcelId: string;
  timestamp: string;
  lat: number;
  lng: number;
  photos: string[];
  notes: string;
  condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor' | 'demolished';
  synced: boolean;
}

// ============================================================================
// FieldStore
// ============================================================================

export class FieldStore {
  private getAll(): FieldObservation[] {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(observations: FieldObservation[]): void {
    localStorage.setItem(STORE_KEY, JSON.stringify(observations));
  }

  /** Save a new field observation to local store. */
  async save(obs: FieldObservation): Promise<void> {
    const all = this.getAll();
    const idx = all.findIndex((o) => o.id === obs.id);
    if (idx >= 0) {
      all[idx] = obs;
    } else {
      all.push(obs);
    }
    this.persist(all);
  }

  /** Get all observations not yet synced to backend. */
  async getUnsyncedAll(): Promise<FieldObservation[]> {
    return this.getAll().filter((o) => !o.synced);
  }

  /** Mark an observation as synced after successful backend upload. */
  async markSynced(id: string): Promise<void> {
    const all = this.getAll();
    const obs = all.find((o) => o.id === id);
    if (obs) {
      obs.synced = true;
      this.persist(all);
    }
  }

  /** Get all observations for a specific parcel. */
  async getByParcel(parcelId: string): Promise<FieldObservation[]> {
    return this.getAll().filter((o) => o.parcelId === parcelId);
  }

  /** Get a single observation by ID. */
  async getById(id: string): Promise<FieldObservation | undefined> {
    return this.getAll().find((o) => o.id === id);
  }

  /** Delete an observation by ID. */
  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((o) => o.id !== id);
    this.persist(all);
  }

  /** Get count of unsynced observations. */
  async getUnsyncedCount(): Promise<number> {
    return this.getAll().filter((o) => !o.synced).length;
  }

  /** Sync all unsynced observations to backend. Returns IDs that were synced. */
  async syncToBackend(): Promise<string[]> {
    const unsynced = await this.getUnsyncedAll();
    const syncedIds: string[] = [];

    for (const obs of unsynced) {
      try {
        const res = await fetch('/api/field/observations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obs),
        });
        if (res.ok) {
          await this.markSynced(obs.id);
          syncedIds.push(obs.id);
        }
      } catch {
        // Offline or backend error — skip, will retry next sync
      }
    }

    return syncedIds;
  }
}

/** Singleton instance for app-wide use. */
export const fieldStore = new FieldStore();
