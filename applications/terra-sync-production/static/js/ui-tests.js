/**
 * Terrafusion Platform - UI Tests
 * 
 * This file contains tests to validate the UI improvements implemented
 * according to the Senior Engineer's action plan.
 */

// Initialize test suite when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only run tests in development/test mode
  if (window.location.hostname !== 'localhost' && !window.location.search.includes('runTests=true')) {
    return;
  }
  
  console.log('Running Terrafusion Platform UI tests...');
  
  // Configure test utilities
  if (window.Terrafusion && window.Terrafusion.UITester) {
    window.Terrafusion.UITester.configure({
      logToConsole: true,
      visualFeedback: true
    });
    
    // Clear previous results
    window.Terrafusion.UITester.clearResults();
    
    // Run tests based on current page
    runPageSpecificTests();
    
    // Show results summary after 1 second
    setTimeout(() => {
      const results = window.Terrafusion.UITester.getResults();
      
      console.log('Terrafusion Platform UI Test Results:');
      console.log(`Passed: ${results.passed}, Failed: ${results.failed}, Warnings: ${results.warnings}`);
      
      if (results.failed > 0) {
        console.error('Failed tests:');
        results.details.failed.forEach(test => {
          console.error(`- ${test.name}: ${test.message}`);
        });
      }
      
      // Show test results on page
      showTestResults(results);
    }, 1000);
  } else {
    console.error('Terrafusion UI Tester not available');
  }
});

/**
 * Run tests specific to the current page
 */
function runPageSpecificTests() {
  const currentPage = document.body.getAttribute('data-page') || '';
  
  console.log(`Running tests for page: ${currentPage}`);
  
  // Navigation tests (run on all pages)
  runNavigationTests();
  
  // Page-specific tests
  switch (currentPage) {
    case 'dashboard':
      runDashboardTests();
      break;
    case 'gis-export':
      runGisExportTests();
      break;
    case 'sync-operations':
      runSyncOperationsTests();
      break;
    // Add more page-specific tests as needed
  }
}

/**
 * Run navigation tests
 */
function runNavigationTests() {
  if (!window.Terrafusion || !window.Terrafusion.UITester) return;
  
  const tester = window.Terrafusion.UITester;
  
  // Test that navigation menu has correct active state
  tester.runTest('Navigation - Active state', function() {
    const currentUrl = window.location.pathname;
    const navLinks = document.querySelectorAll('.tf-nav-link');
    
    // No navigation links found
    if (navLinks.length === 0) {
      return {
        success: true,
        message: 'No navigation links found to test'
      };
    }
    
    // Find active link
    const activeLink = Array.from(navLinks).find(link => link.classList.contains('active'));
    
    // Check if active link points to current URL
    if (activeLink && !currentUrl.startsWith(activeLink.getAttribute('href'))) {
      return {
        success: false,
        message: `Active link (${activeLink.getAttribute('href')}) doesn't match current URL (${currentUrl})`
      };
    }
    
    return true;
  });
  
  // Test that breadcrumbs are displayed correctly
  tester.runTest('Navigation - Breadcrumbs', function() {
    const breadcrumbs = document.querySelector('.tf-breadcrumb');
    
    // No breadcrumbs found (might be expected on some pages)
    if (!breadcrumbs) {
      return {
        success: true,
        message: 'No breadcrumbs found to test'
      };
    }
    
    // Check that first breadcrumb is "Home"
    const firstBreadcrumb = breadcrumbs.querySelector('.tf-breadcrumb-item:first-child');
    if (!firstBreadcrumb || !firstBreadcrumb.textContent.includes('Home')) {
      return {
        success: false,
        message: 'First breadcrumb should be "Home"'
      };
    }
    
    // Check that last breadcrumb is active
    const lastBreadcrumb = breadcrumbs.querySelector('.tf-breadcrumb-item:last-child');
    if (!lastBreadcrumb || !lastBreadcrumb.classList.contains('active')) {
      return {
        success: false,
        message: 'Last breadcrumb should be active'
      };
    }
    
    return true;
  });
}

/**
 * Run dashboard tests
 */
function runDashboardTests() {
  if (!window.Terrafusion || !window.Terrafusion.UITester) return;
  
  const tester = window.Terrafusion.UITester;
  
  // Test system status indicators
  tester.runTest('Dashboard - System status indicators', function() {
    const statusIndicators = document.querySelectorAll('.tf-status-indicator');
    
    // No status indicators found
    if (statusIndicators.length === 0) {
      return {
        success: false,
        message: 'No system status indicators found'
      };
    }
    
    // Check that each indicator has a status class
    for (const indicator of statusIndicators) {
      const hasStatusClass = Array.from(indicator.classList)
        .some(cls => cls.startsWith('tf-status-'));
      
      if (!hasStatusClass) {
        return {
          success: false,
          message: 'Status indicator missing status class'
        };
      }
    }
    
    return true;
  });
}

/**
 * Run GIS Export tests
 */
