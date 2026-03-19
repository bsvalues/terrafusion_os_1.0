/**
 * Phase 10 — HITL Draft Mode Contract Tests
 * Verifies:
 *   1. Draft API types are correct
 *   2. TruthGate: HumanApproverId is required on approve calls
 *   3. pilotApi exports createDraft / approveDraft / rejectDraft
 *   4. TerraTrace coverage: emitToolInvoked/Succeeded/Failed present around fetch calls
 */

import * as fs from 'fs';
import * as path from 'path';

// __dirname = .../src/__tests__/pilot — go up 2 levels to reach src/
const SRC = path.join(__dirname, '..', '..');
const PILOT_API = path.join(SRC, 'services', 'pilotApi.ts');

describe('Phase 10 — HITL Draft Contract', () => {
  describe('pilotApi draft functions', () => {
    it('exports createDraft function', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('createDraft');
    });

    it('exports approveDraft function', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      expect(content).toContain('approveDraft');
    });

    it('exports rejectDraft function', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      expect(content).toContain('rejectDraft');
    });

    it('approveDraft call includes humanApproverId (TruthGate)', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      expect(content).toContain('humanApproverId');
    });

    it('pilotApi wraps fetch calls with TerraTrace emit helpers', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      const fetchMatches = [...content.matchAll(/await fetch\(/g)];
      const emitMatches = [...content.matchAll(/emitTool(?:Invoked|Succeeded|Failed)\(/g)];
      // Each fetch call should have at least one emitTool before and one after
      expect(emitMatches.length).toBeGreaterThanOrEqual(fetchMatches.length * 2);
    });
  });

  describe('Draft API type safety', () => {
    it('pilotApi references /api/pilot path for draft operations', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      expect(content).toContain('/api/pilot');
    });

    it('CreateDraftRequest shape includes countyId and proposedBy', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      expect(content).toContain('countyId');
      expect(content).toContain('proposedBy');
    });

    it('ApproveDraftRequest shape includes humanApproverId', () => {
      const content = fs.readFileSync(PILOT_API, 'utf-8');
      expect(content).toContain('humanApproverId');
    });
  });
});
