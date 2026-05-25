import { beforeEach, describe, expect, it } from 'vitest';
import { deriveWindowType, getModuleWindowSize, useDesktopStore } from '../../stores/desktopStore';

function resetStore() {
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    snapPreview: null,
  });
}

describe('deriveWindowType', () => {
  it('returns companion for os-pilot', () => {
    expect(deriveWindowType('os-pilot')).toBe('companion');
  });

  it('returns workbench for property-workbench', () => {
    expect(deriveWindowType('property-workbench')).toBe('workbench');
  });

  it('returns suite for moduleIds starting with suite-', () => {
    expect(deriveWindowType('suite-forge')).toBe('suite');
    expect(deriveWindowType('suite-atlas')).toBe('suite');
  });

  it('returns normal for unrecognised moduleId', () => {
    expect(deriveWindowType('terra-levy')).toBe('normal');
    expect(deriveWindowType('some-unknown')).toBe('normal');
  });
});

describe('property-workbench priority-window activation', () => {
  beforeEach(resetStore);

  it('ignores stale defaultMaximized activation payloads', () => {
    const expectedSize = getModuleWindowSize('property-workbench');
    const windowId = useDesktopStore
      .getState()
      .openWindow('property-workbench', 'Property Workbench', 'home', {
        defaultMaximized: true,
        parcelId: '53005-001',
      });

    const windowData = useDesktopStore.getState().getWindowById(windowId);

    expect(windowData?.state).toBe('normal');
    expect(windowData?.size).toEqual(expectedSize.size);
    expect(windowData?.metadata?.defaultMaximized).toBeUndefined();
    expect(windowData?.metadata?.parcelId).toBe('53005-001');
  });
});
