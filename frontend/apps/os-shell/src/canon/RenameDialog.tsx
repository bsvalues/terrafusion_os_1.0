/**
 * RenameDialog — modal prompt for renaming/moving a file in TerraCanon IDE.
 *
 * Pre-fills the input with the current file path. Validates non-empty and
 * rejects ".." path traversal. Enter to confirm, Escape to cancel.
 *
 * @see Phase M: Rename/Move File
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface RenameDialogProps {
  open: boolean;
  currentPath: string;
  onClose: () => void;
  onRename: (newPath: string) => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = React.memo(
  function RenameDialog({ open, currentPath, onClose, onRename }) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (open) {
        setValue(currentPath);
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (!el) return;
          el.focus();
          // Select just the filename portion
          const lastSlash = currentPath.lastIndexOf('/');
          const lastDot = currentPath.lastIndexOf('.');
          const selStart = lastSlash >= 0 ? lastSlash + 1 : 0;
          const selEnd = lastDot > selStart ? lastDot : currentPath.length;
          el.setSelectionRange(selStart, selEnd);
        });
      }
    }, [open, currentPath]);

    const handleSubmit = useCallback(() => {
      const trimmed = value.trim();
      if (!trimmed || trimmed.includes('..')) return;
      if (trimmed === currentPath) {
        onClose();
        return;
      }
      onRename(trimmed);
    }, [value, currentPath, onClose, onRename]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      },
      [onClose, handleSubmit],
    );

    if (!open) return null;

    const isValid = value.trim().length > 0 && !value.includes('..');
    const isUnchanged = value.trim() === currentPath;

    return (
      <div className="canon-rename" data-testid="canon-rename-dialog" onKeyDown={handleKeyDown}>
        <div className="canon-rename__backdrop" onClick={onClose} />
        <div className="canon-rename__dialog">
          <label className="canon-rename__label" htmlFor="canon-rename-input">
            Rename / Move File
          </label>
          <input
            ref={inputRef}
            id="canon-rename-input"
            className="canon-rename__input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <div className="canon-rename__hint">
            Enter new path relative to repo root. Must be within an allowed prefix.
          </div>
          <div className="canon-rename__actions">
            <button className="canon-rename__btn canon-rename__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="canon-rename__btn canon-rename__btn--rename"
              disabled={!isValid || isUnchanged}
              onClick={handleSubmit}
            >
              Rename
            </button>
          </div>
        </div>
      </div>
    );
  },
);
