import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '../../../../../..');
const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

// Gate 1: sovereign.yaml exists with required laws
describe('Gate 1 — sovereign.yaml constitution', () => {
  const manifestPath = resolve(REPO_ROOT, 'sovereign.yaml');

  it('sovereign.yaml exists', () => {
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('has HITL law', () => {
    const content = readFileSync(manifestPath, 'utf-8');
    expect(content).toContain('hitl:');
    expect(content).toContain('ai_pilot_mutations_require_approval: true');
  });

  it('has county isolation law', () => {
    const content = readFileSync(manifestPath, 'utf-8');
    expect(content).toContain('county_isolation:');
    expect(content).toContain('cross_county_access:');
    expect(content).toContain('BLOCKED');
  });

  it('has TruthGate law', () => {
    const content = readFileSync(manifestPath, 'utf-8');
    expect(content).toContain('truthgate:');
    expect(content).toContain('source_tagging_required: true');
  });

  it('has all three valid sources', () => {
    const content = readFileSync(manifestPath, 'utf-8');
    expect(content).toContain('UI_WORKBENCH');
    expect(content).toContain('CLI_OPERATOR');
    expect(content).toContain('AI_PILOT');
  });

  it('has zero tolerance section', () => {
    const content = readFileSync(manifestPath, 'utf-8');
    expect(content).toContain('zero_tolerance:');
    expect(content).toContain('tampered_manifest:');
    expect(content).toContain('BLOCK_INITIALIZATION');
  });
});

// Gate 2: SovereignGuard backend exists
describe('Gate 2 — SovereignGuard verification service', () => {
  it('SovereignGuard.cs exists', () => {
    const guardPath = resolve(REPO_ROOT, 'backend/src/TerraFusion.API/Services/SovereignGuard.cs');
    expect(existsSync(guardPath)).toBe(true);
  });

  it('SovereignGuard uses SHA256 hashing', () => {
    const guardPath = resolve(REPO_ROOT, 'backend/src/TerraFusion.API/Services/SovereignGuard.cs');
    const content = readFileSync(guardPath, 'utf-8');
    expect(content).toContain('SHA256');
  });

  it('SovereignGuard checks HITL approval requirement', () => {
    const guardPath = resolve(REPO_ROOT, 'backend/src/TerraFusion.API/Services/SovereignGuard.cs');
    const content = readFileSync(guardPath, 'utf-8');
    expect(content).toContain('ai_pilot_mutations_require_approval');
  });

  it('SovereignGuard logs SOVEREIGN VIOLATION on failure', () => {
    const guardPath = resolve(REPO_ROOT, 'backend/src/TerraFusion.API/Services/SovereignGuard.cs');
    const content = readFileSync(guardPath, 'utf-8');
    expect(content).toContain('SOVEREIGN VIOLATION');
  });
});

// Gate 3: TruthGate still enforces AI_PILOT staging
describe('Gate 3 — TruthGate HITL enforcement intact', () => {
  const src = readSrc('services/truthGate.ts');

  it('validates AI_PILOT source', () => {
    expect(src).toContain('AI_PILOT');
  });

  it('checks humanApproverId', () => {
    expect(src).toContain('humanApproverId');
  });

  it('returns STAGED for unapproved AI operations', () => {
    expect(src).toContain('STAGED');
  });
});

// Gate 4: Full architecture chain — all phases connected
describe('Gate 4 — Full sovereign architecture chain', () => {
  it('ITerraOperation has source field', () => {
    const src = readSrc('types/terraOperation.ts');
    expect(src).toContain('source: OperationSource');
  });

  it('terraTrace has intent/result pairing', () => {
    const src = readSrc('services/terraTrace.ts');
    expect(src).toContain('emitIntent');
    expect(src).toContain('emitResult');
  });

  it('pilotBridge exists for Muse Mode', () => {
    const src = readSrc('services/pilotBridge.ts');
    expect(src).toContain('buildPilotContext');
  });

  it('DraftReviewPanel exists for HITL', () => {
    const src = readSrc('components/pilot/DraftReviewPanel.tsx');
    expect(src).toContain('DraftReviewPanel');
  });

  it('osActions has source tagging', () => {
    const src = readSrc('services/osActions.ts');
    expect(src).toContain('OperationSource');
  });
});
