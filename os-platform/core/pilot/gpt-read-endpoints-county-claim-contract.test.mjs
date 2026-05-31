import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const controllerPath = 'backend/src/TerraFusion.API/Controllers/GPTController.cs';

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
    if (depth === 0) {
      return source.slice(bodyStart + 1, index);
    }
  }

  assert.fail(`${methodName} body must close`);
}

test('GPT read endpoints do not throw 500 when authenticated token lacks CountyId claim', () => {
  const source = readController();

  assert.match(
    source,
    /private\s+bool\s+TryGetCountyId\s*\(\s*out\s+int\s+countyId\s*\)/,
    'GPTController should expose a non-throwing CountyId helper for read/list endpoints'
  );

  const getAvailableBody = getMethodBody(source, 'GetAvailableGPTs');
  assert.equal(
    getAvailableBody.includes('GetCountyId()'),
    false,
    'GET /api/gpt must not call throwing GetCountyId() because tokens without CountyId should return a scoped empty/public result instead of 500'
  );
  assert.match(
    getAvailableBody,
    /TryGetCountyId\s*\(\s*out\s+var\s+\w+\s*\)\s*\?\s*\w+\s*:\s*0/,
    'GET /api/gpt should use neutral county scope when CountyId is unavailable'
  );

  const getConversationsBody = getMethodBody(source, 'GetAllConversations');
  assert.equal(
    getConversationsBody.includes('GetCountyId()'),
    false,
    'GET /api/gpt/conversations must not call throwing GetCountyId() because missing CountyId means no scoped conversations'
  );
  assert.match(
    getConversationsBody,
    /if\s*\(\s*!TryGetCountyId\s*\(\s*out\s+var\s+countyId\s*\)\s*\)[\s\S]*?return\s+Ok\s*\(\s*new\s+List<GPTConversation>\s*\(\s*\)\s*\)/,
    'GET /api/gpt/conversations should return a real empty state when CountyId is unavailable'
  );
});

test('GPT write endpoints remain county-scoped and strict', () => {
  const source = readController();

  const createBody = getMethodBody(source, 'CreateGPT');
  assert.match(
    createBody,
    /var\s+countyId\s*=\s*GetCountyId\s*\(\s*\)/,
    'creating GPTs must still require a valid CountyId claim'
  );

  const createConversationBody = getMethodBody(source, 'CreateConversation');
  assert.match(
    createConversationBody,
    /var\s+countyId\s*=\s*GetCountyId\s*\(\s*\)/,
    'creating GPT conversations must still require a valid CountyId claim'
  );
});
