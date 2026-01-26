import { spawn } from 'node:child_process';
import fs from 'node:fs';

// Allowlist of trusted CI commands - prevents arbitrary execution
const ALLOWED_COMMANDS = new Set([
  'pnpm',
  'npm',
  'npx',
  'node',
  'dotnet',
  'pwsh',
  'powershell',
  'git',
  'python',
  'python3',
  'make',
  'echo',
  'bash',
  'sh',
  'cmd',
  'docker',
  'gh',
]);

// Patterns that indicate secrets - redact values in logs
const SECRET_PATTERNS = [
  /^--?(token|password|secret|key|auth|credential|api[_-]?key)=/i,
  /^(GH_TOKEN|GITHUB_TOKEN|NPM_TOKEN|NUGET_API_KEY|AZURE_[A-Z_]+_KEY)=/i,
  /^Authorization:/i,
  /^Bearer\s+/i,
];

// Flags that take a secret value as the NEXT argument
const SECRET_FLAGS = new Set([
  '--token',
  '-t',
  '--password',
  '-p',
  '--secret',
  '--key',
  '--api-key',
  '--auth',
  '--credential',
  '-H', // curl header flag
]);

const isWindows = process.platform === 'win32';

/**
 * Check if arg contains characters that should be rejected outright
 * (too dangerous for any escaping to be reliable in cmd.exe)
 */
function hasDangerousChars(arg) {
  // % and ! are used for variable expansion in cmd.exe
  // Reject them entirely rather than trust escaping
  return /%/.test(arg) || /!/.test(arg);
}

/**
 * Check if arg is properly pre-quoted (balanced quotes)
 */
function isPreQuoted(arg) {
  if (arg.length < 2) return false;
  const first = arg[0];
  const last = arg[arg.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    // Check for balanced internal quotes
    const inner = arg.slice(1, -1);
    const quoteChar = first;
    let count = 0;
    for (const ch of inner) {
      if (ch === quoteChar) count++;
    }
    // If odd number of internal quotes, it's unbalanced
    return count % 2 === 0;
  }
  return false;
}

/**
 * Quote an argument for cmd.exe (Windows)
 * cmd.exe uses ^ as escape, " for grouping, and has special chars: &|<>^
 */
function quoteCmdArg(arg) {
  // Reject dangerous characters
  if (hasDangerousChars(arg)) {
    throw new Error(`Argument contains dangerous characters (% or !): "${arg}"`);
  }
  // If properly pre-quoted, return as-is
  if (isPreQuoted(arg)) return arg;
  // If no special chars, return as-is
  if (!/[\s&|<>^"'()]/.test(arg)) return arg;
  // Escape ^ first (it's cmd's escape char), then wrap in quotes
  // Inside quotes, escape internal quotes with ^"
  let escaped = arg.replace(/\^/g, '^^').replace(/"/g, '^"');
  return `"${escaped}"`;
}

/**
 * Quote an argument for POSIX shell (bash/sh)
 * Use single quotes for most cases, escape existing single quotes
 */
function quotePosixArg(arg) {
  // If properly pre-quoted, return as-is
  if (isPreQuoted(arg)) return arg;
  // If no special chars, return as-is
  if (!/[\s"'`$\\!*?#~<>|;&(){}[\]]/.test(arg)) return arg;
  // Single-quote and escape any internal single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Platform-aware argument quoting
 */
function quoteArg(arg) {
  return isWindows ? quoteCmdArg(arg) : quotePosixArg(arg);
}

/**
 * Redact sensitive values from args for logging
 * Handles both --token=secret and --token secret forms
 */
function redactArg(arg, prevArg = null) {
  // If previous arg was a secret flag, redact this arg entirely
  if (prevArg && SECRET_FLAGS.has(prevArg.toLowerCase())) {
    return '***REDACTED***';
  }
  // Check if this arg contains Authorization header content
  if (/Authorization:\s*Bearer\s+/i.test(arg) || /Bearer\s+\S/i.test(arg)) {
    return arg.replace(/(Bearer\s+)\S+/i, '$1***REDACTED***');
  }
  // Check pattern matches (--token=secret form)
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(arg)) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        return arg.slice(0, eqIdx + 1) + '***REDACTED***';
      }
      return '***REDACTED***';
    }
  }
  return arg;
}

/**
 * Redact an entire args array, handling two-arg secret patterns
 */
function redactArgs(args) {
  const result = [];
  for (let i = 0; i < args.length; i++) {
    const prevArg = i > 0 ? args[i - 1] : null;
    result.push(redactArg(args[i], prevArg));
  }
  return result;
}

// Exports for testing
export {
    ALLOWED_COMMANDS, hasDangerousChars,
    isPreQuoted, quoteArg, quoteCmdArg,
    quotePosixArg, redactArg,
    redactArgs, SECRET_FLAGS, SECRET_PATTERNS
};

// Only run CLI when invoked directly (not imported for tests)
    import { resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const isMain = resolve(process.argv[1]) === resolve(__filename);

if (isMain) {
  const [cmdRaw, ...args] = process.argv.slice(2);

  if (!cmdRaw) {
    console.error('usage: node scripts/ci/run_with_log.mjs <cmd> [args...]');
    process.exit(2);
  }

  // Extract base command (handle paths like /usr/bin/pnpm or C:\\path\\pnpm.cmd)
  const baseName = cmdRaw
    .split(/[/\\]/)
    .pop()
    .replace(/\.(exe|cmd|bat|ps1)$/i, '')
    .toLowerCase();

  if (!ALLOWED_COMMANDS.has(baseName)) {
    console.error(`Error: Command "${cmdRaw}" is not in the allowed list.`);
    console.error(`Allowed: ${[...ALLOWED_COMMANDS].join(', ')}`);
    process.exit(2);
  }

  // Quote args (may throw on dangerous chars)
  let quotedArgs;
  try {
    quotedArgs = args.map(quoteArg);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }

  // DEP0190 fix: When shell: true is required (Windows .cmd scripts),
  // pass the full command as a single string with empty args array.
  // This is the Node.js documented pattern to avoid DEP0190.
  const fullCommand = [cmdRaw, ...quotedArgs].join(' ');

  const logPath = 'ci_governance_proof.log';
  const out = fs.createWriteStream(logPath, { flags: 'w' });

  // Audit header with redacted args for debugging CI failures
  const redactedArgs = redactArgs(args);
  const auditLine = `[run_with_log] allowed_cmd=${baseName} argv=${JSON.stringify(redactedArgs)} rendered=${[
    cmdRaw,
    ...redactedArgs.map(a => {
      try {
        return quoteArg(a);
      } catch {
        return a;
      }
    }),
  ].join(' ')}\n`;
  out.write(auditLine);
  process.stderr.write(auditLine);

  const child = spawn(fullCommand, { shell: true, windowsHide: true });

  child.stdout.on('data', data => {
    process.stdout.write(data);
    out.write(data);
  });

  child.stderr.on('data', data => {
    process.stderr.write(data);
    out.write(data);
  });

  child.on('close', code => {
    out.end();
    process.exit(code ?? 1);
  });
}
