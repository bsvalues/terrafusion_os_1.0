/**
 * Voice Command Help Service
 * 
 * This service manages help content for voice commands, providing contextual
 * assistance and examples based on the user's current location in the app.
 */

import { db } from '../../db';
import { 
  voiceCommandHelpContents,
  InsertVoiceCommandHelpContent,
  VoiceCommandType
} from '@shared/schema';
import { eq, and, or, sql, desc, asc } from 'drizzle-orm';

export class VoiceCommandHelpService {
  /**
   * Create new help content for a voice command
   */
  async createHelpContent(helpData: InsertVoiceCommandHelpContent): Promise<any> {
    try {
      const [result] = await db.insert(voiceCommandHelpContents)
        .values(helpData)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating voice command help content:', error);
      throw error;
    }
  }

  /**
   * Update existing help content
   */
  async updateHelpContent(helpId: number, helpData: Partial<InsertVoiceCommandHelpContent>): Promise<any> {
    try {
      const [result] = await db.update(voiceCommandHelpContents)
        .set({
          ...helpData,
          updatedAt: new Date()
        })
        .where(eq(voiceCommandHelpContents.id, helpId))
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error updating voice command help content:', error);
      throw error;
    }
  }

  /**
   * Delete help content
   */
  async deleteHelpContent(helpId: number): Promise<boolean> {
    try {
      await db.delete(voiceCommandHelpContents)
        .where(eq(voiceCommandHelpContents.id, helpId));
      
      return true;
    } catch (error) {
      console.error('Error deleting voice command help content:', error);
      throw error;
    }
  }

  /**
   * Get help content by ID
   */
  async getHelpContentById(helpId: number): Promise<any> {
    try {
      const [helpContent] = await db.select()
        .from(voiceCommandHelpContents)
        .where(eq(voiceCommandHelpContents.id, helpId));
      
      return helpContent || null;
    } catch (error) {
      console.error('Error getting voice command help content:', error);
      throw error;
    }
  }

  /**
   * Get all help content
   */
  async getAllHelpContent(includeHidden: boolean = false): Promise<any[]> {
    try {
      let query = db.select().from(voiceCommandHelpContents);
      
      if (!includeHidden) {
        query = query.where(eq(voiceCommandHelpContents.isHidden, false));
      }
      
      return await query.orderBy(
        desc(voiceCommandHelpContents.priority),
        asc(voiceCommandHelpContents.commandType),
        asc(voiceCommandHelpContents.title)
      );
    } catch (error) {
      console.error('Error getting all voice command help content:', error);
      throw error;
    }
  }

  /**
   * Get help content by command type
   */
  async getHelpContentByCommandType(commandType: VoiceCommandType, includeHidden: boolean = false): Promise<any[]> {
    try {
      let query = db.select()
        .from(voiceCommandHelpContents)
        .where(eq(voiceCommandHelpContents.commandType, commandType));
      
      if (!includeHidden) {
        query = query.where(eq(voiceCommandHelpContents.isHidden, false));
      }
      
      return await query.orderBy(
        desc(voiceCommandHelpContents.priority),
        asc(voiceCommandHelpContents.title)
      );
    } catch (error) {
      console.error('Error getting help content by command type:', error);
      throw error;
    }
  }

  /**
   * Get contextual help based on the current page/context
   */
  async getContextualHelp(contextId: string, includeHidden: boolean = false): Promise<any[]> {
    try {
      let query = db.select()
        .from(voiceCommandHelpContents)
        .where(
          or(
            eq(voiceCommandHelpContents.contextId, contextId),
            sql`${voiceCommandHelpContents.contextId} IS NULL` // Global help content
          )
        );
      
      if (!includeHidden) {
        query = query.where(eq(voiceCommandHelpContents.isHidden, false));
      }
      
      return await query.orderBy(
        desc(voiceCommandHelpContents.priority),
        asc(voiceCommandHelpContents.commandType),
        asc(voiceCommandHelpContents.title)
      );
    } catch (error) {
      console.error('Error getting contextual help:', error);
      throw error;
    }
  }

  /**
   * Search for help content
   */
  async searchHelpContent(searchTerm: string, includeHidden: boolean = false): Promise<any[]> {
    try {
      let query = db.select()
        .from(voiceCommandHelpContents)
        .where(
          or(
            sql`${voiceCommandHelpContents.title} ILIKE ${`%${searchTerm}%`}`,
            sql`${voiceCommandHelpContents.description} ILIKE ${`%${searchTerm}%`}`,
            sql`EXISTS (
              SELECT 1 FROM unnest(${voiceCommandHelpContents.examplePhrases}) AS phrase 
              WHERE phrase ILIKE ${`%${searchTerm}%`}
            )`
          )
        );
      
      if (!includeHidden) {
        query = query.where(eq(voiceCommandHelpContents.isHidden, false));
      }
      
      return await query.orderBy(
        desc(voiceCommandHelpContents.priority),
        asc(voiceCommandHelpContents.title)
      );
    } catch (error) {
      console.error('Error searching help content:', error);
      throw error;
    }
  }

