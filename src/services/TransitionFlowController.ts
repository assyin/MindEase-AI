/**
 * TRANSITION FLOW CONTROLLER - FLUIDITÉ CONVERSATIONNELLE SANS RÉPÉTITION "BONJOUR"
 * Contrôleur intelligent pour transitions naturelles entre phases de session
 * Élimination totale des "Bonjour" répétitifs selon spécifications de refonte
 * Date: 30/08/2025
 */

import { supabase } from '../config/supabase';
import type { SessionPhase } from './SessionStructureManager';

// Types pour le contrôle des transitions
export interface TransitionContext {
  current_phase: SessionPhase;
  next_phase: SessionPhase | null;
  user_engagement_level: number;
  conversation_flow_state: string;
  objectives_met: string[];
  emotional_state: string;
  expert_id: string;
}

export interface TransitionBridge {
  transition_text: string;
  transition_type: 'natural_flow' | 'guided_redirect' | 'checkpoint_summary' | 'empathetic_bridge';
  estimated_duration_seconds: number;
  requires_user_confirmation: boolean;
  fallback_options: string[];
}

export interface GreetingTracker {
  session_id: string;
  greeting_used: boolean;
  greeting_timestamp: string;
  phase_transitions_count: number;
  prohibited_phrases: string[];
}

export interface ConversationalBridge {
  from_phase: string;
  to_phase: string;
  bridge_templates: string[];
  expert_style_variants: Record<string, string[]>;
  contextual_adapters: string[];
}

/**
 * CONTRÔLEUR DE FLUX CONVERSATIONNEL FLUIDE
 * Gère transitions naturelles sans répétition de salutations
 */
export class TransitionFlowController {
  private greetingTrackers: Map<string, GreetingTracker> = new Map();
  private conversationalBridges: ConversationalBridge[] = [];
  
  constructor() {
    this.initializeConversationalBridges();
  }
  
  /**
   * GESTION UNIQUE DU "BONJOUR" PAR SESSION
   * UN SEUL "Bonjour" au début, JAMAIS dans les phases suivantes
   */
  async registerSessionGreeting(sessionId: string): Promise<void> {
    try {
      const tracker: GreetingTracker = {
        session_id: sessionId,
        greeting_used: true,
        greeting_timestamp: new Date().toISOString(),
        phase_transitions_count: 0,
        prohibited_phrases: [
          'bonjour',
          'hello',
          'salut',
          'bonsoir',
          'buenos dias',
          'good morning',
          'مرحبا',
          'أهلا وسهلا'
        ]
      };
      
      this.greetingTrackers.set(sessionId, tracker);
      
      // Enregistrer en base pour persistance
      await supabase
        .from('session_transition_tracking')
        .upsert({
          session_id: sessionId,
          greeting_used: true,
          greeting_timestamp: tracker.greeting_timestamp,
          phase_transitions_count: 0,
          created_at: new Date().toISOString()
        });
      
      console.log(`✅ Salutation unique enregistrée pour session ${sessionId}`);
      
    } catch (error) {
      console.error('Erreur enregistrement salutation unique:', error);
    }
  }
  
  /**
   * GÉNÉRATION TRANSITION CONVERSATIONNELLE FLUIDE
   * Passages naturels sans répétition "Bonjour"
   */
  async generateFluidTransition(
    sessionId: string,
    transitionContext: TransitionContext
  ): Promise<TransitionBridge> {
    try {
      // 1. Vérifier statut salutation
      const greetingTracker = await this.getGreetingTracker(sessionId);
      
      // 2. Sélectionner template transition approprié
      const bridgeTemplate = this.selectTransitionBridge(
        transitionContext.current_phase.phase_name,
        transitionContext.next_phase?.phase_name || 'conclusion'
      );
      
      // 3. Adapter selon style expert
      const expertVariant = this.adaptTransitionToExpert(
        bridgeTemplate,
        transitionContext.expert_id
      );
      
      // 4. Personnaliser selon contexte émotionnel
      const contextualizedTransition = this.personalizeTransition(
        expertVariant,
        transitionContext
      );
      
      // 5. Valider absence de salutations interdites
      const validatedTransition = this.validateNoGreetings(
        contextualizedTransition,
        greetingTracker
      );
      
      // 6. Déterminer type de transition
      const transitionType = this.determineTransitionType(transitionContext);
      
      // 7. Mettre à jour compteur transitions
      await this.updateTransitionCount(sessionId);
      
      return {
        transition_text: validatedTransition,
        transition_type: transitionType,
        estimated_duration_seconds: this.estimateTransitionDuration(validatedTransition),
        requires_user_confirmation: this.requiresConfirmation(transitionType),
        fallback_options: this.generateFallbackOptions(transitionContext)
      };
      
    } catch (error) {
      console.error('Erreur génération transition fluide:', error);
      
      // Fallback sécurisé
      return this.generateSafeTransition(transitionContext);
    }
  }
  
