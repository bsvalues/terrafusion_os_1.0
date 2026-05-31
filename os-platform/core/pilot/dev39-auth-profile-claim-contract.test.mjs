import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const controllerPath = 'backend/src/TerraFusion.API/Controllers/AuthController.cs';

function readController() {
  return fs.readFileSync(controllerPath, 'utf8');
}

function getMethodBody(source, methodName) {
  const signature = source.indexOf(methodName);
  assert.notEqual(signature, -1, `${methodName} must be present`);

  const bodyStart = source.indexOf('{', signature);
  assert.notEqual(bodyStart, -1, `${methodName} body must start`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(bodyStart + 1, index);
  }

  assert.fail(`${methodName} body must close`);
}

test('auth profile echoes JWT identity claims using mapped and raw claim names', () => {
  const source = readController();
  const body = getMethodBody(source, 'GetProfile');

  assert.match(
    body,
    /FindFirstValue\s*\(\s*JwtRegisteredClaimNames\.Email\s*\)/,
    'profile should read JWT email claim'
  );
  assert.match(
    body,
    /FindFirstValue\s*\(\s*ClaimTypes\.Email\s*\)/,
    'profile should tolerate default inbound claim mapping for email'
  );
  assert.match(
    body,
    /FindAll\s*\(\s*ClaimTypes\.Role\s*\)/,
    'profile should read mapped role claims'
  );
  assert.match(
    body,
    /FindAll\s*\(\s*"role"\s*\)/,
    'profile should also read raw role claims'
  );
  assert.match(
    body,
    /FindFirstValue\s*\(\s*"countyId"\s*\)/,
    'profile should expose county context from JWT claims'
  );
  assert.match(
    body,
    /sessionValid\s*=\s*true/,
    'profile should explicitly report session validity for an authorized token'
  );
});
