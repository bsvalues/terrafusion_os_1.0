import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  numeric,
  json,
  boolean,
  jsonb,
  date,
  varchar,
  index,
  real,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  TeamAgentRole as TeamMemberRole,
  TeamAgentStatus as TeamMemberStatus,
  TaskPriority,
  TaskStatus,
} from './team-agent-types';

// Terra Fusion Repository Marketplace Enums
export enum RepositoryVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  ORGANIZATION = 'organization',
}

export enum RepositoryType {
  MODULE = 'module',
  TEMPLATE = 'template',
  PLUGIN = 'plugin',
  LIBRARY = 'library',
  TOOL = 'tool',
  PROJECT = 'project',
  INTEGRATION = 'integration',
}

export enum RepositoryLicense {
  MIT = 'mit',
  APACHE_2 = 'apache-2.0',
  GPL_3 = 'gpl-3.0',
  BSD_3 = 'bsd-3-clause',
  PROPRIETARY = 'proprietary',
  CC_BY = 'cc-by',
  CC_BY_SA = 'cc-by-sa',
  OTHER = 'other',
}

// Agent Learning System Enums
export enum LearningEventType {
  USER_FEEDBACK = 'user_feedback',
  TASK_COMPLETION = 'task_completion',
  ERROR_RECOVERY = 'error_recovery',
  MODEL_IMPROVEMENT = 'model_improvement',
  COLLABORATIVE_LEARNING = 'collaborative_learning',
  KNOWLEDGE_TRANSFER = 'knowledge_transfer',
}

export enum FeedbackSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export enum LearningModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  PERPLEXITY = 'perplexity',
  INTERNAL = 'internal',
}

export enum AgentPerformanceMetricType {
  RESPONSE_TIME = 'response_time',
  ACCURACY = 'accuracy',
  USER_SATISFACTION = 'user_satisfaction',
  TASK_COMPLETION_RATE = 'task_completion_rate',
  ERROR_RATE = 'error_rate',
  LEARNING_RATE = 'learning_rate',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  API_CALLS = 'api_calls',
  TOKEN_USAGE = 'token_usage',
  AVAILABILITY = 'availability',
  LATENCY = 'latency',
}

// Energy and Productivity Tracking Enums
export enum DeveloperEnergyLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ProductivityMetricType {
  CODE_COMPLETION = 'code_completion',
  BUG_FIX = 'bug_fix',
  FEATURE_IMPLEMENTATION = 'feature_implementation',
  DOCUMENTATION = 'documentation',
  CODE_REVIEW = 'code_review',
  TESTING = 'testing',
  PLANNING = 'planning',
  MEETING = 'meeting',
  OTHER = 'other',
}

export enum FocusLevel {
  DEEP = 'deep',
  MODERATE = 'moderate',
  SHALLOW = 'shallow',
  DISTRACTED = 'distracted',
}

// Development Tools Enums

export enum ToolCategory {
  UI_UX_DESIGN = 'ui_ux_design',
  BUSINESS_INTELLIGENCE = 'business_intelligence',
  DEVELOPER_PRODUCTIVITY = 'developer_productivity',
  COLLABORATION = 'collaboration',
  DATA_INTEGRATION = 'data_integration',
  EXPERIMENTAL = 'experimental',
}

export enum ComponentType {
  LAYOUT = 'layout',
  INPUT = 'input',
  DISPLAY = 'display',
  NAVIGATION = 'navigation',
  FEEDBACK = 'feedback',
  DATA_DISPLAY = 'data_display',
  CUSTOM = 'custom',
}

export enum VisualizationType {
  BAR_CHART = 'bar_chart',
  LINE_CHART = 'line_chart',
  PIE_CHART = 'pie_chart',
  SCATTER_PLOT = 'scatter_plot',
  HEATMAP = 'heatmap',
  TABLE = 'table',
  MAP = 'map',
  DASHBOARD = 'dashboard',
  CUSTOM = 'custom',
}

export enum CodeSnippetType {
  FUNCTION = 'function',
  COMPONENT = 'component',
  UTILITY = 'utility',
  API_CALL = 'api_call',
  DATA_MODEL = 'data_model',
  TEST = 'test',
  CUSTOM = 'custom',
}

export enum CollaborationType {
  CODE_REVIEW = 'code_review',
  PAIR_PROGRAMMING = 'pair_programming',
  KNOWLEDGE_SHARING = 'knowledge_sharing',
  TEAM_COMMUNICATION = 'team_communication',
  CUSTOM = 'custom',
}

export enum DataPipelineType {
  IMPORT = 'import',
  EXPORT = 'export',
  TRANSFORM = 'transform',
  VALIDATE = 'validate',
  ENRICH = 'enrich',
  CUSTOM = 'custom',
}

// Enhanced Development Projects table - Stores information about enhanced development projects
export const enhancedDevProjects = pgTable(
  'enhanced_dev_projects',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdBy: integer('created_by').notNull(), // User ID who created the project
    projectType: text('project_type').notNull(), // Type of project: assessment_app, dashboard, data_pipeline, etc.
    configuration: jsonb('configuration'), // Project settings and configuration
    gitRepository: text('git_repository'), // Optional connection to Git repo
    isPublic: boolean('is_public').default(false),
    isTemplate: boolean('is_template').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('enhanced_dev_projects_name_idx').on(table.name),
      createdByIdx: index('enhanced_dev_projects_created_by_idx').on(table.createdBy),
    };
  }
);

export const insertEnhancedDevProjectSchema = createInsertSchema(enhancedDevProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EnhancedDevProject = typeof enhancedDevProjects.$inferSelect;
export type InsertEnhancedDevProject = z.infer<typeof insertEnhancedDevProjectSchema>;

// Development Project Files - Stores files related to development projects
export const developmentProjectFiles = pgTable(
  'development_project_files',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull(), // Foreign key to developmentProjects
    path: text('path').notNull(), // File path relative to project root
    content: text('content'), // File content
    lastModifiedBy: integer('last_modified_by').notNull(), // User ID who last modified
    fileType: text('file_type').notNull(), // js, ts, css, json, etc.
    isDirectory: boolean('is_directory').default(false),
    metadata: jsonb('metadata').default({}), // Additional metadata about the file
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      projectIdPathIdx: index('dev_project_files_project_path_idx').on(table.projectId, table.path),
    };
  }
);

export const insertDevelopmentProjectFileSchema = createInsertSchema(developmentProjectFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DevelopmentProjectFile = typeof developmentProjectFiles.$inferSelect;
export type InsertDevelopmentProjectFile = z.infer<typeof insertDevelopmentProjectFileSchema>;

// UI Component Templates - Reusable UI components for the Interactive Component Playground
export const uiComponentTemplates = pgTable(
  'ui_component_templates',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    componentType: text('component_type').notNull(), // Corresponds to ComponentType enum
    framework: text('framework').notNull(), // react, vue, svelte, etc.
    code: text('code').notNull(), // Component source code
    previewImage: text('preview_image'), // URL to preview image
    tags: text('tags').array(), // Tags for searching and filtering
    createdBy: integer('created_by').notNull(),
    isPublic: boolean('is_public').default(false),
    usageCount: integer('usage_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      createdByIdx: index('ui_component_templates_created_by_idx').on(table.createdBy),
      componentTypeIdx: index('ui_component_templates_type_idx').on(table.componentType),
    };
  }
);

export const insertUIComponentTemplateSchema = createInsertSchema(uiComponentTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export type UIComponentTemplate = typeof uiComponentTemplates.$inferSelect;
export type InsertUIComponentTemplate = z.infer<typeof insertUIComponentTemplateSchema>;

// Design Systems - Store design system configurations for the Design System Generator
export const designSystems = pgTable(
  'design_systems',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    primaryColor: text('primary_color').notNull(),
    secondaryColor: text('secondary_color').notNull(),
    accentColor: text('accent_color'),
    typography: jsonb('typography').notNull(), // Font families, sizes, weights, etc.
    spacing: jsonb('spacing').notNull(), // Spacing scale
    borderRadius: jsonb('border_radius'), // Border radius scale
    shadows: jsonb('shadows'), // Shadow definitions
    darkMode: boolean('dark_mode').default(false),
    accessibilityLevel: text('accessibility_level').default('AA'), // AA, AAA
    createdBy: integer('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('design_systems_name_idx').on(table.name),
      createdByIdx: index('design_systems_created_by_idx').on(table.createdBy),
    };
  }
);

export const insertDesignSystemSchema = createInsertSchema(designSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DesignSystem = typeof designSystems.$inferSelect;
export type InsertDesignSystem = z.infer<typeof insertDesignSystemSchema>;

// Data Visualizations - Store saved visualizations for the Data Visualization Workshop
export const dataVisualizations = pgTable(
  'data_visualizations',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    visualizationType: text('visualization_type').notNull(), // Corresponds to VisualizationType enum
    dataSource: jsonb('data_source').notNull(), // Query, API endpoint, etc.
    configuration: jsonb('configuration').notNull(), // Visualization-specific configuration
    previewImage: text('preview_image'), // URL to preview image
    createdBy: integer('created_by').notNull(),
    isPublic: boolean('is_public').default(false),
    viewCount: integer('view_count').default(0),
    lastViewed: timestamp('last_viewed'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('data_visualizations_name_idx').on(table.name),
      createdByIdx: index('data_visualizations_created_by_idx').on(table.createdBy),
      typeIdx: index('data_visualizations_type_idx').on(table.visualizationType),
    };
  }
);

export const insertDataVisualizationSchema = createInsertSchema(dataVisualizations).omit({
  id: true,
  viewCount: true,
  lastViewed: true,
  createdAt: true,
  updatedAt: true,
});

export type DataVisualization = typeof dataVisualizations.$inferSelect;
export type InsertDataVisualization = z.infer<typeof insertDataVisualizationSchema>;

// Code Snippets - Store code snippets for the Smart Code Snippets Library
export const codeSnippets = pgTable(
  'code_snippets',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    language: text('language').notNull(), // javascript, typescript, python, etc.
    snippetType: text('snippet_type').notNull(), // Corresponds to CodeSnippetType enum
    code: text('code').notNull(), // Snippet source code
    tags: text('tags').array(), // Tags for searching and filtering
    createdBy: integer('created_by').notNull(),
    isPublic: boolean('is_public').default(false),
    usageCount: integer('usage_count').default(0),
    aiGenerated: boolean('ai_generated').default(false),
    aiModel: text('ai_model'), // If generated by AI, which model
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      languageTypeIdx: index('code_snippets_language_type_idx').on(
        table.language,
        table.snippetType
      ),
      createdByIdx: index('code_snippets_created_by_idx').on(table.createdBy),
    };
  }
);

export const insertCodeSnippetSchema = createInsertSchema(codeSnippets).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export type CodeSnippet = typeof codeSnippets.$inferSelect;
export type InsertCodeSnippet = z.infer<typeof insertCodeSnippetSchema>;

// Data Pipelines - Store data pipeline configurations for the Data Pipeline Designer
export const dataPipelines = pgTable(
  'data_pipelines',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    pipelineType: text('pipeline_type').notNull(), // Corresponds to DataPipelineType enum
    configuration: jsonb('configuration').notNull(), // Pipeline configuration
    steps: jsonb('steps').notNull(), // Array of pipeline steps
    schedule: text('schedule'), // CRON expression for scheduled execution
    lastRunStatus: text('last_run_status'), // success, failed, running
    lastRunTime: timestamp('last_run_time'),
    createdBy: integer('created_by').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('data_pipelines_name_idx').on(table.name),
      createdByIdx: index('data_pipelines_created_by_idx').on(table.createdBy),
      typeIdx: index('data_pipelines_type_idx').on(table.pipelineType),
    };
  }
);

export const insertDataPipelineSchema = createInsertSchema(dataPipelines).omit({
  id: true,
  lastRunStatus: true,
  lastRunTime: true,
  createdAt: true,
  updatedAt: true,
});

export type DataPipeline = typeof dataPipelines.$inferSelect;
export type InsertDataPipeline = z.infer<typeof insertDataPipelineSchema>;

// Debugging Sessions - Store debugging sessions for the Intelligent Debugging Assistant
export const debuggingSessions = pgTable(
  'debugging_sessions',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    projectId: integer('project_id').notNull(), // Reference to developmentProjects
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    errorLocation: jsonb('error_location'), // file, line, column
    status: text('status').default('open'), // open, resolved, closed
    resolution: text('resolution'),
    steps: jsonb('steps').array(), // Steps taken to debug the issue
    createdBy: integer('created_by').notNull(),
    aiAssisted: boolean('ai_assisted').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  table => {
    return {
      projectIdIdx: index('debugging_sessions_project_id_idx').on(table.projectId),
      createdByIdx: index('debugging_sessions_created_by_idx').on(table.createdBy),
    };
  }
);

export const insertDebuggingSessionSchema = createInsertSchema(debuggingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export type DebuggingSession = typeof debuggingSessions.$inferSelect;
export type InsertDebuggingSession = z.infer<typeof insertDebuggingSessionSchema>;

// API Documentation - Store API documentation for the API Playground
export const apiDocumentation = pgTable(
  'api_documentation',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    baseUrl: text('base_url').notNull(),
    version: text('version').notNull(),
    endpoints: jsonb('endpoints').notNull(), // Array of endpoint documentation
    authentication: jsonb('authentication'), // Authentication methods
    schemas: jsonb('schemas'), // Data schemas
    examples: jsonb('examples'), // Example requests/responses
    createdBy: integer('created_by').notNull(),
    isPublic: boolean('is_public').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameVersionIdx: index('api_documentation_name_version_idx').on(table.name, table.version),
      createdByIdx: index('api_documentation_created_by_idx').on(table.createdBy),
    };
  }
);

