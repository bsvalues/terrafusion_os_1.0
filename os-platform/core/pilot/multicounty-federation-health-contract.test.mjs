import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const servicePath = 'backend/src/TerraFusion.API/Services/MultiCountyFederationService.cs';
const controllerPath = 'backend/src/TerraFusion.API/Controllers/MultiCountyFederationController.cs';

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('MultiCounty federation health handles an uninitialized federation without averaging an empty set', () => {
  const source = read(servicePath);

  assert.match(
    source,
    /if\s*\(\s*healthResults\.Length\s*==\s*0\s*\)/,
    'GetFederationHealthAsync must return an honest empty health state before calling Average()'
  );
});

test('MultiCounty federation status reports uninitialized state honestly', () => {
  const source = read(controllerPath);

  assert.match(
    source,
    /federationStatus\s*=\s*health\.TotalCounties\s*==\s*0\s*\?\s*"NOT_INITIALIZED"/,
    'status endpoint must not claim operational federation when no counties are initialized'
  );

  assert.match(
    source,
    /systemHealth\s*=\s*health\.TotalCounties\s*==\s*0\s*\?\s*"UNAVAILABLE"/,
    'status endpoint must expose unavailable health when federation has no initialized counties'
  );
});

test('MultiCounty federation compliance handles an uninitialized federation without averaging an empty set', () => {
  const source = read(servicePath);

  assert.match(
    source,
    /if\s*\(\s*complianceResults\.Length\s*==\s*0\s*\)/,
    'ValidateFederatedComplianceAsync must return an honest empty compliance state before calling Average()'
  );
});

test('MultiCounty federation realtime metrics handle empty county health results honestly', () => {
  const source = read(controllerPath);

  assert.match(
    source,
    /averageResponseTime\s*=\s*health\.CountyHealthResults\.Length\s*==\s*0\s*\?\s*0/,
    'realtime metrics must not average empty county health results'
  );

  assert.match(
    source,
    /championshipStatus\s*=\s*health\.TotalCounties\s*==\s*0\s*\?\s*"NOT_INITIALIZED"/,
    'realtime metrics must not claim operational federation when no counties are initialized'
  );
});
