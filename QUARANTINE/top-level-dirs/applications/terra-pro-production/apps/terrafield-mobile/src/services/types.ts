/**
 * Notification types for the TerraField Mobile app
 */
export enum NotificationType {
  // System notifications
  SYSTEM = "SYSTEM",

  // Photo-related notifications
  PHOTO_UPLOADED = "PHOTO_UPLOADED",
  PHOTO_ENHANCEMENT_STARTED = "PHOTO_ENHANCEMENT_STARTED",
  PHOTO_ENHANCEMENT_COMPLETED = "PHOTO_ENHANCEMENT_COMPLETED",
  PHOTO_ENHANCEMENT_FAILED = "PHOTO_ENHANCEMENT_FAILED",

  // Sync status notifications
  SYNC_STARTED = "SYNC_STARTED",
  SYNC_COMPLETED = "SYNC_COMPLETED",
  SYNC_FAILED = "SYNC_FAILED",
  SYNC_PROGRESS = "SYNC_PROGRESS",
  OFFLINE_QUEUE_UPDATED = "OFFLINE_QUEUE_UPDATED",

  // Conflict notifications
  CONFLICT_DETECTED = "CONFLICT_DETECTED",
  CONFLICT_RESOLVED = "CONFLICT_RESOLVED",
  CONFLICT_RESOLUTION_REQUIRED = "CONFLICT_RESOLUTION_REQUIRED",

  // Report notifications
  REPORT_GENERATED = "REPORT_GENERATED",
  REPORT_SHARED = "REPORT_SHARED",
  REPORT_EXPORTED = "REPORT_EXPORTED",

  // Property notifications
  PROPERTY_UPDATED = "PROPERTY_UPDATED",
  PROPERTY_DATA_FETCHED = "PROPERTY_DATA_FETCHED",
  MARKET_DATA_UPDATED = "MARKET_DATA_UPDATED",

  // Workflow notifications
  ASSIGNMENT_RECEIVED = "ASSIGNMENT_RECEIVED",
  ASSIGNMENT_COMPLETED = "ASSIGNMENT_COMPLETED",
  DEADLINE_APPROACHING = "DEADLINE_APPROACHING",

  // Compliance notifications
  COMPLIANCE_CHECK_STARTED = "COMPLIANCE_CHECK_STARTED",
  COMPLIANCE_CHECK_COMPLETED = "COMPLIANCE_CHECK_COMPLETED",
  COMPLIANCE_ISSUE_DETECTED = "COMPLIANCE_ISSUE_DETECTED",
}

/**
 * Structure of a notification
 */
export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

/**
 * Structure of an event message sent via WebSocket
 */
export interface WebSocketEvent {
  eventType: string;
  payload: any;
  timestamp: number;
}

/**
 * Structure of a photo enhancement request
 */
export interface PhotoEnhancementRequest {
  photoId: string;
  originalUrl: string;
  propertyId?: string;
  enhancementOptions?: {
    enhanceQuality?: boolean;
    fixLighting?: boolean;
    removeGlare?: boolean;
    detectFeatures?: boolean;
    correctPerspective?: boolean;
  };
}

/**
 * Structure of a photo enhancement result
 */
export interface PhotoEnhancementResult {
  photoId: string;
  originalUrl: string;
  enhancedUrl: string;
  detectedFeatures?: string[];
  metaData?: Record<string, any>;
  processingTime?: number;
  error?: string;
  status: "completed" | "failed" | "processing";
}

/**
 * Structure of a property data record
 */
export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  hasGarage?: boolean;
  hasPool?: boolean;
  lastModified: Date;
  createdAt: Date;
  additionalFeatures?: Record<string, any>;
}

/**
 * Structure of an appraisal report
 */
export interface AppraisalReport {
  id: string;
  propertyId: string;
  reportType: string;
  status: string;
  effectiveDate: Date;
  completionDate?: Date;
  appraiser: string;
  clientName: string;
  purposeOfAppraisal: string;
  opinionOfValue?: number;
  lastModified: Date;
  createdAt: Date;
}

/**
 * Structure of comparable data
 */
export interface ComparableData {
  id: string;
  reportId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  saleDate?: Date;
  salePrice?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  propertyType: string;
  distanceFromSubject?: number;
  adjustments?: Record<string, number>;
  adjustedPrice?: number;
  lastModified: Date;
  createdAt: Date;
}
