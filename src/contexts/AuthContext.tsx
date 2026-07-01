// ============================================================================
// LafiaPay — Authentication Context
// Handles mock-mode auth (localStorage) and Supabase auth.
// Supports: demo quick-login, OTP-based login, real registration.
// ============================================================================

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, IS_MOCK_MODE } from '../lib/supabase';
import { mockStore, DEMO_CLIENT_ID, DEMO_MERCHANT_ID, DEMO_ADMIN_ID, DEMO_AGENT_ID } from '../lib/mockData';
import type { Profile, Compte, Commercant, UserRole, AuthState, CommerceCategory } from '../types';

interface AuthContextType extends AuthState {
  signIn: (identifier: string, credential: string, role?: UserRole) => Promise<boolean>;
  signInWithPhone: (telephone: string, pin: string) => Promise<boolean>;
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
  adresse?: string;
  latitude?: number;
  longitude?: number;
  secteur_activite?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  compte: null,
  commercant: null,
  loading: true,
  isDemo: true,
  signIn: async () => false,
  signInWithPhone: async () => false,
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

  const loginRealUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // 1. Fetch profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr || !profile) return false;

      // 2. Fetch compte
      const { data: compte, error: compteErr } = await supabase
        .from('comptes')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();

      // 3. Fetch commercant specifics if merchant
      let commercant = null;
      if (profile.role === 'commercant') {
        const { data: commData } = await supabase
          .from('commercants')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        commercant = commData;
      }

      // 4. Sync store with Supabase
      await mockStore.syncWithSupabase();

