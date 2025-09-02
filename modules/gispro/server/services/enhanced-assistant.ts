import { WorkflowType, Workflow, WorkflowState, Document, ChecklistItem } from "@shared/schema";

// Define some display labels for workflow types
const workflowTypeLabels: Record<WorkflowType, string> = {
  [WorkflowType.LONG_PLAT]: "Long Plat",
  [WorkflowType.BLA]: "Boundary Line Adjustment",
  [WorkflowType.MERGE_SPLIT]: "Merge/Split",
  [WorkflowType.SM00_REPORT]: "SM00 Report"
};

// Enhanced AI Assistant service for GIS Workflow System

// Define the context interface for the assistant
interface AssistantContext {
  workflow?: Workflow;
  workflowState?: WorkflowState;
  documents?: Document[];
  checklistItems?: ChecklistItem[];
  currentStep?: number;
}

// Define potential question categories
enum QuestionCategory {
  WORKFLOW_GENERAL = "workflow_general",
  DOCUMENT_HANDLING = "document_handling",
  PARCEL_MANAGEMENT = "parcel_management",
  GIS_MAPPING = "gis_mapping",
  REGULATORY = "regulatory",
  TECHNICAL = "technical",
  WORKFLOW_SPECIFIC = "workflow_specific",
  OTHER = "other"
}

// Define response templates with placeholders
const responseTemplates: Record<string, string> = {
  // General workflow responses
  "next_step_long_plat": "For your Long Plat workflow '{workflowTitle}', your next step is '{nextStepName}': {nextStepDescription}. Make sure to complete the following items: {pendingChecklistItems}",
  "next_step_bla": "For your BLA workflow '{workflowTitle}', your next step is '{nextStepName}': {nextStepDescription}. Make sure you've uploaded the necessary legal documents and verified property lines.",
  "next_step_merge_split": "For your Merge/Split workflow '{workflowTitle}', your next step is '{nextStepName}': {nextStepDescription}. Be sure to confirm all parcel boundaries are properly defined.",
  "next_step_sm00_report": "For your SM00 Report '{workflowTitle}', your next step is '{nextStepName}': {nextStepDescription}. Ensure all data parameters are set correctly for the reporting period.",
  
  // Document handling responses
  "missing_documents_long_plat": "I notice your Long Plat workflow is missing these critical documents: {missingDocuments}. Please upload them to proceed with the approval process.",
  "document_requirements_bla": "For a Boundary Line Adjustment, you need: 1) Legal description of existing parcels, 2) Survey of proposed boundary changes, 3) Owner consent forms, 4) Title reports for all affected parcels.",
  "document_classification": "I analyzed your document '{documentName}' and identified it as a {documentType} with {confidence}% confidence. This document contains information about {documentKeywords}.",
  
  // Parcel management responses
  "parcel_generation_help": "To generate new parcel numbers: 1) Enter parent parcel ID ({parentParcelExample}), 2) Specify number of new parcels needed ({totalLots}), 3) The system will create sequential IDs following the Ab/Sub code system used in Benton County.",
  "parcel_requirements": "Each new parcel should have: 1) A unique ID, 2) A complete legal description, 3) Defined boundaries, 4) Recorded ownership information. Your workflow '{workflowTitle}' needs {pendingChecklistItems}.",
  
  // GIS mapping responses
  "map_layer_advice": "For best visualization when working with {workflowType} workflows, I recommend enabling these layers: {recommendedLayers}. This will help you better analyze the spatial relationships.",
  
  // Step-specific guidance
  "step_guidance": "In the current step '{currentStepName}', focus on: {stepGuidance}. Based on similar workflows, users typically spend {avgTimeOnStep} completing this step.",
};

/**
 * Categorizes a user query to determine the most relevant response area
 * @param query User's question
 * @returns The determined question category
 */
