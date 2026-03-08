/**
 * TerraFusion OS Shared Enums
 *
 * Centralized enum definitions used across frontend components.
 * These were formerly imported from the @terrafusion/shared package.
 */

// ============================================================================
// User & Security
// ============================================================================

export enum UserRole {
  ADMINISTRATOR = 'administrator',
  DEPARTMENT_HEAD = 'department_head',
  TEAM_LEAD = 'team_lead',
  PROJECT_MANAGER = 'project_manager',
  ANALYST = 'analyst',
  DEVELOPER = 'developer',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer',
  MANAGER = 'manager',
}

export enum SecurityClearance {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential',
  SECRET = 'secret',
  TOP_SECRET = 'top_secret',
}

// ============================================================================
// Projects
// ============================================================================

export enum ProjectType {
  DEVELOPMENT = 'development',
  COMPLIANCE = 'compliance',
  INFRASTRUCTURE = 'infrastructure',
  RESEARCH = 'research',
  OPERATIONS = 'operations',
  MAINTENANCE = 'maintenance',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

export enum ProjectPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ProjectRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  CONTRIBUTOR = 'contributor',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer',
}

// ============================================================================
// Tasks
// ============================================================================

export enum TaskType {
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance',
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  HIGHEST = 'highest',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  LOWEST = 'lowest',
}

// ============================================================================
// Comments & Collaboration
// ============================================================================

export enum CommentType {
  COMMENT = 'comment',
  REVIEW = 'review',
  APPROVAL = 'approval',
  FEEDBACK = 'feedback',
  SYSTEM = 'system',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

// ============================================================================
// Sessions
// ============================================================================

export enum SessionType {
  MEETING = 'meeting',
  WORKSHOP = 'workshop',
  REVIEW = 'review',
  STANDUP = 'standup',
  PLANNING = 'planning',
  RETROSPECTIVE = 'retrospective',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum SessionRole {
  HOST = 'host',
  PRESENTER = 'presenter',
  PARTICIPANT = 'participant',
  OBSERVER = 'observer',
}

// ============================================================================
// Messaging
// ============================================================================

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
  NOTIFICATION = 'notification',
}

// ============================================================================
// Canvas / Whiteboard
// ============================================================================

export enum CanvasElementType {
  LINE = 'line',
  SHAPE = 'shape',
  TEXT = 'text',
  IMAGE = 'image',
  STICKY_NOTE = 'sticky_note',
  CONNECTOR = 'connector',
}

// ============================================================================
// Permissions
// ============================================================================

export enum PermissionCategory {
  PROJECT = 'project',
  TASK = 'task',
  DOCUMENT = 'document',
  TEAM = 'team',
  SYSTEM = 'system',
}

export enum PermissionLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export enum PermissionScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  TEAM = 'team',
  PROJECT = 'project',
}

export enum ProjectPermissionScope {
  ALL = 'all',
  OWN = 'own',
  TEAM = 'team',
  DEPARTMENT = 'department',
}

export enum ConditionType {
  ROLE = 'role',
  CLEARANCE = 'clearance',
  DEPARTMENT = 'department',
  CUSTOM = 'custom',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  IN = 'in',
  NOT_IN = 'not_in',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
}

// ============================================================================
// Documents
// ============================================================================

export enum DocumentType {
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum DocumentPermissionLevel {
  NONE = 'none',
  VIEW = 'view',
  COMMENT = 'comment',
  EDIT = 'edit',
  ADMIN = 'admin',
}

// ============================================================================
// Audit & Notifications
// ============================================================================

export enum AuditEventType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ACCESS = 'access',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_CHANGE = 'permission_change',
  EXPORT = 'export',
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_UPDATED = 'task_updated',
  COMMENT_ADDED = 'comment_added',
  MENTION = 'mention',
  PROJECT_UPDATE = 'project_update',
  SYSTEM = 'system',
  DEADLINE = 'deadline',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}
