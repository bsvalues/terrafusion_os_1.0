/**
 * Voice Command Shortcut Service
 *
 * This service manages customizable voice command shortcuts. Shortcuts allow users
 * to create personalized short phrases that expand to more complex commands.
 */

import { db } from '../../db';
import {
  voiceCommandShortcuts,
  InsertVoiceCommandShortcut,
  VoiceCommandType,
} from '@shared/schema';
import { eq, and, desc, sql, asc } from 'drizzle-orm';

export class VoiceCommandShortcutService {
  /**
   * Create a new voice command shortcut
   */
  async createShortcut(shortcutData: InsertVoiceCommandShortcut): Promise<any> {
    try {
      // Check if shortcut already exists for this user
      const existingShortcut = await this.findShortcutByPhrase(
        shortcutData.userId,
        shortcutData.shortcutPhrase
      );

      if (existingShortcut) {
        throw new Error('A shortcut with this phrase already exists for this user');
      }

      // Insert the new shortcut
      const [result] = await db.insert(voiceCommandShortcuts).values(shortcutData).returning();

      return result;
    } catch (error) {
      console.error('Error creating voice command shortcut:', error);
      throw error;
    }
  }

  /**
   * Update an existing voice command shortcut
   */
  async updateShortcut(
    shortcutId: number,
    shortcutData: Partial<InsertVoiceCommandShortcut>
  ): Promise<any> {
    try {
      // If shortcut phrase is changed, check if new phrase already exists
      if (shortcutData.shortcutPhrase) {
        const shortcut = await this.getShortcutById(shortcutId);

        if (!shortcut) {
          throw new Error('Shortcut not found');
        }

        // Check if the new phrase already exists for this user (excluding this shortcut)
        const existingShortcut = await db
          .select()
          .from(voiceCommandShortcuts)
          .where(
            and(
              eq(voiceCommandShortcuts.userId, shortcut.userId),
              eq(voiceCommandShortcuts.shortcutPhrase, shortcutData.shortcutPhrase),
              sql`${voiceCommandShortcuts.id} != ${shortcutId}`
            )
          )
          .limit(1);

        if (existingShortcut.length > 0) {
          throw new Error('A shortcut with this phrase already exists for this user');
        }
      }

      // Update the shortcut
      const [result] = await db
        .update(voiceCommandShortcuts)
        .set(shortcutData)
        .where(eq(voiceCommandShortcuts.id, shortcutId))
        .returning();

      return result;
    } catch (error) {
      console.error('Error updating voice command shortcut:', error);
      throw error;
    }
  }

