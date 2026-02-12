/**
 * Enhanced Voice Command Service
 *
 * This service provides enhanced features for voice commands:
 * - Analytics and usage statistics
 * - Shortcut management
 * - Command suggestions and corrections
 * - Contextual help
 */

import { DateRange } from 'react-day-picker';
import { apiRequest } from '@/lib/queryClient';

// Interfaces =================================================================

/**
 * Voice Command Shortcut
 */
export interface VoiceCommandShortcut {
  id: number;
  userId: number;
  shortcutPhrase: string;
  expandedCommand: string;
  commandType: string;
  description: string | null;
  priority: number;
  isEnabled: boolean;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Voice Command Shortcut
 */
export interface CreateVoiceCommandShortcut {
  userId: number;
  shortcutPhrase: string;
  expandedCommand: string;
  commandType: string;
  description?: string;
  priority: number;
  isEnabled: boolean;
  isGlobal: boolean;
}

/**
 * Voice Command Help Content
 */
export interface VoiceCommandHelpContent {
  id: number;
  contextId: string;
  title: string;
  description: string;
  commandType: string;
  examplePhrases: string[];
  parameters: Record<string, string>;
  responseExample: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Command Type Distribution
 */
export interface CommandTypeDistribution {
  commandType: string;
  count: number;
  percentage: number;
}

/**
 * Daily Voice Command Stats
 */
export interface DailyVoiceCommandStats {
  date: string;
  commandCount: number;
  successCount: number;
  errorCount: number;
  successRate: number;
}

/**
 * Common Error
 */
export interface CommonError {
  error: string;
  count: number;
  percentage: number;
}

/**
 * Most Used Command
 */
export interface MostUsedCommand {
  commandText: string;
  count: number;
  successRate: number;
}

/**
 * Voice Command Analytics Summary
 */
export interface VoiceCommandAnalyticsSummary {
  totalCommands: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  averageResponseTime: number;
  mostUsedCommands: MostUsedCommand[];
}

/**
 * Voice Command Analytics Details
 */
export interface VoiceCommandAnalyticsDetails {
  summary: VoiceCommandAnalyticsSummary;
  dailyStats: DailyVoiceCommandStats[];
  commandTypeDistribution: CommandTypeDistribution[];
  commonErrors: CommonError[];
}

// Shortcut functions =========================================================

/**
 * Get user shortcuts
 */
export async function getUserShortcuts(userId: number): Promise<VoiceCommandShortcut[]> {
  const response = await apiRequest('GET', `/api/voice-command/shortcuts?userId=${userId}`);
  return await response.json();
}

/**
 * Create a new shortcut
 */
export async function createShortcut(
  shortcut: CreateVoiceCommandShortcut
): Promise<VoiceCommandShortcut> {
  const response = await apiRequest('POST', '/api/voice-command/shortcuts', shortcut);
  return await response.json();
}

/**
 * Update an existing shortcut
 */
export async function updateShortcut(
  id: number,
  shortcut: Partial<CreateVoiceCommandShortcut>
): Promise<VoiceCommandShortcut> {
  const response = await apiRequest('PATCH', `/api/voice-command/shortcuts/${id}`, shortcut);
  return await response.json();
}

/**
 * Delete a shortcut
 */
export async function deleteShortcut(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/voice-command/shortcuts/${id}`);
}

/**
 * Create default shortcuts for a user
 */
export async function createDefaultShortcuts(userId: number): Promise<VoiceCommandShortcut[]> {
  const response = await apiRequest(
    'POST',
    `/api/voice-command/shortcuts/defaults?userId=${userId}`
  );
  return await response.json();
}

/**
 * Expand shortcuts in a command
 */
export async function expandShortcuts(command: string, userId: number): Promise<string> {
  const response = await apiRequest('POST', '/api/voice-command/shortcuts/expand', {
    command,
    userId,
  });
  const result = await response.json();
  return result.expandedCommand;
}

// Analytics functions ========================================================

/**
 * Get voice command analytics
 */
export async function getVoiceCommandAnalytics(
  userId: number,
  dateRange?: DateRange
): Promise<VoiceCommandAnalyticsDetails> {
  let url = `/api/voice-command/analytics?userId=${userId}`;

  if (dateRange?.from) {
    url += `&from=${dateRange.from.toISOString()}`;
  }

  if (dateRange?.to) {
    url += `&to=${dateRange.to.toISOString()}`;
  }

  const response = await apiRequest('GET', url);
  return await response.json();
}

/**
 * Get voice command statistics
 */
export async function getVoiceCommandStats(userId: number): Promise<VoiceCommandAnalyticsSummary> {
  const response = await apiRequest('GET', `/api/voice-command/analytics/stats?userId=${userId}`);
  return await response.json();
}

// Help functions =============================================================

/**
 * Get contextual help
 */
export async function getContextualHelp(contextId: string): Promise<VoiceCommandHelpContent[]> {
  const response = await apiRequest('GET', `/api/voice-command/help?contextId=${contextId}`);
  return await response.json();
}

/**
 * Get suggested help based on query
 */
export async function getSuggestedHelp(
  query: string,
  contextId: string
): Promise<VoiceCommandHelpContent[]> {
  const response = await apiRequest('POST', '/api/voice-command/help/suggest', {
    query,
    contextId,
  });
  return await response.json();
}

// Correction and suggestion functions ========================================

/**
 * Get command corrections
 */
export async function getCommandCorrections(command: string, contextId: string): Promise<string[]> {
  const response = await apiRequest('POST', '/api/voice-command/corrections', {
    command,
    contextId,
  });
  const result = await response.json();
  return result.corrections;
}
