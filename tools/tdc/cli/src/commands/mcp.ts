/**
 * TDC MCP Command
 * Manage Model Context Protocol (MCP) PostGIS server
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import { Command } from 'commander';
import fs from 'fs';
// import fetch from 'node-fetch'; // Node 18+ has built-in fetch
import path from 'path';

const MCP_SERVER_DIR = path.join(process.cwd(), 'tools', 'mcp', 'postgis-server');
const MCP_PID_FILE = path.join(MCP_SERVER_DIR, '.mcp.pid');
const MCP_PORT = process.env.MCP_SERVER_PORT || 8080;

interface McpStatus {
  running: boolean;
  pid?: number;
  port?: number;
  uptime?: number;
  healthy?: boolean;
}

interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

/**
 * Register MCP command and subcommands
 */
export function registerMcpCommand(program: Command): void {
  const mcp = program.command('mcp').description('MCP PostGIS server management');

  mcp
    .command('start')
    .description('Start MCP PostGIS server in background')
    .option('--port <port>', 'Server port', MCP_PORT.toString())
    .option('--foreground', 'Run in foreground (block terminal)', false)
    .action(startServer);

  mcp
    .command('stop')
    .description('Stop MCP PostGIS server')
    .option('--force', 'Force kill if graceful shutdown fails', false)
    .action(stopServer);

  mcp
    .command('status')
    .description('Show MCP server status')
    .option('--json', 'Output as JSON')
    .action(statusCommand);

  mcp
    .command('test')
    .description('Run MCP server integration tests')
    .option('--verbose', 'Enable verbose test output', false)
    .option('--coverage', 'Generate code coverage report', false)
    .action(testServer);

  mcp
    .command('query <queryName>')
    .description('Execute PostGIS query via MCP')
    .option('--args <json>', 'Query arguments as JSON string')
    .option('--county-id <id>', 'County ID (required for isolation)', '1')
    .option('--json', 'Output as JSON only')
    .action(executeQuery);

  mcp
    .command('logs')
    .description('Show MCP server logs')
    .option('-f, --follow', 'Follow log output', false)
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .action(showLogs);
}

/**
 * Start MCP PostGIS server
 */
async function startServer(options: { port: string; foreground: boolean }): Promise<void> {
  console.log(chalk.bold('\n⚡ Starting MCP PostGIS Server\n'));

  // Check if server already running
  const status = await getServerStatus();
  if (status.running) {
    console.log(chalk.yellow('⚠ Server already running'));
    console.log(`${chalk.gray('PID:')} ${status.pid}`);
    console.log(`${chalk.gray('Port:')} ${status.port}\n`);
    return;
  }

  // Verify server directory exists
  if (!fs.existsSync(MCP_SERVER_DIR)) {
    console.error(chalk.red('✗ MCP server directory not found:'), MCP_SERVER_DIR);
    console.log(chalk.yellow('\nRun the following to create server structure:'));
    console.log(chalk.cyan('  mkdir -p tools/mcp/postgis-server/src'));
    console.log(chalk.cyan('  cd tools/mcp/postgis-server && npm install\n'));
    process.exit(1);
  }

  // Check for .env file
  const envPath = path.join(MCP_SERVER_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    console.log(chalk.yellow('⚠ .env file not found, using defaults'));
    console.log(chalk.gray('   Copy .env.example to .env and configure PostgreSQL connection\n'));
  }

  const port = parseInt(options.port, 10);
  console.log(`${chalk.gray('Port:')} ${port}`);
  console.log(`${chalk.gray('Mode:')} ${options.foreground ? 'foreground' : 'background'}\n`);

  try {
    // Start server process
    const serverScript = path.join(MCP_SERVER_DIR, 'dist', 'index.js');

    if (!fs.existsSync(serverScript)) {
      console.log(chalk.yellow('⚠ Server not built, building now...'));
      await buildServer();
    }

    const serverProcess = spawn('node', [serverScript], {
      cwd: MCP_SERVER_DIR,
      env: {
        ...process.env,
        MCP_SERVER_PORT: port.toString(),
      },
      detached: !options.foreground,
      stdio: options.foreground ? 'inherit' : 'ignore',
    });

    if (options.foreground) {
      // Foreground mode - attach to process
      console.log(chalk.green('✓ Server started in foreground mode'));
      console.log(chalk.gray('  Press Ctrl+C to stop\n'));

      serverProcess.on('exit', code => {
        console.log(chalk.yellow(`\nServer stopped with code ${code}`));
        process.exit(code || 0);
      });
    } else {
      // Background mode - save PID and detach
      fs.writeFileSync(MCP_PID_FILE, serverProcess.pid!.toString());
      serverProcess.unref();

      console.log(chalk.green('✓ Server started in background'));
      console.log(`${chalk.gray('PID:')} ${serverProcess.pid}`);
      console.log(`${chalk.gray('PID file:')} ${MCP_PID_FILE}\n`);

      // Wait for server to be ready
      console.log('Waiting for server to be ready...');
      await waitForServerReady(port, 10000);
      console.log(chalk.green('✓ Server is ready\n'));
    }
  } catch (error) {
    console.error(chalk.red('✗ Failed to start server:'), (error as Error).message);
    process.exit(1);
  }
}

