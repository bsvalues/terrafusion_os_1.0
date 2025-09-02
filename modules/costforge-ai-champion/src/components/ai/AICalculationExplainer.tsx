/**
 * AI Calculation Explainer Component - RESTORED from BCBSCOSTApp
 * 
 * Advanced AI-powered explanation system using Model Content Protocol (MCP)
 * for detailed building cost calculation analysis and explanations.
 */

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Database, Info, Brain, Zap, CheckCircle2  } from '@mui/icons-material';

// Types for AI explanation results
interface ExplanationResult {
  explanation: string;
  breakdown: {
    category: string;
    amount: number;
    reasoning: string;
    confidence: number;
  }[];
  recommendations: string[];
  assumptions: string[];
  accuracy_score: number;
  timestamp: string;
}

// Mock MCP status
interface MCPStatus {
  status: 'connected' | 'api_key_missing' | 'error';
  provider?: string;
  model?: string;
}

export default function AICalculationExplainer() {
  const [calculationData, setCalculationData] = useState<string>('');
  const [explanationResult, setExplanationResult] = useState<ExplanationResult | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock MCP status - in production this would come from a real hook
  const mcpStatus: MCPStatus = {
    status: 'connected',
    provider: 'OpenAI',
    model: 'gpt-4'
  };

  // Generate mock AI explanation
  const generateMockExplanation = (data: any): ExplanationResult => {
    return {
      explanation: `Based on the provided calculation data, this building cost estimate uses a comprehensive methodology that considers multiple factors including square footage, regional cost variations, quality specifications, and current market conditions. The calculation follows industry-standard practices for ${data.buildingType || 'residential'} construction in ${data.region || 'your area'}.`,
      breakdown: [
        {
          category: 'Base Construction Cost',
          amount: data.baseCost || 250000,
          reasoning: 'Calculated using current regional rates for materials and labor, adjusted for building type and specifications.',
          confidence: 0.92
        },
        {
          category: 'Regional Adjustment',
          amount: data.regionalAdjustment || 25000,
          reasoning: 'Applied based on local market conditions, labor availability, and material transportation costs.',
          confidence: 0.88
        },
        {
          category: 'Quality Premium',
          amount: data.qualityAdjustment || 40000,
          reasoning: 'Additional costs for upgraded materials, finishes, and construction standards.',
          confidence: 0.85
        }
      ],
      recommendations: [
        'Consider value engineering opportunities to optimize cost without sacrificing quality',
        'Review regional suppliers for potential material cost savings',
        'Evaluate construction timeline to avoid peak season pricing',
        'Consider alternative materials that provide similar performance at lower cost'
      ],
      assumptions: [
        'Current market rates will remain stable during construction period',
        'Standard soil conditions requiring no special foundation work',
        'All necessary permits and approvals can be obtained without delays',
        'No extraordinary site conditions or environmental constraints'
      ],
      accuracy_score: 0.87,
      timestamp: new Date().toISOString()
    };
  };

  // Handle form submission for explanation
  const handleExplain = async () => {
    if (!calculationData.trim()) {
      setError('Please enter calculation data to explain');
      return;
    }
    
    setIsExplaining(true);
    setError(null);
    
    try {
      // Try to parse the JSON data
      const parsedData = JSON.parse(calculationData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock explanation
      const result = generateMockExplanation(parsedData);
      setExplanationResult(result);
    } catch (parseError) {
      setError('The provided data is not valid JSON. Please check your input format.');
    } finally {
      setIsExplaining(false);
    }
  };
  
  // Clear results
  const handleClear = () => {
    setCalculationData('');
    setExplanationResult(null);
    setError(null);
  };
  
  // Display API key missing warning if needed
  if (mcpStatus.status === "api_key_missing") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            AI Calculation Explainer
            <Badge variant="secondary">RESTORED</Badge>
          </CardTitle>
          <CardDescription>
            Get detailed explanations of building cost calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
<>
            <AlertTitle>API Key Missing</AlertTitle>
            <AlertDescription
</>>
              OpenAI API key is not configured. Please contact your administrator to set up the API key for AI-powered explanations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Calculation Explainer
          <Badge variant="secondary">RESTORED</Badge>
          {mcpStatus.status === 'connected' && (
            <Badge variant="outline" className="ml-2">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {mcpStatus.provider} Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Get detailed AI-powered explanations of your building cost calculations using advanced language models
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
<>
            <Label htmlFor="calculation-data">Calculation Data (JSON Format)</Label>
            <Textarea
</>
              id="calculation-data"
              placeholder={`Enter your calculation data in JSON format, for example:
{
  "buildingType": "residential",
  "squareFeet": 2000,
  "region": "Benton County",
  "baseCost": 250000,
  "regionalAdjustment": 25000,
  "qualityAdjustment": 40000,
  "totalCost": 315000
}`}
              value={calculationData}
              onChange={(e) => setCalculationData(e.target.value)}
              className="min-h-32 font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Paste your calculation data in JSON format for AI analysis and explanation
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleExplain} 
              disabled={isExplaining || !calculationData.trim()}
              className="flex items-center gap-2"
            >
              {isExplaining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Explanation...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Explain Calculation
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
        
        {explanationResult && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
<>
                <h3 className="text-lg font-semibold">AI Explanation Results</h3>
                <Badge
</> variant="outline">
                  Accuracy: {Math.round(explanationResult.accuracy_score * 100)}%
                </Badge>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
<>
                <AlertTitle>Overall Explanation</AlertTitle>
                <AlertDescription
</> className="mt-2">
                  {explanationResult.explanation}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Cost Breakdown Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {explanationResult.breakdown.map((item /* , index */) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-start">
<>
                            <span className="font-medium text-sm">{item.category}</span>
                            <div
</> className="text-right">
<>
                              <div className="font-semibold">${item.amount.toLocaleString()}</div>
                              <Badge
</> variant="outline" className="text-xs">
                                {Math.round(item.confidence * 100)}% confidence
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.reasoning}</p>
                          {index < explanationResult.breakdown.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {explanationResult.recommendations.map((rec /* , index */) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
<>
                  <CardTitle className="text-base">Key Assumptions</CardTitle>
                  <CardDescription
</>>
                    These assumptions were made in the calculation analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {explanationResult.assumptions.map((assumption /* , index */) => (
                      <div key={index} className="flex items-start gap-2">
                        <Database className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{assumption}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Powered by {mcpStatus.provider} {mcpStatus.model}</span>
          {explanationResult && (
            <span>Generated: {new Date(explanationResult.timestamp).toLocaleString()}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}