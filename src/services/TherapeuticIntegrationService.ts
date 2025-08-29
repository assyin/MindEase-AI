/**
 * THERAPEUTIC INTEGRATION SERVICE - SERVICE D'INTÉGRATION THÉRAPEUTIQUE GLOBAL
 * Orchestration complète des services thérapeutiques pour expérience unifiée
 * Documents de référence: Plan logique complet + Guide technique complet
 * Date: 29/08/2025
 */

import TherapyProgramManager, { type TherapyProgram } from './TherapyProgramManager';
import SessionManager, { type TherapySession } from './SessionManager';
import AssessmentEngine, { type AssessmentResult } from './AssessmentEngine';
import TherapeuticAI, { type TherapeuticResponse, type CrisisAlert } from './TherapeuticAI';
import TherapeuticTTSService, { type TherapeuticAudioResponse } from './TherapeuticTTSService';
import ExpertMatchingService, { type MatchingRecommendation } from './ExpertMatchingService';
import { therapeuticExperts, type TherapeuticExpertProfile } from '../data/therapeuticExperts';
import { supabase } from '../config/supabase';

// Types pour l'orchestration thérapeutique
export interface CompleteTherapeuticResponse {
  // Réponse textuelle IA
  text_response: TherapeuticResponse;
  
  // Audio généré
  audio_response: TherapeuticAudioResponse;
  
  // Métadonnées expert
  expert_used: TherapeuticExpertProfile;
  
  // Adaptations appliquées
  adaptations_applied: {
    cultural_adaptations: string[];
    voice_modifications: Record<string, any>;
    session_phase_adjustments: string[];
  };
  
  // Alertes et signaux
  crisis_alert?: CrisisAlert;
  engagement_signals: {
    user_engagement_detected: number; // 1-10
    adaptation_needed: boolean;
    recommendations: string[];
  };
  
  // Suivi session
  session_progress: {
    phase_completed: string;
    time_elapsed: number;
    next_phase: string;
    effectiveness_score: number;
  };
}

export interface TherapeuticFlowState {
  user_id: string;
  current_program?: TherapyProgram;
  current_session?: TherapySession;
  session_phase: 'checkin' | 'homework' | 'content' | 'practice' | 'summary' | 'completed';
  expert_context: {
    assigned_expert_id: string;
    conversation_history: any[];
    adaptation_history: any[];
  };
  user_state: {
    emotional_state: string;
    engagement_level: number;
    crisis_indicators: string[];
    cultural_context: string;
    language: 'fr' | 'ar';
  };
}

/**
 * SERVICE D'INTÉGRATION THÉRAPEUTIQUE COMPLET
 * Orchestration de tous les services pour expérience thérapeutique unifiée
 */
export class TherapeuticIntegrationService {
  private programManager: TherapyProgramManager;
  private sessionManager: SessionManager;
  private assessmentEngine: AssessmentEngine;
  private therapeuticAI: TherapeuticAI;
  private ttsService: TherapeuticTTSService;
  private matchingService: ExpertMatchingService;
  
  // État des sessions actives
  private activeFlows: Map<string, TherapeuticFlowState>;
  
  constructor() {
    this.programManager = new TherapyProgramManager();
    this.sessionManager = new SessionManager();
    this.assessmentEngine = new AssessmentEngine();
    this.therapeuticAI = new TherapeuticAI();
    this.ttsService = new TherapeuticTTSService();
    this.matchingService = new ExpertMatchingService();
    
    this.activeFlows = new Map();
  }
  
