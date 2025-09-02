/**
 * AI-Enhanced Cost Calculator Component
 * 
 * Combines traditional cost calculation with AI predictions from
 * Anthropic Claude and OpenAI to provide comprehensive cost analysis.
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Calculator, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Lightbulb,
  DollarSign
 } from '@mui/icons-material';

// Form validation schema
const calculatorSchema = z.object({
  buildingType: z.string().min(1, 'Building type is required'),
  squareFootage: z.coerce.number().min(1, 'Square footage must be at least 1'),
  region: z.string().min(1, 'Region is required'),
  quality: z.string().min(1, 'Quality level is required'),
  yearBuilt: z.coerce.number().min(1800, 'Year must be at least 1800').max(new Date().getFullYear(), 'Year cannot be in the future'),
  conditionFactor: z.coerce.number().min(0).max(1),
  complexityFactor: z.coerce.number().min(0).max(1),
  features: z.array(z.string()).optional()
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface AnalysisResult {
  traditional?: any;
  ai?: any;
  comparison?: any;
  recommendation?: any;
}

interface ServiceStatus {
  anthropic: boolean;
  openai: boolean;
  database: boolean;
}

const AIEnhancedCostCalculator: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    anthropic: false,
    openai: false,
    database: false
  });
  const [error, setError] = useState<string | null>(null);
  const [calculationProgress, setCalculationProgress] = useState(0);

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      buildingType: 'Residential',
      squareFootage: 2000,
      region: 'Benton',
      quality: 'Good',
      yearBuilt: 2000,
      conditionFactor: 0.8,
      complexityFactor: 0.5,
      features: []
    }
  });

  // Check service availability on mount
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      // Check AI services
      const aiResponse = await fetch('/api/ai/status');
      const aiData = await aiResponse.json();
      
      // Check database service
      const dbResponse = await fetch('/api/database/status');
      const dbData = await dbResponse.json();

      setServiceStatus({
        anthropic: aiData.anthropic?.available || false,
        openai: aiData.openai?.available || false,
        database: dbData.available || false
      });
    } catch (err) {
      console.warn('Failed to check service status:', err);
    }
  };

  const onSubmit = async (data: CalculatorFormData) => {
    setIsCalculating(true);
    setError(null);
    setCalculationProgress(0);
    
    try {
      // Step 1: Enhanced analysis (10%)
      setCalculationProgress(10);
      
      const response = await fetch('/api/cost-analysis/enhanced-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      setCalculationProgress(50);

      const result = await response.json();
      setAnalysisResult(result);
      setCalculationProgress(100);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="space-y-6">
      {/* Service Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><>

            <Brain className="mr-2 h-5 w-5" />
            AI-Enhanced Cost Calculator
          </CardTitle>
          <CardDescription
</>
</>>
            Advanced cost analysis combining traditional methods with AI predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={serviceStatus.anthropic ? 'default' : 'secondary'}><>

              <CheckCircle className={`mr-1 h-3 w-3 ${serviceStatus.anthropic ? 'text-green-500' : 'text-gray-500'}`} />
              Claude AI {serviceStatus.anthropic ? 'Available' : 'Offline'}
            </Badge>
            <Badge
</>
variant={serviceStatus.openai ? 'default' : 'secondary'}><>

              <CheckCircle className={`mr-1 h-3 w-3 ${serviceStatus.openai ? 'text-green-500' : 'text-gray-500'}`} />
              OpenAI {serviceStatus.openai ? 'Available' : 'Offline'}
            </Badge>
            <Badge
</>
variant={serviceStatus.database ? 'default' : 'secondary'}>
              <CheckCircle className={`mr-1 h-3 w-3 ${serviceStatus.database ? 'text-green-500' : 'text-gray-500'}`} />
              Database {serviceStatus.database ? 'Connected' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader><>

          <CardTitle>Building Information</CardTitle>
          <CardDescription
</>
</>>
            Enter building details for comprehensive cost analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Building Type */}
              <div className="space-y-2"><>

                <Label htmlFor="buildingType">Building Type</Label>
                <Select
</>

                  onValueChange={(value) => form.setValue('buildingType', value)}
                  defaultValue={form.getValues('buildingType')}
                >
                  <SelectTrigger><>

                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent
</>
</>><>

                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem
</>
value="Commercial">Commercial</SelectItem><>

                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem
</>
value="Agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Square Footage */}
              <div className="space-y-2"><>

                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
</>

                  {...form.register('squareFootage')}
                  type="number"
                  placeholder="2000"
                />
                {form.formState.errors.squareFootage && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.squareFootage.message}
                  </p>
                )}
              </div>

              {/* Region */}
              <div className="space-y-2"><>

                <Label htmlFor="region">Region</Label>
                <Select
</>

                  onValueChange={(value) => form.setValue('region', value)}
                  defaultValue={form.getValues('region')}
                >
                  <SelectTrigger><>

                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent
</>
</>><>

                    <SelectItem value="Benton">Benton County</SelectItem>
                    <SelectItem
</>
value="Urban">Urban Area</SelectItem>
                    <SelectItem value="Rural">Rural Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quality Level */}
              <div className="space-y-2"><>

                <Label htmlFor="quality">Quality Level</Label>
                <Select
</>

                  onValueChange={(value) => form.setValue('quality', value)}
                  defaultValue={form.getValues('quality')}
                >
                  <SelectTrigger><>

                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent
</>
</>><>

                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem
</>
value="Good">Good</SelectItem><>

                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem
</>
value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Built */}
              <div className="space-y-2"><>

                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
</>

                  {...form.register('yearBuilt')}
                  type="number"
                  placeholder="2000"
                />
              </div>

              {/* Condition Factor */}
              <div className="space-y-2"><>

                <Label htmlFor="conditionFactor">
                  Condition Factor: {form.watch('conditionFactor')?.toFixed(1)}
                </Label>
                <Slider
</>

                  value={[form.watch('conditionFactor') || 0.8]}
                  onValueChange={(value) => form.setValue('conditionFactor', value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  0 = Poor condition, 1 = Excellent condition
                </p>
              </div>

              {/* Complexity Factor */}
              <div className="space-y-2 md:col-span-2"><>

                <Label htmlFor="complexityFactor">
                  Complexity Factor: {form.watch('complexityFactor')?.toFixed(1)}
                </Label>
                <Slider
</>

                  value={[form.watch('complexityFactor') || 0.5]}
                  onValueChange={(value) => form.setValue('complexityFactor', value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  0 = Simple building, 1 = Highly complex
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isCalculating && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Analyzing building costs...</span>
                </div>
                <Progress value={calculationProgress} className="w-full" />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isCalculating}
            >
              {isCalculating ? (
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
              ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Enhanced Cost Analysis
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Display */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4"><>

                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger
</>
value="traditional">Traditional</TabsTrigger><>

                <TabsTrigger value="ai">AI Analysis</TabsTrigger>
                <TabsTrigger
</>
value="comparison">Comparison</TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div><>

                          <p className="text-sm font-medium">Recommended Cost</p>
                          <p
</>
className="text-2xl font-bold">
                            ${typeof analysisResult.recommendation?.totalCost === 'number' 
                              ? analysisResult.recommendation.totalCost.toLocaleString()
                              : analysisResult.traditional?.totalCost?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <div><>

                          <p className="text-sm font-medium">Confidence Level</p>
                          <p
</>
className={`text-lg font-semibold ${
                            analysisResult.comparison 
                              ? getConfidenceColor(1 - (analysisResult.comparison.percentageDifference / 100))
                              : 'text-gray-600'
                          }`}>
                            {analysisResult.comparison 
                              ? getConfidenceLabel(1 - (analysisResult.comparison.percentageDifference / 100))
                              : 'Moderate'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analysisResult.comparison && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Analysis Summary:</strong> {analysisResult.comparison.recommendation}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Traditional Analysis Tab */}
              <TabsContent value="traditional" className="space-y-4">
                {analysisResult.traditional && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><>

                        <p className="text-sm font-medium">Total Cost</p>
                        <p
</>
className="text-xl font-bold">
                          ${analysisResult.traditional.totalCost?.toLocaleString()}
                        </p>
                      </div>
                      <div><>

                        <p className="text-sm font-medium">Cost per Sq Ft</p>
                        <p
</>
className="text-xl font-bold">
                          ${analysisResult.traditional.costPerSqFt?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {analysisResult.traditional.breakdown && (
                      <div className="space-y-2"><>

                        <h3 className="text-lg font-medium">Cost Breakdown</h3>
                        <div
</>
className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(analysisResult.traditional.breakdown).map(([category, cost]) => (
                            <div key={category} className="flex justify-between p-2 bg-muted rounded"><>

                              <span className="capitalize">{category}:</span>
                              <span
</>
className="font-medium">${(cost as number).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* AI Analysis Tab */}
              <TabsContent value="ai" className="space-y-4">
                {analysisResult.ai?.result && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge variant="outline">
                        {analysisResult.ai.provider === 'anthropic' ? 'Claude AI' : 'OpenAI GPT'}
                      </Badge>
                      {analysisResult.ai.result.confidence && (
                        <Badge variant="secondary">
                          Confidence: {(analysisResult.ai.result.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><>

                        <p className="text-sm font-medium">AI Predicted Cost</p>
                        <p
</>
className="text-xl font-bold">
                          ${analysisResult.ai.result.totalCost?.replace(/,/g, '') ? 
                            Number(analysisResult.ai.result.totalCost.replace(/,/g, '')).toLocaleString() :
                            analysisResult.ai.result.totalCost}
                        </p>
                      </div>
                      <div><>

                        <p className="text-sm font-medium">Cost per Sq Ft</p>
                        <p
</>
className="text-xl font-bold">
                          ${analysisResult.ai.result.costPerSquareFoot?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {analysisResult.ai.result.predictionFactors && (
                      <div className="space-y-2"><>

                        <h3 className="text-lg font-medium">AI Prediction Factors</h3>
                        <div
</>
className="space-y-2">
                          {analysisResult.ai.result.predictionFactors.map((factor: any /* , index */: number) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1"><>

                                <span className="font-medium">{factor.factor}</span>
                                <Badge
</>
variant={
                                  factor.impact === 'positive' ? 'default' : 
                                  factor.impact === 'negative' ? 'destructive' : 'secondary'
                                }>
                                  {factor.impact}
                                </Badge>
                              </div><>

                              <p className="text-sm text-muted-foreground">{factor.explanation}</p>
                              <div
</>
className="mt-2">
                                <Progress 
                                  value={factor.importance * 100} 
                                  className="h-2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Comparison Tab */}
              <TabsContent value="comparison" className="space-y-4">
                {analysisResult.comparison && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 border rounded-lg"><>

                        <p className="text-sm font-medium text-muted-foreground">Traditional</p>
                        <p
</>
className="text-xl font-bold">
                          ${analysisResult.comparison.traditionalCost.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg"><>

                        <p className="text-sm font-medium text-muted-foreground">AI Prediction</p>
                        <p
</>
className="text-xl font-bold">
                          ${analysisResult.comparison.aiCost.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg"><>

                        <p className="text-sm font-medium text-muted-foreground">Difference</p>
                        <p
</>
className="text-xl font-bold">
                          {analysisResult.comparison.percentageDifference.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommendation:</strong> {analysisResult.comparison.recommendation}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIEnhancedCostCalculator;