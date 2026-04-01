/**
 * Economic Indicator Card Component
 * 
 * Displays an economic indicator with its value, impact on property values,
 * and significance level in a visually informative card.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Wallet, 
  BarChart4, 
  CircleAlert
} from 'lucide-react';

interface EconomicIndicatorCardProps {
  name: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  significance: number; // 0-1 scale
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function EconomicIndicatorCard({
  name,
  value,
  impact,
  significance,
  valueFormatter,
  className = '',
}: EconomicIndicatorCardProps) {
  // Format the value for display
  const formatValue = () => {
    if (valueFormatter) {
      return valueFormatter(value);
    }
    
    // Apply default formatting based on name
    if (name.toLowerCase().includes('rate')) {
      return `${value.toFixed(2)}%`;
    }
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    
    return value.toFixed(1);
  };
  
  // Get badge color based on impact
  const getBadgeVariant = () => {
    if (impact === 'positive') return 'success';
    if (impact === 'negative') return 'destructive';
    return 'secondary';
  };
  
  // Get impact icon
  const getImpactIcon = () => {
    if (impact === 'positive') return <TrendingUp className="h-4 w-4" />;
    if (impact === 'negative') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };
  
  // Format the indicator name for display
  const formatIndicatorName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Convert significance to percentage
  const significancePercent = Math.round(significance * 100);
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">
              {formatIndicatorName(name)}
            </CardTitle>
          </div>
          <Badge variant={getBadgeVariant() as any}>
            <div className="flex items-center space-x-1">
              {getImpactIcon()}
              <span>{impact.charAt(0).toUpperCase() + impact.slice(1)}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{formatValue()}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center">
                <CircleAlert className="mr-1 h-4 w-4" />
                <span>Significance</span>
              </span>
              <span className="font-medium">{significancePercent}%</span>
            </div>
            <Progress value={significancePercent} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}