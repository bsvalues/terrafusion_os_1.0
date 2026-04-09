/**
 * Voice Command Error Handler
 * 
 * This service provides enhanced error handling for voice commands, including
 * recovery suggestions, fuzzy matching, and confidence scoring.
 */

import { VoiceCommandStatus, VoiceCommandType } from '@shared/schema';
import { voiceCommandAnalyticsService } from './voice-command-analytics-service';
import { voiceCommandHelpService } from './voice-command-help-service';

interface ErrorResponse {
  status: VoiceCommandStatus;
  errorMessage: string;
  suggestions?: string[];
  alternativeCommands?: string[];
  helpContent?: any;
}

export class VoiceCommandErrorHandler {
  // Common typos and misspellings for voice recognition correction
  private commonTypos: Record<string, string[]> = {
    'property': ['propertie', 'propety', 'porperty', 'propperty'],
    'assessment': ['assesment', 'asessment', 'assement', 'asesment'],
    'valuation': ['valation', 'valluation', 'valution', 'valaution'],
    'dashboard': ['dashbord', 'dashoard', 'dashboad', 'dashbard'],
    'navigate': ['navgate', 'navigat', 'nagivate', 'navigait'],
    'commercial': ['comercial', 'commersial', 'comercial', 'commershal'],
    'residential': ['residencial', 'residental', 'residenshal', 'rezidential'],
    'generate': ['genrate', 'generat', 'generait', 'genarate'],
    'report': ['repot', 'repor', 'reoprt', 'repoart'],
    'analytics': ['analitics', 'analyics', 'analatics', 'annalitics']
  };

  // Common command patterns for fuzzy matching
  private commandPatterns: Record<string, { pattern: RegExp, replacement: string, type: VoiceCommandType }[]> = {
    // Navigation patterns
    'navigation': [
      {
        pattern: /(?:go|navigate|open|take me|show)\s+(?:to|me)?\s+([\w\s]+)/i,
        replacement: 'navigate to $1',
        type: VoiceCommandType.NAVIGATION
      }
    ],
    
    // Property assessment patterns
    'assessment': [
      {
        pattern: /(?:assess|evaluate|value|appraise)\s+(?:property|parcel)?\s+([\w\d\s]+)/i,
        replacement: 'assess property $1',
        type: VoiceCommandType.PROPERTY_ASSESSMENT
      },
      {
        pattern: /(?:find|show|get)\s+(?:comparables|comps)\s+(?:for)?\s+([\w\d\s]+)/i,
        replacement: 'find comparables for property $1',
        type: VoiceCommandType.PROPERTY_ASSESSMENT
      }
    ],
    
    // Data query patterns
    'query': [
      {
        pattern: /(?:show|list|find|search)\s+(?:all|for)?\s+(?:properties|parcels)\s*(.*)/i,
        replacement: 'show properties $1',
        type: VoiceCommandType.DATA_QUERY
      }
    ],
    
    // System patterns
    'system': [
      {
        pattern: /(?:show|display|tell me|what is)\s+(?:the)?\s*(?:help|commands|available commands|what can i say)/i,
        replacement: 'show help',
        type: VoiceCommandType.SYSTEM
      }
    ]
  };

  /**
   * Handle command not found error
   */
  async handleCommandNotFound(rawCommand: string, contextId?: string): Promise<ErrorResponse> {
    console.log(`Handling command not found: "${rawCommand}" in context "${contextId || 'global'}"`);
    
    // Try to correct the command using fuzzy matching
    const correctedCommand = await this.attemptCommandCorrection(rawCommand);
    
    // Get contextual help content
    const helpContent = await voiceCommandHelpService.getContextualHelp(
      contextId || 'global',
      false // Don't include hidden help content
    );
    
    // Extract example phrases from help content
    const examplePhrases = helpContent
      .flatMap(item => item.examplePhrases || [])
      .slice(0, 5); // Limit to 5 examples
    
    return {
      status: VoiceCommandStatus.FAILED,
      errorMessage: 'Command not recognized',
      suggestions: [
        'Try being more specific',
        'Use simpler language',
        'Speak more clearly'
      ],
      alternativeCommands: correctedCommand ? [correctedCommand, ...examplePhrases] : examplePhrases,
      helpContent: helpContent.slice(0, 3) // Limit to 3 help items
    };
  }

  /**
   * Handle ambiguous command error
   */
  async handleAmbiguousCommand(rawCommand: string, possibleIntents: string[]): Promise<ErrorResponse> {
    console.log(`Handling ambiguous command: "${rawCommand}" with possible intents: ${possibleIntents.join(', ')}`);
    
    return {
      status: VoiceCommandStatus.AMBIGUOUS,
      errorMessage: 'Your command could mean several things',
      suggestions: [
        'Try being more specific',
        'Include more details in your command'
      ],
      alternativeCommands: possibleIntents
    };
  }

