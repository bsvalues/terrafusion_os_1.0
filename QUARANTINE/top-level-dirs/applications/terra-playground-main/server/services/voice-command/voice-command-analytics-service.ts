/**
 * Voice Command Analytics Service
 *
 * This service collects, processes, and provides analytics data for voice commands.
 * It tracks usage patterns, success rates, and other metrics to help improve the
 * voice command experience.
 */

import { db } from '../../db';
import {
  voiceCommandLogs,
  voiceCommandAnalytics,
  voiceCommandShortcuts,
  VoiceCommandStatus,
  VoiceCommandType,
  InsertVoiceCommandLog,
  InsertVoiceCommandAnalytic,
} from '@shared/schema';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';

export class VoiceCommandAnalyticsService {
  /**
   * Logs a voice command for analytics tracking
   */
  async logVoiceCommand(logData: InsertVoiceCommandLog): Promise<number> {
    const startTime = Date.now();

    try {
      // Insert the log entry
      const [result] = await db
        .insert(voiceCommandLogs)
        .values(logData)
        .returning({ id: voiceCommandLogs.id });

      // Update daily analytics asynchronously
      this.updateDailyAnalytics(logData.userId).catch(err => {
        console.error('Error updating daily analytics:', err);
      });

      return result.id;
    } catch (error) {
      console.error('Error logging voice command:', error);
      throw error;
    }
  }

