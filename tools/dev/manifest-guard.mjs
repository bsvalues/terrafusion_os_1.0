import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const APPS_DIRS = [path.join(ROOT, 'applications'), path.join(ROOT, 'apps')];
const SCHEMA_PATH = path.join(ROOT, 'tools', 'registry', 'terrafusion.app.schema.json');
const HEALTH_SCHEMA_PATH = path.join(ROOT, 'policy', 'contracts', 'system-health.v1.schema.json');
const AGENT_STATUS_SCHEMA_PATH = path.join(ROOT, 'policy', 'contracts', 'agent-status.v1.schema.json');
const AGENT_EVENTS_SCHEMA_PATH = path.join(ROOT, 'policy', 'contracts', 'agent-events.v1.schema.json');
const HEALTH_EXAMPLES_DIR = path.join(ROOT, 'policy', 'contracts', 'examples');

const ALLOWED_CMDS = new Set(['deno', 'pnpm', 'dotnet', 'node', 'npm']);

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeCmd(cmd) {
  const base = path.basename(cmd);
  const stripped = base.replace(/\.(cmd|exe)$/i, '');
  return stripped.toLowerCase();
}

const schema = readJson(SCHEMA_PATH);
if (!schema) {
  console.error(`✖ Failed to read schema: ${SCHEMA_PATH}`);
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
addFormats(ajv);
const validate = ajv.compile(schema);

let failures = 0;
let checked = 0;

for (const baseDir of APPS_DIRS) {
  if (!exists(baseDir)) continue;

  for (const folder of fs.readdirSync(baseDir)) {
    const appDir = path.join(baseDir, folder);
    const manifestPath = path.join(appDir, 'terrafusion.app.json');

    if (!isDir(appDir) || !exists(manifestPath)) continue;

    const mf = readJson(manifestPath);
    if (!mf) {
      failures += 1;
      console.error(`✖ Invalid JSON: ${path.relative(ROOT, manifestPath)}`);
      continue;
    }

    checked += 1;

    const valid = validate(mf);
    if (!valid) {
      failures += 1;
      const errors = (validate.errors || []).map((e) => `${e.instancePath} ${e.message}`).join('; ');
      console.error(`✖ Schema invalid: ${path.relative(ROOT, manifestPath)} :: ${errors}`);
    }

    if (mf.autostart) {
      if (mf.runnable !== true) {
        failures += 1;
        console.error(`✖ Autostart requires runnable:true: ${path.relative(ROOT, manifestPath)}`);
      }
      if (!mf.start || !mf.start.cmd) {
        failures += 1;
        console.error(`✖ Autostart missing start.cmd: ${path.relative(ROOT, manifestPath)}`);
      }
    }

    if (mf.start && mf.start.cmd) {
      const normalized = normalizeCmd(mf.start.cmd);
      if (!ALLOWED_CMDS.has(normalized)) {
        failures += 1;
        console.error(`✖ start.cmd not allowlisted (${mf.start.cmd}): ${path.relative(ROOT, manifestPath)}`);
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n✖ Manifest contract guard failed (${failures} issue(s), ${checked} manifest(s) checked).`);
  process.exit(1);
}

let contractFailures = 0;

const CONTRACTS = [
  {
    name: 'system-health',
    schemaPath: HEALTH_SCHEMA_PATH,
    examplesPrefix: 'system-health.',
  },
  {
    name: 'agent-status',
    schemaPath: AGENT_STATUS_SCHEMA_PATH,
    examplesPrefix: 'agent-status.',
  },
  {
    name: 'agent-events',
    schemaPath: AGENT_EVENTS_SCHEMA_PATH,
    examplesPrefix: 'agent-events.',
  },
];

if (!exists(HEALTH_EXAMPLES_DIR)) {
  contractFailures += 1;
  console.error(`✖ Missing contract examples directory: ${HEALTH_EXAMPLES_DIR}`);
} else {
  const allExamples = fs
    .readdirSync(HEALTH_EXAMPLES_DIR)
    .filter((name) => name.endsWith('.json'));

  for (const contract of CONTRACTS) {
    if (!exists(contract.schemaPath)) {
      contractFailures += 1;
      console.error(`✖ Missing ${contract.name} schema: ${contract.schemaPath}`);
      continue;
    }

    const schema = readJson(contract.schemaPath);
    if (!schema) {
      contractFailures += 1;
      console.error(`✖ Invalid ${contract.name} schema JSON: ${contract.schemaPath}`);
      continue;
    }

    const validateSchema = ajv.compile(schema);
    const examples = allExamples
      .filter((name) => name.startsWith(contract.examplesPrefix))
      .map((name) => path.join(HEALTH_EXAMPLES_DIR, name));

    if (examples.length === 0) {
      contractFailures += 1;
      console.error(`✖ No ${contract.name} contract examples found in ${HEALTH_EXAMPLES_DIR}`);
      continue;
    }

    for (const examplePath of examples) {
      const payload = readJson(examplePath);
      if (!payload) {
        contractFailures += 1;
        console.error(`✖ Invalid JSON: ${path.relative(ROOT, examplePath)}`);
        continue;
      }
      const valid = validateSchema(payload);
      if (!valid) {
        contractFailures += 1;
        const errors = (validateSchema.errors || [])
          .map((e) => `${e.instancePath} ${e.message}`)
          .join('; ');
        console.error(
          `✖ ${contract.name} contract invalid: ${path.relative(ROOT, examplePath)} :: ${errors}`
        );
      }
    }
  }
}

if (contractFailures > 0) {
  console.error(`\n✖ Contract guard failed (${contractFailures} issue(s)).`);
  process.exit(1);
}

console.log(
  `✓ Manifest contract guard passed (${checked} manifest(s) checked) and contract schemas validated.`
);
