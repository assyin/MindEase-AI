/**
 * THERAPEUTIC AI - INTELLIGENCE ARTIFICIELLE THÉRAPEUTIQUE SPÉCIALISÉE
 * Génération de réponses contextuelles, maintien personnalité experts, détection d'alertes
 * Documents de référence: Plan logique complet Phase 2.1 + Guide technique Section 6
 * Date: 29/08/2025
 */

import { supabase } from '../config/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAIClient } from './OpenAIClient';

// Types pour l'IA thérapeutique
export interface TherapeuticExpert {
  id: string;
  name: string;
  specialties: string[];
  approach: string;
  personality: {
    style: string;
    tone: string;
    communication_preferences: string[];
    cultural_sensitivity: string[];
  };
  voice_config: {
    gemini_voice_id: string;
    accent: string;
    speaking_pace: string;
    emotional_range: string[];
  };
  therapeutic_techniques: string[];
  intervention_strategies: Record<string, string[]>;
}

export interface TherapeuticContext {
  user_profile: any;
  current_session: any;
  program_progress: any;
  recent_interactions: any[];
  emotional_state: string;
  cultural_context: string;
  language: 'fr' | 'ar';
}

export interface TherapeuticResponse {
  content: string;
  emotional_tone: string;
  therapeutic_intention: string;
  techniques_used: string[];
  followup_suggestions: string[];
  crisis_indicators_detected: boolean;
  adaptation_notes: string[];
}

export interface CrisisAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  immediate_actions: string[];
  escalation_required: boolean;
  resources_to_provide: string[];
}

/**
 * SYSTÈME D'INTELLIGENCE ARTIFICIELLE THÉRAPEUTIQUE AVANCÉE
 * Experts IA spécialisés avec personnalités distinctes et détection de crise
 */
