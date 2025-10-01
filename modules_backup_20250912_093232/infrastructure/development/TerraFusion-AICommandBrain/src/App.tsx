import React, {useState, useEffect} from 'react';
import {Brain,
  Cpu,
  Activity,
  Zap,
  Shield,
  Database,
  Network,
  Globe,
  TrendingUp,
  Warning,
  DollarSign,
  Users,
  FileSearch,
  GitBranch,
  Layers,
  Command,
  Target,
  BarChart3,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  MessageSquare,
  Server,
  Cloud,
  HardDrive,
  Wifi,
  Radio,
  Satellite,
  Monitor,
  Smartphone,
  Code,
  Terminal,
  Package,
  Box,
  Briefcase,
  Calculator,
  Calendar,
  Clock,
  Bell,
  Mail,
  Phone,
  Video,
  Mic,
  Camera,
  Headphones,
  Speaker,
  Volume2,
  Power,
  BatteryCharging,
  Gauge,
  Hash,
  Binary,
  FileCode,
  FolderOpen,
  Archive,
  ShoppingCart,
  CreditCard,
  Receipt,
  Building,
  Home,
  MapPin,
  Map,
  Navigation,
  Compass,
  Plane,
  Car,
  Bus,
  Train,
  Ship,
  Anchor,
  Rocket,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  PlusCircle,
  MinusCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Refresh,
  RotateCw,
  Download,
  Upload,
  Share2,
  Settings,
  Tool,
  Wrench,
  Hammer,
  PenTool,
  Edit3,
  Trash2,
  Save,
  Copy,
  Clipboard,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  Columns,
  Sidebar,
  Layout,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  Move,
  Crosshair,
  Target as TargetIcon} from '@mui/icons-material';
import './index.css';

interface AIModel {id: string;
  name: string;
  type: string;
  status: 'active' | 'training' | 'updating' | 'standby';
  accuracy: number;
  latency: number;
  requests: number;
  lastTrained: Date;
  dataProcessed: string;
  capabilities: string[];}

interface NeuralNetwork {id: string;
  name: string;
  layers: number;
  neurons: number;
  connections: number;
  activationFunction: string;
  learningRate: number;
  status: 'online' | 'training' | 'offline';
  performance: number;}

interface AutomationRule {id: string;
  name: string;
  trigger: string;
  action: string;
  conditions: string[];
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  lastRun: Date;
  status: 'active' | 'paused' | 'error';}

interface PredictiveInsight {id: string;
  category: 'revenue' | 'risk' | 'opportunity' | 'anomaly' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
  affectedSystems: string[];
  suggestedActions: string[];
  potentialValue?: number;}

