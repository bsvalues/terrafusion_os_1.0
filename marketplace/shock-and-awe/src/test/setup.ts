import '@testing-library/jest-dom/vitest';
import { beforeAll, vi } from 'vitest';

// Test environment shims
beforeAll(() => {
  // Mock Three.js WebGL context for headless testing
  const mockCanvas = {
    getContext: vi.fn(() => ({
      getExtension: vi.fn(),
      createProgram: vi.fn(),
      createShader: vi.fn(),
      compileShader: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      getAttribLocation: vi.fn(() => 0),
      getUniformLocation: vi.fn(() => {}),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      clear: vi.fn(),
      drawArrays: vi.fn(),
      viewport: vi.fn(),
      clearColor: vi.fn(),
      enable: vi.fn(),
      depthFunc: vi.fn(),
      clearDepth: vi.fn(),
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockCanvas.getContext,
  });
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
