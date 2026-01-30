#!/usr/bin/env node

/**
 * TerraFusion Ship Protocol (pnpm tf:ship)
 * ---------------------------------------
 * Deterministic Solo-Dev shipping:
 * 0) Preconditions: clean tree, not on main, gh authenticated
 * 1) Local SEAL gates (no network)
 * 2) Push branch
 * 3) Create PR if needed
 * 4) Enable auto-merge (squash) + delete branch
 *
 * Flags:
 *   --dry-run   : prints actions, no push/PR/merge
 *   --skip-local: bypass local gates (NOT recommended)
 *   --fast      : run minimal local gates (build + unit tests only)
 */

import { execSync } from 'child_process';

const BASE_BRANCH = 'main';
const REMOTE = 'origin';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const SKIP_LOCAL = args.has('--skip-local');
const FAST_MODE = args.has('--fast');

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

const ensurePr = branch => {
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

  if (SKIP_LOCAL) {
    console.log(bold('⚠️  --skip-local set: bypassing local SEAL gates (not recommended).'));
  } else if (FAST_MODE) {
    localSealFast();
  } else {
    localSealFull();
  }

  pushBranch(branch);
  const prUrl = ensurePr(branch);
  enableAutoMerge(prUrl);

  console.log(`\n${bold(green('✅ SHIP SEQUENCE COMPLETE.'))}`);
  console.log('No clicks. No waiting. Proceed to the next task.');
  console.log('Government. Transcended.\n');
};

try {
  main();
} catch (e) {
  fatal(e?.message || String(e));
}
