/**
 * Property Market Analysis Component
 * 
 * A comprehensive component that displays market trends, economic indicators,
 * future value predictions, and risk assessment for a property.
 */

import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { MarketTrendsPanel } from './market/MarketTrendsPanel';
import { EconomicIndicatorsPanel } from './market/EconomicIndicatorsPanel';
import { FutureValuePrediction } from './market/FutureValuePrediction';
import { RiskAssessmentPanel } from './risk/RiskAssessmentPanel';
import {
  TrendingUp,
  BarChart3,
  CircleDollarSign,
  ShieldAlert,
  AreaChart,
  Component
} from 'lucide-react';

interface PropertyMarketAnalysisProps {
  propertyId: string;
  propertyAddress?: string;
  className?: string;
}

export function PropertyMarketAnalysis({
  propertyId,
  propertyAddress,
  className = ''
}: PropertyMarketAnalysisProps) {
  const [activeTab, setActiveTab] = useState('market-trends');
  
  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AreaChart className="h-5 w-5" />
            <span>Market Analysis & Risk Assessment</span>
          </CardTitle>
          <CardDescription>
            Comprehensive market analysis and risk assessment for{' '}
            {propertyAddress || `Property ID: ${propertyId}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="market-trends" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="market-trends" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span>Market Trends</span>
              </TabsTrigger>
              <TabsTrigger value="economic-indicators" className="flex items-center">
                <CircleDollarSign className="h-4 w-4 mr-2" />
                <span>Economic Indicators</span>
              </TabsTrigger>
              <TabsTrigger value="future-value" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>Future Value</span>
              </TabsTrigger>
              <TabsTrigger value="risk-assessment" className="flex items-center">
                <ShieldAlert className="h-4 w-4 mr-2" />
                <span>Risk Assessment</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="market-trends" className="pt-4">
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-medium">Market Trends</h3>
                <p className="text-sm text-muted-foreground">
                  Current market trends affecting property values in this area
                </p>
              </div>
              <MarketTrendsPanel propertyId={propertyId} />
            </TabsContent>
            
            <TabsContent value="economic-indicators" className="pt-4">
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-medium">Economic Indicators</h3>
                <p className="text-sm text-muted-foreground">
                  Key economic factors influencing the property market
                </p>
              </div>
              <EconomicIndicatorsPanel propertyId={propertyId} />
            </TabsContent>
            
            <TabsContent value="future-value" className="pt-4">
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-medium">Future Value Prediction</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered forecast of property value over the next 5 years
                </p>
              </div>
              <FutureValuePrediction propertyId={propertyId} />
            </TabsContent>
            
            <TabsContent value="risk-assessment" className="pt-4">
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-medium">Risk Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analysis of risks affecting this property
                </p>
              </div>
              <RiskAssessmentPanel propertyId={propertyId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}