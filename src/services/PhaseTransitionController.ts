/**
 * PHASE TRANSITION CONTROLLER - SYSTÈME ANTI-BOUCLE INFINIE
 * Contrôleur de transitions automatiques pour éviter les blocages conversationnels
 * RÈGLES STRICTES: Max 4-5 questions par phase + transition forcée
 */

interface PhaseTransitionRule {
  phaseId: string;
  maxQuestions: number;
  maxDuration: number; // minutes
  minInteractions: number;
  forceTransitionAfter: number; // questions avant transition forcée
}

interface TransitionMetrics {
  questionCount: number;
  userResponseCount: number;
  startTime: Date;
  expertConsecutiveQuestions: number;
  lastUserResponse: Date | null;
}

export class PhaseTransitionController {
  private transitionRules: Map<string, PhaseTransitionRule> = new Map();
  private sessionMetrics: Map<string, TransitionMetrics> = new Map();

  constructor() {
    this.initializeTransitionRules();
  }

  private initializeTransitionRules(): void {
    // 🎯 CORRECTION : RÈGLES SYNCHRONISÉES avec CONVERSATIONAL_PHASES
    const rules: PhaseTransitionRule[] = [
      {
        phaseId: 'checkin_conversational', // ✅ Accueil
        maxQuestions: 4, // MAX 4 questions pour check-in
        maxDuration: 4, // 4 minutes max
        minInteractions: 2, // Minimum 2 échanges
        forceTransitionAfter: 5 // Force après 5 questions
      },
      {
        phaseId: 'homework_dialogue', // 🎯 CORRIGÉ: Révision
        maxQuestions: 3,
        maxDuration: 4,
        minInteractions: 2,
        forceTransitionAfter: 4
      },
      {
        phaseId: 'therapeutic_conversation', // 🎯 CORRIGÉ: Exploration
        maxQuestions: 6, // Plus de flexibilité pour contenu principal
        maxDuration: 10,
        minInteractions: 4,
        forceTransitionAfter: 8
      },
      {
        phaseId: 'guided_practice', // 🎯 CORRIGÉ: Pratique
        maxQuestions: 4,
        maxDuration: 5,
        minInteractions: 3,
        forceTransitionAfter: 5
      },
      {
        phaseId: 'conversational_summary', // 🎯 CORRIGÉ: Conclusion
        maxQuestions: 2, // Très court pour résumé
        maxDuration: 3,
        minInteractions: 1,
        forceTransitionAfter: 3
      }
    ];

    rules.forEach(rule => {
      this.transitionRules.set(rule.phaseId, rule);
    });
  }

  /**
   * ANALYSE CRITIQUE: Détermine si transition nécessaire
   * Retourne OBLIGATOIREMENT true si limites dépassées
   */
  shouldTransitionNow(
    sessionId: string, 
    phaseId: string, 
    conversation: any[]
  ): {
    shouldTransition: boolean;
    reason: string;
    isForced: boolean;
    metrics: TransitionMetrics;
  } {
    const rule = this.transitionRules.get(phaseId);
    if (!rule) {
      return {
        shouldTransition: true,
        reason: 'Phase non reconnue - transition immédiate',
        isForced: true,
        metrics: this.getEmptyMetrics()
      };
    }

    const metrics = this.calculateMetrics(sessionId, phaseId, conversation);
    this.sessionMetrics.set(sessionId, metrics);

    // ❗ RÈGLE 1: FORCE TRANSITION SI TROP DE QUESTIONS
    if (metrics.questionCount >= rule.forceTransitionAfter) {
      return {
        shouldTransition: true,
        reason: `LIMITE QUESTIONS DÉPASSÉE: ${metrics.questionCount}/${rule.forceTransitionAfter}`,
        isForced: true,
        metrics
      };
    }

    // ❗ RÈGLE 2: FORCE TRANSITION SI QUESTIONS CONSÉCUTIVES
    if (metrics.expertConsecutiveQuestions >= 3) {
      return {
        shouldTransition: true,
        reason: `TROP DE QUESTIONS CONSÉCUTIVES: ${metrics.expertConsecutiveQuestions}`,
        isForced: true,
        metrics
      };
    }

    // ❗ RÈGLE 3: FORCE TRANSITION SI DURÉE DÉPASSÉE
    const elapsedMinutes = (Date.now() - metrics.startTime.getTime()) / (1000 * 60);
    if (elapsedMinutes > rule.maxDuration) {
      return {
        shouldTransition: true,
        reason: `DURÉE DÉPASSÉE: ${elapsedMinutes.toFixed(1)}/${rule.maxDuration}min`,
        isForced: true,
        metrics
      };
    }

    // ✅ RÈGLE 4: TRANSITION NATURELLE SI CONDITIONS REMPLIES
    const hasMinInteractions = metrics.userResponseCount >= rule.minInteractions;
    const hasRecentResponse = metrics.lastUserResponse && 
                              (Date.now() - metrics.lastUserResponse.getTime()) < 60000; // 1min

    // 🎯 CORRIGÉ : Transition naturelle basée sur interactions utilisateur, pas questions expert
    if (hasMinInteractions && hasRecentResponse) {
      return {
        shouldTransition: true,
        reason: `TRANSITION NATURELLE: ${metrics.userResponseCount}/${rule.minInteractions} réponses complétées`,
        isForced: false,
        metrics
      };
    }

    return {
      shouldTransition: false,
      reason: `En cours: ${metrics.questionCount}/${rule.maxQuestions} questions, ${metrics.userResponseCount}/${rule.minInteractions} réponses`,
      isForced: false,
      metrics
    };
  }

