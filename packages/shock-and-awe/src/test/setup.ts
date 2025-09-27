import { beforeAll, vi } from 'vitest';

// Mock Tauri API for testing
beforeAll(() => {
  // Mock window.__TAURI__ for non-Tauri environments
  if (typeof window !== 'undefined') {
    (window as any).__TAURI__ = {
      invoke: vi.fn(),
      listen: vi.fn(),
      emit: vi.fn(),
    };
  }

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
