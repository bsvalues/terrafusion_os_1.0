/**
 * Voice Command Coding Assistance Service
 * 
 * This service handles voice commands for coding assistance, integrating with
 * Plandex AI and other coding tools to provide hands-free coding support.
 */

import { logger } from '../../utils/logger';
import { CommandContext, CommandResult } from './voice-command-processor';
import { VoiceCommandStatus, VoiceCommandType } from '@shared/schema';
import { getPlandexAIService } from '../plandex-ai-factory';

export enum CodingCommandIntent {
  // Code generation
  GENERATE_CODE = 'coding.generate',
  GENERATE_FUNCTION = 'coding.generate.function',
  GENERATE_CLASS = 'coding.generate.class',
  GENERATE_COMPONENT = 'coding.generate.component',
  
  // Code explanation
  EXPLAIN_CODE = 'coding.explain',
  EXPLAIN_FUNCTION = 'coding.explain.function',
  EXPLAIN_CLASS = 'coding.explain.class',
  
  // Bug fixing
  FIX_BUG = 'coding.fix',
  FIX_ERROR = 'coding.fix.error',
  
  // Code optimization
  OPTIMIZE_CODE = 'coding.optimize',
  OPTIMIZE_FUNCTION = 'coding.optimize.function',
  OPTIMIZE_QUERY = 'coding.optimize.query',
  
  // Editor controls
  INSERT_CODE = 'coding.insert',
  DELETE_CODE = 'coding.delete',
  SELECT_CODE = 'coding.select',
  UNDO = 'coding.undo',
  REDO = 'coding.redo',
  
  // File operations
  CREATE_FILE = 'coding.file.create',
  SAVE_FILE = 'coding.file.save',
  OPEN_FILE = 'coding.file.open',
  
  // Other
  RUN_TESTS = 'coding.run.tests',
  COMMIT_CODE = 'coding.commit',
  DEPLOY_CODE = 'coding.deploy'
}

// Store help content for coding commands
const codingCommandHelpContent: Record<string, any> = {};

export class VoiceCommandCodingAssistanceService {
  private plandexAIService = getPlandexAIService();
  
  /**
   * Determine the coding intent from a voice command
   */
  determineCodingIntent(command: string): { intent: CodingCommandIntent, parameters: Record<string, any> } {
    const commandLower = command.toLowerCase();
    const parameters: Record<string, any> = {};
    
    // Code generation
    if (commandLower.includes('generate') || commandLower.includes('create') || commandLower.includes('write')) {
      if (commandLower.includes('function') || commandLower.includes('method')) {
        return { intent: CodingCommandIntent.GENERATE_FUNCTION, parameters };
      } else if (commandLower.includes('class')) {
        return { intent: CodingCommandIntent.GENERATE_CLASS, parameters };
      } else if (commandLower.includes('component') || commandLower.includes('react')) {
        return { intent: CodingCommandIntent.GENERATE_COMPONENT, parameters };
      } else {
        return { intent: CodingCommandIntent.GENERATE_CODE, parameters };
      }
    }
    
    // Code explanation
    else if (commandLower.includes('explain') || commandLower.includes('describe') || commandLower.includes('tell me about')) {
      if (commandLower.includes('function') || commandLower.includes('method')) {
        return { intent: CodingCommandIntent.EXPLAIN_FUNCTION, parameters };
      } else if (commandLower.includes('class')) {
        return { intent: CodingCommandIntent.EXPLAIN_CLASS, parameters };
      } else {
        return { intent: CodingCommandIntent.EXPLAIN_CODE, parameters };
      }
    }
    
    // Bug fixing
    else if (commandLower.includes('fix') || commandLower.includes('debug') || commandLower.includes('resolve')) {
      if (commandLower.includes('error') || commandLower.includes('exception')) {
        return { intent: CodingCommandIntent.FIX_ERROR, parameters };
      } else {
        return { intent: CodingCommandIntent.FIX_BUG, parameters };
      }
    }
    
    // Code optimization
    else if (commandLower.includes('optimize') || commandLower.includes('improve') || commandLower.includes('refactor')) {
      if (commandLower.includes('function') || commandLower.includes('method')) {
        return { intent: CodingCommandIntent.OPTIMIZE_FUNCTION, parameters };
      } else if (commandLower.includes('query') || commandLower.includes('sql')) {
        return { intent: CodingCommandIntent.OPTIMIZE_QUERY, parameters };
      } else {
        return { intent: CodingCommandIntent.OPTIMIZE_CODE, parameters };
      }
    }
    
    // Editor controls
    else if (commandLower.includes('insert')) {
      return { intent: CodingCommandIntent.INSERT_CODE, parameters };
    } else if (commandLower.includes('delete') || commandLower.includes('remove')) {
      return { intent: CodingCommandIntent.DELETE_CODE, parameters };
    } else if (commandLower.includes('select')) {
      return { intent: CodingCommandIntent.SELECT_CODE, parameters };
    } else if (commandLower.includes('undo')) {
      return { intent: CodingCommandIntent.UNDO, parameters };
    } else if (commandLower.includes('redo')) {
      return { intent: CodingCommandIntent.REDO, parameters };
    }
    
    // File operations
    else if (commandLower.includes('create file')) {
      return { intent: CodingCommandIntent.CREATE_FILE, parameters };
    } else if (commandLower.includes('save file') || commandLower.includes('save changes')) {
      return { intent: CodingCommandIntent.SAVE_FILE, parameters };
    } else if (commandLower.includes('open file')) {
      return { intent: CodingCommandIntent.OPEN_FILE, parameters };
    }
    
    // Other
    else if (commandLower.includes('run test')) {
      return { intent: CodingCommandIntent.RUN_TESTS, parameters };
    } else if (commandLower.includes('commit')) {
      return { intent: CodingCommandIntent.COMMIT_CODE, parameters };
    } else if (commandLower.includes('deploy')) {
      return { intent: CodingCommandIntent.DEPLOY_CODE, parameters };
    }
    
    // Default to code generation if no specific intent is found
    return { intent: CodingCommandIntent.GENERATE_CODE, parameters };
  }
  
