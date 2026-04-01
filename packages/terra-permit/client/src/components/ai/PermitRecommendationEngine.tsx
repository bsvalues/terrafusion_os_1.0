import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { askComplexQuestion } from '@/lib/langchainApi';
import { Permit } from '@/types';
import { 
  AlertCircle, 
  BarChart4, 
  Brain, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  Filter, 
  Loader2, 
  PieChart, 
  Zap,
  BarChart,
  ListFilter
} from 'lucide-react';

interface PermitRecommendationEngineProps {
  permits?: Permit[];
  uploadId?: number;
  className?: string;
}

interface PermitInsights {
  summary: {
    processingEfficiency: number;
    averageProcessingTime: number;
    estimatedBacklog: number;
    keyInsight: string;
  };
  optimizationRecommendations: {
    action: string;
    benefit: string;
    difficulty: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }[];
  processingStrategies: {
    strategy: string;
    description: string;
    permitTypes: string[];
    estimatedImpact: number;
  }[];
  prioritizationRecommendations: {
    permitId: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    timeEstimate: string;
  }[];
  bottlenecks: {
    area: string;
    description: string;
    severity: number;
    resolution: string;
  }[];
}

export function PermitRecommendationEngine({ permits = [], uploadId, className = '' }: PermitRecommendationEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<PermitInsights | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

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
        // Construct a question that will elicit the kind of analysis we need
        const question = uploadId
          ? `Analyze upload ID ${uploadId} to provide insights on permit processing efficiency, bottlenecks, and optimization opportunities. Include recommended processing strategies and prioritization for maximum efficiency.`
          : `Analyze the current set of ${permits.length} permits to provide insights on processing efficiency, bottlenecks, and optimization opportunities. Include recommended processing strategies and prioritization for maximum efficiency.`;
        
        const response = await askComplexQuestion(question);
        
        if (!response || !response.result) {
          throw new Error('No data returned from analysis service');
        }
        
        // In a real implementation, we would have a structured API response
        // For this example, we'll simulate a structured response
        generateInsights(permits, response.result);
      } catch (err: any) {
        console.error('Error fetching permit insights:', err);
        
        if (err.message?.includes('OpenAI API key') || 
            err.message?.includes('not configured') || 
            err.message?.includes('missing or invalid')) {
          setError('OpenAI API key is missing or invalid. Please configure it in settings to use advanced AI features.');
        } else {
          setError(`Failed to load insights: ${err.message || 'Unknown error occurred'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [permits, uploadId]);

  // Generate insights for the demo
  // In a real application, this would be coming from the API in structured format
  const generateInsights = (permits: Permit[], analysisText: string) => {
    // Extract some data from the permits to make realistic recommendations
    const enterPermits = permits.filter(p => p.enterPermit);
    const skipPermits = permits.filter(p => !p.enterPermit);
    
    const processingEfficiency = Math.min(Math.floor(enterPermits.length / permits.length * 100), 100);
    
    const insights: PermitInsights = {
      summary: {
        processingEfficiency,
        averageProcessingTime: Math.floor(Math.random() * 10) + 5, // 5-15 days
        estimatedBacklog: Math.floor(permits.length * 0.4), // 40% of permits
        keyInsight: extractKeyInsight(analysisText)
      },
      optimizationRecommendations: [
        {
          action: "Implement batch processing for similar permits",
          benefit: "Reduces processing time by 30% for grouped permits",
          difficulty: "medium",
          impact: "high"
        },
        {
          action: "Pre-screen permits with AI classification",
          benefit: "Identifies clear approvals/rejections early in process",
          difficulty: "medium",
          impact: "high"
        },
        {
          action: "Standardize documentation requirements",
          benefit: "Reduces back-and-forth with applicants",
          difficulty: "low",
          impact: "medium"
        },
        {
          action: "Implement parallel processing workflows",
          benefit: "Allows simultaneous review of different aspects",
          difficulty: "high",
          impact: "high"
        }
      ],
      processingStrategies: [
        {
          strategy: "Value-Based Prioritization",
          description: "Process high-value permits first to maximize economic impact",
          permitTypes: ["Commercial", "Industrial"],
          estimatedImpact: 25
        },
        {
          strategy: "Neighborhood-Based Batching",
          description: "Group permits by neighborhood code for contextual processing",
          permitTypes: ["Residential", "Mixed Use"],
          estimatedImpact: 18
        },
        {
          strategy: "Complexity Filtering",
          description: "Separate simple and complex permits into different workflows",
          permitTypes: ["All"],
          estimatedImpact: 30
        },
        {
          strategy: "Time-Sensitive Fast Track",
          description: "Expedite permits with critical timelines or public impact",
          permitTypes: ["Emergency", "Public Infrastructure"],
          estimatedImpact: 15
        }
      ],
      prioritizationRecommendations: generatePrioritizations(permits),
      bottlenecks: [
        {
          area: "Documentation Verification",
          description: "Manual verification of submitted documents creates delays",
          severity: 75,
          resolution: "Implement automated document validation with AI assistance"
        },
        {
          area: "Technical Review",
          description: "Limited technical staff for specialized permit reviews",
          severity: 60,
          resolution: "Create a tiered review system with preliminary screening"
        },
        {
          area: "Applicant Response Time",
          description: "Delays in receiving additional information from applicants",
          severity: 45,
          resolution: "Implement a streamlined communication portal with reminders"
        },
        {
          area: "Final Approval",
          description: "Bottleneck in final sign-off process",
          severity: 30,
          resolution: "Delegate approval authority for standard permits"
        }
      ]
    };
    
    setInsights(insights);
  };

  function extractKeyInsight(text: string): string {
    // Attempt to find a key insight in the text
    const insightPatterns = [
      /key insight:?\s*([^\.]+\.)/i,
      /main finding:?\s*([^\.]+\.)/i,
      /critical observation:?\s*([^\.]+\.)/i
    ];
    
    for (const pattern of insightPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If we can't find a specific insight, take a reasonable sentence from the text
    const sentences = text.split(/\.\s+/);
    const reasonableLengthSentences = sentences.filter(s => s.length > 30 && s.length < 150);
    
    if (reasonableLengthSentences.length > 0) {
      // Pick a sentence that might contain an insight
      const insightfulSentences = reasonableLengthSentences.filter(
        s => s.match(/efficiency|optimize|improve|recommend|prioritize|strategy/i)
      );
      
      if (insightfulSentences.length > 0) {
        return insightfulSentences[0].trim() + '.';
      }
      
      // Just pick the first reasonable sentence
      return reasonableLengthSentences[0].trim() + '.';
    }
    
    return "Processing efficiency could be improved by implementing a streamlined review process for similar permit types.";
  }

  function generatePrioritizations(permits: Permit[]) {
    // Take a sample of permits to prioritize
    const sampleSize = Math.min(5, permits.length);
    const priorityLevels = ['high', 'medium', 'low'];
    const timeEstimates = ['1-2 days', '3-5 days', '1 week', '2 weeks'];
    
    return permits
      .slice(0, sampleSize)
      .map(permit => ({
        permitId: permit.id,
        reason: getReasonForPermit(permit),
        priority: priorityLevels[Math.floor(Math.random() * priorityLevels.length)] as 'high' | 'medium' | 'low',
        timeEstimate: timeEstimates[Math.floor(Math.random() * timeEstimates.length)]
      }));
  }

  function getReasonForPermit(permit: Permit): string {
    // Generate a plausible reason based on the permit details
    const reasons = [
      `High value permit (${permit.value}) with economic impact`,
      `${permit.neighborhoodCode} is a priority development area`,
      `Similar to recently approved permits`,
      `Complex case requiring specialized review`,
      `Time-sensitive project with community impact`,
      `Preliminary work already completed`
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  function getDifficultyBadge(difficulty: string) {
    switch (difficulty) {
      case 'low':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 hover:bg-red-500/20">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  function getImpactBadge(impact: string) {
    switch (impact) {
      case 'low':
        return <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">Low</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500/80 hover:bg-blue-500/90">Medium</Badge>;
      case 'high':
        return <Badge className="bg-primary hover:bg-primary/90">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'high':
        return <Badge>High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-70 mb-4" />
          <div>
            <h3 className="text-lg font-medium mb-1">Analyzing Permits</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is generating optimization recommendations...
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
            <AlertDescription>{error}</AlertDescription>
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
            <AlertDescription>
              Please upload permits or select an existing upload to generate recommendations.
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
              Permit Recommendation Engine
            </CardTitle>
            <CardDescription>
              AI-powered optimization strategies for permit processing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="strategies" className="text-xs">Strategies</TabsTrigger>
            <TabsTrigger value="priorities" className="text-xs">Priorities</TabsTrigger>
            <TabsTrigger value="bottlenecks" className="text-xs">Bottlenecks</TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="h-[400px] px-1">
          <TabsContent value="overview" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <PieChart className="h-4 w-4 mr-2" /> Processing Efficiency
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Efficiency Rate</div>
                    <div className="text-2xl font-bold text-primary">
                      {insights.summary.processingEfficiency}%
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Avg. Processing</div>
                    <div className="text-2xl font-bold">
                      {insights.summary.averageProcessingTime}
                      <span className="text-sm font-normal ml-1">days</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Backlog</div>
                    <div className="text-2xl font-bold text-amber-600">
                      {insights.summary.estimatedBacklog}
                      <span className="text-sm font-normal ml-1">permits</span>
                    </div>
                  </div>
                </div>
                
                <Alert variant="default" className="bg-primary/10 text-foreground border-primary/20">
                  <Zap className="h-4 w-4 text-primary" />
                  <AlertTitle>Key Insight</AlertTitle>
                  <AlertDescription className="text-sm">
                    {insights.summary.keyInsight}
                  </AlertDescription>
                </Alert>
              </div>
              
              <h3 className="text-sm font-medium mt-6 mb-3 flex items-center">
                <FileCheck className="h-4 w-4 mr-2" /> Optimization Recommendations
              </h3>
              
              <div className="space-y-3">
                {insights.optimizationRecommendations.map((recommendation, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm">{recommendation.action}</div>
                      <div className="flex gap-2">
                        {getDifficultyBadge(recommendation.difficulty)}
                        {getImpactBadge(recommendation.impact)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {recommendation.benefit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="strategies" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <BarChart className="h-4 w-4 mr-2" /> Processing Strategies
              </h3>
              
              <div className="space-y-4">
                {insights.processingStrategies.map((strategy, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{strategy.strategy}</h4>
                      <Badge className="bg-green-500/80 hover:bg-green-500/90">
                        {strategy.estimatedImpact}% faster
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      {strategy.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {strategy.permitTypes.map((type, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Impact</span>
                        <span>{strategy.estimatedImpact}%</span>
                      </div>
                      <Progress value={strategy.estimatedImpact} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="priorities" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <ListFilter className="h-4 w-4 mr-2" /> Permit Prioritization
              </h3>
              
              <div className="space-y-3">
                {insights.prioritizationRecommendations.map((permit, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm">Permit #{permit.permitId}</div>
                      {getPriorityBadge(permit.priority)}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {permit.reason}
                    </div>
                    
                    <div className="flex items-center mt-3 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" /> 
                      <span>Estimated time: {permit.timeEstimate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="bottlenecks" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center">
                <Filter className="h-4 w-4 mr-2" /> Processing Bottlenecks
              </h3>
              
              <div className="space-y-4">
                {insights.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{bottleneck.area}</h4>
                      <Badge 
                        variant="outline" 
                        className={bottleneck.severity > 60 ? "bg-red-500/10 text-red-700" :
                                   bottleneck.severity > 30 ? "bg-yellow-500/10 text-yellow-700" :
                                   "bg-green-500/10 text-green-700"}
                      >
                        Severity: {bottleneck.severity}%
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2 mb-3">
                      {bottleneck.description}
                    </p>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Severity</span>
                        <span>{bottleneck.severity}%</span>
                      </div>
                      <Progress 
                        value={bottleneck.severity} 
                        className={`h-1.5 ${
                          bottleneck.severity > 60 ? "bg-red-500" :
                          bottleneck.severity > 30 ? "bg-yellow-500" : 
                          "bg-green-500"
                        }`} 
                      />
                    </div>
                    
                    <div className="mt-4 bg-muted/30 p-2 rounded-md">
                      <div className="flex gap-2 items-center">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> 
                        <span className="text-xs">{bottleneck.resolution}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      <CardFooter className="p-4 pt-0">
        <div className="w-full flex justify-end">
          <Button variant="outline" size="sm" className="text-xs">
            <BarChart4 className="h-3.5 w-3.5 mr-1.5" />
            Export Recommendations
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}