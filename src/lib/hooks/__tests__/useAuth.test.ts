import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';
import { authService } from '@/lib/services/AuthService';

// Mock the auth service
vi.mock('@/lib/services/AuthService', () => ({
  authService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    clear: vi.fn(),
  })),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(authService.onAuthStateChange).mockReturnValue(() => {});
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('should handle sign in', async () => {
    vi.mocked(authService.onAuthStateChange).mockReturnValue(() => {});
    vi.mocked(authService.signIn).mockResolvedValue({
      user: { 
        id: '1', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z'
      },
      session: { 
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: { 
          id: '1', 
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2023-01-01T00:00:00Z'
        }
      },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle sign up', async () => {
    vi.mocked(authService.onAuthStateChange).mockReturnValue(() => {});
    vi.mocked(authService.signUp).mockResolvedValue({
      user: { 
        id: '1', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z'
      },
      session: null
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp('test@example.com', 'password', {
        first_name: 'Test',
        last_name: 'User',
      });
    });

    expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'password', {
      first_name: 'Test',
      last_name: 'User',
    });
  });

  it('should handle sign out', async () => {
    vi.mocked(authService.onAuthStateChange).mockReturnValue(() => {});
    vi.mocked(authService.signOut).mockResolvedValue();

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(authService.signOut).toHaveBeenCalled();
  });

  it('should handle Google sign in', async () => {
    vi.mocked(authService.onAuthStateChange).mockReturnValue(() => {});
    vi.mocked(authService.signInWithGoogle).mockResolvedValue({
      provider: 'google',
      url: 'https://example.com/auth/callback'
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(authService.signInWithGoogle).toHaveBeenCalled();
  });
});