  /**
   * Process a coding assistance voice command
   */
  async processCodingCommand(
    command: string,
    context: CommandContext = { userId: 1, sessionId: 'default-session' }
  ): Promise<CommandResult> {
    try {
      logger.info(`Processing coding command: ${command}`);
      
      // Determine intent and extract parameters
      const { intent, parameters } = this.determineCodingIntent(command);
      
      // Extract code from context if available
      const selectedCode = context.selectedCode || '';
      const currentFile = context.currentFile || '';
      
      // Execute appropriate handler based on intent
      let result: CommandResult;
      
      if (intent.startsWith('coding.generate')) {
        result = await this.handleCodeGeneration(intent, command, parameters, context);
      } else if (intent.startsWith('coding.explain')) {
        result = await this.handleCodeExplanation(intent, command, parameters, context);
      } else if (intent.startsWith('coding.fix')) {
        result = await this.handleBugFix(intent, command, parameters, context);
      } else if (intent.startsWith('coding.optimize')) {
        result = await this.handleCodeOptimization(intent, command, parameters, context);
      } else if (intent.startsWith('coding.file')) {
        result = await this.handleFileOperation(intent, command, parameters, context);
      } else {
        result = await this.handleEditorControl(intent, command, parameters, context);
      }
      
      return {
        ...result,
        intent,
        commandType: VoiceCommandType.CODING_ASSISTANCE
      };
    } catch (error) {
      logger.error(`Error processing coding command: ${error}`);
      
      return {
        success: false,
        message: `Failed to process coding command: ${error}`,
        status: VoiceCommandStatus.ERROR,
        commandType: VoiceCommandType.CODING_ASSISTANCE
      };
    }
  }
  
  /**
   * Handle code generation commands
   */
  private async handleCodeGeneration(
    intent: CodingCommandIntent,
    command: string,
    parameters: Record<string, any>,
    context: CommandContext
  ): Promise<CommandResult> {
    try {
      logger.info(`Handling code generation command with intent: ${intent}`);
      
      // If Plandex AI service is available, use it to generate code
      if (this.plandexAIService) {
        // Remove "generate", "create", or "write" from the command to get the actual request
        let prompt = command.replace(/generate|create|write/i, '').trim();
        
        // Default language is TypeScript if not specified
        const language = parameters.language || 'typescript';
        
        // Use Plandex AI to generate code
        const generationResult = await this.plandexAIService.generateCode({
          prompt,
          language,
          context: {
            currentFile: context.currentFile,
            projectLanguage: context.projectLanguage,
            selectedCode: context.selectedCode
          }
        });
        
        return {
          success: true,
          result: generationResult,
          message: `Generated code for: ${prompt}`,
          status: VoiceCommandStatus.SUCCESS,
          suggestions: [
            "Try saying: Insert this code",
            "Try saying: Explain this code",
            "Try saying: Optimize this code"
          ]
        };
      } else {
        throw new Error('Plandex AI service is not available');
      }
    } catch (error) {
      logger.error(`Error handling code generation: ${error}`);
      
      return {
        success: false,
        message: `Failed to generate code: ${error}`,
        status: VoiceCommandStatus.ERROR,
        suggestions: [
          "Try saying: Generate a simpler function",
          "Try saying: Write code with fewer dependencies",
          "Try saying: Create a basic example"
        ]
      };
    }
  }
  
