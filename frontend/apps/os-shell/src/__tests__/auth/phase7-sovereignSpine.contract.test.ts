/**
 * phase7-sovereignSpine.contract.test.ts
 *
 * Phase 7: Sovereign Spine — proves ITerraOperation contract exists,
 * source tagging is wired into osActions, and TruthGate validates correctly.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validateOperation } from '@/services/truthGate';
import type { ITerraOperation } from '@/types/terraOperation';

const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

function mkOp(overrides: Partial<ITerraOperation> = {}): ITerraOperation {
  return {
    intentId: 'test-001',
    source: 'UI_WORKBENCH',
    intent: 'UPDATE_VALUE',
    countyId: '30',
    actorId: 'appraiser-001',
    payload: {},
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// Gate 1: ITerraOperation contract exists with required fields
describe('Gate 1 — ITerraOperation contract', () => {
  const src = readSrc('types/terraOperation.ts');

  it('exports OperationSource type', () => {
    expect(src).toContain('UI_WORKBENCH');
    expect(src).toContain('CLI_OPERATOR');
    expect(src).toContain('AI_PILOT');
  });

  it('exports ITerraOperation interface with source field', () => {
    expect(src).toMatch(/source:\s*OperationSource/);
  });

  it('exports TerraOperationResult with outcome field', () => {
    expect(src).toContain('TerraOperationResult');
    expect(src).toContain('outcome');
  });

  it('has humanApproverId optional field', () => {
    expect(src).toContain('humanApproverId');
  });
});

// Gate 2: osActions has source tagging
describe('Gate 2 — osActions source tagging', () => {
  const src = readSrc('services/osActions.ts');

  it('imports OperationSource from terraOperation', () => {
    expect(src).toContain('OperationSource');
    expect(src).toContain('terraOperation');
  });

  it('has source field in OsActionContext', () => {
    expect(src).toContain('source');
  });

  it('defaults to UI_WORKBENCH', () => {
    expect(src).toContain('UI_WORKBENCH');
  });
});

// Gate 3: TruthGate validates operations
describe('Gate 3 — TruthGate validation', () => {
  it('UI_WORKBENCH with full context → EXECUTED', () => {
    const result = validateOperation(mkOp());
    expect(result.outcome).toBe('EXECUTED');
  });

  it('CLI_OPERATOR with full context → EXECUTED', () => {
    const result = validateOperation(mkOp({ source: 'CLI_OPERATOR' }));
    expect(result.outcome).toBe('EXECUTED');
  });

  it('AI_PILOT without HumanApproverId → STAGED', () => {
    const result = validateOperation(mkOp({ source: 'AI_PILOT' }));
    expect(result.outcome).toBe('STAGED');
    expect(result.reason).toContain('human approval');
  });

  it('AI_PILOT with HumanApproverId → EXECUTED', () => {
    const result = validateOperation(mkOp({ source: 'AI_PILOT', humanApproverId: 'supervisor-001' }));
    expect(result.outcome).toBe('EXECUTED');
  });

  it('missing countyId → BLOCKED', () => {
    const result = validateOperation(mkOp({ countyId: '' }));
    expect(result.outcome).toBe('BLOCKED');
    expect(result.reason).toContain('countyId');
  });

  it('missing actorId → BLOCKED', () => {
    const result = validateOperation(mkOp({ actorId: '' }));
    expect(result.outcome).toBe('BLOCKED');
    expect(result.reason).toContain('actorId');
  });

  it('invalid source → BLOCKED', () => {
    const result = validateOperation(mkOp({ source: 'INVALID' as any }));
    expect(result.outcome).toBe('BLOCKED');
    expect(result.reason).toContain('Invalid source');
  });
});

// Gate 4: Backend mirror contract exists
describe('Gate 4 — Backend C# mirror contract', () => {
  it('ITerraOperation.cs exists with OperationSource enum', () => {
    const backendRoot = resolve(SRC_ROOT, '../../../../backend');
    const src = readFileSync(resolve(backendRoot, 'src/TerraFusion.Core/Operations/ITerraOperation.cs'), 'utf-8');
    expect(src).toContain('UI_WORKBENCH');
    expect(src).toContain('CLI_OPERATOR');
    expect(src).toContain('AI_PILOT');
    expect(src).toContain('interface ITerraOperation');
  });
});

// Gate 5: TruthGate service exports exist
describe('Gate 5 — TruthGate service', () => {
  const src = readSrc('services/truthGate.ts');

  it('exports validateOperation function', () => {
    expect(src).toMatch(/export function validateOperation/);
  });

  it('exports createOperationResult function', () => {
    expect(src).toMatch(/export function createOperationResult/);
  });

  it('imports from terraOperation types', () => {
    expect(src).toContain('terraOperation');
  });
});
