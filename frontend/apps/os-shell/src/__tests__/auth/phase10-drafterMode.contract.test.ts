import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validateOperation } from '@/services/truthGate';
import type { ITerraOperation } from '@/types/terraOperation';

const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

function mkOp(overrides: Partial<ITerraOperation> = {}): ITerraOperation {
  return {
    intentId: 'test-001', source: 'AI_PILOT', intent: 'DRAFT_PROPOSE',
    countyId: '30', actorId: 'ai-pilot-001', payload: {},
    timestamp: new Date().toISOString(), ...overrides,
  };
}

// Gate 1: DraftOperation type exists
describe('Gate 1 — DraftOperation contract', () => {
  const src = readSrc('types/terraOperation.ts');
  it('has DraftOperation interface', () => { expect(src).toContain('DraftOperation'); });
  it('has DRAFT_PROPOSE intent', () => { expect(src).toContain('DRAFT_PROPOSE'); });
  it('has DRAFT_APPROVE intent', () => { expect(src).toContain('DRAFT_APPROVE'); });
  it('has DRAFT_REJECT intent', () => { expect(src).toContain('DRAFT_REJECT'); });
  it('has approvedBy field', () => { expect(src).toContain('approvedBy'); });
  it('has draft status union', () => {
    expect(src).toContain('PENDING');
    expect(src).toContain('APPROVED');
    expect(src).toContain('REJECTED');
    expect(src).toContain('EXPIRED');
  });
});

// Gate 2: DraftReviewPanel component
describe('Gate 2 — DraftReviewPanel', () => {
  const src = readSrc('components/pilot/DraftReviewPanel.tsx');
  it('exports DraftReviewPanel', () => { expect(src).toMatch(/export function DraftReviewPanel/); });
  it('imports useAuthContext and toOsActor', () => {
    expect(src).toContain('useAuthContext');
    expect(src).toContain('toOsActor');
  });
  it('imports emitIntent and emitResult', () => {
    expect(src).toContain('emitIntent');
    expect(src).toContain('emitResult');
  });
  it('has approve button', () => { expect(src).toContain('draft-approve-button'); });
  it('has reject button', () => { expect(src).toContain('draft-reject-button'); });
  it('has delta view (current + proposed)', () => {
    expect(src).toContain('draft-current');
    expect(src).toContain('draft-proposed');
  });
  it('has unauthenticated guard', () => { expect(src).toContain('draft-unauthenticated'); });
});

// Gate 3: TruthGate AI_PILOT staging enforcement
describe('Gate 3 — AI_PILOT without approval is STAGED', () => {
  it('AI_PILOT without HumanApproverId → STAGED', () => {
    const result = validateOperation(mkOp());
    expect(result.outcome).toBe('STAGED');
  });
  it('AI_PILOT with HumanApproverId → EXECUTED', () => {
    const result = validateOperation(mkOp({ humanApproverId: 'supervisor-001' }));
    expect(result.outcome).toBe('EXECUTED');
  });
  it('UI_WORKBENCH approve is EXECUTED (human action)', () => {
    const result = validateOperation(mkOp({ source: 'UI_WORKBENCH', intent: 'DRAFT_APPROVE' }));
    expect(result.outcome).toBe('EXECUTED');
  });
});

// Gate 4: No direct persistence in DraftReviewPanel
describe('Gate 4 — DraftReviewPanel is approval-only', () => {
  const src = readSrc('components/pilot/DraftReviewPanel.tsx');
  it('does not import executeOsAction', () => { expect(src).not.toContain('executeOsAction'); });
  it('does not import any API service', () => {
    expect(src).not.toContain('gptAPI');
    expect(src).not.toContain('ragAPI');
  });
  it('does not perform direct DB operations', () => {
    expect(src).not.toContain('fetch(');
    expect(src).not.toContain('axios');
  });
});
