import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * ENHANCEMENT #1: WORKFLOW CODIFICATION ENGINE (IDE-FOCUSED)
 * PlaybookRegistry - Machine-readable development workflow management
 * Transforms IDE operations into executable agent workflows
 */

export interface WorkflowPlaybook {
  id: string;
  name: string;
  version: string;
  domain: IDEDomain;
  description: string;
  steps: PlaybookStep[];
  requiredCapabilities: string[];
  estimatedDuration: number;
  riskLevel: RiskLevel;
  humanEscalationPoints: string[];
  successCriteria: SuccessCriteria[];
  rollbackProcedure: RollbackStep[];
  metadata: PlaybookMetadata;
}

export interface PlaybookStep {
  id: string;
  name: string;
  action: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  rollbackAction?: string;
  requiredRole: AgentRole;
  parallelExecution: boolean;
  dependencies: string[];
  conditions: ExecutionCondition[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  retryableErrors: string[];
  exponentialBase: number;
  maxBackoffMs: number;
}

export interface ExecutionCondition {
  type: ConditionType;
  expression: string;
  errorMessage: string;
}

export interface SuccessCriteria {
  metric: string;
  operator: ComparisonOperator;
  value: any;
  description: string;
}

export interface RollbackStep {
  stepId: string;
  rollbackAction: string;
  compensationData: any;
}

export interface PlaybookMetadata {
  author: string;
  created: Date;
  lastModified: Date;
  version: string;
  tags: string[];
  ideSpecific: string[];
  frameworkCompatibility: string[];
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

// IDE-specific domains
export enum IDEDomain {
  CODE_ANALYSIS = 'code_analysis',
  BUILD_AUTOMATION = 'build_automation',
  TEST_ORCHESTRATION = 'test_orchestration',
  DEBUGGING_ASSISTANCE = 'debugging_assistance',
  REFACTORING = 'refactoring',
  DOCUMENTATION_GENERATION = 'documentation_generation',
  CODE_REVIEW = 'code_review',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  DEPLOYMENT_PIPELINE = 'deployment_pipeline',
  DEPENDENCY_MANAGEMENT = 'dependency_management'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AgentRole {
  CODE_ANALYZER = 'code_analyzer',
  BUILD_ORCHESTRATOR = 'build_orchestrator',
  TEST_RUNNER = 'test_runner',
  DEBUGGER_ASSISTANT = 'debugger_assistant',
  REFACTORING_AGENT = 'refactoring_agent',
  DOCUMENTATION_AGENT = 'documentation_agent',
  REVIEW_AGENT = 'review_agent',
  PERFORMANCE_OPTIMIZER = 'performance_optimizer'
}

export enum BackoffStrategy {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed'
}

export enum ConditionType {
  PRE_CONDITION = 'pre_condition',
  POST_CONDITION = 'post_condition',
  RUNTIME_CONDITION = 'runtime_condition'
}

export enum ComparisonOperator {
  EQUALS = 'equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  MATCHES = 'matches'
}

/**
 * IDE Playbook Registry - Central management for development workflows
 */
export class IDEPlaybookRegistry extends EventEmitter {
  private playbooks: Map<string, WorkflowPlaybook> = new Map();
  private playbooksByDomain: Map<IDEDomain, WorkflowPlaybook[]> = new Map();
  private logger: Logger;
  private playbookDirectory: string;

  constructor(playbookDirectory: string = './backend/ai-swarm/ide-playbooks') {
    super();
    this.logger = new Logger('IDEPlaybookRegistry');
    this.playbookDirectory = playbookDirectory;
    this.initializeDomainMaps();
  }

  /**
   * Initialize with default IDE workflows
   */
  public async initialize(): Promise<boolean> {
    this.logger.info('🔄 Initializing IDE Playbook Registry...');

    try {
      await this.ensurePlaybookDirectory();
      await this.loadExistingPlaybooks();
      await this.createDefaultIDEPlaybooks();
      await this.validatePlaybooks();

      this.logger.info(`✅ IDE Playbook Registry initialized with ${this.playbooks.size} playbooks`);
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize IDE Playbook Registry:', error);
      return false;
    }
  }

