// Auto-generate leak guards for unguarded components.
// Reads paths from /tmp/unguarded-uniq.txt (one frontend/... path per line).
const fs = require('fs');
const path = require('path');

const list = fs.readFileSync('/tmp/unguarded-uniq.txt', 'utf8').trim().split('\n');
const outDir = path.resolve(__dirname, '..', 'os-platform', 'core', 'tests');

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

let created = 0;
for (const target of list) {
  const filename = path.basename(target);
  const ext = path.extname(filename); // .ts | .tsx | .css
  const base = filename.slice(0, -ext.length);
  const slug = kebab(base);
  const extSlug = ext.slice(1); // 'ts' | 'tsx' | 'css'
  const guardName = `${slug}-${extSlug}-leak-guard.test.ts`;
  const guardPath = path.join(outDir, guardName);

  if (fs.existsSync(guardPath)) {
    continue;
  }

  const body = `import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for ${filename} (Phase 203 strict-coverage backfill).
 */
describe('${filename} leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      '${target.replace(/\\/g, '/')}'
    );
    expect(fs.existsSync(filePath), \`Expected file to exist: \${filePath}\`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: '${filename}' });
  });
});
`;

  fs.writeFileSync(guardPath, body, 'utf8');
  created++;
  console.log('created', guardName);
}

console.log(`\n${created} guards created`);
