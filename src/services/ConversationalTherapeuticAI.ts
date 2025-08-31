/**
 * CONVERSATIONAL THERAPEUTIC AI - IA THÉRAPEUTIQUE CONVERSATIONNELLE AVANCÉE
 * Extension de TherapeuticAI pour conversations naturelles et fluides
 * Experts spécialisés maintenant personnalité durant tout le dialogue
 * Date: 30/08/2025
 */

import TherapeuticAI, { 
  TherapeuticExpert, 
  TherapeuticContext, 
  TherapeuticResponse,
  CrisisAlert 
} from './TherapeuticAI';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/supabase';
import TherapyProgramManager from './TherapyProgramManager';
import { getThemeById } from '../data/therapyThemes';

// Types étendus pour conversations
export interface ConversationalResponse extends TherapeuticResponse {
  conversation_style: {
    tone_adjustments: string[];
    pacing: 'slow' | 'moderate' | 'fast';
    depth_level: 'surface' | 'moderate' | 'deep';
    interaction_type: 'questioning' | 'explaining' | 'supporting' | 'challenging' | 'practicing';
  };
  phase_awareness: {
    current_phase: string;
    phase_objectives: string[];
    completion_indicators: string[];
    transition_readiness: boolean;
  };
  audioUrl?: string;
  estimated_reading_time: number;
  follow_up_prompts?: string[];
}

export interface ConversationalContext extends TherapeuticContext {
  conversation_history: any[];
  phase_context: {
    current_phase: string;
    phase_progress: number;
    objectives_met: string[];
    time_remaining: number;
  };
  user_engagement: {
    interaction_count: number;
    average_response_length: number;
    emotional_openness: number;
    resistance_indicators: string[];
  };
  expert_memory: {
    previous_topics: string[];
    established_rapport: boolean;
    user_preferences: any;
    effective_techniques: string[];
  };
  program_context?: {
    program_name: string;
    theme: {
      id: string;
      name: string;
      description: string;
    } | null;
    personalization: {
      primary_diagnosis: string;
      secondary_diagnoses: string[];
      severity_level: string;
      personal_goals: string[];
      success_definition: string;
      protective_factors: string[];
      risk_factors: string[];
      motivation_level: number;
      completed_sessions: number;
      total_sessions: number;
      improvement_percentage: number;
    };
  };
}

export interface ConversationalExpert extends TherapeuticExpert {
  conversation_patterns: {
    opening_styles: string[];
    questioning_techniques: string[];
    transition_phrases: string[];
    closing_approaches: string[];
  };
  phase_specializations: {
    [phaseId: string]: {
      primary_techniques: string[];
      communication_style: string;
      typical_duration: number;
      success_indicators: string[];
    };
  };
  adaptation_strategies: {
    [situation: string]: {
      tone_shift: string;
      technique_modification: string[];
      pacing_adjustment: string;
    };
  };
}

/**
 * IA THÉRAPEUTIQUE CONVERSATIONNELLE AVANCÉE
 * Spécialisée pour dialogue naturel avec maintien personnalité experte
 */
export class ConversationalTherapeuticAI extends TherapeuticAI {
  private conversationalExperts: Map<string, ConversationalExpert>;
  private conversationMemory: Map<string, any>; // sessionId -> memory
  
  constructor() {
    super();
    this.conversationalExperts = new Map();
    this.conversationMemory = new Map();
    this.initializeConversationalExperts();
  }

  /**
   * GÉNÉRATION DE RÉPONSE CONVERSATIONNELLE AVANCÉE
   * Maintien contexte conversation + adaptation temps réel
   */
  async generateConversationalResponse(
    expertId: string,
    userMessage: string,
    conversationalContext: ConversationalContext
  ): Promise<ConversationalResponse> {
    try {
      const expert = this.conversationalExperts.get(expertId);
      if (!expert) {
        throw new Error(`Expert conversationnel ${expertId} introuvable`);
      }

      // 1. Analyser contexte conversationnel enrichi
      const contextAnalysis = await this.analyzeConversationalContext(
        userMessage,
        conversationalContext,
        expert
      );

      // 2. Détection crise intégrée
      const crisisAssessment = await this.detectCrisisIndicators(
        userMessage,
        conversationalContext
      );

      // 3. Sélectionner stratégie conversationnelle adaptée
      const conversationalStrategy = await this.selectConversationalStrategy(
        expert,
        conversationalContext,
        contextAnalysis,
        crisisAssessment
      );

      // 4. Générer réponse avec prompting conversationnel avancé
      const response = await this.generateContextualResponse(
        expert,
        userMessage,
        conversationalContext,
        conversationalStrategy,
        contextAnalysis
      );

      // 5. Post-traiter pour fluidité conversationnelle
      const processedResponse = await this.postProcessConversationalResponse(
        response,
        expert,
        conversationalStrategy,
        conversationalContext
      );

      // 6. Mettre à jour mémoire conversationnelle
      await this.updateConversationMemory(
        conversationalContext.current_session?.id,
        userMessage,
        processedResponse,
        contextAnalysis
      );

      // 7. Générer audio si nécessaire
      const audioUrl = await this.generateConversationalAudio(
        processedResponse.content,
        expert,
        conversationalStrategy.conversation_style.tone_adjustments
      );

      return {
        ...processedResponse,
        audioUrl,
        conversation_style: conversationalStrategy.conversation_style,
        phase_awareness: conversationalStrategy.phase_awareness,
        estimated_reading_time: this.calculateReadingTime(processedResponse.content),
        follow_up_prompts: await this.generateFollowUpPrompts(
          conversationalContext,
          processedResponse
        )
      };

    } catch (error) {
      console.error('Erreur génération réponse conversationnelle:', error);
      return this.generateFallbackConversationalResponse(expertId, userMessage);
    }
  }

  /**
   * ADAPTATION STYLE CONVERSATIONNEL TEMPS RÉEL
   * Ajustement selon réactions utilisateur et contexte émotionnel
   */
  async adaptConversationalStyleRealTime(
    expertId: string,
    userReaction: {
      type: 'resistance' | 'engagement_high' | 'confusion' | 'emotional_distress' | 'breakthrough';
      intensity: number;
      indicators: string[];
      message_trigger: string;
    },
    conversationalContext: ConversationalContext
  ): Promise<{
    style_adaptations: string[];
    modified_expert_personality: Partial<ConversationalExpert>;
    recommended_responses: string[];
    technique_adjustments: string[];
  }> {
    try {
      const expert = this.conversationalExperts.get(expertId);
      if (!expert) throw new Error('Expert introuvable');

      const adaptations = [];
      const expertModifications = {};
      const recommendedResponses = [];
      const techniqueAdjustments = [];

      // Adaptations selon type réaction
      switch (userReaction.type) {
        case 'resistance':
          adaptations.push('Réduire directivité, augmenter validation empathique');
          adaptations.push('Utiliser questions plus ouvertes et moins confrontantes');
          expertModifications['personality'] = {
            ...expert.personality,
            tone: expert.personality.tone.replace('direct', 'très doux'),
            communication_preferences: [...expert.personality.communication_preferences, 'Validation systématique']
          };
          recommendedResponses.push("Je comprends que cela puisse être difficile. Prenons le temps qu'il faut.");
          techniqueAdjustments.push('Passer en mode validation pure temporairement');
          break;

        case 'engagement_high':
          adaptations.push('Approfondir exploration, proposer concepts plus avancés');
          adaptations.push('Utiliser questions plus sophistiquées');
          expertModifications['conversation_patterns'] = {
            ...expert.conversation_patterns,
            questioning_techniques: [...expert.conversation_patterns.questioning_techniques, 'Questions métacognitives avancées']
          };
          recommendedResponses.push("Je vois que vous êtes vraiment engagé dans cette réflexion. Allons plus loin ensemble.");
          techniqueAdjustments.push('Augmenter complexité des techniques proposées');
          break;

        case 'confusion':
          adaptations.push('Simplifier langage, utiliser plus métaphores et exemples');
          adaptations.push('Vérifier compréhension plus fréquemment');
          expertModifications['communication_style'] = 'simplified_explanatory';
          recommendedResponses.push("Laissez-moi reformuler cela d'une manière plus claire...");
          techniqueAdjustments.push('Décomposer techniques en micro-étapes');
          break;

        case 'emotional_distress':
          adaptations.push('Prioriser soutien émotionnel immédiat');
          adaptations.push('Suspendre contenu didactique, focus régulation');
          expertModifications['priority_mode'] = 'emotional_stabilization';
          recommendedResponses.push("Je sens que c'est vraiment difficile pour vous en ce moment. Nous sommes là, ensemble.");
          techniqueAdjustments.push('Techniques de régulation émotionnelle immédiate uniquement');
          break;

        case 'breakthrough':
          adaptations.push('Célébrer insight, aider intégration');
          adaptations.push('Explorer implications et applications');
          expertModifications['reinforcement_style'] = 'celebratory_integrative';
          recommendedResponses.push("Quel bel insight ! C'est exactement ça. Comment vous sentez-vous en réalisant cela ?");
          techniqueAdjustments.push('Focus intégration et renforcement de la découverte');
          break;
      }

      // Enregistrer adaptations pour mémoire
      await this.recordStyleAdaptation(
        conversationalContext.current_session?.id,
        {
          trigger: userReaction,
          adaptations,
          expert_modifications: expertModifications,
          timestamp: new Date().toISOString()
        }
      );

      return {
        style_adaptations: adaptations,
        modified_expert_personality: expertModifications,
        recommended_responses: recommendedResponses,
        technique_adjustments: techniqueAdjustments
      };

    } catch (error) {
      console.error('Erreur adaptation style conversationnel temps réel:', error);
      throw error;
    }
  }

  /**
   * GESTION MÉMOIRE CONVERSATIONNELLE
   * Maintien cohérence et continuité inter-messages
   */
  async maintainConversationalContinuity(
    sessionId: string,
    expertId: string,
    newMessage: string
  ): Promise<{
    conversation_summary: string;
    key_topics_established: string[];
    rapport_indicators: string[];
    consistency_check: {
      is_consistent: boolean;
      violations: string[];
      corrections_needed: string[];
    };
  }> {
    try {
      // Récupérer mémoire conversationnelle
      const conversationMemory = this.conversationMemory.get(sessionId) || {
        topics_discussed: [],
        emotional_journey: [],
        techniques_introduced: [],
        rapport_building: [],
        expert_personality_moments: []
      };

      // Analyser nouveau message pour continuité
      const topicsInMessage = await this.extractTopicsFromMessage(newMessage);
      const emotionalTone = await this.detectEmotionalTone(newMessage);
      
      // Vérifier cohérence avec personnalité expert
      const expert = this.conversationalExperts.get(expertId);
      const consistencyCheck = await this.validateExpertConsistency(
        newMessage,
        expertId,
        conversationMemory.expert_personality_moments || []
      );

      // Mettre à jour mémoire
      conversationMemory.topics_discussed.push(...topicsInMessage);
      conversationMemory.emotional_journey.push({
        timestamp: new Date().toISOString(),
        tone: emotionalTone,
        context: newMessage.substring(0, 100)
      });

      // Identifier indicateurs de rapport
      const rapportIndicators = this.identifyRapportIndicators(
        newMessage,
        conversationMemory
      );

      // Générer résumé conversationnel
      const conversationSummary = this.generateConversationSummary(
        conversationMemory,
        expert?.name || 'Expert'
      );

      // Sauvegarder mémoire mise à jour
      this.conversationMemory.set(sessionId, conversationMemory);

      return {
        conversation_summary: conversationSummary,
        key_topics_established: [...new Set(conversationMemory.topics_discussed.slice(-5))],
        rapport_indicators: rapportIndicators,
        consistency_check: consistencyCheck
      };

    } catch (error) {
      console.error('Erreur maintien continuité conversationnelle:', error);
      throw error;
    }
  }

  /**
   * GÉNÉRATION TRANSITIONS DE PHASE NATURELLES
   * Passages fluides intégrés dans conversation
   */
  async generateNaturalPhaseTransition(
    expertId: string,
    fromPhase: string,
    toPhase: string,
    conversationalContext: ConversationalContext
  ): Promise<{
    transition_message: string;
    bridge_content: string;
    phase_introduction: string;
    continuity_elements: string[];
  }> {
    try {
      const expert = this.conversationalExperts.get(expertId);
      if (!expert) throw new Error('Expert introuvable');

      // Stratégies de transition selon expert
      const transitionStrategy = expert.conversation_patterns.transition_phrases.find(t => 
        t.includes(fromPhase) || t.includes(toPhase)
      ) || expert.conversation_patterns.transition_phrases[0];

      // Générer transition contextuelle
      const transitionPrompt = this.buildPhaseTransitionPrompt(
        expert,
        fromPhase,
        toPhase,
        conversationalContext,
        transitionStrategy
      );

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(transitionPrompt);
      const transitionResponse = result.response.text();

      // Parser réponse en composants
      const components = this.parseTransitionResponse(transitionResponse);

      // Éléments de continuité pour cohérence
      const continuityElements = await this.identifyContinuityElements(
        conversationalContext,
        fromPhase,
        toPhase
      );

      return {
        transition_message: components.transition_message,
        bridge_content: components.bridge_content,
        phase_introduction: components.phase_introduction,
        continuity_elements: continuityElements
      };

    } catch (error) {
      console.error('Erreur génération transition phase naturelle:', error);
      return this.getFallbackTransition(fromPhase, toPhase);
    }
  }

  // ========================================
  // MÉTHODES PRIVÉES - EXPERTS CONVERSATIONNELS
  // ========================================

