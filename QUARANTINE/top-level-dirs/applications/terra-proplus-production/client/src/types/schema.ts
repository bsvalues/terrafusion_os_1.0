// Type definitions based on the database schema

export interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  year_built: number | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  description: string | null;
  parcel_number: string | null;
  zoning: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appraisal {
  id: number;
  property_id: number;
  appraiser_id: number;
  status: string;
  purpose: string | null;
  market_value: number | null;
  valuation_method: string | null;
  effective_date: string | null;
  report_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Comparable {
  id: number;
  appraisal_id: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  sale_price: number;
  sale_date: string;
  property_type: string;
  year_built: number | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  distance: number | null;
  created_at: string;
  updated_at: string;
}

export interface Adjustment {
  id: number;
  comparable_id: number;
  name: string;
  amount: number;
  adjustment_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  appraisal_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketData {
  id: number;
  zip_code: string;
  median_price: number;
  avg_price_sqft: number;
  avg_days_on_market: number;
  inventory_count: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}