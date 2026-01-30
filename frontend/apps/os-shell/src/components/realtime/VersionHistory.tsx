/**
 * VersionHistory - Document Version History with Diff Visualization
 *
 * Production-ready component for viewing document version history, comparing
 * versions with diff visualization, and rolling back to previous versions.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 7
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Alert } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

// ==================== TYPES ====================

export interface Version {
  id: string;
  version: number;
  content: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  changeDescription?: string;
  linesAdded: number;
  linesRemoved: number;
  isCurrent: boolean;
  isAutoSave?: boolean;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export interface VersionHistoryProps {
  cellIndex: number;
  versions: Version[];
  currentVersion: number;
  onRollback: (versionId: string) => void;
  onCompare?: (versionId1: string, versionId2: string) => void;
  autoSaveInterval?: number;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate diff between two versions
 */
function generateDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const diff: DiffLine[] = [];

  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Remaining lines are additions
      diff.push({
        type: 'added',
        content: newLines[newIndex],
        lineNumber: newIndex + 1,
      });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Remaining lines are deletions
      diff.push({
        type: 'removed',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1,
      });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines are the same
      diff.push({
        type: 'unchanged',
        content: oldLines[oldIndex],
        lineNumber: newIndex + 1,
      });
      oldIndex++;
      newIndex++;
    } else {
      // Lines differ - for simplicity, mark old as removed and new as added
      diff.push({
        type: 'removed',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1,
      });
      diff.push({
        type: 'added',
        content: newLines[newIndex],
        lineNumber: newIndex + 1,
      });
      oldIndex++;
      newIndex++;
    }
  }

  return diff;
}

/**
 * Get user initials for avatar
 */
