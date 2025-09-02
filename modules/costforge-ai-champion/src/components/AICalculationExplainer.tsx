import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { useMCP, CalculationExplanationResponse } from '../hooks/use-mcp';
import { Loader2, Database, Info, Shield, FileText, Warning, CheckCircle  } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';

export default function AICalculationExplainer() {
  const { toast } = useToast();
  const { explainCalculation, isExplaining, isError, error, mcpStatus } = useMCP();
  const [calculationData, setCalculationData] = useState<string>('');
  const [explanationResult, setExplanationResult] = useState<CalculationExplanationResponse | null>(null);
  
  // Handle form submission for explanation
  const handleExplain = () => {
    if (!calculationData.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter calculation data to explain",
        variant: "destructive",
      });
      return;
    }
    
    // Try to parse the JSON data
    try {
      const parsedData = JSON.parse(calculationData);
      
      // Call the MCP service to explain the calculation
      explainCalculation({ calculationData: parsedData }, {
        onSuccess: (result) => {
          setExplanationResult(result);
          toast({
            title: "Explanation Complete",
            description: "AI has provided a detailed analysis of the building cost calculation",
          });
        },
        onError: (error) => {
          toast({
            title: "Explanation Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive",
          });
        },
      });
    } catch (parseError) {
      toast({
        title: "Invalid JSON",
        description: "The provided data is not valid JSON format",
        variant: "destructive",
      });
    }
  };
  
  // Display API key missing warning if needed
  if (mcpStatus && mcpStatus.status === "api_key_missing") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Info className="h-5 w-5" />
            AI Calculation Explainer
          </CardTitle>
          <CardDescription
</>
</>>
            Get detailed explanations of building cost calculations with government compliance insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Warning className="h-4 w-4" /><>

            <AlertTitle>AI Service Configuration Required</AlertTitle>
            <AlertDescription
</>
</>>
              AI explanation service requires configuration. Contact your system administrator to enable advanced AI capabilities.
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
          <Info className="h-5 w-5" />
          AI Calculation Explainer
          <Badge variant="secondary" className="ml-2">
            <Shield className="h-3 w-3 mr-1" />
            Government Grade
          </Badge>
        </CardTitle>
        <CardDescription>
          Get comprehensive explanations of your building cost calculations with AI-powered insights, 
          government compliance analysis, and detailed formula breakdowns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div><>

          <Label htmlFor="calculationData">Enter Calculation Data (JSON format)</Label>
          <Textarea
</>

            id="calculationData"
            className="min-h-[200px] font-mono text-sm mt-2"
            placeholder={`{
  "buildingType": "commercial",
  "region": "north",
  "squareFootage": 5000,
  "baseCost": 150.00,
  "regionFactor": 1.2,
  "complexityFactor": 1.1,
  "costPerSqft": 198.00,
  "totalCost": 990000.00,
  "yearBuilt": 2020,
  "condition": "good"
}`}
            value={calculationData}
            onChange={(e) => setCalculationData(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste your building cost calculation data in JSON format for comprehensive AI analysis
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleExplain} 
            disabled={isExplaining || !calculationData.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isExplaining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI Analyzing...
            ) : (
                <Info className="mr-2 h-4 w-4" />
                Generate AI Explanation
            )}
          </Button>
        </div>
        
        {/* Enhanced Explanation Results Display */}
        {explanationResult && (
          <div className="space-y-4">
            {/* Main Explanation Card */}
            <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  AI Calculation Analysis
                  <Badge variant="outline" className="ml-auto">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Analysis Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Explanation */}
                {explanationResult.explanation && (
                  <div className="p-4 bg-white/70 rounded-lg border"><>

                    <h3 className="font-semibold mb-2 text-gray-800">Calculation Explanation</h3>
                    <p
</>
className="text-sm text-gray-700 leading-relaxed">
                      {explanationResult.explanation}
                    </p>
                  </div>
                )}
                
                {/* Formula Breakdown */}
                {explanationResult.formulaBreakdown && (
                  <div className="p-4 bg-slate-50 rounded-lg border"><>

                    <h3 className="font-semibold mb-2 text-gray-800">Formula Breakdown</h3>
                    <div
</>
className="text-sm bg-white p-3 rounded-md font-mono border-l-4 border-blue-400">
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {explanationResult.formulaBreakdown}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* Factor Explanations */}
                {explanationResult.factorExplanations && (
                  <div className="p-4 bg-green-50/50 rounded-lg border border-green-200"><>

                    <h3 className="font-semibold mb-2 text-gray-800">Factor Explanations</h3>
                    <div
</>
className="grid gap-3">
                      {Object.entries(explanationResult.factorExplanations).map(([factor, explanation] /* , index */) => (
                        <div key={index} className="p-3 bg-white rounded-md border-l-4 border-green-400"><>

                          <div className="font-medium text-green-800 mb-1">{factor}</div>
                          <div
</>
className="text-sm text-gray-700">{explanation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Additional Insights */}
                {explanationResult.additionalInsights && (
                  <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200"><>

                    <h3 className="font-semibold mb-2 text-amber-800">Professional Insights</h3>
                    <p
</>
className="text-sm text-amber-700">{explanationResult.additionalInsights}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Government Compliance Section */}
            {explanationResult.governmentCompliance && (
              <Card className="bg-gradient-to-r from-emerald-50/50 to-green-50/50 border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Government Compliance Analysis
                    <Badge variant="outline" className="ml-auto bg-emerald-100 text-emerald-700">
                      {Math.round(explanationResult.governmentCompliance.complianceLevel * 100)}% Compliant
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Standards Used */}
                  <div className="p-4 bg-white/70 rounded-lg border"><>

                    <h4 className="font-semibold mb-2 text-gray-800">Standards & Guidelines Applied</h4>
                    <div
</>
className="flex flex-wrap gap-2">
                      {explanationResult.governmentCompliance.standardsUsed.map((standard /* , index */) => (
                        <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800">
                          <FileText className="h-3 w-3 mr-1" />
                          {standard}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Required Documentation */}
                  <div className="p-4 bg-emerald-50/70 rounded-lg border border-emerald-200"><>

                    <h4 className="font-semibold mb-2 text-emerald-800">Required Documentation</h4>
                    <ul
</>
className="text-sm space-y-1">
                      {explanationResult.governmentCompliance.requiredDocumentation.map((doc /* , index */) => (
                        <li key={index} className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="h-4 w-4" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {isError && (
          <Alert variant="destructive">
            <Warning className="h-4 w-4" /><>

            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription
</>
</>>
              {error || "An error occurred generating the explanation. The AI service may be temporarily unavailable."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Shield className="h-3 w-3 mr-1" />
          <span>Terrafusion OS - Government AI Platform</span>
        </div>
        <div className="flex items-center">
          <Database className="h-3 w-3 mr-1" />
          <span>Enhanced MCP Integration</span>
        </div>
      </CardFooter>
    </Card>
  );
}