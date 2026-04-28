import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { LocalAgentCardLockStore } from './cardLock.js';
import { LocalAgentCommandRegistryBuilder } from './commandRegistry.js';
import { LocalAgentControlCenterStateBuilder } from './controlCenter.js';
import { LocalAgentControlCenterPreview } from './controlCenterPreview.js';
import {
  daemonStart,
  daemonStatus,
  daemonStop,
  renderDaemonStartResult,
  renderDaemonStatusResult,
  renderDaemonStopResult,
} from './daemonControl.js';
import { LocalAgentDoctorMode, renderLocalAgentDoctorResult } from './doctorMode.js';
import { LocalAgentDocTruth, renderLocalAgentDocTruth, DEFAULT_DOC_TRUTH_FILES } from './docTruth.js';
import { LocalAgentDocsIndexBuilder } from './docsIndex.js';
import { LocalAgentEvents, parseEventsArgs, renderLocalAgentEvents } from './events.js';
import { LocalAgentExplainMode, renderLocalAgentExplainReport } from './explainMode.js';
import { LocalAgentFinalizeRunner } from './finalize.js';
import { LocalAgentFirstRun, renderLocalAgentInitReport } from './firstRun.js';
import { LocalAgentHelpSystem, renderLocalAgentNextRecommendation } from './help.js';
import { LocalAgentModelGateway, type LocalAgentModelChatMessage } from './modelGateway.js';
import { LocalAgentPatchPreview } from './patchPreview.js';
import { LocalAgentPermissionPolicy, loadFounderLocalAgentPolicy } from './policy.js';
import { LocalAgentProductManifestBuilder } from './productManifest.js';
import { LocalAgentProofRunner } from './proof.js';
import { LocalAgentReleaseFreezeBuilder } from './releaseFreeze.js';
import { LocalAgentReviewMode, renderLocalAgentReviewReport } from './reviewMode.js';
import { LocalAgentReleaseApprovalRunner } from './releaseApproval.js';
import { LocalAgentReleaseCheckRunner } from './releaseCheck.js';
import { LocalAgentReleaseNotesBuilder } from './releaseNotes.js';
import { LocalAgentReleasePlan, renderLocalAgentReleasePlan } from './releasePlan.js';
import { LocalAgentReleaseRunbookBuilder } from './releaseRunbook.js';
import { LocalAgentSaveStateWriter } from './saveState.js';
import { LocalAgentShipMvpRunner } from './shipMvp.js';
import { LocalAgentStatus, renderLocalAgentStatus } from './status.js';
import { LocalAgentTagCommandRunner } from './tagCommand.js';
import { LocalAgentTagGateRunner } from './tagGate.js';
import { LocalAgentToolRunner } from './toolRunner.js';
import { LocalAgentWorkCardFactory, renderLocalAgentWorkCard } from './workCard.js';
import { LocalAgentFounderWizard } from './wizard.js';

async function main(argv: string[]): Promise<number> {
  const { repoRoot, args } = parseGlobalOptions(stripLeadingArgSeparators(argv));
  const [command, ...rest] = args;

  try {
    switch (command) {
      case 'plan':
        return handlePlan(repoRoot, rest);
      case 'explain':
        return handleExplain(repoRoot, rest);
      case 'review':
        return handleReview(repoRoot, rest);
      case 'model-health':
        return handleModelHealth(repoRoot, rest);
      case 'list-models':
        return handleListModels(repoRoot, rest);
      case 'model-chat':
        return handleModelChat(repoRoot, rest);
      case 'lock-card':
        return handleLockCard(repoRoot, rest);
      case 'current-card':
        return handleCurrentCard(repoRoot);
      case 'clear-card':
        return handleClearCard(repoRoot);
      case 'preview-patch':
        return handlePreviewPatch(repoRoot, rest);
      case 'apply-patch':
        return handleApplyPatch(repoRoot, rest);
      case 'show-patch':
        return handleShowPatch(repoRoot, rest);
      case 'proof':
        return handleProof(repoRoot, rest);
      case 'save-state':
        return handleSaveState(repoRoot, rest);
      case 'finalize':
        return handleFinalize(repoRoot);
      case 'start':
        return handleStart(repoRoot);
      case 'init':
        return handleInit(repoRoot);
      case 'status':
        return handleStatus(repoRoot);
      case 'events':
        return handleEvents(repoRoot, rest);
      case 'release':
        return handleReleasePlan(repoRoot);
      case 'doc-truth':
        return handleDocTruth(repoRoot, rest);
      case 'help-me':
        return handleHelpMe(repoRoot);
      case 'next':
        return handleNext(repoRoot);
      case 'explain-commands':
        return handleExplainCommands(repoRoot);
      case 'command-registry':
        return handleCommandRegistry(repoRoot);
      case 'doctor':
        return handleDoctor(repoRoot, rest);
      case 'control-center-state':
        return handleControlCenterState(repoRoot);
      case 'control-center-preview':
        return handleControlCenterPreview(repoRoot);
      case 'release-notes':
        return handleReleaseNotes(repoRoot);
      case 'docs-index':
        return handleDocsIndex(repoRoot);
      case 'product-manifest':
        return handleProductManifest(repoRoot);
      case 'release-check':
        return handleReleaseCheck(repoRoot);
      case 'release-freeze':
        return handleReleaseFreeze(repoRoot);
      case 'ship-mvp':
        return handleShipMvp(repoRoot, rest);
      case 'tag-gate':
        return handleTagGate(repoRoot, rest);
      case 'release-approve':
        return handleReleaseApprove(repoRoot, rest);
      case 'tag-command':
        return handleTagCommand(repoRoot, rest);
      case 'release-runbook':
        return handleReleaseRunbook(repoRoot, rest);
      case 'tool':
        return handleTool(repoRoot, rest);
      case 'daemon':
        return handleDaemon(repoRoot, rest);
      default:
        printUsage();
        return command ? 1 : 0;
    }
  } catch (error) {
    console.error((error as Error).message);
    return 2;
  }
}