/**
 * Stop MCP PostGIS server
 */
async function stopServer(options: { force: boolean }): Promise<void> {
  console.log(chalk.bold('\n⚡ Stopping MCP PostGIS Server\n'));

  const status = await getServerStatus();

  if (!status.running) {
    console.log(chalk.yellow('⚠ Server is not running\n'));

    // Clean up stale PID file
    if (fs.existsSync(MCP_PID_FILE)) {
      fs.unlinkSync(MCP_PID_FILE);
      console.log(chalk.gray('Cleaned up stale PID file\n'));
    }
    return;
  }

  try {
    console.log(`${chalk.gray('PID:')} ${status.pid}`);
    console.log(`${chalk.gray('Mode:')} ${options.force ? 'force kill' : 'graceful shutdown'}\n`);

    if (options.force) {
      // Force kill
      process.kill(status.pid!, 'SIGKILL');
      console.log(chalk.green('✓ Server forcefully stopped'));
    } else {
      // Graceful shutdown
      process.kill(status.pid!, 'SIGTERM');

      // Wait for process to exit
      let attempts = 0;
      while (attempts < 10) {
        await sleep(500);
        if (!isProcessRunning(status.pid!)) {
          break;
        }
        attempts++;
      }

      if (isProcessRunning(status.pid!)) {
        console.log(chalk.yellow('⚠ Graceful shutdown timed out, forcing kill...'));
        process.kill(status.pid!, 'SIGKILL');
      }

      console.log(chalk.green('✓ Server stopped gracefully'));
    }

    // Clean up PID file
    if (fs.existsSync(MCP_PID_FILE)) {
      fs.unlinkSync(MCP_PID_FILE);
    }

    console.log('');
  } catch (error) {
    console.error(chalk.red('✗ Failed to stop server:'), (error as Error).message);
    console.log(chalk.yellow('\nTry force stop: tdc mcp stop --force\n'));
    process.exit(1);
  }
}

/**
 * Show MCP server status
 */
async function statusCommand(options: { json?: boolean }): Promise<void> {
  const status = await getServerStatus();

  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  console.log(chalk.bold('\n⚡ MCP PostGIS Server Status\n'));

  if (status.running) {
    console.log(chalk.green('● Server is running'));
    console.log(`${chalk.gray('PID:')} ${status.pid}`);
    console.log(`${chalk.gray('Port:')} ${status.port}`);

    if (status.uptime) {
      const uptimeMinutes = Math.floor(status.uptime / 60);
      console.log(`${chalk.gray('Uptime:')} ${uptimeMinutes}m`);
    }

    if (status.healthy !== undefined) {
      const healthIcon = status.healthy ? chalk.green('✓') : chalk.red('✗');
      console.log(
        `${chalk.gray('Health:')} ${healthIcon} ${status.healthy ? 'healthy' : 'unhealthy'}`
      );
    }
  } else {
    console.log(chalk.yellow('● Server is not running'));
  }

  console.log('');
}

/**
 * Run MCP server integration tests
 */
async function testServer(options: { verbose: boolean; coverage: boolean }): Promise<void> {
  console.log(chalk.bold('\n⚡ Running MCP Integration Tests\n'));

  const testDir = path.join(MCP_SERVER_DIR, 'tests');

  if (!fs.existsSync(testDir)) {
    console.error(chalk.red('✗ Test directory not found:'), testDir);
    process.exit(1);
  }

  try {
    const jestArgs = ['jest', 'tests/integration.test.ts', '--testTimeout=30000'];

    if (options.verbose) {
      jestArgs.push('--verbose');
    }

    if (options.coverage) {
      jestArgs.push('--coverage');
    }

    console.log(chalk.gray('Running:'), 'npx', jestArgs.join(' '));
    console.log('');

    const testProcess = spawn('npx', jestArgs, {
      cwd: MCP_SERVER_DIR,
      stdio: 'inherit',
    });

    testProcess.on('exit', code => {
      if (code === 0) {
        console.log(chalk.green('\n✓ All tests passed\n'));
      } else {
        console.log(chalk.red(`\n✗ Tests failed with code ${code}\n`));
        process.exit(code || 1);
      }
    });
  } catch (error) {
    console.error(chalk.red('✗ Failed to run tests:'), (error as Error).message);
    process.exit(1);
  }
}

