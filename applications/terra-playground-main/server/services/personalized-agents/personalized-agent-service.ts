import { db } from '../../db';
import { eq, and, desc, asc } from 'drizzle-orm';
import {
  PersonalizedDeveloperAgent,
  InsertPersonalizedDeveloperAgent,
  personalizedDeveloperAgents,
} from '@shared/schema';

/**
 * Service for managing personalized developer agents
 */
export class PersonalizedAgentService {
  /**
   * Get all personalized agents for a user
   * @param userId The user's ID
   * @returns List of personalized agents
   */
  async getUserAgents(userId: number): Promise<PersonalizedDeveloperAgent[]> {
    return db
      .select()
      .from(personalizedDeveloperAgents)
      .where(eq(personalizedDeveloperAgents.userId, userId))
      .orderBy(desc(personalizedDeveloperAgents.updatedAt));
  }

  /**
   * Get shared personalized agents (those created by other users and marked as shared)
   * @returns List of shared personalized agents
   */
  async getSharedAgents(): Promise<PersonalizedDeveloperAgent[]> {
    return db
      .select()
      .from(personalizedDeveloperAgents)
      .where(eq(personalizedDeveloperAgents.isShared, true))
      .orderBy(desc(personalizedDeveloperAgents.usageCount));
  }

  /**
   * Get an agent by ID
   * @param id Agent ID
   * @returns The agent or null if not found
   */
  async getAgentById(id: number): Promise<PersonalizedDeveloperAgent | null> {
    const [agent] = await db
      .select()
      .from(personalizedDeveloperAgents)
      .where(eq(personalizedDeveloperAgents.id, id))
      .limit(1);

    return agent || null;
  }

  /**
   * Get an agent by name and user ID
   * @param name Agent name
   * @param userId User ID
   * @returns The agent or null if not found
   */
  async getAgentByName(name: string, userId: number): Promise<PersonalizedDeveloperAgent | null> {
    const [agent] = await db
      .select()
      .from(personalizedDeveloperAgents)
      .where(
        and(
          eq(personalizedDeveloperAgents.name, name),
          eq(personalizedDeveloperAgents.userId, userId)
        )
      )
      .limit(1);

    return agent || null;
  }

  /**
   * Create a new personalized agent
   * @param agent Agent data
   * @returns The created agent
   */
  async createAgent(agent: InsertPersonalizedDeveloperAgent): Promise<PersonalizedDeveloperAgent> {
    const [result] = await db.insert(personalizedDeveloperAgents).values(agent).returning();

    return result;
  }

  /**
   * Update an existing personalized agent
   * @param id Agent ID
   * @param userId User ID (for authorization)
   * @param updates Agent data updates
   * @returns The updated agent or null if not found or not authorized
   */
  async updateAgent(
    id: number,
    userId: number,
    updates: Partial<InsertPersonalizedDeveloperAgent>
  ): Promise<PersonalizedDeveloperAgent | null> {
    const [result] = await db
      .update(personalizedDeveloperAgents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(eq(personalizedDeveloperAgents.id, id), eq(personalizedDeveloperAgents.userId, userId))
      )
      .returning();

    return result || null;
  }

  /**
   * Delete a personalized agent
   * @param id Agent ID
   * @param userId User ID (for authorization)
   * @returns True if deleted, false if not found or not authorized
   */
  async deleteAgent(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(personalizedDeveloperAgents)
      .where(
        and(eq(personalizedDeveloperAgents.id, id), eq(personalizedDeveloperAgents.userId, userId))
      );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Increment the usage count for an agent
   * @param id Agent ID
   * @returns The updated agent or null if not found
   */
  async incrementUsageCount(id: number): Promise<PersonalizedDeveloperAgent | null> {
    const agent = await this.getAgentById(id);

    if (!agent) {
      return null;
    }

    const [result] = await db
      .update(personalizedDeveloperAgents)
      .set({
        usageCount: (agent.usageCount || 0) + 1,
      })
      .where(eq(personalizedDeveloperAgents.id, id))
      .returning();

    return result;
  }

  /**
   * Search for personalized agents
   * @param userId User ID
   * @param searchTerm Search term
   * @param includedShared Whether to include shared agents
   * @returns List of matching agents
   */
  async searchAgents(
    userId: number,
    searchTerm: string,
    includeShared: boolean = true
  ): Promise<PersonalizedDeveloperAgent[]> {
    const query = db
      .select()
      .from(personalizedDeveloperAgents)
      .where(
        includeShared
          ? eq(personalizedDeveloperAgents.userId, userId)
          : and(
              eq(personalizedDeveloperAgents.userId, userId),
              eq(personalizedDeveloperAgents.isShared, true)
            )
      );

    // We'll implement a very basic search for now
    // For a real application, you might want to use a full-text search index
    if (searchTerm) {
      const result = await query;
      return result.filter(
        agent =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      return query;
    }
  }
}

export const personalizedAgentService = new PersonalizedAgentService();
