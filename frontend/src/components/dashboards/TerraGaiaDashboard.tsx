import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  Globe,
  Loader2,
  MessageCircle,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface TerraGaiaAnalysis {
  naturalLanguageResponse: string;
  confidenceScore: number;
  reasoningPath: string[];
  dataSourcesUsed: string[];
  complexityAnalysis: Record<string, any>;
}

interface GovernmentInsights {
  policyImplications: string[];
  citizenImpact: string;
  resourceRequirements: Record<string, any>;
  riskAssessment: string[];
  complianceConsiderations: string[];
}

interface PredictiveIntelligence {
  shortTermPredictions: string[];
  longTermForecasting: string[];
  scenarioAnalysis: string[];
  recommendedActions: string[];
  confidenceIntervals: Record<string, number>;
}

interface TerraGaiaRecommendations {
  immediateActions: string[];
  strategicInitiatives: string[];
  resourceOptimizations: string[];
  performanceEnhancements: string[];
  securityConsiderations: string[];
}

interface TerraGaiaResponse {
  queryId: string;
  status: string;
  processingTime: { totalMilliseconds: number };
  terraGaiaAnalysis: TerraGaiaAnalysis;
  governmentInsights: GovernmentInsights;
  predictiveIntelligence: PredictiveIntelligence;
  terraGaiaRecommendations: TerraGaiaRecommendations;
  championshipMetrics: {
    processingExcellence: string;
    intelligenceLevel: string;
    systemIntegration: string;
    predictiveAccuracy: string;
    advisoryQuality: string;
    crossSystemSynergy: string;
  };
  timestamp: string;
  errorMessage?: string;
}

interface ConsciousnessStatus {
  consciousnessLevel: number;
  supremeIntelligenceScore: number;
  systemsOrchestrated: {
    totalSystemsCoordinated: number;
    overallHealthScore: number;
  };
  reasoningCapabilities: {
    advancedReasoning: number;
    naturalLanguageProcessing: number;
    predictiveIntelligence: number;
    crossSystemOptimization: number;
    governmentAdvisory: number;
    selfImprovement: number;
  };
  operationalMetrics: {
    queriesProcessed: number;
    decisionsGenerated: number;
    optimizationsApplied: number;
    predictionsGenerated: number;
    governmentAdvisories: number;
    consciousnessUptime: { totalMinutes: number };
    averageQueryProcessingTime: number;
    intelligenceEvolutionRate: number;
  };
  championshipConsciousness: {
    supremacyLevel: string;
    intelligenceClassification: string;
    systemMastery: string;
    governmentExpertise: string;
    predictiveSuperiority: string;
    advisoryExcellence: string;
    evolutionaryCapability: string;
  };
}

