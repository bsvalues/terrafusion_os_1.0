import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface NewFileDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (filePath: string) => void;
}

export const NewFileDialog: React.FC<NewFileDialogProps> = React.memo(
  function NewFileDialog({ open, onClose, onCreate }) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (open) {
        setValue('');
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, [open]);

    const handleSubmit = useCallback(() => {
      const trimmed = value.trim();
      if (trimmed.length > 0 && !trimmed.includes('..')) {
        onCreate(trimmed);
        onClose();
      }
    }, [value, onCreate, onClose]);

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
      <div className="canon-new-file" data-testid="canon-new-file-dialog">
        <div className="canon-new-file__backdrop" onClick={onClose} />
        <div className="canon-new-file__dialog">
          <label className="canon-new-file__label">New File Path</label>
          <input
            ref={inputRef}
            className="canon-new-file__input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. frontend/apps/os-shell/src/canon/MyComponent.tsx"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="canon-new-file__hint">
            Path must be within an allowed prefix. File must not already exist.
          </div>
          <div className="canon-new-file__actions">
            <button className="canon-new-file__btn canon-new-file__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="canon-new-file__btn canon-new-file__btn--create"
              onClick={handleSubmit}
              disabled={value.trim().length === 0}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  },
);
