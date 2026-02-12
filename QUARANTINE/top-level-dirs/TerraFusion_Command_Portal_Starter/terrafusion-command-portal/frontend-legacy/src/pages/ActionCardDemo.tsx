import React, { useState } from 'react';
import ActionCardRenderer, { 
  ActionCardData, 
  ActionType, 
  ActionStatus, 
  ActionPriority,
  WorkflowStep,
  FormField,
  ComplianceStatus,
  AuditEntry,
  ExternalSystemStatus 
} from '../components/workflow/ActionCardRenderer';

/**
 * Demo Page for TerraFusion Action Card Renderer
 * 
 * Showcases interactive workflow cards for government services
 * including permit applications, citizen requests, and emergency reports
 */

const ActionCardDemo: React.FC = () => {
  // Sample action cards for different government services
  const [actionCards, setActionCards] = useState<ActionCardData[]>([
    // Permit Application Example
    {
      id: 'permit-001',
      type: 'permit_application' as ActionType,
      title: 'Commercial Building Permit Application',
      description: 'New commercial construction permit for 123 Main Street, downtown development project.',
      status: 'under_review' as ActionStatus,
      priority: 'normal' as ActionPriority,
      currentStep: 2,
      totalSteps: 5,
      steps: [
        {
          id: 'step-1',
          name: 'Application Submission',
          description: 'Submit initial application and required documentation',
          status: 'completed',
          assignedRole: 'Applicant',
          estimatedDuration: '1-2 hours',
        },
        {
          id: 'step-2',
          name: 'Initial Review',
          description: 'Planning department initial review and completeness check',
          status: 'active',
          assignedRole: 'Planning Reviewer',
          estimatedDuration: '3-5 business days',
        },
        {
          id: 'step-3',
          name: 'Technical Review',
          description: 'Engineering and safety compliance review',
          status: 'pending',
          assignedRole: 'Engineering Team',
          estimatedDuration: '7-10 business days',
        },
        {
          id: 'step-4',
          name: 'Public Notice',
          description: 'Public notification and comment period',
          status: 'pending',
          assignedRole: 'Public Affairs',
          estimatedDuration: '14 days',
        },
        {
          id: 'step-5',
          name: 'Final Approval',
          description: 'Final approval and permit issuance',
          status: 'pending',
          assignedRole: 'Department Head',
          estimatedDuration: '2-3 business days',
        },
      ],
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-18T14:22:00Z',
      dueDate: '2024-02-15T17:00:00Z',
      assignedTo: 'Jane Smith - Planning Department',
      department: 'Planning & Development',
      county: 'Benton',
      formFields: [
        {
          id: 'applicant_name',
          name: 'applicant_name',
          label: 'Applicant Name',
          type: 'text',
          required: true,
          placeholder: 'Enter full legal name',
          governmentCompliance: true,
        },
        {
          id: 'project_address',
          name: 'project_address',
          label: 'Project Address',
          type: 'text',
          required: true,
          placeholder: 'Street address including unit number',
          governmentCompliance: true,
        },
        {
          id: 'project_type',
          name: 'project_type',
          label: 'Project Type',
          type: 'select',
          required: true,
          options: [
            { value: 'new_construction', label: 'New Construction' },
            { value: 'renovation', label: 'Renovation' },
            { value: 'addition', label: 'Addition' },
            { value: 'demolition', label: 'Demolition' },
          ],
        },
        {
          id: 'estimated_cost',
          name: 'estimated_cost',
          label: 'Estimated Project Cost',
          type: 'number',
          required: true,
          placeholder: '0',
          validation: { min: 1000 },
        },
        {
          id: 'project_description',
          name: 'project_description',
          label: 'Project Description',
          type: 'textarea',
          required: true,
          placeholder: 'Detailed description of the proposed work',
          validation: { minLength: 50, maxLength: 1000 },
        },
        {
          id: 'architect_plans',
          name: 'architect_plans',
          label: 'Architectural Plans',
          type: 'file',
          required: true,
          helpText: 'Upload PDF of architectural drawings (max 10MB)',
          governmentCompliance: true,
        },
        {
          id: 'environmental_impact',
          name: 'environmental_impact',
          label: 'Environmental Impact Assessment Completed',
          type: 'checkbox',
          required: true,
          helpText: 'Confirm that environmental impact has been assessed',
        },
      ],
      submittedData: {
        applicant_name: 'ABC Construction Company',
        project_address: '123 Main Street, Suite 100',
        project_type: 'new_construction',
        estimated_cost: '2500000',
        project_description: 'New 5-story mixed-use commercial building with ground-floor retail and upper-floor office spaces. Building will include modern sustainable features and meet all current building codes.',
        environmental_impact: true,
      },
      completionPercentage: 35,
      estimatedCompletion: '2024-02-10',
      complianceStatus: 'compliant' as ComplianceStatus,
      auditTrail: [
        {
          id: 'audit-1',
          timestamp: '2024-01-15T10:30:00Z',
          user: 'ABC Construction Company',
          action: 'Application Submitted',
          details: 'Initial permit application submitted with all required documentation',
          systemGenerated: false,
        },
        {
          id: 'audit-2',
          timestamp: '2024-01-16T09:15:00Z',
          user: 'System',
          action: 'Completeness Check',
          details: 'Automated completeness verification passed - all required fields submitted',
          systemGenerated: true,
        },
        {
          id: 'audit-3',
          timestamp: '2024-01-17T11:45:00Z',
          user: 'Jane Smith',
          action: 'Initial Review Started',
          details: 'Planning reviewer assigned and initial review commenced',
          systemGenerated: false,
        },
        {
          id: 'audit-4',
          timestamp: '2024-01-18T14:22:00Z',
          user: 'System',
          action: 'Status Update',
          details: 'Application status updated to under_review',
          systemGenerated: true,
        },
      ],
      externalSystems: [
        {
          systemId: 'gis-system',
          systemName: 'County GIS System',
          status: 'connected',
          lastSync: '2024-01-18T14:20:00Z',
          dataExchanged: 3,
        },
        {
          systemId: 'tax-assessment',
          systemName: 'Tax Assessment Database',
          status: 'connected',
          lastSync: '2024-01-18T14:18:00Z',
          dataExchanged: 2,
        },
        {
          systemId: 'environmental-db',
          systemName: 'Environmental Impact Database',
          status: 'syncing',
          lastSync: '2024-01-18T14:00:00Z',
          dataExchanged: 1,
        },
      ],
    },
    
    // Citizen Service Request Example
    {
      id: 'service-002',
      type: 'citizen_service_request' as ActionType,
      title: 'Pothole Repair Request',
      description: 'Large pothole on Oak Avenue causing vehicle damage and safety concerns.',
      status: 'submitted' as ActionStatus,
      priority: 'high' as ActionPriority,
      currentStep: 1,
      totalSteps: 4,
      steps: [
        {
          id: 'step-1',
          name: 'Request Received',
          description: 'Service request submitted and logged in system',
          status: 'completed',
          assignedRole: 'System',
          estimatedDuration: 'Immediate',
        },
        {
          id: 'step-2',
          name: 'Inspection Scheduled',
          description: 'Field inspection scheduled with public works team',
          status: 'pending',
          assignedRole: 'Public Works Coordinator',
          estimatedDuration: '1-2 business days',
        },
        {
          id: 'step-3',
          name: 'Repair Work',
          description: 'Actual repair work performed based on inspection findings',
          status: 'pending',
          assignedRole: 'Road Crew',
          estimatedDuration: '3-5 business days',
        },
        {
          id: 'step-4',
          name: 'Completion Verification',
          description: 'Final inspection and request closure',
          status: 'pending',
          assignedRole: 'Public Works Supervisor',
          estimatedDuration: '1 business day',
        },
      ],
      createdAt: '2024-01-18T16:45:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
      department: 'Public Works',
      county: 'Franklin',
      formFields: [
        {
          id: 'citizen_name',
          name: 'citizen_name',
          label: 'Your Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name',
        },
        {
          id: 'contact_phone',
          name: 'contact_phone',
          label: 'Phone Number',
          type: 'phone',
          required: true,
          placeholder: '(555) 123-4567',
        },
        {
          id: 'issue_location',
          name: 'issue_location',
          label: 'Location of Issue',
          type: 'text',
          required: true,
          placeholder: 'Street address or intersection',
        },
        {
          id: 'issue_severity',
          name: 'issue_severity',
          label: 'Severity Level',
          type: 'select',
          required: true,
          options: [
            { value: 'low', label: 'Low - Minor inconvenience' },
            { value: 'medium', label: 'Medium - Moderate impact' },
            { value: 'high', label: 'High - Safety concern' },
            { value: 'emergency', label: 'Emergency - Immediate danger' },
          ],
        },
        {
          id: 'issue_description',
          name: 'issue_description',
          label: 'Description of Issue',
          type: 'textarea',
          required: true,
          placeholder: 'Please describe the issue in detail',
          validation: { minLength: 20 },
        },
        {
          id: 'photo_evidence',
          name: 'photo_evidence',
          label: 'Photos (Optional)',
          type: 'file',
          required: false,
          helpText: 'Upload photos of the issue if available',
        },
      ],
      submittedData: {
        citizen_name: 'Robert Johnson',
        contact_phone: '(509) 555-0123',
        issue_location: '1500 block of Oak Avenue, near intersection with Pine Street',
        issue_severity: 'high',
        issue_description: 'Large pothole approximately 3 feet in diameter and 8 inches deep. Located in the right lane, causing vehicles to swerve into oncoming traffic. My car suffered tire damage when I hit it yesterday evening.',
      },
      completionPercentage: 15,
      complianceStatus: 'pending_review' as ComplianceStatus,
      auditTrail: [
        {
          id: 'audit-1',
          timestamp: '2024-01-18T16:45:00Z',
          user: 'Robert Johnson',
          action: 'Service Request Submitted',
          details: 'Citizen submitted pothole repair request via online portal',
          systemGenerated: false,
        },
        {
          id: 'audit-2',
          timestamp: '2024-01-18T16:46:00Z',
          user: 'System',
          action: 'Request Assigned',
          details: 'Request automatically assigned to Public Works department based on issue type',
          systemGenerated: true,
        },
      ],
    },
    
    // Emergency Report Example
    {
      id: 'emergency-003',
      type: 'emergency_report' as ActionType,
      title: 'Water Main Break - Emergency Response',
      description: 'Major water main break on Industrial Boulevard affecting multiple businesses and threatening road stability.',
      status: 'approved' as ActionStatus,
      priority: 'emergency' as ActionPriority,
      currentStep: 3,
      totalSteps: 3,
      steps: [
        {
          id: 'step-1',
          name: 'Emergency Declaration',
          description: 'Emergency status declared and response team activated',
          status: 'completed',
          assignedRole: 'Emergency Coordinator',
          estimatedDuration: 'Immediate',
        },
        {
          id: 'step-2',
          name: 'Resource Mobilization',
          description: 'Emergency crews and equipment dispatched to scene',
          status: 'completed',
          assignedRole: 'Emergency Response Team',
          estimatedDuration: '15-30 minutes',
        },
        {
          id: 'step-3',
          name: 'Active Response',
          description: 'On-scene emergency response and repair operations',
          status: 'active',
          assignedRole: 'Utilities Emergency Crew',
          estimatedDuration: '4-8 hours',
        },
      ],
      createdAt: '2024-01-18T08:30:00Z',
      updatedAt: '2024-01-18T10:15:00Z',
      department: 'Emergency Services',
      county: 'Yakima',
      formFields: [],
      completionPercentage: 85,
      complianceStatus: 'exempt' as ComplianceStatus,
      auditTrail: [
        {
          id: 'audit-1',
          timestamp: '2024-01-18T08:30:00Z',
          user: 'Emergency Dispatch',
          action: 'Emergency Reported',
          details: 'Water main break reported by multiple callers - Industrial Boulevard',
          systemGenerated: false,
        },
        {
          id: 'audit-2',
          timestamp: '2024-01-18T08:32:00Z',
          user: 'Mike Chen - Emergency Coordinator',
          action: 'Emergency Status Declared',
          details: 'Level 2 emergency declared - utilities emergency response activated',
          systemGenerated: false,
        },
        {
          id: 'audit-3',
          timestamp: '2024-01-18T08:45:00Z',
          user: 'System',
          action: 'Resources Dispatched',
          details: 'Emergency crew #3 and equipment dispatched to scene',
          systemGenerated: true,
        },
        {
          id: 'audit-4',
          timestamp: '2024-01-18T10:15:00Z',
          user: 'Field Supervisor',
          action: 'Status Update',
          details: 'Water main isolated, repair operations in progress, estimated completion 2:00 PM',
          systemGenerated: false,
        },
      ],
      externalSystems: [
        {
          systemId: 'emergency-dispatch',
          systemName: 'County Emergency Dispatch',
          status: 'connected',
          lastSync: '2024-01-18T10:14:00Z',
          dataExchanged: 8,
        },
        {
          systemId: 'utilities-grid',
          systemName: 'Utilities Management System',
          status: 'connected',
          lastSync: '2024-01-18T10:12:00Z',
          dataExchanged: 15,
        },
      ],
    },
  ]);

  // Handle action updates
  const handleActionUpdate = (actionId: string, updates: Partial<ActionCardData>) => {
    setActionCards(prev => prev.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    ));
  };

  // Handle form submissions
  const handleSubmit = async (actionId: string, formData: Record<string, any>) => {
    console.log('Submitting action:', actionId, 'with data:', formData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the action status
    handleActionUpdate(actionId, {
      status: 'submitted' as ActionStatus,
      submittedData: formData,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            TerraFusion Action Card Renderer Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Interactive workflow cards for government services powered by XMTP protocol.
            These cards support various citizen services including permit applications,
            service requests, and emergency responses with real-time status updates.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 font-medium">
              Citizen View
            </button>
            <button className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Employee View
            </button>
            <button className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Admin View
            </button>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-8">
          {actionCards.map(action => (
            <ActionCardRenderer
              key={action.id}
              action={action}
              mode="citizen"
              onActionUpdate={handleActionUpdate}
              onSubmit={handleSubmit}
            />
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Key Features Demonstrated
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Dynamic Forms</h3>
              <p className="text-gray-600 text-sm">
                Dynamically rendered forms based on action type with validation,
                file uploads, and government compliance indicators.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Workflow Progress</h3>
              <p className="text-gray-600 text-sm">
                Multi-step workflow visualization with progress tracking,
                role assignments, and estimated completion times.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Real-time Updates</h3>
              <p className="text-gray-600 text-sm">
                Live status updates via WebSocket connections for immediate
                notification of workflow state changes.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Compliance Tracking</h3>
              <p className="text-gray-600 text-sm">
                Government compliance status monitoring with regulatory
                framework validation and audit trail maintenance.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">System Integration</h3>
              <p className="text-gray-600 text-sm">
                External system status monitoring with connection health,
                data synchronization, and error handling.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Multi-Role Support</h3>
              <p className="text-gray-600 text-sm">
                Role-based interface adaptation for citizens, employees,
                and administrators with appropriate access controls.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Implementation Notes */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Technical Implementation
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>XMTP Integration:</strong> Action cards are designed to work with XMTP protocol
              for secure, decentralized messaging between government services and citizens.
            </p>
            <p>
              <strong>Real-time Updates:</strong> WebSocket connections provide live status updates
              without requiring page refreshes, enhancing user experience.
            </p>
            <p>
              <strong>Federation Support:</strong> Cross-county workflows are supported through
              the TerraFusion federation relay system for seamless service delivery.
            </p>
            <p>
              <strong>Compliance Framework:</strong> Built-in compliance tracking ensures all
              government regulatory requirements are met throughout the workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCardDemo;