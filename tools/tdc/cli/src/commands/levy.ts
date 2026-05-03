/**
 * TDC Levy Commands
 *
 * Command-line access to TerraLevy's calculation and reference endpoints.
 * Backs onto the live backend (default http://localhost:5000) — no mocks.
 *
 * Endpoints consumed:
 *   GET  /api/levy/v1/ipd-rates                        → LevyReferenceController
 *   POST /api/levy-calculation/highest-lawful-levy     → LevyCalculationController (HLL)
 *   POST /api/levy-calculation/aggregate-check         → LevyCalculationController
 *   GET  /api/levy/dashboard/districts-overview        → LevyDashboardController
 *   GET  /api/levy/dashboard/district-risk-summary     → LevyDashboardController
 *   GET  /api/levy/v1/data-quality/ai-recommendations  → LevyDataQualityController
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import fetch from 'node-fetch';

const DEFAULT_API = process.env.TERRALEVY_API_URL ?? 'http://localhost:5000';

interface GlobalOpts {
  api?: string;
  json?: boolean;
}

function apiUrl(opts: GlobalOpts, path: string): string {
  return `${opts.api ?? DEFAULT_API}${path}`;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}\n${body.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}\n${text.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtRate(n: number): string {
  return n.toFixed(6);
}

function printHeader(title: string): void {
  console.log('');
  console.log(chalk.bold.cyan(title));
  console.log(chalk.cyan('─'.repeat(title.length)));
}

function failAndExit(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`\n✗ ${msg}`));
  console.error(
    chalk.yellow('  Hint: '),
    'Is the backend running? Try `tdc launch:backend` or set `TERRALEVY_API_URL`.'
  );
  process.exit(1);
}

// ── ipd-rates ──────────────────────────────────────────────────────────────

interface IpdAnnualRate {
  year: number;
  ipdPercent: number | null;
  limitFactor: number | null;
  sourceNote: string | null;
  publishedDate: string | null;
}
interface IpdRatesEnvelope {
  source: string;
  description: string;
  rates: IpdAnnualRate[];
  count: number;
  rcwReference: string;
}

export async function levyIpdRates(opts: GlobalOpts): Promise<void> {
  try {
    const data = await getJson<IpdRatesEnvelope>(apiUrl(opts, '/api/levy/v1/ipd-rates'));
    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    printHeader(`WA OFM IPD Rates (${data.count} year${data.count === 1 ? '' : 's'})`);
    console.log(chalk.gray(`Source: ${data.source}`));
    console.log(chalk.gray(`Reference: ${data.rcwReference}`));
    const t = new Table({
      head: [
        chalk.bold('Year'),
        chalk.bold('IPD %'),
        chalk.bold('Limit Factor'),
        chalk.bold('Published'),
      ],
      style: { head: [] },
    });
    for (const r of data.rates) {
      t.push([
        String(r.year),
        r.ipdPercent == null ? chalk.gray('—') : r.ipdPercent.toFixed(2),
        r.limitFactor == null ? chalk.gray('—') : r.limitFactor.toFixed(4),
        r.publishedDate ?? chalk.gray('—'),
      ]);
    }
    console.log(t.toString());
  } catch (e) {
    failAndExit(e);
  }
}

// ── hll (highest lawful levy) ──────────────────────────────────────────────

interface HllOpts extends GlobalOpts {
  priorLevy: string;
  priorAv: string;
  currentAv: string;
  newConstruction?: string;
  annexation?: string;
  lidLift?: string;
  bankedCapacity?: string;
  refundFund?: string;
  firstTime?: boolean;
  firstTimeRate?: string;
}

interface HllResult {
  priorYearLevy: number;
  limitFactor: number;
  baseHighestLawful: number;
  newConstructionComponent: number;
  annexationComponent: number;
  highestLawfulLevy: number;
  lidLiftApplied: boolean;
  effectiveLevy: number;
  effectiveRate: number;
  statutoryReference: string;
  bankedCapacityUsed?: number;
  isFirstTimeLevy?: boolean;
}

function num(v: string | undefined, def = 0): number {
  if (v == null || v === '') return def;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Not a number: "${v}"`);
  return n;
}

export async function levyHll(opts: HllOpts): Promise<void> {
  try {
    const body = {
      priorYearLevy: num(opts.priorLevy),
      priorAssessedValue: num(opts.priorAv),
      currentAssessedValue: num(opts.currentAv),
      newConstructionValue: num(opts.newConstruction),
      annexationValue: num(opts.annexation),
      lidLiftAmount: num(opts.lidLift),
      bankedCapacityToUse: num(opts.bankedCapacity),
      refundFundAmount: num(opts.refundFund),
      isFirstTimeLevy: !!opts.firstTime,
      firstTimeLevyRequestedRate: num(opts.firstTimeRate),
    };
    const r = await postJson<HllResult>(
      apiUrl(opts, '/api/levy-calculation/highest-lawful-levy'),
      body
    );
    if (opts.json) {
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    printHeader('Highest Lawful Levy (RCW 84.55.010)');
    const t = new Table({ style: { head: [] } });
    t.push(
      [chalk.bold('Prior Year Levy'), fmtCurrency(r.priorYearLevy)],
      [chalk.bold('× Limit Factor'), r.limitFactor.toFixed(4)],
      [chalk.bold('Base HLL'), fmtCurrency(r.baseHighestLawful)],
      [chalk.bold('+ New Construction'), fmtCurrency(r.newConstructionComponent)],
      [chalk.bold('+ Annexation'), fmtCurrency(r.annexationComponent)],
      [chalk.bold.cyan('= Highest Lawful Levy'), chalk.bold.cyan(fmtCurrency(r.highestLawfulLevy))],
      [chalk.bold('Lid Lift Applied'), r.lidLiftApplied ? chalk.green('yes') : 'no'],
      [chalk.bold('Effective Levy'), fmtCurrency(r.effectiveLevy)],
      [chalk.bold('Effective Rate (per $1k AV)'), fmtRate(r.effectiveRate)]
    );
    console.log(t.toString());
    console.log(chalk.gray(`\nStatutory reference: ${r.statutoryReference}`));
  } catch (e) {
    failAndExit(e);
  }
}

// ── aggregate (RCW 84.52.043 check) ─────────────────────────────────────────

interface AggOpts extends GlobalOpts {
  districts: string; // JSON array or comma-separated "code:rate"
  av: string;
}

interface AggregateLimitResult {
  totalRate: number;
  aggregateLimit: number;
  isWithinLimit: boolean;
  overage: number;
  breakdown: Array<{ districtCode: string; rate: number }>;
  rcwReference: string;
}

function parseDistricts(raw: string): Array<{ districtCode: string; rate: number }> {
  const s = raw.trim();
  if (s.startsWith('[')) return JSON.parse(s);
  return s.split(',').map(pair => {
    const [code, rate] = pair.split(':');
    if (!code || !rate) throw new Error(`Bad district token "${pair}" (want code:rate)`);
    return { districtCode: code.trim(), rate: Number(rate) };
  });
}

export async function levyAggregate(opts: AggOpts): Promise<void> {
  try {
    const body = {
      districtRates: parseDistricts(opts.districts),
      assessedValue: num(opts.av),
    };
    const r = await postJson<AggregateLimitResult>(
      apiUrl(opts, '/api/levy-calculation/aggregate-check'),
      body
    );
    if (opts.json) {
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    printHeader('Aggregate Rate Check (RCW 84.52.043)');
    const t = new Table({
      head: [chalk.bold('District'), chalk.bold('Rate / $1k')],
      style: { head: [] },
    });
    for (const b of r.breakdown) t.push([b.districtCode, fmtRate(b.rate)]);
    console.log(t.toString());
    console.log(`${chalk.bold('Total rate:     ')} ${fmtRate(r.totalRate)}`);
    console.log(`${chalk.bold('Aggregate limit:')} ${fmtRate(r.aggregateLimit)}`);
    if (r.isWithinLimit) {
      console.log(chalk.green.bold('✓ Within limit'));
    } else {
      console.log(chalk.red.bold(`✗ EXCEEDS by ${fmtRate(r.overage)}`));
    }
    console.log(chalk.gray(`\nStatutory reference: ${r.rcwReference}`));
  } catch (e) {
    failAndExit(e);
  }
}

// ── districts (overview + risk) ─────────────────────────────────────────────

interface DistrictRow {
  districtCode?: string;
  districtId?: string;
  districtName?: string;
  name?: string;
  districtType?: string;
  type?: string;
  riskScore?: number;
  riskLevel?: string;
}

export async function levyDistricts(opts: GlobalOpts & { risk?: boolean }): Promise<void> {
  try {
    const path = opts.risk
      ? '/api/levy/dashboard/district-risk-summary'
      : '/api/levy/dashboard/districts-overview';
    const data = await getJson<unknown>(apiUrl(opts, path));
    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    printHeader(opts.risk ? 'District Risk Summary' : 'Districts Overview');
    const rows = Array.isArray(data)
      ? (data as DistrictRow[])
      : (data as { districts?: DistrictRow[]; items?: DistrictRow[] }).districts
          ?? (data as { items?: DistrictRow[] }).items
          ?? [];
    if (rows.length === 0) {
      console.log(chalk.gray('(no rows)'));
      return;
    }
    const t = new Table({
      head: [
        chalk.bold('Code'),
        chalk.bold('Name'),
        chalk.bold('Type'),
        ...(opts.risk ? [chalk.bold('Risk Score'), chalk.bold('Level')] : []),
      ],
      style: { head: [] },
    });
    for (const r of rows) {
      const row = [
        r.districtCode ?? r.districtId ?? chalk.gray('—'),
        r.districtName ?? r.name ?? chalk.gray('—'),
        r.districtType ?? r.type ?? chalk.gray('—'),
      ];
      if (opts.risk) {
        const score = r.riskScore;
        const color = score == null ? chalk.gray : score >= 70 ? chalk.red : score >= 40 ? chalk.yellow : chalk.green;
        row.push(score == null ? chalk.gray('—') : color(score.toFixed(1)));
        row.push(r.riskLevel ?? chalk.gray('—'));
      }
      t.push(row);
    }
    console.log(t.toString());
    console.log(chalk.gray(`\n${rows.length} rows — endpoint: ${path}`));
  } catch (e) {
    failAndExit(e);
  }
}

// ── digest (rules-based recommendations) ────────────────────────────────────

interface Recommendation {
  id?: string;
  title?: string;
  description?: string;
  priority?: string;
  severity?: string;
  districtId?: string;
  districtName?: string;
}

export async function levyDigest(opts: GlobalOpts & { limit?: string }): Promise<void> {
  try {
    const limit = opts.limit ?? '10';
    const data = await getJson<Recommendation[] | { items: Recommendation[] }>(
      apiUrl(opts, `/api/levy/v1/data-quality/ai-recommendations?limit=${encodeURIComponent(limit)}`)
    );
    const items = Array.isArray(data) ? data : data.items ?? [];
    if (opts.json) {
      console.log(JSON.stringify(items, null, 2));
      return;
    }
    printHeader(`Today's Attention List (top ${items.length})`);
    console.log(chalk.gray('Source: rules-based heuristics (not ML)'));
    if (items.length === 0) {
      console.log(chalk.green('\n✓ No flagged items.'));
      return;
    }
    for (const r of items) {
      const pri = (r.priority ?? r.severity ?? 'info').toLowerCase();
      const color =
        pri === 'high' || pri === 'critical' ? chalk.red
        : pri === 'medium' || pri === 'warn' || pri === 'warning' ? chalk.yellow
        : chalk.cyan;
      console.log(`\n${color.bold(`[${pri.toUpperCase()}]`)} ${r.title ?? r.id ?? '(untitled)'}`);
      if (r.districtName || r.districtId) {
        console.log(chalk.gray(`  District: ${r.districtName ?? r.districtId}`));
      }
      if (r.description) console.log(`  ${r.description}`);
    }
  } catch (e) {
    failAndExit(e);
  }
}

// ── status ──────────────────────────────────────────────────────────────────

export async function levyStatus(opts: GlobalOpts): Promise<void> {
  const base = opts.api ?? DEFAULT_API;
  printHeader('TerraLevy Backend Status');
  console.log(`API: ${chalk.cyan(base)}`);
  const checks = [
    { label: 'Health', path: '/health' },
    { label: 'IPD rates', path: '/api/levy/v1/ipd-rates' },
    { label: 'Districts overview', path: '/api/levy/dashboard/districts-overview' },
    { label: 'Risk summary', path: '/api/levy/dashboard/district-risk-summary' },
    { label: 'Recommendations', path: '/api/levy/v1/data-quality/ai-recommendations?limit=1' },
  ];
  for (const c of checks) {
    try {
      const res = await fetch(`${base}${c.path}`, { headers: { Accept: 'application/json' } });
      const icon = res.ok ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${c.label.padEnd(22)} ${chalk.gray(res.status + ' ' + res.statusText)} — ${c.path}`);
    } catch (e) {
      console.log(`  ${chalk.red('✗')} ${c.label.padEnd(22)} ${chalk.red('unreachable')} — ${c.path}`);
    }
  }
}
