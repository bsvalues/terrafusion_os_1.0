/**
 * TypeScript Client Example for GeoAssessmentPro Shared Database
 * 
 * This example demonstrates how to connect to the shared Supabase database
 * from a TypeScript/JavaScript application, including authentication,
 * data access, and realtime subscriptions.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/postgrest-js';

// Types
interface Property {
  id: string;
  parcel_number: string;
  address: string;
  property_class: string;
  zoning: string;
  owner_name?: string; // May be null for external applications
  owner_contact?: string; // May be null for external applications
  assessed_value: number;
  last_assessment_date: string;
  location: any; // PostGIS geometry
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface Assessment {
  id: string;
  property_id: string;
  assessment_date: string;
  assessed_value: number;
  land_value: number;
  improvement_value: number;
  assessment_type: string;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

/**
 * GeoAssessmentPro API Service
 * 
 * This class provides methods to interact with the GeoAssessmentPro
 * shared database through Supabase.
 */
class GeoAssessmentProService {
  private supabase: SupabaseClient;
  private serviceName: string;
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  
  /**
   * Create a new GeoAssessmentPro service client
   * 
   * @param supabaseUrl The Supabase project URL
   * @param supabaseKey The Supabase API key (service key for internal, anon key for external)
   * @param serviceName The name of your service for audit tracking
   */
  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    serviceName: string = 'web_client'
  ) {
    this.serviceName = serviceName;
    
    // Create the Supabase client
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
      },
      global: {
        headers: {
          'X-Application-Name': serviceName,
        },
      },
    });
    
    console.log(`GeoAssessmentPro service initialized: ${serviceName}`);
  }
  
  /**
   * Initialize the database connection
   * Sets the application name for audit logging
   */
  async initialize(): Promise<boolean> {
    try {
      // Set the app.service_name parameter for audit logging
      const { error } = await this.supabase.rpc('set_config', {
        parameter: 'app.service_name',
        value: this.serviceName,
        is_local: true
      });
      
      if (error) {
        console.error('Error setting service name:', error);
        return false;
      }
      
      // Test the connection
      const { data, error: testError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
      
      if (testError) {
        console.error('Connection test failed:', testError);
        return false;
      }
      
      console.log('Connection initialized successfully');
      return true;
    } catch (err) {
      console.error('Initialization error:', err);
      return false;
    }
  }
  
  /**
   * Sign in a user with email and password
   * 
   * @param email User's email
   * @param password User's password
   * @returns Authentication result
   */
  async signIn(email: string, password: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<boolean> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return !error;
    } catch (err) {
      console.error('Sign out error:', err);
      return false;
    }
  }
  
  /**
   * Get the current authentication status
   */
  async getAuthStatus(): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get a list of properties
   * 
   * @param limit Maximum number of properties to return
   * @param order Optional ordering
   * @returns List of properties
   */
  async getProperties(limit: number = 10, order?: string): Promise<ServiceResponse<Property[]>> {
    try {
      // Start with the base query
      let query = this.supabase
        .from('core.properties')
        .select('*')
        .limit(limit);
      
      // Apply ordering if specified
      if (order) {
        query = query.order(order);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data: data as Property[],
        count: data?.length || 0
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get a single property by ID
   * 
   * @param propertyId The property ID
   * @returns The property data
   */
  async getPropertyById(propertyId: string): Promise<ServiceResponse<Property>> {
    try {
      // Use the API function for external access
      const { data, error } = await this.supabase
        .rpc('api.get_property_by_id', {
          property_id: propertyId
        });
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data: data as Property
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get a property with its valuation data
   * 
   * @param propertyId The property ID
   * @returns The property with valuation data
   */
  async getPropertyWithValuation(propertyId: string): Promise<ServiceResponse<any>> {
    try {
      // Use the cross-schema function
      const { data, error } = await this.supabase
        .rpc('core.get_property_with_valuation', {
          property_id: propertyId
        });
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get properties within a geographic area
   * 
   * @param lat Latitude of the center point
   * @param lon Longitude of the center point
   * @param radiusMeters Radius in meters
   * @returns Properties within the specified radius
   */
  async getPropertiesInRadius(
    lat: number,
    lon: number,
    radiusMeters: number
  ): Promise<ServiceResponse<any[]>> {
    try {
      // Use the API function
      const { data, error } = await this.supabase
        .rpc('api.get_properties_in_radius', {
          lat,
          lon,
          radius_meters: radiusMeters
        });
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data,
        count: Array.isArray(data) ? data.length : 0
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Subscribe to property updates
   * 
   * @param callback Function to call when a property is updated
   * @returns Subscription ID
   */
  subscribeToPropertyUpdates(
    callback: (payload: any) => void
  ): string {
    const subscriptionId = `property_updates_${Date.now()}`;
    
    // Create the channel
    const channel = this.supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'core',
          table: 'properties',
        },
        (payload) => {
          console.log('Property update received:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status: ${status}`);
      });
    
    // Store the subscription
    this.subscriptions.set(subscriptionId, channel);
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from updates
   * 
   * @param subscriptionId The subscription ID to unsubscribe
   */
  unsubscribe(subscriptionId: string): void {
    const channel = this.subscriptions.get(subscriptionId);
    
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from: ${subscriptionId}`);
    }
  }
  
  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const [id, channel] of this.subscriptions.entries()) {
      channel.unsubscribe();
      console.log(`Unsubscribed from: ${id}`);
    }
    
    this.subscriptions.clear();
  }
  
  /**
   * Upload a file to storage
   * 
   * @param bucket The storage bucket
   * @param path The storage path
   * @param file The file to upload
   * @returns Upload result
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<ServiceResponse<string>> {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      // Get the public URL
      const publicUrl = this.supabase
        .storage
        .from(bucket)
        .getPublicUrl(data.path).data.publicUrl;
      
      return {
        success: true,
        data: publicUrl
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
}

// Example usage
async function runExample() {
  // In a real application, you would get these from environment variables
  const supabaseUrl = 'https://your-project-id.supabase.co';
  const supabaseKey = 'your-api-key';
  
  // Create the service
  const service = new GeoAssessmentProService(
    supabaseUrl,
    supabaseKey,
    'typescript_example'
  );
  
  // Initialize the connection
  const initialized = await service.initialize();
  if (!initialized) {
    console.error('Failed to initialize service');
    return;
  }
  
  // Sign in (if using authenticated access)
  const signInResult = await service.signIn('user@example.com', 'password');
  if (!signInResult.success) {
    console.error('Authentication failed:', signInResult.error);
    return;
  }
  
  // Get a list of properties
  const propertiesResult = await service.getProperties(5, 'created_at.desc');
  if (propertiesResult.success) {
    console.log(`Found ${propertiesResult.count} properties`);
    console.log(propertiesResult.data);
  } else {
    console.error('Error fetching properties:', propertiesResult.error);
  }
  
  // Subscribe to property updates
  const subscriptionId = service.subscribeToPropertyUpdates((payload) => {
    console.log('Property updated:', payload);
  });
  
  // Wait for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Unsubscribe
  service.unsubscribe(subscriptionId);
  
  // Sign out
  await service.signOut();
  console.log('Example completed');
}

// Run the example (in a real application, you would export the class instead)
runExample().catch(console.error);