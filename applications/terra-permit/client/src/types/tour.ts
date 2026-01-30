/**
 * Types related to the tour system
 */

// Tour types for strongly typed references
export enum TourType {
  ONBOARDING = 'onboarding',
  DASHBOARD = 'dashboard',
  PERMIT_PROCESSING = 'permit-processing',
  AI_FEATURES = 'ai-features',
  COLLABORATION = 'collaboration',
  HELP_CENTER = 'help-center',
  BATCH_PROCESSING = 'batch-processing',
  DATA_EXPORT = 'data-export'
}

// Tour states
export enum TourState {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

/**
 * Interface for tracking tour progress
 */
export interface TourProgress {
  lastStep: number;
  state: TourState;
  completedAt?: Date;
}

/**
 * Interface for user tour preferences
 */
export interface TourPreferences {
  disableAll: boolean;
  autoStart: boolean;
  tourProgress: Record<TourType, TourProgress>;
}