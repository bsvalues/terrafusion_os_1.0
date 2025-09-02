/**
 * Material Substitution Engine Component - RESTORED from BCBSCOSTApp
 * 
 * This component provides intelligent material substitution recommendations to optimize
 * costs while maintaining quality. It uses a combination of AI and rule-based approaches
 * to identify cost-saving opportunities.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types for material recommendation
export interface MaterialSubstitution {
  id: string;
  originalMaterial: string;
  suggestedAlternative: string;
  potentialSavings: number;
  qualityImpact: 'none' | 'minor' | 'moderate' | 'significant';
  sustainabilityScore: number; // 0-100
  costReductionPercentage: number;
  availabilityScore: number; // 0-100
  reasonForRecommendation: string;
  regionalAvailability: string[];
  advantages: string[];
  disadvantages: string[];
  applicationNotes: string;
  isApproved?: boolean;
  isRejected?: boolean;
}

// Props for the component
interface MaterialSubstitutionEngineProps {
  buildingType: string;
  region: string;
  quality: string;
  currentMaterials: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    category?: string;
  }>;
  onRecommendationsGenerated?: (recommendations: MaterialSubstitution[]) => void;
  onSubstitutionApplied?: (
    originalMaterialId: string,
    alternativeMaterial: { name: string; unitPrice: number }
  ) => void;
}

// Quality impact colors
const qualityImpactColors = {
  'none': 'bg-green-100 text-green-800',
  'minor': 'bg-blue-100 text-blue-800',
  'moderate': 'bg-amber-100 text-amber-800',
  'significant': 'bg-red-100 text-red-800'
};

// Main component
export function MaterialSubstitutionEngine({
  buildingType,
  region,
  quality,
  currentMaterials,
  onRecommendationsGenerated,
  onSubstitutionApplied
}: MaterialSubstitutionEngineProps) {
  const [optimizationPreferences, setOptimizationPreferences] = useState({
    prioritizeCost: true,
    prioritizeSustainability: false,
    prioritizeAvailability: false,
    qualityThreshold: 'moderate',
    maximumQualityImpact: 1, // 0=none, 1=minor, 2=moderate
  });
  
  const [recommendations, setRecommendations] = useState<MaterialSubstitution[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<MaterialSubstitution[]>([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<{
    totalOriginalCost: number;
    totalOptimizedCost: number;
    savingsAmount: number;
    savingsPercentage: number;
    numberOfRecommendations: number;
    averageSustainabilityScore: number;
  } | null>(null);

  // Generate mock recommendations for demonstration
  const generateMockRecommendations = (): MaterialSubstitution[] => {
    const mockData: MaterialSubstitution[] = [
      {
        id: '1',
        originalMaterial: 'Premium Cedar Siding',
        suggestedAlternative: 'Fiber Cement Siding',
        potentialSavings: 2500,
        qualityImpact: 'minor',
        sustainabilityScore: 85,
        costReductionPercentage: 15,
        availabilityScore: 95,
        reasonForRecommendation: 'Excellent durability with significant cost savings',
        regionalAvailability: ['Washington', 'Oregon', 'Idaho'],
        advantages: ['Lower maintenance', 'Fire resistant', 'Insect resistant'],
        disadvantages: ['Slightly less natural appearance', 'Requires professional installation'],
        applicationNotes: 'Best for residential construction in moderate climates'
      },
      {
        id: '2',
        originalMaterial: 'Copper Roofing',
        suggestedAlternative: 'Steel Roofing with Copper Coating',
        potentialSavings: 8000,
        qualityImpact: 'minor',
        sustainabilityScore: 78,
        costReductionPercentage: 40,
        availabilityScore: 88,
        reasonForRecommendation: 'Similar appearance with substantial cost reduction',
        regionalAvailability: ['Washington', 'Oregon', 'California'],
        advantages: ['40% cost reduction', 'Similar appearance', 'Good durability'],
        disadvantages: ['Shorter lifespan than pure copper', 'May require coating renewal'],
        applicationNotes: 'Suitable for most residential and commercial applications'
      }
    ];
    
    return mockData.filter(rec => 
      currentMaterials.some(material => material.name.includes(rec.originalMaterial.split(' ')[0]))
    );
  };

  // Generate recommendations
  const generateRecommendations = async () => {
    if (currentMaterials.length === 0) return;
    
    setLoadingRecommendations(true);
    
    try {
      // Mock implementation - in production this would call the backend API
      const mockRecommendations = generateMockRecommendations();
      setRecommendations(mockRecommendations);
      
      // Calculate optimization metrics
      const totalOriginalCost = currentMaterials.reduce((sum, material) => 
        sum + (material.quantity * material.unitPrice), 0);
      
      const optimizedMaterials = [...currentMaterials];
      mockRecommendations.forEach(rec => {
        const originalMaterial = currentMaterials.find(m => m.name.includes(rec.originalMaterial));
        if (originalMaterial) {
          const newUnitPrice = originalMaterial.unitPrice * (1 - (rec.costReductionPercentage / 100));
          const idx = optimizedMaterials.findIndex(m => m.name.includes(rec.originalMaterial));
          if (idx !== -1) {
            optimizedMaterials[idx] = { 
              ...optimizedMaterials[idx], 
              unitPrice: newUnitPrice 
            };
          }
        }
      });
      
      const totalOptimizedCost = optimizedMaterials.reduce((sum, material) => 
        sum + (material.quantity * material.unitPrice), 0);
      
      const savingsAmount = totalOriginalCost - totalOptimizedCost;
      const savingsPercentage = totalOriginalCost > 0 ? (savingsAmount / totalOriginalCost) * 100 : 0;
      
      setOptimizationResults({
        totalOriginalCost,
        totalOptimizedCost,
        savingsAmount,
        savingsPercentage,
        numberOfRecommendations: mockRecommendations.length,
        averageSustainabilityScore: mockRecommendations.reduce((sum, rec) => sum + rec.sustainabilityScore, 0) / mockRecommendations.length
      });
      
      if (onRecommendationsGenerated) {
        onRecommendationsGenerated(mockRecommendations);
      }
    } catch (error) {
      console.error('Error generating material recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Filter recommendations based on preferences
  useEffect(() => {
    if (recommendations.length === 0) return;
    
    const qualityImpactValue = {
      'none': 0,
      'minor': 1,
      'moderate': 2,
      'significant': 3
    };
    
    let filtered = recommendations.filter(rec => {
      if (qualityImpactValue[rec.qualityImpact] > optimizationPreferences.maximumQualityImpact) {
        return false;
      }
      return true;
    });
    
    // Sort by priority
    if (optimizationPreferences.prioritizeCost) {
      filtered.sort((a, b) => b.potentialSavings - a.potentialSavings);
    } else if (optimizationPreferences.prioritizeSustainability) {
      filtered.sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);
    } else if (optimizationPreferences.prioritizeAvailability) {
      filtered.sort((a, b) => b.availabilityScore - a.availabilityScore);
    }
    
    setFilteredRecommendations(filtered);
  }, [recommendations, optimizationPreferences]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔄 Material Substitution Engine
          <Badge variant="secondary">RESTORED</Badge>
        </CardTitle>
        <CardDescription>
          AI-powered material optimization for cost savings and sustainability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
<>

            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger
</>
value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
<>

                <Label className="text-sm font-medium">Optimization Priorities</Label>
                <div
</>
className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="cost-priority"
                      checked={optimizationPreferences.prioritizeCost}
                      onCheckedChange={(checked) => 
                        setOptimizationPreferences(prev => ({ ...prev, prioritizeCost: checked }))}
                    />
                    <Label htmlFor="cost-priority">Prioritize Cost Savings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="sustainability-priority"
                      checked={optimizationPreferences.prioritizeSustainability}
                      onCheckedChange={(checked) => 
                        setOptimizationPreferences(prev => ({ ...prev, prioritizeSustainability: checked }))}
                    />
                    <Label htmlFor="sustainability-priority">Prioritize Sustainability</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="availability-priority"
                      checked={optimizationPreferences.prioritizeAvailability}
                      onCheckedChange={(checked) => 
                        setOptimizationPreferences(prev => ({ ...prev, prioritizeAvailability: checked }))}
                    />
                    <Label htmlFor="availability-priority">Prioritize Availability</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
<>

                <Label className="text-sm font-medium">Quality Impact Tolerance</Label>
                <div
</>
className="space-y-2">
                  <Slider
                    value={[optimizationPreferences.maximumQualityImpact]}
                    onValueChange={(value) => 
                      setOptimizationPreferences(prev => ({ ...prev, maximumQualityImpact: value[0] }))}
                    max={3}
                    min={0}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
<>

                    <span>None</span>
                    <span
</>
</>>Minor</span>
<>

                    <span>Moderate</span>
                    <span
</>
</>>Significant</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button onClick={generateRecommendations} disabled={loadingRecommendations}>
              {loadingRecommendations ? 'Generating...' : 'Generate Recommendations'}
            </Button>
          </TabsContent>
          
          <TabsContent value="recommendations">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredRecommendations.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No recommendations available. Configure your preferences and generate recommendations.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredRecommendations.map((rec) => (
                    <Card key={rec.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
<>

                            <h4 className="font-medium">{rec.originalMaterial} → {rec.suggestedAlternative}</h4>
                            <p
</>
className="text-sm text-muted-foreground">{rec.reasonForRecommendation}</p>
                          </div>
                          <Badge className={qualityImpactColors[rec.qualityImpact]}>
                            {rec.qualityImpact} impact
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
<>

                            <span className="font-medium">Cost Savings:</span>
                            <div
</>
className="text-green-600">${rec.potentialSavings.toLocaleString()} ({rec.costReductionPercentage}%)</div>
                          </div>
                          <div>
<>

                            <span className="font-medium">Sustainability:</span>
                            <div
</>
className="flex items-center gap-1">
                              <Progress value={rec.sustainabilityScore} className="w-12" />
                              {rec.sustainabilityScore}%
                            </div>
                          </div>
                          <div>
<>

                            <span className="font-medium">Availability:</span>
                            <div
</>
className="flex items-center gap-1">
                              <Progress value={rec.availabilityScore} className="w-12" />
                              {rec.availabilityScore}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
<>

                            <span className="font-medium text-green-700">Advantages:</span>
                            <ul
</>
className="text-sm list-disc list-inside text-muted-foreground">
                              {rec.advantages.map((adv, i) => <li key={i}>{adv}</li>)}
                            </ul>
                          </div>
                          <div>
<>

                            <span className="font-medium text-amber-700">Considerations:</span>
                            <ul
</>
className="text-sm list-disc list-inside text-muted-foreground">
                              {rec.disadvantages.map((dis, i) => <li key={i}>{dis}</li>)}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
<>

                          <Button 
                            size="sm" 
                            onClick={() => {
                              if (onSubstitutionApplied) {
                                onSubstitutionApplied(rec.id, {
                                  name: rec.suggestedAlternative,
                                  unitPrice: 0 // Would calculate from original price and reduction
                                });
                              }
                            }}
                          >
                            Apply Substitution
                          </Button>
                          <Button
</>
size="sm" variant="outline">
                            Get Quote
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="results">
            {optimizationResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
<>

                    <h4 className="font-medium mb-2">Cost Analysis</h4>
                    <div
</>
className="space-y-2 text-sm">
                      <div className="flex justify-between">
<>

                        <span>Original Cost:</span>
                        <span
</>
className="font-mono">${optimizationResults.totalOriginalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
<>

                        <span>Optimized Cost:</span>
                        <span
</>
className="font-mono">${optimizationResults.totalOptimizedCost.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-green-600 font-medium">
<>

                        <span>Total Savings:</span>
                        <span
</>
className="font-mono">
                          ${optimizationResults.savingsAmount.toLocaleString()} 
                          ({optimizationResults.savingsPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
<>

                    <h4 className="font-medium mb-2">Optimization Summary</h4>
                    <div
</>
className="space-y-2 text-sm">
                      <div className="flex justify-between">
<>

                        <span>Recommendations:</span>
                        <span
</>
</>>{optimizationResults.numberOfRecommendations}</span>
                      </div>
                      <div className="flex justify-between">
<>

                        <span>Avg. Sustainability Score:</span>
                        <span
</>
</>>{optimizationResults.averageSustainabilityScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Generate recommendations to see optimization results.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}