const { db } = require('../db');

/**
 * Health check controller providing endpoints for monitoring system health
 */
class HealthController {
  /**
   * Setup health check routes
   * @param {Object} app - Express application
   */
  static setupRoutes(app) {
    // Basic health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const health = {
          status: 'UP',
          timestamp: new Date().toISOString(),
          checks: {
            database: await this.checkDatabase(),
            memory: this.checkMemory()
          }
        };

        // If any check fails, set HTTP status to 503
        const isHealthy = Object.values(health.checks)
          .every(check => check.status === 'UP');

        res.status(isHealthy ? 200 : 503).json(health);
      } catch (error) {
        res.status(500).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    // Liveness probe - simple endpoint to check if app is running
    app.get('/health/liveness', (req, res) => {
      res.status(200).json({ status: 'UP' });
    });

    // Readiness probe - checks if app is ready to handle traffic
    app.get('/health/readiness', async (req, res) => {
      try {
        const dbCheck = await this.checkDatabase();
        
        if (dbCheck.status === 'UP') {
          res.status(200).json({ status: 'UP' });
        } else {
          res.status(503).json({ 
            status: 'DOWN',
            reason: 'Database connection failed'
          });
        }
      } catch (error) {
        res.status(503).json({ 
          status: 'DOWN',
          reason: error.message
        });
      }
    });
  }

  /**
   * Check database connectivity
   * @returns {Object} Database health status
   */
  static async checkDatabase() {
    try {
      // Simple query to verify database connection
      const result = await db.execute(sql`SELECT 1 as db_check`);
      
      return {
        status: 'UP',
        responseTime: `${result.duration}ms`
      };
    } catch (error) {
      return {
        status: 'DOWN',
        error: error.message
      };
    }
  }

  /**
   * Check memory usage
   * @returns {Object} Memory health status
   */
  static checkMemory() {
    const memoryUsage = process.memoryUsage();
    const maxMemory = process.env.NODE_MAX_MEMORY_MB 
      ? parseInt(process.env.NODE_MAX_MEMORY_MB) * 1024 * 1024
      : 1024 * 1024 * 1024; // 1GB default
    
    const usedRatio = memoryUsage.rss / maxMemory;
    
    return {
      status: usedRatio < 0.9 ? 'UP' : 'WARNING',
      details: {
        usedMemoryMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
        maxMemoryMB: Math.round(maxMemory / (1024 * 1024)),
        usedPercentage: Math.round(usedRatio * 100)
      }
    };
  }
}

module.exports = HealthController;