  /**
   * Handle missing parameter error
   */
  async handleMissingParameter(rawCommand: string, missingParam: string, commandType: VoiceCommandType): Promise<ErrorResponse> {
    console.log(`Handling missing parameter: "${missingParam}" for command "${rawCommand}"`);
    
    // Get help content for this command type
    const helpContent = await voiceCommandHelpService.getHelpContentByCommandType(commandType, false);
    
    // Find the relevant help content item
    const relevantHelp = helpContent.find(item => {
      // Check if the parameters field contains the missing parameter
      return item.parameters && Object.keys(item.parameters).includes(missingParam);
    });
    
    // Create a prompt for the missing parameter
    let parameterPrompt = `Please specify the ${missingParam}`;
    if (relevantHelp?.parameters?.[missingParam]) {
      parameterPrompt += `: ${relevantHelp.parameters[missingParam]}`;
    }
    
    return {
      status: VoiceCommandStatus.PARTIAL_SUCCESS,
      errorMessage: `Missing required parameter: ${missingParam}`,
      suggestions: [
        parameterPrompt,
        `Try a more complete command like "${relevantHelp?.examplePhrases?.[0] || 'N/A'}"`
      ],
      helpContent: relevantHelp ? [relevantHelp] : undefined
    };
  }

  /**
   * Handle invalid parameter error
   */
  async handleInvalidParameter(rawCommand: string, param: string, value: string, validValues?: string[]): Promise<ErrorResponse> {
    console.log(`Handling invalid parameter: "${param}" with value "${value}"`);
    
    let suggestions = [`The value "${value}" is not valid for ${param}`];
    
    if (validValues && validValues.length > 0) {
      suggestions.push(`Valid values are: ${validValues.join(', ')}`);
    }
    
    return {
      status: VoiceCommandStatus.FAILED,
      errorMessage: `Invalid value for ${param}`,
      suggestions
    };
  }

  /**
   * Handle permission error
   */
  async handlePermissionError(rawCommand: string, permissionNeeded: string): Promise<ErrorResponse> {
    console.log(`Handling permission error: needs "${permissionNeeded}" for command "${rawCommand}"`);
    
    return {
      status: VoiceCommandStatus.FAILED,
      errorMessage: 'You don\'t have permission for this command',
      suggestions: [
        `You need ${permissionNeeded} permission to use this command`,
        'Contact your administrator for assistance'
      ]
    };
  }

  /**
   * Handle system error
   */
  async handleSystemError(rawCommand: string, error: Error): Promise<ErrorResponse> {
    console.error(`System error while processing command "${rawCommand}":`, error);
    
    return {
      status: VoiceCommandStatus.FAILED,
      errorMessage: 'An unexpected error occurred',
      suggestions: [
        'Please try again',
        'Try a different command',
        'If this persists, contact support'
      ]
    };
  }

  /**
   * Handle rate limit error
   */
  async handleRateLimitError(rawCommand: string): Promise<ErrorResponse> {
    console.log(`Handling rate limit error for command "${rawCommand}"`);
    
    return {
      status: VoiceCommandStatus.FAILED,
      errorMessage: 'Too many commands too quickly',
      suggestions: [
        'Please wait a moment before trying again',
        'Speak more slowly between commands'
      ]
    };
  }

  /**
   * Attempt to correct a command using fuzzy matching techniques
   */
  private async attemptCommandCorrection(rawCommand: string): Promise<string | null> {
    // Correct common typos
    let correctedCommand = this.correctTypos(rawCommand);
    
    // Try pattern matching to standardize command format
    const patternMatch = this.matchCommandPattern(correctedCommand);
    
    if (patternMatch) {
      return patternMatch;
    }
    
    // If we made typo corrections but no pattern match, return the typo-corrected version
    if (correctedCommand !== rawCommand) {
      return correctedCommand;
    }
    
    return null;
  }

  /**
   * Correct common typos in a command
   */
  private correctTypos(command: string): string {
    let corrected = command;
    
    // Check for each known word and its typos
    Object.entries(this.commonTypos).forEach(([correct, typos]) => {
      typos.forEach(typo => {
        // Use word boundary regex to avoid partial word replacements
        const regex = new RegExp(`\\b${typo}\\b`, 'gi');
        corrected = corrected.replace(regex, correct);
      });
    });
    
    return corrected;
  }

  /**
   * Match a command against known patterns
   */
  private matchCommandPattern(command: string): string | null {
    // Check each category of patterns
    for (const patterns of Object.values(this.commandPatterns)) {
      for (const { pattern, replacement } of patterns) {
        if (pattern.test(command)) {
          return command.replace(pattern, replacement);
        }
      }
    }
    
    return null;
  }

  /**
   * Calculate confidence score for a command
   * Returns a value between 0 and 1
   */
  calculateCommandConfidence(rawCommand: string, parsedIntent?: string): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Check if we recognized an intent
    if (parsedIntent) {
      confidence += 0.3;
    }
    
    // Check against command patterns for structure
    for (const patterns of Object.values(this.commandPatterns)) {
      for (const { pattern } of patterns) {
        if (pattern.test(rawCommand)) {
          confidence += 0.2;
          break;
        }
      }
    }
    
    // Penalize very short commands
    if (rawCommand.length < 5) {
      confidence -= 0.2;
    }
    
    // Penalize very long commands
    if (rawCommand.length > 100) {
      confidence -= 0.1;
    }
    
    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }
}

// Export singleton instance
export const voiceCommandErrorHandler = new VoiceCommandErrorHandler();