function categorizeQuery(query: string): QuestionCategory {
  const normalizedQuery = query.toLowerCase();
  
  // Dictionary of keywords for each category
  const categoryKeywords: Record<QuestionCategory, string[]> = {
    [QuestionCategory.WORKFLOW_GENERAL]: ["workflow", "process", "steps", "complete", "status", "progress", "next", "finish"],
    [QuestionCategory.DOCUMENT_HANDLING]: ["document", "upload", "file", "scan", "form", "survey", "plat", "deed", "description"],
    [QuestionCategory.PARCEL_MANAGEMENT]: ["parcel", "lot", "number", "generate", "id", "boundary", "property", "split", "merge"],
    [QuestionCategory.GIS_MAPPING]: ["map", "layer", "gis", "spatial", "geometry", "draw", "coordinate", "geography"],
    [QuestionCategory.REGULATORY]: ["regulation", "law", "requirement", "code", "compliance", "standard", "legal"],
    [QuestionCategory.TECHNICAL]: ["system", "error", "bug", "fix", "interface", "browser", "save", "load"],
    [QuestionCategory.WORKFLOW_SPECIFIC]: ["long plat", "short plat", "bla", "boundary line adjustment", "sm00", "report"],
    [QuestionCategory.OTHER]: []
  };
  
  // Score each category based on keyword matches
  const scores: Record<QuestionCategory, number> = {
    [QuestionCategory.WORKFLOW_GENERAL]: 0,
    [QuestionCategory.DOCUMENT_HANDLING]: 0,
    [QuestionCategory.PARCEL_MANAGEMENT]: 0,
    [QuestionCategory.GIS_MAPPING]: 0,
    [QuestionCategory.REGULATORY]: 0,
    [QuestionCategory.TECHNICAL]: 0,
    [QuestionCategory.WORKFLOW_SPECIFIC]: 0,
    [QuestionCategory.OTHER]: 0
  };
  
  // Calculate scores
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword)) {
        scores[category as QuestionCategory] += 1;
      }
    }
  }
  
  // Find category with highest score
  let maxScore = 0;
  let maxCategory = QuestionCategory.OTHER;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category as QuestionCategory;
    }
  }
  
  return maxCategory;
}

/**
 * Analyzes the context to determine missing documents or checklist items
 * @param context Current workflow context
 * @returns Object containing missing items analysis
 */
function analyzeWorkflowContext(context: AssistantContext): {
  missingDocuments: string[];
  pendingChecklistItems: string[];
  progress: number;
  nextStepName: string;
  nextStepDescription: string;
  recommendedLayers: string[];
} {
  const { workflow, workflowState, documents, checklistItems } = context;
  
  // Default values
  const result = {
    missingDocuments: [] as string[],
    pendingChecklistItems: [] as string[],
    progress: 0,
    nextStepName: "N/A",
    nextStepDescription: "No specific guidance available",
    recommendedLayers: [] as string[],
  };
  
  if (!workflow) return result;
  
  // Analyze based on workflow type
  switch (workflow.type) {
    case "long_plat":
      // Expected documents for long plat
      const expectedLongPlatDocs = ["Survey Map", "Legal Description", "Ownership Certificate"];
      result.missingDocuments = expectedLongPlatDocs.filter(doc => 
        !documents?.some(d => d.name.toLowerCase().includes(doc.toLowerCase()))
      );
      
      // Recommended map layers
      result.recommendedLayers = ["Property Boundaries", "Zoning", "Aerial Imagery", "Topography"];
      break;
      
    case "bla":
      // Expected documents for BLA
      const expectedBLADocs = ["Boundary Survey", "Legal Description", "Owner Consent Forms"];
      result.missingDocuments = expectedBLADocs.filter(doc => 
        !documents?.some(d => d.name.toLowerCase().includes(doc.toLowerCase()))
      );
      
      // Recommended map layers
      result.recommendedLayers = ["Property Boundaries", "Parcel Lines", "Rights of Way"];
      break;
      
    case "merge_split":
      // Expected documents for merge/split
      const expectedMergeSplitDocs = ["Deed", "Survey Map", "Lot Configuration"];
      result.missingDocuments = expectedMergeSplitDocs.filter(doc => 
        !documents?.some(d => d.name.toLowerCase().includes(doc.toLowerCase()))
      );
      
      // Recommended map layers
      result.recommendedLayers = ["Property Boundaries", "Parcel Lines", "Subdivisions"];
      break;
      
    case "sm00_report":
      // Expected documents for SM00 report
      const expectedSM00Docs = ["Previous Reports", "Department Signatures"];
      result.missingDocuments = expectedSM00Docs.filter(doc => 
        !documents?.some(d => d.name.toLowerCase().includes(doc.toLowerCase()))
      );
      
      // Recommended map layers
      result.recommendedLayers = ["County Boundaries", "Administrative Areas"];
      break;
  }
  
  // Analyze pending checklist items
  if (checklistItems?.length) {
    result.pendingChecklistItems = checklistItems
      .filter(item => !item.completed)
      .map(item => item.title);
    
    // Calculate progress
    const completedItems = checklistItems.filter(item => item.completed).length;
    result.progress = Math.round((completedItems / checklistItems.length) * 100);
  }
  
  // Determine next step info based on workflow steps from context
  if (workflow && context.currentStep !== undefined) {
    // We'd need to import these from workflow-types, assuming similar structure
    // This is mockup logic that would be replaced with actual step lookup
    const currentStep = context.currentStep;
    const nextStep = currentStep + 1;
    
    // Mock step names based on typical workflow (would be replaced with actual data)
    const stepInfo = {
      long_plat: [
        { name: "Basic Info", description: "Enter general plat information" },
        { name: "Documents", description: "Upload and review required documents" },
        { name: "Parcels", description: "Define new parcels and generate IDs" },
        { name: "Map", description: "Review and update GIS map information" },
        { name: "Review", description: "Final review and submission" }
      ],
      bla: [
        { name: "Initial Info", description: "Enter basic BLA information" },
        { name: "Documents", description: "Upload required BLA documents" },
        { name: "Boundaries", description: "Define new boundaries" },
        { name: "Review", description: "Final review and approval" }
      ],
      merge_split: [
        { name: "Selection", description: "Select parcels to merge or split" },
        { name: "Documents", description: "Upload deed documents" },
        { name: "New Config", description: "Define new configuration" },
        { name: "Map", description: "Review map changes" },
        { name: "Submit", description: "Complete and submit changes" }
      ],
      sm00_report: [
        { name: "Parameters", description: "Set report parameters" },
        { name: "Data", description: "Review data to be included" },
        { name: "Generate", description: "Generate and distribute report" }
      ]
    };
    
    // Set next step info if available
    const steps = stepInfo[workflow.type as keyof typeof stepInfo];
    if (steps && nextStep < steps.length) {
      result.nextStepName = steps[nextStep].name;
      result.nextStepDescription = steps[nextStep].description;
    }
  }
  
  return result;
}

