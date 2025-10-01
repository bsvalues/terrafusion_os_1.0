import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Wrench, 
  Construction, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Gauge,
  Activity,
  Eye,
  Battery,
  Percent,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  BarChart3,
  Zap,
  Settings
} from 'lucide-react';

interface InfrastructureAsset {
  id: string;
  asset_number: string;
  asset_type: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lon: number;
  };
  address: string;
  installation_date: string;
  expected_lifespan: number;
  current_condition: string;
  condition_score: number;
  last_inspection: string;
  next_inspection: string;
  replacement_cost: number;
  annual_maintenance_cost: number;
  criticality_score: number;
  service_area: string;
  specifications: any;
}

interface WorkOrder {
  id: string;
  work_order_number: string;
  asset_id: string;
  priority: number;
  title: string;
  description: string;
  created_date: string;
  requested_by: string;
  assigned_to: string;
  estimated_hours: number;
  estimated_cost: number;
  status: string;
  due_date: string;
  completion_date?: string;
  materials_required: string[];
  safety_requirements: string[];
}

interface CapitalProject {
  id: string;
  project_number: string;
  project_name: string;
  project_type: string;
  status: string;
  description: string;
  budget_allocated: number;
  budget_spent: number;
  start_date: string;
  estimated_completion: string;
  actual_completion?: string;
  project_manager: string;
  contractor: string;
  location: string;
  assets_affected: string[];
  environmental_impact: string;
  community_impact: string;
}

interface PublicWorksStatus {
  service: string;
  status: string;
  county: string;
  public_works_director: string;
  infrastructure_overview: {
    total_assets: number;
    critical_assets: number;
    average_condition_score: number;
    road_miles: number;
    bridges_managed: number;
    water_main_miles: number;
    sewer_line_miles: number;
  };
  work_management: {
    active_work_orders: number;
    emergency_orders: number;
    total_work_orders: number;
    completion_rate: number;
  };
  capital_projects: {
    active_projects: number;
    total_projects: number;
    budget_allocated: number;
    budget_spent: number;
  };
  operations: {
    maintenance_crews: number;
    fleet_vehicles: number;
    service_areas: number;
    emergency_response_time_avg: number;
  };
  performance_metrics: {
    system_reliability: number;
    maintenance_efficiency: number;
    customer_satisfaction: number;
    budget_utilization: number;
  };
}

