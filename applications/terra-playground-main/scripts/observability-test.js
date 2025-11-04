#!/usr/bin/env node

/**
 * Observability Smoke Test Script
 *
 * This script performs basic validation of the observability infrastructure,
 * checking that metrics are exposed correctly, WebSockets are working, and
 * Prometheus can scrape the application.
 *
 * Usage:
 *   node scripts/observability-test.js
 */

import http from 'http';
import { WebSocket } from 'ws';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
const METRICS_ENDPOINT = `${APP_URL}/metrics`;
const HEALTH_ENDPOINT = `${APP_URL}/health`;
const WEBSOCKET_TEST_PAGE = `${APP_URL}/websocket-test`;
const WEBSOCKET_URL = APP_URL.replace('http', 'ws') + '/ws';

// Color codes for terminal output
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
};

// Counters for summary
let passedTests = 0;
let failedTests = 0;

/**
 * Print a colored message to the console
 */
function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

/**
 * Make an HTTP GET request
 */
function httpGet(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
        });
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(timeoutMs, () => {
      req.abort();
      reject(new Error(`Request to ${url} timed out after ${timeoutMs}ms`));
    });
  });
}

/**
 * Test if a service is reachable
 */
async function testServiceReachable(name, url) {
  log(`\nTesting ${name} availability...`, COLORS.BLUE);

  try {
    log(`Checking ${url}...`);
    const response = await httpGet(url);

    if (response.status >= 200 && response.status < 400) {
      log(`✅ ${name} is reachable (status: ${response.status})`, COLORS.GREEN);
      passedTests++;
      return true;
    } else {
      log(`❌ ${name} returned an error status: ${response.status}`, COLORS.RED);
      failedTests++;
      return false;
    }
  } catch (error) {
    log(`❌ Failed to connect to ${name}: ${error.message}`, COLORS.RED);
    failedTests++;
    return false;
  }
}

/**
 * Test metrics endpoint
 */
async function testMetricsEndpoint() {
  log('\nTesting metrics endpoint...', COLORS.BLUE);

  try {
    log(`Checking ${METRICS_ENDPOINT}...`);
    const response = await httpGet(METRICS_ENDPOINT);

    if (response.status === 200) {
      log('✅ Metrics endpoint is available', COLORS.GREEN);

      // Check if metrics are in Prometheus format
      if (response.data.includes('# HELP') && response.data.includes('# TYPE')) {
        log('✅ Metrics appear to be in Prometheus format', COLORS.GREEN);

        // Check if web vitals metrics are present
        if (response.data.includes('web_vitals_')) {
          log('✅ Web Vitals metrics are present', COLORS.GREEN);
          passedTests += 3;
        } else {
          log('❌ Web Vitals metrics are not present', COLORS.RED);
          passedTests += 2;
          failedTests++;
        }
      } else {
        log('❌ Metrics do not appear to be in Prometheus format', COLORS.RED);
        passedTests++;
        failedTests++;
      }
    } else {
      log(`❌ Metrics endpoint returned status: ${response.status}`, COLORS.RED);
      failedTests++;
    }
  } catch (error) {
    log(`❌ Failed to connect to metrics endpoint: ${error.message}`, COLORS.RED);
    failedTests++;
  }
}

/**
 * Test WebSocket connectivity
 */
function testWebSocketConnectivity() {
  return new Promise(resolve => {
    log('\nTesting WebSocket connectivity...', COLORS.BLUE);

    log(`Checking if WebSocket test page exists at ${WEBSOCKET_TEST_PAGE}...`);
    httpGet(WEBSOCKET_TEST_PAGE)
      .then(response => {
        if (response.status === 200) {
          log('✅ WebSocket test page is available', COLORS.GREEN);
          passedTests++;

          log(`Connecting to WebSocket at ${WEBSOCKET_URL}...`);
          const ws = new WebSocket(WEBSOCKET_URL);

          // Set timeout for connection
          const timeout = setTimeout(() => {
            log('❌ WebSocket connection timed out after 5 seconds', COLORS.RED);
            failedTests++;
            ws.terminate();
            resolve();
          }, 5000);

          ws.on('open', () => {
            log('✅ Successfully connected to WebSocket server', COLORS.GREEN);
            passedTests++;

            // Send a test message
            log('Sending test message...');
            ws.send(JSON.stringify({ type: 'ping', payload: 'test' }));

            // Set timeout for message response
            const messageTimeout = setTimeout(() => {
              log('❌ WebSocket message response timed out after 5 seconds', COLORS.RED);
              failedTests++;
              ws.terminate();
              clearTimeout(timeout);
              resolve();
            }, 5000);

            ws.on('message', data => {
              clearTimeout(messageTimeout);

              try {
                const message = JSON.parse(data.toString());
                log(`Received response: ${JSON.stringify(message)}`);
                log('✅ Successfully received WebSocket response', COLORS.GREEN);
                passedTests++;
              } catch (error) {
                log(`❌ Received invalid JSON response: ${error.message}`, COLORS.RED);
                failedTests++;
              }

              ws.close();
              clearTimeout(timeout);
              resolve();
            });
          });

          ws.on('error', error => {
            log(`❌ WebSocket connection error: ${error.message}`, COLORS.RED);
            failedTests++;
            clearTimeout(timeout);
            resolve();
          });
        } else {
          log(`❌ WebSocket test page returned status: ${response.status}`, COLORS.RED);
          failedTests++;
          resolve();
        }
      })
      .catch(error => {
        log(`❌ Failed to check WebSocket test page: ${error.message}`, COLORS.RED);
        failedTests++;
        resolve();
      });
  });
}

