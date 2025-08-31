/**
 * THEMATIC COHERENCE ENGINE - COHÉRENCE THÉMATIQUE AVEC RECENTRAGE INTELLIGENT
 * Système de maintien du focus thématique strict avec recentrage doux selon spécifications
 * 100% de la conversation liée au thème annoncé - Pas de mélange de sujets
 * Date: 30/08/2025
 */

import { supabase } from '../config/supabase';

// Types pour la cohérence thématique
export interface SessionTheme {
  id: string;
  theme_name: string;
  theme_category: 'technique_relaxation' | 'restructuration_cognitive' | 'gestion_anxiete' | 'estime_soi' | 'mindfulness' | 'adaptation_culturelle';
  core_concepts: string[];
  allowed_subtopics: string[];
  related_techniques: string[];
  prohibited_topics: string[];
  focus_keywords: string[];
}

export interface ThematicAnalysis {
  message_content: string;
  theme_relevance_score: number;
  detected_topics: string[];
  off_topic_elements: string[];
  digression_type: 'minor' | 'moderate' | 'major' | 'critical';
  recentering_required: boolean;
  suggested_recentering_approach: string;
}

export interface DigressionDetection {
  digression_detected: boolean;
  digression_severity: 'low' | 'medium' | 'high' | 'critical';
  off_topic_content: string[];
  digression_triggers: string[];
  user_engagement_with_digression: number;
  recentering_urgency: 'immediate' | 'gentle' | 'postponed';
}

export interface RecenteringStrategy {
  strategy_type: 'gentle_redirect' | 'empathetic_bridge' | 'direct_refocus' | 'acknowledge_postpone';
  recentering_message: string;
  connection_to_theme: string;
  expert_adaptation: string;
  estimated_success_probability: number;
  fallback_options: string[];
}

export interface ThematicSession {
  session_id: string;
  declared_theme: SessionTheme;
  conversation_segments: ConversationSegment[];
  coherence_score: number;
  digression_count: number;
  successful_recenterings: number;
  theme_drift_alerts: string[];
}

export interface ConversationSegment {
  segment_id: string;
  timestamp: string;
  user_message: string;
  theme_alignment: number;
  topics_detected: string[];
  expert_response: string;
  recentering_applied: boolean;
}

/**
 * MOTEUR DE COHÉRENCE THÉMATIQUE AVANCÉ
 * Maintien strict du focus thématique avec recentrage intelligent
 */
export class ThematicCoherenceEngine {
  private sessionThemes: Map<string, SessionTheme> = new Map();
  private activeThematicSessions: Map<string, ThematicSession> = new Map();
  
  constructor() {
    this.initializeSessionThemes();
  }
  
  /**
   * ANALYSE COHÉRENCE THÉMATIQUE D'UN MESSAGE
   * Évalue si message utilisateur reste dans le thème de session
   */
  async analyzeThematicCoherence(
    sessionId: string,
    userMessage: string,
    sessionTheme: string
  ): Promise<ThematicAnalysis> {
    try {
      // 1. Récupérer thème de session
      const themeConfig = this.sessionThemes.get(sessionTheme);
      if (!themeConfig) {
        throw new Error(`Thème de session ${sessionTheme} introuvable`);
      }
      
      // 2. Analyser contenu du message
      const contentAnalysis = this.analyzeMessageContent(userMessage, themeConfig);
      
      // 3. Calculer score de pertinence thématique
      const relevanceScore = this.calculateThemeRelevance(userMessage, themeConfig);
      
      // 4. Détecter éléments hors-sujet
      const offTopicElements = this.detectOffTopicElements(userMessage, themeConfig);
      
      // 5. Classifier type de digression
      const digressionType = this.classifyDigressionType(
        relevanceScore,
        offTopicElements.length,
        contentAnalysis.topic_distribution
      );
      
      // 6. Déterminer nécessité de recentrage
      const recenteringRequired = relevanceScore < 0.7 || offTopicElements.length > 2;
      
      // 7. Suggérer approche de recentrage
      const recenteringApproach = this.suggestRecenteringApproach(
        digressionType,
        offTopicElements,
        userMessage
      );
      
      return {
        message_content: userMessage,
        theme_relevance_score: relevanceScore,
        detected_topics: contentAnalysis.detected_topics,
        off_topic_elements: offTopicElements,
        digression_type: digressionType,
        recentering_required: recenteringRequired,
        suggested_recentering_approach: recenteringApproach
      };
      
    } catch (error) {
      console.error('Erreur analyse cohérence thématique:', error);
      
      // Fallback sécurisé
      return {
        message_content: userMessage,
        theme_relevance_score: 0.5,
        detected_topics: ['analyse_fallback'],
        off_topic_elements: [],
        digression_type: 'minor',
        recentering_required: false,
        suggested_recentering_approach: 'gentle_redirect'
      };
    }
  }
  
