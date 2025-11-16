#!/usr/bin/env node

/**
 * TerraFusion Developer Console (TDC) - Phase 3
 * The unified entry point for the TerraFusion OS ecosystem
 * "Government. Transcended." - One command to rule them all
 */

const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const PACKAGE_JSON = path.resolve(ROOT, "package.json");

// ----- helpers -----------------------------------------------------------

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || ROOT,
      stdio: "inherit",
      shell: options.shell || false,
    });

    child.on("exit", (code) => {
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
  const fullPath = path.resolve(ROOT, "workspaces", workspaceFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Workspace file not found: ${fullPath}`);
    return Promise.resolve(1);
  }
  console.log(`\n🧭 Opening VS Code workspace: ${workspaceFile}\n`);
  return runCommand("code", [fullPath]);
}

// Platform helpers for scripts
function scriptCmd(scriptPath) {
  const full = path.resolve(ROOT, scriptPath);

  if (!fs.existsSync(full)) {
    console.error(`❌ Script not found: ${full}`);
    return null;
  }

  if (process.platform === "win32") {
    // Use PowerShell if .ps1, otherwise try bash via WSL/Git Bash
    if (full.endsWith(".ps1")) {
      return { cmd: "powershell.exe", args: ["-ExecutionPolicy", "Bypass", "-File", full] };
    } else {
      return { cmd: "bash", args: [full] };
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
  console.log("\n🔧 Fixing VS Code project system conflicts...\n");

  // Close VS Code instances to reset project system
  if (process.platform === "win32") {
    await runCommand("taskkill", ["/F", "/IM", "Code.exe"], { allowFailure: true });
    await runCommand("taskkill", ["/F", "/IM", "Code - Insiders.exe"], { allowFailure: true });
  } else {
    await runCommand("pkill", ["-f", "code"], { allowFailure: true });
  }

  console.log("   ✓ Closed VS Code instances");

  // Clean VS Code workspace state
  const vscodeDir = path.resolve(ROOT, ".vscode");
  const settingsFile = path.resolve(vscodeDir, "settings.json");

  if (fs.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      // Clear any project system cache settings
      if (settings["dotnet.completion.showCompletionItemsFromUnimportedNamespaces"]) {
        delete settings["dotnet.completion.showCompletionItemsFromUnimportedNamespaces"];
      }
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
      console.log("   ✓ Cleaned VS Code settings");
    } catch (e) {
      console.log("   ⚠️ Could not clean VS Code settings:", e.message);
    }
  }

  // Clean .NET build artifacts that might cause conflicts
  if (exists("backend")) {
    console.log("   🧹 Cleaning .NET build artifacts...");
    await runCommand("dotnet", ["clean"], {
      cwd: path.resolve(ROOT, "backend"),
      allowFailure: true
    });

    // Remove bin/obj directories that might have conflicts
    const cleanDirs = ["bin", "obj"];
    const walkDir = (dir) => {
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

    walkDir(path.resolve(ROOT, "backend"));
  }

  console.log("\n✅ VS Code project system cleaned. Wait 2-3 seconds before reopening workspaces.\n");

  return new Promise(resolve => {
    setTimeout(() => {
      console.log("🚀 Ready to open clean workspace!\n");
      resolve(0);
    }, 2000);
  });
}

// ----- actions -----------------------------------------------------------

async function launchBackendWorkspace() {
  return openVSCodeWorkspace("backend.code-workspace");
}

async function launchFrontendWorkspace() {
  return openVSCodeWorkspace("frontend.code-workspace");
}

async function launchMasterWorkspace() {
  return openVSCodeWorkspace("master.code-workspace");
}

async function runWorkspaceDoctor() {
  console.log("\n🏥 Running Workspace Doctor...\n");

  if (exists("scripts/workspace-doctor.sh")) {
    await runScript("scripts/workspace-doctor.sh");
  } else if (exists("scripts/workspace-doctor.ps1")) {
    await runScript("scripts/workspace-doctor.ps1");
  } else {
    console.log("⚠️ No workspace-doctor script found.");
    console.log("   Expected one of:");
    console.log("   - scripts/workspace-doctor.sh");
    console.log("   - scripts/workspace-doctor.ps1");
  }
}

async function runHealthCheck() {
  console.log("\n🩺 Running System Health Check...\n");

  if (exists("scripts/health-check.sh")) {
    await runScript("scripts/health-check.sh");
  } else if (exists("scripts/health-check.ps1")) {
    await runScript("scripts/health-check.ps1");
  } else {
    console.log("⚠️ No health-check script found.");
    console.log("   Expected one of:");
    console.log("   - scripts/health-check.sh");
    console.log("   - scripts/health-check.ps1");
  }
}
      resolve(1);
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
    console.log(`   Expected: workspaces/${workspaceFile}`);
    return Promise.resolve(1);
  }
  console.log(`\n🧭 Opening VS Code workspace: ${workspaceFile}`);
  console.log(`   Path: ${fullPath}\n`);
  return runCommand('code', [fullPath]);
}

// Platform helpers for scripts
function scriptCmd(scriptPath) {
  const full = path.resolve(ROOT, scriptPath);

  if (!fs.existsSync(full)) {
    console.error(`❌ Script not found: ${full}`);
    return null;
  }

  // Make executable on Unix-like systems
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(full, '755');
    } catch (err) {
      // Ignore chmod errors
    }
  }

  if (process.platform === 'win32') {
    // Use PowerShell if .ps1, otherwise try bash via WSL/Git Bash
    if (full.endsWith('.ps1')) {
      return { cmd: 'powershell.exe', args: ['-ExecutionPolicy', 'Bypass', '-File', full] };
    } else {
      return { cmd: 'bash', args: [full] };
    }
  } else {
    return { cmd: 'bash', args: [full] };
  }
}

async function runScript(scriptPath, description = '') {
  console.log(`\n🔧 ${description}`);
  const spec = scriptCmd(scriptPath);
  if (!spec) return 1;
  return await runCommand(spec.cmd, spec.args, { cwd: ROOT, shell: false });
}

// ----- TerraFusion OS Actions --------------------------------------------

async function launchBackendWorkspace() {
  console.log('\n🏛️ TerraFusion Backend: .NET 8 Microservices Platform');
  return openVSCodeWorkspace('backend.code-workspace');
}

async function launchFrontendWorkspace() {
  console.log('\n🎨 TerraFusion Frontend: React 18 PWA with Quantum UI');
  return openVSCodeWorkspace('frontend.code-workspace');
}

async function launchMasterWorkspace() {
  console.log('\n🌟 TerraFusion Master: Complete OS Environment');
  return openVSCodeWorkspace('master.code-workspace');
}

async function launchSDKWorkspace() {
  console.log('\n📦 TerraFusion SDK: Government Module Development Kit');
  return openVSCodeWorkspace('sdk.code-workspace');
}

async function runWorkspaceDoctor() {
  console.log('\n🏥 TerraFusion Workspace Health Analysis');

  if (exists('scripts/workspace-doctor.sh')) {
    return await runScript('scripts/workspace-doctor.sh', 'Running Workspace Doctor (Bash)');
  } else if (exists('scripts/workspace-doctor.ps1')) {
    return await runScript('scripts/workspace-doctor.ps1', 'Running Workspace Doctor (PowerShell)');
  } else {
    console.log('\n⚠️ No workspace-doctor script found.');
    console.log('   Expected one of:');
    console.log('   - scripts/workspace-doctor.sh');
    console.log('   - scripts/workspace-doctor.ps1');
    console.log("\n💡 Run 'workspace-explorer doctor' to create one.");
    return 1;
  }
}

async function runHealthCheck() {
  console.log('\n🩺 TerraFusion System Health Check');

  if (exists('scripts/health-check.sh')) {
    return await runScript('scripts/health-check.sh', 'Running System Health Check (Bash)');
  } else if (exists('scripts/health-check.ps1')) {
    return await runScript('scripts/health-check.ps1', 'Running System Health Check (PowerShell)');
  } else {
    console.log('\n⚠️ No health-check script found. Creating basic health check...');

    // Create a basic health check on the fly
    const basicHealthCheck = `#!/bin/bash
echo "🩺 Basic TerraFusion Health Check"
echo "=================================="
echo ""

# Check if we're in TerraFusion root
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Not in TerraFusion root directory"
    exit 1
fi

echo "✅ TerraFusion root directory confirmed"

# Check backend
if [ -d "backend" ]; then
    echo ""
    echo "🏛️ Backend Status:"
    cd backend
    if dotnet --version > /dev/null 2>&1; then
        echo "  ✅ .NET SDK available: $(dotnet --version)"
        if [ -f "TerraFusion.sln" ]; then
            echo "  ✅ TerraFusion.sln found"
            echo "  🔧 Testing build..."
            if dotnet build --nologo -v quiet > /dev/null 2>&1; then
                echo "  ✅ Backend builds successfully"
            else
                echo "  ⚠️ Backend build has issues"
            fi
        else
            echo "  ⚠️ TerraFusion.sln not found"
        fi
    else
        echo "  ❌ .NET SDK not available"
    fi
    cd ..
fi

# Check frontend
if [ -d "frontend" ]; then
    echo ""
    echo "🎨 Frontend Status:"
    if command -v node > /dev/null 2>&1; then
        echo "  ✅ Node.js available: $(node --version)"
        if [ -f "frontend/package.json" ]; then
            echo "  ✅ package.json found"
            if [ -d "frontend/node_modules" ]; then
                echo "  ✅ node_modules installed"
            else
                echo "  ⚠️ node_modules not found - run 'npm install'"
            fi
        else
            echo "  ⚠️ package.json not found"
        fi
    else
        echo "  ❌ Node.js not available"
    fi
fi

# Check workspace files
echo ""
echo "📁 Workspace Status:"
if [ -d "workspaces" ]; then
    workspace_count=$(find workspaces -name "*.code-workspace" 2>/dev/null | wc -l)
    echo "  ✅ Workspaces directory found ($workspace_count .code-workspace files)"
else
    echo "  ⚠️ Workspaces directory not found"
fi

# Check AI documentation
echo ""
echo "🤖 AI Documentation:"
if [ -f "WORKSPACE_AI_PROFILES.md" ]; then
    echo "  ✅ AI Profiles documentation found"
else
    echo "  ⚠️ WORKSPACE_AI_PROFILES.md not found"
fi

if [ -f "WORKSPACE_COMPANIONS.md" ]; then
    echo "  ✅ AI Companions documentation found"
else
    echo "  ⚠️ WORKSPACE_COMPANIONS.md not found"
fi

echo ""
echo "🏆 TerraFusion Health Check Complete"
echo "Government. Transcended."
`;

    // Write and run the basic health check
    const healthCheckPath = path.resolve(ROOT, 'scripts', 'health-check.sh');
    fs.writeFileSync(healthCheckPath, basicHealthCheck);
    return await runScript(
      'scripts/health-check.sh',
      'Running Basic Health Check (Auto-Generated)'
    );
  }
}

async function runAllTests() {
  console.log('\n🧪 TerraFusion Test Suite Execution');
  let exitCode = 0;

  // Backend tests
  if (exists('backend')) {
    console.log('\n🏛️ Backend Tests (.NET):');
    const backendCode = await runCommand('dotnet', ['test', '--nologo'], {
      cwd: path.resolve(ROOT, 'backend'),
    });
    if (backendCode !== 0) exitCode = backendCode;
  } else {
    console.log('\n⚠️ Backend folder not found (skipping).');
  }

  // Frontend tests
  if (exists('frontend/package.json')) {
    console.log('\n🎨 Frontend Tests (Node.js):');
    const frontendCode = await runCommand('npm', ['test'], { cwd: path.resolve(ROOT, 'frontend') });
    if (frontendCode !== 0) exitCode = frontendCode;
  } else {
    console.log('\n⚠️ Frontend package.json not found (skipping).');
  }

  // SDK tests
  if (exists('SDK') && exists('SDK/package.json')) {
    console.log('\n📦 SDK Tests:');
    const sdkCode = await runCommand('npm', ['test'], { cwd: path.resolve(ROOT, 'SDK') });
    if (sdkCode !== 0) exitCode = sdkCode;
  } else {
    console.log('\n⚠️ SDK tests not configured (skipping).');
  }

  console.log(`\n${exitCode === 0 ? '✅' : '❌'} Test Suite Complete`);
  return exitCode;
}

async function launchCoreServices() {
  console.log('\n🚀 Launching TerraFusion Core Services');
  console.log('   This will start the backend API and Consciousness Engine...');

  if (!exists('backend')) {
    console.log('\n❌ Backend directory not found');
    return 1;
  }

  console.log('\n🏛️ Starting TerraFusion API Gateway (Port 5000)...');
  const apiPromise = runCommand(
    'dotnet',
    ['run', '--project', 'TerraFusion.API', '--urls', 'http://localhost:5000'],
    {
      cwd: path.resolve(ROOT, 'backend'),
      shell: false,
    }
  );

  // Give API a moment to start, then start Consciousness
  setTimeout(() => {
    console.log('\n🧠 Starting TerraFusion Consciousness Engine (Port 3004)...');
    runCommand(
      'dotnet',
      ['run', '--project', 'TerraFusion.Consciousness', '--urls', 'http://localhost:3004'],
      {
        cwd: path.resolve(ROOT, 'backend'),
        shell: false,
      }
    );
  }, 3000);

  console.log('\n💡 Services are starting in background...');
  console.log('   API: http://localhost:5000');
  console.log('   Consciousness: http://localhost:3004');
  console.log('   Use Ctrl+C to stop services');

  return apiPromise;
}

async function summonAICompanion() {
  console.log(`
🤖 TerraFusion AI Companions

Your AI workspace assistants trained on TerraFusion architecture:

1) 🧭 Navigator  – "Where does X live? Which workspace for Y?"
2) 🔧 Surgeon    – "Fix this specific error/test/issue"
3) 📝 Scribe     – "Document this change/feature/endpoint"
4) 🏛️ Open WORKSPACE_AI_PROFILES.md (Full AI personas)
5) 📖 Open WORKSPACE_COMPANIONS.md (Complete guide)
6) ← Back to main menu
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
🧭 TerraFusion Navigator AI
========================

