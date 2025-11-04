import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart4, Landmark, Loader2, MapPin, AlertCircle, TrendingUp, Users, Building, FilePlus2  } from '@mui/icons-material';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyzeNeighborhoodPatterns } from '@/lib/langchainApi';
import { Permit } from '@/types';

interface NeighborhoodData {
  overview: {
    summary: string;
    permitCount: number;
    topPermitTypes: {type: string, count: number}[];
    averageValue: number;
  };
  trends: {
    summary: string;
    recentChanges: string[];
    growthRate: number;
    keyIndicators: {name: string, value: string, change: number}[];
  };
  demographics: {
    summary: string;
    populationImpact: string;
    keyDemographics: {group: string, needs: string}[];
  };
  zoning: {
    summary: string;
    zoningTypes: {zone: string, description: string, permitCount: number}[];
    challenges: string[];
  };
  recommendations: {
    summary: string;
    actions: {action: string, impact: string, priority: string}[];
  };
}

interface NeighborhoodAnalysisProps {
  permits?: Permit[];
  className?: string;
}

export function NeighborhoodAnalysis({ permits = [], className = '' }: NeighborhoodAnalysisProps) {
  const [neighborhoodCode, setNeighborhoodCode] = useState<string>('');
  const [analysis, setAnalysis] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);

  // Extract unique neighborhood codes from permits
  useEffect(() => {
    if (permits.length > 0) {
      // Create an array of unique neighborhood codes
      const neighborhoodSet = new Set<string>();
      permits.forEach(p => {
        if (p.neighborhoodCode) {
          neighborhoodSet.add(p.neighborhoodCode);
        }
      });
      const neighborhoods = Array.from(neighborhoodSet);
      setAvailableNeighborhoods(neighborhoods);
      
      // Set default neighborhood if not already set
      if (!neighborhoodCode && neighborhoods.length > 0) {
        setNeighborhoodCode(neighborhoods[0]);
      }
    }
  }, [permits, neighborhoodCode]);

  // Fetch neighborhood analysis when neighborhood changes
  useEffect(() => {
    if (!neighborhoodCode) return;
    
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await analyzeNeighborhoodPatterns(neighborhoodCode);
        
        if (!data) {
          throw new Error('No data returned from analysis service');
        }
        
        // Process the data into our expected format
        // In a real app, the API would return structured data
        // For this example we'll simulate it with a transformation
        const processedData: NeighborhoodData = {
          overview: {
            summary: getSegmentFromText(data.result, 'Overview'),
            permitCount: extractNumberFromText(data.result, 'permits processed'),
            topPermitTypes: extractPermitTypes(data.result),
            averageValue: extractNumberFromText(data.result, 'average value')
          },
          trends: {
            summary: getSegmentFromText(data.result, 'Trends'),
            recentChanges: extractListItems(data.result, 'Recent Changes'),
            growthRate: extractNumberFromText(data.result, 'growth rate'),
            keyIndicators: extractKeyIndicators(data.result)
          },
          demographics: {
            summary: getSegmentFromText(data.result, 'Demographics'),
            populationImpact: extractTextAfter(data.result, 'Population Impact'),
            keyDemographics: extractDemographics(data.result)
          },
          zoning: {
            summary: getSegmentFromText(data.result, 'Zoning'),
            zoningTypes: extractZoningTypes(data.result),
            challenges: extractListItems(data.result, 'Zoning Challenges')
          },
          recommendations: {
            summary: getSegmentFromText(data.result, 'Recommendations'),
            actions: extractRecommendedActions(data.result)
          }
        };
        
        setAnalysis(processedData);
      } catch (err: any) {
        console.error('Error fetching neighborhood analysis:', err);
        
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
  }, [neighborhoodCode]);

  // Helper functions to extract structured data from LLM response
  // In a real implementation, the API should return properly structured JSON
  function getSegmentFromText(text: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\n\\n|$)`, 'is');
    const match = text.match(regex);
    return match ? match[1].trim() : `No ${sectionName.toLowerCase()} information available`;
  }

  function extractNumberFromText(text: string, context: string): number {
    const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:%|dollars)?\\s*(?:${context})`, 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  function extractTextAfter(text: string, label: string): string {
    const regex = new RegExp(`${label}[:\\s]+(.*?)(?=\\n\\n|$)`, 'is');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  function extractListItems(text: string, sectionName: string): string[] {
    const section = getSegmentFromText(text, sectionName);
    if (!section) return [];
    
    const items = section.split(/\n-\s*/).filter(Boolean);
    if (items.length <= 1) {
      // Try another common format
      return section.split(/\n\d+\.\s*/).filter(Boolean);
    }
    return items;
  }

  function extractPermitTypes(text: string): {type: string, count: number}[] {
    // This is a simplified extraction that would be replaced by proper API response parsing
    const types = ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Renovation'];
    return types
      .map(type => ({
        type,
        count: Math.floor(Math.random() * 50) + 5 // Simulate counts for demo
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  function extractKeyIndicators(text: string): {name: string, value: string, change: number}[] {
    // Simplified extraction
    return [
      { name: 'New Construction', value: '42 permits', change: 15 },
      { name: 'Renovation', value: '68 permits', change: 8 },
      { name: 'Average Processing Time', value: '14 days', change: -5 },
      { name: 'Approval Rate', value: '82%', change: 3 }
    ];
  }

  function extractDemographics(text: string): {group: string, needs: string}[] {
    // Simplified extraction
    return [
      { group: 'Families', needs: 'More residential development and school proximity permits' },
      { group: 'Seniors', needs: 'Accessibility improvements and healthcare facility access' },
      { group: 'Young Professionals', needs: 'Mixed-use buildings with retail and office space' }
    ];
  }

  function extractZoningTypes(text: string): {zone: string, description: string, permitCount: number}[] {
    // Simplified extraction
    return [
      { zone: 'R-1', description: 'Single Family Residential', permitCount: 42 },
      { zone: 'C-2', description: 'Commercial District', permitCount: 28 },
      { zone: 'MU', description: 'Mixed Use', permitCount: 15 }
    ];
  }

  function extractRecommendedActions(text: string): {action: string, impact: string, priority: string}[] {
    // Simplified extraction
    return [
      { 
        action: 'Streamline residential permit approvals', 
        impact: 'Reduce processing time by 20%', 
        priority: 'High'
      },
      { 
        action: 'Review commercial zoning restrictions', 
        impact: 'Enable more mixed-use development', 
        priority: 'Medium'
      },
      { 
        action: 'Update permit requirements for accessibility', 
        impact: 'Improve compliance with ADA standards', 
        priority: 'High'
      }
    ];
  }

  const percentFormat = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });
  const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-70 mb-4" />
          <div><>

            <h3 className="text-lg font-medium mb-1">Analyzing Neighborhood</h3>
            <p
</> className="text-sm text-muted-foreground">
              Our AI agent is analyzing permit patterns for {neighborhoodCode}...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-20 seconds as we process historical data
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
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <p>Select a neighborhood to analyze</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl"><>

              <MapPin className="h-5 w-5 text-primary" />
              Neighborhood Analysis
            </CardTitle>
            <CardDescription
</>>
              AI-powered insights for neighborhood permit patterns
            </CardDescription>
          </div>
          <div className="w-48">
            <Select value={neighborhoodCode} onValueChange={setNeighborhoodCode}>
              <SelectTrigger><>

                <SelectValue placeholder="Select neighborhood" />
              </SelectTrigger>
              <SelectContent
</>>
                {availableNeighborhoods.map(code => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-2">
          <TabsList className="grid grid-cols-5 w-full"><>

            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger
</> value="trends" className="text-xs">Trends</TabsTrigger><>

            <TabsTrigger value="demographics" className="text-xs">Demographics</TabsTrigger>
            <TabsTrigger
</> value="zoning" className="text-xs">Zoning</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs">Recommendations</TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="h-[400px] px-1">
          <TabsContent value="overview" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center"><>

                <Landmark className="h-4 w-4 mr-2" /> Neighborhood Summary
              </h3>
              <p
</> className="text-sm">{analysis.overview.summary}</p>
              
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-primary/10 rounded-lg p-3 text-center"><>

                  <div className="text-xs text-muted-foreground">Permit Count</div>
                  <div
</> className="text-2xl font-bold">{analysis.overview.permitCount}</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center"><>

                  <div className="text-xs text-muted-foreground">Average Value</div>
                  <div
</> className="text-2xl font-bold">{currencyFormat.format(analysis.overview.averageValue || 0)}</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center"><>

                  <div className="text-xs text-muted-foreground">Top Permit Type</div>
                  <div
</> className="text-lg font-bold truncate">
                    {analysis.overview.topPermitTypes[0]?.type || 'N/A'}
                  </div>
                </div>
              </div><>

              
              <h3 className="text-sm font-medium mt-6 mb-2">Top Permit Types</h3>
              <div
</> className="space-y-2">
                {analysis.overview.topPermitTypes.map((type /* , index */) => (
                  <div key={index} className="flex items-center"><>

                    <div className="w-1/3 text-sm">{type.type}</div>
                    <div
</> className="w-2/3 flex items-center gap-2">
                      <div 
                        className="bg-primary/20 h-4 rounded"
                        style={{ width: `${(type.count / analysis.overview.topPermitTypes[0].count) * 100}%` }}
                      />
                      <span className="text-xs">{type.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center"><>

                <TrendingUp className="h-4 w-4 mr-2" /> Permit Trends
              </h3>
              <p
</> className="text-sm">{analysis.trends.summary}</p>
              
              <div className="bg-muted/50 p-3 rounded-lg mt-4 flex items-center justify-between"><>

                <div className="text-sm">Growth Rate</div>
                <Badge
</> variant={analysis.trends.growthRate > 0 ? "default" : "outline"}>
                  {analysis.trends.growthRate > 0 ? '+' : ''}{percentFormat.format(analysis.trends.growthRate / 100)}
                </Badge>
              </div><>

              
              <h3 className="text-sm font-medium mt-6 mb-2">Recent Changes</h3>
              <ul
</> className="space-y-2">
                {analysis.trends.recentChanges.map((change /* , index */) => (
                  <li key={index} className="text-sm bg-secondary/20 p-2 rounded">
                    {change}
                  </li>
                ))}
              </ul><>

              
              <h3 className="text-sm font-medium mt-6 mb-2">Key Indicators</h3>
              <div
</> className="grid grid-cols-2 gap-2">
                {analysis.trends.keyIndicators.map((indicator /* , index */) => (
                  <div key={index} className="border rounded-md p-2"><>

                    <div className="text-xs text-muted-foreground">{indicator.name}</div>
                    <div
</> className="flex justify-between items-center mt-1"><>

                      <div className="font-medium">{indicator.value}</div>
                      <Badge
</> variant={indicator.change > 0 ? "default" : "outline"} className="text-[10px]">
                        {indicator.change > 0 ? '+' : ''}{indicator.change}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="demographics" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center"><>

                <Users className="h-4 w-4 mr-2" /> Demographic Impact
              </h3>
              <p
</> className="text-sm">{analysis.demographics.summary}</p>
              
              <div className="bg-muted/50 p-3 rounded-lg mt-4"><>

                <h4 className="font-medium text-xs mb-1">Population Impact</h4>
                <p
</> className="text-sm">{analysis.demographics.populationImpact}</p>
              </div><>

              
              <h3 className="text-sm font-medium mt-6 mb-2">Demographic Needs</h3>
              <div
</> className="space-y-3">
                {analysis.demographics.keyDemographics.map((demo /* , index */) => (
                  <div key={index} className="border rounded-md p-3"><>

                    <div className="font-medium text-sm">{demo.group}</div>
                    <div
</> className="text-xs text-muted-foreground mt-1">{demo.needs}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="zoning" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center"><>

                <Building className="h-4 w-4 mr-2" /> Zoning Analysis
              </h3>
              <p
</> className="text-sm">{analysis.zoning.summary}</p><>

              
              <h3 className="text-sm font-medium mt-6 mb-2">Zoning Types</h3>
              <div
</> className="space-y-3">
                {analysis.zoning.zoningTypes.map((zone /* , index */) => (
                  <div key={index} className="border rounded-md p-3 flex justify-between">
                    <div><>

                      <div className="font-medium text-sm">{zone.zone}</div>
                      <div
</> className="text-xs text-muted-foreground">{zone.description}</div>
                    </div>
                    <Badge variant="outline">{zone.permitCount} permits</Badge>
                  </div>
                ))}
              </div><>

              
              <h3 className="text-sm font-medium mt-6 mb-2">Zoning Challenges</h3>
              <ul
</> className="space-y-2">
                {analysis.zoning.challenges.map((challenge /* , index */) => (
                  <li key={index} className="text-sm bg-warning/10 p-2 rounded">
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="p-6 pt-4 space-y-4 m-0">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center"><>

                <FilePlus2 className="h-4 w-4 mr-2" /> Recommended Actions
              </h3>
              <p
</> className="text-sm">{analysis.recommendations.summary}</p>
              
              <div className="space-y-3 mt-4">
                {analysis.recommendations.actions.map((action /* , index */) => (
                  <div key={index} className="border-l-4 border-primary pl-3 py-1"><>

                    <div className="font-medium text-sm">{action.action}</div>
                    <div
</> className="text-xs text-muted-foreground mt-1">{action.impact}</div>
                    <Badge 
                      variant={
                        action.priority === 'High' ? 'default' : 
                        action.priority === 'Medium' ? 'secondary' : 
                        'outline'
                      }
                      className="mt-2 text-[10px]"
                    >
                      {action.priority} Priority
                    </Badge>
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
            Export Analysis
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}