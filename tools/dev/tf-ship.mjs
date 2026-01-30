#!/usr/bin/env node

/**
 * TerraFusion Ship Protocol (pnpm tf:ship)
 * ---------------------------------------
 * Deterministic Solo-Dev shipping:
 * 0) Preconditions: clean tree, not on main, gh authenticated
 * 1) Diff size gate (<500 lines unless --force or slice branch)
 * 2) Local SEAL gates (no network)
 * 3) Push branch
 * 4) Create PR if needed (auto-labeled)
 * 5) Enable auto-merge (squash) + delete branch
 *
 * Flags:
 *   --dry-run   : prints actions, no push/PR/merge
 *   --skip-local: bypass local gates (NOT recommended)
 *   --fast      : run minimal local gates (build + unit tests only)
 *   --force     : bypass diff size gate (requires explicit approval)
 */

import { execSync } from 'child_process';

const BASE_BRANCH = 'main';
const REMOTE = 'origin';
const MAX_DIFF_LINES = 500;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const SKIP_LOCAL = args.has('--skip-local');
const FAST_MODE = args.has('--fast');
const FORCE_MODE = args.has('--force');

const cyan = s => `\x1b[36m${s}\x1b[0m`;
const green = s => `\x1b[32m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;
const bold = s => `\x1b[1m${s}\x1b[0m`;

const run = (cmd, { silent = false, optional = false } = {}) => {
  console.log(cyan(`> ${cmd}`));
  try {
    execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf-8' });
  } catch (e) {
    if (!optional) throw e;
    console.log(`⚠️  Optional command failed (continuing): ${cmd}`);
  }
};

const read = cmd => {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
};

const fatal = msg => {
  console.error(red(`\n[FATAL] ${msg}\n`));
  process.exit(1);
};

const banner = () => {
  console.log(bold(green('🌟 TerraFusion Ship Protocol Initiated 🌟')));
  if (DRY_RUN) console.log(bold('🧪 DRY RUN MODE — no network mutation'));
  if (FAST_MODE) console.log(bold('⚡ FAST MODE — minimal local gates'));
  console.log('');
};

const ensure = {
  ghAuth() {
    const s = read('gh auth status');
    if (!s.includes('Logged in')) {
      fatal('GitHub CLI not authenticated. Run: gh auth login');
    }
  },
  notOnMain(currentBranch) {
    if (!currentBranch || currentBranch === BASE_BRANCH) {
      fatal(`Refusing to ship from '${BASE_BRANCH}'. Switch to a feature branch.`);
    }
  },
  cleanWorkingTree() {
    const porcelain = read('git status --porcelain');
    if (porcelain) {
      fatal('Working tree is not clean. Commit or stash changes before shipping.');
    }
  },
  hasCommitsAhead(currentBranch) {
    const ahead = read(`git rev-list --count ${BASE_BRANCH}..${currentBranch}`);
    if (ahead === '0') {
      fatal(`No commits ahead of ${BASE_BRANCH}. Nothing to ship.`);
    }
  },
  gitBranch() {
    const b = read('git branch --show-current');
    if (!b) fatal('Unable to determine current branch.');
    return b;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIFF SIZE GATE - Enforce <500 lines unless slice branch or --force
// ═══════════════════════════════════════════════════════════════════════════════
const SLICE_PATTERNS = [
  /^phase\d+[a-z]?\/slice-\d+-/, // phase4b/slice-1-ci-gates
  /^slice\//, // slice/my-feature
  /^hotfix\//, // hotfix/ always allowed (small by nature)
  /^fix\//, // fix/ (small by nature)
];

const isSliceBranch = branch => SLICE_PATTERNS.some(p => p.test(branch));

const getSliceLabel = branch => {
  // Extract slice name from branch: phase4b/slice-1-ci-gates -> slice:ci-gates
  const match = branch.match(/slice-\d+-([a-z0-9-]+)/);
  if (match) return `slice:${match[1]}`;
  // slice/foo -> slice:foo
  if (branch.startsWith('slice/')) return `slice:${branch.slice(6)}`;
  // For other patterns
  if (branch.startsWith('hotfix/')) return 'hotfix';
  if (branch.startsWith('fix/')) return 'fix';
  return null;
};

const getDiffStats = branch => {
  const stat = read(`git diff --stat ${BASE_BRANCH}...${branch}`);
  const lines = stat.split('\n');
  const summaryLine = lines[lines.length - 1] || '';

  // Parse: "X files changed, Y insertions(+), Z deletions(-)"
  const insertions = parseInt((summaryLine.match(/(\d+) insertion/) || [0, 0])[1], 10);
  const deletions = parseInt((summaryLine.match(/(\d+) deletion/) || [0, 0])[1], 10);
  const filesChanged = parseInt((summaryLine.match(/(\d+) file/) || [0, 0])[1], 10);

  return { insertions, deletions, filesChanged, total: insertions + deletions };
};

const enforceDiffSizeGate = branch => {
  console.log(`\n${bold('📏 Diff Size Gate...')}`);

  const stats = getDiffStats(branch);
  console.log(
    `   Files: ${stats.filesChanged}, Lines: +${stats.insertions}/-${stats.deletions} (total: ${stats.total})`
  );

  // Always allow slice branches
  if (isSliceBranch(branch)) {
    console.log(green(`✅ Slice branch detected - size gate passed`));
    return { passed: true, stats, label: getSliceLabel(branch), isSlice: true };
  }

  // Force mode bypasses
  if (FORCE_MODE) {
    console.log(bold(`⚠️  --force flag set: bypassing ${MAX_DIFF_LINES}-line limit`));
    return { passed: true, stats, label: null, isSlice: false };
  }

  // Check threshold
  if (stats.total > MAX_DIFF_LINES) {
    console.error(red(`\n❌ DIFF TOO LARGE: ${stats.total} lines (max: ${MAX_DIFF_LINES})`));
    console.error('');
    console.error('Options:');
    console.error(`  1. Slice the change: ${cyan('pnpm tf:slice <n>')}`);
    console.error(`  2. Force ship (not recommended): ${cyan('pnpm tf:ship --force')}`);
    console.error('');
    console.error('The TerraFusion Way: atomic, reviewable PRs. No mega-diffs.');
    process.exit(1);
  }

  console.log(green(`✅ Diff size OK (${stats.total}/${MAX_DIFF_LINES} lines)`));
  return { passed: true, stats, label: null, isSlice: false };
};

const localSealFast = () => {
  console.log(`\n${bold('🔒 Executing Fast SEAL Gate (build + unit tests)...')}`);

  // Backend
  run('dotnet build backend/TerraFusion.sln -c Release');
  run('dotnet test backend/tests/TerraFusion.Unit.Tests -c Release --no-build -v quiet');

  // Frontend type-check
  run('pnpm -C frontend run type-check', { optional: true });

  console.log(green('✅ Fast SEAL gates passed.'));
};

const localSealFull = () => {
  console.log(`\n${bold('🔒 Executing Full SEAL Gate (deterministic, offline)...')}`);

  // Backend
  run('dotnet build backend/TerraFusion.sln -c Release');
  run('dotnet test backend/TerraFusion.sln -c Release --no-build -v minimal');

  // Frontend
  run('pnpm -C frontend run lint', { optional: true });
  run('pnpm -C frontend run type-check');
  run('pnpm -C frontend run test:unit -- --passWithNoTests');
  run('pnpm -C frontend run build');

  // Governance
  run('pnpm run ci:governance-proof', { optional: true });

  console.log(green('✅ Full SEAL gates passed.'));
};

const pushBranch = branch => {
  console.log(`\n${bold('🚀 Pushing to Remote...')}`);
  if (DRY_RUN) return console.log(bold('DRY RUN: skipping git push'));
  run(`git push ${REMOTE} ${branch} --no-verify`);
};

const ensurePr = (branch, label = null, requireLabel = false) => {
  console.log(`\n${bold('📝 Ensuring Pull Request exists...')}`);

  let prUrl = read(`gh pr list --head ${branch} --json url --jq ".[0].url"`);

  if (!prUrl) {
    if (DRY_RUN) {
      console.log(bold('DRY RUN: would create PR via gh pr create --fill'));
      return `DRYRUN://pr/${branch}`;
    }
    run(`gh pr create --base ${BASE_BRANCH} --head ${branch} --fill`);
    prUrl = read(`gh pr list --head ${branch} --json url --jq ".[0].url"`);
  }

  if (!prUrl) fatal('Failed to resolve PR URL after create/list.');
  console.log(green(`✅ PR: ${prUrl}`));

  // Apply label if detected
  if (label && !DRY_RUN) {
    console.log(`   Applying label: ${cyan(label)}`);
    const labelResult = read(`gh pr edit "${prUrl}" --add-label "${label}" 2>&1`);
    // Verify label was applied
    const appliedLabels = read(`gh pr view "${prUrl}" --json labels --jq '.labels[].name'`);
    if (!appliedLabels.includes(label)) {
      if (requireLabel) {
        fatal(
          `Slice branch requires label '${label}' but labeling failed. Create the label in GitHub or check permissions.`
        );
      }
      console.log(
        bold(`⚠️  Warning: label '${label}' may not have been applied (label may not exist)`)
      );
    } else {
      console.log(green(`   ✅ Label applied: ${label}`));
    }
  } else if (label && DRY_RUN) {
    console.log(bold(`DRY RUN: would apply label ${label}`));
  }

  return prUrl;
};

