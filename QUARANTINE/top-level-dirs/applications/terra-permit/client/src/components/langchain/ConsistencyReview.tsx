import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { reviewConsistencyWithLangChain } from "@/lib/langchainApi";
import { AlertCircle, CheckCircle, GitBranch, Lightbulb, XCircle  } from '@mui/icons-material';

interface ConsistencyReviewProps {
  uploadId: number;
  isEnabled?: boolean;
  onShowPermit?: (permitId: number) => void;
  onClose?: () => void;
}

export function ConsistencyReview({ 
  uploadId, 
  isEnabled = true, 
  onShowPermit,
  onClose 
}: ConsistencyReviewProps) {
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ['/api/langchain/review-consistency', uploadId],
    queryFn: () => reviewConsistencyWithLangChain(uploadId),
    enabled: isEnabled && uploadId > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            <Skeleton className="h-6 w-64" />
          </CardTitle>
          <CardDescription
>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription
>
          Failed to retrieve consistency review. {(error as Error)?.message || "Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  // Determine status based on consistency score
  const getStatusColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-amber-500";
    return "text-red-500";
  };

  const statusColor = getStatusColor(data.consistencyScore);

  return (
    <Card className="w-full border border-primary/20">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-xl">
          <GitBranch className="h-5 w-5 text-primary" />
          LangChain Consistency Review
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Advanced analysis of permit classification consistency</span>
          <div className="flex items-center gap-2">
            <span className="text-sm">Consistency Score:</span>
            <div className="flex items-center gap-1">
              <Progress 
                value={data.consistencyScore * 100} 
                className={`w-24 h-2 ${
                  data.consistencyScore >= 0.8 
                    ? "bg-green-600" 
                    : data.consistencyScore >= 0.6 
                      ? "bg-amber-500" 
                      : "bg-red-500"
                }`}
              />
              <span className={`text-sm font-medium ${statusColor}`}>
                {Math.round(data.consistencyScore * 100)}%
              </span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="potential-errors" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="potential-errors" className="flex items-center gap-1">
              <XCircle className="h-4 w-4" /> 
              Errors ({data.potentialErrors.length})
            </TabsTrigger>
            <TabsTrigger value="inconsistencies" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" /> 
              Inconsistencies ({data.inconsistencies.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" /> 
              Recommendations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="potential-errors">
            {data.potentialErrors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <p>No potential errors detected! All permit classifications appear to be correct.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.potentialErrors.map((error, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="py-3 bg-destructive/10">
                      <CardTitle className="text-base flex justify-between">
                        <span>Potential Error in Permit #{error.permitId}</span>
                        {onShowPermit && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onShowPermit(error.permitId)}
                            className="text-xs h-6 px-2"
                          >
                            View Permit
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Issue:</h4>
                          <p className="text-sm text-muted-foreground">{error.issue}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Recommendation:</h4>
                          <p className="text-sm text-muted-foreground">{error.recommendation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="inconsistencies">
            {data.inconsistencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <p>No inconsistencies detected! Permit classifications are consistent across similar permits.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.inconsistencies.map((inconsistency, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="py-3 bg-amber-500/10">
                      <CardTitle className="text-base">Inconsistency {i + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Conflicting Permits:</h4>
                          <div className="flex flex-wrap gap-2">
                            {inconsistency.conflictingPermits.map(permitId => (
                              <Badge 
                                key={permitId} 
                                variant="outline"
                                className="cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => onShowPermit && onShowPermit(permitId)}
                              >
                                Permit #{permitId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Description:</h4>
                          <p className="text-sm text-muted-foreground">{inconsistency.description}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Suggested Resolution:</h4>
                          <p className="text-sm text-muted-foreground">{inconsistency.resolution}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Based on the analysis of your permit data, here are some recommendations for improving classification consistency:
              </p>
              
              <ul className="space-y-3 mt-4">
                {data.recommendations.map((recommendation, i) => (
                  <li key={i} className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-primary/5 py-3">
        <span className="text-xs text-muted-foreground">
          Generated using LangChain's consistency review capabilities
        </span>
        {onClose && (
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}