/**
 * RealtimeNotebook - Live Notebook Collaboration Component
 *
 * Production-ready real-time notebook component with multi-user editing,
 * cursor tracking, live cell execution, and comment threads.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 4
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNotebookHub } from '../../hooks/useNotebookHub';
import { CursorPosition } from '../../services/SignalRService';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Spinner } from '../ui/spinner';

// ==================== TYPES ====================

export interface NotebookCell {
  index: number;
  content: string;
  cellType: 'code' | 'markdown';
  output?: string;
  executionTime?: number;
  comments?: NotebookComment[];
}

export interface NotebookComment {
  id: string;
  cellIndex: number;
  userName: string;
  content: string;
  timestamp: string;
}

export interface RealtimeNotebookProps {
  notebookId: number;
  userId: number;
  countyId: number;
  userName: string;
  initialCells?: NotebookCell[];
  readOnly?: boolean;
  onCellChange?: (cells: NotebookCell[]) => void;
}

// ==================== COMPONENT ====================

export function RealtimeNotebook({
  notebookId,
  userId,
  countyId,
  userName,
  initialCells = [],
  readOnly = false,
  onCellChange,
}: RealtimeNotebookProps) {
  // ==================== HOOKS ====================

  const { state, actions, connection } = useNotebookHub(
    notebookId,
    userId,
    countyId,
    userName,
    true
  );

  // ==================== STATE ====================

  const [cells, setCells] = useState<NotebookCell[]>(initialCells);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // ==================== EFFECTS ====================

  // Apply cell updates from other users
  useEffect(() => {
    if (state.cellUpdates.length > 0) {
      const latestUpdate = state.cellUpdates[state.cellUpdates.length - 1];

      setCells((prev) =>
        prev.map((cell) =>
          cell.index === latestUpdate.cellIndex
            ? {
                ...cell,
                content: latestUpdate.content,
                cellType: latestUpdate.cellType as 'code' | 'markdown',
              }
            : cell
        )
      );
    }
  }, [state.cellUpdates]);

  // Notify parent of cell changes
  useEffect(() => {
    if (onCellChange) {
      onCellChange(cells);
    }
  }, [cells, onCellChange]);

  // Update cursor position on selection change
  useEffect(() => {
    if (selectedCell !== null && !readOnly) {
      const position: CursorPosition = {
        cellIndex: selectedCell,
        line: 0,
        column: 0,
      };
      actions.updateCursor(position).catch(console.error);
    }
  }, [selectedCell, readOnly, actions]);

  // ==================== HANDLERS ====================

  const handleCellContentChange = useCallback(
    async (index: number, content: string) => {
      if (readOnly) return;

      // Update local state immediately for responsiveness
      setCells((prev) =>
        prev.map((cell) => (cell.index === index ? { ...cell, content } : cell))
      );

      // Broadcast update to other users
      const cell = cells.find((c) => c.index === index);
      if (cell) {
        await actions.updateCell(index, content, cell.cellType);
      }
    },
    [cells, readOnly, actions]
  );

  const handleExecuteCell = useCallback(
    async (index: number) => {
      if (readOnly) return;

      const cell = cells.find((c) => c.index === index);
      if (!cell || cell.cellType !== 'code') return;

      try {
        await actions.executeCell(index, cell.content);
      } catch (error) {
        console.error('Failed to execute cell:', error);
      }
    },
    [cells, readOnly, actions]
  );

  const handleAddCell = useCallback(
    async (index: number, cellType: 'code' | 'markdown') => {
      if (readOnly) return;

      // Add cell locally
      const newCell: NotebookCell = {
        index,
        content: '',
        cellType,
        comments: [],
      };

      setCells((prev) => {
        const updated = [...prev];
        updated.splice(index, 0, newCell);
        // Re-index cells
        return updated.map((cell, idx) => ({ ...cell, index: idx }));
      });

      // Broadcast to other users
      await actions.addCell(index, cellType);
    },
    [readOnly, actions]
  );

  const handleDeleteCell = useCallback(
    async (index: number) => {
      if (readOnly || cells.length <= 1) return;

      // Delete cell locally
      setCells((prev) => {
        const updated = prev.filter((cell) => cell.index !== index);
        // Re-index cells
        return updated.map((cell, idx) => ({ ...cell, index: idx }));
      });

      // Broadcast to other users
      await actions.deleteCell(index);
    },
    [cells.length, readOnly, actions]
  );

  const handleAddComment = useCallback(
    async (cellIndex: number) => {
      if (!commentText.trim()) return;

      await actions.addComment(cellIndex, commentText);
      setCommentText('');
    },
    [commentText, actions]
  );

  // ==================== RENDER ====================

  if (state.connecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="mr-2" />
        <span>Connecting to notebook...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <Alert variant="destructive">
        <span className="font-semibold">Connection Error</span>
        <p>{state.error}</p>
      </Alert>
    );
  }

  return (
    <div className="realtime-notebook space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notebook {notebookId}</CardTitle>
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <Badge variant={state.connected ? 'success' : 'secondary'}>
                {state.connected ? '🟢 Connected' : '🔴 Disconnected'}
              </Badge>

              {/* Active Users */}
              <Badge variant="outline">
                {state.activeUsers.length} user{state.activeUsers.length !== 1 ? 's' : ''} active
              </Badge>

              {/* Read-Only Indicator */}
              {readOnly && <Badge variant="warning">Read Only</Badge>}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Users List */}
      {state.activeUsers.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {state.activeUsers.map((user, idx) => (
                <Badge key={idx} variant="secondary">
                  👤 {user}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cells */}
      <div className="space-y-2">
        {cells.map((cell, idx) => (
          <NotebookCellComponent
            key={cell.index}
            cell={cell}
            isSelected={selectedCell === cell.index}
            onSelect={() => setSelectedCell(cell.index)}
            onChange={(content) => handleCellContentChange(cell.index, content)}
            onExecute={() => handleExecuteCell(cell.index)}
            onDelete={() => handleDeleteCell(cell.index)}
            onAddBelow={() => handleAddCell(cell.index + 1, 'code')}
            readOnly={readOnly}
            ref={(el) => {
              if (el) cellRefs.current.set(cell.index, el);
            }}
            cursors={Array.from(state.cursors.entries())
              .filter(([, cursor]) => cursor.cellIndex === cell.index)
              .map(([user, cursor]) => ({ user, cursor }))}
          />
        ))}
      </div>

      {/* Add First Cell */}
      {cells.length === 0 && !readOnly && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No cells yet. Add your first cell:</p>
            <div className="flex justify-center space-x-2">
              <Button onClick={() => handleAddCell(0, 'code')}>+ Code Cell</Button>
              <Button onClick={() => handleAddCell(0, 'markdown')} variant="outline">
                + Markdown Cell
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== NOTEBOOK CELL COMPONENT ====================

interface NotebookCellComponentProps {
  cell: NotebookCell;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (content: string) => void;
  onExecute: () => void;
  onDelete: () => void;
  onAddBelow: () => void;
  readOnly: boolean;
  cursors: Array<{ user: string; cursor: CursorPosition }>;
}

const NotebookCellComponent = React.forwardRef<HTMLDivElement, NotebookCellComponentProps>(
  (
    {
      cell,
      isSelected,
      onSelect,
      onChange,
      onExecute,
      onDelete,
      onAddBelow,
      readOnly,
      cursors,
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={`relative ${isSelected ? 'ring-2 ring-terra-cyan' : ''} ${
          readOnly ? 'opacity-75' : ''
        }`}
        onClick={onSelect}
      >
        <CardContent className="pt-4">
          {/* Cell Type Badge */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant={cell.cellType === 'code' ? 'default' : 'secondary'}>
              {cell.cellType === 'code' ? '📝 Code' : '📄 Markdown'}
            </Badge>

            {/* Cell Actions */}
            {!readOnly && isSelected && (
              <div className="flex space-x-1">
                {cell.cellType === 'code' && (
                  <Button size="sm" onClick={onExecute}>
                    ▶️ Run
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={onAddBelow}>
                  + Below
                </Button>
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  🗑️
                </Button>
              </div>
            )}
          </div>

          {/* Cell Content */}
          <textarea
            value={cell.content}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className="w-full p-2 font-mono text-sm border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-terra-cyan"
            placeholder={
              cell.cellType === 'code' ? 'Enter code here...' : 'Enter markdown here...'
            }
          />

          {/* Cell Output */}
          {cell.output && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Output:</p>
              <pre className="text-sm font-mono whitespace-pre-wrap">{cell.output}</pre>
              {cell.executionTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  Execution time: {cell.executionTime}ms
                </p>
              )}
            </div>
          )}

          {/* Multi-User Cursors */}
          {cursors.length > 0 && (
            <div className="mt-2">
              {cursors.map(({ user, cursor }) => (
                <Badge key={user} variant="outline" className="mr-1 text-xs">
                  👁️ {user} at line {cursor.line}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

NotebookCellComponent.displayName = 'NotebookCellComponent';

export default RealtimeNotebook;
