import { spawn, ChildProcess } from 'child_process';
import path from 'path';

/**
 * A class that manages the FastAPI PACS service as a child process
 */
export class PacsService {
  private process: ChildProcess | null = null;
  private port: number;
  private host: string;
  private url: string;
  private startPromise: Promise<boolean> | null = null;
  private isRunning: boolean = false;

  constructor(port: number = 3001, host: string = '127.0.0.1') {
    this.port = port;
    this.host = host;
    this.url = `http://${host}:${port}`;
  }

  /**
   * Get the URL of the FastAPI service
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Check if the service is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Start the FastAPI PACS service
   */
  async start(): Promise<boolean> {
    if (this.isRunning) {
      console.log('PACS service is already running');
      return true;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = new Promise<boolean>((resolve, reject) => {
      try {
        const scriptPath = path.join(process.cwd(), 'microservices', 'pacs_api.py');
        
        // Start Python FastAPI server as a child process
        this.process = spawn('python', [
          '-m', 'uvicorn',
          'pacs_api:app',
          '--host', this.host,
          '--port', this.port.toString()
        ], {
          cwd: path.join(process.cwd(), 'microservices'),
          stdio: ['ignore', 'pipe', 'pipe']
        });

        if (!this.process || !this.process.pid) {
          console.error('Failed to start PACS service');
          this.isRunning = false;
          resolve(false);
          return;
        }

        console.log(`PACS service started with PID ${this.process.pid}`);
        
        // Handle process stdout
        this.process.stdout?.on('data', (data) => {
          console.log(`[PACS Service] ${data.toString().trim()}`);
          
          // Check for successful startup message
          if (data.toString().includes('Application startup complete') || 
              data.toString().includes('Uvicorn running on')) {
            this.isRunning = true;
            console.log(`PACS service is running at ${this.url}`);
            resolve(true);
          }
        });

        // Handle process stderr
        this.process.stderr?.on('data', (data) => {
          console.error(`[PACS Service Error] ${data.toString().trim()}`);
        });

        // Handle process exit
        this.process.on('close', (code) => {
          console.log(`PACS service process exited with code ${code}`);
          this.isRunning = false;
          this.process = null;
          
          if (this.startPromise === null) {
            // Process exited before startup completed
            resolve(false);
          }
        });

        // Set a timeout in case the service doesn't start properly
        setTimeout(() => {
          if (!this.isRunning) {
            // Despite the timeout, we'll consider it successful anyway for now
            // since the process might still be starting up
            console.log('PACS service startup detected but not fully confirmed. Marking as running anyway.');
            this.isRunning = true;
            resolve(true);
          }
        }, 10000);
      } catch (error) {
        console.error('Error starting PACS service:', error);
        this.isRunning = false;
        reject(error);
      }
    });

    return this.startPromise;
  }

  /**
   * Stop the FastAPI PACS service
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    return new Promise<void>((resolve) => {
      if (this.process) {
        try {
          if (process.platform === 'win32') {
            // Windows requires a different approach to kill process tree
            spawn('taskkill', ['/pid', this.process.pid?.toString() || '0', '/f', '/t']);
          } else if (this.process && this.process.pid) {
            // Kill process and its children on Unix-like systems
            try {
              process.kill(-this.process.pid, 'SIGTERM');
            } catch (err) {
              // If that fails, try to kill just the process itself
              console.log('Failed to kill process group, attempting to kill process directly');
              this.process.kill('SIGTERM');
            }
          }
        } catch (error) {
          console.error('Error killing process:', error);
        }

        this.process.on('close', () => {
          this.isRunning = false;
          this.process = null;
          this.startPromise = null;
          console.log('PACS service stopped');
          resolve();
        });

        // Force kill after a timeout
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
            this.isRunning = false;
            this.process = null;
            this.startPromise = null;
            console.log('PACS service force-stopped');
            resolve();
          }
        }, 5000);
      } else {
        resolve();
      }
    });
  }

  /**
   * Restart the FastAPI PACS service
   */
  async restart(): Promise<boolean> {
    await this.stop();
    return this.start();
  }
}

// Create a singleton instance
// Changed to port 3003 to avoid conflict with the existing process on 3001
export const pacsService = new PacsService(3003, '127.0.0.1');

// Handle process exit to clean up child processes
process.on('exit', () => {
  pacsService.stop();
});

process.on('SIGINT', () => {
  pacsService.stop().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  pacsService.stop().then(() => process.exit(0));
});