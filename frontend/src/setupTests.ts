// Jest setup file - runs before each test suite
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { TextDecoder, TextEncoder } from 'util';

// 🚀 TerraFusion Elite Test Environment Setup
// Add TextEncoder/TextDecoder for MSW and Node.js compatibility
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}
// Add BroadcastChannel polyfill for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  class BroadcastChannelPolyfill {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onmessageerror: ((event: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_message: unknown) {}
    close() {}
    addEventListener(_type: string, _listener: EventListener) {}
    removeEventListener(_type: string, _listener: EventListener) {}
    dispatchEvent(_event: Event) {
      return true;
    }
  }
  global.BroadcastChannel = BroadcastChannelPolyfill as unknown as typeof BroadcastChannel;
}
// Add fetch polyfill for Node.js test environment
import 'whatwg-fetch';

// Extend Jest matchers with accessibility matchers
expect.extend(toHaveNoViolations);

// Ensure global fetch is available for all tests
if (!global.fetch) {
  global.fetch = require('cross-fetch');
}

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

// Mock pointer capture methods (required for Radix slider and similar components)
Element.prototype.hasPointerCapture = jest.fn().mockReturnValue(false);
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();

// Mock react-day-picker to fix Calendar component tests
jest.mock('react-day-picker', () => {
  const React = require('react');
  return {
    DayPicker: React.forwardRef(({ children, className, ...props }: any, ref: any) =>
      React.createElement(
        'div',
        {
          role: 'application',
          className: className,
          ref: ref,
          ...props,
        },
        [
          React.createElement('div', { key: 'month' }, 'June'),
          React.createElement('div', { key: 'weekdays' }, 'Sun Mon Tue Wed Thu Fri Sat'),
          children,
        ]
      )
    ),
    DayButton: React.forwardRef(({ children, className, ...props }: any, ref: any) =>
      React.createElement(
        'button',
        {
          className: className,
          ref: ref,
          ...props,
        },
        children
      )
    ),
    getDefaultClassNames: () => ({
      root: 'rdp-root',
      months: 'rdp-months',
      month: 'rdp-month',
      nav: 'rdp-nav',
      button_previous: 'rdp-button-previous',
      button_next: 'rdp-button-next',
      month_caption: 'rdp-month-caption',
      dropdowns: 'rdp-dropdowns',
      dropdown_root: 'rdp-dropdown-root',
      dropdown: 'rdp-dropdown',
      caption_label: 'rdp-caption-label',
      weekdays: 'rdp-weekdays',
      weekday: 'rdp-weekday',
      week: 'rdp-week',
      week_number_header: 'rdp-week-number-header',
      week_number: 'rdp-week-number',
      day: 'rdp-day',
      range_start: 'rdp-range-start',
      range_middle: 'rdp-range-middle',
      range_end: 'rdp-range-end',
      today: 'rdp-today',
      outside: 'rdp-outside',
      disabled: 'rdp-disabled',
      hidden: 'rdp-hidden',
    }),
  };
});

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
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
