/**
 * CORS Middleware
 *
 * This middleware enables Cross-Origin Resource Sharing (CORS) to allow
 * API requests from different origins, including both browser-based tools
 * and our Node.js test scripts.
 */

import { Request, Response, NextFunction } from 'express';

export default function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response<any, Record<string, any>> {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Continue to the next middleware
  next();
}
