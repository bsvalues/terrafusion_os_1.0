import {useState} from "react";
import {useQuery, useMutation} from "@tanstack/react-query";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {CheckCircle, 
  Clock, 
  Warning, 
  Users, 
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Target,
  Zap,
  TrendingUp,
  Filter,
  SortAsc} from '@mui/icons-material';
import {apiRequest, queryClient} from "@/lib/queryClient";

interface AuditWorkflowStep {id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  assigneeId?: number;
  estimatedHours: number;
  actualHours?: number;
  requirements: string[];
  outputs: string[];}

interface WorkflowTemplate {id: string;
  name: string;
  description: string;
  auditType: string;
  steps: AuditWorkflowStep[];
  totalEstimatedHours: number;
  successRate: number;}

interface AuditWorkflowInstance {id: string;
  auditId: number;
  templateId: string;
  currentStepIndex: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  steps: AuditWorkflowStep[];
  metrics: {
    totalTimeSpent: number;
    efficiency: number;
    qualityScore: number;};
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {id: 'standard-residential',
    name: 'Standard Residential Assessment',
    description: 'Comprehensive workflow for residential property audits',
    auditType: 'residential',
    totalEstimatedHours: 8,
    successRate: 94,
    steps: [
      {
        id: 'initial-review',
        name: 'Initial Document Review',
        description: 'Review submitted documentation and property records',
        status: 'pending',
        estimatedHours: 1.5,
        requirements: ['Property deed', 'Tax records', 'Assessment appeal form'],
        outputs: ['Document checklist', 'Initial findings summary']},
      {id: 'data-verification',
        name: 'Property Data Verification',
        description: 'Verify property characteristics and assessment history',
        status: 'pending',
        estimatedHours: 2,
        requirements: ['GIS data access', 'Property database'],
        outputs: ['Verified property details', 'Assessment history report']},
      {id: 'market-analysis',
        name: 'Comparable Market Analysis',
        description: 'Analyze recent sales and market trends',
        status: 'pending',
        estimatedHours: 3,
        requirements: ['MLS access', 'Sales data', 'Market reports'],
        outputs: ['Comparative market analysis', 'Value recommendations']},
      {id: 'field-inspection',
        name: 'Field Inspection',
        description: 'Physical inspection of property if required',
        status: 'pending',
        estimatedHours: 2,
        requirements: ['Property access', 'Inspection tools'],
        outputs: ['Inspection report', 'Photo documentation']},
      {id: 'final-assessment',
        name: 'Final Assessment & Decision',
        description: 'Complete assessment and prepare final recommendation',
        status: 'pending',
        estimatedHours: 1.5,
        requirements: ['All previous outputs', 'Supervisor review'],
        outputs: ['Final assessment report', 'Decision documentation']}
    ]
  },
  {id: 'complex-commercial',
    name: 'Complex Commercial Assessment',
    description: 'Advanced workflow for high-value commercial properties',
    auditType: 'commercial',
    totalEstimatedHours: 16,
    successRate: 87,
    steps: [
      {
        id: 'pre-assessment',
        name: 'Pre-Assessment Planning',
        description: 'Comprehensive planning and resource allocation',
        status: 'pending',
        estimatedHours: 2,
        requirements: ['Property portfolio review', 'Team assignment'],
        outputs: ['Assessment plan', 'Resource allocation']},
      {id: 'document-analysis',
        name: 'Advanced Document Analysis',
        description: 'Detailed review of complex commercial documentation',
        status: 'pending',
        estimatedHours: 4,
        requirements: ['Financial statements', 'Lease agreements', 'Operating reports'],
        outputs: ['Financial analysis', 'Income verification']},
      {id: 'market-research',
        name: 'Commercial Market Research',
        description: 'Comprehensive commercial market analysis',
        status: 'pending',
        estimatedHours: 6,
        requirements: ['Commercial databases', 'Industry reports'],
        outputs: ['Market study', 'Valuation models']},
      {id: 'specialist-review',
        name: 'Specialist Review',
        description: 'Expert review by commercial assessment specialist',
        status: 'pending',
        estimatedHours: 3,
        requirements: ['Specialist availability', 'All analysis outputs'],
        outputs: ['Specialist opinion', 'Risk assessment']},
      {id: 'quality-control',
        name: 'Quality Control & Approval',
        description: 'Multi-level review and final approval',
        status: 'pending',
        estimatedHours: 1,
        requirements: ['Supervisor review', 'Quality checklist'],
        outputs: ['Final report', 'Approval documentation']}
    ]
  }
];