Copy this prompt into your AI assistant:

---

You are the TerraFusion Navigator AI, specialized in TerraFusion OS workspace navigation.

CONTEXT: TerraFusion OS is a government AI operating system with multi-workspace architecture:
- backend.code-workspace: .NET 8 microservices
- frontend.code-workspace: React 18 PWA with Quantum UI
- master.code-workspace: Complete OS environment
- sdk.code-workspace: Government module development

YOUR ROLE:
- Help find the right workspace, files, and modules
- Guide users to correct documentation and entry points
- Explain TerraFusion architecture decisions
- Point out legacy/archived areas to avoid

BEHAVIOR:
- Ask what the user is trying to accomplish
- Recommend the appropriate workspace to open
- Suggest specific files, docs, or commands
- Use TerraFusion terminology: "Government. Transcended."

What are you looking to accomplish in TerraFusion OS?

---

Press Enter to continue...
`);
      await question('');
      break;

    case '2':
      console.log(`
🔧 TerraFusion Surgeon AI
========================

Copy this prompt into your AI assistant:

---

You are the TerraFusion Surgeon AI, specialized in precise fixes for TerraFusion OS.

CONTEXT: TerraFusion OS components:
- Backend: .NET 8 with Entity Framework, PostgreSQL
- Frontend: React 18, TypeScript, Vite, Tailwind
- County Data: Isolated by tenant configuration (FISMA-High compliance)
- AI Swarm: 50,000+ agents coordinated by Consciousness Engine

