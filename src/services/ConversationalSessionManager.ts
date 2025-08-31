/**
 * CONVERSATIONAL SESSION MANAGER - ORCHESTRATION SESSIONS CONVERSATIONNELLES
 * Gestion des sessions 25 minutes avec dialogue thérapeutique naturel fluide
 * Extension du SessionManager original avec capacités conversationnelles
 * Date: 30/08/2025
 */

import SessionManager, { TherapySession, SessionContext } from './SessionManager';
import { supabase } from '../config/supabase';
import ConversationalTherapeuticAI from './ConversationalTherapeuticAI';

// Types pour sessions conversationnelles
export interface ConversationalPhase {
  id: string;
  name: string;
  displayName: string;
  duration: number; // en minutes
  conversationalGoals: string[];
  minInteractions: number;
  maxInteractions?: number;
  transitionTriggers: string[];
  expertPrompts: {
    opening: string;
    progression: string[];
    transition: string;
  };
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'expert';
  content: string;
  timestamp: Date;
  hasAudio?: boolean;
  audioUrl?: string;
  emotion?: string;
  phase_id: string;
  therapeutic_techniques_used?: string[];
  crisis_indicators?: string[];
}

export interface ConversationalSessionState {
  id: string;
  therapy_program_id: string;
  user_id: string;
  current_phase: ConversationalPhase;
  phase_start_time: Date;
  session_start_time: Date;
  conversation_history: ConversationMessage[];
  expert_profile: any;
  phase_objectives_met: boolean;
  total_user_interactions: number;
  wellbeing_score?: number;
  crisis_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  adaptations_made: string[];
  is_active: boolean;
  session_metadata: {
    user_engagement_level: number;
    emotional_progression: string[];
    techniques_taught: string[];
    breakthroughs_achieved: string[];
  };
}

export interface ConversationalSessionResult {
  session: TherapySession;
  context: SessionContext & {
    expert_personality: any;
    conversation_style: any;
    cultural_adaptations: string[];
  };
  initial_phase: ConversationalPhase;
  welcome_message?: string;
}

/**
 * GESTIONNAIRE DE SESSIONS THÉRAPEUTIQUES CONVERSATIONNELLES
 * Architecture conversationnelle naturelle avec IA experte
 */
export class ConversationalSessionManager extends SessionManager {
  private conversationalAI: ConversationalTherapeuticAI;
  private conversationalPhases: Map<string, ConversationalPhase>;

  constructor() {
    super();
    this.conversationalAI = new ConversationalTherapeuticAI();
    this.conversationalPhases = new Map();
    this.initializeConversationalPhases();
  }

  /**
   * DÉMARRAGE SESSION CONVERSATIONNELLE
   * Initialisation complète avec expert et contexte personnalisé
   */
  async startConversationalSession(
    sessionId: string, 
    userId: string
  ): Promise<ConversationalSessionResult | null> {
    try {
      // 1. Initialiser session de base
      const baseSession = await this.startSession(sessionId, userId);
      if (!baseSession) {
        throw new Error('Impossible d\'initialiser session de base');
      }

      // 2. Enrichir avec contexte conversationnel
      const conversationalContext = await this.buildConversationalContext(
        baseSession.session,
        baseSession.context
      );

      // 3. Sélectionner phase initiale
      const initialPhase = this.getPhaseById('checkin_conversational');
      if (!initialPhase) {
        throw new Error('Phase initiale conversationnelle introuvable');
      }

      // 4. Initialiser état session conversationnel
      await this.initializeConversationalState(
        sessionId,
        initialPhase,
        conversationalContext.expert_personality
      );

      // 5. Générer message d'accueil personnalisé
      const welcomeMessage = await this.generatePersonalizedWelcome(
        conversationalContext.expert_personality,
        conversationalContext,
        baseSession.session
      );

      return {
        session: baseSession.session,
        context: conversationalContext,
        initial_phase: initialPhase,
        welcome_message: welcomeMessage
      };

    } catch (error) {
      console.error('Erreur démarrage session conversationnelle:', error);
      throw new Error('Impossible de démarrer la session conversationnelle');
    }
  }

