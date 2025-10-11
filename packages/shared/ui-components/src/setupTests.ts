// Jest setup file for TerraFusion UI Components
import '@testing-library/jest-dom';

// Mock CSS modules
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Mock ResizeObserver
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

// TerraFusion specific mocks
// Mock TerraFusion CSS variables for testing
const mockComputedStyle = jest.fn().mockReturnValue({
  getPropertyValue: jest.fn().mockReturnValue(''),
  'border-radius': '12px',
  'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
});

Object.defineProperty(window, 'getComputedStyle', {
  value: mockComputedStyle,
});

// Console warning suppression for known issues
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});