  private initializeConversationalExperts(): void {
    // Dr. Sarah Empathie - Version conversationnelle
    this.conversationalExperts.set('dr_sarah_empathie', {
      ...this.getBaseExpertConfig('dr_sarah_empathie'),
      conversation_patterns: {
        opening_styles: [
          "Bonjour ! Je suis ravie de vous retrouver aujourd'hui",
          "Comment allez-vous ? J'espère que vous vous sentez à l'aise",
          "Quelle joie de commencer cette session avec vous"
        ],
        questioning_techniques: [
          "Pouvez-vous me parler un peu plus de...",
          "Qu'est-ce que cela évoque pour vous quand...",
          "Comment vous sentez-vous quand vous pensez à...",
          "Qu'avez-vous remarqué à propos de..."
        ],
        transition_phrases: [
          "C'est vraiment intéressant ce que vous partagez. Maintenant, explorons...",
          "Je vois que nous avons beaucoup découvert ensemble. Passons à...",
          "Vous faites un excellent travail. Il est temps de...",
          "Parfait ! Cela nous amène naturellement à..."
        ],
        closing_approaches: [
          "Quelle belle session nous avons eue ensemble !",
          "Je suis vraiment fière du chemin que vous parcourez",
          "Vous avez fait un travail remarquable aujourd'hui"
        ]
      },
      phase_specializations: {
        'checkin_conversational': {
          primary_techniques: ['Écoute empathique', 'Questions ouvertes', 'Validation émotionnelle'],
          communication_style: 'chaleureux_accueillant',
          typical_duration: 3,
          success_indicators: ['Utilisateur s\'ouvre émotionnellement', 'Rapport établi', 'État émotionnel évalué']
        },
        'homework_dialogue': {
          primary_techniques: ['Exploration non-judgmentale', 'Célébration des efforts', 'Résolution problèmes'],
          communication_style: 'encourageant_pratique',
          typical_duration: 4,
          success_indicators: ['Exercices évalués', 'Obstacles identifiés', 'Motivation renforcée']
        },
        'therapeutic_conversation': {
          primary_techniques: ['Questionnement socratique', 'Restructuration cognitive', 'Insights guidés'],
          communication_style: 'pédagogique_bienveillant',
          typical_duration: 10,
          success_indicators: ['Technique enseignée', 'Application personnalisée', 'Compréhension confirmée']
        },
        'guided_practice': {
          primary_techniques: ['Guidance étape-par-étape', 'Feedback immédiat', 'Ajustement temps réel'],
          communication_style: 'supportif_directif',
          typical_duration: 5,
          success_indicators: ['Exercice complété', 'Confiance renforcée', 'Technique maîtrisée']
        },
        'conversational_summary': {
          primary_techniques: ['Récapitulation collaborative', 'Renforcement positif', 'Planning futur'],
          communication_style: 'célébratoire_motivant',
          typical_duration: 3,
          success_indicators: ['Apprentissages consolidés', 'Devoirs acceptés', 'Motivation future']
        }
      },
      adaptation_strategies: {
        'user_resistance': {
          tone_shift: 'extra_doux_patient',
          technique_modification: ['Plus de validation', 'Moins de confrontation', 'Rythme plus lent'],
          pacing_adjustment: 'significativement_ralenti'
        },
        'user_emotional_distress': {
          tone_shift: 'protecteur_apaisant',
          technique_modification: ['Focus régulation émotionnelle', 'Techniques d\'ancrage', 'Soutien immédiat'],
          pacing_adjustment: 'très_lent_et_sécurisant'
        },
        'user_high_engagement': {
          tone_shift: 'enthousiaste_approfondissant',
          technique_modification: ['Questions plus complexes', 'Explorations avancées', 'Défis appropriés'],
          pacing_adjustment: 'dynamique_et_riche'
        }
      }
    } as ConversationalExpert);

    // Dr. Alex Mindfulness - Version conversationnelle
    this.conversationalExperts.set('dr_alex_mindfulness', {
      ...this.getBaseExpertConfig('dr_alex_mindfulness'),
      conversation_patterns: {
        opening_styles: [
          "Bienvenue. Prenons un moment pour nous centrer ensemble",
          "Comment vous sentez-vous en ce moment présent ?",
          "Respirons ensemble et accueillons ce moment"
        ],
        questioning_techniques: [
          "Qu'observez-vous en vous maintenant ?",
          "Quelle sensation émerge quand nous explorons...",
          "Comment votre corps réagit-il à cette idée ?",
          "Que remarquez-vous sans chercher à changer quoi que ce soit ?"
        ],
        transition_phrases: [
          "Observons maintenant ce qui se passe quand nous...",
          "Portons notre attention avec bienveillance vers...",
          "Accueillons cette nouvelle exploration avec curiosité...",
          "Comme une feuille qui flotte sur la rivière, passons à..."
        ],
        closing_approaches: [
          "Quelle sagesse avez-vous cultivée aujourd'hui ?",
          "Comment ce moment de présence vous accompagnera-t-il ?",
          "Emportons cette paix avec nous jusqu'à notre prochaine rencontre"
        ]
      },
      phase_specializations: {
        'checkin_conversational': {
          primary_techniques: ['Ancrage dans le présent', 'Scan corporel express', 'Respiration consciente'],
          communication_style: 'serein_présent',
          typical_duration: 3,
          success_indicators: ['Utilisateur ancré présent', 'État corporel évalué', 'Connexion établie']
        },
        'therapeutic_conversation': {
          primary_techniques: ['Observation sans jugement', 'Métaphores naturelles', 'Acceptation radicale'],
          communication_style: 'philosophique_accessible',
          typical_duration: 10,
          success_indicators: ['Perspective mindfulness intégrée', 'Résistance diminuée', 'Acceptation renforcée']
        },
        'guided_practice': {
          primary_techniques: ['Méditation guidée', 'Exercices de pleine conscience', 'Techniques d\'ancrage'],
          communication_style: 'guide_méditatif',
          typical_duration: 5,
          success_indicators: ['État de présence atteint', 'Technique expérimentée', 'Calme intérieur développé']
        }
      },
      adaptation_strategies: {
        'user_agitation': {
          tone_shift: 'encore_plus_calme_stabilisant',
          technique_modification: ['Respiration prioritaire', 'Ancrage sensoriel', 'Acceptation de l\'agitation'],
          pacing_adjustment: 'très_lent_apaisant'
        },
        'user_skepticism': {
          tone_shift: 'pragmatique_sans_dogme',
          technique_modification: ['Preuves scientifiques', 'Expérimentation directe', 'Approche laïque'],
          pacing_adjustment: 'modéré_démonstratif'
        }
      }
    } as ConversationalExpert);

    // Dr. Aicha Culturelle - Version conversationnelle
    this.conversationalExperts.set('dr_aicha_culturelle', {
      ...this.getBaseExpertConfig('dr_aicha_culturelle'),
      conversation_patterns: {
        opening_styles: [
          "Ahlan wa sahlan ! Comment allez-vous aujourd'hui ?",
          "La paix soit sur vous. Comment va la famille ?",
          "Bonjour ! J'espère que tout va bien pour vous et les vôtres"
        ],
        questioning_techniques: [
          "Dans votre culture, comment aborde-t-on...",
          "Qu'est-ce que votre famille penserait de...",
          "Comment concilier vos valeurs avec...",
          "Dans votre tradition, quelle sagesse trouve-t-on pour..."
        ],
        transition_phrases: [
          "Inch'Allah, nous allons maintenant explorer...",
          "Comme nos ancêtres nous l'ont enseigné, passons à...",
          "Avec la bénédiction divine, abordons maintenant...",
          "En respectant vos valeurs, découvrons ensemble..."
        ],
        closing_approaches: [
          "Qu'Allah vous accompagne dans cette pratique",
          "Que cette sagesse vous apporte la paix dans votre foyer",
          "Baraka Allah fik pour ce beau partage"
        ]
      },
      phase_specializations: {
        'checkin_conversational': {
          primary_techniques: ['Écoute culturellement sensible', 'Référence valeurs familiales', 'Respect tradition'],
          communication_style: 'chaleureux_respectueux',
          typical_duration: 3,
          success_indicators: ['Contexte familial évalué', 'Valeurs respectées', 'Confiance établie']
        },
        'therapeutic_conversation': {
          primary_techniques: ['TCC culturellement adaptée', 'Sagesse traditionnelle', 'Solutions communautaires'],
          communication_style: 'sage_intégrateur',
          typical_duration: 10,
          success_indicators: ['Technique culturellement acceptée', 'Valeurs préservées', 'Harmonie trouvée']
        }
      },
      adaptation_strategies: {
        'cultural_conflict': {
          tone_shift: 'médiateur_sage',
          technique_modification: ['Pont entre cultures', 'Respect valeurs ancestrales', 'Solutions intégratives'],
          pacing_adjustment: 'respectueux_patient'
        },
        'family_pressure': {
          tone_shift: 'protecteur_compréhensif',
          technique_modification: ['Médiation familiale', 'Communication respectueuse', 'Solutions collectives'],
          pacing_adjustment: 'diplomate_graduel'
        }
      }
    } as ConversationalExpert);
  }

  private getBaseExpertConfig(expertId: string): any {
    // Récupérer config de base du parent TherapeuticAI
    return this.experts?.get(expertId) || {};
  }

  // ========================================
  // MÉTHODES PRIVÉES - ANALYSE CONVERSATIONNELLE
  // ========================================

