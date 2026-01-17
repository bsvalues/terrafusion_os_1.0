// scripts/ci/tests/verifyScopeDeterminism.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '../../..');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-det-verify-'));
const logFile = path.join(repoRoot, 'ci_determinism.log');

// Initialize log
fs.writeFileSync(logFile, `[${new Date().toISOString()}] Starting Determinism Drill...\n`);

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

function error(msg) {
    console.error(msg);
    fs.appendFileSync(logFile, 'ERROR: ' + msg + '\n');
}

log(`Working in ${tempDir}`);

// We need to run the scope command twice and compare outputs
// The scope command writes to repo root.
// We will capture the relevant files after each run.

const scopeFiles = [
    'DEPENDENCY_SCOPE_CORE_OS_RUNTIME.json',
    'DEPENDENCY_SCOPE_CORE_OS_TOOLING.json',
    'DEPENDENCY_SCOPE_GEN2_APPS.json',
    'DEPENDENCY_SCOPE_QUARANTINE.json',
    'DEPENDENCY_SCOPE_SOLIDIFIED_OS.json',
    'DEPENDENCY_SCOPE_LEGACY_QUARANTINE.json',
    'DEPENDENCY_SCOPE_REPORT.md'
];

function runScope(iteration) {
    log(`[${iteration}] Running scope classifier...`);
    try {
        execSync('pnpm tf:scope -- --solidBase=567fbcec5 --archAnchor=9af5bb291', { 
            cwd: repoRoot,
            stdio: 'ignore' // silence stdout/stderr unless failure
        });
    } catch (e) {
        error(`[${iteration}] Scope classifier failed.`);
        process.exit(1);
    }
    
    const outDir = path.join(tempDir, iteration);
    fs.mkdirSync(outDir);
    
    for (const f of scopeFiles) {
        const src = path.join(repoRoot, f);
        const dest = path.join(outDir, f);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        } else {
            error(`[${iteration}] Warning: ${f} not produced.`);
        }
    }
}

try {
    runScope('A');
    runScope('B');
    
    log('Comparing outputs...');
    let diffFound = false;
    
    for (const f of scopeFiles) {
        const pathA = path.join(tempDir, 'A', f);
        const pathB = path.join(tempDir, 'B', f);
        
        if (!fs.existsSync(pathA) && !fs.existsSync(pathB)) continue;
        if (!fs.existsSync(pathA) || !fs.existsSync(pathB)) {
            error(`Mismatch: ${f} missing in one iteration.`);
            diffFound = true;
            continue;
        }
        
        const contentA = fs.readFileSync(pathA, 'utf8');
        const contentB = fs.readFileSync(pathB, 'utf8');
        
        if (contentA !== contentB) {
            error(`Mismatch: ${f} differs between runs.`);
            // Show diff? No, just fail.
            diffFound = true;
        }
    }
    
    if (diffFound) {
        error('❌ Determinism check failed. Outputs differ between runs.');
        process.exit(1);
    } else {
        log('✅ Determinism check passed. Outputs are identical.');
    }

} finally {
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
}
