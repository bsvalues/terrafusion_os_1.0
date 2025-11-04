const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

// Pages to test
const pagesToTest = [
  'http://localhost:5000/',
  'http://localhost:5000/map-viewer',
  'http://localhost:5000/assessment-map',
  'http://localhost:5000/dashboard'
];

async function identifyRenderBlockingResources() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const resultsDir = path.join(__dirname, '..', 'performance_reports', 'render-blocking', timestamp);
  
  // Create directory for reports
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  console.log('Starting render-blocking resources analysis...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  
  const allResults = [];
  
  for (const url of pagesToTest) {
    console.log(`Analyzing ${url}...`);
    
    // Create a new page
    const page = await browser.newPage();
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Track all resources
    const resources = [];
    page.on('request', request => {
      resources.push({
        url: request.url(),
        resourceType: request.resourceType(),
        startTime: Date.now()
      });
      request.continue();
    });
    
    page.on('requestfinished', request => {
      const resource = resources.find(r => r.url === request.url());
      if (resource) {
        resource.endTime = Date.now();
        resource.duration = resource.endTime - resource.startTime;
      }
    });
    
    // Navigate to page
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Get page name
    const pageName = new URL(url).pathname === '/' ? 'home' : new URL(url).pathname.substring(1);
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigationStart = performance.getEntriesByType('navigation')[0].startTime;
      const firstPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime;
      const firstContentfulPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime;
      
      // Get all resource timings
      const resources = performance.getEntriesByType('resource').map(resource => {
        return {
          name: resource.name,
          entryType: resource.entryType,
          startTime: resource.startTime - navigationStart,
          duration: resource.duration,
          initiatorType: resource.initiatorType,
          nextHopProtocol: resource.nextHopProtocol,
          renderBlocking: resource.renderBlockingStatus || 'unknown'
        };
      });
      
      return {
        firstPaint: firstPaint - navigationStart,
        firstContentfulPaint: firstContentfulPaint - navigationStart,
        resources
      };
    });
    
    // Analyze CSS specificity
    const cssSpecificityIssues = await page.evaluate(() => {
      const issues = [];
      
      // Get all stylesheets
      const styleSheets = Array.from(document.styleSheets);
      
      for (const sheet of styleSheets) {
        try {
          // Only process same-origin stylesheets
          if (!sheet.href || sheet.href.startsWith(window.location.origin) || sheet.href.startsWith('/')) {
            const rules = Array.from(sheet.cssRules || []);
            
            // Check for high specificity selectors
            for (const rule of rules) {
              if (rule.selectorText) {
                // Very basic specificity calculation
                const idCount = (rule.selectorText.match(/#/g) || []).length;
                const classCount = (rule.selectorText.match(/\\./g) || []).length;
                const elementCount = rule.selectorText.split(/[#.:\[\]]/).filter(Boolean).length;
                
                const specificity = idCount * 100 + classCount * 10 + elementCount;
                
                // Check for complex selectors
                if (specificity > 100 || rule.selectorText.split(' ').length > 4) {
                  issues.push({
                    selector: rule.selectorText,
                    specificity,
                    length: rule.selectorText.length,
                    source: sheet.href || 'inline'
                  });
                }
              }
            }
          }
        } catch (e) {
          // CORS issues or other errors when accessing cross-origin stylesheets
          issues.push({
            error: true,
            message: e.message,
            source: sheet.href
          });
        }
      }
      
      return issues;
    });
    
    // Find potentially render-blocking resources
    const renderBlockingResources = resources.filter(resource => {
      const resourceUrl = new URL(resource.url);
      // Consider CSS and JS in the head as potentially render-blocking
      return (resource.resourceType === 'stylesheet' || 
              (resource.resourceType === 'script' && resource.url.includes('/static/js/'))) &&
             !resource.url.includes('async') && 
             !resource.url.includes('defer');
    });
    
    // Filter resources loaded before first paint
    const resourcesBeforeFirstPaint = performanceMetrics.resources.filter(resource => {
      return resource.startTime < performanceMetrics.firstPaint;
    });
    
    // Sort by start time
    resourcesBeforeFirstPaint.sort((a, b) => a.startTime - b.startTime);
    
    // Capture screenshot
    await page.screenshot({ path: path.join(resultsDir, `${pageName}.png`), fullPage: true });
    
    // Collect results
    const pageResults = {
      url,
      pageName,
      firstPaint: performanceMetrics.firstPaint,
      firstContentfulPaint: performanceMetrics.firstContentfulPaint,
      resourcesBeforeFirstPaint,
      renderBlockingResources: renderBlockingResources.map(r => ({
        url: r.url,
        resourceType: r.resourceType,
        duration: r.duration
      })),
      cssSpecificityIssues
    };
    
    allResults.push(pageResults);
    
    // Save individual page results
    fs.writeFileSync(
      path.join(resultsDir, `${pageName}.json`),
      JSON.stringify(pageResults, null, 2)
    );
    
    // Close tab
    await page.close();
    console.log(`Completed analysis for ${url}`);
  }
  
  // Close browser
  await browser.close();
  
  // Save full results
  fs.writeFileSync(
    path.join(resultsDir, 'summary.json'),
    JSON.stringify(allResults, null, 2)
  );
  
  console.log('Render-blocking resources analysis complete!');
  console.log(`Reports saved to ${resultsDir}`);
  
  // Analyze and provide recommendations
  analyzeRenderBlockingIssues(allResults);
}

function analyzeRenderBlockingIssues(results) {
  console.log('\nRender-Blocking Resources Summary:');
  console.log('=================================');
  
  for (const page of results) {
    console.log(`\nPage: ${page.url}`);
    console.log(`First Paint: ${page.firstPaint.toFixed(2)}ms`);
    console.log(`First Contentful Paint: ${page.firstContentfulPaint.toFixed(2)}ms`);
    
    if (page.renderBlockingResources.length > 0) {
      console.log(`Render-blocking resources (${page.renderBlockingResources.length}):`);
      
      page.renderBlockingResources.forEach(resource => {
        console.log(`  - [${resource.resourceType}] ${resource.url.split('/').pop()} (${resource.duration}ms)`);
      });
    }
    
    if (page.cssSpecificityIssues.length > 0) {
      console.log(`CSS specificity issues (${page.cssSpecificityIssues.length}):`);
      
      // Show only top 5 issues
      page.cssSpecificityIssues.slice(0, 5).forEach(issue => {
        if (issue.error) {
          console.log(`  - Error accessing ${issue.source}: ${issue.message}`);
        } else {
          console.log(`  - Selector: ${issue.selector.substring(0, 50)}${issue.selector.length > 50 ? '...' : ''} (specificity: ${issue.specificity})`);
        }
      });
      
      if (page.cssSpecificityIssues.length > 5) {
        console.log(`  - ... and ${page.cssSpecificityIssues.length - 5} more issues`);
      }
    }
  }
  
  console.log('\nRecommendations:');
  console.log('===============');
  console.log('1. Add "defer" attribute to non-critical scripts');
  console.log('2. Move non-critical CSS to style tags at the bottom of the page');
  console.log('3. Implement critical CSS by inlining important styles in the <head>');
  console.log('4. Reduce CSS specificity by simplifying selectors');
  console.log('5. Consider implementing resource hints:');
  console.log('   - Use <link rel="preconnect"> for external domains');
  console.log('   - Use <link rel="preload"> for critical assets');
  console.log('6. Implement font-display: swap for web fonts');
  console.log('7. Consider using CSS @import for non-critical stylesheets');
  console.log('8. Move third-party scripts to the bottom of the page or load asynchronously');
}

// Create directory for render-blocking reports
const reportsDir = path.join(__dirname, '..', 'performance_reports', 'render-blocking');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Run the analysis
identifyRenderBlockingResources().catch(error => {
  console.error('Error analyzing render-blocking resources:', error);
  process.exit(1);
});