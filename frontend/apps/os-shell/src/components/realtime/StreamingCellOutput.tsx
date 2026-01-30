/**
 * StreamingCellOutput - Live Cell Execution Output Component
 *
 * Production-ready component for displaying streaming code execution output
 * with stdout, stderr, rich media, and execution status.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 5
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Spinner } from '../ui/spinner';

// ==================== TYPES ====================

export type OutputType = 'stdout' | 'stderr' | 'execute_result' | 'display_data' | 'error';

export interface OutputMessage {
  id: string;
  type: OutputType;
  content: string | any;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ExecutionState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  executionCount?: number;
}

export interface StreamingCellOutputProps {
  cellIndex: number;
  outputs: OutputMessage[];
  executionState: ExecutionState;
  onClearOutput?: () => void;
  onStopExecution?: () => void;
  showTimestamps?: boolean;
  maxHeight?: number;
  autoScroll?: boolean;
}

// ==================== COMPONENT ====================

export function StreamingCellOutput({
  cellIndex,
  outputs,
  executionState,
  onClearOutput,
  onStopExecution,
  showTimestamps = false,
  maxHeight = 400,
  autoScroll = true,
}: StreamingCellOutputProps) {
  // ==================== STATE ====================

  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // ==================== EFFECTS ====================

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (autoScroll && isScrolledToBottom && outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputs, autoScroll, isScrolledToBottom]);

  // Track scroll position
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsScrolledToBottom(isAtBottom);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  // ==================== HANDLERS ====================

  const handleScrollToBottom = useCallback(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsScrolledToBottom(true);
  }, []);

  // ==================== RENDER HELPERS ====================

  const renderOutput = (output: OutputMessage) => {
    switch (output.type) {
      case 'stdout':
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
            {output.content}
          </pre>
        );

      case 'stderr':
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap text-destructive">
            {output.content}
          </pre>
        );

      case 'error':
        return (
          <Alert variant="destructive" className="mt-2">
            <div>
              <p className="font-semibold text-sm">{output.metadata?.ename || 'Error'}</p>
              <p className="text-sm">{output.metadata?.evalue || output.content}</p>
              {output.metadata?.traceback && (
                <pre className="mt-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {Array.isArray(output.metadata.traceback)
                    ? output.metadata.traceback.join('\n')
                    : output.metadata.traceback}
                </pre>
              )}
            </div>
          </Alert>
        );

      case 'execute_result':
      case 'display_data': {
        // Handle different MIME types
        const data = output.content;

        if (typeof data === 'string') {
          return (
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {data}
            </pre>
          );
        }

        // Handle rich media (images, HTML, etc.)
        if (data && typeof data === 'object') {
          if (data['image/png']) {
            return (
              <img
                src={`data:image/png;base64,${data['image/png']}`}
                alt="Output"
                className="max-w-full h-auto"
              />
            );
          }

          if (data['text/html']) {
            return (
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: data['text/html'] }}
              />
            );
          }

          if (data['text/plain']) {
            return (
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {data['text/plain']}
              </pre>
            );
          }

          // Fallback to JSON
          return (
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          );
        }

        return null;
      }

      default:
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
            {JSON.stringify(output.content, null, 2)}
          </pre>
        );
    }
  };

  const getExecutionDuration = (): string => {
    if (!executionState.startTime) return '';

    const start = new Date(executionState.startTime).getTime();
    const end = executionState.endTime
      ? new Date(executionState.endTime).getTime()
      : Date.now();

    const duration = end - start;

    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = ((duration % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  };

  // ==================== RENDER ====================

  if (outputs.length === 0 && executionState.status === 'idle') {
    return null;
  }

  return (
    <Card className="streaming-cell-output mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <Badge
            variant={
              executionState.status === 'running'
                ? 'default'
                : executionState.status === 'completed'
                  ? 'success'
                  : executionState.status === 'failed'
                    ? 'destructive'
                    : 'secondary'
            }
          >
            {executionState.status === 'running' && <Spinner className="w-3 h-3 mr-1" />}
            {executionState.status}
          </Badge>

          {/* Execution Count */}
          {executionState.executionCount !== undefined && (
            <Badge variant="outline">
              [{executionState.executionCount}]
            </Badge>
          )}

          {/* Duration */}
          {(executionState.status === 'running' || executionState.status === 'completed') && (
            <span className="text-xs text-muted-foreground">
              {getExecutionDuration()}
            </span>
          )}

          {/* Output Count */}
          {outputs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {outputs.length} output{outputs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          {executionState.status === 'running' && onStopExecution && (
            <Button size="sm" variant="destructive" onClick={onStopExecution}>
              ⏹ Stop
            </Button>
          )}

          {outputs.length > 0 && onClearOutput && (
            <Button size="sm" variant="ghost" onClick={onClearOutput}>
              🗑️ Clear
            </Button>
          )}

          {!isScrolledToBottom && (
            <Button size="sm" variant="ghost" onClick={handleScrollToBottom}>
              ⬇ Bottom
            </Button>
          )}
        </div>
      </div>

      {/* Output Content */}
      <CardContent className="p-0">
        <ScrollArea
          ref={scrollAreaRef}
          className="w-full"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <div className="p-4 space-y-2">
            {outputs.map((output, idx) => (
              <div key={output.id || idx} className="output-message">
                {/* Timestamp */}
                {showTimestamps && (
                  <div className="text-xs text-muted-foreground mb-1">
                    {new Date(output.timestamp).toLocaleTimeString()}
                  </div>
                )}

                {/* Output Content */}
                <div className="output-content">{renderOutput(output)}</div>
              </div>
            ))}

            {/* Running Indicator */}
            {executionState.status === 'running' && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Spinner className="w-4 h-4" />
                <span>Executing...</span>
              </div>
            )}

            {/* Scroll Anchor */}
            <div ref={outputEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default StreamingCellOutput;
