/**
 * TypeScript declaration file to extend Express types
 */

declare global {
  namespace Express {
    interface ParamsDictionary {
      [key: string]: string;
      0?: string; // Add wildcard route parameter index support
    }
    interface Request {
      user?: any;
    }
  }
}
