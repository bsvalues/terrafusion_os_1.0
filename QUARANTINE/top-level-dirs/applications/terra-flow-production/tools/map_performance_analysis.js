const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

// Map pages to test
const mapPages = [
  {
    url: 'http://localhost:5000/map-viewer',
    name: 'map-viewer'
  },
  {
    url: 'http://localhost:5000/assessment-map',
    name: 'assessment-map'
  }
];

// Events to measure
const performanceEvents = [
  'domContentLoaded',
  'load',
  'networkIdle0',
  'firstPaint',
  'firstContentfulPaint',
  'largestContentfulPaint',
  'timeToInteractive'
];

async function measureMapPerformance() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const resultsDir = path.join(__dirname, '..', 'performance_reports', 'maps', timestamp);
  
  // Create directory for reports
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  console.log('Starting map performance analysis...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  
  const results = [];
  
  for (const page of mapPages) {
    console.log(`Analyzing ${page.name}...`);
    
    // Create a new page
    const tab = await browser.newPage();
    
    // Enable performance metrics
    await tab.coverage.startJSCoverage();
    await tab.coverage.startCSSCoverage();
    
    // Set up performance observer
    await tab.evaluateOnNewDocument(() => {
      window.performanceMetrics = [];
      
      // Track first paint and first contentful paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.performanceMetrics.push({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration
          });
        }
      });
      
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'resource', 'navigation'] });
      
      // Track JavaScript execution
      window.jsExecutionTimes = {};
      
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const startTime = performance.now();
        try {
          const result = await originalFetch.apply(this, args);
          return result;
        } finally {
          const endTime = performance.now();
          const url = args[0];
          window.jsExecutionTimes[url] = endTime - startTime;
        }
      };
      
      // Track map rendering specifically
      if (window.L && window.L.Map) {
        const originalAddLayer = L.Map.prototype.addLayer;
        L.Map.prototype.addLayer = function(layer) {
          const startTime = performance.now();
          const result = originalAddLayer.apply(this, arguments);
          const endTime = performance.now();
          
          if (!window.mapRenderingMetrics) {
            window.mapRenderingMetrics = [];
          }
          
          window.mapRenderingMetrics.push({
            layerType: layer.options ? layer.options.layerType || 'unknown' : 'unknown',
            renderTime: endTime - startTime
          });
          
          return result;
        };
      }
    });
    
    // Navigate to the page and wait for network idle
    const startTime = Date.now();
    await tab.goto(page.url, { waitUntil: 'networkidle0', timeout: 60000 });
    const loadTime = Date.now() - startTime;
    
    // Collect JavaScript coverage
    const jsCoverage = await tab.coverage.stopJSCoverage();
    const cssCoverage = await tab.coverage.stopCSSCoverage();
    
    // Extract JavaScript usage
    let jsUsed = 0;
    let jsTotal = 0;
    for (const entry of jsCoverage) {
      jsTotal += entry.text.length;
      
      for (const range of entry.ranges) {
        jsUsed += range.end - range.start - 1;
      }
    }
    
    // Extract CSS usage
    let cssUsed = 0;
    let cssTotal = 0;
    for (const entry of cssCoverage) {
      cssTotal += entry.text.length;
      
      for (const range of entry.ranges) {
        cssUsed += range.end - range.start - 1;
      }
    }
    
    // Get performance metrics
    const performanceMetrics = await tab.evaluate(() => {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        paint: performance.getEntriesByType('paint'),
        resources: performance.getEntriesByType('resource'),
        jsExecutionTimes: window.jsExecutionTimes || {},
        mapRenderingMetrics: window.mapRenderingMetrics || [],
        performanceMetrics: window.performanceMetrics || []
      };
    });
    
    // Capture screenshot
    await tab.screenshot({ path: path.join(resultsDir, `${page.name}.png`), fullPage: true });
    
    // Collect memory statistics
    const memoryInfo = await tab.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
    });
    
    // Close the page
    await tab.close();
    
    // Process results
    const pageResults = {
      page: page.name,
      url: page.url,
      loadTime,
      jsCoverage: {
        used: jsUsed,
        total: jsTotal,
        percentageUsed: (jsUsed / jsTotal * 100).toFixed(2)
      },
      cssCoverage: {
        used: cssUsed,
        total: cssTotal,
        percentageUsed: (cssUsed / cssTotal * 100).toFixed(2)
      },
      performanceMetrics,
      memoryInfo
    };
    
    results.push(pageResults);
    
    // Save individual page results
    fs.writeFileSync(
      path.join(resultsDir, `${page.name}.json`),
      JSON.stringify(pageResults, null, 2)
    );
    
    console.log(`Completed analysis for ${page.name}`);
  }
  
  // Close browser
  await browser.close();
  
  // Save aggregated results
  fs.writeFileSync(
    path.join(resultsDir, 'summary.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('Map performance analysis complete!');
  console.log(`Reports saved to ${resultsDir}`);
  
  // Analyze map-specific issues
  analyzeMapIssues(results);
}

function analyzeMapIssues(results) {
  console.log('\nMap Performance Issues Summary:');
  console.log('===============================');
  
  for (const page of results) {
    console.log(`\nPage: ${page.url}`);
    console.log(`Load Time: ${page.loadTime}ms`);
    
    // JavaScript analysis
    console.log(`JavaScript Coverage: ${page.jsCoverage.percentageUsed}% used (${formatBytes(page.jsCoverage.used)}/${formatBytes(page.jsCoverage.total)})`);
    if (page.jsCoverage.percentageUsed < 50) {
      console.log('⚠️ Low JavaScript usage efficiency - consider code splitting or removing unused code');
    }
    
    // CSS analysis
    console.log(`CSS Coverage: ${page.cssCoverage.percentageUsed}% used (${formatBytes(page.cssCoverage.used)}/${formatBytes(page.cssCoverage.total)})`);
    if (page.cssCoverage.percentageUsed < 50) {
      console.log('⚠️ Low CSS usage efficiency - consider optimizing CSS or implementing critical CSS');
    }
    
    // Map rendering analysis
    if (page.performanceMetrics.mapRenderingMetrics && page.performanceMetrics.mapRenderingMetrics.length > 0) {
      const totalMapRenderTime = page.performanceMetrics.mapRenderingMetrics.reduce((sum, metric) => sum + metric.renderTime, 0);
      console.log(`Map Rendering Time: ${totalMapRenderTime.toFixed(2)}ms for ${page.performanceMetrics.mapRenderingMetrics.length} layers`);
      
      // Check for slow layers
      const slowLayers = page.performanceMetrics.mapRenderingMetrics.filter(metric => metric.renderTime > 100);
      if (slowLayers.length > 0) {
        console.log(`⚠️ Slow map layers detected (${slowLayers.length}):`);
        slowLayers.forEach(layer => {
          console.log(`  - ${layer.layerType}: ${layer.renderTime.toFixed(2)}ms`);
        });
      }
    }
    
    // Memory analysis
    if (page.memoryInfo) {
      const heapUsagePercentage = (page.memoryInfo.usedJSHeapSize / page.memoryInfo.jsHeapSizeLimit * 100).toFixed(2);
      console.log(`Memory Usage: ${heapUsagePercentage}% (${formatBytes(page.memoryInfo.usedJSHeapSize)}/${formatBytes(page.memoryInfo.jsHeapSizeLimit)})`);
      
      if (heapUsagePercentage > 70) {
        console.log('⚠️ High memory usage - check for memory leaks or optimize data handling');
      }
    }
  }
  
  console.log('\nMap Performance Recommendations:');
  console.log('===============================');
  console.log('1. Implement clustering for large numbers of markers');
  console.log('2. Use vector tiles instead of traditional raster tiles where appropriate');
  console.log('3. Implement progressive loading of map features based on zoom level');
  console.log('4. Cache map data to improve loading time on subsequent visits');
  console.log('5. Consider using Web Workers for processing GeoJSON data');
  console.log('6. Optimize Leaflet custom layer rendering');
  console.log('7. Implement throttling for map events (zoom, pan) to reduce jank');
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Create directory for map performance reports
const reportsDir = path.join(__dirname, '..', 'performance_reports', 'maps');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Run the analysis
measureMapPerformance().catch(error => {
  console.error('Error running map performance analysis:', error);
  process.exit(1);
});