  /**
   * Create default IDE development workflows
   */
  private async createDefaultIDEPlaybooks(): Promise<void> {
    const defaultPlaybooks = [
      this.createCodeAnalysisPlaybook(),
      this.createBuildAutomationPlaybook(),
      this.createTestOrchestrationPlaybook(),
      this.createRefactoringPlaybook(),
      this.createCodeReviewPlaybook(),
      this.createDocumentationPlaybook()
    ];

    for (const playbook of defaultPlaybooks) {
      if (!this.playbooks.has(playbook.id)) {
        await this.registerPlaybook(playbook);
      }
    }
  }

  /**
   * Create comprehensive code analysis workflow
   */
  private createCodeAnalysisPlaybook(): WorkflowPlaybook {
    return {
      id: 'code_analysis_comprehensive',
      name: 'Comprehensive Code Analysis Pipeline',
      version: '1.0.0',
      domain: IDEDomain.CODE_ANALYSIS,
      description: 'Full static analysis, pattern detection, and code quality assessment',
      estimatedDuration: 30000, // 30 seconds
      riskLevel: RiskLevel.LOW,
      requiredCapabilities: ['static_analysis', 'pattern_recognition', 'quality_assessment'],
      humanEscalationPoints: ['critical_security_vulnerability', 'architectural_violation'],
      steps: [
        {
          id: 'syntax_validation',
          name: 'Syntax Validation',
          action: 'validate_syntax',
          description: 'Parse and validate code syntax across all files',
          inputSchema: { type: 'object', properties: { files: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { valid: { type: 'boolean' }, errors: { type: 'array' } } },
          timeoutMs: 5000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['timeout'], exponentialBase: 2, maxBackoffMs: 1000 },
          requiredRole: AgentRole.CODE_ANALYZER,
          parallelExecution: true,
          dependencies: [],
          conditions: []
        },
        {
          id: 'complexity_analysis',
          name: 'Complexity Analysis',
          action: 'analyze_complexity',
          description: 'Calculate cyclomatic complexity and identify complex functions',
          inputSchema: { type: 'object', properties: { syntaxResult: { type: 'object' } } },
          outputSchema: { type: 'object', properties: { complexity: { type: 'object' }, hotspots: { type: 'array' } } },
          timeoutMs: 10000,
          retryPolicy: { maxAttempts: 3, backoffStrategy: BackoffStrategy.EXPONENTIAL, retryableErrors: ['memory_limit'], exponentialBase: 2, maxBackoffMs: 5000 },
          requiredRole: AgentRole.CODE_ANALYZER,
          parallelExecution: true,
          dependencies: ['syntax_validation'],
          conditions: [{ type: ConditionType.PRE_CONDITION, expression: 'syntaxResult.valid === true', errorMessage: 'Cannot analyze invalid syntax' }]
        },
        {
          id: 'security_scan',
          name: 'Security Vulnerability Scan',
          action: 'scan_security',
          description: 'Detect potential security vulnerabilities and unsafe patterns',
          inputSchema: { type: 'object', properties: { files: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { vulnerabilities: { type: 'array' }, riskScore: { type: 'number' } } },
          timeoutMs: 15000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: ['api_timeout'], exponentialBase: 2, maxBackoffMs: 3000 },
          requiredRole: AgentRole.CODE_ANALYZER,
          parallelExecution: true,
          dependencies: ['syntax_validation'],
          conditions: []
        },
        {
          id: 'generate_report',
          name: 'Generate Analysis Report',
          action: 'generate_analysis_report',
          description: 'Compile comprehensive analysis report with recommendations',
          inputSchema: { type: 'object', properties: { results: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { report: { type: 'object' }, recommendations: { type: 'array' } } },
          timeoutMs: 5000,
          retryPolicy: { maxAttempts: 1, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: [], exponentialBase: 2, maxBackoffMs: 1000 },
          requiredRole: AgentRole.CODE_ANALYZER,
          parallelExecution: false,
          dependencies: ['complexity_analysis', 'security_scan'],
          conditions: []
        }
      ],
      successCriteria: [
        { metric: 'analysis_completion_rate', operator: ComparisonOperator.EQUALS, value: 100, description: 'All files analyzed successfully' },
        { metric: 'critical_issues', operator: ComparisonOperator.EQUALS, value: 0, description: 'No critical security issues found' }
      ],
      rollbackProcedure: [],
      metadata: {
        author: 'TerraFusion IDE Swarm',
        created: new Date(),
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['analysis', 'quality', 'security'],
        ideSpecific: ['monaco-editor', 'typescript', 'react'],
        frameworkCompatibility: ['typescript', 'javascript', 'react', 'node']
      }
    };
  }

  /**
   * Create automated build workflow
   */
  private createBuildAutomationPlaybook(): WorkflowPlaybook {
    return {
      id: 'build_automation_full',
      name: 'Full Build Automation Pipeline',
      version: '1.0.0',
      domain: IDEDomain.BUILD_AUTOMATION,
      description: 'Complete build process with optimization and validation',
      estimatedDuration: 120000, // 2 minutes
      riskLevel: RiskLevel.MEDIUM,
      requiredCapabilities: ['build_management', 'dependency_resolution', 'optimization'],
      humanEscalationPoints: ['build_failure', 'dependency_conflicts'],
      steps: [
        {
          id: 'dependency_check',
          name: 'Dependency Validation',
          action: 'validate_dependencies',
          description: 'Check and resolve all project dependencies',
          inputSchema: { type: 'object', properties: { packageFile: { type: 'string' } } },
          outputSchema: { type: 'object', properties: { resolved: { type: 'boolean' }, conflicts: { type: 'array' } } },
          timeoutMs: 30000,
          retryPolicy: { maxAttempts: 3, backoffStrategy: BackoffStrategy.EXPONENTIAL, retryableErrors: ['network_error'], exponentialBase: 2, maxBackoffMs: 10000 },
          requiredRole: AgentRole.BUILD_ORCHESTRATOR,
          parallelExecution: false,
          dependencies: [],
          conditions: []
        },
        {
          id: 'pre_build_analysis',
          name: 'Pre-Build Analysis',
          action: 'analyze_build_requirements',
          description: 'Analyze codebase for build requirements and optimizations',
          inputSchema: { type: 'object', properties: { sourceFiles: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { requirements: { type: 'object' }, optimizations: { type: 'array' } } },
          timeoutMs: 15000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['analysis_timeout'], exponentialBase: 2, maxBackoffMs: 5000 },
          requiredRole: AgentRole.BUILD_ORCHESTRATOR,
          parallelExecution: true,
          dependencies: ['dependency_check'],
          conditions: []
        },
        {
          id: 'compile_typescript',
          name: 'TypeScript Compilation',
          action: 'compile_typescript',
          description: 'Compile TypeScript files with type checking',
          inputSchema: { type: 'object', properties: { tsConfig: { type: 'object' } } },
          outputSchema: { type: 'object', properties: { success: { type: 'boolean' }, errors: { type: 'array' } } },
          timeoutMs: 60000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: ['memory_limit'], exponentialBase: 2, maxBackoffMs: 5000 },
          requiredRole: AgentRole.BUILD_ORCHESTRATOR,
          parallelExecution: false,
          dependencies: ['pre_build_analysis'],
          conditions: []
        },
        {
          id: 'bundle_optimization',
          name: 'Bundle Optimization',
          action: 'optimize_bundle',
          description: 'Optimize and minify the built bundle',
          inputSchema: { type: 'object', properties: { buildOutput: { type: 'object' } } },
          outputSchema: { type: 'object', properties: { optimized: { type: 'boolean' }, sizeReduction: { type: 'number' } } },
          timeoutMs: 30000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['optimization_error'], exponentialBase: 2, maxBackoffMs: 3000 },
          requiredRole: AgentRole.BUILD_ORCHESTRATOR,
          parallelExecution: false,
          dependencies: ['compile_typescript'],
          conditions: [{ type: ConditionType.PRE_CONDITION, expression: 'buildOutput.success === true', errorMessage: 'Cannot optimize failed build' }]
        }
      ],
      successCriteria: [
        { metric: 'build_success', operator: ComparisonOperator.EQUALS, value: true, description: 'Build completed successfully' },
        { metric: 'bundle_size_reduction', operator: ComparisonOperator.GREATER_THAN, value: 10, description: 'At least 10% bundle size reduction' }
      ],
      rollbackProcedure: [
        { stepId: 'bundle_optimization', rollbackAction: 'restore_previous_bundle', compensationData: {} }
      ],
      metadata: {
        author: 'TerraFusion IDE Swarm',
        created: new Date(),
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['build', 'typescript', 'optimization'],
        ideSpecific: ['webpack', 'typescript', 'electron'],
        frameworkCompatibility: ['typescript', 'webpack', 'electron', 'react']
      }
    };
  }

