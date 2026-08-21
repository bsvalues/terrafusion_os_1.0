import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflowPaths = [
  '.github/workflows/release-compliance.yml',
  '.github/workflows/release-lane.yml',
  '.github/workflows/rollback-production.yml',
  '.github/workflows/rollback-staging.yml',
];

function collectRunBlocks(source) {
  const lines = source.replace(/\r/g, '').split('\n');
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)run:\s*\|[-+]?\s*$/.exec(lines[index]);
    if (!match) continue;

    const parentIndent = match[1].length;
    const body = [];
    let bodyIndent;
    for (index += 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.trim() && line.match(/^\s*/)[0].length <= parentIndent) {
        index -= 1;
        break;
      }
      if (line.trim()) bodyIndent ??= line.match(/^\s*/)[0].length;
      body.push(line);
    }
    blocks.push(body.map(line => line.slice(bodyIndent ?? parentIndent + 2)).join('\n'));
  }

  return blocks;
}

test('all embedded release lifecycle shell blocks parse as Bash', () => {
  const blocks = workflowPaths.flatMap(workflowPath =>
    collectRunBlocks(readFileSync(workflowPath, 'utf8')).map((script, index) => ({
      workflowPath,
      location: 'run[' + index + ']',
      script,
    }))
  );

  assert.ok(blocks.length > 0, 'expected embedded release workflow scripts');

  const combined = blocks
    .map(({ workflowPath, location, script }) => {
      const normalized = script.replace(/\$\{\{.*?\}\}/gs, 'gha_expression').replace(/\r/g, '');
      return `\n# ${workflowPath}:${location}\n${normalized}\n`;
    })
    .join('');

  execFileSync('bash', ['-n'], {
    input: Buffer.from(combined, 'utf8'),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
});
