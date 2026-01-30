import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const HEADER = '// GENERATED - DO NOT EDIT';
const ROOT = process.cwd();
const targets = [
  {
    source: 'os-platform/core/pilot/handlers.ts',
    out: 'os-platform/core/pilot/handlers.js',
  },
  {
    source: 'os-platform/core/pilot/ToolRunner.ts',
    out: 'os-platform/core/pilot/ToolRunner.js',
  },
  {
    source: 'os-platform/core/pilot/index.ts',
    out: 'os-platform/core/pilot/index.js',
  },
];

function transpile(sourcePath, outPath) {
  const absSource = path.resolve(ROOT, sourcePath);
  const absOut = path.resolve(ROOT, outPath);
  const input = fs.readFileSync(absSource, 'utf8');
  const result = ts.transpileModule(input, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });

  const output = `${HEADER}\n${result.outputText}`;
  fs.writeFileSync(absOut, output, 'utf8');
}

for (const target of targets) {
  transpile(target.source, target.out);
}

console.log('Core JS regenerated for handlers.');