  /**
   * Create test orchestration workflow
   */
  private createTestOrchestrationPlaybook(): WorkflowPlaybook {
    return {
      id: 'test_orchestration_comprehensive',
      name: 'Comprehensive Test Orchestration',
      version: '1.0.0',
      domain: IDEDomain.TEST_ORCHESTRATION,
      description: 'Full test suite execution with parallel optimization',
      estimatedDuration: 90000, // 1.5 minutes
      riskLevel: RiskLevel.LOW,
      requiredCapabilities: ['test_execution', 'parallel_processing', 'coverage_analysis'],
      humanEscalationPoints: ['critical_test_failures', 'coverage_drop'],
      steps: [
        {
          id: 'test_discovery',
          name: 'Test Discovery',
          action: 'discover_tests',
          description: 'Discover and categorize all test files',
          inputSchema: { type: 'object', properties: { testPatterns: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { testFiles: { type: 'array' }, categories: { type: 'object' } } },
          timeoutMs: 10000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['file_access'], exponentialBase: 2, maxBackoffMs: 2000 },
          requiredRole: AgentRole.TEST_RUNNER,
          parallelExecution: false,
          dependencies: [],
          conditions: []
        },
        {
          id: 'unit_tests',
          name: 'Unit Test Execution',
          action: 'run_unit_tests',
          description: 'Execute unit tests with coverage tracking',
          inputSchema: { type: 'object', properties: { unitTests: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { results: { type: 'object' }, coverage: { type: 'object' } } },
          timeoutMs: 45000,
          retryPolicy: { maxAttempts: 1, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: [], exponentialBase: 2, maxBackoffMs: 1000 },
          requiredRole: AgentRole.TEST_RUNNER,
          parallelExecution: true,
          dependencies: ['test_discovery'],
          conditions: []
        },
        {
          id: 'integration_tests',
          name: 'Integration Test Execution',
          action: 'run_integration_tests',
          description: 'Execute integration tests with service mocking',
          inputSchema: { type: 'object', properties: { integrationTests: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { results: { type: 'object' }, serviceHealth: { type: 'object' } } },
          timeoutMs: 30000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.EXPONENTIAL, retryableErrors: ['service_timeout'], exponentialBase: 2, maxBackoffMs: 5000 },
          requiredRole: AgentRole.TEST_RUNNER,
          parallelExecution: true,
          dependencies: ['test_discovery'],
          conditions: []
        },
        {
          id: 'test_report_generation',
          name: 'Test Report Generation',
          action: 'generate_test_report',
          description: 'Generate comprehensive test report with insights',
          inputSchema: { type: 'object', properties: { testResults: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { report: { type: 'object' }, insights: { type: 'array' } } },
          timeoutMs: 5000,
          retryPolicy: { maxAttempts: 1, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: [], exponentialBase: 2, maxBackoffMs: 1000 },
          requiredRole: AgentRole.TEST_RUNNER,
          parallelExecution: false,
          dependencies: ['unit_tests', 'integration_tests'],
          conditions: []
        }
      ],
      successCriteria: [
        { metric: 'test_pass_rate', operator: ComparisonOperator.GREATER_THAN, value: 95, description: 'At least 95% test pass rate' },
        { metric: 'code_coverage', operator: ComparisonOperator.GREATER_THAN, value: 80, description: 'At least 80% code coverage' }
      ],
      rollbackProcedure: [],
      metadata: {
        author: 'TerraFusion IDE Swarm',
        created: new Date(),
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['testing', 'coverage', 'quality'],
        ideSpecific: ['jest', 'typescript', 'react-testing-library'],
        frameworkCompatibility: ['jest', 'vitest', 'cypress', 'playwright']
      }
    };
  }

  /**
   * Create intelligent refactoring workflow
   */
  private createRefactoringPlaybook(): WorkflowPlaybook {
    return {
      id: 'intelligent_refactoring',
      name: 'Intelligent Code Refactoring',
      version: '1.0.0',
      domain: IDEDomain.REFACTORING,
      description: 'AI-powered code refactoring with safety validation',
      estimatedDuration: 60000, // 1 minute
      riskLevel: RiskLevel.MEDIUM,
      requiredCapabilities: ['pattern_recognition', 'code_transformation', 'impact_analysis'],
      humanEscalationPoints: ['breaking_changes', 'complex_dependencies'],
      steps: [
        {
          id: 'refactoring_analysis',
          name: 'Refactoring Opportunity Analysis',
          action: 'analyze_refactoring_opportunities',
          description: 'Identify code smells and refactoring opportunities',
          inputSchema: { type: 'object', properties: { codebase: { type: 'object' } } },
          outputSchema: { type: 'object', properties: { opportunities: { type: 'array' }, priority: { type: 'object' } } },
          timeoutMs: 20000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['analysis_timeout'], exponentialBase: 2, maxBackoffMs: 3000 },
          requiredRole: AgentRole.REFACTORING_AGENT,
          parallelExecution: false,
          dependencies: [],
          conditions: []
        },
        {
          id: 'impact_assessment',
          name: 'Impact Assessment',
          action: 'assess_refactoring_impact',
          description: 'Analyze potential impact of proposed refactoring',
          inputSchema: { type: 'object', properties: { opportunities: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { impact: { type: 'object' }, risks: { type: 'array' } } },
          timeoutMs: 15000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.EXPONENTIAL, retryableErrors: ['dependency_analysis'], exponentialBase: 2, maxBackoffMs: 5000 },
          requiredRole: AgentRole.REFACTORING_AGENT,
          parallelExecution: true,
          dependencies: ['refactoring_analysis'],
          conditions: []
        },
        {
          id: 'safe_refactoring',
          name: 'Safe Refactoring Execution',
          action: 'execute_safe_refactoring',
          description: 'Execute refactoring with rollback capability',
          inputSchema: { type: 'object', properties: { plan: { type: 'object' } } },
          outputSchema: { type: 'object', properties: { changes: { type: 'array' }, rollbackData: { type: 'object' } } },
          timeoutMs: 25000,
          retryPolicy: { maxAttempts: 1, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: [], exponentialBase: 2, maxBackoffMs: 1000 },
          requiredRole: AgentRole.REFACTORING_AGENT,
          parallelExecution: false,
          dependencies: ['impact_assessment'],
          conditions: [{ type: ConditionType.PRE_CONDITION, expression: 'impact.risk_level !== "high"', errorMessage: 'High-risk refactoring requires human approval' }]
        }
      ],
      successCriteria: [
        { metric: 'refactoring_success', operator: ComparisonOperator.EQUALS, value: true, description: 'Refactoring completed without errors' },
        { metric: 'code_quality_improvement', operator: ComparisonOperator.GREATER_THAN, value: 5, description: 'At least 5% code quality improvement' }
      ],
      rollbackProcedure: [
        { stepId: 'safe_refactoring', rollbackAction: 'restore_original_code', compensationData: {} }
      ],
      metadata: {
        author: 'TerraFusion IDE Swarm',
        created: new Date(),
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['refactoring', 'quality', 'automation'],
        ideSpecific: ['typescript', 'ast-manipulation'],
        frameworkCompatibility: ['typescript', 'javascript', 'react']
      }
    };
  }

  /**
   * Create code review workflow
   */
  private createCodeReviewPlaybook(): WorkflowPlaybook {
    return {
      id: 'automated_code_review',
      name: 'Automated Code Review',
      version: '1.0.0',
      domain: IDEDomain.CODE_REVIEW,
      description: 'Comprehensive automated code review with human-like insights',
      estimatedDuration: 45000, // 45 seconds
      riskLevel: RiskLevel.LOW,
      requiredCapabilities: ['code_analysis', 'pattern_recognition', 'best_practices'],
      humanEscalationPoints: ['architectural_concerns', 'security_issues'],
      steps: [
        {
          id: 'diff_analysis',
          name: 'Change Diff Analysis',
          action: 'analyze_code_changes',
          description: 'Analyze code changes and identify review focus areas',
          inputSchema: { type: 'object', properties: { diff: { type: 'object' } } },
          outputSchema: { type: 'object', properties: { changes: { type: 'array' }, focusAreas: { type: 'array' } } },
          timeoutMs: 10000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['diff_parse_error'], exponentialBase: 2, maxBackoffMs: 2000 },
          requiredRole: AgentRole.REVIEW_AGENT,
          parallelExecution: false,
          dependencies: [],
          conditions: []
        },
        {
          id: 'style_compliance',
          name: 'Style and Standards Compliance',
          action: 'check_style_compliance',
          description: 'Verify code follows style guidelines and coding standards',
          inputSchema: { type: 'object', properties: { changes: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { violations: { type: 'array' }, score: { type: 'number' } } },
          timeoutMs: 15000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: ['linting_error'], exponentialBase: 2, maxBackoffMs: 3000 },
          requiredRole: AgentRole.REVIEW_AGENT,
          parallelExecution: true,
          dependencies: ['diff_analysis'],
          conditions: []
        },
        {
          id: 'logic_review',
          name: 'Logic and Algorithm Review',
          action: 'review_logic_patterns',
          description: 'Review code logic, algorithms, and potential improvements',
          inputSchema: { type: 'object', properties: { changes: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { suggestions: { type: 'array' }, concerns: { type: 'array' } } },
          timeoutMs: 20000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.EXPONENTIAL, retryableErrors: ['complexity_analysis'], exponentialBase: 2, maxBackoffMs: 5000 },
          requiredRole: AgentRole.REVIEW_AGENT,
          parallelExecution: true,
          dependencies: ['diff_analysis'],
          conditions: []
        },
        {
          id: 'generate_review_summary',
          name: 'Generate Review Summary',
          action: 'generate_review_report',
          description: 'Generate comprehensive review summary with actionable feedback',
          inputSchema: { type: 'object', properties: { reviewData: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { summary: { type: 'object' }, recommendations: { type: 'array' } } },
          timeoutMs: 5000,
          retryPolicy: { maxAttempts: 1, backoffStrategy: BackoffStrategy.FIXED, retryableErrors: [], exponentialBase: 2, maxBackoffMs: 1000 },
          requiredRole: AgentRole.REVIEW_AGENT,
          parallelExecution: false,
          dependencies: ['style_compliance', 'logic_review'],
          conditions: []
        }
      ],
      successCriteria: [
        { metric: 'review_completeness', operator: ComparisonOperator.EQUALS, value: 100, description: 'All code changes reviewed' },
        { metric: 'actionable_feedback', operator: ComparisonOperator.GREATER_THAN, value: 0, description: 'Generated actionable feedback' }
      ],
      rollbackProcedure: [],
      metadata: {
        author: 'TerraFusion IDE Swarm',
        created: new Date(),
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['review', 'quality', 'feedback'],
        ideSpecific: ['git', 'typescript', 'eslint'],
        frameworkCompatibility: ['typescript', 'javascript', 'react', 'node']
      }
    };
  }

  /**
   * Create documentation generation workflow
   */
  private createDocumentationPlaybook(): WorkflowPlaybook {
    return {
      id: 'auto_documentation_generation',
      name: 'Automated Documentation Generation',
      version: '1.0.0',
      domain: IDEDomain.DOCUMENTATION_GENERATION,
      description: 'Intelligent documentation generation from code analysis',
      estimatedDuration: 40000, // 40 seconds
      riskLevel: RiskLevel.LOW,
      requiredCapabilities: ['code_parsing', 'natural_language_generation', 'documentation_formatting'],
      humanEscalationPoints: ['complex_business_logic'],
      steps: [
        {
          id: 'code_structure_analysis',
          name: 'Code Structure Analysis',
          action: 'analyze_code_structure',
          description: 'Analyze code structure, interfaces, and dependencies',
          inputSchema: { type: 'object', properties: { sourceFiles: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { structure: { type: 'object' }, interfaces: { type: 'array' } } },
          timeoutMs: 15000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['parse_error'], exponentialBase: 2, maxBackoffMs: 3000 },
          requiredRole: AgentRole.DOCUMENTATION_AGENT,
          parallelExecution: false,
          dependencies: [],
          conditions: []
        },
        {
          id: 'api_documentation',
          name: 'API Documentation Generation',
          action: 'generate_api_docs',
          description: 'Generate API documentation from type definitions and comments',
          inputSchema: { type: 'object', properties: { interfaces: { type: 'array' } } },
          outputSchema: { type: 'object', properties: { apiDocs: { type: 'object' }, examples: { type: 'array' } } },
          timeoutMs: 20000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.EXPONENTIAL, retryableErrors: ['generation_error'], exponentialBase: 2, maxBackoffMs: 5000 },
          requiredRole: AgentRole.DOCUMENTATION_AGENT,
          parallelExecution: true,
          dependencies: ['code_structure_analysis'],
          conditions: []
        },
        {
          id: 'readme_generation',
          name: 'README Generation',
          action: 'generate_readme',
          description: 'Generate comprehensive README with usage examples',
          inputSchema: { type: 'object', properties: { projectStructure: { type: 'object' } } },
          outputSchema: { type: 'object', properties: { readme: { type: 'string' }, sections: { type: 'array' } } },
          timeoutMs: 15000,
          retryPolicy: { maxAttempts: 2, backoffStrategy: BackoffStrategy.LINEAR, retryableErrors: ['template_error'], exponentialBase: 2, maxBackoffMs: 3000 },
          requiredRole: AgentRole.DOCUMENTATION_AGENT,
          parallelExecution: true,
          dependencies: ['code_structure_analysis'],
          conditions: []
        }
      ],
      successCriteria: [
        { metric: 'documentation_coverage', operator: ComparisonOperator.GREATER_THAN, value: 80, description: 'At least 80% documentation coverage' },
        { metric: 'examples_generated', operator: ComparisonOperator.GREATER_THAN, value: 0, description: 'Generated usage examples' }
      ],
      rollbackProcedure: [],
      metadata: {
        author: 'TerraFusion IDE Swarm',
        created: new Date(),
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['documentation', 'api', 'readme'],
        ideSpecific: ['typedoc', 'markdown', 'typescript'],
        frameworkCompatibility: ['typescript', 'javascript', 'jsdoc']
      }
    };
  }

