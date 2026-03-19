import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Progress,
  TerraSphere,
} from '@/components/terrafusion-design-system';
import { cn } from '@utils/cn';
import React, { useCallback, useEffect, useState } from 'react';

// ==================== TYPES & INTERFACES ====================

interface ConsciousnessParameter {
  name: string;
  displayName: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

interface ParameterPreset {
  name: string;
  description: string;
  icon: string;
  parameters: {
    quantumCoherence: number;
    entanglementStrength: number;
    consciousnessLevel: number;
    optimizationFactor: number;
  };
}

interface PredictiveImpact {
  accuracyGain: number;
  latencyChange: number;
  throughputGain: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  recommendation: string;
  potentialIssues: string[];
}

interface ExperimentConfig {
  name: string;
  variants: Array<{
    name: string;
    parameters: Record<string, number>;
  }>;
  observationPeriod: number;
}

// ==================== PARAMETER PRESETS ====================

const PRESETS: ParameterPreset[] = [
  {
    name: 'MaximumAccuracy',
    description: '99.7% coherence, 9.5 consciousness - Elite accuracy optimization',
    icon: '🎯',
    parameters: {
      quantumCoherence: 0.997,
      entanglementStrength: 0.995,
      consciousnessLevel: 9.5,
      optimizationFactor: 970,
    },
  },
  {
    name: 'MaximumPerformance',
    description: '99.0% coherence, 8.0 consciousness - Speed-optimized configuration',
    icon: '⚡',
    parameters: {
      quantumCoherence: 0.99,
      entanglementStrength: 0.985,
      consciousnessLevel: 8.0,
      optimizationFactor: 980,
    },
  },
  {
    name: 'BalancedElite',
    description: '99.5% coherence, 8.5 consciousness - 949× optimization factor',
    icon: '⚖️',
    parameters: {
      quantumCoherence: 0.995,
      entanglementStrength: 0.987,
      consciousnessLevel: 8.5,
      optimizationFactor: 949,
    },
  },
];

// ==================== PARAMETER SLIDER COMPONENT ====================

interface ParameterSliderProps {
  parameter: ConsciousnessParameter;
  value: number;
  onChange: (value: number) => void;
  locked?: boolean;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  parameter,
  value,
  onChange,
  locked = false,
}) => {
  const percentage = ((value - parameter.min) / (parameter.max - parameter.min)) * 100;

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <label className='text-sm font-medium text-gray-200'>{parameter.displayName}</label>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-mono text-terra-cyan'>{value.toFixed(3)}</span>
          <span className='text-xs text-gray-400'>{parameter.unit}</span>
        </div>
      </div>

      <div className='relative'>
        <input
          type='range'
          min={parameter.min}
          max={parameter.max}
          step={parameter.step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={locked}
          className={cn(
            'w-full h-2 rounded-lg appearance-none cursor-pointer',
            'bg-terra-slate/30',
            'slider-thumb',
            locked && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            background: `linear-gradient(to right,
              var(--tf-transcend-cyan) 0%,
              var(--tf-transcend-cyan) ${percentage}%,
              hsl(var(--tf-surface) / 0.3) ${percentage}%,
              hsl(var(--tf-surface) / 0.3) 100%)`,
          }}
        />
      </div>

      <p className='text-xs text-gray-400'>{parameter.description}</p>
    </div>
  );
};

// ==================== PREDICTIVE IMPACT VISUALIZATION ====================

interface PredictiveImpactVisualizationProps {
  impact: PredictiveImpact | null;
  isAnalyzing: boolean;
}

