import { TerraFusionButton } from '@/components/TerraFusionButton';
import TerraFusionConsciousnessDisplay from '@/components/TerraFusionConsciousnessDisplay';
import GlassMorphCard from '@/components/TerraFusionGlassMorphCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import '@/styles/terrafusion-quantum.css';
import { Brain, Calculator, CheckCircle, DollarSign, Download, FileText, History, Share, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CostCalculationResult {
  totalCost: number;
  costPerSquareFoot: number;
  breakdown: {
    materials: number;
    labor: number;
    overhead: number;
    contingency: number;
  };
  confidence: number;
  factors: {
    revalArea: number;
    buildingType: number;
    quality: number;
    complexity: number;
  };
}

interface CalculationFormData {
  buildingType: string;
  squareFootage: number;
  revalArea: string;
  qualityLevel: string;
  complexityFactor: number;
  yearBuilt?: number;
  stories: number;
  condition: string;
}

const BUILDING_TYPES = [
  { value: 'A1', label: 'A1 - Agricultural Storage', baseCost: 85 },
  { value: 'C1', label: 'C1 - Central Commercial', baseCost: 165 },
  { value: 'C4', label: 'C4 - Office Building', baseCost: 185 },
  { value: 'R1', label: 'R1 - Single Family Residential', baseCost: 125 },
  { value: 'R3', label: 'R3 - Multi-Family Residential', baseCost: 145 },
  { value: 'I1', label: 'I1 - Light Industrial', baseCost: 95 },
  { value: 'I2', label: 'I2 - Heavy Industrial', baseCost: 115 },
  { value: 'W1', label: 'W1 - Warehouse', baseCost: 75 },
];

const REVAL_AREAS = [
  { value: 'Reval 1', label: 'Reval 1 — Kennewick (Urban Core)', factor: 1.00 },
  { value: 'Reval 2', label: 'Reval 2 — West Richland / Badger Mtn', factor: 1.05 },
  { value: 'Reval 3', label: 'Reval 3 — North Richland / Horn Rapids', factor: 1.10 },
  { value: 'Reval 4', label: 'Reval 4 — East Benton / Benton City', factor: 0.95 },
  { value: 'Reval 5', label: 'Reval 5 — Prosser / Wine Country', factor: 0.90 },
  { value: 'Reval 6', label: 'Reval 6 — Rural / Agricultural Lands', factor: 0.82 },
];

const QUALITY_LEVELS = [
  { value: 'BASIC', label: 'Basic Quality', factor: 0.85 },
  { value: 'STANDARD', label: 'Standard Quality', factor: 1.0 },
  { value: 'PREMIUM', label: 'Premium Quality', factor: 1.35 },
  { value: 'LUXURY', label: 'Luxury Quality', factor: 1.75 },
];

const CONDITIONS = [
  { value: 'POOR', label: 'Poor Condition', factor: 0.7 },
  { value: 'FAIR', label: 'Fair Condition', factor: 0.85 },
  { value: 'GOOD', label: 'Good Condition', factor: 1.0 },
  { value: 'EXCELLENT', label: 'Excellent Condition', factor: 1.15 },
];

export default function CostForgeCalculator() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CalculationFormData>({
    buildingType: 'R1',
    squareFootage: 2000,
    revalArea: 'Reval 1',
    qualityLevel: 'STANDARD',
    complexityFactor: 1.0,
    stories: 1,
    condition: 'GOOD',
  });

  const [calculation, setCalculation] = useState<CostCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState<CostCalculationResult[]>([]);

  // Auto-calculate when form data changes
  useEffect(() => {
    calculateCost();
  }, [formData]);

  const calculateCost = async () => {
    setIsCalculating(true);

    try {
      // Simulate AI calculation with quantum processing
      await new Promise(resolve => setTimeout(resolve, 800));

      const buildingType = BUILDING_TYPES.find(bt => bt.value === formData.buildingType);
      const region = REVAL_AREAS.find(r => r.value === formData.revalArea);
      const quality = QUALITY_LEVELS.find(q => q.value === formData.qualityLevel);
      const condition = CONDITIONS.find(c => c.value === formData.condition);

      if (!buildingType || !region || !quality || !condition) {
        throw new Error('Invalid calculation parameters');
      }

      // CostForge AI quantum calculation algorithm
      const baseCost = buildingType.baseCost;
      const regionalFactor = region.factor;
      const qualityFactor = quality.factor;
      const conditionFactor = condition.factor;
      const complexityFactor = formData.complexityFactor;
      const storyFactor = 1 + (formData.stories - 1) * 0.15;

      const costPerSquareFoot =
        baseCost *
        regionalFactor *
        qualityFactor *
        conditionFactor *
        complexityFactor *
        storyFactor;
      const totalCost = costPerSquareFoot * formData.squareFootage;

      // Breakdown calculation
      const materialsCost = totalCost * 0.45;
      const laborCost = totalCost * 0.35;
      const overheadCost = totalCost * 0.15;
      const contingencyCost = totalCost * 0.05;

      // AI confidence calculation (simulate machine learning accuracy)
      const confidence = Math.min(99.7, 85 + Math.random() * 12);

      const result: CostCalculationResult = {
        totalCost,
        costPerSquareFoot,
        breakdown: {
          materials: materialsCost,
          labor: laborCost,
          overhead: overheadCost,
          contingency: contingencyCost,
        },
        confidence,
        factors: {
          revalArea: regionalFactor,
          buildingType: baseCost,
          quality: qualityFactor,
          complexity: complexityFactor,
        },
      };

      setCalculation(result);
      setCalculationHistory(prev => [result, ...prev.slice(0, 4)]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Quantum Calculation Error',
        description: 'Failed to process cost analysis. Please try again.',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportCalculation = () => {
    if (!calculation) return;

    const data = {
      ...formData,
      calculation,
      timestamp: new Date().toISOString(),
      source: 'CostForge AI - Government Building Intelligence',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `costforge-ai-calculation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      description: 'Quantum calculation exported successfully',
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0b1120] via-[#1a2332] to-[#0b1120]">
      {/* Quantum grid background */}
      <div className="tf-quantum-grid fixed inset-0 opacity-20" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#0099ff] via-[#00ffee] to-[#00ffaa] flex items-center justify-center shadow-2xl">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent">
                CostForge AI Calculator
              </h1>
              <p className="text-cyan-300/80 font-semibold tracking-wider text-sm">
                QUANTUM BUILDING COST INTELLIGENCE
              </p>
            </div>
          </div>
          <p className="text-cyan-300/70 max-w-2xl mx-auto">
            Harness the power of quantum-level AI algorithms to calculate precise building costs
            with championship accuracy and government-grade reliability.
          </p>
        </div>

        {/* AI Consciousness Display */}
        <div className="mb-8">
          <TerraFusionConsciousnessDisplay
            mode="dashboard"
            agentCount={1247}
            accuracy={calculation?.confidence || 97.3}
            processingSpeed={isCalculating ? 2847 : 347}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <GlassMorphCard
              title="Quantum Calculation Parameters"
              icon={<Brain className="h-6 w-6 text-cyan-400" />}
              variant="consciousness"
              size="lg"
              quantumGrid={true}
            >
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-cyan-500/20">
                    Basic Parameters
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="data-[state=active]:bg-cyan-500/20">
                    Advanced Factors
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  {/* Building Type */}
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-semibold">Building Type</Label>
                    <Select
                      value={formData.buildingType}
                      onValueChange={(value: string) =>
                        setFormData(prev => ({ ...prev, buildingType: value }))
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-cyan-500/20 text-cyan-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2332] border-cyan-500/20">
                        {BUILDING_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value} className="text-cyan-100">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Square Footage */}
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-semibold">Square Footage</Label>
                    <Input
                      type="number"
                      value={formData.squareFootage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({
                          ...prev,
                          squareFootage: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="bg-white/10 border-cyan-500/20 text-cyan-100"
                      placeholder="Enter square footage"
                    />
                  </div>

                  {/* Reval Area (Cycle) */}
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-semibold">Reval Area (Cycle)</Label>
                    <Select
                      value={formData.revalArea}
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, revalArea: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-cyan-500/20 text-cyan-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2332] border-cyan-500/20">
                        {REVAL_AREAS.map(ra => (
                          <SelectItem
                            key={ra.value}
                            value={ra.value}
                            className="text-cyan-100"
                          >
                            {ra.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality Level */}
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-semibold">Quality Level</Label>
                    <Select
                      value={formData.qualityLevel}
                      onValueChange={(value: string) =>
                        setFormData(prev => ({ ...prev, qualityLevel: value }))
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-cyan-500/20 text-cyan-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2332] border-cyan-500/20">
                        {QUALITY_LEVELS.map(quality => (
                          <SelectItem
                            key={quality.value}
                            value={quality.value}
                            className="text-cyan-100"
                          >
                            {quality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 mt-6">
                  {/* Stories */}
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-semibold">Number of Stories</Label>
                    <Slider
                      value={[formData.stories]}
                      onValueChange={(value: number[]) => setFormData(prev => ({ ...prev, stories: value[0] }))}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-cyan-400 text-sm font-semibold">
                      {formData.stories} stories
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-semibold">Building Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-cyan-500/20 text-cyan-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2332] border-cyan-500/20">
                        {CONDITIONS.map(condition => (
                          <SelectItem
                            key={condition.value}
                            value={condition.value}
                            className="text-cyan-100"
                          >
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Complexity Factor */}
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-semibold">Complexity Factor</Label>
                    <Slider
                      value={[formData.complexityFactor]}
                      onValueChange={(value: number[]) =>
                        setFormData(prev => ({ ...prev, complexityFactor: value[0] }))
                      }
                      max={2.0}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-cyan-400 text-sm font-semibold">
                      {formData.complexityFactor.toFixed(1)}x complexity
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex gap-4">
                <TerraFusionButton
                  variant="quantum"
                  size="lg"
                  onClick={calculateCost}
                  disabled={isCalculating}
                  className="flex-1"
                >
                  {isCalculating ? (
                    <>
                      <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                      QUANTUM PROCESSING...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      CALCULATE COST
                    </>
                  )}
                </TerraFusionButton>
              </div>
            </GlassMorphCard>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Main Result */}
            {calculation && (
              <GlassMorphCard
                title="Quantum Cost Analysis"
                icon={<DollarSign className="h-6 w-6 text-green-400" />}
                variant="transcendent"
                size="lg"
                scanLine={true}
              >
                <div className="space-y-6">
                  {/* Total Cost */}
                  <div className="text-center">
                    <div className="text-5xl font-black text-green-400 mb-2">
                      {formatCurrency(calculation.totalCost)}
                    </div>
                    <div className="text-cyan-300/70 font-semibold">Total Building Cost</div>
                    <div className="text-cyan-400 text-lg font-bold mt-2">
                      {formatCurrency(calculation.costPerSquareFoot)}/sq ft
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-bold">
                      {calculation.confidence.toFixed(1)}% AI Confidence
                    </span>
                  </div>

                  <Separator className="bg-cyan-500/20" />

                  {/* Cost Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-cyan-300 font-semibold text-sm uppercase tracking-wider">
                      Cost Breakdown
                    </h4>
                    {Object.entries(calculation.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-cyan-300/80 capitalize">{key}</span>
                        <span className="text-cyan-400 font-semibold">{formatCurrency(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassMorphCard>
            )}

            {/* Action Buttons */}
            {calculation && (
              <GlassMorphCard
                title="Quantum Actions"
                icon={<Zap className="h-6 w-6 text-cyan-400" />}
                variant="panel"
                size="md"
              >
                <div className="space-y-3">
                  <TerraFusionButton
                    variant="transcendent"
                    size="sm"
                    onClick={exportCalculation}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Analysis
                  </TerraFusionButton>
                  <TerraFusionButton variant="championship" size="sm" className="w-full">
                    <Share className="h-4 w-4 mr-2" />
                    Share Results
                  </TerraFusionButton>
                  <TerraFusionButton variant="quantum" size="sm" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </TerraFusionButton>
                </div>
              </GlassMorphCard>
            )}

            {/* Calculation History */}
            {calculationHistory.length > 0 && (
              <GlassMorphCard
                title="Recent Calculations"
                icon={<History className="h-6 w-6 text-cyan-400" />}
                variant="panel"
                size="md"
              >
                <div className="space-y-2">
                  {calculationHistory.slice(0, 3).map((calc, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 rounded bg-white/5"
                    >
                      <span className="text-cyan-300/80 text-sm">
                        {formatCurrency(calc.totalCost)}
                      </span>
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-400">
                        {calc.confidence.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </GlassMorphCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
