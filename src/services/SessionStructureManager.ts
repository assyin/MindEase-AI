/**
 * SESSION STRUCTURE MANAGER - DIFFÉRENCIATION PREMIÈRE SESSION VS SESSIONS SUIVANTES
 * Gestion spécialisée des flows de session selon le type (première ou standard)
 * Implémentation des spécifications du document de refonte
 * Date: 30/08/2025
 */

import { supabase } from '../config/supabase';
import type { TherapySession, SessionContext } from './SessionManager';

// Types spécialisés pour la structure de session
export interface SessionStructureConfig {
  session_type: 'first_session' | 'standard_session';
  total_duration_minutes: number;
  phases: SessionPhase[];
  adaptation_rules: AdaptationRule[];
}

export interface SessionPhase {
  phase_name: string;
  duration_minutes: number;
  objectives: string[];
  required_completion_criteria: string[];
  transition_triggers: string[];
  adaptation_options: string[];
}

export interface AdaptationRule {
  trigger_condition: string;
  adaptation_type: 'extend_phase' | 'skip_phase' | 'modify_content' | 'emergency_redirect';
  max_adjustment_minutes: number;
  fallback_action: string;
}

export interface SessionTypeResult {
  session_type: 'first_session' | 'standard_session';
  structure_config: SessionStructureConfig;
  personalization_notes: string[];
}

/**
 * GESTIONNAIRE DE STRUCTURE DES SESSIONS THÉRAPEUTIQUES
 * Différencie automatiquement première session vs sessions suivantes
 * selon les spécifications du document de refonte
 */
export class SessionStructureManager {
  
  /**
   * DÉTECTION AUTOMATIQUE DU TYPE DE SESSION
   * Première session vs session standard selon historique utilisateur
   */
  async determineSessionType(
    programId: string,
    userId: string,
    sessionNumber: number
  ): Promise<SessionTypeResult> {
    try {
      // 1. Vérifier si c'est la première session du programme
      const isFirstSession = sessionNumber === 1;
      
      // 2. Vérifier historique utilisateur (au cas où)
      const { data: previousSessions } = await supabase
        .from('therapy_sessions')
        .select('id, session_number, status')
        .eq('therapy_program_id', programId)
        .eq('status', 'completed')
        .order('session_number', { ascending: true });
      
      const hasCompletedSessions = previousSessions && previousSessions.length > 0;
      
      // 3. Déterminer type définitif
      const sessionType: 'first_session' | 'standard_session' = 
        (!hasCompletedSessions && isFirstSession) ? 'first_session' : 'standard_session';
      
      // 4. Construire configuration appropriée
      const structureConfig = sessionType === 'first_session' 
        ? this.buildFirstSessionStructure()
        : this.buildStandardSessionStructure();
      
      // 5. Notes de personnalisation
      const personalizationNotes = [
        `Session de type: ${sessionType}`,
        `Numéro de session: ${sessionNumber}`,
        `Sessions précédentes completées: ${previousSessions?.length || 0}`,
        sessionType === 'first_session' ? 'Structure d\'accueil complète activée' : 'Structure standard de suivi'
      ];
      
      return {
        session_type: sessionType,
        structure_config: structureConfig,
        personalization_notes: personalizationNotes
      };
      
    } catch (error) {
      console.error('Erreur détection type session:', error);
      
      // Fallback sécurisé vers session standard
      return {
        session_type: 'standard_session',
        structure_config: this.buildStandardSessionStructure(),
        personalization_notes: ['Fallback vers structure standard par sécurité']
      };
    }
  }
  
