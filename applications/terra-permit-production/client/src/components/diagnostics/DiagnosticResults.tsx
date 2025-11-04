import React, { useState } from 'react';
import { 
  DiagnosticResult, 
  DiagnosticSeverity, 
  DiagnosticStatus,
  DiagnosticCategory,
  PredictiveDiagnostic
} from '@/lib/diagnostics/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronDownIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  InfoIcon,
  ClockIcon,
  ActivityIcon
 } from '@mui/icons-material';

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

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: DiagnosticStatus) => {
  switch (status) {
    case DiagnosticStatus.FAILING:
      return 'destructive';
    case DiagnosticStatus.DEGRADED:
      return 'secondary'; // Using secondary instead of warning
    case DiagnosticStatus.HEALTHY:
      return 'default'; // Using default instead of success
    case DiagnosticStatus.UNKNOWN:
    default:
      return 'secondary';
  }
};

// Helper function to get category badge
const getCategoryBadge = (category: DiagnosticCategory) => {
  switch (category) {
    case DiagnosticCategory.PERFORMANCE:
      return { variant: 'outline', label: 'Performance' };
    case DiagnosticCategory.AVAILABILITY:
      return { variant: 'outline', label: 'Availability' };
    case DiagnosticCategory.SECURITY:
      return { variant: 'outline', label: 'Security' };
    case DiagnosticCategory.DATA_INTEGRITY:
      return { variant: 'outline', label: 'Data Integrity' };
    case DiagnosticCategory.RESOURCE_USAGE:
      return { variant: 'outline', label: 'Resource Usage' };
    case DiagnosticCategory.CONNECTIVITY:
      return { variant: 'outline', label: 'Connectivity' };
    default:
      return { variant: 'outline', label: category };
  }
};

// Helper function to format relative time
const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return `${diffSec} seconds ago`;
  }
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  }
  
  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffHour < 24) {
    return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  }
  
  // Convert to days
  const diffDay = Math.floor(diffHour / 24);
  
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
};

// Component for a single diagnostic result
interface DiagnosticResultItemProps {
  result: DiagnosticResult;
  onSelect?: (result: DiagnosticResult) => void;
}

