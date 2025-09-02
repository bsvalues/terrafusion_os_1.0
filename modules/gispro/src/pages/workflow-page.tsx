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
import { SaveIcon, CheckCircleIcon  } from '@mui/icons-material';
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
  
  // Create new workflow if needed
  const createWorkflowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/workflows", {
        type: workflowType,
        title: `New ${workflowTypeLabels[workflowType]}`,
        description: workflowTypeDescriptions[workflowType]
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Update URL to include workflow ID
      window.history.replaceState(null, "", `/workflow/${workflowType}?id=${data.id}`);
      toast({
        title: "Workflow created",
        description: "Your new workflow has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating workflow",
        description: error.message,
        variant: "destructive",
      });
    }
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
  
  // Update workflow state mutation
  const updateStateMutation = useMutation({
    mutationFn: async (data: { currentStep: number, formData: any }) => {
      if (!workflowId) return null;
      
      const res = await apiRequest("PATCH", `/api/workflows/${workflowId}/state`, {
        workflowId,
        currentStep: data.currentStep,
        formData: data.formData
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsDirty(false);
      toast({
        title: "Progress saved",
        description: "Your workflow progress has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Flag to track if we've already created a workflow
  const [hasAttemptedWorkflowCreation, setHasAttemptedWorkflowCreation] = useState(false);
  
  // Create workflow if it doesn't exist yet (only once)
  useEffect(() => {
    if (!workflowId && !isWorkflowLoading && !hasAttemptedWorkflowCreation && !createWorkflowMutation.isPending) {
      setHasAttemptedWorkflowCreation(true);
      createWorkflowMutation.mutate();
    }
  }, [workflowId, isWorkflowLoading, hasAttemptedWorkflowCreation, createWorkflowMutation.isPending]);
  
  // Load state data when available
  useEffect(() => {
    if (workflowState) {
      setCurrentStep(workflowState.currentStep || 1);
      setFormData(workflowState.formData || {});
    }
  }, [workflowState]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Record<string, any>) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };
  
  // Save workflow progress
  const handleSave = () => {
    updateStateMutation.mutate({ currentStep, formData });
  };
  
  // Navigate to next step
  const handleNextStep = () => {
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateStateMutation.mutate({ currentStep: nextStep, formData });
    }
  };
  
  // Navigate to previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateStateMutation.mutate({ currentStep: prevStep, formData });
    }
  };
  
  // Complete workflow
  const handleComplete = () => {
    // In a real implementation, this would update the workflow status to 'completed'
    // For now, we'll just save the state and show a success message
    updateStateMutation.mutate({ currentStep, formData });
    toast({
      title: "Workflow completed",
      description: "Congratulations! You have completed this workflow.",
    });
  };
  
  // Render form based on current step and workflow type
  const renderStepContent = () => {
    // Common basic info step for all workflow types
    if (currentStep === 1) {
      return (
        <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Basic Information</h2>
          
          {workflowType === 'long_plat' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="platName">Plat Name</Label>
                  <Input
</>
                    id="platName"
                    name="platName"
                    placeholder="Enter plat name"
                    value={formData.platName || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="platNumber">Plat Number</Label>
                  <Input
</>
                    id="platNumber"
                    name="platNumber"
                    placeholder="Enter plat number"
                    value={formData.platNumber || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div><>

                  <Label htmlFor="parentParcelId">Parent Parcel ID</Label>
                  <Input
</>
                    id="parentParcelId"
                    name="parentParcelId"
                    placeholder="15-digit parcel ID"
                    value={formData.parentParcelId || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="totalLots">Total Lots</Label>
                  <Input
</>
                    id="totalLots"
                    name="totalLots"
                    type="number"
                    placeholder="Number of lots"
                    value={formData.totalLots || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="acreage">Total Acreage</Label>
                  <Input
</>
                    id="acreage"
                    name="acreage"
                    placeholder="Total area in acres"
                    value={formData.acreage || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="mb-6"><>

                <Label htmlFor="legalDescription">Legal Description</Label>
                <Textarea
</>
                  id="legalDescription"
                  name="legalDescription"
                  rows={3}
                  placeholder="Enter legal description"
                  value={formData.legalDescription || ""}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><>

                  <Label htmlFor="submissionDate">Submission Date</Label>
                  <Input
</>
                    id="submissionDate"
                    name="submissionDate"
                    type="date"
                    value={formData.submissionDate || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="assignedStaff">Assigned Staff</Label>
                  <select
</>
                    id="assignedStaff"
                    name="assignedStaff"
                    value={formData.assignedStaff || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 mt-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ><>

                    <option value="">Select staff member</option>
                    <option
</> value="john.doe">John Doe</option><>

                    <option value="jane.smith">Jane Smith</option>
                    <option
</> value="robert.johnson">Robert Johnson</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          {workflowType === 'bla' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="blaNumber">BLA Number</Label>
                  <Input
</>
                    id="blaNumber"
                    name="blaNumber"
                    placeholder="Enter BLA number"
                    value={formData.blaNumber || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="applicantName">Applicant Name</Label>
                  <Input
</>
                    id="applicantName"
                    name="applicantName"
                    placeholder="Enter applicant name"
                    value={formData.applicantName || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="parcel1">Parcel ID 1</Label>
                  <Input
</>
                    id="parcel1"
                    name="parcel1"
                    placeholder="15-digit parcel ID"
                    value={formData.parcel1 || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="parcel2">Parcel ID 2</Label>
                  <Input
</>
                    id="parcel2"
                    name="parcel2"
                    placeholder="15-digit parcel ID"
                    value={formData.parcel2 || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="mb-6"><>

                <Label htmlFor="blaDescription">BLA Description</Label>
                <Textarea
</>
                  id="blaDescription"
                  name="blaDescription"
                  rows={3}
                  placeholder="Describe the boundary line adjustment"
                  value={formData.blaDescription || ""}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><>

                  <Label htmlFor="blaSubmissionDate">Submission Date</Label>
                  <Input
</>
                    id="blaSubmissionDate"
                    name="blaSubmissionDate"
                    type="date"
                    value={formData.blaSubmissionDate || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="blaAssignedStaff">Assigned Staff</Label>
                  <select
</>
                    id="blaAssignedStaff"
                    name="blaAssignedStaff"
                    value={formData.blaAssignedStaff || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 mt-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ><>

                    <option value="">Select staff member</option>
                    <option
</> value="john.doe">John Doe</option><>

                    <option value="jane.smith">Jane Smith</option>
                    <option
</> value="robert.johnson">Robert Johnson</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          {workflowType === 'merge_split' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="caseNumber">Case Number</Label>
                  <Input
</>
                    id="caseNumber"
                    name="caseNumber"
                    placeholder="Enter case number"
                    value={formData.caseNumber || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="caseType">Case Type</Label>
                  <select
</>
                    id="caseType"
                    name="caseType"
                    value={formData.caseType || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 mt-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ><>

                    <option value="">Select type</option>
                    <option
</> value="merge">Merge</option>
                    <option value="split">Split</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6"><>

                <Label htmlFor="parentParcels">Parent Parcel IDs</Label>
                <Textarea
</>
                  id="parentParcels"
                  name="parentParcels"
                  rows={2}
                  placeholder="Enter one or more parcel IDs (comma separated)"
                  value={formData.parentParcels || ""}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="requestedParcelCount">Requested Parcel Count</Label>
                  <Input
</>
                    id="requestedParcelCount"
                    name="requestedParcelCount"
                    type="number"
                    placeholder="For splits only"
                    value={formData.requestedParcelCount || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="totalAcreage">Total Acreage</Label>
                  <Input
</>
                    id="totalAcreage"
                    name="totalAcreage"
                    placeholder="Total area in acres"
                    value={formData.totalAcreage || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="mb-6"><>

                <Label htmlFor="description">Description</Label>
                <Textarea
</>
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Describe the merge or split"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><>

                  <Label htmlFor="submissionDate">Submission Date</Label>
                  <Input
</>
                    id="submissionDate"
                    name="submissionDate"
                    type="date"
                    value={formData.submissionDate || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="assignedStaff">Assigned Staff</Label>
                  <select
</>
                    id="assignedStaff"
                    name="assignedStaff"
                    value={formData.assignedStaff || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 mt-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ><>

                    <option value="">Select staff member</option>
                    <option
</> value="john.doe">John Doe</option><>

                    <option value="jane.smith">Jane Smith</option>
                    <option
</> value="robert.johnson">Robert Johnson</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          {workflowType === 'sm00_report' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="reportMonth">Report Month</Label>
                  <Input
</>
                    id="reportMonth"
                    name="reportMonth"
                    type="month"
                    value={formData.reportMonth || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="assessmentYear">Assessment Year</Label>
                  <Input
</>
                    id="assessmentYear"
                    name="assessmentYear"
                    type="number"
                    placeholder="YYYY"
                    value={formData.assessmentYear || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="supplementGroup">Supplement Group</Label>
                  <select
</>
                    id="supplementGroup"
                    name="supplementGroup"
                    value={formData.supplementGroup || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 mt-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ><>

                    <option value="">Select group</option>
                    <option
</> value="1">Group 1</option><>

                    <option value="2">Group 2</option>
                    <option
</> value="3">Group 3</option>
                    <option value="all">All Groups</option>
                  </select>
                </div>
                <div><>

                  <Label htmlFor="status">Status</Label>
                  <select
</>
                    id="status"
                    name="status"
                    value={formData.status || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 mt-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ><>

                    <option value="">Select status</option>
                    <option
</> value="pending">Pending</option><>

                    <option value="review">In Review</option>
                    <option
</> value="sent">Sent</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><>

                  <Label htmlFor="recipientList">Recipient List</Label>
                  <Textarea
</>
                    id="recipientList"
                    name="recipientList"
                    rows={3}
                    placeholder="Email addresses (one per line)"
                    value={formData.recipientList || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div><>

                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
</>
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Any special notes for this report"
                    value={formData.notes || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
    
    // Document upload step (common across workflow types)
    if (currentStep === 2) {
      return (
        <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-6 mb-6"><>

          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Upload Required Documents</h2>
          <p
</> className="text-sm text-neutral-600 mb-6">
            Please upload all required documents for this {workflowTypeLabels[workflowType].toLowerCase()}.
            Make sure all files are clearly named and in the appropriate format.
          </p>
          
          {workflowType === 'long_plat' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200"><>

                <h3 className="text-sm font-medium text-neutral-800">Required Documents:</h3>
                <ul
</> className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1"><>

                  <li>Plat Map (PDF or TIFF, 300+ DPI)</li>
                            <li
</>>Filed Plat Documentation</li><>

                  <li>Legal Descriptions</li>
                            <li
</>>Ownership Verification</li>
                </ul>
              </div>
            </div>
          )}
          
          {workflowType === 'bla' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200"><>

                <h3 className="text-sm font-medium text-neutral-800">Required Documents:</h3>
                <ul
</> className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1"><>

                  <li>BLA Survey Documents</li>
                            <li
</>>Property Deed(s)</li><>

                  <li>Legal Descriptions (Both Original and New)</li>
                            <li
</>>Ownership Verification</li>
                </ul>
              </div>
            </div>
          )}
          
          {workflowType === 'merge_split' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200"><>

                <h3 className="text-sm font-medium text-neutral-800">Required Documents:</h3>
                <ul
</> className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1"><>

                  <li>Property Deed(s)</li>
                            <li
</>>Survey Documents (if available)</li><>

                  <li>Legal Descriptions</li>
                            <li
</>>Parent Parcel Documentation</li>
                  {formData.caseType === 'split' && <li>Proposed Split Plan</li>}
                </ul>
              </div>
            </div>
          )}
          
          {workflowType === 'sm00_report' && (
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200"><>

                <h3 className="text-sm font-medium text-neutral-800">Required Files:</h3>
                <ul
</> className="list-disc list-inside text-sm text-neutral-600 mt-2 space-y-1"><>

                  <li>Previous Month's SM00 Report (for reference)</li>
                            <li
</>>Segregation Tracking Sheet</li>
                  <li>Any supporting documentation</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Content for subsequent steps
    return (
      <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-6 mb-6"><>

        <h2 className="text-lg font-semibold text-neutral-800 mb-4">
          {steps[currentStep - 1]?.name || 'Step Content'}
        </h2>
        <p
</> className="text-neutral-600 mb-6">
          {steps[currentStep - 1]?.description || 'Complete the information required for this step.'}
        </p>
        
        <div className="p-10 bg-neutral-50 border border-neutral-200 rounded-md flex flex-col items-center justify-center"><>

          <p className="text-neutral-500 mb-2">Step content will be implemented based on workflow type.</p>
          <p
</> className="text-sm text-neutral-400">Additional form fields will appear here.</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeModule={`workflow-${workflowType}`} />
        
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          {/* Workflow Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div><>

                <h1 className="text-2xl font-bold text-neutral-800">{workflowTypeLabels[workflowType]}</h1>
                <p
</> className="text-sm text-neutral-500">{workflowTypeDescriptions[workflowType]}</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 flex items-center"
                  onClick={handleSave}
                  disabled={updateStateMutation.isPending || !isDirty}
                >
                  <SaveIcon className="h-4 w-4 mr-1.5" />
                  {updateStateMutation.isPending ? 'Saving...' : 'Save Draft'}
                </Button>
                {currentStep === steps.length ? (
                  <Button
                    variant="default"
                    className="bg-primary-500 text-white hover:bg-primary-600 flex items-center"
                    onClick={handleComplete}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Complete
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="bg-primary-500 text-white hover:bg-primary-600"
                    onClick={handleNextStep}
                  >
                    Next Step
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Tracker */}
          <ProgressTracker
            steps={steps}
            currentStep={currentStep}
            onStepClick={(stepId) => {
              if (workflow) {
                // Save current state before changing steps
                updateStateMutation.mutate({ currentStep, formData });
                setCurrentStep(stepId);
              }
            }}
          />
          
          {/* Workflow Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form & Checklist */}
            <div className="lg:col-span-2">
              {/* Step Content */}
              {renderStepContent()}
              
              {/* Interactive Checklist */}
              {workflowId && checklistItems && (
                <WorkflowChecklist 
                  workflowId={workflowId} 
                  items={checklistItems}
                  editable={workflow?.status !== 'completed' && workflow?.status !== 'archived'} 
                />
              )}
            </div>
            
            {/* Right Column - Map and Additional Tools */}
            <div className="lg:col-span-1">
              {/* Map Preview */}
              <div className="mb-6">
                <MapPreview 
                  workflowId={workflowId || undefined} 
                  parcelId={formData.parentParcelId || formData.parcel1}
                  enableFullMap={true}
                  onOpenFullMap={() => {
                    // Save state before navigating
                    if (workflowId) {
                      updateStateMutation.mutate({ currentStep, formData });
                      window.location.href = `/map-viewer?workflow=${workflowId}`;
                    }
                  }}
                />
              </div>
              
              {/* Document Upload Card */}
              {workflowId && documents && (
                <div className="mb-6">
                  <DocumentUploader 
                    workflowId={workflowId} 
                    documents={documents}
                    onViewDocument={(doc) => {
                      // In a real implementation, this would open a document viewer
                      toast({
                        title: "Document Viewer",
                        description: `Viewing ${doc.name}`,
                      });
                    }}
                  />
                </div>
              )}
              
              {/* Help Box */}
              <AssistantPanel />
            </div>
          </div>
          
          {/* Step Navigation */}
          <div className="mt-6 flex justify-between"><>

            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              Previous Step
            </Button>
            <div
</>>
              <Button
                variant="outline"
                className="mr-2"
                onClick={handleSave}
                disabled={updateStateMutation.isPending || !isDirty}
              >
                {updateStateMutation.isPending ? 'Saving...' : 'Save Progress'}
              </Button>
              {currentStep === steps.length ? (
                <Button
                  variant="default"
                  className="bg-primary-500 text-white hover:bg-primary-600"
                  onClick={handleComplete}
                >
                  Complete {workflowTypeLabels[workflowType]}
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="bg-primary-500 text-white hover:bg-primary-600"
                  onClick={handleNextStep}
                >
                  Next Step
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
