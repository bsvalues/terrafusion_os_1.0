/**
 * Agent runner – wraps any shell command and captures its output
 * into a standard agent envelope.
 *
 * Used by `tf inspect` and any future agent-oriented commands.
 *
 * Zero external dependencies.
 */

import { execFileSync } from "node:child_process";
import { createEnvelope, writeEnvelope } from "./agent-envelope.mjs";

/**
 * Run a command, capture stdout, and wrap in an agent envelope.
 *
 * @param {string} tool      Envelope tool name (e.g. "tf-inspect-scripts")
 * @param {string} cmd       Command to run (e.g. "node")
 * @param {string[]} args    Arguments
 * @param {object} [opts]    { cwd, env, timeout, parse }
 * @returns {object}         The envelope object
 */
export function runAndWrap(tool, cmd, args = [], opts = {}) {
  const env = createEnvelope(tool);
  const timeout = opts.timeout ?? 30_000;

  try {
    const stdout = execFileSync(cmd, args, {
      encoding: "utf8",
      timeout,
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      shell: process.platform === "win32",
    });

    const data = opts.parse ? opts.parse(stdout) : stdout.trim();
    return env.finish(true, data);
  } catch (err) {
    return env.fail(err);
  }
}

/**
 * Run a command, wrap it, write JSON to stdout, return exit code.
 */
export function runAndPrint(tool, cmd, args = [], opts = {}) {
  return writeEnvelope(runAndWrap(tool, cmd, args, opts));
}
