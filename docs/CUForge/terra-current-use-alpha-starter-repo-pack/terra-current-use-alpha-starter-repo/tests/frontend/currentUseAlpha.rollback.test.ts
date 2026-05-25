import { determineRollbackYears } from '../../src/modules/terra-current-use/domain/rollback/rollbackEngine';

describe('Current Use alpha rollback', () => {
  it('uses four years for Farm & Ag after cutover', () => {
    const years = determineRollbackYears({
      parcelId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      classificationType: 'FARM_AND_AGRICULTURAL',
      removalDate: '2026-03-15',
      taxYearOfRemoval: 2026,
    });

    expect(years).toEqual([2022, 2023, 2024, 2025]);
  });
});
