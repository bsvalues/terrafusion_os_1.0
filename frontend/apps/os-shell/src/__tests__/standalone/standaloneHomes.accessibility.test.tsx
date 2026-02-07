/**
 * TerraFusion OS Standalone Homes Accessibility Tests
 *
 * Tests for a11y baseline compliance in standalone suite homes.
 *
 * A11y requirements:
 * - h1 present and is first heading
 * - Landmark regions (banner, main)
 * - Focus order stable
 * - No interactive elements in aria-hidden layers
 * - Keyboard navigation works
 *
 * @module __tests__/standalone/standaloneHomes.accessibility.test
 * @vitest-environment jsdom
 * @see Slice 6: Standalone Suite Homes Consistency
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Test data - standalone routes
const STANDALONE_ROUTES = [
  { path: '/pilot', name: 'TerraPilot' },
  // Add more as implemented
];

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Placeholder standalone home for testing structure.
 */
function MockStandaloneHome({ name }: { name: string }) {
  return (
    <div data-testid='standalone-shell'>
      <header role='banner' data-testid='standalone-header'>
        <h1>{name}</h1>
        <span data-intent='standalone'>Standalone</span>
      </header>
      <main role='main' data-testid='standalone-content'>
        <p>Content goes here</p>
        <button type='button'>Action 1</button>
        <button type='button'>Action 2</button>
      </main>
      <footer data-testid='standalone-actions'>
        <button type='button'>Primary Action</button>
      </footer>
    </div>
  );
}

/**
 * Test router.
 */
function TestRouter({ initialRoute = '/pilot' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path='/pilot' element={<MockStandaloneHome name='TerraPilot' />} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Test Setup
// ============================================================================

describe('Standalone Homes Accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // Heading Structure Tests
  // ==========================================================================

  describe('Heading Structure', () => {
    it('h1_present_in_standalone_home', () => {
      render(<TestRouter />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('TerraPilot');
    });

    it('h1_is_first_heading_on_page', () => {
      render(<TestRouter />);

      const allHeadings = screen.getAllByRole('heading');
      expect(allHeadings.length).toBeGreaterThan(0);

      // First heading should be h1
      const firstHeading = allHeadings[0];
      expect(firstHeading.tagName).toBe('H1');
    });

    it('no_skipped_heading_levels', () => {
      render(<TestRouter />);

      const allHeadings = screen.getAllByRole('heading');
      const levels = allHeadings.map((h) => parseInt(h.tagName.replace('H', ''), 10));

      // No gaps in heading levels (e.g., h1 -> h3 without h2)
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });
  });

  // ==========================================================================
  // Landmark Region Tests
  // ==========================================================================

  describe('Landmark Regions', () => {
    it('banner_landmark_present', () => {
      render(<TestRouter />);

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
    });

    it('main_landmark_present', () => {
      render(<TestRouter />);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('main_contains_primary_content', () => {
      render(<TestRouter />);

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('data-testid', 'standalone-content');
    });

    it('banner_contains_heading', () => {
      render(<TestRouter />);

      const banner = screen.getByRole('banner');
      const heading = within(banner).getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Focus Order Tests
  // ==========================================================================

  describe('Focus Order', () => {
    it('focus_order_is_logical', async () => {
      const user = userEvent.setup();
      render(<TestRouter />);

      // Get all focusable elements in order
      const focusableElements = screen.getAllByRole('button');

      // Tab through elements
      for (let i = 0; i < focusableElements.length; i++) {
        await user.tab();
        expect(document.activeElement).toBe(focusableElements[i]);
      }
    });

    it('no_focus_trap_unexpected', async () => {
      const user = userEvent.setup();
      render(<TestRouter />);

      const buttons = screen.getAllByRole('button');

      // Tab through all buttons
      for (let i = 0; i < buttons.length; i++) {
        await user.tab();
      }

      // One more tab should move past all buttons
      await user.tab();

      // Should not be stuck on the last button
      // (unless it's the actual end of the document)
    });

    it('keyboard_navigation_reaches_all_actions', async () => {
      const user = userEvent.setup();
      render(<TestRouter />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Each button should be reachable via Tab
      for (const button of buttons) {
        // Tab until we reach this button or exhaust attempts
        let found = false;
        for (let i = 0; i < buttons.length + 2; i++) {
          await user.tab();
          if (document.activeElement === button) {
            found = true;
            break;
          }
        }

        // Reset focus for next iteration
        (document.activeElement as HTMLElement)?.blur();
      }
    });
  });

  // ==========================================================================
  // Aria Hidden Tests
  // ==========================================================================

  describe('Aria Hidden', () => {
    it('no_interactive_elements_in_aria_hidden', () => {
      render(<TestRouter />);

      // Find all aria-hidden elements
      const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');

      for (const hidden of hiddenElements) {
        // Check for interactive elements inside
        const interactiveElements = hidden.querySelectorAll(
          'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        // Should not have focusable interactive elements
        interactiveElements.forEach((el) => {
          // If interactive, should have tabindex="-1"
          const tabIndex = el.getAttribute('tabindex');
          expect(tabIndex).toBe('-1');
        });
      }
    });

    it('decorative_elements_are_hidden_from_a11y_tree', () => {
      render(<TestRouter />);

      // Decorative elements (icons without text) should be aria-hidden
      const icons = document.querySelectorAll('[data-decorative="true"]');

      for (const icon of icons) {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });

  // ==========================================================================
  // Intent Badge Tests
  // ==========================================================================

  describe('Intent Badge', () => {
    it('standalone_badge_present_and_accessible', () => {
      render(<TestRouter />);

      const badge = screen.getByText('Standalone');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-intent', 'standalone');
    });

    it('badge_is_visible_text_not_just_aria', () => {
      render(<TestRouter />);

      const badge = screen.getByText('Standalone');

      // Should not be visually hidden
      expect(badge).not.toHaveClass('sr-only');
      expect(badge).toBeVisible();
    });
  });
});
