/**
 * THERAPY PROGRAM MANAGER - SERVICE PRINCIPAL
 * Gestion complète des programmes thérapeutiques selon les spécifications
 * Documents de référence: Plan logique complet + Guide technique
 * Date: 29/08/2025
 */

import { supabase } from '../config/supabase';
import type { User } from '@supabase/supabase-js';

// Types pour le système thérapeutique
export interface TherapyProgram {
  id: string;
  user_id: string;
  program_name: string;
  
  // Diagnostic et évaluation
  primary_diagnosis: string;
  secondary_diagnoses: string[];
  severity_level: 'léger' | 'modéré' | 'sévère';
  
  // Profil utilisateur
  personality_profile: Record<string, any>;
  risk_factors: string[];
  protective_factors: string[];
  motivation_level: number; // 1-10
  availability_per_week: number;
  
  // Expert assigné
  assigned_expert_id: string;
  expert_approach: string;
  gemini_voice_id: string;
  
  // Programme thérapeutique
  treatment_protocol_id?: string;
  total_planned_sessions: number;
  sessions_completed: number;
  current_session_number: number;
  program_duration_weeks: number;
  session_frequency_per_week: number;
  
  // Statut et suivi
  program_status: 'active' | 'paused' | 'completed' | 'discontinued';
  start_date: string;
  end_date?: string;
  completion_date?: string;
  next_session_scheduled?: string;
  
  // Objectifs personnels
  personal_goals: string[];
  success_definition: string;
  
  // Contexte culturel
  cultural_context: string;
  preferred_language: 'fr' | 'ar';
  
  // Métriques
  initial_assessment_scores: Record<string, number>;
  current_scores: Record<string, number>;
  improvement_percentage: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AssessmentResult {
  primary_diagnosis: string;
  secondary_diagnoses: string[];
  severity_level: 'léger' | 'modéré' | 'sévère';
  personality_profile: Record<string, any>;
  risk_factors: string[];
  protective_factors: string[];
  recommended_expert: string;
  recommended_duration: number;
  initial_scores: Record<string, number>;
}

export interface ProgramAdaptation {
  adaptation_type: 'acceleration' | 'deceleration' | 'approach_change' | 'expert_change';
  reason: string;
  changes_made: Record<string, any>;
  effective_date: string;
}

/**
 * SERVICE PRINCIPAL DE GESTION DES PROGRAMMES THÉRAPEUTIQUES
 * Selon spécifications Phase 2 du Plan Logique
 */
export class TherapyProgramManager {
  
  /**
   * CRÉATION D'UN NOUVEAU PROGRAMME THÉRAPEUTIQUE
   * Basé sur les résultats d'évaluation initiale
   */
  async createProgram(
    userId: string, 
    assessmentResult: AssessmentResult,
    userPreferences: {
      availability_per_week: number;
      preferred_expert?: string;
      cultural_context: string;
      preferred_language: 'fr' | 'ar';
      personal_goals: string[];
      success_definition: string;
    }
  ): Promise<TherapyProgram> {
    try {
      // 1. Sélectionner l'expert optimal
      const expertId = userPreferences.preferred_expert || assessmentResult.recommended_expert;
      const expertConfig = this.getExpertConfiguration(expertId);
      
      // 2. Adapter la durée selon sévérité et motivation
      const adaptedDuration = this.calculateProgramDuration(
        assessmentResult.severity_level,
        assessmentResult.personality_profile.motivation || 7,
        userPreferences.availability_per_week
      );
      
      // 3. Créer le programme thérapeutique
      const programData = {
        user_id: userId,
        program_name: this.generateProgramName(assessmentResult.primary_diagnosis),
        
        // Diagnostic
        primary_diagnosis: assessmentResult.primary_diagnosis,
        secondary_diagnoses: assessmentResult.secondary_diagnoses,
        severity_level: assessmentResult.severity_level,
        
        // Profil utilisateur
        personality_profile: assessmentResult.personality_profile,
        risk_factors: assessmentResult.risk_factors,
        protective_factors: assessmentResult.protective_factors,
        motivation_level: assessmentResult.personality_profile.motivation || 7,
        availability_per_week: userPreferences.availability_per_week,
        
        // Expert assigné
        assigned_expert_id: expertId,
        expert_approach: expertConfig.approach,
        gemini_voice_id: expertConfig.voice_id,
        
        // Structure programme
        total_planned_sessions: adaptedDuration.total_sessions,
        program_duration_weeks: adaptedDuration.duration_weeks,
        session_frequency_per_week: adaptedDuration.frequency_per_week,
        
        // Objectifs
        personal_goals: userPreferences.personal_goals,
        success_definition: userPreferences.success_definition,
        
        // Contexte
        cultural_context: userPreferences.cultural_context,
        preferred_language: userPreferences.preferred_language,
        
        // Métriques initiales
        initial_assessment_scores: assessmentResult.initial_scores,
        current_scores: assessmentResult.initial_scores,
        improvement_percentage: 0,
        
        // Planification première session
        next_session_scheduled: this.calculateNextSessionDate(new Date(), 1)
      };
      
      const { data, error } = await supabase
        .from('therapy_programs')
        .insert([programData])
        .select()
        .single();
        
      if (error) throw error;
      
      // 4. Créer les sessions planifiées initiales
      await this.createInitialSessionPlan(data.id, adaptedDuration.total_sessions);
      
      return data as TherapyProgram;
      
    } catch (error) {
      console.error('Erreur création programme thérapeutique:', error);
      throw new Error('Impossible de créer le programme thérapeutique');
    }
  }
  
