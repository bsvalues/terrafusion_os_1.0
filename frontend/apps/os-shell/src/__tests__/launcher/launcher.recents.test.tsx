/**
 * TerraFusion OS Launcher Recents Tests
 *
 * Tests for recents tracking, MRU ordering, and persistence.
 *
 * @module __tests__/launcher/launcher.recents.test
 * @vitest-environment jsdom
 * @see Slice 5: Launcher Polish
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

import {
    getMaxRecents,
    resetRecentsStore,
    useRecentsStore,
} from '../../components/launcher/recentsStore';
import {
    createMemoryAdapter,
    resetStorageAdapter,
    setStorageAdapter,
    type StorageAdapter,
} from '../../components/launcher/storageAdapter';

// ============================================================================
// Test Setup
// ============================================================================

describe('Launcher Recents', () => {
  let memoryAdapter: StorageAdapter;

  beforeEach(() => {
    // Use in-memory storage for tests
    memoryAdapter = createMemoryAdapter();
    setStorageAdapter(memoryAdapter);
    resetRecentsStore();
  });

  afterEach(() => {
    cleanup();
    resetStorageAdapter();
    resetRecentsStore();
  });

  // ==========================================================================
  // RecentsStore Unit Tests
  // ==========================================================================

  describe('RecentsStore', () => {
    it('starts_with_no_recents', () => {
      const state = useRecentsStore.getState();
      expect(state.recentIds).toEqual([]);
      expect(state.getRecentIds()).toEqual([]);
    });

    it('record_adds_item_to_recents', () => {
      const { record, getRecentIds } = useRecentsStore.getState();

      record('forge');

      expect(getRecentIds()).toContain('forge');
      expect(getRecentIds().length).toBe(1);
    });

    it('record_adds_to_front_mru_order', () => {
      const { record, getRecentIds } = useRecentsStore.getState();

      record('forge');
      record('atlas');
      record('dais');

      const recents = getRecentIds();
      expect(recents[0]).toBe('dais'); // Most recent
      expect(recents[1]).toBe('atlas');
      expect(recents[2]).toBe('forge'); // Oldest
    });

    it('record_dedupes_and_bumps_to_front', () => {
      const { record, getRecentIds } = useRecentsStore.getState();

      record('forge');
      record('atlas');
      record('dais');

      // Re-record forge (should bump to front)
      record('forge');

      const recents = getRecentIds();
      expect(recents[0]).toBe('forge'); // Now most recent
      expect(recents[1]).toBe('dais');
      expect(recents[2]).toBe('atlas');
      expect(recents.length).toBe(3); // No duplicates
    });

    it('record_caps_at_max_recents', () => {
      const { record, getRecentIds } = useRecentsStore.getState();
      const maxRecents = getMaxRecents();

      // Record more than max items
      for (let i = 0; i < maxRecents + 5; i++) {
        record(`item-${i}`);
      }

      const recents = getRecentIds();
      expect(recents.length).toBe(maxRecents);

      // Most recent should be the last recorded
      expect(recents[0]).toBe(`item-${maxRecents + 4}`);

      // Oldest items should be dropped
      expect(recents).not.toContain('item-0');
      expect(recents).not.toContain('item-1');
      expect(recents).not.toContain('item-2');
      expect(recents).not.toContain('item-3');
      expect(recents).not.toContain('item-4');
    });

    it('clear_removes_all_recents', () => {
      const { record, clear, getRecentIds } = useRecentsStore.getState();

      record('forge');
      record('atlas');
      record('dais');

      expect(getRecentIds().length).toBe(3);

      clear();

      expect(getRecentIds()).toEqual([]);
    });
  });

  // ==========================================================================
  // Persistence Tests
  // ==========================================================================

  describe('Recents Persistence', () => {
    it('recents_persist_via_storage_adapter', () => {
      const { record } = useRecentsStore.getState();

      record('forge');
      record('atlas');

      // Check storage has the data (key is 'recents', adapter adds prefix)
      const stored = memoryAdapter.get<string[]>('recents');
      expect(stored).toEqual(['atlas', 'forge']); // MRU order
    });

    it('hydrate_restores_recents_from_storage', () => {
      // Pre-populate storage (key is 'recents', adapter adds prefix)
      memoryAdapter.set('recents', ['dossier', 'gpt', 'forge']);

      // Hydrate store
      const { hydrate, getRecentIds } = useRecentsStore.getState();
      hydrate();

      expect(getRecentIds()).toEqual(['dossier', 'gpt', 'forge']);
    });

    it('recents_survive_store_reset_and_rehydrate', () => {
      const { record, hydrate } = useRecentsStore.getState();

      record('forge');
      record('atlas');

      // Reset store (simulates app restart)
      resetRecentsStore();

      // Verify store is empty
      expect(useRecentsStore.getState().recentIds).toEqual([]);

      // Hydrate from storage
      useRecentsStore.getState().hydrate();

      // Recents should be restored
      expect(useRecentsStore.getState().getRecentIds()).toEqual(['atlas', 'forge']);
    });

    it('clear_persists_removal', () => {
      const { record, clear } = useRecentsStore.getState();

      record('forge');
      record('atlas');

      clear();

      // Check storage has the data (key is 'recents', adapter adds prefix)
      const stored = memoryAdapter.get<string[]>('recents');
      expect(stored).toEqual([]);
    });

    it('handles_empty_storage_gracefully', () => {
      const { hydrate, getRecentIds } = useRecentsStore.getState();

      hydrate();

      expect(getRecentIds()).toEqual([]);
    });

    it('hydrate_caps_loaded_data_at_max', () => {
      const maxRecents = getMaxRecents();

      // Pre-populate storage with more than max (key is 'recents', adapter adds prefix)
      const oversizedList = Array.from({ length: maxRecents + 5 }, (_, i) => `item-${i}`);
      memoryAdapter.set('recents', oversizedList);

      const { hydrate, getRecentIds } = useRecentsStore.getState();
      hydrate();

      expect(getRecentIds().length).toBe(maxRecents);
    });
  });

  // ==========================================================================
  // MRU Ordering Tests
  // ==========================================================================

  describe('MRU Ordering', () => {
    it('index_0_is_most_recent', () => {
      const { record, getRecentIds } = useRecentsStore.getState();

      record('first');
      record('second');
      record('third');

      expect(getRecentIds()[0]).toBe('third');
    });

    it('reactivation_updates_order', () => {
      const { record, getRecentIds } = useRecentsStore.getState();

      record('a');
      record('b');
      record('c');

      // Reactivate 'a'
      record('a');

      expect(getRecentIds()).toEqual(['a', 'c', 'b']);
    });

    it('multiple_reactivations_maintain_order', () => {
      const { record, getRecentIds } = useRecentsStore.getState();

      record('a');
      record('b');
      record('c');
      record('d');

      // Reactivate in specific order
      record('b');
      record('a');
      record('c');

      expect(getRecentIds()[0]).toBe('c');
      expect(getRecentIds()[1]).toBe('a');
      expect(getRecentIds()[2]).toBe('b');
      expect(getRecentIds()[3]).toBe('d');
    });
  });

  // ==========================================================================
  // Zustand Reactivity Tests
  // ==========================================================================

  describe('Zustand Reactivity', () => {
    it('subscribers_notified_on_record', () => {
      const listener = vi.fn();

      const unsub = useRecentsStore.subscribe(listener);

      useRecentsStore.getState().record('forge');

      expect(listener).toHaveBeenCalled();

      unsub();
    });

    it('subscribers_notified_on_clear', () => {
      useRecentsStore.getState().record('forge');

      const listener = vi.fn();
      const unsub = useRecentsStore.subscribe(listener);

      useRecentsStore.getState().clear();

      expect(listener).toHaveBeenCalled();

      unsub();
    });
  });
});
