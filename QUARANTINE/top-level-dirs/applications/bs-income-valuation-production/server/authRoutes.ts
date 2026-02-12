import { Router, Request, Response } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { loginSchema, registerSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  hashPassword,
  comparePassword,
  generateTokens,
  storeRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  getUserByUsername,
  getUserByEmail,
  updateLastLogin,
  authenticateJWT,
} from "./auth";
import { 
  ValidationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError 
} from './errorHandler';

// Create auth router
export const authRouter = Router();

// Register route
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const userData = registerSchema.parse(req.body);

    // Check if username or email already exists
    const existingUsername = await getUserByUsername(userData.username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: {
          type: 'ConflictError',
          message: "Username already taken",
          status: 409,
          code: 'USERNAME_ALREADY_EXISTS',
          entity: 'user'
        }
      });
    }

    const existingEmail = await getUserByEmail(userData.email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: {
          type: 'ConflictError',
          message: "Email already registered",
          status: 409,
          code: 'EMAIL_ALREADY_EXISTS',
          entity: 'user'
        }
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create new user
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    });

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Return user data and tokens
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      res.status(400).json({
        success: false,
        error: {
          type: 'ValidationError',
          message: validationError.message,
          status: 400,
          code: 'VALIDATION_ERROR',
          validationErrors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: 'INVALID_INPUT'
          }))
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          type: 'ServerError',
          message: "Failed to register user",
          status: 500,
          code: 'REGISTRATION_FAILED'
        }
      });
    }
  }
});

// Login route
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const loginData = loginSchema.parse(req.body);

    // Find user by username
    const user = await getUserByUsername(loginData.username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthorizationError',
          message: "Invalid username or password",
          status: 401,
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      loginData.password,
      user.password
    );
    if (!isPasswordValid) {
      // Add a small delay to prevent timing attacks that could reveal valid usernames
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
      
      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthorizationError',
          message: "Invalid username or password",
          status: 401,
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    });

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Return user data and tokens
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      res.status(400).json({
        success: false,
        error: {
          type: 'ValidationError',
          message: validationError.message,
          status: 400,
          code: 'VALIDATION_ERROR',
          validationErrors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: 'INVALID_INPUT'
          }))
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          type: 'ServerError',
          message: "Failed to login",
          status: 500,
          code: 'LOGIN_FAILED'
        }
      });
    }
  }
});

// Token refresh route
authRouter.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'ValidationError',
          message: "Refresh token is required",
          status: 400,
          code: 'MISSING_REFRESH_TOKEN'
        }
      });
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthorizationError',
          message: "Invalid or expired refresh token",
          status: 401,
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }

    // Generate new tokens
    const newTokens = generateTokens({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    });

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Store new refresh token
    await storeRefreshToken(payload.userId, newTokens.refreshToken);

    // Return new tokens
    res.json({
      success: true,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      success: false,
      error: {
        type: 'ServerError',
        message: "Failed to refresh token",
        status: 500,
        code: 'TOKEN_REFRESH_FAILED'
      }
    });
  }
});

// Logout route
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'ValidationError',
          message: "Refresh token is required",
          status: 400,
          code: 'MISSING_REFRESH_TOKEN'
        }
      });
    }

    // Revoke refresh token
    await revokeRefreshToken(refreshToken);

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({
      success: false,
      error: {
        type: 'ServerError',
        message: "Failed to logout",
        status: 500,
        code: 'LOGOUT_FAILED'
      }
    });
  }
});

// Get current user route (protected)
authRouter.get(
  "/me",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      // User is available from the middleware
      const { userId } = req.user;

      // Fetch user from database to get latest data
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'NotFoundError',
            message: "User not found",
            status: 404,
            code: 'USER_NOT_FOUND',
            entity: 'user'
          }
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({
        success: false,
        error: {
          type: 'ServerError',
          message: "Failed to fetch user data",
          status: 500,
          code: 'USER_FETCH_FAILED'
        }
      });
    }
  }
);

// Missing import error fix
import { eq } from "drizzle-orm";