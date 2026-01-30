/**
 * THE GATEKEEPER
 * Verifies that the Visual Constitution is upheld.
 * Rule: No raw hex colors allowed in component files. Use tokens.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '../src');

// Exemptions (Configuration files, the Token Registry itself)
const EXEMPTIONS = [
  'tokens.ts',
  'colors.ts',
  'vite.config.ts',
  'tailwind.config.js',
  'setupTests.ts',
  'goldenParcel.ts', // Mock data might use specific colors for charts
  'features.ts',
];

// The Contraband Pattern: Hex codes (3, 6, or 8 digits)
const CONTRABAND_REGEX = /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/g;

let violationCount = 0;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (
      (file.endsWith('.tsx') || file.endsWith('.ts')) &&
      !EXEMPTIONS.includes(file) &&
      !file.endsWith('.test.tsx') &&
      !file.endsWith('.spec.tsx') &&
      !file.endsWith('.stories.tsx')
    ) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Basic check to exclude things that look like hex colors but might be part of strings/IDs if needed in future
      // For now, simple regex match per instructions.
      const matches = content.match(CONTRABAND_REGEX);

      if (matches) {
        // Filter out valid IDs or URL fragments if any (simplified check)
        // For v1 strictness, we assume # is mostly color in TSX

        let found = false;
        matches.forEach((match) => {
          // Double check context if needed, but per instruction, any hex is contraband.
          console.error(
            `   Found raw hex in ${file}: ${match} -> Use TF_TOKENS or CSS var instead.`
          );
          found = true;
        });

        if (found) {
          console.error(`🚨 CONSTITUTION VIOLATION in ${file}`);
          violationCount++;
        }
      }
    }
  });
}

console.log('🛡️  Initiating Sovereign Constitution Scan...');
scanDirectory(SRC_DIR);

if (violationCount > 0) {
  console.error(`\n❌ BUILD FAILED: ${violationCount} Visual Constitution Violations detected.`);
  console.error('   The Sovereign OS cannot be deployed with untraced magic values.');
  process.exit(1);
} else {
  console.log('✅ Constitution Verified. No visual contraband detected.');
  process.exit(0);
}
