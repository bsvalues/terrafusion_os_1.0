import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CONFIG = {
  taxonomyPath: path.resolve('dotnet-warning-taxonomy.json'),
  logPath: path.resolve('ci_dotnet_warning_taxonomy.log'),
  solution: 'backend/TerraFusion.sln',
};

function normalizePath(p) {
  if (!p) return 'unknown';
  try {
    let rel = path.relative(process.cwd(), p);
    return rel.split(path.sep).join('/');
  } catch {
    return p;
  }
}

export function parseTaxonomy(output) {
  const lines = output.split(/[\r\n]+/);
  const taxonomy = {
    totalWarnings: 0,
    byCode: {},
    byProject: {},
    topFiles: [],
  };

  // Regex: Path(Line,Col): warning Code: Message [Project]
  const warningRegex = /^\s*(.*?)\((\d+),(\d+)\): warning (CS\w+): .*? \[(.*?)\]/;

  const fileCounts = {};
  const seenWarnings = new Set();

  for (const line of lines) {
    // Skip lines that don't look like warnings early to save regex time?
    if (!line.includes('warning CS')) continue;

    const match = line.match(warningRegex);
    if (match) {
      let filePath = match[1].trim();
      const lineNum = match[2];
      const colNum = match[3];
      const code = match[4];
      let projectPath = match[5].trim();

      if (path.isAbsolute(filePath)) filePath = normalizePath(filePath);
      if (path.isAbsolute(projectPath)) projectPath = normalizePath(projectPath);

      // Deduplication Key
      const uniqueKey = `${filePath}:${lineNum}:${colNum}:${code}:${projectPath}`;
      if (seenWarnings.has(uniqueKey)) continue;
      seenWarnings.add(uniqueKey);

      taxonomy.totalWarnings++;
      // Aggregation: Code
      taxonomy.byCode[code] = (taxonomy.byCode[code] || 0) + 1;

      // Aggregation: Project
      if (!taxonomy.byProject[projectPath]) {
        taxonomy.byProject[projectPath] = { total: 0, byCode: {} };
      }
      taxonomy.byProject[projectPath].total++;
      taxonomy.byProject[projectPath].byCode[code] =
        (taxonomy.byProject[projectPath].byCode[code] || 0) + 1;

      // Aggregation: File
      if (!fileCounts[filePath]) {
        fileCounts[filePath] = { total: 0, byCode: {} };
      }
      fileCounts[filePath].total++;
      fileCounts[filePath].byCode[code] = (fileCounts[filePath].byCode[code] || 0) + 1;
    }
  }

  // Top Files: Sort by total count desc
  taxonomy.topFiles = Object.entries(fileCounts)
    .map(([file, data]) => ({ file, ...data }))
    .sort((a, b) => b.total - a.total);

  return taxonomy;
}

// Execution Block
const isMainModule = url => {
  if (!url) return false;
  const executedFile = path.resolve(process.argv[1]);
  const currentFile = fileURLToPath(url);
  return executedFile === currentFile;
};

if (isMainModule(import.meta.url)) {
  try {
    console.log(`[Taxonomy] Building ${CONFIG.solution}...`);

    let buildOutput = '';
    try {
      buildOutput = execSync(`dotnet build ${CONFIG.solution} --no-incremental`, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (e) {
      buildOutput = e.stdout ? e.stdout.toString() : '';
      // If build failed but produced warnings, we still want the report.
      if (!buildOutput) console.warn('[Taxonomy] Build failed with no output.');
    }

    console.log('[Taxonomy] Parsing warnings...');
    const taxonomy = parseTaxonomy(buildOutput);
    taxonomy.generatedAt = new Date().toISOString();

    // Write JSON
    fs.writeFileSync(CONFIG.taxonomyPath, JSON.stringify(taxonomy, null, 2));
    console.log(`[Taxonomy] Written to ${CONFIG.taxonomyPath}`);

    // Write Human Log
    let logContent = `DOTNET WARNING TAXONOMY REPORT\n`;
    logContent += `Generated: ${taxonomy.generatedAt}\n`;
    logContent += `Total Warnings: ${taxonomy.totalWarnings}\n\n`;

    logContent += `--- TOP OFFENDERS (FILES) ---\n`;
    taxonomy.topFiles.slice(0, 20).forEach(f => {
      logContent += `${f.total.toString().padEnd(5)} ${f.file}\n`;
      // Optional: show breakdown per file in log? maybe too verbose.
    });

    logContent += `\n--- BY CODE ---\n`;
    Object.entries(taxonomy.byCode)
      .sort((a, b) => b[1] - a[1]) // Sort by count
      .forEach(([code, count]) => {
        logContent += `${code.padEnd(10)}: ${count}\n`;
      });

    fs.writeFileSync(CONFIG.logPath, logContent);
    console.log(`[Taxonomy] Log written to ${CONFIG.logPath}`);
  } catch (e) {
    console.error('Fatal Error:', e);
    process.exit(1);
  }
}