  /**
   * Delete a voice command shortcut
   */
  async deleteShortcut(shortcutId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(voiceCommandShortcuts)
        .where(eq(voiceCommandShortcuts.id, shortcutId));

      return true;
    } catch (error) {
      console.error('Error deleting voice command shortcut:', error);
      throw error;
    }
  }

  /**
   * Get a shortcut by ID
   */
  async getShortcutById(shortcutId: number): Promise<any> {
    try {
      const [shortcut] = await db
        .select()
        .from(voiceCommandShortcuts)
        .where(eq(voiceCommandShortcuts.id, shortcutId));

      return shortcut || null;
    } catch (error) {
      console.error('Error getting voice command shortcut:', error);
      throw error;
    }
  }

  /**
   * Get all shortcuts for a user
   */
  async getUserShortcuts(userId: number): Promise<any[]> {
    try {
      return await db
        .select()
        .from(voiceCommandShortcuts)
        .where(eq(voiceCommandShortcuts.userId, userId))
        .orderBy(desc(voiceCommandShortcuts.priority), asc(voiceCommandShortcuts.shortcutPhrase));
    } catch (error) {
      console.error('Error getting user shortcuts:', error);
      throw error;
    }
  }

  /**
   * Get global shortcuts (available to all users)
   */
  async getGlobalShortcuts(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(voiceCommandShortcuts)
        .where(eq(voiceCommandShortcuts.isGlobal, true))
        .orderBy(desc(voiceCommandShortcuts.priority), asc(voiceCommandShortcuts.shortcutPhrase));
    } catch (error) {
      console.error('Error getting global shortcuts:', error);
      throw error;
    }
  }

  /**
   * Get all shortcuts available to a user (personal + global)
   */
  async getAllAvailableShortcuts(userId: number): Promise<any[]> {
    try {
      return await db
        .select()
        .from(voiceCommandShortcuts)
        .where(
          sql`${voiceCommandShortcuts.userId} = ${userId} OR ${voiceCommandShortcuts.isGlobal} = true`
        )
        .orderBy(desc(voiceCommandShortcuts.priority), asc(voiceCommandShortcuts.shortcutPhrase));
    } catch (error) {
      console.error('Error getting available shortcuts:', error);
      throw error;
    }
  }

  /**
   * Find a shortcut by its phrase for a specific user
   */
  async findShortcutByPhrase(userId: number, phrase: string): Promise<any> {
    try {
      // First check user-specific shortcuts
      const [userShortcut] = await db
        .select()
        .from(voiceCommandShortcuts)
        .where(
          and(
            eq(voiceCommandShortcuts.userId, userId),
            eq(voiceCommandShortcuts.shortcutPhrase, phrase),
            eq(voiceCommandShortcuts.isEnabled, true)
          )
        )
        .orderBy(desc(voiceCommandShortcuts.priority))
        .limit(1);

      if (userShortcut) {
        // Update last used timestamp and usage count
        await db
          .update(voiceCommandShortcuts)
          .set({
            lastUsed: new Date(),
            usageCount: sql`${voiceCommandShortcuts.usageCount} + 1`,
          })
          .where(eq(voiceCommandShortcuts.id, userShortcut.id));

        return userShortcut;
      }

      // Then check global shortcuts
      const [globalShortcut] = await db
        .select()
        .from(voiceCommandShortcuts)
        .where(
          and(
            eq(voiceCommandShortcuts.isGlobal, true),
            eq(voiceCommandShortcuts.shortcutPhrase, phrase),
            eq(voiceCommandShortcuts.isEnabled, true)
          )
        )
        .orderBy(desc(voiceCommandShortcuts.priority))
        .limit(1);

      if (globalShortcut) {
        // Update last used timestamp and usage count
        await db
          .update(voiceCommandShortcuts)
          .set({
            lastUsed: new Date(),
            usageCount: sql`${voiceCommandShortcuts.usageCount} + 1`,
          })
          .where(eq(voiceCommandShortcuts.id, globalShortcut.id));

        return globalShortcut;
      }

      return null;
    } catch (error) {
      console.error('Error finding shortcut by phrase:', error);
      throw error;
    }
  }

  /**
   * Expand a command using shortcuts
   * This checks if the command contains any shortcuts and expands them
   */
  async expandCommand(userId: number, rawCommand: string): Promise<string> {
    try {
      // Get all available shortcuts for this user
      const shortcuts = await this.getAllAvailableShortcuts(userId);

      if (!shortcuts.length) {
        return rawCommand;
      }

      // Sort shortcuts by length (descending) to match longer phrases first
      shortcuts.sort((a, b) => b.shortcutPhrase.length - a.shortcutPhrase.length);

      let expandedCommand = rawCommand;

      // Check each shortcut and replace if found
      for (const shortcut of shortcuts) {
        if (!shortcut.isEnabled) continue;

        // Case insensitive regex match (but don't replace within words)
        const regex = new RegExp(`\\b${escapeRegExp(shortcut.shortcutPhrase)}\\b`, 'gi');
        if (regex.test(expandedCommand)) {
          expandedCommand = expandedCommand.replace(regex, shortcut.expandedCommand);

          // Update shortcut usage stats
          await db
            .update(voiceCommandShortcuts)
            .set({
              lastUsed: new Date(),
              usageCount: sql`${voiceCommandShortcuts.usageCount} + 1`,
            })
            .where(eq(voiceCommandShortcuts.id, shortcut.id));
        }
      }

      return expandedCommand;
    } catch (error) {
      console.error('Error expanding command:', error);
      return rawCommand; // Return original command if expansion fails
    }
  }

  /**
   * Get shortcut usage statistics for a user
   */
  async getShortcutUsageStats(userId: number): Promise<any> {
    try {
      const shortcuts = await this.getUserShortcuts(userId);

      // Calculate total usage count
      const totalUsage = shortcuts.reduce((total, shortcut) => total + shortcut.usageCount, 0);

      // Calculate usage by command type
      const usageByType: Record<string, number> = {};

      shortcuts.forEach(shortcut => {
        if (!usageByType[shortcut.commandType]) {
          usageByType[shortcut.commandType] = 0;
        }
        usageByType[shortcut.commandType] += shortcut.usageCount;
      });

      // Get most used shortcuts
      const mostUsed = [...shortcuts].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

      // Get recently used shortcuts
      const recentlyUsed = [...shortcuts]
        .filter(s => s.lastUsed)
        .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .slice(0, 5);

      // Get never used shortcuts
      const neverUsed = shortcuts.filter(s => s.usageCount === 0);

      return {
        totalShortcuts: shortcuts.length,
        totalUsage,
        usageByType,
        mostUsed,
        recentlyUsed,
        neverUsed: neverUsed.length,
      };
    } catch (error) {
      console.error('Error getting shortcut usage stats:', error);
      throw error;
    }
  }

  /**
   * Create default shortcuts for a new user
   */
  async createDefaultShortcutsForUser(userId: number): Promise<void> {
    try {
      const defaultShortcuts: InsertVoiceCommandShortcut[] = [
        {
          userId,
          shortcutPhrase: 'show props',
          expandedCommand: 'show me all properties in the system',
          commandType: VoiceCommandType.DATA_QUERY,
          description: 'Lists all available properties',
          priority: 10,
          isEnabled: true,
          isGlobal: false,
        },
        {
          userId,
          shortcutPhrase: 'goto dash',
          expandedCommand: 'navigate to dashboard',
          commandType: VoiceCommandType.NAVIGATION,
          description: 'Navigate to the main dashboard',
          priority: 10,
          isEnabled: true,
          isGlobal: false,
        },
        {
          userId,
          shortcutPhrase: 'new assessment',
          expandedCommand: 'create new property assessment',
          commandType: VoiceCommandType.PROPERTY_ASSESSMENT,
          description: 'Start a new property assessment',
          priority: 5,
          isEnabled: true,
          isGlobal: false,
        },
      ];

      // Create each default shortcut
      for (const shortcut of defaultShortcuts) {
        await this.createShortcut(shortcut);
      }
    } catch (error) {
      console.error('Error creating default shortcuts:', error);
      throw error;
    }
  }
}

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Export singleton instance
export const voiceCommandShortcutService = new VoiceCommandShortcutService();
