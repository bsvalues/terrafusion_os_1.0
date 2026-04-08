import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ActivityIcon, 
  AlertCircleIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  LineChartIcon,
  ServerIcon,
  ShieldIcon,
  ScanSearchIcon,
  BarChart4Icon
} from 'lucide-react';

import DiagnosticChart from './DiagnosticChart';
import DiagnosticResults from './DiagnosticResults';
import { DiagnosticEngine } from '@/lib/diagnostics/diagnostic-engine';
import { 
  DiagnosticResult, 
  DiagnosticStatus, 
  DiagnosticSeverity,
  DiagnosticCategory,
  PredictiveDiagnostic,
  RootCauseAnalysis,
  DiagnosticVisualizationData,
  TimeSeriesDataPoint
} from '@/lib/diagnostics/types';

interface DiagnosticDashboardProps {
  diagnosticEngine: DiagnosticEngine;
  className?: string;
}

const DiagnosticDashboard: React.FC<DiagnosticDashboardProps> = ({
  diagnosticEngine,
  className = '',
}) => {
  // State variables for the dashboard
  const [systemHealth, setSystemHealth] = useState<{
    overallStatus: DiagnosticStatus;
    serviceStatus: Record<string, DiagnosticStatus>;
    issueCount: number;
    criticalCount: number;
  }>({
    overallStatus: DiagnosticStatus.UNKNOWN,
    serviceStatus: {},
    issueCount: 0,
    criticalCount: 0,
  });
  
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [predictiveResults, setPredictiveResults] = useState<PredictiveDiagnostic[]>([]);
  const [rootCauseAnalyses, setRootCauseAnalyses] = useState<RootCauseAnalysis[]>([]);
  const [visualizationData, setVisualizationData] = useState<DiagnosticVisualizationData[]>([]);
  const [selectedResult, setSelectedResult] = useState<DiagnosticResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refresh the dashboard data
  const refreshDashboard = () => {
    setIsRefreshing(true);
    
    // Get system health
    const health = diagnosticEngine.getSystemHealthSummary();
    setSystemHealth(health);
    
    // Get diagnostic results
    const results = diagnosticEngine.getDiagnosticResults();
    setDiagnosticResults(results);
    
    // Get predictive results
    const predictions = diagnosticEngine.getPredictiveDiagnostics();
    setPredictiveResults(predictions);
    
    // Get root cause analyses
    const analyses = diagnosticEngine.getRootCauseAnalyses();
    setRootCauseAnalyses(analyses);
    
    // Generate visualization data
    generateVisualizationData(results, predictions);
    
    setIsRefreshing(false);
  };
  
  // Effect to refresh the dashboard on mount and set up interval
  useEffect(() => {
    refreshDashboard();
    
    // Refresh every 15 seconds
    const intervalId = setInterval(refreshDashboard, 15000);
    
    // Set up subscription to diagnostic results
    const unsubscribe = diagnosticEngine.subscribe('*', () => {
      refreshDashboard();
    });
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [diagnosticEngine]);
  
  // Generate visualization data from results
  const generateVisualizationData = (
    results: DiagnosticResult[], 
    predictions: PredictiveDiagnostic[]
  ) => {
    // Create visualizations
    
    // 1. Issues by service
    const issuesByService: Record<string, number> = {};
    const services = new Set<string>();
    results.forEach(result => {
      services.add(result.service);
      if (!issuesByService[result.service]) {
        issuesByService[result.service] = 0;
      }
      issuesByService[result.service]++;
    });
    
    const issuesByServiceData: DiagnosticVisualizationData = {
      id: 'issues-by-service',
      title: 'Issues by Service',
      description: 'Distribution of diagnostic issues across services',
      type: 'pie',
      series: Object.entries(issuesByService).map(([service, count]) => ({
        name: service,
        data: [{
          timestamp: new Date().toISOString(),
          value: count,
          label: service
        }]
      }))
    };
    
    // 2. Issues by severity
    const issuesBySeverity: Record<DiagnosticSeverity, number> = {
      [DiagnosticSeverity.CRITICAL]: 0,
      [DiagnosticSeverity.ERROR]: 0,
      [DiagnosticSeverity.WARNING]: 0,
      [DiagnosticSeverity.INFO]: 0
    };
    
    results.forEach(result => {
      issuesBySeverity[result.severity]++;
    });
    
    const issuesBySeverityData: DiagnosticVisualizationData = {
      id: 'issues-by-severity',
      title: 'Issues by Severity',
      description: 'Distribution of diagnostic issues by severity level',
      type: 'bar',
      series: [{
        name: 'Issue Count',
        data: Object.entries(issuesBySeverity).map(([severity, count]) => ({
          timestamp: new Date().toISOString(),
          value: count,
          label: severity
        }))
      }]
    };
    
    // 3. Issues by category
    const issuesByCategory: Record<DiagnosticCategory, number> = {
      [DiagnosticCategory.PERFORMANCE]: 0,
      [DiagnosticCategory.AVAILABILITY]: 0,
      [DiagnosticCategory.SECURITY]: 0,
      [DiagnosticCategory.DATA_INTEGRITY]: 0,
      [DiagnosticCategory.RESOURCE_USAGE]: 0,
      [DiagnosticCategory.CONNECTIVITY]: 0
    };
    
    results.forEach(result => {
      issuesByCategory[result.category]++;
    });
    
    const issuesByCategoryData: DiagnosticVisualizationData = {
      id: 'issues-by-category',
      title: 'Issues by Category',
      description: 'Distribution of diagnostic issues by category',
      type: 'bar',
      series: [{
        name: 'Issue Count',
        data: Object.entries(issuesByCategory).map(([category, count]) => ({
          timestamp: new Date().toISOString(),
          value: count,
          label: category
        }))
      }]
    };

    // Group visualizations
    setVisualizationData([
      issuesByServiceData,
      issuesBySeverityData,
      issuesByCategoryData
    ]);
  };
  
  // Helper to get the status badge
  const getStatusBadge = (status: DiagnosticStatus) => {
    switch (status) {
      case DiagnosticStatus.HEALTHY:
        return <Badge className="ml-2" variant="default">Healthy</Badge>;
      case DiagnosticStatus.DEGRADED:
        return <Badge className="ml-2" variant="secondary">Degraded</Badge>;
      case DiagnosticStatus.FAILING:
        return <Badge className="ml-2" variant="destructive">Failing</Badge>;
      case DiagnosticStatus.UNKNOWN:
      default:
        return <Badge className="ml-2" variant="outline">Unknown</Badge>;
    }
  };
  
  // Helper to get the status icon
  const getStatusIcon = (status: DiagnosticStatus) => {
    switch (status) {
      case DiagnosticStatus.HEALTHY:
        return <CheckCircleIcon className="h-8 w-8 text-success" />;
      case DiagnosticStatus.DEGRADED:
        return <AlertTriangleIcon className="h-8 w-8 text-warning" />;
      case DiagnosticStatus.FAILING:
        return <AlertCircleIcon className="h-8 w-8 text-destructive" />;
      case DiagnosticStatus.UNKNOWN:
      default:
        return <ScanSearchIcon className="h-8 w-8 text-muted-foreground" />;
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* System Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {getStatusIcon(systemHealth.overallStatus)}
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {systemHealth.overallStatus}
                  {getStatusBadge(systemHealth.overallStatus)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ActivityIcon className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {systemHealth.issueCount}
                  {systemHealth.issueCount > 5 && 
                    <Badge className="ml-2" variant="secondary">High</Badge>
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircleIcon className="h-8 w-8 text-destructive" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {systemHealth.criticalCount}
                  {systemHealth.criticalCount > 0 && 
                    <Badge className="ml-2" variant="destructive">Attention Needed</Badge>
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {predictiveResults.length}
                  {predictiveResults.length > 0 && 
                    <Badge className="ml-2" variant="outline">Active</Badge>
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Service Status */}
      {Object.keys(systemHealth.serviceStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ServerIcon className="h-5 w-5 mr-2" />
              Service Status
            </CardTitle>
            <CardDescription>
              Status of individual services in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(systemHealth.serviceStatus).map(([service, status]) => (
                <div key={service} className="flex items-center p-4 border rounded-lg">
                  {getStatusIcon(status)}
                  <div className="ml-4">
                    <div className="font-medium">{service}</div>
                    <div className="text-sm">
                      Status: {status}
                      {getStatusBadge(status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart4Icon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="diagnostic-results">
            <ActivityIcon className="h-4 w-4 mr-2" />
            Diagnostic Results
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <ClockIcon className="h-4 w-4 mr-2" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="root-causes">
            <ScanSearchIcon className="h-4 w-4 mr-2" />
            Root Cause Analysis
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Data Visualization Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visualizationData.map(vizData => (
              <DiagnosticChart key={vizData.id} data={vizData} />
            ))}
          </div>
          
          {/* Critical Issues Alert */}
          {systemHealth.criticalCount > 0 && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Critical Issues Detected</AlertTitle>
              <AlertDescription>
                There are {systemHealth.criticalCount} critical issues that require immediate attention.
                View the Diagnostic Results tab for details.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Recent Diagnostic Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Diagnostics</CardTitle>
              <CardDescription>Most recent diagnostic results across all services</CardDescription>
            </CardHeader>
            <CardContent>
              <DiagnosticResults 
                results={diagnosticResults.slice(0, 5)}
                onSelect={setSelectedResult}
                maxHeight={300}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Diagnostic Results Tab */}
        <TabsContent value="diagnostic-results" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button 
              onClick={refreshDashboard}
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Results'}
            </Button>
          </div>
          
          <DiagnosticResults 
            results={diagnosticResults}
            predictiveResults={predictiveResults}
            onSelect={setSelectedResult}
            maxHeight={600}
          />
        </TabsContent>
        
        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4 mt-4">
          {predictiveResults.length === 0 ? (
            <Alert>
              <AlertTitle>No Predictions Available</AlertTitle>
              <AlertDescription>
                The system has not generated any predictive diagnostics yet.
                Predictions are generated based on observed patterns in the system.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <ClockIcon className="h-4 w-4" />
                <AlertTitle>Predictive Diagnostics</AlertTitle>
                <AlertDescription>
                  The system has generated {predictiveResults.length} predictions based on observed patterns.
                  These predictions represent potential future issues that may occur.
                </AlertDescription>
              </Alert>
              
              <DiagnosticResults 
                results={predictiveResults as DiagnosticResult[]}
                onSelect={setSelectedResult}
                maxHeight={600}
              />
            </>
          )}
        </TabsContent>
        
        {/* Root Cause Analysis Tab */}
        <TabsContent value="root-causes" className="space-y-4 mt-4">
          {rootCauseAnalyses.length === 0 ? (
            <Alert>
              <AlertTitle>No Root Cause Analyses Available</AlertTitle>
              <AlertDescription>
                The system has not performed any root cause analyses yet.
                Analyses are generated when critical or error-level issues are detected.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {rootCauseAnalyses.map(analysis => (
                <Card key={analysis.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Root Cause Analysis: {analysis.originatingIssue.service}
                    </CardTitle>
                    <CardDescription>
                      Analysis performed {new Date(analysis.timestamp).toLocaleString()}
                      <Badge className="ml-2" variant="outline">
                        Confidence: {analysis.confidence}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <ScanSearchIcon className="h-4 w-4" />
                      <AlertTitle>Analysis Result</AlertTitle>
                      <AlertDescription>
                        {analysis.explanation}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <div className="font-medium">Causal Chain:</div>
                      {analysis.causalChain.map((result, index) => (
                        <div 
                          key={result.id} 
                          className="flex items-center p-2 border rounded-md"
                        >
                          <div className="font-mono text-sm text-muted-foreground mr-2">
                            {index + 1}.
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{result.message}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.service} - {new Date(result.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="ml-2">
                            <Badge variant={getSeverityBadgeVariant(result.severity)}>
                              {result.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="font-medium">Suggested Actions:</div>
                        {analysis.suggestedActions.map(action => (
                          <div 
                            key={action.id} 
                            className="p-2 border rounded-md"
                          >
                            <div className="font-medium">{action.label}</div>
                            <div className="text-sm">{action.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Selected Result Detail Modal */}
      {/* We'll add this in a future iteration */}
    </div>
  );
};

// Helper function to get severity badge variant
const getSeverityBadgeVariant = (severity: DiagnosticSeverity) => {
  switch (severity) {
    case DiagnosticSeverity.CRITICAL:
      return 'destructive';
    case DiagnosticSeverity.ERROR:
      return 'destructive';
    case DiagnosticSeverity.WARNING:
      return 'secondary'; // Using secondary instead of warning as it's not available
    case DiagnosticSeverity.INFO:
    default:
      return 'outline';
  }
};

export default DiagnosticDashboard;