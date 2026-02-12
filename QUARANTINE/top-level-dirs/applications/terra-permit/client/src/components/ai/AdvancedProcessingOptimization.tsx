import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { askComplexQuestion } from '@/lib/langchainApi';
import { Permit } from '@/types';
import { AlertCircle,
  ArrowRight,
  BarChart,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CpuIcon,
  Database,
  Download,
  FileWarning,
  Filter,
  Gauge,
  GitBranch,
  LineChart,
  Loader2,
  RefreshCcw,
  Settings2,
  Share2,
  Sliders,
  SparklesIcon,
  Workflow
 } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { BarChart3  } from '@mui/icons-material';

interface AdvancedProcessingOptimizationProps {
  permits?: Permit[];
  uploadId?: number;
  className?: string;
}

// Extended interfaces for advanced optimization

interface ResourceAllocation {
  cpu: number; // percentage
  memory: number; // percentage
  storage: number; // percentage
  network: number; // percentage
  recommendedAdjustments: {
    resource: string;
    current: number;
    recommended: number;
    impact: string;
  }[];
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  status: 'optimal' | 'warning' | 'critical';
}

interface ProcessingAnomaly {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedPermits: number;
  detectedAt: string;
  suggestedAction: string;
  status: 'detected' | 'investigating' | 'resolved';
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: 'performance' | 'resources' | 'workflow' | 'data quality';
  estimatedImprovement: string;
  automationPossible: boolean;
}

interface PipelineStage {
  id: string;
  name: string;
  status: 'optimal' | 'warning' | 'critical';
  processingTime: number; // milliseconds
  errorRate: number; // percentage
  throughput: number; // items per minute
  bottleneck: boolean;
  optimizationTips: string[];
}

interface AdvancedOptimizationInsights {
  summary: {
    processingEfficiency: number;
    averageProcessingTime: number;
    processingAnomaly: boolean;
    autonomousMode: boolean;
    lastOptimizationTime: string;
    optimizationScore: number; // 0-100
  };
  resourceAllocation: ResourceAllocation;
  performanceMetrics: PerformanceMetric[];
  processingAnomalies: ProcessingAnomaly[];
  optimizationSuggestions: OptimizationSuggestion[];
  pipelineStages: PipelineStage[];
  predictiveModels: {
    permitVolumeProjection: {
      timeframe: string;
      projectedVolume: number;
      confidence: number;
    }[];
    processingTimeOptimization: {
      currentAverage: number;
      potentialAverage: number;
      requiredActions: string[];
    };
  };
}

