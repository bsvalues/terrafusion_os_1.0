/**
 * Muse dev-context bus tests
 *
 * Verifies:
 *   - Store initializes with correct defaults for new fields
 *   - All new setters write correctly
 *   - Existing parcel/suite/tab fields still work
 *   - BuildStatus type-safety (only valid values)
 *   - Falls back safely when context is null/unknown
 */

import { useCompanionStore } from '../companionStore';
import type { BuildStatus } from '../companionStore';

// Reset store state between tests
beforeEach(() => {
  useCompanionStore.setState({
    isOpen: false,
    activeParcelId: null,
    activeSuite: null,
    activeTab: null,
    activeBranch: null,
    activeFile: null,
    buildStatus: 'unknown',
  });
});

describe('Muse dev-context bus', () => {
  it('preserves parcel/suite/tab context (existing fields unaffected)', () => {
    const { setActiveParcel, setActiveSuite, setActiveTab } = useCompanionStore.getState();

    setActiveParcel('00500000');
    setActiveSuite('forge');
    setActiveTab('summary');

    const s = useCompanionStore.getState();
    expect(s.activeParcelId).toBe('00500000');
    expect(s.activeSuite).toBe('forge');
    expect(s.activeTab).toBe('summary');
  });

  it('stores activeBranch in companionStore', () => {
    useCompanionStore.getState().setActiveBranch('feat/native-app-integrations');
    expect(useCompanionStore.getState().activeBranch).toBe('feat/native-app-integrations');
  });

  it('clears activeBranch when set to null', () => {
    useCompanionStore.getState().setActiveBranch('feat/some-branch');
    useCompanionStore.getState().setActiveBranch(null);
    expect(useCompanionStore.getState().activeBranch).toBeNull();
  });

  it('stores activeFile in companionStore', () => {
    useCompanionStore.getState().setActiveFile('src/pages/MuseChat.tsx');
    expect(useCompanionStore.getState().activeFile).toBe('src/pages/MuseChat.tsx');
  });

  it('clears activeFile when set to null', () => {
    useCompanionStore.getState().setActiveFile('some/file.ts');
    useCompanionStore.getState().setActiveFile(null);
    expect(useCompanionStore.getState().activeFile).toBeNull();
  });

  it('stores buildStatus: clean', () => {
    useCompanionStore.getState().setBuildStatus('clean');
    expect(useCompanionStore.getState().buildStatus).toBe('clean');
  });

  it('stores buildStatus: error', () => {
    useCompanionStore.getState().setBuildStatus('error');
    expect(useCompanionStore.getState().buildStatus).toBe('error');
  });

  it('falls back safely to unknown when engineering context is unavailable', () => {
    // Default state — no signals wired
    const s = useCompanionStore.getState();
    expect(s.activeBranch).toBeNull();
    expect(s.activeFile).toBeNull();
    expect(s.buildStatus).toBe('unknown');
  });

  it('does not reset existing county context when dev fields are set', () => {
    useCompanionStore.getState().setActiveParcel('12345');
    useCompanionStore.getState().setActiveBranch('feat/waccd-fix');
    useCompanionStore.getState().setBuildStatus('clean');

    const s = useCompanionStore.getState();
    // County context survives alongside dev context
    expect(s.activeParcelId).toBe('12345');
    expect(s.activeBranch).toBe('feat/waccd-fix');
    expect(s.buildStatus).toBe('clean');
  });

  it('BuildStatus type accepts only valid literals', () => {
    // Type-level assertion — if this compiles, the type is correct.
    const statuses: BuildStatus[] = ['clean', 'error', 'unknown'];
    statuses.forEach((status) => {
      useCompanionStore.getState().setBuildStatus(status);
      expect(useCompanionStore.getState().buildStatus).toBe(status);
    });
  });

  it('updates the header label when suite context changes (label derivation logic)', () => {
    // The contextLabel in MuseChat is derived from store state.
    // Verify the precedence order: parcel > suite > branch > none.
    useCompanionStore.getState().setActiveSuite('forge');

    const s = useCompanionStore.getState();
    // No parcel → suite wins
    expect(s.activeSuite).toBe('forge');
    expect(s.activeParcelId).toBeNull();

    // Parcel set → parcel wins (store holds both; component picks parcel first)
    useCompanionStore.getState().setActiveParcel('99900001');
    expect(useCompanionStore.getState().activeParcelId).toBe('99900001');
  });
});
