/**
 * EXPERT MATCHING SERVICE - MATCHING AUTOMATIQUE EXPERT/UTILISATEUR
 * Sélection optimale d'expert selon profil thérapeutique et préférences
 * Documents de référence: Plan logique complet Phase 2.1 + Guide technique
 * Date: 29/08/2025
 */

import { supabase } from '../config/supabase';
import { therapeuticExperts, expertSelectionRules, type TherapeuticExpertProfile } from '../data/therapeuticExperts';
import type { AssessmentResult } from './AssessmentEngine';

// Types pour le matching expert
export interface UserTherapeuticProfile {
  user_id: string;
  primary_diagnosis: string;
  secondary_diagnoses: string[];
  severity_level: 'léger' | 'modéré' | 'sévère';
  
  // Préférences utilisateur
  cultural_context: string;
  preferred_language: 'fr' | 'ar';
  communication_preference: 'direct' | 'indirect' | 'supportive' | 'challenging';
  therapeutic_approach_preference?: string;
  
  // Profil personnalité
  personality_traits: {
    introversion_extraversion: number; // 1-10
    openness_to_change: number; // 1-10
    learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    motivation_level: number; // 1-10
    therapy_readiness: number; // 1-10
  };
  
  // Contexte situationnel
  life_context: {
    age_group: 'adolescent' | 'young_adult' | 'adult' | 'senior';
    family_situation: string;
    work_status: string;
    support_system_strength: number; // 1-10
  };
  
  // Préférences vocales
  voice_preferences?: {
    preferred_gender: 'male' | 'female' | 'any';
    preferred_accent: string;
    preferred_speaking_pace: 'slow' | 'medium' | 'fast';
    emotional_expressiveness: 'subtle' | 'moderate' | 'expressive';
  };
}

export interface ExpertMatchScore {
  expert_id: string;
  overall_score: number; // 0-100
  match_reasons: string[];
  potential_concerns: string[];
  
  // Scores détaillés par dimension
  diagnostic_compatibility: number; // 0-100
  cultural_fit: number; // 0-100
  personality_alignment: number; // 0-100
  approach_preference: number; // 0-100
  voice_preference: number; // 0-100
  
  // Prédictions
  predicted_engagement: number; // 0-100
  predicted_completion_rate: number; // 0-100
  estimated_program_duration: number; // semaines
  
  confidence_level: number; // 0-100
}

export interface MatchingRecommendation {
  recommended_expert: TherapeuticExpertProfile;
  alternative_experts: TherapeuticExpertProfile[];
  match_scores: ExpertMatchScore[];
  
  // Justifications détaillées
  primary_reasons: string[];
  cultural_considerations: string[];
  personalization_notes: string[];
  
  // Adaptations suggérées
  suggested_adaptations: {
    program_duration_adjustment: number;
    session_frequency_suggestion: number;
    approach_modifications: string[];
    special_considerations: string[];
  };
}

/**
 * SERVICE DE MATCHING AUTOMATIQUE EXPERT-UTILISATEUR
 * Algorithme sophistiqué de sélection d'expert optimal
 */
export class ExpertMatchingService {
  
