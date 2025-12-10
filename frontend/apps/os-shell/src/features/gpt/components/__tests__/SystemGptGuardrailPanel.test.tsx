/**
 * ═══════════════════════════════════════════════════════════════
 * PHASE 26: SYSTEMGPT GUARDRAIL PANEL TESTS
 * Tests for guardrail decisions display panel
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LastGuardrailDecision } from '../../../../api/systemDiagnosticsApi';
import { SystemGptGuardrailPanel } from '../SystemGptGuardrailPanel';

describe('SystemGptGuardrailPanel', () => {
  describe('when no decision is available', () => {
    it('displays no-decision message when decision is null', () => {
      render(<SystemGptGuardrailPanel decision={null} countyName='Benton County' />);

      expect(screen.getByText(/no guardrail decisions recorded yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Benton County/)).toBeInTheDocument();
    });

    it('displays no-decision message when decision is undefined', () => {
      render(<SystemGptGuardrailPanel decision={undefined} countyName='Yakima County' />);

      expect(screen.getByText(/no guardrail decisions recorded yet/i)).toBeInTheDocument();
    });

    it('explains what guardrails do', () => {
      render(<SystemGptGuardrailPanel decision={null} />);

      expect(screen.getByText(/policy, metrics, and capacity/i)).toBeInTheDocument();
    });
  });

  describe('when decision is allowed', () => {
    const allowedDecision: LastGuardrailDecision = {
      allow: true,
      kind: 'Allowed',
      autoSafeModeRecommended: false,
      autoThrottle: false,
      forceExplain: false,
      autoSanitize: false,
      advisory: 'Request processed normally.',
      decisionTimestampUtc: new Date().toISOString(),
      contextId: 'general-chat',
    };

    it('shows allowed status', () => {
      render(<SystemGptGuardrailPanel decision={allowedDecision} />);

      expect(screen.getByText(/Allowed/)).toBeInTheDocument();
    });

    it('shows advisory message', () => {
      render(<SystemGptGuardrailPanel decision={allowedDecision} />);

      expect(screen.getByText(/Request processed normally/)).toBeInTheDocument();
    });

    it('shows context ID', () => {
      render(<SystemGptGuardrailPanel decision={allowedDecision} />);

      expect(screen.getByText(/general-chat/)).toBeInTheDocument();
    });
  });

  describe('when decision is denied', () => {
    const deniedDecision: LastGuardrailDecision = {
      allow: false,
      kind: 'DeniedByPolicy',
      denyReason: 'GPT operations are disabled by policy.',
      autoSafeModeRecommended: false,
      autoThrottle: false,
      forceExplain: false,
      autoSanitize: false,
      advisory: 'Policy violation detected.',
      decisionTimestampUtc: new Date().toISOString(),
    };

    it('shows denied status', () => {
      render(<SystemGptGuardrailPanel decision={deniedDecision} />);

      expect(screen.getByText(/Denied/)).toBeInTheDocument();
    });

    it('shows deny reason', () => {
      render(<SystemGptGuardrailPanel decision={deniedDecision} />);

      expect(screen.getByText(/GPT operations are disabled by policy/)).toBeInTheDocument();
    });
  });

  describe('behavior flags display', () => {
    it('shows all flags as off when disabled', () => {
      const decision: LastGuardrailDecision = {
        allow: true,
        kind: 'Allowed',
        autoSafeModeRecommended: false,
        autoThrottle: false,
        forceExplain: false,
        autoSanitize: false,
        decisionTimestampUtc: new Date().toISOString(),
      };

      render(<SystemGptGuardrailPanel decision={decision} />);

      expect(screen.getByText(/Safe Mode Recommended/)).toBeInTheDocument();
      expect(screen.getByText(/Auto Throttle/)).toBeInTheDocument();
      expect(screen.getByText(/Force Explain/)).toBeInTheDocument();
      expect(screen.getByText(/Auto Sanitize/)).toBeInTheDocument();
    });

    it('shows throttle flag when enabled', () => {
      const decision: LastGuardrailDecision = {
        allow: true,
        kind: 'ThrottledByCapacity',
        autoSafeModeRecommended: false,
        autoThrottle: true,
        forceExplain: false,
        autoSanitize: false,
        advisory: 'High saturation - throttling applied.',
        decisionTimestampUtc: new Date().toISOString(),
      };

      render(<SystemGptGuardrailPanel decision={decision} />);

      expect(screen.getByText(/High saturation/)).toBeInTheDocument();
    });

    it('shows sanitize flag when enabled', () => {
      const decision: LastGuardrailDecision = {
        allow: true,
        kind: 'Sanitized',
        autoSafeModeRecommended: false,
        autoThrottle: false,
        forceExplain: false,
        autoSanitize: true,
        advisory: 'Owner names sanitized.',
        decisionTimestampUtc: new Date().toISOString(),
      };

      render(<SystemGptGuardrailPanel decision={decision} />);

      expect(screen.getByText(/Owner names sanitized/)).toBeInTheDocument();
    });

    it('shows force explain flag when enabled', () => {
      const decision: LastGuardrailDecision = {
        allow: true,
        kind: 'ForceExplainOnValuation',
        autoSafeModeRecommended: false,
        autoThrottle: false,
        forceExplain: true,
        autoSanitize: false,
        advisory: 'ExplainGPT required for valuation.',
        decisionTimestampUtc: new Date().toISOString(),
        contextId: 'valuation',
      };

      render(<SystemGptGuardrailPanel decision={decision} />);

      expect(screen.getByText(/ExplainGPT required/)).toBeInTheDocument();
    });

    it('shows safe mode recommended flag when enabled', () => {
      const decision: LastGuardrailDecision = {
        allow: true,
        kind: 'SafeModeRecommended',
        autoSafeModeRecommended: true,
        autoThrottle: false,
        forceExplain: false,
        autoSanitize: false,
        advisory: 'Safe Mode is recommended due to rising errors.',
        decisionTimestampUtc: new Date().toISOString(),
      };

      render(<SystemGptGuardrailPanel decision={decision} />);

      expect(screen.getByText(/Safe Mode is recommended/)).toBeInTheDocument();
    });
  });

  describe('timestamp display', () => {
    it('shows relative time for recent decisions', () => {
      const recentDecision: LastGuardrailDecision = {
        allow: true,
        kind: 'Allowed',
        autoSafeModeRecommended: false,
        autoThrottle: false,
        forceExplain: false,
        autoSanitize: false,
        decisionTimestampUtc: new Date().toISOString(),
      };

      render(<SystemGptGuardrailPanel decision={recentDecision} />);

      // Recent timestamp should show "Xs ago" or similar
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });
});
