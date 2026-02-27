/**
 * TerraFusion OS Parcel Context Actions & Trace Tests
 *
 * Tests for parcel context actions and TerraTrace event emission.
 * Enforces contract: all context changes are auditable via trace events.
 *
 * Contract requirements:
 * - Change action opens /property/search with openTab passthrough
 * - Trace event emits on parcel context set
 * - Trace event emits on parcel context clear
 * - Event payloads are safe (hashed, no PII)
 *
 * @module __tests__/parcelContext/parcelContext.actions.test
 * @see Slice 10: Parcel Context UX Surface
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ParcelContextIndicator } from '../../components/ParcelContext/ParcelContextIndicator';
import { WORKBENCH_FALLBACK_BASE } from '../../config/suiteRegistry';
import {
    setParcelContext,
    useParcelContextStore,
    type ParcelContext
} from '../../context/parcelContext';
import {
    emitParcelContextEvent,
    ParcelContextEventType
} from '../../context/parcelContextTrace';

// ============================================================================
// Mocks
// ============================================================================

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PARCEL: ParcelContext = {
  parcelId: 'P-2024-TEST-002',
  parcelName: '456 Oak Ave',
  source: 'selection',
};

// ============================================================================
// Helper: Reset Store
// ============================================================================

function resetStore() {
  useParcelContextStore.setState({ context: null });
  try {
    sessionStorage.removeItem('tf:parcel-context');
  } catch {
    // Session storage might be unavailable
  }
}

// ============================================================================
// Helper: Render with Router
// ============================================================================

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// ============================================================================
// Helper: Capture CustomEvents
// ============================================================================

function captureCustomEvents(eventType: string): CustomEvent[] {
  const events: CustomEvent[] = [];
  const handler = (e: CustomEvent) => events.push(e);

  window.addEventListener(eventType, handler as EventListener);

  return events;
}

// ============================================================================
// Tests: Navigation Actions
// ============================================================================

describe('Parcel Context Actions', () => {
  beforeEach(() => {
    resetStore();
    mockNavigate.mockClear();
  });

  // ==========================================================================
  // Change Parcel Action
  // ==========================================================================

  describe('change parcel action', () => {
    it('navigates to /property/search when "Select Parcel" clicked (no context)', () => {
      renderWithRouter(<ParcelContextIndicator />);

      const selectButton = screen.getByRole('button', { name: /select parcel/i });
      fireEvent.click(selectButton);

      expect(mockNavigate).toHaveBeenCalledWith(WORKBENCH_FALLBACK_BASE);
    });

    it('navigates to /property/search when "Change" clicked (with context)', () => {
      setParcelContext(TEST_PARCEL);
      renderWithRouter(<ParcelContextIndicator />);

      const changeButton = screen.getByRole('button', { name: /change/i });
      fireEvent.click(changeButton);

      expect(mockNavigate).toHaveBeenCalledWith(WORKBENCH_FALLBACK_BASE);
    });

    it('preserves intended tab via openTab query param when provided', () => {
      setParcelContext(TEST_PARCEL);
      renderWithRouter(<ParcelContextIndicator intendedTab='forge' />);

      const changeButton = screen.getByRole('button', { name: /change/i });
      fireEvent.click(changeButton);

      expect(mockNavigate).toHaveBeenCalledWith(`${WORKBENCH_FALLBACK_BASE}?openTab=forge`);
    });

    it('does not include openTab when no intent provided', () => {
      renderWithRouter(<ParcelContextIndicator />);

      const selectButton = screen.getByRole('button', { name: /select parcel/i });
      fireEvent.click(selectButton);

      expect(mockNavigate).toHaveBeenCalledWith(WORKBENCH_FALLBACK_BASE);
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('openTab'));
    });
  });
});

// ============================================================================
// Tests: TerraTrace Event Emission
// ============================================================================

describe('Parcel Context Trace Events', () => {
  beforeEach(() => {
    resetStore();
  });

  // ==========================================================================
  // Event Emission
  // ==========================================================================

  describe('emitParcelContextEvent', () => {
    it('dispatches custom event on parcel_context_set', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      emitParcelContextEvent(ParcelContextEventType.SET, {
        parcelIdHash: 'hash-abc123',
        source: 'selection',
      });

      window.removeEventListener('terratrace:parcel_context', handler);

      expect(events.length).toBe(1);
      expect(events[0].detail.type).toBe('parcel_context_set');
    });

    it('dispatches custom event on parcel_context_cleared', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      emitParcelContextEvent(ParcelContextEventType.CLEARED, {
        previousParcelIdHash: 'hash-xyz789',
        source: 'user_action',
      });

      window.removeEventListener('terratrace:parcel_context', handler);

      expect(events.length).toBe(1);
      expect(events[0].detail.type).toBe('parcel_context_cleared');
    });

    it('includes timestamp in event payload', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      const before = Date.now();
      emitParcelContextEvent(ParcelContextEventType.SET, {
        parcelIdHash: 'hash-test',
        source: 'route',
      });
      const after = Date.now();

      window.removeEventListener('terratrace:parcel_context', handler);

      expect(events[0].detail.timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].detail.timestamp).toBeLessThanOrEqual(after);
    });

    it('includes surface source in event', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      emitParcelContextEvent(ParcelContextEventType.SET, {
        parcelIdHash: 'hash-surf',
        source: 'launcher',
      });

      window.removeEventListener('terratrace:parcel_context', handler);

      expect(events[0].detail.payload.source).toBe('launcher');
    });
  });

  // ==========================================================================
  // Safe Payloads (No PII)
  // ==========================================================================

  describe('safe payloads', () => {
    it('uses parcelIdHash, not raw parcelId', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      emitParcelContextEvent(ParcelContextEventType.SET, {
        parcelIdHash: 'hashed-value',
        source: 'selection',
      });

      window.removeEventListener('terratrace:parcel_context', handler);

      const payload = events[0].detail.payload;
      expect(payload.parcelIdHash).toBe('hashed-value');
      expect(payload).not.toHaveProperty('parcelId');
      expect(payload).not.toHaveProperty('parcelName');
    });

    it('does not include parcel name or address', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      emitParcelContextEvent(ParcelContextEventType.SET, {
        parcelIdHash: 'safe-hash',
        source: 'standalone',
      });

      window.removeEventListener('terratrace:parcel_context', handler);

      const payload = events[0].detail.payload;
      const payloadStr = JSON.stringify(payload);

      // Should not contain any PII fields
      expect(payloadStr).not.toContain('name');
      expect(payloadStr).not.toContain('address');
      expect(payloadStr).not.toContain('Main St');
    });
  });

  // ==========================================================================
  // Integration: Store Changes Emit Trace
  // ==========================================================================

  describe('store integration', () => {
    it('setParcelContext triggers trace event', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      // Import the traced version
      const { setParcelContextWithTrace } = require('../../context/parcelContextTrace');
      setParcelContextWithTrace({
        parcelId: 'P-TRACED',
        source: 'selection',
      });

      window.removeEventListener('terratrace:parcel_context', handler);

      expect(events.length).toBe(1);
      expect(events[0].detail.type).toBe('parcel_context_set');
    });

    it('clearParcelContext triggers trace event', () => {
      // Set initial context
      setParcelContext({ parcelId: 'P-TO-CLEAR', source: 'route' });

      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('terratrace:parcel_context', handler);

      // Import the traced version
      const { clearParcelContextWithTrace } = require('../../context/parcelContextTrace');
      clearParcelContextWithTrace('P-TO-CLEAR');

      window.removeEventListener('terratrace:parcel_context', handler);

      expect(events.length).toBe(1);
      expect(events[0].detail.type).toBe('parcel_context_cleared');
    });
  });
});
