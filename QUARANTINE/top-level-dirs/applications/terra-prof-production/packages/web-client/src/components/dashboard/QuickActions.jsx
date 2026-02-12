/**
 * TerraFusionPro - Quick Actions Component
 * Provides buttons for common user workflows
 */

import React from 'react';

/**
 * QuickActions Component
 * @param {Object} props - Component props
 * @param {Function} props.onAction - Action handler function
 */
const QuickActions = ({ onAction }) => {
  // Define available quick actions
  const actions = [
    {
      id: 'new-property',
      label: 'Add Property',
      icon: '🏢',
      description: 'Create a new property record'
    },
    {
      id: 'new-report',
      label: 'Create Report',
      icon: '📝',
      description: 'Start a new appraisal report'
    },
    {
      id: 'field-data',
      label: 'Field Collection',
      icon: '📱',
      description: 'Collect property data in the field'
    },
    {
      id: 'market-analysis',
      label: 'Market Analysis',
      icon: '📊',
      description: 'Analyze market trends and data'
    },
    {
      id: 'upload-data',
      label: 'Upload Data',
      icon: '📤',
      description: 'Import data from external sources'
    },
    {
      id: 'generate-comps',
      label: 'Find Comparables',
      icon: '🔍',
      description: 'Identify comparable properties'
    }
  ];
  
  // Handle action click
  const handleActionClick = (actionId) => {
    if (onAction) {
      onAction(actionId);
    }
  };
  
  return (
    <div className="quick-actions">
      {actions.map(action => (
        <button
          key={action.id}
          className="quick-action-btn"
          onClick={() => handleActionClick(action.id)}
          title={action.description}
        >
          <span className="action-icon">{action.icon}</span>
          <span className="action-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;