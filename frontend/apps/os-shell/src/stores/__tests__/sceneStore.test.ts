/**
 * Scene Store Tests — Phase 8 Context Mode
 */

import { useSceneStore, SCENE_LIBRARY } from '../sceneStore';

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState({ activeSceneId: null });
  });

  it('starts with no active scene', () => {
    expect(useSceneStore.getState().activeSceneId).toBeNull();
  });

  it('activates a scene by ID', () => {
    useSceneStore.getState().activateScene('ingestion-gate');
    expect(useSceneStore.getState().activeSceneId).toBe('ingestion-gate');
  });

  it('clears the active scene', () => {
    useSceneStore.getState().activateScene('ratio-study');
    useSceneStore.getState().clearScene();
    expect(useSceneStore.getState().activeSceneId).toBeNull();
  });

  it('getScene returns a scene by ID', () => {
    const scene = useSceneStore.getState().getScene('appeal-defense');
    expect(scene).toBeDefined();
    expect(scene!.label).toBe('Appeal Defense Pack');
    expect(scene!.windows.length).toBe(3);
  });

  it('getScene returns undefined for unknown ID', () => {
    const scene = useSceneStore.getState().getScene('nonexistent');
    expect(scene).toBeUndefined();
  });
});

describe('SCENE_LIBRARY', () => {
  it('contains at least 5 canonical scenes', () => {
    expect(SCENE_LIBRARY.length).toBeGreaterThanOrEqual(5);
  });

  it('every scene has required fields', () => {
    for (const scene of SCENE_LIBRARY) {
      expect(scene.id).toBeTruthy();
      expect(scene.label).toBeTruthy();
      expect(scene.description).toBeTruthy();
      expect(scene.category).toBeTruthy();
      expect(scene.icon).toBeTruthy();
      expect(scene.windows.length).toBeGreaterThanOrEqual(1);
      expect(scene.keywords.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all scene IDs are unique', () => {
    const ids = SCENE_LIBRARY.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every window references a known module ID pattern', () => {
    for (const scene of SCENE_LIBRARY) {
      for (const w of scene.windows) {
        expect(w.moduleId).toMatch(/^suite-/);
      }
    }
  });
});