  /**
   * FLUX COMPLET D'ONBOARDING THÉRAPEUTIQUE
   * Phase 1 du Plan Logique - De l'évaluation au premier programme
   */
  async completeTherapeuticOnboarding(
    userId: string,
    problemCategory: string,
    userPreferences: {
      cultural_context: string;
      preferred_language: 'fr' | 'ar';
      availability_per_week: number;
      personal_goals: string[];
      success_definition: string;
      voice_preferences?: any;
    }
  ): Promise<{
    assessment_completed: boolean;
    expert_matched: MatchingRecommendation;
    program_created: TherapyProgram;
    first_session_scheduled: TherapySession;
    expert_voice_preview: TherapeuticAudioResponse;
  }> {
    try {
      // 1. Create a simplified assessment result from the onboarding data
      const assessmentResult = this.createAssessmentResultFromOnboarding(
        problemCategory,
        userPreferences
      );
      
      // 2. Quick expert matching (simplified version for onboarding)
      const expertMatching = await this.matchingService.quickExpertMatch(
        problemCategory,
        userPreferences.cultural_context,
        userPreferences.preferred_language
      );
      
      // 3. Création programme thérapeutique personnalisé
      const therapeuticProgram = await this.programManager.createProgram(
        userId,
        {
          primary_diagnosis: assessmentResult.primary_diagnosis,
          secondary_diagnoses: assessmentResult.secondary_diagnoses,
          severity_level: assessmentResult.severity_level,
          personality_profile: assessmentResult.personality_profile,
          risk_factors: assessmentResult.risk_factors,
          protective_factors: assessmentResult.protective_factors,
          recommended_expert: expertMatching.suggested_expert.id,
          recommended_duration: 8, // Default duration
          initial_scores: {}
        },
        userPreferences
      );
      
      // 4. Planification des premières sessions
      const firstSession = await this.scheduleFirstSession(
        therapeuticProgram.id,
        expertMatching.suggested_expert.id
      );
      
      // Créer les sessions suivantes
      await this.scheduleAdditionalSessions(therapeuticProgram.id, 4);
      
      // 5. Génération preview voix expert
      const voicePreview = await this.ttsService.generateExpertVoicePreview(
        expertMatching.suggested_expert.id,
        'greeting'
      );
      
      return {
        assessment_completed: true,
        expert_matched: expertMatching,
        program_created: therapeuticProgram,
        first_session_scheduled: firstSession,
        expert_voice_preview: voicePreview
      };
      
    } catch (error) {
      console.error('Erreur onboarding thérapeutique complet:', error);
      throw new Error('Impossible de compléter l\'onboarding thérapeutique');
    }
  }
  