  /**
   * Handle code explanation commands
   */
  private async handleCodeExplanation(
    intent: CodingCommandIntent,
    command: string,
    parameters: Record<string, any>,
    context: CommandContext
  ): Promise<CommandResult> {
    try {
      logger.info(`Handling code explanation command with intent: ${intent}`);
      
      // If selected code is not available, return an error
      if (!context.selectedCode) {
        return {
          success: false,
          message: "No code selected to explain. Please select some code first.",
          status: VoiceCommandStatus.ERROR,
          suggestions: [
            "Try selecting some code first",
            "Try saying: Select this function",
            "Try saying: Explain this specific part [after selecting code]"
          ]
        };
      }
      
      // If Plandex AI service is available, use it to explain code
      if (this.plandexAIService) {
        const explanationResult = await this.plandexAIService.explainCode({
          code: context.selectedCode,
          context: {
            currentFile: context.currentFile,
            projectLanguage: context.projectLanguage
          }
        });
        
        return {
          success: true,
          result: explanationResult,
          message: `Explanation of selected code`,
          status: VoiceCommandStatus.SUCCESS,
          suggestions: [
            "Try saying: Explain in simpler terms",
            "Try saying: Provide a more detailed explanation",
            "Try saying: What are the potential issues with this code?"
          ]
        };
      } else {
        throw new Error('Plandex AI service is not available');
      }
    } catch (error) {
      logger.error(`Error handling code explanation: ${error}`);
      
      return {
        success: false,
        message: `Failed to explain code: ${error}`,
        status: VoiceCommandStatus.ERROR,
        suggestions: [
          "Try with a smaller code selection",
          "Try saying: Explain the basic functionality",
          "Try saying: What does this function do?"
        ]
      };
    }
  }
  
  /**
   * Handle bug fixing commands
   */
  private async handleBugFix(
    intent: CodingCommandIntent,
    command: string,
    parameters: Record<string, any>,
    context: CommandContext
  ): Promise<CommandResult> {
    try {
      logger.info(`Handling bug fix command with intent: ${intent}`);
      
      // If selected code is not available, return an error
      if (!context.selectedCode) {
        return {
          success: false,
          message: "No code selected to fix. Please select some code first.",
          status: VoiceCommandStatus.ERROR,
          suggestions: [
            "Try selecting the code with the bug first",
            "Try saying: Fix this specific error [after selecting code]",
            "Try saying: What's wrong with this code? [after selecting code]"
          ]
        };
      }
      
      // If Plandex AI service is available, use it to fix bugs
      if (this.plandexAIService) {
        // Include error message in context if available
        const fixResult = await this.plandexAIService.fixBug({
          code: context.selectedCode,
          errorMessage: context.errorMessage || '',
          context: {
            currentFile: context.currentFile,
            projectLanguage: context.projectLanguage
          }
        });
        
        return {
          success: true,
          result: fixResult,
          message: `Fixed bug in selected code`,
          status: VoiceCommandStatus.SUCCESS,
          suggestions: [
            "Try saying: Explain the fix",
            "Try saying: Insert this fix",
            "Try saying: Are there any other potential issues?"
          ]
        };
      } else {
        throw new Error('Plandex AI service is not available');
      }
    } catch (error) {
      logger.error(`Error handling bug fix: ${error}`);
      
      return {
        success: false,
        message: `Failed to fix bug: ${error}`,
        status: VoiceCommandStatus.ERROR,
        suggestions: [
          "Try with a smaller code selection",
          "Try saying: What's causing this error?",
          "Try saying: Show me what's wrong with this code"
        ]
      };
    }
  }
  
