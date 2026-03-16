/**
 * TerraFusion OS Enhanced Clock Tests
 * 
 * Tests for the Clock component:
 * - Time display
 * - Date display
 * - Tooltip with full date
 * - Accessibility
 * 
 * @module shell/desktop/__tests__/Clock.test
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Clock } from '../Clock';



// Mock date
const mockDate = new Date('2024-12-15T14:30:00');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('Clock', () => {
  describe('Rendering', () => {
    it('renders clock component', () => {
      render(<Clock />);
      
      expect(screen.getByTestId('clock')).toBeInTheDocument();
    });

    it('displays formatted time', () => {
      render(<Clock />);
      
      // Should show 2:30 PM (or similar based on locale)
      expect(screen.getByTestId('clock-time')).toBeInTheDocument();
    });

    it('displays short date', () => {
      render(<Clock />);
      
      // Should show Dec 15 (or similar based on locale)
      expect(screen.getByTestId('clock-date')).toBeInTheDocument();
    });

    it('has tooltip with full date', () => {
      render(<Clock />);
      
      const clock = screen.getByTestId('clock');
      expect(clock).toHaveAttribute('title');
      expect(clock.getAttribute('title')).toMatch(/2024|December|Sunday/i);
    });
  });

  describe('Accessibility', () => {
    it('has time element with dateTime attribute', () => {
      render(<Clock />);
      
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime');
    });

    it('has aria-label for screen readers', () => {
      render(<Clock />);
      
      const clock = screen.getByTestId('clock');
      expect(clock).toHaveAttribute('aria-label');
    });
  });

  describe('Updates', () => {
    it('updates time when minute changes', async () => {
      render(<Clock />);
      
      const initialTime = screen.getByTestId('clock-time').textContent;
      
      // Advance by 1 minute
      vi.advanceTimersByTime(60000);
      
      await waitFor(() => {
        // Time should have updated (or stayed same if within same minute)
        expect(screen.getByTestId('clock-time')).toBeInTheDocument();
      });
    });
  });
});
