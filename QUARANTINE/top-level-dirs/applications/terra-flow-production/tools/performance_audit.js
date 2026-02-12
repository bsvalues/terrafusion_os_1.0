const fs = require('fs');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const {URL} = require('url');
const path = require('path');

// Define the pages to test
const pagesToTest = [
  'http://localhost:5000/',
  'http://localhost:5000/map-viewer',
  'http://localhost:5000/assessment-map',
  'http://localhost:5000/dashboard'
];

async function runLighthouse(url) {
  // Launch Chrome
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  // Get Chrome's websocket endpoint for Lighthouse
  const endpoint = browser.wsEndpoint();
  const {port} = new URL(endpoint);
  
  // Run Lighthouse
  const {lhr} = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'info',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  });
  
  await browser.close();
  return lhr;
}

async function analyzePages() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const resultsDir = path.join(__dirname, '..', 'performance_reports', timestamp);
  
  // Create directory for reports
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  console.log('Starting performance analysis...');
  
  const summary = {
    timestamp,
    pages: []
  };
  
  for (const url of pagesToTest) {
    console.log(`Analyzing ${url}...`);
    try {
      const results = await runLighthouse(url);
      
      // Get page name from URL
      const pageName = new URL(url).pathname === '/' ? 'home' : new URL(url).pathname.substring(1);
      
      // Save full report
      const reportPath = path.join(resultsDir, `${pageName}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
      
      // Extract key metrics
      const metrics = {
        url,
        performance: results.categories.performance.score * 100,
        accessibility: results.categories.accessibility.score * 100,
        bestPractices: results.categories['best-practices'].score * 100,
        seo: results.categories.seo.score * 100,
        firstContentfulPaint: results.audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: results.audits['largest-contentful-paint'].numericValue,
        totalBlockingTime: results.audits['total-blocking-time'].numericValue,
        cumulativeLayoutShift: results.audits['cumulative-layout-shift'].numericValue,
        speedIndex: results.audits['speed-index'].numericValue
      };
      
      summary.pages.push(metrics);
      console.log(`Completed analysis for ${url}`);
    } catch (error) {
      console.error(`Error analyzing ${url}:`, error);
    }
  }
  
  // Save summary
  const summaryPath = path.join(resultsDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('Performance analysis complete!');
  console.log(`Reports saved to ${resultsDir}`);
  
  // Identify issues
  identifyIssues(summary);
}

function identifyIssues(summary) {
  console.log('\nPerformance Issues Summary:');
  console.log('===========================');
  
  for (const page of summary.pages) {
    console.log(`\nPage: ${page.url}`);
    
    if (page.performance < 90) {
      console.log('⚠️ Performance score below 90');
      
      if (page.firstContentfulPaint > 1000) {
        console.log(`  - First Contentful Paint is slow: ${Math.round(page.firstContentfulPaint)}ms (should be < 1000ms)`);
      }
      
      if (page.largestContentfulPaint > 2500) {
        console.log(`  - Largest Contentful Paint is slow: ${Math.round(page.largestContentfulPaint)}ms (should be < 2500ms)`);
      }
      
      if (page.totalBlockingTime > 200) {
        console.log(`  - Total Blocking Time is high: ${Math.round(page.totalBlockingTime)}ms (should be < 200ms)`);
      }
      
      if (page.cumulativeLayoutShift > 0.1) {
        console.log(`  - Cumulative Layout Shift is high: ${page.cumulativeLayoutShift.toFixed(2)} (should be < 0.1)`);
      }
    }
    
    if (page.accessibility < 90) {
      console.log('⚠️ Accessibility score below 90');
    }
    
    if (page.bestPractices < 90) {
      console.log('⚠️ Best Practices score below 90');
    }
    
    if (page.seo < 90) {
      console.log('⚠️ SEO score below 90');
    }
  }
  
  console.log('\nRecommendations:');
  console.log('================');
  console.log('1. Optimize image loading with lazy loading and proper sizing');
  console.log('2. Implement code splitting to reduce JavaScript bundle size');
  console.log('3. Add resource hints (preconnect, preload) for critical assets');
  console.log('4. Implement font loading optimization strategies');
  console.log('5. Review render-blocking resources and defer non-critical CSS/JS');
}

// Create directory for performance reports
const reportsDir = path.join(__dirname, '..', 'performance_reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Run the analysis
analyzePages().catch(error => {
  console.error('Error running performance analysis:', error);
  process.exit(1);
});