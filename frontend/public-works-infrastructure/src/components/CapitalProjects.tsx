import React, { useState, useEffect } from 'react';
import { 
  Construction,
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  Zap,
  Settings,
  Eye,
  Edit3,
  Download,
  Upload,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Activity,
  Gauge,
  Building,
  Route,
  Layers
} from 'lucide-react';

interface CapitalProject {
  id: string;
  project_number: string;
  project_name: string;
  project_type: string;
  status: string;
  phase: string;
  description: string;
  budget_allocated: number;
  budget_spent: number;
  budget_remaining: number;
  start_date: string;
  estimated_completion: string;
  actual_completion?: string;
  percent_complete: number;
  project_manager: string;
  contractor: string;
  location: string;
  assets_affected: string[];
  environmental_impact: string;
  community_impact: string;
  funding_sources: {
    source: string;
    amount: number;
    percentage: number;
  }[];
  milestones: {
    id: string;
    name: string;
    target_date: string;
    completion_date?: string;
    status: string;
    budget_allocation: number;
  }[];
  risks: {
    id: string;
    description: string;
    probability: number;
    impact: number;
    mitigation: string;
    status: string;
  }[];
  performance_metrics: {
    schedule_performance: number;
    cost_performance: number;
    quality_score: number;
    safety_score: number;
  };
}

interface ProjectPortfolio {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  on_hold_projects: number;
  total_budget: number;
  spent_budget: number;
  remaining_budget: number;
  average_completion: number;
  on_schedule_projects: number;
  over_budget_projects: number;
  performance_index: number;
}

interface BudgetAnalysis {
  fiscal_year: string;
  allocated_budget: number;
  committed_budget: number;
  spent_budget: number;
  forecasted_spend: number;
  variance: number;
  quarterly_breakdown: {
    quarter: string;
    allocated: number;
    spent: number;
    forecast: number;
  }[];
  category_breakdown: {
    category: string;
    allocated: number;
    spent: number;
    percentage: number;
  }[];
}

