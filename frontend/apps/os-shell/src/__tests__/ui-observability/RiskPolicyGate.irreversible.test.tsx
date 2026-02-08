/**
 * RiskPolicyGate.irreversible.test.tsx
 *
 * Phase 4: Solo Approval Token Tests
 * Tests for irreversible tool execution with approval token enforcement.
 *
 * Success Criteria:
 * 1. Irreversible tools cannot execute without valid ApprovalToken
 * 2. Approval flow requires typed confirmation phrase
 * 3. Token is short-lived and scoped to specific request
 * 4. All approval events are auditable via correlationId
 */

import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RiskPolicyGate } from '../../components/pilot/RiskPolicyGate';

// Mock pilotApi
vi.mock('../../api/pilotApi', () => ({
  validatePilotTool: vi.fn(),
  invokeTool: vi.fn(),
  requestApprovalToken: vi.fn(),
}));

import { invokeTool, requestApprovalToken, validatePilotTool } from '../../api/pilotApi';

const mockValidatePilotTool = validatePilotTool as Mock<typeof validatePilotTool>;
const mockInvokeTool = invokeTool as Mock<typeof invokeTool>;
const mockRequestApprovalToken = requestApprovalToken as Mock<
  typeof requestApprovalToken
>;

describe('RiskPolicyGate - Irreversible Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockIrreversibleValidation = {
    valid: true,
    violations: [],
    tool: {
      toolId: 'dais.delete_assessment',
      suite: 'dais',
      risk: 'irreversible',
      requiresConfirmation: true,
      reasonCodes: ['correction', 'appeal', 'audit'],
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
  };

  const mockApprovalToken = {
    tokenId: 'approval-token-123',
    toolId: 'dais.delete_assessment',
    requestHash: 'sha256-abc123',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(), // 60 seconds
    issuedBy: 'current-user',
    reasonCode: 'correction',
  };

  describe('blocks_irreversible_withoutApprovalToken', () => {
    it('cannot execute irreversible tool without an approval token', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);

      const onComplete = vi.fn();
      const onCancel = vi.fn();

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify confirm button is disabled without approval token
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();

      // Verify supervisor approval section is visible
      expect(screen.getByText(/approval required/i)).toBeInTheDocument();

      // Tool should NOT be invoked
      expect(mockInvokeTool).not.toHaveBeenCalled();
    });

    it('shows typed confirmation phrase input for irreversible tools', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify typed phrase input is present
      expect(screen.getByPlaceholderText(/type.*to confirm/i)).toBeInTheDocument();
    });
  });

  describe('requires_typed_phrase_and_reason', () => {
    it('requires exact typed phrase match before allowing token request', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);
      mockRequestApprovalToken.mockResolvedValue({
        success: true,
        token: mockApprovalToken,
        correlationId: 'corr-approval-123',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select reason code first
      const reasonCodeButton = screen.getByText(/correction/i);
      await user.click(reasonCodeButton);

      // Find "Generate Approval" button - should be disabled without phrase
      const generateButton = screen.getByRole('button', { name: /generate.*approval/i });
      expect(generateButton).toBeDisabled();

      // Type incorrect phrase
      const phraseInput = screen.getByPlaceholderText(/type.*to confirm/i);
      await user.type(phraseInput, 'wrong phrase');

      // Button should still be disabled
      expect(generateButton).toBeDisabled();

      // Clear and type correct phrase
      await user.clear(phraseInput);
      await user.type(phraseInput, 'EXECUTE dais.delete_assessment');

      // Now button should be enabled
      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('requires reason code before allowing approval', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Type correct phrase WITHOUT selecting reason code
      const phraseInput = screen.getByPlaceholderText(/type.*to confirm/i);
      await user.type(phraseInput, 'EXECUTE dais.delete_assessment');

      // Generate button should still be disabled (no reason code)
      const generateButton = screen.getByRole('button', { name: /generate.*approval/i });
      expect(generateButton).toBeDisabled();
    });
  });

  describe('issues_token_only_after_high_friction_confirm', () => {
    it('requests approval token after completing high-friction flow', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);
      mockRequestApprovalToken.mockResolvedValue({
        success: true,
        token: mockApprovalToken,
        correlationId: 'corr-approval-123',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete high-friction flow
      // 1. Select reason code
      await user.click(screen.getByText(/correction/i));

      // 2. Type confirmation phrase
      const phraseInput = screen.getByPlaceholderText(/type.*to confirm/i);
      await user.type(phraseInput, 'EXECUTE dais.delete_assessment');

      // 3. Click Generate Approval
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*approval/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /generate.*approval/i }));

      // Verify token was requested with correct params
      await waitFor(() => {
        expect(mockRequestApprovalToken).toHaveBeenCalledWith({
          toolId: 'dais.delete_assessment',
          params: { assessmentId: 'A-123' },
          reasonCode: 'correction',
        });
      });
    });

    it('enables confirm button after token is received', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);
      mockRequestApprovalToken.mockResolvedValue({
        success: true,
        token: mockApprovalToken,
        correlationId: 'corr-approval-123',
      });
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-invoke-456',
        result: { toolId: 'dais.delete_assessment', output: 'Deleted' },
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onComplete = vi.fn();

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={onComplete}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete high-friction flow
      await user.click(screen.getByText(/correction/i));
      const phraseInput = screen.getByPlaceholderText(/type.*to confirm/i);
      await user.type(phraseInput, 'EXECUTE dais.delete_assessment');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*approval/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /generate.*approval/i }));

      // Wait for token to be received - confirm button should now be enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled();
      });

      // Click confirm
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify invokeTool was called with the approval token
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'dais.delete_assessment',
          params: { assessmentId: 'A-123' },
          confirmation: true,
          reasonCode: 'correction',
          approvalToken: mockApprovalToken.tokenId,
        });
      });

      // Verify completion callback
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('shows token info after generation', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);
      mockRequestApprovalToken.mockResolvedValue({
        success: true,
        token: mockApprovalToken,
        correlationId: 'corr-approval-123',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete flow
      await user.click(screen.getByText(/correction/i));
      await user.type(
        screen.getByPlaceholderText(/type.*to confirm/i),
        'EXECUTE dais.delete_assessment'
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*approval/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /generate.*approval/i }));

      // Token info should be displayed
      await waitFor(() => {
        expect(screen.getByText(/approval.*valid/i)).toBeInTheDocument();
      });
    });
  });

  describe('token_expires_and_flow_rejects', () => {
    it('shows expiration warning and disables execution after token expires', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);

      // Token expires in 10 seconds
      const shortLivedToken = {
        ...mockApprovalToken,
        expiresAt: new Date(Date.now() + 10000).toISOString(),
      };

      mockRequestApprovalToken.mockResolvedValue({
        success: true,
        token: shortLivedToken,
        correlationId: 'corr-approval-123',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete flow and get token
      await user.click(screen.getByText(/correction/i));
      await user.type(
        screen.getByPlaceholderText(/type.*to confirm/i),
        'EXECUTE dais.delete_assessment'
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*approval/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /generate.*approval/i }));

      // Token received, confirm button enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled();
      });

      // Advance time past expiration
      vi.advanceTimersByTime(15000);

      // Confirm button should be disabled again
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
      });

      // Should show expiration message
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });

    it('requires regenerating token after expiration', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);

      const shortLivedToken = {
        ...mockApprovalToken,
        expiresAt: new Date(Date.now() + 5000).toISOString(),
      };

      mockRequestApprovalToken.mockResolvedValue({
        success: true,
        token: shortLivedToken,
        correlationId: 'corr-approval-123',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete flow
      await user.click(screen.getByText(/correction/i));
      await user.type(
        screen.getByPlaceholderText(/type.*to confirm/i),
        'EXECUTE dais.delete_assessment'
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*approval/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /generate.*approval/i }));

      // Advance time past expiration
      vi.advanceTimersByTime(10000);

      // Regenerate button should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
      });
    });
  });

  describe('approval_request_failures', () => {
    it('shows error with correlationId when token request fails', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);
      mockRequestApprovalToken.mockResolvedValue({
        success: false,
        error: 'Rate limited',
        correlationId: 'corr-error-789',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete flow
      await user.click(screen.getByText(/correction/i));
      await user.type(
        screen.getByPlaceholderText(/type.*to confirm/i),
        'EXECUTE dais.delete_assessment'
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*approval/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /generate.*approval/i }));

      // Error should be displayed with correlationId
      await waitFor(() => {
        expect(screen.getByText(/rate limited/i)).toBeInTheDocument();
        expect(screen.getByText(/corr-error-789/i)).toBeInTheDocument();
      });
    });
  });

  describe('invocation_with_invalid_token', () => {
    it('shows error when invocation is rejected due to invalid token', async () => {
      mockValidatePilotTool.mockResolvedValue(mockIrreversibleValidation);
      mockRequestApprovalToken.mockResolvedValue({
        success: true,
        token: mockApprovalToken,
        correlationId: 'corr-approval-123',
      });
      mockInvokeTool.mockResolvedValue({
        success: false,
        correlationId: 'corr-invoke-456',
        error: {
          code: 'APPROVAL_TOKEN_INVALID',
          message: 'Approval token is invalid or expired',
          severity: 'high',
        },
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onComplete = vi.fn();

      render(
        <RiskPolicyGate
          toolId='dais.delete_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={onComplete}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete flow
      await user.click(screen.getByText(/correction/i));
      await user.type(
        screen.getByPlaceholderText(/type.*to confirm/i),
        'EXECUTE dais.delete_assessment'
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*approval/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /generate.*approval/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Error should be displayed with correlationId
      await waitFor(() => {
        expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
        expect(screen.getByText(/corr-invoke-456/i)).toBeInTheDocument();
      });

      // onComplete should NOT be called
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('non_irreversible_tools_unaffected', () => {
    it('write_high tools do not require approval token', async () => {
      mockValidatePilotTool.mockResolvedValue({
        valid: true,
        violations: [],
        tool: {
          toolId: 'dais.approve_assessment',
          suite: 'dais',
          risk: 'write_high',
          requiresConfirmation: true,
          reasonCodes: ['correction', 'appeal'],
          requiresSupervisorApproval: false,
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
        correlationId: 'corr-123',
        result: { toolId: 'dais.approve_assessment', output: 'Approved' },
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <RiskPolicyGate
          toolId='dais.approve_assessment'
          params={{ assessmentId: 'A-123' }}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // No typed phrase input for write_high
      expect(screen.queryByPlaceholderText(/type.*to confirm/i)).not.toBeInTheDocument();

      // No "Generate Approval" button
      expect(screen.queryByRole('button', { name: /generate.*approval/i })).not.toBeInTheDocument();

      // Select reason and confirm directly
      await user.click(screen.getByText(/correction/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // invokeTool should be called WITHOUT approvalToken
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.not.objectContaining({ approvalToken: expect.anything() })
        );
      });

      // requestApprovalToken should NOT be called
      expect(mockRequestApprovalToken).not.toHaveBeenCalled();
    });
  });
});
