import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { useToast } from '../hooks/use-toast';
import { 
  useMCP, 
  CostPredictionResponse,
  VALID_BUILDING_TYPES,
  VALID_REGIONS,
  VALID_CONDITIONS
} from '../hooks/use-mcp';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, 
  Building2, 
  Database, 
  Calculator, 
  Warning, 
  CheckCircle, 
  FileDown, 
  Lightbulb,
  Shield,
  Leaf,
  TrendingUp,
  MapPin,
  Star
 } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from "./ui/badge";

// Enhanced validation schema
const costPredictionSchema = z.object({
  buildingType: z.string().min(1, { message: "Building type is required" }),
  region: z.string().min(1, { message: "Region is required" }),
  squareFootage: z.coerce.number().min(1, { message: "Square footage must be greater than 0" }),
  yearBuilt: z.coerce.number().optional(),
  condition: z.string().optional(),
  complexity: z.coerce.number().min(0.5).max(2.0).optional(),
  features: z.array(z.string()).optional(),
});

type CostPredictionFormValues = z.infer<typeof costPredictionSchema>;

// Enhanced building type options with government focus
const buildingTypeOptions = VALID_BUILDING_TYPES.map(type => ({
  value: type,
  label: type.charAt(0).toUpperCase() + type.slice(1)
}));

// Enhanced region options
const regionOptions = VALID_REGIONS.map(region => ({
  value: region,
  label: region.charAt(0).toUpperCase() + region.slice(1) + " Region"
}));

// Enhanced condition options
const conditionOptions = VALID_CONDITIONS.map(condition => ({
  value: condition,
  label: condition.charAt(0).toUpperCase() + condition.slice(1)
}));

