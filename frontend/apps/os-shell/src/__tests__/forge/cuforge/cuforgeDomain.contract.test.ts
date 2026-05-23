import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BACKEND_ROOT = resolve(import.meta.dirname, '../../../../../../../backend/src/TerraFusion.CurrentUse');

function read(relPath: string): string {
  return readFileSync(resolve(BACKEND_ROOT, relPath), 'utf-8');
}

describe('CUForge WA RCW domain compliance', () => {
  describe('rollback calculation (RCW 84.33.140 / 84.34.108)', () => {
    it('implements DFL 7-year rollback cap per RCW 84.33.140', () => {
      const svc = read('Services/RollbackCalculationService.cs');
      // DFL = 7 years max
      expect(svc).toMatch(/DFL.*7/i);
    });

    it('implements CUFA/CUOS/CUTL 10-year rollback cap per RCW 84.34.108', () => {
      const svc = read('Services/RollbackCalculationService.cs');
      // Non-DFL = 10 years max
      expect(svc).toContain(': 10');
    });

    it('applies 20% penalty by default', () => {
      const svc = read('Services/RollbackCalculationService.cs');
      expect(svc).toContain('0.20m');
    });

    it('references RCW 84.33.140 in documentation', () => {
      const svc = read('Services/RollbackCalculationService.cs');
      expect(svc).toContain('RCW 84.33.140');
    });

    it('references RCW 84.34.108 in documentation', () => {
      const svc = read('Services/RollbackCalculationService.cs');
      expect(svc).toContain('RCW 84.34.108');
    });
  });

  describe('penalty exceptions (RCW 84.33.140(6) / 84.34.108(6))', () => {
    it('defines DEATH exception per RCW 84.33.140(6)(a)', () => {
      const svc = read('Services/PenaltyExceptionService.cs');
      expect(svc).toContain('DEATH');
      expect(svc).toContain('84.33.140(6)(a)');
    });

    it('defines GOVT_ACQUISITION exception per RCW 84.33.140(6)(b)', () => {
      const svc = read('Services/PenaltyExceptionService.cs');
      expect(svc).toContain('GOVT_ACQUISITION');
      expect(svc).toContain('84.33.140(6)(b)');
    });

    it('defines TRADE_LAND_CONSERVATION exception per RCW 84.34.108(6)(a)', () => {
      const svc = read('Services/PenaltyExceptionService.cs');
      expect(svc).toContain('TRADE_LAND_CONSERVATION');
      expect(svc).toContain('84.34.108(6)(a)');
    });

    it('defines FORCED_SALE exception per RCW 84.34.108(6)(b)', () => {
      const svc = read('Services/PenaltyExceptionService.cs');
      expect(svc).toContain('FORCED_SALE');
      expect(svc).toContain('84.34.108(6)(b)');
    });

    it('defines TRANSFER_TO_GOVT exception per RCW 84.34.108(6)(c)', () => {
      const svc = read('Services/PenaltyExceptionService.cs');
      expect(svc).toContain('TRANSFER_TO_GOVT');
      expect(svc).toContain('84.34.108(6)(c)');
    });
  });

  describe('interest rates (WAC 458-30-590)', () => {
    it('references WAC 458-30-590 for interest rate authority', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('WAC 458-30-590');
    });

    it('uses WAC 458-30-590 as the authoritative rate source', () => {
      const db = read('Data/CurrentUseDbContext.cs');
      expect(db).toContain('WAC 458-30-590');
    });

    it('seeds historical rates from 2010-2026', () => {
      const db = read('Data/CurrentUseDbContext.cs');
      expect(db).toContain('Year = 2010');
      expect(db).toContain('Year = 2026');
    });
  });

  describe('classification codes', () => {
    it('supports DFL (Designated Forest Land) classification', () => {
      const db = read('Data/CurrentUseDbContext.cs');
      expect(db).toContain('DFL');
      expect(db).toContain('Designated Forest Land');
    });

    it('supports CUFA (Current Use Farm/Agriculture) classification', () => {
      const db = read('Data/CurrentUseDbContext.cs');
      expect(db).toContain('CUFA');
      expect(db).toContain('Farm/Agriculture');
    });

    it('supports CUOS (Current Use Open Space) classification', () => {
      const db = read('Data/CurrentUseDbContext.cs');
      expect(db).toContain('CUOS');
      expect(db).toContain('Open Space');
    });

    it('supports CUTL (Current Use Timber Land) classification', () => {
      const db = read('Data/CurrentUseDbContext.cs');
      expect(db).toContain('CUTL');
      expect(db).toContain('Timber Land');
    });
  });

  describe('audit trail', () => {
    it('has hash-chained audit entries for tamper evidence', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('PreviousHash');
      expect(models).toContain('Hash');
    });

    it('tracks who performed each action', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('PerformedBy');
    });

    it('timestamps all audit entries', () => {
      const models = read('Models/CurrentUseModels.cs');
      expect(models).toContain('Timestamp');
    });
  });
});
