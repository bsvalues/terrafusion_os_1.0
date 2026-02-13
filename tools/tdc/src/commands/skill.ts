import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../..');
const SKILLS_DIR = join(REPO_ROOT, 'tools', 'dx', 'skills');
const REGISTRY_PATH = join(SKILLS_DIR, 'registry.json');

interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  ownerLane: string;
  riskLevel: string;
  status: string;
  path: string;
  contract: string;
  tags: string[];
  dependencies: string[];
}

interface SkillRegistry {
  version: string;
  description: string;
  skills: Skill[];
  metadata: {
    totalSkills: number;
    activeSkills: number;
    lanes: Record<string, number>;
    lastUpdated: string;
  };
}

export const skillCommand = new Command('skill')
  .alias('sk')
  .description('🧩 Browse and manage TerraFusion Skills Registry')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all registered skills')
      .option('-j, --json', 'output as JSON')
      .option('-l, --lane <lane>', 'filter by lane (dev, governance, ops, security, data)')
      .option('-t, --tag <tag>', 'filter by tag')
      .action(async (options) => {
        const spinner = ora('Loading skills registry...').start();

        try {
          if (!existsSync(REGISTRY_PATH)) {
            spinner.fail('Skills registry not found');
            console.log(chalk.yellow('\nExpected: tools/dx/skills/registry.json'));
            process.exit(1);
          }

          const registry: SkillRegistry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
          let skills = registry.skills;

          if (options.lane) {
            skills = skills.filter(s => s.ownerLane === options.lane);
          }
          if (options.tag) {
            skills = skills.filter(s => s.tags.includes(options.tag));
          }

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify({ skills, metadata: registry.metadata }, null, 2));
            return;
          }

          console.log(chalk.cyan('\n🧩 TerraFusion Skills Registry\n'));
          console.log(chalk.gray('─'.repeat(70)));

          const laneColors: Record<string, (s: string) => string> = {
            dev: chalk.blue,
            governance: chalk.yellow,
            ops: chalk.magenta,
            security: chalk.red,
            data: chalk.green,
          };

          for (const skill of skills) {
            const laneColor = laneColors[skill.ownerLane] || chalk.white;
            const statusIcon = skill.status === 'active' ? chalk.green('●') : chalk.gray('○');

            console.log(`  ${statusIcon} ${chalk.white.bold(skill.id)} ${chalk.gray('v' + skill.version)}`);
            console.log(`    ${chalk.gray(skill.description)}`);
            console.log(`    ${laneColor(`[${skill.ownerLane}]`)} ${chalk.gray('risk:')} ${riskColor(skill.riskLevel)} ${chalk.gray('tags:')} ${skill.tags.map(t => chalk.cyan(t)).join(', ')}`);

            if (skill.dependencies.length > 0) {
              console.log(`    ${chalk.gray('deps:')} ${skill.dependencies.map(d => chalk.yellow(d)).join(', ')}`);
            }
            console.log();
          }

          console.log(chalk.gray('─'.repeat(70)));
          console.log(`  ${chalk.white('Total:')} ${skills.length} skills | ${chalk.green('Active:')} ${skills.filter(s => s.status === 'active').length}`);
          console.log();
        } catch (error) {
          spinner.fail('Failed to load skills registry');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('info')
      .description('Show detailed information about a skill')
      .argument('<skillId>', 'skill identifier (e.g., tf-pr-evidence-pack)')
      .option('-j, --json', 'output as JSON')
      .action(async (skillId: string, options) => {
        const spinner = ora(`Loading skill: ${skillId}...`).start();

        try {
          if (!existsSync(REGISTRY_PATH)) {
            spinner.fail('Skills registry not found');
            process.exit(1);
          }

          const registry: SkillRegistry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
          const skill = registry.skills.find(s => s.id === skillId);

          if (!skill) {
            spinner.fail(`Skill not found: ${skillId}`);
            console.log(chalk.yellow('\nAvailable skills:'));
            registry.skills.forEach(s => console.log(`  - ${s.id}`));
            process.exit(1);
          }

          // Check if SKILL.md exists and read it
          const skillMdPath = join(REPO_ROOT, skill.path, 'SKILL.md');
          let skillMdContent = '';
          let hasSkillMd = false;
          if (existsSync(skillMdPath)) {
            skillMdContent = await readFile(skillMdPath, 'utf8');
            hasSkillMd = true;
          }

          // Check if contract exists
          const contractPath = join(REPO_ROOT, skill.contract);
          let hasContract = existsSync(contractPath);
          let contract = null;
          if (hasContract) {
            contract = JSON.parse(await readFile(contractPath, 'utf8'));
          }

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify({ skill, hasSkillMd, hasContract, contract }, null, 2));
            return;
          }

          const laneColors: Record<string, (s: string) => string> = {
            dev: chalk.blue,
            governance: chalk.yellow,
            ops: chalk.magenta,
            security: chalk.red,
            data: chalk.green,
          };
          const laneColor = laneColors[skill.ownerLane] || chalk.white;

          console.log(chalk.cyan(`\n🧩 ${skill.name}\n`));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(`  ${chalk.white('ID:')}          ${chalk.yellow(skill.id)}`);
          console.log(`  ${chalk.white('Version:')}     ${chalk.gray(skill.version)}`);
          console.log(`  ${chalk.white('Description:')} ${chalk.gray(skill.description)}`);
          console.log(`  ${chalk.white('Lane:')}        ${laneColor(skill.ownerLane)}`);
          console.log(`  ${chalk.white('Risk:')}        ${riskColor(skill.riskLevel)}`);
          console.log(`  ${chalk.white('Status:')}      ${skill.status === 'active' ? chalk.green('active') : chalk.gray(skill.status)}`);
          console.log(`  ${chalk.white('Tags:')}        ${skill.tags.map(t => chalk.cyan(t)).join(', ')}`);

          if (skill.dependencies.length > 0) {
            console.log(`  ${chalk.white('Deps:')}        ${skill.dependencies.map(d => chalk.yellow(d)).join(', ')}`);
          }

          console.log(chalk.gray('\n─ Files ─'.padEnd(60, '─')));
          console.log(`  ${hasSkillMd ? chalk.green('✅') : chalk.red('❌')} SKILL.md     ${chalk.gray(skill.path + '/SKILL.md')}`);
          console.log(`  ${hasContract ? chalk.green('✅') : chalk.red('❌')} contract     ${chalk.gray(skill.contract)}`);

          if (hasContract && contract?.capabilities) {
            console.log(chalk.gray('\n─ Capabilities ─'.padEnd(60, '─')));
            contract.capabilities.forEach((cap: string) => {
              console.log(`  ${chalk.cyan('•')} ${cap}`);
            });
          }

          console.log();
        } catch (error) {
          spinner.fail(`Failed to load skill: ${skillId}`);
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('validate')
      .description('Validate all skills in the registry')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        const spinner = ora('Validating skills registry...').start();

        try {
          if (!existsSync(REGISTRY_PATH)) {
            spinner.fail('Skills registry not found');
            process.exit(1);
          }

          const registry: SkillRegistry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
          const results: Array<{ id: string; valid: boolean; issues: string[] }> = [];

          for (const skill of registry.skills) {
            const issues: string[] = [];

            // Check SKILL.md
            const skillMdPath = join(REPO_ROOT, skill.path, 'SKILL.md');
            if (!existsSync(skillMdPath)) {
              issues.push('Missing SKILL.md');
            }

            // Check contract
            const contractPath = join(REPO_ROOT, skill.contract);
            if (!existsSync(contractPath)) {
              issues.push('Missing contract.json');
            }

            // Check dependencies exist in registry
            for (const dep of skill.dependencies) {
              if (!registry.skills.find(s => s.id === dep)) {
                issues.push(`Dependency not in registry: ${dep}`);
              }
            }

            results.push({ id: skill.id, valid: issues.length === 0, issues });
          }

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify({ results, allValid: results.every(r => r.valid) }, null, 2));
            return;
          }

          console.log(chalk.cyan('\n🔍 Skills Validation\n'));
          console.log(chalk.gray('─'.repeat(60)));

          for (const result of results) {
            const icon = result.valid ? chalk.green('✅') : chalk.red('❌');
            console.log(`  ${icon} ${chalk.white(result.id)}`);
            for (const issue of result.issues) {
              console.log(`     ${chalk.red('⚠')} ${chalk.yellow(issue)}`);
            }
          }

          const valid = results.filter(r => r.valid).length;
          const total = results.length;
          console.log(chalk.gray('\n─'.repeat(60)));
          console.log(`  ${valid === total ? chalk.green('✅ All valid') : chalk.red(`❌ ${total - valid} issues`)} (${valid}/${total})`);
          console.log();

          if (valid < total) process.exit(1);
        } catch (error) {
          spinner.fail('Failed to validate skills');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  );

function riskColor(risk: string): string {
  switch (risk) {
    case 'read': return chalk.green(risk);
    case 'write-safe': return chalk.blue(risk);
    case 'write-local': return chalk.yellow(risk);
    case 'write-remote': return chalk.magenta(risk);
    case 'write-production': return chalk.red(risk);
    case 'destructive': return chalk.bgRed.white(risk);
    default: return chalk.gray(risk);
  }
}
