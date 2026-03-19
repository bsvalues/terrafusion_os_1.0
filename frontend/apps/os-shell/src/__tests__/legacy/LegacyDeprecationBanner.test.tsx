/**
 * LegacyDeprecationBanner.test.tsx
 *
 * Phase 6.3: Tests for legacy deprecation banner component.
 *
 * Success Criteria:
 * - Banner renders on legacy routes with correct messaging
 * - Dismiss button hides banner for session
 * - Banner respects session storage dismissal
 * - Accessibility: proper ARIA roles and keyboard navigation
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LegacyDeprecationBanner } from '../../components/legacy/LegacyDeprecationBanner';

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
beforeEach(() => {
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  vi.spyOn(Storage.prototype, 'getItem')
    .mockImplementation((key: string) => mockSessionStorage[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
    mockSessionStorage[key] = value;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LegacyDeprecationBanner', () => {
  describe('Rendering', () => {
    it('renders banner with deprecation message', () => {
      render(<LegacyDeprecationBanner legacyAppId='suites.appraisal' route='/suites/appraisal' />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/legacy ui deprecated/i)).toBeInTheDocument();
    });

    it('displays upgrade prompt with OS link', () => {
      render(<LegacyDeprecationBanner legacyAppId='modules.export' route='/modules/export' />);

      expect(screen.getByText(/use os/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to os/i })).toBeInTheDocument();
    });

    it('shows legacy app identifier in banner', () => {
      render(<LegacyDeprecationBanner legacyAppId='suites.valuation' route='/suites/valuation' />);

      expect(screen.getByText(/suites\.valuation/i)).toBeInTheDocument();
    });
  });

  describe('Dismiss Behavior', () => {
    it('provides dismiss button', () => {
      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('hides banner when dismissed', () => {
      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('persists dismissal to session storage', () => {
      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'legacy_banner_dismissed_test.app',
        expect.any(String)
      );
    });

    it('respects previously dismissed state from session storage', () => {
      mockSessionStorage['legacy_banner_dismissed_test.app'] = 'true';

      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper alert role', () => {
      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('dismiss button has accessible name', () => {
      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toHaveAccessibleName();
    });

    it('provides keyboard navigation to OS link', () => {
      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      const link = screen.getByRole('link', { name: /go to os/i });
      expect(link).toHaveAttribute('href');
    });
  });

  describe('Telemetry Integration', () => {
    it('calls onTelemetry callback on mount', () => {
      const onTelemetry = vi.fn();

      render(
        <LegacyDeprecationBanner legacyAppId='test.app' route='/test' onTelemetry={onTelemetry} />
      );

      expect(onTelemetry).toHaveBeenCalledWith({
        legacyAppId: 'test.app',
        route: '/test',
        action: 'view',
      });
    });

    it('calls onTelemetry callback with dismiss action', () => {
      const onTelemetry = vi.fn();

      render(
        <LegacyDeprecationBanner legacyAppId='test.app' route='/test' onTelemetry={onTelemetry} />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(onTelemetry).toHaveBeenCalledWith({
        legacyAppId: 'test.app',
        route: '/test',
        action: 'dismiss',
      });
    });

    it('calls onTelemetry callback with upgrade action on link click', () => {
      const onTelemetry = vi.fn();

      render(
        <LegacyDeprecationBanner legacyAppId='test.app' route='/test' onTelemetry={onTelemetry} />
      );

      const link = screen.getByRole('link', { name: /go to os/i });
      fireEvent.click(link);

      expect(onTelemetry).toHaveBeenCalledWith({
        legacyAppId: 'test.app',
        route: '/test',
        action: 'upgrade',
      });
    });
  });

  describe('Styling', () => {
    it('applies warning styling by default', () => {
      render(<LegacyDeprecationBanner legacyAppId='test.app' route='/test' />);

      const alert = screen.getByRole('alert');
      expect(alert.className).toMatch(/warning|amber|yellow/i);
    });

    it('supports custom className override', () => {
      render(
        <LegacyDeprecationBanner legacyAppId='test.app' route='/test' className='custom-class' />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-class');
    });
  });
});
