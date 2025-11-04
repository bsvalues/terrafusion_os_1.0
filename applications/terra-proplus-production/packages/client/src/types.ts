// Re-export types from the shared schema
import {
  Adjustment,
  Appraisal,
  Attachment,
  Comparable,
  InsertAdjustment,
  InsertAppraisal,
  InsertAttachment,
  InsertComparable,
  InsertMarketData,
  InsertProperty,
  InsertUser,
  MarketData,
  Property,
  User
} from '../shared/schema';

export type {
  Adjustment,
  Appraisal,
  Attachment,
  Comparable,
  InsertAdjustment,
  InsertAppraisal,
  InsertAttachment,
  InsertComparable,
  InsertMarketData,
  InsertProperty,
  InsertUser,
  MarketData,
  Property,
  User
};

// Add additional client-side types as needed

export interface NeighborhoodTimelineDataPoint {
  year: string;
  value: number;
  percentChange?: number;
  transactionCount?: number;
}

export interface NeighborhoodTimeline {
  id: string;
  name: string;
  data: NeighborhoodTimelineDataPoint[];
  avgValue?: number;
  growthRate?: number;
}

// Extended types that add client-specific properties
export interface ComparableWithAdjustments extends Comparable {
  adjusted_price?: number;
  adjustments?: Adjustment[];
  adjustment_notes?: string;
}

export interface MarketOverview {
  totalListings: number;
  avgSalePrice: number;
  avgDaysOnMarket: number;
  medianPricePerSqft: number;
  priceAppreciation: number; // As percentage
  inventoryLevel: number;
  listToSaleRatio: number; // As percentage
  neighborhoodTimelines: NeighborhoodTimeline[];
}

export interface PropertySearchFilters {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface AppraisalSearchFilters {
  status?: string;
  purpose?: string;
  startDate?: Date;
  endDate?: Date;
  propertyId?: number;
  appraiserId?: number;
}

// Dashboard data types

export interface AppraisalTask {
  id: number;
  appraisalId: number;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AppraisalMetrics {
  total: number;
  completed: number;
  inProgress: number;
  scheduled: number;
  canceled: number;
  averageCompletionTime: number; // In days
}

export interface RevenueMetrics {
  currentMonth: number;
  previousMonth: number;
  percentChange: number;
  ytd: number;
  projected: number;
}

export interface DashboardData {
  recentAppraisals: Appraisal[];
  upcomingTasks: AppraisalTask[];
  appraisalMetrics: AppraisalMetrics;
  revenueMetrics: RevenueMetrics;
  marketTrends: {
    medianPrices: { date: string; value: number }[];
    daysOnMarket: { date: string; value: number }[];
    inventory: { date: string; value: number }[];
  };
}