const CapitalProjects: React.FC = () => {
  const [projects, setProjects] = useState<CapitalProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<CapitalProject[]>([]);
  const [portfolio, setPortfolio] = useState<ProjectPortfolio | null>(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null>(null);
  const [selectedProject, setSelectedProject] = useState<CapitalProject | null>(null);
  const [viewMode, setViewMode] = useState<'portfolio' | 'gantt' | 'budget'>('portfolio');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState({
    status: '',
    project_type: '',
    phase: '',
    budget_range: [0, 100000000],
    completion_range: [0, 100]
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch capital projects
        const projectsResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
          setFilteredProjects(projectsData.projects || []);
        }

        // Fetch portfolio metrics
        const portfolioResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/projects/portfolio');
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          setPortfolio(portfolioData);
        }

        // Fetch budget analysis
        const budgetResponse = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/projects/budget-analysis');
        if (budgetResponse.ok) {
          const budgetData = await budgetResponse.json();
          setBudgetAnalysis(budgetData);
        }
      } catch (error) {
        console.error('Error fetching capital projects data:', error);
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
  }, [projects, searchTerm, filters]);

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    // Project type filter
    if (filters.project_type) {
      filtered = filtered.filter(project => project.project_type === filters.project_type);
    }

    // Phase filter
    if (filters.phase) {
      filtered = filtered.filter(project => project.phase === filters.phase);
    }

    // Budget range filter
    filtered = filtered.filter(project =>
      project.budget_allocated >= filters.budget_range[0] &&
      project.budget_allocated <= filters.budget_range[1]
    );

    // Completion range filter
    filtered = filtered.filter(project =>
      project.percent_complete >= filters.completion_range[0] &&
      project.percent_complete <= filters.completion_range[1]
    );

    setFilteredProjects(filtered);
  };

  const getProjectStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning': return 'project-planning';
      case 'design': return 'project-design';
      case 'construction': return 'project-construction';
      case 'completed': return 'project-completed';
      case 'on_hold': return 'project-hold';
      case 'cancelled': return 'project-cancelled';
      default: return 'project-active';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'initiation': return 'phase-initiation';
      case 'planning': return 'phase-planning';
      case 'execution': return 'phase-execution';
      case 'monitoring': return 'phase-monitoring';
      case 'closure': return 'phase-closure';
      default: return 'phase-active';
    }
  };

  const getRiskLevel = (probability: number, impact: number) => {
    const riskScore = probability * impact;
    if (riskScore >= 16) return 'Very High';
    if (riskScore >= 12) return 'High';
    if (riskScore >= 8) return 'Medium';
    if (riskScore >= 4) return 'Low';
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

  const calculateProjectHealth = (project: CapitalProject) => {
    const scheduleHealth = project.performance_metrics.schedule_performance;
    const costHealth = project.performance_metrics.cost_performance;
    const qualityHealth = project.performance_metrics.quality_score;
    
    const overallHealth = (scheduleHealth + costHealth + qualityHealth) / 3;
    
    if (overallHealth >= 80) return 'excellent';
    if (overallHealth >= 60) return 'good';
    if (overallHealth >= 40) return 'fair';
    if (overallHealth >= 20) return 'poor';
    return 'critical';
  };

  const uniqueStatuses = [...new Set(projects.map(p => p.status))];
  const uniqueTypes = [...new Set(projects.map(p => p.project_type))];
  const uniquePhases = [...new Set(projects.map(p => p.phase))];

  return (
    <div className="capital-projects">
      {/* Capital Projects Header */}
      <div className="projects-header">
        <div className="header-content">
          <h2>Capital Projects Portfolio Management</h2>
          <p>Multi-million dollar infrastructure projects with comprehensive lifecycle management</p>
          
          {portfolio && (
            <div className="portfolio-metrics">
              <div className="metric-card total">
                <div className="metric-icon">
                  <Construction size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{portfolio.total_projects}</span>
                  <span className="metric-label">Total Projects</span>
                  <span className="metric-trend">Portfolio Size</span>
                </div>
              </div>

              <div className="metric-card active">
                <div className="metric-icon">
                  <Activity size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{portfolio.active_projects}</span>
                  <span className="metric-label">Active Projects</span>
                  <span className="metric-trend">In Progress</span>
                </div>
              </div>

              <div className="metric-card budget">
                <div className="metric-icon">
                  <DollarSign size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{formatCurrency(portfolio.total_budget)}</span>
                  <span className="metric-label">Total Budget</span>
                  <span className="metric-trend">Capital Investment</span>
                </div>
              </div>

              <div className="metric-card completion">
                <div className="metric-icon">
                  <Target size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{portfolio.average_completion.toFixed(1)}%</span>
                  <span className="metric-label">Avg Completion</span>
                  <span className="metric-trend">Portfolio Progress</span>
                </div>
              </div>

              <div className="metric-card performance">
                <div className="metric-icon">
                  <Gauge size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{portfolio.performance_index.toFixed(1)}</span>
                  <span className="metric-label">Performance Index</span>
                  <span className="metric-trend">Overall Health</span>
                </div>
              </div>

              <div className="metric-card schedule">
                <div className="metric-icon">
                  <Clock size={24} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{portfolio.on_schedule_projects}</span>
                  <span className="metric-label">On Schedule</span>
                  <span className="metric-trend">Timeline Performance</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="header-controls">
          <button className="control-btn refresh" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="control-btn export">
            <Download size={16} />
            Export Portfolio
          </button>
          <button className="control-btn import">
            <Upload size={16} />
            Import Data
          </button>
          <button className="control-btn primary create">
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      {/* Budget Analysis Dashboard */}
      {budgetAnalysis && (
        <div className="budget-analysis">
          <div className="section-header">
            <h3>FY {budgetAnalysis.fiscal_year} Budget Analysis & Forecasting</h3>
            <p>Comprehensive budget tracking with predictive spending analysis</p>
          </div>
          
          <div className="budget-overview">
            <div className="budget-card allocated">
              <div className="budget-header">
                <h4>Allocated Budget</h4>
                <DollarSign size={20} />
              </div>
              <div className="budget-amount">{formatCurrency(budgetAnalysis.allocated_budget)}</div>
              <div className="budget-description">Total capital allocation</div>
            </div>

            <div className="budget-card spent">
              <div className="budget-header">
                <h4>Spent to Date</h4>
                <TrendingUp size={20} />
              </div>
              <div className="budget-amount">{formatCurrency(budgetAnalysis.spent_budget)}</div>
              <div className="budget-description">
                {((budgetAnalysis.spent_budget / budgetAnalysis.allocated_budget) * 100).toFixed(1)}% of allocation
              </div>
            </div>

            <div className="budget-card committed">
              <div className="budget-header">
                <h4>Committed Funds</h4>
                <FileText size={20} />
              </div>
              <div className="budget-amount">{formatCurrency(budgetAnalysis.committed_budget)}</div>
              <div className="budget-description">Contractually obligated</div>
            </div>

            <div className="budget-card forecast">
              <div className="budget-header">
                <h4>Forecasted Spend</h4>
                <BarChart3 size={20} />
              </div>
              <div className="budget-amount">{formatCurrency(budgetAnalysis.forecasted_spend)}</div>
              <div className="budget-description">
                Variance: {budgetAnalysis.variance >= 0 ? '+' : ''}{formatCurrency(budgetAnalysis.variance)}
              </div>
            </div>
          </div>

          <div className="budget-breakdowns">
            <div className="quarterly-breakdown">
              <h4>Quarterly Spending Trend</h4>
              <div className="quarterly-chart">
                {budgetAnalysis.quarterly_breakdown.map((quarter, index) => (
                  <div key={index} className="quarter-data">
                    <div className="quarter-label">{quarter.quarter}</div>
                    <div className="quarter-bars">
                      <div className="bar allocated" style={{ height: `${(quarter.allocated / Math.max(...budgetAnalysis.quarterly_breakdown.map(q => q.allocated))) * 100}%` }}>
                        <span className="bar-value">{formatCurrency(quarter.allocated)}</span>
                      </div>
                      <div className="bar spent" style={{ height: `${(quarter.spent / Math.max(...budgetAnalysis.quarterly_breakdown.map(q => q.allocated))) * 100}%` }}>
                        <span className="bar-value">{formatCurrency(quarter.spent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="category-breakdown">
              <h4>Budget by Category</h4>
              <div className="category-list">
                {budgetAnalysis.category_breakdown.map((category, index) => (
                  <div key={index} className="category-item">
                    <div className="category-info">
                      <span className="category-name">{category.category}</span>
                      <span className="category-percentage">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="category-amounts">
                      <span className="allocated">Allocated: {formatCurrency(category.allocated)}</span>
                      <span className="spent">Spent: {formatCurrency(category.spent)}</span>
                    </div>
                    <div className="category-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(category.spent / category.allocated) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Controls */}
      <div className="view-controls">
        <div className="view-mode">
          <button 
            className={`view-btn ${viewMode === 'portfolio' ? 'active' : ''}`}
            onClick={() => setViewMode('portfolio')}
          >
            <Layers size={16} />
            Portfolio
          </button>
          <button 
            className={`view-btn ${viewMode === 'gantt' ? 'active' : ''}`}
            onClick={() => setViewMode('gantt')}
          >
            <BarChart3 size={16} />
            Gantt Chart
          </button>
          <button 
            className={`view-btn ${viewMode === 'budget' ? 'active' : ''}`}
            onClick={() => setViewMode('budget')}
          >
            <DollarSign size={16} />
            Budget View
          </button>
        </div>

        <div className="search-controls">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search projects by name, number, or location..."
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
              <label>Project Type</label>
              <select 
                value={filters.project_type}
                onChange={(e) => setFilters({...filters, project_type: e.target.value})}
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Phase</label>
              <select 
                value={filters.phase}
                onChange={(e) => setFilters({...filters, phase: e.target.value})}
              >
                <option value="">All Phases</option>
                {uniquePhases.map(phase => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>

            <div className="filter-group range">
              <label>Budget Range</label>
              <div className="range-inputs">
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  step="100000"
                  value={filters.budget_range[0]}
                  onChange={(e) => setFilters({
                    ...filters, 
                    budget_range: [parseInt(e.target.value), filters.budget_range[1]]
                  })}
                />
                <span>to</span>
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  step="100000"
                  value={filters.budget_range[1]}
                  onChange={(e) => setFilters({
                    ...filters, 
                    budget_range: [filters.budget_range[0], parseInt(e.target.value)]
                  })}
                />
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="clear-filters"
              onClick={() => setFilters({
                status: '',
                project_type: '',
                phase: '',
                budget_range: [0, 100000000],
                completion_range: [0, 100]
              })}
            >
              Clear Filters
            </button>
            <span className="results-count">
              Showing {filteredProjects.length} of {projects.length} projects
            </span>
          </div>
        </div>
      )}

      {/* Projects Display */}
      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading capital projects...</p>
        </div>
      ) : (
        <div className={`projects-display ${viewMode}`}>
          {viewMode === 'portfolio' && (
            <div className="projects-grid">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className={`project-card ${getProjectStatusColor(project.status)} ${calculateProjectHealth(project)}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="project-header">
                    <div className="project-identity">
                      <h4>{project.project_name}</h4>
                      <span className="project-number">{project.project_number}</span>
                    </div>
                    <div className="project-badges">
                      <span className={`status-badge ${getProjectStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      <span className={`phase-badge ${getPhaseColor(project.phase)}`}>
                        {project.phase}
                      </span>
                    </div>
                  </div>

                  <div className="project-content">
                    <p className="project-description">{project.description}</p>
                    
                    <div className="project-metrics">
                      <div className="metric-row">
                        <div className="metric-item">
                          <DollarSign size={14} />
                          <span>Budget: {formatCurrency(project.budget_allocated)}</span>
                        </div>
                        <div className="metric-item">
                          <TrendingUp size={14} />
                          <span>Spent: {formatCurrency(project.budget_spent)}</span>
                        </div>
                      </div>
                      
                      <div className="metric-row">
                        <div className="metric-item">
                          <Users size={14} />
                          <span>PM: {project.project_manager}</span>
                        </div>
                        <div className="metric-item">
                          <Building size={14} />
                          <span>{project.contractor}</span>
                        </div>
                      </div>
                      
                      <div className="metric-row">
                        <div className="metric-item">
                          <Calendar size={14} />
                          <span>Start: {formatDate(project.start_date)}</span>
                        </div>
                        <div className="metric-item">
                          <Clock size={14} />
                          <span>Due: {formatDate(project.estimated_completion)}</span>
                        </div>
                      </div>
                      
                      <div className="metric-row">
                        <div className="metric-item">
                          <MapPin size={14} />
                          <span>{project.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="progress-section">
                      <div className="progress-header">
                        <span>Progress: {project.percent_complete.toFixed(1)}%</span>
                        <span>Budget Used: {((project.budget_spent / project.budget_allocated) * 100).toFixed(1)}%</span>
                      </div>
                      
                      <div className="progress-bars">
                        <div className="progress-bar completion">
                          <div 
                            className="progress-fill"
                            style={{ width: `${project.percent_complete}%` }}
                          ></div>
                        </div>
                        <div className="progress-bar budget">
                          <div 
                            className="progress-fill"
                            style={{ width: `${(project.budget_spent / project.budget_allocated) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="performance-indicators">
                      <div className="indicator">
                        <Clock size={12} />
                        <span>Schedule: {project.performance_metrics.schedule_performance.toFixed(0)}%</span>
                      </div>
                      <div className="indicator">
                        <DollarSign size={12} />
                        <span>Cost: {project.performance_metrics.cost_performance.toFixed(0)}%</span>
                      </div>
                      <div className="indicator">
                        <CheckCircle2 size={12} />
                        <span>Quality: {project.performance_metrics.quality_score.toFixed(0)}%</span>
                      </div>
                      <div className="indicator">
                        <AlertTriangle size={12} />
                        <span>Safety: {project.performance_metrics.safety_score.toFixed(0)}%</span>
                      </div>
                    </div>

                    {project.risks.length > 0 && (
                      <div className="risk-summary">
                        <span className="risk-indicator">
                          <AlertTriangle size={12} />
                          {project.risks.filter(r => r.status === 'active').length} Active Risks
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="project-footer">
                    <button className="action-btn">
                      <Eye size={14} />
                      Details
                    </button>
                    <button className="action-btn">
                      <Edit3 size={14} />
                      Update
                    </button>
                    <button className="action-btn">
                      <FileText size={14} />
                      Reports
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'gantt' && (
            <div className="gantt-view">
              <div className="gantt-header">
                <h3>Project Timeline - Gantt Chart</h3>
                <p>Interactive timeline showing project schedules, dependencies, and milestones</p>
              </div>
              
              <div className="gantt-placeholder">
                <BarChart3 size={48} />
                <h3>Advanced Gantt Chart</h3>
                <p>Interactive project timeline with critical path analysis</p>
                <p>Dependency tracking and resource allocation visualization</p>
                <p>Milestone tracking and progress monitoring</p>
              </div>
            </div>
          )}

          {viewMode === 'budget' && (
            <div className="budget-view">
              <div className="budget-header">
                <h3>Budget Analysis by Project</h3>
                <p>Detailed financial tracking and forecasting for each capital project</p>
              </div>
              
              <div className="budget-projects">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="budget-project-card">
                    <div className="project-info">
                      <h4>{project.project_name}</h4>
                      <span className="project-number">{project.project_number}</span>
                    </div>
                    
                    <div className="budget-details">
                      <div className="budget-amounts">
                        <div className="amount-item">
                          <label>Allocated:</label>
                          <span className="amount">{formatCurrency(project.budget_allocated)}</span>
                        </div>
                        <div className="amount-item">
                          <label>Spent:</label>
                          <span className="amount">{formatCurrency(project.budget_spent)}</span>
                        </div>
                        <div className="amount-item">
                          <label>Remaining:</label>
                          <span className="amount">{formatCurrency(project.budget_remaining)}</span>
                        </div>
                      </div>
                      
                      <div className="budget-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${(project.budget_spent / project.budget_allocated) * 100}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {((project.budget_spent / project.budget_allocated) * 100).toFixed(1)}% Used
                        </span>
                      </div>
                      
                      <div className="funding-sources">
                        <label>Funding Sources:</label>
                        <div className="sources-list">
                          {project.funding_sources.map((source, index) => (
                            <div key={index} className="source-item">
                              <span className="source-name">{source.source}</span>
                              <span className="source-amount">{formatCurrency(source.amount)}</span>
                              <span className="source-percentage">({source.percentage.toFixed(1)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="project-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-info">
                <h3>{selectedProject.project_name}</h3>
                <span className="project-number">{selectedProject.project_number}</span>
              </div>
              <div className="header-badges">
                <span className={`status-badge ${getProjectStatusColor(selectedProject.status)}`}>
                  {selectedProject.status}
                </span>
                <span className={`phase-badge ${getPhaseColor(selectedProject.phase)}`}>
                  {selectedProject.phase}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedProject(null)}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="project-detail-tabs">
                <button className="tab-btn active">Overview</button>
                <button className="tab-btn">Milestones</button>
                <button className="tab-btn">Budget</button>
                <button className="tab-btn">Risks</button>
                <button className="tab-btn">Performance</button>
              </div>
              
              <div className="project-detail-content">
                <div className="detail-section">
                  <h4>Project Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Project Manager:</label>
                      <span>{selectedProject.project_manager}</span>
                    </div>
                    <div className="detail-item">
                      <label>Contractor:</label>
                      <span>{selectedProject.contractor}</span>
                    </div>
                    <div className="detail-item">
                      <label>Location:</label>
                      <span>{selectedProject.location}</span>
                    </div>
                    <div className="detail-item">
                      <label>Assets Affected:</label>
                      <span>{selectedProject.assets_affected.length} assets</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedProject.description}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Budget & Timeline</h4>
                  <div className="budget-timeline-grid">
                    <div className="budget-item">
                      <label>Total Budget:</label>
                      <span>{formatCurrency(selectedProject.budget_allocated)}</span>
                    </div>
                    <div className="budget-item">
                      <label>Spent to Date:</label>
                      <span>{formatCurrency(selectedProject.budget_spent)}</span>
                    </div>
                    <div className="budget-item">
                      <label>Start Date:</label>
                      <span>{formatDate(selectedProject.start_date)}</span>
                    </div>
                    <div className="budget-item">
                      <label>Estimated Completion:</label>
                      <span>{formatDate(selectedProject.estimated_completion)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="action-btn primary">
                <Edit3 size={16} />
                Update Project
              </button>
              <button className="action-btn">
                <FileText size={16} />
                Generate Report
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

export default CapitalProjects;