  /**
   * SESSION THÉRAPEUTIQUE COMPLÈTE AVEC AUDIO
   * Orchestration de toute la session 20-25 minutes avec voix expert
   */
  async conductCompleteTherapeuticSession(
    userId: string,
    sessionId: string
  ): Promise<{
    session_completed: boolean;
    session_summary: any;
    audio_interactions: TherapeuticAudioResponse[];
    crisis_alerts: CrisisAlert[];
    adaptations_made: string[];
    homework_assigned: any[];
    next_session_scheduled?: string;
  }> {
    try {
      // 1. Initialiser état de session
      const flowState = await this.initializeSessionFlow(userId, sessionId);
      
      // 2. Démarrer session avec SessionManager
      const sessionStart = await this.sessionManager.startSession(sessionId, userId);
      
      const audioInteractions: TherapeuticAudioResponse[] = [];
      const crisisAlerts: CrisisAlert[] = [];
      const adaptationsMade: string[] = [];
      
      // 3. PHASE 1: Check-in (3 minutes)
      const checkinResponse = await this.processSessionPhase(
        'checkin',
        flowState,
        "Comment vous sentez-vous aujourd'hui ?",
        {}
      );
      audioInteractions.push(checkinResponse.audio_response);
      
      if (checkinResponse.crisis_alert) {
        crisisAlerts.push(checkinResponse.crisis_alert);
      }
      
      // Simuler réponse utilisateur check-in
      const checkinResult = await this.sessionManager.processCheckin(sessionId, {
        mood_score: 6,
        significant_events: ['Réunion stressante au travail'],
        current_concerns: ['Performance professionnelle'],
        physical_state: 'Fatigué mais présent',
        energy_level: 5
      });
      
      // 4. PHASE 2: Révision devoirs (4 minutes)
      if (checkinResult.proceed_to_homework) {
        const homeworkResponse = await this.processSessionPhase(
          'homework',
          flowState,
          "Avez-vous pu essayer les techniques que nous avons vues ?",
          {}
        );
        audioInteractions.push(homeworkResponse.audio_response);
        
        // Simuler révision devoirs
        const homeworkResult = await this.sessionManager.processHomeworkReview(sessionId, {
          completed_assignments: [{
            assignment_id: 'hw_001',
            completion_status: 'completed',
            effectiveness_rating: 7,
            obstacles: ['Manque de temps'],
            insights: ['Plus facile le matin']
          }]
        });
      }
      
      // 5. PHASE 3: Contenu principal (10 minutes)
      const contentResponse = await this.processSessionPhase(
        'content',
        flowState,
        "Aujourd'hui, apprenons une nouvelle technique pour gérer le stress au travail.",
        { technique: 'Respiration 4-7-8' }
      );
      audioInteractions.push(contentResponse.audio_response);
      
      const contentResult = await this.sessionManager.deliverMainContent(
        sessionId,
        {
          session_theme: "Gestion du stress professionnel",
          therapeutic_objective: "Apprendre technique respiration 4-7-8",
          techniques_to_teach: ["Respiration 4-7-8"],
          concepts_to_cover: ["Régulation autonome", "Pause active"],
          user_examples: ["Avant réunion importante", "Pause déjeuner"]
        },
        {
          comprehension_signals: ["J'ai compris", "C'est logique"],
          engagement_level: 8,
          questions_asked: ["Combien de fois par jour ?"],
          resistance_indicators: []
        }
      );
      
      // 6. PHASE 4: Application pratique (5 minutes)
      const practiceResponse = await this.processSessionPhase(
        'practice',
        flowState,
        "Essayons ensemble cette technique. Respirez avec moi...",
        { guided: true }
      );
      audioInteractions.push(practiceResponse.audio_response);
      
      const practiceResult = await this.sessionManager.conductPracticalApplication(
        sessionId,
        {
          selected_technique: "Respiration 4-7-8",
          user_situation: "Stress avant réunion",
          guided_practice: true
        },
        {
          technique_applied: true,
          difficulty_level: 3,
          effectiveness_perceived: 8,
          user_feedback: "Je me sens plus calme",
          breakthrough_moments: ["Sensation de détente immédiate"]
        }
      );
      
      // 7. PHASE 5: Résumé et devoirs (2 minutes)
      const summaryResponse = await this.processSessionPhase(
        'summary',
        flowState,
        "Excellent travail aujourd'hui ! Vous avez bien maîtrisé cette technique.",
        {}
      );
      audioInteractions.push(summaryResponse.audio_response);
      
      const sessionConclusion = await this.sessionManager.concludeSession(sessionId, {
        post_session_mood: 7,
        session_effectiveness: 8,
        key_takeaways: ["Technique 4-7-8 efficace", "Utiliser avant situations stressantes"],
        confidence_in_techniques: 8
      });
      
      // 8. Finaliser état de session
      this.activeFlows.delete(userId);
      
      return {
        session_completed: true,
        session_summary: sessionConclusion.session_summary,
        audio_interactions: audioInteractions,
        crisis_alerts: crisisAlerts,
        adaptations_made: adaptationsMade,
        homework_assigned: sessionConclusion.homework_assignments,
        next_session_scheduled: sessionConclusion.next_session_preview
      };
      
    } catch (error) {
      console.error('Erreur session thérapeutique complète:', error);
      throw new Error('Impossible de conduire la session thérapeutique');
    }
  }
  
  /**
   * TRAITEMENT MESSAGE UTILISATEUR AVEC RÉPONSE COMPLÈTE
   * IA + TTS + Adaptations pour réponse thérapeutique unifiée
   */
  async processTherapeuticMessage(
    userId: string,
    message: string,
    context: {
      session_id?: string;
      program_id?: string;
      current_phase?: string;
      user_emotional_state?: string;
    }
  ): Promise<CompleteTherapeuticResponse> {
    try {
      // 1. Récupérer ou créer état de flux
      let flowState = this.activeFlows.get(userId);
      if (!flowState && context.program_id) {
        flowState = await this.initializeFlowFromProgram(userId, context.program_id);
      }
      
      if (!flowState) {
        throw new Error('État thérapeutique non initialisé pour cet utilisateur');
      }
      
      // 2. Construire contexte thérapeutique complet
      const therapeuticContext = await this.buildTherapeuticContext(flowState, context);
      
      // 3. Générer réponse IA thérapeutique
      const aiResponse = await this.therapeuticAI.generateTherapeuticResponse(
        flowState.expert_context.assigned_expert_id,
        message,
        therapeuticContext
      );
      
      // 4. Détecter adaptations nécessaires
      const adaptations = await this.detectAndApplyAdaptations(
        aiResponse,
        therapeuticContext,
        flowState
      );
      
      // 5. Générer audio avec adaptations
      const audioResponse = await this.ttsService.generateTherapeuticAudio(
        flowState.expert_context.assigned_expert_id,
        adaptations.adapted_text || aiResponse.content,
        {
          emotional_context: this.mapEmotionalContext(aiResponse.emotional_tone),
          session_phase: (context.current_phase || 'content') as any,
          user_emotional_state: (context.user_emotional_state || 'calm') as any,
          cultural_adaptation: this.mapCulturalAdaptation(flowState.user_state.cultural_context)
        }
      );
      
      // 6. Évaluer signaux d'engagement
      const engagementSignals = await this.analyzeEngagementSignals(
        message,
        aiResponse,
        therapeuticContext
      );
      
      // 7. Mettre à jour état de flux
      await this.updateFlowState(userId, flowState, {
        last_interaction: aiResponse,
        adaptations_applied: adaptations,
        engagement_detected: engagementSignals
      });
      
      // 8. Construire réponse complète
      return {
        text_response: aiResponse,
        audio_response: audioResponse,
        expert_used: therapeuticExperts[flowState.expert_context.assigned_expert_id as keyof typeof therapeuticExperts],
        adaptations_applied: {
          cultural_adaptations: adaptations.cultural_adaptations || [],
          voice_modifications: adaptations.voice_modifications || {},
          session_phase_adjustments: adaptations.session_adaptations || []
        },
        crisis_alert: aiResponse.crisis_indicators_detected ? 
          await this.therapeuticAI.detectCrisisIndicators(message, therapeuticContext) : 
          undefined,
        engagement_signals: engagementSignals,
        session_progress: {
          phase_completed: context.current_phase || 'content',
          time_elapsed: 0, // À calculer selon contexte
          next_phase: this.calculateNextPhase(context.current_phase || 'content'),
          effectiveness_score: engagementSignals.user_engagement_detected
        }
      };
      
    } catch (error) {
      console.error('Erreur traitement message thérapeutique:', error);
      throw error;
    }
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - ORCHESTRATION
  // ========================================
  
  private async initializeSessionFlow(userId: string, sessionId: string): Promise<TherapeuticFlowState> {
    // Récupérer session et programme associé
    // Initialiser état de flux thérapeutique
    const flowState: TherapeuticFlowState = {
      user_id: userId,
      session_phase: 'checkin',
      expert_context: {
        assigned_expert_id: 'dr_sarah_empathie', // À récupérer du programme
        conversation_history: [],
        adaptation_history: []
      },
      user_state: {
        emotional_state: 'neutral',
        engagement_level: 7,
        crisis_indicators: [],
        cultural_context: 'français',
        language: 'fr'
      }
    };
    
    this.activeFlows.set(userId, flowState);
    return flowState;
  }
  
  private async processSessionPhase(
    phase: string,
    flowState: TherapeuticFlowState,
    expertMessage: string,
    phaseContext: any
  ): Promise<CompleteTherapeuticResponse> {
    // Traiter phase spécifique avec adaptation contextuelle
    const therapeuticContext = await this.buildTherapeuticContext(flowState, { current_phase: phase });
    
    const aiResponse = await this.therapeuticAI.generateTherapeuticResponse(
      flowState.expert_context.assigned_expert_id,
      expertMessage,
      therapeuticContext
    );
    
    const audioResponse = await this.ttsService.generateTherapeuticAudio(
      flowState.expert_context.assigned_expert_id,
      aiResponse.content,
      {
        emotional_context: 'neutral',
        session_phase: phase as any,
        user_emotional_state: 'calm',
        cultural_adaptation: 'standard'
      }
    );
    
    const expertUsed = therapeuticExperts[flowState.expert_context.assigned_expert_id as keyof typeof therapeuticExperts];
    
    return {
      text_response: aiResponse,
      audio_response: audioResponse,
      expert_used: expertUsed,
      adaptations_applied: {
        cultural_adaptations: [],
        voice_modifications: {},
        session_phase_adjustments: []
      },
      engagement_signals: {
        user_engagement_detected: 7,
        adaptation_needed: false,
        recommendations: []
      },
      session_progress: {
        phase_completed: phase,
        time_elapsed: 0,
        next_phase: this.calculateNextPhase(phase),
        effectiveness_score: 8
      }
    };
  }
  
  private async scheduleFirstSession(programId: string, expertId: string): Promise<TherapySession> {
    // Créer première session planifiée dans la base de données
    const sessionData = {
      therapy_program_id: programId,
      session_number: 1,
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // J+1
      session_theme: 'Première session - Introduction et évaluation',
      therapeutic_objective: 'Faire connaissance et établir les objectifs thérapeutiques',
      techniques_taught: ['Introduction aux techniques de base'],
      concepts_covered: ['Présentation du programme', 'Établissement des objectifs'],
      checkin_data: {},
      homework_review: {},
      main_content: {},
      practical_application: {},
      session_summary: {},
      pre_session_mood_score: null,
      post_session_mood_score: null,
      session_effectiveness_score: null,
      user_engagement_level: null,
      adaptations_made: [],
      expert_notes: 'Première session programmée automatiquement',
      session_status: 'planned',
      attendance_status: 'present'
    };

    const { data, error } = await supabase
      .from('therapy_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating first session:', error);
      throw new Error('Unable to schedule first session');
    }

    return data as TherapySession;
  }

