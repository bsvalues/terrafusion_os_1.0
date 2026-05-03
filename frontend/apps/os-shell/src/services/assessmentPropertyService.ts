import {
  getAssessmentSourceProof,
  getAssessmentSourceProperties,
  type AssessmentPropertiesPage,
  type AssessmentProofResponse,
  type AssessmentPropertySummary,
} from './assessmentSourceService';

export type { AssessmentProofResponse, AssessmentPropertySummary, AssessmentPropertiesPage };

export function getAssessmentProof(): Promise<AssessmentProofResponse> {
  return getAssessmentSourceProof();
}

export function getAssessmentProperties(
  page?: number,
  pageSize?: number,
  search?: string,
): Promise<AssessmentPropertiesPage> {
  return getAssessmentSourceProperties(page, pageSize, search);
}
