import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface GoToLineDialogProps {
  open: boolean;
  onClose: () => void;
  onGoTo: (line: number) => void;
}

export const GoToLineDialog: React.FC<GoToLineDialogProps> = React.memo(
  function GoToLineDialog({ open, onClose, onGoTo }) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (open) {
        setValue('');
        // Focus on next frame after render
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, [open]);

    const handleSubmit = useCallback(() => {
      const line = parseInt(value, 10);
      if (line > 0 && Number.isFinite(line)) {
        onGoTo(line);
        onClose();
      }
    }, [value, onGoTo, onClose]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      },
      [handleSubmit, onClose],
    );

    if (!open) return null;

    return (
      <div className="canon-goto-line" data-testid="canon-goto-line">
        <div className="canon-goto-line__backdrop" onClick={onClose} />
        <div className="canon-goto-line__dialog">
          <label className="canon-goto-line__label">Go to Line</label>
          <input
            ref={inputRef}
            className="canon-goto-line__input"
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Line number"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    );
  },
);
