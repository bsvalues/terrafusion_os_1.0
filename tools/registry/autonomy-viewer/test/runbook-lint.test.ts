/**
 * Phase 4N46 – Runbook Lint Contract Tests
 * =========================================
 *
 * TDD-first tests for runbook validation:
 *   - Required sections present (Overview, Prerequisites, Procedure, Troubleshooting)
 *   - Command snippets are executable (bash/powershell blocks)
 *   - Error codes documented
 *   - Chain of custody forms present where applicable
 *
 * @module runbook-lint.test
 * @version 4N46.1
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RUNBOOK_DIR = path.join(__dirname, '..');
const RUNBOOKS_DIR = path.join(__dirname, '..', 'runbooks');

const REQUIRED_RUNBOOKS = [
  'AIRGAP_VERIFY.md',
  'runbooks/DR_RECONSTITUTE.md',
  'runbooks/BREAK_GLASS.md',
  'runbooks/RETENTION.md',
  'runbooks/PUBLIC_DISCLOSURE.md',
] as const;

const REQUIRED_SECTIONS = [
  '## Overview',
  '## Prerequisites',
  '## Procedure',
  '## Troubleshooting',
] as const;

const OPTIONAL_SECTIONS = [
  '## Security Considerations',
  '## Chain of Custody',
  '## Contact',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function readRunbook(relativePath: string): string | null {
  const fullPath = path.join(RUNBOOK_DIR, relativePath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

function hasSection(content: string, section: string): boolean {
  return content.includes(section);
}

function hasCodeBlock(content: string, language: string): boolean {
  const pattern = new RegExp(`\`\`\`${language}[\\s\\S]*?\`\`\``, 'g');
  return pattern.test(content);
}

function extractCodeBlocks(content: string): string[] {
  const pattern = /```(?:bash|powershell|sh)[\s\S]*?```/g;
  const matches = content.match(pattern) || [];
  return matches;
}

function hasErrorCodeTable(content: string): boolean {
  // Look for markdown table with error codes
  return (
    content.includes('| Error Code') ||
    content.includes('|Error Code') ||
    content.includes('| Error') ||
    content.includes('ERROR') ||
    content.includes('FAIL')
  );
}

function hasChainOfCustody(content: string): boolean {
  return (
    content.toLowerCase().includes('chain of custody') ||
    content.toLowerCase().includes('custody form') ||
    content.includes('| Step | Action')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Runbook Existence
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Runbook Existence', () => {
  it('AIRGAP_VERIFY.md exists', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null, 'AIRGAP_VERIFY.md should exist');
    assert.ok(content.length > 1000, 'AIRGAP_VERIFY.md should have substantial content');
  });

  it('DR_RECONSTITUTE.md exists', () => {
    const content = readRunbook('runbooks/DR_RECONSTITUTE.md');
    assert.ok(content !== null, 'runbooks/DR_RECONSTITUTE.md should exist');
  });

  it('BREAK_GLASS.md exists', () => {
    const content = readRunbook('runbooks/BREAK_GLASS.md');
    assert.ok(content !== null, 'runbooks/BREAK_GLASS.md should exist');
  });

  it('RETENTION.md exists', () => {
    const content = readRunbook('runbooks/RETENTION.md');
    assert.ok(content !== null, 'runbooks/RETENTION.md should exist');
  });

  it('PUBLIC_DISCLOSURE.md exists', () => {
    const content = readRunbook('runbooks/PUBLIC_DISCLOSURE.md');
    assert.ok(content !== null, 'runbooks/PUBLIC_DISCLOSURE.md should exist');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Required Sections
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Required Sections', () => {
  it('AIRGAP_VERIFY.md has all required sections', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null);

    for (const section of REQUIRED_SECTIONS) {
      assert.ok(hasSection(content, section), `Missing section: ${section}`);
    }
  });

  it('DR_RECONSTITUTE.md has all required sections', () => {
    const content = readRunbook('runbooks/DR_RECONSTITUTE.md');
    assert.ok(content !== null);

    for (const section of REQUIRED_SECTIONS) {
      assert.ok(hasSection(content, section), `Missing section: ${section}`);
    }
  });

  it('BREAK_GLASS.md has all required sections', () => {
    const content = readRunbook('runbooks/BREAK_GLASS.md');
    assert.ok(content !== null);

    for (const section of REQUIRED_SECTIONS) {
      assert.ok(hasSection(content, section), `Missing section: ${section}`);
    }
  });

  it('RETENTION.md has all required sections', () => {
    const content = readRunbook('runbooks/RETENTION.md');
    assert.ok(content !== null);

    for (const section of REQUIRED_SECTIONS) {
      assert.ok(hasSection(content, section), `Missing section: ${section}`);
    }
  });

  it('PUBLIC_DISCLOSURE.md has all required sections', () => {
    const content = readRunbook('runbooks/PUBLIC_DISCLOSURE.md');
    assert.ok(content !== null);

    for (const section of REQUIRED_SECTIONS) {
      assert.ok(hasSection(content, section), `Missing section: ${section}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Command Snippets
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Command Snippets', () => {
  it('AIRGAP_VERIFY.md contains executable command blocks', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null);

    const codeBlocks = extractCodeBlocks(content);
    assert.ok(codeBlocks.length >= 3, 'Should have at least 3 command blocks');
  });

  it('DR_RECONSTITUTE.md contains executable command blocks', () => {
    const content = readRunbook('runbooks/DR_RECONSTITUTE.md');
    assert.ok(content !== null);

    const codeBlocks = extractCodeBlocks(content);
    assert.ok(codeBlocks.length >= 2, 'Should have at least 2 command blocks');
  });

  it('runbooks contain both bash and powershell examples', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null);

    assert.ok(hasCodeBlock(content, 'bash'), 'Should have bash code blocks');
    assert.ok(hasCodeBlock(content, 'powershell'), 'Should have powershell code blocks');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Error Documentation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Error Documentation', () => {
  it('AIRGAP_VERIFY.md documents error codes', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null);

    assert.ok(hasErrorCodeTable(content), 'Should document error codes');
  });

  it('DR_RECONSTITUTE.md documents error codes', () => {
    const content = readRunbook('runbooks/DR_RECONSTITUTE.md');
    assert.ok(content !== null);

    assert.ok(hasErrorCodeTable(content), 'Should document error codes');
  });

  it('BREAK_GLASS.md documents error codes', () => {
    const content = readRunbook('runbooks/BREAK_GLASS.md');
    assert.ok(content !== null);

    assert.ok(hasErrorCodeTable(content), 'Should document error codes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Chain of Custody
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Chain of Custody', () => {
  it('AIRGAP_VERIFY.md includes chain of custody form', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null);

    assert.ok(hasChainOfCustody(content), 'Should include chain of custody section');
  });

  it('BREAK_GLASS.md includes chain of custody form', () => {
    const content = readRunbook('runbooks/BREAK_GLASS.md');
    assert.ok(content !== null);

    assert.ok(hasChainOfCustody(content), 'Break-glass requires custody tracking');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Version Control
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Version Control', () => {
  it('runbooks include version information', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null);

    assert.ok(
      content.includes('Document Version') ||
        content.includes('Version:') ||
        content.includes('v1'),
      'Should include version information'
    );
  });

  it('runbooks include last updated date', () => {
    const content = readRunbook('AIRGAP_VERIFY.md');
    assert.ok(content !== null);

    assert.ok(
      content.includes('Last Updated') ||
        content.includes('Updated:') ||
        /\d{4}-\d{2}-\d{2}/.test(content),
      'Should include last updated date'
    );
  });
});
