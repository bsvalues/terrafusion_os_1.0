import { useState } from 'react';
import { useAgentServices } from '@/hooks/use-agent-services';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/components/ui/api-error';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Warning, ChevronRight, FileText, PieChart, Refresh, CheckCircle, AlertCircle, InfoIcon  } from '@mui/icons-material';

/**
 * AgentResults Component
 * 
 * Displays results from various AI agents in a tabbed interface
 */
export function AgentResults() {
  const {
    useIncomeAnalysis,
    useAnomalyDetection,
    useDataQualityAnalysis,
    useGenerateReport
  } = useAgentServices();

  // Current active tab
  const [activeTab, setActiveTab] = useState('income-analysis');
  
  // Report generation options
  const [reportOptions, setReportOptions] = useState({
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    includeCharts: true,
    includeInsights: true,
    includeRecommendations: true
  });
  
  // Fetch data using hooks
  const { 
    data: incomeAnalysis,
    isLoading: isIncomeAnalysisLoading,
    error: incomeAnalysisError,
    refetch: refetchIncomeAnalysis
  } = useIncomeAnalysis();
  
  const { 
    data: anomalyDetection,
    isLoading: isAnomalyDetectionLoading,
    error: anomalyDetectionError,
    refetch: refetchAnomalyDetection
  } = useAnomalyDetection();
  
  const { 
    data: dataQualityAnalysis,
    isLoading: isDataQualityAnalysisLoading,
    error: dataQualityAnalysisError,
    refetch: refetchDataQuality
  } = useDataQualityAnalysis();
  
  const {
    mutate: generateReport,
    isPending: isGeneratingReport,
    error: reportGenerationError
  } = useGenerateReport();

  // Handle report generation
  const handleGenerateReport = () => {
    generateReport(reportOptions);
  };

  // UI helpers
  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-slate-500';
    }
  };

  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'negative': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'neutral': return <InfoIcon className="h-5 w-5 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader><>

        <CardTitle>AI-Powered Analysis</CardTitle>
        <CardDescription
</>

</>>
          Intelligent insights and recommendations based on your income and valuation data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4"><>

            <TabsTrigger value="income-analysis">Income Analysis</TabsTrigger>
            <TabsTrigger
</>

value="anomaly-detection">Anomaly Detection</TabsTrigger><>

            <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
            <TabsTrigger
</>

