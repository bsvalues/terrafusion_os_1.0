import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const loadYaml = (p: string) => yaml.load(fs.readFileSync(p, 'utf8')) as any;

describe('OpenAPI contract (TerraLevy)', () => {
  const specPath = path.resolve(__dirname, '..', 'openapi', 'terra-levy.yaml');
  const spec = loadYaml(specPath);

  it('includes required paths and operations', () => {
    const paths = spec.paths || {};
    expect(paths['/levy/health']?.get).toBeTruthy();
    expect(paths['/levy/measures']?.get).toBeTruthy();
    expect(paths['/levy/measures/{id}']?.get).toBeTruthy();
    expect(paths['/levy/measures/{id}/compliance']?.get).toBeTruthy();
    expect(paths['/levy/calculate']?.post).toBeTruthy();
    expect(paths['/levy/scenarios']?.get).toBeTruthy();
    expect(paths['/levy/scenarios/compare']?.post).toBeTruthy();
    expect(paths['/levy/projections']?.get).toBeTruthy();
    expect(paths['/levy/projections/generate']?.post).toBeTruthy();
  });

  it('schemas align with client DTO keys (spot checks)', () => {
    const schemas = spec.components?.schemas || {};
    // Spot check a few required fields
    expect(schemas.LevyMeasure.required).toEqual(
      expect.arrayContaining(['id', 'name', 'levyYear', 'targetAmount'])
    );
    expect(schemas.LevyScenario.required).toEqual(
      expect.arrayContaining(['id', 'levyMeasureId', 'name', 'levyRate'])
    );
    expect(schemas.RevenueProjection.required).toEqual(
      expect.arrayContaining(['id', 'levyScenarioId', 'fiscalYear', 'projectedNetRevenue'])
    );
  });

  it('ComplianceResponse schema validates government compliance fields', () => {
    const schemas = spec.components?.schemas || {};
    const complianceSchema = schemas.ComplianceResponse;

    // Assert critical compliance fields are required
    expect(complianceSchema.required).toEqual(
      expect.arrayContaining([
        'isCompliant',
        'proposedRate',
        'maximumAllowedRate',
        'statutoryLimit',
        'violations',
        'warnings',
        'complianceLevel',
      ])
    );

    // Validate property types for regulatory correctness
    expect(complianceSchema.properties.isCompliant.type).toBe('boolean');
    expect(complianceSchema.properties.proposedRate.type).toBe('number');
    expect(complianceSchema.properties.maximumAllowedRate.type).toBe('number');
    expect(complianceSchema.properties.statutoryLimit.type).toBe('number');
    expect(complianceSchema.properties.violations.type).toBe('array');
    expect(complianceSchema.properties.warnings.type).toBe('array');
    expect(complianceSchema.properties.complianceLevel.type).toBe('string');
  });
});
