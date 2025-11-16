import { useState, useEffect } from 'react';
import { getEnhancedBatchSummary } from '@/lib/aiApi';
import { BatchSummary } from '@/types/ai';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, 
  Lightbulb, 
  AlertCircle, 
  Loader2, 
  ArrowUpRight,
  Warning,
  CheckCircle2
 } from '@mui/icons-material';
import { Button } from '@/components/ui/button';

interface BatchSummaryAnalysisProps {
  uploadId: number;
  className?: string;
  onShowDetailedReport?: () => void;
}

export function BatchSummaryAnalysis({ uploadId, className, onShowDetailedReport }: BatchSummaryAnalysisProps) {
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!uploadId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getEnhancedBatchSummary(uploadId);
        if (!data) {
          throw new Error('No data returned from AI service');
        }
        setSummary(data);
      } catch (err: any) {
        console.error('Error fetching batch summary:', err);
        
        // Check for specific OpenAI API key errors
        if (err.message?.includes('OpenAI API key') || 
            err.message?.includes('not configured') || 
            err.message?.includes('missing or invalid')) {
          setError('OpenAI API key is missing or invalid. Please configure it in the system settings to use AI features.');
          
          // Add a special fallback with instructions to configure API key
          setSummary({
            metrics: {
              totalCount: 0,
              enteredCount: 0,
              skippedCount: 0,
              enteredPercentage: 0,
              skippedPercentage: 0
            },
            insights: [
              "AI features require a valid OpenAI API key to function.",
              "The system will still process permits normally without AI enhancements."
            ],
            categories: {},
            potentialIssues: [],
            recommendations: [
              "Configure your OpenAI API key in the settings.",
              "Once configured, refresh this page to activate AI features."
            ]
          });
        } else {
          // Handle other general errors
          const errorMessage = err.message || 'Unknown error occurred';
          setError(`Failed to load AI summary: ${errorMessage}. The AI service may be unavailable.`);
          
          // Add a fallback summary with basic metrics for non-API key errors
          if (uploadId) {
            try {
              // Try to create a fallback summary with basic metrics
              setSummary({
                metrics: {
                  totalCount: 0,
                  enteredCount: 0,
                  skippedCount: 0,
                  enteredPercentage: 0,
                  skippedPercentage: 0
                },
                insights: ["AI analysis unavailable at the moment. Please try again later."],
                categories: {},
                potentialIssues: [],
                recommendations: ["Refresh the page to try again."]
              });
            } catch (fallbackErr) {
              console.error('Failed to create fallback summary:', fallbackErr);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [uploadId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin opacity-70 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing permits with AI...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isApiKeyError = error.includes('OpenAI API key');
    
    return (
      <Card className={className}>
        <CardContent className="pt-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          {isApiKeyError && (
            <div className="flex flex-col space-y-2"><>

              <p className="text-sm text-muted-foreground">
                AI features require an OpenAI API key to work. The permit processing will continue to work normally without AI.
              </p>
              <Button
</> 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // In a production environment, this would open a settings dialog
                  // or navigate to a settings page.
                  window.location.href = '/settings?highlight=openai_key';
                  // Note: The settings page or dialog would handle updating the API key
                  // and would refresh the page or component after saving
                }}
              >
                Go to Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const { metrics, insights, categories, potentialIssues, recommendations } = summary;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div><>

            <CardTitle>AI Batch Analysis</CardTitle>
            <CardDescription
</>>
              Advanced insights based on permit data
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            <BarChart className="h-3 w-3 mr-1" />
            AI-Generated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Decision Metrics */}
        <div><>

          <h3 className="text-sm font-medium mb-2">Decision Breakdown</h3>
          <div
</> className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1"><>

                <span className="text-sm">Entered Permits</span>
                <span
</> className="text-sm font-medium">{metrics.enteredCount} ({metrics.enteredPercentage.toFixed(1)}%)</span>
              </div><>

              <Progress value={metrics.enteredPercentage} className="h-2" />
            </div>
            <div
</>>
              <div className="flex justify-between items-center mb-1"><>

                <span className="text-sm">Skipped Permits</span>
                <span
</> className="text-sm font-medium">{metrics.skippedCount} ({metrics.skippedPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={metrics.skippedPercentage} className="h-2" />
            </div>
          </div>
        </div>

        {/* Categories */}
        {Object.keys(categories).length > 0 && (
          <div><>

            <h3 className="text-sm font-medium mb-2">Permit Categories</h3>
            <div
</> className="grid grid-cols-2 gap-2">
              {Object.entries(categories).map(([category, count]) => (
                <div key={category} className="bg-secondary/30 rounded-md p-2 text-xs"><>

                  <div className="font-medium">{category}</div>
                  <div
</> className="text-muted-foreground">{count} permits</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center"><>

              <Lightbulb className="h-4 w-4 mr-1" /> Key Insights
            </h3>
            <ul
</> className="space-y-2">
              {insights.map((insight /* , index */) => (
                <li key={index} className="text-sm flex">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Potential Issues */}
        {potentialIssues.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center"><>

              <Warning className="h-4 w-4 mr-1 text-warning" /> Potential Issues
            </h3>
            <ul
</> className="space-y-2">
              {potentialIssues.map((issue /* , index */) => (
                <li key={index} className="text-sm flex">
                  <Warning className="h-4 w-4 mr-2 text-warning flex-shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div><>

            <h3 className="text-sm font-medium mb-2">Recommendations</h3>
            <ul
</> className="space-y-2">
              {recommendations.map((recommendation /* , index */) => (
                <li key={index} className="text-sm bg-primary/10 p-2 rounded-md">
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {onShowDetailedReport && (
        <CardFooter>
          <Button variant="outline" onClick={onShowDetailedReport} className="w-full">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            View Detailed Analysis
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}