  /**
   * CONSTRUCTION DE LA STRUCTURE PREMIÈRE SESSION
   * 🟢 STRUCTURE INITIALE (25 minutes)
   * Accueil & Présentation → Prise de contexte → Présentation du programme → Évaluation baseline → Conclusion initiale
   */
  private buildFirstSessionStructure(): SessionStructureConfig {
    return {
      session_type: 'first_session',
      total_duration_minutes: 25,
      phases: [
        {
          phase_name: 'accueil_presentation',
          duration_minutes: 5,
          objectives: [
            'Créer lien thérapeutique initial',
            'Présenter l\'expert et son approche',
            'Rassurer et mettre en confiance',
            'Établir cadre bienveillant'
          ],
          required_completion_criteria: [
            'Expert s\'est présenté avec sa spécialité',
            'Utilisateur se sent accueilli',
            'Ton empathique établi'
          ],
          transition_triggers: [
            'Utilisateur répond positivement à l\'accueil',
            'Questions initiales de politesse terminées',
            'Climat de confiance perceptible'
          ],
          adaptation_options: [
            'Prolonger si utilisateur très anxieux',
            'Accélérer si utilisateur très à l\'aise',
            'Adapter style selon réaction émotionnelle'
          ]
        },
        {
          phase_name: 'prise_contexte',
          duration_minutes: 8,
          objectives: [
            'Comprendre situation actuelle utilisateur',
            'Identifier défis principaux',
            'Évaluer niveau motivation',
            'Recueillir attentes thérapeutiques'
          ],
          required_completion_criteria: [
            'Situation personnelle explorée',
            'Défis principaux identifiés',
            'Attentes clarifiées',
            'Niveau de souffrance évalué'
          ],
          transition_triggers: [
            'Tableau complet de la situation obtenu',
            'Utilisateur a partagé ses préoccupations principales',
            'Niveau d\'urgence évalué'
          ],
          adaptation_options: [
            'Approfondir si situation complexe',
            'Raccourcir si situation claire',
            'Recentrer si utilisateur disperse'
          ]
        },
        {
          phase_name: 'presentation_programme',
          duration_minutes: 7,
          objectives: [
            'Expliquer structure programme thérapeutique',
            'Présenter approche et techniques utilisées',
            'Définir objectifs réalisables',
            'Établir engagement mutuel'
          ],
          required_completion_criteria: [
            'Programme expliqué clairement',
            'Techniques principales présentées',
            'Objectifs convenus',
            'Engagement utilisateur confirmé'
          ],
          transition_triggers: [
            'Utilisateur comprend le processus',
            'Questions sur programme répondues',
            'Motivation confirmée'
          ],
          adaptation_options: [
            'Simplifier si utilisateur confus',
            'Détailler si utilisateur très intéressé',
            'Rassurer si utilisateur inquiet'
          ]
        },
        {
          phase_name: 'evaluation_baseline',
          duration_minutes: 3,
          objectives: [
            'Établir ligne de base émotionnelle',
            'Évaluer niveau fonctionnement actuel',
            'Identifier ressources disponibles',
            'Documenter point de départ'
          ],
          required_completion_criteria: [
            'Scores baseline enregistrés',
            'État émotionnel documenté',
            'Ressources identifiées',
            'Capacités évaluées'
          ],
          transition_triggers: [
            'Évaluations essentielles complétées',
            'Baseline claire établie',
            'Données suffisantes collectées'
          ],
          adaptation_options: [
            'Raccourcir si utilisateur fatigué',
            'Approfondir si incohérences détectées',
            'Reporter si détresse importante'
          ]
        },
        {
          phase_name: 'conclusion_initiale',
          duration_minutes: 2,
          objectives: [
            'Synthétiser session inaugural',
            'Rassurer sur processus thérapeutique',
            'Donner aperçu session suivante',
            'Maintenir motivation et espoir'
          ],
          required_completion_criteria: [
            'Session résumée positivement',
            'Prochaine étape annoncée',
            'Utilisateur rassuré et motivé',
            'Contact maintenu'
          ],
          transition_triggers: [
            'Synthèse acceptée par utilisateur',
            'Questions finales répondues',
            'Engagement pour suite confirmé'
          ],
          adaptation_options: [
            'Prolonger si utilisateur a besoin rassurance',
            'Raccourcir si session très positive',
            'Ajuster ton selon état émotionnel final'
          ]
        }
      ],
      adaptation_rules: [
        {
          trigger_condition: 'detresse_emotionnelle_elevee',
          adaptation_type: 'modify_content',
          max_adjustment_minutes: 5,
          fallback_action: 'Prioriser soutien et stabilisation'
        },
        {
          trigger_condition: 'resistance_participation',
          adaptation_type: 'extend_phase',
          max_adjustment_minutes: 3,
          fallback_action: 'Prolonger phase accueil pour créer confiance'
        },
        {
          trigger_condition: 'engagement_exceptionnel',
          adaptation_type: 'modify_content',
          max_adjustment_minutes: 0,
          fallback_action: 'Enrichir contenu sans dépasser durée'
        }
      ]
    };
  }
  
