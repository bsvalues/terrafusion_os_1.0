import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const workflows = [
  '.github/workflows/release-lane.yml',
  '.github/workflows/rollback-production.yml',
  '.github/workflows/rollback-staging.yml',
];

const bashExecutable =
  process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';

function extractInlineRestore(workflowPath) {
  const source = readFileSync(workflowPath, 'utf8').replace(/\r/g, '');
  const startMarker = '          restore_previous() {';
  const endMarker = '\n          }\n          trap restore_previous ERR HUP INT TERM';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${workflowPath} must contain an inline ERR restore`);
  return source
    .slice(start, end + '\n          }'.length)
    .split('\n')
    .map(line => line.replace(/^ {10}/, ''))
    .join('\n');
}

function prepareFixture(dockerExit) {
  const root = mkdtempSync(join(tmpdir(), 'tf-release-recovery-'));
  for (const directory of ['backup/spec-lock', 'backup/config', 'incoming', 'bin']) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  for (const file of ['release.env', 'runtime-compose.yml', 'Caddyfile', 'sovereign.yaml']) {
    writeFileSync(join(root, 'backup', file), `prior-${file}\n`);
    writeFileSync(join(root, file), `candidate-${file}\n`);
  }
  writeFileSync(join(root, 'backup', 'spec-lock', 'prior.txt'), 'prior\n');
  writeFileSync(join(root, 'backup', 'config', 'prior.txt'), 'prior\n');
  writeFileSync(join(root, 'backup', 'requested.absent'), '');
  writeFileSync(join(root, 'backup', 'backup.ready'), '');
  writeFileSync(join(root, 'requested.sha'), 'failed-candidate\n');
  mkdirSync(join(root, 'docs', 'spec-lock'), { recursive: true });
  mkdirSync(join(root, 'config'), { recursive: true });
  writeFileSync(join(root, 'docs', 'spec-lock', 'candidate.txt'), 'candidate\n');
  writeFileSync(join(root, 'config', 'candidate.txt'), 'candidate\n');
  const dockerPath = join(root, 'bin', 'docker');
  writeFileSync(dockerPath, `#!/usr/bin/env bash\nexit ${dockerExit}\n`);
  chmodSync(dockerPath, 0o755);
  return root;
}

test('uncommitted runtime recovery runs after failure or workflow cancellation', () => {
  for (const workflowPath of workflows) {
    const source = readFileSync(workflowPath, 'utf8');
    const recoveryName = workflowPath.includes('release-lane')
      ? 'Restore prior runtime if deployment did not commit'
      : 'Restore pre-rollback runtime if rollback did not commit';
    const start = source.indexOf(recoveryName);
    assert.ok(start >= 0, workflowPath + ' is missing the recovery step');
    const recovery = source.slice(start, source.indexOf('shell: bash', start));
    assert.match(recovery, /if: \(failure\(\) \|\| cancelled\(\)\)/, workflowPath);
  }
});

for (const workflowPath of workflows) {
  for (const dockerExit of [0, 1]) {
    for (const trigger of ['false', 'kill -TERM $$', 'kill -HUP $$']) {
      test(`${workflowPath} terminates after ${trigger} when restore docker exits ${dockerExit}`, () => {
        const root = prepareFixture(dockerExit);
        try {
          const restore = extractInlineRestore(workflowPath);
          const script = `
set -Eeuo pipefail
INCOMING="$PWD/incoming"
BACKUP="$PWD/backup"
docker() { return ${dockerExit}; }
${restore}
trap restore_previous ERR HUP INT TERM
${trigger}
printf 'continued\\n' > after-failure
`;
          let status = 0;
          try {
            execFileSync(bashExecutable, ['-c', script], {
              cwd: root,
              env: process.env,
              stdio: ['ignore', 'pipe', 'pipe'],
            });
          } catch (error) {
            status = error.status ?? 127;
          }

          assert.notEqual(status, 0, 'remote mutation shell must remain failed after recovery');
          assert.equal(
            existsSync(join(root, 'after-failure')),
            false,
            'post-failure mutation continued'
          );
          assert.equal(
            existsSync(join(root, 'requested.sha')),
            false,
            'prior requested absence not restored'
          );
          assert.equal(
            existsSync(join(root, 'backup')),
            dockerExit !== 0,
            'backup retention must track restore convergence'
          );
        } finally {
          rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
        }
      });
    }
  }
}
