/**
 * Supabase Client
 * 
 * This file initializes and exports the Supabase client for use throughout the application.
 * It uses environment variables for configuration.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase-types';
import { logger } from '../server/utils/logger';

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing required Supabase environment variables (SUPABASE_URL, SUPABASE_KEY)');
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Create the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // We'll handle session management ourselves
    autoRefreshToken: true,
  },
});

/**
 * Function to check Supabase connectivity
 * @returns {Promise<boolean>} - True if connectivity is good, false otherwise
 */
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    // Simple query to check connection
    const { error } = await supabase.from('properties').select('id').limit(1);
    
    if (error) {
      logger.error('Supabase health check failed:', error);
      return false;
    }
    
    logger.info('Supabase health check successful');
    return true;
  } catch (error) {
    logger.error('Error during Supabase health check:', error);
    return false;
  }
};

// Export the supabase client as "database" as well for compatibility
export const database = supabase;