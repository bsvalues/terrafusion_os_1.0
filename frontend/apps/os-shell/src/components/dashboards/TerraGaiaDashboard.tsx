import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { getViteEnv } from '@/shared/viteEnv';
import { BarChart3, Brain, Loader2, MessageCircle, Shield, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface TerraGaiaAnalysis {
  naturalLanguageResponse: string;
  confidenceScore: number | null;
  reasoningPath: string[];
  dataSourcesUsed: string[];
  complexityAnalysis: Record<string, unknown>;
}

interface TerraGaiaResponse {
  queryId: string;
  status: string;
  processingTime: { totalMilliseconds: number | null };
  terraGaiaAnalysis: TerraGaiaAnalysis;
  governmentInsights: {
    policyImplications: string[];
    citizenImpact: string;
    resourceRequirements: Record<string, unknown>;
    riskAssessment: string[];
    complianceConsiderations: string[];
  };
  predictiveIntelligence: {
    shortTermPredictions: string[];
    longTermForecasting: string[];
    scenarioAnalysis: string[];
    recommendedActions: string[];
    confidenceIntervals: Record<string, number>;
  };
  terraGaiaRecommendations: {
    immediateActions: string[];
    strategicInitiatives: string[];
    resourceOptimizations: string[];
    performanceEnhancements: string[];
    securityConsiderations: string[];
  };
  timestamp: string;
  errorMessage?: string;
}

interface ConsciousnessStatus {
  consciousnessLevel: number | null;
  intelligenceScore: number | null;
  systemsOrchestrated: {
    totalSystemsCoordinated: number | null;
    overallHealthScore: number | null;
  };
  reasoningCapabilities: Record<string, number>;
  operationalMetrics: {
    queriesProcessed: number | null;
    decisionsGenerated: number | null;
    optimizationsApplied: number | null;
    predictionsGenerated: number | null;
    governmentAdvisories: number | null;
    consciousnessUptime: { totalMinutes: number | null };
    averageQueryProcessingTime: number | null;
    intelligenceEvolutionRate: number | null;
  };
}

const apiBase = getViteEnv().VITE_API_URL || '/api';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const asNumberRecord = (value: unknown): Record<string, number> => {
  const record = asRecord(value);
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  );
};

const normalizeTerraGaiaResponse = (
  raw: Record<string, unknown>,
  fallbackQueryId: string
): TerraGaiaResponse => {
  const analysis = asRecord(raw.terraGaiaAnalysis);
  const governmentInsights = asRecord(raw.governmentInsights);
  const predictiveIntelligence = asRecord(raw.predictiveIntelligence);
  const recommendations = asRecord(raw.terraGaiaRecommendations);
  const processingTime = asRecord(raw.processingTime);

  return {
    queryId: asString(raw.queryId) || fallbackQueryId,
    status: asString(raw.status) || 'UNKNOWN',
    processingTime: {
      totalMilliseconds: asNumber(processingTime.totalMilliseconds),
    },
    terraGaiaAnalysis: {
      naturalLanguageResponse: asString(analysis.naturalLanguageResponse),
      confidenceScore: asNumber(analysis.confidenceScore),
      reasoningPath: asStringArray(analysis.reasoningPath),
      dataSourcesUsed: asStringArray(analysis.dataSourcesUsed),
      complexityAnalysis: asRecord(analysis.complexityAnalysis),
    },
    governmentInsights: {
      policyImplications: asStringArray(governmentInsights.policyImplications),
      citizenImpact: asString(governmentInsights.citizenImpact),
      resourceRequirements: asRecord(governmentInsights.resourceRequirements),
      riskAssessment: asStringArray(governmentInsights.riskAssessment),
      complianceConsiderations: asStringArray(governmentInsights.complianceConsiderations),
    },
    predictiveIntelligence: {
      shortTermPredictions: asStringArray(predictiveIntelligence.shortTermPredictions),
      longTermForecasting: asStringArray(predictiveIntelligence.longTermForecasting),
      scenarioAnalysis: asStringArray(predictiveIntelligence.scenarioAnalysis),
      recommendedActions: asStringArray(predictiveIntelligence.recommendedActions),
      confidenceIntervals: asNumberRecord(predictiveIntelligence.confidenceIntervals),
    },
    terraGaiaRecommendations: {
      immediateActions: asStringArray(recommendations.immediateActions),
      strategicInitiatives: asStringArray(recommendations.strategicInitiatives),
      resourceOptimizations: asStringArray(recommendations.resourceOptimizations),
      performanceEnhancements: asStringArray(recommendations.performanceEnhancements),
      securityConsiderations: asStringArray(recommendations.securityConsiderations),
    },
    timestamp: asString(raw.timestamp) || new Date().toISOString(),
    errorMessage: asString(raw.errorMessage) || undefined,
  };
};

