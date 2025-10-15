import {useQuery} from "@tanstack/react-query";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {Zap, Cpu, Activity, TrendingUp, Clock, Database} from '@mui/icons-material';

interface QuantumMetrics {tesla_precision: number;
  jobs_elegance: number;
  brady_execution: number;
  quantum_advantage: number;
  system_efficiency: number;
  active_qubits: number;
  uptime_seconds: number;
  timestamp: string;}

interface SystemHealth {status: string;
  quantum_operational: boolean;
  performance_score: number;
  active_processes: number;
  quantum_coherence: number;}

interface QuantumStatus {status: string;
  quantum_metrics: QuantumMetrics;
  system_health: SystemHealth;
  tesla_precision: boolean;
  jobs_elegance: boolean;
  musk_scale: boolean;
  brady_excellence: boolean;
  quantum_advantage_achieved: boolean;}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

export function QuantumMetricsCard() {const { data: quantumStatus, isLoading} = useQuery<QuantumStatus>({queryKey: ["/api/quantum/status"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time metrics});

  if (isLoading) {return (
      <Card className="border-2 border-terrafusion-cyan/20"><CardHeader><div className="animate-pulse"><><div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div><div
</>
className="h-4 bg-gray-200 rounded w-1/2"></div></div></CardHeader><CardContent><div className="animate-pulse space-y-4"><><div className="h-4 bg-gray-300 rounded"></div><div
</>
className="h-4 bg-gray-300 rounded w-5/6"></div><div className="h-4 bg-gray-300 rounded w-3/4"></div></div></CardContent></Card>);}

  if (!quantumStatus) {return (<Card className="border-2 border-red-500/20"><CardHeader><CardTitle className="text-red-500 flex items-center gap-2"><><Activity className="h-5 w-5" />Quantum System Offline</CardTitle><CardDescription
</></>>Unable to connect to quantum processing engine</CardDescription></CardHeader></Card>);}

  const {quantum_metrics, system_health} = quantumStatus;

  return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Primary Quantum Metrics */}<Card className="border-2 border-terrafusion-cyan/20 bg-gradient-to-br from-slate-900 to-slate-800"><CardHeader className="pb-4"><CardTitle className="text-terrafusion-cyan flex items-center gap-2 font-orbitron"><><Zap className="h-5 w-5" />Quantum Excellence Metrics</CardTitle><CardDescription
</>className="text-slate-300">
            Tesla/Jobs/Brady/Musk Engineering Standards</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><div className="flex justify-between items-center"><><span className="text-sm font-medium text-slate-300">Tesla Precision</span><Badge
</>variant="secondary" className="bg-terrafusion-cyan/20 text-terrafusion-cyan">
                  {quantum_metrics.tesla_precision}%</Badge></div><><Progress 
                value={quantum_metrics.tesla_precision} 
                className="h-2 bg-slate-700" /></div><div
</>
className="space-y-2"><div className="flex justify-between items-center"><><span className="text-sm font-medium text-slate-300">Jobs Elegance</span><Badge
</>variant="secondary" className="bg-terrafusion-cyan/20 text-terrafusion-cyan">
                  {quantum_metrics.jobs_elegance}%</Badge></div><><Progress 
                value={quantum_metrics.jobs_elegance} 
                className="h-2 bg-slate-700" /></div><div
</>
className="space-y-2"><div className="flex justify-between items-center"><><span className="text-sm font-medium text-slate-300">Brady Execution</span><Badge
</>variant="secondary" className="bg-terrafusion-cyan/20 text-terrafusion-cyan">
                  {quantum_metrics.brady_execution}%</Badge></div><><Progress 
                value={quantum_metrics.brady_execution} 
                className="h-2 bg-slate-700" /></div><div
</>
className="space-y-2"><div className="flex justify-between items-center"><><span className="text-sm font-medium text-slate-300">System Efficiency</span><Badge
</>variant="secondary" className="bg-terrafusion-cyan/20 text-terrafusion-cyan">
                  {quantum_metrics.system_efficiency}%</Badge></div><Progress 
                value={quantum_metrics.system_efficiency} 
                className="h-2 bg-slate-700" /></div></div></CardContent></Card>{/* System Performance */}<Card className="border-2 border-terrafusion-cyan/20 bg-gradient-to-br from-slate-900 to-slate-800"><CardHeader className="pb-4"><CardTitle className="text-terrafusion-cyan flex items-center gap-2 font-orbitron"><><Cpu className="h-5 w-5" />Quantum System Performance</CardTitle><CardDescription
</>className="text-slate-300">
            Real-time processing capabilities</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-terrafusion-cyan" /><span className="text-sm font-medium text-slate-300">Status</span></div><Badge className="bg-green-500/20 text-green-400 border-green-500/30">{system_health.status}</Badge></div><div className="space-y-2"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-terrafusion-cyan" /><span className="text-sm font-medium text-slate-300">Performance Score</span></div><div className="text-2xl font-bold text-terrafusion-cyan font-orbitron">{system_health.performance_score}</div></div><div className="space-y-2"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-terrafusion-cyan" /><span className="text-sm font-medium text-slate-300">Active Qubits</span></div><div className="text-xl font-bold text-terrafusion-cyan font-mono">{quantum_metrics.active_qubits.toLocaleString()}</div></div><div className="space-y-2"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-terrafusion-cyan" /><span className="text-sm font-medium text-slate-300">Uptime</span></div><div className="text-sm font-mono text-terrafusion-cyan">{formatUptime(quantum_metrics.uptime_seconds)}</div></div></div><div className="pt-4 border-t border-slate-700"><div className="flex justify-between items-center mb-2"><><span className="text-sm font-medium text-slate-300">Quantum Advantage</span><Badge
</>variant="outline" className="border-terrafusion-cyan/50 text-terrafusion-cyan">
                {quantum_metrics.quantum_advantage}%</Badge></div><Progress 
              value={quantum_metrics.quantum_advantage} 
              className="h-2 bg-slate-700" /><p className="text-xs text-slate-400 mt-1">Quantum supremacy achieved • Processing at light speed</p></div></CardContent></Card>{/* Excellence Indicators */}<Card className="border-2 border-terrafusion-cyan/20 bg-gradient-to-br from-slate-900 to-slate-800 lg:col-span-2"><CardHeader><CardTitle className="text-terrafusion-cyan flex items-center gap-2 font-orbitron"><><Zap className="h-5 w-5" />Excellence Achievement Status</CardTitle><CardDescription
</>className="text-slate-300">
            Legendary engineering standards compliance</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-5 gap-4"><div className="text-center space-y-2"><><div className="text-2xl">{quantumStatus.tesla_precision ? "⚡" : "❌"}</div><div
</>
className="text-sm font-medium text-slate-300">Tesla Precision</div><Badge className={quantumStatus.tesla_precision ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{quantumStatus.tesla_precision ? "ACHIEVED" : "PENDING"}</Badge></div><div className="text-center space-y-2"><><div className="text-2xl">{quantumStatus.jobs_elegance ? "✨" : "❌"}</div><div
</>
className="text-sm font-medium text-slate-300">Jobs Elegance</div><Badge className={quantumStatus.jobs_elegance ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{quantumStatus.jobs_elegance ? "ACHIEVED" : "PENDING"}</Badge></div><div className="text-center space-y-2"><><div className="text-2xl">{quantumStatus.musk_scale ? "🚀" : "❌"}</div><div
</>
className="text-sm font-medium text-slate-300">Musk Scale</div><Badge className={quantumStatus.musk_scale ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{quantumStatus.musk_scale ? "ACHIEVED" : "PENDING"}</Badge></div><div className="text-center space-y-2"><><div className="text-2xl">{quantumStatus.brady_excellence ? "🏆" : "❌"}</div><div
</>
className="text-sm font-medium text-slate-300">Brady Excellence</div><Badge className={quantumStatus.brady_excellence ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{quantumStatus.brady_excellence ? "ACHIEVED" : "PENDING"}</Badge></div><div className="text-center space-y-2"><><div className="text-2xl">{quantumStatus.quantum_advantage_achieved ? "🔮" : "❌"}</div><div
</>
className="text-sm font-medium text-slate-300">Quantum Advantage</div><Badge className={quantumStatus.quantum_advantage_achieved ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{quantumStatus.quantum_advantage_achieved ? "ACHIEVED" : "PENDING"}</Badge></div></div></CardContent></Card></div>
  );
}