import {useState, useEffect} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {Cpu, Zap, RotateCcw, Play, Pause, Square, Activity} from '@mui/icons-material';

interface QuantumGate {id: string;
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'T' | 'S';
  position: { qubit: number; time: number};
  active: boolean;
}

interface Qubit {id: number;
  state: '|0⟩' | '|1⟩' | '|+⟩' | '|-⟩' | '|ψ⟩';
  amplitude: { real: number; imaginary: number};
  entangled: boolean;
}

export function QuantumCircuitVisualizer() {const [qubits, setQubits] = useState<Qubit[]>([]);
  const [gates, setGates] = useState<QuantumGate[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [circuitDepth, setCircuitDepth] = useState(8);
  const [fidelity, setFidelity] = useState(99.2);
  const [executionTime, setExecutionTime] = useState(0);

  useEffect(() =>{
    // Initialize 8 qubits
    const initialQubits: Qubit[] = Array.from({ length: 8}, (_, i) => ({id: i,
      state: '|0⟩',
      amplitude: { real: 1, imaginary: 0},
      entangled: false,
    }));
    setQubits(initialQubits);

    // Generate quantum circuit gates
    const circuitGates: QuantumGate[] = [];
    const gateTypes: QuantumGate['type'][] = ['H', 'X', 'Y', 'Z', 'CNOT', 'T', 'S'];
    
    for (let time = 0; time< circuitDepth; time++) {
      for (let qubit = 0; qubit < 8; qubit++) {
        if (Math.random() >0.6) {
          circuitGates.push({
            id: `gate-${time}-${qubit}`,
            type: gateTypes[Math.floor(Math.random() * gateTypes.length)],
            position: {qubit, time},
            active: false,
          });
        }
      }
    }
    setGates(circuitGates);
  }, [circuitDepth]);

  useEffect(() => {if (isRunning) {
      const interval = setInterval(() => {
        setExecutionTime(prev => prev + 0.1);
        
        // Animate gate execution
        setGates(prevGates => 
          prevGates.map((gate /* , index */) => ({
            ...gate,
            active: Math.floor(executionTime * 2) % prevGates.length === index}))
        );

        // Update qubit states randomly during execution
        if (Math.random() > 0.8) {setQubits(prevQubits => 
            prevQubits.map(qubit => {
              const states: Qubit['state'][] = ['|0⟩', '|1⟩', '|+⟩', '|-⟩', '|ψ⟩'];
              return {
                ...qubit,
                state: states[Math.floor(Math.random() * states.length)],
                entangled: Math.random() > 0.7,
                amplitude: {
                  real: Math.random() * 2 - 1,
                  imaginary: Math.random() * 2 - 1,}
              };
            })
          );
        }

        // Update fidelity
        setFidelity(99.2 + (Math.random() - 0.5) * 0.5);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isRunning, executionTime]);

  const getGateColor = (type: QuantumGate['type']) => {const colors = {
      'H': 'bg-terrafusion-cyan text-black',
      'X': 'bg-red-500 text-white',
      'Y': 'bg-yellow-500 text-black',
      'Z': 'bg-blue-500 text-white',
      'CNOT': 'bg-purple-500 text-white',
      'T': 'bg-green-500 text-white',
      'S': 'bg-orange-500 text-white',};
    return colors[type];
  };

  const getQubitStateColor = (state: Qubit['state']) => {const colors = {
      '|0⟩': 'text-slate-400',
      '|1⟩': 'text-terrafusion-cyan',
      '|+⟩': 'text-green-400',
      '|-⟩': 'text-red-400',
      '|ψ⟩': 'text-purple-400',};
    return colors[state];
  };

  const resetCircuit = () => {setIsRunning(false);
    setExecutionTime(0);
    setQubits(qubits.map(q => ({ ...q, state: '|0⟩', entangled: false, amplitude: { real: 1, imaginary: 0} })));
    setGates(gates.map(g => ({...g, active: false})));
  };

  return (<Card className="border border-terrafusion-cyan/20 bg-white backdrop-blur-sm shadow-sm"><CardHeader><CardTitle className="text-2xl font-orbitron text-terrafusion-cyan flex items-center gap-3"><><Cpu className="h-8 w-8" />Quantum Circuit Processor</CardTitle><div
</>
className="flex items-center gap-4 mt-4"><Button
            onClick={() =>setIsRunning(!isRunning)}
            className={`${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {isRunning ?<Pause className="h-4 w-4 mr-2" />:<Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Pause' : 'Execute'}
          </Button><Button onClick={resetCircuit} variant="outline" className="border-slate-600"><><RotateCcw className="h-4 w-4 mr-2" />Reset</Button><Badge
</>className="bg-terrafusion-cyan/20 text-terrafusion-cyan">
            Fidelity: {fidelity.toFixed(1)}%</Badge><Badge className="bg-slate-700 text-slate-300">Time: {executionTime.toFixed(1)}μs</Badge></div></CardHeader><CardContent className="space-y-6">{/* Circuit Depth Control */}<div className="flex items-center gap-4"><><span className="text-slate-300 font-medium">Circuit Depth:</span><div
</>
className="flex items-center gap-2"><><Button
              variant="outline"
              size="sm"
              onClick={() =>setCircuitDepth(Math.max(4, circuitDepth - 1))}
              disabled={isRunning}
            >
              -</Button><span
</>
className="text-terrafusion-cyan font-bold w-8 text-center">{circuitDepth}</span><Button
              variant="outline"
              size="sm"
              onClick={() =>setCircuitDepth(Math.min(12, circuitDepth + 1))}
              disabled={isRunning}
            >
              +</Button></div></div>{/* Qubit States */}<div className="space-y-2"><><h3 className="text-lg font-orbitron text-terrafusion-cyan">Qubit States</h3><div
</>className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {qubits.map((qubit) => (<div
                key={qubit.id}
                className={`bg-slate-800/50 rounded-lg p-3 border text-center transition-all duration-300 ${
                  qubit.entangled ? 'border-purple-500/50 bg-purple-900/20' : 'border-slate-600'}`}
              ><><div className="text-xs text-slate-400 mb-1">Q{qubit.id}</div><div
</>className={`font-bold ${getQubitStateColor(qubit.state)}`}>
                  {qubit.state}</div>{qubit.entangled && (<div className="text-xs text-purple-400 mt-1">⟷</div>)}</div>))}</div></div>{/* Quantum Circuit Grid */}<div className="space-y-2"><><h3 className="text-lg font-orbitron text-terrafusion-cyan">Quantum Circuit</h3><div
</>
className="bg-slate-800/30 rounded-lg p-4 overflow-x-auto"><div className="grid grid-cols-8 gap-1 min-w-max">{Array.from({length: 8}, (_, qubitIndex) => (<div key={`qubit-line-${qubitIndex}`} className="flex items-center gap-1"><><div className="text-xs text-slate-400 w-8">Q{qubitIndex}</div><div
</>className="flex-1 h-px bg-slate-600 relative">
                    {Array.from({length: circuitDepth}, (_, timeIndex) => {
                      const gate = gates.find(g => g.position.qubit === qubitIndex && g.position.time === timeIndex);
                      return gate ? (<div
                          key={`gate-${timeIndex}`}
                          className={`absolute w-8 h-8 -top-4 rounded text-xs font-bold flex items-center justify-center transition-all duration-200 ${
                            getGateColor(gate.type)} ${gate.active ? 'scale-110 shadow-lg' : 'scale-100'}`}
                          style={{ left: `${timeIndex * 40}px` }}
                        >{gate.type}</div>) : null;
                    })}</div></div>))}</div></div></div>{/* Quantum Metrics */}<div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-700 pt-4"><div className="text-center"><><div className="text-2xl font-bold text-terrafusion-cyan">{gates.length}</div><div
</>
className="text-sm text-slate-400">Total Gates</div></div><div className="text-center"><><div className="text-2xl font-bold text-purple-400">{qubits.filter(q => q.entangled).length}</div><div
</>
className="text-sm text-slate-400">Entangled</div></div><div className="text-center"><><div className="text-2xl font-bold text-green-400">{circuitDepth}</div><div
</>
className="text-sm text-slate-400">Depth</div></div><div className="text-center"><div className="text-2xl font-bold text-blue-400">{isRunning ?<Activity className="h-6 w-6 mx-auto animate-pulse" />:<Square className="h-6 w-6 mx-auto" />}
            </div><div className="text-sm text-slate-400">{isRunning ? 'Running' : 'Idle'}</div></div></div></CardContent></Card>
  );
}