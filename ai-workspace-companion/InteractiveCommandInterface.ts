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
      prompt: '🤖 Terrafusion> '
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

    this.agent.on('file-changed', (change) => {
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

    this.rl.on('line', async (input) => {
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
    const command = input.substring(1).toLowerCase();
    
    switch (command) {
      case 'status':
        return await this.handleStatusCommand();
      
      case 'health':
        return await this.handleHealthCommand();
      
      case 'ai-swarm':
        return await this.handleAISwarmCommand();
      
      case 'capabilities':
        return await this.handleCapabilitiesCommand();
      
      case 'ai-generate':
        return await this.handleAIGenerateCommand();
      
      case 'ai-review':
        return await this.handleAIReviewCommand();
      
      case 'ai-test':
        return await this.handleAITestCommand();
      
      case 'ai-refactor':
        return await this.handleAIRefactorCommand();
      
      case 'ai-solve':
        return await this.handleAISolveCommand();
      
      case 'ai-architecture':
        return await this.handleAIArchitectureCommand();
      
      case 'ai-compliance':
        return await this.handleAIComplianceCommand();
      
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
          message: `Unknown command: ${command}`,
          suggestions: ['Type .help for available commands']
        };
    }
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
          suggestions: ['Please rephrase your request', 'Use .help for available commands']
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
            'Use .help for command list'
          ]
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error processing natural language input',
        suggestions: ['Try using dot commands (.help) or rephrase your request']
      };
    }
  }

  /**
   * Execute natural language actions
   */
  private async executeNaturalLanguageAction(parsed: NaturalLanguageCommand): Promise<CommandResult> {
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
          suggestions: ['Use .help for available commands']
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
        recentChanges: status.recentChanges.slice(0, 5)
      }
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
        quantumEngine: health.quantumEngineStatus
      }
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
        performance: aiSwarm.performanceMetrics
      }
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
      data: capabilities
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
    console.log('💡 AI Tools are powered by Terrafusion\'s AI capabilities');
    console.log('   and provide intelligent assistance for development tasks.');
    
    return {
      success: true,
      message: 'Help information displayed above'
    };
  }

  /**
   * Handle deactivate command
   */
  private async handleDeactivateCommand(): Promise<CommandResult> {
    await this.agent.deactivate();
    
    return {
      success: true,
      message: 'Agent deactivated'
    };
  }

  /**
   * Handle exit command
   */
  private async handleExitCommand(): Promise<CommandResult> {
    this.rl.close();
    
    return {
      success: true,
      message: 'Exiting...'
    };
  }

  /**
   * Handle clear command
   */
  private async handleClearCommand(): Promise<CommandResult> {
    console.clear();
    
    return {
      success: true,
      message: 'Screen cleared'
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
      data: recentHistory
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
          'Monitor performance metrics'
        ]
      }
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
          'npm run test:quantum - Test quantum performance'
        ]
      }
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
          'Security controls'
        ],
        commands: [
          'npm run compliance:audit - Run compliance audit',
          'npm run security:scan - Security vulnerability scan',
          'npm run mcp:validate - MCP validation'
        ]
      }
    };
  }

  // ===== AI TOOL COMMAND HANDLERS =====

  /**
   * Handle AI code generation command
   */
  private async handleAIGenerateCommand(): Promise<CommandResult> {
    try {
      console.log('🤖 AI Code Generation');
      console.log('Usage: .ai-generate <language> <prompt>');
      console.log('Example: .ai-generate typescript "Create a user authentication service"');
      
      return {
        success: true,
        message: 'AI Code Generation ready. Use the format above to generate code.',
        data: {
          supportedLanguages: ['typescript', 'javascript', 'python', 'csharp', 'java'],
          examples: [
            '.ai-generate typescript "Create a REST API endpoint"',
            '.ai-generate python "Data validation function"',
            '.ai-generate csharp "Entity framework repository"'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Code Generation failed',
        suggestions: ['Check your input format', 'Ensure the agent is active']
      };
    }
  }

  /**
   * Handle AI code review command
   */
  private async handleAIReviewCommand(): Promise<CommandResult> {
    try {
      console.log('🤖 AI Code Review');
      console.log('Usage: .ai-review <language> <code>');
      console.log('Example: .ai-review typescript "function validateUser() { ... }"');
      
      return {
        success: true,
        message: 'AI Code Review ready. Use the format above to review code.',
        data: {
          reviewFocus: ['security', 'performance', 'readability', 'compliance'],
          standards: ['Government compliance', 'Best practices', 'Code quality']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Code Review failed',
        suggestions: ['Check your input format', 'Ensure the agent is active']
      };
    }
  }

  /**
   * Handle AI test generation command
   */
  private async handleAITestCommand(): Promise<CommandResult> {
    try {
      console.log('🤖 AI Test Generation');
      console.log('Usage: .ai-test <language> <code> [framework]');
      console.log('Example: .ai-test typescript "class UserService { ... }" jest');
      
      return {
        success: true,
        message: 'AI Test Generation ready. Use the format above to generate tests.',
        data: {
          supportedFrameworks: {
            typescript: ['jest', 'mocha', 'vitest'],
            python: ['pytest', 'unittest'],
            csharp: ['xunit', 'nunit', 'mstest']
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Test Generation failed',
        suggestions: ['Check your input format', 'Ensure the agent is active']
      };
    }
  }

  /**
   * Handle AI refactoring command
   */
  private async handleAIRefactorCommand(): Promise<CommandResult> {
    try {
      console.log('🤖 AI Refactoring Analysis');
      console.log('Usage: .ai-refactor <language> <code>');
      console.log('Example: .ai-refactor typescript "function complexFunction() { ... }"');
      
      return {
        success: true,
        message: 'AI Refactoring Analysis ready. Use the format above to get refactoring suggestions.',
        data: {
          focusAreas: ['performance', 'maintainability', 'readability', 'best-practices'],
          output: ['suggestions', 'priority', 'impact', 'estimated effort']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Refactoring Analysis failed',
        suggestions: ['Check your input format', 'Ensure the agent is active']
      };
    }
  }

  /**
   * Handle AI problem solving command
   */
  private async handleAISolveCommand(): Promise<CommandResult> {
    try {
      console.log('🤖 AI Problem Solver');
      console.log('Usage: .ai-solve <description> [error-logs]');
      console.log('Example: .ai-solve "API endpoint returning 500 errors" "Error: Cannot read property..."');
      
      return {
        success: true,
        message: 'AI Problem Solver ready. Use the format above to get solutions.',
        data: {
          output: ['solution', 'explanation', 'steps', 'prevention'],
          context: 'Uses current workspace context for better problem analysis'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Problem Solver failed',
        suggestions: ['Check your input format', 'Ensure the agent is active']
      };
    }
  }

  /**
   * Handle AI architecture command
   */
  private async handleAIArchitectureCommand(): Promise<CommandResult> {
    try {
      console.log('🤖 AI Architecture Advisor');
      console.log('Usage: .ai-architecture <component> <requirements...>');
      console.log('Example: .ai-architecture "User Management" "scalable" "secure" "compliant"');
      
      return {
        success: true,
        message: 'AI Architecture Advisor ready. Use the format above to get architecture advice.',
        data: {
          focusAreas: ['government-compliance', 'security', 'scalability'],
          patterns: ['microservices', 'event-driven', 'layered'],
          output: ['recommendations', 'patterns', 'tradeoffs', 'implementation']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Architecture Advisor failed',
        suggestions: ['Check your input format', 'Ensure the agent is active']
      };
    }
  }

  /**
   * Handle AI compliance validation command
   */
  private async handleAIComplianceCommand(): Promise<CommandResult> {
    try {
      console.log('🤖 AI Compliance Validator');
      console.log('Usage: .ai-compliance <code> [standards...]');
      console.log('Example: .ai-compliance "function processData() { ... }" "FISMA" "NIST-800-53"');
      
      return {
        success: true,
        message: 'AI Compliance Validator ready. Use the format above to validate compliance.',
        data: {
          defaultStandards: ['FISMA', 'NIST-800-53', 'Section-508'],
          focusAreas: ['security', 'accessibility', 'data-protection', 'audit-trails'],
          output: ['compliant', 'violations', 'recommendations', 'risk-level']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI Compliance Validator failed',
        suggestions: ['Check your input format', 'Ensure the agent is active']
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
      /workspace status/i
    ]);
    this.actionMapping.set('check_status', 'check_status');

    // Health checking patterns
    this.intentPatterns.set('check_health', [
      /how is the health/i,
      /system health/i,
      /health check/i,
      /is everything working/i,
      /any problems/i
    ]);
    this.actionMapping.set('check_health', 'check_health');

    // AI swarm patterns
    this.intentPatterns.set('check_ai_swarm', [
      /ai (swarm|agents)/i,
      /how many agents/i,
      /agent status/i,
      /swarm status/i,
      /ai status/i
    ]);
    this.actionMapping.set('check_ai_swarm', 'check_ai_swarm');

    // Capabilities patterns
    this.intentPatterns.set('show_capabilities', [
      /what can you do/i,
      /your capabilities/i,
      /show capabilities/i,
      /agent capabilities/i,
      /help me/i
    ]);
    this.actionMapping.set('show_capabilities', 'show_capabilities');

    // Help patterns
    this.intentPatterns.set('get_help', [
      /help/i,
      /assist/i,
      /support/i,
      /guide/i
    ]);
    this.actionMapping.set('get_help', 'get_help');

    // Performance optimization patterns
    this.intentPatterns.set('optimize_performance', [
      /optimize/i,
      /performance/i,
      /speed up/i,
      /make faster/i,
      /improve performance/i
    ]);
    this.actionMapping.set('optimize_performance', 'optimize_performance');

    // Testing patterns
    this.intentPatterns.set('run_tests', [
      /run tests/i,
      /test the system/i,
      /execute tests/i,
      /testing/i
    ]);
    this.actionMapping.set('run_tests', 'run_tests');

    // Compliance patterns
    this.intentPatterns.set('check_compliance', [
      /compliance/i,
      /fisma/i,
      /section 508/i,
      /government standards/i,
      /audit/i
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
      parameters: {}
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
              parameters: this.extractParameters(input)
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
