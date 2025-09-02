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
import { useMCP, MatrixAnalysisResponse } from '../hooks/use-mcp';
import { Loader2, 
  Database, 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Building, 
  Warning,
  CheckCircle,
  Lightbulb,
  PieChart,
  Activity
 } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';

export default function AIMatrixAnalyzer() {
  const { toast } = useToast();
  const { analyzeMatrix, isAnalyzing, isError, error, mcpStatus } = useMCP();
  const [matrixData, setMatrixData] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<MatrixAnalysisResponse | null>(null);
  
  // Handle form submission for analysis
  const handleAnalyze = () => {
    if (!matrixData.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter matrix data to analyze",
        variant: "destructive",
      });
      return;
    }
    
    // Try to parse the JSON data
    try {
      const parsedData = JSON.parse(matrixData);
      
      // Call the MCP service to analyze the matrix
      analyzeMatrix({ matrixData: parsedData }, {
        onSuccess: (result) => {
          setAnalysisResult(result);
          toast({
            title: "Analysis Complete",
            description: "AI has completed comprehensive analysis of the cost matrix data",
          });
        },
        onError: (error) => {
          toast({
            title: "Analysis Failed",
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

            <BarChart3 className="h-5 w-5" />
            AI Matrix Analyzer
          </CardTitle>
          <CardDescription
</>
</>>
            Advanced analysis of cost matrix data with government-grade insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Warning className="h-4 w-4" /><>

            <AlertTitle>AI Service Configuration Required</AlertTitle>
            <AlertDescription
</>
</>>
              Matrix analysis service requires configuration. Contact your system administrator to enable advanced AI capabilities.
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
          <BarChart3 className="h-5 w-5" />
          AI Matrix Analyzer
          <Badge variant="secondary" className="ml-2">
            <Activity className="h-3 w-3 mr-1" />
            Advanced Analytics
          </Badge>
        </CardTitle>
        <CardDescription>
          Upload cost matrix data for comprehensive AI analysis with regional insights,
          trend detection, and government compliance recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div><>

          <Label htmlFor="matrixData">Enter Cost Matrix Data (JSON format)</Label>
          <Textarea
</>

            id="matrixData"
            className="min-h-[200px] font-mono text-sm mt-2"
            placeholder={`{
  "matrix": [
    {
      "region": "north",
      "buildingType": "commercial",
      "baseCost": 185.50,
      "squareFootage": 5000,
      "year": 2024
    },
    {
      "region": "south",
      "buildingType": "residential", 
      "baseCost": 145.25,
      "squareFootage": 2500,
      "year": 2024
    }
  ],
  "regions": ["north", "south", "east", "west"],
  "buildingTypes": ["residential", "commercial", "industrial"]
}`}
            value={matrixData}
            onChange={(e) => setMatrixData(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste cost matrix data in JSON format for comprehensive AI-powered analysis
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !matrixData.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI Processing...
            ) : (
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze Matrix Data
            )}
          </Button>
        </div>
        
        {/* Enhanced Analysis Results Display */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Overview Section */}
            <Card className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Executive Overview
                  <Badge variant="outline" className="ml-auto">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Analysis Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white/70 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {analysisResult.overview}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Statistical Summary */}
            {analysisResult.statisticalSummary && (
              <Card className="bg-gradient-to-r from-emerald-50/50 to-green-50/50 border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    Statistical Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/70 rounded-lg text-center border"><>

                      <div className="text-2xl font-bold text-emerald-600">
                        ${analysisResult.statisticalSummary.avgCost.toFixed(2)}
                      </div>
                      <div
</>
className="text-sm text-gray-600">Average Cost/sq ft</div>
                    </div>
                    <div className="p-4 bg-white/70 rounded-lg text-center border"><>

                      <div className="text-2xl font-bold text-blue-600">
                        ${analysisResult.statisticalSummary.medianCost.toFixed(2)}
                      </div>
                      <div
</>
className="text-sm text-gray-600">Median Cost/sq ft</div>
                    </div>
                    <div className="p-4 bg-white/70 rounded-lg text-center border"><>

                      <div className="text-2xl font-bold text-purple-600">
                        ${analysisResult.statisticalSummary.costRange.min} - ${analysisResult.statisticalSummary.costRange.max}
                      </div>
                      <div
</>
className="text-sm text-gray-600">Cost Range</div>
                    </div>
                    <div className="p-4 bg-white/70 rounded-lg text-center border"><>

                      <div className="text-2xl font-bold text-orange-600">
                        {(analysisResult.statisticalSummary.regionVariance * 100).toFixed(1)}%
                      </div>
                      <div
</>
className="text-sm text-gray-600">Regional Variance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Regional Analysis */}
              <Card className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Regional Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white/70 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {analysisResult.regionalAnalysis}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Building Type Analysis */}
              <Card className="bg-gradient-to-r from-orange-50/50 to-red-50/50 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-orange-600" />
                    Building Type Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white/70 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {analysisResult.buildingTypeAnalysis}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trends and Insights */}
            <Card className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border-indigo-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Market Trends & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white/70 rounded-lg border border-indigo-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {analysisResult.trendsAndInsights}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white/70 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {analysisResult.recommendations}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Anomalies Section */}
            {analysisResult.anomalies && analysisResult.anomalies.length > 0 && (
              <Card className="bg-gradient-to-r from-amber-50/50 to-yellow-50/50 border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Warning className="h-5 w-5 text-amber-600" />
                    Data Anomalies Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.anomalies.map((anomaly /* , index */) => (
                      <Alert key={index} className="bg-white/70">
                        <Warning className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm text-gray-700">
                          {anomaly}
                        </AlertDescription>
                      </Alert>
                    ))}
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
              {error || "An error occurred during the matrix analysis. The AI service may be temporarily unavailable."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center">
          <BarChart3 className="h-3 w-3 mr-1" />
          <span>Terrafusion OS - Advanced Analytics Platform</span>
        </div>
        <div className="flex items-center">
          <Database className="h-3 w-3 mr-1" />
          <span>Enhanced MCP Integration</span>
        </div>
      </CardFooter>
    </Card>
  );
}