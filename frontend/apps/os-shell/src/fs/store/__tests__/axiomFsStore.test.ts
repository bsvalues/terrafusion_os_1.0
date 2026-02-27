import { act } from '@testing-library/react';
import { SovereignObject } from '../../types';
import { useAxiomFsStore } from '../axiomFsStore';

vi.mock('@/config/features', () => ({
  FEATURES: {
    ENABLE_AXIOM_FS: true,
    ENABLE_DASHBOARD: true,
    ENABLE_SIMULATION_ENGINE: true,
    ENABLE_REDUCED_MOTION: false,
    ENABLE_DEBUG_OVERLAYS: false,
    USE_MOCK_DATA: false,
  },
}));

describe('AxiomFS Store', () => {
  beforeEach(() => {
    // Reset store
    act(() => {
      useAxiomFsStore.setState({
        objects: new Map(),
        selectedId: null,
        activeModule: null,
        searchQuery: '',
      });
    });
  });

  const mockObject: SovereignObject = {
    id: 'test-obj-1',
    label: 'Test Object',
    type: 'document',
    status: 'verified',
    relations: [],
    tags: ['test'],
  };

  test('should initialize with default state', () => {
    const state = useAxiomFsStore.getState();
    expect(state.objects.size).toBe(0);
    expect(state.selectedId).toBeNull();
    expect(state.activeModule).toBeNull();
    expect(state.searchQuery).toBe('');
  });

  test('should register objects', () => {
    act(() => {
      useAxiomFsStore.getState().registerObjects([mockObject]);
    });

    const state = useAxiomFsStore.getState();
    expect(state.objects.size).toBe(1);
    expect(state.objects.get('test-obj-1')).toEqual(mockObject);
  });

  test('should select object', () => {
    act(() => {
      useAxiomFsStore.getState().selectObject('test-obj-1');
    });

    const state = useAxiomFsStore.getState();
    expect(state.selectedId).toBe('test-obj-1');
  });

  test('should set search query', () => {
    act(() => {
      useAxiomFsStore.getState().setSearchQuery('test query');
    });

    const state = useAxiomFsStore.getState();
    expect(state.searchQuery).toBe('test query');
  });

  test('should set active module', () => {
    const moduleCtx = {
      moduleId: 'test-module',
      viewMode: 'grid' as const,
    };

    act(() => {
      useAxiomFsStore.getState().setModule(moduleCtx);
    });

    const state = useAxiomFsStore.getState();
    expect(state.activeModule).toEqual(moduleCtx);
  });
});
