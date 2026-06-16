import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const releaseLane = readFileSync(join(ROOT, '.github', 'workflows', 'release-lane.yml'), 'utf8');
const runtimeCompose = readFileSync(
  join(ROOT, 'ops', 'prod', 'runtime-compose.template.yml'),
  'utf8'
);
const autoMigrateHostedService = readFileSync(
  join(ROOT, 'backend', 'src', 'TerraFusion.API', 'HostedServices', 'AutoMigrateHostedService.cs'),
  'utf8'
);
const databaseInitializationService = readFileSync(
  join(ROOT, 'backend', 'src', 'TerraFusion.API', 'Services', 'DatabaseInitializationService.cs'),
  'utf8'
);
const program = readFileSync(join(ROOT, 'backend', 'src', 'TerraFusion.API', 'Program.cs'), 'utf8');

describe('release lane no-mutation guard', () => {
  it('requires explicit approval before the release lane permits DB mutation', () => {
    assert.match(releaseLane, /allow_db_mutation:[\s\S]*?default:\s*false/);
    assert.ok(releaseLane.includes('ALLOW_DB_MUTATION: ${{ inputs.allow_db_mutation }}'));
    assert.ok(releaseLane.includes('TF_SKIP_AUTO_MIGRATE=true'));
    assert.ok(releaseLane.includes('TF_SKIP_AUTO_MIGRATE=${TF_SKIP_AUTO_MIGRATE}'));
  });

  it('blocks AuthProvisioner unless mutation approval is also present', () => {
    assert.ok(releaseLane.includes('PROVISION_AUTH'));
    assert.ok(releaseLane.includes('ALLOW_DB_MUTATION'));
    assert.ok(releaseLane.includes('provision_auth requires allow_db_mutation=true'));
  });

  it('defaults runtime compose to skip startup migration and initialization mutation', () => {
    assert.ok(runtimeCompose.includes('TF_SKIP_AUTO_MIGRATE: ${TF_SKIP_AUTO_MIGRATE:-true}'));
  });

  it('backend startup code honors TF_SKIP_AUTO_MIGRATE before creating mutation scopes', () => {
    assert.ok(autoMigrateHostedService.includes('GetValue<bool>("TF_SKIP_AUTO_MIGRATE")'));
    assert.ok(databaseInitializationService.includes('GetValue<bool>("TF_SKIP_AUTO_MIGRATE")'));
    assert.ok(program.includes('GetValue<bool>("TF_SKIP_AUTO_MIGRATE")'));

    const guardIndex = program.indexOf('GetValue<bool>("TF_SKIP_AUTO_MIGRATE")');
    const seederIndex = program.indexOf('GPTConfigurationSeeder');
    assert.ok(
      guardIndex >= 0 && seederIndex > guardIndex,
      'Program.cs must check TF_SKIP_AUTO_MIGRATE before GPT seeding can write to DB'
    );

    const dbInitGuardIndex = databaseInitializationService.indexOf(
      'GetValue<bool>("TF_SKIP_AUTO_MIGRATE")'
    );
    const createScopeIndex = databaseInitializationService.indexOf('CreateScope()');
    assert.ok(
      dbInitGuardIndex >= 0 && createScopeIndex > dbInitGuardIndex,
      'DatabaseInitializationService must check TF_SKIP_AUTO_MIGRATE before creating a DB scope'
    );
  });
});