  /**
   * MATCHING PRINCIPAL - SÉLECTION EXPERT OPTIMAL
   * Analyse multidimensionnelle pour recommandation personnalisée
   */
  async matchOptimalExpert(
    userProfile: UserTherapeuticProfile,
    assessmentResult: AssessmentResult
  ): Promise<MatchingRecommendation> {
    try {
      // 1. Calculer scores de compatibilité pour chaque expert
      const matchScores: ExpertMatchScore[] = [];
      
      for (const expert of Object.values(therapeuticExperts)) {
        const score = await this.calculateExpertMatchScore(
          userProfile,
          assessmentResult,
          expert
        );
        matchScores.push(score);
      }
      
      // 2. Trier par score global décroissant
      matchScores.sort((a, b) => b.overall_score - a.overall_score);
      
      // 3. Sélectionner expert recommandé (score le plus élevé)
      const recommendedExpertId = matchScores[0].expert_id;
      const recommendedExpert = therapeuticExperts[recommendedExpertId as keyof typeof therapeuticExperts];
      
      // 4. Sélectionner alternatives (2 suivants)
      const alternativeExperts = matchScores.slice(1, 3).map(score => 
        therapeuticExperts[score.expert_id as keyof typeof therapeuticExperts]
      );
      
      // 5. Générer justifications détaillées
      const justifications = this.generateMatchingJustifications(
        userProfile,
        assessmentResult,
        matchScores[0]
      );
      
      // 6. Calculer adaptations suggérées
      const suggestedAdaptations = this.calculateSuggestedAdaptations(
        userProfile,
        recommendedExpert,
        matchScores[0]
      );
      
      // 7. Enregistrer matching pour apprentissage
      await this.recordMatchingDecision(
        userProfile.user_id,
        recommendedExpertId,
        matchScores,
        justifications
      );
      
      return {
        recommended_expert: recommendedExpert,
        alternative_experts: alternativeExperts,
        match_scores: matchScores,
        primary_reasons: justifications.primary_reasons,
        cultural_considerations: justifications.cultural_considerations,
        personalization_notes: justifications.personalization_notes,
        suggested_adaptations: suggestedAdaptations
      };
      
    } catch (error) {
      console.error('Erreur matching expert optimal:', error);
      throw new Error('Impossible de déterminer l\'expert optimal');
    }
  }
  
  /**
   * MATCHING RAPIDE POUR SÉLECTION THÉMATIQUE
   * Recommandation basique selon problématique principale
   */
  async quickExpertMatch(
    problemCategory: string,
    culturalContext: string,
    language: 'fr' | 'ar'
  ): Promise<{
    suggested_expert: TherapeuticExpertProfile;
    confidence_level: number;
    reasoning: string;
  }> {
    try {
      let suggestedExpertId: string;
      let confidenceLevel = 70; // Base confidence
      let reasoning = '';
      
      // 1. Matching culturel prioritaire
      if (language === 'ar' || culturalContext.includes('arabe') || culturalContext.includes('marocain')) {
        suggestedExpertId = 'dr_aicha_culturelle';
        confidenceLevel = 90;
        reasoning = 'Expert culturellement adapté sélectionné pour contexte arabe/maghrébin';
      }
      
      // 2. Matching par problématique
      else if (expertSelectionRules.primary_diagnosis_mapping[problemCategory as keyof typeof expertSelectionRules.primary_diagnosis_mapping]) {
        suggestedExpertId = expertSelectionRules.primary_diagnosis_mapping[problemCategory as keyof typeof expertSelectionRules.primary_diagnosis_mapping];
        confidenceLevel = 75;
        reasoning = `Expert spécialisé sélectionné pour ${problemCategory}`;
      }
      
      // 3. Expert par défaut
      else {
        suggestedExpertId = 'dr_sarah_empathie';
        confidenceLevel = 60;
        reasoning = 'Expert généraliste TCC recommandé par défaut';
      }
      
      const suggestedExpert = therapeuticExperts[suggestedExpertId as keyof typeof therapeuticExperts];
      
      return {
        suggested_expert: suggestedExpert,
        confidence_level: confidenceLevel,
        reasoning: reasoning
      };
      
    } catch (error) {
      console.error('Erreur quick matching expert:', error);
      throw error;
    }
  }
  
