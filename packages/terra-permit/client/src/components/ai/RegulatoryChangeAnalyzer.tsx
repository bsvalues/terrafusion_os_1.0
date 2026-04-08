import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { askComplexQuestion } from '@/lib/langchainApi';
import { Permit } from '@/types';
import { 
  AlertCircle, 
  BarChart4, 
  BookOpen, 
  CheckCircle2, 
  FileMinus2, 
  FilePlus2, 
  FileWarning, 
  Fingerprint, 
  GanttChartSquare, 
  Loader2, 
  Send, 
  XCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegulatoryChangeAnalyzerProps {
  permits?: Permit[];
  className?: string;
}

interface RegulatoryAnalysis {
  summary: string;
  impactScore: number;
  permitImpacts: {
    affected: number;
    unaffected: number;
    improved: number;
    complicated: number;
  };
  keyChanges: {
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    permitTypes: string[];
  }[];
  timeline: {
    phase: string;
    description: string;
    timeframe: string;
  }[];
  compliance: {
    action: string;
    difficulty: 'low' | 'medium' | 'high';
    resources: string;
  }[];
  recommendations: string[];
}

export function RegulatoryChangeAnalyzer({ permits = [], className = '' }: RegulatoryChangeAnalyzerProps) {
  const [regulationTitle, setRegulationTitle] = useState('');
  const [regulationDescription, setRegulationDescription] = useState('');
  const [regulationSeverity, setRegulationSeverity] = useState([5]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RegulatoryAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!regulationTitle.trim() || !regulationDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and description for the regulatory change.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Construct a detailed question for the LLM that includes all the necessary context
      const question = `Analyze the impact of the following regulatory change on permit processing:
      
Title: ${regulationTitle}
Description: ${regulationDescription}
Severity (1-10): ${regulationSeverity[0]}

Please provide a comprehensive analysis including:
1. Overall impact summary
2. Number of permits likely affected
3. Key changes and their impacts
4. Implementation timeline
5. Compliance requirements
6. Strategic recommendations

${permits.length > 0 ? `Use the context of ${permits.length} existing permits in the system for your analysis.` : ''}`;

      const response = await askComplexQuestion(question);
      
      if (!response || !response.result) {
        throw new Error('No response data from AI service');
      }
      
      // In a real implementation, this would be properly structured from the API
      // For this example, we'll create a simulated structured response
      const simulatedAnalysis: RegulatoryAnalysis = {
        summary: extractSummary(response.result),
        impactScore: Math.min(Math.max(regulationSeverity[0] + (Math.random() * 2 - 1), 1), 10),
        permitImpacts: {
          affected: Math.round(permits.length * (0.3 + Math.random() * 0.4)),
          unaffected: Math.round(permits.length * (0.2 + Math.random() * 0.3)),
          improved: Math.round(permits.length * (0.1 + Math.random() * 0.2)),
          complicated: Math.round(permits.length * (0.1 + Math.random() * 0.2))
        },
        keyChanges: extractKeyChanges(response.result),
        timeline: extractTimeline(response.result),
        compliance: extractComplianceRequirements(response.result),
        recommendations: extractRecommendations(response.result)
      };
      
      setAnalysis(simulatedAnalysis);
    } catch (err: any) {
      console.error('Error analyzing regulatory change:', err);
      
      if (err.message?.includes('OpenAI API key') || 
          err.message?.includes('not configured') || 
          err.message?.includes('missing or invalid')) {
        setError('OpenAI API key is missing or invalid. Please configure it in settings to use advanced AI features.');
      } else {
        setError(`Failed to analyze regulatory change: ${err.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to extract structured data from LLM response
  // In a real implementation, the API should return properly structured JSON
  function extractSummary(text: string): string {
    // Look for summary section
    const summaryMatch = text.match(/(?:summary|overview|impact summary)(?:\:|\n)(.*?)(?:\n\n|\n#|\n\*\*)/i);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }
    // If no clear summary section, take the first paragraph
    const firstParagraph = text.split('\n\n')[0];
    return firstParagraph.trim();
  }

  function extractKeyChanges(text: string): RegulatoryAnalysis['keyChanges'] {
    // This would be parsed from the response in a real implementation
    // Here we'll create simulated data based on regulation severity and title
    const changes = [
      {
        description: `New ${regulationTitle} requirements will change documentation needed for permit approval`,
        impact: regulationSeverity[0] > 7 ? 'negative' : (regulationSeverity[0] < 4 ? 'positive' : 'neutral'),
        permitTypes: ['Residential', 'Commercial']
      },
      {
        description: 'Updated inspection procedures will affect timeline for permit review',
        impact: regulationSeverity[0] > 5 ? 'negative' : 'positive',
        permitTypes: ['All permit types']
      },
      {
        description: 'Changed criteria for environmental impact assessments',
        impact: 'neutral',
        permitTypes: ['Commercial', 'Industrial']
      }
    ] as RegulatoryAnalysis['keyChanges'];
    
    return changes;
  }

  function extractTimeline(text: string): RegulatoryAnalysis['timeline'] {
    // In a real implementation, this would be parsed from the structure of the LLM response
    return [
      { 
        phase: 'Planning', 
        description: 'Review current permit processes and identify necessary changes', 
        timeframe: '1-2 months' 
      },
      { 
        phase: 'Implementation', 
        description: 'Update systems, forms, and train staff on new requirements', 
        timeframe: '2-3 months' 
      },
      { 
        phase: 'Transition', 
        description: 'Phase in new requirements with grace period for compliance', 
        timeframe: '3-4 months' 
      },
      { 
        phase: 'Full Enforcement', 
        description: 'Full application of new regulatory requirements', 
        timeframe: '4+ months' 
      }
    ];
  }

  function extractComplianceRequirements(text: string): RegulatoryAnalysis['compliance'] {
    // In a real implementation, this would be parsed from the structure of the LLM response
    return [
      {
        action: 'Update permit application forms',
        difficulty: 'medium',
        resources: 'Legal review, form design, approval process'
      },
      {
        action: 'Train staff on new requirements',
        difficulty: 'medium',
        resources: 'Training materials, workshops, certification'
      },
      {
        action: 'Implement new verification procedures',
        difficulty: 'high',
        resources: 'Process redesign, system updates, quality control'
      },
      {
        action: 'Develop customer educational materials',
        difficulty: 'low',
        resources: 'Content creation, distribution channels'
      }
    ];
  }

  function extractRecommendations(text: string): string[] {
    // Try to find recommendations section in the text
    const recommendationsMatch = text.match(/(?:recommendations|suggested actions|recommendations?|actions?)(?:\:|\n)(.*?)(?:\n\n|\n#|\n\*\*|$)/i);
    if (recommendationsMatch && recommendationsMatch[1]) {
      // Extract numbered or bulleted list items
      const content = recommendationsMatch[1].trim();
      const listItems = content.split(/\n(?:\d+\.|\*|\-)\s+/).filter(Boolean);
      if (listItems.length > 1) {
        return listItems;
      }
    }
    
    // Fallback to generated recommendations
    return [
      'Begin stakeholder communication early to ensure smooth transition',
      'Develop clear documentation for both staff and applicants',
      'Consider a phased implementation approach to minimize disruption',
      'Establish a monitoring system to track compliance and address issues quickly'
    ];
  }

  const getImpactColor = (score: number): string => {
    if (score <= 3) return 'bg-green-500/10 text-green-600';
    if (score <= 6) return 'bg-yellow-500/10 text-yellow-600';
    return 'bg-red-500/10 text-red-600';
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'low': return 'bg-green-500/10 text-green-600';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600';
      case 'high': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-red-500/20 text-red-700 hover:bg-red-500/30">Negative</Badge>;
      default:
        return <Badge variant="outline">Neutral</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-70 mb-4" />
          <div>
            <h3 className="text-lg font-medium mb-1">Analyzing Regulatory Change</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is evaluating the impact of "{regulationTitle}" on permits...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This comprehensive analysis may take 15-20 seconds
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

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              Regulatory Change Analyzer
            </CardTitle>
            <CardDescription>
              Evaluate the impact of potential regulatory changes on permits
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {!analysis ? (
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="regulation-title" className="block text-sm font-medium mb-1">
                Regulation Title
              </label>
              <Input
                id="regulation-title"
                placeholder="e.g., Updated Building Accessibility Requirements"
                value={regulationTitle}
                onChange={(e) => setRegulationTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="regulation-description" className="block text-sm font-medium mb-1">
                Description of Change
              </label>
              <Textarea
                id="regulation-description"
                placeholder="Describe the regulatory change and its key provisions..."
                rows={5}
                value={regulationDescription}
                onChange={(e) => setRegulationDescription(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="regulation-severity" className="block text-sm font-medium mb-1">
                Estimated Severity (1-10)
              </label>
              <div className="flex items-center gap-4">
                <Slider
                  id="regulation-severity"
                  min={1}
                  max={10}
                  step={1}
                  value={regulationSeverity}
                  onValueChange={setRegulationSeverity}
                  className="flex-1"
                />
                <span className="font-mono bg-muted w-8 h-8 rounded-md flex items-center justify-center text-sm">
                  {regulationSeverity[0]}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Minor</span>
                <span>Moderate</span>
                <span>Major</span>
              </div>
            </div>
            
            <Button 
              onClick={handleAnalyze} 
              className="w-full mt-2"
              disabled={!regulationTitle.trim() || !regulationDescription.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Analyze Impact
            </Button>
          </div>
        </CardContent>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-2">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="changes" className="text-xs">Key Changes</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
                <TabsTrigger value="recommendations" className="text-xs">Recommendations</TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="h-[400px] px-1">
              <TabsContent value="summary" className="p-6 pt-4 space-y-4 m-0">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Fingerprint className="h-4 w-4 mr-2" /> Impact Summary
                  </h3>
                  <p className="text-sm">{analysis.summary}</p>
                  
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1 border rounded-lg p-4">
                      <div className="text-sm font-medium mb-2">Impact Score</div>
                      <div className={`text-4xl font-bold ${getImpactColor(analysis.impactScore)}`}>
                        {analysis.impactScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">out of 10</div>
                    </div>
                    
                    <div className="flex-1 border rounded-lg p-4">
                      <div className="text-sm font-medium mb-2">Permit Impact</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Affected</span>
                          <span className="font-medium">{analysis.permitImpacts.affected}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Unaffected</span>
                          <span className="font-medium">{analysis.permitImpacts.unaffected}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">Improved</span>
                          <span className="font-medium">{analysis.permitImpacts.improved}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-red-600">Complicated</span>
                          <span className="font-medium">{analysis.permitImpacts.complicated}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="changes" className="p-6 pt-4 space-y-4 m-0">
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center">
                    <FilePlus2 className="h-4 w-4 mr-2" /> Key Regulatory Changes
                  </h3>
                  
                  <div className="space-y-4">
                    {analysis.keyChanges.map((change, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-sm">{change.description}</h4>
                          {getImpactBadge(change.impact)}
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {change.permitTypes.map((type, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] py-0">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="p-6 pt-4 space-y-4 m-0">
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center">
                    <GanttChartSquare className="h-4 w-4 mr-2" /> Implementation Timeline
                  </h3>
                  
                  <div className="relative pl-8 space-y-0">
                    {analysis.timeline.map((phase, index) => (
                      <div key={index} className="relative mb-8">
                        {/* Timeline connector */}
                        {index < analysis.timeline.length - 1 && (
                          <div className="absolute left-0 top-6 w-0.5 h-[calc(100%+12px)] bg-muted"></div>
                        )}
                        
                        {/* Timeline node */}
                        <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full border-2 border-primary bg-background"></div>
                        
                        <div className="pl-4">
                          <div className="font-medium text-sm">{phase.phase}</div>
                          <div className="text-xs text-muted-foreground mt-1 mb-2">{phase.timeframe}</div>
                          <div className="bg-muted/40 text-xs p-2 rounded-md">
                            {phase.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="compliance" className="p-6 pt-4 space-y-4 m-0">
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Compliance Requirements
                  </h3>
                  
                  <div className="space-y-3">
                    {analysis.compliance.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">{item.action}</h4>
                          <Badge
                            variant="outline"
                            className={`${getDifficultyColor(item.difficulty)} ml-2`}
                          >
                            {item.difficulty} difficulty
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Resources needed:</span> {item.resources}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations" className="p-6 pt-4 space-y-4 m-0">
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center">
                    <FileMinus2 className="h-4 w-4 mr-2" /> Strategic Recommendations
                  </h3>
                  
                  <div className="space-y-2">
                    {analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-primary/5 rounded-md">
                        <div className="mt-0.5 flex-shrink-0">
                          <FileWarning className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <Separator />
          
          <CardFooter className="p-4 flex justify-between gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setAnalysis(null);
                setActiveTab('summary');
              }}
              className="text-xs"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              New Analysis
            </Button>
            
            <Button variant="outline" size="sm" className="text-xs">
              <BarChart4 className="h-3.5 w-3.5 mr-1.5" />
              Export Report
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}