  /**
   * Handle code optimization commands
   */
  private async handleCodeOptimization(
    intent: CodingCommandIntent,
    command: string,
    parameters: Record<string, any>,
    context: CommandContext
  ): Promise<CommandResult> {
    try {
      logger.info(`Handling code optimization command with intent: ${intent}`);
      
      // If selected code is not available, return an error
      if (!context.selectedCode) {
        return {
          success: false,
          message: "No code selected to optimize. Please select some code first.",
          status: VoiceCommandStatus.ERROR,
          suggestions: [
            "Try selecting the code to optimize first",
            "Try saying: Optimize this function [after selecting code]",
            "Try saying: Improve performance of this code [after selecting code]"
          ]
        };
      }
      
      // If Plandex AI service is available, use it to optimize code
      if (this.plandexAIService) {
        // Determine optimization focus based on intent
        let optimizationFocus = 'general';
        if (intent === CodingCommandIntent.OPTIMIZE_FUNCTION) {
          optimizationFocus = 'performance';
        } else if (intent === CodingCommandIntent.OPTIMIZE_QUERY) {
          optimizationFocus = 'database';
        }
        
        const optimizationResult = await this.plandexAIService.optimizeCode({
          code: context.selectedCode,
          optimizationFocus,
          context: {
            currentFile: context.currentFile,
            projectLanguage: context.projectLanguage
          }
        });
        
        return {
          success: true,
          result: optimizationResult,
          message: `Optimized code with focus on ${optimizationFocus}`,
          status: VoiceCommandStatus.SUCCESS,
          suggestions: [
            "Try saying: Explain the optimization",
            "Try saying: Insert this optimized code",
            "Try saying: Are there any other optimizations possible?"
          ]
        };
      } else {
        throw new Error('Plandex AI service is not available');
      }
    } catch (error) {
      logger.error(`Error handling code optimization: ${error}`);
      
      return {
        success: false,
        message: `Failed to optimize code: ${error}`,
        status: VoiceCommandStatus.ERROR,
        suggestions: [
          "Try with a smaller code selection",
          "Try saying: Focus on performance optimization",
          "Try saying: Focus on readability optimization"
        ]
      };
    }
  }
  
  /**
   * Handle editor control commands
   */
  private async handleEditorControl(
    intent: CodingCommandIntent,
    command: string,
    parameters: Record<string, any>,
    context: CommandContext
  ): Promise<CommandResult> {
    try {
      logger.info(`Handling editor control command with intent: ${intent}`);
      
      // Editor control commands are handled directly by the client
      // We just return the appropriate intent and let the client handle the action
      
      let message = '';
      let actions: Record<string, any> = {};
      
      switch (intent) {
        case CodingCommandIntent.INSERT_CODE:
          message = 'Ready to insert code';
          actions = { 
            type: 'insert',
            code: context.clipboardContent || ''
          };
          break;
        case CodingCommandIntent.DELETE_CODE:
          message = 'Selected code will be deleted';
          actions = { type: 'delete' };
          break;
        case CodingCommandIntent.SELECT_CODE:
          message = 'Trying to select code based on description';
          actions = { 
            type: 'select',
            descriptor: command.replace(/select/i, '').trim()
          };
          break;
        case CodingCommandIntent.UNDO:
          message = 'Undoing last action';
          actions = { type: 'undo' };
          break;
        case CodingCommandIntent.REDO:
          message = 'Redoing last undone action';
          actions = { type: 'redo' };
          break;
        default:
          message = 'Unknown editor control action';
          actions = { type: 'unknown' };
          break;
      }
      
      return {
        success: true,
        message,
        result: { actions },
        status: VoiceCommandStatus.SUCCESS,
        suggestions: [
          "Try saying: Generate code for [description]",
          "Try saying: Explain this code",
          "Try saying: Fix this bug"
        ]
      };
    } catch (error) {
      logger.error(`Error handling editor control: ${error}`);
      
      return {
        success: false,
        message: `Failed to perform editor action: ${error}`,
        status: VoiceCommandStatus.ERROR,
        suggestions: [
          "Try a different editor command",
          "Try saying: Undo",
          "Try saying: Select this function"
        ]
      };
    }
  }
  
  /**
   * Handle file operation commands
   */
  private async handleFileOperation(
    intent: CodingCommandIntent,
    command: string,
    parameters: Record<string, any>,
    context: CommandContext
  ): Promise<CommandResult> {
    try {
      logger.info(`Handling file operation command with intent: ${intent}`);
      
      // File operation commands are handled directly by the client
      // We just return the appropriate intent and let the client handle the action
      
      let message = '';
      let actions: Record<string, any> = {};
      
      switch (intent) {
        case CodingCommandIntent.CREATE_FILE:
          message = 'Ready to create a new file';
          actions = { 
            type: 'createFile',
            fileName: extractFileName(command)
          };
          break;
        case CodingCommandIntent.SAVE_FILE:
          message = 'Saving current file';
          actions = { type: 'saveFile' };
          break;
        case CodingCommandIntent.OPEN_FILE:
          message = 'Opening file';
          actions = { 
            type: 'openFile',
            fileName: extractFileName(command)
          };
          break;
        default:
          message = 'Unknown file operation';
          actions = { type: 'unknown' };
          break;
      }
      
      return {
        success: true,
        message,
        result: { actions },
        status: VoiceCommandStatus.SUCCESS,
        suggestions: [
          "Try saying: Generate code for [description]",
          "Try saying: Save file",
          "Try saying: Create a new component file"
        ]
      };
    } catch (error) {
      logger.error(`Error handling file operation: ${error}`);
      
      return {
        success: false,
        message: `Failed to perform file operation: ${error}`,
        status: VoiceCommandStatus.ERROR,
        suggestions: [
          "Try a different file command",
          "Try saying: Save current file",
          "Try saying: Create a new file named example.ts"
        ]
      };
    }
  }
  
  /**
   * Initialize help content for coding commands
   */
  async initializeHelpContent(): Promise<void> {
    try {
      logger.info('Initializing help content for coding commands');
      
      // Populate help content for different coding command categories
      codingCommandHelpContent['generate'] = {
        title: 'Code Generation Commands',
        description: 'These commands help you generate code without typing.',
        examples: [
          'Generate a function to calculate fibonacci numbers',
          'Create a React component for login form',
          'Write a class for user authentication',
          'Generate code to connect to a database'
        ]
      };
      
      codingCommandHelpContent['explain'] = {
        title: 'Code Explanation Commands',
        description: 'These commands help you understand code.',
        examples: [
          'Explain this code',
          'Describe how this function works',
          'Tell me about this implementation',
          'What does this class do?'
        ]
      };
      
      codingCommandHelpContent['fix'] = {
        title: 'Bug Fixing Commands',
        description: 'These commands help you identify and fix bugs in your code.',
        examples: [
          'Fix this bug',
          'Debug this issue',
          'What\'s wrong with this code?',
          'Resolve this error'
        ]
      };
      
      codingCommandHelpContent['optimize'] = {
        title: 'Code Optimization Commands',
        description: 'These commands help you improve the performance and quality of your code.',
        examples: [
          'Optimize this code',
          'Improve the performance of this function',
          'Refactor this implementation',
          'Make this code more efficient'
        ]
      };
      
      codingCommandHelpContent['editor'] = {
        title: 'Editor Control Commands',
        description: 'These commands help you control the code editor.',
        examples: [
          'Insert this code',
          'Delete selected code',
          'Select the main function',
          'Undo last change',
          'Redo'
        ]
      };
      
      codingCommandHelpContent['file'] = {
        title: 'File Operation Commands',
        description: 'These commands help you work with files.',
        examples: [
          'Create a new file called user-service.ts',
          'Save current file',
          'Open the main component file',
          'Close this file'
        ]
      };
      
      logger.info('Help content for coding commands initialized successfully');
    } catch (error) {
      logger.error(`Error initializing help content for coding commands: ${error}`);
      throw error;
    }
  }
}

/**
 * Helper function to extract a file name from a command
 */
function extractFileName(command: string): string {
  // Look for patterns like "called X", "named X", "file X"
  const fileNameMatches = command.match(/(?:called|named|file|called|named)\s+([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)/i);
  
  if (fileNameMatches && fileNameMatches[1]) {
    return fileNameMatches[1];
  }
  
  // If no specific pattern, try to find anything that looks like a filename with extension
  const extensionMatches = command.match(/([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)/i);
  
  if (extensionMatches && extensionMatches[1]) {
    return extensionMatches[1];
  }
  
  // Default to a generic filename if nothing is found
  return 'new-file.txt';
}

// Singleton instance
let voiceCommandCodingAssistanceService: VoiceCommandCodingAssistanceService;

/**
 * Initialize the voice command coding assistance service
 */
export function initializeVoiceCommandCodingAssistanceService(): VoiceCommandCodingAssistanceService {
  if (!voiceCommandCodingAssistanceService) {
    voiceCommandCodingAssistanceService = new VoiceCommandCodingAssistanceService();
    logger.info('Voice Command Coding Assistance Service initialized');
  }
  return voiceCommandCodingAssistanceService;
}

/**
 * Get the voice command coding assistance service instance
 */
export function getVoiceCommandCodingAssistanceService(): VoiceCommandCodingAssistanceService {
  if (!voiceCommandCodingAssistanceService) {
    return initializeVoiceCommandCodingAssistanceService();
  }
  return voiceCommandCodingAssistanceService;
}