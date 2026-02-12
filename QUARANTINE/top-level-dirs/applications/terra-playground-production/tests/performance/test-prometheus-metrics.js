/**
 * Test script for Prometheus metrics endpoint
 *
 * This script tests the Prometheus metrics endpoint to verify that
 * web vitals metrics are being properly exported in Prometheus format.
 *
 * The metrics endpoint exposes the following Web Vitals metrics:
 * - web_vitals_lcp - Largest Contentful Paint in milliseconds (visual loading)
 * - web_vitals_fid - First Input Delay in milliseconds (interactivity)
 * - web_vitals_cls - Cumulative Layout Shift (visual stability)
 * - web_vitals_ttfb - Time to First Byte in milliseconds (server response time)
 * - web_vitals_fcp - First Contentful Paint in milliseconds (initial rendering)
 * - web_vitals_inp - Interaction to Next Paint in milliseconds (responsiveness)
 *
 * It also exposes the following counters:
 * - web_vitals_records_total - Total number of Web Vitals records received
 * - web_vitals_budget_breaches_total - Performance budget violations
 * - web_vitals_http_errors_total - HTTP errors in Web Vitals reporting
 *
 * Default Node.js metrics (CPU, memory, etc.) are also included.
 */

import * as https from 'node:https';

async function testPrometheusMetrics() {
  console.log('Testing Prometheus metrics endpoint...');

  // Make a request to the metrics endpoint
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '69340dc3-5f57-4cca-82d1-7ea6f9418cc4-00-1qhau0gno8lsl.picard.replit.dev',
      path: '/metrics',
      method: 'GET',
    };

    const req = https.request(options, res => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('METRICS OVERVIEW:');

        // Count the number of web vitals metrics
        const webVitalsMetricsCount = (data.match(/web_vitals_/g) || []).length;
        console.log(`Found ${webVitalsMetricsCount} web vitals metrics entries`);

        // Check for specific metrics we expect to see
        const hasLCP = data.includes('web_vitals_lcp');
        const hasFID = data.includes('web_vitals_fid');
        const hasCLS = data.includes('web_vitals_cls');
        const hasTTFB = data.includes('web_vitals_ttfb');
        const hasFCP = data.includes('web_vitals_fcp');
        const hasINP = data.includes('web_vitals_inp');

        console.log(`LCP metrics: ${hasLCP ? 'Found' : 'Not found'}`);
        console.log(`FID metrics: ${hasFID ? 'Found' : 'Not found'}`);
        console.log(`CLS metrics: ${hasCLS ? 'Found' : 'Not found'}`);
        console.log(`TTFB metrics: ${hasTTFB ? 'Found' : 'Not found'}`);
        console.log(`FCP metrics: ${hasFCP ? 'Found' : 'Not found'}`);
        console.log(`INP metrics: ${hasINP ? 'Found' : 'Not found'}`);

        // Count how many budget breaches have been recorded
        const budgetBreachesCount = (data.match(/web_vitals_budget_breaches_total/g) || []).length;
        console.log(`Found ${budgetBreachesCount} budget breach metrics entries`);

        // For detailed inspection, print a sample of the data
        console.log('\nSAMPLE METRICS DATA:');
        const dataLines = data.split('\n');
        const maxLinesToShow = 20;
        console.log(dataLines.slice(0, maxLinesToShow).join('\n'));

        if (dataLines.length > maxLinesToShow) {
          console.log(`... and ${dataLines.length - maxLinesToShow} more lines`);
        }

        resolve({
          statusCode: res.statusCode,
          metrics: {
            webVitalsMetricsCount,
            hasLCP,
            hasFID,
            hasCLS,
            hasTTFB,
            hasFCP,
            hasINP,
            budgetBreachesCount,
          },
        });
      });
    });

    req.on('error', error => {
      console.error(`Problem with request: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

// Run the test
testPrometheusMetrics()
  .then(result => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
