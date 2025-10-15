import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ProgressTracker } from "@/components/workflow/progress-tracker";
import { WorkflowChecklist } from "@/components/workflow/checklist";
import { MapPreview } from "@/components/maps/map-preview";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { AssistantPanel } from "@/components/chatbot/assistant-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WorkflowType, workflowTypeLabels, workflowTypeDescriptions, workflowSteps } from "@/lib/workflow-types";
import { Workflow, WorkflowState, ChecklistItem, Document } from "@shared/schema";
import { SaveIcon, CheckCircleIcon } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";

export default function WorkflowPage() {
  const { type } = useParams<{ type: string }>();
  const [location] = useLocation();
  // Bypass auth during development
  const user = { id: 1, username: 'admin', fullName: 'Administrator' };
  const { toast } = useToast();
  
  // Extract workflow ID from query parameters if it exists
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const workflowId = searchParams.get('id') ? parseInt(searchParams.get('id')!) : null;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Validate workflow type
  const workflowType = type as WorkflowType;
  if (!Object.keys(workflowTypeLabels).includes(workflowType)) {
    return <div>Invalid workflow type</div>;
  }
  
  // Get correct steps for this workflow type
  const steps = workflowSteps[workflowType] || [];
  
  // Fetch or create workflow
  const {
    data: workflow,
    isLoading: isWorkflowLoading,
    error: workflowError
  } = useQuery<Workflow>({
    queryKey: [workflowId ? `/api/workflows/${workflowId}` : null],
    enabled: !!workflowId,
  });
  
  // Fetch workflow state if workflow exists
  const {
    data: workflowState,
    isLoading: isStateLoading
  } = useQuery<WorkflowState>({
    queryKey: [workflowId ? `/api/workflows/${workflowId}/state` : null],
    enabled: !!workflowId,
  });
  
  // Fetch checklist items
  const {
    data: checklistItems,
    isLoading: isChecklistLoading
  } = useQuery<ChecklistItem[]>({
    queryKey: [workflowId ? `/api/workflows/${workflowId}/checklist` : null],
    enabled: !!workflowId,
  });
  
  // Fetch documents
  const {
    data: documents,
    isLoading: isDocumentsLoading
  } = useQuery<Document[]>({
    queryKey: [workflowId ? `/api/workflows/${workflowId}/documents` : null],
    enabled: !!workflowId,
  });

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      if (workflowId) {
        return apiRequest(`/api/workflows/${workflowId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest('/api/workflows', {
          method: 'POST',
          body: JSON.stringify({
            ...data,
            type: workflowType,
            userId: user.id,
          }),
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${data.id}`] });
      setIsDirty(false);
      toast({
        title: "Workflow saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Handle save
  const handleSave = () => {
    saveWorkflowMutation.mutate(formData);
  };

  // Initialize form data when workflow loads
  useEffect(() => {
    if (workflow && !isDirty) {
      setFormData(workflow.data || {});
      setCurrentStep(workflow.currentStep || 1);
    }
  }, [workflow, isDirty]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [formData, isDirty]);

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  // Get current step data
  const currentStepData = steps[currentStep - 1];

  // Loading state
  if (isWorkflowLoading || isStateLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading workflow...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (workflowError) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading workflow</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Render workflow form based on current step
  const renderStepContent = () => {
    if (!currentStepData) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Step configuration not found</p>
        </div>
      );
    }

    switch (currentStepData.id) {
      case 'basic_info':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input
                  id="caseNumber"
                  name="caseNumber"
                  value={formData.caseNumber || ''}
                  onChange={(e) => updateFormData('caseNumber', e.target.value)}
                  placeholder="Enter case number"
                />
              </div>
              <div>
                <Label htmlFor="applicantName">Applicant Name</Label>
                <Input
                  id="applicantName"
                  name="applicantName"
                  value={formData.applicantName || ''}
                  onChange={(e) => updateFormData('applicantName', e.target.value)}
                  placeholder="Enter applicant name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  name="propertyAddress"
                  value={formData.propertyAddress || ''}
                  onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                  placeholder="Enter property address"
                />
              </div>
              <div>
                <Label htmlFor="parcelId">Parcel ID</Label>
                <Input
                  id="parcelId"
                  name="parcelId"
                  value={formData.parcelId || ''}
                  onChange={(e) => updateFormData('parcelId', e.target.value)}
                  placeholder="Enter parcel ID"
                />
              </div>
            </div>

            {workflowType === 'parcel_combination' && (
              <div className="mb-6">
                <Label htmlFor="caseType">Case Type</Label>
                <select
                  id="caseType"
                  name="caseType"
                  value={formData.caseType || ''}
                  onChange={(e) => updateFormData('caseType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="merge">Merge</option>
                  <option value="split">Split</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <Label htmlFor="parentParcels">Parent Parcel IDs</Label>
              <Textarea
                id="parentParcels"
                name="parentParcels"
                value={formData.parentParcels || ''}
                onChange={(e) => updateFormData('parentParcels', e.target.value)}
                placeholder="Enter parent parcel IDs (one per line)"
                rows={4}
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Enter workflow description"
                rows={4}
              />
            </div>
          </div>
        );

      case 'assignment':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo || ''}
                  onChange={(e) => updateFormData('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select assignee</option>
                  <option value="john.doe">John Doe</option>
                  <option value="jane.smith">Jane Smith</option>
                  <option value="robert.johnson">Robert Johnson</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority || 'medium'}
                  onChange={(e) => updateFormData('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => updateFormData('dueDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  name="estimatedHours"
                  type="number"
                  value={formData.estimatedHours || ''}
                  onChange={(e) => updateFormData('estimatedHours', e.target.value)}
                  placeholder="Enter estimated hours"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workGroup">Work Group</Label>
                <select
                  id="workGroup"
                  name="workGroup"
                  value={formData.workGroup || ''}
                  onChange={(e) => updateFormData('workGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select group</option>
                  <option value="1">Group 1</option>
                  <option value="2">Group 2</option>
                  <option value="3">Group 3</option>
                  <option value="all">All Groups</option>
                </select>
              </div>
              <div>
                <Label htmlFor="notificationStatus">Notification Status</Label>
                <select
                  id="notificationStatus"
                  name="notificationStatus"
                  value={formData.notificationStatus || 'pending'}
                  onChange={(e) => updateFormData('notificationStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="acknowledged">Acknowledged</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <Label htmlFor="assignmentNotes">Assignment Notes</Label>
              <Textarea
                id="assignmentNotes"
                name="assignmentNotes"
                value={formData.assignmentNotes || ''}
                onChange={(e) => updateFormData('assignmentNotes', e.target.value)}
                placeholder="Enter assignment notes"
                rows={4}
              />
            </div>
          </div>
        );

      case 'documents':
        return renderDocumentRequirements();

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-neutral-600 mb-6">
                Workflow Summary
              </h3>
              <p className="text-sm text-neutral-400">
                Additional form fields will appear here.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Step content not implemented</p>
          </div>
        );
    }
  };

  // Render document requirements based on workflow type
  const renderDocumentRequirements = () => {
    return (
      <div className="space-y-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
          <h3 className="font-medium text-neutral-900 mb-2">
            Required Documents for {workflowTypeLabels[workflowType]}
          </h3>
          <p className="text-sm text-neutral-600 mb-6">
            {workflowTypeDescriptions[workflowType]}
          </p>

          {workflowType === 'long_plat' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <h4 className="font-medium text-neutral-700 mb-2">
                  Required Documentation
                </h4>
                <ul className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1">
                  <li>Filed Plat Documentation</li>
                  <li>Ownership Verification</li>
                </ul>
              </div>
            </div>
          )}

          {workflowType === 'short_plat' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <h4 className="font-medium text-neutral-700 mb-2">
                  Required Documentation
                </h4>
                <ul className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1">
                  <li>Property Deed(s)</li>
                  <li>Ownership Verification</li>
                </ul>
              </div>
            </div>
          )}

          {workflowType === 'parcel_combination' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <h4 className="font-medium text-neutral-700 mb-2">
                  Required Documentation
                </h4>
                <ul className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1">
                  <li>Survey Documents (if available)</li>
                  <li>Parent Parcel Documentation</li>
                  {formData.caseType === 'split' && <li>Proposed Split Plan</li>}
                </ul>
              </div>
            </div>
          )}

          {workflowType === 'segregation' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <h4 className="font-medium text-neutral-700 mb-2">
                  Required Documentation
                </h4>
                <ul className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1">
                  <li>Segregation Tracking Sheet</li>
                  <li>Any supporting documentation</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {workflowTypeLabels[workflowType]}
              </h1>
              <p className="text-sm text-neutral-500">
                {workflowTypeDescriptions[workflowType]}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress Tracker */}
                <ProgressTracker
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={handleStepClick}
                />

                {/* Step Content */}
                <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                      {currentStepData?.title}
                    </h2>
                    <p className="text-sm text-neutral-600">
                      {currentStepData?.description}
                    </p>
                  </div>

                  {renderStepContent()}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={saveWorkflowMutation.isPending}
                      >
                        <SaveIcon className="w-4 h-4 mr-2" />
                        {saveWorkflowMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      
                      {currentStep < steps.length ? (
                        <Button onClick={handleNextStep}>
                          Next
                        </Button>
                      ) : (
                        <Button onClick={handleSave}>
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Workflow Checklist */}
                {workflowId && (
                  <WorkflowChecklist
                    workflowId={workflowId}
                    items={checklistItems || []}
                    isLoading={isChecklistLoading}
                  />
                )}

                {/* Map Preview */}
                {formData.parcelId && (
                  <MapPreview parcelId={formData.parcelId} />
                )}

                {/* Document Upload */}
                {workflowId && (
                  <DocumentUploader
                    workflowId={workflowId}
                    documents={documents || []}
                    isLoading={isDocumentsLoading}
                  />
                )}

                {/* Assistant Panel */}
                <AssistantPanel workflowType={workflowType} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
