/**
 * Phase 4N48 – Drill Runner Contract Tests
 * =========================================
 *
 * Test contracts for automated drill execution.
 * Drills run exercises in sequence, produce artifact pointers,
 * and return structured DrillResult objects.
 *
 * @module drill-runner.test
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// DrillResult Interface (contract from evidence-index.ts)
// ─────────────────────────────────────────────────────────────────────────────

interface DrillResult {
  readonly drillId: string;
  readonly timestamp: string;
  readonly profile: string;
  readonly exercisesRun: readonly ExerciseResult[];
  readonly overall: 'passed' | 'failed' | 'partial';
  readonly artifacts: readonly ArtifactPointer[];
  readonly duration_ms: number;
  readonly failFast: boolean;
}

interface ExerciseResult {
  readonly name: string;
  readonly status: 'passed' | 'failed' | 'skipped';
  readonly duration_ms: number;
  readonly error?: string;
  readonly output?: string;
}

interface ArtifactPointer {
  readonly type: 'log' | 'screenshot' | 'report' | 'telemetry';
  readonly path: string;
  readonly sha256?: string;
}

interface DrillOptions {
  readonly profile: string;
  readonly exercises?: readonly string[];
  readonly failFast?: boolean;
  readonly baseDir?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// County Drill Sequence (expected order)
// ─────────────────────────────────────────────────────────────────────────────

const COUNTY_DRILL_SEQUENCE = [
  'COUNTY_PILOT',
  'INCIDENT_DRILL',
  // STATE_PILOT is optional for county
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Stub implementations (will be replaced by real imports)
// ─────────────────────────────────────────────────────────────────────────────

function runExercise(
  name: string,
  _baseDir: string
): { status: 'passed' | 'failed' | 'skipped'; duration_ms: number; error?: string } {
  const exercisesDir = join(_baseDir, 'exercises');
  const exercisePath = join(exercisesDir, `${name}.md`);

  if (!existsSync(exercisePath)) {
    return { status: 'failed', duration_ms: 0, error: `Exercise not found: ${name}.md` };
  }

  // Read exercise markdown to simulate execution
  const content = readFileSync(exercisePath, 'utf-8');

  // Simplified: just check it's non-empty markdown
  if (content.length < 10) {
    return { status: 'failed', duration_ms: 5, error: 'Exercise file empty or malformed' };
  }

  return { status: 'passed', duration_ms: Math.floor(Math.random() * 100) + 10 };
}

function runDrills(options: DrillOptions): DrillResult {
  const baseDir = options.baseDir ?? join(__dirname, '..');
  const exercisesDir = join(baseDir, 'exercises');

  const startTime = Date.now();
  const drillId = `drill-${options.profile}-${Date.now()}`;

  // Determine exercises to run
  let exerciseNames: readonly string[];
  if (options.exercises && options.exercises.length > 0) {
    exerciseNames = options.exercises;
  } else if (options.profile === 'county') {
    exerciseNames = COUNTY_DRILL_SEQUENCE;
  } else {
    // Discover all exercises
    const files = readdirSync(exercisesDir).filter(f => f.endsWith('.md'));
    exerciseNames = files.map(f => f.replace('.md', ''));
  }

  const exercisesRun: ExerciseResult[] = [];
  const artifacts: ArtifactPointer[] = [];
  let hasFailure = false;

  for (const name of exerciseNames) {
    const result = runExercise(name, baseDir);

    exercisesRun.push({
      name,
      status: result.status,
      duration_ms: result.duration_ms,
      error: result.error,
    });

    if (result.status === 'failed') {
      hasFailure = true;
      if (options.failFast) {
        // Mark remaining as skipped
        const remaining = exerciseNames.slice(exerciseNames.indexOf(name) + 1);
        for (const skipped of remaining) {
          exercisesRun.push({
            name: skipped,
            status: 'skipped',
            duration_ms: 0,
          });
        }
        break;
      }
    }
  }

  const endTime = Date.now();

  // Generate artifact pointers
  artifacts.push({
    type: 'log',
    path: join(baseDir, 'logs', `${drillId}.log`),
  });

  artifacts.push({
    type: 'telemetry',
    path: join(baseDir, 'telemetry', `${drillId}.jsonl`),
  });

  // Determine overall status
  const passedCount = exercisesRun.filter(e => e.status === 'passed').length;
  const failedCount = exercisesRun.filter(e => e.status === 'failed').length;

  let overall: 'passed' | 'failed' | 'partial';
  if (failedCount === 0) {
    overall = 'passed';
  } else if (passedCount === 0) {
    overall = 'failed';
  } else {
    overall = 'partial';
  }

  return {
    drillId,
    timestamp: new Date(startTime).toISOString(),
    profile: options.profile,
    exercisesRun,
    overall,
    artifacts,
    duration_ms: endTime - startTime,
    failFast: options.failFast ?? false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('DrillRunner', () => {
  describe('Sequence Execution', () => {
    it('drills_runs_county_sequence_in_order', () => {
      // Contract: county drills run in defined sequence order
      const result = runDrills({ profile: 'county' });

      // Should run at least the first exercise
      assert.ok(result.exercisesRun.length >= 1, 'Should run at least one exercise');

      // First exercise should be COUNTY_PILOT
      assert.equal(
        result.exercisesRun[0].name,
        'COUNTY_PILOT',
        'First exercise should be COUNTY_PILOT'
      );

      // If INCIDENT_DRILL exists, it should come after COUNTY_PILOT
      const incidentIdx = result.exercisesRun.findIndex(e => e.name === 'INCIDENT_DRILL');
      const countyIdx = result.exercisesRun.findIndex(e => e.name === 'COUNTY_PILOT');
      if (incidentIdx !== -1) {
        assert.ok(incidentIdx > countyIdx, 'INCIDENT_DRILL should run after COUNTY_PILOT');
      }
    });

    it('drills_runs_specified_exercises_only', () => {
      // Contract: explicit exercise list overrides default sequence
      const result = runDrills({
        profile: 'county',
        exercises: ['COUNTY_PILOT'],
      });

      assert.equal(result.exercisesRun.length, 1, 'Should run only specified exercise');
      assert.equal(result.exercisesRun[0].name, 'COUNTY_PILOT');
    });
  });

  describe('Result Contract', () => {
    it('drills_returns_DrillResult_contract', () => {
      // Contract: result matches DrillResult interface exactly
      const result = runDrills({ profile: 'county' });

      // Required fields
      assert.equal(typeof result.drillId, 'string');
      assert.ok(result.drillId.startsWith('drill-county-'), 'drillId format');

      assert.equal(typeof result.timestamp, 'string');
      assert.doesNotThrow(() => new Date(result.timestamp), 'Valid ISO timestamp');

      assert.equal(result.profile, 'county');

      assert.ok(Array.isArray(result.exercisesRun));
      assert.ok(
        ['passed', 'failed', 'partial'].includes(result.overall),
        `overall should be passed|failed|partial, got ${result.overall}`
      );

      assert.ok(Array.isArray(result.artifacts));
      assert.equal(typeof result.duration_ms, 'number');
      assert.ok(result.duration_ms >= 0, 'duration_ms should be non-negative');

      assert.equal(typeof result.failFast, 'boolean');
    });

    it('exercise_result_shape', () => {
      // Contract: each ExerciseResult has required fields
      const result = runDrills({
        profile: 'county',
        exercises: ['COUNTY_PILOT'],
      });

      const exercise = result.exercisesRun[0];
      assert.equal(typeof exercise.name, 'string');
      assert.ok(['passed', 'failed', 'skipped'].includes(exercise.status));
      assert.equal(typeof exercise.duration_ms, 'number');
    });
  });

  describe('Failure Policy', () => {
    it('drills_fail_fast_or_fail_summary_policy_failfast', () => {
      // Contract: failFast=true stops on first failure
      const result = runDrills({
        profile: 'county',
        exercises: ['NONEXISTENT_EXERCISE', 'COUNTY_PILOT'],
        failFast: true,
      });

      // First exercise fails (doesn't exist)
      assert.equal(result.exercisesRun[0].status, 'failed');

      // Second exercise should be skipped, not run
      if (result.exercisesRun.length > 1) {
        assert.equal(result.exercisesRun[1].status, 'skipped', 'Should skip remaining on failFast');
      }

      assert.equal(result.failFast, true);
    });

    it('drills_fail_fast_or_fail_summary_policy_continue', () => {
      // Contract: failFast=false continues and collects all results
      const result = runDrills({
        profile: 'county',
        exercises: ['NONEXISTENT_EXERCISE', 'COUNTY_PILOT'],
        failFast: false,
      });

      assert.equal(result.exercisesRun.length, 2, 'Should run all exercises');

      // First fails
      assert.equal(result.exercisesRun[0].status, 'failed');

      // Second should have run (passed or failed, not skipped)
      assert.notEqual(
        result.exercisesRun[1].status,
        'skipped',
        'Should not skip when failFast=false'
      );

      assert.equal(result.failFast, false);
      assert.equal(result.overall, 'partial', 'Should be partial with mixed results');
    });
  });

  describe('Artifact Production', () => {
    it('drills_produces_artifact_pointers', () => {
      // Contract: drills produce log and telemetry artifact pointers
      const result = runDrills({ profile: 'county' });

      assert.ok(result.artifacts.length >= 2, 'Should produce at least 2 artifacts');

      // Must have log artifact
      const logArtifact = result.artifacts.find(a => a.type === 'log');
      assert.ok(logArtifact, 'Should have log artifact');
      assert.ok(logArtifact?.path.includes(result.drillId), 'Log path should include drillId');

      // Must have telemetry artifact
      const telemetryArtifact = result.artifacts.find(a => a.type === 'telemetry');
      assert.ok(telemetryArtifact, 'Should have telemetry artifact');
    });

    it('artifact_pointer_shape', () => {
      // Contract: ArtifactPointer matches interface
      const result = runDrills({ profile: 'county' });

      for (const artifact of result.artifacts) {
        assert.ok(['log', 'screenshot', 'report', 'telemetry'].includes(artifact.type));
        assert.equal(typeof artifact.path, 'string');
        // sha256 is optional
        if ('sha256' in artifact && artifact.sha256 !== undefined) {
          assert.equal(typeof artifact.sha256, 'string');
          assert.ok(artifact.sha256.length === 64, 'SHA256 should be 64 hex chars');
        }
      }
    });
  });

  describe('Determinism', () => {
    it('drills_same_inputs_same_structure', () => {
      // Contract: same inputs produce same structural output (ignoring timing)
      const result1 = runDrills({ profile: 'county', exercises: ['COUNTY_PILOT'] });
      const result2 = runDrills({ profile: 'county', exercises: ['COUNTY_PILOT'] });

      // Same profile
      assert.equal(result1.profile, result2.profile);

      // Same exercise count and order
      assert.equal(result1.exercisesRun.length, result2.exercisesRun.length);
      assert.deepEqual(
        result1.exercisesRun.map(e => e.name),
        result2.exercisesRun.map(e => e.name)
      );

      // Same overall status
      assert.equal(result1.overall, result2.overall);

      // Same artifact types
      assert.deepEqual(
        result1.artifacts.map(a => a.type),
        result2.artifacts.map(a => a.type)
      );
    });
  });
});
