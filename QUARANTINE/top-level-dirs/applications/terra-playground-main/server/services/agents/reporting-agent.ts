/**
 * Reporting Agent
 *
 * This agent specializes in generating reports and aggregating data
 * for analysis and business intelligence purposes.
 */

import { BaseAgent, AgentConfig, AgentCapability } from './base-agent';
import { IStorage } from '../../storage';
import { MCPService } from '../mcp';

interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  type: string;
  query: any;
  schedule?: string;
  recipients?: string[];
  lastRun?: Date;
  createdAt: Date;
}

interface ReportResult {
  reportId: string;
  runId: string;
  data: any;
  metadata: {
    startTime: Date;
    endTime: Date;
    rowCount: number;
    status: string;
  };
}

export class ReportingAgent extends BaseAgent {
  private reportDefinitions: Map<string, ReportDefinition> = new Map();

  constructor(storage: IStorage, mcpService: MCPService) {
    // Define agent configuration
    const config: AgentConfig = {
      id: 3, // Assuming ID 3 for this agent
      name: 'Reporting Agent',
      description: 'Specializes in generating reports and analytics',
      permissions: [
        'authenticated',
        'property.read',
        'assessment.read',
        'report.read',
        'report.write',
      ],
      capabilities: [
        // Define core capabilities
        {
          name: 'createReport',
          description: 'Create a new report definition',
          parameters: {
            name: 'string',
            description: 'string',
            type: 'string',
            query: 'object',
          },
          handler: async (parameters, agent) =>
            await this.createReport(
              parameters.name,
              parameters.description,
              parameters.type,
              parameters.query
            ),
        },
        {
          name: 'runReport',
          description: 'Run a report and get the results',
          parameters: {
            reportId: 'string',
            parameters: 'object?',
          },
          handler: async (parameters, agent) =>
            await this.runReport(parameters.reportId, parameters.parameters),
        },
        {
          name: 'listReports',
          description: 'List all available reports',
          parameters: {},
          handler: async (parameters, agent) => await this.listReports(),
        },
        {
          name: 'getReportHistory',
          description: "Get the history of a report's executions",
          parameters: {
            reportId: 'string',
          },
          handler: async (parameters, agent) => await this.getReportHistory(parameters.reportId),
        },
        {
          name: 'scheduleReport',
          description: 'Schedule a report to run automatically',
          parameters: {
            reportId: 'string',
            schedule: 'string',
            recipients: 'string[]?',
          },
          handler: async (parameters, agent) =>
            await this.scheduleReport(
              parameters.reportId,
              parameters.schedule,
              parameters.recipients
            ),
        },
        {
          name: 'buildDashboard',
          description: 'Build a dashboard from multiple reports',
          parameters: {
            name: 'string',
            description: 'string',
            reportIds: 'string[]',
          },
          handler: async (parameters, agent) =>
            await this.buildDashboard(
              parameters.name,
              parameters.description,
              parameters.reportIds
            ),
        },
      ],
    };

    super(storage, mcpService, config);
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Log initialization
    await this.logActivity('agent_initialization', 'Reporting Agent initializing');

    // Check for required MCP tools
    const availableTools = await this.getAvailableMCPTools();
    const requiredTools = ['report.create', 'report.run', 'report.list', 'report.getById'];

    // Verify all required tools are available
    for (const tool of requiredTools) {
      if (!availableTools.find(t => t.name === tool)) {
        throw new Error(`Required MCP tool '${tool}' not available`);
      }
    }

    // Load existing report definitions
    try {
      const reportsResult = await this.executeMCPTool('report.list', {});

      if (reportsResult.success && reportsResult.result) {
        for (const report of reportsResult.result) {
          this.reportDefinitions.set(report.id, report);
        }

        await this.logActivity(
          'reports_loaded',
          `Loaded ${reportsResult.result.length} report definitions`
        );
      }
    } catch (error) {
      await this.logActivity(
        'reports_load_error',
        `Error loading report definitions: ${error.message}`
      );
      // Don't throw here, just continue with an empty set of reports
    }

    await this.logActivity('agent_initialization', 'Reporting Agent initialized successfully');
  }

