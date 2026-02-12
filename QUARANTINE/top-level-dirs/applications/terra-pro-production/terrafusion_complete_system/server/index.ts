import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupWebSocketServer } from "./websocket-server-enhanced";
// Network health monitor is used by WebSocket servers, but not directly in index.ts
import { shapWebSocketService } from "./shap_ws_service";
// Import health check module
import * as healthCheck from "./monitoring/health-check";
// Import database startup checks
import { runStartupChecks } from "./db";

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
  // Run database startup checks
  await runStartupChecks();

  const server = await registerRoutes(app);

  // Set up main WebSocket server
  setupWebSocketServer(server);

  // Set up SHAP WebSocket service
  shapWebSocketService.initialize(server, "/shap-ws");
  console.log("[SHAP] SHAP WebSocket service initialized");

  // Register health check routes
  healthCheck.registerHealthRoutes(app);

  // Log server status periodically
  setInterval(() => {
    log(`Server running: ${new Date().toISOString()}`);
  }, 60000);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;

  // Create a function to handle server shutdown
  const shutdownGracefully = () => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
      console.log("Server closed successfully");
      process.exit(0);
    });

    // Force close after timeout if graceful shutdown fails
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  // Handle termination signals
  process.on("SIGTERM", shutdownGracefully);
  process.on("SIGINT", shutdownGracefully);

  // Add error handler for the port in use case
  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Attempting to use another port...`);
      // In Replit, we need to wait a moment for the port to be released
      setTimeout(() => {
        console.log("Retrying server startup...");
        server.listen({
          port,
          host: "0.0.0.0",
          reusePort: true,
          backlog: 511,
        });
      }, 5000);
    } else {
      console.error("Server error:", err);
    }
  });

  // Start the server
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
      backlog: 511,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
