#!/usr/bin/env ts-node
/**
 * OS Spine Bundle – OS Object Scaffold Script
 *
 * Creates a new OS object with:
 * - Component wired to intent spine
 * - Vitest tests
 * - Spec snippet for documentation
 *
 * Usage:
 *   npx ts-node tools/os-spine-bundle/scaffold-os-object.ts MyNewOSObject my_new_os_object
 *
 * Or via npm script:
 *   npm run scaffold:os-object MyNewOSObject my_new_os_object
 */

import fs from 'fs';
import path from 'path';

const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function usage(): never {
  console.log(`
${CYAN}OS Spine Bundle – OS Object Scaffold${RESET}

Usage:
  npx ts-node tools/os-spine-bundle/scaffold-os-object.ts <PascalName> <os_object_id>

Arguments:
  PascalName     Component name in PascalCase (e.g., MyNewOSObject)
  os_object_id   Object ID in snake_case (e.g., my_new_os_object)

Example:
  npx ts-node tools/os-spine-bundle/scaffold-os-object.ts WorkspaceQuickActions workspace_quick_actions
`);
  process.exit(1);
}

const [, , rawName, rawId] = process.argv;

if (!rawName || !rawId) {
  usage();
}

const pascalName = rawName;
const osObjectId = rawId;

// Validate inputs
if (!/^[A-Z][a-zA-Z0-9]*$/.test(pascalName)) {
  console.error(`${RED}❌ PascalName must be PascalCase (e.g., MyNewOSObject)${RESET}`);
  process.exit(1);
}

if (!/^[a-z][a-z0-9_]*$/.test(osObjectId)) {
  console.error(`${RED}❌ os_object_id must be snake_case (e.g., my_new_os_object)${RESET}`);
  process.exit(1);
}

// Resolve paths
const SCRIPT_DIR = __dirname;
const FRONTEND_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const TERRAFUSION_OS = path.join(FRONTEND_ROOT, 'src', 'terrafusion-os');
const TEMPLATES_DIR = path.join(SCRIPT_DIR, 'templates');

function readTemplate(name: string): string {
  const file = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(file)) {
    console.error(`${RED}❌ Template not found: ${file}${RESET}`);
    process.exit(1);
  }
  return fs.readFileSync(file, 'utf8');
}

function applyReplacements(template: string): string {
  return template
    .replace(/__OS_OBJECT_NAME__/g, pascalName)
    .replace(/__OS_OBJECT_ID__/g, osObjectId);
}

function writeFileIfNotExists(targetPath: string, content: string): boolean {
  if (fs.existsSync(targetPath)) {
    console.error(
      `${RED}❌ File already exists: ${path.relative(FRONTEND_ROOT, targetPath)}${RESET}`
    );
    return false;
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`${GREEN}✅ Created${RESET} ${path.relative(FRONTEND_ROOT, targetPath)}`);
  return true;
}

console.log(`\n${CYAN}🔧 Scaffolding OS Object: ${pascalName} (${osObjectId})${RESET}\n`);

// 1. Create component
const componentContent = applyReplacements(readTemplate('OSObject.tsx.tpl'));
const componentPath = path.join(TERRAFUSION_OS, 'workspaces', `${pascalName}.tsx`);
const componentCreated = writeFileIfNotExists(componentPath, componentContent);

// 2. Create test
const testContent = applyReplacements(readTemplate('OSObject.test.tsx.tpl'));
const testPath = path.join(TERRAFUSION_OS, 'workspaces', '__tests__', `${pascalName}.test.tsx`);
const testCreated = writeFileIfNotExists(testPath, testContent);

// 3. Print spec snippet
const specSnippet = applyReplacements(readTemplate('SpecSnippet.md.tpl'));

console.log(`\n${CYAN}📄 Spec snippet for docs/os-workspace-spine-spec.md:${RESET}\n`);
console.log('─'.repeat(60));
console.log(specSnippet);
console.log('─'.repeat(60));

// 4. Print next steps
console.log(`\n${YELLOW}📌 Next steps:${RESET}\n`);
console.log(`1. ${YELLOW}Register in catalog${RESET} – Add to core/osObjects/catalog.ts:`);
console.log(`
   // In OSObjectId type:
   | '${osObjectId}'

   // In OS_OBJECTS:
   ${osObjectId}: {
     id: '${osObjectId}',
     label: '${pascalName}',
     domain: 'os',
     resolveComponent: () => ${pascalName},
   },
`);

console.log(`2. ${YELLOW}Import component${RESET} – Add import to catalog.ts:`);
console.log(`
   import { ${pascalName} } from '../../workspaces/${pascalName}';
`);

console.log(
  `3. ${YELLOW}Update spec${RESET} – Paste snippet into docs/os-workspace-spine-spec.md (Section 1.1)`
);

console.log(
  `4. ${YELLOW}Extend catalog tests${RESET} – Add to core/osObjects/__tests__/catalog.test.ts:`
);
console.log(`
   it('has ${osObjectId} registered', () => {
     expect(OS_OBJECTS['${osObjectId}']).toBeDefined();
     expect(resolveOSObjectComponent('${osObjectId}')).toBeDefined();
   });
`);

console.log(`5. ${YELLOW}Run tests${RESET}:`);
console.log(`
   npx vitest run src/terrafusion-os
`);

if (componentCreated && testCreated) {
  console.log(`\n${GREEN}✨ Scaffold complete!${RESET}\n`);
} else {
  console.log(`\n${YELLOW}⚠️  Some files were skipped (already exist).${RESET}\n`);
}
