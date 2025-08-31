/**
 * ADAPTIVE PHASE MANAGER - GESTION TEMPORELLE INTELLIGENTE AVEC DÉTECTION AUTOMATIQUE
 * Timer invisible adaptatif + auto-save + détection completion automatique objectifs
 * Durées flexibles selon engagement utilisateur - Limite absolue 30 minutes
 * Date: 30/08/2025
 */

import { supabase } from '../config/supabase';
import type { SessionPhase } from './SessionStructureManager';

// Types pour la gestion temporelle adaptative
export interface AdaptiveTimer {
  session_id: string;
  current_phase: SessionPhase;
  phase_start_time: Date;
  planned_duration_ms: number;
  actual_duration_ms: number;
  extension_applied_ms: number;
  max_session_duration_ms: number; // 30 minutes limite absolue
  auto_save_interval_ms: number; // 30 secondes
}

export interface PhaseCompletionDetection {
  objectives_completion_score: number;
  user_engagement_indicators: EngagementIndicators;
  expert_assessment: ExpertAssessment;
  temporal_factors: TemporalFactors;
  completion_confidence: number;
  recommended_action: 'continue_phase' | 'extend_phase' | 'transition_next' | 'emergency_extend';
}

export interface EngagementIndicators {
  message_frequency: number;
  message_depth_score: number;
  emotional_responsiveness: number;
  comprehension_signals: string[];
  resistance_signals: string[];
  breakthrough_moments: string[];
  energy_level_assessment: 'low' | 'moderate' | 'high' | 'optimal';
}

export interface ExpertAssessment {
  therapeutic_objectives_met: string[];
  key_insights_achieved: boolean;
  skill_demonstration_quality: number;
  user_readiness_for_next_phase: number;
  adaptation_needed: boolean;
  expert_confidence_in_progress: number;
}

export interface TemporalFactors {
  time_spent_on_objectives: Record<string, number>;
  natural_conversation_flow: boolean;
  user_time_pressure_indicators: string[];
  optimal_pacing_maintained: boolean;
  fatigue_indicators: string[];
}

export interface AdaptiveTimeAdjustment {
  adjustment_type: 'extend' | 'compress' | 'maintain' | 'emergency_extend';
  adjustment_duration_ms: number;
  adjustment_reason: string;
  user_consent_required: boolean;
  fallback_if_rejected: string;
  adaptation_impact_assessment: string;
}

export interface AutoSaveState {
  session_id: string;
  last_save_timestamp: Date;
  conversation_state: ConversationState;
  phase_progress: PhaseProgress;
  user_interaction_summary: UserInteractionSummary;
  recovery_data: RecoveryData;
}

export interface ConversationState {
  current_phase_name: string;
  phase_elapsed_time_ms: number;
  message_exchange_count: number;
  last_user_message: string;
  last_expert_response: string;
  emotional_journey: EmotionalJourneyPoint[];
  key_topics_discussed: string[];
}

export interface PhaseProgress {
  objectives_completed: string[];
  objectives_in_progress: string[];
  objectives_pending: string[];
  techniques_introduced: string[];
  skills_practiced: string[];
  insights_gained: string[];
  breakthroughs_achieved: string[];
}

export interface UserInteractionSummary {
  engagement_pattern: string;
  learning_style_observed: string;
  preferred_pacing: string;
  emotional_regulation_capacity: number;
  adaptation_responses: string[];
  resistance_patterns: string[];
}

export interface RecoveryData {
  interruption_point: string;
  context_for_resume: string;
  user_state_at_interruption: string;
  recommended_resume_approach: string;
  data_integrity_checksum: string;
}

export interface EmotionalJourneyPoint {
  timestamp: Date;
  phase: string;
  emotional_state: string;
  intensity_level: number;
  trigger_event: string;
  expert_response_type: string;
}

/**
 * GESTIONNAIRE DE PHASES TEMPORELLES ADAPTATIF
 * Timer invisible + détection automatique completion + auto-save intelligent
 */
export class AdaptivePhaseManager {
  private activeTimers: Map<string, AdaptiveTimer> = new Map();
  private autoSaveStates: Map<string, AutoSaveState> = new Map();
  private phaseDetectionIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  private readonly ABSOLUTE_MAX_SESSION_MS = 30 * 60 * 1000; // 30 minutes limite stricte
  private readonly AUTO_SAVE_INTERVAL_MS = 30 * 1000; // 30 secondes
  private readonly COMPLETION_CHECK_INTERVAL_MS = 15 * 1000; // 15 secondes
  
  constructor() {
    this.initializePeriodicSaveCleanup();
  }
  
