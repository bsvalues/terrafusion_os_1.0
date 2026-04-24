import { evidencePacketToMarkdown } from '../utils/evidencePacketMarkdown';
import type { EvidencePacketDto } from '../countyStudyApi';

const mockPacket: EvidencePacketDto = {
  studyId: 'study-1',
  countyName: 'Benton County',
  taxYear: 2025,
  studyType: 'General',
  studyStatus: 'Active',
  exportedAt: '2026-04-24T12:00:00Z',
  exportedBy: 'test-user',
  medianRatio: 0.97,
  cod: 14.2,
  prd: 1.01,
  complianceStatus: 'Compliant',
  parcelCount: 89247,
  ratioCount: 3200,
  criticalSegments: 2,
  warningSegments: 5,
  healthySegments: 41,
  primaryScenario: {
    scenarioId: 'sc-1',
    adjustmentType: 'PercentageIncrease',
    parameters: '{"magnitude":3.5}',
    rationale: 'Calibrated to market trend',
    status: 'Approved',
    createdAt: '2026-04-20T10:00:00Z',
    createdBy: 'bsvalues',
  },
  aiDiagnosis: {
    overallClass: 'Healthy',
    overallConfidence: 0.82,
    healthySegmentCount: 41,
    problemSegmentCount: 7,
    narrative: 'County assessment is broadly equitable.',
    topFindings: [
      { code: 'LOW_SAMPLE', category: 'Data', summary: 'Segment has fewer than 30 ratios.', evidenceStrength: 0.8 },
    ],
  },
  exceptions: [
    {
      exceptionSetId: 'exc-1',
      reasonCode: 'LowSample',
      parcelCount: 5,
      destination: 'Dais',
      status: 'Resolved',
      assignedTo: 'Jane Assessor',
      notes: null,
      createdAt: '2026-04-22T08:00:00Z',
    },
  ],
};

test('contains study header information', () => {
  const md = evidencePacketToMarkdown(mockPacket);
  expect(md).toContain('Benton County');
  expect(md).toContain('2025');
  expect(md).toContain('bsvalues');
});

test('formats IAAO compliance table with pass/fail', () => {
  const md = evidencePacketToMarkdown(mockPacket);
  expect(md).toContain('Median Assessment Ratio');
  expect(md).toContain('0.970');
  expect(md).toContain('✅ Pass'); // 0.97 is within 0.90-1.10
});

test('includes scenario rationale', () => {
  const md = evidencePacketToMarkdown(mockPacket);
  expect(md).toContain('Calibrated to market trend');
});

test('lists exceptions in table', () => {
  const md = evidencePacketToMarkdown(mockPacket);
  expect(md).toContain('LowSample');
  expect(md).toContain('Jane Assessor');
});

test('handles null AI diagnosis gracefully', () => {
  const noAiPacket = { ...mockPacket, aiDiagnosis: null };
  const md = evidencePacketToMarkdown(noAiPacket);
  expect(md).toContain('not available');
});

test('handles no scenario gracefully', () => {
  const noScenPacket = { ...mockPacket, primaryScenario: null };
  const md = evidencePacketToMarkdown(noScenPacket);
  expect(md).toContain('No scenario selected');
});
