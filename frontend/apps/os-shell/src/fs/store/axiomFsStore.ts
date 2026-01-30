import { create } from 'zustand';
import { FEATURES } from '@/config/features';
import { GOLDEN_LATTICE, GOLDEN_PARCEL_ID } from '@/data/goldenParcel';
import { ModuleContext, SovereignObject } from '../types';

interface AxiomFsState {
  // The Truth
  objects: Map<string, SovereignObject>;

  // The Focus (Input for Layout Engine)
  selectedId: string | null;
  activeModule: ModuleContext | null;
  searchQuery: string;

  // Actions
  registerObjects: (newObjects: SovereignObject[]) => void;
  loadObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setModule: (module: ModuleContext) => void;
  setSearchQuery: (query: string) => void;
}

export const useAxiomFsStore = create<AxiomFsState>((set) => {
  const initialObjects = new Map<string, SovereignObject>();

  if (FEATURES.USE_MOCK_DATA) {
    GOLDEN_LATTICE.forEach((obj) => initialObjects.set(obj.id, obj));
  }

  return {
    objects: initialObjects,
    selectedId: FEATURES.USE_MOCK_DATA ? GOLDEN_PARCEL_ID : null,
    activeModule: null,
    searchQuery: '',

    registerObjects: (newObjects) =>
      set((state) => {
        const updated = new Map(state.objects);
        newObjects.forEach((obj) => updated.set(obj.id, obj));
        return { objects: updated };
      }),
    loadObject: (id) =>
      set((state) => {
        if (state.objects.has(id)) {
          return {};
        }
        const updated = new Map(state.objects);
        updated.set(id, {
          id,
          label: id,
          type: 'document',
          status: 'draft',
          relations: [],
          tags: [],
          metadata: { source: 'placeholder' },
        });
        return { objects: updated, selectedId: id };
      }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    selectObject: (id) => set({ selectedId: id }),
    setModule: (module) => set({ activeModule: module }),
  };
});
