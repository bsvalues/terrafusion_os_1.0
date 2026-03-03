import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const configPath = path.resolve(process.cwd(), "mcp-security-config.js");

if (!fs.existsSync(configPath)) {
  console.log("SKIP: mcp-security-config.js not present (optional)");
  process.exit(0);
}

const configModule = await import(pathToFileURL(configPath).href);
const SecurityValidator = configModule?.SecurityValidator;
const securityConfig = configModule?.securityConfig;

if (!SecurityValidator || !securityConfig) {
  console.error("ERROR: mcp-security-config.js missing SecurityValidator or securityConfig exports");
  process.exit(1);
}

const validator = new SecurityValidator(securityConfig);
await validator.validateSecurityPosture();