  /**
   * GÉNÈRE MESSAGE DE TRANSITION SELON LE TYPE
   */
  generateTransitionMessage(phaseId: string, nextPhaseId: string, isForced: boolean): string {
    if (isForced) {
      return this.getForcedTransitionMessage(phaseId, nextPhaseId);
    } else {
      return this.getNaturalTransitionMessage(phaseId, nextPhaseId);
    }
  }

  private getForcedTransitionMessage(fromPhase: string, toPhase: string): string {
    // 🎯 CORRIGÉ : Messages avec les bons IDs de phases
    const messages = {
      'checkin_conversational': "Parfait, j'ai bien saisi votre état actuel. Passons maintenant à la révision de vos exercices.",
      'homework_dialogue': "Très bien pour les exercices. Abordons maintenant le contenu principal d'aujourd'hui.",
      'therapeutic_conversation': "Excellente progression ! Mettons maintenant cela en pratique ensemble.",
      'guided_practice': "Parfait ! Récapitulons les points essentiels de notre session.",
      'conversational_summary': "Merci pour cette excellente session. À très bientôt !"
    };

    return messages[fromPhase as keyof typeof messages] || 
           `Très bien, passons à l'étape suivante de notre session.`;
  }

  private getNaturalTransitionMessage(fromPhase: string, toPhase: string): string {
    // 🎯 CORRIGÉ : Messages naturels avec bons IDs de phases
    const messages = {
      'checkin_conversational': "Je vois que vous êtes prêt(e). Passons maintenant à la révision de vos pratiques récentes.",
      'homework_dialogue': "Vos efforts sont remarquables. Découvrons aujourd'hui de nouvelles approches ensemble.",
      'therapeutic_conversation': "Vous maîtrisez bien ces concepts. Pratiquons maintenant concrètement ces techniques.",
      'guided_practice': "Excellente mise en pratique ! Retenons l'essentiel de cette belle session.",
      'conversational_summary': "Cette session a été très productive. Prenez soin de vous !"
    };

    return messages[fromPhase as keyof typeof messages] || 
           "Continuons notre cheminement ensemble.";
  }

  private calculateMetrics(sessionId: string, phaseId: string, conversation: any[]): TransitionMetrics {
    const existing = this.sessionMetrics.get(sessionId);
    
    // Compter les questions de l'expert dans cette phase
    const expertMessages = conversation.filter(msg => msg.sender === 'expert');
    const userMessages = conversation.filter(msg => msg.sender === 'user');
    
    // Compter questions (messages se terminant par ?)
    const questionCount = expertMessages.filter(msg => 
      msg.content.includes('?') || 
      msg.content.match(/\b(comment|pourquoi|quand|où|que)\b/i)
    ).length;

    // Détection questions consécutives
    let consecutiveQuestions = 0;
    let maxConsecutive = 0;
    for (let i = conversation.length - 1; i >= 0; i--) {
      const msg = conversation[i];
      if (msg.sender === 'expert' && (msg.content.includes('?') || 
          msg.content.match(/\b(comment|pourquoi|quand|où|que)\b/i))) {
        consecutiveQuestions++;
      } else if (msg.sender === 'user') {
        break; // Arrêter au premier message utilisateur
      }
    }

    const lastUserMsg = userMessages[userMessages.length - 1];

    return {
      questionCount,
      userResponseCount: userMessages.length,
      startTime: existing?.startTime || new Date(),
      expertConsecutiveQuestions: consecutiveQuestions,
      lastUserResponse: lastUserMsg ? new Date(lastUserMsg.timestamp || Date.now()) : null
    };
  }

  private getEmptyMetrics(): TransitionMetrics {
    return {
      questionCount: 0,
      userResponseCount: 0,
      startTime: new Date(),
      expertConsecutiveQuestions: 0,
      lastUserResponse: null
    };
  }

  /**
   * RESET METRICS POUR NOUVELLE PHASE
   */
  resetPhaseMetrics(sessionId: string): void {
    this.sessionMetrics.delete(sessionId);
  }

  /**
   * OBTIENT LES MÉTRIQUES ACTUELLES
   */
  getMetrics(sessionId: string): TransitionMetrics | null {
    return this.sessionMetrics.get(sessionId) || null;
  }
}