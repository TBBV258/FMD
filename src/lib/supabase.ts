import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables or server
const getSupabaseConfig = async () => {
  // Try to get from environment variables first (for development)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') {
    console.log('🔧 Supabase: Using environment variables');
    return { supabaseUrl, supabaseAnonKey };
  }

  // Fallback: fetch from server API (try both ports)
  const serverPorts = [9000, 3000];
  
  for (const port of serverPorts) {
    try {
      console.log(`🔧 Supabase: Fetching config from server on port ${port}...`);
      const response = await fetch(`http://localhost:${port}/api/config`);
      if (response.ok) {
        const config = await response.json();
        
        if (!config.supabaseUrl || !config.supabaseKey) {
          throw new Error('Missing Supabase configuration from server');
        }
        
        console.log(`✅ Supabase: Using server configuration from port ${port}`);
        return { 
          supabaseUrl: config.supabaseUrl, 
          supabaseAnonKey: config.supabaseKey 
        };
      }
    } catch (error) {
      console.log(`❌ Supabase: Server on port ${port} not available:`, error.message);
      continue;
    }
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
  if (supabaseClient) {
    return supabaseClient;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const { supabaseUrl, supabaseAnonKey } = await getSupabaseConfig();
      
      if (supabaseUrl === 'https://your-project-id.supabase.co' || supabaseAnonKey === 'your-anon-key-here') {
        console.error('⚠️  WARNING: Using placeholder Supabase credentials!');
        console.error('Please update your environment variables or server config with actual Supabase credentials.');
        console.error('Get them from: https://supabase.com/dashboard/project/[YOUR_PROJECT]/settings/api');
      } else {
        console.log('✅ Supabase: Using actual credentials - authentication should work!');
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });

      console.log('✅ Supabase: Client initialized successfully');
      return supabaseClient;
    } catch (error) {
      console.error('❌ Supabase: Failed to initialize client:', error);
      throw error;
    }
  })();

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