function stripLeadingArgSeparators(argv: string[]): string[] {
  let index = 0;
  while (argv[index] === '--') {
    index += 1;
  }

  return argv.slice(index);
}

function parseGlobalOptions(argv: string[]): { repoRoot: string; args: string[] } {
  const args = [...argv];
  let repoRoot = process.cwd();

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--repo-root') {
      const candidate = args[index + 1];
      if (!candidate) {
        throw new Error('--repo-root requires a path.');
      }

      repoRoot = resolve(process.cwd(), candidate);
      args.splice(index, 2);
      index -= 1;
    }
  }

  return { repoRoot, args };
}

async function handleStart(repoRoot: string): Promise<number> {
  return new LocalAgentFounderWizard(repoRoot).run();
}

function handleInit(repoRoot: string): number {
  const report = new LocalAgentFirstRun(repoRoot).run();
  console.log(renderLocalAgentInitReport(report));
  return report.blockers.length === 0 ? 0 : 1;
}

function handleStatus(repoRoot: string): number {
  console.log(renderLocalAgentStatus(new LocalAgentStatus(repoRoot).capture()));
  return 0;
}

function handleEvents(repoRoot: string, args: string[]): number {
  const query = parseEventsArgs(args);
  console.log(renderLocalAgentEvents(new LocalAgentEvents(repoRoot).read(query)));
  return 0;
}

function handleReleasePlan(repoRoot: string): number {
  console.log(renderLocalAgentReleasePlan(new LocalAgentReleasePlan(repoRoot).inspect()));
  return 0;
}

function handleDocTruth(repoRoot: string, args: string[]): number {
  const files = args.length > 0 ? args : [...DEFAULT_DOC_TRUTH_FILES];
  const report = new LocalAgentDocTruth(repoRoot).scan(files);
  console.log(renderLocalAgentDocTruth(report));
  return report.violations.length === 0 ? 0 : 1;
}

function handleHelpMe(repoRoot: string): number {
  console.log(new LocalAgentHelpSystem(repoRoot).helpMe());
  return 0;
}

function handleNext(repoRoot: string): number {
  console.log(renderLocalAgentNextRecommendation(new LocalAgentHelpSystem(repoRoot).recommendNext()));
  return 0;
}

function handleExplainCommands(repoRoot: string): number {
  console.log(new LocalAgentHelpSystem(repoRoot).explainCommands());
  return 0;
}

