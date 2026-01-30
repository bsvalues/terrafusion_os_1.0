#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

type EntryUrl = { type: 'url'; url: string };
type EntryRoute = { type: 'route'; route: string };
type EntryMf = { type: 'mf'; remote: string; module: string; export?: string };
type Entry = EntryUrl | EntryRoute | EntryMf;

type Status = 'active' | 'beta' | 'alpha' | 'legacy';
type Category = 'system' | 'assessment' | 'tax' | 'mapping' | 'records' | 'analytics' | 'ai';
type Intent = 'gen2' | 'legacy' | 'archive';

export type TerrafusionAppManifest = {
  id: string;
  displayName: string;
  description: string;
  iconName: string;
  category: Category;
  tier: number;
  status: Status;
  pinned: boolean;
  version: string;
  entry: Entry;

  // Gen2 architecture fields
  intent: Intent;
  runnable: boolean;

  // Optional fields for future expansion
  tags?: string[];
  permissions?: string[];
};

type GeneratorOptions = {
  applicationsDir: string;
  outFile: string;
  strict?: boolean;
  sortBy?: 'id' | 'tierThenId';
};

const DEFAULTS: GeneratorOptions = {
  applicationsDir: path.resolve(process.cwd(), 'applications'),
  outFile: path.resolve(process.cwd(), 'frontend/apps/os-shell/src/config/generatedModules.ts'),
  strict: true,
  sortBy: 'id',
};

function fail(msg: string): never {
  throw new Error(`[generate-modules] ${msg}`);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function assertNonEmptyString(v: unknown, field: string) {
  if (typeof v !== 'string' || v.trim().length === 0) fail(`Missing/invalid "${field}"`);
}

function assertBoolean(v: unknown, field: string) {
  if (typeof v !== 'boolean') fail(`Missing/invalid "${field}" (expected boolean)`);
}

function assertNumber(v: unknown, field: string) {
  if (typeof v !== 'number' || Number.isNaN(v))
    fail(`Missing/invalid "${field}" (expected number)`);
}

function assertOneOf<T extends string>(v: unknown, field: string, allowed: readonly T[]) {
  if (typeof v !== 'string' || !allowed.includes(v as T)) {
    fail(`Missing/invalid "${field}" (expected one of: ${allowed.join(', ')})`);
  }
}

function validateEntry(entry: unknown) {
  if (!isObject(entry)) fail(`Missing/invalid "entry" (expected object)`);

  assertNonEmptyString(entry.type, 'entry.type');

  const t = entry.type;
  if (t === 'url') {
    assertNonEmptyString(entry.url, 'entry.url');
    // lightweight sanity check
    try {
      // eslint-disable-next-line no-new
      new URL(entry.url as string);
    } catch {
      fail(`Invalid "entry.url" URL format: ${(entry.url as string) ?? ''}`);
    }
    return;
  }

  if (t === 'route') {
    assertNonEmptyString(entry.route, 'entry.route');
    if (!(entry.route as string).startsWith('/')) {
      fail(`"entry.route" must start with "/"`);
    }
    return;
  }

  if (t === 'mf') {
    assertNonEmptyString(entry.remote, 'entry.remote');
    assertNonEmptyString(entry.module, 'entry.module');
    if (entry.export !== undefined && typeof entry.export !== 'string') {
      fail(`Invalid "entry.export" (expected string)`);
    }
    return;
  }

  fail(`Unsupported entry.type "${t}" (expected "url" | "route" | "mf")`);
}

function validateManifest(raw: unknown, manifestPath: string): TerrafusionAppManifest {
  if (!isObject(raw)) fail(`Manifest is not an object: ${manifestPath}`);

  // Required strings
  assertNonEmptyString(raw.id, 'id');
  assertNonEmptyString(raw.displayName, 'displayName');
  assertNonEmptyString(raw.description, 'description');
  assertNonEmptyString(raw.iconName, 'iconName');
  assertNonEmptyString(raw.version, 'version');

  // Required enums
  assertOneOf(raw.category, 'category', [
    'system',
    'assessment',
    'tax',
    'mapping',
    'records',
    'analytics',
    'ai',
  ] as const);

  assertOneOf(raw.status, 'status', ['active', 'beta', 'alpha', 'legacy'] as const);

  // Gen2 architecture fields
  assertOneOf(raw.intent, 'intent', ['gen2', 'legacy', 'archive'] as const);
  assertBoolean(raw.runnable, 'runnable');

  // Required primitives
  assertNumber(raw.tier, 'tier');
  assertBoolean(raw.pinned, 'pinned');

  // Entry union
  validateEntry(raw.entry);

  // Optional arrays
  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags) || raw.tags.some(x => typeof x !== 'string')) {
      fail(`Invalid "tags" (expected string[]) in ${manifestPath}`);
    }
  }
  if (raw.permissions !== undefined) {
    if (!Array.isArray(raw.permissions) || raw.permissions.some(x => typeof x !== 'string')) {
      fail(`Invalid "permissions" (expected string[]) in ${manifestPath}`);
    }
  }

  return raw as TerrafusionAppManifest;
}

