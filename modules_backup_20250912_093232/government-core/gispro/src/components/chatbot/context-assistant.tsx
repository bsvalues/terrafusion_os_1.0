import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Progress} from '@/components/ui/progress';
import {Separator} from '@/components/ui/separator';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Brain,
  Lightbulb,
  TrendingUp,
  Search,
  FileText,
  BarChart3,
  Map,
  Calculator,
  Target,
  Zap,
  Eye,
  Download,
  Share,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  MessageSquare,
  Bot,
  User,} from '@mui/icons-material';

interface ContextData {analysisType?: string;
  dataPoints?: number;
  timeRange?: string;
  location?: string;
  parameters?: Record<string, any>;
  results?: any[];
  metadata?: Record<string, any>;}

interface Insight {id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'correlation' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  timestamp: Date;
  actions?: string[];
  relatedData?: any;}

interface ContextAssistantProps {context: ContextData;
  visible?: boolean;
  onInsightSelect?: (insight: Insight) => void;
  onActionRequest?: (action: string, data?: any) => void;
  className?: string;}

const ContextAssistant: React.FC<ContextAssistantProps> = ({context,
  visible = true,
  onInsightSelect,
  onActionRequest,
  className = '',}) => {const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      content: string;
      role: 'user' | 'assistant';
      timestamp: Date;}>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const analysisRef = useRef<boolean>(false);

  // Context-aware suggestions
  const contextSuggestions = [
    'What patterns do you see in this data?',
    'Are there any anomalies I should investigate?',
    'What are the key trends over time?',
    'How reliable are these results?',
    'What should I focus on next?',
    'Generate a summary report',
    'Compare with historical data',
    'Identify correlations',
  ];

  // Initialize assistant
  useEffect(() =>{if (context && !analysisRef.current) {
      analysisRef.current = true;
      performContextAnalysis();}
  }, [context]);

  // Perform context analysis
  const performContextAnalysis = useCallback(async () => {setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate AI analysis process
    const steps = [
      { progress: 15, message: 'Analyzing data patterns...'},
      {progress: 35, message: 'Detecting anomalies...'},
      {progress: 55, message: 'Identifying trends...'},
      {progress: 75, message: 'Calculating correlations...'},
      {progress: 90, message: 'Generating insights...'},
      {progress: 100, message: 'Analysis complete!'},
    ];

    for (const step of steps) {await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(step.progress);}

    // Generate insights based on context
    const generatedInsights = generateContextInsights(context);
    setInsights(generatedInsights);
    setSuggestions(contextSuggestions);

    // Add welcome message
    setChatMessages([
      {
        id: 'welcome-1',
        content: `I've analyzed your ${context.analysisType || 'geospatial'} data and found ${generatedInsights.length} key insights. I can help you understand patterns, identify anomalies, and suggest next steps. What would you like to explore?`,
        role: 'assistant',
        timestamp: new Date(),
      },
    ]);

    setIsAnalyzing(false);
  }, [context]);

  // Generate insights based on context
  const generateContextInsights = (contextData: ContextData): Insight[] => {
    const insights: Insight[] = [];
    const now = new Date();

    // Pattern insights
    insights.push({
      id: 'pattern-1',
      type: 'pattern',
      title: 'Spatial Clustering Detected',
      description: `Identified 3 distinct clusters in your ${contextData.analysisType || 'spatial'} data. The largest cluster contains 45% of data points and shows strong internal correlation (r = 0.78).`,
      confidence: 87,
      impact: 'high',
      category: 'Spatial Analysis',
      timestamp: now,
      actions: ['View cluster details', 'Export cluster data', 'Analyze cluster characteristics'],
      relatedData: {clusters: 3, correlation: 0.78},
    });

    // Trend insights
    insights.push({id: 'trend-1',
      type: 'trend',
      title: 'Increasing Temporal Trend',
      description: `Data shows a consistent upward trend over the analyzed period with a 12% increase annually. The trend is statistically significant (p< 0.01).`,
      confidence: 92,
      impact: 'medium',
      category: 'Temporal Analysis',
      timestamp: now,
      actions: ['Forecast future values', 'Identify trend drivers', 'Compare with benchmarks'],
      relatedData: { trendSlope: 0.12, pValue: 0.008},
    });

    // Anomaly insights
    insights.push({id: 'anomaly-1',
      type: 'anomaly',
      title: 'Outliers in Northwest Region',
      description: `Detected 7 statistical outliers in the northwest region that deviate significantly from expected values. These may require further investigation.`,
      confidence: 75,
      impact: 'medium',
      category: 'Quality Control',
      timestamp: now,
      actions: ['Investigate outliers', 'Flag for review', 'Remove from analysis'],
      relatedData: { outlierCount: 7, region: 'northwest'},
    });

    // Correlation insights
    insights.push({id: 'correlation-1',
      type: 'correlation',
      title: 'Strong Environmental Correlation',
      description: `Found strong positive correlation (r = 0.82) between your measurements and elevation data. This suggests topographic factors significantly influence the results.`,
      confidence: 89,
      impact: 'high',
      category: 'Environmental Factors',
      timestamp: now,
      actions: [
        'Explore elevation relationship',
        'Control for topography',
        'Add terrain variables',
      ],
      relatedData: { correlation: 0.82, factor: 'elevation'},
    });

    // Recommendation insights
    insights.push({id: 'recommendation-1',
      type: 'recommendation',
      title: 'Improve Sampling Coverage',
      description: `Analysis suggests gaps in spatial coverage, particularly in the southern regions. Adding 15-20 sample points could improve analysis reliability by 23%.`,
      confidence: 80,
      impact: 'medium',
      category: 'Data Quality',
      timestamp: now,
      actions: ['Identify optimal sample locations', 'Plan field collection', 'Estimate costs'],
      relatedData: { recommendedPoints: 18, improvementPercent: 23},
    });

    return insights;
  };

  // Handle chat message
  const handleChatMessage = async (message: string) =>{
    if (!message.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      content: message,
      role: 'user' as const,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate AI response
    setTimeout(
      () => {
        const response = generateContextualResponse(message, context, insights);
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          content: response,
          role: 'assistant' as const,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      },
      1000 + Math.random() * 1500
    );
  };

  // Generate contextual response
  const generateContextualResponse = (
    query: string,
    contextData: ContextData,
    availableInsights: Insight[]
  ): string => {const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('pattern')) {
      return "Based on your data, I've identified several key patterns: 1) Spatial clustering with 3 distinct groups, 2) Strong correlation with elevation (r=0.82), and 3) Seasonal variation with peaks in Q2/Q3. The clustering pattern is particularly interesting as it suggests underlying geographic or environmental drivers.";}

    if (lowerQuery.includes('anomal') || lowerQuery.includes('outlier')) {return 'I found 7 statistical outliers in your dataset, primarily concentrated in the northwest region. These points deviate significantly from the expected pattern and may indicate: data collection errors, unique local conditions, or genuinely exceptional cases that warrant investigation.';}

    if (lowerQuery.includes('trend')) {return 'Your data shows a clear upward trend with a 12% annual increase. This trend is statistically significant (p< 0.01) and appears consistent across most spatial regions. The trend strength suggests systematic change rather than random variation.';}

    if (lowerQuery.includes('recommend') || lowerQuery.includes('next')) {return 'Based on my analysis, I recommend: 1) Investigate the 7 outliers in the northwest region, 2) Add 15-20 sample points in the southern area to improve coverage, 3) Explore the elevation correlation further, and 4) Consider temporal controls in your model. These steps could improve analysis reliability by ~23%.';}

    if (lowerQuery.includes('report') || lowerQuery.includes('summary')) {
      return `Analysis Summary: Your ${contextData.analysisType || 'geospatial'} analysis covers ${contextData.dataPoints || 'multiple'} data points. Key findings include spatial clustering (3 groups), temporal trends (+12% annually), environmental correlations (elevation r=0.82), and 7 outliers requiring attention. Overall data quality is good with 92% confidence in main patterns.`;
    }

    // Default response
    return "I'm analyzing your specific question in the context of your current data. Based on what I see, there are several interesting aspects to explore. Could you be more specific about what you'd like to focus on - patterns, trends, anomalies, or recommendations?";
  };

  // Handle insight selection
  const handleInsightClick = (insight: Insight) =>{setSelectedInsight(insight);
    if (onInsightSelect) {
      onInsightSelect(insight);}
  };

  // Handle action request
  const handleActionClick = (action: string, insight?: Insight) => {if (onActionRequest) {
      onActionRequest(action, insight);}
  };

  // Get impact color
  const getImpactColor = (impact: Insight['impact']) => {switch (impact) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';}
  };

  // Get type icon
  const getTypeIcon = (type: Insight['type']) => {switch (type) {
      case 'pattern':
        return<Target className="h-4 w-4" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4" />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" />;
      case 'correlation':
        return <BarChart3 className="h-4 w-4" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;}
  };

  if (!visible) return null;

  return (
    <Card className={`h-full flex flex-col ${className}`}><CardHeader className="flex-shrink-0"><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Context Assistant
          {insights.length > 0 &&<Badge variant="outline">{insights.length} insights</Badge>}
        </CardTitle>{isAnalyzing && (<div className="space-y-2"><Progress value={analysisProgress} /><p className="text-sm text-muted-foreground">Analyzing your data...</p></div>)}</CardHeader><CardContent className="flex-1 flex flex-col min-h-0"><Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col"><TabsList className="grid w-full grid-cols-3 mb-4"><TabsTrigger value="insights">Insights</TabsTrigger><TabsTrigger value="chat">Chat</TabsTrigger><TabsTrigger value="actions">Actions</TabsTrigger></TabsList><TabsContent value="insights" className="flex-1 flex flex-col min-h-0"><ScrollArea className="flex-1"><div className="space-y-3">{insights.map(insight => (<Card
                    key={insight.id}
                    className={`cursor-pointer transition-colors hover:shadow-md ${
                      selectedInsight?.id === insight.id ? 'border-blue-500 bg-blue-50' : ''}`}
                    onClick={() => handleInsightClick(insight)}
                  ><CardContent className="p-4"><div className="flex items-start gap-3"><div className="flex-shrink-0 mt-1">{getTypeIcon(insight.type)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="font-medium text-sm">{insight.title}</h3><Badge
                              variant="outline"
                              className={`text-xs ${getImpactColor(insight.impact)}`}
                            >{insight.impact}</Badge></div><p className="text-sm text-muted-foreground mb-2">{insight.description}</p><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Badge variant="secondary" className="text-xs">{insight.category}</Badge><span className="text-xs text-muted-foreground">{insight.confidence}% confidence</span></div><Progress value={insight.confidence} className="w-16 h-1" /></div>{insight.actions && insight.actions.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{insight.actions.slice(0, 2).map((action, index) => (<Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs"
                                  onClick={e =>{
                                    e.stopPropagation();
                                    handleActionClick(action, insight);}}
                                >
                                  {action}</Button>))}</div>)}</div></div></CardContent></Card>))}

                {insights.length === 0 && !isAnalyzing && (<div className="text-center py-8"><Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Insights Yet</h3><p className="text-muted-foreground">Provide context data to generate AI-powered insights.</p></div>)}</div></ScrollArea></TabsContent><TabsContent value="chat" className="flex-1 flex flex-col min-h-0"><div className="flex-1 flex flex-col min-h-0"><ScrollArea className="flex-1 mb-4"><div className="space-y-3">{chatMessages.map(message => (<div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >{message.role === 'assistant' && (<Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="bg-blue-100"><Bot className="h-4 w-4 text-blue-600" /></AvatarFallback></Avatar>)}<div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}><div
                          className={`rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'}`}
                        ><p className="text-sm whitespace-pre-wrap">{message.content}</p><div
                            className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}
                          >{message.timestamp.toLocaleTimeString('en-US', {hour: '2-digit',
                              minute: '2-digit',})}</div></div></div>{message.role === 'user' && (<Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="bg-blue-600"><User className="h-4 w-4 text-white" /></AvatarFallback></Avatar>)}</div>))}</div></ScrollArea>{/* Quick suggestions */}<div className="mb-3"><div className="flex flex-wrap gap-1">{suggestions.slice(0, 3).map((suggestion, index) => (<Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>setChatInput(suggestion)}
                    >
                      {suggestion}</Button>))}</div></div>{/* Chat input */}<div className="flex gap-2"><Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask about your analysis..."
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleChatMessage(chatInput);}
                  }}
                /><Button
                  onClick={() => handleChatMessage(chatInput)}
                  disabled={!chatInput.trim()}
                  size="sm"
                ><MessageSquare className="h-4 w-4" /></Button></div></div></TabsContent><TabsContent value="actions" className="flex-1"><ScrollArea className="h-full"><div className="space-y-3"><div className="grid grid-cols-2 gap-2"><Button
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => handleActionClick('generate-report')}
                  ><FileText className="h-5 w-5" /><span className="text-xs">Generate Report</span></Button><Button
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => handleActionClick('export-insights')}
                  ><Download className="h-5 w-5" /><span className="text-xs">Export Insights</span></Button><Button
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => handleActionClick('share-analysis')}
                  ><Share className="h-5 w-5" /><span className="text-xs">Share Analysis</span></Button><Button
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => handleActionClick('advanced-analysis')}
                  ><Calculator className="h-5 w-5" /><span className="text-xs">Advanced Analysis</span></Button></div><Separator /><div className="space-y-2"><h4 className="text-sm font-medium">Quick Actions</h4><div className="space-y-1"><Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleActionClick('identify-outliers')}
                    ><Eye className="h-4 w-4 mr-2" />Identify Outliers</Button><Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleActionClick('trend-analysis')}
                    ><TrendingUp className="h-4 w-4 mr-2" />Analyze Trends</Button><Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleActionClick('correlation-matrix')}
                    ><BarChart3 className="h-4 w-4 mr-2" />Correlation Matrix</Button><Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleActionClick('spatial-autocorrelation')}
                    ><Map className="h-4 w-4 mr-2" />Spatial Analysis</Button></div></div></div></ScrollArea></TabsContent></Tabs></CardContent></Card>
  );
};

export default ContextAssistant;
