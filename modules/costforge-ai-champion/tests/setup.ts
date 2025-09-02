/**
 * Jest Test Setup for CostForge AI Champion
 * 
 * Global test configuration and setup for both frontend and backend testing.
 */

import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3009';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Mock fetch for API calls in tests
global.fetch = jest.fn();

// Mock Tauri API for frontend tests
(global as any).__TAURI__ = {
  invoke: jest.fn(),
  event: {
    emit: jest.fn(),
    listen: jest.fn()
  },
  dialog: {
    open: jest.fn(),
    save: jest.fn(),
    message: jest.fn()
  },
  fs: {
    readTextFile: jest.fn(),
    writeTextFile: jest.fn(),
    readDir: jest.fn(),
    createDir: jest.fn()
  },
  path: {
    resolve: jest.fn(),
    join: jest.fn(),
    dirname: jest.fn()
  },
  http: {
    fetch: jest.fn()
  }
};

// Mock WebXR and camera APIs for AR tests
(global as any).navigator = {
  ...global.navigator,
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([])
    })
  },
  xr: {
    isSessionSupported: jest.fn().mockResolvedValue(true),
    requestSession: jest.fn()
  }
};

// Mock A-Frame for AR/VR tests
(global as any).AFRAME = {
  registerComponent: jest.fn(),
  registerSystem: jest.fn(),
  utils: {
    device: {
      isMobile: jest.fn().mockReturnValue(false)
    }
  }
};

// Mock console methods to reduce test noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

afterEach(() => {
  // Clear all mocks between tests
  jest.clearAllMocks();
  
  // Clear fetch mock
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear();
  }
});

// Custom matchers for better testing
expect.extend({
  toBeValidCostAmount(received: number) {
    const pass = typeof received === 'number' && received >= 0 && isFinite(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid cost amount`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid cost amount (positive number)`,
        pass: false,
      };
    }
  },
  
  toHaveValidBuildingData(received: any) {
    const requiredFields = ['buildingType', 'squareFootage', 'region'];
    const hasAllFields = requiredFields.every(field => field in received);
    const hasValidSquareFootage = typeof received.squareFootage === 'number' && received.squareFootage > 0;
    
    const pass = hasAllFields && hasValidSquareFootage;
    
    if (pass) {
      return {
        message: () => `expected building data not to be valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected building data to be valid with fields: ${requiredFields.join(', ')}`,
        pass: false,
      };
    }
  }
});

// Declare custom matcher types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCostAmount(): R;
      toHaveValidBuildingData(): R;
    }
  }
}