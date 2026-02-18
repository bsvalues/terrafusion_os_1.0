import {
  CANON_LAYOUT_STORAGE_KEY,
  defaultCanonLayoutV1,
  loadCanonLayout,
  saveCanonLayout,
} from '../../canon/layoutPersistence';

describe('Phase 50/50.1 contract: TerraCanon layout persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves canonical v1 envelope and round-trips layout', () => {
    const layout = {
      panels: {
        leftNav: { visible: true, size: 300 },
        main: { visible: true, size: 1 },
        rightInspector: { visible: false, size: 280 },
      },
    };

    saveCanonLayout(layout);

    const raw = localStorage.getItem(CANON_LAYOUT_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string);
    expect(parsed.v).toBe(1);
    expect(typeof parsed.ts).toBe('number');
    expect(parsed.layout).toEqual(layout);
    expect(Object.keys(parsed).sort()).toEqual(['layout', 'ts', 'v']);

    expect(loadCanonLayout()).toEqual(layout);
  });

  it('malformed, unknown version, or extra keys fail closed and clear storage key', () => {
    const fallback = defaultCanonLayoutV1();

    localStorage.setItem(CANON_LAYOUT_STORAGE_KEY, '{not-json');
    expect(loadCanonLayout()).toEqual(fallback);
    expect(localStorage.getItem(CANON_LAYOUT_STORAGE_KEY)).toBeNull();

    localStorage.setItem(
      CANON_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        v: 2,
        layout: fallback,
        ts: Date.now(),
      })
    );
    expect(loadCanonLayout()).toEqual(fallback);
    expect(localStorage.getItem(CANON_LAYOUT_STORAGE_KEY)).toBeNull();

    localStorage.setItem(
      CANON_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        layout: fallback,
        ts: Date.now(),
        extra: true,
      })
    );
    expect(loadCanonLayout()).toEqual(fallback);
    expect(localStorage.getItem(CANON_LAYOUT_STORAGE_KEY)).toBeNull();
  });
});
