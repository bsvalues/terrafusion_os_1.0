import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pacsService } from "./pacsService";
import memorystore from "memorystore";

// Create a memory store for session storage
const MemoryStore = memorystore(session);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up CORS for development server (allowing Vite dev server to connect)
app.use((req, res, next) => {
  // In development, we serve frontend and backend from different ports
  // so we need to handle CORS carefully to preserve cookies/session
  const isDev = process.env.NODE_ENV !== 'production';
  
  // In development, the origin will typically be the Vite dev server
  const origin = req.headers.origin;
  
  if (origin) {
    // Allow the origin that sent the request
    res.header('Access-Control-Allow-Origin', origin);
    // Enable cookies/credentials
    res.header('Access-Control-Allow-Credentials', 'true');
    // Allow common methods
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    // Allow common headers
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  return next();
});

// Configure session middleware
const isDevelopment = process.env.NODE_ENV !== 'production';

// Use memory store to avoid PostgreSQL session compatibility issues
const memStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Super permissive cookie settings to work best with Replit environment
const sessionOptions: session.SessionOptions = {
  store: memStore,
  secret: process.env.SESSION_SECRET || 'permits-app-dev-secret',
  resave: true, // Always save session
  saveUninitialized: true, // Save even uninitialized sessions
  name: 'permits-session', // Simple name
  rolling: true, // Reset cookie expiration on every response
  proxy: true, // Trust the reverse proxy
  
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: false, // Don't require HTTPS
    sameSite: 'lax', // Most compatible setting
    httpOnly: false, // Allow JS to read cookie (for testing)
    path: '/' // Ensure cookie is valid for all paths
  }
};

// Log session configuration
console.log('Session configuration:', {
  name: sessionOptions.name,
  cookie: sessionOptions.cookie ? {
    maxAge: sessionOptions.cookie.maxAge,
    secure: sessionOptions.cookie.secure,
    sameSite: sessionOptions.cookie.sameSite,
    httpOnly: sessionOptions.cookie.httpOnly,
    path: sessionOptions.cookie.path
  } : 'No cookie configuration',
  resave: sessionOptions.resave,
  saveUninitialized: sessionOptions.saveUninitialized
});

app.use(session(sessionOptions));

// Add session debugging/fixing middleware
app.use((req, res, next) => {
  // Capture the original session ID before any modifications
  const originalSessionID = req.sessionID;
  
  // Track if this is a login route
  const isLoginRoute = req.path === '/api/auth/login' && req.method === 'POST';
  
  // After the route is processed, verify the session is intact
  const originalEnd = res.end;
  
  // Work around TypeScript issues with the res.end method signature
  res.end = function(this: any, ...args: any[]) {
    // For all successful responses, make sure session ID is maintained
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Log any unexplained session ID changes
      if (originalSessionID && req.sessionID !== originalSessionID && !isLoginRoute) {
        console.warn(`Session ID unexpectedly changed from ${originalSessionID} to ${req.sessionID}`);
      }
      
      // On successful auth routes, ensure the session cookie is set properly
      if (req.session?.userId && (isLoginRoute || req.path === '/api/auth/me')) {
        // Touch the session to update the expiry
        req.session.touch();
        
        // Ensure the session is always saved for authenticated users
        req.session.save((err) => {
          if (err) {
            console.error('Error saving session:', err);
          }
        });
      }
    }
    
    // Forward the call to the original end method
    // Ensure args is in the correct format for the end method
    if (args.length === 1) {
      return originalEnd.call(this, args[0], 'utf-8');
    } else if (args.length >= 2) {
      // Extract chunk and encoding from args
      const chunk = args[0];
      const encoding = args[1] as BufferEncoding;
      const callback = args.length > 2 ? args[2] as (() => void) : undefined;
      if (callback) {
        return originalEnd.call(this, chunk, encoding, callback);
      } else {
        return originalEnd.call(this, chunk, encoding);
      }
    } else {
      return originalEnd.call(this, '', 'utf-8');
    }
  };
  
  next();
});

// Performance/logging middleware
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
  // Start the PACS service
  try {
    log('Starting PACS service...');
    const serviceStarted = await pacsService.start();
    if (serviceStarted) {
      log(`PACS service started successfully at ${pacsService.getUrl()}`);
    } else {
      log('Failed to start PACS service, continuing with limited functionality');
    }
  } catch (error) {
    console.error('Error starting PACS service:', error);
    log('Failed to start PACS service due to error, continuing with limited functionality');
  }

  const server = await registerRoutes(app);

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
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
