/* tests/setupTests.ts */
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';
import { configureAxe } from 'jest-axe';
import { cleanup } from '@testing-library/react';

export const axe = configureAxe({ 
  rules: { 
    region: { enabled: false },
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true }
  } 
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
      on: vi.fn()
    })
  }))
}));

// Mock next-auth for government authentication
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'u-admin',
        roles: ['EnterpriseAdmin'],
        permissions: ['read', 'write', 'delete', 'export']
      }
    },
    status: 'authenticated'
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock Electron APIs
global.electron = {
  ipcRenderer: {
    invoke: vi.fn().mockResolvedValue({}),
    send: vi.fn(),
    on: vi.fn()
  }
};

// Mock ResizeObserver for responsive components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Setup MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  // Freeze time for deterministic tests
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-18T12:00:00Z'));
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
  vi.useRealTimers();
});

// Global test utilities
global.testUtils = {
  waitForLoadingToFinish: async () => {
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="loading"]')).toBeNull();
    });
  },
  
  simulateNetworkError: () => {
    // MSW network error simulation
  },
  
  simulateSlowNetwork: (delay = 2000) => {
    // MSW slow network simulation
  }
};

// Government compliance test utilities
global.complianceUtils = {
  checkFISMACompliance: async (element: HTMLElement) => {
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
      tags: ['section508', 'wcag2a', 'wcag2aa']
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
  }
};