  /**
   * TRAITEMENT MESSAGE CONVERSATIONNEL
   * Analyse, génération réponse experte, gestion transitions
   */
  async processConversationalMessage(
    sessionId: string,
    userMessage: string,
    context: {
      currentPhase: ConversationalPhase;
      conversationHistory: ConversationMessage[];
      expertProfile: any;
      sessionMetadata: any;
    }
  ): Promise<{
    expertResponse: {
      content: string;
      audioUrl?: string;
      emotion: string;
      techniques_used: string[];
    };
    phaseUpdate: {
      objectives_met: boolean;
      should_transition: boolean;
      next_phase?: ConversationalPhase;
      transition_message?: string;
    };
    sessionUpdate: {
      engagement_level: number;
      crisis_detected: boolean;
      adaptations_needed: string[];
    };
  }> {
    try {
      // 1. Enregistrer message utilisateur
      await this.recordConversationMessage({
        session_id: sessionId,
        sender: 'user',
        content: userMessage,
        phase_id: context.currentPhase.id
      });

      // 2. Analyser message pour indicateurs de crise
      const crisisAssessment = await this.conversationalAI.detectCrisisIndicators(
        userMessage,
        this.buildTherapeuticContext(context)
      );

      // 3. Générer réponse experte contextuelle
      const expertResponse = await this.conversationalAI.generateTherapeuticResponse(
        context.expertProfile.id,
        userMessage,
        this.buildTherapeuticContext(context)
      );

      // 4. Enregistrer réponse experte
      await this.recordConversationMessage({
        session_id: sessionId,
        sender: 'expert',
        content: expertResponse.content,
        phase_id: context.currentPhase.id,
        therapeutic_techniques_used: expertResponse.techniques_used,
        crisis_indicators: crisisAssessment.severity !== 'low' ? crisisAssessment.indicators : undefined
      });

      // 5. Évaluer progression de phase
      const phaseProgression = await this.evaluatePhaseProgression(
        context.currentPhase,
        context.conversationHistory.length + 2, // +2 pour les nouveaux messages
        sessionId
      );

      // 6. Déterminer si transition nécessaire
      const shouldTransition = phaseProgression.objectives_met && 
                              context.conversationHistory.filter(m => m.sender === 'user').length >= context.currentPhase.minInteractions;

      let nextPhase;
      let transitionMessage;
      
      if (shouldTransition) {
        nextPhase = this.getNextPhase(context.currentPhase);
        if (nextPhase) {
          transitionMessage = await this.generatePhaseTransitionMessage(
            context.currentPhase,
            nextPhase,
            context.expertProfile
          );
        }
      }

      // 7. Calculer niveau d'engagement
      const engagementLevel = this.calculateEngagementLevel(
        context.conversationHistory,
        userMessage
      );

      // 8. Mettre à jour métadonnées session
      await this.updateSessionMetadata(sessionId, {
        last_user_message: userMessage,
        last_expert_response: expertResponse.content,
        engagement_level: engagementLevel,
        crisis_level: crisisAssessment.severity,
        phase_progression: phaseProgression
      });

      return {
        expertResponse: {
          content: expertResponse.content,
          audioUrl: expertResponse.audioUrl,
          emotion: expertResponse.emotional_tone,
          techniques_used: expertResponse.techniques_used
        },
        phaseUpdate: {
          objectives_met: phaseProgression.objectives_met,
          should_transition: shouldTransition,
          next_phase: nextPhase,
          transition_message: transitionMessage
        },
        sessionUpdate: {
          engagement_level: engagementLevel,
          crisis_detected: crisisAssessment.severity !== 'low',
          adaptations_needed: expertResponse.adaptation_notes
        }
      };

    } catch (error) {
      console.error('Erreur traitement message conversationnel:', error);
      throw new Error('Impossible de traiter le message conversationnel');
    }
  }

