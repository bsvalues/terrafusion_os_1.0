import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  FileText,
  Camera,
  Route,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Zap,
  Target,
  Gauge
} from 'lucide-react';

interface WorkOrder {
  id: string;
  work_order_number: string;
  asset_id: string;
  asset_name: string;
  priority: number;
  title: string;
  description: string;
  created_date: string;
  requested_by: string;
  assigned_to: string;
  estimated_hours: number;
  estimated_cost: number;
  actual_hours?: number;
  actual_cost?: number;
  status: string;
  due_date: string;
  completion_date?: string;
  materials_required: string[];
  safety_requirements: string[];
  location: {
    lat: number;
    lon: number;
  };
  address: string;
  progress_percentage: number;
  work_type: string;
  department: string;
  customer_impact: string;
  notes: string[];
}

interface WorkOrderMetrics {
  total_work_orders: number;
  active_work_orders: number;
  completed_work_orders: number;
  overdue_work_orders: number;
  emergency_orders: number;
  completion_rate: number;
  average_completion_time: number;
  total_cost_estimate: number;
  total_actual_cost: number;
  efficiency_rating: number;
}

interface OptimizationSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  estimated_savings: number;
  implementation_effort: string;
  work_orders_affected: string[];
}

const WorkOrderManagement: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [metrics, setMetrics] = useState<WorkOrderMetrics | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    work_type: '',
    date_range: ['', ''],
    cost_range: [0, 1000000]
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch work orders
        const workOrdersResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/work-orders');
        if (workOrdersResponse.ok) {
          const workOrdersData = await workOrdersResponse.json();
          setWorkOrders(workOrdersData.work_orders || []);
          setFilteredWorkOrders(workOrdersData.work_orders || []);
        }

        // Fetch metrics
        const metricsResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/work-orders/metrics');
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setMetrics(metricsData);
        }

        // Fetch optimization suggestions
        const optimizationResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/work-orders/optimization');
        if (optimizationResponse.ok) {
          const optimizationData = await optimizationResponse.json();
          setOptimizationSuggestions(optimizationData.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching work order data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workOrders, searchTerm, filters]);

  const applyFilters = () => {
    let filtered = [...workOrders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(wo =>
        wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.work_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(wo => wo.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(wo => wo.priority.toString() === filters.priority);
    }

    // Assigned to filter
    if (filters.assigned_to) {
      filtered = filtered.filter(wo => wo.assigned_to === filters.assigned_to);
    }

    // Work type filter
    if (filters.work_type) {
      filtered = filtered.filter(wo => wo.work_type === filters.work_type);
    }

    setFilteredWorkOrders(filtered);
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

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Emergency';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      case 5: return 'Routine';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'status-new';
      case 'assigned': return 'status-assigned';
      case 'in_progress': return 'status-progress';
      case 'on_hold': return 'status-hold';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
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

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'Completed' && status !== 'Cancelled';
  };

  const getWorkOrdersByStatus = (status: string) => {
    return filteredWorkOrders.filter(wo => wo.status === status);
  };

  const uniqueStatuses = [...new Set(workOrders.map(wo => wo.status))];
  const uniqueAssignees = [...new Set(workOrders.map(wo => wo.assigned_to))];
  const uniqueWorkTypes = [...new Set(workOrders.map(wo => wo.work_type))];

  const kanbanColumns = [
    { id: 'New', title: 'New', status: 'New' },
    { id: 'Assigned', title: 'Assigned', status: 'Assigned' },
    { id: 'In_Progress', title: 'In Progress', status: 'In_Progress' },
    { id: 'Completed', title: 'Completed', status: 'Completed' }
  ];

  return (
    <div className="work-order-management">
      {/* Work Order Management Header */}
      <div className="work-order-header">
        <div className="header-content">
          <h2>Work Order Management & Optimization</h2>
          <p>Intelligent work order scheduling, route optimization, and predictive maintenance coordination</p>
          
          {metrics && (
            <div className="metrics-overview">
              <div className="metric-card total">
                <div className="metric-icon">
                  <Wrench size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{metrics.total_work_orders}</span>
                  <span className="metric-label">Total Work Orders</span>
                  <span className="metric-trend">System-wide</span>
                </div>
              </div>

              <div className="metric-card active">
                <div className="metric-icon">
                  <Activity size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{metrics.active_work_orders}</span>
                  <span className="metric-label">Active Orders</span>
                  <span className="metric-trend">In Progress</span>
                </div>
              </div>

              <div className="metric-card emergency">
                <div className="metric-icon">
                  <AlertTriangle size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{metrics.emergency_orders}</span>
                  <span className="metric-label">Emergency Orders</span>
                  <span className="metric-trend">Critical Priority</span>
                </div>
              </div>

              <div className="metric-card completion">
                <div className="metric-icon">
                  <Target size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{metrics.completion_rate.toFixed(1)}%</span>
                  <span className="metric-label">Completion Rate</span>
                  <span className="metric-trend">Performance KPI</span>
                </div>
              </div>

              <div className="metric-card efficiency">
                <div className="metric-icon">
                  <Gauge size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{metrics.efficiency_rating.toFixed(1)}</span>
                  <span className="metric-label">Efficiency Rating</span>
                  <span className="metric-trend">ML Optimization</span>
                </div>
              </div>

              <div className="metric-card cost">
                <div className="metric-icon">
                  <DollarSign size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{formatCurrency(metrics.total_actual_cost)}</span>
                  <span className="metric-label">Total Cost</span>
                  <span className="metric-trend">Fiscal Management</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="header-controls">
          <button className="control-btn optimize">
            <Route size={16} />
            Optimize Routes
          </button>
          <button className="control-btn refresh" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="control-btn export">
            <Download size={16} />
            Export
          </button>
          <button 
            className="control-btn primary create"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create Work Order
          </button>
        </div>
      </div>

      {/* Optimization Suggestions */}
      {optimizationSuggestions.length > 0 && (
        <div className="optimization-section">
          <div className="section-header">
            <h3>AI-Powered Optimization Suggestions</h3>
            <p>Machine learning recommendations for improved efficiency and cost savings</p>
          </div>
          
          <div className="optimization-grid">
            {optimizationSuggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className={`optimization-card ${suggestion.type}`}>
                <div className="optimization-header">
                  <div className="optimization-type">
                    {suggestion.type === 'route' && <Route size={20} />}
                    {suggestion.type === 'scheduling' && <Calendar size={20} />}
                    {suggestion.type === 'resource' && <Users size={20} />}
                    {suggestion.type === 'cost' && <DollarSign size={20} />}
                    <span>{suggestion.type} Optimization</span>
                  </div>
                  <div className="impact-badge">
                    {suggestion.impact} Impact
                  </div>
                </div>
                
                <div className="optimization-content">
                  <h4>{suggestion.title}</h4>
                  <p>{suggestion.description}</p>
                  
                  <div className="optimization-metrics">
                    <div className="metric">
                      <span className="metric-label">Estimated Savings:</span>
                      <span className="metric-value">{formatCurrency(suggestion.estimated_savings)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Implementation:</span>
                      <span className="metric-value">{suggestion.implementation_effort}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Work Orders Affected:</span>
                      <span className="metric-value">{suggestion.work_orders_affected.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="optimization-actions">
                  <button className="action-btn implement">
                    <Zap size={14} />
                    Implement
                  </button>
                  <button className="action-btn details">
                    <Eye size={14} />
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="controls-section">
        <div className="search-controls">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search work orders by title, number, asset, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        <div className="view-controls">
          <div className="view-mode">
            <button 
              className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>

          <div className="quick-filters">
            <button className="quick-filter emergency">
              <AlertTriangle size={14} />
              Emergency
            </button>
            <button className="quick-filter overdue">
              <Clock size={14} />
              Overdue
            </button>
            <button className="quick-filter today">
              <Calendar size={14} />
              Due Today
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Priority</label>
              <select 
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
              >
                <option value="">All Priorities</option>
                <option value="1">Emergency</option>
                <option value="2">High</option>
                <option value="3">Medium</option>
                <option value="4">Low</option>
                <option value="5">Routine</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Assigned To</label>
              <select 
                value={filters.assigned_to}
                onChange={(e) => setFilters({...filters, assigned_to: e.target.value})}
              >
                <option value="">All Assignees</option>
                {uniqueAssignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Work Type</label>
              <select 
                value={filters.work_type}
                onChange={(e) => setFilters({...filters, work_type: e.target.value})}
              >
                <option value="">All Types</option>
                {uniqueWorkTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="clear-filters"
              onClick={() => setFilters({
                status: '',
                priority: '',
                assigned_to: '',
                work_type: '',
                date_range: ['', ''],
                cost_range: [0, 1000000]
              })}
            >
              Clear Filters
            </button>
            <span className="results-count">
              Showing {filteredWorkOrders.length} of {workOrders.length} work orders
            </span>
          </div>
        </div>
      )}

      {/* Work Order Display */}
      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading work orders...</p>
        </div>
      ) : (
        <div className={`work-orders-display ${viewMode}`}>
          {viewMode === 'kanban' && (
            <div className="kanban-board">
              {kanbanColumns.map((column) => (
                <div key={column.id} className={`kanban-column ${column.status.toLowerCase()}`}>
                  <div className="column-header">
                    <h4>{column.title}</h4>
                    <span className="count">{getWorkOrdersByStatus(column.status).length}</span>
                  </div>
                  
                  <div className="column-content">
                    {getWorkOrdersByStatus(column.status).map((workOrder) => (
                      <div 
                        key={workOrder.id} 
                        className={`work-order-card ${getPriorityColor(workOrder.priority)} ${isOverdue(workOrder.due_date, workOrder.status) ? 'overdue' : ''}`}
                        onClick={() => setSelectedWorkOrder(workOrder)}
                      >
                        <div className="card-header">
                          <div className="order-info">
                            <h5>{workOrder.title}</h5>
                            <span className="order-number">{workOrder.work_order_number}</span>
                          </div>
                          <div className={`priority-badge priority-${workOrder.priority}`}>
                            {getPriorityLabel(workOrder.priority)}
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <p className="description">{workOrder.description}</p>
                          
                          <div className="card-metrics">
                            <div className="metric">
                              <Users size={12} />
                              <span>{workOrder.assigned_to}</span>
                            </div>
                            <div className="metric">
                              <Calendar size={12} />
                              <span>Due: {formatDate(workOrder.due_date)}</span>
                            </div>
                            <div className="metric">
                              <DollarSign size={12} />
                              <span>{formatCurrency(workOrder.estimated_cost)}</span>
                            </div>
                            <div className="metric">
                              <Clock size={12} />
                              <span>{workOrder.estimated_hours}h</span>
                            </div>
                          </div>
                          
                          {workOrder.status === 'In_Progress' && (
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${workOrder.progress_percentage}%` }}
                              ></div>
                              <span className="progress-text">{workOrder.progress_percentage}%</span>
                            </div>
                          )}
                          
                          <div className="asset-info">
                            <span className="asset-name">{workOrder.asset_name}</span>
                          </div>
                        </div>
                        
                        <div className="card-footer">
                          <button className="action-btn">
                            <Eye size={12} />
                          </button>
                          <button className="action-btn">
                            <Edit3 size={12} />
                          </button>
                          <button className="action-btn">
                            <MoreVertical size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="work-orders-list">
              <div className="list-header">
                <div className="column order-info">Work Order</div>
                <div className="column priority">Priority</div>
                <div className="column status">Status</div>
                <div className="column assigned">Assigned To</div>
                <div className="column asset">Asset</div>
                <div className="column due-date">Due Date</div>
                <div className="column cost">Cost</div>
                <div className="column progress">Progress</div>
                <div className="column actions">Actions</div>
              </div>

              {filteredWorkOrders.map((workOrder) => (
                <div 
                  key={workOrder.id} 
                  className={`list-row ${getPriorityColor(workOrder.priority)} ${getStatusColor(workOrder.status)} ${isOverdue(workOrder.due_date, workOrder.status) ? 'overdue' : ''}`}
                >
                  <div className="column order-info">
                    <div className="order-details">
                      <strong>{workOrder.title}</strong>
                      <span className="order-number">{workOrder.work_order_number}</span>
                    </div>
                  </div>
                  
                  <div className="column priority">
                    <span className={`priority-badge priority-${workOrder.priority}`}>
                      {getPriorityLabel(workOrder.priority)}
                    </span>
                  </div>
                  
                  <div className="column status">
                    <span className={`status-badge ${getStatusColor(workOrder.status)}`}>
                      {workOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="column assigned">
                    <span>{workOrder.assigned_to}</span>
                  </div>
                  
                  <div className="column asset">
                    <span>{workOrder.asset_name}</span>
                  </div>
                  
                  <div className="column due-date">
                    <span className={isOverdue(workOrder.due_date, workOrder.status) ? 'overdue-text' : ''}>
                      {formatDate(workOrder.due_date)}
                    </span>
                  </div>
                  
                  <div className="column cost">
                    <span>{formatCurrency(workOrder.estimated_cost)}</span>
                  </div>
                  
                  <div className="column progress">
                    {workOrder.status === 'In_Progress' ? (
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${workOrder.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span>{workOrder.progress_percentage}%</span>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  
                  <div className="column actions">
                    <button className="action-btn" onClick={() => setSelectedWorkOrder(workOrder)}>
                      <Eye size={14} />
                    </button>
                    <button className="action-btn">
                      <Edit3 size={14} />
                    </button>
                    <button className="action-btn">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'calendar' && (
            <div className="work-orders-calendar">
              <div className="calendar-placeholder">
                <Calendar size={48} />
                <h3>Work Order Calendar</h3>
                <p>Interactive calendar view showing work order schedules, deadlines, and resource allocation</p>
                <p>Drag-and-drop scheduling with conflict detection and optimization suggestions</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Work Order Detail Modal */}
      {selectedWorkOrder && (
        <div className="work-order-modal-overlay" onClick={() => setSelectedWorkOrder(null)}>
          <div className="work-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-info">
                <h3>{selectedWorkOrder.title}</h3>
                <span className="order-number">{selectedWorkOrder.work_order_number}</span>
              </div>
              <div className="header-badges">
                <span className={`priority-badge priority-${selectedWorkOrder.priority}`}>
                  {getPriorityLabel(selectedWorkOrder.priority)}
                </span>
                <span className={`status-badge ${getStatusColor(selectedWorkOrder.status)}`}>
                  {selectedWorkOrder.status.replace('_', ' ')}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedWorkOrder(null)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="work-order-detail-tabs">
                <button className="tab-btn active">Overview</button>
                <button className="tab-btn">Progress</button>
                <button className="tab-btn">Materials</button>
                <button className="tab-btn">Safety</button>
                <button className="tab-btn">History</button>
              </div>
              
              <div className="work-order-detail-content">
                <div className="detail-section">
                  <h4>Work Order Details</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Asset:</label>
                      <span>{selectedWorkOrder.asset_name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Location:</label>
                      <span>{selectedWorkOrder.address}</span>
                    </div>
                    <div className="detail-item">
                      <label>Work Type:</label>
                      <span>{selectedWorkOrder.work_type}</span>
                    </div>
                    <div className="detail-item">
                      <label>Department:</label>
                      <span>{selectedWorkOrder.department}</span>
                    </div>
                    <div className="detail-item">
                      <label>Requested By:</label>
                      <span>{selectedWorkOrder.requested_by}</span>
                    </div>
                    <div className="detail-item">
                      <label>Assigned To:</label>
                      <span>{selectedWorkOrder.assigned_to}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedWorkOrder.description}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Estimates vs Actuals</h4>
                  <div className="estimates-grid">
                    <div className="estimate-item">
                      <label>Estimated Hours:</label>
                      <span>{selectedWorkOrder.estimated_hours}h</span>
                    </div>
                    <div className="estimate-item">
                      <label>Actual Hours:</label>
                      <span>{selectedWorkOrder.actual_hours || 'TBD'}h</span>
                    </div>
                    <div className="estimate-item">
                      <label>Estimated Cost:</label>
                      <span>{formatCurrency(selectedWorkOrder.estimated_cost)}</span>
                    </div>
                    <div className="estimate-item">
                      <label>Actual Cost:</label>
                      <span>{selectedWorkOrder.actual_cost ? formatCurrency(selectedWorkOrder.actual_cost) : 'TBD'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="action-btn primary">
                <Edit3 size={16} />
                Update Status
              </button>
              <button className="action-btn">
                <Camera size={16} />
                Add Photo
              </button>
              <button className="action-btn">
                <FileText size={16} />
                Add Note
              </button>
              <button className="action-btn">
                <MapPin size={16} />
                View Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderManagement;