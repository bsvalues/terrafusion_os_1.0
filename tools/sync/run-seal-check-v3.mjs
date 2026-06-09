import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const run = promisify(execFile);
const TOOLS = dirname(fileURLToPath(import.meta.url));
const psql = 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
const env = { ...process.env, PGPASSWORD: 'devpassword123' };
const CONN = 'host=127.0.0.1 port=5432 dbname=terrafusion user=postgres';

// Read as buffer, detect and fix encoding issues
const raw = readFileSync(join(TOOLS, 'seal-check-runner.sql'));
// Convert to UTF-8 safely by replacing invalid bytes
let sql = '';
for (let i = 0; i < raw.length; i++) {
  const b = raw[i];
  if (b < 0x80) { sql += String.fromCharCode(b); }           // ASCII — keep
  else if (b >= 0x80 && b <= 0x9f) {                         // Windows-1252 control
    const map = { 0x91: "'", 0x92: "'", 0x93: '"', 0x94: '"', 0x96: '-', 0x97: '-', 0x85: '...' };
    sql += map[b] ?? ' ';
  } else if (b >= 0xc0) {                                     // UTF-8 lead byte
    // Try to consume multi-byte sequence
    const len = b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : 2;
    let seq = String.fromCharCode(b);
    let ok = true;
    for (let j = 1; j < len && i + j < raw.length; j++) {
      const c = raw[i + j];
      if ((c & 0xc0) !== 0x80) { ok = false; break; }
      seq += String.fromCharCode(c);
    }
    if (ok) { sql += Buffer.from(seq, 'latin1').toString('utf8'); i += len - 1; }
    else sql += ' ';
  } else { sql += '-'; }                                      // 0xa0-0xbf continuation without lead — replace
}

// Write cleaned SQL to a temp file
const tmpPath = join(TOOLS, '_seal_check_tmp.sql');
writeFileSync(tmpPath, sql, 'utf8');

try {
  const r = await run(psql, [CONN, '-t', '-A', '-f', tmpPath.replace(/\\/g, '/')], { env, timeout: 90000, maxBuffer: 10 * 1024 * 1024 });
  process.stdout.write(r.stdout + '\n');
  if (r.stderr) process.stdout.write('STDERR: ' + r.stderr + '\n');
} catch (e) {
  process.stdout.write('FAIL: ' + e.message.substring(0, 300) + '\n');
  process.stdout.write('STDERR: ' + (e.stderr ?? 'none').substring(0, 500) + '\n');
  if (e.stdout) process.stdout.write('PARTIAL: ' + e.stdout.substring(0, 500) + '\n');
}