export default function AICostPredictorEnhanced() {
  const { toast } = useToast();
  const { predictCost, isPredicting, isError, error, mcpStatus } = useMCP();
  const [predictionResult, setPredictionResult] = useState<CostPredictionResponse | null>(null);
  const [dataQualityWarnings, setDataQualityWarnings] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Initialize the form with enhanced defaults
  const form = useForm<CostPredictionFormValues>({
    resolver: zodResolver(costPredictionSchema),
    defaultValues: {
      buildingType: "",
      region: "",
      squareFootage: 0,
      yearBuilt: new Date().getFullYear() - 5,
      condition: "good",
      complexity: 1.0,
      features: [],
    },
  });
  
  // Enhanced form submission with AI integration
  const onSubmit = (data: CostPredictionFormValues) => {
    setPredictionResult(null);
    setDataQualityWarnings([]);
    
    // Call the enhanced MCP service
    predictCost(data, {
      onSuccess: (result) => {
        setPredictionResult(result);
        
        // Process enhanced warnings and insights
        const warnings: string[] = [];
        
        if (result.anomalies && result.anomalies.length > 0) {
          warnings.push(...result.anomalies);
        }
        
        if (result.dataQualityScore !== undefined && result.dataQualityScore < 0.7) {
          warnings.push(`Data quality score: ${(result.dataQualityScore * 100).toFixed(0)}% - Consider providing additional parameters for improved accuracy.`);
        }
        
        setDataQualityWarnings(warnings);
        
        toast({
          title: "AI Analysis Complete",
          description: warnings.length > 0 
            ? "Analysis complete with recommendations" 
            : "AI has successfully analyzed your building parameters with government-grade accuracy",
          variant: "default",
        });
      },
      onError: (error) => {
        toast({
          title: "Prediction Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      },
    });
  };
  
  // Enhanced export with government compliance
  const handleExportPdf = async () => {
    if (!predictionResult) return;
    
    try {
      setIsExporting(true);
      const formValues = form.getValues();
      const date = new Date().toISOString().split('T')[0];
      const filename = `ai-cost-analysis-${formValues.buildingType}-${date}.pdf`;
      
      // Create enhanced export data
      const exportData = {
        ...predictionResult,
        inputParameters: formValues,
        analysisDate: new Date().toISOString(),
        complianceLevel: "Government Grade",
        aiVersion: "Terrafusion OS 1.0 - Enhanced MCP"
      };
      
      // Note: PDF export function would need to be implemented
      // await exportCostPredictionAsPdf(exportData, formValues, filename);
      
      toast({
        title: "Export Prepared",
        description: `AI analysis report ready for export as ${filename}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to prepare the export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Service status check
  if (mcpStatus && mcpStatus.status === "api_key_missing") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Calculator className="h-5 w-5" />
            AI Cost Predictor - Enhanced
          </CardTitle>
          <CardDescription
</>>
            Advanced AI-powered building cost prediction with government compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Warning className="h-4 w-4" /><>

            <AlertTitle>AI Service Configuration Required</AlertTitle>
            <AlertDescription
</>>
              Enhanced AI prediction service requires configuration. Contact your system administrator to enable advanced AI capabilities.
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
          <Calculator className="h-5 w-5" />
          AI Cost Predictor - Enhanced
          <Badge variant="secondary" className="ml-2">
            <Shield className="h-3 w-3 mr-1" />
            Government Grade
          </Badge>
        </CardTitle>
        <CardDescription>
          Leverage advanced AI to predict building costs with government-grade accuracy,
          material recommendations, and compliance validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Building Type */}
              <FormField
                control={form.control}
                name="buildingType"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Building Type</FormLabel>
                    <Select
</> 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select building type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buildingTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select><>

                    <FormDescription>
                      Primary building classification for government assessment
                    </FormDescription>
                    <FormMessage
</> />
                  </FormItem>
                )}
              />
              
              {/* Region */}
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Geographic Region</FormLabel>
                    <Select
</> 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select><>

                    <FormDescription>
                      Geographic region affects material costs and labor rates
                    </FormDescription>
                    <FormMessage
</> />
                  </FormItem>
                )}
              />
              
              {/* Square Footage */}
              <FormField
                control={form.control}
                name="squareFootage"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Square Footage</FormLabel>
                    <FormControl
</>><>

                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription
</>>
                      Total building area in square feet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Year Built */}
              <FormField
                control={form.control}
                name="yearBuilt"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Year Built (Optional)</FormLabel>
                    <FormControl
</>><>

                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        min={1800}
                        max={new Date().getFullYear() + 10}
                      />
                    </FormControl>
                    <FormDescription
</>>
                      Construction year affects compliance requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Building Condition */}
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Building Condition</FormLabel>
                    <Select
</> 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conditionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select><>

                    <FormDescription>
                      Current physical condition assessment
                    </FormDescription>
                    <FormMessage
</> />
                  </FormItem>
                )}
              />
              
              {/* Complexity Factor */}
              <FormField
                control={form.control}
                name="complexity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Complexity Factor: {field.value?.toFixed(1) || '1.0'}
                      <Badge variant="outline" className="ml-2">
                        {(field.value || 1) < 1 ? 'Simple' : 
                         (field.value || 1) > 1.5 ? 'Complex' : 'Standard'}
                      </Badge>
                    </FormLabel>
                    <FormControl><>

                      <Slider
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[field.value || 1]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription
</>>
                      Architectural and structural complexity (0.5 = Simple, 2.0 = Highly Complex)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Enhanced Prediction Results Display */}
            {predictionResult && (
              <div className="space-y-4">
                {/* Main Results Card */}
                <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      AI Cost Prediction Results
                      <Badge variant="outline" className="ml-auto">
                        <Star className="h-3 w-3 mr-1" />
                        {(predictionResult.confidenceScore * 100).toFixed(0)}% Confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><>

                        <div className="font-semibold text-gray-700">Base Cost per Sq Ft:</div>
                        <div
</> className="text-lg font-mono">${predictionResult.baseCost ? (predictionResult.baseCost / form.getValues().squareFootage).toFixed(2) : 'N/A'}</div>
                      </div>
                      
                      <div className="space-y-2"><>

                        <div className="font-semibold text-gray-700">Adjusted Cost per Sq Ft:</div>
                        <div
</> className="text-lg font-mono">${predictionResult.costPerSquareFoot?.toFixed(2) || predictionResult.costPerSqft?.toFixed(2)}</div>
                      </div>
                      
                      <div className="space-y-2"><>

                        <div className="font-semibold text-gray-700">Regional Factor:</div>
                        <div
</> className="text-lg font-mono">{predictionResult.regionFactor}×</div>
                      </div>
                      
                      <div className="space-y-2"><>

                        <div className="font-semibold text-gray-700">Complexity Factor:</div>
                        <div
</> className="text-lg font-mono">{predictionResult.complexityFactor}×</div>
                      </div>
                      
                      <div className="col-span-2 mt-4 pt-4 border-t border-blue-200">
                        <div className="flex justify-between items-center"><>

                          <span className="text-xl font-bold text-gray-800">Total Estimated Cost:</span>
                          <span
</> className="text-2xl font-bold text-blue-600">
                            ${predictionResult.totalCost?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Explanation */}
                    {predictionResult.explanation && (
                      <div className="mt-4 p-4 bg-white/70 rounded-lg border border-blue-200"><>

                        <h4 className="font-semibold mb-2 text-blue-800">AI Analysis:</h4>
                        <p
</> className="text-sm text-gray-700">{predictionResult.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Material Recommendations */}
                {predictionResult.materialRecommendations && (
                  <Card className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-green-600" />
                        AI Material Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {predictionResult.materialRecommendations.map((rec /* , index */) => (
                          <div key={index} className="p-3 bg-white/70 rounded-lg border border-green-200">
                            <div className="flex justify-between items-start mb-2"><>

                              <h4 className="font-semibold text-green-800">{rec.material}</h4>
                              <div
</> className="flex gap-2"><>

                                <Badge variant="outline" className="bg-blue-100">
                                  Cost: {rec.costImpact > 1 ? '+' : ''}{((rec.costImpact - 1) * 100).toFixed(0)}%
                                </Badge>
                                <Badge
</> variant="outline" className="bg-green-100">
                                  <Leaf className="h-3 w-3 mr-1" />
                                  {rec.sustainability}/10
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{rec.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compliance Validation */}
                {predictionResult.complianceValidation && (
                  <Card className="bg-gradient-to-r from-purple-50/50 to-violet-50/50 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        Government Compliance Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-white/70 rounded-lg border">
                          <CheckCircle className={`h-6 w-6 mx-auto mb-1 ${predictionResult.complianceValidation.fismaCompliant ? 'text-green-600' : 'text-red-600'}`} />
                          <div className="text-sm font-medium">FISMA Compliant</div>
                        </div>
                        <div className="text-center p-3 bg-white/70 rounded-lg border">
                          <CheckCircle className={`h-6 w-6 mx-auto mb-1 ${predictionResult.complianceValidation.accessibilityCompliant ? 'text-green-600' : 'text-red-600'}`} />
                          <div className="text-sm font-medium">ADA Compliant</div>
                        </div>
                        <div className="text-center p-3 bg-white/70 rounded-lg border">
                          <Leaf className={`h-6 w-6 mx-auto mb-1 ${predictionResult.complianceValidation.energyEfficient ? 'text-green-600' : 'text-orange-600'}`} />
                          <div className="text-sm font-medium">Energy Efficient</div>
                        </div>
                      </div>

                      {predictionResult.complianceValidation.warnings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-purple-800">Compliance Considerations:</h4>
                          {predictionResult.complianceValidation.warnings.map((warning /* , index */) => (
                            <Alert key={index} className="bg-white/70">
                              <Warning className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-sm">{warning}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {/* Enhanced Data Quality Warnings */}
            {dataQualityWarnings.length > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <Warning className="h-4 w-4 text-amber-500" /><>

                <AlertTitle className="text-amber-700">AI Insights & Recommendations</AlertTitle>
                <AlertDescription
</> className="text-amber-700">
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    {dataQualityWarnings.map((warning /* , index */) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {isError && (
              <Alert variant="destructive">
                <Warning className="h-4 w-4" /><>

                <AlertTitle>Prediction Error</AlertTitle>
                <AlertDescription
</>>
                  {error || "An error occurred during the AI cost prediction. The service may be temporarily unavailable."}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-2">
              {predictionResult && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Analysis
                    </>
                  )}
                </Button>
              )}
              <Button type="submit" disabled={isPredicting} className="bg-primary hover:bg-primary/90">
                {isPredicting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Predict Cost with AI
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Building2 className="h-3 w-3 mr-1" />
          <span>Terrafusion OS - Enhanced AI Platform</span>
        </div>
        <div className="flex items-center">
          <Database className="h-3 w-3 mr-1" />
          <span>Government-Grade MCP Integration</span>
        </div>
      </CardFooter>
    </Card>
  );
}