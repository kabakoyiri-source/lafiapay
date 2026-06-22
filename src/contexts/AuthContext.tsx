// ============================================================================
// LafiaPay — Authentication Context
// Handles mock-mode auth (localStorage) and Supabase auth
// ============================================================================

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { IS_MOCK_MODE } from '../lib/supabase';
import { mockStore, DEMO_CLIENT_ID, DEMO_MERCHANT_ID, DEMO_ADMIN_ID, DEMO_AGENT_ID } from '../lib/mockData';
import type { Profile, Compte, Commercant, UserRole, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signIn: (identifier: string, credential: string, role?: UserRole) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signOut: () => void;
  updateBalance: (delta: number) => void;
  refreshBalance: () => void;
}

interface SignUpData {
  telephone: string;
  nom: string;
  pin: string;
  role: UserRole;
  nom_boutique?: string;
  categorie?: string;
  ville?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  compte: null,
  commercant: null,
  loading: true,
  isDemo: true,
  signIn: async () => false,
  signUp: async () => false,
  signOut: () => {},
  updateBalance: () => {},
  refreshBalance: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    compte: null,
    commercant: null,
    loading: true,
    isDemo: IS_MOCK_MODE,
  });

  // Check for persisted session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('lafiapay-user-id');
    if (savedUserId && IS_MOCK_MODE) {
      const profile = mockStore.getProfile(savedUserId);
      if (profile) {
        const compte = mockStore.comptes.find(c => c.profile_id === savedUserId) || null;
        const commercant = profile.role === 'commercant' 
          ? mockStore.getCommerçant(savedUserId) || null 
          : null;
        setState({
          user: { id: savedUserId },
          profile,
          compte,
          commercant,
          loading: false,
          isDemo: true,
        });
        return;
      }
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Subscribe to mock store changes for balance updates
  useEffect(() => {
    if (!state.user) return;
    const unsub = mockStore.subscribe(() => {
      const compte = mockStore.comptes.find(c => c.profile_id === state.user!.id) || null;
      setState(prev => ({ ...prev, compte }));
    });
    return unsub;
  }, [state.user]);

  const signIn = useCallback(async (identifier: string, credential: string, role?: UserRole): Promise<boolean> => {
    if (IS_MOCK_MODE) {
      // Demo quick-login by role
      if (role === 'client' || identifier === '+223 70 00 00 01') {
        return loginMockUser(DEMO_CLIENT_ID);
      }
      if (role === 'commercant' || identifier === '+223 70 00 00 02') {
        return loginMockUser(DEMO_MERCHANT_ID);
      }
      if (role === 'admin' || identifier === 'admin@demo.com') {
        return loginMockUser(DEMO_ADMIN_ID);
      }
      if (role === 'agent' || identifier === '+223 70 00 00 03') {
        return loginMockUser(DEMO_AGENT_ID);
      }
      // Try finding by phone
      const profile = mockStore.profiles.find(
        p => p.telephone === identifier && p.pin_hash === credential
      );
      if (profile) {
        return loginMockUser(profile.id);
      }
      return false;
    }
    // Real Supabase auth would go here
    return false;
  }, []);

  const loginMockUser = useCallback((userId: string): boolean => {
    const profile = mockStore.getProfile(userId);
    if (!profile) return false;

    const compte = mockStore.comptes.find(c => c.profile_id === userId) || null;
    const commercant = profile.role === 'commercant' 
      ? mockStore.getCommerçant(userId) || null 
      : null;

    localStorage.setItem('lafiapay-user-id', userId);
    setState({
      user: { id: userId },
      profile,
      compte,
      commercant,
      loading: false,
      isDemo: true,
    });
    return true;
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<boolean> => {
    if (IS_MOCK_MODE) {
      // For demo, just login as the demo user of that role
      if (data.role === 'commercant') {
        return loginMockUser(DEMO_MERCHANT_ID);
      }
      return loginMockUser(DEMO_CLIENT_ID);
    }
    return false;
  }, [loginMockUser]);

  const signOut = useCallback(() => {
    localStorage.removeItem('lafiapay-user-id');
    setState({
      user: null,
      profile: null,
      compte: null,
      commercant: null,
      loading: false,
      isDemo: IS_MOCK_MODE,
    });
  }, []);

  const updateBalance = useCallback((delta: number) => {
    if (state.user) {
      mockStore.updateBalance(state.user.id, delta);
    }
  }, [state.user]);

  const refreshBalance = useCallback(() => {
    if (state.user) {
      const compte = mockStore.comptes.find(c => c.profile_id === state.user!.id) || null;
      setState(prev => ({ ...prev, compte }));
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      updateBalance,
      refreshBalance,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
