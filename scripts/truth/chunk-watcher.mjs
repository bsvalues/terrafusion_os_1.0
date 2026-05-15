#!/usr/bin/env node
//
// chunk-watcher.mjs
//
// Watches a chunked drain (per-lane doctrine drain endpoint, TopN-scoped)
// to terminal state. Snapshots JSONL evidence to evidence/runs/. Exits on
// either:
//   - all IN_PROGRESS batches for OP have transitioned (FAILED|COMPLETED), OR
//   - the configured max-elapsed deadline.
//
// Usage:
//   node scripts/truth/chunk-watcher.mjs <operator> [sinceIso] [pollSec] [maxElapsedMin]
//
// All DB credentials come from env to keep secrets out of git:
//   TF_PG_HOST, TF_PG_PORT, TF_PG_DB, TF_PG_USER, TF_PG_PASSWORD
//   TF_PG_PATH (optional override of pg module path; defaults to ~/.tf-pg-shim/node_modules/pg)

import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';

const require = createRequire(import.meta.url);
const pgPath = process.env.TF_PG_PATH ?? join(homedir(), '.tf-pg-shim', 'node_modules', 'pg');
const { Client } = require(pgPath);

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

const op = process.argv[2];
if (!op) {
  console.error('usage: node chunk-watcher.mjs <operator> [sinceIso] [pollSec] [maxElapsedMin]');
  process.exit(2);
}
const sinceIso = process.argv[3] ?? new Date(Date.now() - 30_000).toISOString();
const pollSec = Number(process.argv[4] ?? 30);
const maxElapsedMin = Number(process.argv[5] ?? 180);

const dbConfig = {
  host: process.env.TF_PG_HOST ?? 'localhost',
  port: Number(process.env.TF_PG_PORT ?? 5432),
  database: process.env.TF_PG_DB ?? 'terrafusion',
  user: process.env.TF_PG_USER ?? 'postgres',
  password: process.env.TF_PG_PASSWORD ?? 'devpassword123',
};

const runsDir = join(repoRoot, 'evidence', 'runs');
if (!existsSync(runsDir)) mkdirSync(runsDir, { recursive: true });
const logPath = join(runsDir, `${op}-${sinceIso.replace(/[:.]/g, '-')}.jsonl`);

const TABLES = [
  ['legacy_pacs_raw', 'property'],
  ['legacy_pacs_raw', 'property_val'],
  ['legacy_pacs_raw', 'owner'],
  ['legacy_pacs_raw', 'imprv'],
  ['legacy_pacs_raw', 'imprv_attr'],
  ['legacy_pacs_raw', 'land_detail'],
  ['legacy_pacs_raw', 'sale'],
  ['truth_pacs', 'parcel_spine'],
  ['truth_pacs', 'imprv_current'],
  ['truth_pacs', 'land_current'],
  ['truth_pacs', 'owner_current'],
  ['truth_pacs', 'sale'],
  ['canonical_tf', 'tf_parcel'],
  ['canonical_tf', 'tf_owner'],
  ['canonical_tf', 'tf_improvement'],
  ['canonical_tf', 'tf_land'],
  ['canonical_tf', 'tf_sale'],
  ['sync_bridge', 'source_xref'],
];