function handleCommandRegistry(repoRoot: string): number {
  const registry = new LocalAgentCommandRegistryBuilder(repoRoot).build();
  console.log('TerraFusion Command Registry');
  console.log('');
  console.log(`Commands: ${registry.commandCount}`);
  console.log(`Groups:   ${registry.groups.join(', ')}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/command-registry.json');
  console.log('  .terrafusion/command-registry.md');
  return 0;
}

async function handleDoctor(repoRoot: string, args: string[]): Promise<number> {
  const options = parseDoctorOptions(args);
  const result = await new LocalAgentDoctorMode(repoRoot).run({
    modelEndpoint: options.modelEndpoint,
    modelName: options.modelName,
    modelTimeoutMs: options.modelTimeoutMs,
  });

  console.log(renderLocalAgentDoctorResult(result));
  return 0;
}

function handleControlCenterState(repoRoot: string): number {
  const state = new LocalAgentControlCenterStateBuilder(repoRoot).build();
  console.log('TerraFusion Control Center State');
  console.log('');
  console.log(`Version:      ${state.version}`);
  console.log(`Policy:       ${state.policy.profile}`);
  console.log(`Doctor:       ${state.doctor.overallStatus ?? 'not available'}`);
  console.log(`Model Healthy:${state.model.healthy ?? 'unknown'}`);
  console.log(`Next Command: ${state.nextCommand}`);
  console.log(`Actions:      ${state.actions.length}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/control-center-state.json');
  console.log('  .terrafusion/control-center-state.md');
  return 0;
}

function handleControlCenterPreview(repoRoot: string): number {
  console.log(new LocalAgentControlCenterPreview(repoRoot).render());
  return 0;
}

function handleReleaseNotes(repoRoot: string): number {
  const notes = new LocalAgentReleaseNotesBuilder(repoRoot).build();
  console.log('TerraFusion Release Notes');
  console.log('');
  console.log(`Product: ${notes.productName}`);
  console.log(`Version: ${notes.version}`);
  console.log(`Artifacts: ${notes.releaseArtifacts.length}`);
  console.log(`Known Limitations: ${notes.knownLimitations.length}`);
  console.log('');
  console.log('Wrote:');
  console.log('  CHANGELOG.md');
  console.log('  .terrafusion/release-notes-0.1.0.md');
  console.log('  .terrafusion/release-notes-0.1.0.json');
  return 0;
}

function handleDocsIndex(repoRoot: string): number {
  const index = new LocalAgentDocsIndexBuilder(repoRoot).build();
  console.log('TerraFusion Docs Index');
  console.log('');
  console.log(`Entries: ${index.entries.length}`);
  console.log(`Reading Paths: ${index.readingPaths.length}`);
  console.log(`Missing Required: ${index.missingRequired.length}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/docs-index.json');
  console.log('  .terrafusion/docs-index.md');
  return index.missingRequired.length === 0 ? 0 : 1;
}

function handleProductManifest(repoRoot: string): number {
  const manifest = new LocalAgentProductManifestBuilder(repoRoot).build();
  console.log('TerraFusion Product Manifest');
  console.log('');
  console.log(`Product: ${manifest.productName}`);
  console.log(`Version: ${manifest.version}`);
  console.log(`Creates Git Tag: ${manifest.releaseGovernance.createsGitTag}`);
  console.log(`Pushes Git Tag: ${manifest.releaseGovernance.pushesGitTag}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/product-manifest.json');
  console.log('  .terrafusion/product-manifest.md');
  return 0;
}

function handleReleaseCheck(repoRoot: string): number {
  const report = new LocalAgentReleaseCheckRunner(repoRoot).run();
  console.log('TerraFusion Release Check');
  console.log('');
  console.log(`Overall: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Release Status: ${report.releaseStatus}`);
  console.log(`Critical Failures: ${report.criticalFailures}`);
  console.log(`Warnings: ${report.warnings}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/release-check-report.json');
  console.log('  .terrafusion/release-check-report.md');
  return report.ok ? 0 : 1;
}

function handleReleaseFreeze(repoRoot: string): number {
  const card = new LocalAgentReleaseFreezeBuilder(repoRoot).build();
  console.log('TerraFusion Release Freeze Card');
  console.log('');
  console.log(`Version:        ${card.version}`);
  console.log(`Freeze Status:  ${card.freezeStatus}`);
  console.log(`Release Status: ${card.releaseStatus}`);
  console.log(`Artifacts:      ${card.guardedArtifacts.length}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/release-freeze-card.json');
  console.log('  .terrafusion/release-freeze-card.md');
  return 0;
}

function handleShipMvp(repoRoot: string, args: string[]): number {
  const outputDir = args.find(value => !value.startsWith('--'));
  if (!outputDir) {
    throw new Error('ship-mvp requires an output directory.');
  }
  const report = new LocalAgentShipMvpRunner(repoRoot).run(
    outputDir,
    args.includes('--overwrite'),
    !args.includes('--no-release-notes'),
    !args.includes('--no-docs-index'),
  );
  console.log('TerraFusion Ship MVP');
  console.log('');
  console.log(`Overall: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Output Directory: ${report.outputDir}`);
  console.log(`Steps: ${report.steps.length}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/ship-report.json');
  console.log('  .terrafusion/ship-report.md');
  console.log(`  ${outputDir}/release-manifest.json`);
  console.log(`  ${outputDir}/checksums.sha256`);
  return report.ok ? 0 : 1;
}

function handleTagGate(repoRoot: string, args: string[]): number {
  const version = args[0];
  if (!version) {
    throw new Error('tag-gate requires a version.');
  }
  const report = new LocalAgentTagGateRunner(repoRoot).run(version);
  console.log('TerraFusion Local Agent Tag Gate');
  console.log('');
  console.log(`Version:           ${report.version}`);
  console.log(`Overall:           ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Critical Failures: ${report.criticalFailures}`);
  console.log(`Warnings:          ${report.warnings}`);
  console.log('');
  console.log('Suggested tag command:');
  console.log(`  ${report.tagCommand}`);
  console.log('');
  for (const item of report.items) {
    const icon = item.ok ? 'PASS' : item.severity === 'warning' ? 'WARN' : 'FAIL';
    console.log(`${icon} ${item.name}: ${item.message}`);
  }
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/tag-gate-report.json');
  console.log('  .terrafusion/tag-gate-report.md');
  return report.ok ? 0 : 1;
}

function handleReleaseApprove(repoRoot: string, args: string[]): number {
  const version = args.find(value => !value.startsWith('--'));
  const nameIndex = args.indexOf('--name');
  if (!version || nameIndex === -1 || !args[nameIndex + 1]) {
    throw new Error('release-approve requires a version and --name.');
  }
  const notes = collectRepeatedFlagValues(args, '--note');
  const approval = new LocalAgentReleaseApprovalRunner(repoRoot).approve(version, args[nameIndex + 1], notes);
  console.log('TerraFusion Local Agent Release Approval');
  console.log('');
  console.log('Approval recorded.');
  console.log(`Version:  ${approval.version}`);
  console.log(`Approver: ${approval.approverName}`);
  console.log('');
  console.log('Suggested tag command:');
  console.log(`  ${approval.tagCommand}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/release-approval.json');
  console.log('  .terrafusion/release-approval.md');
  return 0;
}

function handleTagCommand(repoRoot: string, args: string[]): number {
  const version = args[0];
  if (!version) {
    throw new Error('tag-command requires a version.');
  }
  const report = new LocalAgentTagCommandRunner(repoRoot).build(version);
  console.log('TerraFusion Local Agent Tag Command');
  console.log('');
  console.log(`Version:  ${report.version}`);
  console.log(`Approver: ${report.approverName}`);
  console.log(`Branch:   ${report.currentBranch}`);
  console.log(`HEAD:     ${report.currentHead}`);
  console.log('');
  console.log('Manual tag command:');
  console.log(`  ${report.tagCommand}`);
  console.log('');
  console.log('Verification commands:');
  for (const command of report.verificationCommands) {
    console.log(`  ${command}`);
  }
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/tag-command-report.json');
  console.log('  .terrafusion/tag-command-report.md');
  return 0;
}

function handleReleaseRunbook(repoRoot: string, args: string[]): number {
  const version = args[0];
  if (!version) {
    throw new Error('release-runbook requires a version.');
  }
  const runbook = new LocalAgentReleaseRunbookBuilder(repoRoot).build(version);
  console.log('TerraFusion Local Agent Release Runbook');
  console.log('');
  console.log(`Version: ${runbook.version}`);
  console.log(`Status:  ${runbook.releaseStatus}`);
  console.log('');
  console.log('Manual tag command:');
  console.log(`  ${runbook.tagCommand}`);
  console.log('');
  console.log('Verification commands:');
  for (const command of runbook.verificationCommands) {
    console.log(`  ${command}`);
  }
  console.log('');
  console.log('Wrote:');
  console.log(`  .terrafusion/release-runbook-${runbook.version}.json`);
  console.log(`  .terrafusion/release-runbook-${runbook.version}.md`);
  return 0;
}

async function handlePlan(repoRoot: string, args: string[]): Promise<number> {
  const options = parsePlanOptions(args);
  const flags = new Set(options.flags);
  const task = options.task;
  if (!task) {
    throw new Error('Task is required for plan.');
  }

  const factory = new LocalAgentWorkCardFactory(repoRoot);
  let card = factory.build(task);

  if (options.assistModel) {
    const draft = await new LocalAgentModelGateway({
      repoRoot,
      endpoint: options.modelEndpoint,
      model: options.modelName,
      timeoutMs: options.modelTimeoutMs,
    }).draftPlan(task, {
      allowedFiles: card.allowedFiles,
      forbiddenFiles: card.forbiddenFiles,
      proofGates: card.proofGates,
      successCriteria: card.successCriteria,
      risks: card.risks,
    });

    card = factory.build(task, {
      requested: true,
      available: draft.available,
      status: draft.status,
      model: draft.model,
      endpoint: draft.endpoint,
      taskSummary: draft.draft?.taskSummary,
      riskNotes: draft.draft?.riskNotes,
      candidateFiles: draft.draft?.candidateFiles,
      strippedUnsafeContent: draft.draft?.strippedUnsafeContent,
    });
  }

  console.log('TerraFusion Local Agent');
  console.log('Mode: Plan');
  console.log('Writes: Disabled');
  console.log('Cloud: Blocked by default');
  console.log('');
  console.log(renderLocalAgentWorkCard(card));

  if (flags.has('--lock')) {
    new LocalAgentCardLockStore(repoRoot).lock(card, flags.has('--overwrite'));
    console.log('Work card locked:');
    console.log('  .terrafusion/current-work-card.json');
    console.log('  .terrafusion/current-work-card.md');
  }

  return 0;
}

async function handleExplain(repoRoot: string, args: string[]): Promise<number> {
  const options = parseExplainOptions(args);
  const report = await new LocalAgentExplainMode(repoRoot).explain({
    assistModel: options.assistModel,
    modelEndpoint: options.modelEndpoint,
    modelName: options.modelName,
    modelTimeoutMs: options.modelTimeoutMs,
    files: options.files,
  });

  console.log(renderLocalAgentExplainReport(report));
  return 0;
}

async function handleReview(repoRoot: string, args: string[]): Promise<number> {
  const options = parseReviewOptions(args);
  const report = await new LocalAgentReviewMode(repoRoot).review({
    assistModel: options.assistModel,
    modelEndpoint: options.modelEndpoint,
    modelName: options.modelName,
    modelTimeoutMs: options.modelTimeoutMs,
  });

  console.log(renderLocalAgentReviewReport(report));
  return 0;
}

async function handleModelHealth(repoRoot: string, args: string[]): Promise<number> {
  const options = parseModelRuntimeOptions(args);
  const result = await new LocalAgentModelGateway({
    repoRoot,
    endpoint: options.modelEndpoint,
    model: options.modelName,
    timeoutMs: options.modelTimeoutMs,
  }).checkHealth();

  console.log('TerraFusion Local Model Health');
  console.log('');
  console.log(`Overall:   ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Endpoint:  ${result.endpoint ?? 'none'}`);
  console.log(`Checked:   ${result.checkedPath ?? 'none'}`);
  console.log(`HTTP:      ${result.httpStatus ?? 'n/a'}`);
  console.log(`LatencyMs: ${result.latencyMs ?? 'n/a'}`);
  console.log(`Status:    ${result.status}`);
  return result.ok ? 0 : 1;
}

async function handleListModels(repoRoot: string, args: string[]): Promise<number> {
  const options = parseModelRuntimeOptions(args);
  const result = await new LocalAgentModelGateway({
    repoRoot,
    endpoint: options.modelEndpoint,
    model: options.modelName,
    timeoutMs: options.modelTimeoutMs,
  }).listModels();

  console.log('TerraFusion Local Model Listing');
  console.log('');
  console.log(`Overall:   ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Supported: ${result.supported}`);
  console.log(`Endpoint:  ${result.endpoint ?? 'none'}`);
  console.log(`Models:    ${result.models.length}`);
  for (const model of result.models) {
    console.log(`  - ${model.id}`);
  }
  console.log(`Status:    ${result.status}`);
  return result.ok ? 0 : 1;
}

async function handleModelChat(repoRoot: string, args: string[]): Promise<number> {
  const options = parseModelRuntimeOptions(args);
  const prompt = options.remaining.join(' ').trim();
  if (!prompt) {
    throw new Error('model-chat requires a prompt.');
  }

  const messages: LocalAgentModelChatMessage[] = [{ role: 'user', content: prompt }];
  const result = await new LocalAgentModelGateway({
    repoRoot,
    endpoint: options.modelEndpoint,
    model: options.modelName,
    timeoutMs: options.modelTimeoutMs,
  }).chat(messages);

  console.log('TerraFusion Local Model Chat');
  console.log('');
  console.log(`Overall:   ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Endpoint:  ${result.endpoint ?? 'none'}`);
  console.log(`Model:     ${result.model ?? 'none'}`);
  console.log(`Advisory:  ${result.response.advisoryOnly}`);
  console.log(`ToolCalls: ${result.response.toolCallsDetected}`);
  console.log(`Status:    ${result.status}`);
  console.log('');
  console.log(result.response.text);
  return result.ok ? 0 : 1;
}

function parsePlanOptions(args: string[]): {
  task: string;
  flags: string[];
  assistModel: boolean;
  modelEndpoint: string | null;
  modelName: string | null;
  modelTimeoutMs: number | undefined;
} {
  const remaining = [...args];
  let assistModel = false;
  let modelEndpoint: string | null = null;
  let modelName: string | null = null;
  let modelTimeoutMs: number | undefined;

  for (let index = 0; index < remaining.length; index += 1) {
    const value = remaining[index];
    if (value === '--assist-model') {
      assistModel = true;
      remaining.splice(index, 1);
      index -= 1;
      continue;
    }

    if (value === '--model-endpoint') {
      modelEndpoint = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-name') {
      modelName = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-timeout-ms') {
      const rawTimeout = remaining[index + 1];
      modelTimeoutMs = rawTimeout ? Number(rawTimeout) : undefined;
      remaining.splice(index, 2);
      index -= 1;
    }
  }

  return {
    task: remaining.filter(value => !value.startsWith('--')).join(' ').trim(),
    flags: remaining.filter(value => value.startsWith('--')),
    assistModel,
    modelEndpoint,
    modelName,
    modelTimeoutMs,
  };
}

function parseExplainOptions(args: string[]): {
  assistModel: boolean;
  modelEndpoint: string | null;
  modelName: string | null;
  modelTimeoutMs: number | undefined;
  files: string[];
} {
  const remaining = [...args];
  let assistModel = false;
  let modelEndpoint: string | null = null;
  let modelName: string | null = null;
  let modelTimeoutMs: number | undefined;
  const files: string[] = [];

  for (let index = 0; index < remaining.length; index += 1) {
    const value = remaining[index];
    if (value === '--assist-model') {
      assistModel = true;
      remaining.splice(index, 1);
      index -= 1;
      continue;
    }

    if (value === '--file') {
      const file = remaining[index + 1];
      if (!file) {
        throw new Error('explain --file requires a path.');
      }

      files.push(file);
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-endpoint') {
      modelEndpoint = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-name') {
      modelName = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-timeout-ms') {
      const rawTimeout = remaining[index + 1];
      modelTimeoutMs = rawTimeout ? Number(rawTimeout) : undefined;
      remaining.splice(index, 2);
      index -= 1;
    }
  }

  return {
    assistModel,
    modelEndpoint,
    modelName,
    modelTimeoutMs,
    files,
  };
}

function parseReviewOptions(args: string[]): {
  assistModel: boolean;
  modelEndpoint: string | null;
  modelName: string | null;
  modelTimeoutMs: number | undefined;
} {
  const remaining = [...args];
  let assistModel = false;
  let modelEndpoint: string | null = null;
  let modelName: string | null = null;
  let modelTimeoutMs: number | undefined;

  for (let index = 0; index < remaining.length; index += 1) {
    const value = remaining[index];
    if (value === '--assist-model') {
      assistModel = true;
      remaining.splice(index, 1);
      index -= 1;
      continue;
    }

    if (value === '--model-endpoint') {
      modelEndpoint = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-name') {
      modelName = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-timeout-ms') {
      const rawTimeout = remaining[index + 1];
      modelTimeoutMs = rawTimeout ? Number(rawTimeout) : undefined;
      remaining.splice(index, 2);
      index -= 1;
    }
  }

  return {
    assistModel,
    modelEndpoint,
    modelName,
    modelTimeoutMs,
  };
}

function parseDoctorOptions(args: string[]): {
  modelEndpoint: string | null;
  modelName: string | null;
  modelTimeoutMs: number | undefined;
} {
  const remaining = [...args];
  let modelEndpoint: string | null = null;
  let modelName: string | null = null;
  let modelTimeoutMs: number | undefined;

  for (let index = 0; index < remaining.length; index += 1) {
    const value = remaining[index];
    if (value === '--model-endpoint') {
      modelEndpoint = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-name') {
      modelName = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-timeout-ms') {
      const rawTimeout = remaining[index + 1];
      modelTimeoutMs = rawTimeout ? Number(rawTimeout) : undefined;
      remaining.splice(index, 2);
      index -= 1;
    }
  }

  return {
    modelEndpoint,
    modelName,
    modelTimeoutMs,
  };
}

function parseModelRuntimeOptions(args: string[]): {
  modelEndpoint: string | null;
  modelName: string | null;
  modelTimeoutMs: number | undefined;
  remaining: string[];
} {
  const remaining = [...args];
  let modelEndpoint: string | null = null;
  let modelName: string | null = null;
  let modelTimeoutMs: number | undefined;

  for (let index = 0; index < remaining.length; index += 1) {
    const value = remaining[index];
    if (value === '--model-endpoint') {
      modelEndpoint = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-name') {
      modelName = remaining[index + 1] ?? null;
      remaining.splice(index, 2);
      index -= 1;
      continue;
    }

    if (value === '--model-timeout-ms') {
      const rawTimeout = remaining[index + 1];
      modelTimeoutMs = rawTimeout ? Number(rawTimeout) : undefined;
      remaining.splice(index, 2);
      index -= 1;
    }
  }

  return {
    modelEndpoint,
    modelName,
    modelTimeoutMs,
    remaining,
  };
}

function handleLockCard(repoRoot: string, args: string[]): number {
  const overwrite = args.includes('--overwrite');
  const task = args.filter(value => value !== '--overwrite').join(' ').trim();
  if (!task) {
    throw new Error('Task is required for lock-card.');
  }

  const card = new LocalAgentCardLockStore(repoRoot).lockFromTask(task, overwrite);
  console.log('Work card locked.');
  console.log('');
  console.log(renderLocalAgentWorkCard(card));
  return 0;
}

function handleCurrentCard(repoRoot: string): number {
  console.log(new LocalAgentCardLockStore(repoRoot).loadMarkdown());
  return 0;
}

function handleClearCard(repoRoot: string): number {
  const existed = new LocalAgentCardLockStore(repoRoot).clear();
  console.log(existed ? 'Current work card cleared.' : 'No current work card existed.');
  return 0;
}

function handlePreviewPatch(repoRoot: string, args: string[]): number {
  const path = args[0];
  const contentFileIndex = args.indexOf('--content-file');
  if (!path || contentFileIndex === -1 || !args[contentFileIndex + 1]) {
    throw new Error('preview-patch requires a path and --content-file.');
  }

  const contentFile = args[contentFileIndex + 1];
  const newContent = contentFile === '-' ? readFileSync(0, 'utf8') : readFileSync(contentFile, 'utf8');
  const proposal = new LocalAgentPatchPreview(repoRoot).previewReplacement(path, newContent);
  console.log('Patch preview created.');
  console.log(`Patch ID: ${proposal.id}`);
  console.log(`Target:   ${proposal.path}`);
  console.log('');
  console.log(proposal.diff);
  console.log('');
  console.log(`Apply with: pnpm run tf:local-agent -- apply-patch ${proposal.id} --approve`);
  return 0;
}

function handleApplyPatch(repoRoot: string, args: string[]): number {
  const patchId = args[0];
  if (!patchId) {
    throw new Error('apply-patch requires a patch id.');
  }

  const proposal = new LocalAgentPatchPreview(repoRoot).applyPatch(patchId, args.includes('--approve'));
  console.log('Patch applied.');
  console.log(`Patch ID: ${proposal.id}`);
  console.log(`Target:   ${proposal.path}`);
  return 0;
}

function handleShowPatch(repoRoot: string, args: string[]): number {
  const patchId = args[0];
  if (!patchId) {
    throw new Error('show-patch requires a patch id.');
  }

  console.log(new LocalAgentPatchPreview(repoRoot).showPatch(patchId));
  return 0;
}

function handleProof(repoRoot: string, args: string[]): number {
  const timeoutIndex = args.indexOf('--timeout');
  const timeout = timeoutIndex >= 0 && args[timeoutIndex + 1] ? Number(args[timeoutIndex + 1]) : 180;
  const report = new LocalAgentProofRunner(repoRoot, timeout).run();
  console.log('TerraFusion Proof Results');
  console.log('');
  console.log(`Overall: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Work Card: ${report.workCardId}`);
  console.log('');
  for (const result of report.results) {
    console.log(`[${result.skipped ? 'BLOCKED' : result.ok ? 'PASS' : 'FAIL'}] ${result.command}`);
    console.log(`  decision: ${result.decision}`);
    console.log(`  exit:     ${result.exitCode}`);
    console.log(`  reason:   ${result.reason}`);
  }
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/proof-results.json');
  console.log('  .terrafusion/proof-results.md');
  return report.ok ? 0 : 1;
}

function handleSaveState(repoRoot: string, args: string[]): number {
  const nextStepIndex = args.indexOf('--next-step');
  if (nextStepIndex === -1 || !args[nextStepIndex + 1]) {
    throw new Error('save-state requires --next-step.');
  }

  const noteValues = collectRepeatedFlagValues(args, '--note');
  const summary = args.slice(0, nextStepIndex).join(' ').trim();
  const nextStep = args[nextStepIndex + 1];
  const report = new LocalAgentSaveStateWriter(repoRoot).write(summary, nextStep, noteValues);
  console.log('Save State written.');
  console.log(`Summary:         ${report.summary}`);
  console.log(`Next exact step: ${report.nextExactStep}`);
  console.log(`Work card:       ${report.card.id ?? 'none'}`);
  console.log(`Proof:           ${report.proof.available ? (report.proof.ok ? 'PASS' : 'FAIL') : 'NOT RUN'}`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/save-state.md');
  console.log('  .terrafusion/save-state.json');
  return 0;
}

function handleFinalize(repoRoot: string): number {
  const report = new LocalAgentFinalizeRunner(repoRoot).finalize();
  console.log('TerraFusion Finalize');
  console.log('');
  console.log('Overall: PASS');
  console.log(`Work Card: ${report.workCardId}`);
  console.log(`Task:      ${report.task}`);
  console.log(`Branch:    ${report.branch}`);
  console.log('');
  console.log('Changed Files:');
  if (report.changedFiles.length > 0) {
    for (const changedFile of report.changedFiles) {
      console.log(`  - ${changedFile}`);
    }
  } else {
    console.log('  - none');
  }
  console.log('');
  console.log('Proof Gates:');
  for (const gate of report.proofGates) {
    console.log(`  - ${gate}`);
  }
  console.log('');
  console.log('Commit:');
  console.log(`  git commit -m "${report.commitMessage}"`);
  console.log('');
  console.log('Wrote:');
  console.log('  .terrafusion/final-report.md');
  console.log('  .terrafusion/final-report.json');
  return 0;
}

function handleTool(repoRoot: string, args: string[]): number {
  const [toolName, ...rest] = args;
  const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), repoRoot);
  const runner = new LocalAgentToolRunner(repoRoot, policy);

  switch (toolName) {
    case 'read-file':
      console.log(JSON.stringify(runner.readFile(rest[0]), null, 2));
      return 0;
    case 'list-files':
      console.log(JSON.stringify(runner.listFiles(rest[0] ?? '.'), null, 2));
      return 0;
    case 'search-text':
      console.log(JSON.stringify(runner.searchText(rest[0], rest[1] ?? '.'), null, 2));
      return 0;
    case 'run-command':
      console.log(JSON.stringify(runner.runCommand(rest.join(' ')), null, 2));
      return 0;
    default:
      throw new Error('Unknown tool command.');
  }
}

function collectRepeatedFlagValues(args: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag && args[index + 1]) {
      values.push(args[index + 1]);
      index += 1;
    }
  }

  return values;
}

async function handleDaemon(repoRoot: string, args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub) {
    console.log('TerraFusion Local Agent Daemon');
    console.log('');
    console.log('Subcommands:');
    console.log('  start    Start the local-agent daemon (path-based IPC, no TCP).');
    console.log('  stop     Stop the local-agent daemon.');
    console.log('  status   Read-only daemon status.');
    return 1;
  }
  switch (sub) {
    case 'start': {
      const { result, daemon } = await daemonStart({ repoRoot });
      console.log(renderDaemonStartResult(result));
      if (daemon) {
        const shutdown = async (): Promise<void> => {
          await daemon.stop().catch(() => undefined);
          await daemonStop({ repoRoot }).catch(() => undefined);
          process.exit(0);
        };
        process.once('SIGINT', () => void shutdown());
        process.once('SIGTERM', () => void shutdown());
      }
      return 0;
    }
    case 'stop': {
      const result = await daemonStop({ repoRoot });
      console.log(renderDaemonStopResult(result));
      return 0;
    }
    case 'status': {
      const result = await daemonStatus({ repoRoot });
      console.log(renderDaemonStatusResult(result));
      return result.running ? 0 : 1;
    }
    default:
      console.log(`TerraFusion: unknown daemon subcommand: ${sub}`);
      console.log('Use one of: start | stop | status');
      return 1;
  }
}