  /**
   * DÉTECTION AUTOMATIQUE MOMENT DE TRANSITION
   * Analyse sémantique pour identifier quand objectifs phase atteints
   */
  async detectTransitionTrigger(
    sessionId: string,
    currentPhase: SessionPhase,
    userResponse: string,
    interactionHistory: any[]
  ): Promise<{
    transition_ready: boolean;
    confidence_score: number;
    trigger_reasons: string[];
    estimated_phase_completion: number;
  }> {
    try {
      let confidenceScore = 0;
      const triggerReasons: string[] = [];
      
      // 1. Analyser accomplissement des objectifs
      const objectiveAnalysis = this.analyzeObjectiveCompletion(
        currentPhase.objectives,
        userResponse,
        interactionHistory
      );
      
      confidenceScore += objectiveAnalysis.completion_score * 0.4;
      if (objectiveAnalysis.objectives_met > 0) {
        triggerReasons.push(`${objectiveAnalysis.objectives_met} objectifs atteints`);
      }
      
      // 2. Détecter signaux de compréhension utilisateur
      const comprehensionSignals = this.detectComprehensionSignals(userResponse);
      confidenceScore += comprehensionSignals.score * 0.3;
      if (comprehensionSignals.signals.length > 0) {
        triggerReasons.push(`Signaux de compréhension: ${comprehensionSignals.signals.join(', ')}`);
      }
      
      // 3. Évaluer engagement et saturation
      const engagementAnalysis = this.analyzeEngagementLevel(userResponse, interactionHistory);
      confidenceScore += engagementAnalysis.readiness_score * 0.3;
      if (engagementAnalysis.ready_for_next) {
        triggerReasons.push('Utilisateur prêt pour étape suivante');
      }
      
      // 4. Vérifier critères de completion requis
      const requiredCriteria = this.checkRequiredCriteria(currentPhase, interactionHistory);
      if (requiredCriteria.all_met) {
        confidenceScore += 0.2;
        triggerReasons.push('Tous les critères requis satisfaits');
      }
      
      const transitionReady = confidenceScore >= 0.7;
      const phaseCompletion = Math.min(100, Math.round(confidenceScore * 100));
      
      return {
        transition_ready: transitionReady,
        confidence_score: confidenceScore,
        trigger_reasons: triggerReasons,
        estimated_phase_completion: phaseCompletion
      };
      
    } catch (error) {
      console.error('Erreur détection déclencheur transition:', error);
      
      // Fallback conservateur
      return {
        transition_ready: false,
        confidence_score: 0.5,
        trigger_reasons: ['Analyse par défaut'],
        estimated_phase_completion: 50
      };
    }
  }
  
