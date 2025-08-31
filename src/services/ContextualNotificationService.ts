/**
 * CONTEXTUAL NOTIFICATION SERVICE - NOTIFICATION CONTEXTUELLE SYSTÉMATIQUE
 * Service de génération des notifications de début de session selon template obligatoire
 * Implémentation exacte des spécifications du document de refonte
 * Date: 30/08/2025
 */

import { supabase } from '../config/supabase';
import type { TherapyProgram } from './TherapyProgramManager';
import type { TherapySession } from './SessionManager';

// Types pour les notifications contextuelles
export interface SessionNotificationData {
  expert_name: string;
  user_name: string;
  session_theme: string;
  session_format: string;
  duration_minutes: number;
  session_number: number;
  program_name: string;
  previous_session_summary: string;
  transition_question: string;
}

export interface ContextualNotification {
  notification_text: string;
  expert_voice_config: string;
  personalization_notes: string[];
  cultural_adaptations: string[];
  estimated_duration_seconds: number;
}

export interface ContinuityContext {
  last_session_key_point: string;
  progress_since_last: string;
  current_challenges: string[];
  transition_bridge: string;
}

/**
 * GÉNÉRATEUR DE NOTIFICATIONS CONTEXTUELLES OBLIGATOIRES
 * Chaque session DOIT commencer par une notification selon template exact
 */
export class ContextualNotificationService {
  
  /**
   * GÉNÉRATION NOTIFICATION CONTEXTUELLE COMPLÈTE
   * Selon template obligatoire du document de refonte
   */
  async generateSessionNotification(
    sessionId: string,
    expertId: string,
    userId: string
  ): Promise<ContextualNotification> {
    try {
      // 1. Collecter données contextuelles
      const notificationData = await this.collectNotificationData(sessionId, userId);
      
      // 2. Récupérer contexte de continuité
      const continuityContext = await this.buildContinuityContext(
        notificationData.session_number,
        notificationData.program_name,
        userId
      );
      
      // 3. Adapter selon expert
      const expertAdaptation = this.adaptNotificationToExpert(expertId, notificationData);
      
      // 4. Construire notification selon template obligatoire
      const notificationText = this.buildMandatoryTemplate(
        notificationData,
        continuityContext,
        expertAdaptation
      );
      
      // 5. Configuration vocale selon expert
      const voiceConfig = this.getExpertVoiceConfig(expertId);
      
      // 6. Notes de personnalisation
      const personalizationNotes = [
        `Expert: ${notificationData.expert_name}`,
        `Session ${notificationData.session_number} du programme "${notificationData.program_name}"`,
        `Thème: ${notificationData.session_theme}`,
        `Durée: ${notificationData.duration_minutes} minutes`,
        `Continuité: ${continuityContext.last_session_key_point}`
      ];
      
      // 7. Adaptations culturelles si applicable
      const culturalAdaptations = await this.applyCulturalAdaptations(
        notificationText,
        userId,
        expertId
      );
      
      return {
        notification_text: culturalAdaptations.adapted_text,
        expert_voice_config: voiceConfig,
        personalization_notes: personalizationNotes,
        cultural_adaptations: culturalAdaptations.adaptations_applied,
        estimated_duration_seconds: this.estimateNotificationDuration(culturalAdaptations.adapted_text)
      };
      
    } catch (error) {
      console.error('Erreur génération notification contextuelle:', error);
      
      // Fallback vers notification générique sécurisée
      return this.generateFallbackNotification(expertId);
    }
  }
  
  /**
   * CONSTRUCTION TEMPLATE OBLIGATOIRE
   * Template exact selon spécifications document de refonte
   */
  private buildMandatoryTemplate(
    data: SessionNotificationData,
    continuity: ContinuityContext,
    expertAdaptation: any
  ): string {
    // Template obligatoire exact du document de refonte
    const template = `Dr. ${this.getExpertLastName(data.expert_name)} : "Bonjour ${data.user_name} !

📋 SESSION D'AUJOURD'HUI :

Thème : ${data.session_theme}

Format : ${data.session_format}

Durée : ${data.duration_minutes} minutes

Progression : Session ${data.session_number} de votre programme '${data.program_name}'

🔄 CONTINUITÉ :
${continuity.last_session_key_point}
${continuity.transition_bridge}

Êtes-vous prêt(e) à commencer ?"`;
    
    // Adaptation selon style expert
    return this.adaptTemplateToExpertStyle(template, expertAdaptation);
  }
  
