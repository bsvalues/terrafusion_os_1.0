import express, { Request, Response, NextFunction, Express } from 'express';
import { pacsService } from '../pacsService';
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Set up PACS routes on the specified Express router
 * @returns Express router with PACS routes
 */
export function setupPacsRoutes() {
  const router = express.Router();

  // Health check endpoint
  router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = pacsService.getUrl();
      
      // Forward the request to the FastAPI service
      const response = await fetch(`${url}/health`);
      const data = await response.json();
      
      res.status(200).json({
        ...data,
        pacsServiceUrl: url,
        proxied: true
      });
    } catch (error: any) {
      next(error);
    }
  });

  // Set up a proxy for all other PACS routes
  router.use('/', createProxyMiddleware({
    target: pacsService.getUrl(),
    changeOrigin: true,
    pathRewrite: {
      '^/api/pacs': '', // remove the /api/pacs prefix when forwarding
    },
    // Type any for proxy middleware options that are not in the type definitions
    // @ts-ignore
    onProxyReq: (proxyReq: any, req: any, res: any) => {
      // Log proxy requests
      console.log(`[PACS Proxy] ${req.method} ${req.url}`);
    },
    // @ts-ignore
    onError: (err: any, req: any, res: any) => {
      console.error('[PACS Proxy Error]', err);
      res.status(500).json({ 
        error: 'PACS service proxy error',
        message: err.message 
      });
    }
  }));

  return router;
}

/**
 * Register PACS routes on the Express application
 * @param app Express application
 */
export function registerPacsRoutes(app: Express): void {
  // Start the PACS service
  pacsService.start().then((success) => {
    if (success) {
      console.log(`PACS service started at ${pacsService.getUrl()}`);
    } else {
      console.error('Failed to start PACS service');
    }
  });

  // Mount the PACS routes
  app.use('/api/pacs', setupPacsRoutes());
  
  console.log('PACS routes registered');
}