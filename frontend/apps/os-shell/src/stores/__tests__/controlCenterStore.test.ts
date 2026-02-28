/**
 * controlCenterStore unit tests.
 */

import { useControlCenterStore } from '../controlCenterStore';

beforeEach(() => {
  useControlCenterStore.setState({
    isOpen: false,
    mapLayers: {
      parcels: true,
      zoning: false,
      flood: false,
      aerial: true,
      contours: false,
    },
    modelVersion: 'v2026.1',
  });
});

describe('controlCenterStore', () => {
  it('starts closed', () => {
    expect(useControlCenterStore.getState().isOpen).toBe(false);
  });

  it('open() sets isOpen to true', () => {
    useControlCenterStore.getState().open();
    expect(useControlCenterStore.getState().isOpen).toBe(true);
  });

  it('close() sets isOpen to false', () => {
    useControlCenterStore.getState().open();
    useControlCenterStore.getState().close();
    expect(useControlCenterStore.getState().isOpen).toBe(false);
  });

  it('toggle() flips isOpen', () => {
    useControlCenterStore.getState().toggle();
    expect(useControlCenterStore.getState().isOpen).toBe(true);
    useControlCenterStore.getState().toggle();
    expect(useControlCenterStore.getState().isOpen).toBe(false);
  });

  it('toggleMapLayer() flips a layer', () => {
    useControlCenterStore.getState().toggleMapLayer('zoning');
    expect(useControlCenterStore.getState().mapLayers.zoning).toBe(true);
    useControlCenterStore.getState().toggleMapLayer('zoning');
    expect(useControlCenterStore.getState().mapLayers.zoning).toBe(false);
  });

  it('toggleMapLayer() preserves other layers', () => {
    useControlCenterStore.getState().toggleMapLayer('flood');
    const layers = useControlCenterStore.getState().mapLayers;
    expect(layers.parcels).toBe(true);
    expect(layers.aerial).toBe(true);
    expect(layers.flood).toBe(true);
    expect(layers.zoning).toBe(false);
  });

  it('setModelVersion() updates version', () => {
    useControlCenterStore.getState().setModelVersion('v2025.1');
    expect(useControlCenterStore.getState().modelVersion).toBe('v2025.1');
  });
});