  /**
   * COLLECTE DONNÉES CONTEXTUELLES
   * Rassembler toutes informations nécessaires pour notification
   */
  private async collectNotificationData(
    sessionId: string,
    userId: string
  ): Promise<SessionNotificationData> {
    try {
      // 1. Récupérer session actuelle
      const { data: session } = await supabase
        .from('therapy_sessions')
        .select('*, therapy_programs(*)')
        .eq('id', sessionId)
        .single();
      
      if (!session) throw new Error('Session introuvable');
      
      // 2. Récupérer profil utilisateur
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('first_name, preferred_name')
        .eq('user_id', userId)
        .single();
      
      // 3. Déterminer informations session
      const sessionTheme = session.main_content?.session_theme || 
                          session.therapy_programs?.current_focus_area || 
                          'Développement personnel';
      
      const sessionFormat = this.determineSessionFormat(session);
      const expertName = this.getExpertNameFromId(session.assigned_expert_id || 'dr_sarah_empathie');
      
      return {
        expert_name: expertName,
        user_name: userProfile?.preferred_name || userProfile?.first_name || 'Cher utilisateur',
        session_theme: sessionTheme,
        session_format: sessionFormat,
        duration_minutes: session.planned_duration_minutes || 25,
        session_number: session.session_number,
        program_name: session.therapy_programs?.program_name || 'Accompagnement thérapeutique',
        previous_session_summary: '', // À remplir par buildContinuityContext
        transition_question: '' // À remplir par buildContinuityContext
      };
      
    } catch (error) {
      console.error('Erreur collecte données notification:', error);
      throw error;
    }
  }
  
  /**
   * CONSTRUCTION CONTEXTE DE CONTINUITÉ
   * Lien intelligent avec session précédente
   */
  private async buildContinuityContext(
    currentSessionNumber: number,
    programName: string,
    userId: string
  ): Promise<ContinuityContext> {
    try {
      if (currentSessionNumber === 1) {
        // Première session - pas de continuité
        return {
          last_session_key_point: 'Nous commençons ensemble votre parcours thérapeutique.',
          progress_since_last: 'Début du programme',
          current_challenges: [],
          transition_bridge: 'Comment vous sentez-vous à l\'idée de débuter cette nouvelle étape ?'
        };
      }
      
      // Sessions suivantes - rechercher session précédente
      const { data: previousSession } = await supabase
        .from('therapy_sessions')
        .select('session_summary, main_content, post_session_mood_score')
        .eq('user_id', userId)
        .eq('session_number', currentSessionNumber - 1)
        .eq('status', 'completed')
        .single();
      
      if (!previousSession) {
        return {
          last_session_key_point: 'Dans notre dernière rencontre, nous avons travaillé sur votre développement personnel.',
          progress_since_last: 'Évolution en cours',
          current_challenges: [],
          transition_bridge: 'Comment vous êtes-vous senti(e) depuis notre dernière session ?'
        };
      }
      
      // Extraire point clé de la session précédente
      const keyPoint = this.extractKeyPointFromSession(previousSession);
      const progressNote = this.assessProgressSinceLastSession(previousSession);
      const transitionQuestion = this.generateTransitionQuestion(previousSession, currentSessionNumber);
      
      return {
        last_session_key_point: `Dans notre dernière session, nous avons travaillé sur ${keyPoint}.`,
        progress_since_last: progressNote,
        current_challenges: previousSession.session_summary?.challenges_identified || [],
        transition_bridge: transitionQuestion
      };
      
    } catch (error) {
      console.error('Erreur contexte continuité:', error);
      
      return {
        last_session_key_point: 'Nous poursuivons votre parcours thérapeutique avec bienveillance.',
        progress_since_last: 'Évolution continue',
        current_challenges: [],
        transition_bridge: 'Comment vous portez-vous depuis notre dernière rencontre ?'
      };
    }
  }
  
