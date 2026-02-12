import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, authTokens } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config";
import crypto from 'crypto';

/**
 * JWT Secret Configuration
 * Creates a secure JWT_SECRET from environment or generates it for development
 */
const JWT_SECRET = (() => {
  // Use JWT_SECRET from environment or config
  const envSecret = process.env.JWT_SECRET || config.auth.jwt.secret;
  if (envSecret) return envSecret;
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production mode');
  }
  
  // For development, generate a random secret that persists for the session
  const generatedSecret = crypto.randomBytes(64).toString('hex');
  console.log('Generated random JWT_SECRET for development. This will change on server restart.');
  return generatedSecret;
})();

// Token expiration settings
const JWT_EXPIRES_IN = config.auth.jwt.expiresIn || "1h"; 
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Interface for JWT payload
export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
}

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare a password with its hash
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate access and refresh tokens for a user
 */
export const generateTokens = (payload: JwtPayload) => {
  // Access token with shorter expiration
  const accessToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Refresh token with longer expiration
  const refreshToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
};

/**
 * Store refresh token in the database
 */
export const storeRefreshToken = async (userId: number, token: string) => {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);
  await db.insert(authTokens).values({
    userId,
    token,
    expiresAt,
  });
};

/**
 * Verify refresh token from database
 */
export const verifyRefreshToken = async (token: string) => {
  try {
    // Verify token signature
    let decoded: JwtPayload;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (jwtError) {
      console.warn('JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
      return null;
    }

    // Check if token exists in database and is not revoked
    const [storedToken] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, token),
          eq(authTokens.revoked, false),
          gt(authTokens.expiresAt, new Date())
        )
      );

    if (!storedToken) {
      console.warn('Token not found in database or revoked or expired');
      return null;
    }

    return decoded;
  } catch (error) {
    console.warn('Error verifying refresh token:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Revoke refresh token (on logout)
 */
export const revokeRefreshToken = async (token: string) => {
  await db
    .update(authTokens)
    .set({ revoked: true })
    .where(eq(authTokens.token, token));
};

/**
 * Authentication middleware
 */
export const authenticateJWT = (
  req: Request & { user?: JwtPayload },
  res: Response,
  next: NextFunction
) => {
  // Check if authentication is disabled in config or should be bypassed in dev mode
  if (!config.auth.enabled || config.auth.devBypass) {
    console.log('⚠️ Authentication bypassed per configuration. Request authenticated with mock user.');
    // Set mock user for development
    req.user = {
      userId: 1,
      username: 'devuser',
      email: 'dev@example.com',
      role: 'admin' // Use admin role for full access during development
    };
    return next();
  }
  
  // Production authentication logic
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthorizationError',
        message: "Authorization token required",
        status: 401,
        code: 'MISSING_TOKEN'
      }
    });
  }

  // Check Authorization header format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthorizationError',
        message: "Authorization header format must be 'Bearer {token}'",
        status: 401,
        code: 'INVALID_AUTH_FORMAT'
      }
    });
  }

  const token = parts[1];

  try {
    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
      next();
    } catch (jwtError) {
      // Handle specific JWT errors with appropriate responses
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: "Access token has expired",
            status: 401,
            code: 'TOKEN_EXPIRED'
          }
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(403).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: "Invalid token",
            status: 403,
            code: 'INVALID_TOKEN'
          }
        });
      } else {
        return res.status(403).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: "Token validation failed",
            status: 403,
            code: 'TOKEN_VALIDATION_FAILED'
          }
        });
      }
    }
  } catch (err) {
    console.error('Error in authentication middleware:', err);
    return res.status(500).json({
      success: false,
      error: {
        type: 'ServerError',
        message: "Authentication error",
        status: 500,
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * User database access helpers
 */
export const getUserById = async (id: number) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

export const getUserByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
};

export const getUserByUsername = async (username: string) => {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
};

export const updateLastLogin = async (userId: number) => {
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, userId));
};