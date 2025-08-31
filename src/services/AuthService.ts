import { supabase, UserProfile } from '../config/supabase';
import type { Session, User } from '@supabase/supabase-js';

export class AuthService {
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // Créer le profil utilisateur s'il n'existe pas (fallback au cas où le trigger échoue)
    if (data.user && data.user.email_confirmed_at) {
      try {
        const existingProfile = await this.getUserProfile(data.user.id);
        if (!existingProfile) {
          await this.createUserProfile(data.user.id, email, fullName);
        }
      } catch (err) {
        console.log('Le profil sera créé lors de la confirmation email');
      }
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profil manquant - créer automatiquement
          console.log('Profil manquant pour utilisateur:', userId);
          const user = await this.getCurrentUser();
          if (user && user.id === userId) {
            console.log('Création du profil utilisateur...');
            await this.createUserProfile(user.id, user.email!, user.user_metadata?.full_name);
            
            // Récupérer le profil nouvellement créé
            const { data: newProfile, error: fetchError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (fetchError) {
              console.error('Erreur récupération nouveau profil:', fetchError);
              return null;
            }
            
            console.log('✅ Profil créé avec succès');
            return newProfile;
          }
          return null;
        }
        console.error('Erreur récupération profil:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Erreur getUserProfile:', err);
      return null;
    }
  }

  async createUserProfile(userId: string, email: string, fullName?: string): Promise<UserProfile | null> {
    try {
      const profileData = {
        id: userId,
        email: email,
        full_name: fullName || '',
        preferred_ai_model: 'auto' as const,
        preferred_mode: 'text' as const
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création profil:', error);
        throw error;
      }

      console.log('✅ Profil utilisateur créé:', data);
      return data;
    } catch (err) {
      console.error('Erreur createUserProfile:', err);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour profil:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Erreur updateUserProfile:', err);
      return null;
    }
  }

  async deleteUserProfile(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Erreur suppression profil:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Erreur deleteUserProfile:', err);
      return false;
    }
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      callback(session);
    });
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  // Méthode utilitaire pour vérifier si l'utilisateur est connecté
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  // Méthode pour obtenir la session courante
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}
