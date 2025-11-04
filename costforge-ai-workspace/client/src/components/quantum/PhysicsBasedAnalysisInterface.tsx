import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Activity, AlertTriangle, Cpu, Thermometer, TrendingUp, Zap } from 'lucide-react';
import React, { useRef, useState } from 'react';
import {
  MaterialQuantumAnalyzer,
  StructuralAnalysisResult,
  StructuralPhysicsEngine,
  ThermalAnalysisResult,
  ThermalDynamicsAnalyzer,
} from './PhysicsBasedAnalysis';

interface PhysicsAnalysisState {
  materialAnalysis: any | null;
  structuralAnalysis: StructuralAnalysisResult | null;
  thermalAnalysis: ThermalAnalysisResult | null;
  isAnalyzing: boolean;
  analysisProgress: number;
}

interface MaterialSelectionProps {
  selectedMaterial: string;
  onMaterialChange: (material: string) => void;
}

const MaterialSelection: React.FC<MaterialSelectionProps> = ({
  selectedMaterial,
  onMaterialChange,
}) => {
  const materials = [
    {
      id: 'steel_structural',
      name: 'Structural Steel',
      icon: '🏗️',
      description: 'High-strength steel for load-bearing elements',
    },
    {
      id: 'concrete_high_strength',
      name: 'High-Strength Concrete',
      icon: '🧱',
      description: 'Engineered concrete for durability',
    },
    {
      id: 'aluminum_6061',
      name: 'Aluminum Alloy 6061',
      icon: '⚡',
      description: 'Lightweight aluminum for modern structures',
    },
    {
      id: 'timber_douglas_fir',
      name: 'Douglas Fir Timber',
      icon: '🌲',
      description: 'Sustainable wood construction',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent">
        QUANTUM MATERIAL SELECTION
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {materials.map(material => (
          <Card
            key={material.id}
            className={`tf-glass-card cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedMaterial === material.id
                ? 'border-[#00ffee] bg-[#00ffee]/10'
                : 'border-[#00ffee]/20 bg-white/5'
            }`}
            onClick={() => onMaterialChange(material.id)}
          >
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="text-3xl">{material.icon}</div>
                <h4 className="font-semibold text-[#00ffee]">{material.name}</h4>
                <p className="text-sm text-gray-300 opacity-90">{material.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface EnvironmentalControlsProps {
  conditions: any;
  onConditionsChange: (conditions: any) => void;
}

const EnvironmentalControls: React.FC<EnvironmentalControlsProps> = ({
  conditions,
  onConditionsChange,
}) => {
  const updateCondition = (key: string, value: number | string[]) => {
    onConditionsChange({
      ...conditions,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent">
        ENVIRONMENTAL CONDITIONS
      </h3>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-[#00ffee] font-semibold">Temperature (°C)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[conditions.temperature - 273.15]}
              onValueChange={([value]) => updateCondition('temperature', value + 273.15)}
              min={-40}
              max={60}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={Math.round(conditions.temperature - 273.15)}
              onChange={e => updateCondition('temperature', Number(e.target.value) + 273.15)}
              className="w-20 bg-[#0b1020]/50 border-[#00ffee]/30 text-[#00ffee]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[#00ffee] font-semibold">Humidity (%)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[conditions.humidity * 100]}
              onValueChange={([value]) => updateCondition('humidity', value / 100)}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <Input
              type="number"
              value={Math.round(conditions.humidity * 100)}
              onChange={e => updateCondition('humidity', Number(e.target.value) / 100)}
              className="w-20 bg-[#0b1020]/50 border-[#00ffee]/30 text-[#00ffee]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[#00ffee] font-semibold">Pressure (kPa)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[conditions.pressure / 1000]}
              onValueChange={([value]) => updateCondition('pressure', value * 1000)}
              min={50}
              max={120}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={Math.round(conditions.pressure / 1000)}
              onChange={e => updateCondition('pressure', Number(e.target.value) * 1000)}
              className="w-20 bg-[#0b1020]/50 border-[#00ffee]/30 text-[#00ffee]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[#00ffee] font-semibold">Chemical Exposure</Label>
          <select
            title="Chemical Exposure Level"
            value={conditions.chemicalExposure[0] || 'none'}
            onChange={e => updateCondition('chemicalExposure', [e.target.value])}
            className="w-full p-2 bg-[#0b1020]/50 border border-[#00ffee]/30 rounded text-[#00ffee]"
          >
            <option value="none">None</option>
            <option value="mild_acids">Mild Acids</option>
            <option value="salt_water">Salt Water</option>
            <option value="industrial">Industrial Chemicals</option>
            <option value="extreme">Extreme Corrosive</option>
          </select>
        </div>
      </div>
    </div>
  );
};

interface QuantumResultsDisplayProps {
  analysisState: PhysicsAnalysisState;
}

const QuantumResultsDisplay: React.FC<QuantumResultsDisplayProps> = ({ analysisState }) => {
  const { materialAnalysis, structuralAnalysis, thermalAnalysis, isAnalyzing, analysisProgress } =
    analysisState;

  if (isAnalyzing) {
    return (
      <div className="tf-glass-card bg-[#0b1020]/80 backdrop-blur-lg border border-[#00ffee]/30 rounded-2xl p-8">
        <div className="text-center space-y-6">
          <div className="text-4xl animate-spin">⚛️</div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent">
            QUANTUM ALGORITHMS COMPUTING...
          </h3>
          <div className="w-full bg-[#0b1020] rounded-full h-4 border border-[#00ffee]/30">
            <div
              className="bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] h-full rounded-full transition-all duration-500"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <div className="text-[#00ffee] font-semibold">
            {analysisProgress}% • Molecular-Level Property Analysis
          </div>
        </div>
      </div>
    );
  }

  if (!materialAnalysis && !structuralAnalysis && !thermalAnalysis) {
    return (
      <div className="tf-glass-card bg-[#0b1020]/50 backdrop-blur-lg border border-[#00ffee]/20 rounded-2xl p-8">
        <div className="text-center space-y-4">
          <Cpu className="w-16 h-16 text-[#00ffee] mx-auto opacity-50" />
          <h3 className="text-xl font-semibold text-[#00ffee]">PHYSICS ENGINE READY</h3>
          <p className="text-gray-300">Configure parameters and initiate quantum analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Material Analysis Results */}
      {materialAnalysis && (
        <Card className="tf-glass-card bg-[#0b1020]/80 backdrop-blur-lg border border-[#00ffee]/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-[#00ffee]">
              <Zap className="w-6 h-6" />
              <span>QUANTUM MATERIAL ANALYSIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#0099ff]/10 rounded-xl border border-[#0099ff]/30">
                <div className="text-2xl font-bold text-[#0099ff]">
                  {(materialAnalysis.environmentalAdjustments.yieldStrength / 1e6).toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">Yield Strength (MPa)</div>
              </div>
              <div className="text-center p-4 bg-[#00ffee]/10 rounded-xl border border-[#00ffee]/30">
                <div className="text-2xl font-bold text-[#00ffee]">
                  {materialAnalysis.environmentalAdjustments.thermalConductivity.toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">Thermal Conductivity</div>
              </div>
              <div className="text-center p-4 bg-[#00ffaa]/10 rounded-xl border border-[#00ffaa]/30">
                <div className="text-2xl font-bold text-[#00ffaa]">
                  {materialAnalysis.costImplications.materialCostMultiplier.toFixed(2)}x
                </div>
                <div className="text-sm text-gray-300">Cost Multiplier</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[#00ffee]">Quantum Enhancement Opportunities:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(materialAnalysis.costImplications.quantumEnhancementPotential).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className={`flex items-center space-x-2 ${value ? 'text-[#00ffaa]' : 'text-gray-400'}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${value ? 'bg-[#00ffaa]' : 'bg-gray-400'}`}
                      />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {materialAnalysis.costImplications.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-[#00ffee]">Optimization Recommendations:</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  {materialAnalysis.costImplications.recommendations.map(
                    (rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-[#00ffaa] mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Structural Analysis Results */}
      {structuralAnalysis && (
        <Card className="tf-glass-card bg-[#0b1020]/80 backdrop-blur-lg border border-[#00ffee]/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-[#00ffee]">
              <Activity className="w-6 h-6" />
              <span>STRUCTURAL PHYSICS ANALYSIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#0099ff]/10 rounded-xl border border-[#0099ff]/30">
                <div className="text-2xl font-bold text-[#0099ff]">
                  {structuralAnalysis.safetyFactor.toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">Safety Factor</div>
              </div>
              <div className="text-center p-4 bg-[#00ffee]/10 rounded-xl border border-[#00ffee]/30">
                <div className="text-2xl font-bold text-[#00ffee]">
                  {(structuralAnalysis.deflectionUnderLoad * 1000).toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">Deflection (mm)</div>
              </div>
              <div className="text-center p-4 bg-[#00ffaa]/10 rounded-xl border border-[#00ffaa]/30">
                <div className="text-2xl font-bold text-[#00ffaa]">
                  {structuralAnalysis.naturalFrequencies[0].toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">1st Mode (Hz)</div>
              </div>
              <div
                className={`text-center p-4 rounded-xl border ${
                  structuralAnalysis.resonanceRisk === 'low'
                    ? 'bg-[#00ffaa]/10 border-[#00ffaa]/30'
                    : structuralAnalysis.resonanceRisk === 'medium'
                      ? 'bg-yellow-400/10 border-yellow-400/30'
                      : 'bg-red-400/10 border-red-400/30'
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    structuralAnalysis.resonanceRisk === 'low'
                      ? 'text-[#00ffaa]'
                      : structuralAnalysis.resonanceRisk === 'medium'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {structuralAnalysis.resonanceRisk.toUpperCase()}
                </div>
                <div className="text-sm text-gray-300">Resonance Risk</div>
              </div>
            </div>

            {structuralAnalysis.criticalStressPoints.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-[#00ffee] flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span>Critical Stress Points:</span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {structuralAnalysis.criticalStressPoints.slice(0, 3).map((point, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-[#0b1020]/50 rounded"
                    >
                      <span className="text-sm text-gray-300">
                        Point {index + 1}: ({point.location.x.toFixed(1)},{' '}
                        {point.location.y.toFixed(1)}, {point.location.z.toFixed(1)})
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-yellow-400">
                          {(point.stress / 1e6).toFixed(1)} MPa
                        </div>
                        <div className="text-xs text-gray-400">{point.failureMode}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Thermal Analysis Results */}
      {thermalAnalysis && (
        <Card className="tf-glass-card bg-[#0b1020]/80 backdrop-blur-lg border border-[#00ffee]/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-[#00ffee]">
              <Thermometer className="w-6 h-6" />
              <span>THERMAL DYNAMICS ANALYSIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#0099ff]/10 rounded-xl border border-[#0099ff]/30">
                <div className="text-2xl font-bold text-[#0099ff]">
                  {thermalAnalysis.rValue.toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">R-Value</div>
              </div>
              <div className="text-center p-4 bg-[#00ffee]/10 rounded-xl border border-[#00ffee]/30">
                <div className="text-2xl font-bold text-[#00ffee]">
                  ${thermalAnalysis.heatingCostImpact.toFixed(0)}
                </div>
                <div className="text-sm text-gray-300">Heating Cost/Year</div>
              </div>
              <div className="text-center p-4 bg-[#00ffaa]/10 rounded-xl border border-[#00ffaa]/30">
                <div className="text-2xl font-bold text-[#00ffaa]">
                  ${thermalAnalysis.coolingCostImpact.toFixed(0)}
                </div>
                <div className="text-sm text-gray-300">Cooling Cost/Year</div>
              </div>
              <div className="text-center p-4 bg-green-400/10 rounded-xl border border-green-400/30">
                <div className="text-2xl font-bold text-green-400">
                  {thermalAnalysis.sustainabilityScore.toFixed(0)}
                </div>
                <div className="text-sm text-gray-300">Sustainability Score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#0b1020]/50 rounded-xl border border-[#00ffee]/20">
                <h5 className="font-semibold text-[#00ffee] mb-2">Thermal Performance</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Heat Flux:</span>
                    <span className="text-[#00ffaa]">
                      {thermalAnalysis.heatFlux.toFixed(1)} W/m²
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">U-Value:</span>
                    <span className="text-[#00ffaa]">
                      {thermalAnalysis.uValue.toFixed(3)} W/(m²·K)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Carbon Footprint:</span>
                    <span className="text-[#00ffaa]">
                      {thermalAnalysis.carbonFootprint.toFixed(0)} kg CO₂
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0b1020]/50 rounded-xl border border-[#00ffee]/20">
                <h5 className="font-semibold text-[#00ffee] mb-2">Optimization Potential</h5>
                <div className="space-y-1 text-sm">
                  {thermalAnalysis.insulationRecommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-[#00ffaa] rounded-full mt-1.5" />
                      <span className="text-gray-300 text-xs">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const PhysicsBasedAnalysisInterface: React.FC = () => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('steel_structural');
  const [environmentalConditions, setEnvironmentalConditions] = useState({
    temperature: 293.15, // 20°C
    humidity: 0.5, // 50%
    pressure: 101325, // Sea level
    chemicalExposure: ['none'] as string[],
  });

  const [analysisState, setAnalysisState] = useState<PhysicsAnalysisState>({
    materialAnalysis: null,
    structuralAnalysis: null,
    thermalAnalysis: null,
    isAnalyzing: false,
    analysisProgress: 0,
  });

  const materialAnalyzer = useRef(new MaterialQuantumAnalyzer());
  const structuralEngine = useRef(new StructuralPhysicsEngine());
  const thermalAnalyzer = useRef(new ThermalDynamicsAnalyzer());

  const runPhysicsAnalysis = async () => {
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true, analysisProgress: 0 }));

    try {
      // Material Analysis (33%)
      setAnalysisState(prev => ({ ...prev, analysisProgress: 10 }));
      const materialAnalysis = await materialAnalyzer.current.analyzeQuantumProperties(
        selectedMaterial,
        environmentalConditions
      );
      setAnalysisState(prev => ({ ...prev, materialAnalysis, analysisProgress: 33 }));

      // Structural Analysis (66%)
      setAnalysisState(prev => ({ ...prev, analysisProgress: 45 }));
      const structuralAnalysis = await structuralEngine.current.performStructuralAnalysis(
        {
          dimensions: { length: 10, width: 8, height: 3 },
          shape: 'beam' as const,
          supports: [
            { type: 'fixed' as const, location: [0, 0, 0] },
            { type: 'pinned' as const, location: [10, 0, 0] },
          ],
        },
        materialAnalysis.environmentalAdjustments,
        {
          deadLoad: 5000,
          liveLoad: 2000,
          windLoad: 800,
          seismicLoad: 1200,
          temperatureLoad: environmentalConditions.temperature,
        }
      );
      setAnalysisState(prev => ({ ...prev, structuralAnalysis, analysisProgress: 66 }));

      // Thermal Analysis (100%)
      setAnalysisState(prev => ({ ...prev, analysisProgress: 80 }));
      const thermalAnalysis = await thermalAnalyzer.current.performThermalAnalysis(
        {
          wallAreas: [80, 60, 80, 60],
          windowAreas: [15, 0, 5, 0],
          roofArea: 80,
          floorArea: 80,
          volume: 240,
        },
        {
          walls: [materialAnalysis.environmentalAdjustments],
          windows: [materialAnalysis.environmentalAdjustments],
          roof: materialAnalysis.environmentalAdjustments,
          floor: materialAnalysis.environmentalAdjustments,
          insulation: [materialAnalysis.environmentalAdjustments],
        },
        {
          outsideTemperature: Array(24).fill(environmentalConditions.temperature - 5),
          solarIrradiance: Array(24).fill(500),
          windSpeed: Array(24).fill(3),
          humidity: Array(24).fill(environmentalConditions.humidity),
        },
        {
          internalHeatGains: 2000,
          ventilationRate: 0.5,
          heatingSetpoint: 293.15,
          coolingSetpoint: 298.15,
        }
      );

      setAnalysisState(prev => ({
        ...prev,
        thermalAnalysis,
        analysisProgress: 100,
        isAnalyzing: false,
      }));
    } catch (error) {
      console.error('Physics analysis error:', error);
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false, analysisProgress: 0 }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#1a2332] to-[#0b1020] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent">
            PHYSICS-BASED ANALYSIS LABORATORY
          </h1>
          <p className="text-xl text-[#00ffee] font-semibold">
            Harvard PhD Physics • MIT Statistics • Quantum Material Science
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#0099ff] rounded-full animate-pulse" />
              <span>Molecular-Level Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#00ffee] rounded-full animate-pulse" />
              <span>Structural Mechanics Engine</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#00ffaa] rounded-full animate-pulse" />
              <span>Thermal Dynamics Simulator</span>
            </div>
          </div>
        </div>

        {/* Analysis Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Material Selection */}
          <Card className="tf-glass-card bg-[#0b1020]/50 backdrop-blur-lg border border-[#00ffee]/20 rounded-2xl">
            <CardContent className="p-6">
              <MaterialSelection
                selectedMaterial={selectedMaterial}
                onMaterialChange={setSelectedMaterial}
              />
            </CardContent>
          </Card>

          {/* Environmental Controls */}
          <Card className="tf-glass-card bg-[#0b1020]/50 backdrop-blur-lg border border-[#00ffee]/20 rounded-2xl">
            <CardContent className="p-6">
              <EnvironmentalControls
                conditions={environmentalConditions}
                onConditionsChange={setEnvironmentalConditions}
              />
            </CardContent>
          </Card>
        </div>

        {/* Analysis Trigger */}
        <div className="text-center">
          <Button
            onClick={runPhysicsAnalysis}
            disabled={analysisState.isAnalyzing}
            className="tf-clarity-button bg-gradient-to-br from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white uppercase font-bold text-xl px-12 py-4 rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 border border-[#00ffee]/30 backdrop-blur-sm"
          >
            {analysisState.isAnalyzing
              ? 'COMPUTING QUANTUM PHYSICS...'
              : '⚛️ INITIATE PHYSICS ANALYSIS'}
          </Button>
        </div>

        {/* Results Display */}
        <QuantumResultsDisplay analysisState={analysisState} />
      </div>
    </div>
  );
};
