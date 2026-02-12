import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign  } from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface Valuation {
  id: number;
  userId: number;
  name: string;
  totalAnnualIncome: string;
  multiplier: string;
  valuationAmount: string;
  incomeBreakdown?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface ComparisonResult {
  valuations: Valuation[];
  comparison: {
    incomeDifference: string;
    multiplierDifference: string;
    valuationDifference: string;
    percentageChange: string;
    incomeChanges?: Record<string, string>;
  };
}

interface ValuationComparisonProps {
  valuations: Valuation[];
}

export function ValuationComparison({ valuations }: ValuationComparisonProps) {
  const [baseValuationId, setBaseValuationId] = useState<string>('');
  const [comparisonValuationId, setComparisonValuationId] = useState<string>('');
  const [compareTriggered, setCompareTriggered] = useState(false);
  
  // Query for comparison data
  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['valuationComparison', baseValuationId, comparisonValuationId],
    queryFn: async () => {
      const response = await apiRequest(`/api/valuations/compare?ids=${baseValuationId},${comparisonValuationId}`);
      return response.data as ComparisonResult;
    },
    enabled: compareTriggered && !!baseValuationId && !!comparisonValuationId,
  });
  
  // Handle comparison trigger
  const handleCompare = () => {
    if (baseValuationId && comparisonValuationId) {
      setCompareTriggered(true);
    }
  };
  
  // Reset comparison when changing selections
  const handleValuationChange = (type: 'base' | 'comparison', value: string) => {
    if (type === 'base') {
      setBaseValuationId(value);
    } else {
      setComparisonValuationId(value);
    }
    
    // Reset comparison results
    setCompareTriggered(false);
  };
  
  // If no valuations available, show a message
  if (valuations.length === 0) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Valuation Comparison</CardTitle>
          <CardDescription
</>

</>>
            Compare two valuations to see changes and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>No valuations available</AlertTitle>
            <AlertDescription
</>

</>>
              No valuations available for comparison. Create at least two valuations to use this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // If we have valuations but less than 2, show a message
  if (valuations.length < 2) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Valuation Comparison</CardTitle>
          <CardDescription
</>

</>>
            Compare two valuations to see changes and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Insufficient valuations</AlertTitle>
            <AlertDescription
</>

</>>
              You need at least two valuations to perform a comparison. You currently have {valuations.length} valuation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Format comparison data for display
  const formatChange = (value: string): { value: string; isPositive: boolean } => {
    const numericValue = parseFloat(value);
    const isPositive = numericValue >= 0;
    const prefix = isPositive ? '+' : '';
    return {
      value: `${prefix}${value}`,
      isPositive
    };
  };
  
  return (
    <Card>
      <CardHeader><>

        <CardTitle>Valuation Comparison</CardTitle>
        <CardDescription
</>

</>>
          Compare two valuations to see changes and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2"><>

            <label htmlFor="baseValuation" className="text-sm font-medium">
              Base Valuation
            </label>
            <Select
</>

              value={baseValuationId} 
              onValueChange={(value) => handleValuationChange('base', value)}
            >
              <SelectTrigger id="baseValuation"><>

                <SelectValue placeholder="Select a base valuation" />
              </SelectTrigger>
              <SelectContent
</>

</>>
                {valuations.map((valuation) => (
                  <SelectItem key={`base-${valuation.id}`} value={valuation.id.toString()}>
                    {valuation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2"><>

            <label htmlFor="comparisonValuation" className="text-sm font-medium">
              Comparison Valuation
            </label>
            <Select
</>

              value={comparisonValuationId} 
              onValueChange={(value) => handleValuationChange('comparison', value)}
            >
              <SelectTrigger id="comparisonValuation"><>

                <SelectValue placeholder="Select a comparison valuation" />
              </SelectTrigger>
              <SelectContent
</>

</>>
                {valuations.map((valuation) => (
                  <SelectItem key={`comparison-${valuation.id}`} value={valuation.id.toString()}>
                    {valuation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          onClick={handleCompare}
          disabled={!baseValuationId || !comparisonValuationId || baseValuationId === comparisonValuationId || isLoading}
          className="w-full mb-6"
        >
          {isLoading || isFetching ? 'Loading...' : 'Compare Valuations'}
        </Button>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Error</AlertTitle>
            <AlertDescription
</>

</>>
              {error instanceof Error ? error.message : 'Failed to retrieve comparison data'}
            </AlertDescription>
          </Alert>
        )}
        
        {data && (
          <div className="mt-6"><>

            <h3 className="text-lg font-semibold mb-4">Valuation Comparison Results</h3>
            
            <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader><>

                  <CardTitle className="text-base">{data.valuations[0].name}</CardTitle>
                  <CardDescription
</>

</>>Base Valuation</CardDescription>
                </CardHeader>
                <CardContent><>

                  <div className="text-2xl font-bold">
                    {formatCurrency(parseFloat(data.valuations[0].valuationAmount))}
                  </div>
                  <div
</>

className="text-sm text-muted-foreground mt-1">
                    Income: {formatCurrency(parseFloat(data.valuations[0].totalAnnualIncome))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Multiplier: {data.valuations[0].multiplier}x
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><>

                  <CardTitle className="text-base">{data.valuations[1].name}</CardTitle>
                  <CardDescription
</>

</>>Comparison Valuation</CardDescription>
                </CardHeader>
                <CardContent><>

                  <div className="text-2xl font-bold">
                    {formatCurrency(parseFloat(data.valuations[1].valuationAmount))}
                  </div>
                  <div
</>

className="text-sm text-muted-foreground mt-1">
                    Income: {formatCurrency(parseFloat(data.valuations[1].totalAnnualIncome))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Multiplier: {data.valuations[1].multiplier}x
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Income Difference */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Income Difference</p>
                      {(() => {
                        const { value, isPositive } = formatChange(data.comparison.incomeDifference);
                        const formattedValue = formatCurrency(parseFloat(data.comparison.incomeDifference));
                        return (
                          <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formattedValue}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="p-2 rounded-full bg-muted">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Multiplier Difference */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Multiplier Difference</p>
                      {(() => {
                        const { value, isPositive } = formatChange(data.comparison.multiplierDifference);
                        return (
                          <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{data.comparison.multiplierDifference}
                          </p>
                        );
                      })()}
                    </div>
                    {(() => {
                      const isPositive = parseFloat(data.comparison.multiplierDifference) >= 0;
                      return (
                        <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isPositive ? 
                            <TrendingUp className="h-5 w-5 text-green-600" /> : 
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          }
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
              
              {/* Valuation Difference */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Valuation Difference</p>
                      {(() => {
                        const { value, isPositive } = formatChange(data.comparison.valuationDifference);
                        const formattedValue = formatCurrency(parseFloat(data.comparison.valuationDifference));
                        return (
                          <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formattedValue}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="p-2 rounded-full bg-muted">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Percentage Change */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Percentage Change</p>
                      {(() => {
                        const percentValue = parseFloat(data.comparison.percentageChange) / 100;
                        const isPositive = percentValue >= 0;
                        return (
                          <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{data.comparison.percentageChange}%
                          </p>
                        );
                      })()}
                    </div>
                    {(() => {
                      const isPositive = parseFloat(data.comparison.percentageChange) >= 0;
                      return (
                        <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isPositive ? 
                            <TrendingUp className="h-5 w-5 text-green-600" /> : 
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          }
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Income Source Changes */}
            {data.comparison.incomeChanges && (
              <div className="mt-6"><>

                <h4 className="text-base font-medium mb-3">Income Source Changes</h4>
                <Card
</>

</>>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {Object.entries(data.comparison.incomeChanges).map(([source, change]) => {
                        const numericChange = parseFloat(change);
                        const isPositive = numericChange >= 0;
                        return (
                          <div key={source} className="flex justify-between items-center border-b pb-2"><>

                            <span className="capitalize">{source}</span>
                            <span
</>

className={isPositive ? 'text-green-600' : 'text-red-600'}>
                              {isPositive ? '+' : ''}{formatCurrency(numericChange)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}