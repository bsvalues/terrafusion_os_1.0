// Jest setup file - runs before each test suite
import '@testing-library/jest-dom';

// 🚀 TerraFusion Elite Test Environment Setup
// Add jest-axe matchers for accessibility testing
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Add fetch polyfill for Node.js test environment
import 'whatwg-fetch';

// Mock import.meta.env for Vite compatibility in Jest
// @ts-expect-error - Jest doesn't support import.meta natively
globalThis.import = { meta: { env: {} } };
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:5000',
        VITE_COUNTY_NAME: 'Benton County',
        VITE_COUNTY_CODE: 'benton',
        VITE_COUNTY_FIPS: '53005',
        VITE_COUNTY_STATE: 'Washington',
        VITE_COUNTY_PARCEL_COUNT: '100000',
        VITE_HARRIS_PACS_VERSION: '9.0',
        VITE_HARRIS_PACS_ENABLED: 'true',
        VITE_SYNC_INTERVAL: '15',
        VITE_DEMO_MODE: 'false',
        VITE_DEPLOYMENT_MODE: 'test',
        VITE_SLA_AVAILABILITY: '99.9',
        VITE_SLA_P95_LATENCY: '150',
        VITE_AI_SWARM_ENABLED: 'true',
        VITE_QUANTUM_OPTIMIZATION: 'true',
        VITE_REAL_TIME_SYNC: 'true',
        VITE_ADVANCED_ANALYTICS: 'true',
        DEV: true,
        PROD: false,
        MODE: 'test',
      },
    },
  },
  writable: false,
});

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

// Polyfill Pointer Capture APIs (jsdom doesn't implement these; Radix uses them)
if (!('hasPointerCapture' in Element.prototype)) {
  (Element.prototype as any).hasPointerCapture = () => false;
}
if (!('setPointerCapture' in Element.prototype)) {
  (Element.prototype as any).setPointerCapture = () => {};
}
if (!('releasePointerCapture' in Element.prototype)) {
  (Element.prototype as any).releasePointerCapture = () => {};
}

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

// Suppress known-noisy warnings (keep real errors visible)
// Opt-out toggles:
// - TF_TEST_VERBOSE=1 to show everything
// - TF_TEST_SHOW_JSDOM_XHR_ERRORS=1 to show jsdom XHR AggregateErrors
// - TF_TEST_DEBUG=1 to show console.debug
const originalConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log,
  debug: console.debug,
};

const shouldSuppressActWarning = (args: unknown[]) => {
  const first = args[0];
  if (typeof first !== 'string') return false;

  // React 18 act warnings (common with Radix + async effects)
  if (first.includes('was not wrapped in act(')) return true;

  // Deprecated react-dom/test-utils act warning (Testing Library internals)
  if (first.includes('ReactDOMTestUtils.act') && first.includes('deprecated')) return true;

  // Legacy render warning (rare but noisy)
  if (first.includes('Warning: ReactDOM.render')) return true;

  // Radix UI accessibility warnings (common in jsdom; not actionable per-test)
  if (first.includes('`DialogContent` requires a `DialogTitle`')) return true;
  if (first.includes('Missing `Description`') && first.includes('DialogContent')) return true;

  // Radix SlotClone ref warnings (React logs component stack as another arg)
  if (first.includes('Function components cannot be given refs')) {
    const hasSlotCloneInArgs = args.some(
      (arg) => typeof arg === 'string' && arg.includes('SlotClone')
    );
    if (hasSlotCloneInArgs) return true;
  }

  return false;
};

const isJsdmXhrAggregateError = (args: unknown[]) => {
  const first = args[0] as any;
  if (!first) return false;

  // jsdom VirtualConsole may pass errors from the window realm, so avoid
  // `instanceof Error` and use a narrow structural check.
  if (typeof first !== 'object') return false;
  if (first.message !== 'AggregateError') return false;
  if (first.type !== 'XMLHttpRequest') return false;

  const stack = typeof first.stack === 'string' ? first.stack : '';
  return stack.includes('jsdom') && stack.includes('xhr');
};

const getFirstStringArg = (args: unknown[]) =>
  args.find((a) => typeof a === 'string') as string | undefined;

