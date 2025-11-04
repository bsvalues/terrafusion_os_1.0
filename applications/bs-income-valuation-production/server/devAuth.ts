import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { devAuthTokens, users, CreateDevAuthToken, devAuthLoginSchema } from "@shared/schema";
import { generateTokens, updateLastLogin } from "./auth";
import { eq, and, lt, gt } from "drizzle-orm";
import crypto from "crypto";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Environment check - only allow in development
const isDevelopment = process.env.NODE_ENV !== 'production';

// Generate a secure random token
export const generateDevToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a new dev auth token
export const createDevAuthToken = async (
  data: CreateDevAuthToken,
  createdBy: string = 'system',
  ipAddress: string = 'unknown'
): Promise<{ token: string; expiresAt: Date } | null> => {
  // Only allow in development
  if (!isDevelopment) {
    console.warn('Attempted to create dev auth token in production environment');
    return null;
  }

  try {
    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId));

    if (!user) {
      console.error(`Dev token creation failed: User ID ${data.userId} not found`);
      return null;
    }

    // Generate token
    const token = generateDevToken();
    
    // Calculate expiration time (default: 60 minutes)
    const expiresInMinutes = data.expiresInMinutes || 60;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Insert token into database
    await db.insert(devAuthTokens).values({
      userId: data.userId,
      token,
      expiresAt,
      description: data.description || `Dev login token for ${user.username}`,
      createdBy,
      ipAddress
    });

    console.log(`Dev auth token created for user ${user.username} (ID: ${user.id}). Expires at ${expiresAt.toISOString()}`);
    
    return { token, expiresAt };
  } catch (error) {
    console.error('Error creating dev auth token:', error);
    return null;
  }
};

// Validate a dev auth token and authenticate the user
export const validateDevAuthToken = async (
  token: string,
  ipAddress: string = 'unknown'
): Promise<{
  valid: boolean;
  user?: any;
  tokens?: { accessToken: string; refreshToken: string };
  message?: string;
}> => {
  // Only allow in development
  if (!isDevelopment) {
    return { 
      valid: false, 
      message: 'Dev authentication is only available in development environment' 
    };
  }

  try {
    // Find the token in the database
    const [devToken] = await db
      .select()
      .from(devAuthTokens)
      .where(
        and(
          eq(devAuthTokens.token, token),
          eq(devAuthTokens.used, false),
          gt(devAuthTokens.expiresAt, new Date())
        )
      );

    if (!devToken) {
      return { 
        valid: false, 
        message: 'Invalid or expired token' 
      };
    }

    // Get the user
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, devToken.userId));

    if (!user) {
      return { 
        valid: false, 
        message: 'User not found' 
      };
    }

    // Generate auth tokens for the user
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    // Mark the dev token as used
    await db
      .update(devAuthTokens)
      .set({ 
        used: true,
        ipAddress: `${ipAddress} (used)`
      })
      .where(eq(devAuthTokens.id, devToken.id));

    // Update last login
    await updateLastLogin(user.id);

    console.log(`Dev login successful for user ${user.username} (ID: ${user.id}) using token ${token.substring(0, 8)}...`);

    return {
      valid: true,
      user,
      tokens
    };
  } catch (error) {
    console.error('Error validating dev auth token:', error);
    return { 
      valid: false, 
      message: 'Authentication error' 
    };
  }
};

// Clean up expired dev tokens
export const cleanupExpiredDevTokens = async (): Promise<number> => {
  try {
    const currentDate = new Date();
    
    const result = await db
      .update(devAuthTokens)
      .set({ used: true })
      .where(
        and(
          eq(devAuthTokens.used, false),
          lt(devAuthTokens.expiresAt, currentDate)
        )
      );
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} expired dev auth tokens`);
      return result.rowCount;
    }
    
    return 0;
  } catch (error) {
    console.error('Error cleaning up expired dev tokens:', error);
    return 0;
  }
};

// List all active dev tokens for a user
export const listDevAuthTokens = async (userId: number): Promise<any[]> => {
  try {
    // Only allow in development
    if (!isDevelopment) {
      return [];
    }

    const tokens = await db
      .select({
        id: devAuthTokens.id,
        token: devAuthTokens.token,
        createdAt: devAuthTokens.createdAt,
        expiresAt: devAuthTokens.expiresAt,
        used: devAuthTokens.used,
        description: devAuthTokens.description,
        createdBy: devAuthTokens.createdBy
      })
      .from(devAuthTokens)
      .where(
        and(
          eq(devAuthTokens.userId, userId),
          eq(devAuthTokens.used, false),
          gt(devAuthTokens.expiresAt, new Date())
        )
      )
      .orderBy(devAuthTokens.createdAt);

    return tokens;
  } catch (error) {
    console.error('Error listing dev auth tokens:', error);
    return [];
  }
};

// Revoke a dev auth token
export const revokeDevAuthToken = async (id: number): Promise<boolean> => {
  try {
    // Only allow in development
    if (!isDevelopment) {
      return false;
    }

    await db
      .update(devAuthTokens)
      .set({ used: true })
      .where(eq(devAuthTokens.id, id));
    
    return true;
  } catch (error) {
    console.error('Error revoking dev auth token:', error);
    return false;
  }
};

// Middleware to restrict routes to development environment
export const devOnlyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (isDevelopment) {
    next();
  } else {
    res.status(403).json({ 
      error: 'This endpoint is only available in development environment' 
    });
  }
};