  // Rest of the registry implementation (registerPlaybook, getPlaybook, etc.)
  // ... (keeping the same structure as before but IDE-focused)

  public async registerPlaybook(playbook: WorkflowPlaybook): Promise<boolean> {
    try {
      const validation = await this.validatePlaybook(playbook);
      if (!validation.valid) {
        throw new Error(`Playbook validation failed: ${validation.errors.join(', ')}`);
      }

      this.playbooks.set(playbook.id, playbook);

      if (!this.playbooksByDomain.has(playbook.domain)) {
        this.playbooksByDomain.set(playbook.domain, []);
      }
      this.playbooksByDomain.get(playbook.domain)!.push(playbook);

      await this.persistPlaybook(playbook);

      this.logger.info(`📋 Registered IDE playbook: ${playbook.name} (${playbook.id})`);
      this.emit('playbook_registered', playbook);

      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to register IDE playbook ${playbook.id}:`, error);
      return false;
    }
  }


  // Private helper methods (simplified for brevity)
  private initializeDomainMaps(): void {
    Object.values(IDEDomain).forEach(domain => {
      this.playbooksByDomain.set(domain, []);
    });
  }

  private async ensurePlaybookDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.playbookDirectory, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async loadExistingPlaybooks(): Promise<void> {
    // Implementation similar to previous but for IDE playbooks
  }

  private async validatePlaybooks(): Promise<void> {
    // Validation logic
  }

  private async validatePlaybook(playbook: WorkflowPlaybook): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!playbook.id) errors.push('Missing required field: id');
    if (!playbook.name) errors.push('Missing required field: name');
    if (!playbook.domain) errors.push('Missing required field: domain');
    if (!playbook.steps || playbook.steps.length === 0) errors.push('Must have at least one step');

    return { valid: errors.length === 0, errors };
  }

  private async persistPlaybook(playbook: WorkflowPlaybook): Promise<void> {
    const filePath = join(this.playbookDirectory, `${playbook.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(playbook, null, 2), 'utf-8');
  }

  // ==========================================
  // PUBLIC API METHODS (Missing methods)
  // ==========================================

  /**
   * Load default playbooks (alias for initialize)
   */
  public async loadDefaultPlaybooks(): Promise<void> {
    await this.initialize();
  }

  /**
   * Get all available playbooks
   */
  public getAvailablePlaybooks(): WorkflowPlaybook[] {
    return Array.from(this.playbooks.values());
  }

  /**
   * Get playbook by ID
   */
  public getPlaybook(id: string): WorkflowPlaybook | undefined {
    return this.playbooks.get(id);
  }

  /**
   * Get playbooks by domain
   */
  public getPlaybooksByDomain(domain: IDEDomain): WorkflowPlaybook[] {
    return Array.from(this.playbooks.values()).filter(
      playbook => playbook.domain === domain
    );
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Export singleton instance
export const idePlaybookRegistry = new IDEPlaybookRegistry('./backend/ai-swarm/ide-playbooks');