function App() {const [activeView, setActiveView] = useState<'overview' | 'models' | 'neural' | 'automation' | 'predictions' | 'monitoring'>('overview');
  
  const [systemMetrics, setSystemMetrics] = useState({
    totalModels: 147,
    activeNeuralNets: 47,
    automationRules: 892,
    predictionsToday: 23847,
    dataProcessed: '2.7 PB',
    avgAccuracy: 97.3,
    avgLatency: 0.003,
    costSaved: 47293000,
    incidentsDetected: 12,
    threatsBlocked: 342,
    complianceScore: 99.7,
    uptime: 99.999});

  const [aiModels] = useState<AIModel[]>([
    {id: 'nlp-master',
      name: 'Natural Language Master',
      type: 'Transformer GPT-4',
      status: 'active',
      accuracy: 98.7,
      latency: 0.002,
      requests: 8472934,
      lastTrained: new Date('2024-01-15'),
      dataProcessed: '47.3 TB',
      capabilities: ['Translation', 'Classification', 'Sentiment', 'Entity Recognition', 'Intent Detection']},
    {id: 'vision-pro',
      name: 'Document Vision Pro',
      type: 'CNN ResNet-152',
      status: 'active',
      accuracy: 99.3,
      latency: 0.004,
      requests: 2384729,
      lastTrained: new Date('2024-01-14'),
      dataProcessed: '23.7 TB',
      capabilities: ['OCR', 'Object Detection', 'Document Classification', 'Signature Verification', 'Form Extraction']},
    {id: 'predict-engine',
      name: 'Predictive Analytics Engine',
      type: 'LSTM + Attention',
      status: 'training',
      accuracy: 94.2,
      latency: 0.008,
      requests: 923847,
      lastTrained: new Date('2024-01-13'),
      dataProcessed: '89.2 TB',
      capabilities: ['Time Series', 'Trend Analysis', 'Anomaly Detection', 'Forecasting', 'Pattern Recognition']},
    {id: 'fraud-hunter',
      name: 'Fraud Detection System',
      type: 'Autoencoder + XGBoost',
      status: 'active',
      accuracy: 96.8,
      latency: 0.003,
      requests: 1823947,
      lastTrained: new Date('2024-01-12'),
      dataProcessed: '12.4 TB',
      capabilities: ['Anomaly Detection', 'Risk Scoring', 'Pattern Matching', 'Behavioral Analysis', 'Network Analysis']},
    {id: 'compliance-guard',
      name: 'Compliance Guardian',
      type: 'Rule-Based + ML Hybrid',
      status: 'active',
      accuracy: 99.7,
      latency: 0.001,
      requests: 4729384,
      lastTrained: new Date('2024-01-11'),
      dataProcessed: '34.8 TB',
      capabilities: ['Policy Checking', 'Regulation Mapping', 'Audit Trail', 'Risk Assessment', 'Violation Detection']},
    {id: 'revenue-optimizer',
      name: 'Revenue Optimization AI',
      type: 'Reinforcement Learning',
      status: 'active',
      accuracy: 95.4,
      latency: 0.005,
      requests: 723894,
      lastTrained: new Date('2024-01-10'),
      dataProcessed: '18.9 TB',
      capabilities: ['Fee Optimization', 'Collection Prediction', 'Revenue Forecasting', 'Pricing Strategy', 'Tax Analysis']}
  ]);

  const [neuralNetworks] = useState<NeuralNetwork[]>([
    {id: 'main-brain',
      name: 'Central Processing Network',
      layers: 128,
      neurons: 1048576,
      connections: 134217728,
      activationFunction: 'ReLU + Softmax',
      learningRate: 0.001,
      status: 'online',
      performance: 98.7},
    {id: 'language-net',
      name: 'Language Understanding Network',
      layers: 96,
      neurons: 524288,
      connections: 67108864,
      activationFunction: 'GELU',
      learningRate: 0.0005,
      status: 'online',
      performance: 97.3},
    {id: 'vision-net',
      name: 'Computer Vision Network',
      layers: 152,
      neurons: 2097152,
      connections: 268435456,
      activationFunction: 'Swish',
      learningRate: 0.0003,
      status: 'training',
      performance: 96.8},
    {id: 'prediction-net',
      name: 'Predictive Analytics Network',
      layers: 64,
      neurons: 262144,
      connections: 33554432,
      activationFunction: 'Tanh + Sigmoid',
      learningRate: 0.002,
      status: 'online',
      performance: 94.2}
  ]);

  const [automationRules] = useState<AutomationRule[]>([
    {id: 'auto-classify',
      name: 'Intelligent Document Classification',
      trigger: 'Document Upload',
      action: 'Classify, Extract, Route',
      conditions: ['File type is PDF/DOC/Image', 'Size < 50MB', 'Not encrypted'],
      executionCount: 847293,
      successRate: 99.2,
      avgExecutionTime: 0.234,
      lastRun: new Date(),
      status: 'active'},
    {id: 'fee-reminder',
      name: 'Smart Fee Collection',
      trigger: 'Payment Due -3 days',
      action: 'Send multi-channel reminder',
      conditions: ['Outstanding balance > $0', 'No payment plan', 'Valid contact info'],
      executionCount: 23847,
      successRate: 87.3,
      avgExecutionTime: 0.089,
      lastRun: new Date(),
      status: 'active'},
    {id: 'compliance-check',
      name: 'Automated Compliance Validation',
      trigger: 'Request Submission',
      action: 'Validate against 1,247 rules',
      conditions: ['Complete form', 'Required documents attached', 'Within jurisdiction'],
      executionCount: 192837,
      successRate: 96.8,
      avgExecutionTime: 0.473,
      lastRun: new Date(),
      status: 'active'},
    {id: 'anomaly-response',
      name: 'Anomaly Auto-Response',
      trigger: 'Unusual Pattern Detected',
      action: 'Alert, Log, Investigate',
      conditions: ['Confidence > 85%', 'Risk level > medium', 'Not whitelisted'],
      executionCount: 8923,
      successRate: 94.7,
      avgExecutionTime: 1.234,
      lastRun: new Date(),
      status: 'active'}
  ]);

  const [predictions] = useState<PredictiveInsight[]>([
    {id: 'pred-1',
      category: 'revenue',
      title: 'Property Tax Collection Surge Expected',
      description: 'AI predicts 34% increase in property tax collections next quarter due to improved economy and new development completions',
      confidence: 92,
      impact: 'high',
      timeframe: 'Q2 2024',
      affectedSystems: ['Tax System', 'Treasury', 'Budget Planning'],
      suggestedActions: ['Scale collection infrastructure', 'Add temporary staff', 'Update payment processing capacity'],
      potentialValue: 4729000},
    {id: 'pred-2',
      category: 'risk',
      title: 'Permit System Overload Risk',
      description: 'Spring construction season will create 3x normal permit volume, current system may experience delays',
      confidence: 87,
      impact: 'critical',
      timeframe: 'March-May 2024',
      affectedSystems: ['Permit System', 'Building Department', 'Inspection Services'],
      suggestedActions: ['Pre-scale infrastructure', 'Enable auto-approval for simple permits', 'Deploy additional AI agents'],
      potentialValue: -234000},
    {id: 'pred-3',
      category: 'opportunity',
      title: 'Federal Grant Opportunity Detected',
      description: 'New infrastructure bill provisions match 89% with county planned projects - $12M potential funding',
      confidence: 78,
      impact: 'high',
      timeframe: 'Application by Feb 2024',
      affectedSystems: ['Grant Management', 'Finance', 'Public Works'],
      suggestedActions: ['Prepare application immediately', 'Align project timelines', 'Gather required documentation'],
      potentialValue: 12000000},
    {id: 'pred-4',
      category: 'anomaly',
      title: 'Unusual Business License Pattern',
      description: 'Spike in similar business license applications from related entities - possible fraud or tax avoidance scheme',
      confidence: 73,
      impact: 'medium',
      timeframe: 'Immediate',
      affectedSystems: ['Business Licensing', 'Revenue', 'Legal'],
      suggestedActions: ['Manual review required', 'Cross-reference with tax records', 'Legal consultation recommended'],
      potentialValue: -89000},
    {id: 'pred-5',
      category: 'trend',
      title: 'Citizen Service Shift to Digital',
      description: '78% of citizens now prefer digital channels, physical office visits declining 12% monthly',
      confidence: 95,
      impact: 'medium',
      timeframe: 'Ongoing',
      affectedSystems: ['All Public Services', 'IT Infrastructure', 'Staff Allocation'],
      suggestedActions: ['Reduce office hours', 'Reallocate staff to digital support', 'Enhance online services'],
      potentialValue: 892000}
  ]);

  // Simulate real-time updates
  useEffect(() =>{
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        predictionsToday: prev.predictionsToday + Math.floor(Math.random() * 10),
        dataProcessed: `${(parseFloat(prev.dataProcessed) + Math.random() * 0.01).toFixed(2)} PB`,
        incidentsDetected: prev.incidentsDetected + (Math.random() > 0.95 ? 1 : 0),
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 text-white">{/* Header */}<header className="bg-slate-900/50 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50"><div className="container mx-auto px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/25"><><Brain className="text-white" size={32} /></div><div
</></>><><h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Terrafusion AI Command Brain</h1><p
</>
className="text-sm text-slate-400">Neural Intelligence Platform v4.1.0 • Government Edition</p></div></div><div className="flex items-center gap-6"><div className="flex items-center gap-2"><><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span
</>
className="text-sm text-green-400">All Systems Operational</span></div><div className="text-sm text-slate-400">Uptime:<span className="font-mono text-green-400">{systemMetrics.uptime}%</span></div><button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Settings size={20} /></button></div></div></div></header>{/* Navigation Tabs */}<div className="bg-slate-800/30 backdrop-blur border-b border-slate-700/50"><div className="container mx-auto px-6"><div className="flex gap-6">{[
              {id: 'overview', label: 'Overview', icon: Activity},
              {id: 'models', label: 'AI Models', icon: Cpu},
              {id: 'neural', label: 'Neural Networks', icon: Network},
              {id: 'automation', label: 'Automation', icon: Zap},
              {id: 'predictions', label: 'Predictions', icon: TrendingUp},
              {id: 'monitoring', label: 'Monitoring', icon: Shield}
            ].map(tab => (<button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                  activeView === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-white'}`}
              ><tab.icon size={18} /><span>{tab.label}</span></button>))}</div></div></div>{/* Main Content */}<main className="container mx-auto px-6 py-8">{/* Overview */}
        {activeView === 'overview' && (<div className="space-y-8">{/* Key Metrics */}<div className="grid grid-cols-4 gap-6"><div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-2xl border border-purple-500/20 p-6"><div className="flex items-center justify-between mb-4"><Brain className="text-purple-400" size={24} /><span className="text-xs text-purple-400">NEURAL</span></div><><div className="text-3xl font-bold">{systemMetrics.totalModels}</div><div
</>
className="text-sm text-slate-400">AI Models Active</div><div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '87%'}}></div></div></div><div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl border border-blue-500/20 p-6"><div className="flex items-center justify-between mb-4"><Activity className="text-blue-400" size={24} /><span className="text-xs text-blue-400">LIVE</span></div><><div className="text-3xl font-bold">{(systemMetrics.predictionsToday / 1000).toFixed(1)}K</div><div
</>
className="text-sm text-slate-400">Predictions Today</div><div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" style={{ width: '73%'}}></div></div></div><div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-2xl border border-green-500/20 p-6"><div className="flex items-center justify-between mb-4"><Database className="text-green-400" size={24} /><span className="text-xs text-green-400">SCALE</span></div><><div className="text-3xl font-bold">{systemMetrics.dataProcessed}</div><div
</>
className="text-sm text-slate-400">Data Processed</div><div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: '92%'}}></div></div></div><div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-2xl border border-orange-500/20 p-6"><div className="flex items-center justify-between mb-4"><DollarSign className="text-orange-400" size={24} /><span className="text-xs text-orange-400">VALUE</span></div><><div className="text-3xl font-bold">${(systemMetrics.costSaved / 1000000).toFixed(1)}M</div><div
</>
className="text-sm text-slate-400">Cost Saved</div><div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: '95%'}}></div></div></div></div>{/* System Status Grid */}<div className="grid grid-cols-3 gap-6"><div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6"><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><><Shield className="text-cyan-400" />Security Status</h3><div
</>
className="space-y-3"><div className="flex justify-between"><><span className="text-slate-400">Threats Blocked</span><span
</>
className="text-red-400 font-mono">{systemMetrics.threatsBlocked}</span></div><div className="flex justify-between"><><span className="text-slate-400">Incidents Detected</span><span
</>
className="text-yellow-400 font-mono">{systemMetrics.incidentsDetected}</span></div><div className="flex justify-between"><><span className="text-slate-400">Compliance Score</span><span
</>
className="text-green-400 font-mono">{systemMetrics.complianceScore}%</span></div></div></div><div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6"><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><><Gauge className="text-purple-400" />Performance Metrics</h3><div
</>
className="space-y-3"><div className="flex justify-between"><><span className="text-slate-400">Avg Accuracy</span><span
</>
className="text-green-400 font-mono">{systemMetrics.avgAccuracy}%</span></div><div className="flex justify-between"><><span className="text-slate-400">Avg Latency</span><span
</>
className="text-blue-400 font-mono">{systemMetrics.avgLatency}s</span></div><div className="flex justify-between"><><span className="text-slate-400">Neural Networks</span><span
</>
className="text-purple-400 font-mono">{systemMetrics.activeNeuralNets}</span></div></div></div><div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6"><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><><Zap className="text-yellow-400" />Automation Impact</h3><div
</>
className="space-y-3"><div className="flex justify-between"><><span className="text-slate-400">Active Rules</span><span
</>
className="text-yellow-400 font-mono">{systemMetrics.automationRules}</span></div><div className="flex justify-between"><><span className="text-slate-400">Tasks Automated</span><span
</>
className="text-green-400 font-mono">847K</span></div><div className="flex justify-between"><><span className="text-slate-400">Time Saved</span><span
</>
className="text-blue-400 font-mono">2,847 hrs</span></div></div></div></div></div>)}

        {/* AI Models View */}
        {activeView === 'models' && (<div className="space-y-6"><><h2 className="text-2xl font-bold mb-4">Active AI Models</h2><div
</>className="grid grid-cols-2 gap-6">
              {aiModels.map(model => (<div key={model.id} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6"><div className="flex items-start justify-between mb-4"><div><><h3 className="text-xl font-bold mb-1">{model.name}</h3><p
</>
className="text-sm text-slate-400">{model.type}</p></div><div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      model.status === 'active' ? 'bg-green-900/30 text-green-400' :
                      model.status === 'training' ? 'bg-yellow-900/30 text-yellow-400' :
                      model.status === 'updating' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-gray-900/30 text-gray-400'}`}>{model.status.toUpperCase()}</div></div><div className="grid grid-cols-3 gap-4 mb-4"><div><><div className="text-2xl font-bold text-green-400">{model.accuracy}%</div><div
</>
className="text-xs text-slate-400">Accuracy</div></div><div><><div className="text-2xl font-bold text-blue-400">{model.latency}s</div><div
</>
className="text-xs text-slate-400">Latency</div></div><div><><div className="text-2xl font-bold text-purple-400">{(model.requests / 1000000).toFixed(1)}M</div><div
</>
className="text-xs text-slate-400">Requests</div></div></div><div className="mb-4"><><div className="text-sm text-slate-400 mb-2">Capabilities</div><div
</>className="flex flex-wrap gap-2">
                      {model.capabilities.map(cap => (<span key={cap} className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs">{cap}</span>))}</div></div><div className="flex justify-between text-sm"><><span className="text-slate-400">Data Processed: {model.dataProcessed}</span><span
</>
className="text-slate-400">Last Trained: {model.lastTrained.toLocaleDateString()}</span></div></div>))}</div></div>)}

        {/* Neural Networks View */}
        {activeView === 'neural' && (<div className="space-y-6"><><h2 className="text-2xl font-bold mb-4">Neural Network Architecture</h2><div
</>className="grid grid-cols-2 gap-6">
              {neuralNetworks.map(network => (<div key={network.id} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6"><div className="flex items-start justify-between mb-4"><><h3 className="text-xl font-bold">{network.name}</h3><div
</>
className={`flex items-center gap-2 ${
                      network.status === 'online' ? 'text-green-400' :
                      network.status === 'training' ? 'text-yellow-400' :
                      'text-red-400'}`}><><div className={`w-2 h-2 rounded-full ${
                        network.status === 'online' ? 'bg-green-500' :
                        network.status === 'training' ? 'bg-yellow-500 animate-pulse' :
                        'bg-red-500'}`}></div><span
</>
className="text-sm">{network.status}</span></div></div><div className="grid grid-cols-2 gap-4 mb-4"><div><><div className="text-sm text-slate-400">Architecture</div><div
</>
className="text-lg font-mono">{network.layers} layers</div></div><div><><div className="text-sm text-slate-400">Neurons</div><div
</>
className="text-lg font-mono">{(network.neurons / 1000000).toFixed(1)}M</div></div><div><><div className="text-sm text-slate-400">Connections</div><div
</>
className="text-lg font-mono">{(network.connections / 1000000).toFixed(0)}M</div></div><div><><div className="text-sm text-slate-400">Performance</div><div
</>
className="text-lg font-mono text-green-400">{network.performance}%</div></div></div><div className="space-y-2"><div className="flex justify-between text-sm"><><span className="text-slate-400">Activation</span><span
</>
className="font-mono">{network.activationFunction}</span></div><div className="flex justify-between text-sm"><><span className="text-slate-400">Learning Rate</span><span
</>
className="font-mono">{network.learningRate}</span></div></div><div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden"><div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${network.performance}%` }}
                    ></div></div></div>))}</div></div>)}

        {/* Automation View */}
        {activeView === 'automation' && (<div className="space-y-6"><><h2 className="text-2xl font-bold mb-4">Automation Rules</h2><div
</>
className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden"><table className="w-full"><thead className="bg-slate-900/50 border-b border-slate-700"><tr><><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rule</th><th
</>
className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Trigger</th><><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Executions</th><th
</>
className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Success Rate</th><><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Avg Time</th><th
</>
className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th></tr></thead><tbody className="divide-y divide-slate-700">{automationRules.map(rule => (<tr key={rule.id} className="hover:bg-slate-800/50 transition-colors"><td className="px-6 py-4"><div><><div className="font-medium">{rule.name}</div><div
</>
className="text-sm text-slate-400">{rule.action}</div></div></td><><td className="px-6 py-4 text-sm">{rule.trigger}</td><td
</>
className="px-6 py-4"><span className="font-mono text-sm">{rule.executionCount.toLocaleString()}</span></td><td className="px-6 py-4"><span className={`font-mono text-sm ${
                          rule.successRate >95 ? 'text-green-400' :
                          rule.successRate > 85 ? 'text-yellow-400' :
                          'text-red-400'}`}>
                          {rule.successRate}%</span></td><td className="px-6 py-4"><span className="font-mono text-sm">{rule.avgExecutionTime}s</span></td><td className="px-6 py-4"><button className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          rule.status === 'active' 
                            ? 'bg-green-900/30 text-green-400' 
                            : rule.status === 'paused'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-red-900/30 text-red-400'}`}>{rule.status === 'active' ?<Unlock size={12} />:<Lock size={12} />}
                          {rule.status}
                        </button></td></tr>))}</tbody></table></div></div>)}

        {/* Predictions View */}
        {activeView === 'predictions' && (<div className="space-y-6"><><h2 className="text-2xl font-bold mb-4">Predictive Insights</h2><div
</>className="space-y-4">
              {predictions.map(prediction => (<div key={prediction.id} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6"><div className="flex items-start justify-between mb-4"><div className="flex items-start gap-4"><div className={`p-2 rounded-lg ${
                        prediction.category === 'revenue' ? 'bg-green-900/30 text-green-400' :
                        prediction.category === 'risk' ? 'bg-red-900/30 text-red-400' :
                        prediction.category === 'opportunity' ? 'bg-blue-900/30 text-blue-400' :
                        prediction.category === 'anomaly' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-purple-900/30 text-purple-400'}`}>{prediction.category === 'revenue' &&<DollarSign size={20} />}
                        {prediction.category === 'risk' && <Warning size={20} />}
                        {prediction.category === 'opportunity' && <TrendingUp size={20} />}
                        {prediction.category === 'anomaly' && <AlertCircle size={20} />}
                        {prediction.category === 'trend' && <BarChart3 size={20} />}
                      </div><div className="flex-1"><><h3 className="text-lg font-bold mb-1">{prediction.title}</h3><p
</>
className="text-sm text-slate-400 mb-3">{prediction.description}</p><div className="flex items-center gap-4 mb-3"><div className="flex items-center gap-2"><><span className="text-xs text-slate-400">Confidence:</span><div
</>
className="flex items-center gap-1"><div className="h-1.5 w-20 bg-slate-700 rounded-full overflow-hidden"><><div 
                                  className={`h-full ${
                                    prediction.confidence > 85 ? 'bg-green-500' :
                                    prediction.confidence > 70 ? 'bg-yellow-500' :
                                    'bg-red-500'}`}
                                  style={{ width: `${prediction.confidence}%` }}
                                /></div><span
</>
className="text-xs font-mono">{prediction.confidence}%</span></div></div><><span className={`px-2 py-1 rounded text-xs font-medium ${
                            prediction.impact === 'critical' ? 'bg-red-900/30 text-red-400' :
                            prediction.impact === 'high' ? 'bg-orange-900/30 text-orange-400' :
                            prediction.impact === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-green-900/30 text-green-400'}`}>{prediction.impact.toUpperCase()} IMPACT</span><span
</>
className="text-xs text-slate-400">{prediction.timeframe}</span></div>{prediction.potentialValue && (<div className="text-sm mb-3"><><span className="text-slate-400">Potential Value: </span><span
</>className={`font-bold ${
                              prediction.potentialValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${Math.abs(prediction.potentialValue).toLocaleString()}</span></div>)}<div className="bg-blue-900/20 rounded-lg border border-blue-700/30 p-3"><div className="text-sm font-medium mb-2 flex items-center gap-2"><><Sparkles className="text-blue-400" size={16} />Suggested Actions</div><ul
</>className="text-sm text-slate-300 space-y-1">
                            {prediction.suggestedActions.map((action, i) => (<li key={i} className="flex items-start gap-2"><ChevronRight className="text-blue-400 mt-0.5" size={14} /><span>{action}</span></li>))}</ul></div></div></div><button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">Take Action</button></div></div>))}</div></div>)}</main></div>
  );
}

export default App;