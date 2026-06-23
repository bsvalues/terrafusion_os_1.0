import '@testing-library/jest-dom';
import { vi } from 'vitest';

class MockMapboxMap {
  _center = { lng: -119.5, lat: 46.3 };
  on(_event: string, layerOrHandler?: unknown, maybeHandler?: unknown) {
    const handler = typeof layerOrHandler === 'function'
      ? layerOrHandler
      : typeof maybeHandler === 'function'
        ? maybeHandler
        : null;
    if (handler && _event === 'load') queueMicrotask(() => handler());
    return this;
  }
  off() { return this; }
  once(_event: string, handler?: unknown) {
    if (typeof handler === 'function') queueMicrotask(() => (handler as () => void)());
    return this;
  }
  setStyle() { return this; }
  addControl() { return this; }
  addSource() { return this; }
  getSource() { return undefined; }
  addLayer() { return this; }
  getLayer() { return undefined; }
  setFilter() { return this; }
  setLayoutProperty() { return this; }
  setPaintProperty() { return this; }
  setFeatureState() { return this; }
  removeFeatureState() { return this; }
  getCanvas() { return document.createElement('canvas'); }
  getBounds() { return { getWest: () => -120, getSouth: () => 46, getEast: () => -119, getNorth: () => 47 }; }
  getCenter() { return this._center; }
  getZoom() { return 10; }
  isStyleLoaded() { return true; }
  remove() {}
}

class MockMapboxPopup {
  setLngLat() { return this; }
  setHTML() { return this; }
  addTo() { return this; }
  remove() {}
}

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MockMapboxMap,
    Marker: class { setLngLat() { return this; } setPopup() { return this; } addTo() { return this; } remove() {} },
    Popup: MockMapboxPopup,
    NavigationControl: vi.fn(),
    AttributionControl: vi.fn(),
    ScaleControl: vi.fn(),
  },
  Map: MockMapboxMap,
  Marker: class { setLngLat() { return this; } setPopup() { return this; } addTo() { return this; } remove() {} },
  Popup: MockMapboxPopup,
  NavigationControl: vi.fn(),
  AttributionControl: vi.fn(),
  ScaleControl: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock scrollTo
window.scrollTo = vi.fn();
HTMLElement.prototype.scrollIntoView = vi.fn();

// Polyfill Pointer Capture
if (!('hasPointerCapture' in Element.prototype)) {
  (Element.prototype as any).hasPointerCapture = () => false;
}
if (!('setPointerCapture' in Element.prototype)) {
  (Element.prototype as any).setPointerCapture = () => {};
}
if (!('releasePointerCapture' in Element.prototype)) {
  (Element.prototype as any).releasePointerCapture = () => {};
}

// Silence jsdom WebGL "not implemented" noise.
const _origGetContext = HTMLCanvasElement.prototype.getContext;
const webglContext = {
  ARRAY_BUFFER: 0x8892,
  COLOR_BUFFER_BIT: 0x4000,
  COMPILE_STATUS: 0x8b81,
  FLOAT: 0x1406,
  FRAGMENT_SHADER: 0x8b30,
  LINK_STATUS: 0x8b82,
  STATIC_DRAW: 0x88e4,
  TRIANGLE_STRIP: 0x0005,
  VERTEX_SHADER: 0x8b31,
  attachShader: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  compileShader: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  createProgram: vi.fn(() => ({})),
  createShader: vi.fn(() => ({})),
  deleteShader: vi.fn(),
  drawArrays: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
  getParameter: vi.fn(() => null),
  getProgramInfoLog: vi.fn(() => ''),
  getProgramParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  getShaderParameter: vi.fn(() => true),
  getShaderPrecisionFormat: vi.fn(() => ({ precision: 0, rangeMin: 0, rangeMax: 0 })),
  getUniformLocation: vi.fn(() => ({})),
  linkProgram: vi.fn(),
  shaderSource: vi.fn(),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  useProgram: vi.fn(),
  vertexAttribPointer: vi.fn(),
  viewport: vi.fn(),
};
HTMLCanvasElement.prototype.getContext = function (type: any, ...args: any[]) {
  if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
    return webglContext as any;
  }
  return _origGetContext.call(this, type, ...args);
} as any;

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(Date.now()), 16);
}
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
}
