/**
 * ASSESSMENT ENGINE - MOTEUR D'ÉVALUATION THÉRAPEUTIQUE
 * Conduite des évaluations initiales et de suivi avec scoring automatique
 * Documents de référence: Plan logique complet Phase 1.2-1.3 + Guide technique
 * Date: 29/08/2025
 */

import { supabase } from '../config/supabase';

// Types pour le système d'évaluation
export interface AssessmentTemplate {
  id: string;
  template_name: string;
  assessment_type: 'initial' | 'progress' | 'completion' | 'crisis';
  disorder_category: string;
  target_population: string;
  standardized_scale: string;
  questions: AssessmentQuestion[];
  scoring_algorithm: ScoringAlgorithm;
  profile_generation_rules: ProfileGenerationRules;
  language: 'fr' | 'ar';
  cultural_context: string;
}

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: 'scale' | 'multiple_choice' | 'text' | 'boolean';
  scale_range?: [number, number];
  options?: string[];
  required: boolean;
  adaptive_logic?: {
    show_if: { question_id: string; condition: string; value: any };
    skip_if: { question_id: string; condition: string; value: any };
  };
  cultural_adaptations?: Record<string, string>;
}

export interface ScoringAlgorithm {
  total_score_calculation: 'sum' | 'weighted' | 'average';
  reverse_scoring_items: string[];
  weighted_items?: Record<string, number>;
  severity_thresholds: {
    léger: [number, number];
    modéré: [number, number];
    sévère: [number, number];
  };
}

export interface ProfileGenerationRules {
  primary_diagnosis_mapping: Record<string, string>;
  secondary_conditions: Record<string, string[]>;
  risk_factor_indicators: Record<string, string[]>;
  protective_factor_indicators: Record<string, string[]>;
  expert_assignment_logic: Record<string, string>;
  program_duration_logic: Record<string, number>;
}

export interface AssessmentResponse {
  question_id: string;
  response_value: any;
  response_text?: string;
  response_timestamp: string;
}

export interface AssessmentResult {
  assessment_id: string;
  user_id: string;
  template_used: string;
  responses: AssessmentResponse[];
  
  // Scores calculés
  total_score: number;
  subscale_scores: Record<string, number>;
  severity_level: 'léger' | 'modéré' | 'sévère';
  
  // Profil généré
  primary_diagnosis: string;
  secondary_diagnoses: string[];
  risk_factors: string[];
  protective_factors: string[];
  
  // Recommandations
  recommended_expert: string;
  recommended_approach: string;
  recommended_duration_weeks: number;
  recommended_frequency: number;
  
  // Métadonnées
  completion_time_minutes: number;
  reliability_indicators: Record<string, any>;
  created_at: string;
}

/**
 * MOTEUR D'ÉVALUATION THÉRAPEUTIQUE AVANCÉ
 * Évaluations adaptatives avec scoring automatique et génération de profil
 */
export class AssessmentEngine {
  
