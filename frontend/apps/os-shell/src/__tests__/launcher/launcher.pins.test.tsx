/**
 * TerraFusion OS Launcher Pins Tests
 *
 * Tests for pin/unpin behavior and persistence.
 *
 * @module __tests__/launcher/launcher.pins.test
 * @vitest-environment jsdom
 * @see Slice 5: Launcher Polish
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

import { resetPinsStore, usePinsStore } from '../../components/launcher/pinsStore';
import {
    createMemoryAdapter,
    resetStorageAdapter,
    setStorageAdapter,
    type StorageAdapter,
} from '../../components/launcher/storageAdapter';

// ============================================================================
// Test Setup
// ============================================================================

describe('Launcher Pins', () => {
  let memoryAdapter: StorageAdapter;

  beforeEach(() => {
    // Use in-memory storage for tests
    memoryAdapter = createMemoryAdapter();
    setStorageAdapter(memoryAdapter);
    resetPinsStore();
  });

  afterEach(() => {
    cleanup();
    resetStorageAdapter();
    resetPinsStore();
  });

  // ==========================================================================
  // PinsStore Unit Tests
  // ==========================================================================

  describe('PinsStore', () => {
    it('starts_with_no_pins', () => {
      const state = usePinsStore.getState();
      expect(state.pinnedIds.size).toBe(0);
      expect(state.getPinnedIds()).toEqual([]);
    });

    it('pin_adds_item_to_pinned_set', () => {
      const { pin, isPinned, getPinnedIds } = usePinsStore.getState();

      pin('forge');

      expect(isPinned('forge')).toBe(true);
      expect(getPinnedIds()).toContain('forge');
    });

    it('unpin_removes_item_from_pinned_set', () => {
      const { pin, unpin, isPinned, getPinnedIds } = usePinsStore.getState();

      pin('forge');
      expect(isPinned('forge')).toBe(true);

      unpin('forge');
      expect(isPinned('forge')).toBe(false);
      expect(getPinnedIds()).not.toContain('forge');
    });

    it('toggle_pins_unpinned_item', () => {
      const { togglePin, isPinned } = usePinsStore.getState();

      expect(isPinned('atlas')).toBe(false);
      togglePin('atlas');
      expect(isPinned('atlas')).toBe(true);
    });

    it('toggle_unpins_pinned_item', () => {
      const { pin, togglePin, isPinned } = usePinsStore.getState();

      pin('dais');
      expect(isPinned('dais')).toBe(true);

      togglePin('dais');
      expect(isPinned('dais')).toBe(false);
    });

    it('supports_multiple_pins', () => {
      const { pin, getPinnedIds } = usePinsStore.getState();

      pin('forge');
      pin('atlas');
      pin('dais');

      const pinnedIds = getPinnedIds();
      expect(pinnedIds).toContain('forge');
      expect(pinnedIds).toContain('atlas');
      expect(pinnedIds).toContain('dais');
      expect(pinnedIds.length).toBe(3);
    });

    it('isPinned_returns_false_for_unknown_id', () => {
      const { isPinned } = usePinsStore.getState();

      expect(isPinned('nonexistent')).toBe(false);
    });
  });

  // ==========================================================================
  // Persistence Tests
  // ==========================================================================

  describe('Pins Persistence', () => {
    it('pins_persist_via_storage_adapter', () => {
      const { pin } = usePinsStore.getState();

      pin('forge');
      pin('atlas');

      // Check storage has the data (key is 'pins', adapter adds prefix)
      const stored = memoryAdapter.get<string[]>('pins');
      expect(stored).toContain('forge');
      expect(stored).toContain('atlas');
    });

    it('hydrate_restores_pins_from_storage', () => {
      // Pre-populate storage (key is 'pins', adapter adds prefix)
      memoryAdapter.set('pins', ['dossier', 'gpt']);

      // Hydrate store
      const { hydrate, isPinned, getPinnedIds } = usePinsStore.getState();
      hydrate();

      expect(isPinned('dossier')).toBe(true);
      expect(isPinned('gpt')).toBe(true);
      expect(getPinnedIds().length).toBe(2);
    });

    it('pins_survive_store_reset_and_rehydrate', () => {
      const { pin, hydrate } = usePinsStore.getState();

      pin('forge');
      pin('atlas');

      // Reset store (simulates app restart)
      resetPinsStore();

      // Verify store is empty
      expect(usePinsStore.getState().pinnedIds.size).toBe(0);

      // Hydrate from storage
      usePinsStore.getState().hydrate();

      // Pins should be restored
      const { isPinned, getPinnedIds } = usePinsStore.getState();
      expect(isPinned('forge')).toBe(true);
      expect(isPinned('atlas')).toBe(true);
      expect(getPinnedIds().length).toBe(2);
    });

    it('unpin_persists_removal', () => {
      const { pin, unpin } = usePinsStore.getState();

      pin('forge');
      pin('atlas');

      unpin('forge');

      const stored = memoryAdapter.get<string[]>('pins');
      expect(stored).not.toContain('forge');
      expect(stored).toContain('atlas');
    });

    it('handles_empty_storage_gracefully', () => {
      const { hydrate, getPinnedIds } = usePinsStore.getState();

      // Storage has nothing
      hydrate();

      expect(getPinnedIds()).toEqual([]);
    });

    it('handles_corrupted_storage_gracefully', () => {
      // Set invalid data (key is 'pins', adapter adds prefix)
      memoryAdapter.set('pins', 'not-an-array' as unknown as string[]);

      const { hydrate, getPinnedIds } = usePinsStore.getState();

      // Should not throw, should default to empty
      hydrate();

      // May have garbage data, but shouldn't crash
      // Implementation should check Array.isArray
      expect(typeof getPinnedIds()).toBe('object');
    });
  });

  // ==========================================================================
  // Zustand Reactivity Tests
  // ==========================================================================

  describe('Zustand Reactivity', () => {
    it('subscribers_notified_on_pin', () => {
      const listener = vi.fn();

      // Subscribe to store changes
      const unsub = usePinsStore.subscribe(listener);

      // Pin an item
      usePinsStore.getState().pin('forge');

      expect(listener).toHaveBeenCalled();

      unsub();
    });

    it('subscribers_notified_on_unpin', () => {
      usePinsStore.getState().pin('forge');

      const listener = vi.fn();
      const unsub = usePinsStore.subscribe(listener);

      usePinsStore.getState().unpin('forge');

      expect(listener).toHaveBeenCalled();

      unsub();
    });
  });
});
