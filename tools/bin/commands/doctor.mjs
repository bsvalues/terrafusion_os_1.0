/**
 * tf doctor – delegates to the existing canon doctor
 *
 * This command does NOT reimplement health checks.
 * It imports the real canon doctor and runs it directly.
 * That's the delegation pattern: wrap, don't rewrite.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function doctor({ root, flags, argv }) {
  // Build the argv that runDoctor expects (it parses process.argv-style arrays)
  const fakeArgv = ["node", "doctor"];
  if (flags.dry) fakeArgv.push("--dry");
  if (flags.json) fakeArgv.push("--json");
  if (flags.verbose) fakeArgv.push("--verbose");

  // Import the real canon doctor – zero duplication
  const doctorPath = path.resolve(__dirname, "..", "..", "canon", "doctor.mjs");
  const { runDoctor } = await import(`file://${doctorPath.replace(/\\/g, "/")}`);

  return runDoctor({ argv: fakeArgv });
}
