/**
 * Supabase Client for Browser
 * 
 * This client provides an interface to Supabase services from the browser.
 */

// Initialize Supabase client
let supabaseClient = null;
let supabaseLoaded = false;

// Configuration - this will be updated with actual values from the server
const supabaseConfig = {
  url: '',
  key: '',
  autoRefreshToken: true,
  persistSession: true,
  storage: window.localStorage
};

/**
 * Initialize the Supabase client
 */
async function initSupabase() {
  if (supabaseLoaded) return supabaseClient;
  
  try {
    // Load configuration from server
    const response = await fetch('/api/supabase-config');
    if (response.ok) {
      const config = await response.json();
      if (config.url && config.key) {
        supabaseConfig.url = config.url;
        supabaseConfig.key = config.key;
        
        // Create client
        supabaseClient = supabase.createClient(
          supabaseConfig.url,
          supabaseConfig.key,
          {
            autoRefreshToken: supabaseConfig.autoRefreshToken,
            persistSession: supabaseConfig.persistSession,
            storage: supabaseConfig.storage
          }
        );
        
        supabaseLoaded = true;
        console.log('Supabase client initialized');
        return supabaseClient;
      }
    }
    throw new Error('Failed to load Supabase configuration');
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
}

/**
 * Get the Supabase client instance
 */
async function getSupabase() {
  if (!supabaseLoaded) {
    return await initSupabase();
  }
  return supabaseClient;
}

/**
 * Upload a file to Supabase storage
 * 
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket
 * @param {string} path - The path within the bucket
 * @returns {Promise<string|null>} - The public URL or null on failure
 */
async function uploadFile(file, bucket = 'documents', path = '') {
  const client = await getSupabase();
  if (!client) return null;
  
  try {
    const fileName = path ? `${path}/${file.name}` : file.name;
    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * List files in a storage bucket
 * 
 * @param {string} bucket - The storage bucket
 * @param {string} path - The path within the bucket
 * @returns {Promise<Array|null>} - The list of files or null on failure
 */
async function listFiles(bucket = 'documents', path = '') {
  const client = await getSupabase();
  if (!client) return null;
  
  try {
    const { data, error } = await client.storage
      .from(bucket)
      .list(path);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error listing files:', error);
    return null;
  }
}

/**
 * Get a download URL for a file
 * 
 * @param {string} bucket - The storage bucket
 * @param {string} path - The path to the file
 * @returns {Promise<string|null>} - The download URL or null on failure
 */
async function getFileUrl(bucket, path) {
  const client = await getSupabase();
  if (!client) return null;
  
  try {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60); // 1 hour expiry
    
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}

/**
 * Delete a file from storage
 * 
 * @param {string} bucket - The storage bucket
 * @param {string} path - The path to the file
 * @returns {Promise<boolean>} - Success or failure
 */
async function deleteFile(bucket, path) {
  const client = await getSupabase();
  if (!client) return false;
  
  try {
    const { error } = await client.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Export functions for use in other modules
window.supabaseStorage = {
  uploadFile,
  listFiles,
  getFileUrl,
  deleteFile
};