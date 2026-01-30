/**
 * ConflictResolutionDialog - Manual Conflict Resolution UI
 *
 * Production-ready component for displaying and resolving editing conflicts
 * with diff visualization and merge options.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 6
 */

import React, { useState } from 'react';
import { Conflict, Operation } from '../../services/ConflictResolutionService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// ==================== TYPES ====================

export interface ConflictResolutionDialogProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: 'accept-yours' | 'accept-theirs' | 'merge') => void;
  onDismiss: () => void;
  isOpen: boolean;
  currentUserId: number;
}

// ==================== COMPONENT ====================

export function ConflictResolutionDialog({
  conflicts,
  onResolve,
  onDismiss,
  isOpen,
  currentUserId,
}: ConflictResolutionDialogProps) {
  // ==================== STATE ====================

  const [selectedConflictIndex, setSelectedConflictIndex] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState<
    'accept-yours' | 'accept-theirs' | 'merge' | null
  >(null);

  // ==================== COMPUTED ====================

  const currentConflict = conflicts[selectedConflictIndex];
  const hasMoreConflicts = selectedConflictIndex < conflicts.length - 1;

  // Determine which operation is "yours" and which is "theirs"
  const yourOperation =
    currentConflict?.operation1.userId === currentUserId
      ? currentConflict.operation1
      : currentConflict?.operation2;

  const theirOperation =
    currentConflict?.operation1.userId === currentUserId
      ? currentConflict.operation2
      : currentConflict?.operation1;

  // ==================== HANDLERS ====================

  const handleResolve = () => {
    if (!selectedResolution || !currentConflict) return;

    onResolve(currentConflict.id, selectedResolution);

    if (hasMoreConflicts) {
      // Move to next conflict
      setSelectedConflictIndex((prev) => prev + 1);
      setSelectedResolution(null);
    } else {
      // All conflicts resolved
      onDismiss();
    }
  };

  const handleSkip = () => {
    if (hasMoreConflicts) {
      setSelectedConflictIndex((prev) => prev + 1);
      setSelectedResolution(null);
    } else {
      onDismiss();
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderOperationPreview = (op: Operation) => {
    let preview = '';
    let description = '';

    switch (op.type) {
      case 'insert':
        preview = op.content || '';
        description = `Insert "${preview}" at position ${op.position}`;
        break;
      case 'delete':
        preview = `[${op.length} characters]`;
        description = `Delete ${op.length} characters at position ${op.position}`;
        break;
      case 'replace':
        preview = op.content || '';
        description = `Replace ${op.length} characters with "${preview}" at position ${op.position}`;
        break;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Badge variant={op.type === 'delete' ? 'destructive' : 'default'}>
            {op.type}
          </Badge>
          <span className="text-sm text-muted-foreground">
            by {op.userName}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(op.timestamp).toLocaleString()}
          </span>
        </div>
        <p className="text-sm">{description}</p>
        {preview && (
          <pre className="text-xs bg-accent p-2 rounded font-mono max-h-32 overflow-auto">
            {preview}
          </pre>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================

  if (!currentConflict) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editing Conflict Detected ({selectedConflictIndex + 1} of {conflicts.length})
          </DialogTitle>
          <DialogDescription>
            Multiple users edited the same content simultaneously. Choose how to resolve this
            conflict.
          </DialogDescription>
        </DialogHeader>

        {/* Alert */}
        <Alert>
          <div>
            <p className="font-semibold text-sm">Concurrent Edit Detected</p>
            <p className="text-sm">
              {yourOperation.userName} and {theirOperation.userName} made conflicting changes.
            </p>
          </div>
        </Alert>

        {/* Conflict Details */}
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="yours">Your Changes</TabsTrigger>
            <TabsTrigger value="theirs">Their Changes</TabsTrigger>
          </TabsList>

          {/* Comparison View */}
          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Changes</CardTitle>
                </CardHeader>
                <CardContent>{renderOperationPreview(yourOperation)}</CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Their Changes</CardTitle>
                </CardHeader>
                <CardContent>{renderOperationPreview(theirOperation)}</CardContent>
              </Card>
            </div>

            {/* Conflict Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conflict Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Position Overlap:</span> Both operations affect
                  content near position {yourOperation.position}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Time Difference:</span>{' '}
                  {Math.abs(
                    new Date(yourOperation.timestamp).getTime() -
                      new Date(theirOperation.timestamp).getTime()
                  )}
                  ms
                </div>
                {currentConflict.resolution === 'auto' && (
                  <Badge variant="secondary">Auto-merged with potential issues</Badge>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Your Changes View */}
          <TabsContent value="yours">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Changes</CardTitle>
              </CardHeader>
              <CardContent>{renderOperationPreview(yourOperation)}</CardContent>
            </Card>
          </TabsContent>

          {/* Their Changes View */}
          <TabsContent value="theirs">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Their Changes</CardTitle>
              </CardHeader>
              <CardContent>{renderOperationPreview(theirOperation)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resolution Options */}
        <div className="space-y-3">
          <p className="text-sm font-medium">How do you want to resolve this conflict?</p>

          <div className="space-y-2">
            <Button
              variant={selectedResolution === 'accept-yours' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setSelectedResolution('accept-yours')}
            >
              <div className="text-left">
                <div className="font-medium">Accept Your Changes</div>
                <div className="text-xs text-muted-foreground">
                  Discard {theirOperation.userName}'s changes and keep yours
                </div>
              </div>
            </Button>

            <Button
              variant={selectedResolution === 'accept-theirs' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setSelectedResolution('accept-theirs')}
            >
              <div className="text-left">
                <div className="font-medium">Accept Their Changes</div>
                <div className="text-xs text-muted-foreground">
                  Discard your changes and accept {theirOperation.userName}'s
                </div>
              </div>
            </Button>

            <Button
              variant={selectedResolution === 'merge' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setSelectedResolution('merge')}
            >
              <div className="text-left">
                <div className="font-medium">Merge Both Changes</div>
                <div className="text-xs text-muted-foreground">
                  Attempt to combine both edits (recommended)
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button variant="ghost" onClick={handleSkip}>
              Skip This Conflict
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onDismiss}>
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={!selectedResolution}>
                {hasMoreConflicts ? 'Next Conflict' : 'Resolve & Close'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConflictResolutionDialog;
