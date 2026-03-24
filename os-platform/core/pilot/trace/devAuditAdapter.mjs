import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const DIR = process.env.TF_DEV_AUDIT_DIR || './dev-audit';
mkdirSync(DIR, { recursive: true });

function eventsFile() {
  return join(DIR, 'events.log.jsonl');
}

function payloadsFile() {
  return join(DIR, 'payloads.json');
}

export function persistEvent(event) {
  try {
    const line = JSON.stringify(event);
    appendFileSync(eventsFile(), line + '\n', { encoding: 'utf8' });
  } catch (err) {
    // best-effort logging for dev adapter
    console.error('devAuditAdapter.persistEvent error', err);
  }
}

export function storePayload(ref, payload, storeType) {
  try {
    const path = payloadsFile();
    const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
    existing[ref] = {
      ref,
      storeType,
      createdAt: new Date().toISOString(),
      payload,
    };
    writeFileSync(path, JSON.stringify(existing, null, 2), { encoding: 'utf8' });
    return true;
  } catch (err) {
    console.error('devAuditAdapter.storePayload error', err);
    return false;
  }
}

export function retrievePayload(ref) {
  try {
    const path = payloadsFile();
    if (!existsSync(path)) return undefined;
    const existing = JSON.parse(readFileSync(path, 'utf8'));
    return existing[ref]?.payload;
  } catch (err) {
    console.error('devAuditAdapter.retrievePayload error', err);
    return undefined;
  }
}

export default { persistEvent, storePayload, retrievePayload };