  /**
   * Create a new report definition
   */
  private async createReport(
    name: string,
    description: string,
    type: string,
    query: any
  ): Promise<any> {
    try {
      // Log the report creation request
      await this.logActivity('report_creation', `Creating report: ${name}`);

      // Validate the report type
      const validTypes = ['property', 'assessment', 'appeals', 'performance', 'trend', 'custom'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid report type: ${type}. Valid types are: ${validTypes.join(', ')}`);
      }

      // Generate a unique report ID
      const reportId = `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the report definition
      const reportDef: ReportDefinition = {
        id: reportId,
        name,
        description,
        type,
        query,
        createdAt: new Date(),
      };

      // Save to storage via MCP
      const createResult = await this.executeMCPTool('report.create', reportDef);

      if (!createResult.success) {
        throw new Error(`Failed to create report: ${createResult.error}`);
      }

      // Store in memory as well
      this.reportDefinitions.set(reportId, reportDef);

      // Log successful creation
      await this.logActivity('report_created', `Created report: ${name} (${reportId})`);

      return {
        reportId,
        name,
        description,
        type,
        createdAt: reportDef.createdAt,
      };
    } catch (error) {
      await this.logActivity('report_creation_error', `Error creating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run a report and get the results
   */
  private async runReport(reportId: string, parameters: any = {}): Promise<any> {
    try {
      // Log the report execution request
      await this.logActivity('report_execution', `Running report: ${reportId}`);

      // Get the report definition
      let reportDef = this.reportDefinitions.get(reportId);

      if (!reportDef) {
        // Try to get it from storage
        const getResult = await this.executeMCPTool('report.getById', { reportId });

        if (!getResult.success || !getResult.result) {
          throw new Error(`Report ${reportId} not found`);
        }

        reportDef = getResult.result;
        this.reportDefinitions.set(reportId, reportDef);
      }

      // Generate a run ID for this execution
      const runId = `run-${Date.now()}`;

      // Record start time
      const startTime = new Date();

      // Execute the query based on the report type
      let data;

      switch (reportDef.type) {
        case 'property':
          // Report on properties
          data = await this.executePropertyReport(reportDef.query, parameters);
          break;

        case 'assessment':
          // Report on assessments
          data = await this.executeAssessmentReport(reportDef.query, parameters);
          break;

        case 'appeals':
          // Report on appeals
          data = await this.executeAppealsReport(reportDef.query, parameters);
          break;

        case 'performance':
          // Performance metrics report
          data = await this.executePerformanceReport(reportDef.query, parameters);
          break;

        case 'trend':
          // Trend analysis report
          data = await this.executeTrendReport(reportDef.query, parameters);
          break;

        case 'custom':
          // Custom query report
          data = await this.executeCustomReport(reportDef.query, parameters);
          break;

        default:
          throw new Error(`Unsupported report type: ${reportDef.type}`);
      }

      // Record end time
      const endTime = new Date();

      // Create the result object
      const result: ReportResult = {
        reportId,
        runId,
        data,
        metadata: {
          startTime,
          endTime,
          rowCount: Array.isArray(data) ? data.length : 1,
          status: 'completed',
        },
      };

      // Save the result to storage
      await this.executeMCPTool('report.saveResult', {
        reportId,
        runId,
        result,
      });

      // Update the report definition with the last run time
      reportDef.lastRun = endTime;
      this.reportDefinitions.set(reportId, reportDef);

      // Log successful execution
      await this.logActivity(
        'report_executed',
        `Executed report: ${reportDef.name} (${reportId})`,
        {
          runId,
          duration: endTime.getTime() - startTime.getTime(),
          rowCount: result.metadata.rowCount,
        }
      );

      return result;
    } catch (error) {
      await this.logActivity(
        'report_execution_error',
        `Error executing report ${reportId}: ${error.message}`
      );

      // Create an error result
      const errorResult: ReportResult = {
        reportId,
        runId: `run-${Date.now()}`,
        data: null,
        metadata: {
          startTime: new Date(),
          endTime: new Date(),
          rowCount: 0,
          status: 'error',
        },
      };

      // Save the error result
      try {
        await this.executeMCPTool('report.saveResult', {
          reportId,
          runId: errorResult.runId,
          result: {
            ...errorResult,
            error: error.message,
          },
        });
      } catch (saveError) {
        // Just log this error, don't throw
        await this.logActivity(
          'report_result_save_error',
          `Failed to save error result: ${saveError.message}`
        );
      }

      throw error;
    }
  }

  /**
   * Execute a property report
   */
  private async executePropertyReport(query: any, parameters: any): Promise<any> {
    // Merge query and parameters
    const mergedQuery = { ...query, ...parameters };

    // Get properties from MCP
    const result = await this.executeMCPTool('property.getAll', mergedQuery);

    if (!result.success) {
      throw new Error(`Failed to execute property report: ${result.error}`);
    }

    // If aggregation is specified, perform it
    if (mergedQuery.aggregate) {
      return this.aggregateResults(result.result, mergedQuery.aggregate);
    }

    return result.result;
  }

  /**
   * Execute an assessment report
   */
  private async executeAssessmentReport(query: any, parameters: any): Promise<any> {
    // Merge query and parameters
    const mergedQuery = { ...query, ...parameters };

    // Get assessment data from MCP
    const result = await this.executeMCPTool('assessment.getAll', mergedQuery);

    if (!result.success) {
      throw new Error(`Failed to execute assessment report: ${result.error}`);
    }

    // If aggregation is specified, perform it
    if (mergedQuery.aggregate) {
      return this.aggregateResults(result.result, mergedQuery.aggregate);
    }

    return result.result;
  }

  /**
   * Execute an appeals report
   */
  private async executeAppealsReport(query: any, parameters: any): Promise<any> {
    // Merge query and parameters
    const mergedQuery = { ...query, ...parameters };

    // Get appeals data from MCP
    const result = await this.executeMCPTool('appeal.getAll', mergedQuery);

    if (!result.success) {
      throw new Error(`Failed to execute appeals report: ${result.error}`);
    }

    // If aggregation is specified, perform it
    if (mergedQuery.aggregate) {
      return this.aggregateResults(result.result, mergedQuery.aggregate);
    }

    return result.result;
  }

  /**
   * Execute a performance report
   */
  private async executePerformanceReport(query: any, parameters: any): Promise<any> {
    // Performance reports look at system metrics and activities

    // Get system activities from MCP
    const result = await this.executeMCPTool('system.getActivities', {
      ...query,
      ...parameters,
    });

    if (!result.success) {
      throw new Error(`Failed to execute performance report: ${result.error}`);
    }

    // Process the activities to calculate performance metrics
    const activities = result.result;

    // Example metrics: average response time, error rate, throughput
    const metrics = {
      totalCount: activities.length,
      averageResponseTime: 0,
      errorRate: 0,
      throughputPerHour: 0,
      statusBreakdown: {},
    };

    // Calculate response times
    const responseTimes = [];
    let errorCount = 0;
    const statusCounts = {};

    // Get the time range
    const timeRange = parameters.timeRange || query.timeRange || '24h';
    let hours = 24;

    if (timeRange.endsWith('h')) {
      hours = parseInt(timeRange.slice(0, -1));
    } else if (timeRange.endsWith('d')) {
      hours = parseInt(timeRange.slice(0, -1)) * 24;
    }

    for (const activity of activities) {
      // Response time calculation
      if (activity.startTime && activity.endTime) {
        const start = new Date(activity.startTime).getTime();
        const end = new Date(activity.endTime).getTime();
        const responseTime = (end - start) / 1000; // in seconds
        responseTimes.push(responseTime);
      }

      // Error counting
      if (activity.status === 'error') {
        errorCount++;
      }

      // Status breakdown
      if (!statusCounts[activity.status]) {
        statusCounts[activity.status] = 0;
      }
      statusCounts[activity.status]++;
    }

    // Calculate the metrics
    metrics.averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

    metrics.errorRate = activities.length > 0 ? (errorCount / activities.length) * 100 : 0;

    metrics.throughputPerHour = hours > 0 ? activities.length / hours : 0;

    metrics.statusBreakdown = statusCounts;

    return metrics;
  }

  /**
   * Execute a trend report
   */
  private async executeTrendReport(query: any, parameters: any): Promise<any> {
    // Trend reports look at how data changes over time

    // Get the time range and interval
    const timeRange = parameters.timeRange || query.timeRange || '1year';
    const interval = parameters.interval || query.interval || 'month';

    // Get historical data from MCP
    const result = await this.executeMCPTool('statistics.getHistorical', {
      dataType: query.dataType || 'property',
      metric: query.metric || 'value',
      timeRange,
      interval,
      filter: query.filter || {},
    });

    if (!result.success) {
      throw new Error(`Failed to execute trend report: ${result.error}`);
    }

    // Process the data to calculate trend metrics
    const data = result.result;

    // Calculate additional trend metrics
    if (data.length >= 2) {
      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      const change = lastValue - firstValue;
      const percentChange = (change / firstValue) * 100;

      // Add summary metrics
      return {
        data,
        summary: {
          firstValue,
          lastValue,
          change,
          percentChange,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        },
      };
    }

    return { data, summary: { insufficient: true } };
  }

  /**
   * Execute a custom report
   */
  private async executeCustomReport(query: any, parameters: any): Promise<any> {
    // Custom reports can execute arbitrary MCPTools

    // Security check - only allow certain tools to be called
    const allowedTools = [
      'property.getAll',
      'property.search',
      'assessment.getAll',
      'landRecord.getAll',
      'appeal.getAll',
      'statistics.calculate',
    ];

    if (!query.tool || !allowedTools.includes(query.tool)) {
      throw new Error(`Custom report tool not allowed: ${query.tool}`);
    }

    // Execute the specified tool
    const result = await this.executeMCPTool(query.tool, {
      ...query.parameters,
      ...parameters,
    });

    if (!result.success) {
      throw new Error(`Failed to execute custom report: ${result.error}`);
    }

    // If transformations are specified, apply them
    if (query.transformations && Array.isArray(query.transformations)) {
      let transformedData = result.result;

      for (const transformation of query.transformations) {
        switch (transformation.type) {
          case 'filter':
            transformedData = this.applyFilter(transformedData, transformation.criteria);
            break;

          case 'sort':
            transformedData = this.applySort(
              transformedData,
              transformation.field,
              transformation.direction
            );
            break;

          case 'aggregate':
            transformedData = this.aggregateResults(transformedData, transformation.config);
            break;

          case 'limit':
            transformedData = transformedData.slice(0, transformation.value);
            break;

          default:
            // Ignore unknown transformations
            break;
        }
      }

      return transformedData;
    }

    return result.result;
  }

  /**
   * Apply a filter to results
   */
  private applyFilter(data: any[], criteria: any): any[] {
    return data.filter(item => {
      for (const [key, value] of Object.entries(criteria)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Apply sorting to results
   */
  private applySort(data: any[], field: string, direction: 'asc' | 'desc' = 'asc'): any[] {
    return [...data].sort((a, b) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Aggregate results
   */
  private aggregateResults(data: any[], aggregateConfig: any): any {
    const result: any = {};

    // Group by field if specified
    if (aggregateConfig.groupBy) {
      const groups = {};

      for (const item of data) {
        const groupValue = item[aggregateConfig.groupBy];
        if (!groups[groupValue]) {
          groups[groupValue] = [];
        }
        groups[groupValue].push(item);
      }

      // Apply aggregations to each group
      for (const [groupValue, groupItems] of Object.entries(groups)) {
        result[groupValue] = this.calculateAggregates(groupItems, aggregateConfig.metrics);
      }

      return result;
    } else {
      // Just apply aggregations to the whole dataset
      return this.calculateAggregates(data, aggregateConfig.metrics);
    }
  }

  /**
   * Calculate aggregates for a dataset
   */
  private calculateAggregates(data: any[], metrics: any[]): any {
    const result = {};

    for (const metric of metrics) {
      switch (metric.type) {
        case 'count':
          result[metric.name || 'count'] = data.length;
          break;

        case 'sum':
          result[metric.name || `sum_${metric.field}`] = data.reduce(
            (sum, item) => sum + (parseFloat(item[metric.field]) || 0),
            0
          );
          break;

        case 'average':
          result[metric.name || `avg_${metric.field}`] =
            data.length > 0
              ? data.reduce((sum, item) => sum + (parseFloat(item[metric.field]) || 0), 0) /
                data.length
              : 0;
          break;

        case 'min':
          result[metric.name || `min_${metric.field}`] =
            data.length > 0
              ? Math.min(...data.map(item => parseFloat(item[metric.field]) || 0))
              : 0;
          break;

        case 'max':
          result[metric.name || `max_${metric.field}`] =
            data.length > 0
              ? Math.max(...data.map(item => parseFloat(item[metric.field]) || 0))
              : 0;
          break;
      }
    }

    return result;
  }

  /**
   * List all available reports
   */
  private async listReports(): Promise<any> {
    try {
      // Try to get the reports from storage first
      const result = await this.executeMCPTool('report.list', {});

      if (result.success) {
        // Update the in-memory cache
        for (const report of result.result) {
          this.reportDefinitions.set(report.id, report);
        }

        return result.result;
      } else {
        // Fall back to in-memory cache
        return Array.from(this.reportDefinitions.values());
      }
    } catch (error) {
      await this.logActivity('list_reports_error', `Error listing reports: ${error.message}`);

      // Fall back to in-memory cache
      return Array.from(this.reportDefinitions.values());
    }
  }

  /**
   * Get the history of a report's executions
   */
  private async getReportHistory(reportId: string): Promise<any> {
    try {
      // Get the report definition first
      let reportDef = this.reportDefinitions.get(reportId);

      if (!reportDef) {
        // Try to get it from storage
        const getResult = await this.executeMCPTool('report.getById', { reportId });

        if (!getResult.success || !getResult.result) {
          throw new Error(`Report ${reportId} not found`);
        }

        reportDef = getResult.result;
        this.reportDefinitions.set(reportId, reportDef);
      }

      // Get the execution history
      const historyResult = await this.executeMCPTool('report.getHistory', { reportId });

      if (!historyResult.success) {
        throw new Error(`Failed to get report history: ${historyResult.error}`);
      }

      return {
        reportId,
        name: reportDef.name,
        executions: historyResult.result,
      };
    } catch (error) {
      await this.logActivity(
        'report_history_error',
        `Error getting report history for ${reportId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Schedule a report to run automatically
   */
  private async scheduleReport(
    reportId: string,
    schedule: string,
    recipients?: string[]
  ): Promise<any> {
    try {
      // Validate the schedule format (cron-style or simple interval)
      const schedulePatterns = {
        daily: '0 0 * * *',
        weekly: '0 0 * * 0',
        monthly: '0 0 1 * *',
        quarterly: '0 0 1 */3 *',
      };

      const finalSchedule = schedulePatterns[schedule] || schedule;

      // Get the report definition
      let reportDef = this.reportDefinitions.get(reportId);

      if (!reportDef) {
        // Try to get it from storage
        const getResult = await this.executeMCPTool('report.getById', { reportId });

        if (!getResult.success || !getResult.result) {
          throw new Error(`Report ${reportId} not found`);
        }

        reportDef = getResult.result;
        this.reportDefinitions.set(reportId, reportDef);
      }

      // Update the report definition with the schedule
      reportDef.schedule = finalSchedule;

      if (recipients && recipients.length > 0) {
        reportDef.recipients = recipients;
      }

      // Save to storage
      const updateResult = await this.executeMCPTool('report.update', reportDef);

      if (!updateResult.success) {
        throw new Error(`Failed to schedule report: ${updateResult.error}`);
      }

      // Update in-memory cache
      this.reportDefinitions.set(reportId, reportDef);

      // Log the scheduling
      await this.logActivity(
        'report_scheduled',
        `Scheduled report ${reportId} with schedule: ${finalSchedule}`,
        {
          recipients: recipients || [],
        }
      );

      return {
        reportId,
        name: reportDef.name,
        schedule: finalSchedule,
        recipients: recipients || [],
      };
    } catch (error) {
      await this.logActivity(
        'report_schedule_error',
        `Error scheduling report ${reportId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Build a dashboard from multiple reports
   */
  private async buildDashboard(
    name: string,
    description: string,
    reportIds: string[]
  ): Promise<any> {
    try {
      // Validate that all reports exist
      const existingReports = [];
      const missingReports = [];

      for (const reportId of reportIds) {
        let reportDef = this.reportDefinitions.get(reportId);

        if (!reportDef) {
          // Try to get it from storage
          const getResult = await this.executeMCPTool('report.getById', { reportId });

          if (!getResult.success || !getResult.result) {
            missingReports.push(reportId);
            continue;
          }

          reportDef = getResult.result;
          this.reportDefinitions.set(reportId, reportDef);
        }

        existingReports.push(reportDef);
      }

      if (missingReports.length > 0) {
        throw new Error(`Some reports not found: ${missingReports.join(', ')}`);
      }

      // Create a dashboard definition
      const dashboardId = `dashboard-${Date.now()}`;
      const dashboard = {
        id: dashboardId,
        name,
        description,
        reportIds,
        layout: {
          type: 'grid',
          rows: Math.ceil(reportIds.length / 2),
          columns: 2,
        },
        createdAt: new Date(),
      };

      // Save to storage
      const createResult = await this.executeMCPTool('dashboard.create', dashboard);

      if (!createResult.success) {
        throw new Error(`Failed to create dashboard: ${createResult.error}`);
      }

      // Log dashboard creation
      await this.logActivity('dashboard_created', `Created dashboard: ${name} (${dashboardId})`, {
        reportCount: reportIds.length,
      });

      return {
        dashboardId,
        name,
        reports: existingReports.map(report => ({
          id: report.id,
          name: report.name,
          type: report.type,
        })),
      };
    } catch (error) {
      await this.logActivity(
        'dashboard_creation_error',
        `Error creating dashboard: ${error.message}`
      );
      throw error;
    }
  }
}
