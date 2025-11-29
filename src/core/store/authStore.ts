import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      token: null, // Will be synced with accessToken
      _hasHydrated: false,
      setUser: (user, accessToken, refreshToken) => 
        set({ 
          user, 
          isAuthenticated: true, 
          accessToken, 
          token: accessToken, // Keep token in sync
          refreshToken: refreshToken || null 
        }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        accessToken: null,
        token: null,
        refreshToken: null 
      }),
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

