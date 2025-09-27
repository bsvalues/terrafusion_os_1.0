import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
  Settings,
  Zap,
  Target,
  Route,
  Battery,
  Activity,
  BarChart3,
  Gauge,
  RefreshCw,
  Plus,
  Filter,
  Download,
  MapPin,
  DollarSign
} from 'lucide-react';

interface MaintenanceTask {
  id: string;
  task_id: string;
  asset_id: string;
  asset_name: string;
  task_type: string;
  maintenance_type: string;
  priority: number;
  description: string;
  estimated_duration: number;
  estimated_cost: number;
  required_skills: string[];
  required_equipment: string[];
  safety_requirements: string[];
  scheduled_date: string;
  assigned_crew: string;
  status: string;
  completion_percentage: number;
  predictive_score: number;
  failure_risk: number;
  condition_trigger: string;
  location: {
    lat: number;
    lon: number;
  };
  address: string;
}

interface MaintenanceSchedule {
  total_tasks: number;
  scheduled_tasks: number;
  overdue_tasks: number;
  completed_tasks: number;
  predictive_tasks: number;
  preventive_tasks: number;
  emergency_tasks: number;
  optimization_score: number;
  cost_efficiency: number;
  schedule_adherence: number;
}

interface PredictiveInsight {
  id: string;
  asset_id: string;
  asset_name: string;
  prediction_type: string;
  failure_probability: number;
  recommended_action: string;
  time_to_failure: string;
  cost_impact: number;
  confidence_level: number;
  data_sources: string[];
}

