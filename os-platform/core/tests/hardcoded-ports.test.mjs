/**
 * Advisory gate: hardcoded-ports — self-test.
 *
 * Tests the pure detector. Advisory by default (callers report, do not block).
 * Run: node --test os-platform/core/tests/hardcoded-ports.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { findHardcodedPorts, isAllowedPortContext } from '../gates/check-hardcoded-ports.mjs';

test('HP.1 flags a hardcoded port in a URL', () => {
  const hits = findHardcodedPorts("const u = 'http://localhost:3000/api';");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].port, '3000');
  assert.equal(hits[0].line, 1);
});

test('HP.2 flags a numeric port assignment', () => {
  const hits = findHardcodedPorts('const port = 5432;');
  assert.ok(hits.some((h) => h.port === '5432'));
});

test('HP.3 no false positive on env-sourced port', () => {
  const hits = findHardcodedPorts('const port = process.env.PORT;');
  assert.equal(hits.length, 0);
});

test('HP.4 no false positive on plain non-port number', () => {
  const hits = findHardcodedPorts('const total = 89247; // parcels');
  assert.equal(hits.length, 0);
});

test('HP.5 reports correct line numbers across multiple lines', () => {
  const text = ['const a = 1;', "fetch('http://127.0.0.1:8080');", 'const b = 2;'].join('\n');
  const hits = findHardcodedPorts(text);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 2);
  assert.equal(hits[0].port, '8080');
});

test('HP.6 isAllowedPortContext lets through env/config references', () => {
  assert.equal(isAllowedPortContext('port: process.env.PORT'), true);
  assert.equal(isAllowedPortContext("listen('http://localhost:3000')"), false);
});

test('HP.7 detector never throws on odd input', () => {
  assert.doesNotThrow(() => findHardcodedPorts(''));
  assert.doesNotThrow(() => findHardcodedPorts(undefined));
});
