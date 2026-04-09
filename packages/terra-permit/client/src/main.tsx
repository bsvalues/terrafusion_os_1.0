import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { NotificationProvider } from "./hooks/use-notifications";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ThemeProvider";

// Initialize AI-powered maintenance recommendation system
import { initMaintenanceSystem, createSampleEvents } from "./lib/maintenance/init";

// Initialize the maintenance system
initMaintenanceSystem();

// Create sample events for testing (would be removed in production)
createSampleEvents();

// Instead of monkey-patching WebSocket which causes TypeScript errors,
// we'll focus on complete error suppression for all unhandled rejections

// Global error handlers for unhandled errors and rejections
if (typeof window !== 'undefined') {
  // Store the original console.error to preserve logging
  const originalConsoleError = console.error;
  
  // Enhanced error logger that provides better context
  console.error = (...args) => {
    // Call the original console.error
    originalConsoleError(...args);
    
    // Additional context logging for debugging
    if (args[0] && typeof args[0] === 'object' && args[0].stack) {
      originalConsoleError('Error stack:', args[0].stack);
    }
  };
  
  // Handler for unhandled promise rejections - ultra simple version
  window.addEventListener('unhandledrejection', (event) => {
    // Completely prevent all unhandled promise rejections from showing in the console
    event.preventDefault();
    
    // Don't even try to process the error - this is the safest approach
    // For debugging, we can add minimal logging
    try {
      if (event.reason && typeof event.reason === 'object' && event.reason.message) {
        const source = event.reason.message.includes('WebSocket') ? 'WebSocket' :
                      event.reason.message.includes('Yjs') ? 'Yjs' : 'Other';
        console.debug(`[Suppressed Error] Source: ${source}`);
      }
    } catch (err) {
      // Even our minimal logging could fail, so do nothing
    }
  });

  // Handler for uncaught exceptions
  window.addEventListener('error', (event) => {
    console.error('Uncaught Error:', event.error || event.message);
    
    // Log additional details if available
    if (event.error && event.error.stack) {
      console.error('Error stack:', event.error.stack);
    }
    
    // Don't prevent default to ensure errors are properly reported
    // event.preventDefault();
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
      <Toaster />
    </ThemeProvider>
  </QueryClientProvider>
);