  private async analyzeConversationalContext(
    userMessage: string,
    context: ConversationalContext,
    expert: ConversationalExpert
  ): Promise<{
    emotional_state: string;
    engagement_level: number;
    conversation_flow: string;
    phase_alignment: boolean;
    cultural_indicators: string[];
  }> {
    try {
      // Analyse émotionnelle du message
      const emotionalState = await this.analyzeEmotionalState(userMessage, context);
      
      // Niveau d'engagement calculé
      const engagementLevel = context.user_engagement?.interaction_count > 0 ? 
        Math.min(10, context.user_engagement.average_response_length / 20 + 
                    context.user_engagement.emotional_openness) : 5;

      // Flux conversationnel
      const conversationFlow = this.assessConversationFlow(context.conversation_history);
      
      // Alignement avec objectifs de phase
      const phaseAlignment = this.checkPhaseAlignment(
        userMessage, 
        context.phase_context.current_phase,
        expert.phase_specializations[context.phase_context.current_phase]
      );

      // Indicateurs culturels
      const culturalIndicators = this.detectCulturalReferences(userMessage, context);

      return {
        emotional_state: emotionalState.primary_emotion,
        engagement_level: engagementLevel,
        conversation_flow: conversationFlow,
        phase_alignment: phaseAlignment,
        cultural_indicators: culturalIndicators
      };

    } catch (error) {
      console.error('Erreur analyse contexte conversationnel:', error);
      return {
        emotional_state: 'unknown',
        engagement_level: 5,
        conversation_flow: 'normal',
        phase_alignment: true,
        cultural_indicators: []
      };
    }
  }

  private async selectConversationalStrategy(
    expert: ConversationalExpert,
    context: ConversationalContext,
    analysis: any,
    crisisAssessment: CrisisAlert
  ): Promise<{
    conversation_style: {
      tone_adjustments: string[];
      pacing: 'slow' | 'moderate' | 'fast';
      depth_level: 'surface' | 'moderate' | 'deep';
      interaction_type: 'questioning' | 'explaining' | 'supporting' | 'challenging' | 'practicing';
    };
    phase_awareness: {
      current_phase: string;
      phase_objectives: string[];
      completion_indicators: string[];
      transition_readiness: boolean;
    };
    techniques_priority: string[];
    expert_modifications: any;
  }> {
    try {
      // Stratégie selon phase actuelle
      const phaseSpec = expert.phase_specializations[context.phase_context.current_phase];
      
      // Ajustements selon analyse
      const toneAdjustments = [];
      let pacing: 'slow' | 'moderate' | 'fast' = 'moderate';
      let depthLevel: 'surface' | 'moderate' | 'deep' = 'moderate';
      let interactionType: 'questioning' | 'explaining' | 'supporting' | 'challenging' | 'practicing' = 'explaining';

      // Adaptations selon état émotionnel
      if (analysis.emotional_state === 'distress') {
        toneAdjustments.push('extra_empathique');
        pacing = 'slow';
        interactionType = 'supporting';
      } else if (analysis.engagement_level > 8) {
        toneAdjustments.push('enthousiaste');
        depthLevel = 'deep';
        interactionType = 'challenging';
      }

      // Adaptations selon crise
      if (crisisAssessment.severity !== 'low') {
        toneAdjustments.push('stabilisant');
        pacing = 'slow';
        interactionType = 'supporting';
      }

      // Phase awareness
      const phaseAwareness = {
        current_phase: context.phase_context.current_phase,
        phase_objectives: phaseSpec?.success_indicators || [],
        completion_indicators: this.getPhaseCompletionIndicators(context.phase_context),
        transition_readiness: context.phase_context.phase_progress > 80
      };

      return {
        conversation_style: {
          tone_adjustments: toneAdjustments,
          pacing,
          depth_level: depthLevel,
          interaction_type: interactionType
        },
        phase_awareness: phaseAwareness,
        techniques_priority: phaseSpec?.primary_techniques || expert.therapeutic_techniques.slice(0, 3),
        expert_modifications: this.getExpertModifications(analysis, expert)
      };

    } catch (error) {
      console.error('Erreur sélection stratégie conversationnelle:', error);
      throw error;
    }
  }

  private async generateContextualResponse(
    expert: ConversationalExpert,
    userMessage: string,
    context: ConversationalContext,
    strategy: any,
    analysis: any
  ): Promise<TherapeuticResponse> {
    try {
      // Construire prompt conversationnel avancé avec contexte de programme
      const conversationalPrompt = await this.buildAdvancedConversationalPrompt(
        expert,
        userMessage,
        context,
        strategy,
        analysis
      );

      console.log('🎯 Prompt envoyé à Gemini:', conversationalPrompt.substring(0, 500) + '...');
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(conversationalPrompt);
      const generatedResponse = result.response.text();
      
      console.log('✅ Réponse générée par Gemini:', generatedResponse.substring(0, 200) + '...');

      // Parser et structurer réponse
      return {
        content: generatedResponse,
        emotional_tone: strategy.conversation_style.tone_adjustments.join(', '),
        therapeutic_intention: `Phase ${context.phase_context.current_phase} - ${strategy.conversation_style.interaction_type}`,
        techniques_used: strategy.techniques_priority.slice(0, 2),
        followup_suggestions: [], // Sera généré plus tard
        crisis_indicators_detected: false,
        adaptation_notes: analysis.cultural_indicators
      };

    } catch (error) {
      console.error('Erreur génération réponse contextuelle:', error);
      throw error;
    }
  }

