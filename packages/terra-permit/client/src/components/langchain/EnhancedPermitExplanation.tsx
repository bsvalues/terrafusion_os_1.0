import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getPermitExplanationWithLangChain } from "@/lib/langchainApi";
import { AlertCircle, BookOpen, Lightbulb, Scale, Sparkles } from "lucide-react";

interface EnhancedPermitExplanationProps {
  permitId: number;
  isEnabled?: boolean;
}

export function EnhancedPermitExplanation({ permitId, isEnabled = true }: EnhancedPermitExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, error, isLoading, isError } = useQuery({
    queryKey: ['/api/langchain/explain-permit', permitId],
    queryFn: () => getPermitExplanationWithLangChain(permitId),
    enabled: isEnabled && permitId > 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to get enhanced explanation. {(error as Error)?.message || "Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="mb-6 border border-primary/20">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          LangChain Enhanced Explanation
        </CardTitle>
        <CardDescription>
          Advanced AI-powered permit analysis with contextual understanding and regulatory references
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="explanation" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="explanation" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" /> Explanation
            </TabsTrigger>
            <TabsTrigger value="regulations" className="flex items-center gap-1">
              <Scale className="h-4 w-4" /> Regulations
            </TabsTrigger>
            {data.similarCases && data.similarCases.length > 0 && (
              <TabsTrigger value="cases" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> Similar Cases
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="explanation" className="space-y-4">
            <div className="text-muted-foreground">
              {isExpanded ? data.explanation : data.explanation.substring(0, 300) + "..."}
              {data.explanation.length > 300 && (
                <Button 
                  variant="link" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-0 h-auto font-medium"
                >
                  {isExpanded ? "Show less" : "Show more"}
                </Button>
              )}
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Key Points:</h4>
              <ul className="space-y-2">
                {data.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {data.suggestedActions && data.suggestedActions.length > 0 && (
              <div className="mt-6 bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Suggested Actions:</h4>
                <ul className="space-y-1">
                  {data.suggestedActions.map((action, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span>•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="regulations">
            <div className="space-y-4">
              <h4 className="text-sm font-medium mb-2">Relevant Regulations:</h4>
              <div className="grid gap-3">
                {data.relevantRegulations.map((reg, i) => (
                  <div key={i} className="bg-muted/30 p-3 rounded-md text-sm">
                    <div className="flex justify-between mb-1">
                      <Badge variant="outline" className="mb-1">Regulation {i + 1}</Badge>
                    </div>
                    {reg}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {data.similarCases && data.similarCases.length > 0 && (
            <TabsContent value="cases">
              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-2">Similar Historical Cases:</h4>
                <div className="grid gap-3">
                  {data.similarCases.map((caseItem, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="py-3 px-4 bg-muted/30">
                        <CardTitle className="text-sm font-medium">Case {i + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-3 px-4">
                        <p className="text-sm mb-2"><span className="font-medium">Description:</span> {caseItem.description}</p>
                        <p className="text-sm"><span className="font-medium">Outcome:</span> {caseItem.outcome}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="bg-primary/5 text-xs text-muted-foreground">
        Generated using LangChain AI with enhanced contextual understanding
      </CardFooter>
    </Card>
  );
}