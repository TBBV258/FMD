import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthState } from '@/lib/types';
import { authService } from '@/lib/services/AuthService';
import { databaseAPI } from '@/lib/api/database';

export function useAuth() {
  console.log('🎭 useAuth: Hook function called');
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  console.log('🔧 useAuth: Initial auth state set:', authState);

  const queryClient = useQueryClient();

  // Query for user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', authState.user?.id],
    queryFn: () => authState.user ? databaseAPI.getUserProfile(authState.user.id) : null,
    enabled: !!authState.user && authState.isAuthenticated,
    retry: (failureCount, error: any) => {
      // If profile doesn't exist, try to create it
      if (error?.code === 'PGRST116' && failureCount === 0) {
        return true;
      }
      return false;
    },
  });

  useEffect(() => {
    console.log('🔧 useAuth: useEffect for auth state listener triggered');
    console.log('🔧 useAuth: Calling authService.onAuthStateChange...');
    
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChange(async (event, session) => {
      console.log('🔐 useAuth: Auth state changed:', event, session);

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('👤 Processing SIGNED_IN event for:', session.user.email);
          
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
          }));

          // Invalidate profile query to refetch
          queryClient.invalidateQueries({ queryKey: ['user-profile', session.user.id] });

        } else if (event === 'SIGNED_OUT') {
          console.log('👤 Processing SIGNED_OUT event');
          
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });

          // Clear all cached data
          queryClient.clear();

        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            console.log('👤 User already logged in:', session.user.email);
            
            setAuthState(prev => ({
              ...prev,
              user: session.user,
              isAuthenticated: true,
              isLoading: false,
            }));

            // Invalidate profile query to refetch
            queryClient.invalidateQueries({ queryKey: ['user-profile', session.user.id] });
          } else {
            console.log('👤 No user logged in');
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
            }));
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          // User state should remain the same
        }
      } catch (error) {
        console.error('❌ Error processing auth event:', event, error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // Update auth state when profile is loaded
  useEffect(() => {
    if (profile && authState.user) {
      setAuthState(prev => ({
        ...prev,
        profile,
      }));
    }
  }, [profile, authState.user]);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.signIn(email, password);
      // Auth state will be updated by the listener
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.signUp(email, password, userData);
      // Auth state will be updated by the listener
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.signInWithGoogle();
      // Auth state will be updated by the listener
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      // Auth state will be updated by the listener
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Only consider profile loading if user is authenticated
  const finalIsLoading = authState.isLoading || (authState.isAuthenticated && profileLoading);
  
  console.log('🔍 useAuth: Final state:', {
    isAuthenticated: authState.isAuthenticated,
    isLoading: finalIsLoading,
    authStateLoading: authState.isLoading,
    profileLoading,
    user: !!authState.user,
    finalIsLoading
  });

  return {
    ...authState,
    profile,
    isLoading: finalIsLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}