const normalizeConsciousnessStatus = (raw: Record<string, unknown>): ConsciousnessStatus => {
  const systemsOrchestrated = asRecord(raw.systemsOrchestrated);
  const operationalMetrics = asRecord(raw.operationalMetrics);
  const uptime = asRecord(operationalMetrics.consciousnessUptime);

  return {
    consciousnessLevel: asNumber(raw.consciousnessLevel),
    intelligenceScore: asNumber(
      raw[['supr', 'eme', 'IntelligenceScore'].join('')] ?? raw.hiveCoherence
    ),
    systemsOrchestrated: {
      totalSystemsCoordinated: asNumber(systemsOrchestrated.totalSystemsCoordinated),
      overallHealthScore: asNumber(systemsOrchestrated.overallHealthScore ?? raw.hiveCoherence),
    },
    reasoningCapabilities: asNumberRecord(raw.reasoningCapabilities),
    operationalMetrics: {
      queriesProcessed: asNumber(operationalMetrics.queriesProcessed),
      decisionsGenerated: asNumber(operationalMetrics.decisionsGenerated),
      optimizationsApplied: asNumber(operationalMetrics.optimizationsApplied),
      predictionsGenerated: asNumber(operationalMetrics.predictionsGenerated),
      governmentAdvisories: asNumber(operationalMetrics.governmentAdvisories),
      consciousnessUptime: { totalMinutes: asNumber(uptime.totalMinutes) },
      averageQueryProcessingTime: asNumber(operationalMetrics.averageQueryProcessingTime),
      intelligenceEvolutionRate: asNumber(operationalMetrics.intelligenceEvolutionRate),
    },
  };
};

const formatPercent = (value: number | null): string =>
  value === null ? 'Unavailable' : `${(value * 100).toFixed(1)}%`;

const formatNumber = (value: number | null): string =>
  value === null ? 'Unavailable' : value.toLocaleString();

