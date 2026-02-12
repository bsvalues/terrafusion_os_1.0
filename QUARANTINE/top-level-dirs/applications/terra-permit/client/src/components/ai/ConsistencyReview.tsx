import { useState, useEffect } from 'react';
import { reviewClassificationConsistency } from '@/lib/aiApi';
import { ConsistencyReview as ConsistencyReviewType } from '@/types/ai';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Warning, 
  CheckCircle2, 
  XCircle
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';

interface ConsistencyReviewProps {
  uploadId: number;
  className?: string;
}

export function ConsistencyReview({ uploadId, className }: ConsistencyReviewProps) {
  const [review, setReview] = useState<ConsistencyReviewType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      if (!uploadId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await reviewClassificationConsistency(uploadId);
        if (!data) {
          throw new Error('No data returned from AI service');
        }
        setReview(data);
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        setError(`Failed to load consistency review: ${errorMessage}. The AI service may be unavailable.`);
        console.error('Error fetching consistency review:', err);
        
        // Set a fallback empty review structure
        setReview({
          potentialErrors: [],
          inconsistencies: [],
          consistencyScore: 0,
          recommendations: ['Unable to analyze consistency at this time. Please try again later.']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [uploadId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin opacity-70 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing classification consistency...</p>
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

  if (!review) {
    return null;
  }

  const getConsistencyScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-500";
    if (score >= 0.7) return "text-amber-500";
    return "text-red-500";
  };

  const getConsistencyScoreText = (score: number) => {
    if (score >= 0.9) return "Excellent";
    if (score >= 0.8) return "Good";
    if (score >= 0.7) return "Acceptable";
    if (score >= 0.5) return "Needs Improvement";
    return "Poor";
  };

  const getConsistencyScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (score >= 0.6) return <Warning className="h-5 w-5 text-amber-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Classification Consistency</CardTitle>
            <CardDescription
>
              AI review of permit classification consistency
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            <ShieldCheck className="h-3 w-3 mr-1" />
            AI-Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consistency Score */}
        <div>
          <h3 className="text-sm font-medium mb-3">Overall Consistency Score</h3>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {getConsistencyScoreIcon(review.consistencyScore)}
              <span className={cn("ml-2 text-lg font-semibold", getConsistencyScoreColor(review.consistencyScore))}>
                {getConsistencyScoreText(review.consistencyScore)}
              </span>
            </div>
            <span className={cn("text-lg font-semibold", getConsistencyScoreColor(review.consistencyScore))}>
              {Math.round(review.consistencyScore * 100)}%
            </span>
          </div>
          <Progress 
            value={review.consistencyScore * 100} 
            className={cn(
              "h-2.5",
              review.consistencyScore >= 0.9 ? "bg-green-100" : 
              review.consistencyScore >= 0.7 ? "bg-amber-100" : "bg-red-100"
            )}
          />
        </div>

        <Separator />

        {/* Potential Errors */}
        {review.potentialErrors.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Warning className="h-4 w-4 mr-1 text-amber-500" /> Potential Classification Errors
            </h3>
            <div className="space-y-3 mt-3">
              {review.potentialErrors.map((error /* , index */) => (
                <div key={index} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                  <div className="flex items-start">
                    <Warning className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Permit #{error.permitId}</p>
                      <p className="text-sm text-muted-foreground mt-1">{error.issue}</p>
                      {error.recommendation && (
                        <p className="text-sm mt-2 border-l-2 border-amber-500 pl-2">{error.recommendation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inconsistencies */}
        {review.inconsistencies.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <XCircle className="h-4 w-4 mr-1 text-red-500" /> Classification Inconsistencies
            </h3>
            <div className="space-y-3 mt-3">
              {review.inconsistencies.map((inconsistency /* , index */) => (
                <div key={index} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-sm font-medium">Conflicting Permits: {inconsistency.conflictingPermits.join(', ')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{inconsistency.description}</p>
                  {inconsistency.resolution && (
                    <p className="text-sm mt-2 border-l-2 border-red-500 pl-2">{inconsistency.resolution}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {review.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Recommendations
            </h3>
            <ul className="space-y-2 mt-2">
              {review.recommendations.map((recommendation /* , index */) => (
                <li key={index} className="text-sm bg-green-50 dark:bg-green-950/30 p-2 rounded-md border border-green-200 dark:border-green-800">
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Perfect Score Message */}
        {review.consistencyScore >= 0.95 && review.potentialErrors.length === 0 && review.inconsistencies.length === 0 && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div>Excellent consistency! All permit classifications follow a consistent pattern with no detected errors.</div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}