function WorkflowStepCard({step, index, isActive, isCompleted}: {step: AuditWorkflowStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;}) {const getStatusColor = () =>{
    if (isCompleted) return 'text-green-600 bg-green-50 border-green-200';
    if (isActive) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-400 bg-gray-50 border-gray-200';};

  const getStatusIcon = () => {if (isCompleted) return CheckCircle;
    if (isActive) return Play;
    return Clock;};

  const StatusIcon = getStatusIcon();

  return (<Card className={`transition-all duration-200 ${isActive ? 'ring-2 ring-blue-500' : ''}`}><CardHeader className="pb-3"><div className="flex items-center justify-between"><div className="flex items-center space-x-3"><div className={`p-2 rounded-full ${getStatusColor()}`}><><StatusIcon className="h-4 w-4" /></div><div
</></>><><CardTitle className="text-base">{index + 1}. {step.name}</CardTitle><CardDescription
</>className="text-sm">
                {step.description}</CardDescription></div></div><Badge variant="outline" className="text-xs">{step.estimatedHours}h</Badge></div></CardHeader><CardContent className="pt-0"><div className="space-y-3"><div><><div className="text-sm font-medium text-gray-700 mb-1">Requirements:</div><ul
</>className="text-xs text-gray-600 space-y-1">
              {step.requirements.map((req, idx) => (<li key={idx} className="flex items-center space-x-2"><><div className="w-1 h-1 bg-gray-400 rounded-full"></div><span
</></>>{req}</span></li>))}</ul></div><div><><div className="text-sm font-medium text-gray-700 mb-1">Expected Outputs:</div><ul
</>className="text-xs text-gray-600 space-y-1">
              {step.outputs.map((output, idx) => (<li key={idx} className="flex items-center space-x-2"><><div className="w-1 h-1 bg-blue-400 rounded-full"></div><span
</></>>{output}</span></li>))}</ul></div>{step.actualHours && (<div className="pt-2 border-t"><div className="flex justify-between text-xs"><><span>Actual Time:</span><span
</>className={step.actualHours > step.estimatedHours ? 'text-red-600' : 'text-green-600'}>
                  {step.actualHours}h</span></div></div>)}</div></CardContent></Card>);
}

function WorkflowTemplateSelector({onSelectTemplate}: {onSelectTemplate: (template: WorkflowTemplate) => void;}) {
  return (<div className="space-y-4"><><h3 className="text-lg font-semibold">Select Workflow Template</h3><div
</>className="grid gap-4">
        {WORKFLOW_TEMPLATES.map((template) => (<Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectTemplate(template)}><CardHeader><div className="flex justify-between items-start"><div><><CardTitle className="text-base">{template.name}</CardTitle><CardDescription
</></>>{template.description}</CardDescription></div><Badge variant="outline" className="ml-2">{template.auditType}</Badge></div></CardHeader><CardContent><div className="grid grid-cols-3 gap-4 text-sm"><div><><div className="text-gray-600">Steps</div><div
</>
className="font-medium">{template.steps.length}</div></div><div><><div className="text-gray-600">Est. Time</div><div
</>
className="font-medium">{template.totalEstimatedHours}h</div></div><div><><div className="text-gray-600">Success Rate</div><div
</>
className="font-medium text-green-600">{template.successRate}%</div></div></div></CardContent></Card>))}</div></div>
  );
}

