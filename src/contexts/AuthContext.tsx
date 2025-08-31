import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/AuthService';
import { UserProfile } from '../config/supabase';
import { SessionService } from '../services/SessionService';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  currentSessionId: string | null;
  startNewSession: (moodBefore?: string) => Promise<string>;
  endCurrentSession: (moodAfter?: string, satisfaction?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const authService = new AuthService();
  const sessionService = new SessionService();

  useEffect(() => {
    // Vérifier la session existante
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const userProfile = await authService.getUserProfile(currentUser.id);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = authService.onAuthStateChange(async (session) => {
      setSession(session);
      
      if (session?.user) {
        const userProfile = await authService.getUserProfile(session.user.id);
        setUser(userProfile);
      } else {
        setUser(null);
        setCurrentSessionId(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      await authService.signUp(email, password, fullName);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (currentSessionId) {
        await endCurrentSession();
      }
      await authService.signOut();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    // Mettre à jour localement
    setUser({ ...user, ...updates });
    
    // Mettre à jour en base
    // TODO: Implémenter la mise à jour Supabase
  };

  const startNewSession = async (moodBefore?: string): Promise<string> => {
    if (!user) throw new Error('Utilisateur non authentifié');

    const sessionId = await sessionService.createSession({
      user_id: user.id,
      mood_before: moodBefore as any,
      ai_model_used: user.preferred_ai_model,
      mode_used: user.preferred_mode
    });

    setCurrentSessionId(sessionId);
    return sessionId;
  };

  const endCurrentSession = async (moodAfter?: string, satisfaction?: number) => {
    if (!currentSessionId) return;

    await sessionService.updateSession(currentSessionId, {
      mood_after: moodAfter as any,
      satisfaction_score: satisfaction,
      duration_minutes: Math.floor((Date.now() - Date.parse(new Date().toISOString())) / 60000)
    });

    setCurrentSessionId(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      updateUserProfile,
      currentSessionId,
      startNewSession,
      endCurrentSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