export const insertAPIDocumentationSchema = createInsertSchema(apiDocumentation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type APIDocumentation = typeof apiDocumentation.$inferSelect;
export type InsertAPIDocumentation = z.infer<typeof insertAPIDocumentationSchema>;

// Terrafusion Repository Marketplace Tables

// Repositories - Stores repositories available in the Terrafusion marketplace
export const repositories = pgTable(
  'repositories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    readmeContent: text('readme_content'), // Markdown content for the README
    repositoryType: text('repository_type').notNull(), // Corresponds to RepositoryType enum
    visibility: text('visibility').notNull().default('private'), // Corresponds to RepositoryVisibility enum
    license: text('license').default('mit'), // Corresponds to RepositoryLicense enum
    stars: integer('stars').default(0),
    forks: integer('forks').default(0),
    downloads: integer('downloads').default(0),
    gitUrl: text('git_url'), // Git URL for cloning
    websiteUrl: text('website_url'), // Optional website
    logoUrl: text('logo_url'), // Repository logo URL
    ownerId: integer('owner_id').notNull(), // User ID who owns the repository
    organizationId: integer('organization_id'), // Optional organization ID
    tags: text('tags').array(), // Tags for searching and filtering
    featured: boolean('featured').default(false), // Whether this is a featured repository
    verified: boolean('verified').default(false), // Whether this is a verified repository
    metadata: jsonb('metadata').default({}), // Additional metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('repositories_name_idx').on(table.name),
      ownerIdIdx: index('repositories_owner_id_idx').on(table.ownerId),
      repoTypeIdx: index('repositories_type_idx').on(table.repositoryType),
    };
  }
);

export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  stars: true,
  forks: true,
  downloads: true,
  featured: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
});

export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;

// Repository Versions - Stores different versions of repositories
export const repositoryVersions = pgTable(
  'repository_versions',
  {
    id: serial('id').primaryKey(),
    repositoryId: integer('repository_id').notNull(), // Foreign key to repositories
    version: text('version').notNull(), // Semantic version (e.g., "1.0.0")
    releaseNotes: text('release_notes'), // Markdown release notes
    commitHash: text('commit_hash'), // Git commit hash
    compatibilityInfo: jsonb('compatibility_info'), // Version compatibility information
    downloadUrl: text('download_url'), // URL to download this version
    isLatest: boolean('is_latest').default(false),
    isStable: boolean('is_stable').default(true),
    publishedBy: integer('published_by').notNull(), // User ID who published this version
    downloads: integer('downloads').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      repoIdVersionIdx: index('repo_versions_repo_id_version_idx').on(
        table.repositoryId,
        table.version
      ),
    };
  }
);

export const insertRepositoryVersionSchema = createInsertSchema(repositoryVersions).omit({
  id: true,
  downloads: true,
  createdAt: true,
});

export type RepositoryVersion = typeof repositoryVersions.$inferSelect;
export type InsertRepositoryVersion = z.infer<typeof insertRepositoryVersionSchema>;

// Repository Reviews - Stores user reviews of repositories
export const repositoryReviews = pgTable(
  'repository_reviews',
  {
    id: serial('id').primaryKey(),
    repositoryId: integer('repository_id').notNull(), // Foreign key to repositories
    userId: integer('user_id').notNull(), // User who wrote the review
    rating: integer('rating').notNull(), // 1-5 star rating
    reviewText: text('review_text'), // Review content
    versionUsed: text('version_used'), // Version being reviewed
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      repoUserIdx: index('repo_reviews_repo_user_idx').on(table.repositoryId, table.userId),
    };
  }
);

export const insertRepositoryReviewSchema = createInsertSchema(repositoryReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RepositoryReview = typeof repositoryReviews.$inferSelect;
export type InsertRepositoryReview = z.infer<typeof insertRepositoryReviewSchema>;

// Intelligent Development Workflow Optimizer Enums
export enum WorkflowOptimizationType {
  CODE_QUALITY = 'code_quality',
  PERFORMANCE = 'performance',
  ARCHITECTURE = 'architecture',
  SECURITY = 'security',
  BEST_PRACTICES = 'best_practices',
  DEVELOPER_PRODUCTIVITY = 'developer_productivity',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
}

export enum WorkflowOptimizationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WorkflowOptimizationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Workflow Optimization Requests - Stores requests for workflow optimizations
export const workflowOptimizationRequests = pgTable(
  'workflow_optimization_requests',
  {
    id: serial('id').primaryKey(),
    requestId: uuid('request_id').notNull().unique().defaultRandom(),
    repositoryId: integer('repository_id'), // Optional link to a repository
    userId: integer('user_id').notNull(), // User who requested the optimization
    title: text('title').notNull(),
    description: text('description'),
    codebase: text('codebase'), // Path to codebase for analysis or stored code
    optimizationType: text('optimization_type').notNull(), // Corresponds to WorkflowOptimizationType enum
    priority: text('priority').default('medium'), // Corresponds to WorkflowOptimizationPriority enum
    status: text('status').notNull().default('pending'), // Corresponds to WorkflowOptimizationStatus enum
    tags: text('tags').array(), // Tags for categorization
    settings: jsonb('settings').default({}), // Configuration settings for the analysis
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      userIdIdx: index('workflow_optimization_user_id_idx').on(table.userId),
      statusIdx: index('workflow_optimization_status_idx').on(table.status),
      typeIdx: index('workflow_optimization_type_idx').on(table.optimizationType),
    };
  }
);

export const insertWorkflowOptimizationRequestSchema = createInsertSchema(
  workflowOptimizationRequests
)
  .omit({
    id: true,
    requestId: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    status: z.nativeEnum(WorkflowOptimizationStatus).optional(),
    optimizationType: z.nativeEnum(WorkflowOptimizationType),
    priority: z.nativeEnum(WorkflowOptimizationPriority).optional(),
  });

export type WorkflowOptimizationRequest = typeof workflowOptimizationRequests.$inferSelect;
export type InsertWorkflowOptimizationRequest = z.infer<
  typeof insertWorkflowOptimizationRequestSchema
>;

// Workflow Optimization Results - Stores results of workflow optimizations
export const workflowOptimizationResults = pgTable(
  'workflow_optimization_results',
  {
    id: serial('id').primaryKey(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => workflowOptimizationRequests.requestId),
    summary: text('summary').notNull(), // Summary of the optimization analysis
    recommendationsJson: jsonb('recommendations_json').notNull(), // Detailed recommendations as JSON
    improvementScore: numeric('improvement_score'), // Potential improvement score (0-100)
    runTime: integer('run_time'), // Time taken for analysis in milliseconds
    modelUsed: text('model_used'), // LLM model used for analysis
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      requestIdIdx: index('workflow_optimization_result_request_id_idx').on(table.requestId),
    };
  }
);

export const insertWorkflowOptimizationResultSchema = createInsertSchema(
  workflowOptimizationResults
).omit({
  id: true,
  createdAt: true,
});

export type WorkflowOptimizationResult = typeof workflowOptimizationResults.$inferSelect;
export type InsertWorkflowOptimizationResult = z.infer<
  typeof insertWorkflowOptimizationResultSchema
>;

// Repository Dependencies - Stores dependencies between repositories
export const repositoryDependencies = pgTable(
  'repository_dependencies',
  {
    id: serial('id').primaryKey(),
    repositoryId: integer('repository_id').notNull(), // Repository that has dependencies
    dependencyRepoId: integer('dependency_repo_id').notNull(), // Repository that is a dependency
    versionRange: text('version_range').notNull(), // Semver range (e.g., "^1.0.0")
    dependencyType: text('dependency_type').default('runtime'), // runtime, development, optional, peer
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      repoDependencyIdx: index('repo_dependencies_ids_idx').on(
        table.repositoryId,
        table.dependencyRepoId
      ),
    };
  }
);

export const insertRepositoryDependencySchema = createInsertSchema(repositoryDependencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RepositoryDependency = typeof repositoryDependencies.$inferSelect;
export type InsertRepositoryDependency = z.infer<typeof insertRepositoryDependencySchema>;

// Enhanced Team Collaboration Sessions - Store team collaboration sessions for the Collaboration Space
export const enhancedTeamSessions = pgTable(
  'enhanced_team_sessions',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    collaborationType: text('collaboration_type').notNull(), // Corresponds to CollaborationType enum
    projectId: integer('project_id'), // Optional reference to developmentProjects
    status: text('status').default('active'), // active, completed, archived
    participants: jsonb('participants').notNull(), // Array of user IDs and roles
    aiParticipants: jsonb('ai_participants'), // Array of AI agent IDs and roles
    artifacts: jsonb('artifacts'), // Files, code snippets, etc. produced during session
    createdBy: integer('created_by').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('enhanced_team_sessions_name_idx').on(table.name),
      createdByIdx: index('enhanced_team_sessions_created_by_idx').on(table.createdBy),
      typeIdx: index('enhanced_team_sessions_type_idx').on(table.collaborationType),
    };
  }
);

export const insertEnhancedTeamSessionSchema = createInsertSchema(enhancedTeamSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type EnhancedTeamSession = typeof enhancedTeamSessions.$inferSelect;
export type InsertEnhancedTeamSession = z.infer<typeof insertEnhancedTeamSessionSchema>;

// Learning Paths - Store learning paths for the Learning Path Creator
export const learningPaths = pgTable(
  'learning_paths',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    difficultyLevel: text('difficulty_level').notNull(), // beginner, intermediate, advanced
    estimatedHours: integer('estimated_hours'),
    topics: text('topics').array(),
    prerequisites: jsonb('prerequisites'),
    modules: jsonb('modules').notNull(), // Array of learning modules
    resources: jsonb('resources'), // Additional learning resources
    createdBy: integer('created_by').notNull(),
    isPublic: boolean('is_public').default(false),
    enrollmentCount: integer('enrollment_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('learning_paths_name_idx').on(table.name),
      createdByIdx: index('learning_paths_created_by_idx').on(table.createdBy),
      difficultyIdx: index('learning_paths_difficulty_idx').on(table.difficultyLevel),
    };
  }
);

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  enrollmentCount: true,
  createdAt: true,
  updatedAt: true,
});

export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;

// Assistant Personality Theme Types
export enum AssistantPersonalityTheme {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  TECHNICAL = 'technical',
  CREATIVE = 'creative',
  CONCISE = 'concise',
  CUSTOM = 'custom',
}

// Workspace Theme Types
export enum WorkspaceTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
  HIGH_CONTRAST = 'high_contrast',
}

// Code Editor Theme Types
export enum CodeEditorTheme {
  LIGHT = 'light',
  DARK = 'dark',
  MONOKAI = 'monokai',
  GITHUB = 'github',
  DRACULA = 'dracula',
  NORD = 'nord',
  SOLARIZED_LIGHT = 'solarized_light',
  SOLARIZED_DARK = 'solarized_dark',
  CUSTOM = 'custom',
}

// Workspace Layout Types
export enum WorkspaceLayout {
  STANDARD = 'standard',
  COMPACT = 'compact',
  EXPANDED = 'expanded',
  CUSTOM = 'custom',
}

// Developer Agent Specialization
export enum DeveloperAgentSpecialization {
  FULL_STACK = 'full_stack',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  DEVOPS = 'devops',
  UI_UX = 'ui_ux',
  ACCESSIBILITY = 'accessibility',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  TESTING = 'testing',
  CUSTOM = 'custom',
}

// Enum definitions for validation and workflow
export enum RuleCategory {
  CLASSIFICATION = 'classification',
  VALUATION = 'valuation',
  PROPERTY_DATA = 'property_data',
  COMPLIANCE = 'compliance',
  DATA_QUALITY = 'data_quality',
  GEO_SPATIAL = 'geo_spatial',
  STATISTICAL = 'statistical',
}

export enum RuleLevel {
  CRITICAL = 'critical', // Blocking issue, must be resolved
  ERROR = 'error', // Significant issue that should be addressed
  WARNING = 'warning', // Potential issue that should be reviewed
  INFO = 'info', // Informational finding
}

export enum EntityType {
  PROPERTY = 'property',
  LAND_RECORD = 'land_record',
  IMPROVEMENT = 'improvement',
  APPEAL = 'appeal',
  USER = 'user',
  COMPARABLE_SALE = 'comparable_sale',
  WORKFLOW = 'workflow',
}

export enum MessageEventType {
  COMMAND = 'COMMAND',
  EVENT = 'EVENT',
  QUERY = 'QUERY',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
  STATUS_UPDATE = 'STATUS_UPDATE',
  ASSISTANCE_REQUESTED = 'ASSISTANCE_REQUESTED',
}

// Agent Message Priority Levels
export enum MessagePriority {
  LOW = 'low', // Background or non-time-sensitive messages
  NORMAL = 'normal', // Default priority
  HIGH = 'high', // Important messages that should be processed soon
  URGENT = 'urgent', // Critical messages that need immediate attention
  SYSTEM = 'system', // System-level messages (highest priority)
}

export enum IssueStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  WAIVED = 'waived',
}

// Data Lineage Record table
export const dataLineageRecords = pgTable('data_lineage_records', {
  id: serial('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  fieldName: text('field_name').notNull(),
  oldValue: text('old_value').notNull(),
  newValue: text('new_value').notNull(),
  changeTimestamp: timestamp('change_timestamp').notNull(),
  source: text('source').notNull(), // import, manual, api, calculated, validated, correction
  userId: integer('user_id').notNull(),
  sourceDetails: jsonb('source_details').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertDataLineageRecordSchema = createInsertSchema(dataLineageRecords).pick({
  propertyId: true,
  fieldName: true,
  oldValue: true,
  newValue: true,
  changeTimestamp: true,
  source: true,
  userId: true,
  sourceDetails: true,
});

export enum AppealStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  SCHEDULED = 'scheduled',
  HEARD = 'heard',
  DECIDED = 'decided',
  WITHDRAWN = 'withdrawn',
}

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  email: true,
});