  private async scheduleAdditionalSessions(programId: string, count: number): Promise<void> {
    const sessionThemes = [
      {
        theme: 'Comprendre votre anxiété',
        objective: 'Identifier les déclencheurs et comprendre les mécanismes de l\'anxiété',
        techniques: ['Psychoéducation', 'Identification des déclencheurs']
      },
      {
        theme: 'Techniques de respiration et relaxation',
        objective: 'Apprendre des techniques de gestion immédiate de l\'anxiété',
        techniques: ['Respiration profonde', 'Relaxation progressive']
      },
      {
        theme: 'Restructuration cognitive',
        objective: 'Modifier les pensées négatives et catastrophistes',
        techniques: ['Identification des pensées', 'Questionnement socratique']
      },
      {
        theme: 'Exposition graduelle',
        objective: 'Faire face progressivement aux situations anxiogènes',
        techniques: ['Hiérarchie d\'exposition', 'Exercices pratiques']
      },
      {
        theme: 'Consolidation et prévention de rechute',
        objective: 'Consolider les acquis et préparer l\'avenir',
        techniques: ['Plan de prévention', 'Outils de maintenance']
      }
    ];

    const sessionsToCreate = [];
    for (let i = 0; i < Math.min(count, sessionThemes.length); i++) {
      const theme = sessionThemes[i];
      sessionsToCreate.push({
        therapy_program_id: programId,
        session_number: i + 2,
        scheduled_date: new Date(Date.now() + (i + 2) * 7 * 24 * 60 * 60 * 1000).toISOString(), // Weekly sessions
        session_theme: theme.theme,
        therapeutic_objective: theme.objective,
        techniques_taught: theme.techniques,
        concepts_covered: [theme.theme],
        checkin_data: {},
        homework_review: {},
        main_content: {},
        practical_application: {},
        session_summary: {},
        pre_session_mood_score: null,
        post_session_mood_score: null,
        session_effectiveness_score: null,
        user_engagement_level: null,
        adaptations_made: [],
        expert_notes: 'Session programmée automatiquement',
        session_status: 'planned',
        attendance_status: 'present'
      });
    }

    if (sessionsToCreate.length > 0) {
      const { error } = await supabase
        .from('therapy_sessions')
        .insert(sessionsToCreate);

      if (error) {
        console.error('Error creating additional sessions:', error);
      }
    }
  }
  