async function snapshot() {
  const c = new Client(dbConfig);
  await c.connect();
  try {
    const batches = await c.query(
      `SELECT "LoadBatchId","SourceSystem","Operator","StartedAt","CompletedAt","Status","RowsExtracted","RowsPromoted","ErrorSummary"
       FROM sync_bridge.load_batch
       WHERE "Operator" = $1 OR "StartedAt" >= $2::timestamptz
       ORDER BY "StartedAt"`,
      [op, sinceIso]
    );
    const inProgress = batches.rows.filter(b => b.Status === 'IN_PROGRESS');
    const completedForOp = batches.rows.filter(
      b => b.Operator === op && b.Status === 'COMPLETED'
    ).length;
    const failedForOp = batches.rows.filter(b => b.Operator === op && b.Status === 'FAILED').length;

    const counts = {};
    for (const [s, t] of TABLES) {
      try {
        const r = await c.query(`SELECT count(*)::bigint AS n FROM ${s}.${t}`);
        counts[`${s}.${t}`] = Number(r.rows[0].n);
      } catch (e) {
        counts[`${s}.${t}`] = { error: e.message };
      }
    }

    const gates = await c.query(
      `SELECT count(*)::int AS n, count(*) FILTER (WHERE "Status" != 'PASS')::int AS non_pass
       FROM sync_bridge.promotion_gate_result
       WHERE "ExecutedAt" >= $1::timestamptz`,
      [sinceIso]
    );

    return {
      ts: new Date().toISOString(),
      op,
      sinceIso,
      batches: batches.rows.map(b => ({
        id: b.LoadBatchId.slice(0, 8),
        source: b.SourceSystem,
        op: b.Operator,
        status: b.Status,
        started: b.StartedAt?.toISOString?.() ?? b.StartedAt,
        ended: b.CompletedAt?.toISOString?.() ?? b.CompletedAt,
        ext: b.RowsExtracted,
        prom: b.RowsPromoted,
        err: b.ErrorSummary?.slice(0, 100),
      })),
      inProgressTotal: inProgress.length,
      opCompleted: completedForOp,
      opFailed: failedForOp,
      gatesTotal: gates.rows[0]?.n ?? 0,
      gatesNonPass: gates.rows[0]?.non_pass ?? 0,
      counts,
    };
  } finally {
    await c.end().catch(() => {});
  }
}

const startMs = Date.now();
let baselineCounts = null;
while (true) {
  let snap;
  try {
    snap = await snapshot();
  } catch (e) {
    appendFileSync(
      logPath,
      JSON.stringify({ ts: new Date().toISOString(), pollError: e.message }) + '\n'
    );
    await new Promise(r => setTimeout(r, pollSec * 1000));
    continue;
  }
  appendFileSync(logPath, JSON.stringify(snap) + '\n');
  if (!baselineCounts) baselineCounts = snap.counts;

  const opTerminal = snap.opCompleted + snap.opFailed;
  const elapsedMin = (Date.now() - startMs) / 60_000;

  if (snap.inProgressTotal === 0 && opTerminal >= 1) {
    const deltas = Object.fromEntries(
      Object.keys(baselineCounts)
        .map(k =>
          typeof baselineCounts[k] === 'number' && typeof snap.counts[k] === 'number'
            ? [k, snap.counts[k] - baselineCounts[k]]
            : null
        )
        .filter(Boolean)
    );
    console.log(
      `exit: opCompleted=${snap.opCompleted} opFailed=${snap.opFailed} elapsedMin=${elapsedMin.toFixed(1)}`
    );
    console.log(
      `deltas (non-zero):`,
      Object.fromEntries(Object.entries(deltas).filter(([, v]) => v !== 0))
    );
    appendFileSync(
      logPath,
      JSON.stringify({
        ts: new Date().toISOString(),
        terminalExit: true,
        opCompleted: snap.opCompleted,
        opFailed: snap.opFailed,
        deltas,
      }) + '\n'
    );
    process.exit(snap.opFailed > 0 ? 1 : 0);
  }

  if (elapsedMin >= maxElapsedMin) {
    console.log(
      `exit: max-elapsed deadline hit after ${elapsedMin.toFixed(1)} min (op still IN_PROGRESS)`
    );
    appendFileSync(
      logPath,
      JSON.stringify({ ts: new Date().toISOString(), deadlineExit: true, elapsedMin }) + '\n'
    );
    process.exit(2);
  }

  console.log(
    `${snap.ts} inProgress=${snap.inProgressTotal} opDone=${opTerminal} gates=${snap.gatesTotal} ` +
      `truth.parcel_spine=${snap.counts['truth_pacs.parcel_spine']} ` +
      `canonical.tf_parcel=${snap.counts['canonical_tf.tf_parcel']}`
  );
  await new Promise(r => setTimeout(r, pollSec * 1000));
}
