/**
 * TerraFusionPro - Property Workflow Component
 * Manages the property creation and editing workflow
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkflowProgress from '../layout/WorkflowProgress';
import useWorkflow from '../../hooks/useWorkflow';
import { useNotifications } from '../layout/NotificationCenter';

/**
 * Define property workflow steps
 */
const PROPERTY_WORKFLOW_STEPS = [
  {
    id: 'basic-info',
    name: 'basic-info',
    label: 'Basic Information',
    description: 'Enter basic property information'
  },
  {
    id: 'location',
    name: 'location',
    label: 'Location',
    description: 'Enter property location details'
  },
  {
    id: 'physical-characteristics',
    name: 'physical-characteristics',
    label: 'Physical Characteristics',
    description: 'Enter physical property characteristics'
  },
  {
    id: 'improvements',
    name: 'improvements',
    label: 'Improvements',
    description: 'Enter property improvements'
  },
  {
    id: 'documents',
    name: 'documents',
    label: 'Documents',
    description: 'Upload supporting documents'
  },
  {
    id: 'review',
    name: 'review',
    label: 'Review & Save',
    description: 'Review and save property information'
  }
];

/**
 * Validate property workflow step data
 * @param {Object} step - Current step
 * @param {Object} data - Workflow data
 * @returns {boolean|Object} - True if valid, or object with error messages
 */
const validatePropertyStep = (step, data) => {
  const errors = {};
  
  switch(step.id) {
    case 'basic-info':
      if (!data.propertyName) {
        errors.propertyName = 'Property name is required';
      }
      if (!data.propertyType) {
        errors.propertyType = 'Property type is required';
      }
      break;
      
    case 'location':
      if (!data.address) {
        errors.address = 'Street address is required';
      }
      if (!data.city) {
        errors.city = 'City is required';
      }
      if (!data.state) {
        errors.state = 'State/Province is required';
      }
      if (!data.postalCode) {
        errors.postalCode = 'Postal code is required';
      }
      break;
      
    case 'physical-characteristics':
      if (!data.siteArea) {
        errors.siteArea = 'Site area is required';
      }
      if (!data.landUse) {
        errors.landUse = 'Land use designation is required';
      }
      break;
      
    case 'improvements':
      // Optional step, no required fields
      break;
      
    case 'documents':
      // Optional step, no required fields
      break;
      
    case 'review':
      // No validation for review step
      break;
      
    default:
      break;
  }
  
  return Object.keys(errors).length === 0 ? true : errors;
};

/**
 * Property completion handler
 * @param {Object} data - Workflow data
 * @returns {Promise<Object>} - Result of property creation/update
 */
const handlePropertyComplete = async (data) => {
  try {
    const isUpdate = !!data.id;
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `/api/properties/${data.id}` : '/api/properties';
    
    // Submit property to API
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to ${isUpdate ? 'update' : 'create'} property`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error ${data.id ? 'updating' : 'creating'} property:`, error);
    throw error;
  }
};

/**
 * PropertyWorkflow Component
 * @param {Object} props - Component props
 * @param {string} props.propertyId - Existing property ID (for editing)
 * @param {Object} props.initialData - Initial property data
 * @param {Function} props.onComplete - Callback when workflow completes
 * @param {Function} props.onCancel - Callback when workflow is cancelled
 */
const PropertyWorkflow = ({
  propertyId,
  initialData = {},
  onComplete,
  onCancel
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [isLoading, setIsLoading] = useState(!!propertyId);
  const [isInitialized, setIsInitialized] = useState(!propertyId);
  
  // Use propertyId from props or route params
  const activePropertyId = propertyId || params.propertyId;
  
  // Initialize the workflow
  const workflow = useWorkflow({
    name: 'Property Management',
    steps: PROPERTY_WORKFLOW_STEPS,
    initialStep: 0,
    validateStep: validatePropertyStep,
    data: initialData,
    onComplete: async (data) => {
      try {
        const result = await handlePropertyComplete(data);
        
        if (onComplete) {
          onComplete(result);
        } else {
          // Default navigation to property view
          navigate(`/properties/${result.propertyId || result.id}`);
        }
        
        return result;
      } catch (error) {
        notifications.error(error.message || 'Failed to save property');
        throw error;
      }
    }
  });
  
  // Fetch existing property data if editing
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!activePropertyId || isInitialized) return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/properties/${activePropertyId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch property data');
        }
        
        const propertyData = await response.json();
        
        // Update workflow data with fetched property data
        workflow.updateData(propertyData);
        
        // Determine starting step based on property data completeness
        let startStep = 0;
        
        if (propertyData.propertyName && propertyData.propertyType) startStep = Math.max(startStep, 1);
        if (propertyData.address && propertyData.city) startStep = Math.max(startStep, 2);
        if (propertyData.siteArea && propertyData.landUse) startStep = Math.max(startStep, 3);
        if (propertyData.improvements && propertyData.improvements.length > 0) startStep = Math.max(startStep, 4);
        if (propertyData.documents && propertyData.documents.length > 0) startStep = Math.max(startStep, 5);
        
        // Go to the determined step
        if (startStep > 0) {
          const visitedSteps = Array.from({ length: startStep }, (_, i) => i);
          workflow.goToStep(startStep);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching property data:', error);
        notifications.error('Failed to load property data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPropertyData();
  }, [activePropertyId, isInitialized]);
  
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
      <div className="property-workflow loading">
        <div className="loading-indicator">
          Loading property data...
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
    <div className="property-workflow">
      {/* Workflow Progress Indicator */}
      <WorkflowProgress
        steps={PROPERTY_WORKFLOW_STEPS}
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
            {workflow.currentStepIndex === PROPERTY_WORKFLOW_STEPS.length - 1 ? 'Save Property' : 'Next'}
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

export default PropertyWorkflow;