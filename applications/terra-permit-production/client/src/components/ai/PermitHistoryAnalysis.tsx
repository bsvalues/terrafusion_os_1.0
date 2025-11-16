import { useState, useEffect } from 'react';
import { analyzeUploadHistory } from '@/lib/aiApi';
import { PermitHistoryAnalysis as PermitHistoryAnalysisType } from '@/types/ai';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  Search, 
  ZapIcon,
  ThumbsUp,
  Warning,
  BarChart
 } from '@mui/icons-material';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PermitHistoryAnalysisProps {
  uploadId: number;
  className?: string;
}

export function PermitHistoryAnalysis({ uploadId, className }: PermitHistoryAnalysisProps) {
  const [analysis, setAnalysis] = useState<PermitHistoryAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!uploadId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await analyzeUploadHistory(uploadId);
        setAnalysis(data);
      } catch (err) {
        setError('Failed to load analysis. The AI service may be unavailable.');
        console.error('Error fetching permit history analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [uploadId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin opacity-70 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing permit history data...</p>
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription><div>{error}</div></AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div><>

            <CardTitle>Permit History Analysis</CardTitle>
            <CardDescription
</>>
              AI insights from historical permit processing data
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            <History className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4"><>

          <h3 className="text-base font-medium">Executive Summary</h3>
          <p
</> className="text-sm text-muted-foreground">{analysis.summary}</p>
        </div>

        <Tabs defaultValue="patterns">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="patterns" className="text-xs">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Patterns</span>
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="text-xs">
              <Search className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Anomalies</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs">
              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="text-xs">
              <ZapIcon className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Opportunities</span>
            </TabsTrigger>
            <TabsTrigger value="risks" className="text-xs">
              <Warning className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Risks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-4 mt-4">
            <h3 className="text-sm font-medium flex items-center"><>

              <TrendingUp className="h-4 w-4 mr-2" /> Identified Patterns
            </h3>
            <ul
</> className="space-y-2">
              {analysis.patterns.map((pattern /* , index */) => (
                <li key={index} className="text-sm bg-secondary/30 p-2 rounded-md">
                  {pattern}
                </li>
              ))}
            </ul>
            {analysis.patterns.length === 0 && (
              <p className="text-sm text-muted-foreground">No significant patterns identified in the current data.</p>
            )}
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4 mt-4">
            <h3 className="text-sm font-medium flex items-center"><>

              <Search className="h-4 w-4 mr-2" /> Detected Anomalies
            </h3>
            <ul
</> className="space-y-2">
              {analysis.anomalies.map((anomaly /* , index */) => (
                <li key={index} className="text-sm bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                  {anomaly}
                </li>
              ))}
            </ul>
            {analysis.anomalies.length === 0 && (
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div>No anomalies detected in the permit processing data.</div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 mt-4">
            <h3 className="text-sm font-medium flex items-center"><>

              <ThumbsUp className="h-4 w-4 mr-2" /> AI Recommendations
            </h3>
            <ul
</> className="space-y-2">
              {analysis.recommendations.map((recommendation /* , index */) => (
                <li key={index} className="text-sm bg-green-50 dark:bg-green-950/30 p-2 rounded-md border border-green-200 dark:border-green-800">
                  {recommendation}
                </li>
              ))}
            </ul>
            {analysis.recommendations.length === 0 && (
              <p className="text-sm text-muted-foreground">No recommendations available at this time.</p>
            )}
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4 mt-4">
            <h3 className="text-sm font-medium flex items-center"><>

              <ZapIcon className="h-4 w-4 mr-2" /> Optimization Opportunities
            </h3>
            <ul
</> className="space-y-2">
              {analysis.optimizationOpportunities.map((opportunity /* , index */) => (
                <li key={index} className="text-sm bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                  {opportunity}
                </li>
              ))}
            </ul>
            {analysis.optimizationOpportunities.length === 0 && (
              <p className="text-sm text-muted-foreground">No optimization opportunities identified at this time.</p>
            )}
          </TabsContent>

          <TabsContent value="risks" className="space-y-4 mt-4">
            <h3 className="text-sm font-medium flex items-center"><>

              <Warning className="h-4 w-4 mr-2" /> Risk Factors
            </h3>
            <ul
</> className="space-y-2">
              {analysis.riskFactors.map((risk /* , index */) => (
                <li key={index} className="text-sm bg-red-50 dark:bg-red-950/30 p-2 rounded-md border border-red-200 dark:border-red-800">
                  {risk}
                </li>
              ))}
            </ul>
            {analysis.riskFactors.length === 0 && (
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div>No significant risk factors identified in the current data.</div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}