  /**
   * DÉTECTION INTELLIGENTE DE DIGRESSION
   * Identification précise des écarts thématiques
   */
  async detectDigression(
    sessionId: string,
    userMessage: string,
    conversationHistory: any[]
  ): Promise<DigressionDetection> {
    try {
      const thematicSession = this.activeThematicSessions.get(sessionId);
      if (!thematicSession) {
        throw new Error(`Session thématique ${sessionId} non trouvée`);
      }
      
      const sessionTheme = thematicSession.declared_theme;
      
      // 1. Analyser contenu pour topics hors-sujet
      const offTopicContent = this.identifyOffTopicContent(userMessage, sessionTheme);
      
      // 2. Détecter déclencheurs de digression
      const digressionTriggers = this.identifyDigressionTriggers(
        userMessage,
        conversationHistory,
        sessionTheme
      );
      
      // 3. Évaluer engagement utilisateur avec digression
      const userEngagement = this.assessUserEngagementWithDigression(
        userMessage,
        offTopicContent
      );
      
      // 4. Calculer sévérité digression
      const severity = this.calculateDigressionSeverity(
        offTopicContent.length,
        digressionTriggers.length,
        userEngagement
      );
      
      // 5. Déterminer urgence recentrage
      const recenteringUrgency = this.determineRecenteringUrgency(severity, userEngagement);
      
      return {
        digression_detected: offTopicContent.length > 0,
        digression_severity: severity,
        off_topic_content: offTopicContent,
        digression_triggers: digressionTriggers,
        user_engagement_with_digression: userEngagement,
        recentering_urgency: recenteringUrgency
      };
      
    } catch (error) {
      console.error('Erreur détection digression:', error);
      
      return {
        digression_detected: false,
        digression_severity: 'low',
        off_topic_content: [],
        digression_triggers: [],
        user_engagement_with_digression: 0.5,
        recentering_urgency: 'gentle'
      };
    }
  }
  
  /**
   * GÉNÉRATION RECENTRAGE INTELLIGENT
   * Création de messages de recentrage doux et personnalisés
   */
  async generateIntelligentRecentering(
    sessionId: string,
    digressionDetection: DigressionDetection,
    expertId: string,
    sessionTheme: string
  ): Promise<RecenteringStrategy> {
    try {
      const themeConfig = this.sessionThemes.get(sessionTheme);
      if (!themeConfig) {
        throw new Error(`Configuration thème ${sessionTheme} introuvable`);
      }
      
      // 1. Déterminer type de stratégie selon sévérité
      const strategyType = this.selectRecenteringStrategyType(
        digressionDetection.digression_severity,
        digressionDetection.user_engagement_with_digression
      );
      
      // 2. Construire message de recentrage personnalisé
      const recenteringMessage = this.constructRecenteringMessage(
        strategyType,
        digressionDetection,
        themeConfig,
        expertId
      );
      
      // 3. Créer connexion naturelle avec thème
      const themeConnection = this.createThemeConnection(
        digressionDetection.off_topic_content,
        themeConfig
      );
      
      // 4. Adapter selon style expert
      const expertAdaptation = this.adaptRecenteringToExpert(
        recenteringMessage,
        expertId,
        strategyType
      );
      
      // 5. Estimer probabilité succès
      const successProbability = this.estimateRecenteringSuccess(
        strategyType,
        digressionDetection,
        expertId
      );
      
      // 6. Générer options de fallback
      const fallbackOptions = this.generateFallbackRecenteringOptions(
        themeConfig,
        expertId
      );
      
      return {
        strategy_type: strategyType,
        recentering_message: expertAdaptation,
        connection_to_theme: themeConnection,
        expert_adaptation: `Adapté pour ${expertId}`,
        estimated_success_probability: successProbability,
        fallback_options: fallbackOptions
      };
      
    } catch (error) {
      console.error('Erreur génération recentrage intelligent:', error);
      
      return this.generateDefaultRecentering(sessionTheme, expertId);
    }
  }
  