  /**
   * ADAPTATION SELON EXPERT
   * Personnalisation style selon Dr. Sarah/Alex/Aicha
   */
  private adaptNotificationToExpert(expertId: string, data: SessionNotificationData): any {
    const expertAdaptations = {
      'dr_sarah_empathie': {
        greeting_style: 'chaleureux et bienveillant',
        tone_adjustment: 'empathique et encourageant',
        cultural_sensitivity: 'occidental standard',
        voice_warmth: 'high',
        transition_style: 'questions ouvertes et validation'
      },
      'dr_alex_mindfulness': {
        greeting_style: 'serein et centré',
        tone_adjustment: 'calme et philosophique',
        cultural_sensitivity: 'universel spirituel',
        voice_warmth: 'medium',
        transition_style: 'invitations à la présence'
      },
      'dr_aicha_culturelle': {
        greeting_style: 'respectueux et familial',
        tone_adjustment: 'chaleureux et traditionnel',
        cultural_sensitivity: 'arabo-musulman',
        voice_warmth: 'high',
        transition_style: 'références familiales et sagesse'
      }
    };
    
    return expertAdaptations[expertId as keyof typeof expertAdaptations] || expertAdaptations['dr_sarah_empathie'];
  }
  
  /**
   * ADAPTATION TEMPLATE SELON STYLE EXPERT
   * Modification fine selon personnalité expert
   */
  private adaptTemplateToExpertStyle(template: string, expertAdaptation: any): string {
    let adaptedTemplate = template;
    
    // Adaptation selon Dr. Alex Mindfulness
    if (expertAdaptation.tone_adjustment === 'calme et philosophique') {
      adaptedTemplate = adaptedTemplate.replace(
        'Êtes-vous prêt(e) à commencer ?',
        'Prenons un moment ensemble pour nous centrer avant de commencer. Êtes-vous présent(e) à cet instant ?'
      );
    }
    
    // Adaptation selon Dr. Aicha Culturelle
    if (expertAdaptation.cultural_sensitivity === 'arabo-musulman') {
      adaptedTemplate = adaptedTemplate.replace(
        'Bonjour',
        'Ahlan wa sahlan ! السلام عليكم Bonjour'
      );
      adaptedTemplate = adaptedTemplate.replace(
        'Êtes-vous prêt(e) à commencer ?',
        'Inch\'Allah, êtes-vous prêt(e) pour cette session ensemble ?'
      );
    }
    
    return adaptedTemplate;
  }
  
