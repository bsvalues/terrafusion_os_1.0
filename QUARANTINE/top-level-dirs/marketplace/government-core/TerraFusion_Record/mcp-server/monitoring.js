/**
 * MCP Server Monitoring and Metrics
 */

export class MCPMonitoring {
    constructor() {
        this.metrics = {
            toolCalls: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    recordToolCall(toolName) {
        this.metrics.toolCalls++;
        console.log(`Tool call: ${toolName} (Total: ${this.metrics.toolCalls})`);
    }

    recordError(error) {
        this.metrics.errors++;
        console.error(`MCP Error: ${error.message} (Total errors: ${this.metrics.errors})`);
    }

    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime
        };
    }
}

export default MCPMonitoring;