/**
 * TerraPilot tool maturity metadata guard.
 *
 * This test is intentionally static. It verifies governance metadata and
 * prevents "manifest green" or handler parity from being treated as live
 * backend/product integration.
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');
const MATURITY_PATH = resolve(__dirname, '../../../tools/registry/tool-maturity.json');

const VALID_STATES = new Set([
  'declared',
  'stub-contract',
  'contract-covered',
  'backend-integrated',
  'promoted',
]);

const STATE_TO_LEVEL = {
  declared: 'L0',
  'stub-contract': 'L1',
  'contract-covered': 'L2',
  'backend-integrated': 'L3',
  promoted: 'L4',
};

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const maturity = JSON.parse(readFileSync(MATURITY_PATH, 'utf8'));

describe('TerraPilot tool maturity metadata', () => {
  it('has one maturity entry for every manifest tool and no extras', () => {
    const manifestIds = manifest.tools.map(tool => tool.toolId).sort();
    const maturityIds = maturity.tools.map(tool => tool.toolId).sort();

    assert.deepStrictEqual(
      maturityIds,
      manifestIds,
      'tool-maturity.json must exactly match manifest tool IDs'
    );
  });

  it('uses valid protocol states and matching maturity ladder levels', () => {
    const violations = maturity.tools.filter(tool => {
      return !VALID_STATES.has(tool.state) || STATE_TO_LEVEL[tool.state] !== tool.level;
    });

    assert.deepStrictEqual(
      violations,
      [],
      'maturity state must map to the documented L0-L4 ladder'
    );
  });

  it('keeps non-live tools disclosed as not live', () => {
    const violations = maturity.tools.filter(tool => {
      return !tool.liveIntegration && (!tool.disclosureRequired || !tool.disclosure);
    });

    assert.deepStrictEqual(
      violations,
      [],
      'non-live tools must retain an operator/UI disclosure'
    );
  });

  it('does not currently promote or mark any tool backend-integrated', () => {
    const liveClaims = maturity.tools.filter(tool => {
      return tool.state === 'backend-integrated' || tool.state === 'promoted' || tool.liveIntegration;
    });

    assert.deepStrictEqual(
      liveClaims,
      [],
      'P8 metadata enforcement must not promote any tool or claim live backend integration'
    );
  });

  it('requires full evidence for any future backend-integrated claim', () => {
    const violations = maturity.tools.filter(tool => {
      if (tool.state !== 'backend-integrated') return false;

      return (
        tool.level !== 'L3' ||
        tool.liveIntegration !== true ||
        !tool.evidence?.contract ||
        !tool.evidence?.backingService ||
        !tool.evidence?.verificationCommand ||
        !tool.evidence?.traceEvidence
      );
    });

    assert.deepStrictEqual(
      violations,
      [],
      'backend-integrated tools require contract, backing service, verification, and trace evidence'
    );
  });

  it('requires operator approval for any future promoted claim', () => {
    const violations = maturity.tools.filter(tool => {
      if (tool.state !== 'promoted') return false;

      return (
        tool.level !== 'L4' ||
        tool.liveIntegration !== true ||
        !tool.promotion?.operatorApproval ||
        !tool.promotion?.promotionDate ||
        !tool.promotion?.rollbackPath
      );
    });

    assert.deepStrictEqual(
      violations,
      [],
      'promoted tools require live integration plus operator approval, date, and rollback path'
    );
  });
});
