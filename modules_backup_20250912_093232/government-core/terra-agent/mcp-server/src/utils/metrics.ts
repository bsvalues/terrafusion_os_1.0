/**
 * Metrics utility for TerraAgent MCP Server
 * Production-grade metrics collection and monitoring
 */

export class MCPMetrics {
  private static instance: MCPMetrics;
  private metrics: Map<string, any>;
  private startTime: Date;

  private constructor() {
    this.metrics = new Map();
    this.startTime = new Date();
    this.initializeMetrics();
  }

  public static getInstance(): MCPMetrics {
    if (!MCPMetrics.instance) {
      MCPMetrics.instance = new MCPMetrics();
    }
    return MCPMetrics.instance;
  }

  private initializeMetrics(): void {
    this.metrics.set('server_starts', 0);
    this.metrics.set('tool_list_requests', 0);
    this.metrics.set('tool_calls', new Map());
    this.metrics.set('tool_execution_times', new Map());
    this.metrics.set('successful_tool_calls', new Map());
    this.metrics.set('failed_tool_calls', new Map());
    this.metrics.set('cache_hits', new Map());
    this.metrics.set('cache_misses', new Map());
    this.metrics.set('server_errors', 0);
  }

  public recordServerStart(): void {
    const count = this.metrics.get('server_starts') || 0;
    this.metrics.set('server_starts', count + 1);
  }

  public incrementToolListRequests(): void {
    const count = this.metrics.get('tool_list_requests') || 0;
    this.metrics.set('tool_list_requests', count + 1);
  }

  public incrementToolCalls(toolName: string): void {
    const toolCalls = this.metrics.get('tool_calls') || new Map();
    const count = toolCalls.get(toolName) || 0;
    toolCalls.set(toolName, count + 1);
    this.metrics.set('tool_calls', toolCalls);
  }

  public recordToolExecutionTime(toolName: string, timeMs: number): void {
    const executionTimes = this.metrics.get('tool_execution_times') || new Map();
    const times = executionTimes.get(toolName) || [];
    times.push(timeMs);

    // Keep only last 100 execution times per tool
    if (times.length > 100) {
      times.shift();
    }

    executionTimes.set(toolName, times);
    this.metrics.set('tool_execution_times', executionTimes);
  }

  public incrementSuccessfulToolCalls(toolName: string): void {
    const successfulCalls = this.metrics.get('successful_tool_calls') || new Map();
    const count = successfulCalls.get(toolName) || 0;
    successfulCalls.set(toolName, count + 1);
    this.metrics.set('successful_tool_calls', successfulCalls);
  }

  public incrementFailedToolCalls(toolName: string): void {
    const failedCalls = this.metrics.get('failed_tool_calls') || new Map();
    const count = failedCalls.get(toolName) || 0;
    failedCalls.set(toolName, count + 1);
    this.metrics.set('failed_tool_calls', failedCalls);
  }

  public incrementCacheHits(toolName: string): void {
    const cacheHits = this.metrics.get('cache_hits') || new Map();
    const count = cacheHits.get(toolName) || 0;
    cacheHits.set(toolName, count + 1);
    this.metrics.set('cache_hits', cacheHits);
  }

  public incrementCacheMisses(toolName: string): void {
    const cacheMisses = this.metrics.get('cache_misses') || new Map();
    const count = cacheMisses.get(toolName) || 0;
    cacheMisses.set(toolName, count + 1);
    this.metrics.set('cache_misses', cacheMisses);
  }

  public incrementServerErrors(): void {
    const count = this.metrics.get('server_errors') || 0;
    this.metrics.set('server_errors', count + 1);
  }

  public getMetrics(): any {
    const uptime = Date.now() - this.startTime.getTime();

    return {
      uptime_ms: uptime,
      server_starts: this.metrics.get('server_starts'),
      tool_list_requests: this.metrics.get('tool_list_requests'),
      server_errors: this.metrics.get('server_errors'),
      tools: this.getToolMetrics(),
      cache: this.getCacheMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  private getToolMetrics(): any {
    const toolCalls = this.metrics.get('tool_calls') || new Map();
    const executionTimes = this.metrics.get('tool_execution_times') || new Map();
    const successfulCalls = this.metrics.get('successful_tool_calls') || new Map();
    const failedCalls = this.metrics.get('failed_tool_calls') || new Map();

    const toolMetrics: any = {};

    // Get all unique tool names
    const toolNames = new Set([
      ...toolCalls.keys(),
      ...executionTimes.keys(),
      ...successfulCalls.keys(),
      ...failedCalls.keys(),
    ]);

    for (const toolName of toolNames) {
      const calls = toolCalls.get(toolName) || 0;
      const successful = successfulCalls.get(toolName) || 0;
      const failed = failedCalls.get(toolName) || 0;
      const times = executionTimes.get(toolName) || [];

      toolMetrics[toolName] = {
        total_calls: calls,
        successful_calls: successful,
        failed_calls: failed,
        success_rate: calls > 0 ? (successful / calls) * 100 : 0,
        avg_execution_time_ms:
          times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0,
        min_execution_time_ms: times.length > 0 ? Math.min(...times) : 0,
        max_execution_time_ms: times.length > 0 ? Math.max(...times) : 0,
      };
    }

    return toolMetrics;
  }

  private getCacheMetrics(): any {
    const cacheHits = this.metrics.get('cache_hits') || new Map();
    const cacheMisses = this.metrics.get('cache_misses') || new Map();

    const toolNames = new Set([...cacheHits.keys(), ...cacheMisses.keys()]);
    const cacheMetrics: any = {};

    for (const toolName of toolNames) {
      const hits = cacheHits.get(toolName) || 0;
      const misses = cacheMisses.get(toolName) || 0;
      const total = hits + misses;

      cacheMetrics[toolName] = {
        hits,
        misses,
        total_requests: total,
        hit_rate: total > 0 ? (hits / total) * 100 : 0,
      };
    }

    return cacheMetrics;
  }

  public close(): void {
    // Cleanup metrics if needed
    this.metrics.clear();
  }
}
