import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useRealtimeQuantumMetrics } from '@/utils/websocket';

interface QubitState {
  id: number;
  state: 'superposition' | 'entangled' | 'collapsed';
  fidelity: number;
  phase: number;
}

export const QuantumVisualization: React.FC = () => {
  const { isConnected, metrics } = useRealtimeQuantumMetrics();
  const [qubits, setQubits] = useState<QubitState[]>([]);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    // Initialize qubits
    const initialQubits: QubitState[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      state: 'superposition',
      fidelity: 0.95 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
    }));
    setQubits(initialQubits);

    // Animation loop
    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 360);
      setQubits((prevQubits) =>
        prevQubits.map((qubit) => ({
          ...qubit,
          phase: (qubit.phase + 0.05) % (Math.PI * 2),
          fidelity: Math.max(0.9, Math.min(1, qubit.fidelity + (Math.random() - 0.5) * 0.01)),
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const getQubitColor = (state: QubitState['state']) => {
    switch (state) {
      case 'superposition':
        return 'text-blue-500';
      case 'entangled':
        return 'text-purple-500';
      case 'collapsed':
        return 'text-green-500';
    }
  };

  const getQubitSymbol = (state: QubitState['state']) => {
    switch (state) {
      case 'superposition':
        return '⟨ψ⟩';
      case 'entangled':
        return '⟨Φ⟩';
      case 'collapsed':
        return '|0⟩';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between"><>

        <h3 className="text-lg font-semibold">Quantum State Visualization</h3>
        <Badge
</> variant={isConnected ? 'default' : 'secondary'}>
          {isConnected ? 'Connected' : 'Offline'}
        </Badge>
      </div>

      {/* Qubit States */}
      <Card>
        <CardHeader><>

          <CardTitle>Qubit States</CardTitle>
          <CardDescription
</>>
            Real-time quantum bit visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {qubits.map((qubit) => (
              <div
                key={qubit.id}
                className="relative h-24 flex flex-col items-center justify-center border rounded-lg"
              ><>

                <div
                  className={`text-2xl font-mono ${getQubitColor(qubit.state)}`}
                  style={{
                    transform: `rotate(${qubit.phase * 57.3}deg)`,
                    transition: 'transform 0.1s linear',
                  }}
                >
                  {getQubitSymbol(qubit.state)}
                </div>
                <div
</> className="absolute bottom-1 text-xs text-muted-foreground">
                  Q{qubit.id}
                </div>
                <div className="absolute top-1 right-1">
                  <Badge variant="outline" className="text-xs">
                    {(qubit.fidelity * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quantum Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Entanglement</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={metrics.entanglement * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {(metrics.entanglement * 100).toFixed(1)}% entangled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Coherence</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={metrics.coherence * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.decoherenceTime}μs remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Gate Fidelity</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={metrics.gateFidelity * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {(metrics.gateFidelity * 100).toFixed(2)}% accuracy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Circuit Visualization */}
      <Card>
        <CardHeader><>

          <CardTitle>Quantum Circuit</CardTitle>
          <CardDescription
</>>
            Active quantum circuit for property assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-32 bg-muted/20 rounded-lg overflow-hidden">
            <svg className="absolute inset-0 w-full h-full">
              {/* Quantum circuit lines */}
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={32 + i * 24}
                  x2="100%"
                  y2={32 + i * 24}
                  stroke="currentColor"
                  strokeOpacity="0.2"
                />
              ))}
              
              {/* Quantum gates */}
              <g transform={`translate(${animationFrame % 400}, 0)`}>
                <rect x="50" y="20" width="24" height="24" fill="currentColor" opacity="0.5" rx="4" />
                <rect x="100" y="44" width="24" height="24" fill="currentColor" opacity="0.5" rx="4" />
                <rect x="150" y="68" width="24" height="24" fill="currentColor" opacity="0.5" rx="4" />
                <rect x="200" y="92" width="24" height="24" fill="currentColor" opacity="0.5" rx="4" />
              </g>
            </svg>
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              Circuit Depth: {metrics?.circuitDepth || 0}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};