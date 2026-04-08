// Permit related types
export interface Permit {
  id: number;
  parcelNumber: string;
  neighborhoodCode: string;
  permitDescription: string;
  value: string;
  issueDate: string;
  enterPermit: boolean;
  reason: string;
  processedAt: string;
  uploadId: number;
}

export interface Upload {
  id: number;
  fileName: string;
  processedAt: string;
  totalPermits: number;
  enterPermits: number;
  skipPermits: number;
}

export interface Summary {
  totalCount: number;
  enterCount: number;
  skipCount: number;
}

export interface UploadResult {
  uploadId: number;
  permits: Permit[];
  summary: Summary;
  message?: string;  // Optional message for warnings or partial success
}

export interface PermitClassificationResult {
  uploadId: number;
  uploadInfo: Upload;
  permits: Permit[];
  summary: Summary;
}

// File upload related types
export interface FileWithPreview extends File {
  preview?: string;
}

// API error types
export interface ApiError {
  message: string;
}

// Collaboration related types
export interface CollaborationParticipant {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: string;
  isActive: boolean;
  color: string; // For highlighting user activity
}

export interface CollaborationSession {
  id: string;
  uploadId: number;
  createdAt: string;
  participants: CollaborationParticipant[];
  activePermitId?: number; // The permit currently being discussed
}

export interface PermitComment {
  id: string;
  permitId: number;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export enum CollaborationEventType {
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  USER_ACTIVITY = 'user_activity',
  PERMIT_FOCUS = 'permit_focus',
  PERMIT_COMMENT = 'permit_comment',
  PERMIT_UPDATE = 'permit_update',
}

export interface CollaborationEvent {
  type: CollaborationEventType;
  sessionId: string;
  userId: string;
  timestamp: string;
  payload: any;
}

// History tracking types
export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  REVIEW = 'review',
  COMMENT = 'comment',
}

export interface PermitHistory {
  id: number;
  permitId: number;
  userId: number;
  action: string; // ActionType as string
  detail: {
    changes?: Record<string, any>;
    description: string;
    previousState?: Record<string, any>;
    initialState?: Record<string, any>;
  };
  createdAt: string;
}