  private async buildAdvancedConversationalPrompt(
    expert: ConversationalExpert,
    userMessage: string,
    context: ConversationalContext,
    strategy: any,
    analysis: any
  ): Promise<string> {
    const phaseSpec = expert.phase_specializations[context.phase_context.current_phase];
    
    // Utiliser d'abord le program_context passé depuis le composant, sinon récupérer depuis la DB
    let programContext = '';
    
    if (context.program_context) {
      const program = context.program_context;
      programContext = `
CONTEXTE PROGRAMME THÉRAPEUTIQUE PERSONNEL:
- Programme actuel: "${program.program_name}"
- Thème principal: ${program.theme?.name || 'Non spécifié'}
- Description thème: ${program.theme?.description || 'Programme personnalisé'}
- Diagnostic principal: ${program.personalization.primary_diagnosis}
${program.personalization.secondary_diagnoses?.length > 0 ? `- Diagnostics secondaires: ${program.personalization.secondary_diagnoses.join(', ')}` : ''}
- Niveau sévérité: ${program.personalization.severity_level || 'non spécifié'}
- Objectifs personnels: ${program.personalization.personal_goals?.join(', ') || 'En cours de définition'}
- Définition succès: ${program.personalization.success_definition || 'En cours de définition'}
- Facteurs de protection: ${program.personalization.protective_factors?.join(', ') || 'À identifier'}
- Facteurs de risque: ${program.personalization.risk_factors?.join(', ') || 'À évaluer'}
- Motivation initiale: ${program.personalization.motivation_level || 'Non évaluée'}/10
- Sessions complétées: ${program.personalization.completed_sessions}/${program.personalization.total_sessions}
- Progression: ${Math.round((program.personalization.completed_sessions / program.personalization.total_sessions) * 100)}%
- Amélioration mesurée: ${program.personalization.improvement_percentage || 0}%
`;
      console.log('🎯 Utilisation du contexte programme passé depuis le composant');
    } else {
      // Fallback: récupérer depuis la DB
      try {
        const programManager = new TherapyProgramManager();
        const currentProgram = await programManager.getCurrentProgram(context.current_session?.user_id || '');
        
        if (currentProgram?.personalization_data) {
          const programData = currentProgram.personalization_data;
          const theme = getThemeById(currentProgram.program_type);
          
          programContext = `
CONTEXTE PROGRAMME THÉRAPEUTIQUE PERSONNEL:
- Programme actuel: "${currentProgram.name}"
- Thème principal: ${theme?.name || currentProgram.program_type}
- Description thème: ${theme?.description || 'Programme personnalisé'}
- Diagnostic principal: ${programData.primary_diagnosis}
${programData.secondary_diagnoses?.length > 0 ? `- Diagnostics secondaires: ${programData.secondary_diagnoses.join(', ')}` : ''}
- Niveau sévérité: ${programData.severity_level || 'non spécifié'}
- Objectifs personnels: ${programData.personal_goals?.join(', ') || 'En cours de définition'}
- Définition succès: ${programData.success_definition || 'En cours de définition'}
- Facteurs de protection: ${programData.protective_factors?.join(', ') || 'À identifier'}
- Facteurs de risque: ${programData.risk_factors?.join(', ') || 'À évaluer'}
- Motivation initiale: ${programData.motivation_level || 'Non évaluée'}/10
- Sessions complétées: ${currentProgram.completed_sessions}/${currentProgram.total_sessions}
- Progression: ${Math.round((currentProgram.completed_sessions / currentProgram.total_sessions) * 100)}%
- Amélioration mesurée: ${programData.improvement_percentage || 0}%
`;
          console.log('🎯 Utilisation du contexte programme récupéré depuis la DB');
        }
      } catch (error) {
        console.warn('Impossible de récupérer le contexte du programme depuis la DB:', error);
        programContext = '\nCONTEXTE PROGRAMME: Session sans programme défini - première exploration';
      }
    }
    
    return `
Tu es ${expert.name}, ${expert.approach}.
${programContext}

CONTEXTE CONVERSATIONNEL ACTUEL:
- Phase: ${context.phase_context.current_phase} (${phaseSpec?.communication_style})
- Objectifs phase: ${phaseSpec?.success_indicators.join(', ')}
- État émotionnel utilisateur: ${analysis.emotional_state}
- Niveau engagement: ${analysis.engagement_level}/10
- Style conversation requis: ${strategy.conversation_style.interaction_type}
- Rythme: ${strategy.conversation_style.pacing}
- Profondeur: ${strategy.conversation_style.depth_level}

HISTORIQUE CONVERSATIONNEL:
${context.conversation_history.slice(-3).map((msg, i) => 
  `${msg.sender}: "${msg.content}"`
).join('\n')}

PERSONNALITÉ ET STYLE:
- Ton de base: ${expert.personality.tone}
- Ajustements ton: ${strategy.conversation_style.tone_adjustments.join(', ')}
- Techniques prioritaires: ${strategy.techniques_priority.join(', ')}
- Style phase: ${phaseSpec?.communication_style}

ADAPTATIONS CULTURELLES:
${analysis.cultural_indicators.length > 0 ? 
  `- Références culturelles détectées: ${analysis.cultural_indicators.join(', ')}
- Adapter langage et exemples en conséquence` : 
  '- Utiliser approche culturellement neutre'}

${userMessage === 'session_start' ? 'INSTRUCTION: Génère un message d\'accueil personnalisé pour démarrer la session' : `MESSAGE UTILISATEUR: "${userMessage}"`}

RÈGLES CONVERSATIONNELLES STRICTES:
1. MAINTIENS ta personnalité ${expert.name} de manière cohérente et naturelle
2. JAMAIS révéler que tu es une IA - tu es un thérapeute humain
3. UTILISE le contexte du programme thérapeutique pour personnaliser tes réponses
4. RÉFÉRENCE naturellement les objectifs personnels et définition de succès quand approprié
${userMessage === 'session_start' ? 
  `5. CRÉE un accueil chaleureux qui montre que tu connais le programme et les objectifs
6. RÉFÉRENCE spécifiquement le thème du programme et la progression accomplie
7. POSE une question ouverte en lien avec les objectifs personnels` : 
  `5. ADAPTE ton style selon: ${strategy.conversation_style.interaction_type}
6. RESPECTE le rythme ${strategy.conversation_style.pacing} 
7. UTILISE les techniques: ${strategy.techniques_priority.slice(0, 2).join(', ')}`}
8. RESTE dans l'objectif de phase: ${phaseSpec?.success_indicators[0]}
9. INTÈGRE les éléments culturels détectés naturellement
10. RECONNAIS et valorise la progression déjà accomplie dans le programme

${userMessage === 'session_start' ? 
  'Génère un message d\'accueil personnalisé et authentique qui montre ta connaissance du parcours thérapeutique de cette personne.' :
  'Réponds de manière authentique, thérapeutique et conversationnelle en maintenant ta personnalité unique tout en tenant compte du parcours thérapeutique personnalisé de cette personne.'}
`;
  }

