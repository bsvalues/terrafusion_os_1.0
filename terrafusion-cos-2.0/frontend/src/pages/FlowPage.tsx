/**
 * TerraFusion cOS 2.0 - TerraFlow Page
 * Workflow orchestration and automation
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  trigger_type: 'event' | 'schedule' | 'manual';
  trigger_config: any;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
  execution_count: number;
  success_rate: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel';
  module: string;
  config: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  steps_completed: number;
  total_steps: number;
  error_message?: string;
  execution_data: any;
}

interface WorkflowMetrics {
  total_workflows: number;
  active_workflows: number;
  executions_today: number;
  success_rate: number;
  average_execution_time: number;
  workflows_by_status: {
    active: number;
    paused: number;
    draft: number;
    error: number;
  };
}

const FlowPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'workflows' | 'executions' | 'metrics' | 'designer'>('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'event' as const
  });

  // Fetch workflows
  const { data: workflows, isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      return [
        {
          id: '1',
          name: 'Property Assessment Workflow',
          description: 'Automated property assessment with AI valuation',
          status: 'active',
          trigger_type: 'event',
          trigger_config: { event: 'new_property_record' },
          steps: [
            { id: '1', name: 'Validate Data', type: 'action', module: 'sync', config: {}, status: 'completed' },
            { id: '2', name: 'AI Valuation', type: 'action', module: 'ai_swarm', config: { agents: 10 }, status: 'completed' },
            { id: '3', name: 'Compliance Check', type: 'action', module: 'security', config: {}, status: 'running' },
            { id: '4', name: 'Generate Report', type: 'action', module: 'reporting', config: {}, status: 'pending' }
          ],
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-15T14:30:00Z',
          execution_count: 1250,
          success_rate: 98.5
        },
        {
          id: '2',
          name: 'Monthly Financial Analysis',
          description: 'Automated monthly financial reporting and analysis',
          status: 'active',
          trigger_type: 'schedule',
          trigger_config: { schedule: '0 0 1 * *' }, // First day of month
          steps: [
            { id: '1', name: 'Collect Data', type: 'action', module: 'sync', config: {}, status: 'completed' },
            { id: '2', name: 'Run Analysis', type: 'action', module: 'costforge', config: {}, status: 'completed' },
            { id: '3', name: 'Generate Report', type: 'action', module: 'reporting', config: {}, status: 'completed' }
          ],
          created_at: '2024-01-05T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z',
          execution_count: 12,
          success_rate: 100
        },
        {
          id: '3',
          name: 'Vendor Onboarding',
          description: 'Automated vendor onboarding and setup process',
          status: 'draft',
          trigger_type: 'manual',
          trigger_config: {},
          steps: [
            { id: '1', name: 'Create Vendor Record', type: 'action', module: 'vendor', config: {}, status: 'pending' },
            { id: '2', name: 'Setup API Access', type: 'action', module: 'security', config: {}, status: 'pending' },
            { id: '3', name: 'Deploy AI Agents', type: 'action', module: 'ai_swarm', config: {}, status: 'pending' }
          ],
          created_at: '2024-01-12T16:00:00Z',
          updated_at: '2024-01-12T16:00:00Z',
          execution_count: 0,
          success_rate: 0
        }
      ];
    }
  });

  // Fetch workflow executions
  const { data: executions } = useQuery<WorkflowExecution[]>({
    queryKey: ['workflow-executions'],
    queryFn: async () => {
      return [
        {
          id: '1',
          workflow_id: '1',
          status: 'running',
          started_at: '2024-01-15T14:30:00Z',
          steps_completed: 2,
          total_steps: 4,
          execution_data: { property_id: 'P12345' }
        },
        {
          id: '2',
          workflow_id: '2',
          status: 'completed',
          started_at: '2024-01-15T09:00:00Z',
          completed_at: '2024-01-15T09:15:00Z',
          steps_completed: 3,
          total_steps: 3,
          execution_data: { month: '2024-01' }
        },
        {
          id: '3',
          workflow_id: '1',
          status: 'failed',
          started_at: '2024-01-15T13:45:00Z',
          completed_at: '2024-01-15T13:50:00Z',
          steps_completed: 1,
          total_steps: 4,
          error_message: 'AI valuation service unavailable',
          execution_data: { property_id: 'P12346' }
        }
      ];
    }
  });

  // Fetch workflow metrics
  const { data: metrics } = useQuery<WorkflowMetrics>({
    queryKey: ['workflow-metrics'],
    queryFn: async () => {
      return {
        total_workflows: 3,
        active_workflows: 2,
        executions_today: 45,
        success_rate: 96.7,
        average_execution_time: 8.5,
        workflows_by_status: {
          active: 2,
          paused: 0,
          draft: 1,
          error: 0
        }
      };
    }
  });

  // Create workflow mutation
  const createWorkflow = useMutation({
    mutationFn: async (workflowData: typeof newWorkflow) => {
      return { success: true, workflow_id: 'new_workflow_id' };
    },
    onSuccess: () => {
      toast.success('Workflow created successfully');
      setNewWorkflow({ name: '', description: '', trigger_type: 'event' });
    },
    onError: () => {
      toast.error('Failed to create workflow');
    }
  });

  // Execute workflow mutation
  const executeWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      return { success: true, execution_id: 'new_execution_id' };
    },
    onSuccess: () => {
      toast.success('Workflow execution started');
    },
    onError: () => {
      toast.error('Failed to start workflow execution');
    }
  });

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (workflowsLoading) {
    return (
      <div className="tf-loading">
        <div className="tf-skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="tf-flow-page">
      <div className="tf-page-header">
        <h1 className="tf-h3">TerraFlow</h1>
        <p className="tf-text-muted">Workflow orchestration and automation engine</p>
      </div>

      {/* View Selector */}
      <div className="tf-view-selector">
        <button
          className={`tf-btn ${selectedView === 'workflows' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('workflows')}
        >
          Workflows
        </button>
        <button
          className={`tf-btn ${selectedView === 'executions' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('executions')}
        >
          Executions
        </button>
        <button
          className={`tf-btn ${selectedView === 'metrics' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('metrics')}
        >
          Metrics
        </button>
        <button
          className={`tf-btn ${selectedView === 'designer' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('designer')}
        >
          Designer
        </button>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'workflows' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Create New Workflow */}
          <div className="tf-card tf-mb-6">
            <h3 className="tf-h3 tf-mb-4">Create New Workflow</h3>
            <div className="tf-form-grid">
              <div className="tf-form-group">
                <label className="tf-label">Workflow Name</label>
                <input
                  type="text"
                  className="tf-input"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="e.g., Automated Data Processing"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Description</label>
                <input
                  type="text"
                  className="tf-input"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Brief description of the workflow"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Trigger Type</label>
                <select
                  className="tf-input"
                  value={newWorkflow.trigger_type}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, trigger_type: e.target.value as any })}
                >
                  <option value="event">Event Trigger</option>
                  <option value="schedule">Scheduled</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <button
              className="tf-btn tf-btn-primary tf-mt-4"
              onClick={() => createWorkflow.mutate(newWorkflow)}
              disabled={!newWorkflow.name || !newWorkflow.description}
            >
              Create Workflow
            </button>
          </div>

          {/* Workflows List */}
          <div className="tf-workflows-grid">
            {workflows?.map((workflow) => (
              <motion.div
                key={workflow.id}
                className="tf-workflow-card"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tf-workflow-header">
                  <h4 className="tf-h4">{workflow.name}</h4>
                  <div className={`tf-status tf-status-${workflow.status}`}>
                    <span className="tf-status-dot"></span>
                    {workflow.status}
                  </div>
                </div>
                
                <p className="tf-workflow-description">{workflow.description}</p>
                
                <div className="tf-workflow-trigger">
                  <span className="tf-trigger-label">Trigger:</span>
                  <span className="tf-trigger-value">{workflow.trigger_type}</span>
                </div>
                
                <div className="tf-workflow-steps">
                  <div className="tf-steps-header">
                    <span>Steps ({workflow.steps.length})</span>
                    <span>Success Rate: {workflow.success_rate}%</span>
                  </div>
                  <div className="tf-steps-list">
                    {workflow.steps.map((step) => (
                      <div key={step.id} className={`tf-step tf-step-${step.status}`}>
                        <span className="tf-step-name">{step.name}</span>
                        <span className="tf-step-module">({step.module})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="tf-workflow-metrics">
                  <div className="tf-metric">
                    <div className="tf-metric-value">{workflow.execution_count}</div>
                    <div className="tf-metric-label">Executions</div>
                  </div>
                  <div className="tf-metric">
                    <div className="tf-metric-value">{workflow.success_rate}%</div>
                    <div className="tf-metric-label">Success Rate</div>
                  </div>
                </div>
                
                <div className="tf-workflow-actions">
                  <button
                    className="tf-btn tf-btn-sm tf-btn-primary"
                    onClick={() => executeWorkflow.mutate(workflow.id)}
                  >
                    Execute
                  </button>
                  <button
                    className="tf-btn tf-btn-sm tf-btn-ghost"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    Edit
                  </button>
                </div>
                
                <div className="tf-workflow-updated">
                  Updated: {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedView === 'executions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tf-executions-container">
            {executions?.map((execution) => {
              const workflow = workflows?.find(w => w.id === execution.workflow_id);
              return (
                <motion.div
                  key={execution.id}
                  className={`tf-execution-card tf-execution-${execution.status}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="tf-execution-header">
                    <div className="tf-execution-info">
                      <h4 className="tf-h4">{workflow?.name || 'Unknown Workflow'}</h4>
                      <div className={`tf-status tf-status-${execution.status}`}>
                        <span className="tf-status-dot"></span>
                        {execution.status}
                      </div>
                    </div>
                    <div className="tf-execution-time">
                      {new Date(execution.started_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="tf-execution-progress">
                    <div className="tf-progress">
                      <div 
                        className="tf-progress-bar"
                        style={{ 
                          width: `${(execution.steps_completed / execution.total_steps) * 100}%`,
                          background: execution.status === 'completed' ? 
                            'var(--tf-success-green)' : 
                            execution.status === 'failed' ? 'var(--tf-danger-red)' : 'var(--tf-trust-blue)'
                        }}
                      />
                    </div>
                    <div className="tf-progress-text">
                      {execution.steps_completed} / {execution.total_steps} steps completed
                    </div>
                  </div>
                  
                  {execution.error_message && (
                    <div className="tf-execution-error">
                      <strong>Error:</strong> {execution.error_message}
                    </div>
                  )}
                  
                  {execution.completed_at && (
                    <div className="tf-execution-duration">
                      Duration: {formatDuration(
                        Math.floor((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {selectedView === 'metrics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tf-metrics-grid">
            <div className="tf-metric-card">
              <h3 className="tf-h3">Total Workflows</h3>
              <div className="tf-metric-value">{metrics?.total_workflows}</div>
              <div className="tf-metric-label">Active: {metrics?.active_workflows}</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Executions Today</h3>
              <div className="tf-metric-value tf-text-success">
                {metrics?.executions_today}
              </div>
              <div className="tf-metric-trend positive">↑ 8.2%</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Success Rate</h3>
              <div className="tf-metric-value tf-text-success">
                {metrics?.success_rate}%
              </div>
              <div className="tf-progress tf-mt-3">
                <div 
                  className="tf-progress-bar tf-bg-success-gradient"
                  style={{ width: `${metrics?.success_rate}%` }}
                />
              </div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Average Execution Time</h3>
              <div className="tf-metric-value">
                {formatDuration(metrics?.average_execution_time || 0)}
              </div>
              <div className="tf-metric-label">Per workflow</div>
            </div>

            <div className="tf-metric-card tf-metric-card-wide">
              <h3 className="tf-h3">Workflows by Status</h3>
              <div className="tf-status-breakdown">
                <div className="tf-status-item">
                  <span className="tf-status-label">Active</span>
                  <span className="tf-status-value">{metrics?.workflows_by_status.active}</span>
                </div>
                <div className="tf-status-item">
                  <span className="tf-status-label">Paused</span>
                  <span className="tf-status-value">{metrics?.workflows_by_status.paused}</span>
                </div>
                <div className="tf-status-item">
                  <span className="tf-status-label">Draft</span>
                  <span className="tf-status-value">{metrics?.workflows_by_status.draft}</span>
                </div>
                <div className="tf-status-item">
                  <span className="tf-status-label">Error</span>
                  <span className="tf-status-value">{metrics?.workflows_by_status.error}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {selectedView === 'designer' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tf-designer-container">
            <div className="tf-designer-header">
              <h3 className="tf-h3">Workflow Designer</h3>
              <div className="tf-designer-actions">
                <button className="tf-btn tf-btn-ghost">Save</button>
                <button className="tf-btn tf-btn-primary">Deploy</button>
              </div>
            </div>
            
            <div className="tf-designer-canvas">
              <div className="tf-designer-placeholder">
                <div className="tf-designer-icon">🎨</div>
                <h4 className="tf-h4">Visual Workflow Designer</h4>
                <p className="tf-text-muted">
                  Drag and drop workflow steps to create automated processes.
                  Connect modules, set conditions, and configure triggers.
                </p>
                <button className="tf-btn tf-btn-primary tf-mt-4">
                  Start Designing
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Page Styles */}
      <style jsx>{`
        .tf-flow-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .tf-view-selector {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-6);
        }

        .tf-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-workflows-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-workflow-card {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
          transition: all var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-workflow-card:hover {
          border-color: var(--tf-trust-blue);
          box-shadow: var(--tf-shadow-lg);
        }

        .tf-workflow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tf-space-2);
        }

        .tf-workflow-description {
          color: var(--tf-gray-300);
          margin-bottom: var(--tf-space-3);
        }

        .tf-workflow-trigger {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-3);
          font-size: var(--tf-small);
        }

        .tf-trigger-label {
          color: var(--tf-gray-400);
        }

        .tf-trigger-value {
          color: var(--tf-trust-blue);
          text-transform: capitalize;
        }

        .tf-workflow-steps {
          margin-bottom: var(--tf-space-4);
        }

        .tf-steps-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--tf-space-2);
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-steps-list {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-1);
        }

        .tf-step {
          display: flex;
          justify-content: space-between;
          padding: var(--tf-space-2);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--tf-radius);
          font-size: var(--tf-small);
        }

        .tf-step-completed {
          background: rgba(0, 255, 170, 0.1);
          color: var(--tf-success-green);
        }

        .tf-step-running {
          background: rgba(0, 255, 238, 0.1);
          color: var(--tf-transcend-cyan);
        }

        .tf-step-failed {
          background: rgba(255, 59, 48, 0.1);
          color: var(--tf-danger-red);
        }

        .tf-step-module {
          color: var(--tf-gray-400);
        }

        .tf-workflow-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--tf-space-3);
          margin-bottom: var(--tf-space-4);
        }

        .tf-workflow-actions {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-3);
        }

        .tf-workflow-updated {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-executions-container {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-3);
        }

        .tf-execution-card {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
        }

        .tf-execution-completed {
          border-left: 4px solid var(--tf-success-green);
        }

        .tf-execution-failed {
          border-left: 4px solid var(--tf-danger-red);
        }

        .tf-execution-running {
          border-left: 4px solid var(--tf-transcend-cyan);
        }

        .tf-execution-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tf-space-3);
        }

        .tf-execution-info {
          display: flex;
          align-items: center;
          gap: var(--tf-space-3);
        }

        .tf-execution-time {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-execution-progress {
          margin-bottom: var(--tf-space-3);
        }

        .tf-progress-text {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
          margin-top: var(--tf-space-1);
        }

        .tf-execution-error {
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.3);
          border-radius: var(--tf-radius);
          padding: var(--tf-space-2);
          margin: var(--tf-space-2) 0;
          font-size: var(--tf-small);
        }

        .tf-execution-duration {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-metric-card-wide {
          grid-column: span 2;
        }

        .tf-status-breakdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--tf-space-3);
          margin-top: var(--tf-space-3);
        }

        .tf-status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--tf-space-3);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--tf-radius);
        }

        .tf-status-label {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
          margin-bottom: var(--tf-space-1);
        }

        .tf-status-value {
          font-size: var(--tf-heading-2);
          font-weight: 700;
          color: var(--tf-white);
        }

        .tf-designer-container {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          overflow: hidden;
        }

        .tf-designer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--tf-space-4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tf-designer-actions {
          display: flex;
          gap: var(--tf-space-2);
        }

        .tf-designer-canvas {
          height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tf-designer-placeholder {
          text-align: center;
          max-width: 400px;
        }

        .tf-designer-icon {
          font-size: 48px;
          margin-bottom: var(--tf-space-4);
        }

        @media (max-width: 768px) {
          .tf-workflows-grid {
            grid-template-columns: 1fr;
          }

          .tf-workflow-metrics {
            grid-template-columns: 1fr;
          }

          .tf-status-breakdown {
            grid-template-columns: repeat(2, 1fr);
          }

          .tf-execution-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--tf-space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default FlowPage;
