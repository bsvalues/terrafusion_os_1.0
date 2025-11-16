#!/usr/bin/env node

/**
 * TerraFusion Developer Console (TDC) - Phase 3
 * The unified entry point for the TerraFusion OS ecosystem
 * "Government. Transcended." - One command to rule them all
 */

const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.resolve(ROOT, 'package.json');

// ----- helpers -----------------------------------------------------------

function runCommand(cmd, args, options = {}) {
  return new Promise(resolve => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || ROOT,
      stdio: 'inherit',
      shell: options.shell || false,
    });

    child.on('exit', code => {
      if (code !== 0 && !options.allowFailure) {
        console.error(`\n⚠️ Command exited with code ${code}`);
      }
      resolve(code);
    });
  });
}

function exists(p) {
  return fs.existsSync(path.resolve(ROOT, p));
}

function openVSCodeWorkspace(workspaceFile) {
  const fullPath = path.resolve(ROOT, 'workspaces', workspaceFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Workspace file not found: ${fullPath}`);
    return Promise.resolve(1);
  }
  console.log(`\n🧭 Opening VS Code workspace: ${workspaceFile}\n`);
  return runCommand('code', [fullPath]);
}

// Platform helpers for scripts
function scriptCmd(scriptPath) {
  const full = path.resolve(ROOT, scriptPath);

  if (!fs.existsSync(full)) {
    console.error(`❌ Script not found: ${full}`);
    return null;
  }

  if (process.platform === 'win32') {
    // Use PowerShell if .ps1, otherwise try bash via WSL/Git Bash
    if (full.endsWith('.ps1')) {
      return { cmd: 'powershell.exe', args: ['-ExecutionPolicy', 'Bypass', '-File', full] };
    } else {
      return { cmd: 'bash', args: [full] };
    }
  } else {
    return { cmd: full, args: [] };
  }
}

async function runScript(scriptPath) {
  const spec = scriptCmd(scriptPath);
  if (!spec) return 1;
  return await runCommand(spec.cmd, spec.args, { cwd: ROOT, shell: false });
}

// ----- VS Code project system fixes ------------------------------------

async function fixVSCodeProjectSystem() {
  console.log('\n🔧 Fixing VS Code project system conflicts...\n');

  // Close VS Code instances to reset project system
  if (process.platform === 'win32') {
    await runCommand('taskkill', ['/F', '/IM', 'Code.exe'], { allowFailure: true });
    await runCommand('taskkill', ['/F', '/IM', 'Code - Insiders.exe'], { allowFailure: true });
  } else {
    await runCommand('pkill', ['-f', 'code'], { allowFailure: true });
  }

  console.log('   ✓ Closed VS Code instances');

  // Clean VS Code workspace state
  const vscodeDir = path.resolve(ROOT, '.vscode');
  const settingsFile = path.resolve(vscodeDir, 'settings.json');

  if (fs.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      // Clear any project system cache settings
      if (settings['dotnet.completion.showCompletionItemsFromUnimportedNamespaces']) {
        delete settings['dotnet.completion.showCompletionItemsFromUnimportedNamespaces'];
      }
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
      console.log('   ✓ Cleaned VS Code settings');
    } catch (e) {
      console.log('   ⚠️ Could not clean VS Code settings:', e.message);
    }
  }

  // Clean .NET build artifacts that might cause conflicts
  if (exists('backend')) {
    console.log('   🧹 Cleaning .NET build artifacts...');
    await runCommand('dotnet', ['clean'], {
      cwd: path.resolve(ROOT, 'backend'),
      allowFailure: true,
    });

    // Remove bin/obj directories that might have conflicts
    const cleanDirs = ['bin', 'obj'];
    const walkDir = dir => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isDirectory()) {
          const fullPath = path.join(dir, file.name);
          if (cleanDirs.includes(file.name)) {
            try {
              fs.rmSync(fullPath, { recursive: true, force: true });
              console.log(`     ✓ Removed ${fullPath}`);
            } catch (e) {
              // Ignore errors, might be in use
            }
          } else {
            walkDir(fullPath);
          }
        }
      }
    };

    walkDir(path.resolve(ROOT, 'backend'));
  }

  console.log(
    '\n✅ VS Code project system cleaned. Wait 2-3 seconds before reopening workspaces.\n'
  );

  return new Promise(resolve => {
    setTimeout(() => {
      console.log('🚀 Ready to open clean workspace!\n');
      resolve(0);
    }, 2000);
  });
}

// ----- actions -----------------------------------------------------------

async function launchBackendWorkspace() {
  return openVSCodeWorkspace('backend.code-workspace');
}

async function launchFrontendWorkspace() {
  return openVSCodeWorkspace('frontend.code-workspace');
}

async function launchMasterWorkspace() {
  return openVSCodeWorkspace('master.code-workspace');
}

async function runWorkspaceDoctor() {
  console.log('\n🏥 Running Workspace Doctor...\n');

  if (exists('scripts/workspace-doctor.sh')) {
    await runScript('scripts/workspace-doctor.sh');
  } else if (exists('scripts/workspace-doctor.ps1')) {
    await runScript('scripts/workspace-doctor.ps1');
  } else {
    console.log('⚠️ No workspace-doctor script found.');
    console.log('   Expected one of:');
    console.log('   - scripts/workspace-doctor.sh');
    console.log('   - scripts/workspace-doctor.ps1');
  }
}

async function runHealthCheck() {
  console.log('\n🩺 Running System Health Check...\n');

  if (exists('scripts/health-check.sh')) {
    await runScript('scripts/health-check.sh');
  } else if (exists('scripts/health-check.ps1')) {
    await runScript('scripts/health-check.ps1');
  } else {
    console.log('⚠️ No health-check script found.');
    console.log('   Expected one of:');
    console.log('   - scripts/health-check.sh');
    console.log('   - scripts/health-check.ps1');
  }
}

async function launchCoreServices() {
  console.log('\n🚀 Launching TerraFusion Core Services...\n');

  // Build first
  if (exists('backend')) {
    console.log('🔨 Building backend...');
    const buildResult = await runCommand('dotnet', ['build', '--no-restore'], {
      cwd: path.resolve(ROOT, 'backend'),
      allowFailure: true,
    });

    if (buildResult === 0) {
      console.log('\n🧠 Starting Consciousness Engine (port 3004)...');

      // Start consciousness engine in background
      const consciousnessProcess = spawn(
        'dotnet',
        ['run', '--project', 'TerraFusion.Consciousness', '--urls', 'http://localhost:3004'],
        {
          cwd: path.resolve(ROOT, 'backend'),
          detached: true,
          stdio: 'ignore',
          env: { ...process.env, TF_SKIP_DB_HEALTH: 'true' },
        }
      );

      consciousnessProcess.unref();
      console.log(`   ✓ Consciousness Engine started (PID: ${consciousnessProcess.pid})`);

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('\n🌐 Starting API Gateway (port 5000)...');

      // Start API gateway in background
      const apiProcess = spawn(
        'dotnet',
        ['run', '--project', 'TerraFusion.API', '--urls', 'http://localhost:5000'],
        {
          cwd: path.resolve(ROOT, 'backend'),
          detached: true,
          stdio: 'ignore',
        }
      );

      apiProcess.unref();
      console.log(`   ✓ API Gateway started (PID: ${apiProcess.pid})`);

      console.log('\n🎨 Starting Frontend Dev Server (port 3000)...');

      if (exists('frontend/package.json')) {
        // Start frontend dev server in background
        const frontendProcess = spawn('npm', ['run', 'dev'], {
          cwd: path.resolve(ROOT, 'frontend'),
          detached: true,
          stdio: 'ignore',
        });

        frontendProcess.unref();
        console.log(`   ✓ Frontend Dev Server started (PID: ${frontendProcess.pid})`);
      } else {
        console.log('   ⚠️ Frontend package.json not found (skipping)');
      }

      console.log('\n🎯 Core Services Launched!');
      console.log('   - Consciousness Engine: http://localhost:3004/health');
      console.log('   - API Gateway: http://localhost:5000/health');
      console.log('   - Frontend: http://localhost:3000');
      console.log("\n💡 Use 'Run System Health Check' to verify all services are responding.\n");
    } else {
      console.log('❌ Backend build failed. Fix build errors before launching services.');
    }
  } else {
    console.log('⚠️ Backend folder not found.');
  }
}

async function runAllTests() {
  console.log('\n🧪 Running Backend + Frontend tests...\n');

  let allPassed = true;

  // Backend tests
  if (exists('backend')) {
    console.log('➡️  Backend: dotnet test');
    const backendResult = await runCommand('dotnet', ['test', '--no-build'], {
      cwd: path.resolve(ROOT, 'backend'),
      allowFailure: true,
    });
    if (backendResult !== 0) allPassed = false;
  } else {
    console.log('⚠️ Backend folder not found (skipping).');
  }

  // Frontend tests
  if (exists('frontend/package.json')) {
    console.log('\n➡️  Frontend: npm test\n');
    const frontendResult = await runCommand('npm', ['test'], {
      cwd: path.resolve(ROOT, 'frontend'),
      allowFailure: true,
    });
    if (frontendResult !== 0) allPassed = false;
  } else {
    console.log('⚠️ Frontend package.json not found (skipping).');
  }

  console.log(
    allPassed ? '\n✅ All tests passed.\n' : '\n⚠️ Some tests failed. Check output above.\n'
  );
}

async function summonAICompanion() {
  console.log(`
🤖 TerraFusion AI Workspace Companions

1) Navigator  – "Where does X live? Which workspace for Y?"
2) Surgeon    – "Fix this specific error/test/issue."
3) Scribe     – "Document this change/feature/endpoint."
4) Open WORKSPACE_AI_PROFILES.md in VS Code
5) Open WORKSPACE_COMPANIONS.md in VS Code
6) Back to main menu
`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = q => new Promise(res => rl.question(q, res));
  const choice = await question('Select a companion (1-6): ');
  rl.close();

  switch (choice.trim()) {
    case '1':
      console.log(`
