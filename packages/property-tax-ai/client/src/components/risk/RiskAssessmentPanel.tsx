/**
 * Risk Assessment Panel Component
 * 
 * Displays a comprehensive risk assessment for a property, including
 * overall risk score, risk factors by category, and visualizations.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskFactorCard } from './RiskFactorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  ShieldAlert, 
  Building, 
  AlertTriangle,
  FileWarning,
  AlertOctagon,
  BarChart3,
  CircleDollarSign,
  Scale
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface RiskFactor {
  category: string;
  score: number;
  level: string;
  description: string;
  mitigationSuggestions?: string[];
}

interface RiskCategory {
  name: string;
  score: number;
  color: string;
}

interface EconomicFactor {
  name: string;
  impact: string;
  trend: string;
  description: string;
}

interface RegulatoryFactor {
  name: string;
  impact: string;
  probability: string;
  description: string;
}

interface EnvironmentalFactor {
  name: string;
  impact: string;
  probability: string;
  description: string;
}

interface RiskAssessmentData {
  propertyId: string;
  address: string;
  overallRiskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  riskFactors: RiskFactor[];
  economicFactors: EconomicFactor[];
  regulatoryFactors: RegulatoryFactor[];
  environmentalFactors: EnvironmentalFactor[];
  generatedDate: string;
}

interface RiskAssessmentPanelProps {
  propertyId: string;
  className?: string;
}

export function RiskAssessmentPanel({ 
  propertyId, 
  className = '' 
}: RiskAssessmentPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['riskAssessment', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/risk-assessment/${propertyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load risk assessment');
      }
      
      return response.json() as Promise<RiskAssessmentData>;
    },
    enabled: !!propertyId
  });
  
  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    if (level === 'Low') return 'text-green-600';
    if (level === 'Moderate') return 'text-amber-500';
    if (level === 'High') return 'text-red-600';
    if (level === 'Very High') return 'text-red-700';
    return 'text-muted-foreground';
  };
  
  // Get risk level icon
  const getRiskLevelIcon = (level: string) => {
    if (level === 'Low') return <ShieldAlert className="h-5 w-5 text-green-600" />;
    if (level === 'Moderate') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    if (level === 'High') return <AlertOctagon className="h-5 w-5 text-red-600" />;
    if (level === 'Very High') return <AlertOctagon className="h-5 w-5 text-red-700" />;
    return <AlertCircle className="h-5 w-5" />;
  };
  
  // Prepare chart data for the risk overview
  const prepareChartData = (assessmentData: RiskAssessmentData) => {
    // Group risk factors by category
    const categoryMap = new Map<string, { count: number, score: number }>();
    
    assessmentData.riskFactors.forEach(factor => {
      const existing = categoryMap.get(factor.category);
      if (existing) {
        existing.count += 1;
        existing.score += factor.score;
      } else {
        categoryMap.set(factor.category, { count: 1, score: factor.score });
      }
    });
    
    // Generate chart data with colors
    const colors = ['#1E88E5', '#43A047', '#E53935', '#FFB300', '#5E35B1', '#00ACC1'];
    
    const chartData: RiskCategory[] = Array.from(categoryMap.entries()).map(([name, data], index) => ({
      name,
      score: Math.round(data.score / data.count), // Average score for the category
      color: colors[index % colors.length]
    }));
    
    return chartData;
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
          <CardDescription>Loading property risk analysis...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[250px] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : 'An error occurred while loading the risk assessment'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!data) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          No risk assessment data is available for this property.
        </AlertDescription>
      </Alert>
    );
  }
  
  const chartData = prepareChartData(data);
  
  // Group risk factors by category for the factors view
  const riskFactorsByCategory = data.riskFactors.reduce((acc, factor) => {
    const category = factor.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(factor);
    return acc;
  }, {} as Record<string, RiskFactor[]>);
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileWarning className="h-5 w-5" />
            <CardTitle>Risk Assessment</CardTitle>
          </div>
          <div className={`flex items-center space-x-1 ${getRiskLevelColor(data.riskLevel)}`}>
            {getRiskLevelIcon(data.riskLevel)}
            <span className="font-medium">{data.riskLevel} Risk</span>
          </div>
        </div>
        <CardDescription>
          Comprehensive risk analysis for {data.address}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="economic">Economic</TabsTrigger>
            <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
            <TabsTrigger value="environmental">Environmental</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="text-sm text-muted-foreground">Overall Risk Score</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.overallRiskScore}/100
                  </div>
                  <div className={`text-sm mt-1 ${getRiskLevelColor(data.riskLevel)}`}>
                    {data.riskLevel} Risk Level
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="text-sm text-muted-foreground">Risk Factors</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.riskFactors.length}
                  </div>
                  <div className="text-sm mt-1 text-muted-foreground">
                    Identified factors
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="text-sm text-muted-foreground">Top Risk Category</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {chartData.length > 0 
                      ? chartData.sort((a, b) => b.score - a.score)[0].name.split(' ')[0] 
                      : 'N/A'}
                  </div>
                  <div className="text-sm mt-1 text-muted-foreground">
                    Highest risk score
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Risk Categories
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="score"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`Score: ${value}`, 'Risk Score']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Top Risk Factors</h3>
                <div className="space-y-3">
                  {data.riskFactors
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map((factor, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-md">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center 
                          ${factor.level.toLowerCase().includes('low') 
                            ? 'bg-green-100 text-green-600' 
                            : factor.level.toLowerCase().includes('moderate') 
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-red-100 text-red-600'}`}>
                          {getRiskLevelIcon(factor.level)}
                        </div>
                        <div>
                          <div className="font-medium">{factor.category}</div>
                          <div className="text-sm text-muted-foreground">{factor.level} - Score: {factor.score}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Risk Factor Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(riskFactorsByCategory)
                  .flatMap(([category, factors]) => 
                    factors.map((factor, index) => (
                      <RiskFactorCard
                        key={`${category}-${index}`}
                        category={factor.category}
                        score={factor.score}
                        level={factor.level}
                        description={factor.description}
                        mitigationSuggestions={factor.mitigationSuggestions}
                      />
                    ))
                  )}
              </div>
            </div>
          </TabsContent>
          
          {/* Economic Tab */}
          <TabsContent value="economic" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <CircleDollarSign className="h-5 w-5" />
              <h3 className="text-lg font-medium">Economic Risk Factors</h3>
            </div>
            
            {data.economicFactors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No economic risk factors have been identified for this property.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {data.economicFactors.map((factor, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{factor.name}</CardTitle>
                        <Badge variant={
                          factor.impact.toLowerCase().includes('positive') ? 'success' : 
                          factor.impact.toLowerCase().includes('negative') ? 'destructive' : 
                          'secondary'
                        }>
                          {factor.impact}
                        </Badge>
                      </div>
                      <CardDescription>Trend: {factor.trend}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Regulatory Tab */}
          <TabsContent value="regulatory" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Scale className="h-5 w-5" />
              <h3 className="text-lg font-medium">Regulatory Risk Factors</h3>
            </div>
            
            {data.regulatoryFactors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No regulatory risk factors have been identified for this property.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {data.regulatoryFactors.map((factor, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{factor.name}</CardTitle>
                        <div className="flex space-x-2">
                          <Badge variant={
                            factor.impact.toLowerCase().includes('high') ? 'destructive' : 
                            factor.impact.toLowerCase().includes('medium') ? 'warning' : 
                            'success'
                          }>
                            {factor.impact} Impact
                          </Badge>
                          <Badge variant={
                            factor.probability.toLowerCase().includes('high') ? 'destructive' : 
                            factor.probability.toLowerCase().includes('medium') ? 'warning' : 
                            'success'
                          }>
                            {factor.probability} Probability
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Environmental Tab */}
          <TabsContent value="environmental" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-5 w-5" />
              <h3 className="text-lg font-medium">Environmental Risk Factors</h3>
            </div>
            
            {data.environmentalFactors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No environmental risk factors have been identified for this property.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {data.environmentalFactors.map((factor, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{factor.name}</CardTitle>
                        <div className="flex space-x-2">
                          <Badge variant={
                            factor.impact.toLowerCase().includes('high') ? 'destructive' : 
                            factor.impact.toLowerCase().includes('medium') ? 'warning' : 
                            'success'
                          }>
                            {factor.impact} Impact
                          </Badge>
                          <Badge variant={
                            factor.probability.toLowerCase().includes('high') ? 'destructive' : 
                            factor.probability.toLowerCase().includes('medium') ? 'warning' : 
                            'success'
                          }>
                            {factor.probability} Probability
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}