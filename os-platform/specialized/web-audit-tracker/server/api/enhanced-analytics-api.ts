import type { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { subDays, subMonths, subWeeks, startOfDay, endOfDay, format } from 'date-fns';

// Enhanced analytics API with time-series data, exportable reports, and advanced metrics
export function registerEnhancedAnalyticsAPI(app: Express, ensureAuthenticated: any) {
  // Get historical analytics data for charts
  app.get('/api/analytics/historical', ensureAuthenticated, async (req, res) => {
    try {
      const { period = '30d', granularity = 'day' } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = subDays(endDate, 7);
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          break;
        case '90d':
          startDate = subDays(endDate, 90);
          break;
        case '1y':
          startDate = subDays(endDate, 365);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      // Get all audits in the date range
      const audits = await storage.getAudits();
      const filteredAudits = audits.filter(
        audit => audit.submittedAt >= startDate && audit.submittedAt <= endDate
      );

      // Group data by time period
      const timeSeriesData = generateTimeSeriesData(
        filteredAudits,
        startDate,
        endDate,
        granularity as string
      );

      res.json({
        period,
        granularity,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data: timeSeriesData,
      });
    } catch (error) {
      console.error('Error fetching historical analytics:', error);
      res.status(500).json({ error: 'Failed to fetch historical analytics' });
    }
  });

  // Get performance metrics over time
  app.get('/api/analytics/performance', ensureAuthenticated, async (req, res) => {
    try {
      const { period = '30d', metric = 'all' } = req.query;

      const endDate = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = subDays(endDate, 7);
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          break;
        case '90d':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      const audits = await storage.getAudits();
      const auditEvents = await storage.getRecentAuditEvents(1000); // Get more events for analysis

      const performanceMetrics = calculatePerformanceMetrics(
        audits,
        auditEvents,
        startDate,
        endDate
      );

      res.json({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metrics: performanceMetrics,
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  // Get user performance analytics
  app.get('/api/analytics/users', ensureAuthenticated, async (req, res) => {
    try {
      const { period = '30d' } = req.query;

      const endDate = new Date();
      const startDate = subDays(endDate, period === '7d' ? 7 : period === '90d' ? 90 : 30);

      const audits = await storage.getAudits();
      const auditEvents = await storage.getRecentAuditEvents(1000);

      const userMetrics = calculateUserMetrics(audits, auditEvents, startDate, endDate);

      res.json({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        users: userMetrics,
      });
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      res.status(500).json({ error: 'Failed to fetch user analytics' });
    }
  });

  // Generate and export reports
  app.post('/api/analytics/reports/generate', ensureAuthenticated, async (req, res) => {
    try {
      const reportSchema = z.object({
        type: z.enum(['pdf', 'excel', 'csv', 'json']),
        template: z.string().optional(),
        dateRange: z.object({
          startDate: z.string(),
          endDate: z.string(),
        }),
        filters: z.record(z.any()).optional(),
        sections: z.array(z.string()).optional(),
      });

      const result = reportSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ error: 'Invalid report configuration', details: result.error });
      }

      const {
        type,
        dateRange,
        filters = {},
        sections = ['summary', 'charts', 'tables'],
      } = result.data;

      // Get data for the report
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      const audits = await storage.getAudits();
      const filteredAudits = audits.filter(
        audit => audit.submittedAt >= startDate && audit.submittedAt <= endDate
      );

      const auditEvents = await storage.getRecentAuditEvents(1000);

      // Generate report data
      const reportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: req.user!.username,
          dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          filters,
          type,
        },
        summary: generateSummaryData(filteredAudits),
        charts: generateChartData(filteredAudits, startDate, endDate),
        tables: generateTableData(filteredAudits, auditEvents),
        performance: calculatePerformanceMetrics(filteredAudits, auditEvents, startDate, endDate),
      };

      // For now, return the data as JSON. In a full implementation,
      // you would generate actual PDF/Excel files here
      if (type === 'json') {
        res.json(reportData);
      } else {
        // Placeholder for file generation
        res.json({
          message: `${type.toUpperCase()} report generation initiated`,
          reportId: `report_${Date.now()}`,
          downloadUrl: `/api/reports/download/report_${Date.now()}.${type}`,
          data: reportData,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  // Get audit trends and forecasting
  app.get('/api/analytics/trends', ensureAuthenticated, async (req, res) => {
    try {
      const { metric = 'volume', period = '30d' } = req.query;

      const endDate = new Date();
      const startDate = subDays(endDate, period === '7d' ? 7 : period === '90d' ? 90 : 30);

      const audits = await storage.getAudits();
      const filteredAudits = audits.filter(
        audit => audit.submittedAt >= startDate && audit.submittedAt <= endDate
      );

      const trendData = calculateTrends(filteredAudits, metric as string, startDate, endDate);

      res.json({
        metric,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        trends: trendData,
      });
    } catch (error) {
      console.error('Error calculating trends:', error);
      res.status(500).json({ error: 'Failed to calculate trends' });
    }
  });

  // Get real-time analytics dashboard data
  app.get('/api/analytics/realtime', ensureAuthenticated, async (req, res) => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const yesterdayStart = startOfDay(subDays(now, 1));

      const audits = await storage.getAudits();
      const recentEvents = await storage.getRecentAuditEvents(50);

      const todayAudits = audits.filter(audit => audit.submittedAt >= todayStart);
      const yesterdayAudits = audits.filter(
        audit => audit.submittedAt >= yesterdayStart && audit.submittedAt < todayStart
      );

      const realTimeData = {
        currentStats: {
          totalAudits: audits.length,
          todayAudits: todayAudits.length,
          yesterdayAudits: yesterdayAudits.length,
          pendingAudits: audits.filter(a => a.status === 'pending').length,
          inProgressAudits: audits.filter(a => a.status === 'in_progress').length,
          completedToday: todayAudits.filter(
            a => a.status === 'approved' || a.status === 'rejected'
          ).length,
        },
        recentActivity: recentEvents.slice(0, 10).map(event => ({
          id: event.id,
          type: event.eventType,
          auditId: event.auditId,
          timestamp: event.timestamp,
          comment: event.comment,
        })),
        trends: {
          todayVsYesterday: {
            audits: (
              ((todayAudits.length - yesterdayAudits.length) /
                Math.max(yesterdayAudits.length, 1)) *
              100
            ).toFixed(1),
            completions: calculateCompletionTrend(todayAudits, yesterdayAudits),
          },
        },
        activeUsers: calculateActiveUsers(recentEvents, now),
      };

      res.json(realTimeData);
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      res.status(500).json({ error: 'Failed to fetch real-time analytics' });
    }
  });
}

// Helper functions
function generateTimeSeriesData(
  audits: any[],
  startDate: Date,
  endDate: Date,
  granularity: string
) {
  const data = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const nextPeriod = new Date(current);

    if (granularity === 'day') {
      nextPeriod.setDate(nextPeriod.getDate() + 1);
    } else if (granularity === 'week') {
      nextPeriod.setDate(nextPeriod.getDate() + 7);
    } else if (granularity === 'month') {
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);
    }

    const periodAudits = audits.filter(
      audit => audit.submittedAt >= current && audit.submittedAt < nextPeriod
    );

    data.push({
      date: format(current, 'yyyy-MM-dd'),
      total: periodAudits.length,
      pending: periodAudits.filter(a => a.status === 'pending').length,
      approved: periodAudits.filter(a => a.status === 'approved').length,
      rejected: periodAudits.filter(a => a.status === 'rejected').length,
      inProgress: periodAudits.filter(a => a.status === 'in_progress').length,
      needsInfo: periodAudits.filter(a => a.status === 'needs_info').length,
    });

    current.setTime(nextPeriod.getTime());
  }

  return data;
}

function calculatePerformanceMetrics(audits: any[], events: any[], startDate: Date, endDate: Date) {
  const filteredAudits = audits.filter(
    audit => audit.submittedAt >= startDate && audit.submittedAt <= endDate
  );

  const completedAudits = filteredAudits.filter(
    a => a.status === 'approved' || a.status === 'rejected'
  );

  // Calculate average processing time
  const processingTimes = completedAudits.map(audit => {
    const submittedAt = new Date(audit.submittedAt);
    const updatedAt = new Date(audit.updatedAt || audit.submittedAt);
    return (updatedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60); // in hours
  });

  const avgProcessingTime =
    processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

  return {
    totalAudits: filteredAudits.length,
    completedAudits: completedAudits.length,
    completionRate:
      filteredAudits.length > 0 ? (completedAudits.length / filteredAudits.length) * 100 : 0,
    approvalRate:
      completedAudits.length > 0
        ? (filteredAudits.filter(a => a.status === 'approved').length / completedAudits.length) *
          100
        : 0,
    avgProcessingTime: avgProcessingTime.toFixed(2),
    throughput:
      completedAudits.length /
      Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), // audits per day
    qualityScore: calculateQualityScore(filteredAudits, events),
  };
}

function calculateUserMetrics(audits: any[], events: any[], startDate: Date, endDate: Date) {
  const userStats = new Map();

  // Process audit assignments
  audits.forEach(audit => {
    if (audit.assignedToId && audit.submittedAt >= startDate && audit.submittedAt <= endDate) {
      const userId = audit.assignedToId;
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          userId,
          auditsAssigned: 0,
          auditsCompleted: 0,
          avgProcessingTime: 0,
          approvalRate: 0,
          activityScore: 0,
        });
      }

      const stats = userStats.get(userId);
      stats.auditsAssigned++;

      if (audit.status === 'approved' || audit.status === 'rejected') {
        stats.auditsCompleted++;
      }
    }
  });

  // Process events for activity scoring
  events.forEach(event => {
    if (event.timestamp >= startDate && event.timestamp <= endDate && event.userId) {
      const userId = event.userId;
      if (userStats.has(userId)) {
        const stats = userStats.get(userId);
        stats.activityScore += getEventScore(event.eventType);
      }
    }
  });

  return Array.from(userStats.values());
}

