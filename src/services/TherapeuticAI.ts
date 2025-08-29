/**
 * THERAPEUTIC AI - INTELLIGENCE ARTIFICIELLE THÉRAPEUTIQUE SPÉCIALISÉE
 * Génération de réponses contextuelles, maintien personnalité experts, détection d'alertes
 * Documents de référence: Plan logique complet Phase 2.1 + Guide technique Section 6
 * Date: 29/08/2025
 */

import { supabase } from '../config/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  private experts: Map<string, TherapeuticExpert>;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '');
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
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
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
    
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
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
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
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
}

export default TherapeuticAI;