  /**
   * RÉÉVALUATION EXPERT EN COURS DE PROGRAMME
   * Analyse si changement d'expert recommandé selon progrès
   */
  async evaluateExpertChange(
    currentExpertId: string,
    userProfile: UserTherapeuticProfile,
    programProgress: {
      weeks_elapsed: number;
      improvement_rate: number;
      engagement_level: number;
      satisfaction_score: number;
      stagnation_indicators: string[];
    }
  ): Promise<{
    change_recommended: boolean;
    alternative_expert?: TherapeuticExpertProfile;
    change_reasoning: string[];
    timing_recommendation: 'immediate' | 'next_session' | 'end_of_cycle';
    transition_strategy: string[];
  }> {
    try {
      let changeRecommended = false;
      let alternativeExpert: TherapeuticExpertProfile | undefined;
      const changeReasons: string[] = [];
      let timingRecommendation: 'immediate' | 'next_session' | 'end_of_cycle' = 'end_of_cycle';
      const transitionStrategy: string[] = [];
      
      // 1. Analyse indicateurs de stagnation
      if (programProgress.improvement_rate < 15 && programProgress.weeks_elapsed >= 4) {
        changeReasons.push('Amélioration insuffisante après 4 semaines');
        changeRecommended = true;
      }
      
      if (programProgress.engagement_level < 4 && programProgress.weeks_elapsed >= 2) {
        changeReasons.push('Faible engagement persistant');
        changeRecommended = true;
        timingRecommendation = 'next_session';
      }
      
      if (programProgress.satisfaction_score < 5 && programProgress.weeks_elapsed >= 3) {
        changeReasons.push('Satisfaction thérapeutique faible');
        changeRecommended = true;
      }
      
      // 2. Sélectionner expert alternatif si changement nécessaire
      if (changeRecommended) {
        alternativeExpert = await this.selectAlternativeExpert(
          currentExpertId,
          userProfile,
          programProgress.stagnation_indicators
        );
        
        // 3. Stratégie de transition
        transitionStrategy.push('Expliquer les raisons du changement positivement');
        transitionStrategy.push('Maintenir continuité des techniques apprises');
        transitionStrategy.push('Session de transition avec les deux experts');
        
        if (programProgress.engagement_level < 3) {
          timingRecommendation = 'immediate';
          transitionStrategy.push('Changement immédiat pour relancer la motivation');
        }
      }
      
      return {
        change_recommended: changeRecommended,
        alternative_expert: alternativeExpert,
        change_reasoning: changeReasons,
        timing_recommendation: timingRecommendation,
        transition_strategy: transitionStrategy
      };
      
    } catch (error) {
      console.error('Erreur évaluation changement expert:', error);
      throw error;
    }
  }
  
