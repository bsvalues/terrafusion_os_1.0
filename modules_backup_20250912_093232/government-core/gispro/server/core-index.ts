import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer as createViteServer } from 'vite';
import coreRoutes from './core-routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '5000');

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use('/api', coreRoutes);

  // Serve cartography interface directly (before Vite middleware)
  app.get('/map', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Development: integrate Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        allowedHosts: [
          '5cce5b83-43f3-4897-b66e-bc587d22baf8-00-18f7uv6p4yxk4.riker.replit.dev',
          '.replit.dev',
          '.repl.co',
        ],
      },
      appType: 'spa',
      root: path.join(__dirname, '../client'),
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, '../dist/public')));
  }

  // Handle React Router routes in production
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Terrafusion Civil Infrastructure Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
  });

  return app;
}

const serverInstance = createServer().catch(console.error);

export default serverInstance;