  /**
   * DÉMARRAGE TIMER ADAPTATIF POUR PHASE
   * Timer invisible avec détection automatique completion
   */
  async startAdaptivePhaseTimer(
    sessionId: string,
    phase: SessionPhase,
    sessionStartTime: Date
  ): Promise<{
    timer_started: boolean;
    planned_duration_ms: number;
    max_extension_possible_ms: number;
    auto_save_active: boolean;
  }> {
    try {
      // 1. Calculer durée planifiée et maximum possible
      const plannedDurationMs = phase.duration_minutes * 60 * 1000;
      const sessionElapsedMs = Date.now() - sessionStartTime.getTime();
      const remainingSessionMs = this.ABSOLUTE_MAX_SESSION_MS - sessionElapsedMs;
      
      // 2. Créer timer adaptatif
      const adaptiveTimer: AdaptiveTimer = {
        session_id: sessionId,
        current_phase: phase,
        phase_start_time: new Date(),
        planned_duration_ms: plannedDurationMs,
        actual_duration_ms: 0,
        extension_applied_ms: 0,
        max_session_duration_ms: this.ABSOLUTE_MAX_SESSION_MS,
        auto_save_interval_ms: this.AUTO_SAVE_INTERVAL_MS
      };
      
      this.activeTimers.set(sessionId, adaptiveTimer);
      
      // 3. Initialiser état auto-save
      await this.initializeAutoSaveState(sessionId, phase);
      
      // 4. Démarrer détection automatique completion
      this.startCompletionDetection(sessionId);
      
      // 5. Démarrer auto-save périodique
      this.startAutoSave(sessionId);
      
      console.log(`⏱️ Timer adaptatif démarré pour session ${sessionId}, phase ${phase.phase_name}`);
      
      return {
        timer_started: true,
        planned_duration_ms: plannedDurationMs,
        max_extension_possible_ms: Math.max(0, remainingSessionMs - plannedDurationMs),
        auto_save_active: true
      };
      
    } catch (error) {
      console.error('Erreur démarrage timer adaptatif:', error);
      throw new Error('Impossible de démarrer la gestion temporelle de phase');
    }
  }
  
  /**
   * DÉTECTION AUTOMATIQUE COMPLETION OBJECTIFS
   * Analyse continue pour identifier moment optimal de transition
   */
  async detectPhaseCompletion(
    sessionId: string,
    userMessage: string,
    conversationHistory: any[],
    expertResponse: string
  ): Promise<PhaseCompletionDetection> {
    try {
      const timer = this.activeTimers.get(sessionId);
      if (!timer) {
        throw new Error(`Timer pour session ${sessionId} non trouvé`);
      }
      
      // 1. Analyser indicateurs d'engagement utilisateur
      const engagementIndicators = await this.analyzeUserEngagement(
        userMessage,
        conversationHistory
      );
      
      // 2. Évaluation experte des objectifs
      const expertAssessment = await this.assessExpertObjectives(
        timer.current_phase,
        conversationHistory,
        expertResponse
      );
      
      // 3. Facteurs temporels
      const temporalFactors = this.analyzeTemporalFactors(timer, conversationHistory);
      
      // 4. Calculer score completion global
      const completionScore = this.calculateCompletionScore(
        expertAssessment,
        engagementIndicators,
        temporalFactors
      );
      
      // 5. Déterminer action recommandée
      const recommendedAction = this.determineRecommendedAction(
        completionScore,
        timer,
        engagementIndicators,
        expertAssessment
      );
      
      // 6. Calculer confiance décision
      const confidence = this.calculateDecisionConfidence(
        completionScore,
        expertAssessment,
        engagementIndicators
      );
      
      return {
        objectives_completion_score: completionScore,
        user_engagement_indicators: engagementIndicators,
        expert_assessment: expertAssessment,
        temporal_factors: temporalFactors,
        completion_confidence: confidence,
        recommended_action: recommendedAction
      };
      
    } catch (error) {
      console.error('Erreur détection completion phase:', error);
      
      // Fallback sécurisé
      return {
        objectives_completion_score: 0.5,
        user_engagement_indicators: this.getDefaultEngagementIndicators(),
        expert_assessment: this.getDefaultExpertAssessment(),
        temporal_factors: this.getDefaultTemporalFactors(),
        completion_confidence: 0.3,
        recommended_action: 'continue_phase'
      };
    }
  }
  
