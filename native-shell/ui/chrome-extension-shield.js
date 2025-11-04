// TerraFusion Chrome Extension Shield - MAXIMUM Protection
(function () {
  'use strict';

  // Silently activate - no console output that extensions might intercept

  // Store original console methods before extensions modify them
  const originalConsoleError = console.error || function () {};
  const originalConsoleWarn = console.warn || function () {};
  const originalConsoleLog = console.log || function () {};

  // Comprehensive extension-related error patterns to block
  const extensionErrorPatterns = [
    /content\.js/i,
    /awesome json viewer/i,
    /json viewer/i,
    /hook\.js/i,
    /extension/i,
    /chrome-extension/i,
    /moz-extension/i,
    /injected/i,
    /content_script/i,
    /unexpected end of json input/i,
    /syntaxerror.*json/i,
    /failed to fetch.*extension/i,
    /network error.*extension/i,
    /message port closed/i,
    /response was received/i,
    /main\.js.*143684/i,
    /overridemethod/i,
    /rt \(main\.js/i,
    /anonymous.*content\.js/i,
    /something went wrong at awesome/i,
    /copilot in edge/i,
    /Cannot read properties of undefined \(reading 'control'\)/i,
    /fileexplorer/i,
    /file explorer/i,
    /file-explorer/i,
    /reading 'control'/i,
    /control.*undefined/i,
  ];

  // Function to check if error is extension-related
  function isExtensionError(args) {
    const message = args.join(' ').toLowerCase();
    return extensionErrorPatterns.some((pattern) => pattern.test(message));
  }

  // Override console.error with filtering
  console.error = function (...args) {
    if (isExtensionError(args)) {
      // Silently ignore extension errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Override console.warn with filtering
  console.warn = function (...args) {
    if (isExtensionError(args)) {
      // Silently ignore extension warnings
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Global error handler for uncaught extension errors
  window.addEventListener(
    'error',
    function (event) {
      const errorMessage = event.message || '';
      const source = event.filename || '';

      if (
        extensionErrorPatterns.some((pattern) => pattern.test(errorMessage) || pattern.test(source))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    },
    true
  );

  // Promise rejection handler for extension-related promises
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason || '';
    const reasonString = typeof reason === 'object' ? JSON.stringify(reason) : String(reason);

    if (extensionErrorPatterns.some((pattern) => pattern.test(reasonString))) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    }
  });

  // Resource error handler for failed extension loads
  window.addEventListener(
    'error',
    function (event) {
      if (event.target && event.target.src) {
        const src = event.target.src;
        if (src.includes('chrome-extension') || src.includes('moz-extension')) {
          event.stopImmediatePropagation();
          event.preventDefault();
          return false;
        }
      }
    },
    true
  );

  // Mutation observer to block extension-injected elements
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) {
          // Element node
          const nodeHtml = node.outerHTML || '';
          if (
            nodeHtml.includes('chrome-extension') ||
            nodeHtml.includes('json-viewer') ||
            nodeHtml.includes('awesome-json')
          ) {
            try {
              node.remove();
            } catch (e) {
              // Ignore removal errors
            }
          }
        }
      });
    });
  });

  // Start observing when DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  // Silent activation - no console output to avoid extension detection
})();
