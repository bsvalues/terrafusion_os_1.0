import assert from 'node:assert/strict';
import test from 'node:test';

import { validateSemanticKernelAdvisoryGuard } from './backend_semantic_kernel_advisory_guard.mjs';

function packageRecord(name, versionInfo, purl) {
  return {
    name,
    versionInfo,
    externalRefs: purl ? [{ referenceType: 'purl', referenceLocator: purl }] : [],
  };
}

const exactCore = packageRecord(
  'Microsoft.SemanticKernel.Core',
  '1.4.0',
  'pkg:nuget/Microsoft.SemanticKernel.Core@1.4.0'
);
const safeRuntime = [{ path: 'TerraFusion.API.dll', bytes: Buffer.from('safe runtime') }];

test('accepts only the exact Grype Core tuple when the affected plugin is absent', () => {
  assert.deepEqual(
    validateSemanticKernelAdvisoryGuard(
      { packages: [exactCore, packageRecord('Other', '1.0.0', 'pkg:nuget/Other@1.0.0')] },
      safeRuntime,
      [{ path: 'Safe.cs', text: 'namespace Safe;' }]
    ),
    { exactFalsePositiveOccurrences: 1, runtimeFileCount: 1, sourceFileCount: 1 }
  );
});

test('fails closed if the authoritative affected package or component is present', () => {
  assert.throws(
    () =>
      validateSemanticKernelAdvisoryGuard(
        {
          packages: [
            exactCore,
            packageRecord(
              'Microsoft.SemanticKernel.Plugins.Core',
              '1.70.0',
              'pkg:nuget/Microsoft.SemanticKernel.Plugins.Core@1.70.0'
            ),
          ],
        },
        safeRuntime,
        []
      ),
    /Plugins\.Core is present/
  );
  assert.throws(
    () =>
      validateSemanticKernelAdvisoryGuard({ packages: [exactCore] }, safeRuntime, [
        { path: 'Unsafe.cs', text: 'new SessionsPythonPlugin()' },
      ]),
    /affected Semantic Kernel plugin usage/
  );
});

test('fails closed for missing, named, or embedded affected runtime artifacts', () => {
  assert.throws(
    () => validateSemanticKernelAdvisoryGuard({ packages: [exactCore] }, [], []),
    /runtime tree must contain files/
  );
  assert.throws(
    () =>
      validateSemanticKernelAdvisoryGuard(
        { packages: [exactCore] },
        [{ path: 'Microsoft.SemanticKernel.Plugins.Core.dll', bytes: Buffer.from('binary') }],
        []
      ),
    /plugin assembly is present/
  );
  assert.throws(
    () =>
      validateSemanticKernelAdvisoryGuard(
        { packages: [exactCore] },
        [{ path: 'innocent.dll', bytes: Buffer.from('metadata SessionsPythonPlugin metadata') }],
        []
      ),
    /plugin metadata is present/
  );
  assert.throws(
    () =>
      validateSemanticKernelAdvisoryGuard(
        { packages: [exactCore] },
        [{ path: 'innocent.dll', bytes: Buffer.from('SessionsPythonPlugin', 'utf16le') }],
        []
      ),
    /plugin metadata is present/
  );
});

test('fails closed when package name, version, or purl drift makes the ignore stale', () => {
  for (const pkg of [
    packageRecord('Microsoft.SemanticKernel', '1.4.0', 'pkg:nuget/Microsoft.SemanticKernel@1.4.0'),
    packageRecord(
      'Microsoft.SemanticKernel.Core',
      '1.5.0',
      'pkg:nuget/Microsoft.SemanticKernel.Core@1.5.0'
    ),
    packageRecord(
      'Microsoft.SemanticKernel.Core',
      '1.4.0',
      'pkg:nuget/Microsoft.SemanticKernel@1.4.0'
    ),
  ]) {
    assert.throws(
      () => validateSemanticKernelAdvisoryGuard({ packages: [pkg] }, safeRuntime, []),
      /exact Microsoft\.SemanticKernel\.Core 1\.4\.0 Grype tuple is absent/
    );
  }
});
