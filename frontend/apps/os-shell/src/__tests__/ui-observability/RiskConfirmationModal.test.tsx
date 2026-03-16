/**
 * RiskConfirmationModal.test.tsx
 *
 * Phase 3: Confirmation Modal Component Tests
 * Tests the modal UI for write-risk tool confirmation.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Risk } from '../../api/pilotApi';
import { RiskConfirmationModal } from '../../components/pilot/RiskConfirmationModal';

describe('RiskConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    toolId: 'test.tool',
    toolDescription: 'Test tool description',
    risk: 'write_low' as Risk,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<RiskConfirmationModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/test.tool/)).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<RiskConfirmationModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays tool description', () => {
      render(<RiskConfirmationModal {...defaultProps} />);

      expect(screen.getByText(/test tool description/i)).toBeInTheDocument();
    });

    it('displays risk level badge', () => {
      render(<RiskConfirmationModal {...defaultProps} risk='write_high' />);

      expect(screen.getByText(/write_high/i)).toBeInTheDocument();
    });
  });

  describe('Risk Level Styling', () => {
    it('applies warning style for write_low', () => {
      render(<RiskConfirmationModal {...defaultProps} risk='write_low' />);

      // Modal should have blue/warning styling
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('risk-write-low');
    });

    it('applies caution style for write_high', () => {
      render(<RiskConfirmationModal {...defaultProps} risk='write_high' />);

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('risk-write-high');
    });

    it('applies danger style for irreversible', () => {
      render(<RiskConfirmationModal {...defaultProps} risk='irreversible' />);

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('risk-irreversible');
    });
  });

  describe('Confirm/Cancel Actions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<RiskConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<RiskConfirmationModal {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when escape key is pressed', () => {
      const onCancel = vi.fn();
      render(<RiskConfirmationModal {...defaultProps} onCancel={onCancel} />);

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when clicking backdrop', () => {
      const onCancel = vi.fn();
      render(<RiskConfirmationModal {...defaultProps} onCancel={onCancel} />);

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Reason Code Selection', () => {
    it('renders reason code options when reasonCodes provided', () => {
      render(
        <RiskConfirmationModal
          {...defaultProps}
          risk='write_high'
          reasonCodes={['correction', 'appeal', 'revaluation']}
          requiresReasonCode={true}
        />
      );

      expect(screen.getByText(/correction/i)).toBeInTheDocument();
      expect(screen.getByText(/appeal/i)).toBeInTheDocument();
      expect(screen.getByText(/revaluation/i)).toBeInTheDocument();
    });

    it('disables confirm button when reason code is required but not selected', () => {
      render(
        <RiskConfirmationModal
          {...defaultProps}
          risk='write_high'
          reasonCodes={['correction', 'appeal']}
          requiresReasonCode={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
    });

    it('enables confirm button after selecting reason code', () => {
      render(
        <RiskConfirmationModal
          {...defaultProps}
          risk='write_high'
          reasonCodes={['correction', 'appeal']}
          requiresReasonCode={true}
        />
      );

      // Select reason code
      const correctionOption = screen.getByText(/correction/i);
      fireEvent.click(correctionOption);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('calls onConfirm with selected reason code', () => {
      const onConfirm = vi.fn();
      render(
        <RiskConfirmationModal
          {...defaultProps}
          onConfirm={onConfirm}
          risk='write_high'
          reasonCodes={['correction', 'appeal']}
          requiresReasonCode={true}
        />
      );

      // Select reason code
      fireEvent.click(screen.getByText(/appeal/i));

      // Confirm
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      expect(onConfirm).toHaveBeenCalledWith({ reasonCode: 'appeal' });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during confirmation', async () => {
      const onConfirm = vi.fn(() => new Promise(() => {})); // Never resolves
      render(<RiskConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/confirming/i)).toBeInTheDocument();
      });

      expect(confirmButton).toBeDisabled();
    });

    it('disables cancel button during loading', async () => {
      const onConfirm = vi.fn(() => new Promise(() => {}));
      render(<RiskConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible role dialog', () => {
      render(<RiskConfirmationModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible label', () => {
      render(<RiskConfirmationModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('traps focus within modal', () => {
      render(<RiskConfirmationModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Focus should be within modal
      expect(document.activeElement).toBe(cancelButton); // First focusable element

      // Tab should cycle within modal
      fireEvent.keyDown(confirmButton, { key: 'Tab', shiftKey: false });
    });
  });

  describe('Phase 4: Approval Token Flow (Irreversible)', () => {
    it('shows approval required section for irreversible tools', () => {
      render(
        <RiskConfirmationModal
          {...defaultProps}
          risk='irreversible'
          requiresSupervisorApproval={true}
          supervisorRoles={['county_admin', 'supervisor']}
        />
      );

      // Phase 4: Now shows "Approval Required" with typed phrase input
      expect(screen.getByText(/approval required/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type.*to confirm/i)).toBeInTheDocument();
    });

    it('disables confirm button when supervisor approval is required', () => {
      render(
        <RiskConfirmationModal
          {...defaultProps}
          risk='irreversible'
          requiresSupervisorApproval={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
    });

    it('shows generate approval button for irreversible tools', () => {
      render(
        <RiskConfirmationModal
          {...defaultProps}
          risk='irreversible'
          requiresSupervisorApproval={true}
        />
      );

      expect(screen.getByRole('button', { name: /generate.*approval/i })).toBeInTheDocument();
    });
  });
});
