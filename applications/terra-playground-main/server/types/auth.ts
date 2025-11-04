import { Request } from 'express';

// Define consistent type for authenticated requests that aligns with Express.Request from auth-middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number; // Match the global Express.Request interface from auth-middleware
    username: string;
    role: string;
    scope: string[];
  };
  isAuthenticated(): boolean;
}
