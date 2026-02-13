#!/usr/bin/env node

/**
 * DX Spine Smoke Test
 *
 * Verifies the entire DX Spine infrastructure is operational:
 * - Context Pack generation and validation
 * - Command Contract validation
 * - MCP Activation validation
 * - Workspace Companion integration
 * - VS Code Extension structure
 *
 * Exit codes:
 * 0 = All tests passed
 * 1 = One or more tests failed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

// ANSI color codes
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

class SmokeTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.results = [];
  }

  pass(message) {
    this.passed++;
    this.results.push({ status: 'PASS', message });
    console.log(`${COLORS.GREEN}[PASS]${COLORS.RESET} ${message}`);
  }

  fail(message, error = null) {
    this.failed++;
    this.results.push({ status: 'FAIL', message, error });
    console.log(`${COLORS.RED}[FAIL]${COLORS.RESET} ${message}`);
    if (error) {
      console.log(`${COLORS.RED}       ${error}${COLORS.RESET}`);
    }
  }

  warn(message) {
    this.warnings++;
    this.results.push({ status: 'WARN', message });
    console.log(`${COLORS.YELLOW}[WARN]${COLORS.RESET} ${message}`);
  }

  info(message) {
    console.log(`${COLORS.CYAN}[INFO]${COLORS.RESET} ${message}`);
  }

  section(title) {
    console.log(`\n${COLORS.BOLD}${COLORS.BLUE}${title}${COLORS.RESET}`);
    console.log('='.repeat(title.length));
  }

  fileExists(filePath, description) {
    const fullPath = path.resolve(ROOT, filePath);
    if (fs.existsSync(fullPath)) {
      this.pass(`${description} exists`);
      return true;
    } else {
      this.fail(`${description} missing: ${filePath}`);
      return false;
    }
  }

  isValidJSON(filePath, description) {
    const fullPath = path.resolve(ROOT, filePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      JSON.parse(content);
      this.pass(`${description} is valid JSON`);
      return true;
    } catch (error) {
      this.fail(`${description} has invalid JSON`, error.message);
      return false;
    }
  }

  hasRequiredFields(filePath, fields, description) {
    const fullPath = path.resolve(ROOT, filePath);
    try {
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const missing = fields.filter(field => {
        const keys = field.split('.');
        let value = content;
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return true; // field is missing
          }
        }
        return false;
      });

      if (missing.length === 0) {
        this.pass(`${description} has all required fields`);
        return true;
      } else {
        this.fail(`${description} missing fields: ${missing.join(', ')}`);
        return false;
      }
    } catch (error) {
      this.fail(`${description} field validation failed`, error.message);
      return false;
    }
  }

  runCommand(command, description, options = {}) {
    try {
      const output = execSync(command, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      this.pass(description);
      return { success: true, output };
    } catch (error) {
      this.fail(description, error.message);
      return { success: false, error };
    }
  }
}

async function main() {
  const test = new SmokeTest();

  console.log(`${COLORS.BOLD}${COLORS.CYAN}TerraFusion DX Spine Smoke Test${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}${'='.repeat(40)}${COLORS.RESET}\n`);

  // ============================================================================
  // 1. CONTEXT PACK TESTS
  // ============================================================================
  test.section('1. Context Pack Tests');

  // Generator exists
  test.fileExists(
    'tools/dx/context-pack/generate.mjs',
    'Context Pack generator'
  );

  // Schema exists and is valid
  if (test.fileExists('tools/dx/context-pack/schema.json', 'Context Pack schema')) {
    test.isValidJSON('tools/dx/context-pack/schema.json', 'Context Pack schema');
  }

  // Try to run generator
  test.info('Running Context Pack generator...');
  const generateResult = test.runCommand(
    'node tools/dx/context-pack/generate.mjs',
    'Context Pack generator runs successfully',
    { silent: false }
  );

  // Verify output file was created
  if (generateResult.success) {
    if (test.fileExists(
      '.terrafusion/context/latest.json',
      'Context Pack output file'
    )) {
      // Validate output JSON
      if (test.isValidJSON(
        '.terrafusion/context/latest.json',
        'Context Pack output'
      )) {
        // Check required sections
        test.hasRequiredFields(
          '.terrafusion/context/latest.json',
          ['repo', 'focus', 'health', 'governance', 'todos', 'nextActions'],
          'Context Pack output'
        );
      }
    }
  }

  // ============================================================================
  // 2. COMMAND CONTRACT TESTS
  // ============================================================================
  test.section('2. Command Contract Tests');

  const contractsDir = path.resolve(ROOT, 'tools/dx/command-contracts');
  if (fs.existsSync(contractsDir)) {
    const contracts = fs.readdirSync(contractsDir)
      .filter(f => f.endsWith('.contract.json'));

    test.info(`Found ${contracts.length} command contracts`);

    // Verify critical Phase 10-12 contracts exist
    const criticalContracts = ['county', 'mcp', 'skill', 'posture', 'evidence'];
    for (const contractName of criticalContracts) {
      const contractFile = `${contractName}.contract.json`;
      if (contracts.includes(contractFile)) {
        test.pass(`Critical contract exists: ${contractName}`);
      } else {
        test.fail(`Missing critical contract: ${contractName}`);
      }
    }

    for (const contract of contracts) {
      const contractPath = `tools/dx/command-contracts/${contract}`;
      const contractName = contract.replace('.contract.json', '');

      // Validate JSON
      if (test.isValidJSON(contractPath, `Contract: ${contractName}`)) {
        // Check required fields
        test.hasRequiredFields(
          contractPath,
          ['command', 'aliases', 'riskLevel', 'ownerLane'],
          `Contract: ${contractName}`
        );

        // Check all 4 aliases exist
        try {
          const content = JSON.parse(
            fs.readFileSync(path.resolve(ROOT, contractPath), 'utf8')
          );
          const requiredAliases = ['vscode', 'claude', 'codex', 'tdc'];
          const hasAllAliases = requiredAliases.every(
            alias => content.aliases && content.aliases[alias]
          );

          if (hasAllAliases) {
            test.pass(`Contract: ${contractName} has all 4 aliases`);
          } else {
            const missing = requiredAliases.filter(
              alias => !content.aliases || !content.aliases[alias]
            );
            test.fail(
              `Contract: ${contractName} missing aliases: ${missing.join(', ')}`
            );
          }
        } catch (error) {
          test.fail(`Contract: ${contractName} alias validation failed`, error.message);
        }
      }
    }
  } else {
    test.fail('Command contracts directory not found');
  }

  // ============================================================================
  // 3. MCP ACTIVATION TESTS
  // ============================================================================
  test.section('3. MCP Activation Tests');

  test.fileExists(
    'tools/dx/mcp-activation/activate.mjs',
    'MCP activation script'
  );

  if (test.fileExists(
    'tools/dx/mcp-activation/activation.contract.json',
    'MCP activation contract'
  )) {
    test.isValidJSON(
      'tools/dx/mcp-activation/activation.contract.json',
      'MCP activation contract'
    );
  }

  if (test.fileExists(
    'tools/dx/mcp-activation/approval-schema.json',
    'MCP approval schema'
  )) {
    test.isValidJSON(
      'tools/dx/mcp-activation/approval-schema.json',
      'MCP approval schema'
    );
  }

  // ============================================================================
  // 4. WORKSPACE COMPANION TESTS
  // ============================================================================
  test.section('4. Workspace Companion Tests');

  test.fileExists(
    'tools/ai-workspace-companion/WorkspaceCompanionAgent.ts',
    'Workspace Companion Agent'
  );

  test.fileExists(
    'tools/ai-workspace-companion/context-pack-integration.ts',
    'Context Pack integration'
  );

  if (test.fileExists(
    'tools/ai-workspace-companion/package.json',
    'Workspace Companion package.json'
  )) {
    test.isValidJSON(
      'tools/ai-workspace-companion/package.json',
      'Workspace Companion package.json'
    );

    // Check for key dependencies
    try {
      const pkg = JSON.parse(
        fs.readFileSync(
          path.resolve(ROOT, 'tools/ai-workspace-companion/package.json'),
          'utf8'
        )
      );

      const hasDeps = pkg.dependencies || pkg.devDependencies;
      if (hasDeps) {
        test.pass('Workspace Companion has dependencies defined');
      } else {
        test.warn('Workspace Companion has no dependencies defined');
      }
    } catch (error) {
      test.fail('Workspace Companion dependency check failed', error.message);
    }
  }

  // ============================================================================
  // 5. SKILLS INFRASTRUCTURE TESTS (Phase 7/8)
  // ============================================================================
  test.section('5. Skills Infrastructure Tests');

  // Skills registry
  if (test.fileExists('tools/dx/skills/registry.json', 'Skills registry')) {
    if (test.isValidJSON('tools/dx/skills/registry.json', 'Skills registry')) {
      test.hasRequiredFields(
        'tools/dx/skills/registry.json',
        ['version', 'skills', 'metadata'],
        'Skills registry'
      );

      // Validate each skill has required files
      try {
        const registry = JSON.parse(
          fs.readFileSync(path.resolve(ROOT, 'tools/dx/skills/registry.json'), 'utf8')
        );

        test.info(`Found ${registry.skills.length} registered skills`);

        // Verify Phase 10-12 skills exist in registry
        const phase1012Skills = ['tf-sdui-engine', 'tf-county-deployment', 'tf-mcp-postgis'];
        const registrySkillIds = registry.skills.map(s => s.id);
        for (const skillId of phase1012Skills) {
          if (registrySkillIds.includes(skillId)) {
            test.pass(`Phase 10-12 skill registered: ${skillId}`);
          } else {
            test.warn(`Phase 10-12 skill not yet registered: ${skillId}`);
          }
        }

        for (const skill of registry.skills) {
          const skillPath = path.resolve(ROOT, skill.path);
          const skillName = skill.id;

          // Check SKILL.md exists
          const skillMd = path.join(skillPath, 'SKILL.md');
          if (fs.existsSync(skillMd)) {
            test.pass(`Skill: ${skillName} has SKILL.md`);
          } else {
            test.warn(`Skill: ${skillName} missing SKILL.md`);
          }

          // Check contract.json exists
          const contractPath = path.resolve(ROOT, skill.contract);
          if (fs.existsSync(contractPath)) {
            test.pass(`Skill: ${skillName} has contract.json`);
            // Validate contract JSON
            try {
              JSON.parse(fs.readFileSync(contractPath, 'utf8'));
              test.pass(`Skill: ${skillName} contract is valid JSON`);
            } catch (error) {
              test.fail(`Skill: ${skillName} contract has invalid JSON`, error.message);
            }
          } else {
            test.fail(`Skill: ${skillName} missing contract.json`);
          }
        }
      } catch (error) {
        test.fail('Skills registry validation failed', error.message);
      }
    }
  }

  // ============================================================================
  // 6. POSTURE BUS TESTS (Phase 7/8 + Phase 10-12)
  // ============================================================================
  test.section('6. Posture Bus Tests');

  test.fileExists(
    'tools/dx/posture-bus/bus.mjs',
    'Posture Bus script'
  );

  // Verify evidence and posture contracts exist (Phase 7/8 critical contracts)
  if (test.fileExists(
    'tools/dx/command-contracts/evidence.contract.json',
    'Evidence contract'
  )) {
    test.isValidJSON(
      'tools/dx/command-contracts/evidence.contract.json',
      'Evidence contract'
    );
  }

  if (test.fileExists(
    'tools/dx/command-contracts/posture.contract.json',
    'Posture contract'
  )) {
    if (test.isValidJSON(
      'tools/dx/command-contracts/posture.contract.json',
      'Posture contract'
    )) {
      // Validate posture contract has required fields
      test.hasRequiredFields(
        'tools/dx/command-contracts/posture.contract.json',
        ['command', 'aliases', 'riskLevel', 'ownerLane', 'outputSchema'],
        'Posture contract'
      );
    }
  }

  // ============================================================================
  // 7. VS CODE EXTENSION TESTS
  // ============================================================================
  test.section('7. VS Code Extension Tests');

  test.fileExists(
    'tools/vscode-extension/src/providers/GovernanceProvider.ts',
    'VS Code Governance Provider'
  );

  if (test.fileExists(
    'tools/vscode-extension/package.json',
    'VS Code extension package.json'
  )) {
    if (test.isValidJSON(
      'tools/vscode-extension/package.json',
      'VS Code extension package.json'
    )) {
      // Check for governance view
      try {
        const pkg = JSON.parse(
          fs.readFileSync(
            path.resolve(ROOT, 'tools/vscode-extension/package.json'),
            'utf8'
          )
        );

        const hasGovernanceView = pkg.contributes?.views?.['terrafusion-explorer']?.some(
          view => view.id === 'terrafusion.governance'
        );

        if (hasGovernanceView) {
          test.pass('VS Code extension has terrafusion.governance view');
        } else {
          test.warn('VS Code extension missing terrafusion.governance view');
        }
      } catch (error) {
        test.fail('VS Code extension view check failed', error.message);
      }
    }
  }

  // Compile check (optional - can be slow)
  test.info('Running VS Code extension compile...');
  const compileResult = test.runCommand(
    'cd tools/vscode-extension && npm run compile',
    'VS Code extension compiles without errors',
    { silent: true }
  );

  // ============================================================================
  // 8. PHASE 13-15 ARTIFACTS
  // ============================================================================
  test.section('8. Phase 13-15 Artifacts');

  // SDUI Components
  test.fileExists(
    'frontend/apps/os-shell/src/components/sdui/renderer.tsx',
    'SDUI renderer component'
  );

  test.fileExists(
    'frontend/apps/os-shell/src/components/sdui/index.ts',
    'SDUI index'
  );

  // TDC audit command
  test.fileExists(
    'tools/tdc/src/commands/audit.ts',
    'TDC audit command'
  );

  // tf-test-harness skill files
  test.fileExists(
    'tools/dx/skills/tf-test-harness/SKILL.md',
    'tf-test-harness SKILL.md'
  );

  test.fileExists(
    'tools/dx/skills/tf-test-harness/contract.json',
    'tf-test-harness contract.json'
  );

  if (test.isValidJSON(
    'tools/dx/skills/tf-test-harness/contract.json',
    'tf-test-harness contract'
  )) {
    test.hasRequiredFields(
      'tools/dx/skills/tf-test-harness/contract.json',
      ['id', 'name', 'version', 'activation'],
      'tf-test-harness contract'
    );
  }

  // Claude slash commands
  const slashCommandsDir = path.resolve(ROOT, '.claude/commands');
  if (fs.existsSync(slashCommandsDir)) {
    const requiredSlashCommands = ['doctor', 'evidence', 'posture', 'compliance', 'skills', 'context'];
    test.info(`Checking for ${requiredSlashCommands.length} required Claude slash commands...`);

    for (const cmdName of requiredSlashCommands) {
      const cmdPath = `${cmdName}.md`;
      const fullPath = path.join(slashCommandsDir, cmdPath);
      if (fs.existsSync(fullPath)) {
        test.pass(`Claude slash command exists: /${cmdName}`);
      } else {
        test.fail(`Missing Claude slash command: /${cmdName}`);
      }
    }
  } else {
    test.fail('.claude/commands directory not found');
  }

  // Phase 13-15 command contracts
  const phase1315Contracts = ['ai', 'audit', 'debug', 'status', 'workspace'];
  test.info(`Checking for ${phase1315Contracts.length} Phase 13-15 command contracts...`);

  for (const contractName of phase1315Contracts) {
    const contractPath = `tools/dx/command-contracts/${contractName}.contract.json`;
    if (test.fileExists(contractPath, `${contractName} command contract`)) {
      if (test.isValidJSON(contractPath, `${contractName} command contract`)) {
        test.hasRequiredFields(
          contractPath,
          ['command', 'aliases', 'riskLevel', 'ownerLane'],
          `${contractName} command contract`
        );
      }
    }
  }

  // ============================================================================
  // 9. PHASE 16-17 ARTIFACTS
  // ============================================================================
  test.section('9. Phase 16-17 Artifacts');

  // TDC commands
  test.fileExists(
    'tools/tdc/src/commands/test.ts',
    'TDC test command'
  );

  test.fileExists(
    'tools/tdc/src/commands/deploy.ts',
    'TDC deploy command'
  );

  test.fileExists(
    'tools/tdc/src/commands/transparency.ts',
    'TDC transparency command'
  );

  // SDUI components file
  test.fileExists(
    'frontend/apps/os-shell/src/components/sdui/components.tsx',
    'SDUI components file'
  );

  // Phase 16-17 command contracts
  const phase1617Contracts = ['test', 'deploy', 'transparency'];
  test.info(`Checking for ${phase1617Contracts.length} Phase 16-17 command contracts...`);

  for (const contractName of phase1617Contracts) {
    const contractPath = `tools/dx/command-contracts/${contractName}.contract.json`;
    if (test.fileExists(contractPath, `${contractName} command contract`)) {
      if (test.isValidJSON(contractPath, `${contractName} command contract`)) {
        test.hasRequiredFields(
          contractPath,
          ['command', 'aliases', 'riskLevel', 'ownerLane'],
          `${contractName} command contract`
        );

        // Check all 4 aliases exist
        try {
          const content = JSON.parse(
            fs.readFileSync(path.resolve(ROOT, contractPath), 'utf8')
          );
          const requiredAliases = ['vscode', 'claude', 'codex', 'tdc'];
          const hasAllAliases = requiredAliases.every(
            alias => content.aliases && content.aliases[alias]
          );

          if (hasAllAliases) {
            test.pass(`${contractName} contract has all 4 aliases`);
          } else {
            const missing = requiredAliases.filter(
              alias => !content.aliases || !content.aliases[alias]
            );
            test.fail(`${contractName} contract missing aliases: ${missing.join(', ')}`);
          }
        } catch (error) {
          test.fail(`${contractName} contract alias validation failed`, error.message);
        }
      }
    }
  }

  // ============================================================================
  // 10. CROSS-CUTTING VALIDATION
  // ============================================================================
  test.section('10. Cross-Cutting Validation');

  // Validate all TDC commands have matching command contracts
  const tdcIndexPath = path.resolve(ROOT, 'tools/tdc/src/index.ts');
  if (fs.existsSync(tdcIndexPath)) {
    test.pass('TDC index.ts exists');

    try {
      const tdcIndex = fs.readFileSync(tdcIndexPath, 'utf8');
      const tdcCommands = [
        'ai', 'audit', 'debug', 'deploy', 'status',
        'test', 'transparency', 'workspace'
      ];

      test.info(`Validating ${tdcCommands.length} TDC commands have contracts...`);

      for (const cmd of tdcCommands) {
        const contractPath = path.resolve(ROOT, `tools/dx/command-contracts/${cmd}.contract.json`);
        if (fs.existsSync(contractPath)) {
          test.pass(`TDC command '${cmd}' has matching contract`);
        } else {
          test.fail(`TDC command '${cmd}' missing contract`);
        }
      }
    } catch (error) {
      test.fail('TDC command-contract validation failed', error.message);
    }
  } else {
    test.warn('TDC index.ts not found - skipping TDC command validation');
  }

  // Validate all skills in registry have SKILL.md and contract.json
  const registryPath = path.resolve(ROOT, 'tools/dx/skills/registry.json');
  if (fs.existsSync(registryPath)) {
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      test.info(`Validating ${registry.skills.length} skills have required files...`);

      for (const skill of registry.skills) {
        const skillPath = path.resolve(ROOT, skill.path);
        const skillName = skill.id;

        // SKILL.md
        const skillMd = path.join(skillPath, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          test.pass(`Skill '${skillName}' has SKILL.md`);
        } else {
          test.fail(`Skill '${skillName}' missing SKILL.md`);
        }

        // contract.json
        const contractPath = path.resolve(ROOT, skill.contract);
        if (fs.existsSync(contractPath)) {
          test.pass(`Skill '${skillName}' has contract.json`);
        } else {
          test.fail(`Skill '${skillName}' missing contract.json`);
        }
      }
    } catch (error) {
      test.fail('Skills registry validation failed', error.message);
    }
  }

  // Validate context pack schema includes posture property
  const schemaPath = path.resolve(ROOT, 'tools/dx/context-pack/schema.json');
  if (fs.existsSync(schemaPath)) {
    try {
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      if (schema.properties && schema.properties.posture) {
        test.pass('Context pack schema includes posture property');
      } else {
        test.fail('Context pack schema missing posture property');
      }
    } catch (error) {
      test.fail('Context pack schema posture validation failed', error.message);
    }
  }

  // Total command count validation
  const contractsDirPath = path.resolve(ROOT, 'tools/dx/command-contracts');
  if (fs.existsSync(contractsDirPath)) {
    const allContracts = fs.readdirSync(contractsDirPath)
      .filter(f => f.endsWith('.contract.json'));

    const expectedCommandCount = 16;
    test.info(`Found ${allContracts.length} total command contracts`);

    if (allContracts.length >= expectedCommandCount) {
      test.pass(`Command contract count meets target (${allContracts.length} >= ${expectedCommandCount})`);
    } else {
      test.warn(`Command contract count below target (${allContracts.length} < ${expectedCommandCount})`);
    }
  }

  // Total skill count validation
  if (fs.existsSync(registryPath)) {
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      const expectedSkillCount = 9;
      test.info(`Found ${registry.skills.length} total registered skills`);

      if (registry.skills.length >= expectedSkillCount) {
        test.pass(`Skill count meets target (${registry.skills.length} >= ${expectedSkillCount})`);
      } else {
        test.warn(`Skill count below target (${registry.skills.length} < ${expectedSkillCount})`);
      }
    } catch (error) {
      test.fail('Skills count validation failed', error.message);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log(`\n${COLORS.BOLD}${COLORS.CYAN}${'='.repeat(40)}${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}SUMMARY${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.CYAN}${'='.repeat(40)}${COLORS.RESET}\n`);

  const total = test.passed + test.failed;
  const passRate = ((test.passed / total) * 100).toFixed(1);

  console.log(`${COLORS.GREEN}Passed:  ${test.passed}${COLORS.RESET}`);
  console.log(`${COLORS.RED}Failed:  ${test.failed}${COLORS.RESET}`);
  console.log(`${COLORS.YELLOW}Warnings: ${test.warnings}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}Total:   ${total}${COLORS.RESET}`);
  console.log(`\n${COLORS.BOLD}Pass Rate: ${passRate}%${COLORS.RESET}`);

  if (test.failed === 0) {
    console.log(`\n${COLORS.BOLD}${COLORS.GREEN}✓ All tests passed!${COLORS.RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${COLORS.BOLD}${COLORS.RED}✗ ${test.failed} test(s) failed${COLORS.RESET}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${COLORS.RED}Fatal error:${COLORS.RESET}`, error);
  process.exit(1);
});
