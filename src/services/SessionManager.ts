/**
 * SESSION MANAGER - ORCHESTRATION DES SESSIONS THÉRAPEUTIQUES
 * Gestion complète des sessions 20-25 minutes selon structure définie
 * Documents de référence: Plan logique complet Phase 4 + Guide technique
 * Date: 29/08/2025
 */

import { supabase } from '../config/supabase';
import type { TherapyProgram } from './TherapyProgramManager';

// Types pour les sessions thérapeutiques
export interface TherapySession {
  id: string;
  therapy_program_id: string;
  session_number: number;
  
  // Planification
  scheduled_date?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  session_duration_minutes?: number;
  
  // Structure session 20-25 minutes
  checkin_data: {
    pre_session_mood: number; // 1-10
    significant_events: string[];
    current_concerns: string[];
    physical_state: string;
  };
  
  homework_review: {
    assignments_completed: string[];
    completion_rate: number;
    effectiveness_ratings: Record<string, number>;
    obstacles_encountered: string[];
    key_insights: string[];
  };
  
  main_content: {
    session_theme: string;
    therapeutic_objective: string;
    techniques_taught: string[];
    concepts_covered: string[];
    user_comprehension_level: number;
    adaptation_notes: string[];
  };
  
  practical_application: {
    exercises_completed: string[];
    user_engagement_level: number;
    skill_demonstration: Record<string, number>;
    real_situation_application: string[];
  };
  
  session_summary: {
    key_takeaways: string[];
    techniques_to_practice: string[];
    homework_assigned: string[];
    next_session_preview: string;
    user_confidence_level: number;
  };
  
  // Scores et évaluation
  pre_session_mood_score: number;
  post_session_mood_score: number;
  session_effectiveness_score: number;
  user_engagement_level: number;
  
  // Adaptation temps réel
  user_reaction_type?: 'résistance' | 'engagement_élevé' | 'confusion' | 'détresse_émotionnelle' | 'normal';
  adaptations_made: string[];
  expert_notes: string;
  
  // Statut
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  attendance_status: 'present' | 'absent' | 'partial';
  
  // Méta
  conversation_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionContext {
  program: TherapyProgram;
  previous_sessions: TherapySession[];
  current_progress: any;
  user_profile: any;
  expert_personality: any;
}

export interface SessionAdaptation {
  trigger: string;
  original_plan: any;
  adapted_plan: any;
  rationale: string;
}

/**
 * SERVICE D'ORCHESTRATION DES SESSIONS THÉRAPEUTIQUES
 * Structure stricte 20-25 minutes selon Plan Logique Phase 4
 */
export class SessionManager {
  
  /**
   * DÉMARRAGE D'UNE NOUVELLE SESSION THÉRAPEUTIQUE
   * Minutes 1-3: Check-in express
   */
  async startSession(sessionId: string, userId: string): Promise<{
    session: TherapySession;
    context: SessionContext;
    checkin_questions: any[];
  }> {
    try {
      // 1. Récupérer session et contexte
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session introuvable');
      
      const context = await this.buildSessionContext(session.therapy_program_id);
      
      // 2. Marquer session comme en cours
      await this.updateSessionStatus(sessionId, 'in_progress', {
        actual_start_time: new Date().toISOString()
      });
      
      // 3. Générer questions de check-in personnalisées
      const checkin_questions = this.generateCheckinQuestions(context);
      
      // 4. Initialiser structure session
      const initializedSession = await this.initializeSessionStructure(sessionId, context);
      
      return {
        session: initializedSession,
        context,
        checkin_questions
      };
      
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      throw new Error('Impossible de démarrer la session thérapeutique');
    }
  }
  
