// Slice P — Cockpit chat streaming bus integration test.
//
// Drives the chatBus (apps/agent-cockpit/chatBus.js) directly with a fake
// registry containing the FakeModelAdapter from the local-agent surface.
// No Electron required: we capture send(channel, payload) into a queue and
// assert chunks/end/error are delivered in order with the correct streamId.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const require = createRequire(import.meta.url);

const { createChatBus, CHAT_CHUNK_CHANNEL, CHAT_END_CHANNEL, CHAT_ERROR_CHANNEL } =
  require(path.join(repoRoot, 'apps', 'agent-cockpit', 'chatBus.js'));
const { FakeModelAdapter } = require(
  path.join(repoRoot, 'os-platform', 'core', 'pilot', 'local-agent', 'fakeAdapter.js'),
);
const { AdapterRegistry } = require(
  path.join(repoRoot, 'os-platform', 'core', 'pilot', 'local-agent', 'adapterRegistry.js'),
);

function makeRegistryWithFake(scripted) {
  const registry = new AdapterRegistry();
  const adapter = new FakeModelAdapter();
  if (scripted) {
    for (const [prompt, response] of Object.entries(scripted)) {
      adapter.respondTo(prompt, response);
    }
  }
  registry.register(adapter);
  return registry;
}

function captureBus(registry) {
  const sent = [];
  const bus = createChatBus({
    getRegistry: () => registry,
    send(channel, payload) {
      sent.push({ channel, payload });
    },
  });
  return { bus, sent };
}

async function settle() {
  // queueMicrotask in chatBus runs the adapter on a microtask; await a few
  // turns of the event loop so the captured queue is populated.
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setImmediate(r));
  }
}

test('chatBus exports the documented broadcast channel names', () => {
  assert.equal(CHAT_CHUNK_CHANNEL, 'terrafusion:adapter:chat:chunk');
  assert.equal(CHAT_END_CHANNEL, 'terrafusion:adapter:chat:end');
  assert.equal(CHAT_ERROR_CHANNEL, 'terrafusion:adapter:chat:error');
});

test('chatBus refuses to construct without getRegistry/send', () => {
  assert.throws(() => createChatBus(), /getRegistry/);
  assert.throws(() => createChatBus({ getRegistry: () => null }), /send/);
});

test('chatBus.start streams chunks then emits end with the same streamId', async () => {
  const registry = makeRegistryWithFake({ hello: 'one two three' });
  const { bus, sent } = captureBus(registry);

  const { streamId } = await bus.start({
    adapterId: 'fake',
    request: { messages: [{ role: 'user', content: 'hello' }] },
  });
  assert.ok(typeof streamId === 'string' && streamId.length > 0);

  await settle();

  const chunks = sent.filter((m) => m.channel === CHAT_CHUNK_CHANNEL);
  const ends = sent.filter((m) => m.channel === CHAT_END_CHANNEL);
  const errors = sent.filter((m) => m.channel === CHAT_ERROR_CHANNEL);

  assert.ok(chunks.length > 0, 'expected at least one chunk');
  for (const c of chunks) {
    assert.equal(c.payload.streamId, streamId);
    assert.ok(c.payload.chunk && typeof c.payload.chunk.kind === 'string');
  }
  assert.equal(ends.length, 1, 'expected exactly one end event');
  assert.equal(ends[0].payload.streamId, streamId);
  assert.equal(errors.length, 0, 'no errors expected on happy path');
});

test('chatBus.cancel stops a running stream and reports cancelled:true', async () => {
  // Use the fallback (no scripted match) and a long response so we have time.
  const registry = makeRegistryWithFake();
  // Long fallback — many words to give us a window to cancel.
  registry.get('fake').setFallback(
    'a b c d e f g h i j k l m n o p q r s t u v w x y z',
  );
  const { bus, sent } = captureBus(registry);

  const { streamId } = await bus.start({
    adapterId: 'fake',
    request: { messages: [{ role: 'user', content: 'unscripted' }] },
  });

  // Cancel before the stream finishes.
  const cancelResult = bus.cancel({ streamId });
  assert.equal(cancelResult.cancelled, true);

  await settle();

  // Once cancelled, no end event should be sent for that streamId.
  const ends = sent.filter(
    (m) => m.channel === CHAT_END_CHANNEL && m.payload.streamId === streamId,
  );
  assert.equal(ends.length, 0, 'cancelled stream must not emit end');
});

test('chatBus single-stream rule: starting again cancels the previous stream', async () => {
  const registry = makeRegistryWithFake();
  registry.get('fake').setFallback('alpha beta gamma delta epsilon zeta');
  const { bus, sent } = captureBus(registry);

  const first = await bus.start({
    adapterId: 'fake',
    request: { messages: [{ role: 'user', content: 'first' }] },
  });
  const second = await bus.start({
    adapterId: 'fake',
    request: { messages: [{ role: 'user', content: 'second' }] },
  });
  assert.notEqual(first.streamId, second.streamId);

  await settle();

  // Only the second stream should ever produce an `end` event.
  const ends = sent.filter((m) => m.channel === CHAT_END_CHANNEL);
  assert.equal(ends.length, 1, 'exactly one end (the survivor)');
  assert.equal(ends[0].payload.streamId, second.streamId);
});

test('chatBus.start rejects unknown adapter ids', async () => {
  const registry = makeRegistryWithFake();
  const { bus } = captureBus(registry);
  await assert.rejects(
    () =>
      bus.start({
        adapterId: 'does-not-exist',
        request: { messages: [{ role: 'user', content: 'x' }] },
      }),
    /unknown adapter/,
  );
});

test('chatBus.start rejects malformed requests', async () => {
  const registry = makeRegistryWithFake();
  const { bus } = captureBus(registry);
  await assert.rejects(
    () => bus.start({ adapterId: 'fake' }),
    /messages/,
  );
  await assert.rejects(
    () => bus.start({ adapterId: 'fake', request: {} }),
    /messages/,
  );
});

test('chatBus.cancel without an active stream is a no-op', () => {
  const registry = makeRegistryWithFake();
  const { bus } = captureBus(registry);
  assert.deepEqual(bus.cancel(), { cancelled: false });
  assert.deepEqual(bus.cancel({ streamId: 'nope' }), { cancelled: false });
});

test('chatBus.start without a daemon registry rejects clearly', async () => {
  const bus = createChatBus({
    getRegistry: () => null,
    send: () => undefined,
  });
  await assert.rejects(
    () =>
      bus.start({
        adapterId: 'fake',
        request: { messages: [{ role: 'user', content: 'x' }] },
      }),
    /no registry/,
  );
});
