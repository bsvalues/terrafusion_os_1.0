/**
 * Supabase Client Configuration
 * Integrated BCBSGeoAssessmentPro Supabase capabilities for Terrafusion Assessor
 *
 * Features:
 * - Multi-environment support (development, training, production)
 * - Advanced authentication with RBAC
 * - GIS and PostGIS integration
 * - Real-time subscriptions
 * - Connection pooling and management
 */

import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { AuthHelpers } from '@supabase/auth-helpers-react';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  environment: 'development' | 'training' | 'production';
  region?: string;
  schema?: string;
  enableRLS?: boolean;
  enableRealtimeAuth?: boolean;
  maxConnections?: number;
  connectionPooling?: boolean;
}

export interface PropertyRecord {
  id: string;
  parcel_id: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip_code: string;
  square_feet: number;
  lot_size: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  property_type: string;
  assessed_value: number;
  market_value: number;
  last_sale_date?: string;
  last_sale_price?: number;
  neighborhood?: string;
  school_district?: string;
  latitude?: number;
  longitude?: number;
  geom?: any; // PostGIS geometry
  created_at: string;
  updated_at: string;
  assessment_year: number;
}

export interface ValuationRecord {
  id: string;
  property_id: string;
  estimated_value: number;
  confidence_score: number;
  model_name: string;
  model_version: string;
  valuation_date: string;
  feature_importance: Record<string, number>;
  comparable_properties: string[];
  market_insights: string[];
  created_at: string;
}

