/**
 * Network Health Monitor
 *
 * This utility helps monitor network health in Replit's environment,
 * which is known to have intermittent connectivity issues.
 *
 * It can detect:
 * - General internet connectivity
 * - Database connectivity issues
 * - WebSocket reliability problems
 * - Latency spikes
 */

import { exec } from "child_process";
import { promisify } from "util";
import { Logger } from "./logger";
import { pool } from "../db";
import * as http from "http";
import * as https from "https";

const execAsync = promisify(exec);
const logger = new Logger("NetworkHealth");

// Constants
const PING_TIMEOUT = 3000; // 3 seconds
const DB_QUERY_TIMEOUT = 5000; // 5 seconds
const HTTP_REQUEST_TIMEOUT = 5000; // 5 seconds

// Define health check endpoints
const HEALTH_CHECK_ENDPOINTS = [
  "https://www.google.com",
  "https://www.cloudflare.com",
  "https://api.github.com/zen", // Simple endpoint that returns a short message
];

// Interface for health check results
export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  internetConnectivity: boolean;
  databaseConnectivity: boolean;
  averageLatency: number;
  timestamp: string;
  details: {
    pingResults?: { [host: string]: number | null };
    httpResults?: { [url: string]: number | null };
    databaseLatency?: number | null;
    errors?: string[];
  };
}

/**
 * Network Health Monitor class
 *
 * Monitors various aspects of network health in the Replit environment
 */
export class NetworkHealthMonitor {
  private lastCheck: HealthCheckResult | null = null;
  private checkInProgress = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: ((result: HealthCheckResult) => void)[] = [];

  /**
   * Initialize the health monitor with optional interval
   * @param checkIntervalMs How often to automatically check network health (0 to disable)
   */
  constructor(private checkIntervalMs = 60000) {
    if (checkIntervalMs > 0) {
      this.startAutomaticChecks();
    }
  }

