import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const HEADER = '// GENERATED - DO NOT EDIT';
const ROOT = process.cwd();
const targets = [
  {
    source: 'os-platform/core/types/commandGovernance.ts',
    out: 'os-platform/core/types/commandGovernance.js',
  },
  {
    source: 'os-platform/core/pilot/ToolRegistry.ts',
    out: 'os-platform/core/pilot/ToolRegistry.js',
  },
  {
    source: 'os-platform/core/pilot/ToolRunner.preflight.ts',
    out: 'os-platform/core/pilot/ToolRunner.preflight.js',
  },
  {
    source: 'os-platform/core/pilot/handlers.ts',
    out: 'os-platform/core/pilot/handlers.js',
  },
  {
    source: 'os-platform/core/pilot/handlers.real.ts',
    out: 'os-platform/core/pilot/handlers.real.js',
  },
  {
    source: 'os-platform/core/pilot/backendClient.ts',
    out: 'os-platform/core/pilot/backendClient.js',
  },
  {
    source: 'os-platform/core/pilot/ToolRunner.ts',
    out: 'os-platform/core/pilot/ToolRunner.js',
  },
  {
    source: 'os-platform/core/pilot/index.ts',
    out: 'os-platform/core/pilot/index.js',
  },
  {
    source: 'os-platform/core/pilot/traceExport.ts',
    out: 'os-platform/core/pilot/traceExport.js',
  },
  {
    source: 'os-platform/core/trace/TraceStore.ts',
    out: 'os-platform/core/trace/TraceStore.js',
  },
  {
    source: 'os-platform/core/trace/TraceService.ts',
    out: 'os-platform/core/trace/TraceService.js',
  },
  {
    source: 'os-platform/core/trace/index.ts',
    out: 'os-platform/core/trace/index.js',
  },
  {
    source: 'os-platform/core/terratrc/trace-feed-adapter.ts',
    out: 'os-platform/core/terratrc/trace-feed-adapter.js',
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
