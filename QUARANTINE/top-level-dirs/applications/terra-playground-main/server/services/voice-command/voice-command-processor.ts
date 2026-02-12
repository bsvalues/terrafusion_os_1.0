/**
 * Voice Command Processor
 *
 * This service processes voice commands, integrating all the enhanced features:
 * - Analytics tracking
 * - Shortcut expansion
 * - Error handling and recovery
 * - Contextual help
 * - Domain-specific command handling
 */

import { VoiceCommandStatus, VoiceCommandType, InsertVoiceCommandLog } from '@shared/schema';
import { voiceCommandAnalyticsService } from './voice-command-analytics-service';
import { voiceCommandShortcutService } from './voice-command-shortcut-service';
import { voiceCommandHelpService } from './voice-command-help-service';
import { voiceCommandErrorHandler } from './voice-command-error-handler';

// Import the existing voice command service if available
// or mock it for now if we're adding this before the main service exists
let existingVoiceCommandService: any;
try {
  existingVoiceCommandService = require('../agent-voice-command-service').agentVoiceCommandService;
} catch (e) {
  existingVoiceCommandService = {
    processCommand: async (command: string) => {
      return { success: false, message: 'Base service not implemented' };
    },
  };
}

export interface CommandContext {
  userId: number;
  sessionId: string;
  contextId?: string; // Current page/section
  deviceInfo?: any; // Browser/device info

  // Coding context
  currentFile?: string; // Path to the currently open file
  selectedCode?: string; // Currently selected code in the editor
  projectLanguage?: string; // Primary language of the project
  errorMessage?: string; // Current error message if applicable
  clipboardContent?: string; // Content in the clipboard
}

export interface CommandResult {
  success: boolean;
  intent?: string;
  result?: any;
  message?: string;
  error?: string;
  suggestions?: string[];
  status: VoiceCommandStatus;
  responseTime?: number;
  commandType?: VoiceCommandType;
  confidenceScore?: number;
  alternativeCommands?: string[];
  helpContent?: any;
}