/**
 * Processes a template with context variables
 * @param template Template string with placeholders
 * @param variables Object containing replacement values
 * @returns Processed string with placeholders replaced by values
 */
function processTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    // Handle arrays by joining them into a comma-separated list
    const replacement = Array.isArray(value) ? value.join(", ") : String(value);
    result = result.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return result;
}

/**
 * Primary function to handle a user query in context
 * @param query User's question
 * @param context Current workflow context
 * @returns AI assistant response
 */
export function getEnhancedResponse(query: string, context: AssistantContext): string {
  // Step 1: Categorize the query
  const category = categorizeQuery(query);
  
  // Step 2: Analyze the context
  const contextAnalysis = analyzeWorkflowContext(context);
  
  // Step 3: Select appropriate response template based on query and context
  let responseTemplate = "";
  
  // Simplified decision tree - in a real system, this would use more sophisticated NLP
  if (query.toLowerCase().includes("next step") || query.toLowerCase().includes("what should i do")) {
    if (context.workflow) {
      switch (context.workflow.type) {
        case "long_plat":
          responseTemplate = responseTemplates.next_step_long_plat;
          break;
        case "bla":
          responseTemplate = responseTemplates.next_step_bla;
          break;
        case "merge_split":
          responseTemplate = responseTemplates.next_step_merge_split;
          break;
        case "sm00_report":
          responseTemplate = responseTemplates.next_step_sm00_report;
          break;
      }
    }
  } else if (query.toLowerCase().includes("document") && query.toLowerCase().includes("need")) {
    if (context.workflow?.type === "long_plat") {
      responseTemplate = responseTemplates.missing_documents_long_plat;
    } else if (context.workflow?.type === "bla") {
      responseTemplate = responseTemplates.document_requirements_bla;
    }
  } else if (query.toLowerCase().includes("parcel") && (query.toLowerCase().includes("generate") || query.toLowerCase().includes("create"))) {
    responseTemplate = responseTemplates.parcel_generation_help;
  } else if (query.toLowerCase().includes("map") || query.toLowerCase().includes("layer")) {
    responseTemplate = responseTemplates.map_layer_advice;
  } else if (context.currentStep !== undefined) {
    responseTemplate = responseTemplates.step_guidance;
  }
  
  // If no specific template matched, use a generic response
  if (!responseTemplate) {
    return "I'm not sure about that specific question. Would you like to know about the next steps in your workflow, document requirements, or parcel management?";
  }
  
  // Step 4: Fill template with contextual information
  const templateVariables = {
    workflowTitle: context.workflow?.title || "Current workflow",
    workflowType: context.workflow ? workflowTypeLabels[context.workflow.type as WorkflowType] : "workflow",
    nextStepName: contextAnalysis.nextStepName,
    nextStepDescription: contextAnalysis.nextStepDescription,
    pendingChecklistItems: contextAnalysis.pendingChecklistItems.length > 0 
      ? contextAnalysis.pendingChecklistItems.join(", ") 
      : "All checklist items are complete!",
    missingDocuments: contextAnalysis.missingDocuments.length > 0 
      ? contextAnalysis.missingDocuments.join(", ") 
      : "All required documents are present",
    documentName: context.documents && context.documents.length > 0 ? context.documents[0].name : "your document",
    documentType: "survey map", // This would be from actual document classification
    documentKeywords: "property boundaries, legal descriptions", // This would be from actual content analysis
    confidence: "85", // This would be from actual classification model
    recommendedLayers: contextAnalysis.recommendedLayers.join(", "),
    parentParcelExample: "111222333444555", // Example format
    totalLots: context.workflowState?.formData && 'totalLots' in (context.workflowState.formData as any) ? (context.workflowState.formData as any).totalLots : "4",
    currentStepName: contextAnalysis.nextStepName,
    stepGuidance: "completing all required form fields and uploading supporting documentation",
    avgTimeOnStep: "15-20 minutes",
  };
  
  return processTemplate(responseTemplate, templateVariables);
}