const PublicWorksDashboard: React.FC = () => {
  const [status, setStatus] = useState<PublicWorksStatus | null>(null);
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [projects, setProjects] = useState<CapitalProject[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch public works status
        const statusResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setStatus(statusData);
        }

        // Fetch infrastructure assets
        const assetsResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/assets');
        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          setAssets(assetsData.assets || []);
        }

        // Fetch work orders
        const workOrdersResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/work-orders');
        if (workOrdersResponse.ok) {
          const workOrdersData = await workOrdersResponse.json();
          setWorkOrders(workOrdersData.work_orders || []);
        }

        // Fetch capital projects
        const projectsResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        }
      } catch (error) {
        console.error('Error fetching public works data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'condition-excellent';
      case 'good': return 'condition-good';
      case 'fair': return 'condition-fair';
      case 'poor': return 'condition-poor';
      case 'critical': return 'condition-critical';
      case 'failed': return 'condition-failed';
      default: return 'condition-unknown';
    }
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

  const getProjectStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning': return 'project-planning';
      case 'design': return 'project-design';
      case 'construction': return 'project-construction';
      case 'completed': return 'project-completed';
      case 'on_hold': return 'project-hold';
      default: return 'project-active';
    }
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

  return (
    <div className="public-works-dashboard">
      {/* Real-time Infrastructure Overview */}
      <div className="dashboard-overview">
        <div className="overview-header">
          <h2>Benton County Infrastructure Management Dashboard</h2>
          <p>Advanced asset management, predictive maintenance, and capital project oversight</p>
        </div>

        {status && (
          <div className="performance-metrics">
            <div className="metric-card infrastructure">
              <div className="metric-icon">
                <Building className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.infrastructure_overview.total_assets}</span>
                <span className="metric-label">Infrastructure Assets</span>
                <span className="metric-status">Under Management</span>
              </div>
            </div>

            <div className="metric-card condition">
              <div className="metric-icon">
                <Gauge className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.infrastructure_overview.average_condition_score}</span>
                <span className="metric-label">Avg Condition Score</span>
                <span className="metric-status">System Health</span>
              </div>
            </div>

            <div className="metric-card critical">
              <div className="metric-icon">
                <AlertTriangle className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.infrastructure_overview.critical_assets}</span>
                <span className="metric-label">Critical Assets</span>
                <span className="metric-status">Needs Attention</span>
              </div>
            </div>

            <div className="metric-card workorders">
              <div className="metric-icon">
                <Wrench className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.work_management.active_work_orders}</span>
                <span className="metric-label">Active Work Orders</span>
                <span className="metric-status">In Progress</span>
              </div>
            </div>

            <div className="metric-card projects">
              <div className="metric-icon">
                <Construction className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.capital_projects.active_projects}</span>
                <span className="metric-label">Capital Projects</span>
                <span className="metric-status">Active Construction</span>
              </div>
            </div>

            <div className="metric-card budget">
              <div className="metric-icon">
                <DollarSign className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.performance_metrics.budget_utilization}%</span>
                <span className="metric-label">Budget Utilization</span>
                <span className="metric-status">Fiscal Management</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Infrastructure Asset Management */}
      <div className="assets-section">
        <div className="section-header">
          <h3>Infrastructure Asset Management - Real-time Monitoring</h3>
          <div className="assets-stats">
            <span className="stat-chip">
              <Building size={16} />
              {assets.length} Assets Monitored
            </span>
            <span className="stat-chip critical">
              <AlertTriangle size={16} />
              {assets.filter(a => a.current_condition === 'critical' || a.current_condition === 'poor').length} Need Attention
            </span>
            <span className="stat-chip inspection">
              <Eye size={16} />
              {assets.filter(a => new Date(a.next_inspection) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length} Due Inspection
            </span>
          </div>
        </div>

        <div className="assets-grid">
          {assets.slice(0, 8).map((asset) => (
            <div key={asset.id} className={`asset-card ${getConditionColor(asset.current_condition)}`}>
              <div className="asset-header">
                <h4 className="asset-name">{asset.name}</h4>
                <div className="asset-type-badge">{asset.asset_type.replace('_', ' ')}</div>
              </div>
              
              <div className="asset-metrics">
                <div className="condition-display">
                  <div className="condition-score">
                    <span className="score-value">{asset.condition_score.toFixed(1)}</span>
                    <span className="score-label">Condition Score</span>
                  </div>
                  <div className="condition-status">
                    <span className="status-label">Status:</span>
                    <span className="status-value">{asset.current_condition}</span>
                  </div>
                </div>
                
                <div className="asset-indicators">
                  <div className="criticality-meter">
                    <span className="criticality-label">Criticality:</span>
                    <div className="criticality-bar">
                      <div 
                        className="criticality-fill"
                        style={{ width: `${asset.criticality_score}%` }}
                      ></div>
                    </div>
                    <span className="criticality-percent">{asset.criticality_score.toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="asset-details">
                  <div className="detail-item">
                    <Calendar size={14} />
                    <span>Installed: {formatDate(asset.installation_date)}</span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={14} />
                    <span>{asset.service_area}</span>
                  </div>
                  <div className="detail-item">
                    <DollarSign size={14} />
                    <span>Replace: {formatCurrency(asset.replacement_cost)}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={14} />
                    <span>Next Inspection: {formatDate(asset.next_inspection)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Order Management */}
      <div className="work-orders-section">
        <div className="section-header">
          <h3>Work Order Management & Optimization</h3>
          <div className="work-orders-stats">
            <span className="stat-chip">
              <Wrench size={16} />
              {workOrders.length} Total Orders
            </span>
            <span className="stat-chip emergency">
              <AlertTriangle size={16} />
              {workOrders.filter(wo => wo.priority === 1).length} Emergency
            </span>
            <span className="stat-chip completed">
              <CheckCircle size={16} />
              {workOrders.filter(wo => wo.status === 'Completed').length} Completed
            </span>
          </div>
        </div>

        <div className="work-orders-grid">
          {workOrders.slice(0, 6).map((workOrder) => (
            <div key={workOrder.id} className={`work-order-card ${getPriorityColor(workOrder.priority)}`}>
              <div className="work-order-header">
                <div className="order-info">
                  <h4 className="order-title">{workOrder.title}</h4>
                  <span className="order-number">{workOrder.work_order_number}</span>
                </div>
                <div className={`priority-badge priority-${workOrder.priority}`}>
                  Priority {workOrder.priority}
                </div>
              </div>
              
              <div className="work-order-content">
                <p className="order-description">{workOrder.description}</p>
                
                <div className="order-metrics">
                  <div className="metric-row">
                    <div className="metric-item">
                      <Clock size={14} />
                      <span>{workOrder.estimated_hours}h estimated</span>
                    </div>
                    <div className="metric-item">
                      <DollarSign size={14} />
                      <span>{formatCurrency(workOrder.estimated_cost)}</span>
                    </div>
                  </div>
                  
                  <div className="assignment-info">
                    <div className="assigned-to">
                      <Users size={14} />
                      <span>Assigned: {workOrder.assigned_to}</span>
                    </div>
                    <div className="due-date">
                      <Calendar size={14} />
                      <span>Due: {formatDate(workOrder.due_date)}</span>
                    </div>
                  </div>
                  
                  <div className="order-status">
                    <span className={`status-indicator ${workOrder.status.toLowerCase()}`}>
                      {workOrder.status === 'Completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {workOrder.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capital Projects Portfolio */}
      <div className="projects-section">
        <div className="section-header">
          <h3>Capital Projects Portfolio - Multi-Million Dollar Infrastructure</h3>
          <div className="projects-stats">
            <span className="stat-chip">
              <Construction size={16} />
              {projects.length} Active Projects
            </span>
            <span className="stat-chip budget">
              <DollarSign size={16} />
              {formatCurrency(projects.reduce((sum, p) => sum + p.budget_allocated, 0))} Total Budget
            </span>
            <span className="stat-chip progress">
              <TrendingUp size={16} />
              {((projects.reduce((sum, p) => sum + p.budget_spent, 0) / projects.reduce((sum, p) => sum + p.budget_allocated, 0)) * 100).toFixed(1)}% Spent
            </span>
          </div>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className={`project-card ${getProjectStatusColor(project.status)}`}>
              <div className="project-header">
                <h4 className="project-name">{project.project_name}</h4>
                <div className="project-type-badge">{project.project_type}</div>
              </div>
              
              <div className="project-status-bar">
                <div className={`status-indicator ${project.status.toLowerCase()}`}>
                  {project.status.replace('_', ' ').toUpperCase()}
                </div>
                <span className="project-number">{project.project_number}</span>
              </div>
              
              <div className="project-content">
                <p className="project-description">{project.description}</p>
                
                <div className="budget-display">
                  <div className="budget-allocated">
                    <span className="budget-label">Allocated:</span>
                    <span className="budget-amount">{formatCurrency(project.budget_allocated)}</span>
                  </div>
                  <div className="budget-spent">
                    <span className="budget-label">Spent:</span>
                    <span className="budget-amount">{formatCurrency(project.budget_spent)}</span>
                  </div>
                  <div className="budget-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(project.budget_spent / project.budget_allocated) * 100}%` }}
                      ></div>
                    </div>
                    <span className="progress-percent">
                      {((project.budget_spent / project.budget_allocated) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="project-details">
                  <div className="detail-row">
                    <span>Manager: {project.project_manager}</span>
                  </div>
                  <div className="detail-row">
                    <span>Contractor: {project.contractor}</span>
                  </div>
                  <div className="detail-row">
                    <Calendar size={12} />
                    <span>Completion: {formatDate(project.estimated_completion)}</span>
                  </div>
                  <div className="detail-row">
                    <MapPin size={12} />
                    <span>{project.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Performance Metrics */}
      {status && (
        <div className="performance-section">
          <div className="section-header">
            <h3>Operational Performance & System Analytics</h3>
          </div>
          
          <div className="performance-grid">
            <div className="performance-card reliability">
              <div className="performance-icon">
                <Activity size={32} />
              </div>
              <div className="performance-data">
                <span className="performance-value">{status.performance_metrics.system_reliability}%</span>
                <span className="performance-label">System Reliability</span>
                <span className="performance-trend">↗ +2.1% this month</span>
              </div>
            </div>

            <div className="performance-card efficiency">
              <div className="performance-icon">
                <Zap size={32} />
              </div>
              <div className="performance-data">
                <span className="performance-value">{status.performance_metrics.maintenance_efficiency}%</span>
                <span className="performance-label">Maintenance Efficiency</span>
                <span className="performance-trend">↗ +1.8% this month</span>
              </div>
            </div>

            <div className="performance-card satisfaction">
              <div className="performance-icon">
                <Users size={32} />
              </div>
              <div className="performance-data">
                <span className="performance-value">{status.performance_metrics.customer_satisfaction}%</span>
                <span className="performance-label">Customer Satisfaction</span>
                <span className="performance-trend">↗ +0.9% this month</span>
              </div>
            </div>

            <div className="performance-card response">
              <div className="performance-icon">
                <Clock size={32} />
              </div>
              <div className="performance-data">
                <span className="performance-value">{status.operations.emergency_response_time_avg}</span>
                <span className="performance-label">Avg Response Time (min)</span>
                <span className="performance-trend">↘ -3.2min this month</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure Management Controls */}
      <div className="controls-section">
        <div className="section-header">
          <h3>Infrastructure Management Controls</h3>
        </div>
        
        <div className="controls-grid">
          <button className="control-btn asset-inspection">
            <Eye size={20} />
            <span>Schedule Inspections</span>
          </button>
          <button className="control-btn work-order-create">
            <Wrench size={20} />
            <span>Create Work Order</span>
          </button>
          <button className="control-btn maintenance-optimize">
            <Settings size={20} />
            <span>Optimize Maintenance</span>
          </button>
          <button className="control-btn project-planning">
            <Construction size={20} />
            <span>Project Planning</span>
          </button>
          <button className="control-btn budget-analysis">
            <DollarSign size={20} />
            <span>Budget Analysis</span>
          </button>
          <button className="control-btn performance-report">
            <BarChart3 size={20} />
            <span>Performance Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicWorksDashboard;