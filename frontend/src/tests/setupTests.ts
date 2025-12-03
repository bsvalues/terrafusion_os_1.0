/**
 * setupTests.ts
 *
 * Jest Test Setup Configuration for TerraFusion Quantum Research Portal
 * Configures global test environment, mocks, and utilities for integration testing.
 *
 * Setup includes:
 * - React Testing Library matchers
 * - Global mocks for browser APIs (localStorage, fetch, ResizeObserver)
 * - Three.js/WebGL mocks for 3D visualization testing
 * - Performance measurement utilities
 * - Test helpers and utilities
 *
 * @module TestSetup
 * @version 1.0.0
 */

import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Add TextEncoder/TextDecoder for MSW and Node.js compatibility
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL MOCKS - Browser APIs
// ═══════════════════════════════════════════════════════════════════════════════

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value?.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value?.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock ResizeObserver (used by Three.js/React Three Fiber)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBGL / THREE.JS MOCKS
// ═══════════════════════════════════════════════════════════════════════════════

// Mock WebGL context for Three.js
HTMLCanvasElement.prototype.getContext = jest.fn((contextId) => {
  if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
    return {
      canvas: document.createElement('canvas'),
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getParameter: jest.fn(),
      getExtension: jest.fn(),
      createTexture: jest.fn(),
      createProgram: jest.fn(),
      createShader: jest.fn(),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      useProgram: jest.fn(),
      viewport: jest.fn(),
      clear: jest.fn(),
      clearColor: jest.fn(),
    };
  }
  return null;
}) as any;

// Mock requestAnimationFrame for animations
let animationFrameId = 0;
global.requestAnimationFrame = jest.fn((callback) => {
  animationFrameId++;
  setTimeout(() => callback(performance.now()), 16); // ~60 FPS
  return animationFrameId;
});

global.cancelAnimationFrame = jest.fn((id: number) => {
  clearTimeout(id);
});

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE MEASUREMENT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// Mock performance.now() for consistent timing in tests
const originalPerformanceNow = performance.now.bind(performance);
let mockTime = 0;

export const mockPerformanceNow = (time?: number) => {
  if (time !== undefined) {
    mockTime = time;
  }
  return mockTime;
};

export const resetMockTime = () => {
  mockTime = 0;
};

export const advanceMockTime = (ms: number) => {
  mockTime += ms;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wait for next animation frame
 */
export const waitForAnimationFrame = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

/**
 * Wait for multiple animation frames
 */
export const waitForAnimationFrames = (count: number): Promise<void> => {
  return new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      remaining--;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
};

/**
 * Measure test execution time
 */
export const measureTestPerformance = async (fn: () => Promise<void> | void): Promise<number> => {
  const startTime = originalPerformanceNow();
  await fn();
  return originalPerformanceNow() - startTime;
};

/**
 * Create mock fetch response
 */
export const createMockResponse = <T>(data: T, status = 200, ok = true): Response => {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
  } as Response;
};

/**
 * Create mock JWT token
 */
export const createMockJWT = (payload: Record<string, any>): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = 'mock-signature';
  return `${header}.${encodedPayload}.${signature}`;
};

/**
 * Decode mock JWT token
 */
export const decodeMockJWT = (token: string): Record<string, any> => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  return JSON.parse(atob(parts[1]));
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL TEST CLEANUP
// ═══════════════════════════════════════════════════════════════════════════════

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
  resetMockTime();
});

// Suppress console errors/warnings in tests unless explicitly needed
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Allow specific errors through for debugging
    if (args[0]?.toString().includes('Not implemented')) {
      return;
    }
    originalConsoleError(...args);
  });

  console.warn = jest.fn((...args) => {
    // Suppress warnings in tests unless debugging
    if (process.env.DEBUG_TESTS) {
      originalConsoleWarn(...args);
    }
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

export default {};
