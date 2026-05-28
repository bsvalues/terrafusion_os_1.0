import type { CountySegmentDto } from '../types/countyStudio.types';
import { buildRiskSurfaceCommandCenter } from '../utils/riskSurfaces';

function segment(overrides: Partial<CountySegmentDto> & Record<string, unknown> = {}): CountySegmentDto {
  return {
    segmentId: 'seg-1',
    segmentSetId: 'set-1',
    name: 'NBHD-100 - R1 - STANDARD',
    segmentType: 'Residential',
    geographyRef: 'NBHD-100',
    revalArea: 2026,
    buildingType: 'R1',
    qualityGrade: 'STANDARD',
    parcelCount: 100,
    ratioCount: 20,
    salesCount: 20,
    medianRatio: 0.95,
    cod: 15,
    prd: 1.01,
    prb: 0.02,
    weightedMeanRatio: 0.96,
    yoyMedianRatioDelta: 0.01,
    stabilityScore: 80,
    riskScore: 20,
    exceptionCount: 2,
    ...overrides,
  } as CountySegmentDto;
}

describe('risk surface command center', () => {
  it('aggregates Benton valuation risk surfaces without using city as an analytical key', () => {
    const commandCenter = buildRiskSurfaceCommandCenter([
      segment({
        segmentId: 'seg-critical',
        name: 'NBHD-420 - R2 - GOOD',
        geographyRef: 'NBHD-420',
        revalArea: 2026,
        buildingType: 'R2',
        qualityGrade: 'GOOD',
        riskScore: 88,
        cod: 22.1,
        prd: 1.11,
        prb: 0.14,
        parcelCount: 80,
        ratioCount: 16,
        exceptionCount: 18,
        modelGroup: 'MG-12',
        valueTier: 'Upper',
        taxingDistrict: 'Kiona-Benton SD #52',
      }),
      segment({
        segmentId: 'seg-stable',
        name: 'NBHD-110 - R1 - STANDARD',
        geographyRef: 'NBHD-110',
        revalArea: 2025,
        buildingType: 'R1',
        qualityGrade: 'STANDARD',
        riskScore: 24,
        cod: 11.2,
        prd: 1.01,
        prb: 0.01,
        modelGroup: 'MG-01',
        valueTier: 'Middle',
        taxingDistrict: 'Richland SD #400',
      }),
    ]);

    expect(commandCenter.boards.revaluationCycles[0]).toMatchObject({
      key: '2026',
      label: 'Cycle 2026',
      type: 'revalCycle',
      riskLevel: 'Critical',
      primaryReason: 'COD 22.1',
    });
    expect(commandCenter.boards.neighborhoods[0]).toMatchObject({
      key: 'NBHD-420',
      label: 'Neighborhood NBHD-420',
      type: 'neighborhood',
      action: 'Drill parcel evidence',
    });
    expect(commandCenter.boards.modelGroups[0]).toMatchObject({
      key: 'MG-12',
      label: 'MG-12',
      type: 'modelGroup',
    });
    expect(commandCenter.boards.districtExposure[0]).toMatchObject({
      key: 'Kiona-Benton SD #52',
      label: 'Kiona-Benton SD #52',
      type: 'taxingDistrict',
    });
    expect(commandCenter.boards.valueTiers[0]).toMatchObject({
      key: 'Upper',
      label: 'Upper',
      type: 'valueTier',
    });
    expect(commandCenter.ledger[0]).toMatchObject({
      rank: 1,
      key: 'NBHD-420',
      type: 'neighborhood',
      riskLevel: 'Critical',
      nextAction: 'Open neighborhood evidence',
      evidenceSegmentId: 'seg-critical',
    });
    expect(commandCenter.ledger.some((row) => row.type === 'city')).toBe(false);
  });

  it('surfaces missing district and value-tier data as contract gaps instead of substituting city', () => {
    const commandCenter = buildRiskSurfaceCommandCenter([
      segment({
        segmentId: 'seg-gap',
        geographyRef: 'NBHD-500',
        revalArea: null,
        riskScore: 72,
        cod: 19.8,
        prd: 1.07,
        prb: 0.11,
      }),
    ]);

    expect(commandCenter.boards.districtExposure).toEqual([]);
    expect(commandCenter.boards.valueTiers).toEqual([]);
    expect(commandCenter.contractGaps).toEqual(
      expect.arrayContaining([
        'No taxing district field is available on active segments.',
        'No value tier field is available on active segments.',
      ]),
    );
  });
});
