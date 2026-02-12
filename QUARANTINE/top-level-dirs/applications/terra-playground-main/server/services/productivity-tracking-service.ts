/**
 * Productivity Tracking Service
 *
 * Service for tracking and managing developer productivity metrics
 */

import { db } from '../db';
import {
  developerProductivityMetrics,
  developerActivitySessions,
  energyLevelRecommendations,
  DeveloperEnergyLevel,
  FocusLevel,
  ProductivityMetricType,
  DeveloperProductivityMetric,
  InsertDeveloperProductivityMetric,
  DeveloperActivitySession,
  InsertDeveloperActivitySession,
  EnergyLevelRecommendation,
  InsertEnergyLevelRecommendation,
} from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class ProductivityTrackingService {
  /**
   * Get productivity metrics for a user within a date range
   */
  async getProductivityMetrics(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<DeveloperProductivityMetric[]> {
    try {
      let query = db
        .select()
        .from(developerProductivityMetrics)
        .where(eq(developerProductivityMetrics.userId, userId));

      if (startDate) {
        query = query.where(gte(developerProductivityMetrics.date, startDate));
      }

      if (endDate) {
        query = query.where(lte(developerProductivityMetrics.date, endDate));
      }

      return await query.orderBy(desc(developerProductivityMetrics.date));
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error getting productivity metrics',
        error,
      });
      return [];
    }
  }

  /**
   * Get today's productivity metrics for a user or create if not exists
   */
  async getTodayProductivityMetric(userId: number): Promise<DeveloperProductivityMetric | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await db
        .select()
        .from(developerProductivityMetrics)
        .where(
          and(
            eq(developerProductivityMetrics.userId, userId),
            eq(developerProductivityMetrics.date, today)
          )
        );

      if (result.length > 0) {
        return result[0];
      }

      // Create an initial productivity metric for today
      const initialMetric: InsertDeveloperProductivityMetric = {
        userId,
        date: today,
        energyLevel: DeveloperEnergyLevel.MEDIUM,
        focusLevel: FocusLevel.MODERATE,
        productiveHours: 0,
        distractionCount: 0,
        completedTasks: 0,
        tasksInProgress: 0,
        blockedTasks: 0,
        codeLines: 0,
        commitCount: 0,
        notes: '',
        tags: [],
      };

      const newMetric = await db
        .insert(developerProductivityMetrics)
        .values(initialMetric)
        .returning();

      return newMetric[0];
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error getting or creating today productivity metric',
        error,
      });
      return null;
    }
  }

  /**
   * Update a productivity metric
   */
  async updateProductivityMetric(
    id: number,
    data: Partial<InsertDeveloperProductivityMetric>
  ): Promise<DeveloperProductivityMetric | null> {
    try {
      const updated = await db
        .update(developerProductivityMetrics)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(developerProductivityMetrics.id, id))
        .returning();

      return updated[0] || null;
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: `Error updating productivity metric with ID ${id}`,
        error,
      });
      return null;
    }
  }

  /**
   * Start a new activity session
   */
  async startActivitySession(
    data: InsertDeveloperActivitySession
  ): Promise<DeveloperActivitySession | null> {
    try {
      const session = await db.insert(developerActivitySessions).values(data).returning();

      return session[0];
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error starting activity session',
        error,
      });
      return null;
    }
  }

  /**
   * End an activity session
   */
  async endActivitySession(id: number): Promise<DeveloperActivitySession | null> {
    try {
      const now = new Date();
      const sessions = await db
        .select()
        .from(developerActivitySessions)
        .where(eq(developerActivitySessions.id, id));

      if (sessions.length === 0) {
        return null;
      }

      const session = sessions[0];
      const startTime = session.startTime;
      const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

      const updated = await db
        .update(developerActivitySessions)
        .set({
          endTime: now,
          duration: durationMinutes,
          isCompleted: true,
          updatedAt: now,
        })
        .where(eq(developerActivitySessions.id, id))
        .returning();

      // Update the daily productivity metric based on the activity type
      if (session.metricId) {
        // Update metrics based on activity type
        await this.updateMetricsBasedOnActivity(
          session.metricId,
          session.activityType,
          durationMinutes,
          session.codeLines || 0
        );
      }

      return updated[0];
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: `Error ending activity session with ID ${id}`,
        error,
      });
      return null;
    }
  }

  /**
   * Get recent activity sessions for a user
   */
  async getRecentActivitySessions(
    userId: number,
    limit: number = 10
  ): Promise<DeveloperActivitySession[]> {
    try {
      return await db
        .select()
        .from(developerActivitySessions)
        .where(eq(developerActivitySessions.userId, userId))
        .orderBy(desc(developerActivitySessions.startTime))
        .limit(limit);
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error getting recent activity sessions',
        error,
      });
      return [];
    }
  }

  /**
   * Get active (unfinished) sessions for a user
   */
  async getActiveActivitySessions(userId: number): Promise<DeveloperActivitySession[]> {
    try {
      return await db
        .select()
        .from(developerActivitySessions)
        .where(
          and(
            eq(developerActivitySessions.userId, userId),
            eq(developerActivitySessions.isCompleted, false)
          )
        )
        .orderBy(desc(developerActivitySessions.startTime));
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error getting active activity sessions',
        error,
      });
      return [];
    }
  }

  /**
   * Get energy level recommendations for a user
   */
  async getEnergyLevelRecommendations(
    userId: number,
    energyLevel: DeveloperEnergyLevel
  ): Promise<EnergyLevelRecommendation | null> {
    try {
      const recommendations = await db
        .select()
        .from(energyLevelRecommendations)
        .where(
          and(
            eq(energyLevelRecommendations.userId, userId),
            eq(energyLevelRecommendations.energyLevel, energyLevel)
          )
        );

      if (recommendations.length > 0) {
        return recommendations[0];
      }

      // Create default recommendations if none exist
      return await this.createDefaultRecommendation(userId, energyLevel);
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error getting energy level recommendations',
        error,
      });
      return null;
    }
  }

  /**
   * Get productivity statistics for a user
   */
  async getProductivityStatistics(userId: number, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const metrics = await this.getProductivityMetrics(userId, startDate);

      // Calculate averages
      let totalProductiveHours = 0;
      let totalTasks = 0;
      let totalDistraction = 0;
      let totalCodeLines = 0;

      metrics.forEach(metric => {
        totalProductiveHours += Number(metric.productiveHours);
        totalTasks += metric.completedTasks;
        totalDistraction += metric.distractionCount;
        totalCodeLines += metric.codeLines || 0;
      });

      const daysCount = metrics.length || 1;

      return {
        averageProductiveHours: totalProductiveHours / daysCount,
        averageTasksCompleted: totalTasks / daysCount,
        averageDistractions: totalDistraction / daysCount,
        averageCodeLines: totalCodeLines / daysCount,
        recentMetrics: metrics,
        totalDays: daysCount,
      };
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error calculating productivity statistics',
        error,
      });
      return {
        averageProductiveHours: 0,
        averageTasksCompleted: 0,
        averageDistractions: 0,
        averageCodeLines: 0,
        recentMetrics: [],
        totalDays: 0,
      };
    }
  }

  /**
   * Get productivity trend data for charts
   */
  async getProductivityTrendData(userId: number, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const metrics = await this.getProductivityMetrics(userId, startDate);

      const energyLevelCounts: Record<string, number> = {
        [DeveloperEnergyLevel.HIGH]: 0,
        [DeveloperEnergyLevel.MEDIUM]: 0,
        [DeveloperEnergyLevel.LOW]: 0,
      };

      const focusLevelCounts: Record<string, number> = {
        [FocusLevel.DEEP]: 0,
        [FocusLevel.MODERATE]: 0,
        [FocusLevel.SHALLOW]: 0,
        [FocusLevel.DISTRACTED]: 0,
      };

      const productiveHoursByDay: Array<{ date: string; hours: number }> = [];
      const tasksByDay: Array<{
        date: string;
        completed: number;
        inProgress: number;
        blocked: number;
      }> = [];

      metrics.forEach(metric => {
        // Count energy levels
        energyLevelCounts[metric.energyLevel] = (energyLevelCounts[metric.energyLevel] || 0) + 1;

        // Count focus levels
        focusLevelCounts[metric.focusLevel] = (focusLevelCounts[metric.focusLevel] || 0) + 1;

        // Format date as YYYY-MM-DD
        const dateStr = new Date(metric.date).toISOString().split('T')[0];

        // Productive hours by day
        productiveHoursByDay.push({
          date: dateStr,
          hours: Number(metric.productiveHours),
        });

        // Tasks by day
        tasksByDay.push({
          date: dateStr,
          completed: metric.completedTasks,
          inProgress: metric.tasksInProgress,
          blocked: metric.blockedTasks,
        });
      });

      return {
        energyLevelDistribution: energyLevelCounts,
        focusLevelDistribution: focusLevelCounts,
        productiveHoursTrend: productiveHoursByDay,
        tasksTrend: tasksByDay,
      };
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error generating productivity trend data',
        error,
      });
      return {
        energyLevelDistribution: {},
        focusLevelDistribution: {},
        productiveHoursTrend: [],
        tasksTrend: [],
      };
    }
  }

  /**
   * Create default energy level recommendation
   */
  private async createDefaultRecommendation(
    userId: number,
    energyLevel: DeveloperEnergyLevel
  ): Promise<EnergyLevelRecommendation | null> {
    try {
      // Create default recommendation based on energy level
      let recommendedActivities: string[] = [];
      let avoidActivities: string[] = [];
      let strategies: string[] = [];
      let bestTimeOfDay = '';

      switch (energyLevel) {
        case DeveloperEnergyLevel.HIGH:
          recommendedActivities = [
            ProductivityMetricType.FEATURE_IMPLEMENTATION,
            ProductivityMetricType.CODE_COMPLETION,
            ProductivityMetricType.TESTING,
          ];
          avoidActivities = [ProductivityMetricType.DOCUMENTATION, ProductivityMetricType.MEETING];
          strategies = [
            'Tackle complex problems',
            'Work on challenging features',
            'Deep code review sessions',
          ];
          bestTimeOfDay = 'morning';
          break;

        case DeveloperEnergyLevel.MEDIUM:
          recommendedActivities = [
            ProductivityMetricType.BUG_FIX,
            ProductivityMetricType.TESTING,
            ProductivityMetricType.CODE_REVIEW,
          ];
          avoidActivities = [ProductivityMetricType.PLANNING, ProductivityMetricType.MEETING];
          strategies = [
            'Focus on specific tasks',
            'Use Pomodoro technique',
            'Clear small bug fixes',
          ];
          bestTimeOfDay = 'afternoon';
          break;

        case DeveloperEnergyLevel.LOW:
          recommendedActivities = [
            ProductivityMetricType.DOCUMENTATION,
            ProductivityMetricType.PLANNING,
            ProductivityMetricType.OTHER,
          ];
          avoidActivities = [
            ProductivityMetricType.FEATURE_IMPLEMENTATION,
            ProductivityMetricType.CODE_COMPLETION,
          ];
          strategies = ['Handle simple tasks', 'Plan future work', 'Review and organize notes'];
          bestTimeOfDay = 'evening';
          break;
      }

      const recommendation: InsertEnergyLevelRecommendation = {
        userId,
        energyLevel,
        recommendedActivities,
        avoidActivities,
        bestTimeOfDay,
        strategies,
      };

      const created = await db
        .insert(energyLevelRecommendations)
        .values(recommendation)
        .returning();

      return created[0];
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error creating default energy level recommendation',
        error,
      });
      return null;
    }
  }

  /**
   * Update productivity metrics based on completed activity
   */
  private async updateMetricsBasedOnActivity(
    metricId: number,
    activityType: string,
    durationMinutes: number,
    codeLines: number
  ): Promise<void> {
    try {
      const metrics = await db
        .select()
        .from(developerProductivityMetrics)
        .where(eq(developerProductivityMetrics.id, metricId));

      if (metrics.length === 0) {
        return;
      }

      const metric = metrics[0];
      const productiveHours = Number(metric.productiveHours) + durationMinutes / 60;
      let completedTasks = metric.completedTasks;

      // Increment completed tasks for certain activity types
      if (
        [
          ProductivityMetricType.BUG_FIX,
          ProductivityMetricType.FEATURE_IMPLEMENTATION,
          ProductivityMetricType.CODE_COMPLETION,
        ].includes(activityType as ProductivityMetricType)
      ) {
        completedTasks += 1;
      }

      await db
        .update(developerProductivityMetrics)
        .set({
          productiveHours,
          completedTasks,
          codeLines: metric.codeLines + codeLines,
          updatedAt: new Date(),
        })
        .where(eq(developerProductivityMetrics.id, metricId));
    } catch (error) {
      logger.error({
        component: 'ProductivityTrackingService',
        message: 'Error updating metrics based on activity',
        error,
      });
    }
  }
}

export const productivityTrackingService = new ProductivityTrackingService();
