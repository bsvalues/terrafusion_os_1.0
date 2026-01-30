/**
 * Application Logger
 * 
 * Provides standardized logging throughout the application
 */

// Basic logger implementation
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  // Log with a specific level
  log: (level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]) => {
    switch (level) {
      case 'info':
        logger.info(message, ...args);
        break;
      case 'warn':
        logger.warn(message, ...args);
        break;
      case 'error':
        logger.error(message, ...args);
        break;
      case 'debug':
        logger.debug(message, ...args);
        break;
    }
  }
};

export { logger };