const DiagnosticResultItem: React.FC<DiagnosticResultItemProps> = ({ 
  result, 
  onSelect 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const severityVariant = getSeverityBadgeVariant(result.severity);
  const statusVariant = getStatusBadgeVariant(result.status);
  const categoryInfo = getCategoryBadge(result.category);
  const relativeTime = formatRelativeTime(result.timestamp);
  
  // Check if this is a predictive diagnostic
  const isPredictive = 'confidenceLevel' in result;
  const predictiveResult = result as PredictiveDiagnostic;
  
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      className="w-full border rounded-lg mb-2 overflow-hidden"
    >
      <div className="flex items-center p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
            {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        {result.severity === DiagnosticSeverity.CRITICAL && (
          <AlertCircleIcon className="h-5 w-5 text-destructive mr-2" />
        )}
        {result.severity === DiagnosticSeverity.ERROR && (
          <AlertCircleIcon className="h-5 w-5 text-destructive mr-2" />
        )}
        {result.severity === DiagnosticSeverity.WARNING && (
          <AlertCircleIcon className="h-5 w-5 text-warning mr-2" />
        )}
        {result.severity === DiagnosticSeverity.INFO && (
          <InfoIcon className="h-5 w-5 text-muted-foreground mr-2" />
        )}
        
        <div className="flex-1 ml-2"><>

          <div className="font-medium">{result.message}</div>
          <div
</> className="text-sm text-muted-foreground">{result.service} - {relativeTime}</div>
        </div>
        
        <div className="flex gap-2 ml-2"><>

          <Badge variant={severityVariant}>{result.severity}</Badge>
          <Badge
</> variant={statusVariant}>{result.status}</Badge>
          {isPredictive && <Badge variant="outline">Predictive</Badge>}
        </div>
      </div>
      
      <CollapsibleContent>
        <div className="p-4 pt-0 bg-muted/40">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={categoryInfo.variant as any}>{categoryInfo.label}</Badge>
            {isPredictive && (
              <Badge variant="outline">
                Confidence: {predictiveResult.confidenceLevel}
              </Badge>
            )}
          </div>
          
          {result.details && (
            <Alert className="mb-3"><>

              <AlertTitle>Details</AlertTitle>
              <AlertDescription
</>>
                {result.details}
              </AlertDescription>
            </Alert>
          )}
          
          {isPredictive && (
            <Alert className="mb-3">
              <AlertTitle className="flex items-center"><>

                <ClockIcon className="h-4 w-4 mr-2" />
                Prediction Details
              </AlertTitle>
              <AlertDescription
</>>
                <p>Predicted to occur at: {new Date(predictiveResult.predictedTimestamp).toLocaleString()}</p>
                {predictiveResult.timeToImpact !== undefined && (
                  <p>Time to impact: {Math.round(predictiveResult.timeToImpact / 60)} minute(s)</p>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {result.metrics && Object.keys(result.metrics).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {Object.entries(result.metrics).map(([key, value]) => (
                <div key={key} className="bg-background p-2 rounded-md"><>

                  <div className="text-xs text-muted-foreground">{key}</div>
                  <div
</> className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</div>
                </div>
              ))}
            </div>
          )}
          
          {result.relatedResults && result.relatedResults.length > 0 && (
            <div className="mb-3"><>

              <div className="text-sm font-medium mb-1">Related Results</div>
              <div
</> className="text-sm text-muted-foreground">
                {result.relatedResults.join(', ')}
              </div>
            </div>
          )}
          
          {onSelect && (
            <div className="flex justify-end mt-2">
              <Button variant="outline" size="sm" onClick={() => onSelect(result)}>
                View Details
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Component for diagnostic results list
interface DiagnosticResultsListProps {
  results: DiagnosticResult[];
  onSelect?: (result: DiagnosticResult) => void;
  maxHeight?: number;
  showEmpty?: boolean;
}

const DiagnosticResultsList: React.FC<DiagnosticResultsListProps> = ({
  results,
  onSelect,
  maxHeight = 400,
  showEmpty = true,
}) => {
  if (results.length === 0 && showEmpty) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No diagnostic results to display
      </div>
    );
  }
  
  return (
    <ScrollArea className="w-full" style={{ maxHeight: `${maxHeight}px` }}>
      <div className="space-y-2 pr-4">
        {results.map(result => (
          <DiagnosticResultItem 
            key={result.id} 
            result={result} 
            onSelect={onSelect} 
          />
        ))}
      </div>
    </ScrollArea>
  );
};

// Main component for diagnostic results display
interface DiagnosticResultsProps {
  results: DiagnosticResult[];
  predictiveResults?: PredictiveDiagnostic[];
  onSelect?: (result: DiagnosticResult) => void;
  maxHeight?: number;
  className?: string;
}

const DiagnosticResults: React.FC<DiagnosticResultsProps> = ({
  results,
  predictiveResults = [],
  onSelect,
  maxHeight = 500,
  className = '',
}) => {
  // Group results by severity
  const criticalResults = results.filter(r => r.severity === DiagnosticSeverity.CRITICAL);
  const errorResults = results.filter(r => r.severity === DiagnosticSeverity.ERROR);
  const warningResults = results.filter(r => r.severity === DiagnosticSeverity.WARNING);
  const infoResults = results.filter(r => r.severity === DiagnosticSeverity.INFO);
  
  // Default tab
  const defaultTab = criticalResults.length > 0 
    ? 'critical' 
    : errorResults.length > 0 
      ? 'error' 
      : warningResults.length > 0 
        ? 'warning' 
        : 'all';
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center"><>

          <ActivityIcon className="h-5 w-5 mr-2" />
          Diagnostic Results
        </CardTitle>
        <CardDescription
</>>
          {results.length} diagnostic results, {predictiveResults.length} predictions
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full grid grid-cols-6"><>

            <TabsTrigger value="all" className="col-span-1">
              All ({results.length})
            </TabsTrigger>
            <TabsTrigger
</> value="critical" className="col-span-1">
              Critical ({criticalResults.length})
            </TabsTrigger><>

            <TabsTrigger value="error" className="col-span-1">
              Error ({errorResults.length})
            </TabsTrigger>
            <TabsTrigger
</> value="warning" className="col-span-1">
              Warning ({warningResults.length})
            </TabsTrigger><>

            <TabsTrigger value="info" className="col-span-1">
              Info ({infoResults.length})
            </TabsTrigger>
            <TabsTrigger
</> value="predictive" className="col-span-1">
              Predictive ({predictiveResults.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4"><>

            <DiagnosticResultsList 
              results={results} 
              onSelect={onSelect} 
              maxHeight={maxHeight} 
            />
          </TabsContent>
          
          <TabsContent
</> value="critical" className="mt-4"><>

            <DiagnosticResultsList 
              results={criticalResults} 
              onSelect={onSelect} 
              maxHeight={maxHeight} 
            />
          </TabsContent>
          
          <TabsContent
</> value="error" className="mt-4"><>

            <DiagnosticResultsList 
              results={errorResults} 
              onSelect={onSelect} 
              maxHeight={maxHeight} 
            />
          </TabsContent>
          
          <TabsContent
</> value="warning" className="mt-4"><>

            <DiagnosticResultsList 
              results={warningResults} 
              onSelect={onSelect} 
              maxHeight={maxHeight} 
            />
          </TabsContent>
          
          <TabsContent
</> value="info" className="mt-4"><>

            <DiagnosticResultsList 
              results={infoResults} 
              onSelect={onSelect} 
              maxHeight={maxHeight} 
            />
          </TabsContent>
          
          <TabsContent
</> value="predictive" className="mt-4">
            <DiagnosticResultsList 
              results={predictiveResults as DiagnosticResult[]} 
              onSelect={onSelect} 
              maxHeight={maxHeight} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DiagnosticResults;