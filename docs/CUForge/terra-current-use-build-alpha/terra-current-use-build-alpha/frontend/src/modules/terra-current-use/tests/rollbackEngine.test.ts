import { getRollbackYearCount } from '../domain/rollbackEngine';

describe('Current Use rollback alpha', () => {
  it('uses four years for Farm & Ag after cutover', () => {
    expect(getRollbackYearCount('FARM_AND_AGRICULTURAL', '2026-03-15')).toBe(4);
  });

  it('uses seven years for Open Space', () => {
    expect(getRollbackYearCount('OPEN_SPACE', '2026-03-15')).toBe(7);
  });
});
