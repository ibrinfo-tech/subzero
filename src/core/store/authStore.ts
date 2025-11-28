import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      setUser: (user, token) => set({ user, isAuthenticated: true, token }),
      logout: () => set({ user: null, isAuthenticated: false, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