YOUR ROLE:
- Fix one specific error, failing test, or issue at a time
- Provide minimal, surgical changes only
- Maintain county data isolation (never mix county data)
- Preserve government-grade security patterns

CONSTRAINTS:
- No large refactors or architectural changes
- Always validate county isolation in data changes
- Follow TerraFusion coding standards
- Test changes if tests exist

Show me the specific error or issue you need fixed.

---

Press Enter to continue...
`);
      await question('');
      break;

    case '3':
      console.log(`
📝 TerraFusion Scribe AI
=======================

Copy this prompt into your AI assistant:

---

You are the TerraFusion Scribe AI, specialized in technical documentation.

CONTEXT: TerraFusion OS is a government AI operating system serving Washington State counties with 99.9% SLA targets and FISMA-High compliance.

YOUR ROLE:
- Document code changes, features, and architectural decisions
- Create clear README updates and API documentation
- Generate "What changed?" summaries for commits
- Write government-appropriate technical content

TONE & STYLE:
- Concise, professional, government-grade quality
- Use "Government. Transcended." as the TerraFusion tagline
- Focus on accuracy, compliance, and county service impact
- No marketing hype, just clear technical communication

OUTPUTS:
- README sections
- API endpoint documentation
- Changelog entries
- Technical decision records

What do you need documented?

