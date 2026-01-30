import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, TrendingUp, Target, Cpu, Network, Activity, Gauge  } from '@mui/icons-material';
import { apiRequest } from '@/lib/queryClient';

interface NeuralStatus {
  network: {
    totalNodes: number;
    totalCounties: number;
    globalConfidence: number;
    lastLearningEvent: string | null;
  };
  engine: {
    cacheSize: number;
    automationThreshold: number;
    lastCacheClean: string;
    quantumReadiness: boolean;
  };
}

interface CountyInsights {
  totalNodes: number;
  approvalRate: number;
  topDenialReasons: string[];
  processingEfficiency: number;
  neuralMaturity: number;
  recommendations: string[];
}

interface QuantumDecision {
  recommendation: string;
  confidence: number;
  reasoning: string[];
  riskFactors: string[];
  complianceScore: number;
  processingTime: number;
  automationLevel: string;
  processingPath: string;
  efficiency: number;
}

interface TeslaAutomation {
  autoApprovalCandidates: string[];
  instantDecisions: Record<string, any>;
  workflowOptimizations: string[];
  staffingRecommendations: string[];
  systemEfficiencyScore: number;
}

export default function NeuralPermitDashboard() {
  const [selectedCounty, setSelectedCounty] = useState('benton');
  const [testPermitData, setTestPermitData] = useState({
    type: 'residential',
    squareFootage: 2000,
    estimatedValue: 150000,
    hasEnvironmentalImpact: false,
    zoningCompliant: true,
    documentationComplete: true
  });

  const queryClient = useQueryClient();

  const { data: neuralStatus } = useQuery<NeuralStatus>({
    queryKey: ['/api/neural/status'],
    refetchInterval: 30000
  });

  const { data: countyInsights } = useQuery<CountyInsights>({
    queryKey: ['/api/neural/insights', selectedCounty],
    enabled: !!selectedCounty
  });

  const { data: teslaAutomation } = useQuery<TeslaAutomation>({
    queryKey: ['/api/quantum/automation', selectedCounty],
    enabled: !!selectedCounty
  });

  const quantumDecisionMutation = useMutation({
    mutationFn: async (data: { permitData: any; countyId: string }) => {
      return await apiRequest({
        method: 'POST',
        url: '/api/neural/decision',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/neural/status'] });
    }
  });

  const handleQuantumDecision = () => {
    quantumDecisionMutation.mutate({
      permitData: testPermitData,
      countyId: selectedCounty
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAutomationBadge = (level: string) => {
    const colors = {
      instant: 'bg-green-100 text-green-800',
      assisted: 'bg-yellow-100 text-yellow-800',
      manual: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Neural Permit Network
          </h1>
          <p className="text-muted-foreground mt-2">
            Tesla-level automation with quantum decision processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {neuralStatus?.engine.quantumReadiness && (
            <Badge className="bg-green-100 text-green-800">
              <Zap className="h-3 w-3 mr-1" />
              Quantum Ready
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Neural Nodes</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{neuralStatus?.network.totalNodes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {neuralStatus?.network.totalCounties || 0} counties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConfidenceColor(neuralStatus?.network.globalConfidence || 0)}`}>
              {((neuralStatus?.network.globalConfidence || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Decision accuracy score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Efficiency</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{neuralStatus?.engine.cacheSize || 0}</div>
            <p className="text-xs text-muted-foreground">
              Cached quantum decisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Level</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((neuralStatus?.engine.automationThreshold || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-approval threshold
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedCounty} onValueChange={setSelectedCounty} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="benton">Benton County</TabsTrigger>
          <TabsTrigger value="washington">Washington County</TabsTrigger>
          <TabsTrigger value="multnomah">Multnomah County</TabsTrigger>
          <TabsTrigger value="clackamas">Clackamas County</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCounty} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  County Neural Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Neural Maturity</span>
                    <span className="text-sm text-muted-foreground">
                      {((countyInsights?.neuralMaturity || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(countyInsights?.neuralMaturity || 0) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Approval Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {((countyInsights?.approvalRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(countyInsights?.approvalRate || 0) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Processing Efficiency</span>
                    <span className="text-sm text-muted-foreground">
                      {((countyInsights?.processingEfficiency || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(countyInsights?.processingEfficiency || 0) * 100} />
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
                  <div className="space-y-1">
                    {countyInsights?.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Tesla-Level Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">System Efficiency</span>
                    <span className="text-sm text-muted-foreground">
                      {((teslaAutomation?.systemEfficiencyScore || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(teslaAutomation?.systemEfficiencyScore || 0) * 100} />
                </div>

                <div
>
                  <h4 className="text-sm font-medium mb-2">Auto-Approval Candidates</h4>
                  <div className="space-y-1">
                    {teslaAutomation?.autoApprovalCandidates.map((candidate, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {candidate}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Workflow Optimizations</h4>
                  <div className="space-y-1">
                    {teslaAutomation?.workflowOptimizations.slice(0, 3).map((opt, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Quantum Decision Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Permit Type</label>
                  <select value={testPermitData.type}
                    onChange={(e) => setTestPermitData({...testPermitData, type: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Square Footage</label>
                  <input type="number"
                    value={testPermitData.squareFootage}
                    onChange={(e) => setTestPermitData({...testPermitData, squareFootage: parseInt(e.target.value)})}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Estimated Value</label>
                  <input type="number"
                    value={testPermitData.estimatedValue}
                    onChange={(e) => setTestPermitData({...testPermitData, estimatedValue: parseInt(e.target.value)})}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testPermitData.zoningCompliant}
                    onChange={(e) => setTestPermitData({...testPermitData, zoningCompliant: e.target.checked})}
                  />
                  <span className="text-sm">Zoning Compliant</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testPermitData.documentationComplete}
                    onChange={(e) => setTestPermitData({...testPermitData, documentationComplete: e.target.checked})}
                  />
                  <span className="text-sm">Documentation Complete</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testPermitData.hasEnvironmentalImpact}
                    onChange={(e) => setTestPermitData({...testPermitData, hasEnvironmentalImpact: e.target.checked})}
                  />
                  <span className="text-sm">Environmental Impact</span>
                </label>
              </div>

              <Button 
                onClick={handleQuantumDecision}
                disabled={quantumDecisionMutation.isPending}
                className="w-full"
              >
                {quantumDecisionMutation.isPending ? 'Processing...' : 'Generate Quantum Decision'}
              </Button>

              {quantumDecisionMutation.data && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Quantum Decision Result</h4>
                    <Badge className={getAutomationBadge(quantumDecisionMutation.data.automationLevel)}>
                      {quantumDecisionMutation.data.automationLevel}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Recommendation</span>
                      <div className="font-medium capitalize">{quantumDecisionMutation.data.decision.recommendation}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <div className={`font-medium ${getConfidenceColor(quantumDecisionMutation.data.decision.confidence)}`}>
                        {(quantumDecisionMutation.data.decision.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Processing Time</span>
                      <div className="font-medium">{quantumDecisionMutation.data.decision.processingTime}ms</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">AI Reasoning</h5>
                    {quantumDecisionMutation.data.decision.reasoning.map((reason: string, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground bg-background p-2 rounded">
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}