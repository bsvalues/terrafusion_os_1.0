// Jest setup file - runs before each test suite
import '@testing-library/jest-dom';

// Add custom matchers for better assertions
// Examples:
// expect(element).toBeInTheDocument()
// expect(element).toHaveClass('className')
// expect(element).toHaveTextContent('text')
// expect(element).toBeVisible()
// expect(element).toBeDisabled()

// Mock window.matchMedia (required for Radix UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver (required for some UI components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (required for responsive components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock scrollTo (not implemented in jsdom)
window.scrollTo = jest.fn();

// Mock HTMLElement.prototype.scrollIntoView
HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to suppress console logs in tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set default test timeout
jest.setTimeout(10000);

// Suppress specific warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress React 18 act() warnings for now
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
