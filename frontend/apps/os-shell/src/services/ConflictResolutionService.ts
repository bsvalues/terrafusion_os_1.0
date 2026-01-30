/**
 * ConflictResolutionService - Operational Transformation for Collaborative Editing
 *
 * Production-ready service implementing operational transformation (OT) for
 * conflict-free collaborative editing with automatic merge and manual resolution.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 6
 */

// ==================== TYPES ====================

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  userId: number;
  userName: string;
  timestamp: string;
  version: number;
}

export interface Document {
  content: string;
  version: number;
  lastModifiedBy: number;
  lastModifiedAt: string;
}

export interface Conflict {
  id: string;
  operation1: Operation;
  operation2: Operation;
  resolution?: 'auto' | 'manual';
  resolvedBy?: number;
  resolvedAt?: string;
}

export interface TransformResult {
  transformedOp: Operation;
  conflict?: Conflict;
}

// ==================== CONFLICT RESOLUTION SERVICE ====================

export class ConflictResolutionService {
  /**
   * Transform operation against another concurrent operation (OT algorithm)
   */
  transform(op1: Operation, op2: Operation): TransformResult {
    // If operations are from the same user at the same time, no conflict
    if (op1.userId === op2.userId && op1.timestamp === op2.timestamp) {
      return { transformedOp: op1 };
    }

    // Transform based on operation types
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      return this.transformDeleteInsert(op1, op2);
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }

    // Default: return original operation
    return { transformedOp: op1 };
  }

  /**
   * Transform INSERT against INSERT
   */
  private transformInsertInsert(op1: Operation, op2: Operation): TransformResult {
    const transformedOp = { ...op1 };

    if (op2.position < op1.position) {
      // op2 inserted before op1, shift op1 right
      transformedOp.position += op2.content?.length || 0;
    } else if (op2.position === op1.position) {
      // Concurrent inserts at same position - tie-break by user ID
      if (op2.userId < op1.userId) {
        transformedOp.position += op2.content?.length || 0;
      }
    }

    return { transformedOp };
  }

  /**
   * Transform INSERT against DELETE
   */
  private transformInsertDelete(op1: Operation, op2: Operation): TransformResult {
    const transformedOp = { ...op1 };
    const deleteEnd = op2.position + (op2.length || 0);

    if (op1.position >= deleteEnd) {
      // op1 is after deleted range, shift left
      transformedOp.position -= op2.length || 0;
    } else if (op1.position > op2.position && op1.position < deleteEnd) {
      // op1 is inside deleted range, move to start of deletion
      transformedOp.position = op2.position;

      // Create conflict notification
      const conflict: Conflict = {
        id: `conflict_${Date.now()}`,
        operation1: op1,
        operation2: op2,
        resolution: 'auto',
      };

      return { transformedOp, conflict };
    }

    return { transformedOp };
  }

  /**
   * Transform DELETE against INSERT
   */
  private transformDeleteInsert(op1: Operation, op2: Operation): TransformResult {
    const transformedOp = { ...op1 };

    if (op2.position <= op1.position) {
      // op2 inserted before or at delete position, shift delete right
      transformedOp.position += op2.content?.length || 0;
    }

    return { transformedOp };
  }

  /**
   * Transform DELETE against DELETE
   */
  private transformDeleteDelete(op1: Operation, op2: Operation): TransformResult {
    const transformedOp = { ...op1 };
    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);

    if (op2End <= op1.position) {
      // op2 deleted before op1, shift op1 left
      transformedOp.position -= op2.length || 0;
    } else if (op2.position >= op1End) {
      // op2 deleted after op1, no change
      return { transformedOp };
    } else {
      // Overlapping deletes - complex case
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(op1End, op2End);
      const overlapLength = overlapEnd - overlapStart;

      if (overlapLength > 0) {
        // Reduce delete length by overlap
        transformedOp.length = (transformedOp.length || 0) - overlapLength;

        if (op2.position < op1.position) {
          transformedOp.position = op2.position;
        }

        // If delete length becomes 0 or negative, operation is no-op
        if ((transformedOp.length || 0) <= 0) {
          transformedOp.length = 0;
        }

        // Create conflict notification
        const conflict: Conflict = {
          id: `conflict_${Date.now()}`,
          operation1: op1,
          operation2: op2,
          resolution: 'auto',
        };

        return { transformedOp, conflict };
      }
    }

    return { transformedOp };
  }

  /**
   * Apply operation to document
   */
  applyOperation(doc: Document, op: Operation): Document {
    let newContent = doc.content;

    switch (op.type) {
      case 'insert':
        if (op.content && op.position <= newContent.length) {
          newContent =
            newContent.slice(0, op.position) +
            op.content +
            newContent.slice(op.position);
        }
        break;

      case 'delete':
        if (op.length && op.position < newContent.length) {
          const deleteEnd = Math.min(op.position + op.length, newContent.length);
          newContent =
            newContent.slice(0, op.position) + newContent.slice(deleteEnd);
        }
        break;

      case 'replace':
        if (op.length && op.content && op.position < newContent.length) {
          const replaceEnd = Math.min(op.position + op.length, newContent.length);
          newContent =
            newContent.slice(0, op.position) +
            op.content +
            newContent.slice(replaceEnd);
        }
        break;
    }

    return {
      content: newContent,
      version: doc.version + 1,
      lastModifiedBy: op.userId,
      lastModifiedAt: op.timestamp,
    };
  }

  /**
   * Transform operation against history of operations
   */
  transformAgainstHistory(op: Operation, history: Operation[]): Operation {
    let transformedOp = op;

    for (const historyOp of history) {
      if (historyOp.version >= op.version) {
        const result = this.transform(transformedOp, historyOp);
        transformedOp = result.transformedOp;
      }
    }

    return transformedOp;
  }

  /**
   * Detect conflicts between two operations
   */
  detectConflict(op1: Operation, op2: Operation): Conflict | null {
    // Same user, same time = no conflict
    if (op1.userId === op2.userId && op1.timestamp === op2.timestamp) {
      return null;
    }

    // Check for overlapping ranges
    const op1Start = op1.position;
    const op1End = op1.position + (op1.length || op1.content?.length || 0);
    const op2Start = op2.position;
    const op2End = op2.position + (op2.length || op2.content?.length || 0);

    const hasOverlap = op1Start < op2End && op2Start < op1End;

    if (hasOverlap) {
      return {
        id: `conflict_${Date.now()}`,
        operation1: op1,
        operation2: op2,
      };
    }

    return null;
  }

  /**
   * Merge two divergent document states
   */
  mergeDocuments(
    baseDoc: Document,
    doc1: Document,
    doc2: Document,
    ops1: Operation[],
    ops2: Operation[]
  ): { mergedDoc: Document; conflicts: Conflict[] } {
    const conflicts: Conflict[] = [];
    let currentDoc = baseDoc;

    // Apply ops1 first
    for (const op of ops1) {
      currentDoc = this.applyOperation(currentDoc, op);
    }

    // Transform and apply ops2
    for (const op of ops2) {
      const transformedOp = this.transformAgainstHistory(op, ops1);
      const conflict = this.detectConflict(transformedOp, ops1[ops1.length - 1]);

      if (conflict) {
        conflicts.push(conflict);
      }

      currentDoc = this.applyOperation(currentDoc, transformedOp);
    }

    return {
      mergedDoc: currentDoc,
      conflicts,
    };
  }

  /**
   * Create insert operation
   */
  createInsertOperation(
    position: number,
    content: string,
    userId: number,
    userName: string,
    version: number
  ): Operation {
    return {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'insert',
      position,
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      version,
    };
  }

  /**
   * Create delete operation
   */
  createDeleteOperation(
    position: number,
    length: number,
    userId: number,
    userName: string,
    version: number
  ): Operation {
    return {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'delete',
      position,
      length,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      version,
    };
  }

  /**
   * Create replace operation
   */
  createReplaceOperation(
    position: number,
    length: number,
    content: string,
    userId: number,
    userName: string,
    version: number
  ): Operation {
    return {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'replace',
      position,
      length,
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      version,
    };
  }
}

// ==================== SINGLETON INSTANCE ====================

export const conflictResolutionService = new ConflictResolutionService();
export default conflictResolutionService;
