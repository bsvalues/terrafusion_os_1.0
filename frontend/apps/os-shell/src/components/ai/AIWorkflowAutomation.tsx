/**
 * ═══════════════════════════════════════════════════════════════
 * AI WORKFLOW AUTOMATION - Intelligent Task Orchestration
 * TerraFusion OS Elite Government Automation Engine
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Progress,
} from '@/components/terrafusion-design-system';
import { cn } from '@utils/cn';
import {
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  FileCheck,
  Play,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  aiOptimized: boolean;
  estimatedTime: number;
  actualTime?: number;
  accuracy?: number;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: WorkflowStep[];
  totalProperties?: number;
  aiConfidence: number;
  estimatedSavings: {
    time: number;
    accuracy: number;
  };
}

interface AIWorkflowAutomationProps {
  countyId: string;
  department: string;
  onWorkflowExecute?: (workflowId: string) => void;
  className?: string;
}

export const AIWorkflowAutomation: React.FC<AIWorkflowAutomationProps> = ({
  countyId,
  department,
  onWorkflowExecute,
  className,
}) => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setError(null);
        const params = new URLSearchParams({ countyId, department });
        const response = await fetch(`/api/ai/workflows?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Workflow API unavailable: ${response.status}`);
        }

        const payload = await response.json();
        setWorkflows(Array.isArray(payload.workflows) ? payload.workflows : []);
      } catch (err) {
        setWorkflows([]);
        setError(err instanceof Error ? err.message : 'Workflow evidence is unavailable.');
      }
    };

    void loadWorkflows();
  }, [countyId, department]);

  const executeWorkflow = async (workflowId: string) => {
    setActiveWorkflow(workflowId);
    setIsExecuting(true);

    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    try {
      const response = await fetch(`/api/ai/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ countyId, department }),
      });

      if (!response.ok) {
        throw new Error(`Workflow execution API unavailable: ${response.status}`);
      }

      const payload = await response.json();
      if (payload.workflow) {
        setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? payload.workflow : w)));
      }

      onWorkflowExecute?.(workflowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow execution evidence is unavailable.');
    } finally {
      setIsExecuting(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-400' />;
      case 'running':
        return (
          <div className='w-4 h-4 border-2 border-terra-cyan border-t-transparent rounded-full animate-spin' />
        );
      case 'failed':
        return <AlertCircle className='w-4 h-4 text-red-400' />;
      default:
        return <Clock className='w-4 h-4 text-slate-400' />;
    }
  };

  const calculateProgress = (steps: WorkflowStep[]) => {
    const completed = steps.filter((s) => s.status === 'completed').length;
    return (completed / steps.length) * 100;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-white mb-1'>AI Workflow Automation</h2>
          <p className='text-sm text-slate-400'>
            Intelligent task orchestration for {countyId.toUpperCase()} {department}
          </p>
        </div>
        <Badge variant='quantum' className='quantum-pulse'>
          <Brain className='w-4 h-4 mr-2' />
          Evidence Backed
        </Badge>
      </div>

      {/* Workflows Grid */}
      <div className='grid gap-6'>
        {error && (
          <Card className='terra-glass border border-yellow-500/20'>
            <CardContent className='p-4 text-yellow-200'>{error}</CardContent>
          </Card>
        )}
        {workflows.length === 0 && !error && (
          <Card className='terra-glass border border-terra-cyan/20'>
            <CardContent className='p-4 text-slate-400'>
              No governed workflows returned for this county and department.
            </CardContent>
          </Card>
        )}
        {workflows.map((workflow) => {
          const isActive = activeWorkflow === workflow.id;
          const progress = calculateProgress(workflow.steps);
          const allCompleted = workflow.steps.every((s) => s.status === 'completed');

          return (
            <Card
              key={workflow.id}
              className={cn(
                'terra-glass transition-all duration-300',
                isActive && 'ring-2 ring-terra-cyan/50'
              )}
              glow={isActive}
            >
              <CardHeader className='pb-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='text-lg font-semibold text-white'>{workflow.name}</h3>
                      {workflow.totalProperties && (
                        <Badge variant='outline' className='text-xs'>
                          {workflow.totalProperties} properties
                        </Badge>
                      )}
                    </div>
                    <p className='text-sm text-slate-400 mb-3'>{workflow.description}</p>

                    <div className='flex items-center gap-4 text-xs'>
                      <div className='flex items-center gap-1'>
                        <TrendingUp className='w-4 h-4 text-green-400' />
                        <span className='text-slate-400'>
                          Save {workflow.estimatedSavings.time}h
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <FileCheck className='w-4 h-4 text-terra-cyan' />
                        <span className='text-slate-400'>
                          +{workflow.estimatedSavings.accuracy}% accuracy
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Brain className='w-4 h-4 text-purple-400' />
                        <span className='text-slate-400'>
                          {(workflow.aiConfidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => executeWorkflow(workflow.id)}
                    disabled={isExecuting || allCompleted}
                    variant={allCompleted ? 'outline' : 'quantum'}
                    className={cn('ml-4', !allCompleted && 'quantum-pulse')}
                  >
                    {allCompleted ? (
                      <>
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Completed
                      </>
                    ) : isActive ? (
                      <>
                        <Clock className='w-4 h-4 mr-2' />
                        Executing
                      </>
                    ) : (
                      <>
                        <Play className='w-4 h-4 mr-2' />
                        Execute
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {isActive && progress > 0 && (
                  <div className='mt-4'>
                    <div className='flex items-center justify-between text-xs mb-2'>
                      <span className='text-slate-400'>Overall Progress</span>
                      <span className='text-terra-cyan font-mono'>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className='h-2' />
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {/* Workflow Steps */}
                <div className='space-y-3'>
                  {workflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-all',
                        step.status === 'completed'
                          ? 'bg-green-500/10 border-green-500/20'
                          : step.status === 'running'
                            ? 'bg-terra-cyan/10 border-terra-cyan/20 terra-glow'
                            : 'bg-slate-800/30 border-slate-700'
                      )}
                    >
                      <div className='mt-0.5'>{getStepIcon(step.status)}</div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-sm font-semibold text-white'>
                            {index + 1}. {step.name}
                          </span>
                          {step.aiOptimized && (
                            <Badge variant='quantum' className='text-xs'>
                              <Zap className='w-3 h-3 mr-1' />
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className='text-xs text-slate-400 mb-2'>{step.description}</p>

                        <div className='flex items-center gap-4 text-xs'>
                          <span className='text-slate-500'>Est. {step.estimatedTime}s</span>
                          {step.actualTime && (
                            <span className='text-green-400'>
                              Actual: {step.actualTime.toFixed(0)}s
                            </span>
                          )}
                          {step.accuracy && (
                            <span className='text-terra-cyan'>
                              {(step.accuracy * 100).toFixed(1)}% accurate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {allCompleted && (
                  <div className='mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20'>
                    <div className='flex items-center gap-2 text-green-400 mb-2'>
                      <CheckCircle className='w-5 h-5' />
                      <span className='font-semibold'>Workflow Completed Successfully</span>
                    </div>
                    <p className='text-xs text-slate-400'>
                      All {workflow.steps.length} steps completed according to the workflow API
                      response.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AIWorkflowAutomation;