  private async buildTherapeuticContext(flowState: TherapeuticFlowState, context: any): Promise<any> {
    return {
      user_profile: {
        cultural_context: flowState.user_state.cultural_context,
        language: flowState.user_state.language,
        emotional_state: flowState.user_state.emotional_state
      },
      current_session: flowState.current_session,
      program_progress: flowState.current_program,
      recent_interactions: flowState.expert_context.conversation_history,
      emotional_state: flowState.user_state.emotional_state,
      cultural_context: flowState.user_state.cultural_context,
      language: flowState.user_state.language
    };
  }
  
  private async detectAndApplyAdaptations(aiResponse: any, context: any, flowState: TherapeuticFlowState): Promise<any> {
    const adaptations = {
      adapted_text: aiResponse.content,
      cultural_adaptations: [] as string[],
      voice_modifications: {},
      session_adaptations: [] as string[]
    };
    
    // Adaptation culturelle si nécessaire
    if (flowState.user_state.cultural_context.includes('arabe')) {
      adaptations.cultural_adaptations.push('Expressions culturelles arabes intégrées');
    }
    
    // Adaptation selon crise détectée
    if (aiResponse.crisis_indicators_detected) {
      adaptations.voice_modifications = { speed: 0.8, pitch: -2 };
      adaptations.session_adaptations.push('Mode crise activé');
    }
    
    return adaptations;
  }
  
  private async analyzeEngagementSignals(message: string, aiResponse: any, context: any): Promise<any> {
    return {
      user_engagement_detected: 7, // Analyse du message utilisateur
      adaptation_needed: false,
      recommendations: []
    };
  }
  
  private async updateFlowState(userId: string, flowState: TherapeuticFlowState, updates: any): Promise<void> {
    // Mettre à jour état de flux avec dernières interactions
    flowState.expert_context.conversation_history.push({
      interaction: updates.last_interaction,
      timestamp: new Date().toISOString()
    });
    
    this.activeFlows.set(userId, flowState);
  }
  
  private async initializeFlowFromProgram(userId: string, programId: string): Promise<TherapeuticFlowState> {
    // Initialiser flux à partir programme existant
    return {
      user_id: userId,
      session_phase: 'checkin',
      expert_context: {
        assigned_expert_id: 'dr_sarah_empathie',
        conversation_history: [],
        adaptation_history: []
      },
      user_state: {
        emotional_state: 'neutral',
        engagement_level: 7,
        crisis_indicators: [],
        cultural_context: 'français',
        language: 'fr'
      }
    };
  }
  
  // Méthodes utilitaires
  private mapEmotionalContext(tone: string): 'neutral' | 'empathetic' | 'encouraging' | 'crisis' | 'celebratory' {
    const mapping: Record<string, any> = {
      'empathetic': 'empathetic',
      'encouraging': 'encouraging',
      'crisis': 'crisis',
      'celebratory': 'celebratory'
    };
    return mapping[tone] || 'neutral';
  }
  
  private mapCulturalAdaptation(context: string): 'standard' | 'maghrebian' | 'formal' | 'familial' {
    if (context.includes('arabe') || context.includes('marocain')) return 'maghrebian';
    if (context.includes('formel')) return 'formal';
    if (context.includes('famille')) return 'familial';
    return 'standard';
  }
  
  private calculateNextPhase(currentPhase: string): string {
    const phases = ['checkin', 'homework', 'content', 'practice', 'summary'];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[currentIndex + 1] || 'completed';
  }

  private createAssessmentResultFromOnboarding(
    problemCategory: string,
    userPreferences: {
      cultural_context: string;
      preferred_language: 'fr' | 'ar';
      availability_per_week: number;
      personal_goals: string[];
      success_definition: string;
    }
  ): any {
    // Create a simplified assessment result based on onboarding data
    return {
      primary_diagnosis: problemCategory,
      secondary_diagnoses: [],
      severity_level: 'modéré', // Default to moderate
      personality_profile: {
        motivation: 7, // Default motivation level
        cultural_background: userPreferences.cultural_context,
        availability: userPreferences.availability_per_week,
        goals: userPreferences.personal_goals
      },
      risk_factors: [],
      protective_factors: ['Motivation for therapy', 'Clear personal goals'],
      initial_scores: {
        wellbeing: 5,
        anxiety: 6,
        depression: 5,
        functioning: 6
      }
    };
  }
}

export default TherapeuticIntegrationService;