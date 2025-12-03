import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  isEmailVerified: boolean;
  tenantId: string | null;
  roles?: Array<{ id: string; name: string; code: string }>;
  permissions?: Array<{
    permissionCode: string;
    permissionName: string;
    moduleCode: string;
    moduleName: string;
  }>;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  token: string | null; // Alias for accessToken for convenience
  _hasHydrated: boolean; // Internal flag to track hydration
  setUser: (user: User, accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

// SSR-safe storage wrapper
const createStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return createJSONStorage(() => localStorage);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      token: null,
      _hasHydrated: false,
      setUser: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          token: accessToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          token: null,
          isAuthenticated: false,
        }),
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createStorage(),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Skip hydration during SSR
      skipHydration: typeof window === 'undefined',
    }
  )
);