function runGisExportTests() {
  if (!window.Terrafusion || !window.Terrafusion.UITester) return;
  
  const tester = window.Terrafusion.UITester;
  
  // Test form validation
  tester.runTest('GIS Export - Form validation', function() {
    const form = document.getElementById('gis-export-form');
    
    // No form found
    if (!form) {
      return {
        success: false,
        message: 'GIS Export form not found'
      };
    }
    
    // Test that required fields have proper validation
    const requiredFields = form.querySelectorAll('[required]');
    
    for (const field of requiredFields) {
      // Ensure field has proper event listeners
      const events = getEventListeners(field);
      const hasInputListener = events.input && events.input.length > 0;
      const hasBlurListener = events.blur && events.blur.length > 0;
      
      if (!hasInputListener && !hasBlurListener) {
        return {
          success: false,
          message: `Required field ${field.name || field.id} missing validation event listeners`
        };
      }
    }
    
    // Test that multi-step navigation works
    const nextButtons = form.querySelectorAll('.next-step');
    const prevButtons = form.querySelectorAll('.prev-step');
    
    if (nextButtons.length === 0 || prevButtons.length === 0) {
      return {
        success: false,
        message: 'Multi-step navigation buttons not found'
      };
    }
    
    return true;
  });
  
  // Test job status updates
  tester.runTest('GIS Export - Job status updates', function() {
    const jobsList = document.getElementById('recent-jobs-list');
    
    // No jobs list found
    if (!jobsList) {
      return {
        success: false,
        message: 'Jobs list not found'
      };
    }
    
    // Test that jobs are displayed with proper status indicators
    const jobItems = jobsList.querySelectorAll('.job-item');
    
    // No need to test if no jobs are available
    if (jobItems.length === 0) {
      return {
        success: true,
        message: 'No jobs available to test'
      };
    }
    
    // Each job should have a status badge
    for (const job of jobItems) {
      const statusBadge = job.querySelector('.badge');
      
      if (!statusBadge) {
        return {
          success: false,
          message: 'Job item missing status badge'
        };
      }
    }
    
    return true;
  });
}

/**
 * Run Sync Operations tests
 */
function runSyncOperationsTests() {
  if (!window.Terrafusion || !window.Terrafusion.UITester) return;
  
  const tester = window.Terrafusion.UITester;
  
  // Add sync operations specific tests here
}

/**
 * Show test results on page
 */
function showTestResults(results) {
  // Create results container if it doesn't exist
  let resultsContainer = document.getElementById('tf-test-results');
  
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'tf-test-results';
    
    // Style the container
    Object.assign(resultsContainer.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: '9999',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '10px',
      maxWidth: '300px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
      fontSize: '12px',
      fontFamily: 'monospace'
    });
    
    document.body.appendChild(resultsContainer);
  }
  
  // Create result content
  resultsContainer.innerHTML = `
    <div style="margin-bottom: 5px; font-weight: bold;">UI Test Results</div>
    <div style="color: green;">✓ Passed: ${results.passed}</div>
    <div style="color: red;">✗ Failed: ${results.failed}</div>
    <div style="color: orange;">⚠ Warnings: ${results.warnings}</div>
    <div style="margin-top: 5px;">
      <button id="tf-show-test-details" style="font-size: 11px; padding: 2px 5px;">Show Details</button>
      <button id="tf-close-test-results" style="font-size: 11px; padding: 2px 5px; margin-left: 5px;">Close</button>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('tf-close-test-results').addEventListener('click', () => {
    resultsContainer.remove();
  });
  
  document.getElementById('tf-show-test-details').addEventListener('click', () => {
    showTestDetails(results);
  });
}

/**
 * Show detailed test results
 */
function showTestDetails(results) {
  // Create details container
  let detailsContainer = document.getElementById('tf-test-details');
  
  if (!detailsContainer) {
    detailsContainer = document.createElement('div');
    detailsContainer.id = 'tf-test-details';
    
    // Style the container
    Object.assign(detailsContainer.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '10000',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '15px',
      maxWidth: '80%',
      maxHeight: '80%',
      overflow: 'auto',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
      fontSize: '14px'
    });
    
    document.body.appendChild(detailsContainer);
  }
  
  // Create details content
  let detailsContent = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">Test Details</h3>
      <button id="tf-close-test-details" style="border: none; background: none; font-size: 20px; cursor: pointer;">×</button>
    </div>
  `;
  
  // Add failed tests
  if (results.details.failed.length > 0) {
    detailsContent += `<div style="margin-bottom: 15px;"><h4 style="color: red;">Failed Tests</h4><ul>`;
    results.details.failed.forEach(test => {
      detailsContent += `<li><strong>${test.name}</strong>: ${test.message}</li>`;
    });
    detailsContent += `</ul></div>`;
  }
  
  // Add warnings
  if (results.details.warnings.length > 0) {
    detailsContent += `<div style="margin-bottom: 15px;"><h4 style="color: orange;">Warnings</h4><ul>`;
    results.details.warnings.forEach(test => {
      detailsContent += `<li><strong>${test.name}</strong>: ${test.message}</li>`;
    });
    detailsContent += `</ul></div>`;
  }
  
  // Add passed tests
  if (results.details.passed.length > 0) {
    detailsContent += `<div><h4 style="color: green;">Passed Tests</h4><ul>`;
    results.details.passed.forEach(test => {
      detailsContent += `<li><strong>${test.name}</strong>: ${test.message}</li>`;
    });
    detailsContent += `</ul></div>`;
  }
  
  // Set content
  detailsContainer.innerHTML = detailsContent;
  
  // Add event listener to close button
  document.getElementById('tf-close-test-details').addEventListener('click', () => {
    detailsContainer.remove();
  });
}

/**
 * Utility function to get event listeners (mock implementation)
 * Note: This is a limited implementation since browsers don't expose event listeners directly
 */
function getEventListeners(element) {
  // This is a mock implementation since we can't actually get the event listeners
  // In a real environment, we'd need to use a more sophisticated approach
  return {
    'input': element.oninput ? [{ listener: element.oninput }] : [],
    'blur': element.onblur ? [{ listener: element.onblur }] : [],
    'change': element.onchange ? [{ listener: element.onchange }] : []
  };
}