  /**
   * PHASE 1: CHECK-IN EXPRESS (Minutes 1-3)
   * Collecte rapide état utilisateur et événements marquants
   */
  async processCheckin(
    sessionId: string,
    checkinData: {
      mood_score: number;
      significant_events: string[];
      current_concerns: string[];
      physical_state: string;
      energy_level: number;
    }
  ): Promise<{
    checkin_summary: string;
    session_adaptations: SessionAdaptation[];
    proceed_to_homework: boolean;
  }> {
    try {
      // 1. Enregistrer données check-in
      await supabase
        .from('therapy_sessions')
        .update({
          checkin_data: checkinData,
          pre_session_mood_score: checkinData.mood_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // 2. Analyser état utilisateur
      const moodAnalysis = this.analyzeMoodState(checkinData.mood_score);
      const eventImpact = this.assessEventImpact(checkinData.significant_events);
      
      // 3. Déterminer adaptations nécessaires
      const adaptations: SessionAdaptation[] = [];
      
      // Si détresse importante (score ≤ 3)
      if (checkinData.mood_score <= 3) {
        adaptations.push({
          trigger: 'Détresse émotionnelle élevée détectée',
          original_plan: 'Session standard',
          adapted_plan: 'Mode soutien prioritaire - techniques de régulation immédiate',
          rationale: 'Stabilisation émotionnelle avant contenu thérapeutique'
        });
      }
      
      // Si événements traumatisants récents
      if (eventImpact.severity === 'high') {
        adaptations.push({
          trigger: 'Événements stressants majeurs récents',
          original_plan: 'Contenu planifié',
          adapted_plan: 'Focus sur gestion événement et techniques d\'urgence',
          rationale: 'Traiter les préoccupations immédiates prioritaires'
        });
      }
      
      // Générer résumé check-in
      const checkin_summary = this.generateCheckinSummary(checkinData, moodAnalysis);
      
      return {
        checkin_summary,
        session_adaptations: adaptations,
        proceed_to_homework: checkinData.mood_score > 2 // Seuil minimal pour continuer
      };
      
    } catch (error) {
      console.error('Erreur processus check-in:', error);
      throw error;
    }
  }
  
  /**
   * PHASE 2: RÉVISION DES DEVOIRS (Minutes 4-7)  
   * Évaluation express des exercices précédents
   */
  async processHomeworkReview(
    sessionId: string,
    homeworkFeedback: {
      completed_assignments: Array<{
        assignment_id: string;
        completed: boolean;
        effectiveness_rating: number;
        obstacles: string[];
        insights: string[];
      }>;
    }
  ): Promise<{
    review_summary: string;
    key_insights: string[];
    adjustments_needed: string[];
    proceed_to_content: boolean;
  }> {
    try {
      // 1. Calculer taux de completion
      const completionRate = this.calculateHomeworkCompletionRate(homeworkFeedback.completed_assignments);
      
      // 2. Identifier patterns et obstacles
      const commonObstacles = this.identifyCommonObstacles(homeworkFeedback.completed_assignments);
      const keyInsights = this.extractKeyInsights(homeworkFeedback.completed_assignments);
      
      // 3. Enregistrer données révision
      const homeworkReviewData = {
        assignments_completed: homeworkFeedback.completed_assignments.map(a => a.assignment_id),
        completion_rate: completionRate,
        effectiveness_ratings: this.aggregateEffectivenessRatings(homeworkFeedback.completed_assignments),
        obstacles_encountered: commonObstacles,
        key_insights: keyInsights
      };
      
      await supabase
        .from('therapy_sessions')
        .update({
          homework_review: homeworkReviewData,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // 4. Mettre à jour statuts des devoirs dans la base
      await this.updateHomeworkStatuses(homeworkFeedback.completed_assignments);
      
      // 5. Générer recommandations d'ajustement
      const adjustments = this.generateHomeworkAdjustments(completionRate, commonObstacles);
      
      const review_summary = this.generateHomeworkReviewSummary(
        completionRate, 
        keyInsights, 
        commonObstacles
      );
      
      return {
        review_summary,
        key_insights: keyInsights,
        adjustments_needed: adjustments,
        proceed_to_content: completionRate > 0 || keyInsights.length > 0
      };
      
    } catch (error) {
      console.error('Erreur révision devoirs:', error);
      throw error;
    }
  }
  
  /**
   * PHASE 3: CONTENU PRINCIPAL (Minutes 8-18)
   * Enseignement technique concentré + application directe
   */
  async deliverMainContent(
    sessionId: string,
    contentPlan: {
      session_theme: string;
      therapeutic_objective: string;
      techniques_to_teach: string[];
      concepts_to_cover: string[];
      user_examples: string[];
    },
    userInteraction: {
      comprehension_signals: string[];
      engagement_level: number;
      questions_asked: string[];
      resistance_indicators: string[];
    }
  ): Promise<{
    content_delivered: any;
    adaptations_made: string[];
    user_comprehension_level: number;
    next_phase_ready: boolean;
  }> {
    try {
      // 1. Adapter le contenu selon l'interaction utilisateur
      const adaptedContent = this.adaptContentDelivery(contentPlan, userInteraction);
      
      // 2. Enregistrer le contenu délivré
      const mainContentData = {
        session_theme: contentPlan.session_theme,
        therapeutic_objective: contentPlan.therapeutic_objective,
        techniques_taught: adaptedContent.techniques_delivered,
        concepts_covered: adaptedContent.concepts_delivered,
        user_comprehension_level: userInteraction.engagement_level,
        adaptation_notes: adaptedContent.adaptations_made
      };
      
      await supabase
        .from('therapy_sessions')
        .update({
          main_content: mainContentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // 3. Évaluer la compréhension utilisateur
      const comprehensionLevel = this.assessUserComprehension(
        userInteraction.comprehension_signals,
        userInteraction.engagement_level,
        userInteraction.questions_asked
      );
      
      return {
        content_delivered: adaptedContent,
        adaptations_made: adaptedContent.adaptations_made,
        user_comprehension_level: comprehensionLevel,
        next_phase_ready: comprehensionLevel >= 6 // Seuil pour passer à la pratique
      };
      
    } catch (error) {
      console.error('Erreur délivrance contenu principal:', error);
      throw error;
    }
  }
  
  /**
   * PHASE 4: APPLICATION PRATIQUE (Minutes 19-23)
   * Exercice guidé court mais efficace
   */
  async conductPracticalApplication(
    sessionId: string,
    exerciseData: {
      selected_technique: string;
      user_situation: string;
      guided_practice: boolean;
    },
    practiceResults: {
      technique_applied: boolean;
      difficulty_level: number;
      effectiveness_perceived: number;
      user_feedback: string;
      breakthrough_moments: string[];
    }
  ): Promise<{
    practice_summary: string;
    skill_demonstration_scores: Record<string, number>;
    confidence_boost: number;
    homework_recommendations: string[];
  }> {
    try {
      // 1. Évaluer la démonstration des compétences
      const skillScores = this.evaluateSkillDemonstration(
        exerciseData.selected_technique,
        practiceResults
      );
      
      // 2. Enregistrer données pratique
      const practicalData = {
        exercises_completed: [exerciseData.selected_technique],
        user_engagement_level: practiceResults.effectiveness_perceived,
        skill_demonstration: skillScores,
        real_situation_application: [exerciseData.user_situation]
      };
      
      await supabase
        .from('therapy_sessions')
        .update({
          practical_application: practicalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // 3. Calculer boost de confiance
      const confidenceBoost = this.calculateConfidenceBoost(
        practiceResults.effectiveness_perceived,
        practiceResults.breakthrough_moments.length
      );
      
      // 4. Générer recommandations pour devoirs
      const homeworkRecommendations = this.generateHomeworkFromPractice(
        exerciseData.selected_technique,
        practiceResults.difficulty_level,
        skillScores
      );
      
      const practice_summary = this.generatePracticeSummary(
        exerciseData,
        practiceResults,
        skillScores
      );
      
      return {
        practice_summary,
        skill_demonstration_scores: skillScores,
        confidence_boost: confidenceBoost,
        homework_recommendations: homeworkRecommendations
      };
      
    } catch (error) {
      console.error('Erreur application pratique:', error);
      throw error;
    }
  }
  
  /**
   * PHASE 5: RÉSUMÉ + DEVOIRS (Minutes 24-25)
   * Récap technique + nouveaux devoirs générés automatiquement
   */
  async concludeSession(
    sessionId: string,
    conclusionData: {
      post_session_mood: number;
      session_effectiveness: number;
      key_takeaways: string[];
      confidence_in_techniques: number;
    }
  ): Promise<{
    session_summary: any;
    homework_assignments: any[];
    next_session_preview: string;
    session_completed: boolean;
  }> {
    try {
      // 1. Générer résumé de session
      const sessionSummary = await this.generateSessionSummary(sessionId, conclusionData);
      
      // 2. Créer nouveaux devoirs automatiquement  
      const homeworkAssignments = await this.generateSessionHomework(sessionId, conclusionData);
      
      // 3. Préparer aperçu session suivante
      const nextSessionPreview = await this.generateNextSessionPreview(sessionId);
      
      // 4. Finaliser session
      const summaryData = {
        key_takeaways: conclusionData.key_takeaways,
        techniques_to_practice: homeworkAssignments.map(h => h.technique),
        homework_assigned: homeworkAssignments.map(h => h.id),
        next_session_preview: nextSessionPreview,
        user_confidence_level: conclusionData.confidence_in_techniques
      };
      
      await supabase
        .from('therapy_sessions')
        .update({
          session_summary: summaryData,
          post_session_mood_score: conclusionData.post_session_mood,
          session_effectiveness_score: conclusionData.session_effectiveness,
          user_engagement_level: conclusionData.confidence_in_techniques,
          status: 'completed',
          actual_end_time: new Date().toISOString(),
          session_duration_minutes: this.calculateSessionDuration(sessionId),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // 5. Déclencher mise à jour programme parent
      await this.updateParentProgram(sessionId);
      
      return {
        session_summary: summaryData,
        homework_assignments: homeworkAssignments,
        next_session_preview: nextSessionPreview,
        session_completed: true
      };
      
    } catch (error) {
      console.error('Erreur conclusion session:', error);
      throw error;
    }
  }
  
  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ========================================
  
  private async getSession(sessionId: string): Promise<TherapySession | null> {
    const { data } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    return data;
  }
  
  private async buildSessionContext(programId: string): Promise<SessionContext> {
    // Récupérer programme, sessions précédentes, progrès, profil utilisateur
    const [program, previousSessions, currentProgress] = await Promise.all([
      supabase.from('therapy_programs').select('*').eq('id', programId).single(),
      supabase.from('therapy_sessions').select('*').eq('therapy_program_id', programId).order('session_number'),
      supabase.from('progress_tracking').select('*').eq('therapy_program_id', programId).order('tracking_date', { ascending: false }).limit(1)
    ]);
    
    return {
      program: program.data,
      previous_sessions: previousSessions.data || [],
      current_progress: currentProgress.data?.[0] || {},
      user_profile: {}, // À enrichir selon besoins
      expert_personality: {} // Configuration expert
    };
  }
  
  private generateCheckinQuestions(context: SessionContext): any[] {
    // Générer questions personnalisées selon contexte
    const baseQuestions = [
      { type: 'scale', question: 'Comment vous sentez-vous aujourd\'hui ?', scale: [1, 10] },
      { type: 'text', question: 'Quoi de neuf depuis notre dernière session ?' },
      { type: 'multiple', question: 'Quel est votre niveau d\'énergie ?', options: ['Faible', 'Modéré', 'Élevé'] }
    ];
    
    return baseQuestions; // À personnaliser selon contexte
  }
  
  private async initializeSessionStructure(sessionId: string, context: SessionContext): Promise<TherapySession> {
    // Initialiser structure complète session selon template
    const initialStructure = {
      checkin_data: {},
      homework_review: {},
      main_content: {},
      practical_application: {},
      session_summary: {}
    };
    
    await supabase
      .from('therapy_sessions')
      .update(initialStructure)
      .eq('id', sessionId);
      
    return await this.getSession(sessionId) as TherapySession;
  }
  
  private analyzeMoodState(moodScore: number): { level: string; concern: boolean; action_needed: string } {
    if (moodScore <= 3) return { level: 'Très faible', concern: true, action_needed: 'Soutien immédiat' };
    if (moodScore <= 5) return { level: 'Faible', concern: true, action_needed: 'Attention particulière' };
    if (moodScore <= 7) return { level: 'Moyen', concern: false, action_needed: 'Session standard' };
    return { level: 'Bon', concern: false, action_needed: 'Progression normale' };
  }
  
  private assessEventImpact(events: string[]): { severity: 'low' | 'medium' | 'high'; focus_needed: boolean } {
    // Analyser impact des événements signalés
    const highImpactKeywords = ['décès', 'accident', 'licenciement', 'rupture', 'maladie'];
    const hasHighImpact = events.some(event => 
      highImpactKeywords.some(keyword => event.toLowerCase().includes(keyword))
    );
    
    if (hasHighImpact) return { severity: 'high', focus_needed: true };
    if (events.length > 2) return { severity: 'medium', focus_needed: true };
    return { severity: 'low', focus_needed: false };
  }
  
  private generateCheckinSummary(checkinData: any, moodAnalysis: any): string {
    return `Humeur: ${checkinData.mood_score}/10 (${moodAnalysis.level}). ${checkinData.significant_events.length} événement(s) signalé(s).`;
  }
  
  private calculateHomeworkCompletionRate(assignments: any[]): number {
    if (!assignments.length) return 0;
    const completed = assignments.filter(a => a.completed === true).length;
    return Math.round(completed / assignments.length * 100);
  }
  
  private identifyCommonObstacles(assignments: any[]): string[] {
    const allObstacles = assignments.flatMap(a => a.obstacles);
    const obstacleCount = allObstacles.reduce((acc: any, obstacle) => {
      acc[obstacle] = (acc[obstacle] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(obstacleCount)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 3)
      .map(([obstacle]) => obstacle as string);
  }
  
  private extractKeyInsights(assignments: any[]): string[] {
    return assignments.flatMap(a => a.insights).slice(0, 5);
  }
  
  private aggregateEffectivenessRatings(assignments: any[]): Record<string, number> {
    const ratings: Record<string, number> = {};
    assignments.forEach(a => {
      if (a.effectiveness_rating) {
        ratings[a.assignment_id] = a.effectiveness_rating;
      }
    });
    return ratings;
  }
  
  private async updateHomeworkStatuses(assignments: any[]): Promise<void> {
    for (const assignment of assignments) {
      await supabase
        .from('homework_assignments')
        .update({
          completed: assignment.completed,
          completion_date: assignment.completed === true ? new Date().toISOString() : null,
          effectiveness_rating: assignment.effectiveness_rating,
          obstacles_encountered: assignment.obstacles
        })
        .eq('id', assignment.assignment_id);
    }
  }
  
  private generateHomeworkAdjustments(completionRate: number, obstacles: string[]): string[] {
    const adjustments = [];
    if (completionRate < 50) adjustments.push('Simplifier les exercices');
    if (obstacles.includes('Manque de temps')) adjustments.push('Réduire la durée des exercices');
    if (obstacles.includes('Difficile à comprendre')) adjustments.push('Ajouter plus d\'exemples');
    return adjustments;
  }
  
  private generateHomeworkReviewSummary(rate: number, insights: string[], obstacles: string[]): string {
    return `Taux de completion: ${rate}%. ${insights.length} insights clés. Obstacles principaux: ${obstacles.join(', ')}.`;
  }
  
  private async updateSessionStatus(sessionId: string, status: string, additionalData: any = {}): Promise<void> {
    await supabase
      .from('therapy_sessions')
      .update({
        status: status,
        ...additionalData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }
  
  private adaptContentDelivery(contentPlan: any, userInteraction: any): any {
    // Logique d'adaptation du contenu selon interaction utilisateur
    const adaptations = [];
    
    if (userInteraction.engagement_level < 5) {
      adaptations.push('Simplification des explications');
    }
    if (userInteraction.resistance_indicators.length > 0) {
      adaptations.push('Approche plus graduelle');
    }
    
    return {
      techniques_delivered: contentPlan.techniques_to_teach,
      concepts_delivered: contentPlan.concepts_to_cover,
      adaptations_made: adaptations
    };
  }
  
  private assessUserComprehension(signals: string[], engagementLevel: number, questions: string[]): number {
    let score = engagementLevel;
    if (questions.length > 0) score += 1; // Questions = engagement
    if (signals.includes('confusion')) score -= 2;
    if (signals.includes('understanding')) score += 1;
    return Math.max(1, Math.min(10, score));
  }
  
  private evaluateSkillDemonstration(technique: string, results: any): Record<string, number> {
    return {
      [technique]: results.effectiveness_perceived,
      'application_quality': results.difficulty_level > 7 ? results.effectiveness_perceived - 1 : results.effectiveness_perceived,
      'confidence_level': results.breakthrough_moments.length > 0 ? 8 : 6
    };
  }
  
  private calculateConfidenceBoost(effectiveness: number, breakthroughs: number): number {
    return Math.min(10, effectiveness + breakthroughs * 2);
  }
  
  private generateHomeworkFromPractice(technique: string, difficulty: number, skillScores: Record<string, number>): string[] {
    const recommendations = [`Pratiquer ${technique} 2x cette semaine`];
    if (difficulty > 7) recommendations.push('Commencer par situations simples');
    if (skillScores[technique] >= 8) recommendations.push('Essayer dans situation plus challenging');
    return recommendations;
  }
  
  private generatePracticeSummary(exerciseData: any, results: any, skillScores: any): string {
    return `Technique ${exerciseData.selected_technique} appliquée avec efficacité ${results.effectiveness_perceived}/10. Scores: ${Object.entries(skillScores).map(([k,v]) => `${k}: ${v}`).join(', ')}.`;
  }
  
  private async generateSessionSummary(sessionId: string, conclusionData: any): Promise<any> {
    // Agréger toutes les données de session pour résumé final
    const session = await this.getSession(sessionId);
    return {
      mood_improvement: conclusionData.post_session_mood - (session?.pre_session_mood_score || 5),
      techniques_learned: session?.main_content?.techniques_taught || [],
      key_insights: conclusionData.key_takeaways,
      confidence_gained: conclusionData.confidence_in_techniques
    };
  }
  
  private async generateSessionHomework(sessionId: string, conclusionData: any): Promise<any[]> {
    // Générer devoirs automatiquement basés sur session
    return [
      {
        id: `hw_${sessionId}_1`,
        technique: 'Respiration profonde',
        description: 'Pratiquer 5 minutes matin et soir'
      }
    ];
  }
  
  private async generateNextSessionPreview(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    const nextSessionNumber = (session?.session_number || 0) + 1;
    return `Session ${nextSessionNumber}: Approfondissement des techniques apprises`;
  }
  
  private calculateSessionDuration(sessionId: string): number {
    // Calculer durée réelle basée sur start/end time
    return 25; // Placeholder
  }
  
  private async updateParentProgram(sessionId: string): Promise<void> {
    // Mettre à jour statistiques programme parent
    const session = await this.getSession(sessionId);
    if (session) {
      await supabase
        .from('therapy_programs')
        .update({
          sessions_completed: supabase.rpc('increment_sessions_completed', { program_id: session.therapy_program_id }),
          updated_at: new Date().toISOString()
        })
        .eq('id', session.therapy_program_id);
    }
  }

  /**
   * RÉCUPÉRATION DE LA PROCHAINE SESSION PROGRAMMÉE
   */
  async getNextSession(programId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select('*')
        .eq('therapy_program_id', programId)
        .eq('status', 'scheduled')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching next session:', error);
      return null;
    }
  }

  /**
   * RÉCUPÉRATION DES SESSIONS RÉCENTES
   */
  async getRecentSessions(programId: string, limit: number = 5): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select('*')
        .eq('therapy_program_id', programId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
  }

  /**
   * RÉCUPÉRATION DES DEVOIRS ACTIFS
   */
  async getActiveHomework(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching active homework:', error);
      return [];
    }
  }
  
  /**
   * CRÉER UNE NOUVELLE SESSION THÉRAPEUTIQUE
   * Crée un enregistrement de session dans la base de données
   */
  async createTherapySession(sessionData: {
    therapy_program_id: string;
    user_id: string;
    session_number: number;
    scheduled_for: string;
    session_type: string;
    status: string;
  }): Promise<TherapySession> {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as TherapySession;
    } catch (error) {
      console.error('Error creating therapy session:', error);
      throw new Error('Impossible de créer la session thérapeutique');
    }
  }
}

export default SessionManager;