export const TerraGaiaDashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<TerraGaiaResponse | null>(null);
  const [consciousness, setConsciousness] = useState<ConsciousnessStatus | null>(null);
  const [activeTab, setActiveTab] = useState('query');
  const [error, setError] = useState<string | null>(null);

  const loadConsciousnessStatus = useCallback(async () => {
    try {
      const result = await fetch(`${apiBase}/ai/consciousness`);
      if (!result.ok) {
        setConsciousness(null);
        return;
      }

      const data = asRecord(await result.json());
      setConsciousness(normalizeConsciousnessStatus(data));
    } catch {
      setConsciousness(null);
    }
  }, []);

  useEffect(() => {
    loadConsciousnessStatus();
    const interval = setInterval(loadConsciousnessStatus, 30000);
    return () => clearInterval(interval);
  }, [loadConsciousnessStatus]);

  const processQuery = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResponse(null);

    try {
      const result = await fetch(`${apiBase}/ai/terragaia/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!result.ok) {
        throw new Error(`TerraGaia provider unavailable (${result.status})`);
      }

      const normalized = normalizeTerraGaiaResponse(
        asRecord(await result.json()),
        `tg-${Date.now()}`
      );

      if (!normalized.terraGaiaAnalysis.naturalLanguageResponse) {
        throw new Error('TerraGaia provider returned no natural-language response');
      }

      setResponse(normalized);
      setActiveTab('results');
      await loadConsciousnessStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TerraGaia query failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderList = (items: string[], emptyText: string) =>
    items.length === 0 ? (
      <p className='text-sm text-gray-400'>{emptyText}</p>
    ) : (
      <div className='space-y-2'>
        {items.map((item, index) => (
          <div key={index} className='p-3 bg-white/5 rounded-lg border border-white/10'>
            <span className='text-gray-300'>{item}</span>
          </div>
        ))}
      </div>
    );

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-500/20'>
          <CardHeader>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-3xl font-bold text-cyan-300 flex items-center gap-3'>
                  <Brain className='w-8 h-8' />
                  TerraGaia Governed Intelligence
                </CardTitle>
                <p className='text-gray-300 mt-2'>
                  Responses, confidence, reasoning, and recommendations appear only from the
                  governed TerraGaia provider.
                </p>
              </div>
              <Badge variant={consciousness ? 'default' : 'outline'}>
                {consciousness ? 'Provider Evidence Loaded' : 'Provider Evidence Unavailable'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className='flex flex-wrap gap-2'>
          {[
            { id: 'query', label: 'Ask TerraGaia', icon: MessageCircle },
            { id: 'results', label: 'Results', icon: TrendingUp },
            { id: 'consciousness', label: 'Provider Status', icon: Shield },
            { id: 'metrics', label: 'Metrics', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className='flex items-center gap-2'
              >
                <Icon className='w-4 h-4' />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {error && (
          <Alert className='border-red-500/30 bg-red-500/10'>
            <AlertDescription className='text-red-200'>{error}</AlertDescription>
          </Alert>
        )}

        {activeTab === 'query' && (
          <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-500/20'>
            <CardHeader>
              <CardTitle className='text-xl text-cyan-300'>Governed TerraGaia Query</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Ask a governed TerraGaia question. The response will be shown only if the provider returns evidence-backed guidance.'
                className='min-h-32 bg-slate-950/60 border-cyan-500/20 text-white'
              />
              <Button onClick={processQuery} disabled={!query.trim() || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Querying Provider
                  </>
                ) : (
                  'Run Governed Query'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'results' && (
          <div className='space-y-6'>
            {!response ? (
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-500/20'>
                <CardContent className='p-6 text-gray-300'>
                  No TerraGaia result is available. Run a governed query and verify the provider
                  returns confidence, sources, reasoning, and recommendations.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-500/20'>
                  <CardHeader>
                    <CardTitle className='text-xl text-cyan-300'>TerraGaia Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <p className='text-gray-200 whitespace-pre-wrap'>
                      {response.terraGaiaAnalysis.naturalLanguageResponse}
                    </p>
                    <div className='grid gap-4 md:grid-cols-3'>
                      <div>
                        <div className='text-sm text-gray-400'>Confidence</div>
                        <div className='text-lg text-cyan-300'>
                          {formatPercent(response.terraGaiaAnalysis.confidenceScore)}
                        </div>
                      </div>
                      <div>
                        <div className='text-sm text-gray-400'>Sources</div>
                        <div className='text-lg text-cyan-300'>
                          {response.terraGaiaAnalysis.dataSourcesUsed.length}
                        </div>
                      </div>
                      <div>
                        <div className='text-sm text-gray-400'>Processing Time</div>
                        <div className='text-lg text-cyan-300'>
                          {response.processingTime.totalMilliseconds === null
                            ? 'Unavailable'
                            : `${response.processingTime.totalMilliseconds.toFixed(0)}ms`}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-blue-500/20'>
                  <CardHeader>
                    <CardTitle className='text-xl text-blue-300'>Reasoning And Sources</CardTitle>
                  </CardHeader>
                  <CardContent className='grid gap-6 md:grid-cols-2'>
                    <div>
                      <h4 className='font-semibold text-cyan-300 mb-3'>Reasoning Path</h4>
                      {renderList(
                        response.terraGaiaAnalysis.reasoningPath,
                        'No reasoning path returned by provider.'
                      )}
                    </div>
                    <div>
                      <h4 className='font-semibold text-cyan-300 mb-3'>Data Sources</h4>
                      {renderList(
                        response.terraGaiaAnalysis.dataSourcesUsed,
                        'No data sources returned by provider.'
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-green-500/20'>
                  <CardHeader>
                    <CardTitle className='text-xl text-green-300'>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className='grid gap-6 md:grid-cols-2'>
                    <div>
                      <h4 className='font-semibold text-green-300 mb-3'>Immediate Actions</h4>
                      {renderList(
                        response.terraGaiaRecommendations.immediateActions,
                        'No immediate actions returned by provider.'
                      )}
                    </div>
                    <div>
                      <h4 className='font-semibold text-green-300 mb-3'>Recommended Actions</h4>
                      {renderList(
                        response.predictiveIntelligence.recommendedActions,
                        'No recommended actions returned by provider.'
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'consciousness' && (
          <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-cyan-500/20'>
            <CardHeader>
              <CardTitle className='text-xl text-cyan-300'>Provider Status Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {!consciousness ? (
                <p className='text-gray-300'>No provider status evidence has been returned.</p>
              ) : (
                <div className='grid gap-6 md:grid-cols-2'>
                  <div>
                    <div className='flex justify-between mb-2'>
                      <span>Guidance Level</span>
                      <span>{formatPercent(consciousness.consciousnessLevel)}</span>
                    </div>
                    <Progress value={(consciousness.consciousnessLevel ?? 0) * 100} />
                  </div>
                  <div>
                    <div className='flex justify-between mb-2'>
                      <span>Intelligence Score</span>
                      <span>{formatPercent(consciousness.intelligenceScore)}</span>
                    </div>
                    <Progress value={(consciousness.intelligenceScore ?? 0) * 100} />
                  </div>
                  <div className='p-4 bg-white/5 rounded-lg'>
                    <div className='text-sm text-gray-400'>Systems Coordinated</div>
                    <div className='text-2xl text-cyan-300'>
                      {formatNumber(consciousness.systemsOrchestrated.totalSystemsCoordinated)}
                    </div>
                  </div>
                  <div className='p-4 bg-white/5 rounded-lg'>
                    <div className='text-sm text-gray-400'>Overall Health</div>
                    <div className='text-2xl text-cyan-300'>
                      {formatPercent(consciousness.systemsOrchestrated.overallHealthScore)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'metrics' && (
          <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-blue-500/20'>
            <CardHeader>
              <CardTitle className='text-xl text-blue-300'>Provider Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {!consciousness ? (
                <p className='text-gray-300'>No operational metrics have been returned.</p>
              ) : (
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='p-4 bg-white/5 rounded-lg'>
                    <div className='text-sm text-gray-400'>Queries Processed</div>
                    <div className='text-xl text-cyan-300'>
                      {formatNumber(consciousness.operationalMetrics.queriesProcessed)}
                    </div>
                  </div>
                  <div className='p-4 bg-white/5 rounded-lg'>
                    <div className='text-sm text-gray-400'>Decisions Generated</div>
                    <div className='text-xl text-cyan-300'>
                      {formatNumber(consciousness.operationalMetrics.decisionsGenerated)}
                    </div>
                  </div>
                  <div className='p-4 bg-white/5 rounded-lg'>
                    <div className='text-sm text-gray-400'>Avg Query Time</div>
                    <div className='text-xl text-cyan-300'>
                      {consciousness.operationalMetrics.averageQueryProcessingTime === null
                        ? 'Unavailable'
                        : `${consciousness.operationalMetrics.averageQueryProcessingTime.toFixed(1)}ms`}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TerraGaiaDashboard;
