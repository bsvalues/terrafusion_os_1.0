#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { aiCommand } from './commands/ai';
import { auditCommand } from './commands/audit';
import { complianceCommand } from './commands/compliance';
import { countyCommand } from './commands/county';
import { debugCommand } from './commands/debug';
import { deployCommand } from './commands/deploy';
import { doctorCommand } from './commands/doctor';
import { evidenceCommand } from './commands/evidence';
import { launchCommand } from './commands/launch-backend';
import { mcpCommand } from './commands/mcp';
import { postureCommand } from './commands/posture';
import { skillCommand } from './commands/skill';
import { statusCommand } from './commands/status';
import { testCommand } from './commands/test';
import { transparencyCommand } from './commands/transparency';
import { workspaceCommand } from './commands/workspace';

const program = new Command();

program
  .name('tdc')
  .description('🏛️ TerraFusion Developer Console - Government OS Entry Point')
  .version('0.1.0');

// Global banner
program.addHelpText(
  'beforeAll',
  `
${chalk.cyan('🏛️ TerraFusion OS - Government. Transcended.')}
${chalk.gray('Elite Developer Console for 50,000+ AI Agent Orchestration')}
`
);

// Register commands
program.addCommand(statusCommand);
program.addCommand(launchCommand);
program.addCommand(workspaceCommand);
program.addCommand(debugCommand);
program.addCommand(doctorCommand);
program.addCommand(aiCommand);
program.addCommand(auditCommand);
program.addCommand(complianceCommand);
program.addCommand(countyCommand);
program.addCommand(evidenceCommand);
program.addCommand(mcpCommand);
program.addCommand(postureCommand);
program.addCommand(skillCommand);
program.addCommand(testCommand);
program.addCommand(transparencyCommand);
program.addCommand(deployCommand);

// Default action - show help
program.action(() => {
  program.help();
});

// Enhanced error handling
program.exitOverride(err => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  if (err.code === 'commander.version') {
    process.exit(0);
  }
  console.error(chalk.red('❌ TDC Error:'), err.message);
  process.exit(1);
});

// Parse commands
program.parseAsync(process.argv).catch(error => {
  console.error(chalk.red('❌ TDC Fatal Error:'), error.message);
  process.exit(1);
});