---

Press Enter to continue...
`);
      await question('');
      break;

    case '4':
      {
        const profilesPath = path.resolve(ROOT, 'WORKSPACE_AI_PROFILES.md');
        if (!fs.existsSync(profilesPath)) {
          console.log('\n⚠️ WORKSPACE_AI_PROFILES.md not found at repo root.');
        } else {
          console.log('\n📄 Opening WORKSPACE_AI_PROFILES.md in VS Code...');
          await runCommand('code', [profilesPath]);
        }
      }
      break;

    case '5':
      {
        const companionsPath = path.resolve(ROOT, 'WORKSPACE_COMPANIONS.md');
        if (!fs.existsSync(companionsPath)) {
          console.log('\n⚠️ WORKSPACE_COMPANIONS.md not found at repo root.');
        } else {
          console.log('\n📄 Opening WORKSPACE_COMPANIONS.md in VS Code...');
          await runCommand('code', [companionsPath]);
        }
      }
      break;

    case '6':
    default:
      console.log('\n← Returning to main menu...');
  }
}

// ----- Main Menu ---------------------------------------------------------

function printMenu() {
  console.log(`
TerraFusion Developer Console (TDC)
===================================
Root: ${ROOT}

🏛️ WORKSPACES
1) Launch Backend (.NET 8 Microservices)
2) Launch Frontend (React 18 PWA)
3) Launch Master (Complete OS)
4) Launch SDK (Module Development)

