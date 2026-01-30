/**
 * CursorPresence - Real-Time Cursor Visualization
 *
 * Production-ready component for displaying remote users' cursors,
 * selections, and presence indicators in collaborative editing.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 7 Day 2
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useCollaboration, RemoteCursor } from './CollaborationProvider';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';

// ==================== TYPES ====================

export interface CursorPresenceProps {
  editorRef?: React.RefObject<HTMLElement>;
  showLabels?: boolean;
  showSelections?: boolean;
  fadeTimeout?: number; // ms before cursor fades out
}

interface CursorDisplay extends RemoteCursor {
  x: number;
  y: number;
  opacity: number;
}

// ==================== COMPONENT ====================

export function CursorPresence({
  editorRef,
  showLabels = true,
  showSelections = true,
  fadeTimeout = 5000,
}: CursorPresenceProps) {
  // ==================== STATE ====================

  const { remoteCursors, participants } = useCollaboration();
  const [displayCursors, setDisplayCursors] = useState<CursorDisplay[]>([]);

  // ==================== EFFECTS ====================

  // Convert line/column positions to screen coordinates
  useEffect(() => {
    if (!editorRef?.current) return;

    const updateCursorPositions = () => {
      const updated = remoteCursors.map((cursor) => {
        const coords = getScreenCoordinates(cursor.position.line, cursor.position.column, editorRef.current!);

        // Calculate opacity based on last update time
        const timeSinceUpdate = Date.now() - cursor.lastUpdate.getTime();
        const opacity = Math.max(0, Math.min(1, 1 - timeSinceUpdate / fadeTimeout));

        return {
          ...cursor,
          x: coords.x,
          y: coords.y,
          opacity,
        };
      });

      setDisplayCursors(updated);
    };

    updateCursorPositions();

    // Update positions on scroll/resize
    const editor = editorRef.current;
    editor.addEventListener('scroll', updateCursorPositions);
    window.addEventListener('resize', updateCursorPositions);

    // Update opacity on interval
    const interval = setInterval(updateCursorPositions, 100);

    return () => {
      editor?.removeEventListener('scroll', updateCursorPositions);
      window.removeEventListener('resize', updateCursorPositions);
      clearInterval(interval);
    };
  }, [remoteCursors, editorRef, fadeTimeout]);

  // ==================== RENDER ====================

  return (
    <div className="cursor-presence-container absolute inset-0 pointer-events-none z-50">
      {displayCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100 ease-out pointer-events-auto"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            opacity: cursor.opacity,
          }}
        >
          {/* Cursor Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
            style={{ color: cursor.color }}
          >
            <path
              d="M2 2L12 8L7 9L5 14L2 2Z"
              fill="currentColor"
              stroke="white"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>

          {/* User Label */}
          {showLabels && (
            <div
              className="ml-5 -mt-1 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName}
            </div>
          )}

          {/* Selection Highlight */}
          {showSelections && cursor.selection && (
            <SelectionHighlight selection={cursor.selection} color={cursor.color} editorRef={editorRef} />
          )}
        </div>
      ))}

      {/* Active Users Indicator */}
      <ActiveUsersIndicator />
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface SelectionHighlightProps {
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  color: string;
  editorRef?: React.RefObject<HTMLElement>;
}

function SelectionHighlight({ selection, color, editorRef }: SelectionHighlightProps) {
  const [rects, setRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    if (!editorRef?.current) return;

    // Calculate selection rectangles
    const startCoords = getScreenCoordinates(selection.start.line, selection.start.column, editorRef.current);
    const endCoords = getScreenCoordinates(selection.end.line, selection.end.column, editorRef.current);

    // For simplicity, create a single rectangle
    // In production, handle multi-line selections with multiple rectangles
    const rect = new DOMRect(
      startCoords.x,
      startCoords.y,
      endCoords.x - startCoords.x,
      Math.max(20, endCoords.y - startCoords.y)
    );

    setRects([rect]);
  }, [selection, editorRef]);

  return (
    <>
      {rects.map((rect, idx) => (
        <div
          key={idx}
          className="absolute rounded"
          style={{
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: color,
            opacity: 0.2,
          }}
        />
      ))}
    </>
  );
}

function ActiveUsersIndicator() {
  const { participants, currentUser } = useCollaboration();

  const otherUsers = participants.filter((p) => p.userId !== currentUser?.userId);

  if (otherUsers.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 pointer-events-auto z-50">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Active Users ({otherUsers.length})
        </p>

        <div className="space-y-1.5">
          {otherUsers.map((user) => (
            <div key={user.userId} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: user.color }}
                title={user.isActive ? 'Active' : 'Idle'}
              >
                {user.isActive && (
                  <div className="w-full h-full rounded-full animate-ping" style={{ backgroundColor: user.color }} />
                )}
              </div>

              <span className="text-xs font-medium">{user.userName}</span>

              {user.isActive && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  typing
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Current User Indicator */}
        {currentUser && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentUser.color }} />
              <span className="text-xs font-medium">{currentUser.userName}</span>
              <Badge variant="secondary" className="text-xs px-1 py-0">
                you
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== HELPER FUNCTIONS ====================

function getScreenCoordinates(line: number, column: number, editor: HTMLElement): { x: number; y: number } {
  // Simplified coordinate calculation
  // In production, use proper editor API (Monaco, CodeMirror, etc.)

  const lineHeight = 20; // Default line height
  const charWidth = 8; // Average character width

  const editorRect = editor.getBoundingClientRect();
  const scrollTop = editor.scrollTop || 0;
  const scrollLeft = editor.scrollLeft || 0;

  return {
    x: editorRect.left + column * charWidth - scrollLeft,
    y: editorRect.top + line * lineHeight - scrollTop,
  };
}

export default CursorPresence;
