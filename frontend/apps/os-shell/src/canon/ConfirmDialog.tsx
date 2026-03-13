import React, { useCallback, useRef, useEffect } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = React.memo(
  function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
  }) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (open) {
        requestAnimationFrame(() => confirmRef.current?.focus());
      }
    }, [open]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        }
      },
      [onConfirm, onCancel],
    );

    if (!open) return null;

    return (
      <div className="canon-confirm" data-testid="canon-confirm-dialog" onKeyDown={handleKeyDown}>
        <div className="canon-confirm__backdrop" onClick={onCancel} />
        <div className="canon-confirm__dialog">
          <div className="canon-confirm__title">{title}</div>
          <div className="canon-confirm__message">{message}</div>
          <div className="canon-confirm__actions">
            <button
              className="canon-confirm__btn canon-confirm__btn--cancel"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              className={`canon-confirm__btn canon-confirm__btn--confirm ${variant === 'danger' ? 'canon-confirm__btn--danger' : ''}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  },
);