  /**
   * AJUSTEMENT TEMPOREL ADAPTATIF
   * Extension ou compression intelligente selon besoins
   */
  async requestTimeAdjustment(
    sessionId: string,
    adjustmentType: 'extend' | 'compress' | 'emergency_extend',
    requestReason: string,
    userEngagement: number
  ): Promise<AdaptiveTimeAdjustment> {
    try {
      const timer = this.activeTimers.get(sessionId);
      if (!timer) {
        throw new Error(`Timer session ${sessionId} introuvable pour ajustement`);
      }
      
      // 1. Calculer temps disponible restant
      const sessionElapsedMs = Date.now() - timer.phase_start_time.getTime() + timer.extension_applied_ms;
      const remainingSessionMs = timer.max_session_duration_ms - sessionElapsedMs;
      
      // 2. Déterminer ajustement possible
      let adjustmentDurationMs = 0;
      let userConsentRequired = false;
      
      switch (adjustmentType) {
        case 'extend':
          adjustmentDurationMs = Math.min(5 * 60 * 1000, remainingSessionMs * 0.3); // Max 5min ou 30% restant
          userConsentRequired = adjustmentDurationMs > 2 * 60 * 1000; // Consentement si >2min
          break;
          
        case 'compress':
          adjustmentDurationMs = -Math.min(3 * 60 * 1000, timer.planned_duration_ms * 0.4); // Max -3min ou -40%
          userConsentRequired = false;
          break;
          
        case 'emergency_extend':
          adjustmentDurationMs = Math.min(8 * 60 * 1000, remainingSessionMs); // Jusqu'à 8min ou tout disponible
          userConsentRequired = true;
          break;
      }
      
      // 3. Vérifier faisabilité
      if (adjustmentType !== 'compress' && remainingSessionMs <= 60 * 1000) { // Moins de 1min restante
        adjustmentDurationMs = 0;
        adjustmentType = 'maintain';
      }
      
      // 4. Évaluer impact adaptation
      const impactAssessment = this.assessAdjustmentImpact(
        adjustmentType,
        adjustmentDurationMs,
        timer,
        userEngagement
      );
      
      // 5. Générer fallback si rejeté
      const fallbackAction = adjustmentType === 'extend' ? 
        'Conclusion accélérée avec points essentiels' :
        'Maintien rythme actuel avec focus priorités';
      
      return {
        adjustment_type: adjustmentType,
        adjustment_duration_ms: adjustmentDurationMs,
        adjustment_reason: requestReason,
        user_consent_required: userConsentRequired,
        fallback_if_rejected: fallbackAction,
        adaptation_impact_assessment: impactAssessment
      };
      
    } catch (error) {
      console.error('Erreur ajustement temporel adaptatif:', error);
      
      return {
        adjustment_type: 'maintain',
        adjustment_duration_ms: 0,
        adjustment_reason: 'Erreur calcul - maintien durée prévue',
        user_consent_required: false,
        fallback_if_rejected: 'Poursuite normale de phase',
        adaptation_impact_assessment: 'Impact neutre - pas de changement'
      };
    }
  }
  
  /**
   * SYSTÈME AUTO-SAVE INTELLIGENT
   * Sauvegarde continue état session + données récupération
   */
  async performIntelligentAutoSave(sessionId: string): Promise<{
    save_successful: boolean;
    data_size_bytes: number;
    recovery_checkpoint_created: boolean;
    next_save_in_ms: number;
  }> {
    try {
      const timer = this.activeTimers.get(sessionId);
      const saveState = this.autoSaveStates.get(sessionId);
      
      if (!timer || !saveState) {
        throw new Error(`État session ${sessionId} introuvable pour auto-save`);
      }
      
      // 1. Capturer état conversation actuel
      const currentConversationState = await this.captureConversationState(sessionId, timer);
      
      // 2. Mettre à jour progrès phase
      const updatedPhaseProgress = await this.updatePhaseProgress(sessionId, timer.current_phase);
      
      // 3. Analyser interactions utilisateur
      const userInteractionSummary = await this.summarizeUserInteraction(sessionId);
      
      // 4. Générer données récupération
      const recoveryData = this.generateRecoveryData(
        currentConversationState,
        updatedPhaseProgress,
        userInteractionSummary
      );
      
      // 5. Créer état auto-save complet
      const updatedSaveState: AutoSaveState = {
        session_id: sessionId,
        last_save_timestamp: new Date(),
        conversation_state: currentConversationState,
        phase_progress: updatedPhaseProgress,
        user_interaction_summary: userInteractionSummary,
        recovery_data: recoveryData
      };
      
      // 6. Sauvegarder en base de données
      const { error } = await supabase
        .from('session_auto_saves')
        .upsert({
          session_id: sessionId,
          save_timestamp: updatedSaveState.last_save_timestamp.toISOString(),
          conversation_state: updatedSaveState.conversation_state,
          phase_progress: updatedSaveState.phase_progress,
          user_interaction_summary: updatedSaveState.user_interaction_summary,
          recovery_data: updatedSaveState.recovery_data,
          data_checksum: this.calculateDataChecksum(updatedSaveState)
        });
      
      if (error) throw error;
      
      // 7. Mettre à jour état local
      this.autoSaveStates.set(sessionId, updatedSaveState);
      
      const dataSize = JSON.stringify(updatedSaveState).length;
      
      console.log(`💾 Auto-save réussi pour session ${sessionId} (${dataSize} bytes)`);
      
      return {
        save_successful: true,
        data_size_bytes: dataSize,
        recovery_checkpoint_created: true,
        next_save_in_ms: this.AUTO_SAVE_INTERVAL_MS
      };
      
    } catch (error) {
      console.error('Erreur auto-save intelligent:', error);
      
      return {
        save_successful: false,
        data_size_bytes: 0,
        recovery_checkpoint_created: false,
        next_save_in_ms: this.AUTO_SAVE_INTERVAL_MS
      };
    }
  }
  