  /**
   * RÉCUPÉRATION DU PROGRAMME ACTIF D'UN UTILISATEUR
   */
  async getCurrentProgram(userId: string): Promise<TherapyProgram | null> {
    try {
      const { data, error } = await supabase
        .from('therapy_programs')
        .select('*')
        .eq('user_id', userId)
        .eq('program_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active program found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching current program:', error);
      return null;
    }
  }
  
  /**
   * ADAPTATION DYNAMIQUE DU PROGRAMME
   * Selon progrès utilisateur - spécification Phase 3.2
   */
  async adaptProgram(
    programId: string, 
    progressData: {
      recent_scores: Record<string, number>;
      engagement_level: number;
      sessions_attended: number;
      homework_completion_rate: number;
      weeks_since_start: number;
    }
  ): Promise<ProgramAdaptation | null> {
    try {
      const program = await this.getProgram(programId);
      if (!program) throw new Error('Programme introuvable');
      
      // Analyser les progrès
      const progressAnalysis = this.analyzeProgress(program, progressData);
      
      let adaptation: ProgramAdaptation | null = null;
      
      // PROGRÈS RAPIDES - Accélération
      if (progressAnalysis.improvement_rate > 50 && progressData.weeks_since_start >= 4) {
        adaptation = {
          adaptation_type: 'acceleration',
          reason: 'Progrès rapides détectés - accélération du programme',
          changes_made: {
            total_planned_sessions: Math.max(6, program.total_planned_sessions - 2),
            program_duration_weeks: Math.max(6, program.program_duration_weeks - 2),
            session_frequency_per_week: Math.min(2, program.session_frequency_per_week + 0.5)
          },
          effective_date: new Date().toISOString()
        };
      }
      
      // PROGRÈS LENTS - Décelération et renforcement  
      else if (progressAnalysis.improvement_rate < 15 && progressData.weeks_since_start >= 3) {
        adaptation = {
          adaptation_type: 'deceleration',
          reason: 'Progrès lents - renforcement et extension du programme',
          changes_made: {
            total_planned_sessions: Math.min(16, program.total_planned_sessions + 2),
            program_duration_weeks: Math.min(16, program.program_duration_weeks + 2),
            session_frequency_per_week: Math.max(1, program.session_frequency_per_week - 0.25)
          },
          effective_date: new Date().toISOString()
        };
      }
      
      // STAGNATION - Changement d'approche
      else if (progressAnalysis.stagnation_weeks >= 3) {
        const alternativeExpert = this.getAlternativeExpert(program.assigned_expert_id, program.primary_diagnosis);
        adaptation = {
          adaptation_type: 'approach_change',
          reason: 'Stagnation détectée - changement d\'approche thérapeutique',
          changes_made: {
            assigned_expert_id: alternativeExpert.id,
            expert_approach: alternativeExpert.approach,
            gemini_voice_id: alternativeExpert.voice_id
          },
          effective_date: new Date().toISOString()
        };
      }
      
      // Appliquer l'adaptation si nécessaire
      if (adaptation) {
        await this.applyAdaptation(programId, adaptation);
        
        // Enregistrer l'adaptation dans l'historique
        await this.recordAdaptation(programId, adaptation);
      }
      
      return adaptation;
      
    } catch (error) {
      console.error('Erreur adaptation programme:', error);
      return null;
    }
  }
  
  /**
   * CALCUL AUTOMATIQUE DES MÉTRIQUES DE RÉUSSITE
   * Analyse comparative et tendances
   */
  async calculateSuccessMetrics(programId: string): Promise<{
    overall_improvement: number;
    symptom_improvements: Record<string, number>;
    functional_improvements: Record<string, number>;
    engagement_metrics: Record<string, number>;
    milestone_achievements: string[];
    recommendations: string[];
  }> {
    try {
      // Récupérer données programme et progrès
      const program = await this.getProgram(programId);
      const progressData = await this.getProgressData(programId);
      
      if (!program || !progressData.length) {
        throw new Error('Données insuffisantes pour calcul métriques');
      }
      
      const initial = program.initial_assessment_scores;
      const latest = progressData[progressData.length - 1];
      
      // Calcul améliorations symptomatiques
      const symptom_improvements: Record<string, number> = {};
      Object.keys(initial).forEach(symptom => {
        const initialScore = initial[symptom];
        const currentScore = latest[`${symptom}_score`] || initialScore;
        symptom_improvements[symptom] = Math.round((initialScore - currentScore) / initialScore * 100);
      });
      
      // Calcul amélioration globale
      const overall_improvement = Math.round(
        Object.values(symptom_improvements).reduce((a, b) => a + b, 0) / 
        Object.keys(symptom_improvements).length
      );
      
      // Métriques fonctionnelles
      const functional_improvements = {
        sleep_quality: this.calculateImprovement('sleep_quality_score', progressData),
        work_performance: this.calculateImprovement('work_performance_score', progressData),
        social_relationships: this.calculateImprovement('social_relationships_score', progressData),
        daily_functioning: this.calculateImprovement('daily_functioning_score', progressData)
      };
      
      // Métriques d'engagement
      const engagement_metrics = {
        session_attendance: await this.calculateAttendanceRate(programId),
        homework_completion: await this.calculateHomeworkCompletionRate(programId),
        technique_usage: await this.calculateTechniqueUsageRate(programId),
        engagement_progression: this.calculateEngagementTrend(progressData)
      };
      
      // Jalons atteints
      const milestone_achievements = await this.identifyAchievedMilestones(programId, overall_improvement);
      
      // Recommandations
      const recommendations = this.generateRecommendations(
        overall_improvement, 
        engagement_metrics, 
        program
      );
      
      return {
        overall_improvement,
        symptom_improvements,
        functional_improvements,
        engagement_metrics,
        milestone_achievements,
        recommendations
      };
      
    } catch (error) {
      console.error('Erreur calcul métriques de réussite:', error);
      throw error;
    }
  }
  
  /**
   * GESTION DU CYCLE DE VIE DU PROGRAMME
   */
  async updateProgramStatus(
    programId: string, 
    newStatus: TherapyProgram['program_status'],
    reason?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        program_status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Définir dates spécifiques selon le statut
      if (newStatus === 'completed') {
        updateData.completion_date = new Date().toISOString();
        updateData.end_date = new Date().toISOString();
      } else if (newStatus === 'discontinued') {
        updateData.end_date = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('therapy_programs')
        .update(updateData)
        .eq('id', programId);
        
      if (error) throw error;
      
      // Déclencher actions post-changement de statut
      await this.handleStatusChange(programId, newStatus, reason);
      
    } catch (error) {
      console.error('Erreur mise à jour statut programme:', error);
      throw error;
    }
  }
  
  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ========================================
  
  private getExpertConfiguration(expertId: string) {
    const experts = {
      'dr_sarah_empathie': {
        approach: 'Thérapie Cognitivo-Comportementale (TCC)',
        voice_id: 'umbriel',
        specialties: ['anxiété', 'dépression', 'estime_de_soi']
      },
      'dr_alex_mindfulness': {
        approach: 'Pleine conscience + TCC',
        voice_id: 'aoede', 
        specialties: ['stress', 'anxiété', 'burnout']
      },
      'dr_aicha_culturelle': {
        approach: 'TCC adaptée culturellement',
        voice_id: 'despina',
        specialties: ['anxiété', 'famille', 'culture_arabe']
      }
    };
    
    return experts[expertId as keyof typeof experts] || experts.dr_sarah_empathie;
  }
  