🧭 Navigator Prompt (copy/paste into your AI assistant):

You are the TerraFusion Navigator - the omniscient guide to TerraFusion OS architecture.

Your Role: Answer "where" and "which" questions with precise, actionable guidance.

Questions you excel at:
- "Where does X functionality live?"
- "Which workspace should I use for Y task?"
- "Is this folder/service active or legacy?"
- "How do I find the code that handles Z?"

Context Files:
- WORKSPACES.md (58 official workspace catalog)
- WORKSPACE_AUDIT_REPORT.md (active vs sparse analysis)
- STANDARD.md (workspace quality standards)

Always provide: Exact file paths, workspace recommendations, quick context, next steps.

Ready to navigate TerraFusion OS with championship precision.
`);
      break;
    case '2':
      console.log(`
🔧 Surgeon Prompt (copy/paste into your AI assistant):

You are the TerraFusion Surgeon - the focused, laser-precise code repair specialist.

Your Role: Fix specific, isolated problems without breaking anything else.

Specialties:
- Fix one failing test
- Clean up one service/component
- Resolve specific warning classes
- Debug one API endpoint
- Optimize single performance bottlenecks

Surgical Principles:
- Scope: Only the specific file/service/component in question
- Precision: Minimal, surgical changes
- Safety: No grand refactors or architectural changes
- Testing: Fix includes verification step