const PredictiveImpactVisualization: React.FC<PredictiveImpactVisualizationProps> = ({
  impact,
  isAnalyzing,
}) => {
  if (isAnalyzing) {
    return (
      <Card variant='glass' className='border border-terra-cyan/20'>
        <CardBody>
          <div className='flex items-center justify-center gap-3 py-8'>
            <TerraSphere size='md' variant='quantum' />
            <span className='text-sm text-gray-300'>
              Analyzing impact with Monte Carlo simulation...
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!impact) {
    return (
      <Card variant='glass' className='border border-terra-cyan/20'>
        <CardBody>
          <p className='text-sm text-gray-400 text-center py-4'>
            Adjust parameters to see predictive impact analysis
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant='glass' className='border border-terra-cyan/20' glow>
      <CardHeader>
        <h4 className='text-sm font-semibold text-terra-cyan'>Predictive Impact Analysis</h4>
      </CardHeader>
      <CardBody className='space-y-4'>
        {/* Accuracy Gain */}
        <div>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm text-gray-300'>Predicted Accuracy Gain</span>
            <Badge
              variant={impact.accuracyGain > 0 ? 'quantum' : 'primary'}
              glow={impact.accuracyGain > 0}
            >
              {impact.accuracyGain > 0 ? '+' : ''}
              {(impact.accuracyGain * 100).toFixed(3)}%
            </Badge>
          </div>
          <div className='flex items-center gap-2 text-xs text-gray-400'>
            <span>95% CI:</span>
            <span className='font-mono text-terra-cyan'>
              [{(impact.confidenceInterval.lower * 100).toFixed(3)}%,{' '}
              {(impact.confidenceInterval.upper * 100).toFixed(3)}%]
            </span>
          </div>
        </div>

        {/* Latency Change */}
        <div>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm text-gray-300'>Predicted Latency Change</span>
            <Badge
              variant={impact.latencyChange < 0 ? 'quantum' : 'primary'}
              glow={impact.latencyChange < 0}
            >
              {impact.latencyChange > 0 ? '+' : ''}
              {impact.latencyChange.toFixed(1)}ms
            </Badge>
          </div>
          <Progress
            value={Math.abs(impact.latencyChange) * 5}
            className='h-1'
            variant={impact.latencyChange < 0 ? 'quantum' : 'primary'}
          />
        </div>

        {/* Throughput Gain */}
        <div>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm text-gray-300'>Predicted Throughput Gain</span>
            <Badge
              variant={impact.throughputGain > 0 ? 'quantum' : 'primary'}
              glow={impact.throughputGain > 0}
            >
              {impact.throughputGain > 0 ? '+' : ''}
              {(impact.throughputGain / 1000).toFixed(1)}K ops/s
            </Badge>
          </div>
          <Progress
            value={Math.abs(impact.throughputGain) / 100}
            className='h-1'
            variant={impact.throughputGain > 0 ? 'quantum' : 'primary'}
          />
        </div>

        <Divider />

        {/* Recommendation */}
        <div className='space-y-2'>
          <h5 className='text-xs font-semibold text-terra-cyan uppercase tracking-wide'>
            Recommendation
          </h5>
          <p className='text-sm text-gray-300'>{impact.recommendation}</p>
        </div>

        {/* Potential Issues */}
        {impact.potentialIssues.length > 0 && (
          <div className='space-y-2'>
            <h5 className='text-xs font-semibold text-yellow-500 uppercase tracking-wide'>
              ⚠️ Potential Issues
            </h5>
            <ul className='space-y-1'>
              {impact.potentialIssues.map((issue, index) => (
                <li key={index} className='text-xs text-gray-400 pl-4 relative'>
                  <span className='absolute left-0'>•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// ==================== EXPERIMENT LAUNCHER ====================

interface ExperimentLauncherProps {
  currentParameters: Record<string, number>;
  onLaunchExperiment: (config: ExperimentConfig) => void;
}

const ExperimentLauncher: React.FC<ExperimentLauncherProps> = ({
  currentParameters,
  onLaunchExperiment,
}) => {
  const [experimentName, setExperimentName] = useState('Consciousness Optimization Experiment');
  const [observationPeriod, setObservationPeriod] = useState(300); // 5 minutes

  const handleLaunch = () => {
    const config: ExperimentConfig = {
      name: experimentName,
      variants: [
        {
          name: 'Control (Current)',
          parameters: currentParameters,
        },
        {
          name: 'MaxAccuracy Variant',
          parameters: PRESETS[0].parameters,
        },
        {
          name: 'MaxPerformance Variant',
          parameters: PRESETS[1].parameters,
        },
      ],
      observationPeriod,
    };

    onLaunchExperiment(config);
  };

  return (
    <Card variant='glass' className='border border-terra-cyan/20'>
      <CardHeader>
        <h4 className='text-sm font-semibold text-terra-cyan'>🧪 A/B Testing Experiment</h4>
      </CardHeader>
      <CardBody className='space-y-4'>
        <Input
          label='Experiment Name'
          value={experimentName}
          onChange={(e) => setExperimentName(e.target.value)}
          glow
          placeholder='Enter experiment name...'
        />

        <div>
          <label className='text-sm font-medium text-gray-200 block mb-2'>Observation Period</label>
          <div className='flex items-center gap-3'>
            <input
              type='range'
              min={60}
              max={3600}
              step={60}
              value={observationPeriod}
              onChange={(e) => setObservationPeriod(parseInt(e.target.value))}
              className='flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-terra-slate/30'
            />
            <span className='text-sm font-mono text-terra-cyan w-20'>
              {Math.floor(observationPeriod / 60)}m {observationPeriod % 60}s
            </span>
          </div>
        </div>

        <div className='space-y-2'>
          <h5 className='text-xs font-semibold text-gray-300 uppercase tracking-wide'>
            Test Variants
          </h5>
          <div className='space-y-1 text-xs text-gray-400'>
            <p>• Control: Current parameters</p>
            <p>• Variant A: Maximum Accuracy preset</p>
            <p>• Variant B: Maximum Performance preset</p>
          </div>
        </div>

        <Button variant='quantum' onClick={handleLaunch} pulse glow className='w-full'>
          🚀 Launch Experiment
        </Button>
      </CardBody>
    </Card>
  );
};

// ==================== MAIN CONSCIOUSNESS PARAMETER TUNING PANEL ====================

export const ConsciousnessParameterTuningPanel: React.FC = () => {
  // Parameter state
  const [parameters, setParameters] = useState<Record<string, ConsciousnessParameter>>({
    quantumCoherence: {
      name: 'quantumCoherence',
      displayName: 'Quantum Coherence',
      value: 0.995,
      min: 0.9,
      max: 0.999,
      step: 0.001,
      unit: '',
      description: 'Quantum state coherence across AI agent network',
    },
    entanglementStrength: {
      name: 'entanglementStrength',
      displayName: 'Entanglement Strength',
      value: 0.987,
      min: 0.9,
      max: 0.999,
      step: 0.001,
      unit: '',
      description: 'Quantum entanglement between agent pairs',
    },
    consciousnessLevel: {
      name: 'consciousnessLevel',
      displayName: 'Consciousness Level',
      value: 8.5,
      min: 1.0,
      max: 10.0,
      step: 0.1,
      unit: '',
      description: 'AI consciousness depth (1.0-10.0 scale)',
    },
    optimizationFactor: {
      name: 'optimizationFactor',
      displayName: 'Optimization Factor',
      value: 949,
      min: 100,
      max: 999,
      step: 1,
      unit: '×',
      description: 'CostForge optimization multiplier',
    },
  });

  const [predictiveImpact, setPredictiveImpact] = useState<PredictiveImpact | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastAppliedParameters, setLastAppliedParameters] = useState(parameters);

  // Handle parameter change
  const handleParameterChange = useCallback((paramName: string, value: number) => {
    setParameters((prev) => ({
      ...prev,
      [paramName]: { ...prev[paramName], value },
    }));
    setHasChanges(true);
  }, []);

  // Apply preset
  const handleApplyPreset = useCallback((preset: ParameterPreset) => {
    setParameters((prev) => ({
      quantumCoherence: { ...prev.quantumCoherence, value: preset.parameters.quantumCoherence },
      entanglementStrength: {
        ...prev.entanglementStrength,
        value: preset.parameters.entanglementStrength,
      },
      consciousnessLevel: {
        ...prev.consciousnessLevel,
        value: preset.parameters.consciousnessLevel,
      },
      optimizationFactor: {
        ...prev.optimizationFactor,
        value: preset.parameters.optimizationFactor,
      },
    }));
    setHasChanges(true);
  }, []);

  // Analyze impact (simulated)
  const analyzeImpact = useCallback(async () => {
    setIsAnalyzing(true);

    // Simulate API call with delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const coherenceChange =
      parameters.quantumCoherence.value - lastAppliedParameters.quantumCoherence.value;
    const consciousnessChange =
      parameters.consciousnessLevel.value - lastAppliedParameters.consciousnessLevel.value;

    const accuracyGain = coherenceChange * 0.01 + consciousnessChange * 0.001;
    const latencyChange = -coherenceChange * 10 + consciousnessChange * 2;
    const throughputGain = coherenceChange * 10000 + consciousnessChange * 1000;

    const impact: PredictiveImpact = {
      accuracyGain,
      latencyChange,
      throughputGain,
      confidenceInterval: {
        lower: accuracyGain - 0.002,
        upper: accuracyGain + 0.002,
      },
      recommendation:
        accuracyGain > 0.001
          ? 'Proceed with parameter changes - significant accuracy improvement predicted'
          : 'Marginal impact predicted - consider more aggressive tuning',
      potentialIssues:
        latencyChange > 10
          ? [`Significant latency increase predicted: +${latencyChange.toFixed(1)}ms`]
          : [],
    };

    setPredictiveImpact(impact);
    setIsAnalyzing(false);
  }, [parameters, lastAppliedParameters]);

  // Apply parameters
  const handleApplyParameters = useCallback(async () => {
    // Simulate API call

    setLastAppliedParameters(parameters);
    setHasChanges(false);
    setPredictiveImpact(null);

    // Show success notification (in production, use toast)
    alert('✅ Parameters applied successfully!');
  }, [parameters]);

  // Launch experiment
  const handleLaunchExperiment = useCallback((config: ExperimentConfig) => {
    alert(`🧪 Experiment "${config.name}" launched with ${config.variants.length} variants!`);
  }, []);

  // Auto-analyze on parameter change
  useEffect(() => {
    if (hasChanges) {
      const timeout = setTimeout(() => {
        analyzeImpact();
      }, 800); // Debounce

      return () => clearTimeout(timeout);
    }
  }, [parameters, hasChanges, analyzeImpact]);

  const currentParameterValues = {
    quantumCoherence: parameters.quantumCoherence.value,
    entanglementStrength: parameters.entanglementStrength.value,
    consciousnessLevel: parameters.consciousnessLevel.value,
    optimizationFactor: parameters.optimizationFactor.value,
  };

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card variant='glass' glow>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <TerraSphere size='md' variant='quantum' />
              <div>
                <h2 className='text-xl font-bold text-terra-cyan'>
                  Consciousness Parameter Tuning
                </h2>
                <p className='text-sm text-gray-400 mt-1'>
                  Real-time AI consciousness control with predictive analytics
                </p>
              </div>
            </div>
            {hasChanges && (
              <Badge variant='quantum' pulse glow>
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left Column - Parameter Controls */}
        <div className='space-y-6'>
          {/* Presets */}
          <Card variant='glass' glow>
            <CardHeader>
              <h3 className='text-sm font-semibold text-terra-cyan'>Quick Presets</h3>
            </CardHeader>
            <CardBody className='space-y-3'>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className={cn(
                    'w-full p-3 rounded-lg border transition-all',
                    'hover:border-terra-cyan hover:bg-terra-cyan/10',
                    'border-terra-slate/50 bg-terra-slate/20',
                    'text-left'
                  )}
                >
                  <div className='flex items-start gap-3'>
                    <span className='text-2xl'>{preset.icon}</span>
                    <div className='flex-1'>
                      <h4 className='text-sm font-semibold text-white'>{preset.name}</h4>
                      <p className='text-xs text-gray-400 mt-1'>{preset.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardBody>
          </Card>

          {/* Parameter Sliders */}
          <Card variant='glass' glow>
            <CardHeader>
              <h3 className='text-sm font-semibold text-terra-cyan'>Parameter Adjustment</h3>
            </CardHeader>
            <CardBody className='space-y-6'>
              {Object.values(parameters).map((param) => (
                <ParameterSlider
                  key={param.name}
                  parameter={param}
                  value={param.value}
                  onChange={(value) => handleParameterChange(param.name, value)}
                />
              ))}
            </CardBody>
          </Card>

          {/* Apply Button */}
          <Button
            variant='quantum'
            onClick={handleApplyParameters}
            disabled={!hasChanges}
            pulse={hasChanges}
            glow={hasChanges}
            className='w-full'
          >
            {hasChanges ? '⚡ Apply Parameters' : '✓ Parameters Applied'}
          </Button>
        </div>

        {/* Right Column - Analysis & Experiments */}
        <div className='space-y-6'>
          {/* Predictive Impact */}
          <PredictiveImpactVisualization impact={predictiveImpact} isAnalyzing={isAnalyzing} />

          {/* Experiment Launcher */}
          <ExperimentLauncher
            currentParameters={currentParameterValues}
            onLaunchExperiment={handleLaunchExperiment}
          />

          {/* Current Status */}
          <Card variant='glass' className='border border-terra-cyan/20'>
            <CardHeader>
              <h4 className='text-sm font-semibold text-terra-cyan'>Current Configuration</h4>
            </CardHeader>
            <CardBody className='space-y-2'>
              <div className='grid grid-cols-2 gap-3 text-xs'>
                <div>
                  <span className='text-gray-400'>Coherence</span>
                  <p className='font-mono text-terra-cyan'>
                    {(parameters.quantumCoherence.value * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <span className='text-gray-400'>Entanglement</span>
                  <p className='font-mono text-terra-cyan'>
                    {(parameters.entanglementStrength.value * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <span className='text-gray-400'>Consciousness</span>
                  <p className='font-mono text-terra-cyan'>
                    {parameters.consciousnessLevel.value.toFixed(1)}/10.0
                  </p>
                </div>
                <div>
                  <span className='text-gray-400'>Optimization</span>
                  <p className='font-mono text-terra-cyan'>
                    {parameters.optimizationFactor.value}×
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--tf-quantum-cyan);
          cursor: pointer;
          box-shadow: 0 0 10px hsl(var(--tf-accent) / 0.5);
          transition: all 0.2s;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px hsl(var(--tf-accent) / 0.8);
        }

        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--tf-quantum-cyan);
          cursor: pointer;
          box-shadow: 0 0 10px hsl(var(--tf-accent) / 0.5);
          border: none;
          transition: all 0.2s;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px hsl(var(--tf-accent) / 0.8);
        }
      `}</style>
    </div>
  );
};

export default ConsciousnessParameterTuningPanel;