  /**
   * Updates the daily analytics for a user or global stats
   */
  private async updateDailyAnalytics(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Format the date for SQL comparison (ISO format)
      const todayIso = today.toISOString();

      // Get today's logs for this user
      const logs = await db
        .select()
        .from(voiceCommandLogs)
        .where(
          and(
            eq(voiceCommandLogs.userId, userId),
            sql`${voiceCommandLogs.timestamp}::date = ${todayIso}::date`
          )
        );

      // Calculate analytics
      const totalCommands = logs.length;
      const successfulCommands = logs.filter(
        log => log.status === VoiceCommandStatus.SUCCESS
      ).length;
      const failedCommands = logs.filter(log => log.status === VoiceCommandStatus.FAILED).length;
      const ambiguousCommands = logs.filter(
        log => log.status === VoiceCommandStatus.AMBIGUOUS
      ).length;

      // Calculate average response time
      const responseTimes = logs
        .map(log => log.responseTime)
        .filter(time => time !== null && time !== undefined) as number[];

      const avgResponseTime = responseTimes.length
        ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : null;

      // Calculate average confidence score
      const confidenceScores = logs
        .map(log => log.confidenceScore)
        .filter(score => score !== null && score !== undefined) as number[];

      const avgConfidenceScore = confidenceScores.length
        ? Number(
            (
              confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
            ).toFixed(2)
          )
        : null;

      // Generate command type counts
      const commandTypeCounts = this.calculateCommandTypeCounts(logs);

      // Generate top commands
      const topCommands = this.calculateTopCommands(logs);

      // Generate top error triggers
      const topErrorTriggers = this.calculateTopErrorTriggers(logs);

      // Convert today's date to ISO format string for database
      const todayStr = today.toISOString().split('T')[0];

      // Check if analytics record exists for today
      const [existingRecord] = await db
        .select()
        .from(voiceCommandAnalytics)
        .where(
          and(
            eq(voiceCommandAnalytics.userId, userId),
            sql`${voiceCommandAnalytics.date}::text = ${todayStr}`
          )
        );

      const analyticsData: InsertVoiceCommandAnalytic = {
        date: todayStr as any, // Type coercion to work with Drizzle's date type
        userId,
        totalCommands,
        successfulCommands,
        failedCommands,
        ambiguousCommands,
        avgResponseTime,
        commandTypeCounts,
        topCommands,
        topErrorTriggers,
        avgConfidenceScore,
      };

      if (existingRecord) {
        // Update existing record
        await db
          .update(voiceCommandAnalytics)
          .set(analyticsData)
          .where(eq(voiceCommandAnalytics.id, existingRecord.id));
      } else {
        // Insert new record
        await db.insert(voiceCommandAnalytics).values(analyticsData);
      }
    } catch (error) {
      console.error('Error updating daily analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate counts by command type
   */
  private calculateCommandTypeCounts(logs: any[]): Record<string, number> {
    const counts: Record<string, number> = {};

    // Initialize with all command types
    Object.values(VoiceCommandType).forEach(type => {
      counts[type] = 0;
    });

    // Count occurrences
    logs.forEach(log => {
      if (log.commandType && counts[log.commandType] !== undefined) {
        counts[log.commandType]++;
      }
    });

    return counts;
  }

  /**
   * Calculate top used commands
   */
  private calculateTopCommands(logs: any[]): Array<{ command: string; count: number }> {
    const commandCounts: Record<string, number> = {};

    logs.forEach(log => {
      const cmd = log.rawCommand;
      if (cmd) {
        commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    return Object.entries(commandCounts)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }

  /**
   * Calculate top error-triggering commands
   */
  private calculateTopErrorTriggers(logs: any[]): Array<{ command: string; count: number }> {
    const errorCommands: Record<string, number> = {};

    logs.forEach(log => {
      if (log.status === VoiceCommandStatus.FAILED) {
        const cmd = log.rawCommand;
        if (cmd) {
          errorCommands[cmd] = (errorCommands[cmd] || 0) + 1;
        }
      }
    });

    // Convert to array and sort by count
    return Object.entries(errorCommands)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }

  /**
   * Get voice command analytics for a specific user or global
   */
  async getUserAnalytics(userId: number, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get analytics records for the date range
      const analytics = await db
        .select()
        .from(voiceCommandAnalytics)
        .where(
          and(
            eq(voiceCommandAnalytics.userId, userId),
            gte(voiceCommandAnalytics.date, dateRange.start),
            lte(voiceCommandAnalytics.date, dateRange.end)
          )
        )
        .orderBy(voiceCommandAnalytics.date);

      // Aggregate data for the entire period
      const aggregatedData = this.aggregateAnalyticsData(analytics);

      return {
        dailyData: analytics,
        aggregatedData,
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Get global voice command analytics
   */
  async getGlobalAnalytics(dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get global analytics (where userId is null)
      const analytics = await db
        .select()
        .from(voiceCommandAnalytics)
        .where(
          and(
            sql`${voiceCommandAnalytics.userId} IS NULL`,
            gte(voiceCommandAnalytics.date, dateRange.start),
            lte(voiceCommandAnalytics.date, dateRange.end)
          )
        )
        .orderBy(voiceCommandAnalytics.date);

      // Aggregate data for the entire period
      const aggregatedData = this.aggregateAnalyticsData(analytics);

      return {
        dailyData: analytics,
        aggregatedData,
      };
    } catch (error) {
      console.error('Error getting global analytics:', error);
      throw error;
    }
  }

  /**
   * Aggregate multiple days of analytics data
   */
  private aggregateAnalyticsData(analyticsRecords: any[]): any {
    if (!analyticsRecords.length) {
      return null;
    }

    // Initialize aggregated data
    const aggregated = {
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      ambiguousCommands: 0,
      avgResponseTime: 0,
      commandTypeCounts: {} as Record<string, number>,
      topCommands: [] as Array<{ command: string; count: number }>,
      topErrorTriggers: [] as Array<{ command: string; count: number }>,
      avgConfidenceScore: 0,
      successRate: 0,
      period: {
        start: analyticsRecords[0].date,
        end: analyticsRecords[analyticsRecords.length - 1].date,
      },
    };

    // Sum up numeric metrics
    analyticsRecords.forEach(record => {
      aggregated.totalCommands += record.totalCommands;
      aggregated.successfulCommands += record.successfulCommands;
      aggregated.failedCommands += record.failedCommands;
      aggregated.ambiguousCommands += record.ambiguousCommands;

      // Merge command type counts
      if (record.commandTypeCounts) {
        Object.entries(record.commandTypeCounts).forEach(([type, count]) => {
          aggregated.commandTypeCounts[type] =
            (aggregated.commandTypeCounts[type] || 0) + (count as number);
        });
      }

      // Collect all top commands and error triggers for re-aggregation
      if (record.topCommands) {
        aggregated.topCommands = aggregated.topCommands.concat(record.topCommands);
      }

      if (record.topErrorTriggers) {
        aggregated.topErrorTriggers = aggregated.topErrorTriggers.concat(record.topErrorTriggers);
      }
    });

    // Re-aggregate top commands
    const commandCounts: Record<string, number> = {};
    aggregated.topCommands.forEach(item => {
      commandCounts[item.command] = (commandCounts[item.command] || 0) + item.count;
    });

    aggregated.topCommands = Object.entries(commandCounts)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Re-aggregate top error triggers
    const errorCounts: Record<string, number> = {};
    aggregated.topErrorTriggers.forEach(item => {
      errorCounts[item.command] = (errorCounts[item.command] || 0) + item.count;
    });

    aggregated.topErrorTriggers = Object.entries(errorCounts)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average response time
    const responseTimes = analyticsRecords
      .filter(record => record.avgResponseTime !== null)
      .map(record => record.avgResponseTime);

    if (responseTimes.length) {
      aggregated.avgResponseTime = Math.round(
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      );
    }

    // Calculate average confidence score
    const confidenceScores = analyticsRecords
      .filter(record => record.avgConfidenceScore !== null)
      .map(record => record.avgConfidenceScore);

    if (confidenceScores.length) {
      aggregated.avgConfidenceScore = Number(
        (confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length).toFixed(
          2
        )
      );
    }

    // Calculate success rate
    if (aggregated.totalCommands > 0) {
      aggregated.successRate = Number(
        ((aggregated.successfulCommands / aggregated.totalCommands) * 100).toFixed(1)
      );
    }

    return aggregated;
  }

  /**
   * Get recent voice command logs for a user
   */
  async getRecentLogs(userId: number, limit: number = 100): Promise<any[]> {
    try {
      return await db
        .select()
        .from(voiceCommandLogs)
        .where(eq(voiceCommandLogs.userId, userId))
        .orderBy(desc(voiceCommandLogs.timestamp))
        .limit(limit);
    } catch (error) {
      console.error('Error getting recent logs:', error);
      throw error;
    }
  }

  /**
   * Generate a full analytics report for a specific time period
   */
  async generateAnalyticsReport(dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get all logs for the date range
      const logs = await db
        .select()
        .from(voiceCommandLogs)
        .where(
          and(
            gte(voiceCommandLogs.timestamp, dateRange.start),
            lte(voiceCommandLogs.timestamp, dateRange.end)
          )
        );

      // Get unique users
      const uniqueUsers = new Set(logs.map(log => log.userId)).size;

      // Calculate overall stats
      const totalCommands = logs.length;
      const successfulCommands = logs.filter(
        log => log.status === VoiceCommandStatus.SUCCESS
      ).length;
      const failedCommands = logs.filter(log => log.status === VoiceCommandStatus.FAILED).length;
      const ambiguousCommands = logs.filter(
        log => log.status === VoiceCommandStatus.AMBIGUOUS
      ).length;

      // Calculate success rate
      const successRate =
        totalCommands > 0 ? Number(((successfulCommands / totalCommands) * 100).toFixed(1)) : 0;

      // Calculate command type distribution
      const commandTypeDistribution = this.calculateCommandTypeCounts(logs);

      // Calculate most active users
      const userCommandCounts: Record<number, number> = {};
      logs.forEach(log => {
        userCommandCounts[log.userId] = (userCommandCounts[log.userId] || 0) + 1;
      });

      const mostActiveUsers = Object.entries(userCommandCounts)
        .map(([userId, count]) => ({ userId: parseInt(userId), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate daily usage trends
      const dailyTrends = await this.calculateDailyTrends(dateRange);

      return {
        period: {
          start: dateRange.start,
          end: dateRange.end,
        },
        summary: {
          totalCommands,
          successfulCommands,
          failedCommands,
          ambiguousCommands,
          successRate,
          uniqueUsers,
        },
        commandTypeDistribution,
        mostActiveUsers,
        dailyTrends,
        topCommands: this.calculateTopCommands(logs),
        topErrorTriggers: this.calculateTopErrorTriggers(logs),
      };
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  /**
   * Calculate daily usage trends for a date range
   */
  private async calculateDailyTrends(dateRange: { start: Date; end: Date }): Promise<any[]> {
    // Get daily counts from analytics table
    const dailyData = await db
      .select({
        date: voiceCommandAnalytics.date,
        totalCommands: sql<number>`SUM(${voiceCommandAnalytics.totalCommands})`,
        successfulCommands: sql<number>`SUM(${voiceCommandAnalytics.successfulCommands})`,
        failedCommands: sql<number>`SUM(${voiceCommandAnalytics.failedCommands})`,
      })
      .from(voiceCommandAnalytics)
      .where(
        and(
          gte(voiceCommandAnalytics.date, dateRange.start),
          lte(voiceCommandAnalytics.date, dateRange.end)
        )
      )
      .groupBy(voiceCommandAnalytics.date)
      .orderBy(voiceCommandAnalytics.date);

    return dailyData.map(day => ({
      date: day.date,
      totalCommands: day.totalCommands,
      successfulCommands: day.successfulCommands,
      failedCommands: day.failedCommands,
      successRate:
        day.totalCommands > 0
          ? Number(((day.successfulCommands / day.totalCommands) * 100).toFixed(1))
          : 0,
    }));
  }
}

// Export singleton instance
export const voiceCommandAnalyticsService = new VoiceCommandAnalyticsService();
