import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, gte, and, like, sql } from 'drizzle-orm';
import {
  webVitalsMetrics,
  webVitalsReports,
  webVitalsAggregates,
  webVitalsBudgets,
  webVitalsAlerts,
  type InsertWebVitalsMetric,
  type InsertWebVitalsReport,
  type InsertWebVitalsBudget,
  type InsertWebVitalsAlert,
} from '../../shared/web-vitals-schema';

/**
 * Store a Web Vitals report in the database
 *
 * @param db Database connection
 * @param report Web Vitals report
 */
export async function storeWebVitalsReport(
  db: NodePgDatabase<any>,
  report: InsertWebVitalsReport
): Promise<void> {
  await db.insert(webVitalsReports).values(report);
}

/**
 * Store a single Web Vitals metric
 *
 * @param db Database connection
 * @param metric Web Vitals metric
 */
export async function storeWebVitalsMetric(
  db: NodePgDatabase<any>,
  metric: InsertWebVitalsMetric
): Promise<void> {
  await db.insert(webVitalsMetrics).values(metric);
}

/**
 * Get Web Vitals metrics based on time range and optional filters
 *
 * @param db Database connection
 * @param timeRange Time range (1h, 24h, 7d, 30d, 90d)
 * @param metricName Optional metric name filter
 * @param limit Optional limit of results
 * @returns Array of Web Vitals metrics
 */
export async function getWebVitalsMetrics(
  db: NodePgDatabase<any>,
  timeRange: string,
  metricName?: string,
  limit: number = 100
): Promise<any[]> {
  const startTime = getStartTimeFromRange(timeRange);
  let query = db
    .select()
    .from(webVitalsMetrics)
    .where(gte(webVitalsMetrics.timestamp, startTime))
    .limit(limit);

  if (metricName) {
    query = query.where(eq(webVitalsMetrics.name, metricName));
  }

  return await query.orderBy(webVitalsMetrics.timestamp);
}

/**
 * Get Web Vitals summary with percentiles and distribution
 *
 * @param db Database connection
 * @param timeRange Time range (1h, 24h, 7d, 30d, 90d)
 * @returns Summary of Web Vitals metrics
 */
export async function getWebVitalsSummary(
  db: NodePgDatabase<any>,
  timeRange: string
): Promise<any> {
  const startTime = getStartTimeFromRange(timeRange);

  // Get distinct metric names first
  const metricNamesResult = await db
    .select({ name: webVitalsMetrics.name })
    .from(webVitalsMetrics)
    .where(gte(webVitalsMetrics.timestamp, startTime))
    .groupBy(webVitalsMetrics.name);

  const metricNames = metricNamesResult.map(row => row.name);

  // Get aggregates for each metric
  const summary: Record<string, any> = {};

  for (const name of metricNames) {
    const aggregates = await getMetricAggregates(db, name, startTime);
    const distribution = await getMetricDistribution(db, name, startTime);

    summary[name] = {
      ...aggregates,
      distribution,
    };
  }

  return summary;
}

/**
 * Get percentiles for a specific metric
 *
 * @param db Database connection
 * @param metricName Metric name
 * @param startTime Start time for filtering
 * @returns Percentiles (p50, p75, p95)
 */