  /**
   * ANALYSE DE COMPATIBILITÉ VOCALE
   * Évaluation préférences vocales vs expert
   */
  async analyzeVoiceCompatibility(
    userProfile: UserTherapeuticProfile,
    expertId: string
  ): Promise<{
    compatibility_score: number; // 0-100
    voice_match_analysis: {
      gender_preference: 'match' | 'neutral' | 'mismatch';
      accent_preference: 'match' | 'acceptable' | 'mismatch';
      pace_preference: 'match' | 'adaptable' | 'mismatch';
      expressiveness_preference: 'match' | 'acceptable' | 'mismatch';
    };
    adaptation_suggestions: string[];
    compatibility_reasoning: string[];
  }> {
    try {
      const expert = therapeuticExperts[expertId as keyof typeof therapeuticExperts];
      if (!expert) throw new Error('Expert introuvable');
      
      const voicePrefs = userProfile.voice_preferences;
      if (!voicePrefs) {
        // Pas de préférences spécifiées = compatibilité par défaut
        return {
          compatibility_score: 80,
          voice_match_analysis: {
            gender_preference: 'neutral',
            accent_preference: 'acceptable',
            pace_preference: 'adaptable',
            expressiveness_preference: 'acceptable'
          },
          adaptation_suggestions: [],
          compatibility_reasoning: ['Aucune préférence vocale spécifiée']
        };
      }
      
      let compatibilityScore = 0;
      const analysis = {
        gender_preference: 'neutral' as 'match' | 'neutral' | 'mismatch',
        accent_preference: 'acceptable' as 'match' | 'acceptable' | 'mismatch',
        pace_preference: 'adaptable' as 'match' | 'adaptable' | 'mismatch',
        expressiveness_preference: 'acceptable' as 'match' | 'acceptable' | 'mismatch'
      };
      const adaptationSuggestions: string[] = [];
      const reasoningPoints: string[] = [];
      
      // 1. Genre vocal (toutes nos expertes sont féminines)
      if (voicePrefs.preferred_gender === 'female' || voicePrefs.preferred_gender === 'any') {
        analysis.gender_preference = 'match';
        compatibilityScore += 25;
        reasoningPoints.push('Préférence de genre vocal satisfaite');
      } else {
        analysis.gender_preference = 'mismatch';
        reasoningPoints.push('Préférence masculine non disponible');
        adaptationSuggestions.push('Tester l\'acceptabilité des expertes féminines');
      }
      
      // 2. Accent
      const expertAccent = expert.voice_configuration.cultural_accent;
      if (voicePrefs.preferred_accent === expertAccent) {
        analysis.accent_preference = 'match';
        compatibilityScore += 25;
        reasoningPoints.push('Accent vocal parfaitement adapté');
      } else if (this.isAccentCompatible(voicePrefs.preferred_accent, expertAccent)) {
        analysis.accent_preference = 'acceptable';
        compatibilityScore += 20;
        reasoningPoints.push('Accent vocal acceptable');
      } else {
        analysis.accent_preference = 'mismatch';
        compatibilityScore += 10;
        reasoningPoints.push('Accent vocal non optimal');
        adaptationSuggestions.push('Adaptation accent selon contexte culturel');
      }
      
      // 3. Rythme de parole
      const expertPace = expert.voice_configuration.speaking_pace;
      if (voicePrefs.preferred_speaking_pace === expertPace) {
        analysis.pace_preference = 'match';
        compatibilityScore += 25;
      } else {
        analysis.pace_preference = 'adaptable';
        compatibilityScore += 20;
        adaptationSuggestions.push(`Adapter rythme vers ${voicePrefs.preferred_speaking_pace}`);
      }
      
      // 4. Expressivité émotionnelle
      const expertExpressiveness = expert.voice_configuration.emotional_expressiveness;
      if (voicePrefs.emotional_expressiveness === expertExpressiveness) {
        analysis.expressiveness_preference = 'match';
        compatibilityScore += 25;
      } else {
        analysis.expressiveness_preference = 'acceptable';
        compatibilityScore += 20;
      }
      
      return {
        compatibility_score: compatibilityScore,
        voice_match_analysis: analysis,
        adaptation_suggestions: adaptationSuggestions,
        compatibility_reasoning: reasoningPoints
      };
      
    } catch (error) {
      console.error('Erreur analyse compatibilité vocale:', error);
      throw error;
    }
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - CALCUL SCORES
  // ========================================
  
  private async calculateExpertMatchScore(
    userProfile: UserTherapeuticProfile,
    assessmentResult: AssessmentResult,
    expert: TherapeuticExpertProfile
  ): Promise<ExpertMatchScore> {
    // 1. Compatibilité diagnostique (30% du score)
    const diagnosticScore = this.calculateDiagnosticCompatibility(
      userProfile.primary_diagnosis,
      userProfile.secondary_diagnoses,
      expert
    );
    
    // 2. Adéquation culturelle (25% du score)
    const culturalScore = this.calculateCulturalFit(
      userProfile.cultural_context,
      userProfile.preferred_language,
      expert
    );
    
    // 3. Alignement personnalité (20% du score)
    const personalityScore = this.calculatePersonalityAlignment(
      userProfile.personality_traits,
      expert
    );
    
    // 4. Préférence approche (15% du score)
    const approachScore = this.calculateApproachPreference(
      userProfile.therapeutic_approach_preference || '',
      expert
    );
    
    // 5. Compatibilité vocale (10% du score)
    const voiceScore = userProfile.voice_preferences ? 
      await this.calculateVoiceCompatibility(userProfile.voice_preferences, expert) : 80;
    
    // Calcul score global pondéré
    const overallScore = Math.round(
      (diagnosticScore * 0.30) +
      (culturalScore * 0.25) +
      (personalityScore * 0.20) +
      (approachScore * 0.15) +
      (voiceScore * 0.10)
    );
    
    // Génération raisons de matching
    const matchReasons = this.generateMatchReasons(
      diagnosticScore,
      culturalScore,
      personalityScore,
      expert
    );
    
    // Identification préoccupations potentielles
    const concerns = this.identifyPotentialConcerns(
      userProfile,
      expert,
      overallScore
    );
    
    // Prédictions basées sur patterns historiques
    const predictions = this.generatePredictions(
      overallScore,
      userProfile,
      expert
    );
    
    return {
      expert_id: expert.id,
      overall_score: overallScore,
      match_reasons: matchReasons,
      potential_concerns: concerns,
      diagnostic_compatibility: diagnosticScore,
      cultural_fit: culturalScore,
      personality_alignment: personalityScore,
      approach_preference: approachScore,
      voice_preference: voiceScore,
      predicted_engagement: predictions.engagement,
      predicted_completion_rate: predictions.completion,
      estimated_program_duration: predictions.duration,
      confidence_level: this.calculateConfidenceLevel(overallScore, userProfile, expert)
    };
  }
  
  private calculateDiagnosticCompatibility(
    primaryDiagnosis: string,
    secondaryDiagnoses: string[],
    expert: TherapeuticExpertProfile
  ): number {
    let score = 0;
    
    // Vérifier spécialité principale
    if (expert.specialties.some(specialty => 
      primaryDiagnosis.toLowerCase().includes(specialty.toLowerCase()))) {
      score += 80;
    } else if (expert.clinical_expertise.primary_disorders.some(disorder =>
      primaryDiagnosis.toLowerCase().includes(disorder.toLowerCase()))) {
      score += 60;
    } else {
      score += 30; // Score de base pour généraliste
    }
    
    // Bonus pour diagnostics secondaires couverts
    const secondaryCoverage = secondaryDiagnoses.filter(diagnosis =>
      expert.specialties.some(specialty =>
        diagnosis.toLowerCase().includes(specialty.toLowerCase())
      )
    ).length;
    
    score += Math.min(20, secondaryCoverage * 10);
    
    return Math.min(100, score);
  }
  
  private calculateCulturalFit(
    culturalContext: string,
    language: string,
    expert: TherapeuticExpertProfile
  ): number {
    let score = 50; // Score de base
    
    // Dr. Aicha - Expert culturel pour contexte arabe/maghrébin
    if (expert.id === 'dr_aicha_culturelle') {
      if (language === 'ar' || 
          culturalContext.includes('arabe') || 
          culturalContext.includes('marocain') ||
          culturalContext.includes('maghrébin')) {
        score = 95;
      } else {
        score = 70; // Peut quand même être approprié
      }
    }
    
    // Dr. Sarah - Context occidental/français
    else if (expert.id === 'dr_sarah_empathie') {
      if (language === 'fr' && 
          (culturalContext.includes('français') || culturalContext.includes('occidental'))) {
        score = 90;
      } else {
        score = 75;
      }
    }
    
    // Dr. Alex - Approche universelle
    else if (expert.id === 'dr_alex_mindfulness') {
      score = 85; // Mindfulness transcende les cultures
    }
    
    return score;
  }
  
  private calculatePersonalityAlignment(
    personalityTraits: UserTherapeuticProfile['personality_traits'],
    expert: TherapeuticExpertProfile
  ): number {
    let score = 70; // Score de base
    
    // Adaptation selon traits de personnalité
    if (personalityTraits.introversion_extraversion <= 4) {
      // Utilisateur introverti
      if (expert.personality.communication_style.includes('doux') ||
          expert.personality.communication_style.includes('calme')) {
        score += 15;
      }
    } else if (personalityTraits.introversion_extraversion >= 7) {
      // Utilisateur extraverti
      if (expert.personality.communication_style.includes('expressif') ||
          expert.id === 'dr_aicha_culturelle') {
        score += 15;
      }
    }
    
    // Ouverture au changement
    if (personalityTraits.openness_to_change >= 7) {
      if (expert.id === 'dr_alex_mindfulness') {
        score += 10; // Mindfulness pour ouverture élevée
      }
    }
    
    // Style d'apprentissage
    if (personalityTraits.learning_style === 'experiential' && 
        expert.id === 'dr_alex_mindfulness') {
      score += 10;
    }
    
    return Math.min(100, score);
  }
  
  private calculateApproachPreference(
    approachPreference: string,
    expert: TherapeuticExpertProfile
  ): number {
    if (!approachPreference) return 70; // Neutre si pas de préférence
    
    const preferences = approachPreference.toLowerCase();
    const expertApproach = expert.primary_approach.toLowerCase();
    
    if (preferences.includes('tcc') && expertApproach.includes('tcc')) {
      return 95;
    }
    
    if (preferences.includes('mindfulness') && expertApproach.includes('pleine conscience')) {
      return 95;
    }
    
    if (preferences.includes('culturel') && expert.id === 'dr_aicha_culturelle') {
      return 90;
    }
    
    return 60;
  }
  
  private async calculateVoiceCompatibility(
    voicePrefs: NonNullable<UserTherapeuticProfile['voice_preferences']>,
    expert: TherapeuticExpertProfile
  ): Promise<number> {
    const compatibility = await this.analyzeVoiceCompatibility(
      { voice_preferences: voicePrefs } as UserTherapeuticProfile,
      expert.id
    );
    
    return compatibility.compatibility_score;
  }
  
  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================
  
  private generateMatchReasons(
    diagnosticScore: number,
    culturalScore: number,
    personalityScore: number,
    expert: TherapeuticExpertProfile
  ): string[] {
    const reasons = [];
    
    if (diagnosticScore >= 80) {
      reasons.push(`Expertise spécialisée dans vos problématiques principales`);
    }
    
    if (culturalScore >= 85) {
      reasons.push(`Parfaitement adapté à votre contexte culturel`);
    }
    
    if (personalityScore >= 85) {
      reasons.push(`Style thérapeutique aligné avec votre personnalité`);
    }
    
    reasons.push(`Approche ${expert.primary_approach} reconnue efficace`);
    
    return reasons;
  }
  
  private identifyPotentialConcerns(
    userProfile: UserTherapeuticProfile,
    expert: TherapeuticExpertProfile,
    overallScore: number
  ): string[] {
    const concerns = [];
    
    if (overallScore < 60) {
      concerns.push('Compatibilité modérée - suivi rapproché recommandé');
    }
    
    if (userProfile.personality_traits.therapy_readiness < 5) {
      concerns.push('Motivation thérapeutique faible à surveiller');
    }
    
    if (userProfile.severity_level === 'sévère' && expert.id !== 'dr_sarah_empathie') {
      concerns.push('Cas complexe nécessitant expertise TCC avancée');
    }
    
    return concerns;
  }
  
  private generatePredictions(
    overallScore: number,
    userProfile: UserTherapeuticProfile,
    expert: TherapeuticExpertProfile
  ): { engagement: number; completion: number; duration: number } {
    // Prédictions basées sur score de matching et profil utilisateur
    const baseEngagement = overallScore;
    const motivationBonus = userProfile.personality_traits.motivation_level * 5;
    const readinessBonus = userProfile.personality_traits.therapy_readiness * 3;
    
    const predictedEngagement = Math.min(100, baseEngagement + motivationBonus + readinessBonus);
    
    // Taux de completion basé sur engagement prédit
    const predictedCompletion = Math.round(predictedEngagement * 0.8);
    
    // Durée estimée selon sévérité et engagement
    let estimatedDuration = 8; // Base
    if (userProfile.severity_level === 'sévère') estimatedDuration += 4;
    if (predictedEngagement < 60) estimatedDuration += 2;
    if (userProfile.personality_traits.motivation_level > 8) estimatedDuration -= 1;
    
    return {
      engagement: Math.round(predictedEngagement),
      completion: predictedCompletion,
      duration: Math.max(6, Math.min(16, estimatedDuration))
    };
  }
  
  private calculateConfidenceLevel(
    overallScore: number,
    userProfile: UserTherapeuticProfile,
    expert: TherapeuticExpertProfile
  ): number {
    let confidence = overallScore;
    
    // Réduire confiance si profil incomplet
    if (!userProfile.voice_preferences) confidence -= 5;
    if (!userProfile.therapeutic_approach_preference) confidence -= 5;
    
    // Augmenter confiance si match culturel parfait
    if (expert.id === 'dr_aicha_culturelle' && userProfile.preferred_language === 'ar') {
      confidence += 10;
    }
    
    return Math.max(50, Math.min(95, confidence));
  }
  
  private generateMatchingJustifications(
    userProfile: UserTherapeuticProfile,
    assessmentResult: AssessmentResult,
    bestMatch: ExpertMatchScore
  ): {
    primary_reasons: string[];
    cultural_considerations: string[];
    personalization_notes: string[];
  } {
    const expert = therapeuticExperts[bestMatch.expert_id as keyof typeof therapeuticExperts];
    
    return {
      primary_reasons: [
        `Score de compatibilité élevé: ${bestMatch.overall_score}%`,
        `Spécialisation en ${expert.specialties.join(', ')}`,
        `Approche ${expert.primary_approach} adaptée à votre profil`
      ],
      cultural_considerations: [
        expert.id === 'dr_aicha_culturelle' ? 
          'Expert culturellement adapté au contexte arabe/maghrébin' :
          'Approche universelle respectueuse de la diversité culturelle'
      ],
      personalization_notes: [
        `Style de communication: ${expert.personality.communication_style}`,
        `Personnalisation selon votre profil introversion/extraversion`,
        `Adaptation du rythme selon votre motivation (${userProfile.personality_traits.motivation_level}/10)`
      ]
    };
  }
  
  private calculateSuggestedAdaptations(
    userProfile: UserTherapeuticProfile,
    expert: TherapeuticExpertProfile,
    matchScore: ExpertMatchScore
  ): MatchingRecommendation['suggested_adaptations'] {
    const adaptations = {
      program_duration_adjustment: matchScore.estimated_program_duration,
      session_frequency_suggestion: userProfile.personality_traits.motivation_level >= 7 ? 1.5 : 1,
      approach_modifications: [] as string[],
      special_considerations: [] as string[]
    };
    
    // Modifications d'approche selon profil
    if (userProfile.personality_traits.learning_style === 'visual') {
      adaptations.approach_modifications.push('Intégrer plus d\'exercices visuels');
    }
    
    if (userProfile.severity_level === 'sévère') {
      adaptations.special_considerations.push('Suivi renforcé recommandé');
      adaptations.session_frequency_suggestion = 2;
    }
    
    if (userProfile.personality_traits.therapy_readiness < 6) {
      adaptations.special_considerations.push('Phase de préparation thérapeutique nécessaire');
    }
    
    return adaptations;
  }
  
  private async selectAlternativeExpert(
    currentExpertId: string,
    userProfile: UserTherapeuticProfile,
    stagnationIndicators: string[]
  ): Promise<TherapeuticExpertProfile> {
    // Logique de sélection d'expert alternatif
    const expertIds = Object.keys(therapeuticExperts).filter(id => id !== currentExpertId);
    
    // Privilégier changement d'approche
    if (currentExpertId === 'dr_sarah_empathie') {
      return therapeuticExperts.dr_alex_mindfulness; // Changer vers mindfulness
    } else if (currentExpertId === 'dr_alex_mindfulness') {
      return therapeuticExperts.dr_sarah_empathie; // Retour vers TCC structurée
    } else {
      return therapeuticExperts.dr_sarah_empathie; // Expert polyvalent
    }
  }
  
  private isAccentCompatible(preferredAccent: string, expertAccent: string): boolean {
    const compatibilityMap: Record<string, string[]> = {
      'français_standard': ['français_parisien', 'français_métropolitain'],
      'neutre_international': ['français_standard', 'neutre_universel'],
      'marocain_darija': ['maghrébin_authentique', 'arabe_dialectal']
    };
    
    return compatibilityMap[expertAccent]?.includes(preferredAccent) || false;
  }
  
  private async recordMatchingDecision(
    userId: string,
    expertId: string,
    matchScores: ExpertMatchScore[],
    justifications: any
  ): Promise<void> {
    // Enregistrer décision pour apprentissage machine futur
    const matchingRecord = {
      user_id: userId,
      recommended_expert: expertId,
      match_scores: matchScores,
      justifications: justifications,
      created_at: new Date().toISOString()
    };
    
    await supabase
      .from('expert_matching_history')
      .insert([matchingRecord]);
  }
}

export default ExpertMatchingService;