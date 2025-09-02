export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  subcategory: string;
  tags: string[];
  type: 'workflow' | 'troubleshooting' | 'best-practice' | 'api-doc' | 'tutorial' | 'faq';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: Date;
  createdAt: Date;
  author: string;
  contributors: string[];
  rating: number;
  ratingCount: number;
  views: number;
  helpful: number;
  notHelpful: number;
  relatedItems: string[];
  prerequisites: string[];
  estimatedReadTime: number; // in minutes
  version: string;
  status: 'draft' | 'published' | 'archived' | 'under-review';
  attachments: Attachment[];
  metadata: {
    jurisdiction?: string;
    applicableVersions: string[];
    complianceRequirements: string[];
    lastReviewDate?: Date;
    nextReviewDate?: Date;
  };
}

export interface Attachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
  description?: string;
}

export interface SearchFilters {
  categories: string[];
  subcategories: string[];
  types: string[];
  difficulty: string[];
  tags: string[];
  authors: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  ratingRange: {
    min: number;
    max: number;
  };
  status: string[];
  jurisdiction?: string;
  hasAttachments?: boolean;
}

export interface SearchResult {
  items: KnowledgeBaseItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
  suggestions: string[];
  searchTime: number; // in milliseconds
}

export interface SearchFacets {
  categories: FacetCount[];
  types: FacetCount[];
  difficulty: FacetCount[];
  tags: FacetCount[];
  authors: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface CategoryTree {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  subcategories: CategoryTree[];
  icon?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  resultCount: number;
}

export interface UserPreferences {
  defaultFilters: Partial<SearchFilters>;
  bookmarkedItems: string[];
  searchHistory: SearchHistory[];
  preferredDifficulty: string[];
  preferredCategories: string[];
  notificationSettings: {
    newContent: boolean;
    contentUpdates: boolean;
    weeklyDigest: boolean;
  };
}

export interface ContentFeedback {
  itemId: string;
  userId: string;
  helpful: boolean;
  rating?: number;
  comment?: string;
  timestamp: Date;
  categories: string[]; // What aspects were helpful/not helpful
}

export interface ContentAnalytics {
  itemId: string;
  views: number;
  uniqueViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
  searchQueries: string[];
  referringSources: string[];
  userRoles: string[];
  deviceTypes: string[];
  timeDistribution: {
    hour: number;
    count: number;
  }[];
}

export interface AIRecommendation {
  item: KnowledgeBaseItem;
  score: number;
  reason: string;
  context: string[];
}

export interface SearchSuggestion {
  query: string;
  type: 'completion' | 'correction' | 'related';
  score: number;
  metadata?: {
    resultCount?: number;
    category?: string;
  };
}

export interface ContentValidation {
  itemId: string;
  validationDate: Date;
  validator: string;
  status: 'valid' | 'needs-update' | 'outdated' | 'incorrect';
  issues: ValidationIssue[];
  nextValidationDate: Date;
}

export interface ValidationIssue {
  type: 'accuracy' | 'completeness' | 'formatting' | 'compliance' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedFix?: string;
  autoFixable: boolean;
}

export interface KnowledgeBaseMetrics {
  totalItems: number;
  totalViews: number;
  averageRating: number;
  topCategories: FacetCount[];
  topSearchQueries: FacetCount[];
  contentGrowth: {
    date: Date;
    itemsAdded: number;
    itemsUpdated: number;
  }[];
  userEngagement: {
    activeUsers: number;
    averageSessionDuration: number;
    returnUserRate: number;
  };
  contentHealth: {
    upToDateItems: number;
    outdatedItems: number;
    draftItems: number;
    needsReviewItems: number;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'markdown' | 'json' | 'csv';
  includeAttachments: boolean;
  includeMetadata: boolean;
  template?: string;
  customFields?: string[];
}

export interface BulkOperation {
  operation: 'update' | 'delete' | 'move' | 'tag' | 'publish' | 'archive';
  itemIds: string[];
  parameters: Record<string, any>;
  scheduledFor?: Date;
  createdBy: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: KnowledgeBaseItem['type'];
  category: string;
  template: string; // Markdown template
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'approval';
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  dependencies: string[];
  outputs: Record<string, any>;
}

export interface ContentWorkflow {
  id: string;
  name: string;
  description: string;
  itemId: string;
  steps: WorkflowStep[];
  currentStep: string;
  status: 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AccessControl {
  itemId: string;
  permissions: {
    read: string[]; // User roles or specific user IDs
    write: string[];
    delete: string[];
    publish: string[];
  };
  publicAccess: boolean;
  restrictedFields?: string[];
  accessLog: AccessLogEntry[];
}

export interface AccessLogEntry {
  userId: string;
  action: 'view' | 'edit' | 'delete' | 'download';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: string;
}
