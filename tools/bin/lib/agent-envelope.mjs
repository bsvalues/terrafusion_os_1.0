/**
 * Agent envelope factory – standard JSON contract for all tf commands.
 *
 * Every agent-consumable output follows this shape:
 *   { tool, version, ts, ok, data, error, meta }
 *
 * Zero external dependencies.
 */

/**
 * Create a new envelope with timing started.
 * @param {string} tool  e.g. "tf-status"
 * @param {number} [ver] schema version (default 1)
 * @returns {{ finish(ok, data, error?): object, fail(error): object }}
 */
export function createEnvelope(tool, ver = 1) {
  const t0 = Date.now();
  const ts = new Date().toISOString();

  function finish(ok, data, error = null) {
    return {
      tool,
      version: ver,
      ts,
      ok,
      data,
      error,
      meta: { durationMs: Date.now() - t0 },
    };
  }

  function fail(error) {
    const msg = error instanceof Error ? error.message : String(error);
    return finish(false, null, msg);
  }

  return { finish, fail };
}

/**
 * Write a JSON envelope to stdout and return the exit code.
 * @param {object} envelope
 * @returns {number} 0 if ok, 1 otherwise
 */
export function writeEnvelope(envelope) {
  process.stdout.write(JSON.stringify(envelope, null, 2) + "\n");
  return envelope.ok ? 0 : 1;
}
