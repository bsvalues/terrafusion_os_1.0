import { Badge, Button, Card, CardBody, CardHeader } from '@/components/terrafusion-design-system';
import React, { useState } from 'react';

interface AISuperiorityLauncherProps {
  onDemoLaunched: (demoId: string) => void;
}

interface DemoScenario {
  scenarioId: string;
  name: string;
  description: string;
  recordCount: number;
  estimatedDuration: string;
  complexityLevel: string;
  expectedSuperiority: number;
}

const AISuperiorityLauncher: React.FC<AISuperiorityLauncherProps> = ({ onDemoLaunched }) => {
  const [countyCode, setCountyCode] = useState('benton');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [launching, setLaunching] = useState(false);
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch('/api/aisuperiority/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
    }
  };

  const handleScenarioToggle = (scenarioId: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId) ? prev.filter((id) => id !== scenarioId) : [...prev, scenarioId]
    );
  };

  const handleLaunchDemo = async () => {
    if (selectedScenarios.length === 0) {
      setError('Please select at least one test scenario');
      return;
    }

    setLaunching(true);
    setError(null);

    try {
      const response = await fetch('/api/aisuperiority/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countyCode,
          demoType: 'comprehensive',
          selectedScenarios,
          quantumOptimizationEnabled: true,
          consciousnessLevel: 'Elite',
          maxAgents: 1008,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onDemoLaunched(result.demoId);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to launch demonstration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLaunching(false);
    }
  };

  const getComplexityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'orange';
      case 'very high':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card variant='glass' glow>
        <CardHeader>
          <div className='text-center'>
            <h1 className='text-3xl font-bold text-terra-cyan mb-2'>
              🚀 AI Superiority Demonstration
            </h1>
            <p className='text-terra-blue'>
              Launch championship-level comparison: TerraFusion's 1,008 AI agents vs Harris PACS
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className='space-y-6'>
            {/* County Selection */}
            <div>
              <label className='block text-sm font-medium text-terra-cyan mb-2'>
                Target County
              </label>
              <select
                value={countyCode}
                onChange={(e) => setCountyCode(e.target.value)}
                className='w-full p-3 terra-glass rounded-lg border border-terra-cyan/20 text-white'
              >
                <option value='benton'>Benton County</option>
                <option value='king'>King County</option>
                <option value='pierce'>Pierce County</option>
                <option value='spokane'>Spokane County</option>
                <option value='clark'>Clark County</option>
              </select>
            </div>

            {/* Scenario Selection */}
            <div>
              <label className='block text-sm font-medium text-terra-cyan mb-4'>
                Test Scenarios ({selectedScenarios.length} selected)
              </label>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.scenarioId}
                    className={`terra-glass p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedScenarios.includes(scenario.scenarioId)
                        ? 'border-terra-cyan shadow-glow'
                        : 'border-terra-slate/30 hover:border-terra-cyan/50'
                    }`}
                    onClick={() => handleScenarioToggle(scenario.scenarioId)}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-white'>{scenario.name}</h3>
                      <input
                        type='checkbox'
                        checked={selectedScenarios.includes(scenario.scenarioId)}
                        onChange={() => handleScenarioToggle(scenario.scenarioId)}
                        className='mt-1'
                      />
                    </div>
                    <p className='text-sm text-gray-300 mb-3'>{scenario.description}</p>
                    <div className='flex flex-wrap gap-2 text-xs'>
                      <Badge variant='primary'>
                        {scenario.recordCount.toLocaleString()} records
                      </Badge>
                      <Badge
                        variant='secondary'
                        className={`bg-${getComplexityColor(scenario.complexityLevel)}-600`}
                      >
                        {scenario.complexityLevel} complexity
                      </Badge>
                      <Badge variant='quantum'>
                        {(scenario.expectedSuperiority * 100).toFixed(0)}% advantage
                      </Badge>
                    </div>
                    <div className='text-xs text-gray-400 mt-2'>
                      Est. Duration: {scenario.estimatedDuration}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Configuration */}
            <div className='terra-glass p-4 rounded-lg'>
              <h3 className='font-semibold text-terra-cyan mb-3'>Championship Configuration</h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div className='flex justify-between'>
                  <span>AI Agents:</span>
                  <span className='text-terra-cyan font-mono'>1,008</span>
                </div>
                <div className='flex justify-between'>
                  <span>Quantum Enhanced:</span>
                  <Badge variant='quantum' className='text-xs'>
                    Enabled
                  </Badge>
                </div>
                <div className='flex justify-between'>
                  <span>Consciousness Level:</span>
                  <Badge variant='primary' className='text-xs'>
                    Elite
                  </Badge>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className='terra-glass border-red-500 p-4 rounded-lg'>
                <p className='text-red-400'>⚠️ {error}</p>
              </div>
            )}

            {/* Launch Button */}
            <div className='text-center'>
              <Button
                onClick={handleLaunchDemo}
                disabled={launching || selectedScenarios.length === 0}
                variant='quantum'
                pulse={!launching}
                className='px-8 py-4 text-lg font-semibold'
              >
                {launching ? (
                  <>
                    <div className='quantum-pulse mr-2'>🤖</div>
                    Deploying AI Superiority...
                  </>
                ) : (
                  <>🚀 Launch Championship Demonstration</>
                )}
              </Button>
              {selectedScenarios.length === 0 && (
                <p className='text-sm text-gray-400 mt-2'>
                  Select at least one test scenario to begin
                </p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Key Features */}
      <Card variant='glass'>
        <CardHeader>
          <h2 className='text-xl font-semibold text-terra-cyan'>🏆 Championship Features</h2>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='text-center p-4'>
              <div className='text-2xl mb-2'>🤖</div>
              <h3 className='font-semibold text-terra-cyan'>1,008 AI Agents</h3>
              <p className='text-xs text-gray-400'>Factor 949 optimized swarm intelligence</p>
            </div>
            <div className='text-center p-4'>
              <div className='text-2xl mb-2'>⚡</div>
              <h3 className='font-semibold text-terra-cyan'>Sub-50ms Response</h3>
              <p className='text-xs text-gray-400'>Championship-level performance</p>
            </div>
            <div className='text-center p-4'>
              <div className='text-2xl mb-2'>🎯</div>
              <h3 className='font-semibold text-terra-cyan'>99.9% Accuracy</h3>
              <p className='text-xs text-gray-400'>IAAO compliance guaranteed</p>
            </div>
            <div className='text-center p-4'>
              <div className='text-2xl mb-2'>🔮</div>
              <h3 className='font-semibold text-terra-cyan'>Quantum Enhanced</h3>
              <p className='text-xs text-gray-400'>Consciousness-optimized processing</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AISuperiorityLauncher;