// Properties table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  propertyId: text('property_id').notNull().unique(),
  address: text('address').notNull(),
  parcelNumber: text('parcel_number').notNull(),
  propertyType: text('property_type').notNull(),
  acres: numeric('acres').notNull(),
  value: numeric('value'),
  status: text('status').notNull().default('active'),
  extraFields: jsonb('extra_fields').default({}),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  propertyId: true,
  address: true,
  parcelNumber: true,
  propertyType: true,
  acres: true,
  value: true,
  status: true,
  extraFields: true,
});

// Land Records table
export const landRecords = pgTable('land_records', {
  id: serial('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  landUseCode: text('land_use_code').notNull(),
  zoning: text('zoning').notNull(),
  topography: text('topography'),
  frontage: numeric('frontage'),
  depth: numeric('depth'),
  shape: text('shape'),
  utilities: text('utilities'),
  floodZone: text('flood_zone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const insertLandRecordSchema = createInsertSchema(landRecords).pick({
  propertyId: true,
  landUseCode: true,
  zoning: true,
  topography: true,
  frontage: true,
  depth: true,
  shape: true,
  utilities: true,
  floodZone: true,
});

// Improvements table
export const improvements = pgTable('improvements', {
  id: serial('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  improvementType: text('improvement_type').notNull(),
  yearBuilt: integer('year_built'),
  squareFeet: numeric('square_feet'),
  bedrooms: integer('bedrooms'),
  bathrooms: numeric('bathrooms'),
  quality: text('quality'),
  condition: text('condition'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const insertImprovementSchema = createInsertSchema(improvements).pick({
  propertyId: true,
  improvementType: true,
  yearBuilt: true,
  squareFeet: true,
  bedrooms: true,
  bathrooms: true,
  quality: true,
  condition: true,
});

// Fields table
export const fields = pgTable('fields', {
  id: serial('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  fieldType: text('field_type').notNull(),
  fieldValue: text('field_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const insertFieldSchema = createInsertSchema(fields).pick({
  propertyId: true,
  fieldType: true,
  fieldValue: true,
});

// Appeals table (renamed from protests for clarity)
export const appeals = pgTable('appeals', {
  id: serial('id').primaryKey(),
  appealNumber: text('appeal_number').notNull().unique(), // Unique identifier for the appeal
  propertyId: text('property_id').notNull(),
  userId: integer('user_id').notNull(),
  appealType: text('appeal_type').notNull().default('value'), // value, classification, exemption
  reason: text('reason').notNull(),
  evidenceUrls: text('evidence_urls').array(),
  requestedValue: numeric('requested_value'), // Value requested by appellant
  dateReceived: timestamp('date_received').defaultNow().notNull(),
  hearingDate: timestamp('hearing_date'),
  hearingLocation: text('hearing_location'),
  assignedTo: integer('assigned_to'), // Staff ID assigned to handle this appeal
  status: text('status').notNull().default('submitted'), // submitted, reviewing, scheduled, heard, decided, withdrawn
  decision: text('decision'), // granted, denied, partial
  decisionReason: text('decision_reason'),
  decisionDate: timestamp('decision_date'),
  notificationSent: boolean('notification_sent').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const insertAppealSchema = createInsertSchema(appeals).pick({
  appealNumber: true,
  propertyId: true,
  userId: true,
  appealType: true,
  reason: true,
  evidenceUrls: true,
  requestedValue: true,
  dateReceived: true,
  hearingDate: true,
  hearingLocation: true,
  assignedTo: true,
  status: true,
});

// Appeal comments table for tracking communications
export const appealComments = pgTable('appeal_comments', {
  id: serial('id').primaryKey(),
  appealId: integer('appeal_id').notNull(),
  userId: integer('user_id').notNull(),
  comment: text('comment').notNull(),
  internalOnly: boolean('internal_only').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertAppealCommentSchema = createInsertSchema(appealComments).pick({
  appealId: true,
  userId: true,
  comment: true,
  internalOnly: true,
});

// Appeal evidence items table
export const appealEvidence = pgTable('appeal_evidence', {
  id: serial('id').primaryKey(),
  appealId: integer('appeal_id').notNull(),
  documentType: text('document_type').notNull(), // photo, assessment, appraisal, etc.
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  uploadedBy: integer('uploaded_by').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertAppealEvidenceSchema = createInsertSchema(appealEvidence).pick({
  appealId: true,
  documentType: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  uploadedBy: true,
  description: true,
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: json('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipAddress: text('ip_address'),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
  ipAddress: true,
});

// AI Agents table
export const aiAgents = pgTable('ai_agents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  performance: integer('performance').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).pick({
  name: true,
  type: true,
  status: true,
  performance: true,
});

// Developer Energy and Productivity Metrics table
export const developerProductivityMetrics = pgTable(
  'developer_productivity_metrics',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(), // Foreign key to users table
    date: date('date').notNull().defaultNow(),
    energyLevel: text('energy_level').notNull(), // Corresponds to DeveloperEnergyLevel enum
    focusLevel: text('focus_level').notNull(), // Corresponds to FocusLevel enum
    productiveHours: numeric('productive_hours').notNull(),
    distractionCount: integer('distraction_count').default(0),
    completedTasks: integer('completed_tasks').default(0),
    tasksInProgress: integer('tasks_in_progress').default(0),
    blockedTasks: integer('blocked_tasks').default(0),
    codeLines: integer('code_lines').default(0),
    commitCount: integer('commit_count').default(0),
    notes: text('notes'),
    tags: text('tags').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      userDateIdx: index('dev_productivity_user_date_idx').on(table.userId, table.date),
      energyLevelIdx: index('dev_productivity_energy_level_idx').on(table.energyLevel),
    };
  }
);

export const insertDeveloperProductivityMetricSchema = createInsertSchema(
  developerProductivityMetrics
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DeveloperProductivityMetric = typeof developerProductivityMetrics.$inferSelect;
export type InsertDeveloperProductivityMetric = z.infer<
  typeof insertDeveloperProductivityMetricSchema
>;

// Developer Activity Sessions table - Tracks individual work sessions
export const developerActivitySessions = pgTable(
  'developer_activity_sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(), // Foreign key to users table
    metricId: integer('metric_id'), // Foreign key to developerProductivityMetrics
    startTime: timestamp('start_time').notNull().defaultNow(),
    endTime: timestamp('end_time'),
    duration: integer('duration'), // In minutes, calculated when session ends
    activityType: text('activity_type').notNull(), // Corresponds to ProductivityMetricType enum
    projectId: integer('project_id'), // Optional foreign key to projects
    description: text('description'),
    codeLines: integer('code_lines').default(0),
    isCompleted: boolean('is_completed').default(false),
    details: jsonb('details').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      userActivityIdx: index('dev_activity_user_activity_idx').on(table.userId, table.activityType),
      timeRangeIdx: index('dev_activity_time_range_idx').on(table.startTime, table.endTime),
    };
  }
);

export const insertDeveloperActivitySessionSchema = createInsertSchema(
  developerActivitySessions
).omit({
  id: true,
  duration: true,
  createdAt: true,
  updatedAt: true,
});

export type DeveloperActivitySession = typeof developerActivitySessions.$inferSelect;
export type InsertDeveloperActivitySession = z.infer<typeof insertDeveloperActivitySessionSchema>;

// Energy Level Recommendations - Store personalized productivity recommendations
export const energyLevelRecommendations = pgTable(
  'energy_level_recommendations',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(), // Foreign key to users table
    energyLevel: text('energy_level').notNull(), // Corresponds to DeveloperEnergyLevel enum
    recommendedActivities: jsonb('recommended_activities').default([]), // Array of recommended tasks for this energy level
    avoidActivities: jsonb('avoid_activities').default([]), // Array of tasks to avoid at this energy level
    bestTimeOfDay: text('best_time_of_day'), // morning, afternoon, evening
    strategies: text('strategies').array(), // Productivity strategies that work for this user at this energy level
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      userEnergyLevelIdx: index('energy_rec_user_level_idx').on(table.userId, table.energyLevel),
    };
  }
);

export const insertEnergyLevelRecommendationSchema = createInsertSchema(
  energyLevelRecommendations
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EnergyLevelRecommendation = typeof energyLevelRecommendations.$inferSelect;
export type InsertEnergyLevelRecommendation = z.infer<typeof insertEnergyLevelRecommendationSchema>;

// System Activities table
export const systemActivities = pgTable('system_activities', {
  id: serial('id').primaryKey(),
  activity_type: text('activity_type').notNull(),
  component: text('component').notNull(),
  activity: text('activity').notNull(),
  entity_type: text('entity_type'),
  entity_id: text('entity_id'),
  agent_id: integer('agent_id'),
  status: text('status').default('info').notNull(),
  details: jsonb('details').default({}).notNull(),
  timestamp: timestamp('created_at').defaultNow().notNull(),
});

export const insertSystemActivitySchema = createInsertSchema(systemActivities).omit({
  id: true,
  timestamp: true,
});

// MCP Tool Execution Logs table
export const mcpToolExecutionLogs = pgTable('mcp_tool_execution_logs', {
  id: serial('id').primaryKey(),
  toolName: text('tool_name').notNull(),
  requestId: text('request_id').notNull(),
  agentId: integer('agent_id'),
  userId: integer('user_id'),
  parameters: jsonb('parameters').default({}),
  status: text('status').notNull(), // starting, success, error
  result: jsonb('result'),
  error: text('error'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertMCPToolExecutionLogSchema = createInsertSchema(mcpToolExecutionLogs).pick({
  toolName: true,
  requestId: true,
  agentId: true,
  userId: true,
  parameters: true,
  status: true,
  result: true,
  error: true,
  startTime: true,
  endTime: true,
});

// PACS Modules table
export const pacsModules = pgTable('pacs_modules', {
  id: serial('id').primaryKey(),
  moduleName: text('module_name').notNull().unique(),
  source: text('source').notNull(),
  integration: text('integration').notNull(),
  description: text('description'),
  category: text('category'),
  apiEndpoints: jsonb('api_endpoints'),
  dataSchema: jsonb('data_schema'),
  syncStatus: text('sync_status').default('pending'),
  lastSyncTimestamp: timestamp('last_sync_timestamp'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertPacsModuleSchema = createInsertSchema(pacsModules).pick({
  moduleName: true,
  source: true,
  integration: true,
  description: true,
  category: true,
  apiEndpoints: true,
  dataSchema: true,
  syncStatus: true,
  lastSyncTimestamp: true,
});

// Agent Messages table for inter-agent communication
export const agentMessages = pgTable('agent_messages', {
  id: serial('id').primaryKey(),
  messageId: text('message_id').notNull().unique(), // UUID for message identification
  conversationId: text('conversation_id'), // Thread/conversation ID for related messages
  senderAgentId: text('sender_agent_id').notNull(), // ID of agent sending the message
  receiverAgentId: text('receiver_agent_id'), // ID of agent receiving the message (null for broadcasts)
  messageType: text('message_type').notNull(), // Corresponds to MessageEventType enum
  subject: text('subject').notNull(), // Brief summary of message content
  content: jsonb('content').notNull(), // Structured message content
  contextData: jsonb('context_data').default({}), // Additional context for the message
  priority: text('priority').notNull().default('normal'), // Corresponds to MessagePriority enum
  status: text('status').notNull().default('pending'), // pending, delivered, processed, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at'), // When message was received
  processedAt: timestamp('processed_at'), // When message was fully processed
  retryCount: integer('retry_count').default(0), // Number of delivery attempts
  expiresAt: timestamp('expires_at'), // Optional TTL for message
  correlationId: text('correlation_id'), // ID for correlating messages (request/response)
  isAcknowledged: boolean('is_acknowledged').default(false), // Whether receipt was acknowledged
});

export const insertAgentMessageSchema = createInsertSchema(agentMessages).pick({
  messageId: true,
  conversationId: true,
  senderAgentId: true,
  receiverAgentId: true,
  messageType: true,
  subject: true,
  content: true,
  contextData: true,
  priority: true,
  status: true,
  expiresAt: true,
  correlationId: true,
});

// Development Platform - Project Types
export enum DevProjectType {
  WEB_APP = 'web_app',
  API = 'api',
  SCRIPT = 'script',
  ASSESSMENT_MODULE = 'assessment_module',
  INTEGRATION = 'integration',
  VISUALIZATION = 'visualization',
}

export enum DevProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum DevFileType {
  FILE = 'FILE',
  DIRECTORY = 'DIRECTORY',
}

export enum DevPreviewStatus {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
}

// Development Platform - Projects table
export const devProjects = pgTable('dev_projects', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').notNull().unique().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  language: text('language').notNull(),
  framework: text('framework'),
  status: text('status').notNull().default(DevProjectStatus.DRAFT),
  createdBy: integer('created_by').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertDevProjectSchema = createInsertSchema(devProjects)
  .pick({
    name: true,
    description: true,
    type: true,
    language: true,
    framework: true,
    createdBy: true,
  })
  .extend({
    status: z.nativeEnum(DevProjectStatus).optional(),
  });

// Development Platform - Project Files table
export const devProjectFiles = pgTable('dev_project_files', {
  id: serial('id').primaryKey(),
  fileId: serial('file_id').notNull(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => devProjects.projectId),
  path: text('path').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  content: text('content').default(''),
  size: integer('size').default(0),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdBy: integer('created_by').notNull(),
  parentPath: text('parent_path'),
});

export const insertDevProjectFileSchema = createInsertSchema(devProjectFiles).pick({
  projectId: true,
  path: true,
  name: true,
  type: true,
  content: true,
  size: true,
  createdBy: true,
  parentPath: true,
});

// Development Platform - Project Templates table
export const devProjectTemplates = pgTable('dev_project_templates', {
  id: serial('id').primaryKey(),
  templateId: uuid('template_id').notNull().unique().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  language: text('language').notNull(),
  category: text('category'),
  isOfficial: boolean('is_official').default(false),
  fileStructure: jsonb('file_structure').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertDevProjectTemplateSchema = createInsertSchema(devProjectTemplates).pick({
  name: true,
  description: true,
  type: true,
  language: true,
  category: true,
  isOfficial: true,
  fileStructure: true,
});

// Development Platform - Preview Settings table
export const devPreviewSettings = pgTable('dev_preview_settings', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => devProjects.projectId)
    .unique(),
  status: text('status').notNull().default(DevPreviewStatus.STOPPED),
  port: integer('port'),
  command: text('command').notNull().default('npm run dev'),
  autoRefresh: boolean('auto_refresh').default(true),
  lastStarted: timestamp('last_started'),
  lastStopped: timestamp('last_stopped'),
  logs: text('logs').array(),
});

export const insertDevPreviewSettingsSchema = createInsertSchema(devPreviewSettings).pick({
  projectId: true,
  command: true,
  autoRefresh: true,
});

// Define type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type LandRecord = typeof landRecords.$inferSelect;
export type InsertLandRecord = z.infer<typeof insertLandRecordSchema>;

export type Improvement = typeof improvements.$inferSelect;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;

export type Field = typeof fields.$inferSelect;
export type InsertField = z.infer<typeof insertFieldSchema>;

export type Appeal = typeof appeals.$inferSelect;
export type InsertAppeal = z.infer<typeof insertAppealSchema>;

export type AppealComment = typeof appealComments.$inferSelect;
export type InsertAppealComment = z.infer<typeof insertAppealCommentSchema>;

export type AppealEvidence = typeof appealEvidence.$inferSelect;
export type InsertAppealEvidence = z.infer<typeof insertAppealEvidenceSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;

export type SystemActivity = typeof systemActivities.$inferSelect;
export type InsertSystemActivity = z.infer<typeof insertSystemActivitySchema>;

export type MCPToolExecutionLog = typeof mcpToolExecutionLogs.$inferSelect;
export type InsertMCPToolExecutionLog = z.infer<typeof insertMCPToolExecutionLogSchema>;

export type PacsModule = typeof pacsModules.$inferSelect;
export type InsertPacsModule = z.infer<typeof insertPacsModuleSchema>;

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;

// Development Platform Types
export type DevProject = typeof devProjects.$inferSelect;
export type InsertDevProject = z.infer<typeof insertDevProjectSchema>;

export type DevProjectFile = typeof devProjectFiles.$inferSelect;
export type InsertDevProjectFile = z.infer<typeof insertDevProjectFileSchema>;

export type DevProjectTemplate = typeof devProjectTemplates.$inferSelect;
export type InsertDevProjectTemplate = z.infer<typeof insertDevProjectTemplateSchema>;

export type DevPreviewSettings = typeof devPreviewSettings.$inferSelect;
export type InsertDevPreviewSettings = z.infer<typeof insertDevPreviewSettingsSchema>;

// Code Improvement Enums
export enum ImprovementType {
  FEATURE_SUGGESTION = 'feature_suggestion',
  CODE_IMPROVEMENT = 'code_improvement',
  BUG_FIX = 'bug_fix',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  ARCHITECTURE_RECOMMENDATION = 'architecture_recommendation',
  DATA_MODEL_ENHANCEMENT = 'data_model_enhancement',
}

// Code Improvements table for storing agent-suggested code improvements
export const codeImprovements = pgTable('code_improvements', {
  id: text('id').primaryKey(), // Unique identifier for the improvement
  type: text('type').notNull(), // Type of improvement (enum value)
  title: text('title').notNull(), // Brief title of the improvement
  description: text('description').notNull(), // Detailed description
  agentId: text('agent_id').notNull(), // ID of the agent suggesting the improvement
  agentName: text('agent_name').notNull(), // Name of the agent for display
  affectedFiles: jsonb('affected_files'), // List of files affected by this improvement
  suggestedChanges: jsonb('suggested_changes'), // Detailed code change suggestions
  priority: text('priority').notNull().default('medium'), // low, medium, high
  status: text('status').notNull().default('pending'), // pending, approved, rejected, implemented
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertCodeImprovementSchema = createInsertSchema(codeImprovements).pick({
  id: true,
  type: true,
  title: true,
  description: true,
  agentId: true,
  agentName: true,
  affectedFiles: true,
  suggestedChanges: true,
  priority: true,
  status: true,
});

export type CodeImprovement = typeof codeImprovements.$inferSelect;
export type InsertCodeImprovement = z.infer<typeof insertCodeImprovementSchema>;

export type DataLineageRecord = typeof dataLineageRecords.$inferSelect;
export type InsertDataLineageRecord = z.infer<typeof insertDataLineageRecordSchema>;

// Property Insights Sharing table
export const propertyInsightShares = pgTable('property_insight_shares', {
  id: serial('id').primaryKey(),
  shareId: text('share_id').notNull().unique(), // UUID for sharing
  propertyId: text('property_id').notNull(),
  propertyName: text('property_name'), // Optional property name for better context
  propertyAddress: text('property_address'), // Optional property address for better context
  title: text('title').notNull(),
  insightType: text('insight_type').notNull(), // 'story', 'comparison', 'data'
  insightData: jsonb('insight_data').notNull(), // Stored insight content
  format: text('format').notNull().default('detailed'), // 'simple', 'detailed', 'summary'
  createdBy: integer('created_by'), // Optional user ID if authenticated
  accessCount: integer('access_count').notNull().default(0), // Number of times accessed
  expiresAt: timestamp('expires_at'), // Optional expiration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isPublic: boolean('is_public').notNull().default(true),
  password: text('password'), // Optional password protection
  allowedDomains: text('allowed_domains').array(), // Domain restriction for email sharing
});

export const insertPropertyInsightShareSchema = createInsertSchema(propertyInsightShares).pick({
  shareId: true,
  propertyId: true,
  propertyName: true,
  propertyAddress: true,
  title: true,
  insightType: true,
  insightData: true,
  format: true,
  createdBy: true,
  expiresAt: true,
  isPublic: true,
  password: true,
  allowedDomains: true,
});

export type PropertyInsightShare = typeof propertyInsightShares.$inferSelect;
export type InsertPropertyInsightShare = z.infer<typeof insertPropertyInsightShareSchema>;

// Comparable Sales Records table
export const comparableSales = pgTable('comparable_sales', {
  id: serial('id').primaryKey(),
  propertyId: text('property_id').notNull(), // Subject property ID
  comparablePropertyId: text('comparable_property_id').notNull(), // Comparable property ID
  saleDate: date('sale_date'), // Date of sale for comparable property (null if not a sale)
  salePrice: numeric('sale_price'), // Sale price of comparable property (null if not a sale)
  adjustedPrice: numeric('adjusted_price'), // Price after applying adjustments
  distanceInMiles: numeric('distance_in_miles'), // Distance to subject property
  similarityScore: numeric('similarity_score'), // AI-calculated similarity (0-100)
  adjustmentFactors: jsonb('adjustment_factors'), // Detailed adjustments (size, quality, etc.)
  notes: text('notes'), // Additional notes about the comparable
  status: text('status').notNull().default('active'), // active, inactive, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdBy: integer('created_by').notNull(), // User who created the comparable
});

export const insertComparableSaleSchema = createInsertSchema(comparableSales).pick({
  propertyId: true,
  comparablePropertyId: true,
  saleDate: true,
  salePrice: true,
  adjustedPrice: true,
  distanceInMiles: true,
  similarityScore: true,
  adjustmentFactors: true,
  notes: true,
  status: true,
  createdBy: true,
});

export type ComparableSale = typeof comparableSales.$inferSelect;
export type InsertComparableSale = z.infer<typeof insertComparableSaleSchema>;

// Comparable Sales Analysis table
export const comparableSalesAnalyses = pgTable('comparable_sales_analyses', {
  id: serial('id').primaryKey(),
  analysisId: text('analysis_id').notNull().unique(), // Unique identifier for the analysis
  propertyId: text('property_id').notNull(), // Subject property ID
  title: text('title').notNull(), // Name of the analysis
  description: text('description'), // Description of the analysis
  methodology: text('methodology').notNull().default('sales_comparison'), // sales_comparison, income, cost
  effectiveDate: date('effective_date').notNull(), // Date for which the analysis is valid
  valueConclusion: numeric('value_conclusion'), // Final concluded value
  adjustmentNotes: text('adjustment_notes'), // Notes on adjustments
  marketConditions: text('market_conditions'), // Market conditions analysis
  confidenceLevel: text('confidence_level').default('medium'), // low, medium, high
  status: text('status').notNull().default('draft'), // draft, final, archived
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdBy: integer('created_by').notNull(), // User who created the analysis
  reviewedBy: integer('reviewed_by'), // User who reviewed the analysis (null if not reviewed)
  reviewNotes: text('review_notes'), // Notes from reviewer
  reviewDate: timestamp('review_date'), // Date of review
});

export const insertComparableSalesAnalysisSchema = createInsertSchema(comparableSalesAnalyses).pick(
  {
    analysisId: true,
    propertyId: true,
    title: true,
    description: true,
    methodology: true,
    effectiveDate: true,
    valueConclusion: true,
    adjustmentNotes: true,
    marketConditions: true,
    confidenceLevel: true,
    status: true,
    createdBy: true,
    reviewedBy: true,
    reviewNotes: true,
    reviewDate: true,
  }
);

export type ComparableSalesAnalysis = typeof comparableSalesAnalyses.$inferSelect;
export type InsertComparableSalesAnalysis = z.infer<typeof insertComparableSalesAnalysisSchema>;

// Import Staging table
export const importStaging = pgTable('import_staging', {
  id: serial('id').primaryKey(),
  stagingId: text('staging_id').notNull().unique(),
  propertyData: jsonb('property_data').notNull(),
  source: text('source').notNull(),
  status: text('status').notNull().default('pending'),
  validationErrors: jsonb('validation_errors').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertImportStagingSchema = createInsertSchema(importStaging).pick({
  stagingId: true,
  propertyData: true,
  source: true,
  status: true,
  validationErrors: true,
});

export type StagedProperty = typeof importStaging.$inferSelect;
export type InsertStagedProperty = z.infer<typeof insertImportStagingSchema>;

// Comparable Sales Analysis Comparables join table
export const comparableAnalysisEntries = pgTable('comparable_analysis_entries', {
  id: serial('id').primaryKey(),
  analysisId: text('analysis_id').notNull(), // References analysisId in comparableSalesAnalyses
  comparableSaleId: integer('comparable_sale_id').notNull(), // References id in comparableSales
  includeInFinalValue: boolean('include_in_final_value').notNull().default(true), // Whether to include in final value calculation
  weight: numeric('weight').notNull().default('1'), // Weight given to this comparable (0-1)
  adjustedValue: numeric('adjusted_value'), // Final adjusted value of this comparable
  notes: text('notes'), // Notes specific to this comparable in this analysis
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertComparableAnalysisEntrySchema = createInsertSchema(
  comparableAnalysisEntries
).pick({
  analysisId: true,
  comparableSaleId: true,
  includeInFinalValue: true,
  weight: true,
  adjustedValue: true,
  notes: true,
});

export type ComparableAnalysisEntry = typeof comparableAnalysisEntries.$inferSelect;
export type InsertComparableAnalysisEntry = z.infer<typeof insertComparableAnalysisEntrySchema>;

// Validation Rules table
export const validationRules = pgTable('validation_rules', {
  id: serial('id').primaryKey(),
  ruleId: varchar('rule_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // classification, valuation, property_data, compliance, etc.
  level: varchar('level', { length: 20 }).notNull(), // critical, error, warning, info
  entityType: varchar('entity_type', { length: 50 }).notNull(), // property, land_record, improvement, appeal, etc.
  implementation: text('implementation'), // Optional: For simple rules, store the implementation logic
  parameters: jsonb('parameters').default({}), // Optional: Parameters for the rule
  reference: text('reference'), // Optional: Legal or policy reference (e.g., RCW 84.40.030)
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: integer('created_by'),
});

export const insertValidationRuleSchema = createInsertSchema(validationRules).pick({
  ruleId: true,
  name: true,
  description: true,
  category: true,
  level: true,
  entityType: true,
  implementation: true,
  parameters: true,
  reference: true,
  isActive: true,
  createdBy: true,
});

export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertValidationRule = z.infer<typeof insertValidationRuleSchema>;

// Validation Issues table
export const validationIssues = pgTable(
  'validation_issues',
  {
    id: serial('id').primaryKey(),
    issueId: varchar('issue_id', { length: 100 }).notNull().unique(),
    ruleId: varchar('rule_id', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    propertyId: varchar('property_id', { length: 100 }),
    level: varchar('level', { length: 20 }).notNull(),
    message: text('message').notNull(),
    details: jsonb('details').default({}),
    status: varchar('status', { length: 20 }).notNull().default('open'), // open, acknowledged, resolved, waived
    resolution: text('resolution'),
    resolvedBy: integer('resolved_by'),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      ruleIdIdx: index('validation_issues_rule_id_idx').on(table.ruleId),
      entityTypeIdIdx: index('validation_issues_entity_type_id_idx').on(
        table.entityType,
        table.entityId
      ),
      propertyIdIdx: index('validation_issues_property_id_idx').on(table.propertyId),
      statusIdx: index('validation_issues_status_idx').on(table.status),
      levelIdx: index('validation_issues_level_idx').on(table.level),
    };
  }
);

export const insertValidationIssueSchema = createInsertSchema(validationIssues).pick({
  issueId: true,
  ruleId: true,
  entityType: true,
  entityId: true,
  propertyId: true,
  level: true,
  message: true,
  details: true,
  status: true,
  resolution: true,
  resolvedBy: true,
  resolvedAt: true,
});

export type ValidationIssue = typeof validationIssues.$inferSelect;
export type InsertValidationIssue = z.infer<typeof insertValidationIssueSchema>;

// Workflow Definition table
export const workflowDefinitions = pgTable('workflow_definitions', {
  id: serial('id').primaryKey(),
  definitionId: varchar('definition_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version: integer('version').notNull().default(1),
  steps: jsonb('steps').notNull(), // Array of workflow steps with their actions, validations, etc.
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: integer('created_by'),
});

export const insertWorkflowDefinitionSchema = createInsertSchema(workflowDefinitions).pick({
  definitionId: true,
  name: true,
  description: true,
  version: true,
  steps: true,
  isActive: true,
  createdBy: true,
});

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type InsertWorkflowDefinition = z.infer<typeof insertWorkflowDefinitionSchema>;

// Workflow Instances table
export const workflowInstances = pgTable(
  'workflow_instances',
  {
    id: serial('id').primaryKey(),
    instanceId: varchar('instance_id', { length: 100 }).notNull().unique(),
    definitionId: varchar('definition_id', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    currentStepId: varchar('current_step_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('not_started'), // not_started, in_progress, waiting, completed, canceled
    assignedTo: integer('assigned_to'),
    priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent
    data: jsonb('data').default({}), // Workflow instance data
    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at'),
    dueDate: timestamp('due_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      definitionIdIdx: index('workflow_instances_definition_id_idx').on(table.definitionId),
      entityTypeIdIdx: index('workflow_instances_entity_type_id_idx').on(
        table.entityType,
        table.entityId
      ),
      statusIdx: index('workflow_instances_status_idx').on(table.status),
      assignedToIdx: index('workflow_instances_assigned_to_idx').on(table.assignedTo),
    };
  }
);

export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances).pick({
  instanceId: true,
  definitionId: true,
  entityType: true,
  entityId: true,
  currentStepId: true,
  status: true,
  assignedTo: true,
  priority: true,
  data: true,
  startedAt: true,
  completedAt: true,
  dueDate: true,
});

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = z.infer<typeof insertWorkflowInstanceSchema>;

// Workflow Step History table
export const workflowStepHistory = pgTable(
  'workflow_step_history',
  {
    id: serial('id').primaryKey(),
    instanceId: varchar('instance_id', { length: 100 }).notNull(),
    stepId: varchar('step_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    assignedTo: integer('assigned_to'),
    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at'),
    notes: text('notes'),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      instanceIdIdx: index('workflow_step_history_instance_id_idx').on(table.instanceId),
    };
  }
);

export const insertWorkflowStepHistorySchema = createInsertSchema(workflowStepHistory).pick({
  instanceId: true,
  stepId: true,
  status: true,
  assignedTo: true,
  startedAt: true,
  completedAt: true,
  notes: true,
  data: true,
});

export type WorkflowStepHistory = typeof workflowStepHistory.$inferSelect;
export type InsertWorkflowStepHistory = z.infer<typeof insertWorkflowStepHistorySchema>;

// Shared Workflow tables for collaborative features
export enum CollaborationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum CollaborationRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// Shared Workflow table for collaborative workflow instances
export const sharedWorkflows = pgTable(
  'shared_workflows',
  {
    id: serial('id').primaryKey(),
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => workflowDefinitions.id), // Reference to the workflow definition
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('active'), // active, paused, completed, archived
    shareCode: text('share_code').notNull().unique(), // Unique code for sharing the workflow
    isPublic: boolean('is_public').default(false), // Whether the workflow is publicly accessible
    createdBy: integer('created_by').notNull(), // User ID who created the shared workflow
    lastModified: timestamp('last_modified').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      // Indexes for performance
      shareCodeIdx: index('shared_workflows_share_code_idx').on(table.shareCode),
      createdByIdx: index('shared_workflows_created_by_idx').on(table.createdBy),
      statusIdx: index('shared_workflows_status_idx').on(table.status),
    };
  }
);

export const insertSharedWorkflowSchema = createInsertSchema(sharedWorkflows).pick({
  workflowId: true,
  name: true,
  description: true,
  status: true,
  shareCode: true,
  isPublic: true,
  createdBy: true,
});

// Shared Workflow Collaborators table for managing collaborators
export const sharedWorkflowCollaborators = pgTable(
  'shared_workflow_collaborators',
  {
    id: serial('id').primaryKey(),
    sharedWorkflowId: integer('shared_workflow_id')
      .notNull()
      .references(() => sharedWorkflows.id),
    userId: integer('user_id').notNull(),
    role: text('role').notNull().default('viewer'), // owner, editor, viewer
    invitedBy: integer('invited_by').notNull(),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    lastAccessedAt: timestamp('last_accessed_at'),
  },
  table => {
    return {
      // Unique constraint to prevent duplicate collaborators
      uniqueUserWorkflow: index('shared_workflow_collaborators_unique_user_workflow_idx').on(
        table.sharedWorkflowId,
        table.userId
      ),
    };
  }
);

export const insertSharedWorkflowCollaboratorSchema = createInsertSchema(
  sharedWorkflowCollaborators
).pick({
  sharedWorkflowId: true,
  userId: true,
  role: true,
  invitedBy: true,
  lastAccessedAt: true,
});

// Shared Workflow Activity table for tracking changes and comments
export const sharedWorkflowActivities = pgTable(
  'shared_workflow_activities',
  {
    id: serial('id').primaryKey(),
    sharedWorkflowId: integer('shared_workflow_id')
      .notNull()
      .references(() => sharedWorkflows.id),
    userId: integer('user_id').notNull(),
    activityType: text('activity_type').notNull(), // edit, comment, status_change, etc.
    details: jsonb('details').default({}),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  table => {
    return {
      // Index for querying activities by workflow
      workflowActivityIdx: index('shared_workflow_activities_workflow_idx').on(
        table.sharedWorkflowId
      ),
    };
  }
);

export const insertSharedWorkflowActivitySchema = createInsertSchema(sharedWorkflowActivities).pick(
  {
    sharedWorkflowId: true,
    userId: true,
    activityType: true,
    details: true,
  }
);

// Workflow Session table for real-time collaboration
export const workflowSessions = pgTable(
  'workflow_sessions',
  {
    id: serial('id').primaryKey(),
    sharedWorkflowId: integer('shared_workflow_id')
      .notNull()
      .references(() => sharedWorkflows.id),
    sessionId: text('session_id').notNull().unique(),
    createdBy: integer('created_by').notNull(),
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    status: text('status').notNull().default('active'), // active, ended
    participants: jsonb('participants').default([]),
  },
  table => {
    return {
      // Index for active sessions
      activeSessionsIdx: index('workflow_sessions_active_idx').on(table.status),
    };
  }
);

export const insertWorkflowSessionSchema = createInsertSchema(workflowSessions).pick({
  sharedWorkflowId: true,
  sessionId: true,
  createdBy: true,
  status: true,
  participants: true,
});

// Types for shared workflow features
export type SharedWorkflow = typeof sharedWorkflows.$inferSelect;
export type InsertSharedWorkflow = z.infer<typeof insertSharedWorkflowSchema>;

export type SharedWorkflowCollaborator = typeof sharedWorkflowCollaborators.$inferSelect;
export type InsertSharedWorkflowCollaborator = z.infer<
  typeof insertSharedWorkflowCollaboratorSchema
>;

export type SharedWorkflowActivity = typeof sharedWorkflowActivities.$inferSelect;
export type InsertSharedWorkflowActivity = z.infer<typeof insertSharedWorkflowActivitySchema>;

export type WorkflowSession = typeof workflowSessions.$inferSelect;
export type InsertWorkflowSession = z.infer<typeof insertWorkflowSessionSchema>;

// Compliance Reports table
export const complianceReports = pgTable('compliance_reports', {
  id: serial('id').primaryKey(),
  reportId: varchar('report_id', { length: 100 }).notNull().unique(),
  year: integer('year').notNull(),
  countyCode: varchar('county_code', { length: 10 }).notNull(),
  reportType: varchar('report_type', { length: 50 }).notNull().default('standard'), // standard, dor, audit
  generatedAt: timestamp('generated_at').notNull(),
  summary: jsonb('summary').notNull(), // Summary metrics
  issues: jsonb('issues'), // Optional detailed issues list
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, final, submitted
  submittedBy: integer('submitted_by'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).pick({
  reportId: true,
  year: true,
  countyCode: true,
  reportType: true,
  generatedAt: true,
  summary: true,
  issues: true,
  status: true,
  submittedBy: true,
  submittedAt: true,
});

export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;

// Agent Experiences table for replay buffer
export const agentExperiences = pgTable(
  'agent_experiences',
  {
    id: serial('id').primaryKey(),
    experienceId: varchar('experience_id', { length: 100 }).notNull().unique(),
    agentId: varchar('agent_id', { length: 50 }).notNull(),
    agentName: varchar('agent_name', { length: 100 }).notNull(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    action: text('action').notNull(),
    state: jsonb('state').notNull(),
    nextState: jsonb('next_state'),
    reward: real('reward').notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: varchar('entity_id', { length: 100 }),
    priority: real('priority').notNull().default(0),
    context: jsonb('context'),
    usedForTraining: boolean('used_for_training').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      agentIdIdx: index('agent_experiences_agent_id_idx').on(table.agentId),
      priorityIdx: index('agent_experiences_priority_idx').on(table.priority),
      entityTypeIdx: index('agent_experiences_entity_type_idx').on(table.entityType),
    };
  }
);

export const insertAgentExperienceSchema = createInsertSchema(agentExperiences).pick({
  experienceId: true,
  agentId: true,
  agentName: true,
  timestamp: true,
  action: true,
  state: true,
  nextState: true,
  reward: true,
  entityType: true,
  entityId: true,
  priority: true,
  context: true,
  usedForTraining: true,
});

export type AgentExperience = typeof agentExperiences.$inferSelect;
export type InsertAgentExperience = z.infer<typeof insertAgentExperienceSchema>;

// Learning Updates table
export const learningUpdates = pgTable('learning_updates', {
  id: serial('id').primaryKey(),
  updateId: varchar('update_id', { length: 100 }).notNull().unique(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  updateType: varchar('update_type', { length: 20 }).notNull(),
  sourceExperiences: jsonb('source_experiences').notNull(),
  payload: jsonb('payload').notNull(),
  appliedTo: jsonb('applied_to').default([]),
  metrics: jsonb('metrics'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertLearningUpdateSchema = createInsertSchema(learningUpdates).pick({
  updateId: true,
  timestamp: true,
  updateType: true,
  sourceExperiences: true,
  payload: true,
  appliedTo: true,
  metrics: true,
});

export type LearningUpdate = typeof learningUpdates.$inferSelect;
export type InsertLearningUpdate = z.infer<typeof insertLearningUpdateSchema>;

// Team Members table
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(), // Corresponds to TeamMemberRole enum
  status: text('status').notNull().default('available'), // Corresponds to TeamMemberStatus enum
  capabilities: jsonb('capabilities').notNull(), // Structured as TeamMemberCapabilities
  avatar: text('avatar'),
  email: text('email').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastActive: timestamp('last_active').defaultNow().notNull(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
  lastActive: true,
});

// Team Tasks table
export const teamTasks = pgTable('team_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  assignedTo: integer('assigned_to'),
  createdBy: integer('created_by').notNull(),
  status: text('status').notNull().default('backlog'), // Corresponds to TaskStatus enum
  priority: text('priority').notNull().default('medium'), // Corresponds to TaskPriority enum
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
  estimatedHours: numeric('estimated_hours'),
  actualHours: numeric('actual_hours'),
  tags: text('tags').array().default([]),
  attachments: text('attachments').array().default([]),
});

export const insertTeamTaskSchema = createInsertSchema(teamTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Task Comments table
export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => teamTasks.id),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  attachments: text('attachments').array().default([]),
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
});

// Team Collaboration Sessions table
export const basicTeamCollaborationSessions = pgTable('team_collaboration_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  status: text('status').notNull(), // scheduled, in_progress, completed, cancelled
  participants: integer('participants').array().notNull(),
  organizer: integer('organizer').notNull(),
  agenda: text('agenda').array().default([]),
  notes: text('notes'),
  recordingUrl: text('recording_url'),
  taskIds: uuid('task_ids').array().default([]),
});

export const insertBasicTeamCollaborationSessionSchema = createInsertSchema(
  basicTeamCollaborationSessions
).omit({
  id: true,
});

// Team Feedback table
export const teamFeedbacks = pgTable('team_feedbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUserId: integer('from_user_id').notNull(),
  toUserId: integer('to_user_id').notNull(),
  content: text('content').notNull(),
  rating: integer('rating').notNull(), // 1-5 scale
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  category: text('category').notNull(), // code_quality, communication, timeliness, problem_solving, other
  taskId: uuid('task_id').references(() => teamTasks.id),
});

export const insertTeamFeedbackSchema = createInsertSchema(teamFeedbacks).omit({
  id: true,
});

// Team Knowledge Base Items table
export const teamKnowledgeBaseItems = pgTable('team_knowledge_base_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  tags: text('tags').array().default([]),
  attachments: text('attachments').array().default([]),
  relatedItemIds: uuid('related_item_ids').array().default([]),
});

export const insertTeamKnowledgeBaseItemSchema = createInsertSchema(teamKnowledgeBaseItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define type exports for team entities
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type TeamTask = typeof teamTasks.$inferSelect;
export type InsertTeamTask = z.infer<typeof insertTeamTaskSchema>;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type TeamCollaborationSession = typeof basicTeamCollaborationSessions.$inferSelect;
export type InsertTeamCollaborationSession = z.infer<
  typeof insertBasicTeamCollaborationSessionSchema
>;

export type TeamFeedback = typeof teamFeedbacks.$inferSelect;
export type InsertTeamFeedback = z.infer<typeof insertTeamFeedbackSchema>;

export type TeamKnowledgeBaseItem = typeof teamKnowledgeBaseItems.$inferSelect;
export type InsertTeamKnowledgeBaseItem = z.infer<typeof insertTeamKnowledgeBaseItemSchema>;

// Property Analysis Interfaces
export interface PropertyHistoryDataPoint {
  date: Date;
  fieldName: string;
  oldValue: string;
  newValue: string;
  source: string;
  userId: number;
}

export interface MarketTrend {
  region: string;
  trendType: string;
  period: string;
  changePercentage: number;
  startDate: Date;
  endDate: Date;
  avgValue?: number;
  avgDaysOnMarket?: number;
  totalProperties?: number;
}

export interface PropertyAnalysisResult {
  propertyId: string;
  estimatedValue: number;
  confidenceScore: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  comparables: string[];
  recommendations: string[];
  marketTrends: string[];
}

// TaxI_AI Development Platform Enums
export enum ProjectType {
  WEB_APPLICATION = 'web_application',
  API_SERVICE = 'api_service',
  DATA_PIPELINE = 'data_pipeline',
  AI_AGENT = 'ai_agent',
}

export enum ProjectLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  CSHARP = 'csharp',
  JAVA = 'java',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum FileType {
  CODE = 'code',
  MARKDOWN = 'markdown',
  JSON = 'json',
  CONFIG = 'config',
  DATA = 'data',
  OTHER = 'other',
}

export enum PreviewStatus {
  STOPPED = 'stopped',
  RUNNING = 'running',
  ERROR = 'error',
}

// TaxI_AI Development Platform Tables

// Development Projects table
export const developmentProjects = pgTable('dev_projects', {
  project_id: text('project_id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // ProjectType enum
  language: text('language').notNull(), // ProjectLanguage enum
  framework: text('framework'),
  template: text('template'),
  status: text('status').notNull().default('active'), // ProjectStatus enum
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  config: jsonb('config').default({}),
  metadata: jsonb('metadata').default({}),
  isPublic: boolean('is_public').default(false),
});

export const insertDevelopmentProjectSchema = createInsertSchema(developmentProjects)
  .omit({
    project_id: true,
  })
  .pick({
    name: true,
    description: true,
    type: true,
    language: true,
    framework: true,
    template: true,
    status: true,
    createdBy: true,
    config: true,
    metadata: true,
    isPublic: true,
  });

// Project Files table
export const projectFiles = pgTable('project_files', {
  id: serial('id').primaryKey(),
  fileId: text('file_id').notNull().unique(),
  projectId: text('project_id').notNull(),
  path: text('path').notNull(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(), // FileType enum
  size: integer('size').notNull(),
  isDirectory: boolean('is_directory').default(false),
  parentPath: text('parent_path'),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata').default({}),
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).pick({
  fileId: true,
  projectId: true,
  path: true,
  name: true,
  content: true,
  type: true,
  size: true,
  isDirectory: true,
  parentPath: true,
  createdBy: true,
  metadata: true,
});

// Project Templates table
export const projectTemplates = pgTable('project_templates', {
  id: serial('id').primaryKey(),
  templateId: text('template_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // ProjectType enum
  language: text('language').notNull(), // ProjectLanguage enum
  framework: text('framework'),
  thumbnail: text('thumbnail'),
  files: jsonb('files').notNull(), // Template file structures
  dependencies: jsonb('dependencies').default({}),
  config: jsonb('config').default({}),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isOfficial: boolean('is_official').default(false),
  category: text('category'),
  tags: text('tags').array(),
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).pick({
  templateId: true,
  name: true,
  description: true,
  type: true,
  language: true,
  framework: true,
  thumbnail: true,
  files: true,
  dependencies: true,
  config: true,
  createdBy: true,
  isOfficial: true,
  category: true,
  tags: true,
});

// Project Versions table
export const projectVersions = pgTable('project_versions', {
  id: serial('id').primaryKey(),
  versionId: text('version_id').notNull().unique(),
  projectId: text('project_id').notNull(),
  versionNumber: text('version_number').notNull(),
  commitMessage: text('commit_message').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isDeployed: boolean('is_deployed').default(false),
  deploymentInfo: jsonb('deployment_info').default({}),
});

export const insertProjectVersionSchema = createInsertSchema(projectVersions).pick({
  versionId: true,
  projectId: true,
  versionNumber: true,
  commitMessage: true,
  snapshot: true,
  createdBy: true,
  isDeployed: true,
  deploymentInfo: true,
});

// Preview Settings table
export const previewSettings = pgTable('preview_settings', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull().unique(),
  port: integer('port'),
  command: text('command').notNull(),
  env: jsonb('env').default({}),
  autoRefresh: boolean('auto_refresh').default(true),
  status: text('status').notNull().default('stopped'), // PreviewStatus enum
  lastStarted: timestamp('last_started'),
  lastStopped: timestamp('last_stopped'),
  logs: text('logs').array().default([]),
  pid: integer('pid'),
  configFile: text('config_file'),
});

export const insertPreviewSettingSchema = createInsertSchema(previewSettings).pick({
  projectId: true,
  port: true,
  command: true,
  env: true,
  autoRefresh: true,
  status: true,
  lastStarted: true,
  lastStopped: true,
  logs: true,
  pid: true,
  configFile: true,
});

// AI Code Generations table
export const aiCodeGenerations = pgTable('ai_code_generations', {
  id: serial('id').primaryKey(),
  generationId: text('generation_id').notNull().unique(),
  projectId: text('project_id').notNull(),
  fileId: text('file_id'),
  prompt: text('prompt').notNull(),
  result: text('result').notNull(),
  usedContext: jsonb('used_context').default({}),
  rating: integer('rating'),
  isApplied: boolean('is_applied').default(false),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  model: text('model'),
  parameters: jsonb('parameters').default({}),
});

export const insertAiCodeGenerationSchema = createInsertSchema(aiCodeGenerations).pick({
  generationId: true,
  projectId: true,
  fileId: true,
  prompt: true,
  result: true,
  usedContext: true,
  rating: true,
  isApplied: true,
  createdBy: true,
  model: true,
  parameters: true,
});

// Assessment Model Workbench Schemas
export enum ModelType {
  COST_APPROACH = 'cost_approach',
  SALES_COMPARISON = 'sales_comparison',
  INCOME_APPROACH = 'income_approach',
  HYBRID = 'hybrid',
  STATISTICAL = 'statistical',
  SPECIALIZED = 'specialized',
}

export enum ModelStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

export enum VariableType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean',
  DATE = 'date',
  OBJECT = 'object',
  ARRAY = 'array',
  FORMULA = 'formula',
  REFERENCE = 'reference',
}

export enum DataSourceType {
  PROPERTY_DATA = 'property_data',
  COMPARISON_DATA = 'comparison_data',
  MARKET_DATA = 'market_data',
  MANUAL_INPUT = 'manual_input',
  CALCULATED = 'calculated',
  EXTERNAL_API = 'external_api',
  SPATIAL_DATA = 'spatial_data',
}

// Assessment Models table
export const assessmentModels = pgTable('assessment_models', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id').notNull().unique().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  version: text('version').notNull().default('1.0.0'),
  status: text('status').notNull().default(ModelStatus.DRAFT),
  isTemplate: boolean('is_template').default(false),
  compatiblePropertyTypes: jsonb('compatible_property_types').default([]),
  createdById: integer('created_by_id').notNull(),
  lastModifiedById: integer('last_modified_by_id').notNull(),
  lastReviewedById: integer('last_reviewed_by_id'),
  reviewNotes: text('review_notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertAssessmentModelSchema = createInsertSchema(assessmentModels)
  .pick({
    name: true,
    description: true,
    type: true,
    version: true,
    status: true,
    isTemplate: true,
    compatiblePropertyTypes: true,
    createdById: true,
    lastModifiedById: true,
    lastReviewedById: true,
    reviewNotes: true,
    metadata: true,
  })
  .extend({
    status: z.nativeEnum(ModelStatus).optional(),
    type: z.nativeEnum(ModelType),
  });

// Model Variables table
export const modelVariables = pgTable('model_variables', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => assessmentModels.modelId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  variableKey: text('variable_key').notNull(),
  type: text('type').notNull(),
  defaultValue: jsonb('default_value'),
  required: boolean('required').default(false),
  validation: jsonb('validation').default({}),
  sourceType: text('source_type').notNull(),
  sourceMapping: jsonb('source_mapping').default({}),
  displayOrder: integer('display_order').default(0),
  isAdvanced: boolean('is_advanced').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertModelVariableSchema = createInsertSchema(modelVariables)
  .pick({
    modelId: true,
    name: true,
    description: true,
    variableKey: true,
    type: true,
    defaultValue: true,
    required: true,
    validation: true,
    sourceType: true,
    sourceMapping: true,
    displayOrder: true,
    isAdvanced: true,
  })
  .extend({
    type: z.nativeEnum(VariableType),
    sourceType: z.nativeEnum(DataSourceType),
  });

// Model Components table - for reusable calculation components
export const modelComponents = pgTable('model_components', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => assessmentModels.modelId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  componentType: text('component_type').notNull(), // factor_table, calculation_block, adjustment_matrix
  implementation: jsonb('implementation').notNull(),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdById: integer('created_by_id').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertModelComponentSchema = createInsertSchema(modelComponents).pick({
  modelId: true,
  name: true,
  description: true,
  componentType: true,
  implementation: true,
  displayOrder: true,
  isActive: true,
  createdById: true,
  metadata: true,
});

// Model Calculations table - for defining calculation logic
export const modelCalculations = pgTable('model_calculations', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => assessmentModels.modelId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  formula: text('formula').notNull(),
  outputVariableId: integer('output_variable_id').references(() => modelVariables.id),
  dependsOn: jsonb('depends_on').default([]), // Array of variable keys or component IDs
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertModelCalculationSchema = createInsertSchema(modelCalculations).pick({
  modelId: true,
  name: true,
  description: true,
  formula: true,
  outputVariableId: true,
  dependsOn: true,
  displayOrder: true,
});

// Model Validation Rules table
export const modelValidationRules = pgTable('model_validation_rules', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => assessmentModels.modelId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  ruleType: text('rule_type').notNull(), // range_check, comparison, threshold, pattern
  implementation: jsonb('implementation').notNull(),
  severity: text('severity').notNull().default('warning'), // info, warning, error
  message: text('message').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertModelValidationRuleSchema = createInsertSchema(modelValidationRules).pick({
  modelId: true,
  name: true,
  description: true,
  ruleType: true,
  implementation: true,
  severity: true,
  message: true,
  isActive: true,
});

// Model Test Cases table
export const modelTestCases = pgTable('model_test_cases', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => assessmentModels.modelId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  inputs: jsonb('inputs').notNull(),
  expectedOutputs: jsonb('expected_outputs').notNull(),
  isAutomated: boolean('is_automated').default(true),
  lastRunAt: timestamp('last_run_at'),
  lastRunStatus: text('last_run_status'),
  lastRunResult: jsonb('last_run_result'),
  createdById: integer('created_by_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertModelTestCaseSchema = createInsertSchema(modelTestCases).pick({
  modelId: true,
  name: true,
  description: true,
  inputs: true,
  expectedOutputs: true,
  isAutomated: true,
  createdById: true,
});

// Model Versions table for versioning
export const assessmentModelVersions = pgTable('assessment_model_versions', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => assessmentModels.modelId),
  versionNumber: text('version_number').notNull(),
  snapshot: jsonb('snapshot').notNull(), // Complete serialized model
  changeLog: text('change_log'),
  createdById: integer('created_by_id').notNull(),
  status: text('status').notNull().default(ModelStatus.DRAFT),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertAssessmentModelVersionSchema = createInsertSchema(assessmentModelVersions)
  .pick({
    modelId: true,
    versionNumber: true,
    snapshot: true,
    changeLog: true,
    createdById: true,
    status: true,
  })
  .extend({
    status: z.nativeEnum(ModelStatus).optional(),
  });

// Export types for TaxI_AI Development Platform
export type DevelopmentProject = typeof developmentProjects.$inferSelect;
export type InsertDevelopmentProject = z.infer<typeof insertDevelopmentProjectSchema>;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;

export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;

export type PreviewSetting = typeof previewSettings.$inferSelect;
export type InsertPreviewSetting = z.infer<typeof insertPreviewSettingSchema>;

export type AiCodeGeneration = typeof aiCodeGenerations.$inferSelect;
export type InsertAiCodeGeneration = z.infer<typeof insertAiCodeGenerationSchema>;

// Export types for Assessment Model Workbench
export type AssessmentModel = typeof assessmentModels.$inferSelect;
export type InsertAssessmentModel = z.infer<typeof insertAssessmentModelSchema>;

export type ModelVariable = typeof modelVariables.$inferSelect;
export type InsertModelVariable = z.infer<typeof insertModelVariableSchema>;

export type ModelComponent = typeof modelComponents.$inferSelect;
export type InsertModelComponent = z.infer<typeof insertModelComponentSchema>;

export type ModelCalculation = typeof modelCalculations.$inferSelect;
export type InsertModelCalculation = z.infer<typeof insertModelCalculationSchema>;

export type ModelValidationRule = typeof modelValidationRules.$inferSelect;
export type InsertModelValidationRule = z.infer<typeof insertModelValidationRuleSchema>;

export type ModelTestCase = typeof modelTestCases.$inferSelect;
export type InsertModelTestCase = z.infer<typeof insertModelTestCaseSchema>;

export type AssessmentModelVersion = typeof assessmentModelVersions.$inferSelect;
export type InsertAssessmentModelVersion = z.infer<typeof insertAssessmentModelVersionSchema>;

// ----------------- Voice Command Analytics -----------------

// Enum for voice command status
export enum VoiceCommandStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILED = 'failed',
  AMBIGUOUS = 'ambiguous',
  ERROR = 'error',
}

// Enum for voice command types to categorize commands
export enum VoiceCommandType {
  NAVIGATION = 'navigation',
  DATA_QUERY = 'data_query',
  PROPERTY_ASSESSMENT = 'property_assessment',
  WORKFLOW = 'workflow',
  SYSTEM = 'system',
  CUSTOM = 'custom',
  CODING_ASSISTANCE = 'coding_assistance',
}

// Voice Command Logs table
export const voiceCommandLogs = pgTable('voice_command_logs', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(), // To group related commands
  userId: integer('user_id').notNull(), // User who issued the command
  rawCommand: text('raw_command').notNull(), // The actual text transcribed from speech
  processedCommand: text('processed_command'), // Command after normalization/preprocessing
  commandType: text('command_type').notNull(), // Type of command based on VoiceCommandType enum
  intentRecognized: text('intent_recognized'), // Identified intent
  parameters: jsonb('parameters'), // Extracted parameters from the command
  status: text('status').notNull(), // Success, failed, etc.
  responseTime: integer('response_time'), // Processing time in milliseconds
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  contextData: jsonb('context_data'), // Context in which command was issued (page, state)
  confidenceScore: real('confidence_score'), // Confidence level of recognition (0.0-1.0)
  errorMessage: text('error_message'), // If command failed
  agentResponses: jsonb('agent_responses'), // Responses from AI agents
  deviceInfo: jsonb('device_info'), // Device/browser information
  speedFactor: real('speed_factor'), // Relative speed of speech
});

export const insertVoiceCommandLogSchema = createInsertSchema(voiceCommandLogs).omit({
  id: true,
  timestamp: true,
});

export type VoiceCommandLog = typeof voiceCommandLogs.$inferSelect;
export type InsertVoiceCommandLog = z.infer<typeof insertVoiceCommandLogSchema>;

// Voice Command Shortcuts table for customizable shortcuts
export const voiceCommandShortcuts = pgTable(
  'voice_command_shortcuts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(), // User who created this shortcut
    shortcutPhrase: text('shortcut_phrase').notNull(), // The phrase to trigger the shortcut
    expandedCommand: text('expanded_command').notNull(), // What the shortcut expands to
    commandType: text('command_type').notNull(), // Type of command
    description: text('description'), // User-provided description
    priority: integer('priority').default(0), // Higher priority shortcuts take precedence
    isEnabled: boolean('is_enabled').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsed: timestamp('last_used'), // When shortcut was last used
    usageCount: integer('usage_count').default(0), // Number of times used
    isGlobal: boolean('is_global').default(false), // Whether this is a system-wide shortcut
  },
  table => {
    return {
      userShortcutIdx: index('voice_command_shortcuts_user_shortcut_idx').on(
        table.userId,
        table.shortcutPhrase
      ),
    };
  }
);

export const insertVoiceCommandShortcutSchema = createInsertSchema(voiceCommandShortcuts).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
  usageCount: true,
});

export type VoiceCommandShortcut = typeof voiceCommandShortcuts.$inferSelect;
export type InsertVoiceCommandShortcut = z.infer<typeof insertVoiceCommandShortcutSchema>;

// Voice Command Analytics data for dashboard displays
export const voiceCommandAnalytics = pgTable(
  'voice_command_analytics',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(), // Date of analytics
    userId: integer('user_id'), // Specific user or null for global stats
    totalCommands: integer('total_commands').notNull().default(0),
    successfulCommands: integer('successful_commands').notNull().default(0),
    failedCommands: integer('failed_commands').notNull().default(0),
    ambiguousCommands: integer('ambiguous_commands').notNull().default(0),
    avgResponseTime: integer('avg_response_time'), // Average response time in ms
    commandTypeCounts: jsonb('command_type_counts'), // Count by command type
    topCommands: jsonb('top_commands'), // Most used commands
    topErrorTriggers: jsonb('top_error_triggers'), // Commands that cause errors
    avgConfidenceScore: real('avg_confidence_score'), // Average confidence score
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      userDateIdx: index('voice_command_analytics_user_date_idx').on(table.userId, table.date),
      dateIdx: index('voice_command_analytics_date_idx').on(table.date),
    };
  }
);

export const insertVoiceCommandAnalyticSchema = createInsertSchema(voiceCommandAnalytics).omit({
  id: true,
  createdAt: true,
});

export type VoiceCommandAnalytic = typeof voiceCommandAnalytics.$inferSelect;
export type InsertVoiceCommandAnalytic = z.infer<typeof insertVoiceCommandAnalyticSchema>;

// Voice Command Help Content table
export const voiceCommandHelpContents = pgTable(
  'voice_command_help_contents',
  {
    id: serial('id').primaryKey(),
    commandType: text('command_type').notNull(), // Type of command
    contextId: text('context_id'), // Specific page/context or null for global
    title: text('title').notNull(), // Short title of the help content
    examplePhrases: text('example_phrases').array().notNull(), // Example phrases
    description: text('description').notNull(), // Detailed description of what this command does
    parameters: jsonb('parameters'), // Parameters this command accepts
    responseExample: text('response_example'), // Example of how system responds
    priority: integer('priority').default(0), // Display priority
    isHidden: boolean('is_hidden').default(false), // Whether to hide from help listings
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      contextTypeIdx: index('voice_command_help_context_type_idx').on(
        table.contextId,
        table.commandType
      ),
    };
  }
);

export const insertVoiceCommandHelpContentSchema = createInsertSchema(
  voiceCommandHelpContents
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VoiceCommandHelpContent = typeof voiceCommandHelpContents.$inferSelect;
export type InsertVoiceCommandHelpContent = z.infer<typeof insertVoiceCommandHelpContentSchema>;

/**
 * AI Assistant Personality Traits Schema
 */
export const personalityTraitsSchema = z.object({
  formality: z.number().min(1).max(10).default(5),
  friendliness: z.number().min(1).max(10).default(5),
  technicality: z.number().min(1).max(10).default(5),
  creativity: z.number().min(1).max(10).default(5),
  conciseness: z.number().min(1).max(10).default(5),
});

export type PersonalityTraits = z.infer<typeof personalityTraitsSchema>;

/**
 * AI Assistant Visual Theme Schema
 */
export const visualThemeSchema = z.object({
  primaryColor: z.string().default('#0284c7'),
  secondaryColor: z.string().default('#f59e0b'),
  accentColor: z.string().default('#10b981'),
  avatar: z.string().optional(),
  iconSet: z.enum(['default', 'minimal', 'detailed', 'playful']).default('default'),
  themeName: z.string().default('Default'),
});

export type VisualTheme = z.infer<typeof visualThemeSchema>;

/**
 * AI Assistant Personality Table
 */
export const assistantPersonalities = pgTable(
  'assistant_personalities',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    traits: jsonb('traits').$type<PersonalityTraits>().notNull(),
    visualTheme: jsonb('visual_theme').$type<VisualTheme>().notNull(),
    systemPrompt: text('system_prompt').notNull(),
    exampleMessages: jsonb('example_messages').$type<string[]>().default([]),
    isDefault: boolean('is_default').default(false),
    userId: integer('user_id').notNull(), // Owner of the personality
    isPublic: boolean('is_public').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('assistant_personality_name_idx').on(table.name),
      userIdx: index('assistant_personality_user_idx').on(table.userId),
    };
  }
);

/**
 * AI Assistant Personality Type
 */
export type AssistantPersonality = typeof assistantPersonalities.$inferSelect;

/**
 * AI Assistant Personality Insert Schema
 */
export const insertAssistantPersonalitySchema = createInsertSchema(assistantPersonalities, {
  traits: personalityTraitsSchema,
  visualTheme: visualThemeSchema,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAssistantPersonality = z.infer<typeof insertAssistantPersonalitySchema>;

/**
 * User Personality Preferences Table
 * Maps users to their preferred assistant personalities
 */
// Workspace Preferences - User workspace customization settings
export const workspacePreferences = pgTable(
  'workspace_preferences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    workspaceTheme: text('workspace_theme').default(WorkspaceTheme.SYSTEM), // light, dark, system, high_contrast
    codeEditorTheme: text('code_editor_theme').default(CodeEditorTheme.DARK), // light, dark, monokai, etc
    workspaceLayout: text('workspace_layout').default(WorkspaceLayout.STANDARD), // standard, compact, expanded, custom
    fontSize: integer('font_size').default(14),
    fontFamily: text('font_family').default('JetBrains Mono'),
    lineHeight: numeric('line_height').default('1.5'),
    showMinimap: boolean('show_minimap').default(true),
    tabSize: integer('tab_size').default(2),
    wordWrap: boolean('word_wrap').default(false),
    autoSave: boolean('auto_save').default(true),
    liveCodeCompletion: boolean('live_code_completion').default(true),
    preferredLanguages: text('preferred_languages').array().default(['typescript', 'javascript']),
    favoriteTools: text('favorite_tools').array().default([]),
    customUIColors: jsonb('custom_ui_colors').default({}),
    dashboardLayout: jsonb('dashboard_layout').default({}),
    sidebarConfiguration: jsonb('sidebar_configuration').default({}),
    notificationPreferences: jsonb('notification_preferences').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      userIdx: index('workspace_preferences_user_idx').on(table.userId),
    };
  }
);

export type WorkspacePreference = typeof workspacePreferences.$inferSelect;

export const insertWorkspacePreferenceSchema = createInsertSchema(workspacePreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkspacePreference = z.infer<typeof insertWorkspacePreferenceSchema>;

// Personalized Developer Agents - Agents customized by users for specific tasks
export const personalizedDeveloperAgents = pgTable(
  'personalized_developer_agents',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    specialization: text('specialization')
      .notNull()
      .default(DeveloperAgentSpecialization.FULL_STACK),
    personalityId: integer('personality_id').references(() => assistantPersonalities.id),
    systemPrompt: text('system_prompt').notNull(),
    exampleMessages: jsonb('example_messages').$type<string[]>().default([]),
    supportedLanguages: text('supported_languages').array().default([]),
    capabilities: jsonb('capabilities').default([]),
    isActive: boolean('is_active').default(true),
    isShared: boolean('is_shared').default(false),
    usageCount: integer('usage_count').default(0),
    aiProvider: text('ai_provider').default('anthropic'), // openai, anthropic, perplexity
    aiModel: text('ai_model').default('claude-3-7-sonnet-20250219'),
    preferredTools: jsonb('preferred_tools').default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameUserIdx: index('personalized_dev_agents_name_user_idx').on(table.name, table.userId),
      specializationIdx: index('personalized_dev_agents_specialization_idx').on(
        table.specialization
      ),
    };
  }
);

export type PersonalizedDeveloperAgent = typeof personalizedDeveloperAgents.$inferSelect;

export const insertPersonalizedDeveloperAgentSchema = createInsertSchema(
  personalizedDeveloperAgents
).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPersonalizedDeveloperAgent = z.infer<
  typeof insertPersonalizedDeveloperAgentSchema
>;

export const userPersonalityPreferences = pgTable(
  'user_personality_preferences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    personalityId: integer('personality_id')
      .notNull()
      .references(() => assistantPersonalities.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      userPersonalityIdx: index('user_personality_pref_idx').on(table.userId, table.personalityId),
    };
  }
);

/**
 * User Personality Preference Type
 */
export type UserPersonalityPreference = typeof userPersonalityPreferences.$inferSelect;

/**
 * User Personality Preference Insert Schema
 */
export const insertUserPersonalityPreferenceSchema = createInsertSchema(
  userPersonalityPreferences
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserPersonalityPreference = z.infer<typeof insertUserPersonalityPreferenceSchema>;

/**
 * AI Interaction Style Templates
 * Pre-defined templates for personalities that users can start with
 */
export const personalityTemplates = pgTable(
  'personality_templates',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull(),
    traits: jsonb('traits').$type<PersonalityTraits>().notNull(),
    visualTheme: jsonb('visual_theme').$type<VisualTheme>().notNull(),
    systemPrompt: text('system_prompt').notNull(),
    exampleMessages: jsonb('example_messages').$type<string[]>().default([]),
    isOfficial: boolean('is_official').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      categoryIdx: index('personality_template_category_idx').on(table.category),
    };
  }
);

export type PersonalityTemplate = typeof personalityTemplates.$inferSelect;

export const insertPersonalityTemplateSchema = createInsertSchema(personalityTemplates, {
  traits: personalityTraitsSchema,
  visualTheme: visualThemeSchema,
}).omit({
  id: true,
  createdAt: true,
});

export type InsertPersonalityTemplate = z.infer<typeof insertPersonalityTemplateSchema>;

// ================================
// Database Conversion Schema
// ================================

// Database Conversion Types
export const databaseTypeEnum = pgEnum('database_type', [
  'postgres',
  'mysql',
  'sqlserver',
  'oracle',
  'mongodb',
  'sqlite',
  'csv',
  'excel',
  'json',
  'xml',
]);

export const connectionStatusEnum = pgEnum('connection_status', [
  'connected',
  'disconnected',
  'error',
  'testing',
]);

export const conversionStatusEnum = pgEnum('conversion_status', [
  'pending',
  'analyzing',
  'analyzed',
  'planning',
  'planned',
  'generating_script',
  'script_generated',
  'migrating',
  'migrated',
  'creating_compatibility',
  'completed',
  'error',
]);

// Database Conversion Projects
export const databaseConversionProjects = pgTable(
  'database_conversion_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    sourceConfig: jsonb('source_config').notNull(), // Connection details for source database
    targetConfig: jsonb('target_config').notNull(), // Connection details for target database
    status: text('status').notNull().default('pending'),
    progress: integer('progress').notNull().default(0),
    currentStage: text('current_stage').notNull().default('created'),
    schemaAnalysis: jsonb('schema_analysis'), // Analysis results
    migrationPlan: jsonb('migration_plan'), // Migration plan
    migrationScript: jsonb('migration_script'), // Generated scripts
    migrationResult: jsonb('migration_result'), // Results of migration execution
    compatibilityResult: jsonb('compatibility_result'), // Compatibility layer results
    validationResult: jsonb('validation_result'), // Validation results
    error: text('error'), // Error message if status is 'error'
    createdBy: integer('created_by').notNull(), // User who created the project
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    metadata: jsonb('metadata').default({}), // Additional project metadata
  },
  table => {
    return {
      nameIdx: index('db_conversion_projects_name_idx').on(table.name),
      createdByIdx: index('db_conversion_projects_created_by_idx').on(table.createdBy),
      statusIdx: index('db_conversion_projects_status_idx').on(table.status),
    };
  }
);

export const insertDatabaseConversionProjectSchema = createInsertSchema(
  databaseConversionProjects
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DatabaseConversionProject = typeof databaseConversionProjects.$inferSelect;
export type InsertDatabaseConversionProject = z.infer<typeof insertDatabaseConversionProjectSchema>;

// Connection Templates - Reusable database connection templates
export const connectionTemplates = pgTable(
  'connection_templates',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    databaseType: text('database_type').notNull(), // postgres, mysql, sqlserver, etc.
    connectionConfig: jsonb('connection_config').notNull(), // Connection details
    isPublic: boolean('is_public').default(false),
    createdBy: integer('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('connection_templates_name_idx').on(table.name),
      createdByIdx: index('connection_templates_created_by_idx').on(table.createdBy),
      typeIdx: index('connection_templates_type_idx').on(table.databaseType),
    };
  }
);

export const insertConnectionTemplateSchema = createInsertSchema(connectionTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ConnectionTemplate = typeof connectionTemplates.$inferSelect;
export type InsertConnectionTemplate = z.infer<typeof insertConnectionTemplateSchema>;

// Schema Mappings - Store mapping rules between different database schemas
export const schemaMappings = pgTable(
  'schema_mappings',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    sourceType: text('source_type').notNull(), // postgres, mysql, etc.
    targetType: text('target_type').notNull(), // postgres, mysql, etc.
    mappingRules: jsonb('mapping_rules').notNull(), // Rules for mapping types, constraints, etc.
    customFunctions: jsonb('custom_functions'), // Custom conversion functions
    createdBy: integer('created_by').notNull(),
    isPublic: boolean('is_public').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: index('schema_mappings_name_idx').on(table.name),
      sourceTargetIdx: index('schema_mappings_source_target_idx').on(
        table.sourceType,
        table.targetType
      ),
    };
  }
);

export const insertSchemaMappingSchema = createInsertSchema(schemaMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SchemaMapping = typeof schemaMappings.$inferSelect;
export type InsertSchemaMapping = z.infer<typeof insertSchemaMappingSchema>;

// Conversion Logs - Detailed logs of conversion operations
export const conversionLogs = pgTable(
  'conversion_logs',
  {
    id: serial('id').primaryKey(),
    projectId: uuid('project_id').notNull(), // Reference to databaseConversionProjects
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    level: text('level').notNull(), // info, warning, error
    stage: text('stage').notNull(), // analysis, planning, migration, etc.
    message: text('message').notNull(),
    details: jsonb('details'), // Additional log details
  },
  table => {
    return {
      projectIdIdx: index('conversion_logs_project_id_idx').on(table.projectId),
      timestampIdx: index('conversion_logs_timestamp_idx').on(table.timestamp),
      levelIdx: index('conversion_logs_level_idx').on(table.level),
    };
  }
);

export const insertConversionLogSchema = createInsertSchema(conversionLogs).omit({
  id: true,
  timestamp: true,
});

export type ConversionLog = typeof conversionLogs.$inferSelect;
export type InsertConversionLog = z.infer<typeof insertConversionLogSchema>;

// Compatibility Layers - Store compatibility layer configurations for cross-database compatibility
export const compatibilityLayers = pgTable(
  'compatibility_layers',
  {
    id: serial('id').primaryKey(),
    projectId: uuid('project_id').notNull(), // Reference to databaseConversionProjects
    name: text('name').notNull(),
    description: text('description'),
    sourceType: text('source_type').notNull(), // postgres, mysql, etc.
    targetType: text('target_type').notNull(), // postgres, mysql, etc.
    viewDefinitions: jsonb('view_definitions'), // Views created for compatibility
    functionMappings: jsonb('function_mappings'), // Functions mapped between dialects
    triggerEquivalents: jsonb('trigger_equivalents'), // Trigger equivalents
    syntaxAdaptations: jsonb('syntax_adaptations'), // SQL syntax adaptations
    configurationSettings: jsonb('configuration_settings'), // Configuration settings
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      projectIdIdx: index('compatibility_layers_project_id_idx').on(table.projectId),
      nameIdx: index('compatibility_layers_name_idx').on(table.name),
    };
  }
);

export const insertCompatibilityLayerSchema = createInsertSchema(compatibilityLayers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CompatibilityLayer = typeof compatibilityLayers.$inferSelect;
export type InsertCompatibilityLayer = z.infer<typeof insertCompatibilityLayerSchema>;

// =======================================================================
// AGENT CONTINUOUS LEARNING SYSTEM TABLES
// =======================================================================

// Agent Learning Events - Records learning opportunities, feedback, and experiences
export const agentLearningEvents = pgTable(
  'agent_learning_events',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(), // Agent identifier
    eventType: text('event_type').notNull(), // Maps to LearningEventType enum
    eventData: jsonb('event_data').notNull(), // Structured data about the learning event
    sourceContext: jsonb('source_context'), // Context where the learning occurred (conversation, task, etc.)
    priority: integer('priority').default(1), // 1-5 priority level (5 being highest)
    processed: boolean('processed').default(false), // Whether this event has been processed
    processingNotes: text('processing_notes'), // Notes from the processing of this event
    createdAt: timestamp('created_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  table => {
    return {
      agentIdIdx: index('agent_learning_events_agent_id_idx').on(table.agentId),
      eventTypeIdx: index('agent_learning_events_event_type_idx').on(table.eventType),
      createdAtIdx: index('agent_learning_events_created_at_idx').on(table.createdAt),
    };
  }
);

export const insertAgentLearningEventSchema = createInsertSchema(agentLearningEvents).omit({
  id: true,
  processed: true,
  processingNotes: true,
  createdAt: true,
  processedAt: true,
});

export type AgentLearningEvent = typeof agentLearningEvents.$inferSelect;
export type InsertAgentLearningEvent = z.infer<typeof insertAgentLearningEventSchema>;

// User Feedback - Stores feedback from users about agent performance
export const agentUserFeedback = pgTable(
  'agent_user_feedback',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(), // Agent identifier
    userId: integer('user_id'), // Optional user identifier (may be anonymous)
    conversationId: text('conversation_id'), // Optional reference to specific conversation
    taskId: text('task_id'), // Optional reference to specific task
    feedbackText: text('feedback_text'), // Textual feedback from user
    sentiment: text('sentiment'), // Maps to FeedbackSentiment enum
    rating: integer('rating'), // Optional numerical rating (e.g., 1-5)
    categories: text('categories').array(), // Array of feedback categories
    createdAt: timestamp('created_at').defaultNow().notNull(),
    processed: boolean('processed').default(false), // Whether feedback has been processed for learning
  },
  table => {
    return {
      agentIdIdx: index('agent_user_feedback_agent_id_idx').on(table.agentId),
      sentimentIdx: index('agent_user_feedback_sentiment_idx').on(table.sentiment),
    };
  }
);

export const insertAgentUserFeedbackSchema = createInsertSchema(agentUserFeedback).omit({
  id: true,
  createdAt: true,
  processed: true,
});

export type AgentUserFeedback = typeof agentUserFeedback.$inferSelect;
export type InsertAgentUserFeedback = z.infer<typeof insertAgentUserFeedbackSchema>;

// Agent Knowledge Base - Repository of learned knowledge and insights
export const agentKnowledgeBase = pgTable(
  'agent_knowledge_base',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(), // Agent identifier (or 'shared' for shared knowledge)
    knowledgeType: text('knowledge_type').notNull(), // Type of knowledge: pattern, rule, fact, procedure, concept
    title: text('title').notNull(), // Short title/description
    content: text('content').notNull(), // The actual knowledge content
    sourceEvents: integer('source_events').array(), // IDs of learning events that led to this knowledge
    confidence: numeric('confidence').notNull(), // Confidence score (0.0-1.0)
    usageCount: integer('usage_count').default(0), // How often this knowledge has been applied
    lastUsed: timestamp('last_used'), // When this knowledge was last used
    verified: boolean('verified').default(false), // Whether this knowledge has been verified by experts
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      agentIdTypeIdx: index('agent_knowledge_base_agent_type_idx').on(
        table.agentId,
        table.knowledgeType
      ),
      titleIdx: index('agent_knowledge_base_title_idx').on(table.title),
    };
  }
);

export const insertAgentKnowledgeBaseSchema = createInsertSchema(agentKnowledgeBase).omit({
  id: true,
  usageCount: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export type AgentKnowledgeBase = typeof agentKnowledgeBase.$inferSelect;
export type InsertAgentKnowledgeBase = z.infer<typeof insertAgentKnowledgeBaseSchema>;

// Agent Performance Metrics - Tracks agent performance over time
export const agentPerformanceMetrics = pgTable(
  'agent_performance_metrics',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(), // Agent identifier
    metricType: text('metric_type').notNull(), // Maps to AgentPerformanceMetricType enum
    value: numeric('value').notNull(), // Metric value
    timeframe: text('timeframe').notNull(), // hourly, daily, weekly, monthly
    metadata: jsonb('metadata'), // Additional context about the metric
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      agentMetricTimeframeIdx: index('agent_perf_metrics_agent_metric_time_idx').on(
        table.agentId,
        table.metricType,
        table.timeframe
      ),
      createdAtIdx: index('agent_perf_metrics_created_at_idx').on(table.createdAt),
    };
  }
);

export const insertAgentPerformanceMetricSchema = createInsertSchema(agentPerformanceMetrics).omit({
  id: true,
  createdAt: true,
});

export type AgentPerformanceMetric = typeof agentPerformanceMetrics.$inferSelect;
export type InsertAgentPerformanceMetric = z.infer<typeof insertAgentPerformanceMetricSchema>;

// Agent Health Status - For real-time monitoring of agent health
export enum AgentHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  CRITICAL = 'critical',
  OFFLINE = 'offline',
}

// Agent Health Monitoring - Tracks current health state of agents
export const agentHealthMonitoring = pgTable(
  'agent_health_monitoring',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(), // Agent identifier
    healthStatus: text('health_status').notNull().default(AgentHealthStatus.HEALTHY), // Current health status
    lastUpdated: timestamp('last_updated').defaultNow().notNull(), // Last health check timestamp
    cpuUsage: numeric('cpu_usage'), // Current CPU usage percentage
    memoryUsage: numeric('memory_usage'), // Current memory usage in MB
    responseTime: numeric('response_time'), // Last response time in ms
    uptime: numeric('uptime'), // Uptime in seconds
    activeConnections: integer('active_connections'), // Number of active connections
    lastErrorTimestamp: timestamp('last_error_timestamp'), // When the most recent error occurred
    errorCount: integer('error_count').default(0), // Number of errors since last restart
    llmApiCallCount: integer('llm_api_call_count').default(0), // Number of LLM API calls
    tokenUsage: integer('token_usage').default(0), // Token usage count
    lastActivityTimestamp: timestamp('last_activity_timestamp'), // Last activity timestamp
    alertsTriggered: jsonb('alerts_triggered').default({}), // Alerts that have been triggered
    metadata: jsonb('metadata').default({}), // Additional health information
  },
  table => {
    return {
      agentIdIdx: index('agent_health_agent_id_idx').on(table.agentId),
      lastUpdatedIdx: index('agent_health_last_updated_idx').on(table.lastUpdated),
      healthStatusIdx: index('agent_health_status_idx').on(table.healthStatus),
    };
  }
);

export const insertAgentHealthMonitoringSchema = createInsertSchema(agentHealthMonitoring).omit({
  id: true,
  lastUpdated: true,
});

export type AgentHealthMonitoring = typeof agentHealthMonitoring.$inferSelect;
export type InsertAgentHealthMonitoring = z.infer<typeof insertAgentHealthMonitoringSchema>;

// Agent Learning Models - Tracks agent learning models and their versions
export const agentLearningModels = pgTable(
  'agent_learning_models',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(), // Agent identifier
    modelName: text('model_name').notNull(), // Name of the learning model
    version: text('version').notNull(), // Model version identifier
    provider: text('provider').notNull(), // Maps to LearningModelProvider enum
    configuration: jsonb('configuration'), // Model-specific configuration
    performanceMetrics: jsonb('performance_metrics'), // Performance metrics for this model
    active: boolean('active').default(true), // Whether this model is currently active
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsed: timestamp('last_used').defaultNow().notNull(),
  },
  table => {
    return {
      agentModelVersionIdx: index('agent_learning_models_agent_model_version_idx').on(
        table.agentId,
        table.modelName,
        table.version
      ),
      activeIdx: index('agent_learning_models_active_idx').on(table.active),
    };
  }
);

export const insertAgentLearningModelSchema = createInsertSchema(agentLearningModels).omit({
  id: true,
  active: true,
  createdAt: true,
  lastUsed: true,
});

export type AgentLearningModel = typeof agentLearningModels.$inferSelect;
export type InsertAgentLearningModel = z.infer<typeof insertAgentLearningModelSchema>;

export interface InsertTask {
  id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: number;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EconomicIndicator {
  id: string;
  name: string;
  value: number;
  region: string;
  date: Date;
  source: string;
}
