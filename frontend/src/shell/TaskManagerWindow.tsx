/**
 * TaskManagerWindow - Floating window for system processes and running apps
 * Government-grade system monitoring with Tahoe glass effects
 */

import { EliteIcons, EliteQuantumIcon } from '@/components/icons/EliteIcons';
import React, { useEffect, useState } from 'react';

interface TaskManagerWindowProps {
  onClose: () => void;
}

interface SystemProcess {
  id: string;
  name: string;
  type: 'system' | 'suite' | 'app' | 'service';
  status: 'running' | 'idle' | 'busy' | 'error';
  cpu: number;
  memory: number;
  description: string;
}

interface LiveActivity {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
  status: 'active' | 'complete' | 'error';
  icon: keyof typeof EliteIcons;
}

export const TaskManagerWindow: React.FC<TaskManagerWindowProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'processes' | 'activities' | 'performance'>(
    'processes'
  );

  // Mock system processes
  const [processes] = useState<SystemProcess[]>([
    {
      id: 'os-kernel',
      name: 'TerraFusion Kernel',
      type: 'system',
      status: 'running',
      cpu: 12.5,
      memory: 45.2,
      description: 'Core operating system kernel',
    },
    {
      id: 'ai-consciousness',
      name: 'AI Consciousness Engine',
      type: 'system',
      status: 'running',
      cpu: 35.8,
      memory: 122.4,
      description: '50,000 agent swarm coordinator',
    },
    {
      id: 'assessment-suite',
      name: 'Assessment Suite',
      type: 'suite',
      status: 'idle',
      cpu: 2.1,
      memory: 18.7,
      description: 'Property assessment workspace',
    },
    {
      id: 'data-sync',
      name: 'County Data Sync',
      type: 'service',
      status: 'busy',
      cpu: 8.3,
      memory: 28.9,
      description: 'Harris PACS integration service',
    },
    {
      id: 'costforge-ai',
      name: 'CostForge AI',
      type: 'app',
      status: 'running',
      cpu: 18.7,
      memory: 67.3,
      description: 'AI cost estimation engine',
    },
  ]);

  // Mock live activities
  const [activities, setActivities] = useState<LiveActivity[]>([
    {
      id: 'pacs-sync',
      title: 'Harris PACS Sync',
      subtitle: 'Syncing property updates...',
      progress: 72,
      status: 'active',
      icon: 'Database',
    },
    {
      id: 'ai-training',
      title: 'AI Model Training',
      subtitle: 'Benton County assessment model',
      progress: 85,
      status: 'active',
      icon: 'Brain',
    },
    {
      id: 'report-export',
      title: 'DOR Export',
      subtitle: 'Generating state reports...',
      progress: 42,
      status: 'active',
      icon: 'Activity',
    },
  ]);

  // Update activities progress (mock)
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities((prev) =>
        prev.map((activity) => ({
          ...activity,
          progress: Math.min(100, activity.progress + Math.random() * 3),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: SystemProcess['status']) => {
    switch (status) {
      case 'running':
        return 'tf-status-running';
      case 'idle':
        return 'tf-status-idle';
      case 'busy':
        return 'tf-status-busy';
      case 'error':
        return 'tf-status-error';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: SystemProcess['type']) => {
    switch (type) {
      case 'system':
        return <EliteIcons.CPU className='w-4 h-4 text-terra-cyan' />;
      case 'suite':
        return <EliteIcons.Layers className='w-4 h-4 text-terra-cyan' />;
      case 'app':
        return <EliteIcons.Zap className='w-4 h-4 text-terra-cyan' />;
      case 'service':
        return <EliteIcons.Settings className='w-4 h-4 text-terra-cyan' />;
      default:
        return <EliteIcons.Monitor className='w-4 h-4 text-terra-cyan' />;
    }
  };

  return (
    <div className='tf-task-manager-overlay' onClick={onClose}>
      <div className='tf-task-manager-window' onClick={(e) => e.stopPropagation()}>
        {/* Window header */}
        <div className='tf-task-manager-header'>
          <div className='tf-task-manager-title'>
            <EliteQuantumIcon iconType='Monitor' className='w-4 h-4' glowIntensity='medium' />
            <div className='tf-task-title-content'>
              <span className='tf-task-main-title'>TerraFusion Intelligence</span>
              <span className='tf-task-subtitle'>
                Infrastructure monitoring and AI swarm coordination
              </span>
            </div>
          </div>
          <button className='tf-task-manager-close' onClick={onClose}>
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className='tf-task-manager-tabs'>
          <button
            className={`tf-task-tab ${activeTab === 'processes' ? 'tf-tab-active' : ''}`}
            onClick={() => setActiveTab('processes')}
          >
            Processes
          </button>
          <button
            className={`tf-task-tab ${activeTab === 'activities' ? 'tf-tab-active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Live Activities
          </button>
          <button
            className={`tf-task-tab ${activeTab === 'performance' ? 'tf-tab-active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        </div>

        {/* Tab content */}
        <div className='tf-task-manager-content'>
          {activeTab === 'processes' && (
            <div className='tf-processes-tab'>
              <div className='tf-processes-header'>
                <div className='tf-process-col tf-col-name'>Process</div>
                <div className='tf-process-col tf-col-status'>Status</div>
                <div className='tf-process-col tf-col-cpu'>CPU %</div>
                <div className='tf-process-col tf-col-memory'>Memory</div>
              </div>
              <div className='tf-processes-list'>
                {processes.map((process) => (
                  <div key={process.id} className='tf-process-row'>
                    <div className='tf-process-col tf-col-name'>
                      <span className='tf-process-type-icon'>{getTypeIcon(process.type)}</span>
                      <div>
                        <div className='tf-process-name'>{process.name}</div>
                        <div className='tf-process-description'>{process.description}</div>
                      </div>
                    </div>
                    <div className='tf-process-col tf-col-status'>
                      <span className={`tf-status-badge ${getStatusColor(process.status)}`}>
                        {process.status}
                      </span>
                    </div>
                    <div className='tf-process-col tf-col-cpu'>{process.cpu.toFixed(1)}%</div>
                    <div className='tf-process-col tf-col-memory'>
                      {process.memory.toFixed(1)} MB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className='tf-activities-tab'>
              {activities.length === 0 ? (
                <div className='tf-activities-empty'>
                  <div className='tf-empty-icon'>
                    <EliteQuantumIcon
                      iconType='Monitor'
                      className='w-12 h-12'
                      glowIntensity='low'
                    />
                  </div>
                  <div className='tf-empty-title'>No active processes</div>
                  <div className='tf-empty-subtitle'>All background tasks are complete</div>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className='tf-activity-item'>
                    <div className='tf-activity-icon'>
                      <EliteQuantumIcon
                        iconType={activity.icon as keyof typeof EliteIcons}
                        className='w-6 h-6'
                        glowIntensity='medium'
                      />
                    </div>
                    <div className='tf-activity-content'>
                      <div className='tf-activity-header'>
                        <div className='tf-activity-title'>{activity.title}</div>
                        <div className='tf-activity-percent'>{Math.round(activity.progress)}%</div>
                      </div>
                      <div className='tf-activity-subtitle'>{activity.subtitle}</div>
                      <div className='tf-activity-progress'>
                        <div
                          className='tf-activity-progress-bar'
                          style={{ width: `${activity.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className='tf-performance-tab'>
              <div className='tf-performance-metrics'>
                <div className='tf-metric-card'>
                  <div className='tf-metric-label'>System CPU</div>
                  <div className='tf-metric-value'>23.4%</div>
                  <div className='tf-metric-subtitle'>8 cores active</div>
                </div>
                <div className='tf-metric-card'>
                  <div className='tf-metric-label'>Memory Usage</div>
                  <div className='tf-metric-value'>4.2GB</div>
                  <div className='tf-metric-subtitle'>of 16GB total</div>
                </div>
                <div className='tf-metric-card'>
                  <div className='tf-metric-label'>AI Agents</div>
                  <div className='tf-metric-value'>49,847</div>
                  <div className='tf-metric-subtitle'>of 50,000 active</div>
                </div>
                <div className='tf-metric-card'>
                  <div className='tf-metric-label'>Network I/O</div>
                  <div className='tf-metric-value'>125MB/s</div>
                  <div className='tf-metric-subtitle'>County sync active</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='tf-task-manager-footer'>
          <div className='tf-system-info'>
            <span className='tf-footer-brand'>TerraFusion OS</span> •
            <span className='tf-footer-performance'>Championship Performance: 23d 14h 42m</span> •
            <span className='tf-footer-status'>Infrastructure Intelligence: Operational</span>
          </div>
          <div className='tf-footer-excellence'>Government. Transcended.</div>
        </div>
      </div>
    </div>
  );
};
