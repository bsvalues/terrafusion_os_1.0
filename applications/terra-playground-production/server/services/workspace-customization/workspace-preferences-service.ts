import { db } from '../../db';
import { eq } from 'drizzle-orm';
import {
  WorkspacePreference,
  InsertWorkspacePreference,
  workspacePreferences,
} from '@shared/schema';

/**
 * Service for managing user workspace preferences
 */
export class WorkspacePreferencesService {
  /**
   * Get workspace preferences for a user
   * @param userId The user's ID
   * @returns The user's workspace preferences or null if not found
   */
  async getUserPreferences(userId: number): Promise<WorkspacePreference | null> {
    const results = await db
      .select()
      .from(workspacePreferences)
      .where(eq(workspacePreferences.userId, userId))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create workspace preferences for a user
   * @param preferences The workspace preferences to create
   * @returns The created workspace preferences
   */
  async createPreferences(preferences: InsertWorkspacePreference): Promise<WorkspacePreference> {
    const [result] = await db.insert(workspacePreferences).values(preferences).returning();

    return result;
  }

  /**
   * Update workspace preferences for a user
   * @param userId The user's ID
   * @param preferences The workspace preferences to update
   * @returns The updated workspace preferences
   */
  async updatePreferences(
    userId: number,
    preferences: Partial<InsertWorkspacePreference>
  ): Promise<WorkspacePreference | null> {
    const [result] = await db
      .update(workspacePreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(workspacePreferences.userId, userId))
      .returning();

    return result || null;
  }

  /**
   * Get or create workspace preferences for a user
   * @param userId The user's ID
   * @returns The user's workspace preferences
   */
  async getOrCreatePreferences(userId: number): Promise<WorkspacePreference> {
    const existing = await this.getUserPreferences(userId);

    if (existing) {
      return existing;
    }

    // Create default preferences
    return this.createPreferences({
      userId,
      // Default values are already set in the schema
    });
  }

  /**
   * Reset workspace preferences to defaults for a user
   * @param userId The user's ID
   * @returns The reset workspace preferences
   */
  async resetToDefaults(userId: number): Promise<WorkspacePreference> {
    const existing = await this.getUserPreferences(userId);

    if (existing) {
      await db.delete(workspacePreferences).where(eq(workspacePreferences.userId, userId));
    }

    // Create with defaults
    return this.createPreferences({
      userId,
      // Default values are already set in the schema
    });
  }
}

export const workspacePreferencesService = new WorkspacePreferencesService();
