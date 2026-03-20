/**
 * TerraFusion OS Module Route Bridge Tests
 *
 * Tests for URL-driven module activation through the routing layer.
 * Ensures routes flow through activateModule() - never direct store calls.
 *
 * @module routing/__tests__/ModuleRouteBridge.test
 * @see Phase 4: Routing Integration
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ============================================================================
// Mock Setup - MUST be before imports that use them
// ============================================================================

// Mock activateModule from orchestration
const mockActivateModule = vi.fn().mockResolvedValue(undefined);

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
  default: (...args: unknown[]) => mockActivateModule(...args),
}));

// Mock isModuleRegistered for unknown module tests
const mockIsModuleRegistered = vi.fn((id: string) => {
  const registered = ['costforge', 'terra-gaia', 'atlas-ai', 'marketplace'];
  // Normalize aliases for the check
  const aliases: Record<string, string> = {
    'terrabuild': 'costforge',
    'assessment': 'costforge',
  };
  const canonical = aliases[id] || id;
  return registered.includes(canonical);
});

vi.mock('../../config/moduleComponents', () => ({
  isModuleRegistered: (id: string) => mockIsModuleRegistered(id),
  normalizeModuleId: vi.fn((id: string) => {
    const aliases: Record<string, string> = {
      'terrabuild': 'costforge',
      'assessment': 'costforge',
    };
    return aliases[id] || id;
  }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'u-test',
    countyId: 'benton',
    roles: ['EnterpriseAdmin'],
    token: null,
  })),
  toOsActor: vi.fn((auth: any) => ({
    userId: auth.userId ?? 'u-test',
    countyId: auth.countyId ?? 'benton',
    roles: auth.roles ?? [],
  })),
}));

// Import after mocks
import { ModuleRouteBridge } from '../ModuleRouteBridge';

// ============================================================================
// Test Utilities
// ============================================================================

function resetAllMocks() {
  mockActivateModule.mockClear().mockResolvedValue(undefined);
  mockIsModuleRegistered.mockClear();
  // Re-setup default implementation
  mockIsModuleRegistered.mockImplementation((id: string) => {
    const registered = ['costforge', 'terra-gaia', 'atlas-ai', 'marketplace'];
    const aliases: Record<string, string> = {
      'terrabuild': 'costforge',
      'assessment': 'costforge',
    };
    const canonical = aliases[id] || id;
    return registered.includes(canonical);
  });
}

/**
 * Render helper that wraps component in MemoryRouter
 */