/**
 * Generates contextual recommendations for the current workflow
 * @param context Current workflow context
 * @returns Array of recommendation objects with title and description
 */
export function generateWorkflowRecommendations(context: AssistantContext): Array<{title: string, description: string}> {
  const recommendations = [];
  const contextAnalysis = analyzeWorkflowContext(context);
  
  // Add recommendations based on missing documents
  if (contextAnalysis.missingDocuments.length > 0) {
    recommendations.push({
      title: "Upload Missing Documents",
      description: `Your workflow is missing these critical documents: ${contextAnalysis.missingDocuments.join(", ")}`
    });
  }
  
  // Add recommendations based on pending checklist items
  if (contextAnalysis.pendingChecklistItems.length > 0) {
    recommendations.push({
      title: "Complete Checklist Items",
      description: `You have ${contextAnalysis.pendingChecklistItems.length} pending tasks to complete`
    });
  }
  
  // Add map layer recommendations
  if (contextAnalysis.recommendedLayers.length > 0) {
    recommendations.push({
      title: "Optimize Map View",
      description: `For best visualization, enable these layers: ${contextAnalysis.recommendedLayers.join(", ")}`
    });
  }
  
  // Add workflow-specific recommendations
  if (context.workflow) {
    switch (context.workflow.type) {
      case "long_plat":
        recommendations.push({
          title: "Review Legal Descriptions",
          description: "Ensure all parcel legal descriptions are accurate and conform to county standards"
        });
        break;
      case "bla":
        recommendations.push({
          title: "Verify Owner Consent",
          description: "Confirm all property owners have provided signed consent forms for the boundary adjustment"
        });
        break;
      case "merge_split":
        recommendations.push({
          title: "Check Zoning Compliance",
          description: "Verify that the new parcel configuration complies with current zoning requirements"
        });
        break;
      case "sm00_report":
        recommendations.push({
          title: "Validate Data Completeness",
          description: "Ensure all required data fields are populated for accurate reporting"
        });
        break;
    }
  }
  
  // Always return at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      title: "Proceed to Next Step",
      description: "Your workflow is on track. Continue to the next step when ready."
    });
  }
  
  return recommendations;
}

/**
 * Analyzes document content to extract relevant information for form auto-filling
 * @param documentContent Document text content
 * @param documentType Type of document being analyzed
 * @returns Object with extracted field values
 */
