import { useAuthStore } from '../../store/useAuthStore';
import type { User, Session } from '@supabase/supabase-js';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { full_name: 'Test User' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
} as User;

const mockSession = {
  access_token: 'access-token-abc',
  refresh_token: 'refresh-token-xyz',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
} as Session;

// Reset store before each test
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    session: null,
    initialized: false,
  });
});

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('starts with no user', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('starts with no session', () => {
      expect(useAuthStore.getState().session).toBeNull();
    });

    it('starts uninitialized', () => {
      expect(useAuthStore.getState().initialized).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('stores user and session', () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
    });

    it('stores user email correctly', () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    });

    it('stores access token correctly', () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);
      expect(useAuthStore.getState().session?.access_token).toBe('access-token-abc');
    });

    it('does not change initialized flag', () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);
      expect(useAuthStore.getState().initialized).toBe(false);
    });
  });

  describe('clearAuth', () => {
    it('clears user and session after setAuth', () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });

    it('is safe to call when already cleared', () => {
      expect(() => useAuthStore.getState().clearAuth()).not.toThrow();
    });

    it('does not affect initialized flag', () => {
      useAuthStore.getState().setInitialized();
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().initialized).toBe(true);
    });
  });

  describe('setInitialized', () => {
    it('marks store as initialized', () => {
      useAuthStore.getState().setInitialized();
      expect(useAuthStore.getState().initialized).toBe(true);
    });

    it('is idempotent', () => {
      useAuthStore.getState().setInitialized();
      useAuthStore.getState().setInitialized();
      expect(useAuthStore.getState().initialized).toBe(true);
    });
  });

  describe('auth flow', () => {
    it('reflects correct state after full login flow', () => {
      // 1. App boots — not initialized
      expect(useAuthStore.getState().initialized).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();

      // 2. Auth state loaded
      useAuthStore.getState().setAuth(mockUser, mockSession);
      useAuthStore.getState().setInitialized();

      expect(useAuthStore.getState().initialized).toBe(true);
      expect(useAuthStore.getState().user).not.toBeNull();

      // 3. User signs out
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().initialized).toBe(true); // still initialized
    });
  });
});