  /**
   * ADAPTATIONS CULTURELLES
   * Application adaptations selon profil utilisateur et expert
   */
  private async applyCulturalAdaptations(
    notificationText: string,
    userId: string,
    expertId: string
  ): Promise<{
    adapted_text: string;
    adaptations_applied: string[];
  }> {
    try {
      // Récupérer contexte culturel utilisateur
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('cultural_background, language_preference, religious_considerations')
        .eq('user_id', userId)
        .single();
      
      let adaptedText = notificationText;
      const adaptationsApplied: string[] = [];
      
      // Adaptations selon contexte culturel
      if (userProfile?.cultural_background?.includes('arabe') && expertId === 'dr_aicha_culturelle') {
        // Ajouter formules de politesse culturelles
        adaptedText = adaptedText.replace(
          '🔄 CONTINUITÉ :',
          'بإذن الله 🔄 CONTINUITÉ :'
        );
        adaptationsApplied.push('Formules arabes ajoutées');
      }
      
      if (userProfile?.religious_considerations?.includes('musulman')) {
        adaptedText = adaptedText.replace(
          'Êtes-vous prêt(e)',
          'Inch\'Allah, êtes-vous prêt(e)'
        );
        adaptationsApplied.push('Références religieuses respectueuses');
      }
      
      // Adaptation langue si nécessaire
      if (userProfile?.language_preference === 'ar' && expertId === 'dr_aicha_culturelle') {
        adaptationsApplied.push('Préparation langue arabe');
      }
      
      return {
        adapted_text: adaptedText,
        adaptations_applied: adaptationsApplied
      };
      
    } catch (error) {
      console.error('Erreur adaptations culturelles:', error);
      
      return {
        adapted_text: notificationText,
        adaptations_applied: ['Adaptations par défaut appliquées']
      };
    }
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // ========================================
  
  private getExpertLastName(fullName: string): string {
    const expertNames = {
      'Dr. Sarah Empathie': 'Sarah',
      'Dr. Alex Mindfulness': 'Alex', 
      'Dr. Aicha Culturelle': 'Aicha'
    };
    return expertNames[fullName as keyof typeof expertNames] || 'Sarah';
  }
  
  private getExpertNameFromId(expertId: string): string {
    const expertMapping = {
      'dr_sarah_empathie': 'Dr. Sarah Empathie',
      'dr_alex_mindfulness': 'Dr. Alex Mindfulness',
      'dr_aicha_culturelle': 'Dr. Aicha Culturelle'
    };
    return expertMapping[expertId as keyof typeof expertMapping] || 'Dr. Sarah Empathie';
  }
  
  private determineSessionFormat(session: any): string {
    if (session.session_number === 1) {
      return 'Session d\'accueil et évaluation initiale';
    } else if (session.main_content?.session_type === 'practical') {
      return 'Session interactive guidée par IA';
    } else if (session.main_content?.session_type === 'review') {
      return 'Session de révision et approfondissement';
    } else {
      return 'Session thérapeutique personnalisée';
    }
  }
  
  private extractKeyPointFromSession(previousSession: any): string {
    // Extraire point clé principal de la session précédente
    const keyTakeaways = previousSession.session_summary?.key_takeaways || [];
    const mainTechniques = previousSession.main_content?.techniques_taught || [];
    
    if (keyTakeaways.length > 0) {
      return keyTakeaways[0];
    } else if (mainTechniques.length > 0) {
      return `les techniques de ${mainTechniques[0]}`;
    } else {
      return 'votre développement personnel et bien-être';
    }
  }
  
  private assessProgressSinceLastSession(previousSession: any): string {
    const moodScore = previousSession.post_session_mood_score || 5;
    
    if (moodScore >= 8) {
      return 'Excellent progrès observé';
    } else if (moodScore >= 6) {
      return 'Progrès positifs en cours';
    } else if (moodScore >= 4) {
      return 'Évolution graduelle constatée';
    } else {
      return 'Accompagnement renforcé nécessaire';
    }
  }
  
  private generateTransitionQuestion(previousSession: any, currentSessionNumber: number): string {
    const moodScore = previousSession.post_session_mood_score || 5;
    const techniques = previousSession.main_content?.techniques_taught || [];
    
    if (techniques.length > 0 && moodScore >= 6) {
      return `Comment vous êtes-vous senti(e) en pratiquant ${techniques[0]} cette semaine ?`;
    } else if (moodScore < 5) {
      return `Comment vous portez-vous depuis notre dernière rencontre ? Je suis là pour vous accompagner.`;
    } else {
      return `Racontez-moi comment s\'est passée votre semaine depuis notre dernière session.`;
    }
  }
  
  private getExpertVoiceConfig(expertId: string): string {
    const voiceConfigs = {
      'dr_sarah_empathie': 'umbriel',
      'dr_alex_mindfulness': 'aoede',
      'dr_aicha_culturelle': 'despina'
    };
    return voiceConfigs[expertId as keyof typeof voiceConfigs] || 'umbriel';
  }
  
  private estimateNotificationDuration(text: string): number {
    // Estimation basée sur nombre de mots (~180 mots/minute en français)
    const wordCount = text.split(/\s+/).length;
    const estimatedSeconds = Math.ceil((wordCount / 180) * 60);
    
    // Ajouter temps pour pauses naturelles et émotions
    return estimatedSeconds + 10; // +10 secondes pour naturalité
  }
  
  /**
   * NOTIFICATION DE FALLBACK SÉCURISÉE
   * En cas d'erreur, notification générique mais personnalisée
   */
  private generateFallbackNotification(expertId: string): ContextualNotification {
    const expertName = this.getExpertNameFromId(expertId);
    const voiceConfig = this.getExpertVoiceConfig(expertId);
    
    let fallbackText = '';
    
    if (expertId === 'dr_alex_mindfulness') {
      fallbackText = `${expertName.split(' ')[1]} : "Bonjour et bienvenue. Prenons un moment ensemble pour nous centrer et commencer cette session en pleine conscience. Comment vous sentez-vous maintenant ?"`;
    } else if (expertId === 'dr_aicha_culturelle') {
      fallbackText = `${expertName.split(' ')[1]} : "Ahlan wa sahlan ! Bonjour et bienvenue pour cette nouvelle session. Comment allez-vous aujourd\'hui ?"`;
    } else {
      fallbackText = `${expertName.split(' ')[1]} : "Bonjour et bienvenue ! Je suis ravie de commencer cette session avec vous. Comment vous sentez-vous aujourd\'hui ?"`;
    }
    
    return {
      notification_text: fallbackText,
      expert_voice_config: voiceConfig,
      personalization_notes: ['Notification de fallback sécurisée'],
      cultural_adaptations: ['Adaptation par défaut'],
      estimated_duration_seconds: 15
    };
  }
}

export default ContextualNotificationService;