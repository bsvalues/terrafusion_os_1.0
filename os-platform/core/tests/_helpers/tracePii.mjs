import assert from 'node:assert';

const SSN_REGEX = /\b\d{3}-?\d{2}-?\d{4}\b/;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/;

export function assertTracePair(traceService, toolId) {
  const events = traceService.query({ toolId });
  assert.ok(events.length >= 2, `Expected trace events for ${toolId}`);
  const invoked = events.find(e => e.type === 'tool_invoked');
  const completed = events.find(e => e.type === 'tool_completed');
  assert.ok(invoked, `Missing tool_invoked for ${toolId}`);
  assert.ok(completed, `Missing tool_completed for ${toolId}`);
  assert.strictEqual(invoked.correlationId, completed.correlationId);
  return { invoked, completed };
}

export function assertNoRawPII(value) {
  const text = JSON.stringify(value);
  assert.ok(!SSN_REGEX.test(text), 'Potential SSN detected');
  assert.ok(!EMAIL_REGEX.test(text), 'Potential email detected');
  assert.ok(!PHONE_REGEX.test(text), 'Potential phone detected');
}
