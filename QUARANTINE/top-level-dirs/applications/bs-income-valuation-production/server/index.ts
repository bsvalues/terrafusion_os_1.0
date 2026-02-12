import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import { testConnection } from './db.config';
import { seedIncomeMultipliers, seedDevelopmentData } from './seed';
import { errorHandler } from './errorHandler';
import { initializeSystem, displayMasterPrompt } from './initializeSystem';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Use the enhanced error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the PORT from .env, defaulting to 5000 if not provided
  // Note: Replit expects port 5000, but the .env can override this
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Test database connection before starting the server
  await testConnection();
  
  // Seed database with default data
  await seedIncomeMultipliers();
  
  // Seed development data if in development mode
  await seedDevelopmentData();
  
  // Initialize AI system
  if (process.env.ENABLE_AI_SYSTEM === 'true' || app.get("env") === "development") {
    log('Initializing AI System...');
    try {
      const core = initializeSystem();
      
      if (app.get("env") === "development") {
        // Display the master prompt in development mode
        displayMasterPrompt();
      }
      
      log('AI System initialized successfully');
    } catch (error) {
      console.error('Error initializing AI System:', error);
    }
  }
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