  /**
   * RÉCUPÉRATION SESSION INTERROMPUE
   * Reprise intelligente avec contexte complet préservé
   */
  async recoverInterruptedSession(sessionId: string): Promise<{
    recovery_successful: boolean;
    recovered_state: AutoSaveState | null;
    resume_recommendations: string[];
    data_integrity_verified: boolean;
    time_elapsed_since_interruption: number;
  }> {
    try {
      // 1. Récupérer dernière sauvegarde
      const { data: lastSave, error } = await supabase
        .from('session_auto_saves')
        .select('*')
        .eq('session_id', sessionId)
        .order('save_timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !lastSave) {
        throw new Error('Aucune sauvegarde trouvée pour récupération');
      }
      
      // 2. Reconstituer état auto-save
      const recoveredState: AutoSaveState = {
        session_id: sessionId,
        last_save_timestamp: new Date(lastSave.save_timestamp),
        conversation_state: lastSave.conversation_state,
        phase_progress: lastSave.phase_progress,
        user_interaction_summary: lastSave.user_interaction_summary,
        recovery_data: lastSave.recovery_data
      };
      
      // 3. Vérifier intégrité données
      const expectedChecksum = this.calculateDataChecksum(recoveredState);
      const dataIntegrityVerified = expectedChecksum === lastSave.data_checksum;
      
      // 4. Calculer temps écoulé depuis interruption
      const timeElapsedMs = Date.now() - recoveredState.last_save_timestamp.getTime();
      
      // 5. Générer recommandations reprise
      const resumeRecommendations = this.generateResumeRecommendations(
        recoveredState,
        timeElapsedMs
      );
      
      // 6. Restaurer état local si intégrité OK
      if (dataIntegrityVerified) {
        this.autoSaveStates.set(sessionId, recoveredState);
        console.log(`🔄 Session ${sessionId} récupérée avec succès`);
      }
      
      return {
        recovery_successful: dataIntegrityVerified,
        recovered_state: dataIntegrityVerified ? recoveredState : null,
        resume_recommendations: resumeRecommendations,
        data_integrity_verified: dataIntegrityVerified,
        time_elapsed_since_interruption: timeElapsedMs
      };
      
    } catch (error) {
      console.error('Erreur récupération session interrompue:', error);
      
      return {
        recovery_successful: false,
        recovered_state: null,
        resume_recommendations: ['Recommencer la phase depuis le début'],
        data_integrity_verified: false,
        time_elapsed_since_interruption: 0
      };
    }
  }
  
