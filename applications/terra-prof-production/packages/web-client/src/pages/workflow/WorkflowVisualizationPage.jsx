import React, { useState } from 'react';
import WorkflowStatus from '../../components/workflow/WorkflowStatus';
import DataFlow from '../../components/workflow/DataFlow';
import ProcessTimeline from '../../components/workflow/ProcessTimeline';

/**
 * WorkflowVisualizationPage Component
 * Demonstrates the workflow visualization components
 */
const WorkflowVisualizationPage = () => {
  // State for dynamic workflow status demo
  const [appraisalStatus, setAppraisalStatus] = useState({
    status: 'pending',
    progress: 0,
    currentStep: 'data-collection'
  });
  
  // Handles progressing the demo workflow
  const handleProgressWorkflow = () => {
    setAppraisalStatus(prev => {
      let newStatus = { ...prev };
      
      if (prev.status === 'pending') {
        newStatus = {
          status: 'processing',
          progress: 20,
          currentStep: 'property-inspection'
        };
      } else if (prev.status === 'processing' && prev.progress < 80) {
        newStatus = {
          status: 'processing',
          progress: prev.progress + 20,
          currentStep: getNextStep(prev.currentStep)
        };
      } else {
        newStatus = {
          status: 'completed',
          progress: 100,
          currentStep: 'final-review'
        };
      }
      
      return newStatus;
    });
  };
  
  // Helper function to get next step in the workflow
  const getNextStep = (currentStep) => {
    const stepSequence = [
      'data-collection',
      'property-inspection',
      'comps-analysis',
      'valuation',
      'report-generation',
      'final-review'
    ];
    
    const currentIndex = stepSequence.indexOf(currentStep);
    if (currentIndex < 0 || currentIndex >= stepSequence.length - 1) {
      return 'final-review';
    }
    
    return stepSequence[currentIndex + 1];
  };
  
  // Handles simulating a workflow failure
  const handleFailWorkflow = () => {
    setAppraisalStatus({
      status: 'failed',
      progress: appraisalStatus.progress,
      currentStep: appraisalStatus.currentStep
    });
  };
  
  // Handles resetting the workflow demo
  const handleResetWorkflow = () => {
    setAppraisalStatus({
      status: 'pending',
      progress: 0,
      currentStep: 'data-collection'
    });
  };
  
  // Sample workflow steps for demonstration
  const appraisalWorkflowSteps = [
    { 
      id: 'data-collection',
      name: 'Data Collection', 
      status: appraisalStatus.progress >= 0 ? 
        (appraisalStatus.status === 'failed' && appraisalStatus.currentStep === 'data-collection' ? 'failed' : 'completed') : 
        'pending',
      description: 'Gathering property data and market information',
      timestamp: '2025-04-27T09:00:00Z',
      duration: 3600000 // 1 hour
    },
    { 
      id: 'property-inspection',
      name: 'Property Inspection', 
      status: appraisalStatus.progress >= 20 ? 
        (appraisalStatus.status === 'failed' && appraisalStatus.currentStep === 'property-inspection' ? 'failed' : 'completed') : 
        (appraisalStatus.currentStep === 'property-inspection' ? 'processing' : 'pending'),
      description: 'On-site assessment of property condition and features',
      timestamp: appraisalStatus.progress >= 20 ? '2025-04-27T10:15:00Z' : null,
      duration: 5400000 // 1.5 hours
    },
    { 
      id: 'comps-analysis',
      name: 'Comparables Analysis', 
      status: appraisalStatus.progress >= 40 ? 
        (appraisalStatus.status === 'failed' && appraisalStatus.currentStep === 'comps-analysis' ? 'failed' : 'completed') : 
        (appraisalStatus.currentStep === 'comps-analysis' ? 'processing' : 'pending'),
      description: 'Identifying and analyzing comparable properties',
      timestamp: appraisalStatus.progress >= 40 ? '2025-04-27T12:30:00Z' : null,
      duration: 7200000 // 2 hours
    },
    { 
      id: 'valuation',
      name: 'Valuation', 
      status: appraisalStatus.progress >= 60 ? 
        (appraisalStatus.status === 'failed' && appraisalStatus.currentStep === 'valuation' ? 'failed' : 'completed') : 
        (appraisalStatus.currentStep === 'valuation' ? 'processing' : 'pending'),
      description: 'Determining property value using multiple approaches',
      timestamp: appraisalStatus.progress >= 60 ? '2025-04-27T14:45:00Z' : null,
      duration: 3600000 // 1 hour
    },
    { 
      id: 'report-generation',
      name: 'Report Generation', 
      status: appraisalStatus.progress >= 80 ? 
        (appraisalStatus.status === 'failed' && appraisalStatus.currentStep === 'report-generation' ? 'failed' : 'completed') : 
        (appraisalStatus.currentStep === 'report-generation' ? 'processing' : 'pending'),
      description: 'Creating final appraisal report with findings',
      timestamp: appraisalStatus.progress >= 80 ? '2025-04-27T16:00:00Z' : null,
      duration: 5400000 // 1.5 hours
    },
    { 
      id: 'final-review',
      name: 'Final Review', 
      status: appraisalStatus.progress >= 100 ? 
        (appraisalStatus.status === 'failed' && appraisalStatus.currentStep === 'final-review' ? 'failed' : 'completed') : 
        (appraisalStatus.currentStep === 'final-review' ? 'processing' : 'pending'),
      description: 'Quality control and final approval',
      timestamp: appraisalStatus.progress >= 100 ? '2025-04-27T17:30:00Z' : null,
      duration: 1800000 // 30 minutes
    }
  ];
  
  // Sample data for the DataFlow component
  const platformDataFlowNodes = [
    { id: 'user', name: 'User', type: 'user', position: { x: 100, y: 100 }, description: 'End User' },
    { id: 'web-client', name: 'Web Client', type: 'client', position: { x: 300, y: 100 }, description: 'Frontend App' },
    { id: 'api-gateway', name: 'API Gateway', type: 'api', position: { x: 500, y: 100 }, description: 'Request Router' },
    { id: 'user-service', name: 'User Service', type: 'service', position: { x: 700, y: 50 }, description: 'Authentication' },
    { id: 'property-service', name: 'Property Service', type: 'service', position: { x: 700, y: 150 }, description: 'Property Data' },
    { id: 'form-service', name: 'Form Service', type: 'service', position: { x: 700, y: 250 }, description: 'Data Collection' },
    { id: 'report-service', name: 'Report Service', type: 'service', position: { x: 500, y: 250 }, description: 'Generate Reports' },
    { id: 'analysis-service', name: 'Analysis Service', type: 'service', position: { x: 300, y: 250 }, description: 'Data Analysis' },
    { id: 'database', name: 'Database', type: 'database', position: { x: 500, y: 350 }, description: 'PostgreSQL DB' }
  ];
  
  const platformDataFlowConnections = [
    { id: 'conn-1', source: 'user', target: 'web-client', label: 'Interacts', status: 'active' },
    { id: 'conn-2', source: 'web-client', target: 'api-gateway', label: 'HTTP Requests', status: 'active' },
    { id: 'conn-3', source: 'api-gateway', target: 'user-service', label: 'Auth Requests', status: 'active' },
    { id: 'conn-4', source: 'api-gateway', target: 'property-service', label: 'Property Queries', status: 'active' },
    { id: 'conn-5', source: 'api-gateway', target: 'form-service', label: 'Form Data', status: 'active' },
    { id: 'conn-6', source: 'property-service', target: 'database', label: 'CRUD Operations', status: 'active' },
    { id: 'conn-7', source: 'form-service', target: 'database', label: 'CRUD Operations', status: 'active' },
    { id: 'conn-8', source: 'user-service', target: 'database', label: 'CRUD Operations', status: 'active' },
    { id: 'conn-9', source: 'property-service', target: 'analysis-service', label: 'Analysis Request', status: 'active' },
    { id: 'conn-10', source: 'analysis-service', target: 'report-service', label: 'Report Data', status: 'active' },
    { id: 'conn-11', source: 'report-service', target: 'database', label: 'CRUD Operations', status: 'active' },
    { id: 'conn-12', source: 'api-gateway', target: 'report-service', label: 'Report Queries', status: 'active' }
  ];
  
  return (
    <div className="workflow-visualization-page">
      <div className="page-header">
        <h1>Workflow Visualization Components</h1>
        <p>Demonstration of components for visualizing workflows and data processes</p>
      </div>
      
      <div className="visualization-section">
        <h2>Property Appraisal Workflow Demo</h2>
        <p>This example demonstrates a step-by-step property appraisal workflow.</p>
        
        <div className="workflow-demo-controls">
          <button 
            className="btn btn-primary" 
            onClick={handleProgressWorkflow}
            disabled={appraisalStatus.status === 'completed' || appraisalStatus.status === 'failed'}
          >
            Progress Workflow
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleFailWorkflow}
            disabled={appraisalStatus.status === 'completed' || appraisalStatus.status === 'failed'}
          >
            Simulate Failure
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleResetWorkflow}
          >
            Reset Demo
          </button>
        </div>
        
        <WorkflowStatus 
          status={appraisalStatus.status}
          progress={appraisalStatus.progress}
          steps={appraisalWorkflowSteps}
          title="Property Appraisal Workflow"
          description="Step-by-step process for appraising a residential property"
        />
        
        <ProcessTimeline
          steps={appraisalWorkflowSteps}
          title="Appraisal Process Timeline"
          currentStep={appraisalStatus.currentStep}
        />
      </div>
      
      <div className="visualization-section">
        <h2>Platform Architecture Data Flow</h2>
        <p>Interactive visualization of data flow between different services in the TerraFusionPro platform.</p>
        
        <DataFlow 
          nodes={platformDataFlowNodes}
          connections={platformDataFlowConnections}
          title="TerraFusionPro Platform Data Flow"
          animated={true}
        />
      </div>
    </div>
  );
};

export default WorkflowVisualizationPage;