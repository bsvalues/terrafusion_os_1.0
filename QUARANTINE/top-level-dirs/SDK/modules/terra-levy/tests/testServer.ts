import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET /levy/scenarios
  http.get('http://localhost:5000/levy/scenarios', ({ request }) => {
    const url = new URL(request.url);
    const measureId = url.searchParams.get('measureId');
    const take = Number(url.searchParams.get('take') ?? '100');
    const baseItems = [
      {
        id: 's1',
        countyId: 'c1',
        levyMeasureId: measureId || 'm1',
        name: 'Scenario A',
        scenarioType: 'baseline',
        levyRate: 1.2345,
        projectedRevenue: 1000000,
        collectionRate: 0.95,
        isActive: true,
        confidenceScore: 0.87,
      },
      {
        id: 's2',
        countyId: 'c1',
        levyMeasureId: measureId || 'm1',
        name: 'Scenario B',
        scenarioType: 'growth',
        levyRate: 1.1111,
        projectedRevenue: 1100000,
        collectionRate: 0.96,
        isActive: false,
        confidenceScore: 0.82,
      },
    ];
    return HttpResponse.json({ count: baseItems.length, items: baseItems.slice(0, take) });
  }),

  // GET /levy/measures
  http.get('http://localhost:5000/levy/measures', ({ request }) => {
    const url = new URL(request.url);
    const take = Number(url.searchParams.get('take') ?? '100');
    const items = [
      {
        id: 'm1',
        countyId: 'c1',
        name: 'General Levy',
        levyYear: 2025,
        targetAmount: 1500000,
        currentRate: 1.05,
        maxRate: 1.5,
        authorizedBy: 'Board',
        status: 'active',
      },
    ];
    return HttpResponse.json({ count: items.length, items: items.slice(0, take) });
  }),

  // POST /levy/scenarios/compare
  http.post('http://localhost:5000/levy/scenarios/compare', async ({ request }) => {
    const body = (await request.json()) as { scenarioIds: string[]; projectionYears: number };
    if (!Array.isArray(body.scenarioIds) || body.scenarioIds.length < 2) {
      return new HttpResponse('Bad Request', { status: 400 });
    }
    const scenarios = body.scenarioIds.map((id, idx) => ({
      scenarioId: id,
      scenarioName: `S-${id}`,
      scenarioType: idx % 2 ? 'growth' : 'baseline',
      totalProjectedRevenue: 1000000 + idx * 100000,
      averageGrowthRate: 0.03,
      averageConfidence: 0.85,
      riskLevel: 'low',
      projectionYears: body.projectionYears,
    }));
    return HttpResponse.json({
      scenarios,
      recommendedScenario: scenarios[0],
      recommendationReason: 'Highest confidence',
      comparisonMetrics: {},
      aiConfidence: 0.9,
    });
  }),

  // GET /levy/projections
  http.get('http://localhost:5000/levy/projections', ({ request }) => {
    const url = new URL(request.url);
    const scenarioId = url.searchParams.get('scenarioId') || 's-default';
    const items = [
      {
        id: 'p1',
        levyScenarioId: scenarioId,
        fiscalYear: 2025,
        projectedAssessedValue: 10000000,
        projectedLevyAmount: 500000,
        projectedCollectionRate: 0.95,
        projectedNetRevenue: 475000,
        growthRate: 0.02,
        confidenceLevel: 0.9,
      },
      {
        id: 'p2',
        levyScenarioId: scenarioId,
        fiscalYear: 2026,
        projectedAssessedValue: 10200000,
        projectedLevyAmount: 510000,
        projectedCollectionRate: 0.95,
        projectedNetRevenue: 484500,
        growthRate: 0.02,
        confidenceLevel: 0.9,
      },
      {
        id: 'p3',
        levyScenarioId: scenarioId,
        fiscalYear: 2027,
        projectedAssessedValue: 10404000,
        projectedLevyAmount: 520000,
        projectedCollectionRate: 0.95,
        projectedNetRevenue: 494000,
        growthRate: 0.02,
        confidenceLevel: 0.9,
      },
    ];
    return HttpResponse.json({ count: items.length, items });
  }),

  // POST /levy/projections/generate
  http.post('http://localhost:5000/levy/projections/generate', async ({ request }) => {
    const body = (await request.json()) as { scenarioId: string; years: number };
    if (!body?.scenarioId || !body?.years) {
      return new HttpResponse('Bad Request', { status: 400 });
    }
    // Return an array to satisfy the client type
    return HttpResponse.json([]);
  }),

  // POST /levy/calculate
  http.post('http://localhost:5000/levy/calculate', async ({ request }) => {
    const body = (await request.json()) as { measureId: string };
    if (!body?.measureId) {
      return new HttpResponse('Bad Request', { status: 400 });
    }
    return HttpResponse.json({
      calculatedRate: 1.2345,
      levyAmount: 500000,
      aiOptimalRate: 1.2,
      confidenceScore: 0.92,
      quantumOptimized: true,
      recommendationReason: 'Optimal under constraints',
      calculationDetails: {},
    });
  }),

  // GET /levy/measures/{id}/compliance
  http.get('http://localhost:5000/levy/measures/:id/compliance', ({ params, request }) => {
    const id = params.id as string;
    const url = new URL(request.url);
    const rateStr = url.searchParams.get('rate') || '0';
    const rate = parseFloat(rateStr);
    // Simple deterministic rule for tests
    const maximumAllowedRate = 1.2000;
    const isCompliant = rate <= maximumAllowedRate && rate > 0;
    return HttpResponse.json({
      isCompliant,
      proposedRate: rate,
      maximumAllowedRate,
      statutoryLimit: 1.5000,
      violations: isCompliant ? [] : ['EXCEEDS_MAX_RATE'],
      warnings: rate > 0 && rate > 1.1 ? ['NEAR_THRESHOLD'] : [],
      complianceLevel: isCompliant ? 'good' : 'violation',
    });
  }),
];

export const server = setupServer(...handlers);