export function AdvancedProcessingOptimization({ permits = [], uploadId, className = '' }: AdvancedProcessingOptimizationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AdvancedOptimizationInsights | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAutonomousModeEnabled, setIsAutonomousModeEnabled] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only proceed if we have permits to analyze
    if (permits.length === 0 && !uploadId) {
      setLoading(false);
      return;
    }
    
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would be a call to an API that returns structured data
        // For this demo, we'll generate synthetic data to showcase the UI capabilities
        generateOptimizationInsights();
      } catch (err: any) {
        console.error('Error fetching advanced optimization insights:', err);
        
        if (err.message?.includes('OpenAI API key') || 
            err.message?.includes('not configured') || 
            err.message?.includes('missing or invalid')) {
          setError('OpenAI API key is missing or invalid. Please configure it in settings to use advanced AI features.');
        } else {
          setError(`Failed to load optimization insights: ${err.message || 'Unknown error occurred'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [permits, uploadId]);

  // This is a demonstration function to generate realistic data for the UI
  // In a real implementation, this would be replaced by API calls
  const generateOptimizationInsights = () => {
    // Create realistic but synthetic data for demonstration purposes
    const insights: AdvancedOptimizationInsights = {
      summary: {
        processingEfficiency: 78,
        averageProcessingTime: 162, // seconds
        processingAnomaly: true,
        autonomousMode: false,
        lastOptimizationTime: new Date(Date.now() - 3600000 * 24).toISOString(),
        optimizationScore: 72,
      },
      resourceAllocation: {
        cpu: 62,
        memory: 48,
        storage: 35,
        network: 27,
        recommendedAdjustments: [
          {
            resource: 'CPU',
            current: 4,
            recommended: 6,
            impact: 'Reduce processing time by 25%'
          },
          {
            resource: 'Memory',
            current: 8,
            recommended: 12,
            impact: 'Support parallel processing of 10+ permits'
          }
        ]
      },
      performanceMetrics: [
        {
          name: 'Processing Rate',
          value: 42,
          unit: 'permits/hour',
          trend: 'increasing',
          status: 'optimal'
        },
        {
          name: 'Error Rate',
          value: 4.2,
          unit: '%',
          trend: 'decreasing',
          status: 'optimal'
        },
        {
          name: 'Queue Depth',
          value: 27,
          unit: 'permits',
          trend: 'increasing',
          status: 'warning'
        },
        {
          name: 'Average Latency',
          value: 162,
          unit: 'seconds',
          trend: 'stable',
          status: 'warning'
        }
      ],
      processingAnomalies: [
        {
          id: 'anom-001',
          description: 'Spike in processing time for residential permits',
          severity: 'medium',
          affectedPermits: 17,
          detectedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          suggestedAction: 'Apply residential permit template optimizations',
          status: 'investigating'
        },
        {
          id: 'anom-002',
          description: 'Higher than normal error rate in zoning validation',
          severity: 'high',
          affectedPermits: 8,
          detectedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
          suggestedAction: 'Update zoning validation rules or review recent changes',
          status: 'detected'
        }
      ],
      optimizationSuggestions: [
        {
          id: 'opt-001',
          title: 'Implement batch processing for similar permits',
          description: 'Group permits with similar attributes (e.g., same neighborhood or type) and process them together to reduce overhead.',
          impact: 'high',
          effort: 'medium',
          category: 'performance',
          estimatedImprovement: '30% faster processing time',
          automationPossible: true
        },
        {
          id: 'opt-002',
          title: 'Optimize database indexing strategy',
          description: 'Current database queries for permit lookup are inefficient. Adding indexes on commonly queried fields would improve performance.',
          impact: 'medium',
          effort: 'low',
          category: 'performance',
          estimatedImprovement: '40% faster database queries',
          automationPossible: true
        },
        {
          id: 'opt-003',
          title: 'Implement predictive permit classification',
          description: 'Pre-classify permits based on historical patterns to fast-track obvious approvals/rejections.',
          impact: 'high',
          effort: 'high',
          category: 'workflow',
          estimatedImprovement: '25% reduction in manual reviews',
          automationPossible: true
        }
      ],
      pipelineStages: [
        {
          id: 'stage-intake',
          name: 'Data Intake',
          status: 'optimal',
          processingTime: 1200, // ms
          errorRate: 0.5,
          throughput: 120,
          bottleneck: false,
          optimizationTips: []
        },
        {
          id: 'stage-validate',
          name: 'Data Validation',
          status: 'warning',
          processingTime: 3600,
          errorRate: 4.8,
          throughput: 72,
          bottleneck: true,
          optimizationTips: [
            'Parallelize validation rules',
            'Cache validation results for similar records'
          ]
        },
        {
          id: 'stage-transform',
          name: 'Data Transformation',
          status: 'optimal',
          processingTime: 2100,
          errorRate: 1.2,
          throughput: 95,
          bottleneck: false,
          optimizationTips: []
        },
        {
          id: 'stage-classify',
          name: 'Permit Classification',
          status: 'optimal',
          processingTime: 5400,
          errorRate: 2.1,
          throughput: 60,
          bottleneck: true,
          optimizationTips: [
            'Implement ML-based pre-classification',
            'Scale up compute resources during peak times'
          ]
        },
        {
          id: 'stage-load',
          name: 'Data Loading',
          status: 'optimal',
          processingTime: 800,
          errorRate: 0.3,
          throughput: 135,
          bottleneck: false,
          optimizationTips: []
        }
      ],
      predictiveModels: {
        permitVolumeProjection: [
          { timeframe: 'Next 24 hours', projectedVolume: 142, confidence: 0.92 },
          { timeframe: 'Next 7 days', projectedVolume: 856, confidence: 0.84 },
          { timeframe: 'Next 30 days', projectedVolume: 3240, confidence: 0.71 }
        ],
        processingTimeOptimization: {
          currentAverage: 162, // seconds
          potentialAverage: 94, // seconds
          requiredActions: [
            'Implement batch processing for similar permits',
            'Optimize database queries and add indexes',
            'Scale compute resources during peak hours'
          ]
        }
      }
    };
    
    setInsights(insights);
  };

  const handleApplyOptimizations = () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    setTimeout(() => {
      toast({
        title: "Optimizations Applied",
        description: "Advanced optimizations have been applied to the permit processing pipeline.",
      });
      
      // Update insights with "improved" data
      if (insights) {
        setInsights({
          ...insights,
          summary: {
            ...insights.summary,
            processingEfficiency: Math.min(insights.summary.processingEfficiency + 8, 100),
            averageProcessingTime: Math.max(insights.summary.averageProcessingTime - 36, 50),
            lastOptimizationTime: new Date().toISOString(),
            optimizationScore: Math.min(insights.summary.optimizationScore + 12, 100)
          },
          performanceMetrics: insights.performanceMetrics.map(metric => {
            if (metric.name === 'Processing Rate') {
              return { ...metric, value: metric.value + 8, trend: 'increasing' };
            }
            if (metric.name === 'Error Rate') {
              return { ...metric, value: Math.max(metric.value - 1.2, 0.1), trend: 'decreasing' };
            }
            if (metric.name === 'Average Latency') {
              return { ...metric, value: Math.max(metric.value - 36, 50), status: 'optimal', trend: 'decreasing' };
            }
            return metric;
          })
        });
      }
      
      setIsOptimizing(false);
    }, 3500);
  };

  const handleToggleAutonomousMode = () => {
    setIsAutonomousModeEnabled(!isAutonomousModeEnabled);
    
    toast({
      title: isAutonomousModeEnabled ? "Autonomous Mode Disabled" : "Autonomous Mode Enabled",
      description: isAutonomousModeEnabled 
        ? "Pipeline optimizations will now require manual approval." 
        : "Pipeline will now self-optimize based on AI recommendations.",
    });
    
    if (insights) {
      setInsights({
        ...insights,
        summary: {
          ...insights.summary,
          autonomousMode: !isAutonomousModeEnabled
        }
      });
    }
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low':
        return <Badge className="bg-green-500/20 text-green-700">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-700">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-700">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-700">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-700">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'detected':
        return <Badge variant="outline">Detected</Badge>;
      case 'investigating':
        return <Badge className="bg-blue-500/20 text-blue-700">Investigating</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-700">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-70 mb-4" />
          <div>
            <h3 className="text-lg font-medium mb-1">Analyzing Processing Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is analyzing permit processing performance and identifying optimization opportunities...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This comprehensive analysis may take 10-15 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription
>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/settings?highlight=openai_key'}
              className="mx-auto"
            >
              Configure API Key
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription
>
              Please upload permits or select an existing upload to generate optimization insights.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Brain className="h-5 w-5 text-primary" />
              Advanced Processing Optimization
            </CardTitle>
            <CardDescription
>
              Self-optimizing AI system for permit processing pipelines
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="autonomous-mode"
                checked={isAutonomousModeEnabled || insights.summary.autonomousMode}
                onCheckedChange={handleToggleAutonomousMode}
              />
              <Label htmlFor="autonomous-mode" className="text-xs">Autonomous Mode</Label>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={handleApplyOptimizations}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                  <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                  Apply Optimizations
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-2">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
            <TabsTrigger value="anomalies" className="text-xs">Anomalies</TabsTrigger>
            <TabsTrigger value="optimizations" className="text-xs">Optimizations</TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">Predictions</TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="h-[400px] px-1">
          <TabsContent value="overview" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium flex items-center">
                  <Gauge className="h-4 w-4 mr-2" /> Optimization Overview
                </h3>
                <div className="flex items-center text-xs">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Last updated: {
                    new Date(insights.summary.lastOptimizationTime).toLocaleString()
                  }</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Optimization Score</div>
                  <div className="relative pt-1">
                    <div className="text-3xl font-bold mb-1">{insights.summary.optimizationScore}/100</div>
                    <Progress value={insights.summary.optimizationScore} className="h-2" />
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Processing Efficiency</div>
                  <div className="relative pt-1">
                    <div className="text-3xl font-bold mb-1">{insights.summary.processingEfficiency}%</div>
                    <Progress value={insights.summary.processingEfficiency} 
                      className={`h-2 ${
                        insights.summary.processingEfficiency > 80 ? 'bg-green-500' : 
                        insights.summary.processingEfficiency > 60 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Average Processing Time</div>
                  <div className="text-3xl font-bold">
                    {insights.summary.averageProcessingTime}
                    <span className="text-sm font-normal ml-1">seconds</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Potential: {insights.predictiveModels.processingTimeOptimization.potentialAverage} seconds (-
                    {Math.round((insights.summary.averageProcessingTime - insights.predictiveModels.processingTimeOptimization.potentialAverage) / insights.summary.averageProcessingTime * 100)}%)
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Resource Utilization</div>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>CPU</span>
                      <span
>{insights.resourceAllocation.cpu}%</span>
                    </div>
                    <Progress value={insights.resourceAllocation.cpu} className="h-1" />
                    
                    <div className="flex justify-between text-xs mb-1">
                      <span>Memory</span>
                      <span
>{insights.resourceAllocation.memory}%</span>
                    </div>
                    <Progress value={insights.resourceAllocation.memory} className="h-1" />
                    
                    <div className="flex justify-between text-xs mb-1">
                      <span>Storage</span>
                      <span
>{insights.resourceAllocation.storage}%</span>
                    </div>
                    <Progress value={insights.resourceAllocation.storage} className="h-1" />
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-medium mt-6 mb-2">Performance Metrics</h3>
              <div className="grid grid-cols-4 gap-3">
                {insights.performanceMetrics.map((metric /* , index */) => (
                  <div key={index} className="border rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground">{metric.name}</div>
                    <div className="text-xl font-bold mt-1 mb-1">
                      {metric.value}
                      <span className="text-xs font-normal ml-1">{metric.unit}</span>
                    </div>
                    <div className={`text-xs flex items-center justify-center ${
                      metric.trend === 'increasing' 
                        ? 'text-green-500' 
                        : metric.trend === 'decreasing'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                    }`}>
                      {metric.trend === 'increasing' ? (
                        <ChevronRight className="h-3 w-3 rotate-90" />
                      ) : metric.trend === 'decreasing' ? (
                        <ChevronRight className="h-3 w-3 -rotate-90" />
                      ) : (
                        <ChevronRight className="h-3 w-3 rotate-0" />
                      )}
                      <span>{metric.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pipeline" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <Workflow className="h-4 w-4 mr-2" /> Pipeline Performance Analysis
              </h3>
              
              <div className="space-y-5">
                {insights.pipelineStages.map((stage /* , index */) => (
                  <div key={stage.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                          stage.status === 'optimal' ? 'bg-green-500' :
                          stage.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <h4 className="font-medium text-sm">{stage.name}</h4>
                      </div>
                      {stage.bottleneck && (
                        <Badge className="bg-red-500/20 text-red-700">Bottleneck</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-secondary/20 rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Processing Time</div>
                        <div className="text-sm font-medium">{formatTime(stage.processingTime)}</div>
                      </div>
                      <div className="bg-secondary/20 rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Error Rate</div>
                        <div className="text-sm font-medium">{stage.errorRate}%</div>
                      </div>
                      <div className="bg-secondary/20 rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Throughput</div>
                        <div className="text-sm font-medium">{stage.throughput}/min</div>
                      </div>
                    </div>
                    
                    {stage.optimizationTips.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium mb-1">Optimization Tips:</div>
                        <ul className="space-y-1">
                          {stage.optimizationTips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-xs bg-primary/10 p-1.5 rounded flex items-start">
                              <SparklesIcon className="h-3 w-3 text-primary mt-0.5 mr-1" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {index < insights.pipelineStages.length - 1 && (
                      <div className="flex justify-center mt-1 mb-1 text-muted-foreground">
                        <ArrowRight className="h-4 w-4 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <CpuIcon className="h-4 w-4 mr-2" /> Resource Allocation Recommendations
                </h3>
                <div className="space-y-3">
                  {insights.resourceAllocation.recommendedAdjustments.map((adjustment /* , index */) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-secondary/10 rounded-md">
                      <div className="font-medium text-sm min-w-[80px]">{adjustment.resource}</div>
                      <div className="flex items-center space-x-2 text-xs">
                        <Badge variant="outline">{adjustment.current} units</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge>{adjustment.recommended} units</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{adjustment.impact}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="anomalies" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <FileWarning className="h-4 w-4 mr-2" /> Processing Anomalies
              </h3>
              
              {insights.processingAnomalies.length > 0 ? (
                <div className="space-y-4">
                  {insights.processingAnomalies.map((anomaly) => (
                    <div key={anomaly.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{anomaly.description}</h4>
                        <div className="flex space-x-2">
                          {getSeverityBadge(anomaly.severity)}
                          {getStatusBadge(anomaly.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
                        <div className="bg-secondary/20 rounded p-2">
                          <div className="text-xs text-muted-foreground">Affected Permits</div>
                          <div className="text-sm font-medium">{anomaly.affectedPermits}</div>
                        </div>
                        <div className="bg-secondary/20 rounded p-2">
                          <div className="text-xs text-muted-foreground">Detected At</div>
                          <div className="text-sm font-medium">
                            {new Date(anomaly.detectedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-primary/10 p-3 rounded-md">
                        <div className="text-xs font-medium mb-1">Suggested Action:</div>
                        <div className="text-sm">{anomaly.suggestedAction}</div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs">
                          <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                          Address Anomaly
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <h4 className="font-medium">No Anomalies Detected</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The processing pipeline is currently running without any detected anomalies.
                  </p>
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2" /> Automated Anomaly Response
                </h3>
                
                <div className="bg-secondary/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">Self-Healing Configuration</div>
                    <Switch checked={true} />
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <div className="text-xs">Auto-detect anomalies</div>
                      <Badge variant="outline" className="text-xs">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs">Auto-resolve low severity issues</div>
                      <Badge variant="outline" className="text-xs">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs">Auto-rollback problematic updates</div>
                      <Badge variant="outline" className="text-xs">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs">Apply ML-based fixes</div>
                      <Badge variant="outline" className="text-xs">Manual approval</Badge>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Self-healing routines will automatically detect and address anomalies based on the configuration above.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="optimizations" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-2" /> Optimization Suggestions
              </h3>
              
              <div className="space-y-4">
                {insights.optimizationSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <div className="flex space-x-2">
                        <div className="flex items-center">
                          <span className="text-xs mr-1">Impact:</span>
                          {getImpactBadge(suggestion.impact)}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs mr-1">Effort:</span>
                          {getEffortBadge(suggestion.effort)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{suggestion.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-secondary/20 rounded p-2">
                        <div className="text-xs text-muted-foreground">Estimated Improvement</div>
                        <div className="text-sm font-medium">{suggestion.estimatedImprovement}</div>
                      </div>
                      <div className="bg-secondary/20 rounded p-2">
                        <div className="text-xs text-muted-foreground">Category</div>
                        <div className="text-sm font-medium capitalize">{suggestion.category}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      {suggestion.automationPossible ? (
                        <Badge className="bg-green-500/20 text-green-700">
                          Can be automated
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Manual implementation required
                        </Badge>
                      )}
                      
                      <Button variant="outline" size="sm" className="text-xs">
                        <Share2 className="h-3.5 w-3.5 mr-1.5" />
                        Apply Optimization
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="predictions" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <LineChart className="h-4 w-4 mr-2" /> Predictive Analysis
              </h3>
              
              <div className="border rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium mb-3">Projected Permit Volume</h4>
                <div className="space-y-3">
                  {insights.predictiveModels.permitVolumeProjection.map((projection /* , index */) => (
                    <div key={index} className="flex justify-between items-center bg-secondary/10 p-2 rounded-md">
                      <div className="text-sm">{projection.timeframe}</div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium">{projection.projectedVolume} permits</div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(projection.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Processing Time Optimization</h4>
                
                <div className="mb-4 relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-medium inline-block py-1 px-2 uppercase rounded-full bg-primary text-primary-foreground">
                        Current: {insights.predictiveModels.processingTimeOptimization.currentAverage}s
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium inline-block py-1 px-2 uppercase rounded-full bg-green-200 text-green-800">
                        Potential: {insights.predictiveModels.processingTimeOptimization.potentialAverage}s
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div style={{ width: `${(insights.predictiveModels.processingTimeOptimization.potentialAverage / insights.predictiveModels.processingTimeOptimization.currentAverage) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                    <div style={{ width: `${100 - (insights.predictiveModels.processingTimeOptimization.potentialAverage / insights.predictiveModels.processingTimeOptimization.currentAverage) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Potential {Math.round((insights.predictiveModels.processingTimeOptimization.currentAverage - insights.predictiveModels.processingTimeOptimization.potentialAverage) / insights.predictiveModels.processingTimeOptimization.currentAverage * 100)}% reduction in processing time
                  </p>
                </div>
                <h4 className="text-xs font-medium mb-2">Required Actions:</h4>
                <div className="space-y-2">
                  {insights.predictiveModels.processingTimeOptimization.requiredActions.map((action /* , index */) => (
                    <div key={index} className="flex items-start p-2 bg-secondary/10 rounded-md">
                      <div className="mr-2 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-sm">{action}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" className="text-xs">
                  <Database className="h-3.5 w-3.5 mr-1.5" />
                  Download Predictive Models
                </Button>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      <CardFooter className="p-4 pt-0">
        <div className="w-full flex justify-between">
          <Button variant="outline" size="sm" className="text-xs">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Configure Analytics
          </Button>
          
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Analysis
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Shield icon component (not included in lucide-react by default)
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
}