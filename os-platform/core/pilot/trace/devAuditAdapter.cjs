const fs = require('fs');
const path = require('path');

const DIR = process.env.TF_DEV_AUDIT_DIR || './dev-audit';
try {
  fs.mkdirSync(DIR, { recursive: true });
} catch (e) {
  // best-effort
}

function eventsFile() {
  return path.join(DIR, 'events.log.jsonl');
}

function payloadsFile() {
  return path.join(DIR, 'payloads.json');
}

function persistEvent(event) {
  try {
    const line = JSON.stringify(event);
    fs.appendFileSync(eventsFile(), line + '\n', { encoding: 'utf8' });
  } catch (err) {
    console.error('devAuditAdapter.persistEvent error', err && err.message);
  }
}

function storePayload(ref, payload, storeType) {
  try {
    const pathFile = payloadsFile();
    const existing = fs.existsSync(pathFile) ? JSON.parse(fs.readFileSync(pathFile, 'utf8')) : {};
    existing[ref] = {
      ref,
      storeType,
      createdAt: new Date().toISOString(),
      payload,
    };
    fs.writeFileSync(pathFile, JSON.stringify(existing, null, 2), { encoding: 'utf8' });
    return true;
  } catch (err) {
    console.error('devAuditAdapter.storePayload error', err && err.message);
    return false;
  }
}

function retrievePayload(ref) {
  try {
    const pathFile = payloadsFile();
    if (!fs.existsSync(pathFile)) return undefined;
    const existing = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
    return existing[ref] && existing[ref].payload;
  } catch (err) {
    console.error('devAuditAdapter.retrievePayload error', err && err.message);
    return undefined;
  }
}

module.exports = { persistEvent, storePayload, retrievePayload };