function calculateTrends(audits: any[], metric: string, startDate: Date, endDate: Date) {
  // Simple trend calculation - can be enhanced with statistical methods
  const data = generateTimeSeriesData(audits, startDate, endDate, 'day');

  if (data.length < 2) return { trend: 'stable', change: 0, forecast: [] };

  const values = data.map(d => d.total);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  return {
    trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
    change: change.toFixed(1),
    forecast: generateSimpleForecast(values, 7), // 7-day forecast
  };
}

function generateSummaryData(audits: any[]) {
  return {
    totalAudits: audits.length,
    statusBreakdown: {
      pending: audits.filter(a => a.status === 'pending').length,
      inProgress: audits.filter(a => a.status === 'in_progress').length,
      approved: audits.filter(a => a.status === 'approved').length,
      rejected: audits.filter(a => a.status === 'rejected').length,
      needsInfo: audits.filter(a => a.status === 'needs_info').length,
    },
    priorityBreakdown: {
      urgent: audits.filter(a => a.priority === 'urgent').length,
      high: audits.filter(a => a.priority === 'high').length,
      normal: audits.filter(a => a.priority === 'normal').length,
      low: audits.filter(a => a.priority === 'low').length,
    },
  };
}

function generateChartData(audits: any[], startDate: Date, endDate: Date) {
  return {
    timeSeries: generateTimeSeriesData(audits, startDate, endDate, 'day'),
    statusDistribution: generateSummaryData(audits).statusBreakdown,
    priorityDistribution: generateSummaryData(audits).priorityBreakdown,
  };
}