value="report-generation">Report Generation</TabsTrigger>
          </TabsList>

          {/* Income Analysis Tab */}
          <TabsContent value="income-analysis">
            {isIncomeAnalysisLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : incomeAnalysisError ? (
              <ApiError 
                title="Income Analysis Error"
                message="Failed to load income analysis data"
                error={incomeAnalysisError as Error}
                onRetry={() => refetchIncomeAnalysis()}
              />
            ) : incomeAnalysis ? (
              <div className="space-y-6"><>

                <h3 className="text-lg font-medium">Key Findings</h3>
                <ul
</>

className="space-y-2">
                  {incomeAnalysis.analysis.findings.map((finding /* , index */) => (
                    <li key={index} className="flex items-start">
                      <ChevronRight className="h-5 w-5 mr-2 mt-0.5 text-primary" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul><>

                <h3 className="text-lg font-medium">Income Distribution</h3>
                <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomeAnalysis.analysis.distribution.map((item /* , index */) => (
                    <div key={index} className="flex justify-between items-center border p-3 rounded-md"><>

                      <span className="font-medium">{item.source}</span>
                      <Badge
</>

variant="outline">{item.percentage}%</Badge>
                    </div>
                  ))}
                </div><>

                <h3 className="text-lg font-medium">Recommendations</h3>
                <Accordion
</>

type="single" collapsible className="w-full">
                  {incomeAnalysis.analysis.recommendations.map((recommendation /* , index */) => (
                    <AccordionItem key={index} value={`item-${index}`}><>

                      <AccordionTrigger>Recommendation {index + 1}</AccordionTrigger>
                      <AccordionContent
</>

</>>
                        {recommendation}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <Alert><>

                <AlertTitle>No analysis available</AlertTitle>
                <AlertDescription
</>

</>>
                  Add income sources to generate an analysis of your income portfolio.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Anomaly Detection Tab */}
          <TabsContent value="anomaly-detection">
            {isAnomalyDetectionLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : anomalyDetectionError ? (
              <ApiError 
                title="Anomaly Detection Error"
                message="Failed to load anomaly detection data"
                error={anomalyDetectionError as Error}
                onRetry={() => refetchAnomalyDetection()}
              />
            ) : anomalyDetection ? (
              <div className="space-y-6">
                {anomalyDetection.anomalies.length > 0 ? (<>

                    <h3 className="text-lg font-medium">Detected Anomalies</h3>
                    <div
</>

className="space-y-4">
                      {anomalyDetection.anomalies.map((anomaly /* , index */) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Warning className={`h-5 w-5 ${getSeverityColor(anomaly.severity)}`} /><>

                            <h4 className="font-medium">{anomaly.type}</h4>
                            <Badge
</>

variant={
                              anomaly.severity === 'high' ? 'destructive' : 
                              anomaly.severity === 'medium' ? 'outline' : 'secondary'
                            }>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                          {anomaly.recommendation && (
                            <div className="text-sm bg-muted p-3 rounded-md mt-2">
                              <strong>Recommendation:</strong> {anomaly.recommendation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                ) : (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" /><>

                    <AlertTitle>No anomalies detected</AlertTitle>
                    <AlertDescription
</>

</>>
                      Your valuation data appears to be consistent with no unusual patterns.
                    </AlertDescription>
                  </Alert>
                )}<>

                <h3 className="text-lg font-medium mt-6">Insights</h3>
                <ul
</>

className="space-y-2">
                  {anomalyDetection.insights.map((insight /* , index */) => (
                    <li key={index} className="flex items-start">
                      <ChevronRight className="h-5 w-5 mr-2 mt-0.5 text-primary" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Alert><>

                <AlertTitle>No anomaly detection available</AlertTitle>
                <AlertDescription
</>

</>>
                  Add multiple valuations over time to enable anomaly detection.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="data-quality">
            {isDataQualityAnalysisLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : dataQualityAnalysisError ? (
              <ApiError 
                title="Data Quality Analysis Error"
                message="Failed to load data quality analysis"
                error={dataQualityAnalysisError as Error}
                onRetry={() => refetchDataQuality()}
              />
            ) : dataQualityAnalysis ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center"><>

                  <h3 className="text-lg font-medium">Data Quality Score</h3>
                  <Badge
</>

variant={
                    dataQualityAnalysis.qualityScore >= 80 ? 'default' : 
                    dataQualityAnalysis.qualityScore >= 60 ? 'outline' : 'destructive'
                  }>
                    {dataQualityAnalysis.qualityScore}/100
                  </Badge>
                </div>
                
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-muted">
                        Quality
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block">
                        {dataQualityAnalysis.qualityScore}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
                    <div 
                      style={{ width: `${dataQualityAnalysis.qualityScore}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap justify-center ${
                        dataQualityAnalysis.qualityScore >= 80 ? 'bg-green-500' : 
                        dataQualityAnalysis.qualityScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    ></div>
                  </div>
                </div>

                <h3 className="text-lg font-medium">Issues Found ({dataQualityAnalysis.issues.length})</h3>
                {dataQualityAnalysis.issues.length > 0 ? (
                  <div className="space-y-4">
                    {dataQualityAnalysis.issues.map((issue /* , index */) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Warning className={`h-5 w-5 ${getSeverityColor(issue.severity)}`} /><>

                          <h4 className="font-medium">{issue.type}</h4>
                          <Badge
</>

variant={
                            issue.severity === 'high' ? 'destructive' : 
                            issue.severity === 'medium' ? 'outline' : 'secondary'
                          }>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                        {issue.affectedRecords && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            Affects {issue.affectedRecords} record(s)
                          </span>
                        )}
                        {issue.recommendation && (
                          <div className="text-sm bg-muted p-3 rounded-md mt-2">
                            <strong>Recommendation:</strong> {issue.recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" /><>

                    <AlertTitle>No data issues detected</AlertTitle>
                    <AlertDescription
</>

</>>
                      Your data appears to be high quality with no significant issues.
                    </AlertDescription>
                  </Alert>
                )}

                {dataQualityAnalysis.potentialDuplicates.length > 0 && (<>

                    <h3 className="text-lg font-medium">Potential Duplicates</h3>
                    <Accordion
</>

type="single" collapsible className="w-full">
                      {dataQualityAnalysis.potentialDuplicates.map((group /* , index */) => (
                        <AccordionItem key={index} value={`group-${index}`}><>

                          <AccordionTrigger>
                            Duplicate Group {index + 1} ({group.records.length} items)
                          </AccordionTrigger>
                          <AccordionContent
</>

</>>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {group.records.map((record, recordIndex) => (
                                <div key={recordIndex} className="border p-2 rounded-md text-sm">
                                  <div><strong>ID:</strong> {record.id}</div>
                                  <div><strong>Source:</strong> {record.source}</div>
                                  <div><strong>Amount:</strong> {record.amount}</div>
                                  <div><strong>Similarity:</strong> {record.similarity}%</div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                )}
              </div>
            ) : (
              <Alert><>

                <AlertTitle>No data quality analysis available</AlertTitle>
                <AlertDescription
</>

</>>
                  Add income sources to generate a data quality analysis.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Report Generation Tab */}
          <TabsContent value="report-generation">
            <div className="space-y-6"><>

              <h3 className="text-lg font-medium">Generate Valuation Report</h3>
              <p
</>

className="text-sm text-muted-foreground">
                Create a comprehensive report of your income sources and valuation history. 
                Customize the report options below.
              </p>

              <div className="space-y-4">
                <div className="space-y-2"><>

                  <Label htmlFor="report-period">Reporting Period</Label>
                  <Select
</>

                    value={reportOptions.period} 
                    onValueChange={(value) => setReportOptions({
                      ...reportOptions,
                      period: value as 'monthly' | 'quarterly' | 'yearly'
                    })}
                  >
                    <SelectTrigger id="report-period"><>

                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem
</>

value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-charts" className="flex items-center gap-2"><>

                      <PieChart className="h-4 w-4" />
                      Include Charts
                    </Label>
                    <Switch
</>

                      id="include-charts"
                      checked={reportOptions.includeCharts}
                      onCheckedChange={(checked) => setReportOptions({
                        ...reportOptions,
                        includeCharts: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-insights" className="flex items-center gap-2"><>

                      <InfoIcon className="h-4 w-4" />
                      Include Insights
                    </Label>
                    <Switch
</>

                      id="include-insights"
                      checked={reportOptions.includeInsights}
                      onCheckedChange={(checked) => setReportOptions({
                        ...reportOptions,
                        includeInsights: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-recommendations" className="flex items-center gap-2"><>

                      <FileText className="h-4 w-4" />
                      Include Recommendations
                    </Label>
                    <Switch
</>

                      id="include-recommendations"
                      checked={reportOptions.includeRecommendations}
                      onCheckedChange={(checked) => setReportOptions({
                        ...reportOptions,
                        includeRecommendations: checked
                      })}
                    />
                  </div>
                </div>

                {reportGenerationError && (
                  <Alert variant="destructive" className="mt-4"><>

                    <AlertTitle>Report Generation Failed</AlertTitle>
                    <AlertDescription
</>

</>>
                      {(reportGenerationError as Error).message || 'Failed to generate report. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                      <Refresh className="mr-2 h-4 w-4 animate-spin" />
                      Generating Report...
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-between border-t p-4"><>

        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
        <Button
</>

          variant="ghost" 
          size="sm"
          onClick={() => {
            switch (activeTab) {
              case 'income-analysis':
                refetchIncomeAnalysis();
                break;
              case 'anomaly-detection':
                refetchAnomalyDetection();
                break;
              case 'data-quality':
                refetchDataQuality();
                break;
            }
          }}
          disabled={
            (activeTab === 'income-analysis' && isIncomeAnalysisLoading) ||
            (activeTab === 'anomaly-detection' && isAnomalyDetectionLoading) ||
            (activeTab === 'data-quality' && isDataQualityAnalysisLoading) ||
            (activeTab === 'report-generation' && isGeneratingReport)
          }
        >
          <Refresh className={`h-4 w-4 mr-2 ${
            (activeTab === 'income-analysis' && isIncomeAnalysisLoading) ||
            (activeTab === 'anomaly-detection' && isAnomalyDetectionLoading) ||
            (activeTab === 'data-quality' && isDataQualityAnalysisLoading)
              ? 'animate-spin'
              : ''
          }`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}