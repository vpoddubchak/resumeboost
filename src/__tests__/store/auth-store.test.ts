import { useAuthStore } from '@/app/store/auth-store';
import type { AuthUser } from '@/app/store/types';

// Reset store between tests
beforeEach(() => {
  const { clearUser, setHydrated } = useAuthStore.getState();
  clearUser();
  setHydrated(false);
});

describe('Auth Store', () => {
  const mockUser: AuthUser = {
    userId: 1,
    email: 'test@example.com',
    role: 'job_seeker',
    firstName: 'Test',
    lastName: 'User',
    image: null,
  };

  describe('initial state', () => {
    it('should have null user', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should not be authenticated', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should not be hydrated', () => {
      const state = useAuthStore.getState();
      expect(state.isHydrated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and mark authenticated', () => {
      useAuthStore.getState().setUser(mockUser);
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set user to null and mark unauthenticated', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('clearUser', () => {
    it('should clear user and mark unauthenticated', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().clearUser();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setHydrated', () => {
    it('should set hydrated state', () => {
      useAuthStore.getState().setHydrated(true);
      expect(useAuthStore.getState().isHydrated).toBe(true);
    });

    it('should unset hydrated state', () => {
      useAuthStore.getState().setHydrated(true);
      useAuthStore.getState().setHydrated(false);
      expect(useAuthStore.getState().isHydrated).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should return new state objects on update', () => {
      const stateBefore = useAuthStore.getState();
      useAuthStore.getState().setUser(mockUser);
      const stateAfter = useAuthStore.getState();
      expect(stateBefore.user).not.toBe(stateAfter.user);
    });
  });
});