const shouldSuppressCostForgeNoise = (args: unknown[]) => {
  const firstString = getFirstStringArg(args);
  if (!firstString) return false;

  if (firstString.includes('[CostForge Integration] Failed to load system data:')) return true;
  if (firstString.includes('[CostForge API] Request failed:')) return true;
  if (firstString.startsWith('Calculation failed:')) return true;

  return false;
};

const shouldSuppressModuleLaunchNoise = (args: unknown[]) => {
  const firstString = getFirstStringArg(args);
  if (!firstString) return false;
  return firstString.startsWith('[ModuleLaunch] Failed to launch ');
};

const shouldSuppressSecurityTestNoise = (args: unknown[]) => {
  const firstString = getFirstStringArg(args);
  if (!firstString) return false;

  const s = firstString.trimStart();

  // Security suite prints a detailed banner; useful sometimes, but usually noisy.
  if (s.includes('PENETRATION TESTING')) return true;
  if (s.startsWith('✓ ')) return true;
  if (s.startsWith('✅ ')) return true;
  if (s.startsWith('🚨 CRITICAL:')) return true;
  if (s.startsWith('🏆 ')) return true;
  if (s.includes('Attack Scenarios Tested')) return true;
  if (s.includes('════════════════════════════════')) return true;
  if (s.startsWith('• ')) return true;

  return false;
};

const shouldSuppressPersistenceNoise = (args: unknown[]) => {
  const firstString = getFirstStringArg(args);
  if (!firstString) return false;

  if (firstString.startsWith('[PersistenceService] Failed to ')) return true;
  if (firstString.startsWith('[PersistenceService] Invalid desktop state schema')) return true;
  if (firstString.startsWith('[PersistenceService] Migrating from old version')) return true;

  return false;
};

const shouldSuppressIntegrationBanner = (args: unknown[]) => {
  const firstString = getFirstStringArg(args);
  if (!firstString) return false;
  return (
    firstString.includes('Starting Integration Test Suite') ||
    firstString.includes('Integration Test Suite Complete')
  );
};

beforeAll(() => {
  const verbose = process.env.TF_TEST_VERBOSE === '1';
  const showJsdmXhr = process.env.TF_TEST_SHOW_JSDOM_XHR_ERRORS === '1';
  const showDebug = process.env.TF_TEST_DEBUG === '1';
  const showCostForge = process.env.TF_TEST_SHOW_COSTFORGE_ERRORS === '1';
  const showModuleLaunch = process.env.TF_TEST_SHOW_MODULE_LAUNCH_ERRORS === '1';
  const showPersistence = process.env.TF_TEST_SHOW_PERSISTENCE_LOGS === '1';
  const showIntegrationBanner = process.env.TF_TEST_SHOW_INTEGRATION_LOGS === '1';
  const showSecurityTestLogs = process.env.TF_TEST_SHOW_SECURITY_TEST_LOGS === '1';

  if (verbose) return;

  console.error = (...args: any[]) => {
    if (shouldSuppressActWarning(args)) return;
    if (!showJsdmXhr && isJsdmXhrAggregateError(args)) return;
    if (!showCostForge && shouldSuppressCostForgeNoise(args)) return;
    if (!showModuleLaunch && shouldSuppressModuleLaunchNoise(args)) return;
    originalConsole.error.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (shouldSuppressActWarning(args)) return;
    if (!showPersistence && shouldSuppressPersistenceNoise(args)) return;
    originalConsole.warn.call(console, ...args);
  };

  console.info = (...args: any[]) => {
    if (!showPersistence && shouldSuppressPersistenceNoise(args)) return;
    originalConsole.info.call(console, ...args);
  };

  console.log = (...args: any[]) => {
    if (!showIntegrationBanner && shouldSuppressIntegrationBanner(args)) return;
    if (!showSecurityTestLogs && shouldSuppressSecurityTestNoise(args)) return;
    originalConsole.log.call(console, ...args);
  };

  if (!showDebug) {
    console.debug = () => {};
  }
});

// Intentionally do not restore console methods in `afterAll`.
// In Jest (setupFilesAfterEnv), this file runs per-test-file and its `afterAll`
// can execute before the test file's own `afterAll` hooks, which would
// re-enable noisy logs for those late hooks.
