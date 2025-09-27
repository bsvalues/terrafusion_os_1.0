#!/usr/bin/env ts-node

/**
 * Terrafusion OS 1.0 Workspace Companion Agent Launcher
 *
 * This script automatically launches your AI companion when you start working
 * in the Terrafusion OS 1.0 workspace.
 *
 * Features:
 * - Automatic workspace detection
 * - Intelligent agent activation
 * - Interactive command interface
 * - Natural language processing
 * - Real-time workspace monitoring
 *
 * Usage:
 *   npm run companion          # Launch the companion agent
 *   npm run companion:dev      # Launch in development mode
 *   npm run companion:quiet    # Launch without verbose output
 */

import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';
import WorkspaceCompanionAgent from './WorkspaceCompanionAgent';
import InteractiveCommandInterface from './InteractiveCommandInterface';

// Load environment variables
config();

// Configuration
const CONFIG = {
  workspaceName: 'terrafusion_os_1.0',
  autoActivate: true,
  verboseMode: true,
  developmentMode: process.env['NODE_ENV'] === 'development',
  quietMode: process.argv.includes('--quiet') || process.argv.includes('-q'),
};

/**
 * Main launcher class
 */
class CompanionLauncher {
  private agent: WorkspaceCompanionAgent;
  private interface: InteractiveCommandInterface | null = null;
  private isRunning: boolean = false;
  private workspaceRoot: string = process.cwd();

  constructor() {
    this.agent = new WorkspaceCompanionAgent();
    this.setupAgentEventListeners();
  }

  /**
   * Set up event listeners for the agent
   */
  private setupAgentEventListeners(): void {
    // Agent activation events
    this.agent.on('agent-activated', data => {
      if (!CONFIG.quietMode) {
        console.log('🎉 Agent activated successfully!');
        console.log(`📊 Active capabilities: ${data.capabilities.length}`);
      }
    });

    // File change events
    this.agent.on('file-changed', change => {
      if (CONFIG.verboseMode && !CONFIG.quietMode) {
        console.log(`📝 File change: ${change.filename} (${change.action})`);
      }
    });

    // Health events
    this.agent.on('health-critical', () => {
      console.log('🚨 CRITICAL HEALTH ISSUE DETECTED!');
      console.log('Please run .health for detailed information');
    });

    this.agent.on('health-warning', () => {
      if (!CONFIG.quietMode) {
        console.log('⚠️ Health warning detected');
        console.log('Please run .health for detailed information');
      }
    });

    // Agent deactivation events
    this.agent.on('agent-deactivated', data => {
      if (!CONFIG.quietMode) {
        console.log('🔄 Agent deactivated');
        console.log(`⏱️ Session duration: ${Math.round(data.sessionDuration / 1000)}s`);
      }
    });
  }

  /**
   * Install required dependencies automatically
   */
  private async installDependencies(): Promise<void> {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.log('⚠️ No package.json found, skipping dependency installation');
      return;
    }

