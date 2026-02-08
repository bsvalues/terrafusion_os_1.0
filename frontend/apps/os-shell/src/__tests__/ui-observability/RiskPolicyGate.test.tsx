/**
 * RiskPolicyGate.test.tsx
 *
 * Phase 3: Write-Risk Confirmation Policy Tests
 * Tests the policy gate that determines what confirmation is required for tool invocation.
 *
 * Risk Level Policy:
 * - read_only: Execute immediately, no confirmation needed
 * - write_low: Requires confirmation (1-step modal)
 * - write_high: Requires confirmation + reason code
 * - irreversible: Requires confirmation + reason code + supervisor approval (Phase 4)
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as pilotApi from '../../api/pilotApi';
import { RiskPolicyGate } from '../../components/pilot/RiskPolicyGate';

// Mock the pilotApi module
jest.mock('../../api/pilotApi');

const mockValidatePilotTool = pilotApi.validatePilotTool as jest.MockedFunction<
  typeof pilotApi.validatePilotTool
>;
const mockInvokeTool = pilotApi.invokeTool as jest.MockedFunction<typeof pilotApi.invokeTool>;

describe('RiskPolicyGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('read_only tools', () => {
    it('executes read_only tool immediately without confirmation', async () => {
      // Arrange: Mock validation response for read_only tool
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'registry.list_tools',
          suite: 'pilot',
          risk: 'read_only',
          requiresConfirmation: false,
        },
        preflight: {
          confirmationRequired: false,
          confirmationProvided: false,
          reasonCodeRequired: false,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-read-only-123',
        result: { toolId: 'registry.list_tools', output: '[]' },
      });

      const onComplete = jest.fn();

      // Act
      render(
        <RiskPolicyGate
          toolId='registry.list_tools'
          params={{}}
          onComplete={onComplete}
          onCancel={jest.fn()}
        />
      );

      // Assert: Tool should execute immediately (no confirmation dialog)
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'registry.list_tools',
          params: {},
        });
      });

      // onComplete called with result
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            correlationId: 'corr-read-only-123',
          })
        );
      });

      // No confirmation modal should be shown
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('write_low tools', () => {
    it('shows confirmation modal for write_low tool', async () => {
      // Arrange: Mock validation response for write_low tool
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'forge.update_cost',
          suite: 'forge',
          risk: 'write_low',
          requiresConfirmation: true,
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: false,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      // Act
      render(
        <RiskPolicyGate
          toolId='forge.update_cost'
          params={{ costValue: 1000 }}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Assert: Confirmation modal should be shown
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Modal should show tool info and confirm button (use getByRole to be specific)
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByText(/write_low/i)).toBeInTheDocument();
    });

    it('executes write_low tool after confirmation', async () => {
      // Arrange
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'forge.update_cost',
          suite: 'forge',
          risk: 'write_low',
          requiresConfirmation: true,
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: false,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-write-low-456',
        result: { toolId: 'forge.update_cost', output: '{"updated": true}' },
      });

      const onComplete = jest.fn();

      // Act
      render(
        <RiskPolicyGate
          toolId='forge.update_cost'
          params={{ costValue: 1000 }}
          onComplete={onComplete}
          onCancel={jest.fn()}
        />
      );

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      // Assert: Tool should be invoked with confirmation flag
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'forge.update_cost',
          params: { costValue: 1000 },
          confirmation: true,
        });
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      // Arrange
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'forge.update_cost',
          suite: 'forge',
          risk: 'write_low',
          requiresConfirmation: true,
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: false,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      const onCancel = jest.fn();

      // Act
      render(
        <RiskPolicyGate
          toolId='forge.update_cost'
          params={{}}
          onComplete={jest.fn()}
          onCancel={onCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Assert
      expect(onCancel).toHaveBeenCalled();
      expect(mockInvokeTool).not.toHaveBeenCalled();
    });
  });

  describe('write_high tools', () => {
    it('shows confirmation modal with reason code requirement for write_high tool', async () => {
      // Arrange
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'dais.approve_assessment',
          suite: 'dais',
          risk: 'write_high',
          requiresConfirmation: true,
          reasonCodes: ['correction', 'appeal', 'revaluation', 'audit'],
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: true,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      // Act
      render(
        <RiskPolicyGate
          toolId='dais.approve_assessment'
          params={{ parcelId: 'P-123' }}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Assert: Modal should show reason code selector
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/reason code/i)).toBeInTheDocument();
      expect(screen.getByText(/write_high/i)).toBeInTheDocument();

      // Reason codes should be selectable
      expect(screen.getByText(/correction/i)).toBeInTheDocument();
    });

    it('requires reason code before confirming write_high tool', async () => {
      // Arrange
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'dais.approve_assessment',
          suite: 'dais',
          risk: 'write_high',
          requiresConfirmation: true,
          reasonCodes: ['correction', 'appeal', 'revaluation'],
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: true,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      // Act
      render(
        <RiskPolicyGate
          toolId='dais.approve_assessment'
          params={{ parcelId: 'P-123' }}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Confirm button should be disabled without reason code
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
    });

    it('executes write_high tool after confirmation with reason code', async () => {
      const user = userEvent.setup();

      // Arrange
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'dais.approve_assessment',
          suite: 'dais',
          risk: 'write_high',
          requiresConfirmation: true,
          reasonCodes: ['correction', 'appeal', 'revaluation'],
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: true,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-write-high-789',
        result: { toolId: 'dais.approve_assessment', output: '{"approved": true}' },
      });

      const onComplete = jest.fn();

      // Act
      render(
        <RiskPolicyGate
          toolId='dais.approve_assessment'
          params={{ parcelId: 'P-123' }}
          onComplete={onComplete}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select reason code using userEvent for better simulation
      const reasonCodeButton = await screen.findByText('correction');
      await user.click(reasonCodeButton);

      // Wait for the selected class to be applied to verify click registered
      await waitFor(
        () => {
          expect(reasonCodeButton).toHaveClass('selected');
        },
        { timeout: 3000 }
      );

      // Now confirm button should be enabled
      await waitFor(
        () => {
          const confirmBtn = screen.getByRole('button', { name: /confirm/i });
          expect(confirmBtn).not.toBeDisabled();
        },
        { timeout: 3000 }
      );

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Assert: Tool invoked with confirmation and reason code
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'dais.approve_assessment',
          params: { parcelId: 'P-123' },
          confirmation: true,
          reasonCode: 'correction',
        });
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('validation errors', () => {
    it('displays validation errors from preflight check', async () => {
      // Arrange
      mockValidatePilotTool.mockResolvedValue({
        valid: false,
        violations: ['Tool requires supervisor approval', 'Invalid parameter: parcelId'],
        tool: {
          toolId: 'dais.delete_assessment',
          suite: 'dais',
          risk: 'irreversible',
          requiresSupervisorApproval: true,
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: true,
          reasonCodeProvided: false,
          supervisorRequired: true,
          supervisorProvided: false,
        },
      });

      // Act
      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{}}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Assert: Validation errors should be displayed
      await waitFor(() => {
        expect(screen.getByText(/tool requires supervisor approval/i)).toBeInTheDocument();
      });

      // Confirm button should be disabled
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
    });

    it('handles network error during validation', async () => {
      // Arrange
      mockValidatePilotTool.mockRejectedValue(new Error('Network error'));

      const onCancel = jest.fn();

      // Act
      render(
        <RiskPolicyGate toolId='some.tool' params={{}} onComplete={jest.fn()} onCancel={onCancel} />
      );

      // Assert: Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('correlationId visibility', () => {
    it('displays correlationId when tool invocation fails', async () => {
      // Arrange
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'forge.update_cost',
          suite: 'forge',
          risk: 'write_low',
          requiresConfirmation: true,
        },
        preflight: {
          confirmationRequired: true,
          confirmationProvided: false,
          reasonCodeRequired: false,
          reasonCodeProvided: false,
          supervisorRequired: false,
          supervisorProvided: false,
        },
      });

      mockInvokeTool.mockResolvedValue({
        success: false,
        correlationId: 'corr-fail-error-999',
        error: {
          code: 'EXECUTION_FAILED',
          message: 'Database constraint violation',
          severity: 'high',
        },
      });

      // Act
      render(
        <RiskPolicyGate
          toolId='forge.update_cost'
          params={{}}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Confirm
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      // Assert: Error with correlationId should be visible
      await waitFor(() => {
        expect(screen.getByText(/corr-fail-error-999/)).toBeInTheDocument();
      });
    });
  });
});
