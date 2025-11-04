/**
 * AI Assistant Personality Service
 *
 * This service manages the creation, retrieval, and customization of AI assistant personalities.
 * It provides functionality for users to create and manage personalized AI interaction styles.
 */

import { logger } from '../utils/logger';
import { json } from 'drizzle-orm/pg-core';
import { db } from '../db';
import {
  assistantPersonalities,
  personalityTemplates,
  userPersonalityPreferences,
  AssistantPersonality,
  PersonalityTemplate,
  InsertAssistantPersonality,
  InsertPersonalityTemplate,
  PersonalityTraits,
  VisualTheme,
  AssistantPersonalityTheme,
} from '@shared/schema';
import { eq, and, or, desc } from 'drizzle-orm';

class AssistantPersonalityService {
  /**
   * Create a new assistant personality
   */
  async createPersonality(
    personalityData: InsertAssistantPersonality
  ): Promise<AssistantPersonality> {
    try {
      logger.info(
        `AssistantPersonalityService: Creating new assistant personality: ${personalityData.name}`
      );

      // If this is set as default, unset any existing defaults for this user
      if (personalityData.isDefault) {
        await db
          .update(assistantPersonalities)
          .set({ isDefault: false })
          .where(
            and(
              eq(assistantPersonalities.userId, personalityData.userId),
              eq(assistantPersonalities.isDefault, true)
            )
          );
      }

      const [newPersonality] = await db
        .insert(assistantPersonalities)
        .values(personalityData)
        .returning();

      return newPersonality;
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error creating assistant personality - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Update an existing assistant personality
   */
  async updatePersonality(
    id: number,
    userId: number,
    personalityData: Partial<InsertAssistantPersonality>
  ): Promise<AssistantPersonality> {
    try {
      logger.info(`AssistantPersonalityService: Updating assistant personality ID: ${id}`);

      // If setting as default, unset any existing defaults for this user
      if (personalityData.isDefault) {
        await db
          .update(assistantPersonalities)
          .set({ isDefault: false })
          .where(
            and(
              eq(assistantPersonalities.userId, userId),
              eq(assistantPersonalities.isDefault, true)
            )
          );
      }

      const [updatedPersonality] = await db
        .update(assistantPersonalities)
        .set({
          ...personalityData,
          updatedAt: new Date(),
        })
        .where(and(eq(assistantPersonalities.id, id), eq(assistantPersonalities.userId, userId)))
        .returning();

      if (!updatedPersonality) {
        throw new Error('Personality not found or you do not have permission to update it');
      }

      return updatedPersonality;
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error updating assistant personality ID: ${id} - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Delete an assistant personality
   */
  async deletePersonality(id: number, userId: number): Promise<void> {
    try {
      logger.info(`AssistantPersonalityService: Deleting assistant personality ID: ${id}`);

      // Delete any user preferences referring to this personality
      await db
        .delete(userPersonalityPreferences)
        .where(eq(userPersonalityPreferences.personalityId, id));

      // Delete the personality
      const result = await db
        .delete(assistantPersonalities)
        .where(and(eq(assistantPersonalities.id, id), eq(assistantPersonalities.userId, userId)))
        .returning({ id: assistantPersonalities.id });

      if (result.length === 0) {
        throw new Error('Personality not found or you do not have permission to delete it');
      }
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error deleting assistant personality ID: ${id} - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get a single assistant personality by ID
   */
  async getPersonalityById(id: number): Promise<AssistantPersonality | null> {
    try {
      const [personality] = await db
        .select()
        .from(assistantPersonalities)
        .where(eq(assistantPersonalities.id, id));

      return personality || null;
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error retrieving assistant personality ID: ${id} - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get all personalities accessible to a user (owned + public)
   */
  async getPersonalitiesForUser(userId: number): Promise<AssistantPersonality[]> {
    try {
      const personalities = await db
        .select()
        .from(assistantPersonalities)
        .where(
          or(eq(assistantPersonalities.userId, userId), eq(assistantPersonalities.isPublic, true))
        )
        .orderBy(desc(assistantPersonalities.isDefault), assistantPersonalities.name);

      return personalities;
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error retrieving personalities for user ID: ${userId} - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get the default personality for a user
   */
  async getDefaultPersonalityForUser(userId: number): Promise<AssistantPersonality | null> {
    try {
      // Try to find user's default personality
      const [defaultPersonality] = await db
        .select()
        .from(assistantPersonalities)
        .where(
          and(eq(assistantPersonalities.userId, userId), eq(assistantPersonalities.isDefault, true))
        );

      // If not found, try to find any personality owned by user
      if (!defaultPersonality) {
        const [anyPersonality] = await db
          .select()
          .from(assistantPersonalities)
          .where(eq(assistantPersonalities.userId, userId))
          .limit(1);

        if (anyPersonality) {
          return anyPersonality;
        }

        // If still not found, return the system default
        const [systemDefault] = await db
          .select()
          .from(assistantPersonalities)
          .where(
            and(
              eq(assistantPersonalities.isPublic, true),
              eq(assistantPersonalities.isDefault, true)
            )
          );

        return systemDefault || null;
      }

      return defaultPersonality;
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error retrieving default personality for user ID: ${userId} - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Set a personality as the default for a user
   */
  async setDefaultPersonality(personalityId: number, userId: number): Promise<void> {
    try {
      // First, unset any existing default personalities for this user
      await db
        .update(assistantPersonalities)
        .set({ isDefault: false })
        .where(
          and(eq(assistantPersonalities.userId, userId), eq(assistantPersonalities.isDefault, true))
        );

      // Then set the requested personality as default
      const [updatedPersonality] = await db
        .update(assistantPersonalities)
        .set({ isDefault: true })
        .where(
          and(
            eq(assistantPersonalities.id, personalityId),
            eq(assistantPersonalities.userId, userId)
          )
        )
        .returning();

      if (!updatedPersonality) {
        throw new Error('Personality not found or you do not have permission to update it');
      }
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error setting default personality ID: ${personalityId} for user ID: ${userId} - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get all personality templates
   */
  async getPersonalityTemplates(): Promise<PersonalityTemplate[]> {
    try {
      const templates = await db
        .select()
        .from(personalityTemplates)
        .orderBy(personalityTemplates.name);

      return templates;
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error retrieving personality templates - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Create a personality from a template
   */
  async createPersonalityFromTemplate(
    templateId: number,
    userId: number,
    customData: Partial<InsertAssistantPersonality> = {}
  ): Promise<AssistantPersonality> {
    try {
      // Get the template
      const [template] = await db
        .select()
        .from(personalityTemplates)
        .where(eq(personalityTemplates.id, templateId));

      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      // Create personality from template
      const personalityData: InsertAssistantPersonality = {
        name: customData.name || `${template.name} (Custom)`,
        description: customData.description || template.description || '',
        traits: customData.traits || template.traits,
        visualTheme: customData.visualTheme || template.visualTheme,
        systemPrompt: customData.systemPrompt || template.systemPrompt,
        exampleMessages: customData.exampleMessages || template.exampleMessages,
        isDefault: customData.isDefault || false,
        userId,
        isPublic: false,
      };

      return this.createPersonality(personalityData);
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error creating personality from template ID: ${templateId} - ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Generate a system prompt based on personality traits
   */
  generateSystemPrompt(personality: AssistantPersonality): string {
    const { traits } = personality;
    let prompt = personality.systemPrompt;

    // If the personality doesn't have a custom system prompt, generate one based on traits
    if (!prompt || prompt.trim() === '') {
      prompt = 'You are an AI assistant for a property assessment system. ';

      if (traits.formality > 7) {
        prompt +=
          'Communicate in a formal, professional manner. Use proper terminology and maintain a respectful tone. ';
      } else if (traits.formality < 4) {
        prompt +=
          'Communicate in a casual, conversational manner. Use simple language and a friendly tone. ';
      }

      if (traits.technicality > 7) {
        prompt += 'Provide detailed technical information and use industry-specific terminology. ';
      } else if (traits.technicality < 4) {
        prompt += 'Explain concepts in simple terms avoiding unnecessary technical jargon. ';
      }

      if (traits.conciseness > 7) {
        prompt += 'Be brief and to the point in your responses. Focus on essential information. ';
      } else if (traits.conciseness < 4) {
        prompt += 'Provide comprehensive, detailed explanations with examples when helpful. ';
      }

      if (traits.friendliness > 7) {
        prompt += 'Be warm, encouraging, and personable in your interactions. ';
      }

      if (traits.creativity > 7) {
        prompt +=
          'Feel free to suggest innovative approaches and think outside the box when appropriate. ';
      } else if (traits.creativity < 4) {
        prompt += 'Focus on proven, conventional approaches and established best practices. ';
      }
    }

    return prompt;
  }

  /**
   * Initialize default personality templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      // Check if templates already exist
      const existingTemplates = await db.select().from(personalityTemplates).limit(1);
      if (existingTemplates.length > 0) {
        logger.info(
          `AssistantPersonalityService: Default personality templates already exist, skipping initialization`
        );
        return;
      }

      const defaultTemplates: InsertPersonalityTemplate[] = [
        {
          name: 'Professional Assessor',
          description:
            'A formal, precise assistant focused on technical correctness and professional communication',
          category: AssistantPersonalityTheme.PROFESSIONAL,
          traits: {
            formality: 9,
            friendliness: 5,
            technicality: 8,
            creativity: 3,
            conciseness: 7,
          },
          visualTheme: {
            primaryColor: '#0f766e',
            secondaryColor: '#334155',
            accentColor: '#0369a1',
            iconSet: 'default',
            themeName: 'Professional',
          },
          systemPrompt:
            'You are a professional property assessment assistant with expertise in valuation methodologies and property tax regulations. Communicate with precision and provide technically accurate information. Maintain a formal, professional tone at all times.',
          exampleMessages: [
            'What are the key factors that influence the assessed value of a commercial property?',
            'Could you explain the income approach to property valuation?',
            'What documentation is required for a property tax appeal?',
          ],
          isOfficial: true,
        },
        {
          name: 'Friendly Guide',
          description: 'A warm, approachable assistant that explains concepts in simple terms',
          category: AssistantPersonalityTheme.FRIENDLY,
          traits: {
            formality: 3,
            friendliness: 9,
            technicality: 4,
            creativity: 6,
            conciseness: 5,
          },
          visualTheme: {
            primaryColor: '#7c3aed',
            secondaryColor: '#f59e0b',
            accentColor: '#06b6d4',
            iconSet: 'playful',
            themeName: 'Friendly',
          },
          systemPrompt:
            'You are a friendly guide to the property assessment system. Your goal is to make complex concepts easy to understand for everyone. Use conversational language, helpful examples, and a warm, supportive tone. Avoid jargon when possible and explain technical terms when you need to use them.',
          exampleMessages: [
            'Can you help me understand how property taxes are calculated?',
            'What should I do if I think my property assessment is too high?',
            'Could you walk me through how to use the assessment modeling tool?',
          ],
          isOfficial: true,
        },
        {
          name: 'Technical Expert',
          description:
            'A detailed, technically-focused assistant for in-depth analysis and explanations',
          category: AssistantPersonalityTheme.TECHNICAL,
          traits: {
            formality: 7,
            friendliness: 4,
            technicality: 10,
            creativity: 5,
            conciseness: 3,
          },
          visualTheme: {
            primaryColor: '#0891b2',
            secondaryColor: '#1e293b',
            accentColor: '#2563eb',
            iconSet: 'detailed',
            themeName: 'Technical',
          },
          systemPrompt:
            "You are a technical expert on property assessment systems and methodologies. Provide detailed, technically precise explanations with relevant statistics, methodologies, and industry best practices. Don't simplify unless asked to do so. Include formulas, specific parameters, and technical terminology where appropriate.",
          exampleMessages: [
            'What statistical methods are most effective for detecting assessment inequities across property classes?',
            'Explain the difference between the cost approach, sales comparison approach, and income approach in commercial property valuation.',
            'What machine learning algorithms are best suited for predicting property value fluctuations based on historical assessment data?',
          ],
          isOfficial: true,
        },
        {
          name: 'Creative Advisor',
          description:
            'An innovative assistant that provides alternative perspectives and creative solutions',
          category: AssistantPersonalityTheme.CREATIVE,
          traits: {
            formality: 5,
            friendliness: 7,
            technicality: 6,
            creativity: 10,
            conciseness: 4,
          },
          visualTheme: {
            primaryColor: '#c026d3',
            secondaryColor: '#3b82f6',
            accentColor: '#f59e0b',
            iconSet: 'playful',
            themeName: 'Creative',
          },
          systemPrompt:
            'You are a creative advisor for property assessment professionals. Approach problems with innovative thinking and suggest alternative perspectives. Feel free to propose unconventional ideas, make analogies to other fields, and think outside the traditional assessment paradigms. Help users explore new possibilities and approaches.',
          exampleMessages: [
            'How could we reimagine the public-facing property assessment portal to increase citizen engagement?',
            'What innovative approaches from other industries could we apply to improve property data collection?',
            'Can you suggest some creative ways to visualize assessment equity across different neighborhoods?',
          ],
          isOfficial: true,
        },
        {
          name: 'Concise Assistant',
          description: 'A direct, to-the-point assistant that delivers information efficiently',
          category: AssistantPersonalityTheme.CONCISE,
          traits: {
            formality: 6,
            friendliness: 5,
            technicality: 7,
            creativity: 4,
            conciseness: 10,
          },
          visualTheme: {
            primaryColor: '#4f46e5',
            secondaryColor: '#64748b',
            accentColor: '#0891b2',
            iconSet: 'minimal',
            themeName: 'Concise',
          },
          systemPrompt:
            'You are a concise assistant for property assessment professionals. Provide brief, efficient responses that deliver maximum value with minimum text. Focus on the most important points, eliminate unnecessary details, and get straight to the point. Use bullet points, short sentences, and clear language.',
          exampleMessages: [
            'What are the key steps in the assessment appeal process?',
            'Summarize best practices for property data validation.',
            'List the main factors that affect residential property values.',
          ],
          isOfficial: true,
        },
      ];

      // Insert default templates
      await db.insert(personalityTemplates).values(defaultTemplates);

      logger.info(
        `AssistantPersonalityService: Initialized ${defaultTemplates.length} default personality templates`
      );
    } catch (error) {
      logger.error(
        `AssistantPersonalityService: Error initializing default personality templates - ${error.message}`
      );
      throw error;
    }
  }
}

export const assistantPersonalityService = new AssistantPersonalityService();
