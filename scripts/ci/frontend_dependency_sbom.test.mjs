import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFrontendDependencySpdx } from './frontend_dependency_sbom.mjs';

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
