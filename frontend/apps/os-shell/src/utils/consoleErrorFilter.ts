/**
 * TerraFusion Elite Console Error Filter
 * Suppresses noise from browser extensions and external libraries
 * Maintains clean console for development excellence
 */

interface ConsoleError {
  message: string;
  source?: string;
  filename?: string;
  stack?: string;
}

class TerraFusionConsoleFilter {
  private originalError: typeof console.error;
  private originalWarn: typeof console.warn;
  private isActive = false;

  // Patterns to filter out - external extension noise
  private filterPatterns = [
    /content_script\.js/,
    /proxy\.js/,
    /chrome-extension:/,
    /moz-extension:/,
    /Attempting to use a disconnected port object/,
    /Cannot read properties of undefined \(reading 'control'\)/,
    /shouldOfferCompletionListForField/,
    /elementWasFocused/,
    /focusInEventHandler/,
    /backendManager\.js/,
    /bridge\.js/,
    /ajaxRequestInterceptor/,
  ];

  constructor() {
    this.originalError = console.error.bind(console);
    this.originalWarn = console.warn.bind(console);
  }

  /**
   * Activate Elite Console Filtering
   * Suppresses external extension noise while preserving application errors
   */
  activate(): void {
    if (this.isActive) return;

    console.error = (...args: any[]) => {
      if (this.shouldFilter(args)) {
        return; // Suppress filtered errors
      }
      this.originalError(...args);
    };

    console.warn = (...args: any[]) => {
      if (this.shouldFilter(args)) {
        return; // Suppress filtered warnings
      }
      this.originalWarn(...args);
    };

    // Filter global error events
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    this.isActive = true;
    console.log('🛡️ TerraFusion Elite Console Filter - Activated');
  }

  /**
   * Deactivate filtering and restore original console
   */
  deactivate(): void {
    if (!this.isActive) return;

    console.error = this.originalError;
    console.warn = this.originalWarn;

    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    this.isActive = false;
    console.log('🛡️ TerraFusion Elite Console Filter - Deactivated');
  }

  private shouldFilter(args: any[]): boolean {
    const message = args.join(' ');

    return this.filterPatterns.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(message);
      }
      return message.includes(pattern);
    });
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    const errorInfo = {
      message: event.message,
      filename: event.filename,
      source: event.error?.stack,
    };

    if (this.shouldFilterError(errorInfo)) {
      event.preventDefault(); // Suppress filtered global errors
      return;
    }

    // Log important application errors with elite formatting
    if (errorInfo.message.includes('TerraFusion') || errorInfo.message.includes('ATLAS')) {
      this.originalError('🚨 TerraFusion Elite Error:', errorInfo);
    }
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const message = event.reason?.toString() || '';

    if (this.filterPatterns.some((pattern) => pattern.test(message))) {
      event.preventDefault(); // Suppress filtered promise rejections
      return;
    }

    // Log important application promise rejections
    if (message.includes('TerraFusion') || message.includes('ATLAS')) {
      this.originalError('🚨 TerraFusion Elite Promise Rejection:', event.reason);
    }
  };

  private shouldFilterError(error: ConsoleError): boolean {
    const { message, filename, source } = error;

    return this.filterPatterns.some((pattern) => {
      return (
        pattern.test(message) ||
        (filename && pattern.test(filename)) ||
        (source && pattern.test(source))
      );
    });
  }
}

// Export singleton instance
export const terraFusionConsoleFilter = new TerraFusionConsoleFilter();

// Auto-activate in development mode
if (import.meta.env.DEV) {
  terraFusionConsoleFilter.activate();
}
