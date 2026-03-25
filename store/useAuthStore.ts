import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  setAuth: (user: User, session: Session) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  initialized: false,
  setAuth: (user, session) => set({ user, session }),
  clearAuth: () => set({ user: null, session: null }),
  setInitialized: () => set({ initialized: true }),
}));
