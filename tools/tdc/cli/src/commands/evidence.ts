/**
 * TerraFusion Evidence Pack Command
 *
 * Keystone aggregator for all lane audit contracts with cryptographic integrity.
 *
 * Commands:
 * - build:    Aggregate all contracts into single Evidence Pack + generate PR snippet
 * - validate: Verify cryptographic integrity (SHA-256 hashes, Context Pack hash)
 * - show:     Display Evidence Pack in requested format (json, markdown, summary)
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { aggregateEvidencePack } from '../lib/evidence/aggregate';
import { generateMarkdownSnippet } from '../lib/evidence/markdown';
import { normalizeEvidencePack } from '../lib/evidence/normalizer';
import { validateEvidencePack } from '../lib/evidence/validate';

const CONTRACTS_DIR = '.terrafusion/contracts';
const CONTEXT_PATH = '.terrafusion/context/latest.json';

/**
 * Build Evidence Pack - Aggregate all lane contracts
 */
export async function buildEvidence(options: {
  pr?: string;
  branch?: string;
  output?: string;
}): Promise<void> {
  console.log(chalk.cyan('🏛️  Building TerraFusion Evidence Pack...\n'));

  try {
    // Ensure .terrafusion/contracts directory exists
    if (!fs.existsSync(CONTRACTS_DIR)) {
      fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
      console.log(chalk.gray(`Created ${CONTRACTS_DIR} directory`));
    }

    // Discover all contract artifacts (exclude evidence-pack-*.json)
    const contractFiles = fs
      .readdirSync(CONTRACTS_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('evidence-pack-'))
      .map(f => path.join(CONTRACTS_DIR, f));

    console.log(chalk.gray(`Found ${contractFiles.length} contract artifacts\n`));

    if (contractFiles.length === 0) {
      console.log(
        chalk.yellow('⚠️  No contracts found - Evidence Pack will have empty contracts array')
      );
    }

    // Aggregate contracts into Evidence Pack
    const evidencePack = await aggregateEvidencePack({
      contractFiles,
      prNumber: options.pr ? parseInt(options.pr) : undefined,
      branchRef: options.branch,
      contextPath: CONTEXT_PATH,
    });

    // Normalize pack (strip dynamic fields for determinism)
    const normalizedPack = normalizeEvidencePack(evidencePack);

    // Write to output file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputPath =
      options.output || path.join(CONTRACTS_DIR, `evidence-pack-${timestamp}.json`);
    const latestPath = path.join(CONTRACTS_DIR, 'evidence-pack-latest.json');

    fs.writeFileSync(outputPath, JSON.stringify(normalizedPack, null, 2), 'utf8');
    fs.writeFileSync(latestPath, JSON.stringify(normalizedPack, null, 2), 'utf8');

    console.log(chalk.green(`✅ Evidence Pack built successfully\n`));
    console.log(chalk.gray(`Output: ${outputPath}`));
    console.log(chalk.gray(`Latest: ${latestPath}\n`));

    // Display summary
    const statusIcon =
      evidencePack.overallStatus === 'PASS'
        ? chalk.green('✅')
        : evidencePack.overallStatus === 'FAIL'
          ? chalk.red('❌')
          : evidencePack.overallStatus === 'WARN'
            ? chalk.yellow('⚠️ ')
            : chalk.gray('⊘');

    console.log(`${statusIcon} Overall Status: ${chalk.bold(evidencePack.overallStatus)}`);
    console.log(chalk.gray(`Lanes Audited: ${evidencePack.lanesAudited.join(', ') || 'none'}`));
    console.log(chalk.gray(`Total Violations: ${evidencePack.totalViolations}`));
    console.log(chalk.gray(`Contracts Aggregated: ${evidencePack.contracts.length}`));

    if (evidencePack.overallStatus === 'FAIL') {
      console.log(chalk.red('\n⚠️  Evidence Pack FAIL - CI will block merge\n'));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Evidence Pack build failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Validate Evidence Pack - Verify cryptographic integrity
 */
export async function validateEvidence(options: { pack?: string }): Promise<void> {
  console.log(chalk.cyan('🔒 Validating TerraFusion Evidence Pack...\n'));

  try {
    const packPath = options.pack || path.join(CONTRACTS_DIR, 'evidence-pack-latest.json');

    if (!fs.existsSync(packPath)) {
      throw new Error(`Evidence Pack not found: ${packPath}`);
    }

    const evidencePack = JSON.parse(fs.readFileSync(packPath, 'utf8'));

    const validation = await validateEvidencePack(evidencePack, CONTRACTS_DIR, CONTEXT_PATH);

    if (validation.valid) {
      console.log(chalk.green('✅ Evidence Pack validation PASSED\n'));
      console.log(chalk.gray(`All ${validation.artifactsChecked} artifact hashes match`));
      console.log(chalk.gray(`Context Pack hash verified`));
    } else {
      console.log(chalk.red('❌ Evidence Pack validation FAILED\n'));

      if (validation.errors.length > 0) {
        console.log(chalk.red('Errors:'));
        validation.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
      }

      if (validation.tamperedArtifacts.length > 0) {
        console.log(chalk.red('\nTampered artifacts detected:'));
        validation.tamperedArtifacts.forEach(artifact => {
          console.log(chalk.red(`  - ${artifact.path}`));
          console.log(chalk.gray(`    Expected: ${artifact.expectedHash}`));
          console.log(chalk.gray(`    Actual:   ${artifact.actualHash}`));
        });
      }

      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Evidence Pack validation failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Show Evidence Pack - Display in requested format
 */
export async function showEvidence(options: {
  pack?: string;
  format?: 'json' | 'markdown' | 'summary';
}): Promise<void> {
  try {
    const packPath = options.pack || path.join(CONTRACTS_DIR, 'evidence-pack-latest.json');

    if (!fs.existsSync(packPath)) {
      throw new Error(`Evidence Pack not found: ${packPath}`);
    }

    const evidencePack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
    const format = options.format || 'markdown';

    if (format === 'json') {
      console.log(JSON.stringify(evidencePack, null, 2));
    } else if (format === 'markdown') {
      console.log(evidencePack.markdownSnippet || generateMarkdownSnippet(evidencePack));
    } else if (format === 'summary') {
      const statusIcon =
        evidencePack.overallStatus === 'PASS'
          ? chalk.green('✅')
          : evidencePack.overallStatus === 'FAIL'
            ? chalk.red('❌')
            : evidencePack.overallStatus === 'WARN'
              ? chalk.yellow('⚠️ ')
              : chalk.gray('⊘');

      console.log(chalk.bold('\n🏛️  TerraFusion PR Evidence Pack\n'));
      console.log(`${statusIcon} Overall Status: ${chalk.bold(evidencePack.overallStatus)}`);
      console.log(chalk.gray(`PR: #${evidencePack.prNumber || 'N/A'}`));
      console.log(chalk.gray(`Branch: ${evidencePack.branchRef || 'N/A'}`));
      console.log(chalk.gray(`Generated: ${evidencePack.generatedAt}`));
      console.log(chalk.gray(`Lanes Audited: ${evidencePack.lanesAudited.join(', ') || 'none'}`));
      console.log(chalk.gray(`Total Violations: ${evidencePack.totalViolations}`));

      if (evidencePack.contracts && evidencePack.contracts.length > 0) {
        console.log(chalk.bold('\n📋 Contracts:\n'));
        evidencePack.contracts.forEach((contract: any) => {
          const icon =
            contract.status === 'PASS'
              ? chalk.green('✅')
              : contract.status === 'FAIL'
                ? chalk.red('❌')
                : contract.status === 'WARN'
                  ? chalk.yellow('⚠️ ')
                  : chalk.gray('⊘');

          console.log(
            `${icon} ${chalk.bold(contract.skillName)} (${contract.lane}) - ${contract.violationsCount} violations`
          );
        });
      }

      console.log();
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to show Evidence Pack:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Register evidence command with Commander.js
 */
export function registerEvidenceCommand(program: Command): void {
  const evidence = program
    .command('evidence')
    .description('Evidence Pack operations (keystone aggregator)');

  evidence
    .command('build')
    .description('Build Evidence Pack - aggregate all lane contracts')
    .option('--pr <number>', 'GitHub PR number')
    .option('--branch <name>', 'Git branch name')
    .option(
      '--output <path>',
      'Output file path (default: .terrafusion/contracts/evidence-pack-{date}.json)'
    )
    .action(buildEvidence);

  evidence
    .command('validate')
    .description('Validate Evidence Pack - verify cryptographic integrity')
    .option(
      '--pack <path>',
      'Path to Evidence Pack (default: .terrafusion/contracts/evidence-pack-latest.json)'
    )
    .action(validateEvidence);

  evidence
    .command('show')
    .description('Show Evidence Pack - display in requested format')
    .option('--pack <path>', 'Path to Evidence Pack (default: latest)')
    .option(
      '--format <format>',
      'Output format: json, markdown, summary (default: markdown)',
      'markdown'
    )
    .action(showEvidence);
}