export interface DataQualityRecord {
  id: string;
  table_name: string;
  column_name: string;
  quality_score: number;
  issue_type: string;
  issue_description: string;
  affected_records: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'admin' | 'assessor' | 'analyst' | 'viewer';
  department: string;
  permissions: string[];
  county: string;
  active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export class TerraFusionSupabaseClient {
  private client: SupabaseClient;
  private config: SupabaseConfig;
  private isInitialized = false;
  private connectionPool: Map<string, SupabaseClient> = new Map();

  constructor(config: SupabaseConfig) {
    this.config = config;
    this.client = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: config.schema || 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'terrafusion-assessor',
        },
      },
    });
  }

  /**
   * Initialize the Supabase client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🗄️ Terrafusion Supabase Client initializing...');

    // Test connection
    await this.testConnection();

    // Initialize schemas and extensions
    await this.initializeDatabase();

    // Set up real-time subscriptions
    await this.setupRealtimeSubscriptions();

    // Initialize connection pooling if enabled
    if (this.config.connectionPooling) {
      await this.initializeConnectionPooling();
    }

    this.isInitialized = true;
    console.log(`✅ Supabase client ready for ${this.config.environment} environment`);
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    try {
      const { data, error } = await this.client
        .from('properties')
        .select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet
        throw error;
      }

      console.log('   ✅ Database connection successful');
    } catch (error) {
      console.error('   ❌ Database connection failed:', error);
      throw new Error(`Supabase connection failed: ${error}`);
    }
  }

  /**
   * Initialize database schemas and extensions
   */
  private async initializeDatabase(): Promise<void> {
    console.log('   🏗️ Initializing database schemas...');

    try {
      // Enable PostGIS extension (requires admin privileges)
      if (this.config.serviceKey) {
        const adminClient = createClient(this.config.url, this.config.serviceKey);
        await adminClient.rpc('enable_postgis');
        console.log('   ✅ PostGIS extension enabled');
      }

      // Create custom schemas if needed
      if (this.config.schema && this.config.schema !== 'public') {
        await this.createCustomSchema(this.config.schema);
      }
    } catch (error) {
      console.warn('   ⚠️ Database initialization partial:', error);
    }
  }

  /**
   * Create custom schema
   */
  private async createCustomSchema(schemaName: string): Promise<void> {
    if (!this.config.serviceKey) return;

    try {
      const adminClient = createClient(this.config.url, this.config.serviceKey);
      await adminClient.rpc('create_schema_if_not_exists', { schema_name: schemaName });
      console.log(`   ✅ Schema '${schemaName}' ready`);
    } catch (error) {
      console.warn(`   ⚠️ Schema creation failed: ${error}`);
    }
  }

  /**
   * Set up real-time subscriptions
   */
  private async setupRealtimeSubscriptions(): Promise<void> {
    console.log('   📡 Setting up real-time subscriptions...');

    // Subscribe to property changes
    this.client
      .channel('property-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: this.config.schema || 'public', table: 'properties' },
        payload => this.handlePropertyChange(payload)
      )
      .subscribe();

    // Subscribe to valuation changes
    this.client
      .channel('valuation-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: this.config.schema || 'public', table: 'valuations' },
        payload => this.handleValuationChange(payload)
      )
      .subscribe();

    // Subscribe to data quality alerts
    this.client
      .channel('data-quality-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: this.config.schema || 'public', table: 'data_quality_issues' },
        payload => this.handleDataQualityAlert(payload)
      )
      .subscribe();

    console.log('   ✅ Real-time subscriptions active');
  }

  /**
   * Handle property record changes
   */
  private handlePropertyChange(payload: any): void {
    console.log('📊 Property change detected:', payload.eventType, payload.new?.id);

    // Emit custom events for the application to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('property-change', {
          detail: { type: payload.eventType, data: payload.new || payload.old },
        })
      );
    }
  }

  /**
   * Handle valuation changes
   */
  private handleValuationChange(payload: any): void {
    console.log('💰 Valuation change detected:', payload.eventType, payload.new?.id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('valuation-change', {
          detail: { type: payload.eventType, data: payload.new || payload.old },
        })
      );
    }
  }

  /**
   * Handle data quality alerts
   */
  private handleDataQualityAlert(payload: any): void {
    console.warn('⚠️ Data quality issue detected:', payload.new);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('data-quality-alert', {
          detail: payload.new,
        })
      );
    }
  }

  /**
   * Initialize connection pooling
   */
  private async initializeConnectionPooling(): Promise<void> {
    console.log('   🏊‍♂️ Initializing connection pool...');

    const maxConnections = this.config.maxConnections || 5;

    for (let i = 0; i < maxConnections; i++) {
      const pooledClient = createClient(this.config.url, this.config.anonKey, {
        auth: { persistSession: false },
      });
      this.connectionPool.set(`pool-${i}`, pooledClient);
    }

    console.log(`   ✅ Connection pool ready with ${maxConnections} connections`);
  }

  /**
   * Get a pooled connection
   */
  private getPooledConnection(): SupabaseClient {
    if (this.connectionPool.size === 0) {
      return this.client;
    }

    // Simple round-robin selection
    const connectionIds = Array.from(this.connectionPool.keys());
    const selectedId = connectionIds[Math.floor(Math.random() * connectionIds.length)];
    return this.connectionPool.get(selectedId) || this.client;
  }

  // ===================
  // PROPERTY OPERATIONS
  // ===================

  /**
   * Get properties with advanced filtering
   */
  async getProperties(filters: {
    city?: string;
    county?: string;
    neighborhood?: string;
    minValue?: number;
    maxValue?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    propertyType?: string;
    yearBuiltRange?: [number, number];
    withinGeometry?: any; // PostGIS geometry for spatial queries
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<{ data: PropertyRecord[]; count: number | null; error: PostgrestError | null }> {
    let query = this.client.from('properties').select('*', { count: 'exact' });

    // Apply filters
    if (filters.city) {
      query = query.eq('city', filters.city);
    }

    if (filters.county) {
      query = query.eq('county', filters.county);
    }

    if (filters.neighborhood) {
      query = query.eq('neighborhood', filters.neighborhood);
    }

    if (filters.minValue !== undefined) {
      query = query.gte('assessed_value', filters.minValue);
    }

    if (filters.maxValue !== undefined) {
      query = query.lte('assessed_value', filters.maxValue);
    }

    if (filters.minSquareFeet !== undefined) {
      query = query.gte('square_feet', filters.minSquareFeet);
    }

    if (filters.maxSquareFeet !== undefined) {
      query = query.lte('square_feet', filters.maxSquareFeet);
    }

    if (filters.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }

    if (filters.yearBuiltRange) {
      query = query
        .gte('year_built', filters.yearBuiltRange[0])
        .lte('year_built', filters.yearBuiltRange[1]);
    }

    // Spatial query using PostGIS
    if (filters.withinGeometry) {
      query = query.rpc('properties_within_geometry', {
        geometry_param: filters.withinGeometry,
      });
    }

    // Pagination and ordering
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    if (filters.orderBy) {
      query = query.order(filters.orderBy, {
        ascending: filters.orderDirection === 'asc',
      });
    }

    const result = await query;
    return result;
  }

  /**
   * Get property by ID with related data
   */
  async getPropertyById(propertyId: string): Promise<{
    property: PropertyRecord | null;
    valuations: ValuationRecord[];
    comparables: PropertyRecord[];
    error: PostgrestError | null;
  }> {
    // Get main property
    const { data: property, error: propertyError } = await this.client
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      return { property: null, valuations: [], comparables: [], error: propertyError };
    }

    // Get related valuations
    const { data: valuations, error: valuationsError } = await this.client
      .from('valuations')
      .select('*')
      .eq('property_id', propertyId)
      .order('valuation_date', { ascending: false })
      .limit(10);

    // Get comparable properties using spatial query
    const { data: comparables, error: comparablesError } = await this.client.rpc(
      'find_comparable_properties',
      {
        property_id: propertyId,
        max_distance: 1000, // meters
        similarity_threshold: 0.8,
        max_results: 5,
      }
    );

    return {
      property,
      valuations: valuations || [],
      comparables: comparables || [],
      error: valuationsError || comparablesError,
    };
  }

  /**
   * Create new property record
   */
  async createProperty(
    property: Omit<PropertyRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{
    data: PropertyRecord | null;
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.client.from('properties').insert(property).select().single();

    return { data, error };
  }

  /**
   * Update property record
   */
  async updateProperty(
    propertyId: string,
    updates: Partial<PropertyRecord>
  ): Promise<{
    data: PropertyRecord | null;
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.client
      .from('properties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', propertyId)
      .select()
      .single();

    return { data, error };
  }

  // =====================
  // VALUATION OPERATIONS
  // =====================

  /**
   * Create valuation record
   */
  async createValuation(valuation: Omit<ValuationRecord, 'id' | 'created_at'>): Promise<{
    data: ValuationRecord | null;
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.client
      .from('valuations')
      .insert(valuation)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get valuations for property
   */
  async getPropertyValuations(propertyId: string): Promise<{
    data: ValuationRecord[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.client
      .from('valuations')
      .select('*')
      .eq('property_id', propertyId)
      .order('valuation_date', { ascending: false });

    return { data: data || [], error };
  }

  // ========================
  // DATA QUALITY OPERATIONS
  // ========================

  /**
   * Get data quality metrics
   */
  async getDataQualityMetrics(): Promise<{
    data: any;
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.client.rpc('calculate_data_quality_metrics');

    return { data, error };
  }

  /**
   * Get data quality issues
   */
  async getDataQualityIssues(
    filters: {
      severity?: string;
      tableName?: string;
      unresolved?: boolean;
      limit?: number;
    } = {}
  ): Promise<{
    data: DataQualityRecord[];
    error: PostgrestError | null;
  }> {
    let query = this.client.from('data_quality_issues').select('*');

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.tableName) {
      query = query.eq('table_name', filters.tableName);
    }

    if (filters.unresolved) {
      query = query.is('resolved_at', null);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('detected_at', { ascending: false });

    const { data, error } = await query;
    return { data: data || [], error };
  }

  // =================
  // USER OPERATIONS
  // =================

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<{
    data: UserProfile | null;
    error: PostgrestError | null;
  }> {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (!user) {
      return { data: null, error: null };
    }

    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { data, error };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<{
    data: UserProfile | null;
    error: PostgrestError | null;
  }> {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } as PostgrestError };
    }

    const { data, error } = await this.client
      .from('user_profiles')
      .update({ ...profileData, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    return { data, error };
  }

  // ====================
  // AUTHENTICATION
  // ====================

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return await this.client.auth.signInWithPassword({ email, password });
  }

  /**
   * Sign out current user
   */
  async signOut() {
    return await this.client.auth.signOut();
  }

  /**
   * Get current session
   */
  async getSession() {
    return await this.client.auth.getSession();
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }

  // ====================
  // SPATIAL OPERATIONS
  // ====================

  /**
   * Get properties within radius
   */
  async getPropertiesWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    limit: number = 50
  ): Promise<{
    data: PropertyRecord[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.client.rpc('properties_within_radius', {
      lat: latitude,
      lng: longitude,
      radius_meters: radiusMeters,
      max_results: limit,
    });

    return { data: data || [], error };
  }

  // ====================
  // UTILITY METHODS
  // ====================

  /**
   * Execute custom SQL query (requires service key)
   */
  async executeCustomQuery(query: string, params: any[] = []): Promise<any> {
    if (!this.config.serviceKey) {
      throw new Error('Service key required for custom queries');
    }

    const adminClient = createClient(this.config.url, this.config.serviceKey);
    return await adminClient.rpc('execute_custom_query', {
      query_text: query,
      query_params: params,
    });
  }

  /**
   * Get client status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      environment: this.config.environment,
      url: this.config.url,
      schema: this.config.schema,
      connectionPoolSize: this.connectionPool.size,
      realtimeConnected: this.client.realtime.isConnected(),
    };
  }

  /**
   * Get the underlying Supabase client
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}

// Configuration for different environments
export const supabaseConfigs: Record<string, SupabaseConfig> = {
  development: {
    url: process.env.VITE_SUPABASE_URL || 'https://your-dev-project.supabase.co',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    environment: 'development',
    schema: 'public',
    enableRLS: true,
    connectionPooling: false,
    maxConnections: 3,
  },
  training: {
    url: process.env.VITE_SUPABASE_TRAINING_URL || 'https://your-training-project.supabase.co',
    anonKey: process.env.VITE_SUPABASE_TRAINING_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_TRAINING_SERVICE_KEY,
    environment: 'training',
    schema: 'public',
    enableRLS: true,
    connectionPooling: true,
    maxConnections: 5,
  },
  production: {
    url: process.env.VITE_SUPABASE_PROD_URL || 'https://your-prod-project.supabase.co',
    anonKey: process.env.VITE_SUPABASE_PROD_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_PROD_SERVICE_KEY,
    environment: 'production',
    schema: 'public',
    enableRLS: true,
    connectionPooling: true,
    maxConnections: 10,
  },
};

// Create and export default client instance
const environment = (process.env.NODE_ENV || 'development') as keyof typeof supabaseConfigs;
const config = supabaseConfigs[environment];

export const terraFusionSupabase = new TerraFusionSupabaseClient(config);
