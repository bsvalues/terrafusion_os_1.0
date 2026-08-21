import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FALSE_POSITIVE = {
  name: 'Microsoft.SemanticKernel.Core',
  version: '1.4.0',
  purl: 'pkg:nuget/Microsoft.SemanticKernel.Core@1.4.0',
};
const AFFECTED_PACKAGE = 'Microsoft.SemanticKernel.Plugins.Core';
const AFFECTED_COMPONENT = 'SessionsPythonPlugin';
const AFFECTED_ASSEMBLY = 'Microsoft.SemanticKernel.Plugins.Core.dll';
const RUNTIME_NEEDLES = [
  Buffer.from(AFFECTED_PACKAGE, 'utf8'),
  Buffer.from(AFFECTED_COMPONENT, 'utf8'),
  Buffer.from(AFFECTED_PACKAGE, 'utf16le'),
  Buffer.from(AFFECTED_COMPONENT, 'utf16le'),
];
const SOURCE_EXTENSIONS = new Set(['.cs', '.csproj', '.props', '.targets']);
const SKIP_DIRECTORIES = new Set(['.git', 'bin', 'obj', 'node_modules']);

function packagePurls(pkg) {
  return (pkg.externalRefs ?? [])
    .filter(reference => reference.referenceType === 'purl')
    .map(reference => reference.referenceLocator);
}

export function validateRuntimeFiles(runtimeRecords) {
  if (!Array.isArray(runtimeRecords) || runtimeRecords.length === 0) {
    throw new Error('exact backend runtime tree must contain files');
  }
  for (const record of runtimeRecords) {
    if (typeof record?.path !== 'string' || !Buffer.isBuffer(record?.bytes)) {
      throw new Error('backend runtime file evidence is unreadable');
    }
    if (record.path.toLowerCase().includes(AFFECTED_ASSEMBLY.toLowerCase())) {
      throw new Error(`affected Semantic Kernel plugin assembly is present at ${record.path}`);
    }
    for (const needle of RUNTIME_NEEDLES) {
      if (record.bytes.includes(needle)) {
        throw new Error(`affected Semantic Kernel plugin metadata is present in ${record.path}`);
      }
    }
  }
  return runtimeRecords.length;
}

export function validateSemanticKernelAdvisoryGuard(document, runtimeRecords, sourceRecords) {
  if (!document || !Array.isArray(document.packages) || document.packages.length === 0) {
    throw new Error('backend SPDX must contain packages');
  }
  const runtimeFileCount = validateRuntimeFiles(runtimeRecords);
  const affectedRuntimePackages = document.packages.filter(pkg => pkg.name === AFFECTED_PACKAGE);
  if (affectedRuntimePackages.length > 0) {
    throw new Error(`${AFFECTED_PACKAGE} is present; the advisory suppression is invalid`);
  }

  const exactMatches = document.packages.filter(
    pkg =>
      pkg.name === FALSE_POSITIVE.name &&
      pkg.versionInfo === FALSE_POSITIVE.version &&
      packagePurls(pkg).includes(FALSE_POSITIVE.purl)
  );
  if (exactMatches.length === 0) {
    throw new Error('the exact Microsoft.SemanticKernel.Core 1.4.0 Grype tuple is absent');
  }

  for (const record of sourceRecords) {
    if (record.text.includes(AFFECTED_PACKAGE) || record.text.includes(AFFECTED_COMPONENT)) {
      throw new Error(`affected Semantic Kernel plugin usage is present in ${record.path}`);
    }
  }
  return {
    exactFalsePositiveOccurrences: exactMatches.length,
    runtimeFileCount,
    sourceFileCount: sourceRecords.length,
  };
}

function readRuntimeRecords(root) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error('exact backend runtime tree is missing or not a directory');
  }
  const records = [];
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile()) {
        records.push({ path: path.relative(root, fullPath), bytes: fs.readFileSync(fullPath) });
      } else {
        throw new Error(`unsupported exact-runtime filesystem entry at ${fullPath}`);
      }
    }
  };
  visit(root);
  return records;
}

function readSourceRecords(root) {
  const records = [];
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        records.push({
          path: path.relative(root, fullPath),
          text: fs.readFileSync(fullPath, 'utf8'),
        });
      }
    }
  };
  visit(root);
  return records;
}

function main(args) {
  if (args.length !== 3) {
    throw new Error(
      'usage: backend_semantic_kernel_advisory_guard.mjs <backend-runtime.spdx.json> <exact-runtime-root> <backend-source-root>'
    );
  }
  const [spdxPath, runtimeRoot, sourceRoot] = args;
  const document = JSON.parse(fs.readFileSync(spdxPath, 'utf8'));
  const result = validateSemanticKernelAdvisoryGuard(
    document,
    readRuntimeRecords(runtimeRoot),
    readSourceRecords(sourceRoot)
  );
  console.log(
    `${spdxPath}: verified ${result.exactFalsePositiveOccurrences} exact Core tuple occurrence(s), no affected assembly/type across ${result.runtimeFileCount} exact-runtime files and ${result.sourceFileCount} project/source files`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
