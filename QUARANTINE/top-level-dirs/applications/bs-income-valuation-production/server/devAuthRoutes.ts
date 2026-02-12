import { Router, Request, Response } from "express";
import { createDevAuthTokenSchema, devAuthLoginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { authenticateJWT, generateTokens, hashPassword } from "./auth";
import { pool } from "./db.config";
import { 
  createDevAuthToken, 
  validateDevAuthToken, 
  listDevAuthTokens, 
  revokeDevAuthToken, 
  cleanupExpiredDevTokens,
  devOnlyMiddleware 
} from "./devAuth";

// Create dev auth router
export const devAuthRouter = Router();

// Apply dev-only middleware to all routes
devAuthRouter.use(devOnlyMiddleware);

// Generate a new dev auth token (requires admin authentication)
devAuthRouter.post(
  "/token/generate", 
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ 
          error: "Only administrators can generate dev tokens" 
        });
      }

      // Validate request data
      const tokenData = createDevAuthTokenSchema.parse(req.body);

      // Get IP address
      const ipAddress = 
        req.headers["x-forwarded-for"] as string || 
        req.socket.remoteAddress || 
        "unknown";

      // Generate token
      const result = await createDevAuthToken(
        tokenData, 
        req.user.username,
        ipAddress
      );

      if (!result) {
        return res.status(500).json({ 
          error: "Failed to generate dev auth token" 
        });
      }

      // Return token
      res.status(201).json({
        message: "Dev auth token generated successfully",
        tokenInfo: {
          token: result.token,
          expiresAt: result.expiresAt,
          userId: tokenData.userId,
          description: tokenData.description || "Development login token"
        }
      });
    } catch (error) {
      console.error("Error generating dev auth token:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to generate dev auth token" });
      }
    }
  }
);

// Login with a dev auth token
devAuthRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const { token } = devAuthLoginSchema.parse(req.body);

    // Get IP address
    const ipAddress = 
      req.headers["x-forwarded-for"] as string || 
      req.socket.remoteAddress || 
      "unknown";

    // Validate token
    const result = await validateDevAuthToken(token, ipAddress);

    if (!result.valid || !result.user || !result.tokens) {
      return res.status(401).json({ 
        error: result.message || "Invalid or expired token" 
      });
    }

    // Return user data and tokens
    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      message: "Dev authentication successful"
    });
  } catch (error) {
    console.error("Error in dev auth login:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    } else {
      res.status(500).json({ error: "Authentication failed" });
    }
  }
});

// List all active dev tokens for a user (requires admin or matching user ID)
devAuthRouter.get(
  "/tokens/:userId", 
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check permission (must be admin or the same user)
      if (!req.user || (req.user.userId !== userId && req.user.role !== "admin")) {
        return res.status(403).json({ 
          error: "You don't have permission to view these tokens" 
        });
      }

      // Get tokens
      const tokens = await listDevAuthTokens(userId);

      res.json({
        userId,
        tokens,
        count: tokens.length
      });
    } catch (error) {
      console.error("Error listing dev auth tokens:", error);
      res.status(500).json({ error: "Failed to list dev auth tokens" });
    }
  }
);

// Revoke a dev token (requires admin or matching user ID)
devAuthRouter.delete(
  "/token/:id", 
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const tokenId = parseInt(req.params.id);
      
      // Check permission (must be admin)
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ 
          error: "Only administrators can revoke dev tokens" 
        });
      }

      // Revoke token
      const success = await revokeDevAuthToken(tokenId);

      if (!success) {
        return res.status(500).json({ 
          error: "Failed to revoke dev auth token" 
        });
      }

      res.json({
        success: true,
        message: "Dev auth token revoked successfully"
      });
    } catch (error) {
      console.error("Error revoking dev auth token:", error);
      res.status(500).json({ error: "Failed to revoke dev auth token" });
    }
  }
);

// Auto-login route (DEV ONLY - creates or finds a development admin user)
devAuthRouter.post("/auto-login", async (req: Request, res: Response) => {
  try {
    const DEV_USERNAME = "admin";
    const DEV_PASSWORD = "adminpass";
    const DEV_EMAIL = "admin@example.com";
    const DEV_ROLE = "admin";
    
    // Check if dev user exists - using raw SQL for simplicity
    const userQuery = await pool.query(
      "SELECT * FROM users WHERE username = $1 LIMIT 1", 
      [DEV_USERNAME]
    );
    
    let user;
    
    // Create dev user if it doesn't exist
    if (userQuery.rows.length === 0) {
      const hashedPassword = await hashPassword(DEV_PASSWORD);
      
      // Insert using raw SQL
      const newUserQuery = await pool.query(
        "INSERT INTO users (username, password, email, role, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [DEV_USERNAME, hashedPassword, DEV_EMAIL, DEV_ROLE, "Development Admin"]
      );
      
      user = newUserQuery.rows[0];
      console.log("Created development admin user:", user.id);
    } else {
      user = userQuery.rows[0];
      console.log("Using existing development admin user:", user.id);
    }
    
    // Generate tokens for the user
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    // Return user data and tokens
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: "Development auto-login successful"
    });
  } catch (error) {
    console.error("Error in dev auto-login:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Auto-login failed" 
    });
  }
});

// Cleanup expired tokens (admin only)
devAuthRouter.post(
  "/tokens/cleanup", 
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      // Check permission (must be admin)
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ 
          error: "Only administrators can cleanup tokens" 
        });
      }

      // Cleanup expired tokens
      const count = await cleanupExpiredDevTokens();

      res.json({
        success: true,
        message: `Cleaned up ${count} expired dev auth tokens`
      });
    } catch (error) {
      console.error("Error cleaning up expired dev tokens:", error);
      res.status(500).json({ error: "Failed to cleanup expired tokens" });
    }
  }
);