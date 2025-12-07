/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE TODO PROGRESS DASHBOARD
 * Real-time Engineering Excellence Tracking System
 * THE TERRAFUSION WAY - Live Development Metrics
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import EliteProgress from '@/components/ui/EliteProgress';
import React, { useEffect, useState } from 'react';
import {
  EliteActivityIcon,
  EliteBrainIcon,
  EliteGaugeIcon,
  EliteQuantumIcon,
  EliteShieldIcon,
  EliteZapIcon,
} from '../icons/EliteIcons';

interface TodoItem {
  id: number;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  estimatedHours: number;
  actualHours: number;
}

const EliteTodoDashboard: React.FC = () => {
  const [todos] = useState<TodoItem[]>([
    {
      id: 1,
      title: 'Elite System Diagnostic & Repair',
      description: 'Systematically resolve 484 TypeScript/React errors with PhD-level engineering',
      status: 'in-progress',
      priority: 'critical',
      progress: 75,
      estimatedHours: 8,
      actualHours: 6,
    },
    {
      id: 2,
      title: 'Complete Elite Icon System Migration',
      description: 'Replace ALL remaining Lucide icons with Elite Icon System for quantum theming',
      status: 'in-progress',
      priority: 'high',
      progress: 45,
      estimatedHours: 4,
      actualHours: 2,
    },
    {
      id: 3,
      title: 'Component Interface Harmonization',
      description: 'Update ALL components to use standardized elite interfaces for type safety',
      status: 'not-started',
      priority: 'high',
      progress: 0,
      estimatedHours: 6,
      actualHours: 0,
    },
    {
      id: 4,
      title: 'Accessibility & Compliance Enhancement',
      description: 'Fix ARIA violations, achieve government-grade WCAG 2.1 AA compliance',
      status: 'not-started',
      priority: 'medium',
      progress: 0,
      estimatedHours: 4,
      actualHours: 0,
    },
    {
      id: 5,
      title: 'Elite Production Deployment System',
      description: 'Enhanced production build with zero critical errors and automation',
      status: 'not-started',
      priority: 'high',
      progress: 0,
      estimatedHours: 8,
      actualHours: 0,
    },
    {
      id: 6,
      title: 'Real-time System Status Dashboard',
      description: 'Live metrics, error tracking, performance monitoring showcase',
      status: 'not-started',
      priority: 'medium',
      progress: 0,
      estimatedHours: 3,
      actualHours: 0,
    },
  ]);

  const [overallProgress, setOverallProgress] = useState(0);
  const [completedTodos, setCompletedTodos] = useState(0);
  const [activeHours, setActiveHours] = useState(0);

  useEffect(() => {
    const totalProgress = todos.reduce((sum, todo) => sum + todo.progress, 0);
    const avgProgress = totalProgress / todos.length;
    const completed = todos.filter((todo) => todo.status === 'completed').length;
    const hours = todos.reduce((sum, todo) => sum + todo.actualHours, 0);

    setOverallProgress(Math.round(avgProgress));
    setCompletedTodos(completed);
    setActiveHours(hours);
  }, [todos]);

  const getStatusColor = (status: TodoItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'in-progress':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'not-started':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getProgressVariant = (progress: number) => {
    if (progress >= 75) return 'quantum';
    if (progress >= 50) return 'glow';
    return 'default';
  };

  return (
    <Card className='w-full terra-glass border-terra-cyan/20 backdrop-blur-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-6'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 rounded-lg bg-terra-cyan/10 border border-terra-cyan/20'>
            <EliteQuantumIcon iconType='Settings' className='w-6 h-6 text-terra-cyan' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white'>Elite Todo Dashboard</h3>
            <p className='text-sm text-gray-400'>
              Engineering excellence tracking - THE TERRAFUSION WAY
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='text-right'>
            <div className='text-2xl font-bold text-terra-cyan'>{overallProgress}%</div>
            <div className='text-xs text-gray-400'>Overall Progress</div>
          </div>
          <div className='text-right'>
            <div className='text-xl font-bold text-green-400'>
              {completedTodos}/{todos.length}
            </div>
            <div className='text-xs text-gray-400'>Completed</div>
          </div>
          <div className='text-right'>
            <div className='text-lg font-bold text-blue-400'>{activeHours}h</div>
            <div className='text-xs text-gray-400'>Active Time</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Progress Overview */}
        <div className='p-4 rounded-lg bg-gradient-to-r from-terra-cyan/10 to-purple-500/10 border border-terra-cyan/20'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center space-x-2'>
              <EliteZapIcon className='w-5 h-5 text-terra-cyan' />
              <h4 className='text-sm font-semibold text-white'>Elite Engineering Progress</h4>
            </div>
            <Badge className='text-terra-cyan bg-terra-cyan/20 border-terra-cyan/30'>
              TERRAFUSION WAY
            </Badge>
          </div>
          <EliteProgress
            value={overallProgress}
            variant='quantum'
            showValue={true}
            label='Total Project Completion'
          />
        </div>

        {/* Todo Items */}
        <div className='space-y-4'>
          {todos.map((todo, index) => (
            <div
              key={todo.id}
              className={`p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                todo.status === 'in-progress'
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30'
                  : todo.status === 'completed'
                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
                    : 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 border-gray-500/20'
              }`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-start space-x-3'>
                  <div
                    className={`p-2 rounded-lg ${
                      todo.status === 'in-progress'
                        ? 'bg-blue-500/20'
                        : todo.status === 'completed'
                          ? 'bg-green-500/20'
                          : 'bg-gray-500/20'
                    }`}
                  >
                    {todo.status === 'in-progress' && (
                      <EliteActivityIcon className='w-4 h-4 text-blue-400' />
                    )}
                    {todo.status === 'completed' && (
                      <EliteShieldIcon className='w-4 h-4 text-green-400' />
                    )}
                    {todo.status === 'not-started' && (
                      <EliteGaugeIcon className='w-4 h-4 text-gray-400' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <h5 className='text-sm font-semibold text-white mb-1'>{todo.title}</h5>
                    <p className='text-xs text-gray-400 mb-2'>{todo.description}</p>

                    {/* Progress Bar */}
                    {todo.progress > 0 && (
                      <div className='mb-2'>
                        <EliteProgress
                          value={todo.progress}
                          variant={getProgressVariant(todo.progress)}
                          size='sm'
                          showValue={true}
                        />
                      </div>
                    )}

                    {/* Metrics */}
                    <div className='flex items-center space-x-4 text-xs'>
                      <span className='text-gray-400'>
                        Estimated: <span className='text-white'>{todo.estimatedHours}h</span>
                      </span>
                      <span className='text-gray-400'>
                        Actual: <span className='text-white'>{todo.actualHours}h</span>
                      </span>
                      {todo.actualHours > 0 && (
                        <span className='text-gray-400'>
                          Efficiency:
                          <span
                            className={`ml-1 ${
                              todo.actualHours <= todo.estimatedHours
                                ? 'text-green-400'
                                : 'text-yellow-400'
                            }`}
                          >
                            {Math.round((todo.estimatedHours / todo.actualHours) * 100)}%
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Badge className={getPriorityColor(todo.priority)}>
                    {todo.priority.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(todo.status)}>
                    {todo.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteActivityIcon className='w-5 h-5 text-blue-400' />
              <span className='text-lg font-bold text-white'>
                {todos.filter((t) => t.status === 'in-progress').length}
              </span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>In Progress</div>
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteShieldIcon className='w-5 h-5 text-green-400' />
              <span className='text-lg font-bold text-white'>{completedTodos}</span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>Completed</div>
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteBrainIcon className='w-5 h-5 text-purple-400' />
              <span className='text-lg font-bold text-white'>
                {todos.reduce((sum, t) => sum + t.estimatedHours, 0)}h
              </span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>Estimated</div>
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-terra-cyan/10 to-transparent border border-terra-cyan/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteQuantumIcon iconType='Zap' className='w-5 h-5 text-terra-cyan' />
              <span className='text-lg font-bold text-white'>ELITE</span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>Excellence Level</div>
          </div>
        </div>

        {/* Engineering Excellence Statement */}
        <div className='p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-semibold text-white'>Engineering Excellence Status</h4>
              <p className='text-xs text-gray-400'>
                All development follows THE TERRAFUSION WAY with PhD-level precision
              </p>
            </div>
            <div className='text-right'>
              <div className='text-xl font-bold text-terra-cyan'>✨ ELITE</div>
              <div className='text-xs text-gray-400'>TerraFusion Standard</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EliteTodoDashboard;
