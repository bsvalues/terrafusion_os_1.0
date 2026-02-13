import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../..');
const MCP_APPROVALS_DIR = join(REPO_ROOT, '.terrafusion', 'mcp-approvals');

interface MCPApproval {
  toolId: string;
  approvedBy: string;
  approvalDate: string;
  riskLevel: string;
  scope: string;
  expiresAt: string | null;
  revoked: boolean;
}

const KNOWN_SERVERS = [
  { id: 'document-server', name: 'Document Server', risk: 'read', description: 'Document generation and management' },
  { id: 'harris-pacs-connector', name: 'Harris PACS Connector', risk: 'write-remote', description: 'Bidirectional sync with Harris PACS 9.0' },
  { id: 'revenue-discovery-tools', name: 'Revenue Discovery', risk: 'write-remote', description: 'Property revenue analysis tools' },
  { id: 'property-assessment-suite', name: 'Assessment Suite', risk: 'write-remote', description: 'Automated property assessment' },
  { id: 'compliance-monitoring-kit', name: 'Compliance Monitor', risk: 'read', description: 'FISMA compliance monitoring' },
];

export const mcpCommand = new Command('mcp')
  .description('🔌 MCP server management and activation')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List MCP servers and their activation status')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        const spinner = ora('Checking MCP servers...').start();

        try {
          // Load approvals
          const approvals: Record<string, MCPApproval[]> = {};
          if (existsSync(MCP_APPROVALS_DIR)) {
            const files = readdirSync(MCP_APPROVALS_DIR).filter(f => f.endsWith('.json'));
            for (const file of files) {
              const approval: MCPApproval = JSON.parse(await readFile(join(MCP_APPROVALS_DIR, file), 'utf8'));
              if (!approvals[approval.toolId]) approvals[approval.toolId] = [];
              approvals[approval.toolId].push(approval);
            }
          }

          const servers = KNOWN_SERVERS.map(s => {
            const serverApprovals = approvals[s.id] || [];
            const activeApprovals = serverApprovals.filter(a => !a.revoked && (!a.expiresAt || new Date(a.expiresAt) > new Date()));
            return {
              ...s,
              approvals: serverApprovals.length,
              activeApprovals: activeApprovals.length,
              scopes: [...new Set(activeApprovals.map(a => a.scope))],
              activated: activeApprovals.length > 0,
            };
          });

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify({ servers, timestamp: new Date().toISOString() }, null, 2));
            return;
          }

          console.log(chalk.cyan('\n🔌 MCP Server Registry\n'));
          console.log(chalk.gray('─'.repeat(80)));

          for (const server of servers) {
            const statusIcon = server.activated ? chalk.green('●') : chalk.gray('○');
            const riskColor = server.risk === 'read' ? chalk.green : server.risk === 'write-remote' ? chalk.magenta : chalk.yellow;

            console.log(`  ${statusIcon} ${chalk.white.bold(server.id)}`);
            console.log(`    ${chalk.gray(server.description)}`);
            console.log(`    Risk: ${riskColor(server.risk)} | Scopes: ${server.scopes.length > 0 ? server.scopes.map(s => chalk.cyan(s)).join(', ') : chalk.gray('none')} | Approvals: ${server.activeApprovals}/${server.approvals}`);
            console.log();
          }

          const active = servers.filter(s => s.activated).length;
          console.log(chalk.gray('─'.repeat(80)));
          console.log(`  ${chalk.green(`${active} activated`)} | ${servers.length - active} inactive | ${servers.length} total`);
          console.log();
        } catch (error) {
          spinner.fail('Failed to list MCP servers');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show detailed MCP server status')
      .argument('[serverId]', 'specific server to check')
      .option('-j, --json', 'output as JSON')
      .action(async (serverId: string | undefined, options) => {
        if (!existsSync(MCP_APPROVALS_DIR)) {
          console.log(chalk.yellow('No MCP approvals found. Run MCP activation workflow first.'));
          console.log(chalk.gray('See: tools/dx/mcp-activation/README.md'));
          process.exit(1);
        }

        const files = readdirSync(MCP_APPROVALS_DIR).filter(f => f.endsWith('.json'));
        const approvals: MCPApproval[] = [];

        for (const file of files) {
          const approval = JSON.parse(await readFile(join(MCP_APPROVALS_DIR, file), 'utf8'));
          if (!serverId || approval.toolId === serverId) {
            approvals.push(approval);
          }
        }

        if (options.json) {
          console.log(JSON.stringify({ approvals }, null, 2));
          return;
        }

        console.log(chalk.cyan('\n🔌 MCP Approval Status\n'));
        console.log(chalk.gray('─'.repeat(70)));

        for (const a of approvals) {
          const isActive = !a.revoked && (!a.expiresAt || new Date(a.expiresAt) > new Date());
          const icon = isActive ? chalk.green('✅') : a.revoked ? chalk.red('❌') : chalk.yellow('⏰');
          const riskColor = a.riskLevel === 'read' ? chalk.green : chalk.magenta;

          console.log(`  ${icon} ${chalk.white.bold(a.toolId)} ${chalk.gray('(' + a.scope + ')')}`);
          console.log(`    Approved by: ${chalk.cyan(a.approvedBy)} | Risk: ${riskColor(a.riskLevel)}`);
          console.log(`    Approved: ${chalk.gray(a.approvalDate)} | Expires: ${a.expiresAt ? chalk.yellow(a.expiresAt) : chalk.gray('never')}`);
          if (a.revoked) console.log(`    ${chalk.red('REVOKED')}`);
          console.log();
        }

        console.log(chalk.gray('─'.repeat(70)));
        const active = approvals.filter(a => !a.revoked).length;
        console.log(`  ${active} active | ${approvals.length - active} revoked | ${approvals.length} total`);
        console.log();
      })
  );
