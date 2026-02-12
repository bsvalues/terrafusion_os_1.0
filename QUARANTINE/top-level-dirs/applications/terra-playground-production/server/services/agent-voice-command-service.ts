/**
 * Agent Voice Command Service (Server-side)
 *
 * This service processes voice commands received from the client and
 * handles routing them to appropriate agent functionality.
 */

import { IStorage } from '../storage';

// Define interfaces mirroring the client-side equivalents
export interface VoiceCommandContext {
  agentId?: string;
  subject?: string;
  recentCommands?: string[];
  recentResults?: any[];
}

export interface VoiceCommandAction {
  type: string;
  payload: any;
}

export interface VoiceCommandResult {
  command: string;
  processed: boolean;
  successful: boolean;
  response?: string;
  error?: string;
  data?: any;
  actions?: VoiceCommandAction[];
  timestamp: number;
}

export class AgentVoiceCommandService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Process a voice command and generate an appropriate response
   */
  public async processCommand(
    command: string,
    context: VoiceCommandContext = {}
  ): Promise<VoiceCommandResult> {
    try {
      // Normalize the command
      const normalizedCommand = command.trim().toLowerCase();

      // Track this command in the activity log
      await this.logVoiceCommand(normalizedCommand, context);

      // Process the command based on intent
      const result = await this.routeCommandByIntent(normalizedCommand, context);

      return {
        command,
        processed: true,
        successful: result.successful,
        response: result.response,
        error: result.error,
        data: result.data,
        actions: result.actions,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        command,
        processed: false,
        successful: false,
        error: error instanceof Error ? error.message : 'Unknown error processing command',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Determine the intent of the command and route to the appropriate handler
   */
  private async routeCommandByIntent(
    command: string,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    // Extract the potential intents from the command
    // This is a simple approach - in a real system, you'd want to use a more sophisticated NLU system

    // Property data queries
    if (
      command.includes('property data') ||
      command.includes('show property') ||
      command.includes('property details') ||
      command.includes('property info')
    ) {
      return await this.handlePropertyDataQuery(command, context);
    }

    // Valuation reports
    if (
      command.includes('valuation report') ||
      command.includes('generate report') ||
      command.includes('valuation for') ||
      command.includes('assessment report')
    ) {
      return await this.handleValuationReport(command, context);
    }

    // Assessment methods queries
    if (
      command.includes('assessment method') ||
      command.includes('how do you assess') ||
      command.includes('how are properties assessed') ||
      command.includes('assessment process')
    ) {
      return await this.handleAssessmentMethodQuery(command, context);
    }

    // Help queries
    if (
      command.includes('help') ||
      command.includes('assist') ||
      command.includes('what can you do') ||
      command.includes('capabilities')
    ) {
      return await this.handleHelpQuery(command, context);
    }

    // If we can't determine a specific intent, use a general response handler
    return await this.handleGeneralQuery(command, context);
  }

  /**
   * Handle property data queries
   */
  private async handlePropertyDataQuery(
    command: string,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    // Extract property ID or address from the command
    // This is a simple regex approach - in a real system, you'd use entity extraction
    const propertyIdMatch = command.match(
      /property (?:data|details|info)(?:\s+for)?\s+([a-z0-9-]+)/i
    );
    const propertyId = propertyIdMatch ? propertyIdMatch[1] : null;

    if (propertyId) {
      try {
        // Try to fetch property data from storage
        const propertyData = await this.storage.getPropertyById(propertyId);

        if (propertyData) {
          // Return success with the property data
          return {
            command,
            processed: true,
            successful: true,
            response: `Here is the property data for ID ${propertyId}.`,
            data: propertyData,
            actions: [
              {
                type: 'display_property_details',
                payload: { propertyId: propertyId },
              },
            ],
            timestamp: Date.now(),
          };
        } else {
          // Property not found
          return {
            command,
            processed: true,
            successful: false,
            response: `I couldn't find property data for ID ${propertyId}. Please verify the property ID and try again.`,
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
        return {
          command,
          processed: true,
          successful: false,
          error: 'Error retrieving property data. Please try again later.',
          timestamp: Date.now(),
        };
      }
    } else {
      // No property ID found in the command
      return {
        command,
        processed: true,
        successful: false,
        response:
          'I need a property ID to show you property data. Please specify a property ID in your command.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Handle valuation report requests
   */
  private async handleValuationReport(
    command: string,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    // Extract address or ID from command
    const addressMatch = command.match(/valuation (?:report|for)\s+(.+?)(?:$|\s+and|\s+with)/i);
    const address = addressMatch ? addressMatch[1].trim() : null;

    if (address) {
      try {
        // In a real implementation, you would:
        // 1. Look up the property by address
        // 2. Generate or retrieve a valuation report
        // 3. Return the report data

        // For demo purposes, we'll simulate a successful response
        return {
          command,
          processed: true,
          successful: true,
          response: `I've generated a valuation report for ${address}. You can view it now.`,
          data: {
            address: address,
            estimatedValue: '$345,000',
            lastAssessment: '2024-01-15',
            comparables: [
              { address: '123 Nearby St', value: '$330,000' },
              { address: '456 Similar Ave', value: '$352,000' },
            ],
          },
          actions: [
            {
              type: 'open_modal',
              payload: {
                modalType: 'valuationReport',
                address: address,
              },
            },
          ],
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('Error generating valuation report:', error);
        return {
          command,
          processed: true,
          successful: false,
          error: 'Error generating valuation report. Please try again later.',
          timestamp: Date.now(),
        };
      }
    } else {
      // No address found in the command
      return {
        command,
        processed: true,
        successful: false,
        response:
          'I need an address to generate a valuation report. Please specify an address in your command.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Handle assessment method queries
   */
  private async handleAssessmentMethodQuery(
    command: string,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    // Check for property type in the query
    const propertyTypes = ['residential', 'commercial', 'industrial', 'agricultural', 'vacant'];
    let propertyType = 'general';

    for (const type of propertyTypes) {
      if (command.includes(type)) {
        propertyType = type;
        break;
      }
    }

    // Generate a response based on the property type
    let response = '';

    switch (propertyType) {
      case 'residential':
        response =
          'Residential properties are primarily assessed using the sales comparison approach. We analyze recent sales of similar properties in the area, adjusting for differences in features, size, condition, and location. Additionally, we consider the replacement cost minus depreciation and the income potential for rental properties.';
        break;
      case 'commercial':
        response =
          "Commercial properties are typically assessed using the income approach, which considers the property's potential to generate income. We analyze rental rates, vacancy rates, operating expenses, and capitalization rates. We also consider the sales comparison and cost approaches as supporting methodologies.";
        break;
      case 'industrial':
        response =
          'Industrial properties are assessed using a combination of approaches. We consider the cost approach (replacement cost minus depreciation), the income approach for leased facilities, and sales of comparable industrial properties when available. Special attention is given to specialized equipment and site improvements.';
        break;
      case 'agricultural':
        response =
          'Agricultural properties are assessed based on their productive value rather than market value. We consider factors such as soil quality, irrigation, crop yields, and commodity prices. Agricultural land may qualify for special valuation programs that provide reduced assessments.';
        break;
      case 'vacant':
        response =
          'Vacant land is primarily assessed using the sales comparison approach, analyzing sales of similar vacant parcels. We consider factors such as zoning, location, size, topography, access to utilities, and development potential.';
        break;
      default:
        response =
          'Property assessment generally involves three approaches: sales comparison (analyzing similar property sales), cost (replacement cost minus depreciation), and income (for properties that generate income). The approach used depends on the property type and available data. Assessors analyze market trends, property characteristics, location factors, and improvements to determine fair market value.';
    }

    return {
      command,
      processed: true,
      successful: true,
      response,
      actions: [
        {
          type: 'display_notification',
          payload: {
            title: `Assessment Methods for ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} Properties`,
            message: 'Detailed information displayed',
          },
        },
      ],
      timestamp: Date.now(),
    };
  }

  /**
   * Handle help queries
   */
  private async handleHelpQuery(
    command: string,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    const helpResponse = `
I can help you with various assessment tasks. Try commands like:

1. "Show me property data for [property ID]" - Get details about a specific property
2. "Generate a valuation report for [address]" - Create a property valuation report
3. "What's the assessment method for [type] properties?" - Learn about assessment methodologies
4. "Help me understand land value calculations" - Get explanations about assessment concepts

You can also ask specific questions about properties, valuations, or assessment methods.
    `;

    return {
      command,
      processed: true,
      successful: true,
      response: helpResponse.trim(),
      actions: [
        {
          type: 'display_notification',
          payload: {
            title: 'Voice Command Help',
            message: 'Available commands displayed',
          },
        },
      ],
      timestamp: Date.now(),
    };
  }

  /**
   * Handle general queries that don't match a specific intent
   */
  private async handleGeneralQuery(
    command: string,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    try {
      // In a production system, you would integrate with a more sophisticated
      // language model API here for general responses

      // For demo purposes, we'll use a simplified approach
      let response = "I'm not sure how to help with that specific request. ";
      response += 'You can ask me about property data, valuation reports, or assessment methods. ';
      response += "Try saying 'help' to see what I can do.";

      return {
        command,
        processed: true,
        successful: true,
        response,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error handling general query:', error);
      return {
        command,
        processed: true,
        successful: false,
        error: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Log the voice command in the system activity log
   */
  private async logVoiceCommand(command: string, context: VoiceCommandContext): Promise<void> {
    try {
      const logData = {
        activity_type: 'voice_command',
        component: 'agent_voice_interface',
        details: {
          command,
          agentId: context.agentId || 'default',
          subject: context.subject || 'general',
          timestamp: new Date().toISOString(),
          source: 'agent_voice_command_service',
        },
        status: 'completed',
      };

      // Log to console for debugging
      );

      // Try to use storage method if it exists
      if (this.storage.createSystemActivity) {
        await this.storage.createSystemActivity(logData);
      } else if (this.storage.createActivityLog) {
        await this.storage.createActivityLog(logData);
      } else {
        console.warn(
          'No suitable storage method found for logging voice commands. Falling back to console logging only.'
        );
      }

      // Also log to any analytics systems as needed
      // This could include sending events to monitoring services
      this.logToAnalytics(command, context);
    } catch (error) {
      console.error('Error logging voice command:', error);
      // Non-blocking - we'll continue even if logging fails
    }
  }

  /**
   * Log to analytics systems for tracking and improvement
   * This is a placeholder method that could be implemented in the future
   */
  private logToAnalytics(command: string, context: VoiceCommandContext): void {
    // This would integrate with your analytics system
    // For now, we'll just log to console
    ,
    });
  }
}

// Create a singleton instance to be used throughout the application
let agentVoiceCommandService: AgentVoiceCommandService;

export function initializeAgentVoiceCommandService(storage: IStorage): AgentVoiceCommandService {
  agentVoiceCommandService = new AgentVoiceCommandService(storage);
  return agentVoiceCommandService;
}

export function getAgentVoiceCommandService(): AgentVoiceCommandService {
  if (!agentVoiceCommandService) {
    throw new Error('Agent Voice Command Service has not been initialized');
  }
  return agentVoiceCommandService;
}