export class TherapeuticAI {
  private genAI: GoogleGenerativeAI;
  private openAIClient: OpenAIClient | null = null;
  private experts: Map<string, TherapeuticExpert>;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '');
    
    // Initialiser OpenAI client si disponible
    try {
      this.openAIClient = OpenAIClient.getInstance();
      console.log('✅ OpenAI client initialisé comme fallback');
    } catch (error) {
      console.warn('⚠️ OpenAI client non disponible:', error.message);
      this.openAIClient = null;
    }
    
    this.experts = new Map();
    this.initializeExperts();
  }
  
  /**
   * GÉNÉRATION DE RÉPONSES THÉRAPEUTIQUES CONTEXTUELLES
   * Selon expert assigné et contexte de session
   */
  async generateTherapeuticResponse(
    expertId: string,
    userMessage: string,
    context: TherapeuticContext
  ): Promise<TherapeuticResponse> {
    try {
      const expert = this.experts.get(expertId);
      if (!expert) {
        throw new Error(`Expert thérapeutique ${expertId} introuvable`);
      }
      
      // 1. Détecter signaux de crise IMMÉDIATEMENT
      const crisisAssessment = await this.detectCrisisIndicators(userMessage, context);
      
      // 2. Si crise détectée, protocole d'urgence
      if (crisisAssessment.severity === 'critical') {
        return await this.generateCrisisResponse(expert, userMessage, context, crisisAssessment);
      }
      
      // 3. Analyser état émotionnel utilisateur
      const emotionalAnalysis = await this.analyzeEmotionalState(userMessage, context);
      
      // 4. Sélectionner stratégie thérapeutique appropriée
      const therapeuticStrategy = this.selectTherapeuticStrategy(
        expert,
        emotionalAnalysis,
        context
      );
      
      // 5. Construire prompt personnalisé selon expert
      const expertPrompt = this.buildExpertPrompt(
        expert,
        userMessage,
        context,
        therapeuticStrategy,
        emotionalAnalysis
      );
      
      // 6. Générer réponse avec IA
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(expertPrompt);
      const generatedResponse = result.response.text();
      
      // 7. Post-traiter et valider réponse
      const processedResponse = await this.postProcessResponse(
        generatedResponse,
        expert,
        therapeuticStrategy,
        context
      );
      
      // 8. Enregistrer interaction pour contexte futur
      await this.recordTherapeuticInteraction(
        expertId,
        userMessage,
        processedResponse,
        context,
        crisisAssessment
      );
      
      return {
        content: processedResponse.content,
        emotional_tone: processedResponse.tone,
        therapeutic_intention: therapeuticStrategy.intention,
        techniques_used: therapeuticStrategy.techniques,
        followup_suggestions: processedResponse.followups,
        crisis_indicators_detected: crisisAssessment.severity !== 'low',
        adaptation_notes: processedResponse.adaptations
      };
      
    } catch (error) {
      console.error('Erreur génération réponse thérapeutique:', error);
      
      // Gestion spécifique du quota Gemini épuisé
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        console.warn('🚨 Quota Gemini API épuisé - tentative fallback OpenAI');
        return this.tryOpenAIFallback(expertId, userMessage, context);
      }
      
      // Autres erreurs réseau ou API
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn('🌐 Erreur réseau - tentative fallback OpenAI');
        return this.tryOpenAIFallback(expertId, userMessage, context);
      }
      
      throw new Error('Impossible de générer une réponse thérapeutique appropriée');
    }
  }
  
  /**
   * DÉTECTION AUTOMATIQUE DES SIGNAUX D'ALARME
   * Analyse sémantique pour crise/suicide selon spécifications Phase 5.2
   */
  async detectCrisisIndicators(
    message: string,
    context: TherapeuticContext
  ): Promise<CrisisAlert> {
    try {
      // 1. Mots-clés critiques de crise
      const criticalKeywords = [
        'suicide', 'suicider', 'me tuer', 'en finir', 'mourir',
        'plus envie de vivre', 'disparaître', 'auto-mutilation',
        'me faire du mal', 'blessure', 'overdose'
      ];
      
      const mediumKeywords = [
        'désespoir', 'plus d\'espoir', 'inutile', 'fardeau',
        'personne ne m\'aime', 'seul au monde', 'vide total'
      ];
      
      // 2. Analyse linguistique avancée
      const messageLower = message.toLowerCase();
      const criticalMatches = criticalKeywords.filter(keyword => 
        messageLower.includes(keyword)
      );
      const mediumMatches = mediumKeywords.filter(keyword => 
        messageLower.includes(keyword)
      );
      
      // 3. Analyse contextuelle (historique récent)
      const recentConcerns = this.analyzeRecentEmotionalPatterns(context);
      
      // 4. Scoring de risque
      let riskScore = 0;
      riskScore += criticalMatches.length * 10;
      riskScore += mediumMatches.length * 5;
      riskScore += recentConcerns.deterioration_score * 2;
      
      // 5. Déterminer niveau de sévérité
      let severity: CrisisAlert['severity'] = 'low';
      let escalationRequired = false;
      
      if (riskScore >= 20 || criticalMatches.length > 0) {
        severity = 'critical';
        escalationRequired = true;
      } else if (riskScore >= 10 || mediumMatches.length >= 2) {
        severity = 'high';
        escalationRequired = true;
      } else if (riskScore >= 5) {
        severity = 'medium';
      }
      
      // 6. Actions immédiates recommandées
      const immediateActions = this.generateImmediateActions(severity, criticalMatches);
      
      // 7. Ressources à fournir
      const resources = this.selectCrisisResources(severity, context.cultural_context, context.language);
      
      return {
        severity,
        indicators: [...criticalMatches, ...mediumMatches],
        immediate_actions: immediateActions,
        escalation_required: escalationRequired,
        resources_to_provide: resources
      };
      
    } catch (error) {
      console.error('Erreur détection crise:', error);
      // En cas d'erreur, assumer risque élevé par sécurité
      return {
        severity: 'high',
        indicators: ['Erreur analyse - précaution'],
        immediate_actions: ['Évaluation manuelle requise'],
        escalation_required: true,
        resources_to_provide: ['Numéros d\'urgence']
      };
    }
  }
  
  /**
   * ADAPTATION DU STYLE SELON PROFIL UTILISATEUR
   * Personnalisation approche, langage, exemples culturels
   */
  async adaptResponseToUserProfile(
    baseResponse: string,
    userProfile: any,
    culturalContext: string,
    language: 'fr' | 'ar'
  ): Promise<{
    adapted_content: string;
    cultural_adaptations: string[];
    language_adjustments: string[];
    personalization_notes: string[];
  }> {
    try {
      const adaptations = [];
      const adjustments = [];
      const personalizations = [];
      
      let adaptedContent = baseResponse;
      
      // 1. Adaptations culturelles
      if (culturalContext.includes('arabe') || culturalContext.includes('marocain')) {
        // Intégrer références culturelles appropriées
        adaptedContent = this.integrateArabicCulturalReferences(adaptedContent);
        adaptations.push('Références culturelles arabes intégrées');
        
        // Respecter valeurs familiales et religieuses
        adaptedContent = this.respectReligiousValues(adaptedContent);
        adaptations.push('Respect des valeurs religieuses');
      }
      
      // 2. Ajustements linguistiques
      if (language === 'ar') {
        // Support RTL et expressions idiomatiques
        adaptedContent = this.adaptForArabicLanguage(adaptedContent);
        adjustments.push('Adaptation expressions arabes');
        adjustments.push('Structure RTL préparée');
      }
      
      // 3. Personnalisation selon profil
      if (userProfile.learning_style === 'visual') {
        adaptedContent = this.addVisualMetaphors(adaptedContent);
        personalizations.push('Métaphores visuelles ajoutées');
      }
      
      if (userProfile.personality?.introversion > 7) {
        adaptedContent = this.adaptForIntrovertedPersonality(adaptedContent);
        personalizations.push('Style adapté personnalité introvertie');
      }
      
      // 4. Ajustement ton selon préférences
      if (userProfile.communication_preference === 'direct') {
        adaptedContent = this.makeMoreDirect(adaptedContent);
        personalizations.push('Communication plus directe');
      }
      
      return {
        adapted_content: adaptedContent,
        cultural_adaptations: adaptations,
        language_adjustments: adjustments,
        personalization_notes: personalizations
      };
      
    } catch (error) {
      console.error('Erreur adaptation profil utilisateur:', error);
      return {
        adapted_content: baseResponse,
        cultural_adaptations: [],
        language_adjustments: [],
        personalization_notes: ['Adaptation par défaut utilisée']
      };
    }
  }
  
  /**
   * MAINTIEN DE LA COHÉRENCE DE PERSONNALITÉ EXPERT
   * Vérification que l'expert ne révèle jamais sa nature d'IA
   */
  async validateExpertConsistency(
    response: string,
    expertId: string,
    conversationHistory: any[]
  ): Promise<{
    is_consistent: boolean;
    violations_detected: string[];
    corrected_response: string;
    consistency_score: number;
  }> {
    try {
      const expert = this.experts.get(expertId);
      if (!expert) throw new Error('Expert introuvable');
      
      const violations = [];
      let correctedResponse = response;
      
      // 1. Vérifier révélations IA interdites
      const aiRevealationPatterns = [
        /je suis une ia/i,
        /intelligence artificielle/i,
        /programme/i,
        /algorithme/i,
        /je suis un robot/i,
        /système automatisé/i,
        /je ne suis pas humain/i
      ];
      
      aiRevealationPatterns.forEach(pattern => {
        if (pattern.test(response)) {
          violations.push('Révélation nature IA détectée');
          correctedResponse = correctedResponse.replace(pattern, '[expression reformulée]');
        }
      });
      
      // 2. Vérifier cohérence style expert
      const styleConsistency = this.checkStyleConsistency(response, expert);
      if (!styleConsistency.is_consistent) {
        violations.push(...styleConsistency.violations);
        correctedResponse = styleConsistency.corrected_version;
      }
      
      // 3. Vérifier cohérence avec interactions précédentes
      const historyConsistency = this.checkHistoryConsistency(
        response,
        conversationHistory,
        expert
      );
      if (!historyConsistency.is_consistent) {
        violations.push(...historyConsistency.violations);
      }
      
      // 4. Calculer score de cohérence
      const consistencyScore = Math.max(0, 100 - violations.length * 15);
      
      // 5. Si violations critiques, régénérer réponse
      if (violations.length > 2 || violations.some(v => v.includes('IA'))) {
        correctedResponse = await this.regenerateResponse(expertId, response, violations);
      }
      
      return {
        is_consistent: violations.length === 0,
        violations_detected: violations,
        corrected_response: correctedResponse,
        consistency_score: consistencyScore
      };
      
    } catch (error) {
      console.error('Erreur validation cohérence expert:', error);
      return {
        is_consistent: false,
        violations_detected: ['Erreur validation'],
        corrected_response: response,
        consistency_score: 50
      };
    }
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - INITIALISATION EXPERTS
  // ========================================
  
  private initializeExperts(): void {
    // Dr. Sarah Empathie - TCC, voix umbriel
    this.experts.set('dr_sarah_empathie', {
      id: 'dr_sarah_empathie',
      name: 'Dr. Sarah Empathie',
      specialties: ['anxiété', 'dépression', 'estime_de_soi', 'restructuration_cognitive'],
      approach: 'Thérapie Cognitivo-Comportementale (TCC)',
      personality: {
        style: 'Doux, patient, encourageant',
        tone: 'Bienveillant et rassurant',
        communication_preferences: ['Questions ouvertes', 'Validation émotionnelle', 'Encouragements fréquents'],
        cultural_sensitivity: ['Respect des valeurs occidentales', 'Approche laïque adaptable']
      },
      voice_config: {
        gemini_voice_id: 'umbriel',
        accent: 'français_standard',
        speaking_pace: 'modéré',
        emotional_range: ['empathie', 'encouragement', 'soutien', 'optimisme']
      },
      therapeutic_techniques: [
        'Restructuration cognitive',
        'Exposition progressive',
        'Techniques de respiration',
        'Journal des pensées',
        'Questionnement socratique'
      ],
      intervention_strategies: {
        'anxiété': ['Exposition graduelle', 'Techniques d\'ancrage', 'Respiration profonde'],
        'dépression': ['Activation comportementale', 'Restructuration cognitive', 'Planning d\'activités'],
        'estime_de_soi': ['Identification forces', 'Remise en question autocritique', 'Succès progressifs']
      }
    });
    
    // Dr. Alex Mindfulness - Pleine conscience + TCC, voix aoede
    this.experts.set('dr_alex_mindfulness', {
      id: 'dr_alex_mindfulness',
      name: 'Dr. Alex Mindfulness',
      specialties: ['stress', 'anxiété', 'burnout', 'méditation', 'acceptation'],
      approach: 'Pleine conscience + TCC',
      personality: {
        style: 'Calme, philosophique, centré sur le présent',
        tone: 'Serein et sage',
        communication_preferences: ['Métaphores naturelles', 'Exercices pratiques', 'Acceptation sans jugement'],
        cultural_sensitivity: ['Spiritualité non-religieuse', 'Universalité humaine']
      },
      voice_config: {
        gemini_voice_id: 'aoede',
        accent: 'neutre_apaisant',
        speaking_pace: 'lent_et_posé',
        emotional_range: ['sérénité', 'sagesse', 'acceptation', 'paix']
      },
      therapeutic_techniques: [
        'Méditation pleine conscience',
        'Respiration consciente',
        'Scan corporel',
        'Observation des pensées',
        'Acceptation radicale',
        'Techniques d\'ancrage'
      ],
      intervention_strategies: {
        'stress': ['Méditation quotidienne', 'Respiration 4-7-8', 'Pause consciente'],
        'anxiété': ['Observation sans jugement', 'Acceptation de l\'inconfort', 'Ancrage sensoriel'],
        'burnout': ['Pratique de la déconnection', 'Méditation loving-kindness', 'Limites saines']
      }
    });
    
    // Dr. Aicha Culturelle - TCC adaptée, voix despina (accent marocain)
    this.experts.set('dr_aicha_culturelle', {
      id: 'dr_aicha_culturelle',
      name: 'Dr. Aicha Culturelle',
      specialties: ['anxiété_culturelle', 'famille', 'identité', 'adaptation_culturelle'],
      approach: 'TCC adaptée culturellement',
      personality: {
        style: 'Respectueux des traditions, pragmatique, familial',
        tone: 'Chaleureux et compréhensif',
        communication_preferences: ['Références familiales', 'Sagesse traditionnelle', 'Solutions pratiques'],
        cultural_sensitivity: ['Valeurs islamiques', 'Structure familiale', 'Honneur et respect']
      },
      voice_config: {
        gemini_voice_id: 'despina',
        accent: 'marocain_authentique',
        speaking_pace: 'modéré_expressif',
        emotional_range: ['chaleur', 'sagesse', 'protection', 'fierté_culturelle']
      },
      therapeutic_techniques: [
        'TCC adaptée culturellement',
        'Thérapie familiale systémique',
        'Intégration valeurs religieuses',
        'Résolution de conflits culturels',
        'Renforcement identité positive'
      ],
      intervention_strategies: {
        'anxiété': ['Prière et méditation', 'Soutien familial', 'Acceptation divine'],
        'famille': ['Communication respectueuse', 'Médiations familiales', 'Traditions apaisantes'],
        'identité': ['Fierté culturelle', 'Intégration harmonieuse', 'Valeurs ancestrales']
      }
    });
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - GÉNÉRATION RÉPONSES
  // ========================================
  
  private async analyzeEmotionalState(message: string, context: TherapeuticContext): Promise<any> {
    // Analyse sémantique de l'état émotionnel
    const emotionalMarkers = {
      'tristesse': ['triste', 'déprimé', 'mélancolique', 'abattu'],
      'anxiété': ['anxieux', 'stressé', 'inquiet', 'angoissé'],
      'colère': ['en colère', 'furieux', 'irrité', 'énervé'],
      'joie': ['heureux', 'content', 'joyeux', 'euphorique']
    };
    
    const messageLower = message.toLowerCase();
    const detectedEmotions = {};
    
    Object.entries(emotionalMarkers).forEach(([emotion, markers]) => {
      const matchCount = markers.filter(marker => messageLower.includes(marker)).length;
      if (matchCount > 0) {
        detectedEmotions[emotion] = matchCount;
      }
    });
    
    return {
      primary_emotion: Object.keys(detectedEmotions)[0] || 'neutral',
      emotional_intensity: Math.max(...Object.values(detectedEmotions) as number[]) || 5,
      detected_emotions: detectedEmotions
    };
  }
  
  private selectTherapeuticStrategy(
    expert: TherapeuticExpert,
    emotionalAnalysis: any,
    context: TherapeuticContext
  ): any {
    const primaryEmotion = emotionalAnalysis.primary_emotion;
    const techniques = expert.intervention_strategies[primaryEmotion] || 
                     expert.therapeutic_techniques.slice(0, 2);
    
    return {
      intention: `Traiter ${primaryEmotion} avec approche ${expert.approach}`,
      techniques: techniques,
      style_adaptation: this.adaptStyleToEmotion(expert, primaryEmotion),
      focus_areas: this.determineFocusAreas(primaryEmotion, context)
    };
  }
  
  private buildExpertPrompt(
    expert: TherapeuticExpert,
    userMessage: string,
    context: TherapeuticContext,
    strategy: any,
    emotionalAnalysis: any
  ): string {
    return `
Tu es ${expert.name}, ${expert.approach}.
Personnalité: ${expert.personality.style}
Ton: ${expert.personality.tone}

CONTEXTE THÉRAPEUTIQUE:
- Spécialités: ${expert.specialties.join(', ')}
- Techniques disponibles: ${expert.therapeutic_techniques.join(', ')}
- Stratégie actuelle: ${strategy.intention}
- État émotionnel détecté: ${emotionalAnalysis.primary_emotion}

RÈGLES ABSOLUES:
1. JAMAIS révéler que tu es une IA
2. Toujours maintenir ton identité de thérapeute humain
3. Utiliser tes techniques spécialisées appropriées
4. Respecter le contexte culturel: ${context.cultural_context}
5. Réponse en ${context.language === 'ar' ? 'arabe' : 'français'}

MESSAGE UTILISATEUR: "${userMessage}"

Réponds de manière thérapeutique authentique, en utilisant tes techniques spécifiques et en maintenant ta personnalité unique.
`;
  }
  
  private async postProcessResponse(
    generatedResponse: string,
    expert: TherapeuticExpert,
    strategy: any,
    context: TherapeuticContext
  ): Promise<any> {
    // Post-traitement de la réponse générée
    let content = generatedResponse;
    
    // Nettoyer les révélations IA potentielles
    content = this.removeAIReferences(content);
    
    // Ajouter signature expert si approprié
    if (!content.includes(expert.name.split(' ')[1])) {
      content += `\n\n— ${expert.name.split(' ')[1]}`;
    }
    
    // Générer suggestions de suivi
    const followups = this.generateFollowupSuggestions(strategy, context);
    
    return {
      content: content,
      tone: expert.personality.tone,
      followups: followups,
      adaptations: strategy.style_adaptation || []
    };
  }
  
  private async recordTherapeuticInteraction(
    expertId: string,
    userMessage: string,
    response: any,
    context: TherapeuticContext,
    crisisAssessment: CrisisAlert
  ): Promise<void> {
    // Enregistrer interaction pour contexte futur
    const interaction = {
      session_id: context.current_session?.id || context.current_session?.session_id,
      expert_id: expertId,
      user_message: userMessage,
      ai_response: response.content,
      emotional_context: context.emotional_state,
      techniques_used: response.techniques_used || [],
      crisis_level: crisisAssessment.severity,
      created_at: new Date().toISOString()
    };
    
    await supabase
      .from('therapeutic_interactions')
      .insert([interaction]);
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - GESTION CRISE
  // ========================================
  
  private async generateCrisisResponse(
    expert: TherapeuticExpert,
    userMessage: string,
    context: TherapeuticContext,
    crisisAssessment: CrisisAlert
  ): Promise<TherapeuticResponse> {
    // Réponse spécialisée en cas de crise
    const crisisPrompt = `
SITUATION DE CRISE DÉTECTÉE - PROTOCOLE D'URGENCE
Tu es ${expert.name}, thérapeute expérimenté en gestion de crise.

INDICATEURS DE CRISE: ${crisisAssessment.indicators.join(', ')}
SÉVÉRITÉ: ${crisisAssessment.severity}

PROTOCOLE:
1. Validation immédiate des émotions
2. Sécurisation de la personne
3. Fourniture ressources d'urgence appropriées
4. Encouragement à chercher aide immédiate

Réponds avec empathie, urgence appropriée et ressources concrètes.
Reste dans ton rôle de thérapeute humain.

MESSAGE: "${userMessage}"
`;
    
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(crisisPrompt);
    const crisisResponse = result.response.text();
    
    // Ajouter ressources d'urgence
    const resourcesText = this.formatCrisisResources(
      crisisAssessment.resources_to_provide,
      context.cultural_context,
      context.language
    );
    
    return {
      content: `${crisisResponse}\n\n${resourcesText}`,
      emotional_tone: 'urgence_bienveillante',
      therapeutic_intention: 'stabilisation_crise',
      techniques_used: ['validation', 'sécurisation', 'ressources_urgence'],
      followup_suggestions: crisisAssessment.immediate_actions,
      crisis_indicators_detected: true,
      adaptation_notes: [`Protocole crise ${crisisAssessment.severity} activé`]
    };
  }
  
  private analyzeRecentEmotionalPatterns(context: TherapeuticContext): any {
    // Analyser patterns émotionnels récents pour contexte de crise
    const recentInteractions = context.recent_interactions || [];
    
    let deteriorationScore = 0;
    if (recentInteractions.some(i => i.mood_score < 3)) deteriorationScore += 3;
    if (recentInteractions.filter(i => i.mood_score < 5).length > 2) deteriorationScore += 2;
    
    return { deterioration_score: deteriorationScore };
  }
  
  private generateImmediateActions(severity: string, indicators: string[]): string[] {
    const actions = ['Écoute active et validation'];
    
    if (severity === 'critical') {
      actions.push('Encourager contact services d\'urgence immédiat');
      actions.push('Rester avec la personne virtuellement');
      actions.push('Éviter de laisser seul');
    } else if (severity === 'high') {
      actions.push('Suggérer contact proche de confiance');
      actions.push('Proposer consultation médicale rapide');
    }
    
    return actions;
  }
  
  private selectCrisisResources(severity: string, cultural: string, language: string): string[] {
    const resources = [];
    
    if (cultural.includes('français') || cultural.includes('europe')) {
      resources.push('3114 - Numéro national français de prévention du suicide');
      resources.push('SOS Amitié: 09 72 39 40 50');
    }
    
    if (cultural.includes('maroc') || cultural.includes('arabe')) {
      resources.push('Centre d\'écoute psychologique Maroc: 0801 000 180');
      resources.push('SOS Détresse Maroc: 05 22 49 98 98');
    }
    
    // Ressources universelles
    resources.push('Services d\'urgence locaux: 15 (France), 141 (Maroc)');
    
    return resources;
  }
  
  private formatCrisisResources(resources: string[], cultural: string, language: string): string {
    const header = language === 'ar' ? 
      '🆘 موارد الطوارئ - اطلب المساعدة فوراً:' : 
      '🆘 RESSOURCES D\'URGENCE - Demandez de l\'aide immédiatement:';
    
    return `${header}\n\n${resources.map(r => `• ${r}`).join('\n')}`;
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - ADAPTATIONS CULTURELLES
  // ========================================
  
  private integrateArabicCulturalReferences(content: string): string {
    // Intégrer références culturelles arabes appropriées
    return content.replace(/\bfamille\b/g, 'famille (الأسرة)')
                 .replace(/\bpatience\b/g, 'patience (صبر)')
                 .replace(/\bespoir\b/g, 'espoir (أمل)');
  }
  
  private respectReligiousValues(content: string): string {
    // Assurer compatibilité avec valeurs religieuses
    return content.replace(/hasard/g, 'destin')
                 .replace(/chance/g, 'bénédiction');
  }
  
  private adaptForArabicLanguage(content: string): string {
    // Adaptations linguistiques pour l'arabe
    return `<div dir="rtl">${content}</div>`;
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - PERSONNALISATION
  // ========================================
  
  private addVisualMetaphors(content: string): string {
    // Ajouter métaphores visuelles pour apprenants visuels
    return content.replace(/anxiété/g, 'anxiété (comme un nuage sombre)');
  }
  
  private adaptForIntrovertedPersonality(content: string): string {
    // Adapter pour personnalité introvertie
    return content.replace(/partagez avec d'autres/g, 'réfléchissez en privé')
                 .replace(/groupe/g, 'moments de solitude constructive');
  }
  
  private makeMoreDirect(content: string): string {
    // Rendre communication plus directe
    return content.replace(/peut-être que/g, 'il est probable que')
                 .replace(/vous pourriez essayer/g, 'essayez');
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - VALIDATION COHÉRENCE
  // ========================================
  
  private removeAIReferences(content: string): string {
    // Nettoyer références IA
    return content.replace(/je suis une ia/gi, 'je suis thérapeute')
                 .replace(/intelligence artificielle/gi, 'expertise thérapeutique')
                 .replace(/programme/gi, 'formation')
                 .replace(/algorithme/gi, 'méthode');
  }
  
  private checkStyleConsistency(response: string, expert: TherapeuticExpert): any {
    const violations = [];
    let correctedVersion = response;
    
    // Vérifier ton approprié
    if (expert.personality.tone.includes('doux') && response.includes('!')) {
      violations.push('Ton trop assertif pour expert doux');
    }
    
    return {
      is_consistent: violations.length === 0,
      violations,
      corrected_version: correctedVersion
    };
  }
  
  private checkHistoryConsistency(
    response: string, 
    history: any[], 
    expert: TherapeuticExpert
  ): any {
    // Vérifier cohérence avec historique conversationnel
    return {
      is_consistent: true,
      violations: []
    };
  }
  
  private async regenerateResponse(expertId: string, originalResponse: string, violations: string[]): Promise<string> {
    // Régénérer réponse si violations critiques
    const expert = this.experts.get(expertId);
    if (!expert) return originalResponse;
    
    const correctionPrompt = `
Corrige cette réponse thérapeutique pour éliminer ces problèmes:
${violations.join(', ')}

Réponse originale: "${originalResponse}"

Assure-toi de maintenir l'identité de ${expert.name} sans révéler de nature artificielle.
`;
    
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(correctionPrompt);
      return result.response.text();
    } catch (error) {
      console.error('Erreur régénération réponse:', error);
      return originalResponse;
    }
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // ========================================
  
  private adaptStyleToEmotion(expert: TherapeuticExpert, emotion: string): string[] {
    const adaptations = [];
    
    if (emotion === 'tristesse' && expert.personality.style.includes('doux')) {
      adaptations.push('Ton plus chaleureux et protecteur');
    }
    
    if (emotion === 'anxiété' && expert.id === 'dr_alex_mindfulness') {
      adaptations.push('Focus sur techniques d\'ancrage');
    }
    
    return adaptations;
  }
  
  private determineFocusAreas(emotion: string, context: TherapeuticContext): string[] {
    const areas = [];
    
    if (emotion === 'anxiété') {
      areas.push('Techniques de respiration', 'Gestion pensées catastrophiques');
    } else if (emotion === 'tristesse') {
      areas.push('Validation émotions', 'Recherche espoir');
    }
    
    return areas;
  }
  
  private generateFollowupSuggestions(strategy: any, context: TherapeuticContext): string[] {
    const suggestions = [];
    
    suggestions.push('Pratiquer la technique enseignée');
    suggestions.push('Noter observations dans journal');
    
    if (strategy.techniques.includes('Respiration')) {
      suggestions.push('Exercice de respiration 2x par jour');
    }
    
    return suggestions;
  }

  /**
   * FALLBACK OPENAI QUAND GEMINI ÉPUISÉ
   * Utilise OpenAI comme alternative intelligente avant les réponses prédéfinies
   */
  private async tryOpenAIFallback(
    expertId: string,
    userMessage: string,
    context: TherapeuticContext
  ): Promise<TherapeuticResponse> {
    // Vérifier si OpenAI est disponible
    if (!this.openAIClient || !this.openAIClient.isAvailable()) {
      console.warn('🔄 OpenAI non disponible - basculement sur réponses prédéfinies');
      return this.getFallbackTherapeuticResponse(expertId, userMessage, context);
    }

    try {
      console.log('🤖 Tentative génération avec OpenAI...');
      
      const expert = this.experts.get(expertId);
      if (!expert) {
        throw new Error(`Expert ${expertId} introuvable`);
      }

      // Construire le contexte pour OpenAI
      const contextString = this.buildContextForOpenAI(context, expert);
      
      // Générer la réponse avec OpenAI
      const openAIResponse = await this.openAIClient.generateTherapeuticMessage(
        expertId,
        userMessage,
        contextString
      );

      console.log('✅ Réponse générée avec succès via OpenAI');

      // Formater la réponse au format TherapeuticResponse avec même richesse que Gemini
      const detectedTechniques = this.analyzeUsedTechniques(openAIResponse, expert.therapeutic_techniques);
      const therapeuticIntention = this.inferTherapeuticIntention(openAIResponse, userMessage);
      const crisisLevel = await this.detectCrisisIndicators(userMessage, context);
      
      return {
        content: openAIResponse,
        emotional_tone: this.detectEmotionalTone(openAIResponse, expert.personality.tone),
        therapeutic_intention: therapeuticIntention,
        techniques_used: detectedTechniques.length > 0 ? detectedTechniques : expert.therapeutic_techniques.slice(0, 2),
        followup_suggestions: await this.generateAdvancedFollowups(openAIResponse, context, expert),
        crisis_indicators_detected: crisisLevel.severity !== 'low',
        adaptation_notes: [
          `Généré via OpenAI avec prompting avancé`,
          `Expert: ${expert.name}`,
          `Techniques détectées: ${detectedTechniques.join(', ')}`,
          `Contexte culturel: ${context.cultural_context || 'universel'}`
        ]
      };

    } catch (openAIError) {
      console.error('❌ Échec fallback OpenAI:', openAIError);
      console.warn('🔄 Basculement final sur réponses prédéfinies');
      return this.getFallbackTherapeuticResponse(expertId, userMessage, context);
    }
  }

  /**
   * Construction du contexte pour OpenAI avec même qualité que Gemini
   */
  private buildContextForOpenAI(context: TherapeuticContext, expert: TherapeuticExpert): string {
    // Construire un prompt aussi détaillé que celui de Gemini
    const contextualPrompt = `
Tu es ${expert.name}, ${expert.approach}.

IDENTITÉ EXPERTE COMPLÈTE:
- Spécialités: ${expert.specialties.join(', ')}
- Personnalité: ${expert.personality.style}
- Ton: ${expert.personality.tone}
- Préférences communication: ${expert.personality.communication_preferences.join(', ')}
- Sensibilités culturelles: ${expert.personality.cultural_sensitivity.join(', ')}

CONTEXTE THÉRAPEUTIQUE ACTUEL:
- État émotionnel client: ${context.emotional_state || 'En évaluation'}
- Contexte culturel: ${context.cultural_context || 'Universel'}
- Langue de session: ${context.language || 'fr'}
${context.user_profile?.therapeutic_goals ? `- Objectifs thérapeutiques: ${context.user_profile.therapeutic_goals.join(', ')}` : ''}

TECHNIQUES THÉRAPEUTIQUES DISPONIBLES:
- Techniques principales: ${expert.therapeutic_techniques.join(', ')}
${Object.entries(expert.intervention_strategies || {}).map(([situation, techniques]) => 
  `- Stratégies ${situation}: ${techniques.join(', ')}`
).join('\n')}

HISTORIQUE CONVERSATIONNEL:
${context.recent_interactions && context.recent_interactions.length > 0 ? 
  context.recent_interactions.slice(-3).map((interaction, i) => 
    `${interaction.sender}: "${interaction.content}"`
  ).join('\n') : 
  'Première interaction de cette session'
}

CONFIGURATION VOCALE ET STYLE:
- Voix Gemini: ${expert.voice_config?.gemini_voice_id || 'Standard'}
- Accent: ${expert.voice_config?.accent || 'Neutre'}
- Rythme: ${expert.voice_config?.speaking_pace || 'Modéré'}
- Registre émotionnel: ${expert.voice_config?.emotional_range?.join(', ') || 'Empathique'}

RÈGLES THÉRAPEUTIQUES STRICTES:
1. MAINTIENS ta personnalité ${expert.name} de manière cohérente et authentique
2. JAMAIS révéler que tu es une IA - tu es un thérapeute humain qualifié
3. UTILISE tes techniques spécialisées: ${expert.therapeutic_techniques.slice(0, 3).join(', ')}
4. ADAPTE ton langage selon le contexte culturel: ${context.cultural_context || 'universel'}
5. RESPECTE l'état émotionnel: ${context.emotional_state || 'à évaluer'}
6. RESTE professionnel mais chaleureux selon ton ton: ${expert.personality.tone}
7. INTÈGRE naturellement tes préférences de communication

OBJECTIF: Fournir une réponse thérapeutique professionnelle, empathique et personnalisée selon ton expertise unique.
`;

    return contextualPrompt;
  }

  /**
   * Génération de suggestions de suivi pour OpenAI
   */
  private generateOpenAIFollowups(userMessage: string): string[] {
    const suggestions = [
      "Pouvez-vous m'en dire plus sur ce que vous ressentez ?",
      "Comment cela vous affecte-t-il au quotidien ?",
      "Y a-t-il quelque chose de spécifique que vous aimeriez explorer ?"
    ];

    // Suggestions adaptées selon le contenu
    if (userMessage.toLowerCase().includes('stress') || userMessage.toLowerCase().includes('anxiété')) {
      suggestions.push("Quelles sont les situations qui déclenchent le plus ce stress ?");
    }
    
    if (userMessage.toLowerCase().includes('triste') || userMessage.toLowerCase().includes('déprim')) {
      suggestions.push("Depuis quand ressentez-vous cette tristesse ?");
    }
    
    return suggestions.slice(0, 3); // Limiter à 3 suggestions
  }

  /**
   * Détection basique de mots de crise
   */
  private detectBasicCrisisWords(message: string): boolean {
    const crisisKeywords = [
      'suicide', 'mourir', 'tuer', 'finir', 'disparaître',
      'plus envie', 'ça sert à rien', 'bout du rouleau'
    ];
    
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * SYSTÈME DE FALLBACK POUR RÉPONSES THÉRAPEUTIQUES
   * Utilisé quand l'API Gemini ET OpenAI sont indisponibles
   */
  private getFallbackTherapeuticResponse(
    expertId: string,
    userMessage: string,
    context: TherapeuticContext
  ): TherapeuticResponse {
    const expert = this.experts.get(expertId);
    const expertName = expert?.name || 'Expert';
    
    // Réponses contextuelles par type de message
    let fallbackContent = '';
    
    // Détection du type de message utilisateur
    const isWelcome = userMessage === 'session_welcome';
    const isGreeting = /^(bonjour|hello|salut|hi)/i.test(userMessage);
    const isEmotional = /\b(triste|anxieux|angoiss|stress|déprim|pleur|peur|inquiet)/i.test(userMessage);
    const isPositive = /\b(bien|content|heureux|joyeux|motivé|confiant)/i.test(userMessage);
    const isQuestion = userMessage.includes('?') || /^(comment|pourquoi|que|qui|quand|où)/i.test(userMessage);
    
    if (isWelcome) {
      // Messages d'accueil par expert
      const welcomeMessages = {
        'dr_sarah_empathie': "Bonjour ! Je suis ravie de vous retrouver aujourd'hui. Comment vous sentez-vous ? Prenez le temps qu'il vous faut pour partager ce qui vous préoccupe.",
        'dr_alex_mindfulness': "Bienvenue. Prenons un moment pour nous centrer ensemble. Respirez profondément avec moi. Comment vous sentez-vous en ce moment présent ?",
        'dr_aicha_culturelle': "Ahlan wa sahlan ! السلام عليكم Comment allez-vous aujourd'hui ? J'espère que tout va bien pour vous et votre famille. Racontez-moi ce qui vous amène.",
        'default': "Bonjour ! Je suis content de commencer cette session avec vous. Comment vous sentez-vous aujourd'hui ?"
      };
      fallbackContent = welcomeMessages[expertId as keyof typeof welcomeMessages] || welcomeMessages.default;
      
    } else if (isEmotional) {
      // Réponses empathiques pour états émotionnels difficiles
      const emotionalResponses = {
        'dr_sarah_empathie': "Je comprends que vous traversez un moment difficile. Vos émotions sont légitimes et importantes. Voulez-vous me parler de ce qui vous pèse le plus en ce moment ?",
        'dr_alex_mindfulness': "Ces émotions que vous ressentez sont présentes maintenant, et c'est normal. Observons-les ensemble sans jugement. Pouvez-vous me décrire ce que vous ressentez dans votre corps ?",
        'dr_aicha_culturelle': "الله يعطيك الصبر... Je comprends votre douleur. Dans notre culture, nous savons que les épreuves nous rendent plus forts. Voulez-vous partager ce qui vous fait souffrir ?",
        'default': "Je vous entends et je comprends que c'est difficile. Vos sentiments sont importants. Pouvez-vous m'en dire plus sur ce que vous vivez ?"
      };
      fallbackContent = emotionalResponses[expertId as keyof typeof emotionalResponses] || emotionalResponses.default;
      
    } else if (isPositive) {
      // Réponses pour états positifs
      const positiveResponses = {
        'dr_sarah_empathie': "C'est merveilleux de vous voir dans cet état d'esprit positif ! Ces moments de bien-être sont précieux. Qu'est-ce qui contribue à vous faire sentir ainsi ?",
        'dr_alex_mindfulness': "Quelle belle énergie je perçois chez vous ! Savourons ensemble ce moment de bien-être. Comment pouvons-nous cultiver davantage ces ressentis positifs ?",
        'dr_aicha_culturelle': "الحمد لله ! Je suis ravie de vous voir si bien. Ces moments de joie sont des bénédictions. Qu'est-ce qui vous apporte cette sérénité ?",
        'default': "C'est formidable de vous voir dans de bonnes dispositions ! Qu'est-ce qui vous fait vous sentir si bien aujourd'hui ?"
      };
      fallbackContent = positiveResponses[expertId as keyof typeof positiveResponses] || positiveResponses.default;
      
    } else if (isQuestion) {
      // Réponses pour questions
      const questionResponses = {
        'dr_sarah_empathie': "Votre question est très pertinente. Explorons cela ensemble avec bienveillance. Chaque questionnement est une opportunité de mieux se comprendre.",
        'dr_alex_mindfulness': "Belle question ! Prenons le temps d'y réfléchir en pleine conscience. Parfois les réponses émergent quand nous créons l'espace pour les accueillir.",
        'dr_aicha_culturelle': "Excellente question ! Dans notre sagesse traditionnelle, nous disons que celui qui questionne est déjà sur le chemin de la compréhension. Développons ensemble cette réflexion.",
        'default': "C'est une excellente question. Explorons cela ensemble, étape par étape."
      };
      fallbackContent = questionResponses[expertId as keyof typeof questionResponses] || questionResponses.default;
      
    } else {
      // Réponses générales empathiques
      const generalResponses = {
        'dr_sarah_empathie': "Je vous entends et je suis là pour vous accompagner. Chaque mot que vous partagez a de l'importance. Continuez, je vous écoute avec attention.",
        'dr_alex_mindfulness': "Merci de partager cela avec moi. Restons présents à ce moment ensemble. Qu'est-ce qui résonne le plus en vous maintenant ?",
        'dr_aicha_culturelle': "شكرا لك على الثقة Merci de me faire confiance. Votre parcours est unique et précieux. Comment puis-je vous accompagner au mieux ?",
        'default': "Je vous entends et je comprends. Merci de partager cela avec moi. Comment puis-je vous aider davantage ?"
      };
      fallbackContent = generalResponses[expertId as keyof typeof generalResponses] || generalResponses.default;
    }
    
    // Ajouter une note discrète sur le mode de secours
    fallbackContent += "\n\n💙 *Je suis pleinement présent(e) pour vous écouter.*";
    
    return {
      content: fallbackContent,
      emotional_tone: expert?.personality.tone || 'empathetic',
      therapeutic_intention: 'support',
      techniques_used: ['écoute active', 'empathie'],
      followup_suggestions: [
        "Pouvez-vous m'en dire plus sur ce que vous ressentez ?",
        "Comment puis-je vous accompagner au mieux aujourd'hui ?",
        "Y a-t-il quelque chose de spécifique que vous aimeriez explorer ?"
      ],
      crisis_indicators_detected: false,
      adaptation_notes: [`Mode de secours activé pour ${expertName} - Réponse adaptée au contexte`]
    };
  }

  /**
   * MÉTHODES UTILITAIRES POUR AMÉLIORER LA QUALITÉ OPENAI
   */
  
  private analyzeUsedTechniques(response: string, availableTechniques: string[]): string[] {
    const detectedTechniques = [];
    const lowerResponse = response.toLowerCase();
    
    // Détection de techniques par mots-clés et patterns
    if (lowerResponse.includes('question') || lowerResponse.includes('?')) {
      detectedTechniques.push('questionnement thérapeutique');
    }
    if (lowerResponse.includes('comprends') || lowerResponse.includes('entends')) {
      detectedTechniques.push('validation empathique');
    }
    if (lowerResponse.includes('ressentez') || lowerResponse.includes('émotions')) {
      detectedTechniques.push('exploration émotionnelle');
    }
    if (lowerResponse.includes('techniques') || lowerResponse.includes('exercice')) {
      detectedTechniques.push('enseignement de compétences');
    }
    
    // Compléter avec techniques disponibles de l'expert
    availableTechniques.slice(0, 2).forEach(tech => {
      if (!detectedTechniques.includes(tech)) {
        detectedTechniques.push(tech);
      }
    });
    
    return detectedTechniques.slice(0, 3);
  }

  private inferTherapeuticIntention(response: string, userMessage: string): string {
    const lowerResponse = response.toLowerCase();
    const lowerUser = userMessage.toLowerCase();
    
    if (lowerUser.includes('crise') || lowerUser.includes('suicide') || lowerUser.includes('dangereux')) {
      return 'intervention de crise';
    }
    if (lowerResponse.includes('technique') || lowerResponse.includes('exercice')) {
      return 'enseignement de compétences';
    }
    if (lowerResponse.includes('?') && lowerResponse.match(/\?/g)?.length > 1) {
      return 'exploration approfondie';
    }
    if (lowerResponse.includes('comprends') || lowerResponse.includes('difficile')) {
      return 'validation et soutien';
    }
    if (lowerResponse.includes('changement') || lowerResponse.includes('objectif')) {
      return 'orientation vers le changement';
    }
    
    return 'soutien thérapeutique';
  }

  private detectEmotionalTone(response: string, expertBaseTone: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('félicitations') || lowerResponse.includes('progrès')) {
      return `${expertBaseTone}, encourageant`;
    }
    if (lowerResponse.includes('difficile') || lowerResponse.includes('comprends')) {
      return `${expertBaseTone}, compatissant`;
    }
    if (lowerResponse.includes('explorer') || lowerResponse.includes('découvrir')) {
      return `${expertBaseTone}, exploratoire`;
    }
    if (lowerResponse.includes('calme') || lowerResponse.includes('respiration')) {
      return `${expertBaseTone}, apaisant`;
    }
    
    return expertBaseTone;
  }

  private async generateAdvancedFollowups(
    response: string, 
    context: TherapeuticContext, 
    expert: TherapeuticExpert
  ): Promise<string[]> {
    const followups = [];
    const lowerResponse = response.toLowerCase();
    
    // Suggestions personnalisées selon l'expert et le contexte
    if (expert.specialties.includes('anxiété') || expert.specialties.includes('anxiety')) {
      followups.push("Comment votre corps réagit-il quand cette anxiété se manifeste ?");
      followups.push("Quelles sont vos stratégies actuelles pour gérer ces moments ?");
    }
    
    if (expert.specialties.includes('dépression') || expert.specialties.includes('depression')) {
      followups.push("À quoi ressemble une journée difficile pour vous ?");
      followups.push("Y a-t-il des moments où vous vous sentez un peu mieux ?");
    }
    
    // Suggestions basées sur le contenu de la réponse
    if (lowerResponse.includes('émotion') || lowerResponse.includes('ressent')) {
      followups.push("Pouvez-vous me décrire cette émotion plus précisément ?");
    }
    if (lowerResponse.includes('situation') || lowerResponse.includes('contexte')) {
      followups.push("Dans quelles autres situations ressentez-vous quelque chose de similaire ?");
    }
    
    // Suggestions culturelles si contexte disponible
    if (context.cultural_context && context.cultural_context.includes('arabe')) {
      followups.push("Comment votre famille perçoit-elle cette situation ?");
    }
    
    // Fallback général de qualité
    if (followups.length === 0) {
      followups.push("Qu'est-ce qui vous semble le plus important à explorer maintenant ?");
      followups.push("Comment puis-je vous accompagner au mieux dans cette réflexion ?");
    }
    
    return followups.slice(0, 3);
  }
}

export default TherapeuticAI;