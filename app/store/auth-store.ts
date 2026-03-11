import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthStore, AuthUser } from './types';

const initialState = {
  user: null as AuthUser | null,
  isAuthenticated: false,
  isHydrated: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user: AuthUser | null) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      setHydrated: (hydrated: boolean) =>
        set({ isHydrated: hydrated }),
    }),
    {
      name: 'resumeboost-auth',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Memoized selectors for derived state
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectUser = (state: AuthStore) => state.user;
export const selectUserEmail = (state: AuthStore) => state.user?.email ?? null;
export const selectUserRole = (state: AuthStore) => state.user?.role ?? null;
export const selectIsHydrated = (state: AuthStore) => state.isHydrated;
