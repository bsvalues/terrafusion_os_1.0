import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('Dependency Scope Promotion Attestation Contract', () => {
  const attestationFiles = [
    'attestation_8_4_1_plugin.json',
    'attestation_8_4_2_plugin.json',
    'attestation_8_4_3_plugin.json',
    'attestation_8_4_4_plugin.json',
  ];

  attestationFiles.forEach(file => {
    describe(file, () => {
      const attestationPath = path.resolve(
        __dirname,
        `../../scripts/governance/attestations/${file}`
      );

      it('should exist', () => {
        expect(fs.existsSync(attestationPath)).toBe(true);
      });

      it('should have valid schema', () => {
        const content = JSON.parse(fs.readFileSync(attestationPath, 'utf8'));
        expect(content.id).toContain('attestation_');
        expect(content.trancheId).toContain('INCREMENT_');
        expect(content.rationale).toBeDefined();
        expect(content.counts).toBeDefined();
        expect(typeof content.counts.before).toBe('number');
        expect(typeof content.counts.after).toBe('number');
        expect(content.counts.before).toBeGreaterThan(content.counts.after); // Ensure directionality
        expect(content.artifacts).toBeDefined();
        expect(Array.isArray(content.artifacts)).toBe(true);
      });
    });
  });
});