Ready to perform precision surgery on TerraFusion OS code.
`);
      break;
    case '3':
      console.log(`
📝 Scribe Prompt (copy/paste into your AI assistant):

You are the TerraFusion Scribe - the articulate documentation expert.

Your Role: Transform code changes into clear, government-grade documentation.

Documentation Types:
- README updates after new features
- API endpoint documentation
- Clear code comments for functions
- "What changed?" commit summaries
- Migration guides for breaking changes

Writing Style:
- Government Professional: Clear, authoritative, precise
- Developer Friendly: Practical examples, copy-paste commands
- TerraFusion Voice: "Government. Transcended." excellence
- Action Oriented: What to do, not just what exists

Ready to document TerraFusion OS with championship clarity.
`);
      break;
    case '4':
      {
        const profilesPath = path.resolve(ROOT, 'WORKSPACE_AI_PROFILES.md');
        if (!fs.existsSync(profilesPath)) {
          console.log('⚠️ WORKSPACE_AI_PROFILES.md not found at repo root.');
        } else {
          console.log('\n📄 Opening WORKSPACE_AI_PROFILES.md in VS Code...\n');
          await runCommand('code', [profilesPath]);
        }
      }
      break;
    case '5':
      {
        const companionsPath = path.resolve(ROOT, 'WORKSPACE_COMPANIONS.md');
        if (!fs.existsSync(companionsPath)) {
          console.log('⚠️ WORKSPACE_COMPANIONS.md not found at repo root.');
        } else {
          console.log('\n📄 Opening WORKSPACE_COMPANIONS.md in VS Code...\n');
          await runCommand('code', [companionsPath]);
        }
      }
      break;
    default:
      console.log('Returning to main menu...');
  }
}

// ----- main menu ---------------------------------------------------------

function printMenu() {
  console.log(`