function findManifests(applicationsDir: string): string[] {
  if (!fs.existsSync(applicationsDir)) fail(`Applications dir not found: ${applicationsDir}`);

  const dirs = fs
    .readdirSync(applicationsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(applicationsDir, d.name));

  const manifests: string[] = [];
  for (const dir of dirs) {
    const p = path.join(dir, 'terrafusion.app.json');
    if (fs.existsSync(p)) manifests.push(p);
  }

  return manifests;
}

function loadManifest(manifestPath: string): TerrafusionAppManifest {
  const text = fs.readFileSync(manifestPath, 'utf8');
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    fail(`Invalid JSON in ${manifestPath}: ${(e as Error).message}`);
  }
  return validateManifest(raw, manifestPath);
}

function ensureUniqueIds(manifests: TerrafusionAppManifest[], paths: string[]) {
  const seen = new Map<string, number>();
  for (let i = 0; i < manifests.length; i++) {
    const id = manifests[i].id;
    if (seen.has(id)) {
      const j = seen.get(id)!;
      fail(`Duplicate id "${id}" in:\n- ${paths[j]}\n- ${paths[i]}`);
    }
    seen.set(id, i);
  }
}

function deterministicSort(
  manifests: TerrafusionAppManifest[],
  sortBy: GeneratorOptions['sortBy']
) {
  const copy = [...manifests];
  if (sortBy === 'tierThenId') {
    copy.sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));
  } else {
    copy.sort((a, b) => a.id.localeCompare(b.id));
  }
  return copy;
}

function emit(outFile: string, manifests: TerrafusionAppManifest[]) {
  const header = `/* AUTO-GENERATED FILE — DO NOT EDIT
 * Generated by tools/registry/generate-modules.ts
 */`;

  const typeBlock = `
export type EntryUrl = { type: "url"; url: string };
export type EntryRoute = { type: "route"; route: string };
export type EntryMf = { type: "mf"; remote: string; module: string; export?: string };
export type Entry = EntryUrl | EntryRoute | EntryMf;

export type Status = "active" | "beta" | "alpha" | "legacy";
export type Category = "system" | "assessment" | "tax" | "mapping" | "records" | "analytics" | "ai";
export type Intent = "gen2" | "legacy" | "archive";

export type ModuleManifest = {
  id: string;
  displayName: string;
  description: string;
  iconName: string;
  category: Category;
  tier: number;
  status: Status;
  pinned: boolean;
  version: string;
  intent: Intent;
  runnable: boolean;
  entry: Entry;
  tags?: string[];
  permissions?: string[];
};
`.trim();

  const data = JSON.stringify(manifests, null, 2);

  const body = `
${header}

${typeBlock}

export const GENERATED_MODULES: readonly ModuleManifest[] = ${data} as const;

export type GeneratedModule = (typeof GENERATED_MODULES)[number];
`.trimStart();

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, body, 'utf8');
}

function parseArgs(argv: string[]): Partial<GeneratorOptions> {
  const out: Partial<GeneratorOptions> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--applications' && argv[i + 1]) {
      out.applicationsDir = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (a === '--out' && argv[i + 1]) {
      out.outFile = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (a === '--sort' && argv[i + 1]) {
      const v = argv[++i] as 'id' | 'tierThenId';
      out.sortBy = v;
      continue;
    }
    if (a === '--non-strict') {
      out.strict = false;
      continue;
    }
    if (a === '--help') {
      console.log(
        `
Usage:
  node tools/registry/generate-modules.ts [--applications applications] [--out <file>] [--sort id|tierThenId] [--non-strict]

Defaults:
  --applications applications
  --out frontend/apps/os-shell/src/config/generatedModules.ts
  --sort id
      `.trim()
      );
      process.exit(0);
    }
    fail(`Unknown arg: ${a}`);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const opts: GeneratorOptions = { ...DEFAULTS, ...args };

  const manifestPaths = findManifests(opts.applicationsDir);
  if (manifestPaths.length === 0) {
    fail(`No terrafusion.app.json found under: ${opts.applicationsDir}`);
  }

  const manifests = manifestPaths.map(loadManifest);
  ensureUniqueIds(manifests, manifestPaths);

  // Optional strict folder/id matching rule: manifest id should be present in folder name (soft)
  if (opts.strict) {
    for (let i = 0; i < manifests.length; i++) {
      const folder = path.basename(path.dirname(manifestPaths[i]));
      const id = manifests[i].id;
      // This is intentionally permissive; tighten later if you want.
      if (!folder.toLowerCase().includes(id.replace(/-/g, '').toLowerCase())) {
        // warn only, don’t fail — we’ll tighten once naming conventions are stable
        console.warn(
          `[generate-modules] WARN: id "${id}" not obviously matching folder "${folder}" (${manifestPaths[i]})`
        );
      }
    }
  }

  const sorted = deterministicSort(manifests, opts.sortBy);
  emit(opts.outFile, sorted);

  console.log(
    `[generate-modules] OK: ${sorted.length} manifests → ${path.relative(process.cwd(), opts.outFile)}`
  );
}

main().catch(e => {
  console.error((e as Error).stack || String(e));
  process.exit(1);
});