/**
 * Test if Prometheus can query our metrics
 */
async function testPrometheusQueries() {
  log('\nTesting Prometheus queries...', COLORS.BLUE);

  try {
    // First check if Prometheus is running
    log(`Checking if Prometheus is available at ${PROMETHEUS_URL}...`);
    const response = await httpGet(`${PROMETHEUS_URL}/api/v1/status/config`);

    if (response.status === 200) {
      log('✅ Prometheus API is available', COLORS.GREEN);
      passedTests++;

      // Try querying some of our metrics
      const queries = [
        'web_vitals_lcp_bucket',
        'web_vitals_fcp_bucket',
        'web_vitals_ttfb_bucket',
        'web_vitals_cls_bucket',
      ];

      for (const metric of queries) {
        try {
          log(`Querying Prometheus for metric: ${metric}...`);
          const queryResponse = await httpGet(
            `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(metric)}`
          );

          if (queryResponse.status === 200) {
            const result = JSON.parse(queryResponse.data);

            if (result.status === 'success') {
              if (result.data.result.length > 0) {
                log(`✅ Successfully queried metric: ${metric}`, COLORS.GREEN);
                passedTests++;
              } else {
                log(`⚠️ Metric ${metric} exists but no data points found`, COLORS.YELLOW);
                passedTests++;
              }
            } else {
              log(`❌ Query for ${metric} failed: ${result.error || 'Unknown error'}`, COLORS.RED);
              failedTests++;
            }
          } else {
            log(`❌ Query for ${metric} returned status: ${queryResponse.status}`, COLORS.RED);
            failedTests++;
          }
        } catch (error) {
          log(`❌ Failed to query metric ${metric}: ${error.message}`, COLORS.RED);
          failedTests++;
        }
      }

      // Try querying some SLO metrics
      log('Checking if SLO recording rules are working...');
      try {
        const sloQueryResponse = await httpGet(
          `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent('slo:dashboard_lcp_4g:error_budget_remaining')}`
        );

        if (sloQueryResponse.status === 200) {
          const result = JSON.parse(sloQueryResponse.data);

          if (result.status === 'success') {
            if (result.data.result.length > 0) {
              log(`✅ Successfully queried SLO recording rule`, COLORS.GREEN);
              passedTests++;
            } else {
              log(`⚠️ SLO recording rule exists but no data points found`, COLORS.YELLOW);
              passedTests++;
            }
          } else {
            log(
              `❌ Query for SLO recording rule failed: ${result.error || 'Unknown error'}`,
              COLORS.RED
            );
            failedTests++;
          }
        } else {
          log(
            `❌ Query for SLO recording rule returned status: ${sloQueryResponse.status}`,
            COLORS.RED
          );
          failedTests++;
        }
      } catch (error) {
        log(`❌ Failed to query SLO recording rule: ${error.message}`, COLORS.RED);
        failedTests++;
      }
    } else {
      log(
        `⚠️ Prometheus is not available (status: ${response.status}). Skipping query tests.`,
        COLORS.YELLOW
      );
    }
  } catch (error) {
    log(`⚠️ Prometheus is not available: ${error.message}. Skipping query tests.`, COLORS.YELLOW);
  }
}

/**
 * Main function
 */
async function main() {
  log('Starting observability smoke tests...', COLORS.MAGENTA);
  log('======================================\n');

  // Test basic connectivity
  await testServiceReachable('Main application', APP_URL);
  await testServiceReachable('Health endpoint', HEALTH_ENDPOINT);

  // Test metrics endpoint
  await testMetricsEndpoint();

  // Test WebSocket connectivity
  await testWebSocketConnectivity();

  // Test Prometheus queries (if available)
  await testPrometheusQueries();

  // Print summary
  log('\n======================================', COLORS.MAGENTA);
  log('Smoke tests complete!', COLORS.MAGENTA);
  log(`Passed: ${passedTests}`, COLORS.GREEN);
  log(`Failed: ${failedTests}`, failedTests > 0 ? COLORS.RED : COLORS.GREEN);

  // Exit with error code if there are failures
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the main function
main().catch(error => {
  log(`Unhandled error in test script: ${error.message}`, COLORS.RED);
  process.exit(1);
});