    try {
      // Check if node_modules exists
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        console.log('📦 Installing dependencies...');

        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        await execAsync('npm install');
        console.log('✅ Dependencies installed successfully');
      } else {
        console.log('✅ Dependencies already installed');
      }
    } catch (error) {
      console.warn('⚠️ Failed to install dependencies, continuing anyway:', error);
    }
  }

  /**
   * Validate workspace environment
   */
  private validateWorkspace(): boolean {
    const currentDir = process.cwd();
    const workspaceName = path.basename(currentDir);

    // Check if we're in the main workspace or a subdirectory
    if (workspaceName !== CONFIG.workspaceName && !currentDir.includes(CONFIG.workspaceName)) {
      console.error('❌ Invalid workspace detected!');
      console.error(`Expected: ${CONFIG.workspaceName} or a subdirectory within it`);
      console.error(`Current: ${workspaceName}`);
      console.error(`Path: ${currentDir}`);
      console.error('');
      console.error(
        'Please run this script from the Terrafusion OS 1.0 workspace directory or a subdirectory within it.'
      );
      return false;
    }

    // Check for essential Terrafusion files
    const essentialFiles = [
      'package.json',
      'CLAUDE.md',
      'README.md',
      'backend',
      'frontend',
      'modules',
    ];

    // If we're in a subdirectory, check the parent directory
    const checkDir =
      currentDir.includes(CONFIG.workspaceName) && workspaceName !== CONFIG.workspaceName
        ? currentDir.substring(
            0,
            currentDir.indexOf(CONFIG.workspaceName) + CONFIG.workspaceName.length
          )
        : currentDir;

    this.workspaceRoot = checkDir;

    const missingFiles = essentialFiles.filter(file => !fs.existsSync(path.join(checkDir, file)));

    if (missingFiles.length > 0) {
      console.error('❌ Missing essential Terrafusion files:');
      missingFiles.forEach(file => console.error(`   - ${file}`));
      console.error('');
      console.error('This does not appear to be a valid Terrafusion OS 1.0 workspace.');
      return false;
    }

    if (!CONFIG.quietMode) {
      console.log('✅ Workspace validation passed');
      console.log(`🏛️ Project: ${path.basename(this.workspaceRoot)}`);
      console.log(`📁 Directory: ${this.workspaceRoot}`);
    }

    return true;
  }

  /**
   * Display launch banner
   */
  private displayLaunchBanner(): void {
    if (CONFIG.quietMode) return;

    console.log('');
    console.log('🚀 TERRAFUSION OS 1.0 WORKSPACE COMPANION AGENT');
    console.log('='.repeat(60));
    console.log('🤖 Your intelligent AI companion for Terrafusion development');
    console.log('🎯 Automatic workspace monitoring and assistance');
    console.log('🧠 Deep understanding of the Terrafusion architecture');
    console.log('🏛️ Government compliance and security validation');
    console.log('⚡ Quantum performance optimization');
    console.log('='.repeat(60));
    console.log('');
  }

  /**
   * Launch the companion agent
   */
  public async launch(): Promise<void> {
    if (this.isRunning) {
      console.log('🤖 Companion agent is already running');
      return;
    }

    try {
      // Display launch banner
      this.displayLaunchBanner();

      // Install dependencies automatically
      await this.installDependencies();

      // Validate workspace
      if (!this.validateWorkspace()) {
        process.exit(1);
      }

      // Ensure process runs from workspace root for accurate detection
      try {
        process.chdir(this.workspaceRoot);
      } catch (e) {
        console.error('❌ Failed to change directory to workspace root:', this.workspaceRoot);
      }

      // Check if auto-activation is enabled
      if (CONFIG.autoActivate) {
        if (!CONFIG.quietMode) {
          console.log('🔄 Auto-activating companion agent...');
        }

        // Launch interactive interface
        await this.launchInteractiveInterface();
      } else {
        if (!CONFIG.quietMode) {
          console.log('⏸️ Auto-activation disabled. Use .activate to start manually.');
        }
      }

      this.isRunning = true;
    } catch (error) {
      console.error('❌ Failed to launch companion agent:', error);
      process.exit(1);
    }
  }

  /**
   * Launch the interactive command interface
   */
  private async launchInteractiveInterface(): Promise<void> {
    try {
      // Create and start the interactive interface
      this.interface = new InteractiveCommandInterface(this.agent);

      if (!CONFIG.quietMode) {
        console.log('🎯 Launching interactive command interface...');
      }

      // Start the interface
      await this.interface.start();
    } catch (error) {
      console.error('❌ Failed to launch interactive interface:', error);
      throw error;
    }
  }

  /**
   * Launch in development mode
   */
  public async launchDev(): Promise<void> {
    CONFIG.developmentMode = true;
    CONFIG.verboseMode = true;
    CONFIG.quietMode = false;

    console.log('🔧 Launching in development mode...');
    await this.launch();
  }

  /**
   * Launch in quiet mode
   */
  public async launchQuiet(): Promise<void> {
    CONFIG.quietMode = true;
    CONFIG.verboseMode = false;

    console.log('🔇 Launching in quiet mode...');
    await this.launch();
  }

  /**
   * Stop the companion agent
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      if (this.interface) {
        this.interface.stop();
      }

      if (this.agent.isAgentActive()) {
        await this.agent.deactivate();
      }

      this.isRunning = false;
      console.log('🛑 Companion agent stopped');
    } catch (error) {
      console.error('❌ Error stopping companion agent:', error);
    }
  }

  /**
   * Get agent status
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      agentActive: this.agent.isAgentActive(),
      interfaceActive: this.interface !== null,
      config: CONFIG,
    };
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const launcher = new CompanionLauncher();

  // Handle command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--dev') || args.includes('-d')) {
    await launcher.launchDev();
  } else if (args.includes('--quiet') || args.includes('-q')) {
    await launcher.launchQuiet();
  } else if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    process.exit(0);
  } else if (args.includes('--status') || args.includes('-s')) {
    const status = launcher.getStatus();
    console.log('📊 Companion Agent Status:');
    console.log(JSON.stringify(status, null, 2));
    process.exit(0);
  } else {
    await launcher.launch();
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await launcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await launcher.stop();
    process.exit(0);
  });
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log('');
  console.log('🤖 TERRAFUSION OS 1.0 WORKSPACE COMPANION AGENT');
  console.log('='.repeat(60));
  console.log('');
  console.log('Usage:');
  console.log('  npm run companion              # Launch the companion agent');
  console.log('  npm run companion:dev          # Launch in development mode');
  console.log('  npm run companion:quiet        # Launch without verbose output');
  console.log('');
  console.log('Command Line Options:');
  console.log('  --dev, -d                      # Development mode (verbose)');
  console.log('  --quiet, -q                    # Quiet mode (minimal output)');
  console.log('  --help, -h                     # Show this help message');
  console.log('  --status, -s                   # Show agent status');
  console.log('');
  console.log('Interactive Commands:');
  console.log('  .status                        # Show workspace status');
  console.log('  .health                        # Perform health check');
  console.log('  .ai-swarm                      # Show AI swarm status');
  console.log('  .capabilities                  # List agent capabilities');
  console.log('  .help                          # Show help information');
  console.log('  .deactivate                    # Deactivate the agent');
  console.log('  .exit                          # Exit the interface');
  console.log('');
  console.log('Natural Language Examples:');
  console.log('  "How is the system doing?"     # Check system status');
  console.log('  "Show me the AI agents"        # Display AI swarm info');
  console.log('  "What can you do?"             # Show capabilities');
  console.log('  "Run a health check"           # Perform health check');
  console.log('');
  console.log('Features:');
  console.log('  🎯 Automatic workspace detection');
  console.log('  🤖 Intelligent AI assistance');
  console.log('  📊 Real-time monitoring');
  console.log('  🧠 Deep codebase understanding');
  console.log('  🏛️ Government compliance validation');
  console.log('  ⚡ Performance optimization');
  console.log('  📝 Natural language processing');
  console.log('');
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default CompanionLauncher;