🔧 SYSTEM OPERATIONS
5) Run Workspace Doctor (Health Analysis)
6) Run System Health Check
7) Run All Tests (Backend + Frontend + SDK)
8) Launch Core Services (API + Consciousness)

🤖 AI ASSISTANCE
9) Summon AI Companion (Navigator/Surgeon/Scribe)

⚡ SYSTEM
0) Exit TDC
`);
}

async function main() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = q => new Promise(res => rl.question(q, res));

  let done = false;
  while (!done) {
    printMenu();
    const answer = await question('🎯 Select option (0-9): ');
    const choice = answer.trim();

    console.log('\n' + '='.repeat(70));

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
        await launchSDKWorkspace();
        break;
      case '5':
        await runWorkspaceDoctor();
        break;
      case '6':
        await runHealthCheck();
        break;
      case '7':
        await runAllTests();
        break;
      case '8':
        await launchCoreServices();
        break;
      case '9':
        await summonAICompanion();
        break;
      case '0':
        console.log('\n🏆 Exiting TerraFusion Developer Console');
        console.log('   Government. Transcended. 🏛️\n');
        done = true;
        break;
      default:
        console.log('❓ Please enter a number between 0 and 9.');
    }

    if (!done && choice !== '8') {
      // Don't pause for core services (they run continuously)
      console.log('\n' + '='.repeat(70));
      await question('Press Enter to continue...');
    }
  }

  rl.close();
}

// ----- Entry Point -------------------------------------------------------

if (require.main === module) {
  main().catch(err => {
    console.error('\n💥 Unexpected error in TDC:', err);
    process.exit(1);
  });
}

module.exports = {
  runWorkspaceDoctor,
  runHealthCheck,
  runAllTests,
  launchCoreServices,
};