  /**
   * CONSTRUCTION DE LA STRUCTURE SESSION STANDARD
   * 🔄 STRUCTURE STANDARD (25 minutes)
   * Révision → Exploration → Pratique → Conclusion
   */
  private buildStandardSessionStructure(): SessionStructureConfig {
    return {
      session_type: 'standard_session',
      total_duration_minutes: 25,
      phases: [
        {
          phase_name: 'revision',
          duration_minutes: 5,
          objectives: [
            'Évaluer état depuis dernière session',
            'Réviser devoirs et exercices pratiqués',
            'Identifier progrès et défis',
            'Adapter plan selon évolution'
          ],
          required_completion_criteria: [
            'État actuel évalué',
            'Devoirs révisés',
            'Progrès identifiés',
            'Défis actuels clarifiés'
          ],
          transition_triggers: [
            'Bilan complet de la période obtenu',
            'Évolution documentée',
            'Priorités actuelles identifiées'
          ],
          adaptation_options: [
            'Prolonger si régression importante',
            'Raccourcir si progrès excellents',
            'Recentrer si utilisateur évite sujets'
          ]
        },
        {
          phase_name: 'exploration',
          duration_minutes: 10,
          objectives: [
            'Approfondir défis actuels',
            'Explorer patterns et déclencheurs',
            'Développer insights personnels',
            'Renforcer compréhension de soi'
          ],
          required_completion_criteria: [
            'Situation actuelle explorée en profondeur',
            'Patterns identifiés',
            'Insights personnels développés',
            'Compréhension renforcée'
          ],
          transition_triggers: [
            'Compréhension approfondie atteinte',
            'Connections établies',
            'Utilisateur prêt pour action'
          ],
          adaptation_options: [
            'Prolonger si breakthrough important',
            'Moduler selon résistance',
            'Adapter profondeur selon capacité'
          ]
        },
        {
          phase_name: 'pratique',
          duration_minutes: 7,
          objectives: [
            'Appliquer techniques thérapeutiques',
            'Pratiquer nouvelles stratégies',
            'Renforcer compétences acquises',
            'Générer confiance en capacités'
          ],
          required_completion_criteria: [
            'Technique pratiquée activement',
            'Compétence démontrée',
            'Confiance renforcée',
            'Application future planifiée'
          ],
          transition_triggers: [
            'Technique maîtrisée suffisamment',
            'Confiance utilisateur visible',
            'Application réussie démontrée'
          ],
          adaptation_options: [
            'Simplifier si technique difficile',
            'Approfondir si maîtrise rapide',
            'Adapter selon style d\'apprentissage'
          ]
        },
        {
          phase_name: 'conclusion',
          duration_minutes: 3,
          objectives: [
            'Synthétiser acquis de session',
            'Planifier applications concrètes',
            'Assigner devoirs personnalisés',
            'Maintenir motivation pour suite'
          ],
          required_completion_criteria: [
            'Acquis synthétisés clairement',
            'Plan d\'action défini',
            'Devoirs assignés',
            'Motivation maintenue'
          ],
          transition_triggers: [
            'Synthèse acceptée',
            'Plan d\'action validé',
            'Engagement pour devoirs pris'
          ],
          adaptation_options: [
            'Prolonger si plan d\'action complexe',
            'Raccourcir si tout est clair',
            'Ajuster devoirs selon capacité'
          ]
        }
      ],
      adaptation_rules: [
        {
          trigger_condition: 'regression_significative',
          adaptation_type: 'modify_content',
          max_adjustment_minutes: 5,
          fallback_action: 'Prioriser soutien et réconfort'
        },
        {
          trigger_condition: 'progres_exceptionnels',
          adaptation_type: 'modify_content',
          max_adjustment_minutes: 0,
          fallback_action: 'Renforcer acquis et anticiper défis futurs'
        },
        {
          trigger_condition: 'crise_situationnelle',
          adaptation_type: 'emergency_redirect',
          max_adjustment_minutes: 10,
          fallback_action: 'Basculer vers gestion de crise'
        }
      ]
    };
  }
  
