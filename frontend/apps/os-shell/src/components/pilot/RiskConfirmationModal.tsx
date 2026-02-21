/**
 * RiskConfirmationModal.tsx
 *
 * Phase 3 + Phase 4: Write-Risk Confirmation Modal
 * Modal UI for confirming write operations based on risk level.
 *
 * Risk Levels:
 * - write_low: Simple confirmation (1-step)
 * - write_high: Confirmation + reason code required
 * - irreversible: Confirmation + reason code + approval token (Phase 4)
 *
 * Phase 4 Solo Override:
 * - High-friction typed phrase confirmation
 * - Short-lived approval token generation
 * - Token expiration tracking and renewal
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ApprovalToken, Risk } from '../../api/pilotApi';

export interface RiskConfirmationModalProps {
  isOpen: boolean;
  toolId: string;
  toolDescription?: string;
  risk: Risk;
  reasonCodes?: string[];
  requiresReasonCode?: boolean;
  requiresSupervisorApproval?: boolean;
  supervisorRoles?: string[];
  /** Phase 4: Approval token state for irreversible tools */
  approvalToken?: ApprovalToken | null;
  approvalTokenError?: string;
  approvalTokenCorrelationId?: string;
  isGeneratingToken?: boolean;
  onRequestApprovalToken?: (reasonCode: string) => Promise<void>;
  onConfirm: (options?: { reasonCode?: string; approvalToken?: string }) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * RiskConfirmationModal Component
 *
 * Displays confirmation dialog for write-risk tools.
 * Enforces policy requirements before allowing confirmation.
 * Phase 4: Implements approval token flow for irreversible tools.
 */
