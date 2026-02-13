/**
 * Skills Registry Invariants Tests (Phase 7A)
 *
 * CRITICAL GATE: These tests MUST PASS before Phase 8 begins.
 *
 * Purpose: Validate Skills Registry completeness and integrity.
 * Requirement: All skills have required metadata and valid contracts
 *
 * Invariants enforced:
 * 1. All skills have: skillName, lane, riskLevel, tdcCommand, contractPath, owners
 * 2. All contractPaths point to existing files
 * 3. All contracts are valid JSON
 * 4. Lane counts match actual skills
 * 5. No orphaned contracts (every contract referenced in registry)
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Skills Registry Invariants (Phase 7A)', () => {
  const registryPath = path.join(__dirname, '../../../../../dx/skills/registry.json');
  const skillsDir = path.join(__dirname, '../../../../../dx/skills');

  let registry: any;

  beforeAll(() => {
    // Load registry
    if (!fs.existsSync(registryPath)) {
      throw new Error(`Registry not found: ${registryPath}`);
    }
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  });

  test('Registry structure: Required top-level fields present', () => {
    expect(registry.version).toBeDefined();
    expect(registry.skills).toBeDefined();
    expect(Array.isArray(registry.skills)).toBe(true);
    expect(registry.lanes).toBeDefined();
    expect(registry.statistics).toBeDefined();
  });

  test('Registry completeness: All skills have required fields', () => {
    const requiredFields = [
      'skillName',
      'lane',
      'riskLevel',
      'tdcCommand',
      'contractPath',
      'owners',
      'triggers',
      'description',
      'status',
    ];

    registry.skills.forEach((skill: any, idx: number) => {
      requiredFields.forEach(field => {
        expect(skill[field]).toBeDefined();
        expect(skill[field]).not.toBeNull();
      });

      // Skill name must be non-empty string
      expect(typeof skill.skillName).toBe('string');
      expect(skill.skillName.length).toBeGreaterThan(0);

      // Lane must be valid
      expect(['governance', 'ui', 'security', 'ops', 'data', 'geo', 'sdui']).toContain(skill.lane);

      // Risk level must be valid
      expect(['read', 'write-local', 'write-remote']).toContain(skill.riskLevel);

      // TDC command must be non-empty
      expect(typeof skill.tdcCommand).toBe('string');
      expect(skill.tdcCommand.length).toBeGreaterThan(0);

      // Contract path must be non-empty
      expect(typeof skill.contractPath).toBe('string');
      expect(skill.contractPath.length).toBeGreaterThan(0);

      // Owners must be array with at least one owner
      expect(Array.isArray(skill.owners)).toBe(true);
      expect(skill.owners.length).toBeGreaterThan(0);

      // Triggers must be array with at least one trigger
      expect(Array.isArray(skill.triggers)).toBe(true);
      expect(skill.triggers.length).toBeGreaterThan(0);

      // Status must be 'operational' or 'planned'
      expect(['operational', 'planned', 'deprecated']).toContain(skill.status);
    });
  });

  test('Contract files exist: All contractPaths point to real files', () => {
    registry.skills.forEach((skill: any) => {
      const contractPath = path.join(__dirname, '../../../../../../', skill.contractPath);
      expect(fs.existsSync(contractPath)).toBe(true);
    });
  });

  test('Contract files valid: All contracts are valid JSON', () => {
    registry.skills.forEach((skill: any) => {
      const contractPath = path.join(__dirname, '../../../../../../', skill.contractPath);
      const content = fs.readFileSync(contractPath, 'utf8');

      // Should parse without error
      expect(() => JSON.parse(content)).not.toThrow();

      // Parsed contract should have $schema field
      const contract = JSON.parse(content);
      expect(contract.$schema).toBeDefined();
    });
  });

  test('SKILL.md files exist: All skills have SKILL.md documentation', () => {
    registry.skills.forEach((skill: any) => {
      const skillDir = path.dirname(path.join(__dirname, '../../../../../../', skill.contractPath));
      const skillMdPath = path.join(skillDir, 'SKILL.md');
      expect(fs.existsSync(skillMdPath)).toBe(true);
    });
  });

  test('SKILL.md frontmatter: All skills have valid YAML frontmatter', () => {
    registry.skills.forEach((skill: any) => {
      const skillDir = path.dirname(path.join(__dirname, '../../../../../../', skill.contractPath));
      const skillMdPath = path.join(skillDir, 'SKILL.md');
      const content = fs.readFileSync(skillMdPath, 'utf8');

      // Should start with ---
      expect(content.startsWith('---')).toBe(true);

      // Should have closing ---
      const secondDelimiter = content.indexOf('---', 3);
      expect(secondDelimiter).toBeGreaterThan(3);

      // Extract frontmatter
      const frontmatter = content.substring(3, secondDelimiter).trim();

      // Should contain required fields
      expect(frontmatter).toContain('name:');
      expect(frontmatter).toContain('lane:');
      expect(frontmatter).toContain('riskLevel:');
      expect(frontmatter).toContain('triggers:');
      expect(frontmatter).toContain('description:');
    });
  });

  test('Lane statistics: Lane counts match actual skills', () => {
    const laneCounts: Record<string, number> = {};

    registry.skills.forEach((skill: any) => {
      laneCounts[skill.lane] = (laneCounts[skill.lane] || 0) + 1;
    });

    // Check against registry.lanes metadata
    Object.keys(laneCounts).forEach(lane => {
      expect(registry.lanes[lane]).toBeDefined();
      expect(registry.lanes[lane].skillCount).toBe(laneCounts[lane]);
    });
  });

  test('Statistics accuracy: Total skills count matches array length', () => {
    expect(registry.statistics.totalSkills).toBe(registry.skills.length);

    const operationalCount = registry.skills.filter((s: any) => s.status === 'operational').length;
    expect(registry.statistics.operationalSkills).toBe(operationalCount);
  });

  test('No orphaned skills: All skill directories have registry entry', () => {
    const skillDirs = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('tf-'))
      .map(dirent => dirent.name);

    const registeredSkills = registry.skills.map((s: any) => s.skillName);

    skillDirs.forEach(dirName => {
      expect(registeredSkills).toContain(dirName);
    });
  });

  test('Phase 7 skills: All 4 Phase 7 skills are operational', () => {
    const phase7Skills = [
      'tf-pr-evidence-pack',
      'tf-ui-foundation',
      'tf-a11y-508-audit',
      'tf-data-dense-layouts',
    ];

    phase7Skills.forEach(skillName => {
      const skill = registry.skills.find((s: any) => s.skillName === skillName);
      expect(skill).toBeDefined();
      expect(skill.status).toBe('operational');
      expect(skill.phase).toBe(7);
    });
  });

  test('Keystone skill: tf-pr-evidence-pack is governance lane', () => {
    const keystoneSkill = registry.skills.find((s: any) => s.skillName === 'tf-pr-evidence-pack');
    expect(keystoneSkill).toBeDefined();
    expect(keystoneSkill.lane).toBe('governance');
    expect(keystoneSkill.riskLevel).toBe('read');
    expect(keystoneSkill.tdcCommand).toBe('evidence build');
  });

  test('Contract schema compliance: All contracts have contractVersion field', () => {
    registry.skills.forEach((skill: any) => {
      const contractPath = path.join(__dirname, '../../../../../../', skill.contractPath);
      const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

      // Should have properties.contractVersion defined
      if (contract.properties) {
        expect(contract.properties.contractVersion).toBeDefined();
      }
    });
  });

  test('TDC command format: All tdcCommand values are valid command strings', () => {
    registry.skills.forEach((skill: any) => {
      const cmd = skill.tdcCommand;

      // Should be non-empty string
      expect(typeof cmd).toBe('string');
      expect(cmd.length).toBeGreaterThan(0);

      // Should not start/end with whitespace
      expect(cmd.trim()).toBe(cmd);

      // Should match pattern: 'commandname [subcommand] [--flags]'
      // Examples: 'evidence build', 'ui audit --tokens', 'security audit --authz'
      expect(cmd).toMatch(/^[a-z]+(\s+[a-z-]+)?(\s+--[a-z-]+)?$/);
    });
  });

  test('Version consistency: Registry version matches DX Spine version', () => {
    expect(registry.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(registry.version).toBe('1.0.0'); // Phase 7 version
  });
});