  /**
   * VALIDATION MAINTIEN FOCUS THÉMATIQUE
   * S'assure que expert maintient 100% focus sur thème déclaré
   */
  async validateThematicFocus(
    sessionId: string,
    expertResponse: string,
    sessionTheme: string
  ): Promise<{
    focus_maintained: boolean;
    theme_compliance_score: number;
    violations_detected: string[];
    corrected_response: string;
    focus_reinforcements: string[];
  }> {
    try {
      const themeConfig = this.sessionThemes.get(sessionTheme);
      if (!themeConfig) {
        throw new Error(`Configuration thème ${sessionTheme} non trouvée`);
      }
      
      const violations: string[] = [];
      let correctedResponse = expertResponse;
      
      // 1. Vérifier présence concepts clés du thème
      const conceptsPresence = this.checkCoreConceptsPresence(expertResponse, themeConfig);
      if (conceptsPresence.missing_concepts.length > themeConfig.core_concepts.length / 2) {
        violations.push('Concepts clés du thème insuffisamment présents');
      }
      
      // 2. Détecter mentions topics interdits
      const prohibitedMentions = this.detectProhibitedTopicMentions(expertResponse, themeConfig);
      if (prohibitedMentions.length > 0) {
        violations.push(`Topics interdits détectés: ${prohibitedMentions.join(', ')}`);
        correctedResponse = this.removeProhibitedTopics(correctedResponse, prohibitedMentions);
      }
      
      // 3. Vérifier cohérence techniques mentionnées
      const techniqueCoherence = this.validateTechniqueCoherence(expertResponse, themeConfig);
      if (!techniqueCoherence.coherent) {
        violations.push('Techniques mentionnées incohérentes avec thème');
      }
      
      // 4. Calculer score compliance thématique
      const complianceScore = this.calculateThemeComplianceScore(
        conceptsPresence,
        prohibitedMentions.length,
        techniqueCoherence
      );
      
      // 5. Renforcer focus si nécessaire
      const focusReinforcements = this.generateFocusReinforcements(
        themeConfig,
        violations
      );
      
      if (violations.length > 0) {
        correctedResponse = this.reinforceThematicFocus(correctedResponse, themeConfig);
      }
      
      return {
        focus_maintained: violations.length === 0,
        theme_compliance_score: complianceScore,
        violations_detected: violations,
        corrected_response: correctedResponse,
        focus_reinforcements: focusReinforcements
      };
      
    } catch (error) {
      console.error('Erreur validation focus thématique:', error);
      
      return {
        focus_maintained: false,
        theme_compliance_score: 0.5,
        violations_detected: ['Erreur validation - vérification manuelle requise'],
        corrected_response: expertResponse,
        focus_reinforcements: ['Recentrage sur thème principal requis']
      };
    }
  }
  
