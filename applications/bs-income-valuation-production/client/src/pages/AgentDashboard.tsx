import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AgentResults } from "@/components/agent/AgentResults";
import { 
  IncomeAnalysis, 
  AnomalyDetection, 
  DataQualityAnalysis, 
  ValuationSummary,
  ValuationReport 
} from "@/types/agent-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/components/ui/api-error";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, LineChart, Lightbulb, Warning, FileText, Refresh, Loader2, InfoIcon, UserIcon, PieChart, Lock, ServerIcon  } from '@mui/icons-material';
import { useLocation } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServerError from "@/pages/ServerError";

export default function AgentDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { setCurrentStep } = useOnboarding();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("insights");
  const [globalErrorState, setGlobalErrorState] = useState<{
    hasError: boolean;
    statusCode?: number;
    message?: string;
  }>({ hasError: false });

  // Valuation analysis query
  const { 
    data: incomeAnalysis, 
    isLoading: isLoadingAnalysis,
    isError: isErrorAnalysis,
    error: analysisError,
    refetch: refetchAnalysis
  } = useQuery<IncomeAnalysis, Error, IncomeAnalysis, string[]>({
    queryKey: ['/api/agents/analyze-income'],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Anomaly detection query
  const { 
    data: anomalyData, 
    isLoading: isLoadingAnomalies,
    isError: isErrorAnomalies,
    error: anomalyError,
    refetch: refetchAnomalies
  } = useQuery<AnomalyDetection, Error, AnomalyDetection, string[]>({
    queryKey: ['/api/agents/detect-anomalies'],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Data quality query
  const { 
    data: dataQualityAnalysis, 
    isLoading: isLoadingDataQuality,
    isError: isErrorDataQuality,
    error: dataQualityError,
    refetch: refetchDataQuality
  } = useQuery<DataQualityAnalysis, Error, DataQualityAnalysis, string[]>({
    queryKey: ['/api/agents/analyze-data-quality'],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Valuation summary query
  const { 
    data: valuationSummary, 
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery<ValuationSummary, Error, ValuationSummary, string[]>({
    queryKey: ['/api/agents/valuation-summary'],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Report generation mutation
  const { 
    mutate: generateReport, 
    isPending: isGeneratingReport,
    error: reportGenerationError
  } = useMutation<
    ValuationReport, 
    Error, 
    typeof reportOptions
  >({
    mutationFn: async (reportOptions) => {
      return await apiRequest('/api/agents/generate-report', {
        method: 'POST',
        body: JSON.stringify(reportOptions),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "Your detailed valuation report has been created successfully.",
      });
      setReportData(data);
    },
    onError: (error) => {
      handleApiError(
        error,
        "Report Generation Failed",
        "Failed to generate report. Please try again.",
        {
          "No valuation data found": "You need to create valuations first before generating a report.",
          "Invalid period": "Invalid report period selected. Please choose monthly, quarterly, or yearly.",
          "Unauthorized": "Your session has expired. Please log in again.",
          "Network Error": "Network connection issue. Please check your internet connection."
        }
      );
    }
  });

  const [reportData, setReportData] = useState<ValuationReport | null>(null);
  const [reportOptions, setReportOptions] = useState({
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    includeCharts: true,
    includeInsights: true,
    includeRecommendations: true,
  });

  // If user is not authenticated and auth loading is complete, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the AI Agent Dashboard",
      });
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);
  
  // Trigger agent-intro onboarding step when dashboard is loaded
  useEffect(() => {
    if (!authLoading && isAuthenticated && !globalErrorState.hasError) {
      // Use a small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        setCurrentStep('agent-intro');
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, globalErrorState.hasError, setCurrentStep]);

  // Check for critical server errors
  useEffect(() => {
    const errors = [analysisError, anomalyError, dataQualityError, summaryError, reportGenerationError];
    
    // Check if any error is a server error (500)
    const serverError = errors.find(error => 
      error && (error.message.includes('500') || error.message.includes('Internal Server Error'))
    );
    
    if (serverError) {
      setGlobalErrorState({
        hasError: true,
        statusCode: 500,
        message: "We're experiencing technical difficulties with our AI services. Our team has been notified."
      });
    }
    
    // Check for widespread network errors
    const networkErrors = errors.filter(error => 
      error && (error.message.includes('Network Error') || error.message.includes('Failed to fetch'))
    );
    
    if (networkErrors.length >= 2) {
      setGlobalErrorState({
        hasError: true,
        message: "We're having trouble connecting to our servers. Please check your internet connection."
      });
    }
    
  }, [analysisError, anomalyError, dataQualityError, summaryError, reportGenerationError]);

  const handleGenerateReport = () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate reports",
        variant: "destructive",
      });
      return;
    }
    
    generateReport(reportOptions);
  };

  const handleRefreshAll = () => {
    refetchAnalysis();
    refetchAnomalies();
    refetchDataQuality();
    refetchSummary();
    toast({
      title: "Refreshing Data",
      description: "Retrieving the latest AI insights for your data.",
    });
  };
  
  // Consolidated error handling utility function with useCallback
  const handleApiError = useCallback((
    error: Error | null, 
    title: string, 
    defaultMessage: string,
    errorPatterns: Record<string, string>
  ) => {
    if (!error) return;
    
    let errorMessage = defaultMessage;
    
    if (error.message) {
      // Check if error message matches any of our known patterns
      for (const [pattern, message] of Object.entries(errorPatterns)) {
        if (error.message.includes(pattern)) {
          errorMessage = message;
          break;
        }
      }
      
      // If no specific pattern matched, use the full error message
      if (errorMessage === defaultMessage) {
        errorMessage = `Error: ${error.message}`;
      }
    }
    
    toast({
      title,
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);
  
  // Error handling effects
  useEffect(() => {
    if (isErrorAnalysis && analysisError) {
      handleApiError(
        analysisError,
        "Income Analysis Failed",
        "Failed to analyze income data. Please try again.",
        {
          "No income data found": "You need to add income sources before analyzing.",
          "Income analysis failed": "Income analysis failed. Please check your income data.",
          "Unauthorized": "Your session has expired. Please log in again.",
          "Network Error": "Network connection issue. Please check your internet connection."
        }
      );
    }
  }, [isErrorAnalysis, analysisError, handleApiError]);
  
  useEffect(() => {
    if (isErrorAnomalies && anomalyError) {
      handleApiError(
        anomalyError,
        "Anomaly Detection Failed",
        "Failed to detect anomalies. Please try again.",
        {
          "Insufficient valuation history": "You need at least two valuations to detect anomalies.",
          "Anomaly detection failed": "Anomaly detection failed. Please check your valuation data.",
          "Unauthorized": "Your session has expired. Please log in again.",
          "Network Error": "Network connection issue. Please check your internet connection."
        }
      );
    }
  }, [isErrorAnomalies, anomalyError, handleApiError]);
  
  useEffect(() => {
    if (isErrorDataQuality && dataQualityError) {
      handleApiError(
        dataQualityError,
        "Data Quality Analysis Failed",
        "Failed to analyze data quality. Please try again.",
        {
          "No income data found": "You need to add income sources to analyze data quality.",
          "Data quality analysis failed": "Data quality analysis failed. Please check your income data.",
          "Unauthorized": "Your session has expired. Please log in again.",
          "Network Error": "Network connection issue. Please check your internet connection."
        }
      );
    }
  }, [isErrorDataQuality, dataQualityError, handleApiError]);
  
  useEffect(() => {
    if (isErrorSummary && summaryError) {
      handleApiError(
        summaryError,
        "Valuation Summary Failed",
        "Failed to generate valuation summary. Please try again.",
        {
          "No valuation data found": "You need to create valuations first to get a summary.",
          "No income data found": "You need to add income sources to generate a summary.",
          "Failed to generate summary": "Summary generation failed. Please check your data.",
          "Unauthorized": "Your session has expired. Please log in again.",
          "Network Error": "Network connection issue. Please check your internet connection."
        }
      );
    }
  }, [isErrorSummary, summaryError, handleApiError]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 text-xl">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // Show global error if we have critical issues
  if (globalErrorState.hasError) {
    return (
      <ServerError
        statusCode={globalErrorState.statusCode}
        message={globalErrorState.message}
        actionLink="/dashboard"
        actionText="Return to Dashboard"
      />
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ErrorBoundary>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-800">AI Agent Dashboard</h1>
            {user && (
              <p className="text-slate-500 flex items-center gap-1 mt-1">
                <UserIcon className="h-3.5 w-3.5" />
                Analyzing data for {user.username}
              </p>
            )}
          </div>
          <Button onClick={handleRefreshAll} className="gap-2">
            <Refresh className="h-4 w-4" />
            Refresh All Insights
          </Button>
        </div><>

        <p className="text-muted-foreground mb-8">
          Gain powerful insights into your income and valuation data through our AI-powered agents
        </p>

        <Tabs
</>

defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8"><>

            <TabsTrigger value="insights">Valuation Insights</TabsTrigger>
            <TabsTrigger
</>

value="anomalies">Anomaly Detection</TabsTrigger><>

            <TabsTrigger value="quality">Data Quality</TabsTrigger>
            <TabsTrigger
</>

value="reports">Reports</TabsTrigger>
            <TabsTrigger value="mcp">MCP Integration</TabsTrigger>
          </TabsList>

          {/* Valuation Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><>

                  <Lightbulb className="mr-2 h-5 w-5" />
                  Valuation Summary
                </CardTitle>
                <CardDescription
</>

</>>
                  AI-generated overview of your current valuation status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSummary ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : isErrorSummary ? (
                  <ApiError
                    title="Valuation Summary Failed"
                    error={summaryError}
                    message="Unable to load valuation summary. You may need to create valuations first."
                    onRetry={() => refetchSummary()}
                  />
                ) : valuationSummary ? (
                  <div className="prose max-w-none">
                    <p className="text-lg">{valuationSummary.summary}</p>
                  </div>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4 mr-2" /><>

                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription
</>

</>>
                      Add income sources and create valuations to get AI insights.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => refetchSummary()}
                  disabled={isLoadingSummary}
                  className="gap-2"
                >
                  {isLoadingSummary ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                  ) : (
                      <Refresh className="h-4 w-4" />
                      Refresh
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><>

                  <LineChart className="mr-2 h-5 w-5" />
                  Income Analysis
                </CardTitle>
                <CardDescription
</>

</>>
                  Detailed analysis of your income sources and potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnalysis ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : isErrorAnalysis ? (
                  <ApiError
                    title="Income Analysis Failed"
                    error={analysisError}
                    message="Unable to analyze income. You may need to add income sources first."
                    onRetry={() => refetchAnalysis()}
                  />
                ) : incomeAnalysis ? (
                  <div className="space-y-4">
                    {incomeAnalysis.analysis && (
                        <div><>

                          <h3 className="font-medium mb-2">Key Findings</h3>
                          <ul
</>

className="list-disc pl-5 space-y-1">
                            {incomeAnalysis.analysis.findings.map((finding: string /* , index */: number) => (
                              <li key={index}>{finding}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <Separator />
                        
                        <div><>

                          <h3 className="font-medium mb-2">Income Distribution</h3>
                          <div
</>

className="grid grid-cols-2 gap-4">
                            {incomeAnalysis.analysis.distribution.map((item: any /* , index */: number) => (
                              <div key={index} className="flex justify-between"><>

                                <span className="font-medium">{item.source}:</span>
                                <span
</>

</>>{item.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div><>

                          <h3 className="font-medium mb-2">Recommendations</h3>
                          <ul
</>

className="list-disc pl-5 space-y-1">
                            {incomeAnalysis.analysis.recommendations.map((rec: string /* , index */: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4 mr-2" /><>

                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription
</>

</>>
                      Add income sources to get AI analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline"
                  onClick={() => refetchAnalysis()}
                  disabled={isLoadingAnalysis}
                  className="gap-2"
                >
                  {isLoadingAnalysis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                  ) : (
                      <Refresh className="h-4 w-4" />
                      Refresh Analysis
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Anomaly Detection Tab */}
          <TabsContent value="anomalies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><>

                  <Warning className="mr-2 h-5 w-5" />
                  Valuation Anomalies
                </CardTitle>
                <CardDescription
</>

</>>
                  AI-detected unusual patterns in your valuation history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnomalies ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : isErrorAnomalies ? (
                  <ApiError
                    title="Anomaly Detection Failed"
                    error={anomalyError}
                    message="Unable to detect anomalies. You need at least two valuations for anomaly detection."
                    onRetry={() => refetchAnomalies()}
                  />
                ) : anomalyData ? (
                  <div className="space-y-4">
                    {anomalyData.anomalies && anomalyData.anomalies.length > 0 ? (
                      <div><>

                        <h3 className="font-medium mb-2">Detected Anomalies</h3>
                        <div
</>

className="space-y-4">
                          {anomalyData.anomalies.map((anomaly: any /* , index */: number) => (
                            <Alert key={index} variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                              <AlertTitle className="flex items-center">
                                {anomaly.type} <span className="ml-2 text-sm bg-primary/20 px-2 py-0.5 rounded">{anomaly.severity} severity</span>
                              </AlertTitle>
                              <AlertDescription>
                                <p>{anomaly.description}</p>
                                {anomaly.recommendation && (
                                  <div className="mt-2">
                                    <span className="font-medium">Recommendation:</span> {anomaly.recommendation}
                                  </div>
                                )}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <InfoIcon className="h-4 w-4 mr-2" /><>

                        <AlertTitle>No Anomalies Detected</AlertTitle>
                        <AlertDescription
</>

</>>
                          Your valuation history appears consistent with no unusual patterns.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {anomalyData.insights && (
                      <div className="mt-6"><>

                        <h3 className="font-medium mb-2">Trend Insights</h3>
                        <ul
</>

className="list-disc pl-5 space-y-2">
                          {anomalyData.insights.map((insight: string /* , index */: number) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4 mr-2" /><>

                    <AlertTitle>Insufficient Data</AlertTitle>
                    <AlertDescription
</>

</>>
                      You need at least two valuations to detect anomalies. Create more valuations to enable this feature.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => refetchAnomalies()}
                  disabled={isLoadingAnomalies}
                  className="gap-2"
                >
                  {isLoadingAnomalies ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                  ) : (
                      <Refresh className="h-4 w-4" />
                      Refresh Anomalies
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="quality">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><>

                  <PieChart className="mr-2 h-5 w-5" />
                  Data Quality Assessment
                </CardTitle>
                <CardDescription
</>

</>>
                  AI analysis of your income data quality and potential issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDataQuality ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[85%]" />
                  </div>
                ) : isErrorDataQuality ? (
                  <ApiError
                    title="Data Quality Analysis Failed"
                    error={dataQualityError}
                    message="Unable to analyze data quality. You may need to add income data first."
                    onRetry={() => refetchDataQuality()}
                  />
                ) : dataQualityAnalysis ? (
                  <div className="space-y-6">
                    {dataQualityAnalysis.qualityScore !== undefined && (
                      <div className="mb-6"><>

                        <h3 className="font-medium mb-2">Overall Data Quality Score</h3>
                        <div
</>

className="flex items-center gap-4"><>

                          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold" 
                            style={{ 
                              borderColor: dataQualityAnalysis.qualityScore > 80 ? 'green' : 
                                         dataQualityAnalysis.qualityScore > 60 ? 'orange' : 'red'
                            }}>
                            {dataQualityAnalysis.qualityScore}
                          </div>
                          <div
</>

</>><>

                            <div className="text-sm text-muted-foreground">
                              {dataQualityAnalysis.qualityScore > 80 ? 'Excellent' : 
                               dataQualityAnalysis.qualityScore > 60 ? 'Good' : 'Needs Improvement'}
                            </div>
                            <div
</>

className="text-xs text-muted-foreground mt-1">
                              Based on {dataQualityAnalysis.totalRecords} income records
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {dataQualityAnalysis.issues && dataQualityAnalysis.issues.length > 0 ? (
                      <div><>

                        <h3 className="font-medium mb-2">Detected Issues</h3>
                        <div
</>

className="space-y-4">
                          {dataQualityAnalysis.issues.map((issue: any /* , index */: number) => (
                            <Alert key={index} variant={issue.severity === 'high' ? 'destructive' : 'default'}><>

                              <AlertTitle>{issue.type}</AlertTitle>
                              <AlertDescription
</>

</>>
                                <p>{issue.description}</p>
                                {issue.affectedRecords && (
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    Affects {issue.affectedRecords} {issue.affectedRecords === 1 ? 'record' : 'records'}
                                  </div>
                                )}
                                {issue.recommendation && (
                                  <div className="mt-2">
                                    <span className="font-medium">Suggested Fix:</span> {issue.recommendation}
                                  </div>
                                )}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <InfoIcon className="h-4 w-4 mr-2" /><>

                        <AlertTitle>No Issues Detected</AlertTitle>
                        <AlertDescription
</>

</>>
                          Your income data appears to be clean and consistent.
                        </AlertDescription>
                      </Alert>
                    )}

                    {dataQualityAnalysis.potentialDuplicates && dataQualityAnalysis.potentialDuplicates.length > 0 && (
                      <div className="mt-6"><>

                        <h3 className="font-medium mb-2">Potential Duplicate Entries</h3>
                        <Alert
</>

</>><>

                          <AlertTitle>We found {dataQualityAnalysis.potentialDuplicates.length} potential duplicate groups</AlertTitle>
                          <AlertDescription
</>

</>>
                            Review these similar entries and consider removing duplicates to improve data quality.
                          </AlertDescription>
                        </Alert>
                        {/* We could add detailed duplicate info here if needed */}
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4 mr-2" /><>

                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription
</>

</>>
                      Add income sources to get data quality analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => refetchDataQuality()}
                  disabled={isLoadingDataQuality}
                  className="gap-2"
                >
                  {isLoadingDataQuality ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                  ) : (
                      <Refresh className="h-4 w-4" />
                      Refresh Analysis
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><>

                  <FileText className="mr-2 h-5 w-5" />
                  Generate Comprehensive Report
                </CardTitle>
                <CardDescription
</>

</>>
                  Create detailed valuation reports with customizable options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div><>

                      <label className="block text-sm font-medium mb-1">Time Period</label>
                      <select
</>

                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={reportOptions.period}
                        onChange={(e) => setReportOptions({
                          ...reportOptions, 
                          period: e.target.value as 'monthly' | 'quarterly' | 'yearly'
                        })}
                        disabled={isGeneratingReport}
                      ><>

                        <option value="monthly">Monthly</option>
                        <option
</>

value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2"><>

                      <label className="block text-sm font-medium">Include in Report</label>
                      
                      <div
</>

className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="includeCharts"
                          checked={reportOptions.includeCharts}
                          onChange={(e) => setReportOptions({...reportOptions, includeCharts: e.target.checked})}
                          className="rounded border-gray-300"
                          disabled={isGeneratingReport}
                        />
                        <label htmlFor="includeCharts">Charts & Visualizations</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="includeInsights"
                          checked={reportOptions.includeInsights}
                          onChange={(e) => setReportOptions({...reportOptions, includeInsights: e.target.checked})}
                          className="rounded border-gray-300"
                          disabled={isGeneratingReport}
                        />
                        <label htmlFor="includeInsights">AI Insights</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="includeRecommendations"
                          checked={reportOptions.includeRecommendations}
                          onChange={(e) => setReportOptions({...reportOptions, includeRecommendations: e.target.checked})}
                          className="rounded border-gray-300"
                          disabled={isGeneratingReport}
                        />
                        <label htmlFor="includeRecommendations">Recommendations</label>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport || !isAuthenticated}
                        className="w-full"
                      >
                        {isGeneratingReport ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </div>
                        ) : !isAuthenticated ? (
                          <div className="flex items-center justify-center">
                            <Lock className="h-4 w-4 mr-2" />
                            Sign In Required
                          </div>
                        ) : (
                          "Generate Report"
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-muted/50"><>

                    <h3 className="font-medium mb-2">What's Included</h3>
                    <ul
</>

className="space-y-2 text-sm">
                      <li className="flex">
                        <ChevronRight className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
                        <span><span className="font-medium">Valuation Metrics:</span> Comprehensive breakdown of your valuation calculations</span>
                      </li>
                      <li className="flex">
                        <ChevronRight className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
                        <span><span className="font-medium">Period Analysis:</span> Data broken down by your selected time period</span>
                      </li>
                      <li className="flex">
                        <ChevronRight className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
                        <span><span className="font-medium">AI Insights:</span> Detailed observations about your income and valuation trends</span>
                      </li>
                      <li className="flex">
                        <ChevronRight className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
                        <span><span className="font-medium">Recommendations:</span> Actionable advice to improve your valuation</span>
                      </li>
                      <li className="flex">
                        <ChevronRight className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
                        <span><span className="font-medium">Charts:</span> Visual representations of key data points</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {reportGenerationError && (
                  <div className="mt-6">
                    <ApiError
                      title="Report Generation Failed"
                      error={reportGenerationError}
                      message="Unable to generate your report. Please try again."
                      onRetry={() => handleGenerateReport()}
                    />
                  </div>
                )}
                
                {reportData && (
                  <div className="mt-8 border-t pt-6"><>

                    <h3 className="text-xl font-bold mb-4">Report Results</h3>
                    
                    <div
</>

className="prose max-w-none">
                      <div className="bg-muted p-4 rounded-md mb-4"><>

                        <h4 className="font-medium">Summary</h4>
                        <p
</>

</>>{reportData.summary}</p>
                      </div>
                      
                      {reportData.metrics && (
                        <div className="mb-6"><>

                          <h4 className="font-medium mb-2">Key Metrics</h4>
                          <div
</>

className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-muted p-3 rounded-md"><>

                              <div className="text-sm text-muted-foreground">Total Annual Income</div>
                              <div
</>

className="text-lg font-bold">${reportData.metrics.totalAnnualIncome.toLocaleString()}</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md"><>

                              <div className="text-sm text-muted-foreground">Weighted Multiplier</div>
                              <div
</>

className="text-lg font-bold">{reportData.metrics.weightedMultiplier.toFixed(2)}x</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md"><>

                              <div className="text-sm text-muted-foreground">Latest Valuation</div>
                              <div
</>

className="text-lg font-bold">${reportData.metrics.latestValuationAmount.toLocaleString()}</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md"><>

                              <div className="text-sm text-muted-foreground">Income Sources</div>
                              <div
</>

className="text-lg font-bold">{reportData.metrics.incomeSourceCount}</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md"><>

                              <div className="text-sm text-muted-foreground">Income Streams</div>
                              <div
</>

className="text-lg font-bold">{reportData.metrics.incomeStreamCount}</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md"><>

                              <div className="text-sm text-muted-foreground">Annual Growth Rate</div>
                              <div
</>

className="text-lg font-bold">{(reportData.metrics.annualGrowthRate * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {reportData.insights && reportData.insights.length > 0 && (
                        <div className="mb-6"><>

                          <h4 className="font-medium mb-2">Key Insights</h4>
                          <div
</>

className="space-y-3">
                            {reportData.insights.map((insight: any /* , index */: number) => (
                              <div 
                                key={index} 
                                className={`p-3 rounded-md ${
                                  insight.type === 'positive' ? 'bg-green-100 text-green-800' : 
                                  insight.type === 'negative' ? 'bg-red-100 text-red-800' : 
                                  'bg-blue-100 text-blue-800'
                                }`}
                              >
                                <div className="flex justify-between"><>

                                  <div>{insight.message}</div>
                                  <div
</>

className="text-xs font-medium">
                                    {insight.importance === 'high' ? 'HIGH' : 
                                     insight.importance === 'medium' ? 'MEDIUM' : 'LOW'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {reportData.recommendations && reportData.recommendations.length > 0 && (
                        <div className="mb-6"><>

                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <div
</>

className="space-y-4">
                            {reportData.recommendations.map((rec: any /* , index */: number) => (
                              <div key={index} className="bg-muted p-4 rounded-md">
                                <div className="flex justify-between"><>

                                  <h5 className="font-medium">{rec.title}</h5>
                                  <span
</>

className="text-xs font-medium">
                                    {rec.priority === 'high' ? 'HIGH PRIORITY' : 
                                     rec.priority === 'medium' ? 'MEDIUM PRIORITY' : 'LOW PRIORITY'}
                                  </span>
                                </div>
                                <p className="mt-1">{rec.description}</p>
                                {rec.actionItems && rec.actionItems.length > 0 && (
                                  <div className="mt-2"><>

                                    <div className="text-sm font-medium">Action Items:</div>
                                    <ul
</>

className="list-disc pl-5 text-sm">
                                      {rec.actionItems.map((item: string, i: number) => (
                                        <li key={i}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MCP Integration Tab */}
          <TabsContent value="mcp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><>

                  <ServerIcon className="mr-2 h-5 w-5" />
                  Multi-Channel Processing Integration
                </CardTitle>
                <CardDescription
</>

</>>
                  Access advanced data processing features through the MCP integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentResults />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </div>
  );
}