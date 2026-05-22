import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BACKEND_ROOT = resolve(import.meta.dirname, '../../../../../../../backend/src/TerraFusion.CurrentUse');

function read(relPath: string): string {
  return readFileSync(resolve(BACKEND_ROOT, relPath), 'utf-8');
}

describe('CUForge API contract (backend source truth)', () => {
  describe('controller route contract', () => {
    it('controller is routed at api/currentuse', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[Route("api/currentuse")]');
    });

    it('exposes GET classifications endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpGet("classifications")]');
    });

    it('exposes GET classifications/{id} endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpGet("classifications/{id:guid}")]');
    });

    it('exposes POST classifications endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpPost("classifications")]');
    });

    it('exposes POST rollback/calculate endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpPost("rollback/calculate")]');
    });

    it('exposes GET interest-rates endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpGet("interest-rates")]');
    });

    it('exposes GET interest/calculate endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpGet("interest/calculate")]');
    });

    it('exposes GET removals endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpGet("removals")]');
    });

    it('exposes POST removals endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpPost("removals")]');
    });

    it('exposes GET penalty-exceptions endpoint', () => {
      const controller = read('Controllers/CurrentUseController.cs');
      expect(controller).toContain('[HttpGet("penalty-exceptions")]');
    });
  });

  describe('DTO shape contract', () => {
    it('RollbackCalculationRequest has required fields', () => {
      const dtos = read('DTOs/CurrentUseDtos.cs');
      expect(dtos).toContain('string ParcelId');
      expect(dtos).toContain('string ClassificationCode');
      expect(dtos).toContain('int EnrollmentYear');
      expect(dtos).toContain('int RemovalYear');
      expect(dtos).toContain('Dictionary<string, decimal> MarketValues');
      expect(dtos).toContain('Dictionary<string, decimal> CurrentUseValues');
    });

    it('RollbackResult has financial breakdown fields', () => {
      const dtos = read('DTOs/CurrentUseDtos.cs');
      expect(dtos).toContain('decimal TotalRollbackTax');
      expect(dtos).toContain('decimal TotalInterest');
      expect(dtos).toContain('decimal TotalPenalty');
      expect(dtos).toContain('decimal GrandTotal');
      expect(dtos).toContain('List<YearBreakdown> YearBreakdowns');
    });

    it('YearBreakdown has per-year financial detail', () => {
      const dtos = read('DTOs/CurrentUseDtos.cs');
      expect(dtos).toContain('record YearBreakdown');
      expect(dtos).toContain('int Year');
      expect(dtos).toContain('decimal MarketValue');
      expect(dtos).toContain('decimal CurrentUseValue');
      expect(dtos).toContain('decimal Difference');
      expect(dtos).toContain('decimal InterestRate');
      expect(dtos).toContain('decimal InterestAmount');
    });

    it('PenaltyExceptionDto has RCW reference', () => {
      const dtos = read('DTOs/CurrentUseDtos.cs');
      expect(dtos).toContain('string RcwReference');
      expect(dtos).toContain('bool Eligible');
    });
  });

  describe('domain model contract', () => {
    it('Classification model has required properties', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('class Classification');
      expect(models).toContain('string ParcelId');
      expect(models).toContain('string ClassificationCode');
      expect(models).toContain('DateOnly EnrollmentDate');
      expect(models).toContain('string Status');
    });

    it('InterestRate model uses Year as primary key', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('class InterestRate');
      expect(models).toContain('int Year');
      expect(models).toContain('decimal Rate');
    });

    it('Removal model tracks full lifecycle', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('class Removal');
      expect(models).toContain('string Status');
      expect(models).toContain('decimal? RollbackAmount');
      expect(models).toContain('decimal? InterestAmount');
      expect(models).toContain('decimal? PenaltyAmount');
      expect(models).toContain('decimal? TotalDue');
    });

    it('AuditEntry model supports hash-chain integrity', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('class CurrentUseAuditEntry');
      expect(models).toContain('string? PreviousHash');
      expect(models).toContain('string Hash');
    });
  });

  describe('service registration contract', () => {
    it('registers all services via AddCurrentUseServices extension', () => {
      const ext = read('CurrentUseServiceExtensions.cs');
      expect(ext).toContain('AddCurrentUseServices');
      expect(ext).toContain('IClassificationService');
      expect(ext).toContain('IRollbackCalculationService');
      expect(ext).toContain('IInterestService');
      expect(ext).toContain('IRemovalService');
      expect(ext).toContain('IPenaltyExceptionService');
    });

    it('supports InMemory database for development', () => {
      const ext = read('CurrentUseServiceExtensions.cs');
      expect(ext).toContain('UseInMemoryDatabase');
    });

    it('supports Npgsql for production', () => {
      const ext = read('CurrentUseServiceExtensions.cs');
      expect(ext).toContain('UseNpgsql');
    });

    it('uses dedicated schema for migrations', () => {
      const ext = read('CurrentUseServiceExtensions.cs');
      expect(ext).toContain('"currentuse"');
    });
  });
});
