import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRightIcon,
  ChevronDownIcon,
  CodeIcon,
  AlertCircleIcon,
  ArrowUpCircleIcon,
  Clock3Icon,
  FileTextIcon,
 } from '@mui/icons-material';
import {
  OptimizationType,
  OptimizationStatus,
  OptimizationPriority,
  OptimizationSuggestion,
  WorkflowOptimizationRequest,
  WorkflowOptimizationResult,
} from '@/types/workflow-optimizer';

type WorkflowSuggestionCardProps = {
  optimization: WorkflowOptimizationRequest;
  result: WorkflowOptimizationResult;
};

export default function WorkflowSuggestionCard({
  optimization,
  result,
}: WorkflowSuggestionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get appropriate impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get appropriate effort color
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'quick':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'significant':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Determine the optimization type icon
  const getOptimizationTypeIcon = () => {
    switch (optimization.optimizationType) {
      case 'code_quality':
        return <CodeIcon className="h-5 w-5 mr-2" />;
      case 'performance':
        return <ArrowUpCircleIcon className="h-5 w-5 mr-2" />;
      case 'security':
        return <AlertCircleIcon className="h-5 w-5 mr-2" />;
      default:
        return <CodeIcon className="h-5 w-5 mr-2" />;
    }
  };

  // Use the recommendationsJson property from the result
  const suggestions = (result.recommendationsJson || []) as OptimizationSuggestion[];

  // Use the improvementScore property from the result
  const score = result.improvementScore || 0;

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {getOptimizationTypeIcon()}
          <h4 className="font-semibold">{optimization.title}</h4>
        </div>
        <Badge className="ml-2">Score: {score}/10</Badge>
      </div><>


      <p className="text-sm text-muted-foreground mb-2">{result.summary}</p>

      <div
</> className="flex flex-wrap gap-2 mt-2 mb-3"><>

        <Badge variant="outline">{optimization.optimizationType.replace(/_/g, ' ')}</Badge>
        <Badge
</> variant="outline" className="flex items-center">
          <Clock3Icon className="h-3 w-3 mr-1" />
          {formatDate(result.createdAt)}
        </Badge>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center w-full justify-between p-0 h-8"
          >
            <span className="text-sm font-medium">
              {isOpen ? 'Hide suggestions' : 'View suggestions'} ({suggestions.length})
            </span>
            {isOpen ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <Separator className="my-2" />

          {suggestions.map((suggestion: OptimizationSuggestion /* , index */: number) => (
            <div key={suggestion.id} className="py-3">
              {index > 0 && <Separator className="my-2" />}

              <div className="flex items-center justify-between mb-1"><>

                <h5 className="font-medium text-sm">{suggestion.title}</h5>
                <div
</> className="flex space-x-2"><>

                  <Badge
                    variant="outline"
                    className={`text-xs ${getImpactColor(suggestion.impact)}`}
                  >
                    Impact: {suggestion.impact}
                  </Badge>
                  <Badge
</>
                    variant="outline"
                    className={`text-xs ${getEffortColor(suggestion.effortEstimate)}`}
                  >
                    Effort: {suggestion.effortEstimate}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>

              {suggestion.filePath && (
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <FileTextIcon className="h-3 w-3 mr-1" />
                  <span>{suggestion.filePath}</span>
                  {suggestion.lineNumbers && (
                    <span className="ml-1">
                      (Lines {suggestion.lineNumbers[0]}-{suggestion.lineNumbers[1]})
                    </span>
                  )}
                </div>
              )}

              {suggestion.implementationSteps && suggestion.implementationSteps.length > 0 && (
                <div className="mt-2"><>

                  <p className="text-xs font-medium mb-1">Implementation steps:</p>
                  <ol
</> className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
                    {suggestion.implementationSteps.map((step: string, stepIndex: number) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {suggestion.code && (
                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {suggestion.code}
                </div>
              )}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
