import React from 'react';
import type { CursorPosition } from './CanonEditor';
import type { ConnectionStatus } from './useCanonConnection';

export interface CanonStatusBarProps {
  cursor: CursorPosition | null;
  language: string;
  fileName: string | null;
  connectionStatus: ConnectionStatus;
  toolCount: number;
  onGoToLine: () => void;
  /** Editor settings indicators */
  wordWrap: boolean;
  minimap: boolean;
  fontSize: number;
  onToggleWordWrap: () => void;
  onToggleMinimap: () => void;
}

const STATUS_ICONS: Record<ConnectionStatus, string> = {
  connecting: '◌',
  connected: '●',
  disconnected: '○',
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnected: 'Disconnected',
};

export const CanonStatusBar: React.FC<CanonStatusBarProps> = React.memo(
  function CanonStatusBar({
    cursor, language, fileName, connectionStatus, toolCount, onGoToLine,
    wordWrap, minimap, fontSize, onToggleWordWrap, onToggleMinimap,
  }) {
    return (
      <footer className="canon-statusbar" data-testid="canon-statusbar">
        <div className="canon-statusbar__left">
          {cursor && (
            <button
              className="canon-statusbar__item canon-statusbar__item--clickable"
              onClick={onGoToLine}
              title="Go to Line (Ctrl+G)"
            >
              Ln {cursor.line}, Col {cursor.column}
            </button>
          )}
          {fileName && (
            <span className="canon-statusbar__item canon-statusbar__item--language">
              {language}
            </span>
          )}
          <span className="canon-statusbar__item">UTF-8</span>
        </div>
        <div className="canon-statusbar__right">
          <button
            className="canon-statusbar__item canon-statusbar__item--clickable"
            onClick={onToggleWordWrap}
            title={wordWrap ? 'Word Wrap: On' : 'Word Wrap: Off'}
          >
            Wrap: {wordWrap ? 'On' : 'Off'}
          </button>
          <button
            className="canon-statusbar__item canon-statusbar__item--clickable"
            onClick={onToggleMinimap}
            title={minimap ? 'Minimap: On' : 'Minimap: Off'}
          >
            Minimap: {minimap ? 'On' : 'Off'}
          </button>
          <span className="canon-statusbar__item">
            {fontSize}px
          </span>
          <span className="canon-statusbar__item">
            {toolCount} tools
          </span>
          <span
            className={`canon-statusbar__item canon-statusbar__status canon-statusbar__status--${connectionStatus}`}
            title={STATUS_LABELS[connectionStatus]}
          >
            <span className="canon-statusbar__status-dot">{STATUS_ICONS[connectionStatus]}</span>
            {STATUS_LABELS[connectionStatus]}
          </span>
        </div>
      </footer>
    );
  },
);
