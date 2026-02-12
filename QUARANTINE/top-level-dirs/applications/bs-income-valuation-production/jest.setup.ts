// Import Jest DOM extensions
import '@testing-library/jest-dom';

// Add custom matchers that will be available in all test files
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be in the document`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be in the document`,
        pass: false,
      };
    }
  },
});

// Mock any global browser APIs that aren't available in Node.js
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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