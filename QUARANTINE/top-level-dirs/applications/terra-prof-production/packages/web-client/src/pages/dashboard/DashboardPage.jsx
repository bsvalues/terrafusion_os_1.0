/**
 * TerraFusionPro - Dashboard Page
 * Main dashboard with overview of the system
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardSummary from '../../components/dashboard/DashboardSummary';
import ServiceHealthMonitor from '../../components/dashboard/ServiceHealthMonitor';
import WorkflowProgress from '../../components/layout/WorkflowProgress';

/**
 * DashboardPage Component
 */
const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  
  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
    fetchServiceStatus();
    fetchActiveWorkflows();
  }, []);
  
  // Fetch dashboard summary data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/summary');
      
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      } else {
        console.error('Failed to fetch dashboard data:', response.statusText);
        // Use empty data
        setSummaryData({
          propertyCount: 0,
          reportCount: 0,
          pendingForms: 0,
          recentActivity: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use empty data
      setSummaryData({
        propertyCount: 0,
        reportCount: 0,
        pendingForms: 0,
        recentActivity: []
      });
    }
  };
  
  // Fetch service health status
  const fetchServiceStatus = async () => {
    setIsLoadingServices(true);
    
    try {
      const response = await fetch('/api/admin/services/health');
      
      if (response.ok) {
        const data = await response.json();
        setServiceData(data.services || []);
      } else {
        console.error('Failed to fetch service status:', response.statusText);
        // Use empty data
        setServiceData([]);
      }
    } catch (error) {
      console.error('Error fetching service status:', error);
      // Use empty data
      setServiceData([]);
    } finally {
      setIsLoadingServices(false);
    }
  };
  
  // Fetch active workflows
  const fetchActiveWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows/active');
      
      if (response.ok) {
        const data = await response.json();
        setActiveWorkflows(data.workflows || []);
      } else {
        console.error('Failed to fetch active workflows:', response.statusText);
        // Use empty data
        setActiveWorkflows([]);
      }
    } catch (error) {
      console.error('Error fetching active workflows:', error);
      // Use empty data
      setActiveWorkflows([]);
    }
  };
  
  // Refresh service health data
  const handleRefreshServices = () => {
    fetchServiceStatus();
  };
  
  // Handle workflow step click
  const handleWorkflowStepClick = (workflow, step) => {
    // Navigate to the workflow step
    console.log(`Navigate to ${workflow.type} workflow, step ${step.id}`);
    // In a real implementation, this would redirect to the appropriate page
  };
  
  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="page-actions">
          <Link to="/reports/create" className="btn btn-primary">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>New Report</span>
          </Link>
          <Link to="/properties/create" className="btn btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>New Property</span>
          </Link>
        </div>
      </header>
      
      <div className="dashboard-greeting">
        <h2>Welcome back, {currentUser?.firstName || 'User'}</h2>
        <p>Here's an overview of your TerraFusionPro system</p>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-main">
          {/* Summary Metrics */}
          <section className="dashboard-section">
            <DashboardSummary summaryData={summaryData} />
          </section>
          
          {/* Active Workflows */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Active Workflows</h3>
              <Link to="/workflows" className="section-action">View all</Link>
            </div>
            
            <div className="workflow-list">
              {activeWorkflows.length > 0 ? (
                activeWorkflows.map((workflow /* , index */) => (
                  <div key={index} className="workflow-item">
                    <div className="workflow-header">
                      <h4 className="workflow-name">{workflow.name}</h4>
                      <span className={`workflow-status ${workflow.status}`}>
                        {workflow.status}
                      </span>
                    </div>
                    
                    <WorkflowProgress 
                      type={workflow.type} 
                      currentStep={workflow.currentStep}
                      steps={workflow.steps}
                      onStepClick={(step) => handleWorkflowStepClick(workflow, step)}
                    />
                    
                    <div className="workflow-actions">
                      <Link to={`/workflows/${workflow.id}`} className="workflow-action">
                        Continue
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-workflows">
                  <p>You don't have any active workflows.</p>
                  <p>
                    <Link to="/workflows/new" className="start-workflow">
                      Start a new workflow
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
        
        <div className="dashboard-sidebar">
          {/* Service Health */}
          <section className="dashboard-section">
            <ServiceHealthMonitor 
              services={serviceData}
              onRefresh={handleRefreshServices}
              isLoading={isLoadingServices}
            />
          </section>
          
          {/* Quick Links */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Quick Links</h3>
            </div>
            
            <div className="quick-links">
              <Link to="/reports" className="quick-link">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Recent Reports</span>
              </Link>
              
              <Link to="/forms/assigned" className="quick-link">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Assigned Forms</span>
              </Link>
              
              <Link to="/properties/map" className="quick-link">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                <span>Property Map</span>
              </Link>
              
              <Link to="/analysis/market" className="quick-link">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                  <line x1="3" y1="20" x2="21" y2="20"></line>
                </svg>
                <span>Market Analysis</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;