import {useState, useEffect} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Progress} from "@/components/ui/progress";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Separator} from "@/components/ui/separator";
import {Brain, TrendingUp, Warning, Lightbulb, Target, Clock, BarChart3, Zap} from '@mui/icons-material';
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "@/hooks/use-toast";

interface AIInsight {id: string;
  type: 'prediction' | 'recommendation' | 'warning' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  actionable: boolean;
  suggestedActions: string[];
  dataPoints: {
    historical: any[];
    current: any;
    projected: any;};
  metadata: {model: string;
    analysisDate: string;
    expiresAt: string;
    tags: string[];};
}

interface MarketTrend {period: string;
  avgValue: number;
  volatility: number;
  trend: 'upward' | 'downward' | 'stable';
  confidence: number;}

interface DashboardData {insights: AIInsight[];
  marketTrends: MarketTrend[];
  summary: {
    totalInsights: number;
    highImpactInsights: number;
    avgConfidence: number;
    generatedAt: string;};
}

interface PredictionRequest {entityType: 'audit' | 'property' | 'market' | 'risk';
  entityId?: number;
  timeframe: '1week' | '1month' | '3months' | '6months' | '1year';
  predictionType: 'completion_time' | 'risk_score' | 'market_value' | 'compliance_rating';
  contextData?: any;}

const getInsightIcon = (type: string) =>{switch (type) {
    case 'prediction':
      return<Brain className="h-4 w-4" />;
    case 'recommendation':
      return <Lightbulb className="h-4 w-4" />;
    case 'warning':
      return <Warning className="h-4 w-4" />;
    case 'opportunity':
      return <Target className="h-4 w-4" />;
    default:
      return <Brain className="h-4 w-4" />;}
};

const getImpactColor = (impact: string) =>{switch (impact) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';}
};

const getTrendIcon = (trend: string) => {switch (trend) {
    case 'upward':
      return<TrendingUp className="h-4 w-4 text-green-500" />;
    case 'downward':
      return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    case 'stable':
      return <BarChart3 className="h-4 w-4 text-blue-500" />;
    default:
      return <BarChart3 className="h-4 w-4" />;}
};

export function AIInsightsDashboard() {const [selectedTimeframe, setSelectedTimeframe] = useState<string>('6months');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('market');
  const queryClient = useQueryClient();

  // Fetch dashboard insights
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError} = useQuery({queryKey: ['/api/ai-predictions/insights/dashboard'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes});

  // Fetch market trends
  const {data: marketTrendsData, isLoading: trendsLoading} = useQuery({queryKey: ['/api/ai-predictions/market-trends'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes});

  // Generate custom prediction mutation
  const generatePredictionMutation = useMutation({mutationFn: async (request: PredictionRequest) =>{
      const response = await fetch('/api/ai-predictions/prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {throw new Error('Failed to generate prediction');}
      
      return response.json();
    },
    onSuccess: () => {toast({
        title: "Prediction Generated",
        description: "AI prediction has been successfully generated."});
      queryClient.invalidateQueries({queryKey: ['/api/ai-predictions/insights/dashboard']});
    },
    onError: (error: Error) => {toast({
        title: "Prediction Failed",
        description: error.message,
        variant: "destructive"});
    },
  });

  // Generate batch predictions mutation
  const generateBatchPredictionsMutation = useMutation({mutationFn: async (requests: PredictionRequest[]) => {
      const response = await fetch('/api/ai-predictions/predictions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({requests}),
      });
      
      if (!response.ok) {throw new Error('Failed to generate batch predictions');}
      
      return response.json();
    },
    onSuccess: () => {toast({
        title: "Batch Predictions Generated",
        description: "Multiple AI predictions have been successfully generated."});
      queryClient.invalidateQueries({queryKey: ['/api/ai-predictions/insights/dashboard']});
    },
    onError: (error: Error) => {toast({
        title: "Batch Predictions Failed",
        description: error.message,
        variant: "destructive"});
    },
  });

  const handleGeneratePrediction = () => {const request: PredictionRequest = {
      entityType: selectedEntityType as any,
      timeframe: selectedTimeframe as any,
      predictionType: selectedEntityType === 'audit' ? 'completion_time' : 'market_value'};

    generatePredictionMutation.mutate(request);
  };

  const handleGenerateBatchPredictions = () => {const requests: PredictionRequest[] = [
      {
        entityType: 'market',
        predictionType: 'market_value',
        timeframe: '6months'},
      {entityType: 'audit',
        predictionType: 'completion_time',
        timeframe: '1month'},
      {entityType: 'property',
        predictionType: 'market_value',
        timeframe: '3months'}
    ];

    generateBatchPredictionsMutation.mutate(requests);
  };

  const insights: AIInsight[] = dashboardData?.data?.insights || [];
  const marketTrends: MarketTrend[] = dashboardData?.data?.marketTrends || [];
  const summary = dashboardData?.data?.summary || {totalInsights: 0,
    highImpactInsights: 0,
    avgConfidence: 0,
    generatedAt: new Date().toISOString()};

  if (dashboardError) {return (<div className="p-6"><Alert variant="destructive"><Warning className="h-4 w-4" /><AlertDescription>Failed to load AI insights. Please try refreshing the page.</AlertDescription></Alert></div>);}

  return (<div className="p-6 space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 min-h-screen">{/* Header */}<div className="flex items-center justify-between"><div><><h1 className="text-4xl font-bold font-orbitron text-white mb-3 tracking-wide">AI Intelligence Center</h1><p
</>className="text-terrafusion-cyan/80 text-lg font-medium">
            Advanced predictive analytics and AI-powered insights for Terrafusion Enterprise</p></div><div className="flex items-center gap-3"><Button
            onClick={handleGeneratePrediction}
            disabled={generatePredictionMutation.isPending}
            className="bg-gradient-to-r from-terrafusion-cyan to-blue-500 hover:from-terrafusion-cyan/80 hover:to-blue-600 text-white font-semibold px-6 py-2"
          ><><Brain className="h-4 w-4 mr-2" />Generate Prediction</Button><Button
</>

            onClick={handleGenerateBatchPredictions}
            disabled={generateBatchPredictionsMutation.isPending}
            className="border-terrafusion-cyan/50 text-terrafusion-cyan hover:bg-terrafusion-cyan/10 font-semibold px-6 py-2"
            variant="outline"
          ><Zap className="h-4 w-4 mr-2" />Batch Analysis</Button></div></div>{/* Summary Cards */}<div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Card className="bg-gradient-to-r from-terrafusion-cyan to-blue-500 text-white border-terrafusion-cyan/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium font-orbitron">Total Insights</CardTitle></CardHeader><CardContent><><div className="text-2xl font-bold font-orbitron">{summary.totalInsights}</div><p
</>
className="text-xs opacity-80">AI-generated predictions</p></CardContent></Card><Card className="bg-gradient-to-r from-purple-500 to-terrafusion-cyan text-white border-purple-400/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium font-orbitron">High Impact</CardTitle></CardHeader><CardContent><><div className="text-2xl font-bold font-orbitron">{summary.highImpactInsights}</div><p
</>
className="text-xs opacity-80">Critical insights</p></CardContent></Card><Card className="bg-gradient-to-r from-green-500 to-terrafusion-cyan text-white border-green-400/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium font-orbitron">Avg Confidence</CardTitle></CardHeader><CardContent><><div className="text-2xl font-bold font-orbitron">{summary.avgConfidence}%</div><p
</>
className="text-xs opacity-80">Prediction accuracy</p></CardContent></Card><Card className="bg-gradient-to-r from-orange-500 to-terrafusion-cyan text-white border-orange-400/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium font-orbitron">Market Trends</CardTitle></CardHeader><CardContent><><div className="text-2xl font-bold font-orbitron">{marketTrends.length}</div><p
</>
className="text-xs opacity-80">Active analyses</p></CardContent></Card></div>{/* Main Content */}<Tabs defaultValue="insights" className="space-y-6"><TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-terrafusion-cyan/20"><><TabsTrigger value="insights" className="data-[state=active]:bg-terrafusion-cyan data-[state=active]:text-white font-semibold">AI Insights</TabsTrigger><TabsTrigger
</>
value="trends" className="data-[state=active]:bg-terrafusion-cyan data-[state=active]:text-white font-semibold">Market Trends</TabsTrigger><TabsTrigger value="predictions" className="data-[state=active]:bg-terrafusion-cyan data-[state=active]:text-white font-semibold">Custom Predictions</TabsTrigger></TabsList>{/* AI Insights Tab */}<TabsContent value="insights" className="space-y-6">{dashboardLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => (<Card key={i} className="h-64 animate-pulse"><CardContent className="p-6"><div className="space-y-3"><><div className="h-4 bg-gray-200 rounded w-3/4"></div><div
</>
className="h-3 bg-gray-200 rounded w-1/2"></div><div className="h-20 bg-gray-200 rounded"></div></div></CardContent></Card>))}</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{insights.map((insight) => (<Card key={insight.id} className="bg-slate-800/50 border-terrafusion-cyan/20 hover:border-terrafusion-cyan/40 hover:shadow-lg hover:shadow-terrafusion-cyan/10 transition-all duration-300"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><><div className="text-terrafusion-cyan">{getInsightIcon(insight.type)}</div><CardTitle
</>
className="text-lg text-white font-semibold">{insight.title}</CardTitle></div><Badge variant={getImpactColor(insight.impact) as any} className="bg-terrafusion-cyan/20 text-terrafusion-cyan border-terrafusion-cyan/30">{insight.impact}</Badge></div><CardDescription className="text-sm text-gray-300">{insight.description}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><><span className="text-sm text-gray-400">Confidence</span><div
</>
className="flex items-center gap-2"><Progress value={insight.confidence} className="w-20 bg-slate-700" /><span className="text-sm font-medium text-terrafusion-cyan">{insight.confidence}%</span></div></div><div><div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-terrafusion-cyan" /><span className="text-sm font-medium text-white">Timeframe: {insight.timeframe}</span></div></div>{insight.suggestedActions.length > 0 && (<div><><h4 className="text-sm font-medium mb-2 text-white">Suggested Actions:</h4><ul
</>className="space-y-1">
                          {insight.suggestedActions.slice(0, 3).map((action /* , index */) => (<li key={index} className="text-xs text-gray-300 flex items-start gap-1"><span className="text-terrafusion-cyan mt-1">•</span>{action}</li>))}</ul></div>)}<Separator className="bg-terrafusion-cyan/20" /><div className="flex items-center justify-between text-xs text-gray-400"><><span>{insight.metadata.model}</span><span
</></>>{new Date(insight.metadata.analysisDate).toLocaleDateString()}</span></div></CardContent></Card>))}</div>)}

          {insights.length === 0 && !dashboardLoading && (<Card className="p-8 text-center bg-slate-800/50 border-terrafusion-cyan/20"><Brain className="h-12 w-12 mx-auto text-terrafusion-cyan mb-4" /><><h3 className="text-lg font-medium mb-2 text-white font-orbitron">No AI Insights Available</h3><p
</>className="text-gray-300 mb-4">
                Generate your first AI prediction to see intelligent insights here.</p><Button onClick={handleGenerateBatchPredictions} className="bg-gradient-to-r from-terrafusion-cyan to-blue-500 hover:from-terrafusion-cyan/80 hover:to-blue-600">Generate Insights</Button></Card>)}</TabsContent>{/* Market Trends Tab */}<TabsContent value="trends" className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{marketTrends.map((trend /* , index */) => (<Card key={index} className="hover:shadow-lg transition-shadow duration-200"><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-lg capitalize">{trend.period}</CardTitle>{getTrendIcon(trend.trend)}</div></CardHeader><CardContent className="space-y-4"><div><><div className="text-2xl font-bold text-blue-600">${trend.avgValue.toLocaleString()}</div><p
</>
className="text-sm text-gray-600 dark:text-gray-400">Average Value</p></div><div className="flex items-center justify-between"><><span className="text-sm text-gray-600 dark:text-gray-400">Volatility</span><span
</>
className="text-sm font-medium">{(trend.volatility * 100).toFixed(1)}%</span></div><div className="flex items-center justify-between"><><span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span><div
</>
className="flex items-center gap-2"><Progress value={trend.confidence} className="w-16" /><span className="text-sm font-medium">{trend.confidence}%</span></div></div><Badge 
                    variant={trend.trend === 'upward' ? 'default' : trend.trend === 'downward' ? 'destructive' : 'secondary'}
                    className="w-full justify-center"
                  >{trend.trend.toUpperCase()} TREND</Badge></CardContent></Card>))}</div></TabsContent>{/* Custom Predictions Tab */}<TabsContent value="predictions" className="space-y-6"><Card><CardHeader><><CardTitle>Generate Custom Prediction</CardTitle><CardDescription
</></>>Create tailored AI predictions for specific entities and timeframes</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><><label className="text-sm font-medium mb-2 block">Entity Type</label><select
</>

                    value={selectedEntityType}
                    onChange={(e) => setSelectedEntityType(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                  ><><option value="market">Market Analysis</option><option
</>
value="property">Property Valuation</option><option value="audit">Audit Completion</option></select></div><div><><label className="text-sm font-medium mb-2 block">Timeframe</label><select
</>

                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                  ><><option value="1week">1 Week</option><option
</>
value="1month">1 Month</option><><option value="3months">3 Months</option><option
</>
value="6months">6 Months</option><option value="1year">1 Year</option></select></div></div><div className="flex gap-3"><><Button 
                  onClick={handleGeneratePrediction}
                  disabled={generatePredictionMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >{generatePredictionMutation.isPending ? 'Generating...' : 'Generate Prediction'}</Button><Button
</>onClick={handleGenerateBatchPredictions}
                  disabled={generateBatchPredictionsMutation.isPending}
                  variant="outline"
                >
                  {generateBatchPredictionsMutation.isPending ? 'Generating...' : 'Generate Comprehensive Analysis'}</Button></div></CardContent></Card></TabsContent></Tabs></div>
  );
}