const MaintenanceScheduling: React.FC = () => {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'crew'>('calendar');
  const [optimizationMode, setOptimizationMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch maintenance tasks
        const tasksResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/maintenance/schedule');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setMaintenanceTasks(tasksData.tasks || []);
        }

        // Fetch schedule metrics
        const scheduleResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/maintenance/metrics');
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setSchedule(scheduleData);
        }

        // Fetch predictive insights
        const insightsResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/maintenance/predictive');
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          setPredictiveInsights(insightsData.insights || []);
        }
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getTasksByDate = (date: string) => {
    return maintenanceTasks.filter(task => 
      task.scheduled_date.split('T')[0] === date
    );
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'priority-emergency';
      case 2: return 'priority-high';
      case 3: return 'priority-medium';
      case 4: return 'priority-low';
      case 5: return 'priority-routine';
      default: return 'priority-unknown';
    }
  };

  const getMaintenanceTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'predictive': return 'maintenance-predictive';
      case 'preventive': return 'maintenance-preventive';
      case 'corrective': return 'maintenance-corrective';
      case 'emergency': return 'maintenance-emergency';
      default: return 'maintenance-routine';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const tasksForDay = getTasksByDate(dateString);
      
      days.push({
        date: day,
        dateString: dateString,
        tasks: tasksForDay,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return days;
  };

  return (
    <div className="maintenance-scheduling">
      {/* Maintenance Scheduling Header */}
      <div className="maintenance-header">
        <div className="header-content">
          <h2>Predictive Maintenance Scheduling & Optimization</h2>
          <p>AI-powered maintenance scheduling with predictive analytics and resource optimization</p>
          
          {schedule && (
            <div className="schedule-metrics">
              <div className="metric-card total">
                <div className="metric-icon">
                  <Wrench size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{schedule.total_tasks}</span>
                  <span className="metric-label">Total Tasks</span>
                  <span className="metric-trend">Scheduled</span>
                </div>
              </div>

              <div className="metric-card predictive">
                <div className="metric-icon">
                  <Zap size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{schedule.predictive_tasks}</span>
                  <span className="metric-label">Predictive Tasks</span>
                  <span className="metric-trend">AI-Driven</span>
                </div>
              </div>

              <div className="metric-card optimization">
                <div className="metric-icon">
                  <Target size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{schedule.optimization_score.toFixed(1)}</span>
                  <span className="metric-label">Optimization Score</span>
                  <span className="metric-trend">ML Algorithm</span>
                </div>
              </div>

              <div className="metric-card efficiency">
                <div className="metric-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{schedule.cost_efficiency.toFixed(1)}%</span>
                  <span className="metric-label">Cost Efficiency</span>
                  <span className="metric-trend">Resource Optimization</span>
                </div>
              </div>

              <div className="metric-card adherence">
                <div className="metric-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{schedule.schedule_adherence.toFixed(1)}%</span>
                  <span className="metric-label">Schedule Adherence</span>
                  <span className="metric-trend">Performance KPI</span>
                </div>
              </div>

              <div className="metric-card overdue">
                <div className="metric-icon">
                  <AlertTriangle size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{schedule.overdue_tasks}</span>
                  <span className="metric-label">Overdue Tasks</span>
                  <span className="metric-trend">Requires Attention</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="header-controls">
          <button 
            className={`control-btn optimize ${optimizationMode ? 'active' : ''}`}
            onClick={() => setOptimizationMode(!optimizationMode)}
          >
            <Route size={16} />
            Auto-Optimize
          </button>
          <button className="control-btn refresh" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="control-btn export">
            <Download size={16} />
            Export Schedule
          </button>
          <button className="control-btn primary create">
            <Plus size={16} />
            Schedule Task
          </button>
        </div>
      </div>

      {/* Predictive Maintenance Insights */}
      {predictiveInsights.length > 0 && (
        <div className="predictive-insights">
          <div className="section-header">
            <h3>AI Predictive Maintenance Insights</h3>
            <p>Machine learning analysis predicting equipment failures and maintenance needs</p>
          </div>
          
          <div className="insights-grid">
            {predictiveInsights.slice(0, 4).map((insight) => (
              <div key={insight.id} className={`insight-card ${insight.failure_probability >= 70 ? 'high-risk' : insight.failure_probability >= 40 ? 'medium-risk' : 'low-risk'}`}>
                <div className="insight-header">
                  <div className="asset-info">
                    <h4>{insight.asset_name}</h4>
                    <span className="prediction-type">{insight.prediction_type}</span>
                  </div>
                  <div className="risk-indicator">
                    <Gauge size={20} />
                    <span>{insight.failure_probability.toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="insight-content">
                  <div className="failure-analysis">
                    <div className="analysis-item">
                      <label>Risk Level:</label>
                      <span className={`risk-level ${getRiskLevel(insight.failure_probability).toLowerCase().replace(' ', '-')}`}>
                        {getRiskLevel(insight.failure_probability)}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <label>Time to Failure:</label>
                      <span className="time-estimate">{insight.time_to_failure}</span>
                    </div>
                    <div className="analysis-item">
                      <label>Cost Impact:</label>
                      <span className="cost-impact">{formatCurrency(insight.cost_impact)}</span>
                    </div>
                    <div className="analysis-item">
                      <label>Confidence:</label>
                      <span className="confidence">{insight.confidence_level.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="recommended-action">
                    <label>Recommended Action:</label>
                    <p>{insight.recommended_action}</p>
                  </div>
                  
                  <div className="data-sources">
                    <label>Data Sources:</label>
                    <div className="sources-list">
                      {insight.data_sources.map((source, index) => (
                        <span key={index} className="source-tag">{source}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="insight-actions">
                  <button className="action-btn schedule">
                    <Calendar size={14} />
                    Schedule Now
                  </button>
                  <button className="action-btn details">
                    <BarChart3 size={14} />
                    View Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Controls */}
      <div className="view-controls">
        <div className="view-mode">
          <button 
            className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar size={16} />
            Calendar
          </button>
          <button 
            className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <Activity size={16} />
            Timeline
          </button>
          <button 
            className={`view-btn ${viewMode === 'crew' ? 'active' : ''}`}
            onClick={() => setViewMode('crew')}
          >
            <Users size={16} />
            Crew View
          </button>
        </div>

        <div className="date-navigation">
          <button className="nav-btn">‹</button>
          <span className="current-month">September 2025</span>
          <button className="nav-btn">›</button>
        </div>
      </div>

      {/* Maintenance Schedule Display */}
      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading maintenance schedule...</p>
        </div>
      ) : (
        <div className={`schedule-display ${viewMode}`}>
          {viewMode === 'calendar' && (
            <div className="calendar-view">
              <div className="calendar-header">
                <div className="day-header">Sun</div>
                <div className="day-header">Mon</div>
                <div className="day-header">Tue</div>
                <div className="day-header">Wed</div>
                <div className="day-header">Thu</div>
                <div className="day-header">Fri</div>
                <div className="day-header">Sat</div>
              </div>
              
              <div className="calendar-grid">
                {generateCalendarDays().map((day, index) => (
                  <div 
                    key={index} 
                    className={`calendar-day ${day?.isToday ? 'today' : ''} ${day?.tasks.length ? 'has-tasks' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="day-number">{day.date}</div>
                        <div className="day-tasks">
                          {day.tasks.slice(0, 3).map((task) => (
                            <div 
                              key={task.id} 
                              className={`task-item ${getPriorityColor(task.priority)} ${getMaintenanceTypeColor(task.maintenance_type)}`}
                            >
                              <span className="task-title">{task.asset_name}</span>
                              <span className="task-type">{task.maintenance_type}</span>
                            </div>
                          ))}
                          {day.tasks.length > 3 && (
                            <div className="more-tasks">+{day.tasks.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="timeline-view">
              <div className="timeline-header">
                <h3>Maintenance Timeline - Next 30 Days</h3>
                <div className="timeline-filters">
                  <button className="filter-btn">All Types</button>
                  <button className="filter-btn predictive">Predictive</button>
                  <button className="filter-btn preventive">Preventive</button>
                  <button className="filter-btn emergency">Emergency</button>
                </div>
              </div>
              
              <div className="timeline-content">
                {maintenanceTasks.slice(0, 10).map((task) => (
                  <div key={task.id} className={`timeline-item ${getMaintenanceTypeColor(task.maintenance_type)}`}>
                    <div className="timeline-marker">
                      <div className={`marker-dot ${getPriorityColor(task.priority)}`}></div>
                      <div className="marker-line"></div>
                    </div>
                    
                    <div className="timeline-content-box">
                      <div className="task-header">
                        <h4>{task.asset_name}</h4>
                        <div className="task-badges">
                          <span className={`type-badge ${getMaintenanceTypeColor(task.maintenance_type)}`}>
                            {task.maintenance_type}
                          </span>
                          <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                            Priority {task.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="task-details">
                        <p>{task.description}</p>
                        
                        <div className="task-meta">
                          <div className="meta-item">
                            <Calendar size={12} />
                            <span>{formatDate(task.scheduled_date)}</span>
                          </div>
                          <div className="meta-item">
                            <Clock size={12} />
                            <span>{task.estimated_duration}h</span>
                          </div>
                          <div className="meta-item">
                            <DollarSign size={12} />
                            <span>{formatCurrency(task.estimated_cost)}</span>
                          </div>
                          <div className="meta-item">
                            <Users size={12} />
                            <span>{task.assigned_crew}</span>
                          </div>
                          <div className="meta-item">
                            <MapPin size={12} />
                            <span>{task.address}</span>
                          </div>
                        </div>
                        
                        {task.predictive_score > 0 && (
                          <div className="predictive-info">
                            <Battery size={12} />
                            <span>Predictive Score: {task.predictive_score.toFixed(1)}/10</span>
                            <span>Failure Risk: {task.failure_risk.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="task-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${task.completion_percentage}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{task.completion_percentage}% Complete</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'crew' && (
            <div className="crew-view">
              <div className="crew-header">
                <h3>Crew Scheduling & Resource Allocation</h3>
                <p>Optimized crew assignments and workload distribution</p>
              </div>
              
              <div className="crew-assignments">
                {[...new Set(maintenanceTasks.map(t => t.assigned_crew))].map((crew) => (
                  <div key={crew} className="crew-section">
                    <div className="crew-header-info">
                      <h4>{crew}</h4>
                      <div className="crew-stats">
                        <span className="stat">
                          {maintenanceTasks.filter(t => t.assigned_crew === crew).length} Tasks
                        </span>
                        <span className="stat">
                          {maintenanceTasks.filter(t => t.assigned_crew === crew).reduce((sum, t) => sum + t.estimated_duration, 0)}h Total
                        </span>
                        <span className="stat">
                          {formatCurrency(maintenanceTasks.filter(t => t.assigned_crew === crew).reduce((sum, t) => sum + t.estimated_cost, 0))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="crew-tasks">
                      {maintenanceTasks.filter(t => t.assigned_crew === crew).slice(0, 5).map((task) => (
                        <div key={task.id} className={`crew-task ${getMaintenanceTypeColor(task.maintenance_type)}`}>
                          <div className="task-info">
                            <h5>{task.asset_name}</h5>
                            <span className="task-description">{task.description}</span>
                          </div>
                          
                          <div className="task-schedule">
                            <span className="schedule-date">{formatDate(task.scheduled_date)}</span>
                            <span className="schedule-duration">{task.estimated_duration}h</span>
                          </div>
                          
                          <div className="task-status">
                            <span className={`status-indicator ${task.status.toLowerCase()}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optimization Panel */}
      {optimizationMode && (
        <div className="optimization-panel">
          <div className="panel-header">
            <h3>Schedule Optimization Assistant</h3>
            <button 
              className="close-panel"
              onClick={() => setOptimizationMode(false)}
            >
              ×
            </button>
          </div>
          
          <div className="optimization-content">
            <div className="optimization-suggestions">
              <h4>AI Optimization Suggestions</h4>
              <div className="suggestion-list">
                <div className="suggestion-item">
                  <Route size={16} />
                  <span>Optimize crew routes to reduce travel time by 15%</span>
                  <button className="apply-btn">Apply</button>
                </div>
                <div className="suggestion-item">
                  <Calendar size={16} />
                  <span>Reschedule 3 tasks to balance workload across crews</span>
                  <button className="apply-btn">Apply</button>
                </div>
                <div className="suggestion-item">
                  <DollarSign size={16} />
                  <span>Combine 5 nearby tasks to reduce costs by $2,400</span>
                  <button className="apply-btn">Apply</button>
                </div>
              </div>
            </div>
            
            <div className="optimization-metrics">
              <h4>Optimization Impact</h4>
              <div className="impact-metrics">
                <div className="impact-item">
                  <label>Cost Reduction:</label>
                  <span className="positive">-$8,500</span>
                </div>
                <div className="impact-item">
                  <label>Time Savings:</label>
                  <span className="positive">-12.5 hours</span>
                </div>
                <div className="impact-item">
                  <label>Efficiency Gain:</label>
                  <span className="positive">+18%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceScheduling;