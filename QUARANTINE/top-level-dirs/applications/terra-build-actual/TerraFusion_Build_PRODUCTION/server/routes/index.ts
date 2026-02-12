import express from 'express';
import ... from "@/health";
import ... from "@/swarmRoutes";
// Import other route files as needed

export function registerRoutes(app: express.Express): void {
  // Mount API routes
  app.use('/api', healthRoutes);
  app.use('/api/swarm', swarmRoutes);
  
  // Add other routes as needed
}