  /**
   * DÉMARRAGE D'UNE ÉVALUATION INITIALE
   * Phase 1.2 du Plan Logique - Évaluation approfondie
   */
  async startInitialAssessment(
    userId: string,
    problemCategory: string,
    culturalContext: string = 'français',
    language: 'fr' | 'ar' = 'fr'
  ): Promise<{
    assessment_id: string;
    template: AssessmentTemplate;
    first_questions: AssessmentQuestion[];
    adaptive_flow_initialized: boolean;
  }> {
    try {
      // 1. Sélectionner template d'évaluation approprié
      const template = await this.selectAssessmentTemplate(
        'initial',
        problemCategory,
        culturalContext,
        language
      );
      
      if (!template) {
        throw new Error(`Template d'évaluation introuvable pour ${problemCategory}`);
      }
      
      // 2. Créer session d'évaluation
      const assessmentSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        template_id: template.id,
        problem_category: problemCategory,
        cultural_context: culturalContext,
        language: language,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        responses: [],
        current_question_index: 0
      };
      
      // 3. Enregistrer session
      await supabase
        .from('assessment_sessions')
        .insert([assessmentSession]);
      
      // 4. Préparer premières questions (non-adaptatives)
      const firstQuestions = this.getInitialQuestions(template);
      
      return {
        assessment_id: assessmentSession.id,
        template,
        first_questions: firstQuestions,
        adaptive_flow_initialized: true
      };
      
    } catch (error) {
      console.error('Erreur démarrage évaluation:', error);
      throw new Error('Impossible de démarrer l\'évaluation thérapeutique');
    }
  }
  
  /**
   * PROCESSUS DE QUESTIONS ADAPTATIVES
   * Questions dynamiques selon réponses précédentes
   */
  async processAdaptiveQuestions(
    assessmentId: string,
    responses: AssessmentResponse[]
  ): Promise<{
    next_questions: AssessmentQuestion[];
    progress_percentage: number;
    assessment_complete: boolean;
    preliminary_insights: string[];
  }> {
    try {
      // 1. Enregistrer réponses actuelles
      await this.saveResponses(assessmentId, responses);
      
      // 2. Récupérer session et template
      const [session, template] = await Promise.all([
        this.getAssessmentSession(assessmentId),
        this.getAssessmentTemplate(assessmentId)
      ]);
      
      if (!session || !template) throw new Error('Session d\'évaluation introuvable');
      
      // 3. Analyser réponses pour logique adaptative
      const allResponses = [...session.responses, ...responses];
      const adaptiveAnalysis = this.analyzeResponsesForAdaptation(allResponses, template);
      
      // 4. Déterminer prochaines questions
      const nextQuestions = this.calculateNextQuestions(
        template,
        allResponses,
        adaptiveAnalysis
      );
      
      // 5. Calculer progression
      const totalPossibleQuestions = this.estimateTotalQuestions(template, allResponses);
      const progressPercentage = Math.round(allResponses.length / totalPossibleQuestions * 100);
      
      // 6. Vérifier si évaluation complète
      const isComplete = nextQuestions.length === 0 || progressPercentage >= 100;
      
      // 7. Générer insights préliminaires
      const preliminaryInsights = isComplete ? 
        await this.generatePreliminaryInsights(allResponses, template) : 
        [];
      
      // 8. Mettre à jour session
      await supabase
        .from('assessment_sessions')
        .update({
          responses: allResponses,
          current_question_index: allResponses.length,
          progress_percentage: progressPercentage,
          status: isComplete ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId);
      
      return {
        next_questions: nextQuestions,
        progress_percentage: progressPercentage,
        assessment_complete: isComplete,
        preliminary_insights: preliminaryInsights
      };
      
    } catch (error) {
      console.error('Erreur processus questions adaptatives:', error);
      throw error;
    }
  }
  
  /**
   * CALCUL DES SCORES STANDARDISÉS
   * Algorithmes de scoring selon échelles cliniques (GAD-7, PHQ-9, etc.)
   */
  async calculateStandardizedScores(
    assessmentId: string
  ): Promise<{
    total_score: number;
    subscale_scores: Record<string, number>;
    percentile_scores: Record<string, number>;
    severity_classification: string;
    clinical_interpretation: string[];
    reliability_indicators: Record<string, any>;
  }> {
    try {
      // 1. Récupérer session et template
      const [session, template] = await Promise.all([
        this.getAssessmentSession(assessmentId),
        this.getAssessmentTemplate(assessmentId)
      ]);
      
      if (!session || !template) throw new Error('Données d\'évaluation introuvables');
      
      // 2. Calculer score total
      const totalScore = this.calculateTotalScore(session.responses, template.scoring_algorithm);
      
      // 3. Calculer scores par sous-échelles
      const subscaleScores = this.calculateSubscaleScores(session.responses, template);
      
      // 4. Calculer percentiles (si données normatives disponibles)
      const percentileScores = await this.calculatePercentiles(totalScore, subscaleScores, template);
      
      // 5. Déterminer sévérité
      const severityClassification = this.determineSeverity(
        totalScore,
        template.scoring_algorithm.severity_thresholds
      );
      
      // 6. Générer interprétation clinique
      const clinicalInterpretation = this.generateClinicalInterpretation(
        totalScore,
        subscaleScores,
        severityClassification,
        template
      );
      
      // 7. Évaluer fiabilité des réponses
      const reliabilityIndicators = this.assessResponseReliability(
        session.responses,
        template,
        session.completion_time_minutes
      );
      
      return {
        total_score: totalScore,
        subscale_scores: subscaleScores,
        percentile_scores: percentileScores,
        severity_classification: severityClassification,
        clinical_interpretation: clinicalInterpretation,
        reliability_indicators: reliabilityIndicators
      };
      
    } catch (error) {
      console.error('Erreur calcul scores standardisés:', error);
      throw error;
    }
  }
  
  /**
   * GÉNÉRATION AUTOMATIQUE DU PROFIL THÉRAPEUTIQUE
   * Phase 1.3 du Plan Logique - Profil complet pour programme personnalisé
   */
  async generateTherapeuticProfile(
    assessmentId: string
  ): Promise<{
    primary_diagnosis: string;
    secondary_diagnoses: string[];
    severity_level: 'léger' | 'modéré' | 'sévère';
    personality_profile: Record<string, any>;
    risk_factors: string[];
    protective_factors: string[];
    recommended_expert: string;
    recommended_approach: string;
    recommended_duration: number;
    treatment_priorities: string[];
    contraindications: string[];
    prognosis_indicators: Record<string, any>;
  }> {
    try {
      // 1. Récupérer scores calculés
      const scores = await this.calculateStandardizedScores(assessmentId);
      
      // 2. Récupérer session et template
      const [session, template] = await Promise.all([
        this.getAssessmentSession(assessmentId),
        this.getAssessmentTemplate(assessmentId)
      ]);
      
      if (!session || !template) throw new Error('Données d\'évaluation manquantes');
      
      // 3. Déterminer diagnostic principal
      const primaryDiagnosis = this.determinePrimaryDiagnosis(
        scores.total_score,
        scores.subscale_scores,
        template.profile_generation_rules
      );
      
      // 4. Identifier diagnostics secondaires
      const secondaryDiagnoses = this.identifySecondaryConditions(
        session.responses,
        scores.subscale_scores,
        template.profile_generation_rules
      );
      
      // 5. Analyser profil de personnalité
      const personalityProfile = this.analyzePersonalityProfile(session.responses, template);
      
      // 6. Identifier facteurs de risque et protecteurs
      const riskFactors = this.identifyRiskFactors(
        session.responses,
        template.profile_generation_rules
      );
      const protectiveFactors = this.identifyProtectiveFactors(
        session.responses,
        template.profile_generation_rules
      );
      
      // 7. Recommander expert optimal
      const recommendedExpert = this.recommendExpert(
        primaryDiagnosis,
        personalityProfile,
        session.cultural_context,
        template.profile_generation_rules
      );
      
      // 8. Déterminer approche thérapeutique
      const recommendedApproach = this.determineTherapeuticApproach(
        primaryDiagnosis,
        scores.severity_classification,
        personalityProfile
      );
      
      // 9. Calculer durée recommandée
      const recommendedDuration = this.calculateRecommendedDuration(
        scores.severity_classification,
        riskFactors.length,
        protectiveFactors.length,
        personalityProfile
      );
      
      // 10. Établir priorités de traitement
      const treatmentPriorities = this.establishTreatmentPriorities(
        primaryDiagnosis,
        secondaryDiagnoses,
        riskFactors,
        scores.subscale_scores
      );
      
      // 11. Identifier contre-indications
      const contraindications = this.identifyContraindications(
        session.responses,
        riskFactors,
        personalityProfile
      );
      
      // 12. Évaluer indicateurs de pronostic
      const prognosisIndicators = this.assessPrognosisIndicators(
        scores,
        personalityProfile,
        riskFactors,
        protectiveFactors
      );
      
      // 13. Enregistrer profil thérapeutique
      const therapeuticProfile = {
        assessment_id: assessmentId,
        user_id: session.user_id,
        primary_diagnosis: primaryDiagnosis,
        secondary_diagnoses: secondaryDiagnoses,
        severity_level: scores.severity_classification as 'léger' | 'modéré' | 'sévère',
        personality_profile: personalityProfile,
        risk_factors: riskFactors,
        protective_factors: protectiveFactors,
        recommended_expert: recommendedExpert,
        recommended_approach: recommendedApproach,
        recommended_duration_weeks: recommendedDuration,
        treatment_priorities: treatmentPriorities,
        contraindications: contraindications,
        prognosis_indicators: prognosisIndicators,
        generated_at: new Date().toISOString()
      };
      
      await supabase
        .from('therapeutic_profiles')
        .insert([therapeuticProfile]);
      
      return therapeuticProfile;
      
    } catch (error) {
      console.error('Erreur génération profil thérapeutique:', error);
      throw error;
    }
  }
  
  /**
   * ÉVALUATIONS DE PROGRÈS PÉRIODIQUES
   * Suivi automatisé de l'évolution thérapeutique
   */
  async conductProgressAssessment(
    userId: string,
    programId: string,
    weekNumber: number
  ): Promise<{
    progress_scores: Record<string, number>;
    improvement_indicators: Record<string, number>;
    stagnation_alerts: string[];
    adaptation_recommendations: string[];
    next_assessment_due: string;
  }> {
    try {
      // 1. Récupérer évaluation initiale pour comparaison
      const initialAssessment = await this.getInitialAssessmentForProgram(programId);
      
      // 2. Sélectionner template d'évaluation de progrès
      const progressTemplate = await this.selectAssessmentTemplate(
        'progress',
        initialAssessment.problem_category,
        initialAssessment.cultural_context,
        initialAssessment.language
      );
      
      // 3. Conduire évaluation de progrès simplifiée
      const progressAssessmentId = await this.startProgressAssessment(
        userId,
        programId,
        progressTemplate,
        weekNumber
      );
      
      // 4. Calculer scores de progrès
      const currentScores = await this.calculateStandardizedScores(progressAssessmentId);
      
      // 5. Comparer avec évaluation initiale
      const improvementIndicators = this.calculateImprovementIndicators(
        initialAssessment.scores,
        currentScores,
        weekNumber
      );
      
      // 6. Détecter signaux de stagnation
      const stagnationAlerts = this.detectStagnationSignals(
        improvementIndicators,
        weekNumber
      );
      
      // 7. Générer recommandations d'adaptation
      const adaptationRecommendations = this.generateAdaptationRecommendations(
        improvementIndicators,
        stagnationAlerts,
        currentScores.severity_classification
      );
      
      // 8. Programmer prochaine évaluation
      const nextAssessmentDate = this.calculateNextAssessmentDate(
        weekNumber,
        improvementIndicators,
        stagnationAlerts.length
      );
      
      return {
        progress_scores: currentScores.subscale_scores,
        improvement_indicators: improvementIndicators,
        stagnation_alerts: stagnationAlerts,
        adaptation_recommendations: adaptationRecommendations,
        next_assessment_due: nextAssessmentDate
      };
      
    } catch (error) {
      console.error('Erreur évaluation de progrès:', error);
      throw error;
    }
  }
  
  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ========================================
  
  private async selectAssessmentTemplate(
    type: string,
    category: string,
    cultural: string,
    language: string
  ): Promise<AssessmentTemplate | null> {
    const { data } = await supabase
      .from('assessment_templates')
      .select('*')
      .eq('assessment_type', type)
      .eq('disorder_category', category)
      .eq('language', language)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();
      
    return data;
  }
  
  private getInitialQuestions(template: AssessmentTemplate): AssessmentQuestion[] {
    return template.questions.filter(q => !q.adaptive_logic?.show_if).slice(0, 5);
  }
  
  private async saveResponses(assessmentId: string, responses: AssessmentResponse[]): Promise<void> {
    const session = await this.getAssessmentSession(assessmentId);
    if (!session) return;
    
    const allResponses = [...session.responses, ...responses];
    
    await supabase
      .from('assessment_sessions')
      .update({ 
        responses: allResponses,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);
  }
  
  private async getAssessmentSession(assessmentId: string): Promise<any> {
    const { data } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', assessmentId)
      .single();
    return data;
  }
  
  private async getAssessmentTemplate(assessmentId: string): Promise<AssessmentTemplate | null> {
    const session = await this.getAssessmentSession(assessmentId);
    if (!session) return null;
    
    const { data } = await supabase
      .from('assessment_templates')
      .select('*')
      .eq('id', session.template_id)
      .single();
    return data;
  }
  
  private analyzeResponsesForAdaptation(responses: AssessmentResponse[], template: AssessmentTemplate): any {
    // Analyser les réponses pour déterminer les prochaines questions adaptatives
    const analysis = {
      high_anxiety_indicators: 0,
      depression_markers: 0,
      social_anxiety_signs: 0,
      cultural_factors: []
    };
    
    // Logique d'analyse selon le template
    responses.forEach(response => {
      if (response.response_value > 7) {
        analysis.high_anxiety_indicators++;
      }
    });
    
    return analysis;
  }
  
  private calculateNextQuestions(
    template: AssessmentTemplate,
    responses: AssessmentResponse[],
    analysis: any
  ): AssessmentQuestion[] {
    const answeredQuestionIds = responses.map(r => r.question_id);
    
    return template.questions.filter(q => {
      // Question déjà répondue
      if (answeredQuestionIds.includes(q.id)) return false;
      
      // Vérifier logique adaptative
      if (q.adaptive_logic?.show_if) {
        const condition = q.adaptive_logic.show_if;
        const triggerResponse = responses.find(r => r.question_id === condition.question_id);
        if (!triggerResponse) return false;
        
        // Évaluer condition
        switch (condition.condition) {
          case 'greater_than':
            return triggerResponse.response_value > condition.value;
          case 'equals':
            return triggerResponse.response_value === condition.value;
          case 'contains':
            return triggerResponse.response_text?.includes(condition.value);
          default:
            return false;
        }
      }
      
      return true;
    }).slice(0, 3); // Limite de questions par batch
  }
  
  private estimateTotalQuestions(template: AssessmentTemplate, responses: AssessmentResponse[]): number {
    // Estimer nombre total de questions selon les réponses actuelles
    let baseQuestions = template.questions.filter(q => !q.adaptive_logic).length;
    let adaptiveQuestions = Math.round(template.questions.length * 0.3); // 30% en moyenne
    
    return baseQuestions + adaptiveQuestions;
  }
  
  private async generatePreliminaryInsights(
    responses: AssessmentResponse[],
    template: AssessmentTemplate
  ): Promise<string[]> {
    const insights = [];
    
    // Analyser patterns de réponses
    const highScores = responses.filter(r => typeof r.response_value === 'number' && r.response_value > 7);
    if (highScores.length > responses.length * 0.6) {
      insights.push('Symptômes d\'intensité élevée détectés');
    }
    
    const lowScores = responses.filter(r => typeof r.response_value === 'number' && r.response_value < 4);
    if (lowScores.length > responses.length * 0.6) {
      insights.push('Symptômes d\'intensité faible à modérée');
    }
    
    return insights;
  }
  
  private calculateTotalScore(responses: AssessmentResponse[], algorithm: ScoringAlgorithm): number {
    let total = 0;
    
    responses.forEach(response => {
      if (typeof response.response_value === 'number') {
        let score = response.response_value;
        
        // Inversion de score si nécessaire
        if (algorithm.reverse_scoring_items.includes(response.question_id)) {
          score = 11 - score; // Assuming 1-10 scale
        }
        
        // Pondération si nécessaire
        if (algorithm.weighted_items && algorithm.weighted_items[response.question_id]) {
          score *= algorithm.weighted_items[response.question_id];
        }
        
        total += score;
      }
    });
    
    // Calcul selon méthode
    switch (algorithm.total_score_calculation) {
      case 'average':
        return Math.round(total / responses.length);
      case 'weighted':
        // Logique pondérée personnalisée
        return Math.round(total);
      default:
        return Math.round(total);
    }
  }
  
  private calculateSubscaleScores(responses: AssessmentResponse[], template: AssessmentTemplate): Record<string, number> {
    // Calculer scores par sous-échelles (anxiété, dépression, etc.)
    const subscales: Record<string, number> = {
      anxiety: 0,
      depression: 0,
      self_esteem: 0,
      social_functioning: 0
    };
    
    // Logique de calcul par sous-échelle selon template
    // À implémenter selon templates spécifiques
    
    return subscales;
  }
  
  private async calculatePercentiles(
    totalScore: number,
    subscaleScores: Record<string, number>,
    template: AssessmentTemplate
  ): Promise<Record<string, number>> {
    // Calculer percentiles si données normatives disponibles
    return {
      total_score_percentile: 50, // Placeholder
      ...Object.keys(subscaleScores).reduce((acc, key) => {
        acc[`${key}_percentile`] = 50;
        return acc;
      }, {} as Record<string, number>)
    };
  }
  
  private determineSeverity(score: number, thresholds: any): string {
    if (score >= thresholds.sévère[0] && score <= thresholds.sévère[1]) return 'sévère';
    if (score >= thresholds.modéré[0] && score <= thresholds.modéré[1]) return 'modéré';
    return 'léger';
  }
  
  private generateClinicalInterpretation(
    totalScore: number,
    subscaleScores: Record<string, number>,
    severity: string,
    template: AssessmentTemplate
  ): string[] {
    const interpretations = [];
    
    interpretations.push(`Niveau de sévérité: ${severity} (score total: ${totalScore})`);
    
    if (severity === 'sévère') {
      interpretations.push('Intervention thérapeutique immédiate recommandée');
    } else if (severity === 'modéré') {
      interpretations.push('Bénéficierait d\'un soutien thérapeutique structuré');
    } else {
      interpretations.push('Soutien préventif et techniques d\'auto-gestion recommandés');
    }
    
    return interpretations;
  }
  
  private assessResponseReliability(
    responses: AssessmentResponse[],
    template: AssessmentTemplate,
    completionTime: number
  ): Record<string, any> {
    return {
      consistency_score: 0.85, // Placeholder
      response_time_appropriate: completionTime > 5 && completionTime < 60,
      completion_rate: responses.length / template.questions.length
    };
  }
  
  private determinePrimaryDiagnosis(
    totalScore: number,
    subscales: Record<string, number>,
    rules: ProfileGenerationRules
  ): string {
    // Logique de détermination du diagnostic principal
    const highestSubscale = Object.entries(subscales)
      .sort(([,a], [,b]) => b - a)[0];
    
    return rules.primary_diagnosis_mapping[highestSubscale[0]] || 'Anxiété généralisée';
  }
  
  private identifySecondaryConditions(
    responses: AssessmentResponse[],
    subscales: Record<string, number>,
    rules: ProfileGenerationRules
  ): string[] {
    // Identifier conditions secondaires selon scores élevés
    return Object.entries(subscales)
      .filter(([, score]) => score > 6)
      .slice(1, 3) // Max 2 conditions secondaires
      .map(([condition]) => rules.secondary_conditions[condition] || [])
      .flat();
  }
  
  private analyzePersonalityProfile(responses: AssessmentResponse[], template: AssessmentTemplate): Record<string, any> {
    return {
      introversion_extraversion: 'ambivert',
      learning_style: 'visual',
      motivation_level: 7,
      openness_to_change: 8,
      therapy_readiness: 9
    };
  }
  
  private identifyRiskFactors(responses: AssessmentResponse[], rules: ProfileGenerationRules): string[] {
    const risks = [];
    // Logique d'identification des facteurs de risque
    return risks;
  }
  
  private identifyProtectiveFactors(responses: AssessmentResponse[], rules: ProfileGenerationRules): string[] {
    const protective = [];
    // Logique d'identification des facteurs protecteurs
    return protective;
  }
  
  private recommendExpert(
    diagnosis: string,
    personality: Record<string, any>,
    cultural: string,
    rules: ProfileGenerationRules
  ): string {
    // Logique de recommandation d'expert
    if (cultural.includes('arabe') || cultural.includes('marocain')) {
      return 'dr_aicha_culturelle';
    }
    
    if (diagnosis.includes('anxiété') && personality.learning_style === 'experiential') {
      return 'dr_alex_mindfulness';
    }
    
    return 'dr_sarah_empathie'; // Expert par défaut
  }
  
  private determineTherapeuticApproach(
    diagnosis: string,
    severity: string,
    personality: Record<string, any>
  ): string {
    if (diagnosis.includes('anxiété') && personality.openness_to_change > 7) {
      return 'TCC + Pleine conscience';
    }
    return 'Thérapie Cognitivo-Comportementale';
  }
  
  private calculateRecommendedDuration(
    severity: string,
    riskCount: number,
    protectiveCount: number,
    personality: Record<string, any>
  ): number {
    let baseDuration = 8;
    
    if (severity === 'sévère') baseDuration += 4;
    if (riskCount > 3) baseDuration += 2;
    if (protectiveCount > 3) baseDuration -= 1;
    if (personality.motivation_level > 8) baseDuration -= 1;
    
    return Math.max(6, Math.min(16, baseDuration));
  }
  
  private establishTreatmentPriorities(
    primary: string,
    secondary: string[],
    risks: string[],
    subscales: Record<string, number>
  ): string[] {
    const priorities = [primary];
    
    // Ajouter priorités selon scores élevés
    Object.entries(subscales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([condition]) => {
        if (!priorities.includes(condition)) {
          priorities.push(condition);
        }
      });
    
    return priorities;
  }
  
  private identifyContraindications(
    responses: AssessmentResponse[],
    risks: string[],
    personality: Record<string, any>
  ): string[] {
    const contraindications = [];
    
    if (risks.includes('pensées suicidaires')) {
      contraindications.push('Nécessite suivi psychiatrique parallèle');
    }
    
    if (personality.therapy_readiness < 5) {
      contraindications.push('Motivation thérapeutique faible - préparation nécessaire');
    }
    
    return contraindications;
  }
  
  private assessPrognosisIndicators(
    scores: any,
    personality: Record<string, any>,
    risks: string[],
    protective: string[]
  ): Record<string, any> {
    return {
      favorable_indicators: protective.length,
      risk_indicators: risks.length,
      motivation_score: personality.motivation_level,
      severity_impact: scores.severity_classification === 'léger' ? 'positive' : 'challenging',
      estimated_improvement_rate: Math.max(20, 80 - risks.length * 10 + protective.length * 5)
    };
  }
  
  // Autres méthodes privées pour évaluations de progrès...
  
  private async getInitialAssessmentForProgram(programId: string): Promise<any> {
    // Récupérer évaluation initiale du programme
    const { data } = await supabase
      .from('therapeutic_profiles')
      .select('*')
      .eq('program_id', programId)
      .eq('assessment_type', 'initial')
      .single();
    return data;
  }
  
  private async startProgressAssessment(
    userId: string,
    programId: string,
    template: AssessmentTemplate | null,
    weekNumber: number
  ): Promise<string> {
    // Démarrer évaluation de progrès simplifiée
    const assessmentId = crypto.randomUUID();
    // Logique d'implémentation...
    return assessmentId;
  }
  
  private calculateImprovementIndicators(
    initialScores: any,
    currentScores: any,
    weekNumber: number
  ): Record<string, number> {
    return {
      overall_improvement: Math.round((currentScores.total_score - initialScores.total_score) / initialScores.total_score * 100),
      improvement_rate: Math.round(100 / weekNumber), // Placeholder
      trend_direction: currentScores.total_score > initialScores.total_score ? 1 : -1
    };
  }
  
  private detectStagnationSignals(indicators: Record<string, number>, weekNumber: number): string[] {
    const alerts = [];
    if (indicators.overall_improvement < 5 && weekNumber > 3) {
      alerts.push('Amélioration insuffisante après 3 semaines');
    }
    return alerts;
  }
  
  private generateAdaptationRecommendations(
    indicators: Record<string, number>,
    alerts: string[],
    severity: string
  ): string[] {
    const recommendations = [];
    if (alerts.length > 0) {
      recommendations.push('Révision de l\'approche thérapeutique recommandée');
    }
    return recommendations;
  }
  
  private calculateNextAssessmentDate(weekNumber: number, indicators: Record<string, number>, alertCount: number): string {
    const nextWeeks = alertCount > 0 ? 1 : 2; // Plus fréquent si alertes
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextWeeks * 7);
    return nextDate.toISOString();
  }
}

export default AssessmentEngine;