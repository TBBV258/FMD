import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import type { AuthService } from '@/lib/types';

// Preserve storage bucket names
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
} as const;

// Preserve table names
export const TABLES = {
  USERS: 'users',
  DOCUMENTS: 'documents',
  CHATS: 'chats',
  NOTIFICATIONS: 'notifications',
} as const;

class AuthServiceImpl implements AuthService {
  private client: SupabaseClient | null = null;
  private initialized = false;

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      this.client = await getSupabaseClient();
      this.initialized = true;
    }
  }

  async signIn(email: string, password: string) {
    await this.ensureInitialized();
    if (!this.client) throw new Error('Supabase client not initialized');

    console.log('🔐 Attempting sign in with email:', email);
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }

    console.log('✅ Sign in successful:', data.user?.email);
    return data;
  }

  async signUp(email: string, password: string, userData: any) {
    await this.ensureInitialized();
    if (!this.client) throw new Error('Supabase client not initialized');

    console.log('🔐 Attempting sign up with email:', email, 'userData:', userData);
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }

    console.log('✅ Sign up successful:', data.user?.email);

    // Try to create user profile in our users table (preserves existing logic)
    if (data.user) {
      try {
        console.log('🔧 Creating user profile in database...');
        const { error: profileError } = await this.client
          .from(TABLES.USERS)
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            points: 0,
            is_premium: false,
          });

        if (profileError) {
          console.error('❌ Failed to create user profile:', profileError);
        } else {
          console.log('✅ User profile created successfully');
        }
      } catch (profileError) {
        console.error('❌ Error creating user profile:', profileError);
      }
    }

    return data;
  }

  async signInWithGoogle() {
    await this.ensureInitialized();
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.ensureInitialized();
    if (!this.client) throw new Error('Supabase client not initialized');

    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<User | null> {
    await this.ensureInitialized();
    if (!this.client) throw new Error('Supabase client not initialized');

    const {
      data: { user },
    } = await this.client.auth.getUser();
    return user;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // If not initialized, initialize first then set up listener
    if (!this.initialized || !this.client) {
      console.log('🔧 AuthService: Initializing before setting up auth listener...');
      this.ensureInitialized().then(() => {
        if (this.client) {
          console.log('🔧 AuthService: Setting up auth state change listener');
          const {
            data: { subscription },
          } = this.client.auth.onAuthStateChange(callback);
          
          // Store unsubscribe for this specific subscription
          const unsubscribe = () => subscription.unsubscribe();
          this._subscriptions.push(unsubscribe);
        }
      }).catch(error => {
        console.error('❌ AuthService: Failed to initialize for auth state change:', error);
      });
      
      // Return no-op unsubscribe for now
      return () => {};
    }

    console.log('🔧 AuthService: Setting up auth state change listener');
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange(callback);

    const unsubscribe = () => subscription.unsubscribe();
    this._subscriptions.push(unsubscribe);
    
    return unsubscribe;
  }

  private _subscriptions: (() => void)[] = [];

  // Clean up all subscriptions
  cleanup() {
    this._subscriptions.forEach(unsubscribe => unsubscribe());
    this._subscriptions = [];
  }

  // Expose client for backward compatibility
  getClient(): SupabaseClient | null {
    return this.client;
  }
}

// Create singleton instance
export const authService = new AuthServiceImpl();

// Initialize on module load for compatibility
authService.ensureInitialized().catch(console.error);