  /**
   * VALIDATION COMPLETION D'UNE PHASE
   * Vérification automatique des critères avant transition
   */
  async validatePhaseCompletion(
    sessionId: string,
    currentPhase: SessionPhase,
    userInteractionData: {
      engagement_level: number;
      comprehension_signals: string[];
      emotional_state: string;
      objectives_met: string[];
    }
  ): Promise<{
    phase_completed: boolean;
    completion_score: number;
    missing_objectives: string[];
    recommended_action: 'continue_phase' | 'extend_phase' | 'transition_next' | 'adapt_content';
    adaptation_reason?: string;
  }> {
    try {
      // 1. Calculer score de completion
      const completionScore = this.calculatePhaseCompletionScore(currentPhase, userInteractionData);
      
      // 2. Identifier objectifs manquants
      const missingObjectives = currentPhase.objectives.filter(
        obj => !userInteractionData.objectives_met.includes(obj)
      );
      
      // 3. Analyser état utilisateur
      const needsExtension = this.analyzeExtensionNeeds(userInteractionData, currentPhase);
      const readyForTransition = completionScore >= 0.7 && missingObjectives.length <= 1;
      
      // 4. Déterminer action recommandée
      let recommendedAction: 'continue_phase' | 'extend_phase' | 'transition_next' | 'adapt_content' = 'continue_phase';
      let adaptationReason: string | undefined;
      
      if (userInteractionData.emotional_state === 'detresse' && completionScore < 0.5) {
        recommendedAction = 'adapt_content';
        adaptationReason = 'Détresse émotionnelle nécessite adaptation contenu';
      } else if (readyForTransition) {
        recommendedAction = 'transition_next';
      } else if (needsExtension && missingObjectives.length > 1) {
        recommendedAction = 'extend_phase';
        adaptationReason = 'Objectifs importants non atteints, extension nécessaire';
      } else if (completionScore < 0.4) {
        recommendedAction = 'adapt_content';
        adaptationReason = 'Score completion trop faible, adaptation requise';
      }
      
      return {
        phase_completed: readyForTransition,
        completion_score: completionScore,
        missing_objectives: missingObjectives,
        recommended_action: recommendedAction,
        adaptation_reason: adaptationReason
      };
      
    } catch (error) {
      console.error('Erreur validation completion phase:', error);
      
      // Fallback sécurisé
      return {
        phase_completed: false,
        completion_score: 0.5,
        missing_objectives: currentPhase.objectives,
        recommended_action: 'continue_phase',
        adaptation_reason: 'Erreur validation - poursuite sécurisée'
      };
    }
  }
  
