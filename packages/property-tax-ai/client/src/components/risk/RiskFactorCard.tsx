/**
 * Risk Factor Card Component
 * 
 * Displays a single risk factor with its category, score, level, and description
 * in a visually informative card format.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  Info, 
  BarChart2,
  ExternalLink
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RiskFactorCardProps {
  category: string;
  score: number;
  level: string;
  description: string;
  mitigationSuggestions?: string[];
  className?: string;
}

export function RiskFactorCard({
  category,
  score,
  level,
  description,
  mitigationSuggestions,
  className = '',
}: RiskFactorCardProps) {
  // Get badge color based on risk level
  const getBadgeVariant = () => {
    if (level.toLowerCase().includes('low')) return 'success';
    if (level.toLowerCase().includes('moderate')) return 'warning';
    if (level.toLowerCase().includes('high')) return 'destructive';
    return 'secondary';
  };
  
  // Get risk icon based on level
  const getRiskIcon = () => {
    if (level.toLowerCase().includes('low')) return <Shield className="h-4 w-4" />;
    if (level.toLowerCase().includes('moderate')) return <Info className="h-4 w-4" />;
    if (level.toLowerCase().includes('high')) return <AlertTriangle className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };
  
  // Format the category name for display
  const formatCategoryName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">
              {formatCategoryName(category)}
            </CardTitle>
          </div>
          <Badge variant={getBadgeVariant() as any}>
            <div className="flex items-center space-x-1">
              {getRiskIcon()}
              <span>{level}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Risk Score</span>
              <span className="font-medium">{score}/100</span>
            </div>
            <Progress 
              value={score} 
              className="h-2" 
              indicatorClassName={
                score < 33 ? "bg-green-600" : 
                score < 66 ? "bg-amber-500" : 
                "bg-red-600"
              }
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
          
          {mitigationSuggestions && mitigationSuggestions.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="mitigation">
                <AccordionTrigger className="text-sm">
                  Mitigation Strategies
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 text-sm space-y-1">
                    {mitigationSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-muted-foreground">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
}