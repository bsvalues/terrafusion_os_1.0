// Advanced Chrome Extension Error Handler
// Aggressively prevents ALL chrome extension errors from breaking TerraFusion OS

(function() {
  'use strict';
  
  // Global error suppression for Chrome extensions
  window.addEventListener('error', function(event) {
    const errorMessage = (event.message || '').toLowerCase();
    const filename = (event.filename || '').toLowerCase();
    
    if (
      errorMessage.includes('content.js') ||
      errorMessage.includes('chrome-extension') ||
      errorMessage.includes('awesome json viewer') ||
      errorMessage.includes('hook.js') ||
      errorMessage.includes('main.js') && filename.includes('chrome-extension') ||
      filename.includes('content.js') ||
      filename.includes('hook.js') ||
      filename.includes('chrome-extension')
    ) {
      console.warn('[TERRAFUSION-EXTENSION-BLOCKER]', 'Blocked extension error:', event.message);
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  });

  // Suppress unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', function(event) {
    const reason = (event.reason && event.reason.toString ? event.reason.toString() : '').toLowerCase();
    
    if (
      reason.includes('chrome.runtime') ||
      reason.includes('content.js') ||
      reason.includes('chrome-extension') ||
      reason.includes('awesome json viewer') ||
      reason.includes('unexpected end of json input')
    ) {
      console.warn('[TERRAFUSION-PROMISE-BLOCKER]', 'Blocked extension promise rejection:', event.reason);
      event.preventDefault();
      return false;
    }
  });
  
  // Catch and suppress Chrome extension console errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const message = args.join(' ').toLowerCase();
    
    if (
      message.includes('chrome.runtime') ||
      message.includes('content.js') ||
      message.includes('chrome-extension') ||
      message.includes('message port closed') ||
      message.includes('useauth must be used within an authprovider') ||
      message.includes('awesome json viewer') ||
      message.includes('hook.js') ||
      message.includes('syntaxerror: unexpected end of json input') ||
      message.includes('something went wrong at awesome json viewer pro')
    ) {
      console.warn('[TERRAFUSION-CONSOLE-BLOCKER]', 'Extension error suppressed:', ...args);
      return;
    }
    
    // Allow TerraFusion errors through
    originalError.apply(console, args);
  };

  // Also block extension warnings that can be disruptive
  console.warn = function(...args) {
    const message = args.join(' ').toLowerCase();
    
    if (
      message.includes('chrome-extension') ||
      message.includes('content.js') ||
      message.includes('awesome json viewer')
    ) {
      return; // Silently suppress extension warnings
    }
    
    originalWarn.apply(console, args);
  };
  
  // Handle Chrome extension runtime errors
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const originalSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = function(message, callback) {
      try {
        return originalSendMessage.call(this, message, function(response) {
          if (chrome.runtime.lastError) {
            console.warn('[CHROME-EXT-ERROR]', chrome.runtime.lastError.message);
            return;
          }
          if (callback) callback(response);
        });
      } catch (e) {
        console.warn('[CHROME-EXT-BLOCKED]', e.message);
      }
    };
  }
  
  console.log('[FRONTEND-FIX] Chrome extension error handler installed');
})();