      localStorage.setItem('lafiapay-user-id', userId);
      setState({
        user: { id: userId },
        profile: profile as Profile,
        compte: compte as Compte,
        commercant: commercant as Commercant | null,
        loading: false,
        isDemo: false,
      });
      return true;
    } catch (e) {
      console.error('loginRealUser failed:', e);
      return false;
    }
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

  // Check for persisted session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('lafiapay-user-id');
    if (savedUserId) {
      if (IS_MOCK_MODE) {
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
      } else {
        loginRealUser(savedUserId).then(success => {
          if (!success) {
            setState(prev => ({ ...prev, loading: false }));
          }
        });
        return;
      }
    }
    setState(prev => ({ ...prev, loading: false }));
  }, [loginRealUser]);

  // Subscribe to mock store changes for balance updates (mock mode only)
  useEffect(() => {
    if (!IS_MOCK_MODE || !state.user) return;
    const unsub = mockStore.subscribe(() => {
      const compte = mockStore.comptes.find(c => c.profile_id === state.user!.id) || null;
      setState(prev => ({ ...prev, compte }));
    });
    return unsub;
  }, [state.user]);

  // Demo quick-login or credential-based login
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
      // Try finding by phone + PIN
      const profile = mockStore.profiles.find(
        p => p.telephone === identifier && p.pin_hash === credential
      );
      if (profile) {
        return loginMockUser(profile.id);
      }
      return false;
    } else {
      // Real DB mode
      // Demo quick-connect logins
      if (role === 'client' || identifier === '+223 70 00 00 01') {
        const { data } = await supabase.from('profiles').select('id').eq('telephone', '+223 70 00 00 01').maybeSingle();
        if (data) return loginRealUser(data.id);
        return loginMockUser(DEMO_CLIENT_ID);
      }
      if (role === 'commercant' || identifier === '+223 70 00 00 02') {
        const { data } = await supabase.from('profiles').select('id').eq('telephone', '+223 70 00 00 02').maybeSingle();
        if (data) return loginRealUser(data.id);
        return loginMockUser(DEMO_MERCHANT_ID);
      }
      if (role === 'admin' || identifier === 'admin@demo.com') {
        const { data } = await supabase.from('profiles').select('id').eq('telephone', '+223 70 00 00 00').maybeSingle();
        if (data) return loginRealUser(data.id);
        return loginMockUser(DEMO_ADMIN_ID);
      }
      if (role === 'agent' || identifier === '+223 70 00 00 03') {
        const { data } = await supabase.from('profiles').select('id').eq('telephone', '+223 70 00 00 03').maybeSingle();
        if (data) return loginRealUser(data.id);
        return loginMockUser(DEMO_AGENT_ID);
      }

      // Standard credentials lookup (phone + pin)
      const cleanPhone = identifier.replace(/\D/g, '');
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) {
        const match = profiles.find(p => {
          const pClean = p.telephone.replace(/\D/g, '');
          const cleanMatch = (cleanPhone.length >= 8 && pClean.length >= 8)
            ? pClean.slice(-8) === cleanPhone.slice(-8)
            : pClean === cleanPhone;
          return cleanMatch && p.pin_hash === credential;
        });
        if (match) {
          return await loginRealUser(match.id);
        }
      }
      return false;
    }
  }, [loginMockUser, loginRealUser]);

  // Login by phone + PIN (for OTP-verified flow)
  const signInWithPhone = useCallback(async (telephone: string, pin: string): Promise<boolean> => {
    if (IS_MOCK_MODE) {
      const cleanPhone = telephone.replace(/\s+/g, '');
      const profile = mockStore.profiles.find(p => {
        return p.telephone.replace(/\s+/g, '') === cleanPhone && p.pin_hash === pin;
      });
      if (profile) {
        return loginMockUser(profile.id);
      }
      return false;
    } else {
      try {
        const cleanPhone = telephone.replace(/\D/g, '');
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) {
          const match = profiles.find(p => {
            const pClean = p.telephone.replace(/\D/g, '');
            const cleanMatch = (cleanPhone.length >= 8 && pClean.length >= 8)
              ? pClean.slice(-8) === cleanPhone.slice(-8)
              : pClean === cleanPhone;
            return cleanMatch && p.pin_hash === pin;
          });
          if (match) {
            return await loginRealUser(match.id);
          }
        }
        return false;
      } catch (e) {
        console.error('Real signInWithPhone failed:', e);
        return false;
      }
    }
  }, [loginMockUser, loginRealUser]);

  // Real registration
  const signUp = useCallback(async (data: SignUpData): Promise<boolean> => {
    if (IS_MOCK_MODE) {
      try {
        const newProfile = mockStore.registerUser({
          telephone: data.telephone,
          nom: data.nom,
          pin: data.pin,
          role: data.role,
          nom_boutique: data.nom_boutique,
          categorie: data.categorie as CommerceCategory | undefined,
          ville: data.ville,
          adresse: data.adresse,
          latitude: data.latitude,
          longitude: data.longitude,
          secteur_activite: data.secteur_activite,
        });
        
        return loginMockUser(newProfile.id);
      } catch (e) {
        console.error('Registration failed:', e);
        return false;
      }
    } else {
      try {
        const userId = crypto.randomUUID();
        
        // 1. Insert Profile
        const { error: profileErr } = await supabase.from('profiles').insert({
          id: userId,
          role: data.role,
          nom: data.nom,
          telephone: data.telephone,
          pin_hash: data.pin,
          kyc_niveau: 1,
          statut: 'actif',
        });
        if (profileErr) throw profileErr;

        // 2. Create Compte
        const { error: compteErr } = await supabase.from('comptes').insert({
          profile_id: userId,
          solde: 0.0,
        });
        if (compteErr) throw compteErr;

        // 3. Create Commercant specifics if merchant
        if (data.role === 'commercant' && data.nom_boutique) {
          const qrId = `QR-${data.nom_boutique.toUpperCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 999)}`;
          const { error: commErr } = await supabase.from('commercants').insert({
            id: userId,
            nom_boutique: data.nom_boutique,
            categorie: data.categorie || 'autre',
            ville: data.ville || 'Bamako',
            qr_code_id: qrId,
            adresse: data.adresse || '',
            latitude: data.latitude !== undefined ? data.latitude : 12.6392,
            longitude: data.longitude !== undefined ? data.longitude : -8.0029,
            secteur_activite: data.secteur_activite || '',
            est_agent: false,
          });
          if (commErr) throw commErr;
        }

        return await loginRealUser(userId);
      } catch (e) {
        console.error('Real Registration failed:', e);
        return false;
      }
    }
  }, [loginMockUser, loginRealUser]);

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
      if (IS_MOCK_MODE) {
        mockStore.updateBalance(state.user.id, delta);
      } else {
        refreshBalance();
      }
    }
  }, [state.user]);

  const refreshBalance = useCallback(async () => {
    if (state.user) {
      if (IS_MOCK_MODE) {
        const compte = mockStore.comptes.find(c => c.profile_id === state.user!.id) || null;
        setState(prev => ({ ...prev, compte }));
      } else {
        const { data: compte } = await supabase
          .from('comptes')
          .select('*')
          .eq('profile_id', state.user!.id)
          .maybeSingle();
        if (compte) {
          setState(prev => ({ ...prev, compte: compte as Compte }));
        }
      }
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signInWithPhone,
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