  /**
   * Start automatic health checks at the specified interval
   */
  startAutomaticChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      const result = await this.checkHealth();
      this.notifyListeners(result);
    }, this.checkIntervalMs);

    logger.info(`Automatic health checks started (interval: ${this.checkIntervalMs}ms)`);
  }

  /**
   * Stop automatic health checks
   */
  stopAutomaticChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info("Automatic health checks stopped");
    }
  }

  /**
   * Subscribe to health check results
   * @param listener Function to call with health check results
   * @returns Unsubscribe function
   */
  subscribe(listener: (result: HealthCheckResult) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of a health check result
   * @param result Health check result
   */
  private notifyListeners(result: HealthCheckResult): void {
    this.listeners.forEach((listener) => {
      try {
        listener(result);
      } catch (error) {
        logger.error("Error in health check listener:", error);
      }
    });
  }

  /**
   * Get the last health check result without running a new check
   * @returns The last health check result or null if no check has been run
   */
  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastCheck;
  }

  /**
   * Check network health
   * @returns Promise resolving to a health check result
   */
  async checkHealth(): Promise<HealthCheckResult> {
    if (this.checkInProgress) {
      logger.info("Health check already in progress, returning last result");
      return (
        this.lastCheck ||
        ({
          status: "unknown",
          internetConnectivity: false,
          databaseConnectivity: false,
          averageLatency: -1,
          timestamp: new Date().toISOString(),
          details: {
            errors: ["Health check in progress"],
          },
        } as any)
      );
    }

    this.checkInProgress = true;
    logger.info("Starting network health check");

    // Initialize result object
    const result: HealthCheckResult = {
      status: "healthy",
      internetConnectivity: false,
      databaseConnectivity: false,
      averageLatency: 0,
      timestamp: new Date().toISOString(),
      details: {
        pingResults: {},
        httpResults: {},
        errors: [],
      },
    };

    try {
      // Check internet connectivity with ping
      await this.checkPingConnectivity(result);

      // Check HTTP connectivity
      await this.checkHttpConnectivity(result);

      // Check database connectivity
      await this.checkDatabaseConnectivity(result);

      // Calculate average latency and determine overall status
      this.calculateHealthStatus(result);
    } catch (error) {
      logger.error("Error during health check:", error);
      result.status = "unhealthy";
      if (error instanceof Error) {
        result.details.errors!.push(error.message);
      } else {
        result.details.errors!.push("Unknown error during health check");
      }
    } finally {
      this.checkInProgress = false;
      this.lastCheck = result;
      logger.info(`Health check complete: ${result.status}`);
    }

    return result;
  }

  /**
   * Check connectivity using ping
   * @param result Health check result to update
   */
  private async checkPingConnectivity(result: HealthCheckResult): Promise<void> {
    const hosts = ["1.1.1.1", "8.8.8.8"]; // Cloudflare and Google DNS
    const pingResults: { [host: string]: number | null } = {};

    for (const host of hosts) {
      try {
        // Run ping with a timeout and limited number of packets
        const { stdout } = await execAsync(`ping -c 2 -W 2 ${host}`, { timeout: PING_TIMEOUT });

        // Parse time from ping output
        const timeMatch = stdout.match(/time=(\d+(\.\d+)?)/);
        if (timeMatch && timeMatch[1]) {
          const pingTime = parseFloat(timeMatch[1]);
          pingResults[host] = pingTime;
        } else {
          pingResults[host] = null;
        }
      } catch (error) {
        logger.warn(`Ping to ${host} failed`);
        pingResults[host] = null;
      }
    }

    result.details.pingResults = pingResults;

    // Check if any ping was successful
    const successfulPings = Object.values(pingResults).filter((time) => time !== null);
    result.internetConnectivity = successfulPings.length > 0;

    if (!result.internetConnectivity) {
      result.status = "unhealthy";
      result.details.errors!.push("No ping targets reachable");
    }
  }

  /**
   * Check HTTP connectivity to various endpoints
   * @param result Health check result to update
   */
  private async checkHttpConnectivity(result: HealthCheckResult): Promise<void> {
    const httpResults: { [url: string]: number | null } = {};

    for (const url of HEALTH_CHECK_ENDPOINTS) {
      try {
        const startTime = Date.now();
        await this.makeHttpRequest(url);
        const latency = Date.now() - startTime;
        httpResults[url] = latency;
      } catch (error) {
        logger.warn(`HTTP request to ${url} failed`);
        httpResults[url] = null;
        if (error instanceof Error) {
          result.details.errors!.push(`HTTP request to ${url} failed: ${error.message}`);
        }
      }
    }

    result.details.httpResults = httpResults;

    // Already determined by ping, but let's also consider HTTP connectivity
    const successfulRequests = Object.values(httpResults).filter((time) => time !== null);
    if (successfulRequests.length === 0 && result.internetConnectivity) {
      result.status = "degraded";
      result.details.errors!.push("HTTP requests failed but ping successful");
    }
  }

  /**
   * Make an HTTP request to the specified URL
   * @param url URL to request
   * @returns Promise that resolves on successful response
   */
  private makeHttpRequest(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const requestModule = url.startsWith("https") ? https : http;

      const req = requestModule.get(url, { timeout: HTTP_REQUEST_TIMEOUT }, (res) => {
        // Consider any 2xx status code as successful
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP request failed with status ${res.statusCode}`));
        }

        // Consume the data to free up memory
        res.resume();
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("HTTP request timed out"));
      });
    });
  }

  /**
   * Check database connectivity and measure latency
   * @param result Health check result to update
   */
  private async checkDatabaseConnectivity(result: HealthCheckResult): Promise<void> {
    try {
      const startTime = Date.now();

      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Database query timed out")), DB_QUERY_TIMEOUT);
      });

      // Run a simple query
      const queryPromise = pool.query("SELECT NOW()");

      // Race the query against the timeout
      await Promise.race([queryPromise, timeoutPromise]);

      const latency = Date.now() - startTime;
      result.databaseConnectivity = true;
      result.details.databaseLatency = latency;

      // Database is responsive but slow
      if (latency > 1000) {
        result.status = result.status === "unhealthy" ? "unhealthy" : "degraded";
        result.details.errors!.push(`Database latency high (${latency}ms)`);
      }
    } catch (error) {
      result.databaseConnectivity = false;
      result.details.databaseLatency = null;
      result.status = "unhealthy";

      if (error instanceof Error) {
        result.details.errors!.push(`Database connectivity failed: ${error.message}`);
      } else {
        result.details.errors!.push("Database connectivity failed");
      }
    }
  }

  /**
   * Calculate overall health status based on connectivity and latency
   * @param result Health check result to update
   */
  private calculateHealthStatus(result: HealthCheckResult): void {
    // Calculate average latency across all measurements
    const latencies: number[] = [];

    // Add ping latencies
    if (result.details.pingResults) {
      Object.values(result.details.pingResults)
        .filter((val): val is number => val !== null)
        .forEach((latency) => latencies.push(latency));
    }

    // Add HTTP latencies
    if (result.details.httpResults) {
      Object.values(result.details.httpResults)
        .filter((val): val is number => val !== null)
        .forEach((latency) => latencies.push(latency));
    }

    // Add database latency
    if (result.details.databaseLatency !== null && result.details.databaseLatency !== undefined) {
      latencies.push(result.details.databaseLatency);
    }

    // Calculate average latency
    if (latencies.length > 0) {
      result.averageLatency =
        latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
    }

    // Determine overall status (if not already set to unhealthy)
    if (result.status !== "unhealthy") {
      if (result.averageLatency > 500) {
        result.status = "degraded";
      } else if (!result.internetConnectivity || !result.databaseConnectivity) {
        result.status = "unhealthy";
      } else {
        result.status = "healthy";
      }
    }
  }

  /**
   * Determine if a WebSocket server should attempt to reconnect
   * based on current network health
   * @returns True if reconnection is recommended
   */
  shouldReconnectWebSocket(): boolean {
    // If we haven't run a health check yet, assume yes
    if (!this.lastCheck) {
      return true;
    }

    // If network is completely down, don't try
    if (!this.lastCheck.internetConnectivity) {
      return false;
    }

    // If status is healthy or degraded, attempt reconnection
    return this.lastCheck.status !== "unhealthy";
  }

  /**
   * Check if the network is healthy enough for real-time communication
   * @returns True if real-time communication should be reliable
   */
  isRealtimeCommunicationReliable(): boolean {
    // If we haven't run a health check yet, be optimistic
    if (!this.lastCheck) {
      return true;
    }

    // Need internet and database connectivity
    if (!this.lastCheck.internetConnectivity || !this.lastCheck.databaseConnectivity) {
      return false;
    }

    // Check latency - high latency makes real-time communication unreliable
    return this.lastCheck.averageLatency < 300; // 300ms threshold
  }
}

// Export singleton instance
export const networkHealth = new NetworkHealthMonitor();

// Expose simple function for WebSocket servers to use
export function shouldReconnectWebSocket(): boolean {
  return networkHealth.shouldReconnectWebSocket();
}

// Expose simple function to check if real-time communication is reliable
export function isRealtimeCommunicationReliable(): boolean {
  return networkHealth.isRealtimeCommunicationReliable();
}
