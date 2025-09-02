/**
 * Supabase Database Service for CostForge AI Champion
 * 
 * Provides cloud-based PostgreSQL database integration with real-time capabilities
 * for cost matrices, property data, and analysis results.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface CostMatrix {
  id?: number;
  region: string;
  building_type: string;
  cost_per_sqft: number;
  quality_level: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
}

export interface PropertyData {
  id?: number;
  prop_id: string;
  building_type: string;
  square_footage: number;
  year_built: number;
  region: string;
  condition?: string;
  features?: string[];
  estimated_cost?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnalysisResult {
  id?: number;
  analysis_type: string;
  input_data: any;
  result_data: any;
  confidence_score?: number;
  ai_provider?: string;
  created_at?: string;
  user_id?: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;
  private initialized: boolean = false;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.warn('Supabase credentials not set - database service will be disabled');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      this.initialized = true;
      logger.info('Supabase service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Supabase service:', error);
    }
  }

  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      const { data, error } = await this.supabase
        .from('cost_matrices')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
        logger.warn('Supabase connection test failed:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Supabase connection test exception:', error);
      return false;
    }
  }

  // ==================== COST MATRICES ====================

  /**
   * Get all cost matrices
   */
  async getAllCostMatrices(options?: { limit?: number; offset?: number }): Promise<CostMatrix[]> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      let query = this.supabase
        .from('cost_matrices')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching cost matrices: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAllCostMatrices:', error);
      throw error;
    }
  }

  /**
   * Get cost matrices by region and building type
   */
  async getCostMatricesByRegionAndType(region: string, buildingType: string): Promise<CostMatrix[]> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('cost_matrices')
        .select('*')
        .eq('region', region)
        .eq('building_type', buildingType)
        .order('quality_level');

      if (error) {
        throw new Error(`Error fetching cost matrices: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getCostMatricesByRegionAndType:', error);
      throw error;
    }
  }

  /**
   * Create new cost matrix entry
   */
  async createCostMatrix(costMatrix: Omit<CostMatrix, 'id' | 'created_at' | 'updated_at'>): Promise<CostMatrix> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('cost_matrices')
        .insert([costMatrix])
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error creating cost matrix: ${error.message}`);
      }

      logger.info('Created cost matrix entry', { region: costMatrix.region, buildingType: costMatrix.building_type });
      return data;
    } catch (error) {
      logger.error('Error in createCostMatrix:', error);
      throw error;
    }
  }

  /**
   * Update cost matrix entry
   */
  async updateCostMatrix(id: number, updates: Partial<CostMatrix>): Promise<CostMatrix> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('cost_matrices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error updating cost matrix: ${error.message}`);
      }

      logger.info('Updated cost matrix entry', { id });
      return data;
    } catch (error) {
      logger.error('Error in updateCostMatrix:', error);
      throw error;
    }
  }

  // ==================== PROPERTY DATA ====================

  /**
   * Get all properties with pagination
   */
  async getAllProperties(options?: { limit?: number; offset?: number }): Promise<PropertyData[]> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      let query = this.supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching properties: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAllProperties:', error);
      throw error;
    }
  }

  /**
   * Get property by property ID
   */
  async getPropertyByPropId(propId: string): Promise<PropertyData | null> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('properties')
        .select('*')
        .eq('prop_id', propId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(`Error fetching property: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      logger.error('Error in getPropertyByPropId:', error);
      throw error;
    }
  }

  /**
   * Create new property
   */
  async createProperty(property: Omit<PropertyData, 'id' | 'created_at' | 'updated_at'>): Promise<PropertyData> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('properties')
        .insert([property])
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error creating property: ${error.message}`);
      }

      logger.info('Created property entry', { propId: property.prop_id });
      return data;
    } catch (error) {
      logger.error('Error in createProperty:', error);
      throw error;
    }
  }

  // ==================== ANALYSIS RESULTS ====================

  /**
   * Save analysis result
   */
  async saveAnalysisResult(result: Omit<AnalysisResult, 'id' | 'created_at'>): Promise<AnalysisResult> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('analysis_results')
        .insert([result])
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error saving analysis result: ${error.message}`);
      }

      logger.info('Saved analysis result', { type: result.analysis_type, provider: result.ai_provider });
      return data;
    } catch (error) {
      logger.error('Error in saveAnalysisResult:', error);
      throw error;
    }
  }

  /**
   * Get analysis results by type
   */
  async getAnalysisResultsByType(analysisType: string, limit: number = 50): Promise<AnalysisResult[]> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('analysis_results')
        .select('*')
        .eq('analysis_type', analysisType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Error fetching analysis results: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAnalysisResultsByType:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Execute custom SQL query (be careful with this!)
   */
  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      logger.warn('Executing raw SQL query:', { query: query.substring(0, 100) });
      
      // This would require a service role key for raw SQL
      // For now, return a warning
      throw new Error('Raw SQL execution not implemented - use specific methods instead');
    } catch (error) {
      logger.error('Error in executeRawQuery:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    if (!this.initialized) {
      throw new Error('Supabase service is not initialized');
    }

    try {
      const [costMatricesCount, propertiesCount, analysisResultsCount] = await Promise.allSettled([
        this.supabase.from('cost_matrices').select('count').single(),
        this.supabase.from('properties').select('count').single(),
        this.supabase.from('analysis_results').select('count').single()
      ]);

      return {
        costMatrices: costMatricesCount.status === 'fulfilled' ? costMatricesCount.value.data : 0,
        properties: propertiesCount.status === 'fulfilled' ? propertiesCount.value.data : 0,
        analysisResults: analysisResultsCount.status === 'fulfilled' ? analysisResultsCount.value.data : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in getDatabaseStats:', error);
      return {
        error: 'Failed to fetch database statistics',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new SupabaseService();