async function getMetricAggregates(
  db: NodePgDatabase<any>,
  metricName: string,
  startTime: Date
): Promise<any> {
  const result = await db
    .select({
      p50: sql<number>`percentile_cont(0.5) within group (order by ${webVitalsMetrics.value})`,
      p75: sql<number>`percentile_cont(0.75) within group (order by ${webVitalsMetrics.value})`,
      p95: sql<number>`percentile_cont(0.95) within group (order by ${webVitalsMetrics.value})`,
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${webVitalsMetrics.value})`,
      min: sql<number>`min(${webVitalsMetrics.value})`,
      max: sql<number>`max(${webVitalsMetrics.value})`,
    })
    .from(webVitalsMetrics)
    .where(and(eq(webVitalsMetrics.name, metricName), gte(webVitalsMetrics.timestamp, startTime)));

  return result[0];
}

/**
 * Get distribution for a specific metric (good, needs improvement, poor)
 *
 * @param db Database connection
 * @param metricName Metric name
 * @param startTime Start time for filtering
 * @returns Distribution counts
 */
async function getMetricDistribution(
  db: NodePgDatabase<any>,
  metricName: string,
  startTime: Date
): Promise<any> {
  const result = await db
    .select({
      rating: webVitalsMetrics.rating,
      count: sql<number>`count(*)`,
    })
    .from(webVitalsMetrics)
    .where(and(eq(webVitalsMetrics.name, metricName), gte(webVitalsMetrics.timestamp, startTime)))
    .groupBy(webVitalsMetrics.rating);

  // Convert to object format
  const distribution: Record<string, number> = {};
  for (const row of result) {
    if (row.rating) {
      distribution[row.rating] = Number(row.count);
    }
  }

  return distribution;
}

/**
 * Get Web Vitals aggregates for charting and analysis
 *
 * @param db Database connection
 * @param timeRange Time range (1h, 24h, 7d, 30d, 90d)
 * @param metricName Optional metric name filter
 * @param urlPattern Optional URL pattern filter
 * @returns Array of Web Vitals aggregates
 */
export async function getWebVitalsAggregates(
  db: NodePgDatabase<any>,
  timeRange: string,
  metricName?: string,
  urlPattern?: string
): Promise<any[]> {
  const startTime = getStartTimeFromRange(timeRange);
  let query = db
    .select()
    .from(webVitalsAggregates)
    .where(gte(webVitalsAggregates.timestamp, startTime));

  if (metricName) {
    query = query.where(eq(webVitalsAggregates.metricName, metricName));
  }

  if (urlPattern) {
    query = query.where(like(webVitalsAggregates.urlPattern, `%${urlPattern}%`));
  }

  return await query.orderBy(webVitalsAggregates.timestamp);
}

/**
 * Create a Web Vitals performance budget
 *
 * @param db Database connection
 * @param budget Performance budget
 * @returns Created performance budget
 */
export async function createWebVitalsPerformanceBudget(
  db: NodePgDatabase<any>,
  budget: InsertWebVitalsBudget
): Promise<any> {
  const result = await db.insert(webVitalsBudgets).values(budget).returning();
  return result[0];
}

/**
 * Get Web Vitals performance budgets
 *
 * @param db Database connection
 * @returns Array of performance budgets
 */
export async function getWebVitalsPerformanceBudgets(db: NodePgDatabase<any>): Promise<any[]> {
  return await db.select().from(webVitalsBudgets).where(eq(webVitalsBudgets.active, true));
}

/**
 * Get Web Vitals alerts based on time range and acknowledgement status
 *
 * @param db Database connection
 * @param timeRange Time range (1h, 24h, 7d, 30d, 90d)
 * @param acknowledged Optional filter by acknowledgement status
 * @returns Array of Web Vitals alerts
 */
export async function getWebVitalsAlerts(
  db: NodePgDatabase<any>,
  timeRange: string,
  acknowledged?: boolean
): Promise<any[]> {
  const startTime = getStartTimeFromRange(timeRange);
  let query = db.select().from(webVitalsAlerts).where(gte(webVitalsAlerts.detectedAt, startTime));

  if (acknowledged !== undefined) {
    query = query.where(eq(webVitalsAlerts.acknowledged, acknowledged));
  }

  return await query.orderBy(webVitalsAlerts.detectedAt);
}

/**
 * Acknowledge a Web Vitals alert
 *
 * @param db Database connection
 * @param id Alert ID
 * @param userId User ID of the acknowledger
 */
export async function acknowledgeWebVitalsAlert(
  db: NodePgDatabase<any>,
  id: string,
  userId: string
): Promise<void> {
  await db
    .update(webVitalsAlerts)
    .set({
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    })
    .where(eq(webVitalsAlerts.id, id));
}

/**
 * Utility function to get start time from a time range string
 *
 * @param timeRange Time range (1h, 24h, 7d, 30d, 90d)
 * @returns Date object
 */
function getStartTimeFromRange(timeRange: string): Date {
  const now = new Date();

  switch (timeRange) {
    case '1h':
      now.setHours(now.getHours() - 1);
      break;
    case '24h':
      now.setDate(now.getDate() - 1);
      break;
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '90d':
      now.setDate(now.getDate() - 90);
      break;
    default:
      now.setDate(now.getDate() - 1); // Default to 24h
  }

  return now;
}
