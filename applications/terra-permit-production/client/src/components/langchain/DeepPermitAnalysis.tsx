import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAgentPermitAnalysis } from '@/lib/langchainApi';
import { Permit } from '@/types';
import { Bot, 
  Loader2, 
  AlertCircle, 
  FileText, 
  Lightbulb, 
  Warning, 
  CheckCircle2, 
  ArrowDownCircle,
  RssIcon,
  PencilRuler
 } from '@mui/icons-material';

interface DeepPermitAnalysisProps {
  permitId: number;
  permit?: Permit; // Optional permit details if already available
  className?: string;
}

export function DeepPermitAnalysis({ permitId, permit, className = '' }: DeepPermitAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!permitId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getAgentPermitAnalysis(permitId);
        if (!data) {
          throw new Error('No data returned from analysis service');
        }
        
        setAnalysis(data);
      } catch (err: any) {
        console.error('Error fetching permit analysis:', err);
        
        if (err.message?.includes('OpenAI API key') || 
            err.message?.includes('not configured') || 
            err.message?.includes('missing or invalid')) {
          setError('OpenAI API key is missing or invalid. Please configure it in settings to use advanced AI features.');
        } else {
          setError(`Failed to load analysis: ${err.message || 'Unknown error occurred'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [permitId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-70 mb-4" />
          <div><>

            <h3 className="text-lg font-medium mb-1">Analyzing Permit</h3>
            <p
</> className="text-sm text-muted-foreground">
              Our AI agent is gathering information and performing a deep analysis of this permit...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-15 seconds as multiple AI models are consulted
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
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription
</>>{error}</AlertDescription>
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

  if (!analysis) {
    return null;
  }

  // Extract analysis components
  const { 
    overview, 
    detailedAssessment, 
    regulatoryCompliance, 
    recommendations, 
    similarPermits,
    riskFactors 
  } = analysis;

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl"><>

              <Bot className="h-5 w-5 text-primary" />
              Deep Permit Analysis
            </CardTitle>
            <CardDescription
</>>
              LangChain agent-based comprehensive permit evaluation
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            <RssIcon className="h-3 w-3 mr-1" />
            AI Agent
          </Badge>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-2">
          <TabsList className="grid grid-cols-5 w-full"><>

            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger
</> value="assessment" className="text-xs">Assessment</TabsTrigger><>

            <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
            <TabsTrigger
</> value="recommendations" className="text-xs">Actions</TabsTrigger>
            <TabsTrigger value="similar" className="text-xs">Similar</TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="h-[400px] px-1">
          <TabsContent value="overview" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center"><>

                <FileText className="h-4 w-4 mr-2" /> Summary
              </h3>
              <p
</> className="text-sm">{overview?.summary || 'No summary available'}</p>
            </div>
            
            {overview?.keyPoints && overview.keyPoints.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center"><>

                  <Lightbulb className="h-4 w-4 mr-2" /> Key Points
                </h3>
                <ul
</> className="space-y-2">
                  {overview.keyPoints.map((point: string /* , index */: number) => (
                    <li key={index} className="text-sm flex">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {riskFactors && riskFactors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center"><>

                  <Warning className="h-4 w-4 mr-2 text-warning" /> Risk Factors
                </h3>
                <ul
</> className="space-y-2">
                  {riskFactors.map((risk: any /* , index */: number) => (
                    <li key={index} className="text-sm flex bg-warning/10 p-2 rounded-md">
                      <div><>

                        <div className="font-medium">{risk.factor}</div>
                        <div
</> className="text-xs text-muted-foreground mt-1">{risk.details}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assessment" className="p-6 pt-4 space-y-4 m-0">
            <div><>

              <h3 className="text-sm font-medium mb-2">Detailed Assessment</h3>
              <div
</> className="text-sm whitespace-pre-wrap">
                {detailedAssessment?.text || 'No detailed assessment available'}
              </div>
              
              {detailedAssessment?.factors && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Object.entries(detailedAssessment.factors).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-secondary/20 rounded-md p-2"><>

                      <div className="text-xs font-medium">{key}</div>
                      <div
</> className="text-xs mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="compliance" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <PencilRuler className="h-4 w-4 mr-2" /> Regulatory Compliance
              </h3>
              {regulatoryCompliance?.status && (
                <Badge 
                  variant={
                    regulatoryCompliance.status === 'Compliant' ? 'default' : 
                    regulatoryCompliance.status === 'Needs Review' ? 'outline' : 
                    'destructive'
                  }
                  className="mb-3"
                >
                  {regulatoryCompliance.status}
                </Badge>
              )}
              
              <div className="text-sm mb-3">
                {regulatoryCompliance?.summary || 'No compliance information available'}
              </div>
              
              {regulatoryCompliance?.regulations && regulatoryCompliance.regulations.length > 0 && (
                <div className="space-y-2">
                  {regulatoryCompliance.regulations.map((reg: any /* , index */: number) => (
                    <div key={index} className="bg-secondary/20 rounded-md p-2 text-xs"><>

                      <div className="font-medium">{reg.code}</div>
                      <div
</>>{reg.description}</div>
                      <div className="mt-1">
                        <Badge 
                          variant={
                            reg.status === 'Compliant' ? 'default' : 
                            reg.status === 'Needs Review' ? 'outline' : 
                            'destructive'
                          }
                          className="text-[10px] px-1 py-0"
                        >
                          {reg.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2">Recommended Actions</h3>
              
              {recommendations && recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {recommendations.map((rec: any /* , index */: number) => (
                    <li key={index} className="text-sm bg-primary/10 p-2 rounded-md"><>

                      <div className="font-medium">{rec.action}</div>
                      <div
</> className="text-xs mt-1">{rec.rationale}</div>
                      {rec.priority && (
                        <Badge 
                          variant={
                            rec.priority === 'High' ? 'destructive' : 
                            rec.priority === 'Medium' ? 'default' : 
                            'outline'
                          }
                          className="mt-2 text-[10px]"
                        >
                          {rec.priority} Priority
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recommendations available</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="similar" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2">Similar Permits</h3>
              
              {similarPermits && similarPermits.length > 0 ? (
                <div className="space-y-3">
                  {similarPermits.map((permit: any /* , index */: number) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div><>

                          <div className="font-medium text-sm">Permit #{permit.id || index+1}</div>
                          <div
</> className="text-xs text-muted-foreground">{permit.description}</div>
                        </div>
                        <Badge 
                          variant={permit.enterPermit ? 'default' : 'outline'}
                        >
                          {permit.enterPermit ? 'Entered' : 'Skipped'}
                        </Badge>
                      </div>
                      {permit.similarityReason && (
                        <div className="mt-2 text-xs bg-muted p-2 rounded-md">
                          <span className="font-medium">Similarity: </span>
                          {permit.similarityReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No similar permits found</p>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      <CardFooter className="p-4 pt-0">
        <div className="w-full flex justify-end">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowDownCircle className="h-3.5 w-3.5 mr-1.5" />
            Export Analysis
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}