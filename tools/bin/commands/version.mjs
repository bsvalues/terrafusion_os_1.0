/**
 * tf version – prints TerraFusion OS version from root package.json
 */

import fs from "node:fs";
import path from "node:path";
import { createEnvelope, writeEnvelope } from "../lib/agent-envelope.mjs";

export default async function version({ root, flags }) {
  const env = createEnvelope("tf-version");
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8")
  );

  const ver = pkg.version ?? "0.0.0";
  const name = pkg.name ?? "terrafusion-os";

  if (flags.json) {
    return writeEnvelope(env.finish(true, { name, version: ver }));
  }

  process.stdout.write(`${name} ${ver}\n`);
  return 0;
}
