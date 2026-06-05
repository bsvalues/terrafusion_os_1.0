import { createHash } from 'node:crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function sealPayload(payload: unknown, previousHash = ''): string {
  return sha256(`${previousHash}:${JSON.stringify(payload)}`);
}
