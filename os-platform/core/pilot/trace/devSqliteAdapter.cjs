const fs = require('fs');
const path = require('path');
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  // sqlite3 not installed — adapter will be a noop but won't crash
  sqlite3 = null;
}

const DB_PATH = process.env.TF_DEV_AUDIT_DB || path.join(process.cwd(), 'dev-audit', 'dev-audit.db');

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function initDb() {
  if (!sqlite3) return null;
  ensureDir();
  const db = new sqlite3.Database(DB_PATH);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, event_json TEXT, created_at TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS payloads (ref TEXT PRIMARY KEY, store_type TEXT, created_at TEXT, payload_json TEXT)`);
  });
  return db;
}

const db = initDb();

function persistEvent(event) {
  if (!db) return false;
  try {
    const stmt = db.prepare(`INSERT INTO events (event_json, created_at) VALUES (?, ?)`);
    stmt.run(JSON.stringify(event), new Date().toISOString());
    stmt.finalize();
    return true;
  } catch (err) {
    // best-effort
    console.error('devSqliteAdapter.persistEvent error', err && err.message);
    return false;
  }
}

function storePayload(ref, payload, storeType) {
  if (!db) return false;
  try {
    const stmt = db.prepare(`INSERT OR REPLACE INTO payloads (ref, store_type, created_at, payload_json) VALUES (?, ?, ?, ?)`);
    stmt.run(ref, storeType, new Date().toISOString(), JSON.stringify(payload));
    stmt.finalize();
    return true;
  } catch (err) {
    console.error('devSqliteAdapter.storePayload error', err && err.message);
    return false;
  }
}

function retrievePayload(ref) {
  return new Promise((resolve) => {
    if (!db) return resolve(undefined);
    db.get(`SELECT payload_json FROM payloads WHERE ref = ?`, [ref], (err, row) => {
      if (err) {
        console.error('devSqliteAdapter.retrievePayload error', err && err.message);
        return resolve(undefined);
      }
      if (!row) return resolve(undefined);
      try {
        return resolve(JSON.parse(row.payload_json));
      } catch (_e) {
        return resolve(undefined);
      }
    });
  });
}

module.exports = { persistEvent, storePayload, retrievePayload };