  /**
   * INITIALISATION DES THÈMES DE SESSION
   * Configuration détaillée des thèmes thérapeutiques
   */
  private initializeSessionThemes(): void {
    // TECHNIQUES DE RELAXATION
    this.sessionThemes.set('techniques_relaxation', {
      id: 'techniques_relaxation',
      theme_name: 'Techniques de Relaxation',
      theme_category: 'technique_relaxation',
      core_concepts: [
        'respiration profonde',
        'détente musculaire',
        'relaxation progressive',
        'visualisation',
        'méditation',
        'ancrage sensoriel',
        'lâcher-prise'
      ],
      allowed_subtopics: [
        'tensions corporelles',
        'stress physique',
        'techniques de respiration',
        'exercices de détente',
        'moments de calme',
        'pratiques relaxantes',
        'bien-être physique'
      ],
      related_techniques: [
        'Respiration 4-7-8',
        'Relaxation de Jacobson',
        'Scan corporel',
        'Visualisation guidée',
        'Méditation de pleine conscience',
        'Techniques d\'ancrage'
      ],
      prohibited_topics: [
        'relations familiales complexes',
        'problèmes financiers',
        'conflits interpersonnels',
        'restructuration cognitive',
        'thérapie comportementale',
        'analyse psychodynamique'
      ],
      focus_keywords: [
        'relaxation',
        'détente',
        'respiration',
        'calme',
        'sérénité',
        'tension',
        'lâcher-prise',
        'apaisement'
      ]
    });
    
    // RESTRUCTURATION COGNITIVE
    this.sessionThemes.set('restructuration_cognitive', {
      id: 'restructuration_cognitive',
      theme_name: 'Restructuration Cognitive',
      theme_category: 'restructuration_cognitive',
      core_concepts: [
        'pensées automatiques',
        'croyances limitantes',
        'distorsions cognitives',
        'restructuration',
        'pensée alternative',
        'questionnement socratique',
        'evidence-based thinking'
      ],
      allowed_subtopics: [
        'patterns de pensée',
        'ruminations mentales',
        'autocritique',
        'pensées négatives',
        'croyances sur soi',
        'interprétations',
        'dialogue intérieur'
      ],
      related_techniques: [
        'Journal des pensées',
        'Questionnement socratique',
        'Technique de la double colonne',
        'Recherche de preuves',
        'Pensée alternative',
        'Recadrage cognitif'
      ],
      prohibited_topics: [
        'techniques de relaxation',
        'exercices physiques',
        'méditation',
        'conflits relationnels',
        'problèmes pratiques',
        'gestion émotionnelle pure'
      ],
      focus_keywords: [
        'pensée',
        'croyance',
        'cognitif',
        'mental',
        'automatique',
        'distorsion',
        'restructuration',
        'questionnement'
      ]
    });
    
    // GESTION DE L'ANXIÉTÉ
    this.sessionThemes.set('gestion_anxiete', {
      id: 'gestion_anxiete',
      theme_name: 'Gestion de l\'Anxiété',
      theme_category: 'gestion_anxiete',
      core_concepts: [
        'anxiété',
        'stress',
        'angoisse',
        'inquiétude',
        'peur',
        'anticipation',
        'gestion émotionnelle',
        'techniques anti-stress'
      ],
      allowed_subtopics: [
        'symptômes anxieux',
        'déclencheurs',
        'situations stressantes',
        'évitement',
        'inquiétudes',
        'sensations physiques',
        'pensées catastrophiques'
      ],
      related_techniques: [
        'Respiration anti-stress',
        'Exposition graduelle',
        'Techniques d\'ancrage',
        'Gestion des pensées catastrophiques',
        'Relaxation express',
        'Mindfulness anti-anxiété'
      ],
      prohibited_topics: [
        'relations amoureuses',
        'problèmes professionnels non-anxiogènes',
        'questions existentielles',
        'méditation profonde',
        'thérapie familiale',
        'estime de soi globale'
      ],
      focus_keywords: [
        'anxiété',
        'stress',
        'angoisse',
        'inquiétude',
        'peur',
        'nervosité',
        'tension',
        'appréhension'
      ]
    });
    
    // ESTIME DE SOI
    this.sessionThemes.set('estime_soi', {
      id: 'estime_soi',
      theme_name: 'Estime de Soi',
      theme_category: 'estime_soi',
      core_concepts: [
        'estime de soi',
        'confiance en soi',
        'valeur personnelle',
        'auto-compassion',
        'acceptation de soi',
        'forces personnelles',
        'réussites',
        'image de soi'
      ],
      allowed_subtopics: [
        'autocritique',
        'comparaisons',
        'perfectionnisme',
        'accomplissements',
        'qualités personnelles',
        'défis surmontés',
        'reconnaissance de soi'
      ],
      related_techniques: [
        'Journal des réussites',
        'Identification des forces',
        'Auto-compassion',
        'Remise en question autocritique',
        'Affirmations positives',
        'Célébration des progrès'
      ],
      prohibited_topics: [
        'techniques de relaxation',
        'gestion du stress',
        'relations interpersonnelles',
        'problèmes familiaux',
        'questions professionnelles',
        'anxiété situationnelle'
      ],
      focus_keywords: [
        'estime',
        'confiance',
        'valeur',
        'worth',
        'mérite',
        'qualité',
        'force',
        'réussite'
      ]
    });
    
    // MINDFULNESS
    this.sessionThemes.set('mindfulness', {
      id: 'mindfulness',
      theme_name: 'Pleine Conscience (Mindfulness)',
      theme_category: 'mindfulness',
      core_concepts: [
        'pleine conscience',
        'présence',
        'attention consciente',
        'observation',
        'acceptation',
        'non-jugement',
        'moment présent',
        'conscience corporelle'
      ],
      allowed_subtopics: [
        'méditation',
        'respiration consciente',
        'sensations corporelles',
        'pensées observées',
        'émotions accueillies',
        'pratique quotidienne',
        'moments de présence'
      ],
      related_techniques: [
        'Méditation assise',
        'Scan corporel mindful',
        'Respiration consciente',
        'Marche méditative',
        'Observation des pensées',
        'Acceptation radicale'
      ],
      prohibited_topics: [
        'restructuration cognitive',
        'analyse comportementale',
        'problèmes relationnels',
        'planification future',
        'résolution de problèmes',
        'changement comportemental'
      ],
      focus_keywords: [
        'présence',
        'conscience',
        'mindfulness',
        'observation',
        'acceptation',
        'instant',
        'présent',
        'attention'
      ]
    });
    
    // ADAPTATION CULTURELLE
    this.sessionThemes.set('adaptation_culturelle', {
      id: 'adaptation_culturelle',
      theme_name: 'Adaptation Culturelle',
      theme_category: 'adaptation_culturelle',
      core_concepts: [
        'identité culturelle',
        'adaptation',
        'intégration',
        'conflits culturels',
        'valeurs traditionnelles',
        'modernité',
        'biculturelle',
        'appartenance'
      ],
      allowed_subtopics: [
        'famille traditionnelle',
        'expectations culturelles',
        'langue maternelle',
        'traditions religieuses',
        'communauté d\'origine',
        'société d\'accueil',
        'générations',
        'transmission culturelle'
      ],
      related_techniques: [
        'Dialogue interculturel',
        'Renforcement identité positive',
        'Résolution conflits culturels',
        'Intégration harmonieuse',
        'Médiation familiale culturelle',
        'Valorisation héritage'
      ],
      prohibited_topics: [
        'techniques de relaxation pure',
        'restructuration cognitive',
        'mindfulness',
        'problèmes non-culturels',
        'thérapie individuelle classique',
        'approches occidentales pures'
      ],
      focus_keywords: [
        'culture',
        'tradition',
        'famille',
        'communauté',
        'identité',
        'adaptation',
        'intégration',
        'appartenance'
      ]
    });
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - ANALYSE THÉMATIQUE
  // ========================================
  
  private analyzeMessageContent(message: string, themeConfig: SessionTheme): any {
    const messageLower = message.toLowerCase();
    const detectedTopics: string[] = [];
    
    // Détecter topics liés au thème
    themeConfig.allowed_subtopics.forEach(topic => {
      if (messageLower.includes(topic.toLowerCase())) {
        detectedTopics.push(topic);
      }
    });
    
    // Détecter concepts clés
    themeConfig.core_concepts.forEach(concept => {
      if (messageLower.includes(concept.toLowerCase())) {
        detectedTopics.push(concept);
      }
    });
    
    return {
      detected_topics: detectedTopics,
      topic_distribution: this.calculateTopicDistribution(detectedTopics, themeConfig),
      message_length: message.length,
      complexity_score: this.calculateMessageComplexity(message)
    };
  }
  
  private calculateThemeRelevance(message: string, themeConfig: SessionTheme): number {
    let relevanceScore = 0;
    const messageLower = message.toLowerCase();
    
    // Score pour mots-clés de focus
    themeConfig.focus_keywords.forEach(keyword => {
      if (messageLower.includes(keyword.toLowerCase())) {
        relevanceScore += 0.1;
      }
    });
    
    // Score pour concepts clés
    themeConfig.core_concepts.forEach(concept => {
      if (messageLower.includes(concept.toLowerCase())) {
        relevanceScore += 0.15;
      }
    });
    
    // Score pour subtopics autorisés
    themeConfig.allowed_subtopics.forEach(subtopic => {
      if (messageLower.includes(subtopic.toLowerCase())) {
        relevanceScore += 0.08;
      }
    });
    
    // Pénalité pour topics interdits
    themeConfig.prohibited_topics.forEach(prohibited => {
      if (messageLower.includes(prohibited.toLowerCase())) {
        relevanceScore -= 0.2;
      }
    });
    
    return Math.max(0, Math.min(1, relevanceScore));
  }
  
  private detectOffTopicElements(message: string, themeConfig: SessionTheme): string[] {
    const messageLower = message.toLowerCase();
    const offTopicElements: string[] = [];
    
    // Détecter éléments explicitement interdits
    themeConfig.prohibited_topics.forEach(prohibited => {
      if (messageLower.includes(prohibited.toLowerCase())) {
        offTopicElements.push(prohibited);
      }
    });
    
    // Détecter éléments génériques hors-sujet
    const genericOffTopicKeywords = [
      'travail', 'job', 'collègues', 'patron',
      'argent', 'finances', 'budget',
      'petit ami', 'copain', 'relation amoureuse',
      'politique', 'élections', 'gouvernement',
      'actualités', 'news', 'journal'
    ];
    
    genericOffTopicKeywords.forEach(keyword => {
      if (messageLower.includes(keyword) && !themeConfig.allowed_subtopics.some(allowed => 
        allowed.toLowerCase().includes(keyword)
      )) {
        offTopicElements.push(keyword);
      }
    });
    
    return offTopicElements;
  }
  
  private classifyDigressionType(
    relevanceScore: number,
    offTopicCount: number,
    topicDistribution: any
  ): 'minor' | 'moderate' | 'major' | 'critical' {
    if (offTopicCount >= 3 || relevanceScore < 0.3) return 'critical';
    if (offTopicCount === 2 || relevanceScore < 0.5) return 'major';
    if (offTopicCount === 1 || relevanceScore < 0.7) return 'moderate';
    return 'minor';
  }
  
  private suggestRecenteringApproach(
    digressionType: string,
    offTopicElements: string[],
    userMessage: string
  ): string {
    if (digressionType === 'critical') return 'direct_refocus';
    if (digressionType === 'major') return 'empathetic_bridge';
    if (digressionType === 'moderate') return 'gentle_redirect';
    return 'acknowledge_postpone';
  }
  
  private identifyOffTopicContent(message: string, themeConfig: SessionTheme): string[] {
    const offTopicContent: string[] = [];
    const messageLower = message.toLowerCase();
    
    themeConfig.prohibited_topics.forEach(prohibited => {
      if (messageLower.includes(prohibited.toLowerCase())) {
        offTopicContent.push(prohibited);
      }
    });
    
    return offTopicContent;
  }
  
  private identifyDigressionTriggers(
    message: string,
    history: any[],
    themeConfig: SessionTheme
  ): string[] {
    const triggers: string[] = [];
    
    // Détecter triggers émotionnels
    if (message.includes('d\'ailleurs') || message.includes('au fait')) {
      triggers.push('transition_naturelle');
    }
    if (message.includes('ça me rappelle') || message.includes('comme')) {
      triggers.push('association_libre');
    }
    if (message.includes('problème') || message.includes('souci')) {
      triggers.push('urgence_personnelle');
    }
    
    return triggers;
  }
  
  private assessUserEngagementWithDigression(message: string, offTopicContent: string[]): number {
    let engagement = 0.5;
    
    // Plus de détails = plus d'engagement avec digression
    if (message.length > 200) engagement += 0.2;
    if (message.includes('?')) engagement += 0.1;
    if (offTopicContent.length > message.split(' ').length * 0.3) engagement += 0.3;
    
    return Math.min(1, engagement);
  }
  
  private calculateDigressionSeverity(
    offTopicCount: number,
    triggerCount: number,
    engagement: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severity = offTopicCount * 0.4 + triggerCount * 0.2 + engagement * 0.4;
    
    if (severity >= 0.8) return 'critical';
    if (severity >= 0.6) return 'high';
    if (severity >= 0.4) return 'medium';
    return 'low';
  }
  
  private determineRecenteringUrgency(
    severity: string,
    engagement: number
  ): 'immediate' | 'gentle' | 'postponed' {
    if (severity === 'critical') return 'immediate';
    if (severity === 'high' || engagement > 0.8) return 'gentle';
    return 'postponed';
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - RECENTRAGE
  // ========================================
  
  private selectRecenteringStrategyType(
    severity: string,
    engagement: number
  ): 'gentle_redirect' | 'empathetic_bridge' | 'direct_refocus' | 'acknowledge_postpone' {
    if (severity === 'critical') return 'direct_refocus';
    if (severity === 'high' && engagement > 0.7) return 'empathetic_bridge';
    if (severity === 'medium') return 'gentle_redirect';
    return 'acknowledge_postpone';
  }
  
  private constructRecenteringMessage(
    strategyType: string,
    digression: DigressionDetection,
    themeConfig: SessionTheme,
    expertId: string
  ): string {
    const themeDisplay = themeConfig.theme_name;
    
    const recenteringTemplates = {
      gentle_redirect: [
        `C'est intéressant ce que vous mentionnez. Pour l'instant, concentrons-nous sur ${themeDisplay}, car cela vous aidera aussi pour ces situations.`,
        `Je comprends que cela vous préoccupe. Gardons cela pour une prochaine exploration. Revenons à notre ${themeDisplay}.`
      ],
      empathetic_bridge: [
        `Je vois que c'est important pour vous et nous en reparlerons. Pour l'instant, continuons avec ${themeDisplay}, car ces outils vous seront utiles dans toutes les situations.`,
        `Votre préoccupation est légitime. Approfondissons d'abord ${themeDisplay}, cela vous donnera des ressources pour aborder d'autres défis.`
      ],
      direct_refocus: [
        `Recentrons-nous sur notre objectif d'aujourd'hui : ${themeDisplay}. C'est là que nous pouvons faire le plus de progrès ensemble.`,
        `Pour cette session, restons sur ${themeDisplay}. C'est notre priorité thérapeutique du moment.`
      ],
      acknowledge_postpone: [
        `Noté pour plus tard. Pour l'instant, poursuivons avec ${themeDisplay}.`,
        `On garde ça en tête. Continuons notre travail sur ${themeDisplay}.`
      ]
    };
    
    const templates = recenteringTemplates[strategyType as keyof typeof recenteringTemplates] || recenteringTemplates.gentle_redirect;
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  private createThemeConnection(offTopicContent: string[], themeConfig: SessionTheme): string {
    if (offTopicContent.length === 0) return 'Maintien naturel du focus thématique';
    
    const connections = [
      `Les techniques de ${themeConfig.theme_name} s'appliquent à de nombreuses situations`,
      `Maîtriser ${themeConfig.theme_name} vous aidera dans tous les aspects de votre vie`,
      `${themeConfig.theme_name} est un fondement solide pour aborder d'autres défis`
    ];
    
    return connections[Math.floor(Math.random() * connections.length)];
  }
  
  private adaptRecenteringToExpert(
    message: string,
    expertId: string,
    strategyType: string
  ): string {
    let adaptedMessage = message;
    
    if (expertId === 'dr_sarah_empathie') {
      adaptedMessage = adaptedMessage.replace(/\brestons\b/g, 'revenons avec bienveillance');
      adaptedMessage = adaptedMessage.replace(/\bconcentrons-nous\b/g, 'concentrons-nous ensemble');
    }
    
    if (expertId === 'dr_alex_mindfulness') {
      adaptedMessage = adaptedMessage.replace(/\brestons\b/g, 'revenons en pleine conscience');
      adaptedMessage = adaptedMessage.replace(/\bconcentrons-nous\b/g, 'centrons notre attention');
    }
    
    if (expertId === 'dr_aicha_culturelle') {
      adaptedMessage = adaptedMessage.replace(/\brestons\b/g, 'revenons ensemble');
      adaptedMessage = adaptedMessage.replace(/\bconcentrons-nous\b/g, 'concentrons-nous avec sagesse');
    }
    
    return adaptedMessage;
  }
  
  private estimateRecenteringSuccess(
    strategyType: string,
    digression: DigressionDetection,
    expertId: string
  ): number {
    let baseSuccess = 0.7;
    
    // Ajustement selon stratégie
    const strategySuccess = {
      gentle_redirect: 0.8,
      empathetic_bridge: 0.9,
      direct_refocus: 0.6,
      acknowledge_postpone: 0.75
    };
    
    baseSuccess *= strategySuccess[strategyType as keyof typeof strategySuccess] || 0.7;
    
    // Ajustement selon sévérité
    if (digression.digression_severity === 'low') baseSuccess += 0.1;
    if (digression.digression_severity === 'critical') baseSuccess -= 0.2;
    
    // Ajustement selon expert
    if (expertId === 'dr_sarah_empathie') baseSuccess += 0.1; // Plus empathique
    
    return Math.max(0.3, Math.min(0.95, baseSuccess));
  }
  
  private generateFallbackRecenteringOptions(themeConfig: SessionTheme, expertId: string): string[] {
    return [
      `Explorons plus profondément ${themeConfig.theme_name}`,
      `Pratiquons ensemble une technique de ${themeConfig.theme_name}`,
      `Revenons à notre objectif principal : ${themeConfig.theme_name}`
    ];
  }
  
  // ========================================
  // MÉTHODES PRIVÉES - VALIDATION FOCUS
  // ========================================
  
  private checkCoreConceptsPresence(response: string, themeConfig: SessionTheme): any {
    const responseLower = response.toLowerCase();
    const presentConcepts: string[] = [];
    const missingConcepts: string[] = [];
    
    themeConfig.core_concepts.forEach(concept => {
      if (responseLower.includes(concept.toLowerCase())) {
        presentConcepts.push(concept);
      } else {
        missingConcepts.push(concept);
      }
    });
    
    return { present_concepts: presentConcepts, missing_concepts: missingConcepts };
  }
  
  private detectProhibitedTopicMentions(response: string, themeConfig: SessionTheme): string[] {
    const responseLower = response.toLowerCase();
    const violations: string[] = [];
    
    themeConfig.prohibited_topics.forEach(prohibited => {
      if (responseLower.includes(prohibited.toLowerCase())) {
        violations.push(prohibited);
      }
    });
    
    return violations;
  }
  
  private validateTechniqueCoherence(response: string, themeConfig: SessionTheme): any {
    const responseLower = response.toLowerCase();
    let coherentTechniques = 0;
    
    themeConfig.related_techniques.forEach(technique => {
      if (responseLower.includes(technique.toLowerCase())) {
        coherentTechniques++;
      }
    });
    
    return {
      coherent: coherentTechniques > 0 || !response.includes('technique'),
      coherent_techniques_count: coherentTechniques
    };
  }
  
  private calculateThemeComplianceScore(
    conceptsPresence: any,
    prohibitedCount: number,
    techniqueCoherence: any
  ): number {
    let score = 0.5; // Base
    
    // Bonus concepts présents
    score += (conceptsPresence.present_concepts.length / (conceptsPresence.present_concepts.length + conceptsPresence.missing_concepts.length)) * 0.3;
    
    // Pénalité topics interdits
    score -= prohibitedCount * 0.2;
    
    // Bonus techniques cohérentes
    if (techniqueCoherence.coherent) score += 0.2;
    
    return Math.max(0, Math.min(1, score));
  }
  
  private generateFocusReinforcements(themeConfig: SessionTheme, violations: string[]): string[] {
    const reinforcements = [
      `Maintenir focus strict sur ${themeConfig.theme_name}`,
      `Utiliser uniquement techniques relatives au thème`,
      `Éviter mentions de topics interdits`
    ];
    
    if (violations.length > 2) {
      reinforcements.push('Recentrage immédiat requis');
    }
    
    return reinforcements;
  }
  
  private removeProhibitedTopics(response: string, prohibitedMentions: string[]): string {
    let cleanedResponse = response;
    
    prohibitedMentions.forEach(prohibited => {
      const regex = new RegExp(`\\b${prohibited.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      cleanedResponse = cleanedResponse.replace(regex, '[sujet reporté]');
    });
    
    return cleanedResponse;
  }
  
  private reinforceThematicFocus(response: string, themeConfig: SessionTheme): string {
    const focusReinforcement = `Dans notre session ${themeConfig.theme_name}, `;
    
    if (!response.toLowerCase().includes(themeConfig.theme_name.toLowerCase())) {
      return focusReinforcement + response;
    }
    
    return response;
  }
  
  private generateDefaultRecentering(sessionTheme: string, expertId: string): RecenteringStrategy {
    return {
      strategy_type: 'gentle_redirect',
      recentering_message: `Revenons ensemble à notre sujet principal de cette session.`,
      connection_to_theme: 'Maintien du focus thérapeutique',
      expert_adaptation: `Style adapté pour ${expertId}`,
      estimated_success_probability: 0.7,
      fallback_options: ['Approfondissons notre thème', 'Pratiquons ensemble']
    };
  }
  
  // Méthodes utilitaires supplémentaires
  private calculateTopicDistribution(detectedTopics: string[], themeConfig: SessionTheme): any {
    return {
      theme_related_ratio: detectedTopics.length / Math.max(1, themeConfig.core_concepts.length),
      topic_diversity: new Set(detectedTopics).size
    };
  }
  
  private calculateMessageComplexity(message: string): number {
    const sentences = message.split(/[.!?]/).filter(s => s.trim().length > 0);
    const words = message.split(/\s+/).length;
    return sentences.length + (words / 20);
  }
}

export default ThematicCoherenceEngine;