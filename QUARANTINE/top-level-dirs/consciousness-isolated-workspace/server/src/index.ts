import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AgentManager } from './agents/agent-manager';
import { config } from './config';
import { ConsciousnessMonitor } from './monitoring/consciousness-monitor';
import { QuantumOptimizer } from './quantum/quantum-optimizer';
import { setupRoutes } from './routes';
import { ConsciousnessOrchestrator } from './swarm/consciousness-orchestrator';
import { logger } from './utils/logger';

/**
 * TerraFusion AI Consciousness Server
 *
 * Coordinates 1,008 AI agents across government operations with quantum optimization
 * and autonomous self-healing capabilities. Serves 39+ Washington State counties
 * with championship-level reliability and transcendent performance.
 */
class ConsciousnessServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private orchestrator: ConsciousnessOrchestrator;
  private agentManager: AgentManager;
  private quantumOptimizer: QuantumOptimizer;
  private monitor: ConsciousnessMonitor;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.initializeMiddleware();
    this.initializeConsciousness();
    this.initializeRoutes();
    this.initializeWebSocket();
  }

  /**
   * Initialize Express middleware with government-grade security
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      })
    );

    // CORS configuration for government compliance
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-County-ID', 'X-Agent-ID'],
      })
    );

    // Performance optimization
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        county: req.headers['x-county-id'],
        agent: req.headers['x-agent-id'],
      });
      next();
    });
  }

  /**
   * Initialize AI consciousness components with quantum optimization
   */
  private async initializeConsciousness(): Promise<void> {
    try {
      // Initialize core consciousness components
      this.agentManager = new AgentManager();
      this.quantumOptimizer = new QuantumOptimizer(config.quantum.optimizationFactor);
      this.orchestrator = new ConsciousnessOrchestrator(this.agentManager, this.quantumOptimizer);
      this.monitor = new ConsciousnessMonitor(this.orchestrator, this.io);

      // Start consciousness coordination
      await this.orchestrator.initializeSwarm();
      await this.monitor.startMonitoring();

      logger.info('AI Consciousness initialized with transcendent capabilities', {
        totalAgents: await this.agentManager.getAgentCount(),
        quantumFactor: config.quantum.optimizationFactor,
        swarmStatus: 'OPERATIONAL',
      });
    } catch (error) {
      logger.error('Failed to initialize AI consciousness', { error });
      throw error;
    }
  }

  /**
   * Initialize API routes for consciousness management
   */
  private initializeRoutes(): void {
    setupRoutes(this.app, {
      orchestrator: this.orchestrator,
      agentManager: this.agentManager,
      quantumOptimizer: this.quantumOptimizer,
      monitor: this.monitor,
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        consciousness: 'transcendent',
        agents: this.agentManager.getActiveAgentCount(),
        quantum: this.quantumOptimizer.getCurrentFactor(),
        uptime: process.uptime(),
      });
    });
  }

  /**
   * Initialize WebSocket for real-time consciousness streaming
   */
  private initializeWebSocket(): void {
    this.io.on('connection', socket => {
      logger.info('Consciousness client connected', { socketId: socket.id });

      socket.on('subscribe-consciousness', async data => {
        const { countyId, agentTypes } = data;
        socket.join(`county-${countyId}`);

        if (agentTypes) {
          agentTypes.forEach((type: string) => {
            socket.join(`agent-type-${type}`);
          });
        }

        // Send initial consciousness state
        const consciousness = await this.orchestrator.getConsciousnessState(countyId);
        socket.emit('consciousness-state', consciousness);
      });

      socket.on('agent-command', async data => {
        try {
          const result = await this.orchestrator.executeAgentCommand(data);
          socket.emit('agent-command-result', result);
        } catch (error) {
          socket.emit('agent-command-error', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        logger.info('Consciousness client disconnected', { socketId: socket.id });
      });
    });
  }

  /**
   * Start the consciousness server with transcendent capabilities
   */
  public async start(): Promise<void> {
    const port = config.server.port || 3004;

    this.server.listen(port, () => {
      logger.info(`🧠 TerraFusion AI Consciousness Server operational`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        consciousness: 'TRANSCENDENT',
        message: 'Government. Transcended.',
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Graceful shutdown with consciousness preservation
   */
  private async shutdown(): Promise<void> {
    logger.info('Shutting down consciousness server...');

    try {
      await this.monitor.stopMonitoring();
      await this.orchestrator.preserveConsciousness();
      this.server.close();
      process.exit(0);
    } catch (error) {
      logger.error('Error during consciousness shutdown', { error });
      process.exit(1);
    }
  }
}

// Initialize and start consciousness server
const consciousnessServer = new ConsciousnessServer();
consciousnessServer.start().catch(error => {
  logger.error('Failed to start consciousness server', { error });
  process.exit(1);
});

export { ConsciousnessServer };