  private calculateProgramDuration(
    severity: string, 
    motivation: number, 
    availability: number
  ) {
    let baseSessions = 8;
    let baseDuration = 8;
    let frequency = 1;
    
    // Adaptation selon sévérité
    if (severity === 'sévère') {
      baseSessions += 4;
      baseDuration += 4;
    } else if (severity === 'léger') {
      baseSessions -= 2;
      baseDuration -= 2;
    }
    
    // Adaptation selon motivation
    if (motivation >= 9) {
      frequency = Math.min(2, frequency + 0.5);
    } else if (motivation <= 4) {
      baseSessions += 2;
      baseDuration += 2;
    }
    
    // Adaptation selon disponibilité
    if (availability >= 4) {
      frequency = Math.min(2, frequency + 0.5);
    } else if (availability <= 1) {
      frequency = 0.5; // Une session toutes les 2 semaines
      baseDuration *= 2;
    }
    
    return {
      total_sessions: Math.max(6, Math.min(16, baseSessions)),
      duration_weeks: Math.max(6, Math.min(16, baseDuration)),
      frequency_per_week: frequency
    };
  }
  
  private generateProgramName(diagnosis: string): string {
    const nameMap: Record<string, string> = {
      'Anxiété sociale': 'Programme de Confiance Sociale',
      'Anxiété généralisée': 'Programme de Gestion de l\'Anxiété', 
      'Dépression': 'Programme de Bien-être Mental',
      'Estime de soi': 'Programme de Valorisation Personnelle',
      'Stress': 'Programme de Gestion du Stress'
    };
    
    return nameMap[diagnosis] || `Programme Thérapeutique - ${diagnosis}`;
  }
  
  private calculateNextSessionDate(fromDate: Date, sessionNumber: number): string {
    // Pour les premières sessions, programmer dans les 2-3 jours
    const daysToAdd = sessionNumber <= 2 ? 2 : 7;
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate.toISOString();
  }
  
  private async createInitialSessionPlan(programId: string, totalSessions: number): Promise<void> {
    // Créer les sessions planifiées initiales
    // Sera implémenté avec SessionManager
  }
  
  private async getProgram(programId: string): Promise<TherapyProgram | null> {
    const { data } = await supabase
      .from('therapy_programs')
      .select('*')
      .eq('id', programId)
      .single();
    return data;
  }
  
  private analyzeProgress(program: TherapyProgram, progressData: any) {
    // Analyse des progrès - implémentation détaillée
    const improvement_rate = Math.max(0, program.improvement_percentage || 0);
    const stagnation_weeks = progressData.weeks_since_start - 
      (progressData.last_improvement_week || 0);
    
    return { improvement_rate, stagnation_weeks };
  }
  
  private getAlternativeExpert(currentExpertId: string, diagnosis: string) {
    // Logique de sélection d'expert alternatif
    const alternatives = {
      'dr_sarah_empathie': 'dr_alex_mindfulness',
      'dr_alex_mindfulness': 'dr_aicha_culturelle', 
      'dr_aicha_culturelle': 'dr_sarah_empathie'
    };
    
    const altId = alternatives[currentExpertId as keyof typeof alternatives] || 'dr_sarah_empathie';
    return { id: altId, ...this.getExpertConfiguration(altId) };
  }
  