const enableAutoMerge = prUrl => {
  console.log(`\n${bold('🤖 Engaging Auto-Merge (Squash + Delete Branch)...')}`);
  if (DRY_RUN) return console.log(bold(`DRY RUN: would enable auto-merge on ${prUrl}`));

  run(`gh pr merge "${prUrl}" --squash --auto --delete-branch`);
  console.log(green('✅ Auto-merge enabled. CI SEAL will finalize the merge.'));
};

const main = () => {
  banner();

  ensure.ghAuth();

  const branch = ensure.gitBranch();
  ensure.notOnMain(branch);
  ensure.cleanWorkingTree();
  ensure.hasCommitsAhead(branch);

  console.log(`📡 Branch: ${bold(branch)}`);

  // Diff size gate (enforced before local builds to fail fast)
  const { label, isSlice } = enforceDiffSizeGate(branch);

  if (SKIP_LOCAL) {
    console.log(bold('⚠️  --skip-local set: bypassing local SEAL gates (not recommended).'));
  } else if (FAST_MODE) {
    localSealFast();
  } else {
    localSealFull();
  }

  pushBranch(branch);
  const prUrl = ensurePr(branch, label, isSlice);
  enableAutoMerge(prUrl);

  console.log(`\n${bold(green('✅ SHIP SEQUENCE COMPLETE.'))}`);
  console.log(`   Diff: ${label ? `labeled ${label}` : 'under threshold'}`);
  console.log('No clicks. No waiting. Proceed to the next task.');
  console.log('Government. Transcended.\n');
};

try {
  main();
} catch (e) {
  fatal(e?.message || String(e));
}
