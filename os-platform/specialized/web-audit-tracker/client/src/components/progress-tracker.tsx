import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {CheckCircle, 
  Clock, 
  Warning, 
  Target, 
  TrendingUp, 
  Rocket,
  Star,
  Calendar,
  Users,
  Zap,
  Crown} from '@mui/icons-material';

interface Phase {id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  progress: number;
  estimatedWeeks: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  milestones: Milestone[];
  blockers: string[];
  nextActions: string[];}

interface Milestone {id: string;
  title: string;
  completed: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  category: string;}

const ROADMAP_DATA: Phase[] = [
  {id: 'foundation',
    name: 'Foundation',
    description: 'Core infrastructure and basic functionality',
    status: 'completed',
    progress: 100,
    estimatedWeeks: '3-4 weeks',
    priority: 'high',
    milestones: [
      { id: 'auth', title: 'Authentication System', completed: true, priority: 'critical', estimatedHours: 24, category: 'Infrastructure'},
      {id: 'db', title: 'Database Architecture', completed: true, priority: 'critical', estimatedHours: 32, category: 'Infrastructure'},
      {id: 'ui', title: 'UI Framework Setup', completed: true, priority: 'high', estimatedHours: 16, category: 'Frontend'},
      {id: 'websocket', title: 'Real-time Communication', completed: true, priority: 'medium', estimatedHours: 20, category: 'Backend'},
      {id: 'dashboard', title: 'Basic Dashboard', completed: true, priority: 'high', estimatedHours: 28, category: 'Frontend'}
    ],
    blockers: [],
    nextActions: []
  },
  {id: 'core-development',
    name: 'Core Development',
    description: 'Essential features and AI integration',
    status: 'completed',
    progress: 100,
    estimatedWeeks: '4-5 weeks',
    priority: 'high',
    milestones: [
      { id: 'ai-fix', title: 'Resolve AI Integration Issues', completed: true, priority: 'critical', estimatedHours: 16, category: 'AI/ML'},
      {id: 'workflow', title: 'Enhanced Audit Workflow', completed: true, priority: 'high', estimatedHours: 32, category: 'Business Logic'},
      {id: 'data-quality', title: 'Data Quality & Seeding', completed: true, priority: 'high', estimatedHours: 24, category: 'Data'},
      {id: 'analytics', title: 'Advanced Analytics Dashboard', completed: true, priority: 'medium', estimatedHours: 40, category: 'Analytics'},
      {id: 'user-mgmt', title: 'User Management Enhancement', completed: true, priority: 'medium', estimatedHours: 20, category: 'Backend'},
      {id: 'performance', title: 'Performance Optimization', completed: true, priority: 'high', estimatedHours: 28, category: 'Infrastructure'}
    ],
    blockers: [],
    nextActions: [
      'Proceed to MVP Launch phase',
      'Begin production readiness testing',
      'Prepare deployment infrastructure'
    ]
  },
  {id: 'mvp-launch',
    name: 'MVP Launch',
    description: 'Production readiness and beta testing',
    status: 'in-progress',
    progress: 75,
    estimatedWeeks: '2-3 weeks',
    priority: 'high',
    milestones: [
      { id: 'deployment', title: 'Production Deployment Infrastructure', completed: false, priority: 'critical', estimatedHours: 24, category: 'DevOps'},
      {id: 'security', title: 'Security Hardening', completed: false, priority: 'critical', estimatedHours: 32, category: 'Security'},
      {id: 'monitoring', title: 'Monitoring & Logging', completed: false, priority: 'high', estimatedHours: 20, category: 'Infrastructure'},
      {id: 'testing', title: 'Beta Testing Program', completed: false, priority: 'high', estimatedHours: 40, category: 'QA'}
    ],
    blockers: [
      'Core development phase must be completed first'
    ],
    nextActions: [
      'Complete core development milestones',
      'Prepare production infrastructure plan'
    ]
  },
  {id: 'production-launch',
    name: 'Production Launch',
    description: 'Full deployment and advanced features',
    status: 'pending',
    progress: 0,
    estimatedWeeks: '3-4 weeks',
    priority: 'medium',
    milestones: [
      { id: 'multi-tenant', title: 'Multi-tenant Architecture', completed: false, priority: 'critical', estimatedHours: 48, category: 'Architecture'},
      {id: 'ai-advanced', title: 'Advanced AI Features', completed: false, priority: 'high', estimatedHours: 60, category: 'AI/ML'},
      {id: 'integrations', title: 'Integration Ecosystem', completed: false, priority: 'medium', estimatedHours: 40, category: 'Integrations'},
      {id: 'training', title: 'Training & Documentation', completed: false, priority: 'high', estimatedHours: 32, category: 'Documentation'}
    ],
    blockers: [
      'MVP launch must be successful first'
    ],
    nextActions: [
      'Design multi-tenant architecture',
      'Plan advanced AI feature roadmap'
    ]
  },
  {id: 'promised-land',
    name: 'The Promised Land',
    description: 'Revolutionary features and market expansion',
    status: 'in-progress',
    progress: 25,
    estimatedWeeks: '6+ months',
    priority: 'low',
    milestones: [
      { id: 'ai-valuation', title: 'AI-Driven Property Valuation', completed: true, priority: 'high', estimatedHours: 120, category: 'AI/ML'},
      {id: 'blockchain', title: 'Blockchain Integration', completed: false, priority: 'medium', estimatedHours: 80, category: 'Blockchain'},
      {id: 'mobile', title: 'Mobile First Experience', completed: false, priority: 'high', estimatedHours: 100, category: 'Mobile'},
      {id: 'marketplace', title: 'AI Marketplace', completed: false, priority: 'medium', estimatedHours: 160, category: 'Platform'}
    ],
    blockers: [
      'All previous phases must be completed and stable'
    ],
    nextActions: [
      'Research cutting-edge technologies',
      'Develop partnership strategy'
    ]
  }
];