export const RiskConfirmationModal: React.FC<RiskConfirmationModalProps> = ({
  isOpen,
  toolId,
  toolDescription,
  risk,
  reasonCodes,
  requiresReasonCode = false,
  requiresSupervisorApproval = false,
  supervisorRoles,
  approvalToken,
  approvalTokenError,
  approvalTokenCorrelationId,
  isGeneratingToken = false,
  onRequestApprovalToken,
  onConfirm,
  onCancel,
}) => {
  const [selectedReasonCode, setSelectedReasonCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const expirationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Expected confirmation phrase for irreversible tools
  const expectedPhrase = `EXECUTE ${toolId}`;
  const isPhraseValid = typedPhrase === expectedPhrase;
  const isIrreversible = risk === 'irreversible';

  // Focus management
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReasonCode(null);
      setIsLoading(false);
      setTypedPhrase('');
      setTokenExpired(false);
      setTimeRemaining(null);
    }
  }, [isOpen]);

  // Token expiration tracking
  useEffect(() => {
    if (expirationTimerRef.current) {
      clearInterval(expirationTimerRef.current);
      expirationTimerRef.current = null;
    }

    if (approvalToken?.expiresAt) {
      const checkExpiration = () => {
        const expiresAt = new Date(approvalToken.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

        setTimeRemaining(remaining);
        if (remaining === 0) {
          setTokenExpired(true);
          if (expirationTimerRef.current) {
            clearInterval(expirationTimerRef.current);
          }
        }
      };

      checkExpiration();
      expirationTimerRef.current = setInterval(checkExpiration, 1000);
    }

    return () => {
      if (expirationTimerRef.current) {
        clearInterval(expirationTimerRef.current);
      }
    };
  }, [approvalToken?.expiresAt]);

  // Reset token state when token changes
  useEffect(() => {
    if (approvalToken) {
      setTokenExpired(false);
    }
  }, [approvalToken]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: { reasonCode?: string; approvalToken?: string } = {};
      if (selectedReasonCode) {
        options.reasonCode = selectedReasonCode;
      }
      if (approvalToken?.tokenId) {
        options.approvalToken = approvalToken.tokenId;
      }
      await onConfirm(options);
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, selectedReasonCode, approvalToken]);

  const handleGenerateApproval = useCallback(async () => {
    if (selectedReasonCode && onRequestApprovalToken) {
      await onRequestApprovalToken(selectedReasonCode);
    }
  }, [selectedReasonCode, onRequestApprovalToken]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isLoading) {
        onCancel();
      }
    },
    [isLoading, onCancel]
  );

  // Validation: Can generate approval token?
  const canGenerateApproval = (() => {
    if (!isIrreversible) return false;
    if (isGeneratingToken) return false;
    if (!selectedReasonCode) return false;
    if (!isPhraseValid) return false;
    return true;
  })();

  // Validation: Can confirm?
  const canConfirm = (() => {
    if (isLoading) return false;
    if (requiresReasonCode && !selectedReasonCode) return false;

    // Phase 4: Irreversible tools require valid approval token
    if (isIrreversible) {
      if (!approvalToken) return false;
      if (tokenExpired) return false;
      // Also check if timeRemaining indicates expiration (for test timer scenarios)
      if (timeRemaining !== null && timeRemaining <= 0) return false;
      return true;
    }

    // Phase 3 stub: non-irreversible supervisor approval still blocked
    if (requiresSupervisorApproval && !isIrreversible) return false;

    return true;
  })();

  // Risk level styling
  const getRiskClassName = () => {
    switch (risk) {
      case 'write_low':
        return 'risk-write-low';
      case 'write_high':
        return 'risk-write-high';
      case 'irreversible':
        return 'risk-irreversible';
      default:
        return '';
    }
  };

  const getRiskIcon = () => {
    switch (risk) {
      case 'write_low':
        return '⚠️';
      case 'write_high':
        return '🔶';
      case 'irreversible':
        return '🛑';
      default:
        return 'ℹ️';
    }
  };

  if (!isOpen) return null;

  return (
    <div className='modal-backdrop' data-testid='modal-backdrop' onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        role='dialog'
        aria-labelledby='modal-title'
        aria-modal='true'
        className={`confirmation-modal ${getRiskClassName()}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isLoading) {
            onCancel();
          }
        }}
      >
        <div className='modal-header'>
          <span className='risk-icon'>{getRiskIcon()}</span>
          <h2 id='modal-title'>Confirm Tool Execution</h2>
          <span className={`risk-badge ${getRiskClassName()}`}>{risk}</span>
        </div>

        <div className='modal-body'>
          <div className='tool-info'>
            <code className='tool-id'>{toolId}</code>
            {toolDescription && <p className='tool-description'>{toolDescription}</p>}
          </div>

          {/* Reason Code Selection */}
          {reasonCodes && reasonCodes.length > 0 && (
            <div className='reason-codes-section'>
              <label className='section-label'>
                Reason Code {requiresReasonCode && <span className='required'>*</span>}
              </label>
              <div className='reason-codes-grid'>
                {reasonCodes.map((code) => (
                  <button
                    key={code}
                    type='button'
                    className={`reason-code-option ${selectedReasonCode === code ? 'selected' : ''}`}
                    onClick={() => setSelectedReasonCode(code)}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phase 4: Irreversible Tools - High Friction Approval Flow */}
          {isIrreversible && (
            <div className='approval-section'>
              <div className='approval-header'>
                <span className='warning-icon'>🔐</span>
                <strong>Approval Required</strong>
              </div>

              {/* Typed phrase input */}
              <div className='typed-phrase-section'>
                <label className='section-label'>
                  Type <code>{expectedPhrase}</code> to confirm
                </label>
                <input
                  type='text'
                  className={`phrase-input ${isPhraseValid ? 'valid' : ''}`}
                  placeholder={`Type "${expectedPhrase}" to confirm`}
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  disabled={isLoading || isGeneratingToken}
                />
              </div>

              {/* Generate Approval Token button */}
              {!approvalToken && !tokenExpired && (
                <button
                  type='button'
                  className='btn-generate-approval'
                  onClick={handleGenerateApproval}
                  disabled={!canGenerateApproval}
                >
                  {isGeneratingToken ? 'Generating...' : 'Generate Approval'}
                </button>
              )}

              {/* Token Error */}
              {approvalTokenError && (
                <div className='token-error'>
                  <span className='error-icon'>⚠️</span>
                  <div>
                    <p>{approvalTokenError}</p>
                    {approvalTokenCorrelationId && (
                      <code className='correlation-id'>{approvalTokenCorrelationId}</code>
                    )}
                  </div>
                </div>
              )}

              {/* Token status / expiration */}
              {approvalToken && !tokenExpired && timeRemaining !== null && timeRemaining > 0 && (
                <div className='token-status valid'>
                  <span className='status-icon'>✅</span>
                  <div>
                    <p>Approval valid for {timeRemaining}s</p>
                    <small>Token: {approvalToken.tokenId.substring(0, 16)}...</small>
                  </div>
                </div>
              )}

              {/* Token expired */}
              {(tokenExpired ||
                (approvalToken && timeRemaining !== null && timeRemaining <= 0)) && (
                <div className='token-status expired'>
                  <span className='status-icon'>⏰</span>
                  <div>
                    <p>Approval expired</p>
                    <button
                      type='button'
                      className='btn-regenerate'
                      onClick={handleGenerateApproval}
                      disabled={!canGenerateApproval}
                    >
                      {isGeneratingToken ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legacy Supervisor Approval Stub (non-irreversible) */}
          {requiresSupervisorApproval && !isIrreversible && (
            <div className='supervisor-section'>
              <div className='supervisor-warning'>
                <span className='warning-icon'>🔐</span>
                <div>
                  <strong>Supervisor Approval Required</strong>
                  <p>
                    This action requires approval from:{' '}
                    {supervisorRoles?.join(', ') || 'supervisor'}
                  </p>
                  <p className='phase-stub'>Approval workflow coming in Phase 4</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='modal-footer'>
          <button
            ref={cancelButtonRef}
            type='button'
            className='btn-cancel'
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type='button'
            className={`btn-confirm ${getRiskClassName()}`}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isLoading ? 'Confirming...' : 'Confirm'}
          </button>
        </div>

        <style>{`
          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: hsl(var(--tf-black) / 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .confirmation-modal {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px hsl(var(--tf-black) / 0.2);
            min-width: 400px;
            max-width: 500px;
            max-height: 80vh;
            overflow: auto;
          }

          .confirmation-modal.risk-write-low {
            border-top: 4px solid hsl(var(--tf-brand-blue));
          }

          .confirmation-modal.risk-write-high {
            border-top: 4px solid hsl(var(--tf-amber-hs) 50%);
          }

          .confirmation-modal.risk-irreversible {
            border-top: 4px solid hsl(var(--tf-red-hs) 60%);
          }

          .modal-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid hsl(var(--tf-light-border));
          }

          .risk-icon {
            font-size: 1.5rem;
          }

          .modal-header h2 {
            flex: 1;
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .risk-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }

          .risk-badge.risk-write-low {
            background: hsl(var(--tf-blue-hs) 93%);
            color: hsl(var(--tf-brand-blue-dark));
          }

          .risk-badge.risk-write-high {
            background: hsl(var(--tf-amber-hs) 89%);
            color: hsl(var(--tf-amber-hs) 37%);
          }

          .risk-badge.risk-irreversible {
            background: hsl(var(--tf-red-hs) 94%);
            color: hsl(var(--tf-red-hs) 42%);
          }

          .modal-body {
            padding: 1.5rem;
          }

          .tool-info {
            margin-bottom: 1.5rem;
          }

          .tool-id {
            display: block;
            font-size: 1rem;
            font-family: monospace;
            background: hsl(var(--tf-slate-100));
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            margin-bottom: 0.5rem;
          }

          .tool-description {
            margin: 0.5rem 0 0 0;
            color: hsl(var(--tf-light-muted));
          }

          .reason-codes-section {
            margin-top: 1.5rem;
          }

          .section-label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: hsl(var(--tf-slate-700));
          }

          .section-label .required {
            color: hsl(var(--tf-red-hs) 60%);
          }

          .reason-codes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }

          .reason-code-option {
            padding: 0.75rem;
            border: 2px solid hsl(var(--tf-light-border));
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            text-transform: capitalize;
            transition: all 0.15s;
          }

          .reason-code-option:hover {
            border-color: hsl(var(--tf-brand-blue));
            background: hsl(var(--tf-blue-hs) 97%);
          }

          .reason-code-option.selected {
            border-color: hsl(var(--tf-brand-blue));
            background: hsl(var(--tf-brand-blue));
            color: white;
          }

          .supervisor-section {
            margin-top: 1.5rem;
          }

          .supervisor-warning {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            background: hsl(var(--tf-amber-hs) 89%);
            border-radius: 8px;
            border: 1px solid hsl(var(--tf-amber-hs) 56%);
          }

          .warning-icon {
            font-size: 1.5rem;
          }

          .supervisor-warning strong {
            display: block;
            color: hsl(var(--tf-amber-hs) 37%);
            margin-bottom: 0.25rem;
          }

          .supervisor-warning p {
            margin: 0.25rem 0;
            color: hsl(var(--tf-amber-hs) 31%);
            font-size: 0.875rem;
          }

          .phase-stub {
            font-style: italic;
            opacity: 0.7;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            border-top: 1px solid hsl(var(--tf-light-border));
            background: hsl(var(--tf-light-surface));
            border-radius: 0 0 12px 12px;
          }

          .btn-cancel {
            padding: 0.625rem 1.25rem;
            border: 1px solid hsl(var(--tf-slate-300));
            border-radius: 6px;
            background: white;
            color: hsl(var(--tf-slate-700));
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
          }

          .btn-cancel:hover:not(:disabled) {
            background: hsl(var(--tf-slate-100));
          }

          .btn-cancel:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-confirm {
            padding: 0.625rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
          }

          .btn-confirm.risk-write-low {
            background: hsl(var(--tf-brand-blue));
            color: white;
          }

          .btn-confirm.risk-write-low:hover:not(:disabled) {
            background: hsl(var(--tf-blue-hs) 53%);
          }

          .btn-confirm.risk-write-high {
            background: hsl(var(--tf-amber-hs) 50%);
            color: white;
          }

          .btn-confirm.risk-write-high:hover:not(:disabled) {
            background: hsl(var(--tf-amber-hs) 44%);
          }

          .btn-confirm.risk-irreversible {
            background: hsl(var(--tf-red-hs) 60%);
            color: white;
          }

          .btn-confirm.risk-irreversible:hover:not(:disabled) {
            background: hsl(var(--tf-red-hs) 51%);
          }

          .btn-confirm:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          /* Phase 4: Approval Token Styles */
          .approval-section {
            margin-top: 1.5rem;
            padding: 1rem;
            background: hsl(var(--tf-red-hs) 97%);
            border: 1px solid hsl(var(--tf-red-hs) 89%);
            border-radius: 8px;
          }

          .approval-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .approval-header strong {
            color: hsl(var(--tf-red-hs) 42%);
          }

          .typed-phrase-section {
            margin-bottom: 1rem;
          }

          .typed-phrase-section code {
            background: hsl(var(--tf-red-hs) 89%);
            padding: 0.125rem 0.375rem;
            border-radius: 4px;
            font-size: 0.875rem;
            color: hsl(var(--tf-red-hs) 35%);
          }

          .phrase-input {
            width: 100%;
            margin-top: 0.5rem;
            padding: 0.75rem;
            border: 2px solid hsl(var(--tf-red-hs) 82%);
            border-radius: 6px;
            font-family: monospace;
            font-size: 0.875rem;
          }

          .phrase-input:focus {
            outline: none;
            border-color: hsl(var(--tf-red-hs) 60%);
            box-shadow: 0 0 0 3px hsl(var(--tf-red-hs) 60% / 0.2);
          }

          .phrase-input.valid {
            border-color: hsl(var(--tf-green-hs) 45%);
            background: hsl(var(--tf-green-hs) 97%);
          }

          .btn-generate-approval {
            width: 100%;
            padding: 0.75rem 1rem;
            background: hsl(var(--tf-red-hs) 51%);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
          }

          .btn-generate-approval:hover:not(:disabled) {
            background: hsl(var(--tf-red-hs) 42%);
          }

          .btn-generate-approval:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .token-error {
            display: flex;
            gap: 0.5rem;
            padding: 0.75rem;
            background: hsl(var(--tf-amber-hs) 89%);
            border: 1px solid hsl(var(--tf-amber-hs) 56%);
            border-radius: 6px;
            margin-top: 0.75rem;
          }

          .token-error .error-icon {
            font-size: 1rem;
          }

          .token-error p {
            margin: 0;
            color: hsl(var(--tf-amber-hs) 31%);
            font-size: 0.875rem;
          }

          .token-error .correlation-id {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.75rem;
            color: hsl(var(--tf-amber-hs) 37%);
            background: hsl(var(--tf-amber-hs) 88%);
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
          }

          .token-status {
            display: flex;
            gap: 0.5rem;
            padding: 0.75rem;
            border-radius: 6px;
            margin-top: 0.75rem;
          }

          .token-status.valid {
            background: hsl(var(--tf-green-hs) 93%);
            border: 1px solid hsl(var(--tf-green-hs) 45%);
          }

          .token-status.expired {
            background: hsl(var(--tf-amber-hs) 89%);
            border: 1px solid hsl(var(--tf-amber-hs) 50%);
          }

          .token-status .status-icon {
            font-size: 1rem;
          }

          .token-status p {
            margin: 0;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .token-status.valid p {
            color: hsl(var(--tf-green-hs) 29%);
          }

          .token-status.expired p {
            color: hsl(var(--tf-amber-hs) 37%);
          }

          .token-status small {
            display: block;
            font-size: 0.75rem;
            color: hsl(var(--tf-light-muted));
            font-family: monospace;
          }

          .btn-regenerate {
            margin-top: 0.5rem;
            padding: 0.5rem 1rem;
            background: hsl(var(--tf-amber-hs) 50%);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            font-size: 0.875rem;
          }

          .btn-regenerate:hover:not(:disabled) {
            background: hsl(var(--tf-amber-hs) 44%);
          }

          .btn-regenerate:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }        `}</style>
      </div>
    </div>
  );
};
