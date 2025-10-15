/**
 * Document types used in the document classification system.
 * These types align with the documentTypeEnum in schema.ts.
 */
export enum DocumentType {
  PLAT_MAP = 'plat_map',
  DEED = 'deed',
  SURVEY = 'survey',
  LEGAL_DESCRIPTION = 'legal_description',
  BOUNDARY_LINE_ADJUSTMENT = 'boundary_line_adjustment',
  TAX_FORM = 'tax_form',
  UNCLASSIFIED = 'unclassified'
}

/**
 * Gets a human-readable label for a document type
 * @param documentType The document type enum value
 * @returns Human-readable label
 */
export function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    [DocumentType.PLAT_MAP]: 'Plat Map',
    [DocumentType.DEED]: 'Deed',
    [DocumentType.SURVEY]: 'Survey',
    [DocumentType.LEGAL_DESCRIPTION]: 'Legal Description',
    [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: 'Boundary Line Adjustment',
    [DocumentType.TAX_FORM]: 'Tax Form',
    [DocumentType.UNCLASSIFIED]: 'Unclassified Document'
  };

  return labels[documentType] || documentType;
}