const statusIcons = {completed: CheckCircle,
  'in-progress': Clock,
  pending: Target,
  blocked: Warning};

const statusColors = {completed: 'text-green-600 bg-green-50 border-green-200',
  'in-progress': 'text-blue-600 bg-blue-50 border-blue-200',
  pending: 'text-gray-600 bg-gray-50 border-gray-200',
  blocked: 'text-red-600 bg-red-50 border-red-200'};

const priorityColors = {critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'};

function PhaseCard({phase}: {phase: Phase}) {
  const StatusIcon = statusIcons[phase.status];
  const completedMilestones = phase.milestones.filter(m =>m.completed).length;
  const totalMilestones = phase.milestones.length;
  
  return (<Card className="h-full"><CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-2"><StatusIcon className={`h-5 w-5 ${statusColors[phase.status].split(' ')[0]}`} /><CardTitle className="text-lg">{phase.name}</CardTitle></div><Badge variant="outline" className={priorityColors[phase.priority]}>{phase.priority}</Badge></div><CardDescription>{phase.description}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><div className="flex justify-between text-sm"><><span>Overall Progress</span><span
</></>>{phase.progress}%</span></div><><Progress value={phase.progress} className="h-2" /></div><div
</>
className="grid grid-cols-2 gap-4 text-sm"><div><><div className="text-muted-foreground">Timeline</div><div
</>
className="font-medium">{phase.estimatedWeeks}</div></div><div><><div className="text-muted-foreground">Milestones</div><div
</>
className="font-medium">{completedMilestones}/{totalMilestones}</div></div></div>{phase.blockers.length > 0 && (<Alert className="border-red-200 bg-red-50"><Warning className="h-4 w-4 text-red-600" /><AlertDescription><div className="text-sm text-red-800"><><div className="font-medium mb-1">Blockers:</div><ul
</>className="list-disc list-inside space-y-1">
                  {phase.blockers.map((blocker /* , index */) => (<li key={index}>{blocker}</li>))}</ul></div></AlertDescription></Alert>)}
        
        {phase.nextActions.length > 0 && (<div className="space-y-2"><><div className="text-sm font-medium text-muted-foreground">Next Actions:</div><ul
</>className="text-sm space-y-1">
              {phase.nextActions.slice(0, 3).map((action /* , index */) => (<li key={index} className="flex items-start space-x-2"><Zap className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" /><span>{action}</span></li>))}</ul></div>)}</CardContent></Card>);
}

function MilestoneView({phases}: {phases: Phase[]}) {
  const currentPhase = phases.find(p => p.status === 'in-progress') || phases[0];
  
  return (<div className="space-y-6"><div className="flex items-center justify-between"><><h3 className="text-xl font-semibold">Current Phase: {currentPhase.name}</h3><Badge
</>variant="outline" className="text-sm">
          {currentPhase.progress}% Complete</Badge></div><div className="grid gap-4">{currentPhase.milestones.map((milestone) => (<Card key={milestone.id} className="p-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-3">{milestone.completed ? (<CheckCircle className="h-5 w-5 text-green-600" />) : (<Clock className="h-5 w-5 text-blue-600" />)}<div><><div className="font-medium">{milestone.title}</div><div
</>className="text-sm text-muted-foreground">
                    {milestone.category} • {milestone.estimatedHours}h estimated</div></div></div><Badge variant="outline" className={priorityColors[milestone.priority]}>{milestone.priority}</Badge></div></Card>))}</div></div>);
}

function MetricsView() {
  const totalMilestones = ROADMAP_DATA.reduce((acc, phase) => acc + phase.milestones.length, 0);
  const completedMilestones = ROADMAP_DATA.reduce((acc, phase) => 
    acc + phase.milestones.filter(m => m.completed).length, 0
  );
  const totalEstimatedHours = ROADMAP_DATA.reduce((acc, phase) => 
    acc + phase.milestones.reduce((phaseAcc, milestone) => phaseAcc + milestone.estimatedHours, 0), 0
  );
  const completedHours = ROADMAP_DATA.reduce((acc, phase) => 
    acc + phase.milestones.filter(m => m.completed).reduce((phaseAcc, milestone) => phaseAcc + milestone.estimatedHours, 0), 0
  );
  
  return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Card className="p-6 text-center"><><div className="text-3xl font-bold text-green-600 mb-2">{Math.round((completedMilestones / totalMilestones) * 100)}%</div><div
</>
className="text-sm text-muted-foreground">Overall Progress</div><div className="text-xs mt-1">{completedMilestones}/{totalMilestones} milestones</div></Card><Card className="p-6 text-center"><><div className="text-3xl font-bold text-blue-600 mb-2">{Math.round(completedHours)}h</div><div
</>
className="text-sm text-muted-foreground">Hours Completed</div><div className="text-xs mt-1">of {totalEstimatedHours}h total</div></Card><Card className="p-6 text-center"><><div className="text-3xl font-bold text-orange-600 mb-2">{ROADMAP_DATA.filter(p => p.status === 'in-progress').length}</div><div
</>
className="text-sm text-muted-foreground">Active Phases</div><div className="text-xs mt-1">Currently in development</div></Card><Card className="p-6 text-center"><><div className="text-3xl font-bold text-purple-600 mb-2">{ROADMAP_DATA.reduce((acc, phase) => acc + phase.blockers.length, 0)}</div><div
</>
className="text-sm text-muted-foreground">Active Blockers</div><div className="text-xs mt-1">Requiring attention</div></Card></div>);
}

export default function ProgressTracker() {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  return (<div className="space-y-6"><div className="flex items-center justify-between"><div><><h2 className="text-2xl font-bold">Project Roadmap & Progress</h2><p
</>
className="text-muted-foreground">Track progress toward the MVP and beyond</p></div><div className="flex items-center space-x-2"><Crown className="h-5 w-5 text-yellow-600" /><span className="text-sm font-medium">Path to The Promised Land</span></div></div><Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6"><TabsList className="grid w-full grid-cols-3"><><TabsTrigger value="overview">Phase Overview</TabsTrigger><TabsTrigger
</>
value="milestones">Current Milestones</TabsTrigger><TabsTrigger value="metrics">Success Metrics</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-6"><div className="grid gap-6">{ROADMAP_DATA.map((phase) => (<PhaseCard key={phase.id} phase={phase} />))}</div></TabsContent><TabsContent value="milestones" className="space-y-6"><><MilestoneView phases={ROADMAP_DATA} /></TabsContent><TabsContent
</>
value="metrics" className="space-y-6"><MetricsView /></TabsContent></Tabs></div>
  );
}