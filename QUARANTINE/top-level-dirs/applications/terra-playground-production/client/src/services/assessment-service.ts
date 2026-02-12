/**
 * Service for interacting with the assessment API.
 */

// Types for assessment metrics
export interface AssessmentMetrics {
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageTime: number;
  valueTrend: Array<{ date: string; value: number }>;
  assessmentDelta?: DeltaInfo;
  completionDelta?: DeltaInfo;
}

export interface DeltaInfo {
  value: number;
  isPercentage: boolean;
  period?: string;
  isPositive?: boolean;
  hideIcon?: boolean;
}

// Types for assessment details
export interface AssessmentDetails {
  id: string;
  propertyId: string;
  assessor: string;
  startDate: string | Date;
  endDate?: string | Date;
  assessedValue: number;
  previousValue?: number;
  status: string;
  notes?: string;
  appealEligible?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Types for assessment status changes
export interface AssessmentStatusChange {
  id: string;
  assessmentId: string;
  status: string;
  changedBy: string;
  timestamp: string | Date;
  notes?: string;
}

/**
 * Get assessment metrics with optional time range filter.
 */
export async function getAssessmentMetrics(
  timeRange: string = 'month'
): Promise<AssessmentMetrics> {
  try {
    const response = await fetch(`/api/assessment-metrics?timeRange=${timeRange}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch assessment metrics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching assessment metrics:', error);
    throw error;
  }
}

/**
 * Get details for a specific assessment.
 */
export async function getAssessmentById(assessmentId: string): Promise<AssessmentDetails> {
  try {
    const response = await fetch(`/api/assessments/${assessmentId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch assessment details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Get all assessments for a property.
 */
export async function getPropertyAssessments(propertyId: string): Promise<AssessmentDetails[]> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/assessments`);

    if (!response.ok) {
      throw new Error(`Failed to fetch property assessments: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching assessments for property ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Create a new assessment.
 */
export async function createAssessment(
  assessmentData: Partial<AssessmentDetails>
): Promise<AssessmentDetails> {
  try {
    const response = await fetch('/api/assessments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create assessment: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
}

/**
 * Update an existing assessment.
 */
export async function updateAssessment(
  assessmentId: string,
  updates: Partial<AssessmentDetails>
): Promise<AssessmentDetails> {
  try {
    const response = await fetch(`/api/assessments/${assessmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update assessment: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Get status history for an assessment.
 */
export async function getAssessmentStatusHistory(
  assessmentId: string
): Promise<AssessmentStatusChange[]> {
  try {
    const response = await fetch(`/api/assessments/${assessmentId}/status-history`);

    if (!response.ok) {
      throw new Error(`Failed to fetch assessment status history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching status history for assessment ${assessmentId}:`, error);
    throw error;
  }
}