  /**
   * TRANSITION DE PHASE CONVERSATIONNELLE
   * Passage fluide entre phases avec continuité experte
   */
  async executePhaseTransition(
    sessionId: string,
    currentPhase: ConversationalPhase,
    nextPhase: ConversationalPhase,
    expertProfile: any
  ): Promise<{
    success: boolean;
    transition_message: string;
    phase_objectives_summary: string;
    next_phase_introduction: string;
  }> {
    try {
      // 1. Générer résumé phase actuelle
      const phaseObjectivesSummary = await this.generatePhaseObjectivesSummary(
        sessionId,
        currentPhase
      );

      // 2. Générer message de transition naturel
      const transitionMessage = await this.generatePhaseTransitionMessage(
        currentPhase,
        nextPhase,
        expertProfile
      );

      // 3. Préparer introduction phase suivante
      const nextPhaseIntroduction = await this.generateNextPhaseIntroduction(
        nextPhase,
        expertProfile,
        phaseObjectivesSummary
      );

      // 4. Mettre à jour état session
      await supabase
        .from('conversational_sessions')
        .update({
          current_phase_id: nextPhase.id,
          phase_start_time: new Date().toISOString(),
          phase_transitions: supabase.rpc('append_to_array', {
            array_field: 'phase_transitions',
            new_element: {
              from_phase: currentPhase.id,
              to_phase: nextPhase.id,
              transition_time: new Date().toISOString(),
              objectives_met: true
            }
          }),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      // 5. Enregistrer message de transition
      await this.recordConversationMessage({
        session_id: sessionId,
        sender: 'expert',
        content: `${transitionMessage}\n\n${nextPhaseIntroduction}`,
        phase_id: nextPhase.id,
        message_type: 'phase_transition'
      });

      return {
        success: true,
        transition_message: transitionMessage,
        phase_objectives_summary: phaseObjectivesSummary,
        next_phase_introduction: nextPhaseIntroduction
      };

    } catch (error) {
      console.error('Erreur transition phase conversationnelle:', error);
      throw new Error('Impossible d\'exécuter la transition de phase');
    }
  }

  /**
   * ADAPTATION TEMPS RÉEL DU STYLE CONVERSATIONNEL
   * Ajustement selon réactions utilisateur et contexte émotionnel
   */
  async adaptConversationalStyle(
    sessionId: string,
    userReaction: {
      type: 'resistance' | 'engagement_high' | 'confusion' | 'emotional_distress' | 'breakthrough';
      intensity: number; // 1-10
      indicators: string[];
    },
    expertProfile: any,
    currentPhase: ConversationalPhase
  ): Promise<{
    style_adaptations: string[];
    adapted_prompts: string[];
    expert_personality_adjustments: any;
    phase_modifications?: Partial<ConversationalPhase>;
  }> {
    try {
      const adaptations = [];
      const adaptedPrompts = [];
      let expertAdjustments = { ...expertProfile };
      let phaseModifications = {};

      // Adaptations selon type de réaction
      switch (userReaction.type) {
        case 'resistance':
          adaptations.push('Approche plus graduelle et non-confrontante');
          adaptations.push('Questions plus ouvertes et moins directes');
          expertAdjustments.communication_style = 'extra_gentle';
          adaptedPrompts.push('Utiliser validation empathique avant suggestions');
          break;

        case 'engagement_high':
          adaptations.push('Approfondir explorations avec plus de détails');
          adaptations.push('Proposer techniques plus avancées');
          expertAdjustments.depth_level = 'advanced';
          adaptedPrompts.push('Explorer nuances et complexités supplémentaires');
          break;

        case 'confusion':
          adaptations.push('Simplifier explications et utiliser plus d\'exemples');
          adaptations.push('Vérifier compréhension plus fréquemment');
          expertAdjustments.explanation_style = 'simplified';
          adaptedPrompts.push('Répéter concepts clés avec métaphores différentes');
          phaseModifications = { maxInteractions: currentPhase.maxInteractions ? currentPhase.maxInteractions + 2 : undefined };
          break;

        case 'emotional_distress':
          adaptations.push('Prioriser soutien émotionnel et stabilisation');
          adaptations.push('Reporter contenu didactique si nécessaire');
          expertAdjustments.priority_mode = 'emotional_support';
          adaptedPrompts.push('Focus validation et techniques apaisantes immédiates');
          break;

        case 'breakthrough':
          adaptations.push('Célébrer insight et renforcer apprentissage');
          adaptations.push('Aider intégration de la découverte');
          expertAdjustments.reinforcement_level = 'high';
          adaptedPrompts.push('Explorer implications de cette prise de conscience');
          break;
      }

      // Enregistrer adaptations
      await supabase
        .from('conversational_sessions')
        .update({
          style_adaptations: supabase.rpc('append_to_array', {
            array_field: 'style_adaptations',
            new_element: {
              timestamp: new Date().toISOString(),
              trigger: userReaction,
              adaptations: adaptations,
              expert_adjustments: expertAdjustments
            }
          }),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      return {
        style_adaptations: adaptations,
        adapted_prompts: adaptedPrompts,
        expert_personality_adjustments: expertAdjustments,
        phase_modifications: Object.keys(phaseModifications).length > 0 ? phaseModifications : undefined
      };

    } catch (error) {
      console.error('Erreur adaptation style conversationnel:', error);
      throw new Error('Impossible d\'adapter le style conversationnel');
    }
  }

  // ========================================
  // MÉTHODES PRIVÉES - INITIALISATION
  // ========================================

  private initializeConversationalPhases(): void {
    const phases: ConversationalPhase[] = [
      {
        id: 'checkin_conversational',
        name: 'Check-in Conversationnel',
        displayName: 'Accueil',
        duration: 3,
        conversationalGoals: [
          'Établir connexion chaleureuse avec utilisateur',
          'Évaluer état émotionnel et humeur actuelle',
          'Identifier préoccupations et événements récents',
          'Créer environnement sécurisé pour partage'
        ],
        minInteractions: 3,
        maxInteractions: 6,
        transitionTriggers: [
          'État émotionnel évalué',
          'Connexion thérapeutique établie',
          'Préoccupations principales identifiées'
        ],
        expertPrompts: {
          opening: "Accueillir avec chaleur et authenticité selon personnalité expert",
          progression: [
            "Explorer état émotionnel avec questions ouvertes",
            "Approfondir événements significatifs récents",
            "Valider émotions et créer sécurité psychologique"
          ],
          transition: "Résumer accueil et introduire révision devoirs naturellement"
        }
      },
      {
        id: 'homework_dialogue',
        name: 'Dialogue Devoirs',
        displayName: 'Révision',
        duration: 4,
        conversationalGoals: [
          'Discuter exercices pratiqués depuis dernière session',
          'Explorer obstacles et réussites de manière conversationnelle',
          'Ajuster approche selon feedback utilisateur',
          'Célébrer progrès et normaliser difficultés'
        ],
        minInteractions: 4,
        maxInteractions: 8,
        transitionTriggers: [
          'Exercices précédents évalués',
          'Obstacles principaux identifiés',
          'Ajustements déterminés pour suite'
        ],
        expertPrompts: {
          opening: "Transition naturelle vers pratique entre sessions",
          progression: [
            "Demander expériences concrètes avec exercices",
            "Explorer challenges avec empathie et solutions",
            "Reconnaître efforts et normaliser difficultés"
          ],
          transition: "Lier insights devoirs au contenu thérapeutique principal"
        }
      },
      {
        id: 'therapeutic_conversation',
        name: 'Conversation Thérapeutique',
        displayName: 'Exploration',
        duration: 10,
        conversationalGoals: [
          'Enseigner nouvelle technique thérapeutique via dialogue',
          'Explorer concepts avec exemples personnalisés',
          'Faciliter insights et prises de conscience',
          'Adapter contenu selon réactions temps réel'
        ],
        minInteractions: 8,
        maxInteractions: 15,
        transitionTriggers: [
          'Technique principale enseignée',
          'Compréhension utilisateur confirmée',
          'Application personnelle explorée'
        ],
        expertPrompts: {
          opening: "Introduire sujet principal session avec curiosité",
          progression: [
            "Enseigner via dialogue socratique",
            "Utiliser exemples personnalisés utilisateur",
            "Faciliter découvertes via questions guidées"
          ],
          transition: "Préparer application pratique technique enseignée"
        }
      },
      {
        id: 'guided_practice',
        name: 'Pratique Guidée Interactive',
        displayName: 'Pratique',
        duration: 5,
        conversationalGoals: [
          'Guider utilisateur dans exercice pratique concret',
          'Fournir feedback temps réel et encouragements',
          'Ajuster exercice selon capacités momentanées',
          'Renforcer apprentissage par application directe'
        ],
        minInteractions: 5,
        maxInteractions: 10,
        transitionTriggers: [
          'Exercice pratique complété',
          'Utilisateur a expérimenté technique',
          'Feedback intégré et confiance renforcée'
        ],
        expertPrompts: {
          opening: "Inviter à mise en pratique avec bienveillance",
          progression: [
            "Guider étape par étape avec patience",
            "Donner feedback encourageant et constructif",
            "Adapter selon réactions et capacités"
          ],
          transition: "Récapituler expérience pratique pour conclusion"
        }
      },
      {
        id: 'conversational_summary',
        name: 'Résumé Conversationnel',
        displayName: 'Conclusion',
        duration: 3,
        conversationalGoals: [
          'Récapituler apprentissages et insights clés',
          'Assigner devoirs de manière conversationnelle',
          'Préparer session suivante avec anticipation positive',
          'Renforcer progrès et motivation utilisateur'
        ],
        minInteractions: 3,
        maxInteractions: 6,
        transitionTriggers: [
          'Session résumée avec utilisateur',
          'Devoirs assignés et acceptés',
          'Session suivante planifiée'
        ],
        expertPrompts: {
          opening: "Célébrer travail accompli dans session",
          progression: [
            "Co-créer résumé avec utilisateur",
            "Proposer devoirs adaptés naturellement",
            "Créer anticipation positive session suivante"
          ],
          transition: "Clôturer avec encouragement et connexion maintenue"
        }
      }
    ];

    phases.forEach(phase => {
      this.conversationalPhases.set(phase.id, phase);
    });
  }

  private async buildConversationalContext(
    session: TherapySession,
    baseContext: SessionContext
  ): Promise<SessionContext & {
    expert_personality: any;
    conversation_style: any;
    cultural_adaptations: string[];
  }> {
    try {
      // Déterminer expert selon programme thérapeutique
      const expertProfile = await this.selectExpertForSession(session.therapy_program_id);
      
      // Analyser profil utilisateur pour adaptations
      const culturalAdaptations = await this.determineCulturalAdaptations(
        baseContext.user_profile
      );

      // Configurer style conversationnel
      const conversationStyle = {
        formality_level: baseContext.user_profile?.communication_preference || 'moderate',
        pace: 'adaptive',
        depth: 'progressive',
        cultural_sensitivity: culturalAdaptations
      };

      return {
        ...baseContext,
        expert_personality: expertProfile,
        conversation_style: conversationStyle,
        cultural_adaptations: culturalAdaptations
      };

    } catch (error) {
      console.error('Erreur construction contexte conversationnel:', error);
      throw error;
    }
  }

  private async selectExpertForSession(therapyProgramId: string): Promise<any> {
    // Récupérer configuration expert du programme
    const { data: program } = await supabase
      .from('therapy_programs')
      .select('assigned_expert_id, expert_approach')
      .eq('id', therapyProgramId)
      .single();

    if (!program?.assigned_expert_id) {
      // Expert par défaut selon approche
      const defaultExpert = program?.expert_approach?.includes('mindfulness') ? 
        'dr_alex_mindfulness' : 
        program?.expert_approach?.includes('culturel') ?
          'dr_aicha_culturelle' : 
          'dr_sarah_empathie';
      
      return await this.conversationalAI.getExpertProfile(defaultExpert);
    }

    return await this.conversationalAI.getExpertProfile(program.assigned_expert_id);
  }

  private async determineCulturalAdaptations(userProfile: any): Promise<string[]> {
    const adaptations = [];

    if (userProfile?.cultural_background?.includes('arabe') || 
        userProfile?.cultural_background?.includes('marocain')) {
      adaptations.push('Références culturelles arabes appropriées');
      adaptations.push('Respect structure familiale traditionnelle');
      adaptations.push('Intégration valeurs religieuses si approprié');
    }

    if (userProfile?.language_preference === 'ar') {
      adaptations.push('Support expressions arabes');
      adaptations.push('Structure communication RTL');
    }

    return adaptations;
  }

  private async initializeConversationalState(
    sessionId: string,
    initialPhase: ConversationalPhase,
    expertProfile: any
  ): Promise<void> {
    try {
      // Créer enregistrement session conversationnelle
      await supabase
        .from('conversational_sessions')
        .insert([{
          session_id: sessionId,
          current_phase_id: initialPhase.id,
          phase_start_time: new Date().toISOString(),
          expert_profile_id: expertProfile.id,
          phase_objectives_met: false,
          total_user_interactions: 0,
          wellbeing_score: null,
          crisis_level: 'none',
          adaptations_made: [],
          is_active: true,
          session_metadata: {
            user_engagement_level: 5,
            emotional_progression: [],
            techniques_taught: [],
            breakthroughs_achieved: []
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

    } catch (error) {
      console.error('Erreur initialisation état conversationnel:', error);
      throw error;
    }
  }

  private async generatePersonalizedWelcome(
    expertProfile: any,
    context: any,
    session: TherapySession
  ): Promise<string> {
    try {
      return await this.conversationalAI.generateTherapeuticResponse(
        expertProfile.id,
        'session_welcome',
        {
          user_profile: context.user_profile,
          current_session: session,
          program_progress: context.current_progress,
          recent_interactions: [],
          emotional_state: 'welcoming',
          cultural_context: context.cultural_adaptations.join(', '),
          language: 'fr'
        }
      ).then(response => response.content);

    } catch (error) {
      console.error('Erreur génération accueil personnalisé:', error);
      return this.getDefaultWelcomeForExpert(expertProfile.id);
    }
  }

  private getDefaultWelcomeForExpert(expertId: string): string {
    const welcomes = {
      'dr_sarah_empathie': "Bonjour ! Je suis ravie de vous retrouver aujourd'hui. Comment vous sentez-vous ?",
      'dr_alex_mindfulness': "Bienvenue. Prenons un moment pour nous centrer. Comment vous sentez-vous en ce moment présent ?",
      'dr_aicha_culturelle': "Ahlan wa sahlan ! Comment allez-vous aujourd'hui ? J'espère que tout va bien pour vous et votre famille."
    };
    return welcomes[expertId as keyof typeof welcomes] || 
           "Bonjour ! Je suis content de commencer cette session avec vous. Comment vous sentez-vous ?";
  }

  // ========================================
  // MÉTHODES PRIVÉES - GESTION CONVERSATION
  // ========================================

  private async recordConversationMessage(messageData: {
    session_id: string;
    sender: 'user' | 'expert';
    content: string;
    phase_id: string;
    therapeutic_techniques_used?: string[];
    crisis_indicators?: string[];
    message_type?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('conversation_messages')
        .insert([{
          ...messageData,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }]);

      // Mettre à jour compteur interactions
      if (messageData.sender === 'user') {
        await supabase.rpc('increment_user_interactions', {
          session_id: messageData.session_id
        });
      }

    } catch (error) {
      console.error('Erreur enregistrement message conversation:', error);
      throw error;
    }
  }

  private buildTherapeuticContext(context: any): any {
    return {
      user_profile: context.sessionMetadata?.user_profile || {},
      current_session: {
        phase: context.currentPhase,
        interactions: context.conversationHistory.length
      },
      program_progress: context.sessionMetadata?.program_progress || {},
      recent_interactions: context.conversationHistory.slice(-5) || [],
      emotional_state: context.sessionMetadata?.emotional_state || 'unknown',
      cultural_context: context.expertProfile?.cultural_context || 'français',
      language: 'fr' as const
    };
  }

  private async evaluatePhaseProgression(
    phase: ConversationalPhase,
    totalInteractions: number,
    sessionId: string
  ): Promise<{ objectives_met: boolean; completion_percentage: number }> {
    try {
      // Critères objectifs atteints
      const minInteractionsMet = totalInteractions >= phase.minInteractions;
      const timeSpent = await this.calculatePhaseTimeSpent(sessionId, phase.id);
      const minTimeSpent = timeSpent >= (phase.duration * 0.6); // Au moins 60% du temps

      // Évaluation qualitative via analyse conversation
      const qualitativeScore = await this.assessConversationQuality(sessionId, phase);

      const objectivesMet = minInteractionsMet && minTimeSpent && qualitativeScore >= 6;
      const completionPercentage = Math.min(
        (totalInteractions / phase.minInteractions) * 0.4 +
        (timeSpent / phase.duration) * 0.3 +
        (qualitativeScore / 10) * 0.3,
        1
      ) * 100;

      return {
        objectives_met: objectivesMet,
        completion_percentage: completionPercentage
      };

    } catch (error) {
      console.error('Erreur évaluation progression phase:', error);
      return { objectives_met: false, completion_percentage: 0 };
    }
  }

  private async calculatePhaseTimeSpent(sessionId: string, phaseId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('conversational_sessions')
        .select('phase_start_time')
        .eq('session_id', sessionId)
        .eq('current_phase_id', phaseId)
        .single();

      if (!data?.phase_start_time) return 0;

      const phaseStartTime = new Date(data.phase_start_time);
      const currentTime = new Date();
      return (currentTime.getTime() - phaseStartTime.getTime()) / (1000 * 60); // en minutes

    } catch (error) {
      console.error('Erreur calcul temps phase:', error);
      return 0;
    }
  }

  private async assessConversationQuality(sessionId: string, phase: ConversationalPhase): Promise<number> {
    // Simplifiée pour l'instant - peut être enrichie avec analyse IA
    try {
      const { data } = await supabase
        .from('conversation_messages')
        .select('content, sender')
        .eq('session_id', sessionId)
        .eq('phase_id', phase.id);

      if (!data || data.length === 0) return 0;

      const userMessages = data.filter(m => m.sender === 'user');
      const avgLength = userMessages.reduce((acc, m) => acc + m.content.length, 0) / userMessages.length;

      // Score basé sur longueur moyenne réponses (indicateur engagement)
      if (avgLength > 100) return 8;
      if (avgLength > 50) return 6;
      if (avgLength > 20) return 4;
      return 2;

    } catch (error) {
      console.error('Erreur évaluation qualité conversation:', error);
      return 5;
    }
  }

  private calculateEngagementLevel(conversationHistory: ConversationMessage[], latestMessage: string): number {
    // Calcul engagement basé sur longueur messages, fréquence, émotions exprimées
    const recentUserMessages = conversationHistory
      .filter(m => m.sender === 'user')
      .slice(-3)
      .concat([{ content: latestMessage } as ConversationMessage]);

    const avgLength = recentUserMessages.reduce((acc, m) => acc + m.content.length, 0) / recentUserMessages.length;
    const hasEmotionalWords = recentUserMessages.some(m => 
      /sentir|ressentir|émotions|anxieux|heureux|triste|en colère/.test(m.content.toLowerCase())
    );

    let engagementScore = 5; // Base
    if (avgLength > 80) engagementScore += 2;
    if (avgLength > 150) engagementScore += 1;
    if (hasEmotionalWords) engagementScore += 1;
    if (recentUserMessages.length > 2) engagementScore += 1;

    return Math.min(10, Math.max(1, engagementScore));
  }

  private getPhaseById(phaseId: string): ConversationalPhase | null {
    return this.conversationalPhases.get(phaseId) || null;
  }

  private getNextPhase(currentPhase: ConversationalPhase): ConversationalPhase | null {
    const phases = Array.from(this.conversationalPhases.values());
    const currentIndex = phases.findIndex(p => p.id === currentPhase.id);
    return phases[currentIndex + 1] || null;
  }

  private async generatePhaseTransitionMessage(
    currentPhase: ConversationalPhase,
    nextPhase: ConversationalPhase,
    expertProfile: any
  ): Promise<string> {
    const transitions = {
      'checkin_conversational->homework_dialogue': "Parfait ! Maintenant, j'aimerais savoir comment se sont passés vos exercices cette semaine.",
      'homework_dialogue->therapeutic_conversation': "Excellent ! Entrons maintenant dans le cœur de notre session d'aujourd'hui.",
      'therapeutic_conversation->guided_practice': "Maintenant que nous avons bien exploré ces concepts, il est temps de les mettre en pratique ensemble.",
      'guided_practice->conversational_summary': "Magnifique travail ! Récapitulons ce que nous avons découvert ensemble aujourd'hui."
    };

    const transitionKey = `${currentPhase.id}->${nextPhase.id}`;
    return transitions[transitionKey as keyof typeof transitions] || 
           `Passons maintenant à ${nextPhase.displayName.toLowerCase()}.`;
  }

  private async generatePhaseObjectivesSummary(sessionId: string, phase: ConversationalPhase): Promise<string> {
    // Générer résumé objectifs atteints dans la phase
    const objectivesMet = phase.conversationalGoals.slice(0, 2); // Simplification
    return `Dans cette phase, nous avons ${objectivesMet.join(' et ')}.`;
  }

  private async generateNextPhaseIntroduction(
    nextPhase: ConversationalPhase,
    expertProfile: any,
    previousSummary: string
  ): Promise<string> {
    const introductions = {
      'homework_dialogue': "Parlons maintenant de ce que vous avez mis en pratique depuis notre dernière rencontre.",
      'therapeutic_conversation': "Je vais partager avec vous une approche qui peut vraiment vous aider dans votre situation.",
      'guided_practice': "Nous allons maintenant expérimenter ensemble cette technique pour que vous puissiez la maîtriser.",
      'conversational_summary': "Prenons quelques minutes pour célébrer le chemin parcouru aujourd'hui et préparer la suite."
    };

    return introductions[nextPhase.id as keyof typeof introductions] || 
           `Commençons ${nextPhase.displayName.toLowerCase()}.`;
  }

  private async updateSessionMetadata(sessionId: string, updates: any): Promise<void> {
    try {
      await supabase
        .from('conversational_sessions')
        .update({
          session_metadata: supabase.rpc('jsonb_merge', {
            current_data: 'session_metadata',
            new_data: updates
          }),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

    } catch (error) {
      console.error('Erreur mise à jour métadonnées session:', error);
    }
  }
}

export default ConversationalSessionManager;