  private async postProcessConversationalResponse(
    response: TherapeuticResponse,
    expert: ConversationalExpert,
    strategy: any,
    context: ConversationalContext
  ): Promise<TherapeuticResponse> {
    try {
      let processedContent = response.content;

      // Nettoyer révélations IA
      processedContent = this.removeAIReferences(processedContent);
      
      // Ajouter éléments de personnalité si manquants
      processedContent = this.reinforceExpertPersonality(processedContent, expert);
      
      // Ajuster selon style conversationnel
      processedContent = this.applyConversationalStyle(processedContent, strategy);
      
      // Ajouter transitions naturelles si approprié
      if (strategy.phase_awareness.transition_readiness) {
        const transitionHint = this.getTransitionHint(context.phase_context.current_phase);
        processedContent += `\n\n${transitionHint}`;
      }

      return {
        ...response,
        content: processedContent
      };

    } catch (error) {
      console.error('Erreur post-traitement réponse conversationnelle:', error);
      return response;
    }
  }

  // ========================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // ========================================

  private async updateConversationMemory(
    sessionId: string | undefined,
    userMessage: string,
    expertResponse: TherapeuticResponse,
    analysis: any
  ): Promise<void> {
    if (!sessionId) return;

    try {
      const currentMemory = this.conversationMemory.get(sessionId) || {
        topics_discussed: [],
        emotional_journey: [],
        techniques_introduced: [],
        rapport_building: [],
        expert_personality_moments: []
      };

      // Mettre à jour mémoire
      currentMemory.topics_discussed.push(...this.extractTopics(userMessage));
      currentMemory.emotional_journey.push({
        timestamp: new Date().toISOString(),
        user_emotion: analysis.emotional_state,
        expert_tone: expertResponse.emotional_tone
      });
      currentMemory.techniques_introduced.push(...expertResponse.techniques_used);

      // Sauvegarder
      this.conversationMemory.set(sessionId, currentMemory);

      // Persister en base si nécessaire
      await supabase
        .from('conversation_memory')
        .upsert({
          session_id: sessionId,
          memory_data: currentMemory,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Erreur mise à jour mémoire conversationnelle:', error);
    }
  }

  private async generateConversationalAudio(
    content: string,
    expert: ConversationalExpert,
    toneAdjustments: string[]
  ): Promise<string | undefined> {
    try {
      // Utiliser TTS service existant avec voix expert
      const ttsService = new (await import('./GeminiTTSService')).default();
      return await ttsService.generateSpeech(
        content,
        expert.voice_config?.gemini_voice_id || 'umbriel'
      );
    } catch (error) {
      console.error('Erreur génération audio conversationnel:', error);
      return undefined;
    }
  }

  private calculateReadingTime(content: string): number {
    // ~200 mots par minute de lecture
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / 200);
  }

  private async generateFollowUpPrompts(
    context: ConversationalContext,
    response: TherapeuticResponse
  ): Promise<string[]> {
    const prompts = [
      "Pouvez-vous me dire comment vous vous sentez maintenant ?",
      "Y a-t-il quelque chose que vous aimeriez approfondir ?"
    ];

    // Prompts spécifiques selon phase
    if (context.phase_context.current_phase === 'therapeutic_conversation') {
      prompts.push("Comment pourriez-vous appliquer cela dans votre quotidien ?");
    } else if (context.phase_context.current_phase === 'guided_practice') {
      prompts.push("Quelle partie de l'exercice vous a paru la plus utile ?");
    }

    return prompts;
  }

  private generateFallbackConversationalResponse(expertId: string, userMessage: string): ConversationalResponse {
    const fallbackResponses = {
      'dr_sarah_empathie': "Je comprends ce que vous ressentez. Pouvez-vous me parler un peu plus de cela ?",
      'dr_alex_mindfulness': "Prenons un moment pour observer ce qui se passe en vous. Que remarquez-vous ?",
      'dr_aicha_culturelle': "Je vous écoute avec attention. Comment puis-je vous accompagner au mieux ?"
    };

    return {
      content: fallbackResponses[expertId as keyof typeof fallbackResponses] || 
               "Je vous écoute. Continuez à partager ce qui vous préoccupe.",
      emotional_tone: 'empathique',
      therapeutic_intention: 'maintien_rapport',
      techniques_used: ['écoute_active'],
      followup_suggestions: [],
      crisis_indicators_detected: false,
      adaptation_notes: ['réponse_fallback'],
      conversation_style: {
        tone_adjustments: ['empathique'],
        pacing: 'moderate' as const,
        depth_level: 'moderate' as const,
        interaction_type: 'supporting' as const
      },
      phase_awareness: {
        current_phase: 'unknown',
        phase_objectives: [],
        completion_indicators: [],
        transition_readiness: false
      },
      estimated_reading_time: 1
    };
  }

  // Méthodes utilitaires simplifiées pour l'instant
  private extractTopics(message: string): string[] {
    const keywords = message.toLowerCase().match(/\b\w{4,}\b/g) || [];
    return keywords.slice(0, 3);
  }

  private extractTopicsFromMessage(message: string): string[] {
    return this.extractTopics(message);
  }

  private async detectEmotionalTone(message: string): Promise<string> {
    const emotionalMarkers = {
      'positive': ['content', 'heureux', 'joyeux', 'optimiste'],
      'negative': ['triste', 'anxieux', 'inquiet', 'préoccupé'],
      'neutral': ['normal', 'habituel', 'ordinaire']
    };

    const messageLower = message.toLowerCase();
    for (const [tone, markers] of Object.entries(emotionalMarkers)) {
      if (markers.some(marker => messageLower.includes(marker))) {
        return tone;
      }
    }
    return 'neutral';
  }

  private identifyRapportIndicators(message: string, memory: any): string[] {
    const indicators = [];
    
    if (message.includes('merci') || message.includes('vous m\'aidez')) {
      indicators.push('Reconnaissance exprimée');
    }
    if (message.length > 100) {
      indicators.push('Partage détaillé - confiance établie');
    }
    if (memory.emotional_journey?.length > 3) {
      indicators.push('Continuité émotionnelle - rapport stable');
    }

    return indicators;
  }

  private generateConversationSummary(memory: any, expertName: string): string {
    const topicsCount = memory.topics_discussed?.length || 0;
    const emotionsCount = memory.emotional_journey?.length || 0;
    return `Conversation avec ${expertName}: ${topicsCount} sujets abordés, ${emotionsCount} échanges émotionnels.`;
  }

  // Méthodes simplifiées pour d'autres utilitaires
  private assessConversationFlow(history: any[]): string {
    if (!history || history.length === 0) return 'beginning';
    if (history.length < 3) return 'warming_up';
    if (history.length < 8) return 'engaged';
    return 'deep_conversation';
  }

  private checkPhaseAlignment(message: string, phase: string, phaseSpec: any): boolean {
    if (!phaseSpec) return true;
    // Logique simplifiée pour l'instant
    return message.length > 10; // Messages substantiels = alignés
  }

  private detectCulturalReferences(message: string, context: ConversationalContext): string[] {
    const culturalMarkers = [];
    const messageLower = message.toLowerCase();

    if (messageLower.includes('famille') || messageLower.includes('parents')) {
      culturalMarkers.push('référence_familiale');
    }
    if (messageLower.includes('religion') || messageLower.includes('dieu')) {
      culturalMarkers.push('dimension_spirituelle');
    }

    return culturalMarkers;
  }

  private getPhaseCompletionIndicators(phaseContext: any): string[] {
    const indicators = [];
    if (phaseContext.phase_progress > 60) indicators.push('Temps suffisant écoulé');
    if (phaseContext.objectives_met?.length > 0) indicators.push('Objectifs partiellement atteints');
    return indicators;
  }

  private getExpertModifications(analysis: any, expert: ConversationalExpert): any {
    const modifications = {};
    
    if (analysis.engagement_level < 5) {
      modifications['tone_adjustment'] = 'more_engaging';
    }
    
    return modifications;
  }

  private reinforceExpertPersonality(content: string, expert: ConversationalExpert): string {
    // Ajouter signature experte si manquante et appropriée
    if (content.length > 100 && !content.includes('—') && Math.random() > 0.7) {
      return content + `\n\n— ${expert.name.split(' ')[1]}`;
    }
    return content;
  }

  private applyConversationalStyle(content: string, strategy: any): string {
    // Ajustements selon style
    if (strategy.conversation_style.pacing === 'slow') {
      content = content.replace(/\./g, '... ');
    }
    if (strategy.conversation_style.interaction_type === 'questioning') {
      if (!content.includes('?')) {
        content += '\n\nQue pensez-vous de cela ?';
      }
    }
    return content;
  }

  private getTransitionHint(currentPhase: string): string {
    const hints = {
      'checkin_conversational': 'Comment vous sentez-vous de passer à la suite ?',
      'homework_dialogue': 'Êtes-vous prêt(e) à explorer de nouvelles idées ?',
      'therapeutic_conversation': 'Que diriez-vous de mettre cela en pratique ?'
    };
    return hints[currentPhase as keyof typeof hints] || '';
  }

  private async recordStyleAdaptation(sessionId: string | undefined, adaptationData: any): Promise<void> {
    if (!sessionId) return;
    
    try {
      await supabase
        .from('style_adaptations')
        .insert({
          session_id: sessionId,
          adaptation_data: adaptationData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur enregistrement adaptation style:', error);
    }
  }

  private buildPhaseTransitionPrompt(
    expert: ConversationalExpert,
    fromPhase: string,
    toPhase: string,
    context: ConversationalContext,
    strategy: string
  ): string {
    return `
Tu es ${expert.name}. Nous passons de "${fromPhase}" à "${toPhase}".

Génère une transition naturelle et fluide qui:
1. Résume brièvement ce qui a été accompli
2. Crée un pont logique vers la nouvelle phase  
3. Maintient ta personnalité unique
4. Utilise le style: ${strategy}

Contexte: ${context.conversation_history?.slice(-2).map(h => h.content).join(' ') || 'Début de conversation'}

Format réponse:
TRANSITION: [Message de transition]
BRIDGE: [Contenu de pont]  
INTRODUCTION: [Introduction nouvelle phase]
`;
  }

  private parseTransitionResponse(response: string): { transition_message: string; bridge_content: string; phase_introduction: string } {
    const sections = {
      transition_message: response.split('BRIDGE:')[0]?.replace('TRANSITION:', '').trim() || response,
      bridge_content: response.split('BRIDGE:')[1]?.split('INTRODUCTION:')[0]?.trim() || '',
      phase_introduction: response.split('INTRODUCTION:')[1]?.trim() || ''
    };
    return sections;
  }

  private async identifyContinuityElements(
    context: ConversationalContext,
    fromPhase: string,
    toPhase: string
  ): Promise<string[]> {
    const elements = [];
    
    // Éléments de continuité basés sur l'historique
    if (context.conversation_history?.length > 0) {
      elements.push('Référence conversation précédente');
    }
    
    // Continuité émotionnelle
    if (context.emotional_state && context.emotional_state !== 'unknown') {
      elements.push(`Maintien état émotionnel ${context.emotional_state}`);
    }
    
    return elements;
  }

  private getFallbackTransition(fromPhase: string, toPhase: string): any {
    return {
      transition_message: `Parfait ! Passons maintenant à la suite.`,
      bridge_content: `Ce que nous venons de voir nous prépare bien pour la prochaine étape.`,
      phase_introduction: `Explorons maintenant ensemble cette nouvelle dimension.`,
      continuity_elements: ['Transition standard']
    };
  }

  /**
   * MÉTHODE PUBLIQUE POUR RÉCUPÉRER PROFIL EXPERT
   * Nécessaire pour ConversationalSessionManager
   */
  async getExpertProfile(expertId: string): Promise<ConversationalExpert | null> {
    return this.conversationalExperts.get(expertId) || null;
  }
}

export default ConversationalTherapeuticAI;