function WorkflowExecutionView({template, auditId}: {template: WorkflowTemplate;
  auditId: number;}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workflowStatus, setWorkflowStatus] = useState<'not_started' | 'in_progress' | 'paused'>('not_started');

  const progress = ((currentStepIndex + 1) / template.steps.length) * 100;

  const startWorkflow = useMutation({
    mutationFn: async () =>{
      return apiRequest('POST', `/api/audits/${auditId}/workflow/start`, {templateId: template.id});
    },
    onSuccess: () => {setWorkflowStatus('in_progress');
      queryClient.invalidateQueries({ queryKey: ['/api/audits']});
    }
  });

  const advanceStep = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/audits/${auditId}/workflow/advance`, {stepIndex: currentStepIndex + 1});
    },
    onSuccess: () => {if (currentStepIndex< template.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);} else {setWorkflowStatus('not_started'); // Reset for demo}
    }
  });

  const pauseWorkflow = () =>{setWorkflowStatus('paused');};

  const resumeWorkflow = () => {setWorkflowStatus('in_progress');};

  return (<div className="space-y-6"><div className="flex justify-between items-center"><div><><h3 className="text-lg font-semibold">{template.name}</h3><p
</>
className="text-gray-600">Audit #{auditId} Workflow Execution</p></div><div className="flex space-x-2">{workflowStatus === 'not_started' && (<Button onClick={() => startWorkflow.mutate()} disabled={startWorkflow.isPending}><Play className="h-4 w-4 mr-2" />Start Workflow</Button>)}
          
          {workflowStatus === 'in_progress' && (<Button variant="outline" onClick={pauseWorkflow}><><Pause className="h-4 w-4 mr-2" />Pause</Button><Button
</>
onClick={() => advanceStep.mutate()} disabled={advanceStep.isPending}><ArrowRight className="h-4 w-4 mr-2" />Complete Step</Button>)}
          
          {workflowStatus === 'paused' && (<Button onClick={resumeWorkflow}><Play className="h-4 w-4 mr-2" />Resume</Button>)}</div></div>{workflowStatus !== 'not_started' && (<div className="space-y-4"><div><div className="flex justify-between text-sm mb-2"><><span>Overall Progress</span><span
</></>>{Math.round(progress)}%</span></div><><Progress value={progress} className="h-2" /></div><Alert
</></>><Target className="h-4 w-4" /><AlertDescription>Currently on step {currentStepIndex + 1} of {template.steps.length}:<strong className="ml-1">{template.steps[currentStepIndex]?.name}</strong></AlertDescription></Alert></div>)}<div className="space-y-4">{template.steps.map((step /* , index */) => (<WorkflowStepCard
            key={step.id}
            step={step}
            index={index}
            isActive={workflowStatus === 'in_progress' && index === currentStepIndex}
            isCompleted={index < currentStepIndex} />))}</div></div>
  );
}

export default function EnhancedAuditWorkflow({auditId}: {auditId?: number}) {const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [currentTab, setCurrentTab] = useState("templates");

  // Mock workflow analytics
  const workflowAnalytics = {
    totalWorkflows: 156,
    completedWorkflows: 142,
    averageCompletionTime: 6.8,
    efficiencyTrend: 12};

  return (
    <div className="space-y-6"><div className="flex justify-between items-center"><div><><h2 className="text-2xl font-bold">Enhanced Audit Workflow</h2><p
</>
className="text-gray-600">Streamlined process management and optimization</p></div><div className="flex items-center space-x-4"><div className="text-sm text-center"><><div className="font-semibold text-green-600">{workflowAnalytics.completedWorkflows}</div><div
</>
className="text-gray-500">Completed</div></div><div className="text-sm text-center"><><div className="font-semibold text-blue-600">{workflowAnalytics.averageCompletionTime}h</div><div
</>
className="text-gray-500">Avg Time</div></div><div className="text-sm text-center"><><div className="font-semibold text-purple-600">+{workflowAnalytics.efficiencyTrend}%</div><div
</>
className="text-gray-500">Efficiency</div></div></div></div><Tabs value={currentTab} onValueChange={setCurrentTab}><TabsList><><TabsTrigger value="templates">Workflow Templates</TabsTrigger><TabsTrigger
</>
value="execution">Active Workflows</TabsTrigger><TabsTrigger value="analytics">Performance Analytics</TabsTrigger></TabsList><TabsContent value="templates" className="space-y-6">{!selectedTemplate ? (<WorkflowTemplateSelector onSelectTemplate={setSelectedTemplate} />) : (<div className="space-y-4"><div className="flex justify-between items-center"><><h3 className="text-lg font-semibold">Template: {selectedTemplate.name}</h3><Button
</>
variant="outline" onClick={() => setSelectedTemplate(null)}><RotateCcw className="h-4 w-4 mr-2" />Back to Templates</Button></div>{auditId && (<WorkflowExecutionView template={selectedTemplate} auditId={auditId} />)}</div>)}</TabsContent><TabsContent value="execution" className="space-y-6"><Card><CardHeader><><CardTitle>Active Workflow Instances</CardTitle><CardDescription
</></>>Currently running audit workflows</CardDescription></CardHeader><CardContent><div className="text-center py-8 text-gray-500"><Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" /><><p>No active workflows found</p><p
</>
className="text-sm">Start a new workflow from the Templates tab</p></div></CardContent></Card></TabsContent><TabsContent value="analytics" className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Card><CardContent className="p-6 text-center"><><div className="text-2xl font-bold text-blue-600 mb-2">{workflowAnalytics.totalWorkflows}</div><div
</>
className="text-sm text-gray-600">Total Workflows</div></CardContent></Card><Card><CardContent className="p-6 text-center"><><div className="text-2xl font-bold text-green-600 mb-2">{Math.round((workflowAnalytics.completedWorkflows / workflowAnalytics.totalWorkflows) * 100)}%</div><div
</>
className="text-sm text-gray-600">Completion Rate</div></CardContent></Card><Card><CardContent className="p-6 text-center"><><div className="text-2xl font-bold text-purple-600 mb-2">{workflowAnalytics.averageCompletionTime}h</div><div
</>
className="text-sm text-gray-600">Avg Duration</div></CardContent></Card><Card><CardContent className="p-6 text-center"><><div className="text-2xl font-bold text-orange-600 mb-2">+{workflowAnalytics.efficiencyTrend}%</div><div
</>
className="text-sm text-gray-600">Efficiency Gain</div></CardContent></Card></div></TabsContent></Tabs></div>
  );
}