  /**
   * ARRÊT PROPRE TIMER ADAPTATIF
   * Nettoyage complet avec sauvegarde finale
   */
  async stopAdaptivePhaseTimer(sessionId: string): Promise<{
    timer_stopped: boolean;
    final_save_completed: boolean;
    session_duration_ms: number;
    phase_completion_summary: any;
  }> {
    try {
      const timer = this.activeTimers.get(sessionId);
      if (!timer) {
        console.warn(`Timer session ${sessionId} déjà arrêté ou inexistant`);
        return {
          timer_stopped: false,
          final_save_completed: false,
          session_duration_ms: 0,
          phase_completion_summary: null
        };
      }
      
      // 1. Calculer durée finale
      const finalDurationMs = Date.now() - timer.phase_start_time.getTime();
      timer.actual_duration_ms = finalDurationMs;
      
      // 2. Effectuer sauvegarde finale
      const finalSave = await this.performIntelligentAutoSave(sessionId);
      
      // 3. Générer résumé completion phase
      const completionSummary = {
        planned_duration_ms: timer.planned_duration_ms,
        actual_duration_ms: finalDurationMs,
        extension_applied_ms: timer.extension_applied_ms,
        efficiency_score: Math.min(1, timer.planned_duration_ms / finalDurationMs),
        objectives_achieved: this.autoSaveStates.get(sessionId)?.phase_progress.objectives_completed?.length || 0
      };
      
      // 4. Nettoyer timers et intervalles
      this.cleanupTimers(sessionId);
      
      console.log(`⏹️ Timer session ${sessionId} arrêté - Durée: ${Math.round(finalDurationMs / 1000)}s`);
      
      return {
        timer_stopped: true,
        final_save_completed: finalSave.save_successful,
        session_duration_ms: finalDurationMs,
        phase_completion_summary: completionSummary
      };
      
    } catch (error) {
      console.error('Erreur arrêt timer adaptatif:', error);
      
      // Nettoyage forcé en cas d'erreur
      this.cleanupTimers(sessionId);
      
      return {
        timer_stopped: true,
        final_save_completed: false,
        session_duration_ms: 0,
        phase_completion_summary: null
      };
    }
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - GESTION TEMPORELLE
  // ========================================
  
  private startCompletionDetection(sessionId: string): void {
    const interval = setInterval(async () => {
      try {
        const timer = this.activeTimers.get(sessionId);
        if (!timer) {
          clearInterval(interval);
          return;
        }
        
        // Vérifier si phase dépasse durée prévue + extension
        const elapsedMs = Date.now() - timer.phase_start_time.getTime();
        const maxAllowedMs = timer.planned_duration_ms + timer.extension_applied_ms + (5 * 60 * 1000); // +5min buffer
        
        if (elapsedMs > maxAllowedMs) {
          console.warn(`⚠️ Phase session ${sessionId} dépasse durée maximum - arrêt recommandé`);
          // Émettre signal pour déclencher transition forcée
          this.emitPhaseTimeoutSignal(sessionId);
        }
        
      } catch (error) {
        console.error('Erreur détection completion automatique:', error);
      }
    }, this.COMPLETION_CHECK_INTERVAL_MS);
    
    this.phaseDetectionIntervals.set(sessionId, interval);
  }
  
  private startAutoSave(sessionId: string): void {
    const interval = setInterval(async () => {
      try {
        await this.performIntelligentAutoSave(sessionId);
      } catch (error) {
        console.error('Erreur auto-save périodique:', error);
      }
    }, this.AUTO_SAVE_INTERVAL_MS);
    
    // Stocker référence pour nettoyage
    const existingInterval = this.phaseDetectionIntervals.get(`${sessionId}_autosave`);
    if (existingInterval) clearInterval(existingInterval);
    this.phaseDetectionIntervals.set(`${sessionId}_autosave`, interval);
  }
  
  private async initializeAutoSaveState(sessionId: string, phase: SessionPhase): Promise<void> {
    const initialState: AutoSaveState = {
      session_id: sessionId,
      last_save_timestamp: new Date(),
      conversation_state: {
        current_phase_name: phase.phase_name,
        phase_elapsed_time_ms: 0,
        message_exchange_count: 0,
        last_user_message: '',
        last_expert_response: '',
        emotional_journey: [],
        key_topics_discussed: []
      },
      phase_progress: {
        objectives_completed: [],
        objectives_in_progress: [...phase.objectives],
        objectives_pending: [],
        techniques_introduced: [],
        skills_practiced: [],
        insights_gained: [],
        breakthroughs_achieved: []
      },
      user_interaction_summary: {
        engagement_pattern: 'initial',
        learning_style_observed: 'unknown',
        preferred_pacing: 'standard',
        emotional_regulation_capacity: 5,
        adaptation_responses: [],
        resistance_patterns: []
      },
      recovery_data: {
        interruption_point: 'phase_start',
        context_for_resume: `Début phase ${phase.phase_name}`,
        user_state_at_interruption: 'engaged',
        recommended_resume_approach: 'continuation_normale',
        data_integrity_checksum: ''
      }
    };
    
    initialState.recovery_data.data_integrity_checksum = this.calculateDataChecksum(initialState);
    this.autoSaveStates.set(sessionId, initialState);
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - ANALYSE ENGAGEMENT
  // ========================================
  
  private async analyzeUserEngagement(
    userMessage: string,
    conversationHistory: any[]
  ): Promise<EngagementIndicators> {
    // Analyser fréquence messages (dernières 5 minutes)
    const recentMessages = conversationHistory.filter(msg => 
      Date.now() - new Date(msg.timestamp).getTime() < 5 * 60 * 1000
    );
    
    // Analyser profondeur message actuel
    const messageDepth = this.calculateMessageDepth(userMessage);
    
    // Détecter signaux émotionnels
    const emotionalResponsiveness = this.assessEmotionalResponsiveness(userMessage);
    
    // Identifier signaux compréhension
    const comprehensionSignals = this.extractComprehensionSignals(userMessage);
    
    // Détecter résistance
    const resistanceSignals = this.detectResistanceSignals(userMessage, conversationHistory);
    
    // Identifier moments breakthrough
    const breakthroughMoments = this.identifyBreakthroughMoments(userMessage, conversationHistory);
    
    // Évaluer niveau énergie
    const energyLevel = this.assessEnergyLevel(userMessage, conversationHistory);
    
    return {
      message_frequency: recentMessages.length,
      message_depth_score: messageDepth,
      emotional_responsiveness: emotionalResponsiveness,
      comprehension_signals: comprehensionSignals,
      resistance_signals: resistanceSignals,
      breakthrough_moments: breakthroughMoments,
      energy_level_assessment: energyLevel
    };
  }
  
  private async assessExpertObjectives(
    phase: SessionPhase,
    conversationHistory: any[],
    expertResponse: string
  ): Promise<ExpertAssessment> {
    // Analyser objectifs thérapeutiques atteints
    const objectivesMet = this.assessObjectivesCompletion(phase.objectives, conversationHistory);
    
    // Vérifier insights clés atteints
    const keyInsights = this.detectKeyInsightsAchieved(conversationHistory);
    
    // Évaluer qualité démonstration compétences
    const skillQuality = this.evaluateSkillDemonstration(conversationHistory);
    
    // Mesurer préparation phase suivante
    const readinessForNext = this.assessReadinessForNextPhase(conversationHistory, phase);
    
    // Déterminer besoins adaptation
    const adaptationNeeded = this.determineAdaptationNeeds(conversationHistory);
    
    // Confiance experte en progrès
    const expertConfidence = this.calculateExpertConfidence(objectivesMet, keyInsights, skillQuality);
    
    return {
      therapeutic_objectives_met: objectivesMet,
      key_insights_achieved: keyInsights,
      skill_demonstration_quality: skillQuality,
      user_readiness_for_next_phase: readinessForNext,
      adaptation_needed: adaptationNeeded,
      expert_confidence_in_progress: expertConfidence
    };
  }
  
  private analyzeTemporalFactors(timer: AdaptiveTimer, conversationHistory: any[]): TemporalFactors {
    // Temps passé sur chaque objectif
    const timePerObjective = this.calculateTimePerObjective(timer.current_phase.objectives, conversationHistory);
    
    // Fluidité conversation
    const naturalFlow = this.assessConversationFlow(conversationHistory);
    
    // Indicateurs pression temporelle utilisateur
    const timePressureIndicators = this.detectTimePressureIndicators(conversationHistory);
    
    // Rythme optimal maintenu
    const optimalPacing = this.assessOptimalPacing(timer, conversationHistory);
    
    // Indicateurs fatigue
    const fatigueIndicators = this.detectFatigueIndicators(conversationHistory);
    
    return {
      time_spent_on_objectives: timePerObjective,
      natural_conversation_flow: naturalFlow,
      user_time_pressure_indicators: timePressureIndicators,
      optimal_pacing_maintained: optimalPacing,
      fatigue_indicators: fatigueIndicators
    };
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // ========================================
  
  private calculateCompletionScore(
    expert: ExpertAssessment,
    engagement: EngagementIndicators,
    temporal: TemporalFactors
  ): number {
    let score = 0;
    
    // Score objectifs (40%)
    score += (expert.therapeutic_objectives_met.length / Math.max(1, expert.therapeutic_objectives_met.length + 3)) * 0.4;
    
    // Score engagement (30%)
    score += Math.min(1, engagement.emotional_responsiveness + engagement.comprehension_signals.length * 0.1) * 0.3;
    
    // Score temporel (20%)
    score += (temporal.natural_conversation_flow ? 0.15 : 0.05) * 0.2;
    
    // Score expert confiance (10%)
    score += expert.expert_confidence_in_progress * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }
  
  private determineRecommendedAction(
    completionScore: number,
    timer: AdaptiveTimer,
    engagement: EngagementIndicators,
    expert: ExpertAssessment
  ): 'continue_phase' | 'extend_phase' | 'transition_next' | 'emergency_extend' {
    const elapsedMs = Date.now() - timer.phase_start_time.getTime();
    const plannedEndMs = timer.planned_duration_ms + timer.extension_applied_ms;
    
    // Transition si completion élevée et temps minimum respecté
    if (completionScore >= 0.8 && elapsedMs >= timer.planned_duration_ms * 0.7) {
      return 'transition_next';
    }
    
    // Extension d'urgence si breakthrough en cours
    if (engagement.breakthrough_moments.length > 0 && engagement.energy_level_assessment === 'optimal') {
      return 'emergency_extend';
    }
    
    // Extension normale si progrès mais pas fini
    if (completionScore >= 0.6 && elapsedMs >= plannedEndMs && expert.adaptation_needed) {
      return 'extend_phase';
    }
    
    // Continuer par défaut
    return 'continue_phase';
  }
  
  private calculateDecisionConfidence(
    completionScore: number,
    expert: ExpertAssessment,
    engagement: EngagementIndicators
  ): number {
    let confidence = 0.5;
    
    if (completionScore >= 0.8 || completionScore <= 0.3) confidence += 0.3; // Extrêmes clairs
    if (expert.expert_confidence_in_progress >= 0.8) confidence += 0.2;
    if (engagement.energy_level_assessment === 'optimal') confidence += 0.1;
    if (engagement.resistance_signals.length === 0) confidence += 0.1;
    
    return Math.max(0.2, Math.min(0.95, confidence));
  }
  
  // Méthodes utilitaires simplifiées
  private calculateMessageDepth(message: string): number {
    return Math.min(1, (message.length / 200) + (message.split('?').length - 1) * 0.1);
  }
  
  private assessEmotionalResponsiveness(message: string): number {
    const emotionalWords = ['ressens', 'émotion', 'sens', 'feel', 'sentiment'];
    let score = 0.5;
    emotionalWords.forEach(word => {
      if (message.toLowerCase().includes(word)) score += 0.1;
    });
    return Math.min(1, score);
  }
  
  private extractComprehensionSignals(message: string): string[] {
    const signals = [];
    if (message.includes('comprends') || message.includes('vois')) signals.push('comprehension_verbale');
    if (message.includes('aide') || message.includes('utile')) signals.push('utilite_reconnue');
    if (message.includes('?')) signals.push('questions_approfondissement');
    return signals;
  }
  
  private detectResistanceSignals(message: string, history: any[]): string[] {
    const signals = [];
    if (message.includes('mais') || message.includes('difficile')) signals.push('hesitation');
    if (message.includes('pas sûr') || message.includes('compliqué')) signals.push('doute');
    return signals;
  }
  
  private identifyBreakthroughMoments(message: string, history: any[]): string[] {
    const moments = [];
    if (message.includes('maintenant je vois') || message.includes('ah oui')) moments.push('realisation');
    if (message.includes('ça change tout') || message.includes('jamais vu comme ça')) moments.push('perspective_change');
    return moments;
  }
  
  private assessEnergyLevel(message: string, history: any[]): 'low' | 'moderate' | 'high' | 'optimal' {
    const messageLength = message.length;
    const recentActivity = history.length;
    
    if (messageLength > 150 && recentActivity > 3) return 'optimal';
    if (messageLength > 100 && recentActivity > 2) return 'high';
    if (messageLength > 50 && recentActivity > 1) return 'moderate';
    return 'low';
  }
  
  // Méthodes par défaut
  private getDefaultEngagementIndicators(): EngagementIndicators {
    return {
      message_frequency: 1,
      message_depth_score: 0.5,
      emotional_responsiveness: 0.5,
      comprehension_signals: [],
      resistance_signals: [],
      breakthrough_moments: [],
      energy_level_assessment: 'moderate'
    };
  }
  
  private getDefaultExpertAssessment(): ExpertAssessment {
    return {
      therapeutic_objectives_met: [],
      key_insights_achieved: false,
      skill_demonstration_quality: 0.5,
      user_readiness_for_next_phase: 0.5,
      adaptation_needed: false,
      expert_confidence_in_progress: 0.5
    };
  }
  
  private getDefaultTemporalFactors(): TemporalFactors {
    return {
      time_spent_on_objectives: {},
      natural_conversation_flow: true,
      user_time_pressure_indicators: [],
      optimal_pacing_maintained: true,
      fatigue_indicators: []
    };
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - GESTION ÉTAT
  // ========================================
  
  private async captureConversationState(sessionId: string, timer: AdaptiveTimer): Promise<ConversationState> {
    const saveState = this.autoSaveStates.get(sessionId);
    const elapsedMs = Date.now() - timer.phase_start_time.getTime();
    
    return {
      current_phase_name: timer.current_phase.phase_name,
      phase_elapsed_time_ms: elapsedMs,
      message_exchange_count: saveState?.conversation_state.message_exchange_count || 0,
      last_user_message: saveState?.conversation_state.last_user_message || '',
      last_expert_response: saveState?.conversation_state.last_expert_response || '',
      emotional_journey: saveState?.conversation_state.emotional_journey || [],
      key_topics_discussed: saveState?.conversation_state.key_topics_discussed || []
    };
  }
  
  private async updatePhaseProgress(sessionId: string, phase: SessionPhase): Promise<PhaseProgress> {
    const saveState = this.autoSaveStates.get(sessionId);
    
    return saveState?.phase_progress || {
      objectives_completed: [],
      objectives_in_progress: phase.objectives,
      objectives_pending: [],
      techniques_introduced: [],
      skills_practiced: [],
      insights_gained: [],
      breakthroughs_achieved: []
    };
  }
  
  private async summarizeUserInteraction(sessionId: string): Promise<UserInteractionSummary> {
    const saveState = this.autoSaveStates.get(sessionId);
    
    return saveState?.user_interaction_summary || {
      engagement_pattern: 'standard',
      learning_style_observed: 'mixed',
      preferred_pacing: 'moderate',
      emotional_regulation_capacity: 5,
      adaptation_responses: [],
      resistance_patterns: []
    };
  }
  
  private generateRecoveryData(
    conversation: ConversationState,
    progress: PhaseProgress,
    interaction: UserInteractionSummary
  ): RecoveryData {
    return {
      interruption_point: `Phase ${conversation.current_phase_name} - ${conversation.phase_elapsed_time_ms}ms`,
      context_for_resume: `${progress.objectives_completed.length} objectifs complétés, engagement ${interaction.engagement_pattern}`,
      user_state_at_interruption: interaction.emotional_regulation_capacity > 6 ? 'engaged' : 'moderate',
      recommended_resume_approach: conversation.message_exchange_count > 3 ? 'continuation_contexte' : 'recap_leger',
      data_integrity_checksum: ''
    };
  }
  
  private calculateDataChecksum(saveState: AutoSaveState): string {
    const dataString = JSON.stringify({
      session_id: saveState.session_id,
      conversation: saveState.conversation_state,
      progress: saveState.phase_progress
    });
    
    // Hash simple pour vérification intégrité
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
  
  private generateResumeRecommendations(
    recoveredState: AutoSaveState,
    timeElapsedMs: number
  ): string[] {
    const recommendations = [];
    
    if (timeElapsedMs < 5 * 60 * 1000) { // Moins de 5min
      recommendations.push('Reprise immédiate possible - contexte frais');
    } else if (timeElapsedMs < 30 * 60 * 1000) { // Moins de 30min
      recommendations.push('Recap rapide du contexte puis continuation');
    } else {
      recommendations.push('Recap complet recommandé avant reprise');
    }
    
    if (recoveredState.phase_progress.objectives_completed.length > 0) {
      recommendations.push('Valoriser progrès déjà accomplis');
    }
    
    if (recoveredState.user_interaction_summary.resistance_patterns.length > 0) {
      recommendations.push('Approche douce recommandée - résistance détectée');
    }
    
    return recommendations;
  }
  
  private assessAdjustmentImpact(
    adjustmentType: string,
    durationMs: number,
    timer: AdaptiveTimer,
    engagement: number
  ): string {
    if (adjustmentType === 'extend') {
      return `Extension de ${Math.round(durationMs / 60000)} minutes - Impact positif sur completion objectifs`;
    }
    if (adjustmentType === 'compress') {
      return `Compression de ${Math.round(Math.abs(durationMs) / 60000)} minutes - Focus sur priorités essentielles`;
    }
    return 'Maintien durée planifiée - Impact neutre';
  }
  
  private emitPhaseTimeoutSignal(sessionId: string): void {
    // Signal pour déclencher transition forcée si phase trop longue
    console.warn(`🚨 Timeout phase pour session ${sessionId} - transition forcée recommandée`);
  }
  
  private cleanupTimers(sessionId: string): void {
    // Nettoyer timer principal
    this.activeTimers.delete(sessionId);
    
    // Nettoyer intervalles
    const detectionInterval = this.phaseDetectionIntervals.get(sessionId);
    if (detectionInterval) {
      clearInterval(detectionInterval);
      this.phaseDetectionIntervals.delete(sessionId);
    }
    
    const autoSaveInterval = this.phaseDetectionIntervals.get(`${sessionId}_autosave`);
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      this.phaseDetectionIntervals.delete(`${sessionId}_autosave`);
    }
    
    // Garder auto-save state pour récupération ultérieure
    // this.autoSaveStates.delete(sessionId); // Non supprimé intentionnellement
  }
  
  private initializePeriodicSaveCleanup(): void {
    // Nettoyage périodique des anciennes sauvegardes (24h)
    setInterval(async () => {
      try {
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await supabase
          .from('session_auto_saves')
          .delete()
          .lt('save_timestamp', cutoffDate.toISOString());
      } catch (error) {
        console.error('Erreur nettoyage sauvegardes anciennes:', error);
      }
    }, 60 * 60 * 1000); // Chaque heure
  }
  
  // Méthodes simplifiées pour analyse
  private assessObjectivesCompletion(objectives: string[], history: any[]): string[] {
    // Simulation simple - dans vraie implémentation, analyser conversations
    return objectives.slice(0, Math.floor(history.length / 2));
  }
  
  private detectKeyInsightsAchieved(history: any[]): boolean {
    return history.length > 3; // Simulation
  }
  
  private evaluateSkillDemonstration(history: any[]): number {
    return Math.min(1, history.length * 0.2);
  }
  
  private assessReadinessForNextPhase(history: any[], phase: SessionPhase): number {
    return Math.min(1, history.length * 0.15);
  }
  
  private determineAdaptationNeeds(history: any[]): boolean {
    return history.length < 2; // Besoin adaptation si peu d'interaction
  }
  
  private calculateExpertConfidence(objectives: string[], insights: boolean, skillQuality: number): number {
    return (objectives.length * 0.3 + (insights ? 0.4 : 0) + skillQuality * 0.3);
  }
  
  private calculateTimePerObjective(objectives: string[], history: any[]): Record<string, number> {
    const timePerObjective: Record<string, number> = {};
    objectives.forEach((obj, index) => {
      timePerObjective[obj] = (index + 1) * 60000; // Simulation 1min par objectif
    });
    return timePerObjective;
  }
  
  private assessConversationFlow(history: any[]): boolean {
    return history.length > 1; // Simulation flow naturel si plus d'un échange
  }
  
  private detectTimePressureIndicators(history: any[]): string[] {
    return []; // Pas d'indicateurs de pression par défaut
  }
  
  private assessOptimalPacing(timer: AdaptiveTimer, history: any[]): boolean {
    const elapsedMs = Date.now() - timer.phase_start_time.getTime();
    const expectedProgress = elapsedMs / timer.planned_duration_ms;
    const actualProgress = history.length / 10; // Simulation
    return Math.abs(expectedProgress - actualProgress) < 0.3;
  }
  
  private detectFatigueIndicators(history: any[]): string[] {
    if (history.length > 10) return ['interaction_intensive'];
    return [];
  }
}

export default AdaptivePhaseManager;