  /**
   * VALIDATION ANTI-RÉPÉTITION
   * Empêche totalement l'usage de "Bonjour" après salutation initiale
   */
  private validateNoGreetings(transitionText: string, tracker: GreetingTracker): string {
    let validatedText = transitionText;
    
    // Supprimer toute salutation interdite
    tracker.prohibited_phrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      validatedText = validatedText.replace(regex, '');
    });
    
    // Nettoyer espaces multiples et ponctuation orpheline
    validatedText = validatedText.replace(/\s{2,}/g, ' ').trim();
    validatedText = validatedText.replace(/^[,\.\!]\s*/, '');
    
    // Si le texte devient vide, utiliser transition par défaut
    if (!validatedText || validatedText.length < 10) {
      validatedText = this.getDefaultTransition();
    }
    
    return validatedText;
  }
  
  /**
   * INITIALISATION DES BRIDGES CONVERSATIONNELS
   * Templates de transition entre chaque phase
   */
  private initializeConversationalBridges(): void {
    this.conversationalBridges = [
      // PREMIÈRE SESSION
      {
        from_phase: 'accueil_presentation',
        to_phase: 'prise_contexte',
        bridge_templates: [
          'Maintenant, j\'aimerais mieux comprendre votre situation.',
          'Parlons de ce qui vous amène aujourd\'hui.',
          'Pouvez-vous me parler de votre situation actuelle ?'
        ],
        expert_style_variants: {
          'dr_sarah_empathie': [
            'Maintenant, j\'aimerais vous écouter avec attention.',
            'Racontez-moi ce qui vous préoccupe en ce moment.'
          ],
          'dr_alex_mindfulness': [
            'Centrons-nous sur votre expérience présente.',
            'Observons ensemble ce qui se passe pour vous maintenant.'
          ],
          'dr_aicha_culturelle': [
            'Parlons de votre situation avec confiance.',
            'Racontez-moi ce qui vous tracasse, je suis là pour vous écouter.'
          ]
        },
        contextual_adapters: ['emotional_state', 'user_confidence']
      },
      {
        from_phase: 'prise_contexte',
        to_phase: 'presentation_programme',
        bridge_templates: [
          'Merci pour ce partage. Laissez-moi vous expliquer comment nous allons travailler ensemble.',
          'Je comprends mieux maintenant. Voici comment notre programme peut vous aider.',
          'Parfait. Permettez-moi de vous présenter notre approche thérapeutique.'
        ],
        expert_style_variants: {
          'dr_sarah_empathie': [
            'Je vous remercie pour cette confiance. Voyons comment je peux vous accompagner.',
            'Votre partage m\'aide à comprendre vos besoins. Explorons notre programme ensemble.'
          ],
          'dr_alex_mindfulness': [
            'Merci pour cette présence authentique. Découvrons le chemin que nous allons parcourir.',
            'Votre ouverture est précieuse. Contemplons ensemble notre approche.'
          ],
          'dr_aicha_culturelle': [
            'شكرا لك Merci pour cette confiance. Voyons comment nous allons avancer ensemble.',
            'Je comprends vos préoccupations. Laissez-moi vous expliquer notre méthode.'
          ]
        },
        contextual_adapters: ['complexity_level', 'user_understanding']
      },
      
      // SESSIONS STANDARD
      {
        from_phase: 'revision',
        to_phase: 'exploration',
        bridge_templates: [
          'Maintenant, approfondissons ce que vous venez de partager.',
          'Explorons plus en détail cette situation.',
          'C\'est intéressant ce que vous mentionnez. Creusons ensemble.'
        ],
        expert_style_variants: {
          'dr_sarah_empathie': [
            'C\'est très intéressant ce que vous partagez. Explorons cela avec bienveillance.',
            'Je sens que c\'est important pour vous. Approfondissons ensemble.'
          ],
          'dr_alex_mindfulness': [
            'Observons maintenant ce qui se passe plus profondément.',
            'Restons présents à cette expérience et explorons-la.'
          ],
          'dr_aicha_culturelle': [
            'C\'est important ce que vous dites. Regardons cela de plus près.',
            'Je comprends. Explorons cette situation avec sagesse.'
          ]
        },
        contextual_adapters: ['emotional_intensity', 'topic_complexity']
      },
      {
        from_phase: 'exploration',
        to_phase: 'pratique',
        bridge_templates: [
          'Parfait ! Maintenant, essayons cette technique ensemble.',
          'Mettons en pratique ce que nous venons de découvrir.',
          'Excellente prise de conscience ! Passons à l\'action.'
        ],
        expert_style_variants: {
          'dr_sarah_empathie': [
            'Parfait ! Essayons maintenant cette technique qui va vous aider.',
            'Magnifique insight ! Pratiquons ensemble cette nouvelle stratégie.'
          ],
          'dr_alex_mindfulness': [
            'Belle prise de conscience. Expérimentons maintenant cette pratique.',
            'Restons dans cette présence et essayons cet exercice ensemble.'
          ],
          'dr_aicha_culturelle': [
            'Très bien ! Mettons maintenant ces idées en pratique.',
            'الحمد لله Excellente compréhension ! Pratiquons ensemble.'
          ]
        },
        contextual_adapters: ['readiness_level', 'technique_complexity']
      },
      {
        from_phase: 'pratique',
        to_phase: 'conclusion',
        bridge_templates: [
          'Excellent travail ! Récapitulons ce que vous avez appris aujourd\'hui.',
          'Bravo pour cet effort ! Faisons le point sur vos acquis.',
          'Parfait ! Synthétisons vos apprentissages d\'aujourd\'hui.'
        ],
        expert_style_variants: {
          'dr_sarah_empathie': [
            'Je suis fière de vous ! Récapitulons vos magnifiques progrès.',
            'Excellent engagement ! Célébrons ensemble vos acquis d\'aujourd\'hui.'
          ],
          'dr_alex_mindfulness': [
            'Belle présence dans cette pratique. Contemplons ce que vous avez découvert.',
            'Magnifique engagement. Savourons ensemble ces apprentissages.'
          ],
          'dr_aicha_culturelle': [
            'ماشاء الله Excellent travail ! Récapitulons vos belles réussites.',
            'Parfait ! Faisons le bilan de cette session enrichissante.'
          ]
        },
        contextual_adapters: ['success_level', 'confidence_gained']
      }
    ];
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // ========================================
  
  private async getGreetingTracker(sessionId: string): Promise<GreetingTracker> {
    // Vérifier en mémoire
    let tracker = this.greetingTrackers.get(sessionId);
    
    if (!tracker) {
      // Récupérer depuis base de données
      const { data } = await supabase
        .from('session_transition_tracking')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (data) {
        tracker = {
          session_id: sessionId,
          greeting_used: data.greeting_used,
          greeting_timestamp: data.greeting_timestamp,
          phase_transitions_count: data.phase_transitions_count,
          prohibited_phrases: [
            'bonjour', 'hello', 'salut', 'bonsoir',
            'buenos dias', 'good morning', 'مرحبا', 'أهلا وسهلا'
          ]
        };
        this.greetingTrackers.set(sessionId, tracker);
      } else {
        // Nouveau tracker par défaut
        tracker = {
          session_id: sessionId,
          greeting_used: false,
          greeting_timestamp: '',
          phase_transitions_count: 0,
          prohibited_phrases: [
            'bonjour', 'hello', 'salut', 'bonsoir',
            'buenos dias', 'good morning', 'مرحبا', 'أهلا وسهلا'
          ]
        };
      }
    }
    
    return tracker;
  }
  
  private selectTransitionBridge(fromPhase: string, toPhase: string): ConversationalBridge {
    const bridge = this.conversationalBridges.find(
      b => b.from_phase === fromPhase && b.to_phase === toPhase
    );
    
    return bridge || {
      from_phase: fromPhase,
      to_phase: toPhase,
      bridge_templates: ['Continuons ensemble.', 'Passons à l\'étape suivante.'],
      expert_style_variants: {},
      contextual_adapters: []
    };
  }
  
  private adaptTransitionToExpert(bridge: ConversationalBridge, expertId: string): string {
    const expertVariants = bridge.expert_style_variants[expertId];
    
    if (expertVariants && expertVariants.length > 0) {
      // Sélection aléatoire pour variation
      return expertVariants[Math.floor(Math.random() * expertVariants.length)];
    }
    
    // Fallback vers template générique
    return bridge.bridge_templates[Math.floor(Math.random() * bridge.bridge_templates.length)];
  }
  
  private personalizeTransition(baseTransition: string, context: TransitionContext): string {
    let personalizedTransition = baseTransition;
    
    // Adaptation selon état émotionnel
    if (context.emotional_state === 'anxious') {
      personalizedTransition = personalizedTransition.replace(/!$/g, '.');
      personalizedTransition = 'Prenons notre temps. ' + personalizedTransition;
    } else if (context.emotional_state === 'confident') {
      personalizedTransition = personalizedTransition.replace(/\.$/g, ' !');
    }
    
    // Adaptation selon niveau d'engagement
    if (context.user_engagement_level < 5) {
      personalizedTransition = 'Je sens que c\'est peut-être difficile. ' + personalizedTransition;
    } else if (context.user_engagement_level > 8) {
      personalizedTransition = 'Je vois votre excellent engagement ! ' + personalizedTransition;
    }
    
    return personalizedTransition;
  }
  
  private determineTransitionType(context: TransitionContext): 'natural_flow' | 'guided_redirect' | 'checkpoint_summary' | 'empathetic_bridge' {
    if (context.emotional_state === 'distressed') {
      return 'empathetic_bridge';
    } else if (context.objectives_met.length < context.current_phase.objectives.length / 2) {
      return 'guided_redirect';
    } else if (context.current_phase.phase_name.includes('conclusion')) {
      return 'checkpoint_summary';
    } else {
      return 'natural_flow';
    }
  }
  
  private analyzeObjectiveCompletion(objectives: string[], userResponse: string, history: any[]): any {
    // Analyse simplifiée de completion des objectifs
    let objectivesMet = 0;
    const completionScore = Math.min(1, history.length * 0.2 + (userResponse.length > 100 ? 0.3 : 0.1));
    
    if (userResponse.includes('comprends') || userResponse.includes('sens')) objectivesMet++;
    if (userResponse.includes('mieux') || userResponse.includes('aide')) objectivesMet++;
    
    return { completion_score: completionScore, objectives_met: objectivesMet };
  }
  
  private detectComprehensionSignals(userResponse: string): any {
    const signals = [];
    let score = 0;
    
    if (userResponse.includes('je vois') || userResponse.includes('je comprends')) {
      signals.push('compréhension verbalisée');
      score += 0.3;
    }
    if (userResponse.includes('ça m\'aide') || userResponse.includes('utile')) {
      signals.push('utilité reconnue');
      score += 0.4;
    }
    if (userResponse.includes('?')) {
      signals.push('questions d\'approfondissement');
      score += 0.2;
    }
    
    return { signals, score: Math.min(1, score) };
  }
  
  private analyzeEngagementLevel(userResponse: string, history: any[]): any {
    const engagementScore = Math.min(1, (userResponse.length / 200) + (history.length * 0.1));
    const readyForNext = engagementScore > 0.6 && userResponse.length > 50;
    
    return { readiness_score: engagementScore, ready_for_next: readyForNext };
  }
  
  private checkRequiredCriteria(phase: SessionPhase, history: any[]): any {
    // Vérification simplifiée des critères requis
    const criteriaCount = phase.required_completion_criteria.length;
    const historyDepth = history.length;
    const allMet = historyDepth >= criteriaCount;
    
    return { all_met: allMet, met_count: Math.min(criteriaCount, historyDepth) };
  }
  
  private estimateTransitionDuration(transitionText: string): number {
    const wordCount = transitionText.split(/\s+/).length;
    return Math.ceil((wordCount / 180) * 60) + 2; // +2 secondes pause
  }
  
  private requiresConfirmation(transitionType: string): boolean {
    return transitionType === 'guided_redirect' || transitionType === 'empathetic_bridge';
  }
  
  private generateFallbackOptions(context: TransitionContext): string[] {
    return [
      'Prenons le temps qu\'il faut pour cette étape.',
      'Nous pouvons aussi revenir sur ce point si vous le souhaitez.',
      'Dites-moi si vous préférez approfondir encore.'
    ];
  }
  
  private generateSafeTransition(context: TransitionContext): TransitionBridge {
    return {
      transition_text: 'Continuons ensemble à votre rythme.',
      transition_type: 'natural_flow',
      estimated_duration_seconds: 5,
      requires_user_confirmation: false,
      fallback_options: ['Prenons notre temps.', 'Avançons step par step.']
    };
  }
  
  private getDefaultTransition(): string {
    return 'Parfait ! Continuons ensemble.';
  }
  
  private async updateTransitionCount(sessionId: string): Promise<void> {
    const tracker = this.greetingTrackers.get(sessionId);
    if (tracker) {
      tracker.phase_transitions_count++;
      
      await supabase
        .from('session_transition_tracking')
        .update({
          phase_transitions_count: tracker.phase_transitions_count,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    }
  }
}

export default TransitionFlowController;