/**
 * Terrafusion OS 1.0 - Collaboration System Types
 * Government-Grade Multi-User Collaboration Platform
 * 
 * Defines comprehensive types for enterprise collaboration functionality
 * integrating with 1,008-agent AI swarm and government compliance requirements.
 */

import { LucideIcon  } from '@mui/icons-material';

// Core User and Team Types
export interface CollaborationUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  permissions: Permission[];
  avatar?: string;
  isOnline: boolean;
  lastActive: Date;
  governmentClearance?: SecurityClearance;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  department: string;
  members: CollaborationUser[];
  owners: string[];
  permissions: TeamPermission[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Project Management Types
export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  team: Team;
  owner: CollaborationUser;
  participants: ProjectParticipant[];
  timeline: ProjectTimeline;
  milestones: Milestone[];
  tasks: Task[];
  documents: ProjectDocument[];
  metadata: ProjectMetadata;
  auditTrail: AuditEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectParticipant {
  user: CollaborationUser;
  role: ProjectRole;
  permissions: ProjectPermission[];
  joinedAt: Date;
  isActive: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: CollaborationUser;
  reporter: CollaborationUser;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  comments: TaskComment[];
  dependencies: string[];
  tags: string[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  user: CollaborationUser;
  content: string;
  type: CommentType;
  createdAt: Date;
  editedAt?: Date;
  mentions: string[];
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: MilestoneStatus;
  deliverables: string[];
  dependencies: string[];
}

export interface ProjectTimeline {
  startDate: Date;
  endDate: Date;
  phases: ProjectPhase[];
  currentPhase: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: PhaseStatus;
  deliverables: string[];
  responsibleTeam: string;
}

// Real-time Collaboration Types
export interface CollaborationSession {
  id: string;
  projectId: string;
  type: SessionType;
  participants: SessionParticipant[];
  startTime: Date;
  endTime?: Date;
  status: SessionStatus;
  sharedScreen?: ScreenShare;
  whiteboard?: WhiteboardSession;
  chat: ChatMessage[];
  recordings?: SessionRecording[];
}

export interface SessionParticipant {
  user: CollaborationUser;
  joinTime: Date;
  leaveTime?: Date;
  role: SessionRole;
  permissions: SessionPermission[];
  isPresenting: boolean;
  isMuted: boolean;
  hasVideo: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  user: CollaborationUser;
  content: string;
  type: MessageType;
  timestamp: Date;
  mentions: string[];
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
}

export interface MessageReaction {
  emoji: string;
  user: CollaborationUser;
  timestamp: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface WhiteboardSession {
  id: string;
  collaborationSessionId: string;
  canvas: CanvasElement[];
  participants: WhiteboardParticipant[];
  version: number;
  lastModified: Date;
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  data: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: ElementStyle;
  createdBy: string;
  createdAt: Date;
  version: number;
}

export interface WhiteboardParticipant {
  user: CollaborationUser;
  cursor: { x: number; y: number };
  tool: WhiteboardTool;
  color: string;
}

// Permission Management Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  level: PermissionLevel;
  scope: PermissionScope;
  isSystemPermission: boolean;
}

export interface TeamPermission {
  permission: Permission;
  grantedBy: CollaborationUser;
  grantedAt: Date;
  expiresAt?: Date;
  conditions?: PermissionCondition[];
}

export interface ProjectPermission {
  permission: Permission;
  scope: ProjectPermissionScope;
  grantedBy: CollaborationUser;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface PermissionCondition {
  type: ConditionType;
  value: any;
  operator: ConditionOperator;
}

// Document and File Sharing Types
export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: DocumentType;
  content: string;
  version: number;
  status: DocumentStatus;
  author: CollaborationUser;
  lastEditor: CollaborationUser;
  editors: DocumentEditor[];
  permissions: DocumentPermission[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  auditTrail: DocumentAuditEvent[];
}

export interface DocumentEditor {
  user: CollaborationUser;
  isActive: boolean;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
  lastActivity: Date;
}

export interface DocumentPermission {
  user: CollaborationUser;
  level: DocumentPermissionLevel;
  grantedBy: CollaborationUser;
  grantedAt: Date;
}

// Audit and Compliance Types
export interface AuditEvent {
  id: string;
  type: AuditEventType;
  entity: string;
  entityId: string;
  user: CollaborationUser;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

export interface DocumentAuditEvent extends AuditEvent {
  documentVersion: number;
  changesSummary: string;
  contentDiff?: string;
}

// System Integration Types
export interface AIAssistant {
  id: string;
  name: string;
  type: AIAssistantType;
  capabilities: AICapability[];
  isActive: boolean;
  model: string;
  context: AIContext;
}

export interface AICapability {
  type: CapabilityType;
  description: string;
  confidence: number;
  lastTrained: Date;
}

export interface AIContext {
  projectId?: string;
  teamId?: string;
  userId: string;
  currentTask?: string;
  preferences: Record<string, any>;
}

// Notification Types
export interface CollaborationNotification {
  id: string;
  type: NotificationType;
  recipient: CollaborationUser;
  sender?: CollaborationUser;
  title: string;
  message: string;
  data: Record<string, any>;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

// Analytics Types
export interface CollaborationMetrics {
  period: DateRange;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  messagesExchanged: number;
  documentsCreated: number;
  documentsEdited: number;
  taskMetrics: TaskMetrics;
  teamMetrics: TeamMetrics[];
  departmentMetrics: DepartmentMetrics[];
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<TaskStatus, number>;
}

export interface TeamMetrics {
  team: Team;
  productivity: number;
  collaborationScore: number;
  projectsCompleted: number;
  averageTaskCompletionTime: number;
}

export interface DepartmentMetrics {
  department: string;
  teams: TeamMetrics[];
  resourceUtilization: number;
  crossTeamCollaboration: number;
}

// Enums
export enum UserRole {
  ADMINISTRATOR = 'administrator',
  DEPARTMENT_HEAD = 'department_head',
  TEAM_LEAD = 'team_lead',
  PROJECT_MANAGER = 'project_manager',
  SENIOR_ANALYST = 'senior_analyst',
  ANALYST = 'analyst',
  TECHNICIAN = 'technician',
  GUEST = 'guest'
}

export enum SecurityClearance {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  SECRET = 'secret',
  TOP_SECRET = 'top_secret'
}

export enum ProjectType {
  ASSESSMENT = 'assessment',
  VALUATION = 'valuation',
  COMPLIANCE = 'compliance',
  SYSTEM_INTEGRATION = 'system_integration',
  DATA_MIGRATION = 'data_migration',
  REPORTING = 'reporting',
  AUDIT = 'audit',
  TRAINING = 'training'
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export enum ProjectRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  CONTRIBUTOR = 'contributor',
  REVIEWER = 'reviewer',
  OBSERVER = 'observer'
}

export enum TaskType {
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance'
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TO_DO = 'to_do',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  TESTING = 'testing',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest'
}

export enum CommentType {
  COMMENT = 'comment',
  SYSTEM = 'system',
  MENTION = 'mention',
  STATUS_CHANGE = 'status_change'
}

export enum MilestoneStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled'
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed'
}

export enum SessionType {
  MEETING = 'meeting',
  BRAINSTORM = 'brainstorm',
  REVIEW = 'review',
  TRAINING = 'training',
  PRESENTATION = 'presentation'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export enum SessionRole {
  HOST = 'host',
  PRESENTER = 'presenter',
  PARTICIPANT = 'participant',
  OBSERVER = 'observer'
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
  MENTION = 'mention'
}

export enum CanvasElementType {
  TEXT = 'text',
  SHAPE = 'shape',
  LINE = 'line',
  IMAGE = 'image',
  STICKY_NOTE = 'sticky_note'
}

export enum WhiteboardTool {
  PEN = 'pen',
  HIGHLIGHTER = 'highlighter',
  ERASER = 'eraser',
  TEXT = 'text',
  SHAPE = 'shape',
  SELECT = 'select'
}

export enum PermissionCategory {
  SYSTEM = 'system',
  PROJECT = 'project',
  TEAM = 'team',
  DOCUMENT = 'document',
  COLLABORATION = 'collaboration'
}

export enum PermissionLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  OWNER = 'owner'
}

export enum PermissionScope {
  GLOBAL = 'global',
  DEPARTMENT = 'department',
  TEAM = 'team',
  PROJECT = 'project',
  DOCUMENT = 'document'
}

export enum ProjectPermissionScope {
  ALL = 'all',
  TASKS = 'tasks',
  DOCUMENTS = 'documents',
  TEAM = 'team',
  SETTINGS = 'settings'
}

export enum ConditionType {
  TIME_RANGE = 'time_range',
  LOCATION = 'location',
  DEPARTMENT = 'department',
  ROLE = 'role',
  CLEARANCE = 'clearance'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  IN = 'in'
}

export enum DocumentType {
  TEXT = 'text',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
  FORM = 'form'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum DocumentPermissionLevel {
  NONE = 'none',
  VIEW = 'view',
  COMMENT = 'comment',
  EDIT = 'edit',
  ADMIN = 'admin'
}

export enum AuditEventType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  SHARE = 'share',
  PERMISSION_CHANGE = 'permission_change',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

export enum AIAssistantType {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  COMPLIANCE = 'compliance',
  ANALYTICS = 'analytics',
  DOCUMENTATION = 'documentation'
}

export enum CapabilityType {
  TEXT_GENERATION = 'text_generation',
  CODE_ANALYSIS = 'code_analysis',
  DATA_ANALYSIS = 'data_analysis',
  DOCUMENT_REVIEW = 'document_review',
  MEETING_SUMMARY = 'meeting_summary',
  TASK_SUGGESTION = 'task_suggestion'
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_OVERDUE = 'task_overdue',
  PROJECT_UPDATE = 'project_update',
  MENTION = 'mention',
  MEETING_REMINDER = 'meeting_reminder',
  DOCUMENT_SHARED = 'document_shared',
  TEAM_INVITATION = 'team_invitation'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Utility Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface ElementStyle {
  color: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
}

export interface ProjectMetadata {
  estimatedBudget?: number;
  actualBudget?: number;
  resourceRequirements: ResourceRequirement[];
  riskAssessment: RiskAssessment;
  complianceRequirements: string[];
  integrations: SystemIntegration[];
}

export interface ResourceRequirement {
  type: ResourceType;
  quantity: number;
  unit: string;
  description: string;
  estimatedCost?: number;
}

export enum ResourceType {
  HUMAN = 'human',
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  EXTERNAL_SERVICE = 'external_service'
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  risks: Risk[];
  mitigationStrategies: MitigationStrategy[];
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Risk {
  id: string;
  description: string;
  impact: RiskLevel;
  probability: number;
  category: RiskCategory;
  mitigation?: string;
}

export enum RiskCategory {
  TECHNICAL = 'technical',
  SCHEDULE = 'schedule',
  BUDGET = 'budget',
  RESOURCE = 'resource',
  COMPLIANCE = 'compliance',
  EXTERNAL = 'external'
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  owner: CollaborationUser;
  timeline: string;
  cost?: number;
}

export interface SystemIntegration {
  system: string;
  type: IntegrationType;
  status: IntegrationStatus;
  configuration: Record<string, any>;
  lastSync?: Date;
}

export enum IntegrationType {
  API = 'api',
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system',
  WEBHOOK = 'webhook',
  ETL = 'etl'
}

export enum IntegrationStatus {
  CONFIGURED = 'configured',
  ACTIVE = 'active',
  ERROR = 'error',
  DISABLED = 'disabled'
}

export interface ScreenShare {
  sessionId: string;
  presenter: CollaborationUser;
  startTime: Date;
  endTime?: Date;
  quality: ScreenShareQuality;
  isRecording: boolean;
}

export enum ScreenShareQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HD = 'hd'
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  filename: string;
  duration: number;
  size: number;
  quality: VideoQuality;
  startTime: Date;
  endTime: Date;
  url: string;
  thumbnailUrl?: string;
}

export enum VideoQuality {
  LOW_240P = '240p',
  MEDIUM_480P = '480p',
  HIGH_720P = '720p',
  HD_1080P = '1080p'
}

export interface SessionPermission {
  type: SessionPermissionType;
  granted: boolean;
}

export enum SessionPermissionType {
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share',
  CHAT = 'chat',
  WHITEBOARD = 'whiteboard',
  RECORDING = 'recording'
}

// Component Props Interface
export interface CollaborationComponentProps {
  className?: string;
  user?: CollaborationUser;
  project?: Project;
  team?: Team;
  onUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}