  /**
   * Initialize default help content for the system
   */
  async initializeDefaultHelpContent(): Promise<void> {
    try {
      // Check if help content already exists
      const existingContent = await db.select({ count: sql<number>`count(*)` })
        .from(voiceCommandHelpContents);
      
      if (existingContent[0].count > 0) {
        console.log('Help content already initialized, skipping default content creation');
        return;
      }
      
      // Define default help content
      const defaultHelpContent: InsertVoiceCommandHelpContent[] = [
        // Navigation commands
        {
          commandType: VoiceCommandType.NAVIGATION,
          contextId: null, // Global
          title: "Navigation Commands",
          examplePhrases: [
            "go to dashboard",
            "navigate to property listing",
            "open property details",
            "show analytics",
            "take me to settings"
          ],
          description: "Navigation commands allow you to move between different pages and sections of the application without clicking.",
          parameters: {
            "destination": "The page or section you want to navigate to"
          },
          responseExample: "Navigating to property listing page",
          priority: 10
        },
        
        // Property assessment commands
        {
          commandType: VoiceCommandType.PROPERTY_ASSESSMENT,
          contextId: null, // Global
          title: "Property Assessment Commands",
          examplePhrases: [
            "assess property BC001",
            "calculate value for 123 Main Street",
            "find comparables for property BC001",
            "generate valuation report for 123 Main Street",
            "show assessment history for property BC001"
          ],
          description: "Property assessment commands help you work with property valuations, comparables, and reports.",
          parameters: {
            "propertyId": "ID or address of the property to assess",
            "assessmentType": "Optional type of assessment to perform"
          },
          responseExample: "Generating valuation report for property BC001",
          priority: 9
        },
        
        // Data query commands
        {
          commandType: VoiceCommandType.DATA_QUERY,
          contextId: null, // Global
          title: "Data Query Commands",
          examplePhrases: [
            "show all properties",
            "find properties in Richland",
            "search for commercial properties",
            "list properties over $500,000",
            "show properties with pool"
          ],
          description: "Data query commands let you search and filter property data using natural language.",
          parameters: {
            "criteria": "Search criteria for finding properties",
            "limit": "Optional maximum number of results to show"
          },
          responseExample: "Found 15 properties matching your criteria",
          priority: 8
        },
        
        // Workflow commands
        {
          commandType: VoiceCommandType.WORKFLOW,
          contextId: null, // Global
          title: "Workflow Commands",
          examplePhrases: [
            "start new assessment workflow",
            "assign task to John",
            "mark step as complete",
            "show my pending tasks",
            "create new workflow"
          ],
          description: "Workflow commands help you manage assessment workflows, tasks, and team collaboration.",
          parameters: {
            "workflowType": "Type of workflow to start or manage",
            "action": "Action to perform on the workflow"
          },
          responseExample: "Started new assessment workflow WF-2023-05",
          priority: 7
        },
        
        // System commands
        {
          commandType: VoiceCommandType.SYSTEM,
          contextId: null, // Global
          title: "System Commands",
          examplePhrases: [
            "show help",
            "what can I say",
            "list available commands",
            "voice command settings",
            "stop listening"
          ],
          description: "System commands control the voice interface itself and provide help with available commands.",
          parameters: {
            "action": "System action to perform"
          },
          responseExample: "Here are the available voice commands",
          priority: 10
        },
        
        // Context-specific help: Property Details page
        {
          commandType: VoiceCommandType.PROPERTY_ASSESSMENT,
          contextId: "property-details",
          title: "Property Details Commands",
          examplePhrases: [
            "show tax history",
            "find similar properties",
            "edit property details",
            "show on map",
            "generate property report"
          ],
          description: "These commands are specific to the property details page and help you work with the current property.",
          parameters: {
            "action": "Action to perform on the current property"
          },
          responseExample: "Showing tax history for the current property",
          priority: 10
        },
        
        // Context-specific help: Dashboard
        {
          commandType: VoiceCommandType.DATA_QUERY,
          contextId: "dashboard",
          title: "Dashboard Commands",
          examplePhrases: [
            "show pending assessments",
            "filter by commercial properties",
            "show this month's statistics",
            "export dashboard data",
            "refresh dashboard"
          ],
          description: "These commands help you interact with the dashboard and analyze assessment data.",
          parameters: {
            "filter": "Optional filter criteria for dashboard data"
          },
          responseExample: "Showing pending assessments on dashboard",
          priority: 9
        }
      ];
      
      // Insert all default help content
      for (const helpContent of defaultHelpContent) {
        await this.createHelpContent(helpContent);
      }
      
      console.log('Default help content initialized successfully');
    } catch (error) {
      console.error('Error initializing default help content:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const voiceCommandHelpService = new VoiceCommandHelpService();