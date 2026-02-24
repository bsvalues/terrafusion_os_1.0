#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const agentsDir = path.join(repoRoot, ".github", "agents");

if (!existsSync(agentsDir)) {
  console.error(`Missing agents directory: ${agentsDir}`);
  process.exit(1);
}

const agentFiles = readdirSync(agentsDir)
  .filter((name) => name.endsWith(".agent.md"))
  .sort();

if (agentFiles.length === 0) {
  console.error(`No .agent.md files found in ${agentsDir}`);
  process.exit(1);
}

const invalid = [];

for (const fileName of agentFiles) {
  const filePath = path.join(agentsDir, fileName);
  const content = readFileSync(filePath, "utf8");

  // Expect YAML frontmatter at file top: --- ... ---
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    invalid.push(`${fileName}: missing YAML frontmatter`);
    continue;
  }

  const frontmatter = frontmatterMatch[1];
  const hasDescription = /^\s*description\s*:\s*.+$/m.test(frontmatter);
  const toolsArrayMatch = /^\s*tools\s*:\s*\[([^\]]*)\]/m.exec(frontmatter);
  const toolsListMatch = /^\s*tools\s*:\s*$/m.test(frontmatter) && /^\s*-\s+.+$/m.test(frontmatter);

  if (!hasDescription) {
    invalid.push(`${fileName}: missing description`);
    continue;
  }

  if (toolsArrayMatch) {
    const inside = toolsArrayMatch[1].trim();
    if (!inside || inside === "") {
      invalid.push(`${fileName}: empty tools array`);
      continue;
    }
  } else if (!toolsListMatch) {
    invalid.push(`${fileName}: missing tools`);
    continue;
  }
}

if (invalid.length > 0) {
  for (const message of invalid) {
    console.error(`INVALID ${message}`);
  }
  process.exit(1);
}

console.log(`Validated ${agentFiles.length} agent file(s).`);
