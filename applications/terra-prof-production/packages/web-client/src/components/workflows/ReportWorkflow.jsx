/**
 * TerraFusionPro - Report Workflow Component
 * Visualizes and manages the report creation workflow
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkflowProgress from '../layout/WorkflowProgress';
import useWorkflow from '../../hooks/useWorkflow';
import { useNotifications } from '../layout/NotificationCenter';

/**
 * Define report workflow steps
 */
const REPORT_WORKFLOW_STEPS = [
  {
    id: 'property-selection',
    name: 'property-selection',
    label: 'Property Selection',
    description: 'Select or create the subject property'
  },
  {
    id: 'assignment-details',
    name: 'assignment-details',
    label: 'Assignment Details',
    description: 'Enter assignment information and scope of work'
  },
  {
    id: 'property-inspection',
    name: 'property-inspection',
    label: 'Property Inspection',
    description: 'Record property characteristics and condition'
  },
  {
    id: 'comparable-selection',
    name: 'comparable-selection',
    label: 'Comparable Selection',
    description: 'Select and analyze comparable properties'
  },
  {
    id: 'valuation-analysis',
    name: 'valuation-analysis',
    label: 'Valuation Analysis',
    description: 'Perform value analysis and reconciliation'
  },
  {
    id: 'report-generation',
    name: 'report-generation',
    label: 'Report Generation',
    description: 'Generate final report documents'
  }
];

/**
 * Validate report workflow step data
 * @param {Object} step - Current step
 * @param {Object} data - Workflow data
 * @returns {boolean|Object} - True if valid, or object with error messages
 */
const validateReportStep = (step, data) => {
  const errors = {};
  
  switch(step.id) {
    case 'property-selection':
      if (!data.propertyId) {
        errors.propertyId = 'Please select a property';
      }
      break;
      
    case 'assignment-details':
      if (!data.clientName) {
        errors.clientName = 'Client name is required';
      }
      if (!data.purposeOfAppraisal) {
        errors.purposeOfAppraisal = 'Purpose of appraisal is required';
      }
      if (!data.effectiveDate) {
        errors.effectiveDate = 'Effective date is required';
      }
      break;
      
    case 'property-inspection':
      if (!data.inspectionDate) {
        errors.inspectionDate = 'Inspection date is required';
      }
      if (!data.inspectionType) {
        errors.inspectionType = 'Inspection type is required';
      }
      break;
      
    case 'comparable-selection':
      if (!data.comparables || data.comparables.length < 3) {
        errors.comparables = 'At least 3 comparables are required';
      }
      break;
      
    case 'valuation-analysis':
      if (!data.finalValue) {
        errors.finalValue = 'Final value conclusion is required';
      }
      if (!data.approaches || Object.keys(data.approaches).length === 0) {
        errors.approaches = 'At least one valuation approach is required';
      }
      break;
      
    case 'report-generation':
      // No validation required for report generation
      break;
      
    default:
      break;
  }
  
  return Object.keys(errors).length === 0 ? true : errors;
};

/**
 * Report completion handler
 * @param {Object} data - Workflow data
 * @returns {Promise<Object>} - Result of report creation
 */
const handleReportComplete = async (data) => {
  try {
    // Submit report to API
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create report');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing report:', error);
    throw error;
  }
};

/**
 * ReportWorkflow Component
 * @param {Object} props - Component props
 * @param {string} props.reportId - Existing report ID (for editing)
 * @param {Object} props.initialData - Initial report data
 * @param {Function} props.onComplete - Callback when workflow completes
 * @param {Function} props.onCancel - Callback when workflow is cancelled
 */
const ReportWorkflow = ({
  reportId,
  initialData = {},
  onComplete,
  onCancel
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [isLoading, setIsLoading] = useState(!!reportId);
  const [isInitialized, setIsInitialized] = useState(!reportId);
  
  // Use reportId from props or route params
  const activeReportId = reportId || params.reportId;
  
  // Initialize the workflow
  const workflow = useWorkflow({
    name: 'Report Creation',
    steps: REPORT_WORKFLOW_STEPS,
    initialStep: 0,
    validateStep: validateReportStep,
    data: initialData,
    onComplete: async (data) => {
      try {
        const result = await handleReportComplete(data);
        
        if (onComplete) {
          onComplete(result);
        } else {
          // Default navigation to report view
          navigate(`/reports/${result.reportId || result.id}`);
        }
        
        return result;
      } catch (error) {
        notifications.error(error.message || 'Failed to complete report');
        throw error;
      }
    }
  });
  
  // Fetch existing report data if editing
  useEffect(() => {
    const fetchReportData = async () => {
      if (!activeReportId || isInitialized) return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/reports/${activeReportId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        
        const reportData = await response.json();
        
        // Update workflow data with fetched report data
        workflow.updateData(reportData);
        
        // Determine starting step based on report progress
        let startStep = 0;
        
        if (reportData.propertyId) startStep = Math.max(startStep, 1);
        if (reportData.clientName && reportData.effectiveDate) startStep = Math.max(startStep, 2);
        if (reportData.inspectionDate) startStep = Math.max(startStep, 3);
        if (reportData.comparables && reportData.comparables.length > 0) startStep = Math.max(startStep, 4);
        if (reportData.finalValue) startStep = Math.max(startStep, 5);
        
        // Go to the determined step
        if (startStep > 0) {
          const visitedSteps = Array.from({ length: startStep }, (_, i) => i);
          workflow.goToStep(startStep);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching report data:', error);
        notifications.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [activeReportId, isInitialized]);
  
  // Handle step navigation
  const handleStepClick = (stepIndex) => {
    workflow.goToStep(stepIndex);
  };
  
  // Handle workflow actions
  const handleNext = () => {
    workflow.nextStep();
  };
  
  const handlePrevious = () => {
    workflow.prevStep();
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="report-workflow loading">
        <div className="loading-indicator">
          Loading report data...
        </div>
      </div>
    );
  }
  
  // Get current step component
  const renderStepContent = () => {
    // This would be replaced with actual step components
    return (
      <div className="step-content-placeholder">
        <h3 className="step-title">{workflow.currentStep.label}</h3>
        <p className="step-description">{workflow.currentStep.description}</p>
        <div className="mock-form">
          <p>This is a placeholder for the {workflow.currentStep.label} form.</p>
          <p>In a real implementation, specific form fields for this step would be shown here.</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="report-workflow">
      {/* Workflow Progress Indicator */}
      <WorkflowProgress
        steps={REPORT_WORKFLOW_STEPS}
        currentStep={workflow.currentStepIndex}
        visitedSteps={workflow.visitedSteps || []}
        onStepClick={handleStepClick}
        allowNavigation={true}
      />
      
      {/* Step Content */}
      <div className="workflow-content">
        {renderStepContent()}
      </div>
      
      {/* Workflow Controls */}
      <div className="workflow-actions">
        <button 
          className="btn btn-secondary"
          onClick={handleCancel}
        >
          Cancel
        </button>
        
        <div className="navigation-buttons">
          <button
            className="btn btn-outline"
            onClick={handlePrevious}
            disabled={workflow.currentStepIndex === 0}
          >
            Previous
          </button>
          
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={workflow.isSubmitting}
          >
            {workflow.currentStepIndex === REPORT_WORKFLOW_STEPS.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
      
      {/* Validation Errors */}
      {!workflow.isValid && (
        <div className="validation-errors">
          <div className="error-heading">Please correct the following errors:</div>
          <ul className="error-list">
            {Object.entries(workflow.validationErrors).map(([key, error]) => (
              <li key={key} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportWorkflow;