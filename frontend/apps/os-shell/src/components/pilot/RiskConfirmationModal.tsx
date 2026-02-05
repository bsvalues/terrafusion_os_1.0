/**
 * RiskConfirmationModal.tsx
 *
 * Phase 3: Write-Risk Confirmation Modal
 * Modal UI for confirming write operations based on risk level.
 *
 * Risk Levels:
 * - write_low: Simple confirmation (1-step)
 * - write_high: Confirmation + reason code required
 * - irreversible: Confirmation + reason code + supervisor approval (Phase 4 stub)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Risk } from '../../api/pilotApi';

export interface RiskConfirmationModalProps {
  isOpen: boolean;
  toolId: string;
  toolDescription?: string;
  risk: Risk;
  reasonCodes?: string[];
  requiresReasonCode?: boolean;
  requiresSupervisorApproval?: boolean;
  supervisorRoles?: string[];
  onConfirm: (options?: { reasonCode?: string }) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * RiskConfirmationModal Component
 *
 * Displays confirmation dialog for write-risk tools.
 * Enforces policy requirements before allowing confirmation.
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
  onConfirm,
  onCancel,
}) => {
  const [selectedReasonCode, setSelectedReasonCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

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
    }
  }, [isOpen]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm(selectedReasonCode ? { reasonCode: selectedReasonCode } : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, selectedReasonCode]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isLoading) {
        onCancel();
      }
    },
    [isLoading, onCancel]
  );

  // Validation: Can confirm?
  const canConfirm = (() => {
    if (isLoading) return false;
    if (requiresReasonCode && !selectedReasonCode) return false;
    if (requiresSupervisorApproval) return false; // Phase 4: supervisor workflow
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

          {/* Supervisor Approval Stub (Phase 4) */}
          {requiresSupervisorApproval && (
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
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .confirmation-modal {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            min-width: 400px;
            max-width: 500px;
            max-height: 80vh;
            overflow: auto;
          }

          .confirmation-modal.risk-write-low {
            border-top: 4px solid #3b82f6;
          }

          .confirmation-modal.risk-write-high {
            border-top: 4px solid #f59e0b;
          }

          .confirmation-modal.risk-irreversible {
            border-top: 4px solid #ef4444;
          }

          .modal-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
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
            background: #dbeafe;
            color: #1d4ed8;
          }

          .risk-badge.risk-write-high {
            background: #fef3c7;
            color: #b45309;
          }

          .risk-badge.risk-irreversible {
            background: #fee2e2;
            color: #b91c1c;
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
            background: #f3f4f6;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            margin-bottom: 0.5rem;
          }

          .tool-description {
            margin: 0.5rem 0 0 0;
            color: #6b7280;
          }

          .reason-codes-section {
            margin-top: 1.5rem;
          }

          .section-label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: #374151;
          }

          .section-label .required {
            color: #ef4444;
          }

          .reason-codes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }

          .reason-code-option {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            text-transform: capitalize;
            transition: all 0.15s;
          }

          .reason-code-option:hover {
            border-color: #3b82f6;
            background: #eff6ff;
          }

          .reason-code-option.selected {
            border-color: #3b82f6;
            background: #3b82f6;
            color: white;
          }

          .supervisor-section {
            margin-top: 1.5rem;
          }

          .supervisor-warning {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            background: #fef3c7;
            border-radius: 8px;
            border: 1px solid #fbbf24;
          }

          .warning-icon {
            font-size: 1.5rem;
          }

          .supervisor-warning strong {
            display: block;
            color: #b45309;
            margin-bottom: 0.25rem;
          }

          .supervisor-warning p {
            margin: 0.25rem 0;
            color: #92400e;
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
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
            border-radius: 0 0 12px 12px;
          }

          .btn-cancel {
            padding: 0.625rem 1.25rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            color: #374151;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
          }

          .btn-cancel:hover:not(:disabled) {
            background: #f3f4f6;
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
            background: #3b82f6;
            color: white;
          }

          .btn-confirm.risk-write-low:hover:not(:disabled) {
            background: #2563eb;
          }

          .btn-confirm.risk-write-high {
            background: #f59e0b;
            color: white;
          }

          .btn-confirm.risk-write-high:hover:not(:disabled) {
            background: #d97706;
          }

          .btn-confirm.risk-irreversible {
            background: #ef4444;
            color: white;
          }

          .btn-confirm.risk-irreversible:hover:not(:disabled) {
            background: #dc2626;
          }

          .btn-confirm:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
};
