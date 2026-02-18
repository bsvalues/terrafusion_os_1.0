import {
  CANON_LAYOUT_STORAGE_KEY,
  defaultCanonLayoutV1,
  loadCanonLayout,
  saveCanonLayout,
} from '../../canon/layoutPersistence';

describe('Phase 50 contract: TerraCanon layout persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves valid v1 envelope and round-trips layout', () => {
    const layout = {
      leftPaneWidth: 320,
      rightPaneWidth: 280,
      inspectorOpen: false,
    };

    saveCanonLayout(layout);

    const raw = localStorage.getItem(CANON_LAYOUT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain('"version":1');

    expect(loadCanonLayout()).toEqual(layout);
  });

  it('malformed or unknown envelope fails closed and clears storage key', () => {
    const fallback = defaultCanonLayoutV1();

    localStorage.setItem(CANON_LAYOUT_STORAGE_KEY, '{not-json');
    expect(loadCanonLayout()).toEqual(fallback);
    expect(localStorage.getItem(CANON_LAYOUT_STORAGE_KEY)).toBeNull();

    localStorage.setItem(
      CANON_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        layout: {
          leftPaneWidth: 111,
          rightPaneWidth: 222,
          inspectorOpen: true,
        },
      })
    );
    expect(loadCanonLayout()).toEqual(fallback);
    expect(localStorage.getItem(CANON_LAYOUT_STORAGE_KEY)).toBeNull();
  });
});
