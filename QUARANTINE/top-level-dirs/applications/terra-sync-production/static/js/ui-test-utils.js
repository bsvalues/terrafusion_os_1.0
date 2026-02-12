/**
 * Terrafusion Platform - UI Test Utilities
 * 
 * This module provides utilities for testing the frontend UI components,
 * user flows, and data state transitions.
 */

const TerraFusionUITester = (function() {
  // Test results storage
  const testResults = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  // Test configuration
  let config = {
    logToConsole: true,
    visualFeedback: true,
    waitTimeout: 5000
  };
  
  /**
   * Run a single test
   */
  function runTest(name, testFunction) {
    try {
      console.log(`Running test: ${name}`);
      const result = testFunction();
      
      if (result === true || (result && result.success)) {
        logPass(name, result.message || 'Test passed');
        return true;
      } else if (result === false) {
        logFail(name, 'Test failed');
        return false;
      } else if (result && !result.success) {
        logFail(name, result.message || 'Test failed');
        return false;
      }
    } catch (error) {
      logFail(name, `Test error: ${error.message}`);
      console.error(`Test error in "${name}":`, error);
      return false;
    }
  }
  
  /**
   * Run a collection of tests
   */
  function runTestSuite(suiteName, tests) {
    console.group(`Test Suite: ${suiteName}`);
    let passCount = 0;
    let failCount = 0;
    
    for (const testName in tests) {
      if (runTest(`${suiteName}: ${testName}`, tests[testName])) {
        passCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`${suiteName} Results: ${passCount} passed, ${failCount} failed`);
    console.groupEnd();
    
    return {
      success: failCount === 0,
      passCount,
      failCount,
      message: `${passCount} passed, ${failCount} failed`
    };
  }
  
  /**
   * Log a passing test
   */
  function logPass(name, message = 'Test passed') {
    testResults.passed.push({ name, message, timestamp: new Date() });
    
    if (config.logToConsole) {
      console.log(`%c✓ PASS: ${name}`, 'color: green', message);
    }
    
    if (config.visualFeedback) {
      showTestFeedback(name, message, 'pass');
    }
  }
  
  /**
   * Log a failing test
   */
  function logFail(name, message = 'Test failed') {
    testResults.failed.push({ name, message, timestamp: new Date() });
    
    if (config.logToConsole) {
      console.error(`%c✗ FAIL: ${name}`, 'color: red', message);
    }
    
    if (config.visualFeedback) {
      showTestFeedback(name, message, 'fail');
    }
  }
  
  /**
   * Log a warning
   */
  function logWarning(name, message) {
    testResults.warnings.push({ name, message, timestamp: new Date() });
    
    if (config.logToConsole) {
      console.warn(`%c⚠ WARNING: ${name}`, 'color: orange', message);
    }
    
    if (config.visualFeedback) {
      showTestFeedback(name, message, 'warning');
    }
  }
  
  /**
   * Show visual feedback for test results
   */
  function showTestFeedback(name, message, type) {
    const feedbackContainer = document.getElementById('tf-test-feedback');
    
    // Create feedback container if it doesn't exist
    if (!feedbackContainer) {
      const container = document.createElement('div');
      container.id = 'tf-test-feedback';
      
      // Style the container
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        maxWidth: '400px',
        maxHeight: '300px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '5px',
        padding: '10px'
      });
      
      document.body.appendChild(container);
    }
    
    // Get the container (now it definitely exists)
    const container = document.getElementById('tf-test-feedback');
    
    // Create feedback message
    const feedbackElement = document.createElement('div');
    
    // Style based on type
    switch (type) {
      case 'pass':
        feedbackElement.style.color = '#4CAF50';
        break;
      case 'fail':
        feedbackElement.style.color = '#F44336';
        break;
      case 'warning':
        feedbackElement.style.color = '#FF9800';
        break;
    }
    
    // Format the message
    feedbackElement.innerHTML = `
      <div style="margin-bottom: 8px;">
        <span style="font-weight: bold;">
          ${type === 'pass' ? '✓' : type === 'fail' ? '✗' : '⚠'} 
          ${name}:
        </span>
        <span>${message}</span>
      </div>
    `;
    
    // Add to container
    container.appendChild(feedbackElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      feedbackElement.remove();
      
      // If container is empty, remove it
      if (container.children.length === 0) {
        container.remove();
      }
    }, 5000);
  }
  
  /**
   * Get test results summary
   */
  function getResults() {
    return {
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      warnings: testResults.warnings.length,
      details: {
        passed: testResults.passed,
        failed: testResults.failed,
        warnings: testResults.warnings
      },
      success: testResults.failed.length === 0
    };
  }
  
  /**
   * Clear test results
   */
  function clearResults() {
    testResults.passed = [];
    testResults.failed = [];
    testResults.warnings = [];
  }
  
  /**
   * Wait for an element to be present in the DOM
   */
  async function waitForElement(selector, timeout = config.waitTimeout) {
    return new Promise((resolve, reject) => {
      // Element already exists
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        return;
      }
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: ${selector}`));
      }, timeout);
      
      // Set up mutation observer
      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          clearTimeout(timeoutId);
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
  
  /**
   * Wait for a condition to be true
   */
  async function waitForCondition(condition, timeout = config.waitTimeout) {
    return new Promise((resolve, reject) => {
      // Condition already met
      if (condition()) {
        resolve(true);
        return;
      }
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for condition'));
      }, timeout);
      
      // Check condition periodically
      const checkInterval = setInterval(() => {
        if (condition()) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    });
  }
  
  /**
   * Test a user workflow by sequence of actions
   */
  async function testUserFlow(flowName, steps) {
    console.group(`Testing User Flow: ${flowName}`);
    let currentStep = 0;
    
    try {
      for (const step of steps) {
        console.log(`Step ${currentStep + 1}: ${step.name}`);
        
        if (step.action) {
          await step.action();
        }
        
        if (step.validation) {
          const validationResult = await step.validation();
          
          if (validationResult === false) {
            logFail(`${flowName} - Step ${currentStep + 1}: ${step.name}`, 'Validation failed');
            console.groupEnd();
            return false;
          } else if (validationResult && !validationResult.success) {
            logFail(`${flowName} - Step ${currentStep + 1}: ${step.name}`, validationResult.message || 'Validation failed');
            console.groupEnd();
            return false;
          }
        }
        
        logPass(`${flowName} - Step ${currentStep + 1}: ${step.name}`);
        currentStep++;
      }
      
      console.log(`User flow "${flowName}" completed successfully`);
      console.groupEnd();
      return true;
    } catch (error) {
      logFail(`${flowName} - Step ${currentStep + 1}: ${steps[currentStep]?.name || 'Unknown step'}`, `Error: ${error.message}`);
      console.error(`Error in user flow "${flowName}" at step ${currentStep + 1}:`, error);
      console.groupEnd();
      return false;
    }
  }
  
  /**
   * Test navigation between pages
   */
  function testNavigation(startPage, links) {
    return testUserFlow(`Navigation from ${startPage}`, links.map(link => ({
      name: `Navigate to ${link.url}`,
      action: () => {
        const linkElement = document.querySelector(link.selector);
        if (!linkElement) {
          throw new Error(`Link element not found: ${link.selector}`);
        }
        
        linkElement.click();
      },
      validation: async () => {
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for expected url pattern
        const urlMatches = link.urlPattern
          ? new RegExp(link.urlPattern).test(window.location.href)
          : window.location.href.includes(link.url);
        
        if (!urlMatches) {
          return {
            success: false,
            message: `URL does not match expected pattern. Current: ${window.location.href}, Expected: ${link.urlPattern || link.url}`
          };
        }
        
        // Check for expected element on the page
        if (link.expectedElement) {
          try {
            await waitForElement(link.expectedElement);
          } catch (error) {
            return {
              success: false,
              message: `Expected element not found: ${link.expectedElement}`
            };
          }
        }
        
        return true;
      }
    })));
  }
  
  /**
   * Test a form submission
   */
  function testFormSubmission(formSelector, inputData, submitButtonSelector, validationFunction) {
    return testUserFlow(`Form submission: ${formSelector}`, [
      {
        name: 'Fill form fields',
        action: () => {
          const form = document.querySelector(formSelector);
          if (!form) {
            throw new Error(`Form not found: ${formSelector}`);
          }
          
          // Fill form fields
          for (const fieldName in inputData) {
            const field = form.elements[fieldName];
            if (!field) {
              throw new Error(`Form field not found: ${fieldName}`);
            }
            
            // Handle different field types
            if (field.type === 'checkbox' || field.type === 'radio') {
              field.checked = !!inputData[fieldName];
            } else {
              field.value = inputData[fieldName];
              
              // Trigger change event
              const event = new Event('change', { bubbles: true });
              field.dispatchEvent(event);
            }
          }
        }
      },
      {
        name: 'Submit form',
        action: () => {
          const submitButton = document.querySelector(submitButtonSelector);
          if (!submitButton) {
            throw new Error(`Submit button not found: ${submitButtonSelector}`);
          }
          
          submitButton.click();
        }
      },
      {
        name: 'Validate form submission',
        validation: async () => {
          // Wait for form processing
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (validationFunction) {
            return validationFunction();
          }
          
          return true;
        }
      }
    ]);
  }
  
  /**
   * Test data state changes
   */
  function testDataStateChange(actionFunction, expectedStateChange, stateAccessFunction) {
    return async function() {
      // Get initial state
      const initialState = stateAccessFunction ? stateAccessFunction() : 
                          (window.Terrafusion && window.Terrafusion.state ? 
                           window.Terrafusion.state.getAll() : null);
      
      if (!initialState) {
        return {
          success: false,
          message: 'Could not access initial state'
        };
      }
      
      // Perform action
      await actionFunction();
      
      // Wait for state change
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get updated state
      const updatedState = stateAccessFunction ? stateAccessFunction() : 
                         (window.Terrafusion && window.Terrafusion.state ? 
                          window.Terrafusion.state.getAll() : null);
      
      if (!updatedState) {
        return {
          success: false,
          message: 'Could not access updated state'
        };
      }
      
      // Validate state changes
      for (const key in expectedStateChange) {
        if (updatedState[key] !== expectedStateChange[key]) {
          return {
            success: false,
            message: `State mismatch for key "${key}". Expected: ${expectedStateChange[key]}, Actual: ${updatedState[key]}`
          };
        }
      }
      
      return {
        success: true,
        message: 'State change validated successfully'
      };
    };
  }
  
  /**
   * Configure the test utilities
   */
  function configure(options) {
    config = {
      ...config,
      ...options
    };
  }
  
  // Public API
  return {
    runTest,
    runTestSuite,
    getResults,
    clearResults,
    logPass,
    logFail,
    logWarning,
    waitForElement,
    waitForCondition,
    testUserFlow,
    testNavigation,
    testFormSubmission,
    testDataStateChange,
    configure
  };
})();

// Export to global namespace
window.Terrafusion = window.Terrafusion || {};
window.Terrafusion.UITester = TerraFusionUITester;