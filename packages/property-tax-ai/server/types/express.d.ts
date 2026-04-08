/**
 * TypeScript declaration file to extend Express types
 */

import { Express, Request } from 'express';

declare global {
  namespace Express {
    interface ParamsDictionary {
      [key: string]: string;
      0?: string; // Add wildcard route parameter index support
    }
  }
}