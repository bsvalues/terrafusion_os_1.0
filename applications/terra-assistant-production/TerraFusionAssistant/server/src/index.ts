/**
 * Terrafusion Express Server
 * 
 * This is the main entry point for the Terrafusion API server.
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/api';
import levyRoutes from './routes/levy';
import { errorHandler, notFoundHandler } from './middleware/error';

// Create Express application
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: process.env.npm_package_version || '0.1.0' });
});

// Register API routes
app.use('/api', apiRoutes);

// Register v1 API routes
app.use('/api/v1', levyRoutes);

// Register error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Terrafusion API server listening on port ${PORT}`);
});