  private async applyAdaptation(programId: string, adaptation: ProgramAdaptation): Promise<void> {
    const { error } = await supabase
      .from('therapy_programs')
      .update({
        ...adaptation.changes_made,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId);
      
    if (error) throw error;
  }
  
  private async recordAdaptation(programId: string, adaptation: ProgramAdaptation): Promise<void> {
    // Enregistrer l'adaptation dans l'historique du programme
    const { data: program } = await supabase
      .from('therapy_programs')
      .select('adaptation_history')
      .eq('id', programId)
      .single();
    
    const history = program?.adaptation_history || [];
    history.push(adaptation);
    
    await supabase
      .from('therapy_programs')
      .update({ adaptation_history: history })
      .eq('id', programId);
  }
  
  private async getProgressData(programId: string) {
    const { data } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('therapy_program_id', programId)
      .order('tracking_date', { ascending: true });
    return data || [];
  }
  
  private calculateImprovement(metric: string, progressData: any[]): number {
    if (progressData.length < 2) return 0;
    const initial = progressData[0][metric] || 5;
    const current = progressData[progressData.length - 1][metric] || 5;
    return Math.round((current - initial) / initial * 100);
  }
  
  private async calculateAttendanceRate(programId: string): Promise<number> {
    const { data: sessions } = await supabase
      .from('therapy_sessions')
      .select('session_status')
      .eq('therapy_program_id', programId);
    
    if (!sessions?.length) return 0;
    const attended = sessions.filter(s => s.session_status === 'completed').length;
    return Math.round(attended / sessions.length * 100);
  }
  
  private async calculateHomeworkCompletionRate(programId: string): Promise<number> {
    const { data: homework } = await supabase
      .from('homework_assignments')
      .select('completion_status')
      .eq('therapy_program_id', programId);
    
    if (!homework?.length) return 0;
    const completed = homework.filter(h => h.completion_status === 'completed').length;
    return Math.round(completed / homework.length * 100);
  }
  
  private async calculateTechniqueUsageRate(programId: string): Promise<number> {
    // Calcul basé sur les données de progress_tracking
    const progressData = await this.getProgressData(programId);
    if (!progressData.length) return 0;
    
    const usageRates = progressData.map(p => Object.keys(p.techniques_used || {}).length);
    return Math.round(usageRates.reduce((a, b) => a + b, 0) / usageRates.length);
  }
  
  private calculateEngagementTrend(progressData: any[]): number {
    if (progressData.length < 2) return 0;
    const recent = progressData.slice(-3).map(p => p.therapy_engagement_score || 5);
    return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  }
  
  private async identifyAchievedMilestones(programId: string, improvement: number): Promise<string[]> {
    const milestones = [];
    if (improvement >= 25) milestones.push('Amélioration significative (25%+)');
    if (improvement >= 50) milestones.push('Amélioration majeure (50%+)');
    if (improvement >= 75) milestones.push('Transformation remarquable (75%+)');
    return milestones;
  }
  
  private generateRecommendations(
    improvement: number, 
    engagement: Record<string, number>, 
    program: TherapyProgram
  ): string[] {
    const recommendations = [];
    
    if (improvement < 20) {
      recommendations.push('Envisager adaptation de l\'approche thérapeutique');
    }
    if (engagement.homework_completion < 60) {
      recommendations.push('Renforcer l\'accompagnement pour les devoirs');
    }
    if (engagement.session_attendance < 80) {
      recommendations.push('Améliorer la planification des sessions');
    }
    
    return recommendations;
  }
  
  private async handleStatusChange(
    programId: string, 
    newStatus: TherapyProgram['program_status'],
    reason?: string
  ): Promise<void> {
    // Actions spécifiques selon le changement de statut
    if (newStatus === 'completed') {
      // Déclencher évaluation finale, certificat, programme de maintenance
    } else if (newStatus === 'paused') {
      // Programmer rappel de reprise
    }
  }

  /**
   * RÉCUPÉRATION DES MÉTRIQUES DE PROGRÈS
   */
  async getProgressMetrics(programId: string): Promise<any> {
    try {
      const program = await this.getProgram(programId);
      if (!program) return null;

      // Récupération des métriques de base
      const [sessionsData, homeworkData] = await Promise.all([
        supabase
          .from('therapy_sessions')
          .select('session_status')
          .eq('therapy_program_id', programId),
        supabase
          .from('homework_assignments')
          .select('completion_status')
          .eq('therapy_program_id', programId)
      ]);

      const completedSessions = sessionsData.data?.filter(s => s.session_status === 'completed').length || 0;
      const totalSessions = sessionsData.data?.length || 0;
      const completedHomework = homeworkData.data?.filter(h => h.completion_status === 'completed').length || 0;
      const totalHomework = homeworkData.data?.length || 0;

      return {
        completed_sessions: completedSessions,
        total_sessions: totalSessions,
        completed_homework: completedHomework,
        total_homework: totalHomework,
        current_wellbeing_score: program.current_scores?.wellbeing || 5,
        initial_wellbeing_score: program.initial_assessment_scores?.wellbeing || 5,
        improvement_percentage: program.improvement_percentage || 0
      };
    } catch (error) {
      console.error('Error fetching progress metrics:', error);
      return {
        completed_sessions: 0,
        total_sessions: 0,
        completed_homework: 0,
        total_homework: 0,
        current_wellbeing_score: 5,
        initial_wellbeing_score: 5,
        improvement_percentage: 0
      };
    }
  }
}

export default TherapyProgramManager;