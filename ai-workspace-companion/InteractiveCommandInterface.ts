/**
 * Interactive Command Interface for Workspace Companion Agent
 * Provides natural language processing and command interpretation
 */

import * as readline from 'readline';
import WorkspaceCompanionAgent from './WorkspaceCompanionAgent';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
}

export interface NaturalLanguageCommand {
  intent: string;
  confidence: number;
  entities: string[];
  action: string;
  parameters: Record<string, any>;
}

export class InteractiveCommandInterface {
  private agent: WorkspaceCompanionAgent;
  private rl: readline.Interface;
  private isRunning: boolean = false;
  private commandHistory: string[] = [];
  private naturalLanguageProcessor: NaturalLanguageProcessor;

  constructor(agent: WorkspaceCompanionAgent) {
    this.agent = agent;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 Terrafusion> ',
    });
    this.naturalLanguageProcessor = new NaturalLanguageProcessor();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the agent
   */
  private setupEventListeners(): void {
    this.agent.on('agent-activated', () => {
      console.log('🎉 Agent activated successfully!');
    });

    this.agent.on('file-changed', change => {
      console.log(`📝 File change detected: ${change.filename} (${change.action})`);
    });

    this.agent.on('health-critical', () => {
      console.log('🚨 CRITICAL HEALTH ISSUE DETECTED!');
      console.log('Please run .health for detailed information');
    });

    this.agent.on('health-warning', () => {
      console.log('⚠️ Health warning detected');
      console.log('Please run .health for detailed information');
    });
  }

  /**
   * Start the interactive command interface
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Interface is already running');
      return;
    }

    this.isRunning = true;

    // Activate the agent first
    await this.agent.activate();

    console.log('');
    console.log('🎯 Interactive Command Interface Started');
    console.log('Type commands or ask questions naturally');
    console.log('Type .help for available commands');
    console.log('Type .exit to quit');
    console.log('');

    // Start command loop
    this.startCommandLoop();
  }

  /**
   * Start the main command loop
   */
  private startCommandLoop(): void {
    this.rl.prompt();

    this.rl.on('line', async input => {
      const trimmedInput = input.trim();

      if (trimmedInput === '') {
        this.rl.prompt();
        return;
      }

      // Add to command history
      this.commandHistory.push(trimmedInput);

      try {
        // Process the command
        const result = await this.processCommand(trimmedInput);

        // Display result
        this.displayResult(result);
      } catch (error) {
        console.error('❌ Error processing command:', error);
      }

      // Prompt for next command
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('👋 Goodbye! Deactivating agent...');
      this.agent.deactivate();
      process.exit(0);
    });
  }

  /**
   * Process user input as either a command or natural language
   */
  private async processCommand(input: string): Promise<CommandResult> {
    // Check if it's a dot command
    if (input.startsWith('.')) {
      return await this.processDotCommand(input);
    }

    // Process as natural language
    return await this.processNaturalLanguage(input);
  }

  /**
   * Process dot commands (traditional command interface)
   */
  private async processDotCommand(input: string): Promise<CommandResult> {
    const { name, args } = this.parseArgsForDotCommand(input.substring(1));

    switch (name) {
      case 'status':
        return await this.handleStatusCommand();

      case 'health':
        return await this.handleHealthCommand();

      case 'ai-swarm':
        return await this.handleAISwarmCommand();

      case 'capabilities':
        return await this.handleCapabilitiesCommand();

      case 'ai-generate':
        return await this.handleAIGenerateCommand(args);

      case 'ai-review':
        return await this.handleAIReviewCommand(args);

      case 'ai-test':
        return await this.handleAITestCommand(args);

      case 'ai-refactor':
        return await this.handleAIRefactorCommand(args);

      case 'ai-solve':
        return await this.handleAISolveCommand(args);

      case 'ai-architecture':
        return await this.handleAIArchitectureCommand(args);

      case 'ai-compliance':
        return await this.handleAIComplianceCommand(args);

      case 'diagnostics':
        return await this.handleDiagnosticsCommand();

      case 'security':
        return await this.handleSecurityCommand();

      case 'quantum':
        return await this.handleQuantumCommand();

      case 'ecosystem':
        return await this.handleEcosystemCommand();

      case 'compliance-status':
        return await this.handleComplianceStatusCommand();

      case 'audit-trail':
        return await this.handleAuditTrailCommand();

      case 'help':
        return await this.handleHelpCommand();

      case 'deactivate':
        return await this.handleDeactivateCommand();

      case 'exit':
      case 'quit':
        return await this.handleExitCommand();

      case 'clear':
        return await this.handleClearCommand();

      case 'history':
        return await this.handleHistoryCommand();

      default:
        return {
          success: false,
          message: `Unknown command: ${name}`,
          suggestions: ['Type .help for available commands'],
        };
    }
  }

  /**
   * Parse dot command input into name and arguments, supporting quoted strings
   */
  private parseArgsForDotCommand(input: string): { name: string; args: string[] } {
    const tokens = this.tokenize(input);
    const name = (tokens.shift() || '').toLowerCase();
    return { name, args: tokens };
  }

  /**
   * Tokenize a command line preserving quoted substrings
   */
  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    for (let i = 0; i < input.length; i++) {
      const ch = input[i] || '';
      if ((ch === '"' || ch === "'") && (!inQuotes || ch === quoteChar)) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = ch;
        } else {
          inQuotes = false;
          quoteChar = '';
        }
        continue;
      }
      if (!inQuotes && /\s/.test(ch)) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current.length > 0) tokens.push(current);
    return tokens;
  }

  /**
   * Process natural language input
   */
  private async processNaturalLanguage(input: string): Promise<CommandResult> {
    try {
      // Parse natural language
      const parsed = this.naturalLanguageProcessor.parse(input);

      if (parsed.confidence > 0.7) {
        // High confidence - execute the action
        return await this.executeNaturalLanguageAction(parsed);
      } else if (parsed.confidence > 0.4) {
        // Medium confidence - ask for clarification
        return {
          success: false,
          message: `I'm not sure I understood. Did you mean: ${parsed.action}?`,
          suggestions: ['Please rephrase your request', 'Use .help for available commands'],
        };
      } else {
        // Low confidence - provide help
        return {
          success: false,
          message: "I didn't understand that request. How can I help you?",
          suggestions: [
            'Ask about system status: "How is the system doing?"',
            'Check AI swarm: "Show me the AI agents"',
            'Get help: "What can you do?"',
            'Use .help for command list',
          ],
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error processing natural language input',
        suggestions: ['Try using dot commands (.help) or rephrase your request'],
      };
    }
  }

  /**
   * Execute natural language actions
   */
  private async executeNaturalLanguageAction(
    parsed: NaturalLanguageCommand
  ): Promise<CommandResult> {
    switch (parsed.action) {
      case 'check_status':
        return await this.handleStatusCommand();

      case 'check_health':
        return await this.handleHealthCommand();

      case 'check_ai_swarm':
        return await this.handleAISwarmCommand();

      case 'show_capabilities':
        return await this.handleCapabilitiesCommand();

      case 'get_help':
        return await this.handleHelpCommand();

      case 'optimize_performance':
        return await this.handleOptimizePerformanceCommand();

      case 'run_tests':
        return await this.handleRunTestsCommand();

      case 'check_compliance':
        return await this.handleCheckComplianceCommand();

      default:
        return {
          success: false,
          message: `Action not implemented: ${parsed.action}`,
          suggestions: ['Use .help for available commands'],
        };
    }
  }

  /**
   * Handle status command
   */
  private async handleStatusCommand(): Promise<CommandResult> {
    const status = this.agent.getStatus();

    return {
      success: true,
      message: 'Current Workspace Status',
      data: {
        project: status.projectName,
        directory: status.currentDirectory,
        mode: status.developmentMode,
        gitBranch: status.gitStatus.currentBranch,
        uncommittedChanges: status.gitStatus.uncommittedChanges.length,
        systemHealth: status.systemHealth.overallHealth,
        aiAgents: `${status.aiSwarmStatus.activeAgents}/${status.aiSwarmStatus.totalAgents}`,
        recentChanges: status.recentChanges.slice(0, 5),
      },
    };
  }

  /**
   * Handle health command
   */
  private async handleHealthCommand(): Promise<CommandResult> {
    const health = await this.agent.performHealthCheck();

    return {
      success: true,
      message: 'System Health Check Results',
      data: {
        overall: health.overallHealth,
        backend: health.backendStatus,
        frontend: health.frontendStatus,
        database: health.databaseStatus,
        aiSwarm: health.aiSwarmStatus,
        quantumEngine: health.quantumEngineStatus,
      },
    };
  }

  /**
   * Handle AI swarm command
   */
  private async handleAISwarmCommand(): Promise<CommandResult> {
    const aiSwarm = await this.agent.getAISwarmStatus();

    return {
      success: true,
      message: 'AI Swarm Status',
      data: {
        totalAgents: aiSwarm.totalAgents,
        activeAgents: aiSwarm.activeAgents,
        agentTypes: aiSwarm.agentTypes,
        performance: aiSwarm.performanceMetrics,
      },
    };
  }

  /**
   * Handle capabilities command
   */
  private async handleCapabilitiesCommand(): Promise<CommandResult> {
    const capabilities = this.agent.getCapabilities();

    return {
      success: true,
      message: 'Agent Capabilities',
      data: capabilities,
    };
  }

  /**
   * Handle help command
   */
  private async handleHelpCommand(): Promise<CommandResult> {
    this.agent.showHelp();

    console.log('');
    console.log('🤖 AI TOOLS COMMANDS:');
    console.log('   .ai-generate <lang> <prompt>     - Generate code using AI');
    console.log('   .ai-review <lang> <code>         - Review code using AI');
    console.log('   .ai-test <lang> <code> [fw]      - Generate tests using AI');
    console.log('   .ai-refactor <lang> <code>       - Get refactoring suggestions');
    console.log('   .ai-solve <description> [logs]   - Solve problems using AI');
    console.log('   .ai-architecture <comp> <reqs>   - Get architecture advice');
    console.log('   .ai-compliance <code> [standards] - Validate compliance');
    console.log('');
    console.log('🔬 ADVANCED ENTERPRISE COMMANDS:');
    console.log('   .diagnostics                     - Run comprehensive diagnostics');
    console.log('   .security                        - View security metrics');
    console.log('   .quantum                         - Check quantum optimization');
    console.log('   .ecosystem                       - View Terrafusion ecosystem');
    console.log('   .compliance-status               - Get compliance validation status');
    console.log('   .audit-trail                     - Review security audit trail');
    console.log('');
    console.log("💡 AI Tools powered by Terrafusion's advanced capabilities:");
    console.log('   • OpenAI GPT-4 integration with quantum optimization');
    console.log('   • Government compliance validation (FISMA, NIST, Section 508)');
    console.log('   • Enterprise security & audit trails');
    console.log('   • 949x performance optimization algorithms');

    return {
      success: true,
      message: 'Help information displayed above',
    };
  }

  /**
   * Handle deactivate command
   */
  private async handleDeactivateCommand(): Promise<CommandResult> {
    await this.agent.deactivate();

    return {
      success: true,
      message: 'Agent deactivated',
    };
  }

  /**
   * Handle exit command
   */
  private async handleExitCommand(): Promise<CommandResult> {
    this.rl.close();

    return {
      success: true,
      message: 'Exiting...',
    };
  }

  /**
   * Handle clear command
   */
  private async handleClearCommand(): Promise<CommandResult> {
    console.clear();

    return {
      success: true,
      message: 'Screen cleared',
    };
  }

  /**
   * Handle history command
   */
  private async handleHistoryCommand(): Promise<CommandResult> {
    const recentHistory = this.commandHistory.slice(-10);

    return {
      success: true,
      message: 'Recent Command History',
      data: recentHistory,
    };
  }

  /**
   * Handle optimize performance command
   */
  private async handleOptimizePerformanceCommand(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Performance optimization suggestions',
      data: {
        suggestions: [
          'Enable quantum performance engine',
          'Optimize AI swarm coordination',
          'Implement advanced caching',
          'Use parallel processing',
          'Monitor performance metrics',
        ],
      },
    };
  }

  /**
   * Handle run tests command
   */
  private async handleRunTestsCommand(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Test execution options',
      data: {
        commands: [
          'npm test - Run all tests',
          'npm run test:ci - Run tests with coverage',
          'npm run test:real - Run real system tests',
          'npm run test:ai-swarm - Test AI swarm',
          'npm run test:quantum - Test quantum performance',
        ],
      },
    };
  }

  /**
   * Handle check compliance command
   */
  private async handleCheckComplianceCommand(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Compliance validation options',
      data: {
        standards: [
          'FISMA compliance (NIST 800-53)',
          'Section 508 accessibility (WCAG 2.1 AA)',
          'Government data protection',
          'Audit trail requirements',
          'Security controls',
        ],
        commands: [
          'npm run compliance:audit - Run compliance audit',
          'npm run security:scan - Security vulnerability scan',
          'npm run mcp:validate - MCP validation',
        ],
      },
    };
  }

  // ===== AI TOOL COMMAND HANDLERS =====

  /**
   * Handle AI code generation command
   */
  private async handleAIGenerateCommand(args?: string[]): Promise<CommandResult> {
    try {
      if (!args || args.length < 2) {
        return {
          success: false,
          message: 'Usage: .ai-generate <language> <prompt>',
        };
      }
      const language = args[0] || 'typescript';
      const prompt = args.slice(1).join(' ') || 'Generate a simple function';
      const code = await this.agent.generateCode(prompt, language);
      return {
        success: true,
        message: 'AI Code Generation result',
        data: { language, prompt, code },
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Code Generation failed',
        suggestions: ['Check your input format', 'Ensure the agent is active'],
      };
    }
  }

  /**
   * Handle AI code review command
   */
  private async handleAIReviewCommand(args?: string[]): Promise<CommandResult> {
    try {
      if (!args || args.length < 2) {
        return {
          success: false,
          message: 'Usage: .ai-review <language> <code>',
        };
      }
      const language = args[0] || 'typescript';
      const codeSnippet = args.slice(1).join(' ') || 'function example() { return true; }';
      const review = await this.agent.reviewCode(codeSnippet, language);
      return {
        success: true,
        message: 'AI Code Review result',
        data: { language, review },
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Code Review failed',
        suggestions: ['Check your input format', 'Ensure the agent is active'],
      };
    }
  }

  /**
   * Handle AI test generation command
   */
  private async handleAITestCommand(args?: string[]): Promise<CommandResult> {
    try {
      if (!args || args.length < 2) {
        return {
          success: false,
          message: 'Usage: .ai-test <language> <code> [framework]',
        };
      }
      const language = args[0] || 'typescript';
      const hasFramework = args.length >= 3;
      const framework = hasFramework ? args[args.length - 1] : undefined;
      const codeSnippet = hasFramework
        ? args.slice(1, -1).join(' ')
        : args.slice(1).join(' ') || 'class Example { method() {} }';
      const tests = await this.agent.generateTests(codeSnippet, language, framework);
      return {
        success: true,
        message: 'AI Test Generation result',
        data: { language, framework: framework || null, tests },
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Test Generation failed',
        suggestions: ['Check your input format', 'Ensure the agent is active'],
      };
    }
  }

  /**
   * Handle AI refactoring command
   */
  private async handleAIRefactorCommand(args?: string[]): Promise<CommandResult> {
    try {
      if (!args || args.length < 2) {
        return {
          success: false,
          message: 'Usage: .ai-refactor <language> <code>',
        };
      }
      const language = args[0] || 'typescript';
      const codeSnippet = args.slice(1).join(' ') || 'function complex() { return true; }';
      const refactoring = await this.agent.suggestRefactoring(codeSnippet, language);
      return {
        success: true,
        message: 'AI Refactoring result',
        data: { language, refactoring },
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Refactoring Analysis failed',
        suggestions: ['Check your input format', 'Ensure the agent is active'],
      };
    }
  }

  /**
   * Handle AI problem solving command
   */
  private async handleAISolveCommand(args?: string[]): Promise<CommandResult> {
    try {
      if (!args || args.length < 1) {
        return {
          success: false,
          message: 'Usage: .ai-solve <description> [error-logs]',
        };
      }
      const hasLogs = args.length >= 2;
      const description = hasLogs
        ? args[0] || 'API is returning errors'
        : args.join(' ') || 'API is returning errors';
      const logs = hasLogs ? args.slice(1).join(' ') : undefined;
      const solution = await this.agent.solveProblem(description, logs);
      return {
        success: true,
        message: 'AI Problem Solver result',
        data: { description, logs: logs || null, solution },
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Problem Solver failed',
        suggestions: ['Check your input format', 'Ensure the agent is active'],
      };
    }
  }

  /**
   * Handle AI architecture command
   */
  private async handleAIArchitectureCommand(args?: string[]): Promise<CommandResult> {
    try {
      if (!args || args.length < 1) {
        return {
          success: false,
          message: 'Usage: .ai-architecture <component> <requirements...>',
        };
      }
      const component = args[0] || 'UserService';
      const requirements = args.slice(1).length > 0 ? args.slice(1) : ['scalable', 'secure'];
      const advice = await this.agent.getArchitectureAdvice(component, requirements);
      return {
        success: true,
        message: 'AI Architecture Advisor result',
        data: { component, requirements, advice },
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Architecture Advisor failed',
        suggestions: ['Check your input format', 'Ensure the agent is active'],
      };
    }
  }

  /**
   * Handle AI compliance validation command
   */
  private async handleAIComplianceCommand(args?: string[]): Promise<CommandResult> {
    try {
      if (!args || args.length < 1) {
        return {
          success: false,
          message: 'Usage: .ai-compliance <code> [standards...]',
        };
      }
      const codeSnippet = args[0] || 'function processData() { return true; }';
      const standards = args.slice(1).length > 0 ? args.slice(1) : ['FISMA', 'NIST-800-53'];
      const validation = await this.agent.validateCompliance(codeSnippet, standards);
      return {
        success: true,
        message: 'AI Compliance Validation result',
        data: {
          standards: standards.length ? standards : ['FISMA', 'NIST-800-53', 'Section-508'],
          validation,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Compliance Validator failed',
        suggestions: ['Check your input format', 'Ensure the agent is active'],
      };
    }
  }

  // ===== ADVANCED ENTERPRISE COMMANDS =====

  /**
   * Handle diagnostics command
   */
  private async handleDiagnosticsCommand(): Promise<CommandResult> {
    try {
      console.log('🔬 Running advanced system diagnostics...');
      const diagnostics = await this.agent.performAdvancedDiagnostics();

      return {
        success: true,
        message: 'Advanced diagnostics completed',
        data: {
          systemHealth: diagnostics.systemHealth.overallHealth,
          securityScore: diagnostics.securityMetrics.securityScore,
          complianceStatus: diagnostics.complianceStatus.overallStatus,
          quantumOptimization: diagnostics.quantumMetrics.optimizationLevel,
          aiSwarm: `${diagnostics.ecosystemStatus.aiSwarm.activeAgents}/${diagnostics.ecosystemStatus.aiSwarm.totalAgents} agents`,
          recommendations: diagnostics.recommendations,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Diagnostics failed',
        suggestions: ['Check agent initialization', 'Verify workspace configuration'],
      };
    }
  }

  /**
   * Handle security command
   */
  private async handleSecurityCommand(): Promise<CommandResult> {
    try {
      console.log('🔒 Retrieving security metrics...');
      const security = await this.agent.getSecurityMetrics();

      return {
        success: true,
        message: 'Security metrics retrieved',
        data: {
          securityScore: security.securityScore,
          totalRequests: security.totalRequests,
          complianceRate: security.complianceRate,
          highRiskRequests: security.highRiskRequests,
          auditEntries: security.auditEntries,
          encryptionStatus: security.encryptionStatus,
          accessControl: security.accessControl,
          auditLogging: security.auditLogging,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Security metrics retrieval failed',
        suggestions: ['Check agent security configuration'],
      };
    }
  }

  /**
   * Handle quantum command
   */
  private async handleQuantumCommand(): Promise<CommandResult> {
    try {
      console.log('⚡ Retrieving quantum optimization metrics...');
      const quantum = await this.agent.getQuantumMetrics();

      return {
        success: true,
        message: 'Quantum metrics retrieved',
        data: {
          optimizationLevel: quantum.optimizationLevel,
          algorithmsActive: quantum.algorithmsActive,
          totalOptimizations: quantum.totalOptimizations,
          averageGain: quantum.averageGain,
          successRate: quantum.successRate,
          processingMode: quantum.processingMode,
          efficiency: quantum.efficiency,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Quantum metrics retrieval failed',
        suggestions: ['Check quantum engine configuration'],
      };
    }
  }

  /**
   * Handle ecosystem command
   */
  private async handleEcosystemCommand(): Promise<CommandResult> {
    try {
      console.log('🌐 Retrieving Terrafusion ecosystem status...');
      const ecosystem = await this.agent.getEcosystemStatus();

      return {
        success: true,
        message: 'Ecosystem status retrieved',
        data: {
          aiSwarm: ecosystem.aiSwarm,
          modules: ecosystem.modules,
          marketplace: ecosystem.marketplace,
          quantumEngine: ecosystem.quantumEngine,
          compliance: ecosystem.compliance,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ecosystem status retrieval failed',
        suggestions: ['Check Terrafusion configuration'],
      };
    }
  }

  /**
   * Handle compliance status command
   */
  private async handleComplianceStatusCommand(): Promise<CommandResult> {
    try {
      console.log('📋 Retrieving compliance validation status...');
      const compliance = await this.agent.getComplianceStatus();

      return {
        success: true,
        message: 'Compliance status retrieved',
        data: {
          overallStatus: compliance.overallStatus,
          standards: compliance.standards,
          violations: compliance.violations,
          recommendations: compliance.recommendations,
          riskLevel: compliance.riskLevel,
          lastValidation: compliance.lastValidation,
          certificationStatus: compliance.certificationStatus,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Compliance status retrieval failed',
        suggestions: ['Check compliance configuration'],
      };
    }
  }

  /**
   * Handle audit trail command
   */
  private async handleAuditTrailCommand(): Promise<CommandResult> {
    try {
      console.log('📊 Retrieving audit trail...');
      const aiService = this.agent.getAIService();
      const auditTrail = aiService.getAuditTrail();

      const recentEntries = auditTrail.slice(-10).map(entry => ({
        timestamp: entry.timestamp.toISOString(),
        action: entry.action,
        user: entry.user,
        resource: entry.resource,
        compliance: entry.compliance,
        riskLevel: entry.riskLevel,
        quantumOptimized: entry.quantumOptimized,
      }));

      return {
        success: true,
        message: 'Audit trail retrieved',
        data: {
          totalEntries: auditTrail.length,
          recentEntries,
          summary: {
            compliantActions: auditTrail.filter(e => e.compliance).length,
            highRiskActions: auditTrail.filter(e => e.riskLevel === 'high').length,
            quantumOptimizedActions: auditTrail.filter(e => e.quantumOptimized).length,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Audit trail retrieval failed',
        suggestions: ['Check audit logging configuration'],
      };
    }
  }

  /**
   * Display command result
   */
  private displayResult(result: CommandResult): void {
    if (result.success) {
      console.log(`✅ ${result.message}`);

      if (result.data) {
        console.log('📊 Data:');
        console.log(JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log(`❌ ${result.message}`);

      if (result.suggestions && result.suggestions.length > 0) {
        console.log('💡 Suggestions:');
        result.suggestions.forEach(suggestion => {
          console.log(`   • ${suggestion}`);
        });
      }
    }

    console.log(''); // Add spacing
  }

  /**
   * Stop the interface
   */
  public stop(): void {
    this.isRunning = false;
    this.rl.close();
  }
}

/**
 * Natural Language Processor for interpreting user requests
 */
export class NaturalLanguageProcessor {
  private intentPatterns: Map<string, RegExp[]>;
  private actionMapping: Map<string, string>;

  constructor() {
    this.intentPatterns = new Map();
    this.actionMapping = new Map();
    this.initializePatterns();
  }

  /**
   * Initialize intent patterns and action mappings
   */
  private initializePatterns(): void {
    // Status checking patterns
    this.intentPatterns.set('check_status', [
      /how is (the )?(system|workspace|project)/i,
      /what('s| is) the status/i,
      /show me the status/i,
      /current status/i,
      /workspace status/i,
    ]);
    this.actionMapping.set('check_status', 'check_status');

    // Health checking patterns
    this.intentPatterns.set('check_health', [
      /how is the health/i,
      /system health/i,
      /health check/i,
      /is everything working/i,
      /any problems/i,
    ]);
    this.actionMapping.set('check_health', 'check_health');

    // AI swarm patterns
    this.intentPatterns.set('check_ai_swarm', [
      /ai (swarm|agents)/i,
      /how many agents/i,
      /agent status/i,
      /swarm status/i,
      /ai status/i,
    ]);
    this.actionMapping.set('check_ai_swarm', 'check_ai_swarm');

    // Capabilities patterns
    this.intentPatterns.set('show_capabilities', [
      /what can you do/i,
      /your capabilities/i,
      /show capabilities/i,
      /agent capabilities/i,
      /help me/i,
    ]);
    this.actionMapping.set('show_capabilities', 'show_capabilities');

    // Help patterns
    this.intentPatterns.set('get_help', [/help/i, /assist/i, /support/i, /guide/i]);
    this.actionMapping.set('get_help', 'get_help');

    // Performance optimization patterns
    this.intentPatterns.set('optimize_performance', [
      /optimize/i,
      /performance/i,
      /speed up/i,
      /make faster/i,
      /improve performance/i,
    ]);
    this.actionMapping.set('optimize_performance', 'optimize_performance');

    // Testing patterns
    this.intentPatterns.set('run_tests', [
      /run tests/i,
      /test the system/i,
      /execute tests/i,
      /testing/i,
    ]);
    this.actionMapping.set('run_tests', 'run_tests');

    // Compliance patterns
    this.intentPatterns.set('check_compliance', [
      /compliance/i,
      /fisma/i,
      /section 508/i,
      /government standards/i,
      /audit/i,
    ]);
    this.actionMapping.set('check_compliance', 'check_compliance');
  }

  /**
   * Parse natural language input
   */
  public parse(input: string): NaturalLanguageCommand {
    let bestMatch: NaturalLanguageCommand = {
      intent: 'unknown',
      confidence: 0,
      entities: [],
      action: 'unknown',
      parameters: {},
    };

    // Check each intent pattern
    for (const [intent, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          const confidence = this.calculateConfidence(input, pattern);

          if (confidence > bestMatch.confidence) {
            bestMatch = {
              intent,
              confidence,
              entities: this.extractEntities(input),
              action: this.actionMapping.get(intent) || 'unknown',
              parameters: this.extractParameters(input),
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private calculateConfidence(input: string, pattern: RegExp): number {
    const match = input.match(pattern);
    if (!match) return 0;

    // Base confidence on match length and input length
    const matchLength = match[0].length;
    const inputLength = input.length;

    return Math.min(1.0, (matchLength / inputLength) * 1.5);
  }

  /**
   * Extract entities from input
   */
  private extractEntities(input: string): string[] {
    const entities: string[] = [];

    // Extract common entities
    const systemWords = ['system', 'workspace', 'project', 'backend', 'frontend'];
    const healthWords = ['health', 'status', 'working', 'problems'];
    const aiWords = ['ai', 'agents', 'swarm', 'intelligence'];

    systemWords.forEach(word => {
      if (input.toLowerCase().includes(word)) {
        entities.push(word);
      }
    });

    healthWords.forEach(word => {
      if (input.toLowerCase().includes(word)) {
        entities.push(word);
      }
    });

    aiWords.forEach(word => {
      if (input.toLowerCase().includes(word)) {
        entities.push(word);
      }
    });

    return entities;
  }

  /**
   * Extract parameters from input
   */
  private extractParameters(input: string): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract urgency indicators
    if (input.toLowerCase().includes('urgent') || input.toLowerCase().includes('asap')) {
      params['urgency'] = 'high';
    }

    // Extract detail level
    if (input.toLowerCase().includes('detailed') || input.toLowerCase().includes('full')) {
      params['detailLevel'] = 'detailed';
    } else if (input.toLowerCase().includes('summary') || input.toLowerCase().includes('brief')) {
      params['detailLevel'] = 'summary';
    }

    return params;
  }
}

export default InteractiveCommandInterface;