function generateTableData(audits: any[], events: any[]) {
  return {
    recentAudits: audits.slice(0, 50).map(audit => ({
      id: audit.id,
      auditNumber: audit.auditNumber,
      status: audit.status,
      priority: audit.priority,
      submittedAt: audit.submittedAt,
      assignedTo: audit.assignedToId,
    })),
    recentEvents: events.slice(0, 50).map(event => ({
      id: event.id,
      auditId: event.auditId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      userId: event.userId,
    })),
  };
}

function calculateQualityScore(audits: any[], events: any[]) {
  // Simple quality score calculation based on approval rate and revision frequency
  const completedAudits = audits.filter(a => a.status === 'approved' || a.status === 'rejected');
  const approvedAudits = audits.filter(a => a.status === 'approved');

  if (completedAudits.length === 0) return 0;

  const approvalRate = approvedAudits.length / completedAudits.length;
  const revisionEvents = events.filter(e => e.eventType === 'requested_info').length;
  const revisionRate = revisionEvents / Math.max(1, completedAudits.length);

  return Math.max(0, approvalRate * 100 - revisionRate * 20);
}

function getEventScore(eventType: string) {
  const scores = {
    approved: 10,
    rejected: 8,
    requested_info: 5,
    comment: 3,
    assigned: 2,
    status_change: 4,
  };
  return scores[eventType as keyof typeof scores] || 1;
}

function calculateCompletionTrend(todayAudits: any[], yesterdayAudits: any[]) {
  const todayCompleted = todayAudits.filter(
    a => a.status === 'approved' || a.status === 'rejected'
  ).length;
  const yesterdayCompleted = yesterdayAudits.filter(
    a => a.status === 'approved' || a.status === 'rejected'
  ).length;

  if (yesterdayCompleted === 0) return todayCompleted > 0 ? '100' : '0';

  return (((todayCompleted - yesterdayCompleted) / yesterdayCompleted) * 100).toFixed(1);
}

function calculateActiveUsers(events: any[], now: Date) {
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const activeUserIds = new Set(
    events
      .filter(event => event.timestamp >= oneHourAgo)
      .map(event => event.userId)
      .filter(Boolean)
  );

  return activeUserIds.size;
}

function generateSimpleForecast(values: number[], days: number) {
  if (values.length < 3) return Array(days).fill(values[values.length - 1] || 0);

  // Simple linear regression for forecast
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const forecast = [];
  for (let i = 0; i < days; i++) {
    const forecastValue = intercept + slope * (n + i);
    forecast.push(Math.max(0, Math.round(forecastValue)));
  }

  return forecast;
}
