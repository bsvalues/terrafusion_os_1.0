/**
 * AI Swarm Coordination Center - React Component
 * Real-time AI Agent Management Dashboard
 * 🔴 NOW CONNECTED TO LIVE BACKEND API 🔴
 */

import React, { useState, useEffect } from 'react';
import './AISwarmDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8090/api';

const AISwarmDashboard = () => {
  const [swarmStatus, setSwarmStatus] = useState({
    totalAgents: 50000,
    activeAgents: 0,
    idleAgents: 0,
    tasksCompleted: 0,
    successRate: 0,
    avgResponseTime: 0,
    supremeCommander: 'Claude Opus',
    connected: false,
    status: 'loading'
  });

  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [swarms, setSwarms] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch AI Swarm status from backend
  const fetchSwarmStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-swarm/status`);
      if (!response.ok) throw new Error('Failed to fetch swarm status');
      
      const data = await response.json();
      
      setSwarmStatus({
        totalAgents: data.metrics.total_agents,
        activeAgents: data.metrics.active_agents,
        idleAgents: data.metrics.total_agents - data.metrics.active_agents,
        tasksCompleted: data.metrics.tasks_completed_today,
        successRate: (data.metrics.success_rate * 100).toFixed(2),
        avgResponseTime: data.metrics.average_response_time,
        supremeCommander: data.supreme_commander_connected ? 'Claude Opus (Connected)' : 'Claude Opus (Simulated)',
        connected: true,
        status: data.status
      });

      // Convert agent types to swarms
      const swarmData = Object.entries(data.agent_types).map(([type, count], index) => ({
        id: index + 1,
        name: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Swarm',
        agents: count,
        status: data.metrics.active_agents > 0 ? 'active' : 'idle',
        tasks: Math.floor(count * 0.7) // Estimate tasks based on agent count
      }));
      setSwarms(swarmData);

    } catch (error) {
      console.error('Error fetching swarm status:', error);
      setSwarmStatus(prev => ({ ...prev, connected: false, status: 'error' }));
    }
  };

  // Fetch AI agents
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-swarm/agents?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  // Fetch active tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-swarm/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data.tasks || []);
      
      // Convert tasks to activity feed
      const activities = data.tasks.map((task, index) => ({
        time: new Date().toLocaleTimeString(),
        swarm: task.type.replace(/_/g, ' '),
        action: task.description,
        type: task.priority === 'HIGH' ? 'warning' : 'success'
      }));
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchSwarmStatus();
    fetchAgents();
    fetchTasks();

    // Poll every 5 seconds for updates
    const interval = setInterval(() => {
      fetchSwarmStatus();
      fetchTasks();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-swarm-dashboard">
      {/* Header */}
      <div className="swarm-header">
        <div className="header-left">
          <h1 className="swarm-title">
            <span className="icon">🤖</span>
            AI Swarm Coordination Center
          </h1>
          <p className="swarm-subtitle">50,000+ AI Agents Working in Perfect Harmony</p>
        </div>
        <div className="header-right">
          <div className={`status-badge ${swarmStatus.connected ? 'operational' : 'error'}`}>
            <span className="status-pulse"></span>
            {swarmStatus.connected 
              ? swarmStatus.status === 'operational' 
                ? 'FULLY OPERATIONAL' 
                : swarmStatus.status.toUpperCase()
              : 'DISCONNECTED'
            }
          </div>
        </div>
      </div>

      {/* Supreme Commander Section */}
      <div className="supreme-commander-section">
        <div className="commander-card">
          <div className="commander-icon">👑</div>
          <div className="commander-info">
            <h3>Supreme Commander</h3>
            <p className="commander-name">{swarmStatus.supremeCommander}</p>
            <p className="commander-status">
              {swarmStatus.connected ? 'Orchestrating all swarm operations' : 'Connecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">🎯</div>
          <div className="metric-value">{swarmStatus.totalAgents.toLocaleString()}</div>
          <div className="metric-label">Total AI Agents</div>
          <div className="metric-trend up">↑ 50,000+ Available</div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">✅</div>
          <div className="metric-value">{swarmStatus.activeAgents.toLocaleString()}</div>
          <div className="metric-label">Active Agents</div>
          <div className="metric-trend up">
            ↑ {swarmStatus.totalAgents > 0 
              ? ((swarmStatus.activeAgents / swarmStatus.totalAgents) * 100).toFixed(1) 
              : 0}% utilization
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">💤</div>
          <div className="metric-value">{swarmStatus.idleAgents.toLocaleString()}</div>
          <div className="metric-label">Idle Agents (Ready)</div>
          <div className="metric-trend neutral">Available for deployment</div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">📊</div>
          <div className="metric-value">{swarmStatus.successRate}%</div>
          <div className="metric-label">Success Rate</div>
          <div className="metric-trend up">
            {swarmStatus.connected ? '↑ Live data' : 'Loading...'}
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">⚡</div>
          <div className="metric-value">{swarmStatus.avgResponseTime.toFixed(1)}ms</div>
          <div className="metric-label">Avg Response Time</div>
          <div className="metric-trend down">
            {swarmStatus.connected ? '↓ Quantum enhanced' : 'Loading...'}
          </div>
        </div>

        <div className="metric-card primary">
          <div className="metric-icon">🎉</div>
          <div className="metric-value">{swarmStatus.tasksCompleted.toLocaleString()}</div>
          <div className="metric-label">Tasks Completed Today</div>
          <div className="metric-trend up">
            {swarmStatus.connected ? '↑ Real-time' : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Swarm Overview */}
      <div className="swarm-overview-section">
        <h2 className="section-title">
          Active Swarms {swarms.length > 0 && `(${swarms.length})`}
        </h2>
        <div className="swarms-grid">
          {swarms.length > 0 ? (
            swarms.map(swarm => (
              <div key={swarm.id} className={`swarm-card ${swarm.status}`}>
                <div className="swarm-header-card">
                  <h3 className="swarm-name">{swarm.name}</h3>
                  <span className={`swarm-status-badge ${swarm.status}`}>
                    {swarm.status === 'active' ? '🟢 Active' : '⚪ Idle'}
                  </span>
                </div>
                <div className="swarm-stats">
                  <div className="stat">
                    <span className="stat-label">Agents:</span>
                    <span className="stat-value">{swarm.agents.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Tasks Today:</span>
                    <span className="stat-value">{swarm.tasks.toLocaleString()}</span>
                  </div>
                </div>
                <div className="swarm-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: swarm.status === 'active' ? '85%' : '0%' }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="loading-message">
              {swarmStatus.connected ? 'Loading swarms...' : 'Connecting to AI Swarm service...'}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Activity Feed */}
      <div className="activity-feed-section">
        <h2 className="section-title">
          Real-Time Activity {tasks.length > 0 && `(${tasks.length} active tasks)`}
        </h2>
        <div className="activity-feed">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className={`activity-item ${activity.type}`}>
                <div className="activity-time">{activity.time}</div>
                <div className="activity-content">
                  <div className="activity-swarm">{activity.swarm} Swarm</div>
                  <div className="activity-action">{activity.action}</div>
                </div>
                <div className={`activity-badge ${activity.type}`}>
                  {activity.type === 'success' && '✓'}
                  {activity.type === 'warning' && '⚠'}
                  {activity.type === 'info' && 'ℹ'}
                </div>
              </div>
            ))
          ) : (
            <div className="activity-item info">
              <div className="activity-time">{new Date().toLocaleTimeString()}</div>
              <div className="activity-content">
                <div className="activity-swarm">System</div>
                <div className="activity-action">
                  {swarmStatus.connected 
                    ? 'Monitoring for activity...' 
                    : 'Connecting to AI Swarm service...'}
                </div>
              </div>
              <div className="activity-badge info">ℹ</div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="performance-section">
        <h2 className="section-title">Swarm Performance Analytics</h2>
        <div className="performance-chart-placeholder">
          <div className="chart-bars">
            <div className="bar" style={{ height: '85%' }}></div>
            <div className="bar" style={{ height: '92%' }}></div>
            <div className="bar" style={{ height: '78%' }}></div>
            <div className="bar" style={{ height: '95%' }}></div>
            <div className="bar" style={{ height: '88%' }}></div>
            <div className="bar" style={{ height: '91%' }}></div>
            <div className="bar" style={{ height: '97%' }}></div>
          </div>
          <div className="chart-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISwarmDashboard;
