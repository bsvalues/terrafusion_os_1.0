import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildFrontendDependencySpdx } from './frontend_dependency_sbom.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('creates deterministic SPDX packages and Grype-compatible npm purls', () => {
  const inventory = {
    MIT: [
      { name: 'zeta', versions: ['2.0.0', '1.0.0'], license: 'MIT' },
      { name: '@scope/pkg', versions: ['3.1.4'], license: 'MIT' },
    ],
  };

  const first = buildFrontendDependencySpdx(inventory, 'browser-production');
  const second = buildFrontendDependencySpdx(inventory, 'browser-production');
  const build = buildFrontendDependencySpdx(inventory, 'docker-build');
  assert.deepEqual(first, second);
  assert.equal(first.name, 'TerraFusion frontend browser production dependencies');
  assert.equal(build.name, 'TerraFusion frontend Docker build dependencies');
  assert.notEqual(first.documentNamespace, build.documentNamespace);
  assert.deepEqual(
    first.packages.map(pkg => `${pkg.name}@${pkg.versionInfo}`),
    ['@scope/pkg@3.1.4', 'zeta@1.0.0', 'zeta@2.0.0']
  );
  assert.equal(first.packages[0].externalRefs[0].referenceLocator, 'pkg:npm/%40scope/pkg@3.1.4');
  assert.match(first.documentNamespace, /\/spdx\/frontend\/browser-production\/[0-9a-f]{64}$/);
});

test('uses exact installed manifest evidence only for unresolved inventory licenses', () => {
  const inventory = {
    Unknown: [
      {
        name: '@mapbox/jsonlint-lines-primitives',
        versions: ['2.0.2'],
        paths: ['/install/mapbox-jsonlint'],
        license: 'Unknown',
      },
    ],
  };
  const readInstalledManifest = packagePath => {
    assert.equal(packagePath, '/install/mapbox-jsonlint');
    return { name: '@mapbox/jsonlint-lines-primitives', version: '2.0.2', license: 'MIT' };
  };
  const document = buildFrontendDependencySpdx(inventory, 'browser-production', {
    readInstalledManifest,
  });
  assert.equal(document.packages[0].licenseDeclared, 'MIT');
  assert.throws(
    () =>
      buildFrontendDependencySpdx(inventory, 'browser-production', {
        readInstalledManifest: () => ({ name: 'wrong-package', version: '2.0.2', license: 'MIT' }),
      }),
    /installed manifest identity mismatch/
  );
  assert.throws(
    () =>
      buildFrontendDependencySpdx(inventory, 'browser-production', {
        readInstalledManifest: () => ({
          name: '@mapbox/jsonlint-lines-primitives',
          version: '2.0.2',
          license: 'LicenseRef-Unknown',
        }),
      }),
    /unresolved installed license/
  );
});

test('fails closed for missing, unresolved, and conflicting license evidence', () => {
  assert.throws(() => buildFrontendDependencySpdx({}, 'unknown'), /scope must be/);
  assert.throws(
    () => buildFrontendDependencySpdx({}, 'browser-production'),
    /at least one dependency/
  );
  assert.throws(
    () =>
      buildFrontendDependencySpdx(
        { MIT: [{ name: 'pkg', versions: [], license: 'MIT' }] },
        'browser-production'
      ),
    /versions must contain/
  );
  assert.throws(
    () =>
      buildFrontendDependencySpdx(
        {
          'LicenseRef-Unknown': [
            { name: 'pkg', versions: ['1.0.0'], license: 'LicenseRef-Unknown' },
          ],
        },
        'browser-production'
      ),
    /unresolved license/
  );
  assert.throws(
    () =>
      buildFrontendDependencySpdx(
        {
          'DocumentRef-upstream:LicenseRef-Custom': [
            {
              name: 'pkg',
              versions: ['1.0.0'],
              license: 'DocumentRef-upstream:LicenseRef-Custom',
            },
          ],
        },
        'browser-production'
      ),
    /unresolved license/
  );
  assert.throws(
    () =>
      buildFrontendDependencySpdx(
        {
          MIT: [{ name: 'pkg', versions: ['1.0.0'], license: 'MIT' }],
          ISC: [{ name: 'pkg', versions: ['1.0.0'], license: 'ISC' }],
        },
        'browser-production'
      ),
    /conflicting licenses/
  );
});

test('pins Mapbox JSON lint to a Node20-compatible release with explicit MIT metadata', () => {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const lockfile = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
  const patch = readFileSync(
    join(root, 'patches', '@mapbox__jsonlint-lines-primitives@2.0.2.patch'),
    'utf8'
  );
  const patchPath = 'patches/@mapbox__jsonlint-lines-primitives@2.0.2.patch';

  assert.equal(packageJson.pnpm.overrides['mapbox-gl>@mapbox/jsonlint-lines-primitives'], '2.0.2');
  assert.equal(
    packageJson.pnpm.patchedDependencies['@mapbox/jsonlint-lines-primitives@2.0.2'],
    patchPath
  );
  assert.ok(lockfile.includes("'@mapbox/jsonlint-lines-primitives@2.0.2'"));
  assert.match(lockfile, /engines: \{node: '>= 0\.6'\}/);
  assert.match(lockfile, /2\.0\.2\(patch_hash=[a-z0-9]+\)/);
  assert.ok(!lockfile.includes("'@mapbox/jsonlint-lines-primitives@2.0.3'"));
  assert.match(patch, /^\+  "license": "MIT",$/m);
});