🚀 TERRAFUSION DEVELOPER CONSOLE (TDC) - PHASE 3
================================================
Root: ${ROOT}
Status: Government. Transcended.

🏗️  WORKSPACE MANAGEMENT
1) Launch Backend Workspace
2) Launch Frontend Workspace
3) Launch Master Workspace

🔧  SYSTEM OPERATIONS
4) Fix VS Code Project System Issues
5) Run Workspace Doctor
6) Run System Health Check
7) Launch Core Services (API + Consciousness + Frontend)

🧪  TESTING & DEVELOPMENT
8) Run All Tests (Backend + Frontend)
9) Summon AI Companion (Navigator / Surgeon / Scribe)

10) Exit TDC
`);
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = q => new Promise(res => rl.question(q, res));

  // Check if TDC is properly integrated
  if (!fs.existsSync(PACKAGE_JSON)) {
    console.log('\n⚠️ Warning: package.json not found at repo root.');
    console.log('   TDC works best when run from the project root directory.\n');
  }

  let done = false;
  while (!done) {
    printMenu();
    const answer = await question('Select an option (1-10): ');
    const choice = answer.trim();

    switch (choice) {
      case '1':
        await launchBackendWorkspace();
        break;
      case '2':
        await launchFrontendWorkspace();
        break;
      case '3':
        await launchMasterWorkspace();
        break;
      case '4':
        await fixVSCodeProjectSystem();
        break;
      case '5':
        await runWorkspaceDoctor();
        break;
      case '6':
        await runHealthCheck();
        break;
      case '7':
        await launchCoreServices();
        break;
      case '8':
        await runAllTests();
        break;
      case '9':
        await summonAICompanion();
        break;
      case '10':
        console.log('\n🎯 Exiting TDC. Continue transcending government limitations.\n');
        done = true;
        break;
      default:
        console.log('❓ Please enter a number between 1 and 10.');
    }

    if (!done) {
      console.log('\n⏎ Press Enter to continue...');
      await question('');
    }
  }

  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 TDC interrupted. Government. Transcended.\n');
  process.exit(0);
});

main().catch(err => {
  console.error('🔥 Unexpected error in TDC:', err);
  process.exit(1);
});