function renderWithRouter(
  initialPath: string,
  component: React.ReactElement
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/m/:moduleId" element={component} />
        <Route path="/module/:moduleId" element={component} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  resetAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('ModuleRouteBridge', () => {
  // --------------------------------------------------------------------------
  // Basic Routing
  // --------------------------------------------------------------------------

  describe('basic routing', () => {
    it('activates module from route parameter', async () => {
      renderWithRouter('/m/costforge', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ source: 'route' })
        );
      });
    });

    it('passes source as "route" by default', async () => {
      renderWithRouter('/m/terra-gaia', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'terra-gaia',
          expect.objectContaining({ source: 'route' })
        );
      });
    });
  });

  // --------------------------------------------------------------------------
  // Alias Routing
  // --------------------------------------------------------------------------

  describe('alias routing', () => {
    it('activates with alias - terrabuild routes to costforge activation', async () => {
      renderWithRouter('/m/terrabuild', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
        // Should call with the alias - orchestrator handles normalization
        expect(mockActivateModule).toHaveBeenCalledWith(
          'terrabuild',
          expect.objectContaining({ source: 'route' })
        );
      });
    });

    it('activates with alias - assessment routes through orchestrator', async () => {
      renderWithRouter('/m/assessment', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'assessment',
          expect.objectContaining({ source: 'route' })
        );
      });
    });
  });

  // --------------------------------------------------------------------------
  // Idempotent Navigation
  // --------------------------------------------------------------------------

  describe('idempotent navigation', () => {
    it('does not call activateModule twice on re-render', async () => {
      const { rerender } = renderWithRouter('/m/costforge', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
      });

      // Force re-render with same route
      rerender(
        <MemoryRouter initialEntries={['/m/costforge']}>
          <Routes>
            <Route path="/m/:moduleId" element={<ModuleRouteBridge />} />
          </Routes>
        </MemoryRouter>
      );

      // Should still only have been called once
      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
      });
    });

    it('activates different modules via different initial routes', async () => {
      // First render with costforge
      const { unmount: unmount1 } = renderWithRouter('/m/costforge', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.any(Object)
        );
      });

      unmount1();
      mockActivateModule.mockClear();

      // Second render with atlas-ai
      renderWithRouter('/m/atlas-ai', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
        expect(mockActivateModule).toHaveBeenCalledWith(
          'atlas-ai',
          expect.any(Object)
        );
      });
    });

    it('does not re-activate when only query params change to same values', async () => {
      const { rerender } = renderWithRouter('/m/costforge?focus=1', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
      });

      // Re-render with same params
      rerender(
        <MemoryRouter initialEntries={['/m/costforge?focus=1']}>
          <Routes>
            <Route path="/m/:moduleId" element={<ModuleRouteBridge />} />
          </Routes>
        </MemoryRouter>
      );

      expect(mockActivateModule).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Query Parameter Mapping
  // --------------------------------------------------------------------------

  describe('query parameter mapping', () => {
    it('maps focus=0 to focusIfOpen: false', async () => {
      renderWithRouter('/m/costforge?focus=0', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ focusIfOpen: false })
        );
      });
    });

    it('maps focus=1 to focusIfOpen: true', async () => {
      renderWithRouter('/m/costforge?focus=1', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ focusIfOpen: true })
        );
      });
    });

    it('defaults focusIfOpen to true when focus param is missing', async () => {
      renderWithRouter('/m/costforge', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ focusIfOpen: true })
        );
      });
    });

    it('maps warm=0 to warmLoad: false', async () => {
      renderWithRouter('/m/costforge?warm=0', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ warmLoad: false })
        );
      });
    });

    it('maps warm=1 to warmLoad: true', async () => {
      renderWithRouter('/m/costforge?warm=1', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ warmLoad: true })
        );
      });
    });

    it('defaults warmLoad to true when warm param is missing', async () => {
      renderWithRouter('/m/costforge', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ warmLoad: true })
        );
      });
    });

    it('handles combined query params', async () => {
      renderWithRouter('/m/costforge?focus=0&warm=0', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({
            focusIfOpen: false,
            warmLoad: false,
          })
        );
      });
    });

    it('allows source override via src param with valid values', async () => {
      renderWithRouter('/m/costforge?src=deep_link', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ source: 'deep_link' })
        );
      });
    });

    it('ignores invalid source override values', async () => {
      renderWithRouter('/m/costforge?src=invalid_source', <ModuleRouteBridge />);

      await waitFor(() => {
        // Should use default 'route' source, not the invalid one
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ source: 'route' })
        );
      });
    });

    it('includes URL in metadata', async () => {
      renderWithRouter('/m/costforge?param=value', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({
            metadata: expect.objectContaining({
              url: expect.stringContaining('/m/costforge'),
            }),
          })
        );
      });
    });
  });

  // --------------------------------------------------------------------------
  // Unknown Module Handling
  // --------------------------------------------------------------------------

  describe('unknown module handling', () => {
    it('does not call activateModule for unregistered module', async () => {
      mockIsModuleRegistered.mockReturnValue(false);

      renderWithRouter('/m/nonexistent-module', <ModuleRouteBridge />);

      // Wait a tick for any potential calls
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    it('renders "Module Not Found" UI for unregistered module', async () => {
      mockIsModuleRegistered.mockReturnValue(false);

      renderWithRouter('/m/nonexistent-module', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(screen.getByTestId('module-not-found')).toBeInTheDocument();
      });
    });

    it('displays the attempted module ID in not found UI', async () => {
      mockIsModuleRegistered.mockReturnValue(false);

      renderWithRouter('/m/some-fake-module', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(screen.getByText(/some-fake-module/i)).toBeInTheDocument();
      });
    });

    it('provides navigation back to home', async () => {
      mockIsModuleRegistered.mockReturnValue(false);

      renderWithRouter('/m/nonexistent', <ModuleRouteBridge />);

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /home|back/i });
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles empty moduleId gracefully', async () => {
      // This would be a malformed route, but we should handle it
      render(
        <MemoryRouter initialEntries={['/m/']}>
          <Routes>
            <Route path="/m/:moduleId?" element={<ModuleRouteBridge />} />
            <Route path="/m/" element={<ModuleRouteBridge />} />
          </Routes>
        </MemoryRouter>
      );

      // Should not crash, may show not found or redirect
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    it('handles moduleId with special characters', async () => {
      // Add special character module to registry for this test
      mockIsModuleRegistered.mockImplementation((id: string) => {
        const registered = ['costforge', 'terra-gaia', 'atlas-ai', 'marketplace', 'my-module_v2'];
        const aliases: Record<string, string> = {
          'terrabuild': 'costforge',
          'assessment': 'costforge',
        };
        const canonical = aliases[id] || id;
        return registered.includes(canonical);
      });

      renderWithRouter('/m/my-module_v2', <ModuleRouteBridge />);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'my-module_v2',
          expect.any(Object)
        );
      });
    });

    it('trims whitespace from moduleId', async () => {
      // URL-encoded spaces
      renderWithRouter('/m/%20costforge%20', <ModuleRouteBridge />);

      await waitFor(() => {
        // Should be trimmed
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.any(Object)
        );
      });
    });
  });

  // --------------------------------------------------------------------------
  // Loading State
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows loading indicator briefly during activation', async () => {
      // Make activation take some time
      mockActivateModule.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithRouter('/m/costforge', <ModuleRouteBridge />);

      // Should show loading initially
      expect(screen.getByTestId('module-route-loading')).toBeInTheDocument();

      // Wait for activation to complete
      await waitFor(() => {
        expect(screen.queryByTestId('module-route-loading')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });
});

// ============================================================================
// Integration Tests (with actual router navigation)
// ============================================================================

describe('ModuleRouteBridge integration', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('supports /module/:moduleId alternate route pattern', async () => {
    render(
      <MemoryRouter initialEntries={['/module/costforge']}>
        <Routes>
          <Route path="/module/:moduleId" element={<ModuleRouteBridge />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockActivateModule).toHaveBeenCalledWith(
        'costforge',
        expect.objectContaining({ source: 'route' })
      );
    });
  });
});