export function extractDocumentData(documentContent: string, documentType: string): Record<string, any> {
  // This is a simplified implementation - in a real system this would use NLP/ML for extraction
  const extractedData: Record<string, any> = {};
  
  // Simple regex-based extraction patterns
  const patterns = {
    parcelId: /parcel(?:\s+id|number|#)?[:|\s]+(\d{15})/i,
    ownerName: /owner(?:\s+name)?[:|\s]+([A-Za-z\s]+)/i,
    surveyDate: /(?:survey|date)[:|\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    acreage: /(?:area|acreage|acres)[:|\s]+([\d.]+)/i,
    legalDescription: /legal\s+description[:|\s]+([A-Za-z0-9\s,.;()-]+)/i,
    address: /(?:site|property)\s+address[:|\s]+([A-Za-z0-9\s,.;()-]+)/i
  };
  
  // Extract data based on patterns
  for (const [field, pattern] of Object.entries(patterns)) {
    const match = documentContent.match(pattern);
    if (match && match[1]) {
      extractedData[field] = match[1].trim();
    }
  }
  
  return extractedData;
}

/**
 * Automatically generates checklist items based on workflow type and context
 * @param workflowType Type of workflow
 * @param specialConsiderations Any special aspects to consider
 * @returns Array of checklist item objects
 */
export function generateDynamicChecklist(workflowType: WorkflowType, specialConsiderations?: string[]): Array<{title: string, description: string}> {
  // Base checklists by workflow type
  const baseChecklists: Record<WorkflowType, Array<{title: string, description: string}>> = {
    [WorkflowType.LONG_PLAT]: [
      {
        title: "Verify plat submission documents",
        description: "Ensure all required documents are submitted and complete"
      },
      {
        title: "Check legal descriptions",
        description: "Validate accuracy of all legal descriptions"
      },
      {
        title: "Verify parent parcel information",
        description: "Confirm parent parcel details are correct"
      },
      {
        title: "Generate new parcel IDs",
        description: "Create and assign new parcel identifiers"
      },
      {
        title: "Update GIS map layers",
        description: "Add new parcels to GIS system"
      }
    ],
    [WorkflowType.BLA]: [
      {
        title: "Verify boundary adjustment documentation",
        description: "Check that all required BLA documents are present"
      },
      {
        title: "Confirm owner consent",
        description: "Verify all property owners have consented to the adjustment"
      },
      {
        title: "Validate new boundaries",
        description: "Ensure new boundaries comply with regulations"
      },
      {
        title: "Update property records",
        description: "Adjust property records to reflect boundary changes"
      }
    ],
    [WorkflowType.MERGE_SPLIT]: [
      {
        title: "Verify parcel eligibility",
        description: "Confirm parcels are eligible for merge/split"
      },
      {
        title: "Review deed documentation",
        description: "Check all deeds and legal documents for accuracy"
      },
      {
        title: "Validate new configuration",
        description: "Ensure new parcel configuration meets county requirements"
      },
      {
        title: "Update GIS records",
        description: "Modify GIS database to reflect changes"
      }
    ],
    [WorkflowType.SM00_REPORT]: [
      {
        title: "Set report parameters",
        description: "Define date range and included properties"
      },
      {
        title: "Validate data completeness",
        description: "Ensure all required data fields are available"
      },
      {
        title: "Generate draft report",
        description: "Create preliminary report for review"
      },
      {
        title: "Obtain approvals",
        description: "Secure necessary department approvals"
      }
    ]
  };
  
  // Get base checklist
  const checklist = [...baseChecklists[workflowType]];
  
  // Add special consideration items if provided
  if (specialConsiderations && specialConsiderations.length > 0) {
    for (const consideration of specialConsiderations) {
      if (consideration.toLowerCase().includes("water")) {
        checklist.push({
          title: "Verify water rights documentation",
          description: "Confirm all water rights are properly documented and transferred"
        });
      }
      
      if (consideration.toLowerCase().includes("zoning")) {
        checklist.push({
          title: "Check zoning compliance",
          description: "Ensure changes comply with current zoning regulations"
        });
      }
      
      if (consideration.toLowerCase().includes("historical") || consideration.toLowerCase().includes("heritage")) {
        checklist.push({
          title: "Review historical property status",
          description: "Verify any historical designations or restrictions"
        });
      }
      
      if (consideration.toLowerCase().includes("environmental") || consideration.toLowerCase().includes("wetland")) {
        checklist.push({
          title: "Assess environmental factors",
          description: "Document any environmental considerations or protected areas"
        });
      }
    }
  }
  
  return checklist;
}