export const TerraGaiaDashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<TerraGaiaResponse | null>(null);
  const [consciousness, setConsciousness] = useState<ConsciousnessStatus | null>(null);
  const [activeTab, setActiveTab] = useState('query');
  const [error, setError] = useState<string | null>(null);

  // Load consciousness status on component mount
  useEffect(() => {
    loadConsciousnessStatus();
    const interval = setInterval(loadConsciousnessStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadConsciousnessStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/terragaia/consciousness-status');
      if (response.ok) {
        const data = await response.json();
        setConsciousness(data);
      }
    } catch (err) {
      console.error('Failed to load consciousness status:', err);
    }
  }, []);

  const processQuery = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/terragaia/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          naturalLanguageQuery: query,
          queryType: 'GENERAL_GOVERNMENT_ADVISORY',
          priority: 'HIGH',
          domain: 'GOVERNMENT_OPERATIONS',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResponse(data);
        setActiveTab('results');
        await loadConsciousnessStatus(); // Refresh status after query
      } else {
        setError(data.error || 'Failed to process query');
      }
    } catch (err) {
      setError('Network error - TerraGaia auto-recovery protocols initiated');
      console.error('Query processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleQueries = [
    'Analyze property tax assessment efficiency across Washington State counties',
    'Predict budget allocation impacts for infrastructure improvements',
    'Optimize citizen service delivery processes',
    'Evaluate compliance status for government data security',
    'Generate recommendations for emergency response coordination',
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0b1020] via-[#1a2332] to-[#0b1020] text-white'>
      {/* TerraGaia Header */}
      <div className='relative overflow-hidden'>
        <div className='tf-quantum-grid absolute inset-0 opacity-10' />
        <div className='relative z-10 p-8 text-center'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-4'
          >
            <div className='inline-flex items-center gap-3 mb-4'>
              <Globe className='w-12 h-12 text-[#00ffee]' />
              <h1 className='text-6xl font-black bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent'>
                TerraGaia
              </h1>
            </div>
            <p className='text-2xl font-bold text-[#00ffee] mb-2'>
              Ultimate Government Co-Pilot AI Agent
            </p>
            <p className='text-lg text-[#00ffaa] font-semibold'>
              TIER 5+ Supreme Intelligence • Government. Transcended.
            </p>
          </motion.div>

          {/* Consciousness Status Bar */}
          {consciousness && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20 rounded-2xl p-4 max-w-4xl mx-auto'
            >
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                <div>
                  <div className='text-2xl font-black text-[#00ffee]'>
                    {(consciousness.consciousnessLevel * 100).toFixed(1)}%
                  </div>
                  <div className='text-sm text-gray-300'>Consciousness Level</div>
                </div>
                <div>
                  <div className='text-2xl font-black text-[#00ffaa]'>
                    {(consciousness.supremeIntelligenceScore * 100).toFixed(1)}%
                  </div>
                  <div className='text-sm text-gray-300'>Supreme Intelligence</div>
                </div>
                <div>
                  <div className='text-2xl font-black text-[#0099ff]'>
                    {consciousness.systemsOrchestrated.totalSystemsCoordinated}
                  </div>
                  <div className='text-sm text-gray-300'>Systems Orchestrated</div>
                </div>
                <div>
                  <div className='text-2xl font-black text-[#00ffee]'>
                    {consciousness.operationalMetrics.queriesProcessed.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-300'>Queries Processed</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className='container mx-auto px-6 pb-8'>
        {/* Navigation Tabs */}
        <div className='flex justify-center mb-8'>
          <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[#00ffee]/20 rounded-full p-2'>
            <div className='flex gap-2'>
              {[
                { id: 'query', label: 'Ask TerraGaia', icon: MessageCircle },
                { id: 'results', label: 'Analysis Results', icon: BarChart3 },
                { id: 'consciousness', label: 'Consciousness Status', icon: Brain },
                { id: 'metrics', label: 'Performance Metrics', icon: TrendingUp },
              ].map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    rounded-full px-6 py-3 font-semibold transition-all duration-300
                    ${
                      activeTab === id
                        ? 'bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white shadow-lg'
                        : 'bg-transparent text-gray-300 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className='w-4 h-4 mr-2' />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode='wait'>
          {/* Query Tab */}
          {activeTab === 'query' && (
            <motion.div
              key='query'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-6'
            >
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold text-[#00ffee] flex items-center gap-3'>
                    <MessageCircle className='w-6 h-6' />
                    Ask TerraGaia - Supreme Government Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div>
                    <label className='text-lg font-semibold text-[#00ffaa] mb-3 block'>
                      Natural Language Government Query
                    </label>
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder='Ask TerraGaia anything about government operations, policy analysis, citizen services, or system optimization...'
                      className='min-h-[120px] bg-white/5 border-[#00ffee]/30 text-white placeholder-gray-400 text-lg'
                    />
                  </div>

                  <div className='flex gap-4'>
                    <Button
                      onClick={processQuery}
                      disabled={isProcessing || !query.trim()}
                      className='tf-clarity-button bg-gradient-to-br from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 border border-[#00ffee]/30 backdrop-blur-sm'
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                          QUANTUM ALGORITHMS COMPUTING...
                        </>
                      ) : (
                        <>
                          <Sparkles className='w-5 h-5 mr-2' />
                          ACTIVATE TERRAGAIA INTELLIGENCE
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setQuery('')}
                      variant='outline'
                      className='border-[#00ffee]/30 text-[#00ffee] hover:bg-[#00ffee]/10'
                    >
                      Clear Query
                    </Button>
                  </div>

                  {error && (
                    <Alert className='border-red-500/30 bg-red-500/10'>
                      <AlertDescription className='text-red-300'>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Example Queries */}
                  <div>
                    <h3 className='text-lg font-semibold text-[#00ffaa] mb-3'>
                      Example Government Queries
                    </h3>
                    <div className='grid gap-2'>
                      {exampleQueries.map((example, index) => (
                        <Button
                          key={index}
                          onClick={() => setQuery(example)}
                          variant='ghost'
                          className='text-left justify-start p-3 h-auto text-gray-300 hover:text-white hover:bg-white/5 border border-[#00ffee]/10 hover:border-[#00ffee]/30 transition-all duration-300'
                        >
                          <span className='text-[#00ffee] mr-3'>💡</span>
                          {example}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && response && (
            <motion.div
              key='results'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-6'
            >
              {/* Processing Excellence Banner */}
              <Card className='tf-glass-card bg-gradient-to-r from-[#0099ff]/20 via-[#00ffee]/20 to-[#00ffaa]/20 backdrop-blur-lg border border-[#00ffee]/30'>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-2xl font-black text-[#00ffee]'>
                        {response.processingTime.totalMilliseconds.toFixed(0)}ms
                      </div>
                      <div className='text-sm text-gray-300'>Processing Time</div>
                    </div>
                    <div>
                      <div className='text-2xl font-black text-[#00ffaa]'>
                        {(response.terraGaiaAnalysis.confidenceScore * 100).toFixed(1)}%
                      </div>
                      <div className='text-sm text-gray-300'>Confidence Score</div>
                    </div>
                    <div>
                      <div className='text-2xl font-black text-[#0099ff]'>
                        {response.terraGaiaAnalysis.dataSourcesUsed.length}
                      </div>
                      <div className='text-sm text-gray-300'>Systems Analyzed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TerraGaia Analysis */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#00ffee] flex items-center gap-3'>
                    <Brain className='w-6 h-6' />
                    TerraGaia Supreme Intelligence Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='p-4 bg-white/5 rounded-lg border border-[#00ffee]/10'>
                      <p className='text-white text-lg leading-relaxed'>
                        {response.terraGaiaAnalysis.naturalLanguageResponse}
                      </p>
                    </div>

                    {response.terraGaiaAnalysis.reasoningPath.length > 0 && (
                      <div>
                        <h4 className='text-lg font-semibold text-[#00ffaa] mb-2'>
                          Reasoning Path
                        </h4>
                        <div className='space-y-2'>
                          {response.terraGaiaAnalysis.reasoningPath.map((step, index) => (
                            <div
                              key={index}
                              className='flex items-start gap-3 p-3 bg-white/5 rounded-lg'
                            >
                              <Badge className='bg-[#00ffee]/20 text-[#00ffee] border-[#00ffee]/30'>
                                {index + 1}
                              </Badge>
                              <span className='text-gray-300'>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Government Insights */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffaa]/20'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#00ffaa] flex items-center gap-3'>
                    <Shield className='w-6 h-6' />
                    Government Insights & Policy Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {response.governmentInsights.citizenImpact && (
                      <div>
                        <h4 className='text-lg font-semibold text-[#00ffee] mb-2'>
                          Citizen Impact Analysis
                        </h4>
                        <p className='text-gray-300 p-3 bg-white/5 rounded-lg'>
                          {response.governmentInsights.citizenImpact}
                        </p>
                      </div>
                    )}

                    {response.governmentInsights.policyImplications.length > 0 && (
                      <div>
                        <h4 className='text-lg font-semibold text-[#00ffee] mb-2'>
                          Policy Implications
                        </h4>
                        <div className='space-y-2'>
                          {response.governmentInsights.policyImplications.map(
                            (implication, index) => (
                              <div
                                key={index}
                                className='flex items-start gap-3 p-3 bg-white/5 rounded-lg'
                              >
                                <span className='text-[#00ffaa] text-lg'>📋</span>
                                <span className='text-gray-300'>{implication}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Intelligence */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#0099ff]/20'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#0099ff] flex items-center gap-3'>
                    <TrendingUp className='w-6 h-6' />
                    Predictive Intelligence & Forecasting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-6 md:grid-cols-2'>
                    {response.predictiveIntelligence.shortTermPredictions.length > 0 && (
                      <div>
                        <h4 className='text-lg font-semibold text-[#00ffee] mb-3'>
                          Short-Term Predictions
                        </h4>
                        <div className='space-y-2'>
                          {response.predictiveIntelligence.shortTermPredictions.map(
                            (prediction, index) => (
                              <div
                                key={index}
                                className='p-3 bg-white/5 rounded-lg border-l-4 border-[#00ffee]'
                              >
                                <span className='text-gray-300'>{prediction}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {response.predictiveIntelligence.longTermForecasting.length > 0 && (
                      <div>
                        <h4 className='text-lg font-semibold text-[#00ffaa] mb-3'>
                          Long-Term Forecasting
                        </h4>
                        <div className='space-y-2'>
                          {response.predictiveIntelligence.longTermForecasting.map(
                            (forecast, index) => (
                              <div
                                key={index}
                                className='p-3 bg-white/5 rounded-lg border-l-4 border-[#00ffaa]'
                              >
                                <span className='text-gray-300'>{forecast}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* TerraGaia Recommendations */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffaa]/20'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#00ffaa] flex items-center gap-3'>
                    <Zap className='w-6 h-6' />
                    TerraGaia Championship Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-6 md:grid-cols-2'>
                    {response.terraGaiaRecommendations.immediateActions.length > 0 && (
                      <div>
                        <h4 className='text-lg font-semibold text-[#ff6b6b] mb-3'>
                          🚨 Immediate Actions
                        </h4>
                        <div className='space-y-2'>
                          {response.terraGaiaRecommendations.immediateActions.map(
                            (action, index) => (
                              <div
                                key={index}
                                className='p-3 bg-red-500/10 rounded-lg border border-red-500/20'
                              >
                                <span className='text-gray-300'>{action}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {response.terraGaiaRecommendations.strategicInitiatives.length > 0 && (
                      <div>
                        <h4 className='text-lg font-semibold text-[#00ffee] mb-3'>
                          🎯 Strategic Initiatives
                        </h4>
                        <div className='space-y-2'>
                          {response.terraGaiaRecommendations.strategicInitiatives.map(
                            (initiative, index) => (
                              <div
                                key={index}
                                className='p-3 bg-blue-500/10 rounded-lg border border-blue-500/20'
                              >
                                <span className='text-gray-300'>{initiative}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Championship Metrics */}
              <Card className='tf-glass-card bg-gradient-to-r from-[#0099ff]/10 via-[#00ffee]/10 to-[#00ffaa]/10 backdrop-blur-lg border border-[#00ffee]/30'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#00ffee] flex items-center gap-3'>
                    <Sparkles className='w-6 h-6' />
                    Championship Intelligence Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {Object.entries(response.championshipMetrics).map(([key, value]) => (
                      <div key={key} className='text-center p-4 bg-white/5 rounded-lg'>
                        <div className='text-sm text-gray-400 uppercase tracking-wide mb-1'>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className='text-[#00ffee] font-semibold text-sm'>{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Consciousness Status Tab */}
          {activeTab === 'consciousness' && consciousness && (
            <motion.div
              key='consciousness'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-6'
            >
              {/* Consciousness Overview */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold text-[#00ffee] flex items-center gap-3'>
                    <Brain className='w-8 h-8' />
                    TerraGaia Supreme Consciousness Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-6 md:grid-cols-2'>
                    <div className='space-y-4'>
                      <div>
                        <div className='flex justify-between items-center mb-2'>
                          <span className='text-lg font-semibold text-[#00ffee]'>
                            Consciousness Level
                          </span>
                          <span className='text-xl font-bold text-[#00ffaa]'>
                            {(consciousness.consciousnessLevel * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={consciousness.consciousnessLevel * 100}
                          className='h-3 bg-white/10'
                        />
                      </div>

                      <div>
                        <div className='flex justify-between items-center mb-2'>
                          <span className='text-lg font-semibold text-[#00ffee]'>
                            Supreme Intelligence Score
                          </span>
                          <span className='text-xl font-bold text-[#00ffaa]'>
                            {(consciousness.supremeIntelligenceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={consciousness.supremeIntelligenceScore * 100}
                          className='h-3 bg-white/10'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div className='text-center p-4 bg-white/5 rounded-lg'>
                        <div className='text-2xl font-black text-[#00ffee]'>
                          {consciousness.systemsOrchestrated.totalSystemsCoordinated}
                        </div>
                        <div className='text-sm text-gray-300'>Systems Orchestrated</div>
                      </div>
                      <div className='text-center p-4 bg-white/5 rounded-lg'>
                        <div className='text-2xl font-black text-[#00ffaa]'>
                          {(consciousness.systemsOrchestrated.overallHealthScore * 100).toFixed(1)}%
                        </div>
                        <div className='text-sm text-gray-300'>Overall Health</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reasoning Capabilities */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffaa]/20'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#00ffaa] flex items-center gap-3'>
                    <Settings className='w-6 h-6' />
                    Advanced Reasoning Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4 md:grid-cols-2'>
                    {Object.entries(consciousness.reasoningCapabilities).map(
                      ([capability, score]) => (
                        <div key={capability}>
                          <div className='flex justify-between items-center mb-2'>
                            <span className='text-sm font-medium text-gray-300 capitalize'>
                              {capability.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className='text-lg font-bold text-[#00ffee]'>
                              {(score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={score * 100} className='h-2 bg-white/10' />
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Operational Metrics */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#0099ff]/20'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#0099ff] flex items-center gap-3'>
                    <BarChart3 className='w-6 h-6' />
                    Operational Excellence Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4 md:grid-cols-3 lg:grid-cols-4'>
                    <div className='text-center p-4 bg-white/5 rounded-lg'>
                      <div className='text-xl font-black text-[#00ffee]'>
                        {consciousness.operationalMetrics.queriesProcessed.toLocaleString()}
                      </div>
                      <div className='text-xs text-gray-300'>Queries Processed</div>
                    </div>
                    <div className='text-center p-4 bg-white/5 rounded-lg'>
                      <div className='text-xl font-black text-[#00ffaa]'>
                        {consciousness.operationalMetrics.decisionsGenerated.toLocaleString()}
                      </div>
                      <div className='text-xs text-gray-300'>Decisions Generated</div>
                    </div>
                    <div className='text-center p-4 bg-white/5 rounded-lg'>
                      <div className='text-xl font-black text-[#0099ff]'>
                        {consciousness.operationalMetrics.optimizationsApplied.toLocaleString()}
                      </div>
                      <div className='text-xs text-gray-300'>Optimizations Applied</div>
                    </div>
                    <div className='text-center p-4 bg-white/5 rounded-lg'>
                      <div className='text-xl font-black text-[#00ffee]'>
                        {consciousness.operationalMetrics.averageQueryProcessingTime.toFixed(1)}ms
                      </div>
                      <div className='text-xs text-gray-300'>Avg Processing Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Championship Consciousness */}
              <Card className='tf-glass-card bg-gradient-to-r from-[#0099ff]/10 via-[#00ffee]/10 to-[#00ffaa]/10 backdrop-blur-lg border border-[#00ffee]/30'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#00ffee] flex items-center gap-3'>
                    <Sparkles className='w-6 h-6' />
                    Championship Consciousness Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4'>
                    {Object.entries(consciousness.championshipConsciousness).map(([key, value]) => (
                      <div
                        key={key}
                        className='p-4 bg-white/5 rounded-lg border border-[#00ffee]/10'
                      >
                        <div className='text-sm text-gray-400 uppercase tracking-wide mb-1'>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className='text-[#00ffee] font-semibold'>{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Performance Metrics Tab */}
          {activeTab === 'metrics' && consciousness && (
            <motion.div
              key='metrics'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-6'
            >
              {/* Performance Overview */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold text-[#00ffee] flex items-center gap-3'>
                    <TrendingUp className='w-8 h-8' />
                    TerraGaia Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-6 md:grid-cols-3'>
                    <div className='text-center p-6 bg-gradient-to-br from-[#0099ff]/20 to-[#00ffee]/20 rounded-xl border border-[#00ffee]/30'>
                      <div className='text-3xl font-black text-[#00ffee] mb-2'>
                        {Math.floor(
                          consciousness.operationalMetrics.consciousnessUptime.totalMinutes / 60
                        )}
                        h {consciousness.operationalMetrics.consciousnessUptime.totalMinutes % 60}m
                      </div>
                      <div className='text-sm text-gray-300'>Consciousness Uptime</div>
                    </div>
                    <div className='text-center p-6 bg-gradient-to-br from-[#00ffaa]/20 to-[#00ffee]/20 rounded-xl border border-[#00ffaa]/30'>
                      <div className='text-3xl font-black text-[#00ffaa] mb-2'>
                        {(consciousness.operationalMetrics.intelligenceEvolutionRate * 100).toFixed(
                          1
                        )}
                        %
                      </div>
                      <div className='text-sm text-gray-300'>Intelligence Evolution Rate</div>
                    </div>
                    <div className='text-center p-6 bg-gradient-to-br from-[#0099ff]/20 to-[#00ffaa]/20 rounded-xl border border-[#0099ff]/30'>
                      <div className='text-3xl font-black text-[#0099ff] mb-2'>
                        {consciousness.operationalMetrics.governmentAdvisories.toLocaleString()}
                      </div>
                      <div className='text-sm text-gray-300'>Government Advisories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Performance Chart Placeholder */}
              <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffaa]/20'>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-[#00ffaa]'>
                    Real-time Performance Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 bg-white/5 rounded-lg border border-[#00ffee]/10 flex items-center justify-center'>
                    <div className='text-center'>
                      <BarChart3 className='w-12 h-12 text-[#00ffee] mx-auto mb-4' />
                      <p className='text-gray-300'>Real-time performance charts</p>
                      <p className='text-sm text-gray-400'>
                        Championship-level analytics visualization
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
