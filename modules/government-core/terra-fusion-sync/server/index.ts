import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
// import { startFtpServer } from "./lib/ftp"; // Temporarily disable FTP
import logger, { requestLogger, errorLogger } from "./lib/logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use(requestLogger);

// Add error logging middleware
app.use(errorLogger);

(async () => {
  try {
    // FTP server temporarily disabled for development
    logger.info("FTP server disabled for development");

    // Create HTTP server
    const server = createServer(app);
    
    // Register API routes BEFORE Vite middleware to ensure they're matched first
    logger.info("Registering Express routes...");
    await registerRoutes(app, server);
    logger.info("Express routes registered successfully");
    
    // Setup Vite or static serving AFTER API routes
    // This ensures API routes get priority over Vite serving
    if (app.get("env") === "development") {
      logger.info("Setting up Vite middleware...");
      await setupVite(app, server);
      logger.info("Vite middleware setup complete");
    } else {
      serveStatic(app);
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      logger.error("Server error", {
        status,
        message,
        stack: err.stack,
        code: err.code,
      });

      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
      });
    });

    // Use port 5000 to match workflow expectations
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

    server.listen(PORT)
      .on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.warn(`Port ${PORT} is in use, trying ${PORT + 1}...`);
          server.listen(PORT + 1);
        } else {
          logger.error("Server startup error", { 
            error: error.message,
            stack: error.stack,
            code: error.code
          });
          process.exit(1);
        }
      })
      .on('listening', () => {
        const addr = server.address();
        const actualPort = typeof addr === 'object' ? addr?.port : PORT;
        logger.info(`Web server started successfully on http://0.0.0.0:${actualPort}`);
      });
  } catch (error: any) {
    logger.error("Server startup error", { 
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    process.exit(1);
  }
})();