import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables or server
const getSupabaseConfig = async () => {
  // Try to get from environment variables first (for development)
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') {
    console.log('🔧 Supabase: Using environment variables');
    return { supabaseUrl, supabaseAnonKey };
  }

  // Fallback: fetch from server API (use port 9000 consistently)
  try {
    console.log('🔧 Supabase: Fetching config from server on port 9000...');
    const response = await fetch('http://localhost:9000/api/config');
    if (response.ok) {
      const config = await response.json();
      
      if (!config.supabaseUrl || !config.supabaseKey) {
        throw new Error('Missing Supabase configuration from server');
      }
      
      console.log('✅ Supabase: Using server configuration from port 9000');
      return { 
        supabaseUrl: config.supabaseUrl, 
        supabaseAnonKey: config.supabaseKey 
      };
    }
  } catch (error: any) {
    console.log('❌ Supabase: Server on port 9000 not available:', error.message);
  }
  
  // If we have the known credentials from .env, use them directly as fallback
  console.log('🔧 Supabase: Using hardcoded fallback configuration');
  return {
    supabaseUrl: 'https://vltgwacvosllvwsnenao.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdGd3YWN2b3NsbHZ3c25lbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTk4MjQsImV4cCI6MjA2ODg3NTgyNH0.WSoQxPHT2LoY4Ob059i2omxs9xUFg9kGu3eotrvQ_b8'
  };
};

// Initialize Supabase client
let supabaseClient: any = null;
let initPromise: Promise<any> | null = null;

export const initializeSupabase = async () => {
  console.log('🚀 initializeSupabase: Function called');
  
  if (supabaseClient) {
    console.log('✅ initializeSupabase: Client already exists, returning existing client');
    return supabaseClient;
  }

  if (initPromise) {
    console.log('⏳ initializeSupabase: Initialization already in progress, waiting...');
    return initPromise;
  }

  console.log('🔧 initializeSupabase: Starting new initialization...');
  
  initPromise = (async () => {
    try {
      console.log('🔧 initializeSupabase: Getting Supabase configuration...');
      const { supabaseUrl, supabaseAnonKey } = await getSupabaseConfig();
      
      console.log('🔍 initializeSupabase: Config received:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlLength: supabaseUrl?.length,
        keyLength: supabaseAnonKey?.length
      });
      
      if (supabaseUrl === 'https://your-project-id.supabase.co' || supabaseAnonKey === 'your-anon-key-here') {
        console.error('⚠️  WARNING: Using placeholder Supabase credentials!');
        console.error('Please update your environment variables or server config with actual Supabase credentials.');
        console.error('Get them from: https://supabase.com/dashboard/project/[YOUR_PROJECT]/settings/api');
      } else {
        console.log('✅ Supabase: Using actual credentials - authentication should work!');
      }

      console.log('🔧 initializeSupabase: Creating Supabase client...');
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });

      console.log('✅ initializeSupabase: Client created successfully');
      console.log('✅ initializeSupabase: Initialization complete!');
      return supabaseClient;
    } catch (error: any) {
      console.error('❌ initializeSupabase: Failed to initialize client:', error);
      console.error('❌ initializeSupabase: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  })();

  console.log('⏳ initializeSupabase: Returning initialization promise...');
  return initPromise;
};

// Get the Supabase client (initialize if needed)
export const getSupabaseClient = async () => {
  if (!supabaseClient) {
    await initializeSupabase();
  }
  return supabaseClient;
};

// Direct export for components that need immediate access
export const supabase = {
  get client() {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
    }
    return supabaseClient;
  }
};

// Export types for TypeScript
export type SupabaseClient = typeof supabaseClient;