export class VoiceCommandProcessor {
  /**
   * Process a voice command with enhanced features
   */
  async processCommand(rawCommand: string, context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      // Initialize command log data
      const logData: Partial<InsertVoiceCommandLog> = {
        sessionId: context.sessionId,
        userId: context.userId,
        rawCommand,
        contextData: context.contextId ? { pageContext: context.contextId } : undefined,
        deviceInfo: context.deviceInfo,
      };

      // Stage 1: Apply shortcuts (if any)
      const expandedCommand = await voiceCommandShortcutService.expandCommand(
        context.userId,
        rawCommand
      );

      if (expandedCommand !== rawCommand) {
        logData.processedCommand = expandedCommand;
      }

      // Stage 2: Determine command type and intent
      const { commandType, intent } = this.determineCommandTypeAndIntent(
        expandedCommand || rawCommand
      );
      logData.commandType = commandType;
      logData.intentRecognized = intent;

      // Stage 3: Calculate confidence score
      const confidenceScore = voiceCommandErrorHandler.calculateCommandConfidence(
        expandedCommand || rawCommand,
        intent
      );
      logData.confidenceScore = confidenceScore;

      // Stage 4: Check confidence threshold
      if (confidenceScore < 0.3) {
        // Low confidence, treat as command not found
        const errorResponse = await voiceCommandErrorHandler.handleCommandNotFound(
          expandedCommand || rawCommand,
          context.contextId
        );

        // Log the failed command
        logData.status = errorResponse.status;
        logData.errorMessage = errorResponse.errorMessage;
        logData.responseTime = Date.now() - startTime;
        await voiceCommandAnalyticsService.logVoiceCommand(logData as InsertVoiceCommandLog);

        // Return error result
        return {
          success: false,
          message: errorResponse.errorMessage,
          status: errorResponse.status,
          suggestions: errorResponse.suggestions,
          alternativeCommands: errorResponse.alternativeCommands,
          helpContent: errorResponse.helpContent,
          responseTime: Date.now() - startTime,
          commandType,
          confidenceScore,
        };
      }

      // Stage 5: Extract command parameters
      const parameters = this.extractParameters(expandedCommand || rawCommand, commandType);
      logData.parameters = parameters;

      // Stage 6: Process the command
      const commandResult = await this.executeCommand(
        expandedCommand || rawCommand,
        commandType,
        intent,
        parameters,
        context
      );

      // Stage 7: Log the command
      logData.status = commandResult.status;
      logData.errorMessage = commandResult.error;
      logData.responseTime = Date.now() - startTime;
      logData.agentResponses = commandResult.result ? { result: commandResult.result } : undefined;

      await voiceCommandAnalyticsService.logVoiceCommand(logData as InsertVoiceCommandLog);

      // Stage 8: Return the result
      return {
        ...commandResult,
        responseTime: Date.now() - startTime,
        confidenceScore,
      };
    } catch (error) {
      console.error('Error processing voice command:', error);

      // Log the error
      const logData: InsertVoiceCommandLog = {
        sessionId: context.sessionId,
        userId: context.userId,
        rawCommand,
        commandType: VoiceCommandType.SYSTEM,
        status: VoiceCommandStatus.FAILED,
        errorMessage: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };

      await voiceCommandAnalyticsService.logVoiceCommand(logData);

      // Handle system error
      const errorResponse = await voiceCommandErrorHandler.handleSystemError(rawCommand, error);

      return {
        success: false,
        message: errorResponse.errorMessage,
        error: error.message,
        status: errorResponse.status,
        suggestions: errorResponse.suggestions,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Determine the type of command and the intent
   */
  private determineCommandTypeAndIntent(command: string): {
    commandType: VoiceCommandType;
    intent?: string;
  } {
    // Navigation commands
    if (/(?:go|navigate|open|take me|show)\s+(?:to|me)?\s+([\w\s]+)/i.test(command)) {
      return {
        commandType: VoiceCommandType.NAVIGATION,
        intent: 'navigation.goto',
      };
    }

    // Property assessment commands
    if (
      /(?:assess|evaluate|value|appraise|report|valuation)\s+(?:property|parcel)?\s+([\w\d\s]+)/i.test(
        command
      )
    ) {
      return {
        commandType: VoiceCommandType.PROPERTY_ASSESSMENT,
        intent: 'assessment.value',
      };
    }

    if (/(?:find|show|get)\s+(?:comparables|comps)\s+(?:for)?\s+([\w\d\s]+)/i.test(command)) {
      return {
        commandType: VoiceCommandType.PROPERTY_ASSESSMENT,
        intent: 'assessment.comparables',
      };
    }

    // Data query commands
    if (/(?:show|list|find|search)\s+(?:all|for)?\s+(?:properties|parcels)\s*(.*)/i.test(command)) {
      return {
        commandType: VoiceCommandType.DATA_QUERY,
        intent: 'query.properties',
      };
    }

    // System commands
    if (
      /(?:show|display|tell me|what is)\s+(?:the)?\s*(?:help|commands|available commands|what can i say)/i.test(
        command
      )
    ) {
      return {
        commandType: VoiceCommandType.SYSTEM,
        intent: 'system.help',
      };
    }

    if (/(?:create|add|make|define)\s+(?:a|new)?\s+(?:shortcut|command)/i.test(command)) {
      return {
        commandType: VoiceCommandType.SYSTEM,
        intent: 'system.createShortcut',
      };
    }

    // Workflow commands
    if (
      /(?:start|begin|create|initiate)\s+(?:a|new)?\s+(?:workflow|assessment workflow|process)/i.test(
        command
      )
    ) {
      return {
        commandType: VoiceCommandType.WORKFLOW,
        intent: 'workflow.start',
      };
    }

    // Coding assistance commands - code generation
    if (
      /(?:generate|create|write)\s+(?:a|some|new)?\s+(?:code|function|method|class|component)/i.test(
        command
      )
    ) {
      return {
        commandType: VoiceCommandType.CODING_ASSISTANCE,
        intent: 'coding.generate',
      };
    }

    // Coding assistance commands - code explanation
    if (
      /(?:explain|describe|tell me about)\s+(?:this|the|current|selected)?\s+(?:code|function|method|implementation)/i.test(
        command
      )
    ) {
      return {
        commandType: VoiceCommandType.CODING_ASSISTANCE,
        intent: 'coding.explain',
      };
    }

    // Coding assistance commands - bug fixing
    if (
      /(?:fix|resolve|correct|debug)\s+(?:the|this|current)?\s+(?:bug|issue|problem|error)/i.test(
        command
      )
    ) {
      return {
        commandType: VoiceCommandType.CODING_ASSISTANCE,
        intent: 'coding.fix',
      };
    }

    // Coding assistance commands - code optimization
    if (
      /(?:optimize|improve|refactor)\s+(?:the|this|current|selected)?\s+(?:code|function|method|query)/i.test(
        command
      )
    ) {
      return {
        commandType: VoiceCommandType.CODING_ASSISTANCE,
        intent: 'coding.optimize',
      };
    }

    // Default to system command if we can't determine the type
    return { commandType: VoiceCommandType.SYSTEM };
  }

  /**
   * Extract parameters from a command based on its type
   */
  private extractParameters(command: string, commandType: VoiceCommandType): Record<string, any> {
    const parameters: Record<string, any> = {};

    switch (commandType) {
      case VoiceCommandType.NAVIGATION:
        // Extract destination parameter
        const navigationMatch = command.match(
          /(?:go|navigate|open|take me|show)\s+(?:to|me)?\s+([\w\s]+)/i
        );
        if (navigationMatch && navigationMatch[1]) {
          parameters.destination = navigationMatch[1].trim();
        }
        break;

      case VoiceCommandType.PROPERTY_ASSESSMENT:
        // Extract property ID/address parameter
        const propertyMatch = command.match(
          /(?:assess|evaluate|value|appraise|report|valuation|property|parcel|comparables|comps)\s+(?:property|parcel|for)?\s+([\w\d\s]+)/i
        );
        if (propertyMatch && propertyMatch[1]) {
          parameters.propertyId = propertyMatch[1].trim();
        }
        break;

      case VoiceCommandType.DATA_QUERY:
        // Extract query criteria
        const queryMatch = command.match(
          /(?:show|list|find|search)\s+(?:all|for)?\s+(?:properties|parcels)\s*(.*)/i
        );
        if (queryMatch && queryMatch[1]) {
          parameters.criteria = queryMatch[1].trim();
        }
        break;

      case VoiceCommandType.WORKFLOW:
        // Extract workflow type
        const workflowMatch = command.match(
          /(?:start|begin|create|initiate)\s+(?:a|new)?\s+([\w\s]+)\s+(?:workflow|process)/i
        );
        if (workflowMatch && workflowMatch[1]) {
          parameters.workflowType = workflowMatch[1].trim();
        }
        break;

      case VoiceCommandType.SYSTEM:
        // No standard parameters for system commands
        break;

      case VoiceCommandType.CUSTOM:
        // Custom commands would need special handling
        break;

      case VoiceCommandType.CODING_ASSISTANCE:
        // Extract code description or operation type
        // For code generation
        const generateMatch = command.match(
          /(?:generate|create|write)\s+(?:a|some|new)?\s+(?:code|function|method|class|component)\s+(?:for|to|that)?\s+(.*)/i
        );
        if (generateMatch && generateMatch[1]) {
          parameters.description = generateMatch[1].trim();
        }

        // For code explanation/optimization/bug fixing
        const codeTypeMatch = command.match(
          /(?:explain|describe|optimize|improve|refactor|fix|debug)\s+(?:this|the|current|selected)?\s+(code|function|method|class|component|implementation|bug|issue|problem|error)/i
        );
        if (codeTypeMatch && codeTypeMatch[1]) {
          parameters.codeType = codeTypeMatch[1].trim();
        }
        break;
    }

    return parameters;
  }

  /**
   * Execute the command using the appropriate handler
   */
  private async executeCommand(
    command: string,
    commandType: VoiceCommandType,
    intent?: string,
    parameters?: Record<string, any>,
    context?: CommandContext
  ): Promise<CommandResult> {
    try {
      // Check for missing required parameters
      if (commandType === VoiceCommandType.PROPERTY_ASSESSMENT && !parameters?.propertyId) {
        const errorResponse = await voiceCommandErrorHandler.handleMissingParameter(
          command,
          'propertyId',
          commandType
        );

        return {
          success: false,
          message: errorResponse.errorMessage,
          status: errorResponse.status,
          suggestions: errorResponse.suggestions,
          helpContent: errorResponse.helpContent,
          commandType,
        };
      }

      if (commandType === VoiceCommandType.NAVIGATION && !parameters?.destination) {
        const errorResponse = await voiceCommandErrorHandler.handleMissingParameter(
          command,
          'destination',
          commandType
        );

        return {
          success: false,
          message: errorResponse.errorMessage,
          status: errorResponse.status,
          suggestions: errorResponse.suggestions,
          helpContent: errorResponse.helpContent,
          commandType,
        };
      }

      // Handle special system commands directly
      if (commandType === VoiceCommandType.SYSTEM && intent === 'system.help') {
        // Get contextual help
        const helpContent = await voiceCommandHelpService.getContextualHelp(
          context?.contextId || 'global',
          false
        );

        return {
          success: true,
          intent,
          result: helpContent,
          message: 'Here are the available voice commands',
          status: VoiceCommandStatus.SUCCESS,
          commandType,
          helpContent,
        };
      }

      // Handle coding assistance commands
      if (commandType === VoiceCommandType.CODING_ASSISTANCE) {
        try {
          // Import here to avoid circular dependencies
          const {
            getVoiceCommandCodingAssistanceService,
          } = require('./voice-command-coding-assistance-service');
          const codingAssistanceService = getVoiceCommandCodingAssistanceService();

          // Process the coding command
          const result = await codingAssistanceService.processCodingCommand(command, {
            userId: context?.userId,
            contextId: context?.contextId,
            selectedCode: context?.selectedCode,
            currentFile: context?.currentFile,
            projectLanguage: context?.projectLanguage,
            errorMessage: context?.errorMessage,
            clipboardContent: context?.clipboardContent,
          });

          return {
            success: result.success,
            intent,
            result: result.result,
            message: result.message,
            status: result.status,
            commandType,
            suggestions: result.suggestions,
          };
        } catch (error) {
          console.error('Error processing coding assistance command:', error);

          const errorResponse = await voiceCommandErrorHandler.handleSystemError(
            command,
            new Error(`Coding assistance error: ${error.message || 'Unknown error'}`)
          );

          return {
            success: false,
            message: errorResponse.errorMessage,
            error: error.message,
            status: errorResponse.status,
            suggestions: errorResponse.suggestions,
            commandType,
          };
        }
      }

      // For other commands, delegate to the existing voice command service
      // This integrates with the existing implementation
      const baseServiceResult = await existingVoiceCommandService.processCommand(command, {
        userId: context?.userId,
        intent,
        parameters,
      });

      // If the base service succeeded, return a success result
      if (baseServiceResult.success) {
        return {
          success: true,
          intent,
          result: baseServiceResult.result || baseServiceResult.response,
          message: baseServiceResult.message,
          status: VoiceCommandStatus.SUCCESS,
          commandType,
        };
      }

      // Handle different error types based on the base service response
      if (baseServiceResult.errorType === 'permission') {
        const errorResponse = await voiceCommandErrorHandler.handlePermissionError(
          command,
          baseServiceResult.permissionNeeded || 'appropriate'
        );

        return {
          success: false,
          message: errorResponse.errorMessage,
          status: errorResponse.status,
          suggestions: errorResponse.suggestions,
          commandType,
        };
      }

      if (baseServiceResult.errorType === 'rate_limit') {
        const errorResponse = await voiceCommandErrorHandler.handleRateLimitError(command);

        return {
          success: false,
          message: errorResponse.errorMessage,
          status: errorResponse.status,
          suggestions: errorResponse.suggestions,
          commandType,
        };
      }

      if (baseServiceResult.errorType === 'invalid_parameter') {
        const errorResponse = await voiceCommandErrorHandler.handleInvalidParameter(
          command,
          baseServiceResult.paramName || 'parameter',
          baseServiceResult.paramValue || '',
          baseServiceResult.validValues
        );

        return {
          success: false,
          message: errorResponse.errorMessage,
          status: errorResponse.status,
          suggestions: errorResponse.suggestions,
          commandType,
        };
      }

      // Default error handler for unknown error types
      const errorResponse = await voiceCommandErrorHandler.handleCommandNotFound(
        command,
        context?.contextId
      );

      return {
        success: false,
        message: errorResponse.errorMessage,
        status: errorResponse.status,
        suggestions: errorResponse.suggestions,
        alternativeCommands: errorResponse.alternativeCommands,
        helpContent: errorResponse.helpContent,
        commandType,
      };
    } catch (error) {
      console.error('Error executing command:', error);

      // Handle system error
      const errorResponse = await voiceCommandErrorHandler.handleSystemError(command, error);

      return {
        success: false,
        message: errorResponse.errorMessage,
        error: error.message,
        status: errorResponse.status,
        suggestions: errorResponse.suggestions,
        commandType,
      };
    }
  }
}

// Export singleton instance
export const voiceCommandProcessor = new VoiceCommandProcessor();
