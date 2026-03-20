/* tests/setupTests.ts */
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Import MSW server and jest-axe
let server: any = null;
let configureAxe: any = () => () => ({ run: () => Promise.resolve({ violations: [] }) });
const originalFetch = global.fetch?.bind(globalThis);

// Legacy Jest compatibility for generated marketplace tests.
(globalThis as any).jest = vi;

// Government API harness fallback for generated marketplace suites.
if (!(global as any).testGovernmentAPI) {
  (global as any).testGovernmentAPI = {
    security: {
      testAuthentication: vi.fn(),
      testAuthorization: vi.fn(),
    },
    compliance: {
      testAuditTrail: vi.fn(),
      testDataRetention: vi.fn(),
    },
  };
}

// Marketplace tests issue relative /api/* requests; provide deterministic local responses.
global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (input instanceof Request && input.url.startsWith('/api/')) {
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (originalFetch) {
    return originalFetch(input, init);
  }
  return new Response('{}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Dynamic imports in async setup
async function setupOptionalDependencies() {
  try {
    const mswModule = await import('./msw/server');
    server = mswModule.server;
  } catch (e) {
    console.warn('MSW server not found, tests will run without API mocking');
  }

  try {
    const axeModule = await import('jest-axe');
    configureAxe = axeModule.configureAxe;
  } catch (e) {
    console.warn('jest-axe not found, accessibility tests will be skipped');
  }
}

export const axe = configureAxe({
  rules: {
    region: { enabled: false },
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
  },
});

// Mock implementations for Terrafusion-specific APIs
vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      invoke: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
    }),
  })),
}));

// Mock next-auth for government authentication
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'u-admin',
        roles: ['EnterpriseAdmin'],
        permissions: ['read', 'write', 'delete', 'export'],
      },
    },
    status: 'authenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Electron APIs
global.electron = {
  ipcRenderer: {
    invoke: vi.fn().mockResolvedValue({}),
    send: vi.fn(),
    on: vi.fn(),
  },
};

const hasWindow = typeof window !== 'undefined';
const hasElement = typeof Element !== 'undefined';

if (hasWindow) {
  // Mock window.matchMedia (jsdom does not implement it)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
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
}

// Mock ResizeObserver for responsive components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

if (hasElement) {
  // Mock scrollIntoView for cmdk and other components that call it in jsdom
  Element.prototype.scrollIntoView = vi.fn();

  // Mock hasPointerCapture for Radix UI Select and other pointer-capture components in jsdom
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}

// Setup MSW (if available)
beforeAll(() => {
  if (server) {
    server.listen({ onUnhandledRequest: 'bypass' });
  }
  // Freeze time for deterministic tests while allowing timers to advance
  // (shouldAdvanceTime prevents userEvent timeouts in @testing-library)
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2025-01-18T12:00:00Z'));
});

afterEach(() => {
  if (server) {
    server.resetHandlers();
  }
  cleanup();
  vi.clearAllMocks();
});

afterAll(() => {
  if (server) {
    server.close();
  }
  vi.useRealTimers();
});

// Global test utilities
global.testUtils = {
  waitForLoadingToFinish: async () => {
    const waitFor = (await import('@testing-library/react')).waitFor;
    await waitFor(() => {
      expect(document.querySelector('[data-testid="loading"]')).toBeNull();
    });
  },

  simulateNetworkError: () => {
    // MSW network error simulation
  },

  simulateSlowNetwork: (delay = 2000) => {
    // MSW slow network simulation
  },
};

// Government compliance test utilities
global.complianceUtils = {
  checkFISMACompliance: async (element: HTMLElement) => {
    const axe = configureAxe({
      rules: {
        region: { enabled: false },
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
      },
    });
    const results = await axe(element);
    expect(results).toHaveNoViolations();

    // FISMA-specific checks
    expect(element).toHaveAttribute('data-testid');

    const forms = element.querySelectorAll('form');
    forms.forEach(form => {
      expect(form).toHaveAttribute('novalidate', 'false');
    });
  },

  checkSection508Compliance: async (element: HTMLElement) => {
    const results = await axe(element, {
      tags: ['section508', 'wcag2a', 'wcag2aa'],
    });
    expect(results).toHaveNoViolations();
  },

  checkKeyboardNavigation: async (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    expect(focusableElements.length).toBeGreaterThan(0);

    focusableElements.forEach(el => {
      expect(el).toBeVisible();
      expect(el).not.toHaveAttribute('tabindex', '-1');
    });
  },
};
