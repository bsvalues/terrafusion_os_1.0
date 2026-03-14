/**
 * spawn-delegate.mjs – shared helper for delegating to existing scripts
 *
 * Spawns a child process with inherited stdio so output streams directly
 * to the terminal. Returns the exit code.
 */

import { spawn } from "node:child_process";

/**
 * Run a command and inherit stdio (user sees output directly).
 * @param {string} cmd - Command to run
 * @param {string[]} args - Arguments
 * @param {object} [opts] - Options (cwd, env overrides)
 * @returns {Promise<number>} exit code
 */
export function delegate(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      cwd: opts.cwd ?? process.cwd(),
      env: { ...process.env, ...opts.env },
      shell: process.platform === "win32",
    });

    child.on("error", (err) => {
      process.stderr.write(`tf: failed to run "${cmd}": ${err.message}\n`);
      resolve(1);
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

/**
 * Run an npm script via the package manager available in the project.
 * @param {string} script - npm script name (e.g. "dev", "test:unit")
 * @param {string[]} [extraArgs] - Extra args to pass after --
 * @param {object} [opts] - Options (cwd)
 * @returns {Promise<number>} exit code
 */
export function npmScript(script, extraArgs = [], opts = {}) {
  const args = ["run", script];
  if (extraArgs.length) {
    args.push("--", ...extraArgs);
  }
  return delegate("npm", args, opts);
}