  /**
   * ADAPTATION DYNAMIQUE DE SESSION
   * Modification temps réel selon réaction utilisateur
   */
  async adaptSessionStructure(
    sessionId: string,
    currentStructure: SessionStructureConfig,
    adaptationTrigger: string,
    userContext: any
  ): Promise<{
    adapted_structure: SessionStructureConfig;
    adaptation_applied: string;
    estimated_impact: string;
  }> {
    try {
      let adaptedStructure = { ...currentStructure };
      let adaptationApplied = '';
      
      // Trouver règle d'adaptation appropriée
      const applicableRule = currentStructure.adaptation_rules.find(
        rule => rule.trigger_condition === adaptationTrigger
      );
      
      if (applicableRule) {
        switch (applicableRule.adaptation_type) {
          case 'extend_phase':
            adaptedStructure = this.extendCurrentPhase(adaptedStructure, applicableRule.max_adjustment_minutes);
            adaptationApplied = `Phase étendue de ${applicableRule.max_adjustment_minutes} minutes`;
            break;
            
          case 'modify_content':
            adaptedStructure = this.modifyPhaseContent(adaptedStructure, adaptationTrigger);
            adaptationApplied = `Contenu adapté selon ${adaptationTrigger}`;
            break;
            
          case 'emergency_redirect':
            adaptedStructure = this.redirectToEmergencyStructure();
            adaptationApplied = 'Redirection vers structure d\'urgence';
            break;
            
          default:
            adaptationApplied = 'Adaptation par défaut appliquée';
        }
      }
      
      const estimatedImpact = this.estimateAdaptationImpact(currentStructure, adaptedStructure);
      
      return {
        adapted_structure: adaptedStructure,
        adaptation_applied: adaptationApplied,
        estimated_impact: estimatedImpact
      };
      
    } catch (error) {
      console.error('Erreur adaptation structure session:', error);
      
      return {
        adapted_structure: currentStructure,
        adaptation_applied: 'Aucune adaptation (erreur)',
        estimated_impact: 'Impact neutre - structure préservée'
      };
    }
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // ========================================
  
  private calculatePhaseCompletionScore(
    phase: SessionPhase,
    userInteractionData: any
  ): number {
    let score = 0;
    
    // Score basé sur objectifs atteints
    const objectivesMetRatio = userInteractionData.objectives_met.length / phase.objectives.length;
    score += objectivesMetRatio * 0.4;
    
    // Score basé sur engagement utilisateur
    score += (userInteractionData.engagement_level / 10) * 0.3;
    
    // Score basé sur signaux de compréhension
    const comprehensionScore = userInteractionData.comprehension_signals.length > 0 ? 0.3 : 0;
    score += comprehensionScore;
    
    return Math.min(1, score);
  }
  
  private analyzeExtensionNeeds(userInteractionData: any, phase: SessionPhase): boolean {
    // Analyser si phase nécessite extension
    return (
      userInteractionData.engagement_level < 6 ||
      userInteractionData.objectives_met.length < phase.objectives.length * 0.6 ||
      userInteractionData.emotional_state === 'confusion'
    );
  }
  
  private extendCurrentPhase(
    structure: SessionStructureConfig,
    extensionMinutes: number
  ): SessionStructureConfig {
    // Étendre phase actuelle sans dépasser limite totale
    const extendedStructure = { ...structure };
    extendedStructure.total_duration_minutes = Math.min(
      30, // Limite absolue 30 minutes
      structure.total_duration_minutes + extensionMinutes
    );
    
    return extendedStructure;
  }
  
  private modifyPhaseContent(
    structure: SessionStructureConfig,
    trigger: string
  ): SessionStructureConfig {
    // Adapter contenu selon déclencheur
    const modifiedStructure = { ...structure };
    
    if (trigger === 'detresse_emotionnelle_elevee') {
      // Prioriser soutien et techniques de régulation immédiate
      modifiedStructure.phases = modifiedStructure.phases.map(phase => ({
        ...phase,
        objectives: phase.objectives.map(obj => 
          obj.includes('explorer') ? obj.replace('explorer', 'soutenir') : obj
        )
      }));
    }
    
    return modifiedStructure;
  }
  
  private redirectToEmergencyStructure(): SessionStructureConfig {
    // Structure d'urgence pour gestion de crise
    return {
      session_type: 'standard_session',
      total_duration_minutes: 30,
      phases: [
        {
          phase_name: 'gestion_crise',
          duration_minutes: 30,
          objectives: [
            'Sécuriser la personne',
            'Évaluer niveau de risque',
            'Fournir ressources d\'urgence',
            'Maintenir contact thérapeutique'
          ],
          required_completion_criteria: [
            'Risque évalué',
            'Sécurité assurée',
            'Ressources fournies',
            'Support maintenu'
          ],
          transition_triggers: ['Stabilisation obtenue'],
          adaptation_options: ['Prolonger si nécessaire']
        }
      ],
      adaptation_rules: []
    };
  }
  
  private estimateAdaptationImpact(
    original: SessionStructureConfig,
    adapted: SessionStructureConfig
  ): string {
    const durationDiff = adapted.total_duration_minutes - original.total_duration_minutes;
    
    if (durationDiff > 0) {
      return `Durée augmentée de ${durationDiff} minutes pour meilleur accompagnement`;
    } else if (adapted.phases.length !== original.phases.length) {
      return 'Structure modifiée pour répondre aux besoins spécifiques';
    } else {
      return 'Contenu adapté sans impact sur durée';
    }
  }
}

export default SessionStructureManager;