function getUserInitials(userName: string): string {
  return userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format time ago
 */
function getTimeAgo(timestamp: string): string {
  const now = new Date().getTime();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'just now';
}

// ==================== COMPONENT ====================

export function VersionHistory({
  cellIndex,
  versions,
  currentVersion,
  onRollback,
  onCompare,
  autoSaveInterval = 300000, // 5 minutes
}: VersionHistoryProps) {
  // ==================== STATE ====================

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareVersion, setCompareVersion] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<Version | null>(null);

  // ==================== COMPUTED ====================

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => b.version - a.version);
  }, [versions]);

  const selectedVersionData = useMemo(() => {
    return versions.find((v) => v.id === selectedVersion);
  }, [versions, selectedVersion]);

  const compareVersionData = useMemo(() => {
    return versions.find((v) => v.id === compareVersion);
  }, [versions, compareVersion]);

  const diffLines = useMemo(() => {
    if (!selectedVersionData || !compareVersionData) return [];
    return generateDiff(compareVersionData.content, selectedVersionData.content);
  }, [selectedVersionData, compareVersionData]);

  // ==================== HANDLERS ====================

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersion === versionId) {
      setSelectedVersion(null);
      setCompareVersion(null);
      setShowDiff(false);
    } else {
      setSelectedVersion(versionId);

      // Auto-select previous version for comparison
      const currentIndex = sortedVersions.findIndex((v) => v.id === versionId);
      if (currentIndex < sortedVersions.length - 1) {
        setCompareVersion(sortedVersions[currentIndex + 1].id);
        setShowDiff(true);
      }
    }
  };

  const handleCompareVersionSelect = (versionId: string) => {
    setCompareVersion(versionId);
    setShowDiff(true);
  };

  const handleRollbackClick = (version: Version) => {
    setRollbackTarget(version);
    setShowRollbackDialog(true);
  };

  const confirmRollback = () => {
    if (rollbackTarget) {
      onRollback(rollbackTarget.id);
      setShowRollbackDialog(false);
      setRollbackTarget(null);
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderDiffLine = (line: DiffLine, index: number) => {
    const bgColor =
      line.type === 'added'
        ? 'bg-green-900/20'
        : line.type === 'removed'
          ? 'bg-red-900/20'
          : 'bg-transparent';

    const textColor =
      line.type === 'added'
        ? 'text-green-400'
        : line.type === 'removed'
          ? 'text-red-400'
          : 'text-foreground';

    const prefix = line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  ';

    return (
      <div
        key={index}
        className={`font-mono text-xs px-2 py-0.5 ${bgColor} ${textColor} whitespace-pre`}
      >
        <span className="inline-block w-10 text-muted-foreground">{line.lineNumber || ''}</span>
        {prefix}
        {line.content}
      </div>
    );
  };

  const renderVersion = (version: Version) => {
    const isSelected = selectedVersion === version.id;
    const isCompare = compareVersion === version.id;

    return (
      <div
        key={version.id}
        className={`p-3 rounded-lg border cursor-pointer hover:bg-accent ${
          isSelected ? 'border-terra-cyan bg-accent' : ''
        } ${isCompare ? 'border-orange-500' : ''}`}
        onClick={() => handleVersionSelect(version.id)}
      >
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={version.userAvatar} />
            <AvatarFallback>{getUserInitials(version.userName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{version.userName}</span>
                {version.isCurrent && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
                {version.isAutoSave && (
                  <Badge variant="outline" className="text-xs">
                    Auto-save
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                v{version.version}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{getTimeAgo(version.timestamp)}</p>

            {version.changeDescription && (
              <p className="text-sm">{version.changeDescription}</p>
            )}

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-green-400">+{version.linesAdded} lines</span>
              <span className="text-red-400">-{version.linesRemoved} lines</span>
            </div>

            {isSelected && !version.isCurrent && (
              <div className="mt-2 space-x-2">
                <Button size="sm" onClick={() => handleRollbackClick(version)}>
                  Rollback to This Version
                </Button>
                {!isCompare && (
                  <Button size="sm" variant="outline" onClick={() => setShowDiff(true)}>
                    View Diff
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <>
      <Card className="version-history">
        <CardHeader>
          <CardTitle className="text-sm">Version History - Cell {cellIndex}</CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''} •
            Auto-save every {Math.floor(autoSaveInterval / 60000)} minutes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Version Timeline */}
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {sortedVersions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No version history yet
                </p>
              ) : (
                sortedVersions.map((version) => renderVersion(version))
              )}
            </div>
          </ScrollArea>

          {/* Diff View */}
          {showDiff && selectedVersionData && compareVersionData && (
            <>
              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Diff: v{compareVersionData.version} → v{selectedVersionData.version}
                  </h4>
                  <Button size="sm" variant="ghost" onClick={() => setShowDiff(false)}>
                    Hide Diff
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Comparing with previous version by {compareVersionData.userName}
                </div>

                <ScrollArea className="h-64 border rounded-md">
                  <div className="bg-background">{diffLines.map(renderDiffLine)}</div>
                </ScrollArea>

                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-green-400">
                    +{diffLines.filter((l) => l.type === 'added').length} additions
                  </span>
                  <span className="text-red-400">
                    -{diffLines.filter((l) => l.type === 'removed').length} deletions
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback to Previous Version?</DialogTitle>
            <DialogDescription>
              This will restore the cell content to version {rollbackTarget?.version} from{' '}
              {rollbackTarget?.timestamp && getTimeAgo(rollbackTarget.timestamp)}.
            </DialogDescription>
          </DialogHeader>

          {rollbackTarget && (
            <Alert>
              <div>
                <p className="font-semibold text-sm">Version {rollbackTarget.version}</p>
                <p className="text-sm">
                  By {rollbackTarget.userName} • {new Date(rollbackTarget.timestamp).toLocaleString()}
                </p>
                <p className="text-sm mt-2">
                  {rollbackTarget.linesAdded} lines added, {rollbackTarget.linesRemoved} lines
                  removed
                </p>
              </div>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Note: Rollback creates a new version. You can always undo this action by rolling
            back again.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRollback}>Confirm Rollback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VersionHistory;