/**
 * Execute PostGIS query via MCP
 */
async function executeQuery(
  queryName: string,
  options: {
    args?: string;
    countyId: string;
    json?: boolean;
  }
): Promise<void> {
  if (!options.json) {
    console.log(chalk.bold('\n⚡ Executing MCP Query\n'));
    console.log(`${chalk.gray('Query:')} ${chalk.cyan(queryName)}`);
    console.log(`${chalk.gray('County ID:')} ${options.countyId}\n`);
  }

  // Check if server is running
  const status = await getServerStatus();
  if (!status.running) {
    console.error(chalk.red('✗ MCP server is not running'));
    console.log(chalk.yellow('Start server first: tdc mcp start\n'));
    process.exit(1);
  }

  // Parse query arguments
  let queryArgs: any = { countyId: parseInt(options.countyId, 10) };
  if (options.args) {
    try {
      const parsedArgs = JSON.parse(options.args);
      queryArgs = { ...queryArgs, ...parsedArgs };
    } catch (error) {
      console.error(chalk.red('✗ Invalid JSON in --args'));
      process.exit(1);
    }
  }

  try {
    const startTime = Date.now();

    // Make MCP query request
    const response = await fetch(`http://localhost:${status.port}/query/${queryName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryArgs),
    });

    const executionTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(chalk.green('✓ Query executed successfully'));
      console.log(`${chalk.gray('Execution time:')} ${executionTime}ms\n`);
      console.log(chalk.bold('Result:'));
      console.log(JSON.stringify(result, null, 2));
      console.log('');
    }
  } catch (error) {
    console.error(chalk.red('✗ Query failed:'), (error as Error).message);
    process.exit(1);
  }
}

/**
 * Show MCP server logs
 */
async function showLogs(options: { follow: boolean; lines: string }): Promise<void> {
  const logFile = path.join(MCP_SERVER_DIR, 'logs', 'mcp-postgis.log');

  if (!fs.existsSync(logFile)) {
    console.log(chalk.yellow('⚠ No log file found\n'));
    return;
  }

  console.log(chalk.bold('\n⚡ MCP Server Logs\n'));
  console.log(chalk.gray(`File: ${logFile}\n`));

  if (options.follow) {
    // Follow mode - use tail -f
    const tailProcess = spawn('tail', ['-f', logFile], {
      stdio: 'inherit',
    });

    tailProcess.on('exit', () => {
      console.log(chalk.yellow('\nStopped following logs\n'));
    });
  } else {
    // Static mode - show last N lines
    const tailProcess = spawn('tail', ['-n', options.lines, logFile], {
      stdio: 'inherit',
    });

    tailProcess.on('exit', () => {
      console.log('');
    });
  }
}

/**
 * Get current MCP server status
 */
async function getServerStatus(): Promise<McpStatus> {
  // Check PID file
  if (!fs.existsSync(MCP_PID_FILE)) {
    return { running: false };
  }

  const pidStr = fs.readFileSync(MCP_PID_FILE, 'utf-8').trim();
  const pid = parseInt(pidStr, 10);

  if (!isProcessRunning(pid)) {
    // Process not running, clean up stale PID file
    fs.unlinkSync(MCP_PID_FILE);
    return { running: false };
  }

  // Check health endpoint
  const port = parseInt(MCP_PORT.toString(), 10);
  let healthy = false;

  try {
    const response = await fetch(`http://localhost:${port}/health`);
    healthy = response.ok;
  } catch {
    // Health check failed
  }

  return {
    running: true,
    pid,
    port,
    healthy,
  };
}

/**
 * Check if process is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServerReady(port: number, timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);

      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet
    }

    await sleep(500);
  }

  throw new Error('Server failed to start within timeout');
}

/**
 * Build MCP server
 */
async function buildServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: MCP_SERVER_DIR,
      stdio: 'inherit',
    });

    buildProcess.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