function printUsage(): void {
  console.log('TerraFusion Local Agent');
  console.log('');
  console.log('Global options:');
  console.log('  --repo-root <path>   Run commands against a different repo root than the current working directory.');
  console.log('');
  console.log('Commands:');
  console.log('  help-me');
  console.log('  next');
  console.log('  explain-commands');
  console.log('  command-registry');
  console.log('  doctor [--model-endpoint <url>] [--model-name <name>] [--model-timeout-ms <ms>]');
  console.log('  control-center-state');
  console.log('  control-center-preview');
  console.log('  release-notes');
  console.log('  docs-index');
  console.log('  product-manifest');
  console.log('  release-check');
  console.log('  release-freeze');
  console.log('  ship-mvp <output-dir> [--overwrite] [--no-release-notes] [--no-docs-index]');
  console.log('  tag-gate <version>');
  console.log('  release-approve <version> --name <approver> [--note <note>]');
  console.log('  tag-command <version>');
  console.log('  release-runbook <version>');
  console.log('  plan <task> [--lock] [--overwrite]');
  console.log('  explain [--assist-model] [--model-endpoint <url>] [--model-name <name>] [--model-timeout-ms <ms>] [--file <path>]');
  console.log('  review [--assist-model] [--model-endpoint <url>] [--model-name <name>] [--model-timeout-ms <ms>]');
  console.log('  model-health [--model-endpoint <url>] [--model-name <name>] [--model-timeout-ms <ms>]');
  console.log('  list-models [--model-endpoint <url>] [--model-name <name>] [--model-timeout-ms <ms>]');
  console.log('  model-chat [--model-endpoint <url>] [--model-name <name>] [--model-timeout-ms <ms>] <prompt>');
  console.log('  lock-card <task> [--overwrite]');
  console.log('  current-card');
  console.log('  clear-card');
  console.log('  preview-patch <path> --content-file <file|->');
  console.log('  apply-patch <patchId> --approve');
  console.log('  show-patch <patchId>');
  console.log('  proof [--timeout 180]');
  console.log('  save-state <summary> --next-step <step> [--note <note>]');
  console.log('  finalize');
  console.log('  start');
  console.log('  init');
  console.log('  status');
  console.log('  events [--tail N] [--type T]');
  console.log('  release');
  console.log('  doc-truth [file ...]');
  console.log('  daemon <start|stop|status>');
  console.log('  tool <read-file|list-files|search-text|run-command> ...');
}

main(process.argv.slice(2))
  .then(code => {
    process.exitCode = code;
  })
  .catch(error => {
    console.error((error as Error).message);
    process.exitCode = 2;
  });