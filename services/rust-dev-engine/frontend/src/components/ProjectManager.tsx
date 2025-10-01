import React, { useState, useEffect } from 'react';
import './ProjectManager.css';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'building' | 'error' | 'archived';
  lastBuild: string;
  buildStatus: 'success' | 'failed' | 'running' | 'pending';
  testCoverage: number;
  dependencies: number;
  language: string;
  framework: string;
  version: string;
  repository: string;
}

interface NewProjectForm {
  name: string;
  description: string;
  template: string;
  repository: string;
}

const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const [newProject, setNewProject] = useState<NewProjectForm>({
    name: '',
    description: '',
    template: 'web-service',
    repository: ''
  });

  const projectTemplates = [
    { id: 'web-service', name: 'Web Service', description: 'REST API with Actix-web' },
    { id: 'cli-tool', name: 'CLI Tool', description: 'Command-line application' },
    { id: 'library', name: 'Library', description: 'Reusable Rust library' },
    { id: 'microservice', name: 'Microservice', description: 'Containerized microservice' },
    { id: 'desktop-app', name: 'Desktop App', description: 'GUI application with Tauri' },
    { id: 'blockchain', name: 'Blockchain', description: 'Smart contract or DeFi protocol' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, statusFilter, sortBy]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/rust-dev/projects');
      
      // Mock data for now - replace with actual API response
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'terrafusion-core',
          description: 'Core TerraFusion government platform services',
          status: 'active',
          lastBuild: '2 hours ago',
          buildStatus: 'success',
          testCoverage: 94.2,
          dependencies: 23,
          language: 'Rust',
          framework: 'Actix-web',
          version: '1.2.3',
          repository: 'https://github.com/terrafusion/core'
        },
        {
          id: '2',
          name: 'auth-service',
          description: 'Authentication and authorization microservice',
          status: 'building',
          lastBuild: '5 minutes ago',
          buildStatus: 'running',
          testCoverage: 87.5,
          dependencies: 15,
          language: 'Rust',
          framework: 'Axum',
          version: '0.8.1',
          repository: 'https://github.com/terrafusion/auth'
        },
        {
          id: '3',
          name: 'data-processor',
          description: 'High-performance data processing pipeline',
          status: 'active',
          lastBuild: '1 day ago',
          buildStatus: 'success',
          testCoverage: 91.8,
          dependencies: 31,
          language: 'Rust',
          framework: 'Tokio',
          version: '2.1.0',
          repository: 'https://github.com/terrafusion/processor'
        },
        {
          id: '4',
          name: 'config-cli',
          description: 'Configuration management CLI tool',
          status: 'error',
          lastBuild: '3 hours ago',
          buildStatus: 'failed',
          testCoverage: 76.3,
          dependencies: 8,
          language: 'Rust',
          framework: 'Clap',
          version: '0.5.2',
          repository: 'https://github.com/terrafusion/config-cli'
        },
        {
          id: '5',
          name: 'property-valuation',
          description: 'Real estate valuation algorithms',
          status: 'active',
          lastBuild: '6 hours ago',
          buildStatus: 'success',
          testCoverage: 96.7,
          dependencies: 19,
          language: 'Rust',
          framework: 'Custom',
          version: '3.0.1',
          repository: 'https://github.com/terrafusion/valuation'
        }
      ];

      setProjects(mockProjects);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastBuild':
          return new Date(b.lastBuild).getTime() - new Date(a.lastBuild).getTime();
        case 'coverage':
          return b.testCoverage - a.testCoverage;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      const response = await fetch('/api/rust-dev/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setShowNewProject(false);
        setNewProject({
          name: '',
          description: '',
          template: 'web-service',
          repository: ''
        });
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'building': return '⚡';
      case 'error': return '❌';
      case 'archived': return '📦';
      default: return '⚪';
    }
  };

  const getBuildStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return '#00ff88';
    if (coverage >= 75) return '#00ffaa';
    if (coverage >= 60) return '#ffaa00';
    return '#ff3333';
  };

  if (isLoading) {
    return (
      <div className="project-manager-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="project-manager">
      
      <div className="project-manager-header">
        <div className="header-left">
          <h1>Project Manager</h1>
          <p className="header-subtitle">Manage and monitor your Rust projects</p>
        </div>
        <button 
          className="new-project-btn"
          onClick={() => setShowNewProject(true)}
        >
          <span className="btn-icon">➕</span>
          New Project
        </button>
      </div>

      {/* Filters and Search */}
      <div className="project-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="building">Building</option>
            <option value="error">Error</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="lastBuild">Sort by Last Build</option>
            <option value="coverage">Sort by Coverage</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Project Stats */}
      <div className="project-stats">
        <div className="stat-item">
          <span className="stat-label">Total Projects</span>
          <span className="stat-value">{projects.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value">{projects.filter(p => p.status === 'active').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Building</span>
          <span className="stat-value">{projects.filter(p => p.buildStatus === 'running').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Coverage</span>
          <span className="stat-value">
            {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.testCoverage, 0) / projects.length) : 0}%
          </span>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {filteredProjects.map(project => (
          <div key={project.id} className={`project-card ${project.status}`}>
            
            <div className="project-header">
              <div className="project-info">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-description">{project.description}</p>
              </div>
              <div className="project-status">
                <span className="status-icon">{getStatusIcon(project.status)}</span>
                <span className="status-text">{project.status}</span>
              </div>
            </div>

            <div className="project-details">
              <div className="detail-row">
                <span className="detail-label">Framework:</span>
                <span className="detail-value">{project.framework}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Version:</span>
                <span className="detail-value">{project.version}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Dependencies:</span>
                <span className="detail-value">{project.dependencies}</span>
              </div>
            </div>

            <div className="project-metrics">
              <div className="metric-item">
                <span className="metric-label">Last Build</span>
                <div className="metric-content">
                  <span className="build-icon">{getBuildStatusIcon(project.buildStatus)}</span>
                  <span className="build-time">{project.lastBuild}</span>
                </div>
              </div>
              
              <div className="metric-item">
                <span className="metric-label">Test Coverage</span>
                <div className="coverage-meter">
                  <div 
                    className="coverage-fill"
                    style={{
                      width: `${project.testCoverage}%`,
                      backgroundColor: getCoverageColor(project.testCoverage)
                    }}
                  ></div>
                  <span className="coverage-text">{project.testCoverage}%</span>
                </div>
              </div>
            </div>

            <div className="project-actions">
              <button className="action-btn primary">
                <span className="action-icon">🔨</span>
                Build
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">🧪</span>
                Test
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">📊</span>
                Details
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">⚙️</span>
                Config
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="modal-overlay">
          <div className="new-project-modal">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewProject(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="my-rust-project"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Brief description of your project"
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label>Project Template</label>
                <select
                  value={newProject.template}
                  onChange={(e) => setNewProject({...newProject, template: e.target.value})}
                  className="form-select"
                >
                  {projectTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Repository URL (Optional)</label>
                <input
                  type="url"
                  value={newProject.repository}
                  onChange={(e) => setNewProject({...newProject, repository: e.target.value})}
                  placeholder="https://github.com/username/repo"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectManager;