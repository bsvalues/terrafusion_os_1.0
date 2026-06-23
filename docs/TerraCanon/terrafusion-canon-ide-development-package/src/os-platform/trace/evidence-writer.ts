import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { sealPayload } from './trace-seal.js';

export interface EvidenceBundle {
  taskId: string;
  intent: string;
  surface: string;
  agentLanes: string[];
  canonRulesLoaded: string[];
  filesRead: string[];
  filesChanged: string[];
  commandsRun: unknown[];
  approvals: unknown[];
  diffHash: string;
  gateResults: unknown[];
  riskScore: number;
  commitHash?: string;
  prUrl?: string;
  traceHash?: string;
  sealed: boolean;
  sealedAt?: string;
}

export function createEvidenceBundle(input: Omit<EvidenceBundle, 'sealed' | 'traceHash' | 'sealedAt'>): EvidenceBundle {
  return {
    ...input,
    sealed: false
  };
}

export function sealEvidenceBundle(bundle: EvidenceBundle, previousHash = ''): EvidenceBundle {
  const sealedAt = new Date().toISOString();
  const traceHash = sealPayload({ ...bundle, sealed: true, sealedAt }, previousHash);
  return { ...bundle, sealed: true, sealedAt, traceHash };
}

export async function writeEvidenceBundle(bundle: EvidenceBundle, outDir = 'evidence'): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const path = join(outDir, `${bundle.taskId}.evidence.json`);
  await writeFile(path, JSON.stringify(bundle, null, 2));
  return path;
}
