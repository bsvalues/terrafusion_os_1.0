import '@testing-library/jest-dom';
import { vi } from 'vitest';

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

// Silence jsdom WebGL "not implemented" noise (materialQualityGate uses canvas.getContext('webgl'))
const _origGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (type: any, ...args: any[]) {
  if (type === 'webgl' || type === 'webgl2') {
    return {
      getExtension: () => ({ loseContext: vi.fn() }),
      getParameter: () => null,
      getShaderPrecisionFormat: () => ({ precision: 0, rangeMin: 0, rangeMax: 0 }),
    } as any;
  }
  return _origGetContext.call(this, type, ...args);
} as any;
